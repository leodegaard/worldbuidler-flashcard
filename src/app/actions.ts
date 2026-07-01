"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function saveAnswer(formData: FormData) {
  const cardId = formData.get("cardId");
  const body = formData.get("body");

  if (typeof cardId !== "string") {
    throw new Error("Missing cardId");
  }

  if (typeof body === "string" && body.trim().length > 0) {
    await db.answer.create({
      data: { cardId, body: body.trim() },
    });
  }

  redirect(`/?exclude=${cardId}`);
}

export async function skipCard(formData: FormData) {
  const cardId = formData.get("cardId");

  if (typeof cardId !== "string") {
    throw new Error("Missing cardId");
  }

  redirect(`/?exclude=${cardId}`);
}
