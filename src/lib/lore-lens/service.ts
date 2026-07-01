import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  LORE_MODEL,
  MAX_ACTIVE_GENERATED_CARDS,
  MAX_RUN_COST_MICROS,
  MONTHLY_BUDGET_MICROS,
  type LoreFocus,
} from "./config";
import { fetchCurrentNoteHash, scanLoreNotes } from "./drive";
import { calculateCostMicros, generateQuestions } from "./generator";
import {
  questionFingerprint,
  selectPrimaryNotes,
  selectRelatedNotes,
} from "./parser";
import type { ScannedNote } from "./types";

const GENERATION_LOCK_ID = "primary";
const GENERATION_LEASE_MS = 15 * 60 * 1000;

export function utcMonthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getMonthlyUsageMicros() {
  const aggregate = await db.loreBatch.aggregate({
    where: { createdAt: { gte: utcMonthStart() } },
    _sum: { costMicros: true },
  });
  return aggregate._sum.costMicros ?? 0;
}

async function archiveQuestionsForSources(sourceIds: string[]) {
  if (sourceIds.length === 0) return;
  const questions = await db.loreQuestion.findMany({
    where: { sourceNoteId: { in: sourceIds }, status: { in: ["approved", "draft"] } },
    select: { id: true, cardId: true },
  });
  await db.$transaction(async (tx) => {
    const cardIds = questions.flatMap((question) => (question.cardId ? [question.cardId] : []));
    if (cardIds.length > 0) {
      await tx.card.updateMany({ where: { id: { in: cardIds } }, data: { active: false } });
    }
    await tx.loreQuestion.updateMany({
      where: { id: { in: questions.map((question) => question.id) } },
      data: { status: "stale" },
    });
  });
}

async function syncSourceMetadata(notes: ScannedNote[]) {
  const seenAt = new Date();
  const existing = await db.loreSourceNote.findMany({
    select: { id: true, contentHash: true, active: true },
  });
  const byId = new Map(existing.map((note) => [note.id, note] as const));
  const changedIds = notes
    .filter((note) => {
      const prior = byId.get(note.id);
      return !!prior && prior.contentHash !== note.contentHash;
    })
    .map((note) => note.id);
  const seenIds = new Set(notes.map((note) => note.id));
  const missingIds = existing.filter((note) => note.active && !seenIds.has(note.id)).map((note) => note.id);

  // Large vaults can exceed Prisma's five-second transaction timeout when every
  // note is upserted in one transaction. These writes are individually
  // idempotent, so process bounded chunks without holding a long transaction.
  for (let index = 0; index < notes.length; index += 20) {
    await Promise.all(
      notes.slice(index, index + 20).map((note) =>
        db.loreSourceNote.upsert({
          where: { id: note.id },
          create: {
            id: note.id,
            name: note.name,
            path: note.path,
            focus: note.focus,
            modifiedTime: note.modifiedTime,
            contentHash: note.contentHash,
            links: note.links,
            lastSeenAt: seenAt,
          },
          update: {
            name: note.name,
            path: note.path,
            focus: note.focus,
            modifiedTime: note.modifiedTime,
            contentHash: note.contentHash,
            links: note.links,
            active: true,
            lastSeenAt: seenAt,
          },
        }),
      ),
    );
  }
  await db.loreSourceNote.updateMany({
    where: { id: { in: missingIds } },
    data: { active: false },
  });
  await archiveQuestionsForSources([...changedIds, ...missingIds]);
}

async function acquireGenerationLock() {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + GENERATION_LEASE_MS);

  try {
    await db.loreGenerationLock.create({
      data: { id: GENERATION_LOCK_ID, token, expiresAt },
    });
    return token;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
  }

  const acquired = await db.loreGenerationLock.updateMany({
    where: { id: GENERATION_LOCK_ID, expiresAt: { lt: new Date() } },
    data: { token, expiresAt },
  });
  if (acquired.count !== 1) {
    throw new Error("A Lore Lens generation is already in progress");
  }
  return token;
}

async function releaseGenerationLock(token: string) {
  try {
    await db.loreGenerationLock.deleteMany({
      where: { id: GENERATION_LOCK_ID, token },
    });
  } catch (error) {
    console.error("Failed to release Lore Lens generation lock", error);
  }
}

export async function generateLoreBatch(focus: LoreFocus) {
  const lockToken = await acquireGenerationLock();
  try {
    const usedMicros = await getMonthlyUsageMicros();
    if (usedMicros + MAX_RUN_COST_MICROS > MONTHLY_BUDGET_MICROS) {
      throw new Error("The $2 monthly Lore Lens budget has been reached");
    }

    const scan = await scanLoreNotes();
    await syncSourceMetadata(scan.notes);
    const primaryNotes = selectPrimaryNotes(scan.notes, focus);
    if (primaryNotes.length === 0 || primaryNotes.every((note) => note.gapScore === 0)) {
      throw new Error("No eligible lore gaps were found for this focus");
    }
    const relatedNotes = selectRelatedNotes(scan.notes, primaryNotes);
    const previous = await db.loreQuestion.findMany({ select: { prompt: true, fingerprint: true } });
    const draftAnswers = await db.answer.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { body: true, card: { select: { prompt: true } } },
    });
    const generated = await generateQuestions({
      focus,
      primaryNotes,
      relatedNotes,
      priorPrompts: previous.map((question) => question.prompt),
      priorFingerprints: new Set(previous.map((question) => question.fingerprint)),
      draftAnswers: draftAnswers.map((answer) => ({ prompt: answer.card.prompt, body: answer.body })),
    });
    const costMicros = calculateCostMicros(generated.inputTokens, generated.outputTokens);
    const contextIds = [...new Set([...primaryNotes, ...relatedNotes].map((note) => note.id))];
    const sourceById = new Map(primaryNotes.map((note) => [note.id, note] as const));

    return await db.loreBatch.create({
      data: {
        focus,
        model: LORE_MODEL,
        inputTokens: generated.inputTokens,
        outputTokens: generated.outputTokens,
        costMicros,
        warnings: scan.warnings,
        questions: {
          create: generated.questions.map((question) => {
            const source = sourceById.get(question.sourceFileId);
            if (!source) throw new Error("Generated question lost its source note");
            return {
              sourceNoteId: source.id,
              prompt: question.prompt.trim(),
              rationale: question.rationale.trim(),
              gapType: question.gapType.trim(),
              category: question.category,
              fingerprint: questionFingerprint(question.prompt),
              contextSourceIds: contextIds,
              sourceHash: source.contentHash,
            };
          }),
        },
      },
    });
  } finally {
    await releaseGenerationLock(lockToken);
  }
}

export async function approveLoreQuestions(batchId: string, questionIds: string[]) {
  const batch = await db.loreBatch.findUnique({
    where: { id: batchId },
    include: { questions: { include: { sourceNote: true } } },
  });
  if (!batch || batch.status !== "draft") throw new Error("Draft batch not found");
  const selected = batch.questions.filter(
    (question) => question.status === "draft" && questionIds.includes(question.id),
  );
  if (selected.length === 0) throw new Error("Select at least one question to approve");

  for (const question of selected) {
    const currentHash = await fetchCurrentNoteHash(question.sourceNoteId);
    if (currentHash !== question.sourceHash) {
      await db.loreQuestion.update({ where: { id: question.id }, data: { status: "stale" } });
      throw new Error(`${question.sourceNote.name} changed; generate a fresh batch`);
    }
  }

  const activeCount = await db.card.count({
    where: { source: "generated", active: true, answers: { none: {} } },
  });
  if (activeCount + selected.length > MAX_ACTIVE_GENERATED_CARDS) {
    throw new Error(`Approval would exceed the ${MAX_ACTIVE_GENERATED_CARDS}-card Lore Lens limit`);
  }

  await db.$transaction(async (tx) => {
    for (const question of selected) {
      const card = await tx.card.create({
        data: {
          category: question.category,
          prompt: question.prompt,
          source: "generated",
        },
      });
      await tx.loreQuestion.update({
        where: { id: question.id },
        data: { status: "approved", cardId: card.id },
      });
    }
    await tx.loreQuestion.updateMany({
      where: { batchId, id: { notIn: selected.map((question) => question.id) } },
      data: { status: "rejected" },
    });
    await tx.loreBatch.update({
      where: { id: batchId },
      data: { status: "approved", reviewedAt: new Date() },
    });
  });
}

export async function discardLoreBatch(batchId: string) {
  await db.$transaction([
    db.loreQuestion.updateMany({ where: { batchId, status: "draft" }, data: { status: "rejected" } }),
    db.loreBatch.update({
      where: { id: batchId, status: "draft" },
      data: { status: "discarded", reviewedAt: new Date() },
    }),
  ]);
}
