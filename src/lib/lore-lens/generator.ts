import OpenAI from "openai";
import { z } from "zod";
import {
  LORE_CATEGORIES,
  LORE_MODEL,
  MAX_INPUT_TOKENS,
  MAX_OUTPUT_TOKENS,
  type LoreFocus,
} from "./config";
import { questionFingerprint } from "./parser";
import type { GeneratedQuestion, ScannedNote } from "./types";

const questionSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().min(12).max(500),
        category: z.enum(LORE_CATEGORIES),
        sourceFileId: z.string().min(1),
        rationale: z.string().min(8).max(500),
        gapType: z.string().min(3).max(80),
      }),
    )
    .length(10),
});

export function buildQuestionJsonSchema(primarySourceIds: string[]) {
  if (primarySourceIds.length === 0) {
    throw new Error("At least one primary source is required for generation");
  }
  return {
    type: "object",
    additionalProperties: false,
    required: ["questions"],
    properties: {
      questions: {
        type: "array",
        minItems: 10,
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["prompt", "category", "sourceFileId", "rationale", "gapType"],
          properties: {
            prompt: { type: "string" },
            category: { type: "string", enum: [...LORE_CATEGORIES] },
            sourceFileId: { type: "string", enum: primarySourceIds },
            rationale: { type: "string" },
            gapType: { type: "string" },
          },
        },
      },
    },
  };
}

function noteBlock(note: ScannedNote, maxContentChars: number) {
  const content =
    note.content.length > maxContentChars
      ? `${note.content.slice(0, maxContentChars)}\n[Note truncated]`
      : note.content;
  return [
    `SOURCE_ID: ${note.id}`,
    `AREA: ${note.focus}`,
    `PATH: ${note.path}`,
    `GAP_SIGNALS: ${note.gapSignals.join(", ") || "none detected locally"}`,
    "CONTENT:",
    content || "[Empty note]",
  ].join("\n");
}

export function buildGenerationInput(args: {
  focus: LoreFocus;
  primaryNotes: ScannedNote[];
  relatedNotes: ScannedNote[];
  priorPrompts: string[];
  draftAnswers: Array<{ prompt: string; body: string }>;
}) {
  const primary = args.primaryNotes.map((note) => noteBlock(note, 12_000)).join(
    "\n\n--- PRIMARY NOTE ---\n\n",
  );
  const related = args.relatedNotes.map((note) => noteBlock(note, 8_000)).join(
    "\n\n--- RELATED NOTE ---\n\n",
  );
  const previous = args.priorPrompts.slice(0, 200).map((prompt) => `- ${prompt}`).join("\n");
  const drafts = args.draftAnswers
    .slice(0, 10)
    .map((answer) => `- Prompt: ${answer.prompt}\n  Draft answer: ${answer.body}`)
    .join("\n");

  const input = `FOCUS: ${args.focus}

PRIMARY CANDIDATE NOTES
${primary}

RELATED TWO-HOP CONTEXT
${related || "[No related notes found]"}

PREVIOUSLY GENERATED QUESTIONS — DO NOT REPEAT
${previous || "[None]"}

NON-CANON DRAFT IDEAS — USE ONLY TO AVOID REPETITION OR ASK A RELEVANT FOLLOW-UP
${drafts || "[None]"}`;

  const estimatedTokens = Math.ceil(input.length / 4);
  if (estimatedTokens > MAX_INPUT_TOKENS) {
    throw new Error("Selected lore context exceeds the 100,000-token run limit");
  }
  return { input, estimatedTokens };
}

export async function generateQuestions(args: {
  focus: LoreFocus;
  primaryNotes: ScannedNote[];
  relatedNotes: ScannedNote[];
  priorPrompts: string[];
  priorFingerprints: Set<string>;
  draftAnswers: Array<{ prompt: string; body: string }>;
  recordUsage?: (usage: { inputTokens: number; outputTokens: number }) => Promise<void>;
}) {
  const { input, estimatedTokens } = buildGenerationInput(args);
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: LORE_MODEL,
    reasoning: { effort: "low" },
    max_output_tokens: MAX_OUTPUT_TOKENS,
    text: {
      verbosity: "low",
      format: {
        type: "json_schema",
        name: "lore_lens_questions",
        strict: true,
        schema: buildQuestionJsonSchema(args.primaryNotes.map((note) => note.id)),
      },
    },
    instructions: `You are Lore Lens, a focused worldbuilding editor for a solo tabletop RPG game master.
Generate exactly 10 concise English questions from the supplied Obsidian lore.

Every question must:
- cite one PRIMARY candidate through sourceFileId;
- expose an observable gap: placeholder, empty or sparse section, missing relationship, motivation, consequence, contradiction, sensory detail, or campaign connection;
- be open-ended, narrow, and not answerable verbatim from the supplied notes;
- ask only one main question;
- remain useful for worldbuilding rather than factual recall or game rules;
- avoid arbitrary invention. A new person, place, faction, item, or event is allowed only when it fills a concrete gap anchored in existing lore;
- differ materially from every previous question.

Adapt the question-type mix to the strongest gaps, but use no more than three questions of the same gapType.
For balanced focus, use at least two primary sources from each non-empty area: campaign, world, and characters.
Treat saved app answers as non-canon draft ideas that cannot override Obsidian.
The rationale must name the observed gap without quoting private note text at length.`,
    input,
  });

  const usage = response.usage ?? {
    input_tokens: estimatedTokens,
    output_tokens: MAX_OUTPUT_TOKENS,
  };
  await args.recordUsage?.({
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
  });

  if (!response.output_text) throw new Error("OpenAI returned no structured output");
  const parsed = questionSchema.parse(JSON.parse(response.output_text));
  const primaryById = new Map(args.primaryNotes.map((note) => [note.id, note] as const));
  const fingerprints = new Set<string>();

  for (const question of parsed.questions) {
    if (!primaryById.has(question.sourceFileId)) {
      throw new Error("OpenAI referenced a note outside the primary candidate set");
    }
    const fingerprint = questionFingerprint(question.prompt);
    if (fingerprints.has(fingerprint) || args.priorFingerprints.has(fingerprint)) {
      throw new Error("OpenAI returned a duplicate Lore Lens question");
    }
    fingerprints.add(fingerprint);
  }

  if (args.focus === "balanced") {
    for (const area of ["campaign", "world", "characters"] as const) {
      if (args.primaryNotes.some((note) => note.focus === area)) {
        const count = parsed.questions.filter(
          (question) => primaryById.get(question.sourceFileId)?.focus === area,
        ).length;
        if (count < 2) throw new Error(`Balanced batch did not include enough ${area} questions`);
      }
    }
  }

  return {
    questions: parsed.questions as GeneratedQuestion[],
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
  };
}

export function calculateCostMicros(inputTokens: number, outputTokens: number) {
  return Math.round(inputTokens * 0.75 + outputTokens * 4.5);
}
