"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { LoreFocus } from "@/lib/lore-lens/config";
import {
  approveLoreQuestions,
  discardLoreBatch,
  generateLoreBatch,
  previewLoreGenerationRequest,
} from "@/lib/lore-lens/service";

function destination(key: "success" | "error", message: string) {
  return `/lore-lens?${key}=${encodeURIComponent(message)}`;
}

export async function generateLoreBatchAction(formData: FormData) {
  const rawFocus = formData.get("focus");
  const focus =
    typeof rawFocus === "string" &&
    ["campaign", "world", "characters", "balanced"].includes(rawFocus)
      ? (rawFocus as LoreFocus)
      : "balanced";
  let target: string;
  try {
    await generateLoreBatch(focus);
    target = destination("success", "Generated a new 10-question draft batch");
  } catch (error) {
    target = destination("error", error instanceof Error ? error.message : "Generation failed");
  }
  redirect(target);
}

export async function previewLoreGenerationAction(
  _previousState: { preview: string | null; error: string | null },
  formData: FormData,
): Promise<{ preview: string | null; error: string | null }> {
  const rawFocus = formData.get("focus");
  const focus =
    typeof rawFocus === "string" &&
    ["campaign", "world", "characters", "balanced"].includes(rawFocus)
      ? (rawFocus as LoreFocus)
      : "balanced";
  try {
    return {
      preview: await previewLoreGenerationRequest(focus),
      error: null,
    };
  } catch (error) {
    return {
      preview: null,
      error: error instanceof Error ? error.message : "Debug preview failed",
    };
  }
}

export async function approveLoreBatchAction(formData: FormData) {
  const batchId = formData.get("batchId");
  const questionIds = formData
    .getAll("questionId")
    .filter((value): value is string => typeof value === "string");
  let target: string;
  try {
    if (typeof batchId !== "string") throw new Error("Missing batch ID");
    await approveLoreQuestions(batchId, questionIds);
    target = destination("success", `Approved ${questionIds.length} Lore Lens questions`);
  } catch (error) {
    target = destination("error", error instanceof Error ? error.message : "Approval failed");
  }
  redirect(target);
}

export async function discardLoreBatchAction(formData: FormData) {
  const batchId = formData.get("batchId");
  let target: string;
  try {
    if (typeof batchId !== "string") throw new Error("Missing batch ID");
    await discardLoreBatch(batchId);
    target = destination("success", "Draft batch discarded");
  } catch (error) {
    target = destination("error", error instanceof Error ? error.message : "Discard failed");
  }
  redirect(target);
}

export async function disconnectGoogleAction() {
  await db.googleConnection.deleteMany({ where: { id: "primary" } });
  redirect(destination("success", "Google Drive disconnected"));
}
