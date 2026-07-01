"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, createSessionToken, verifyPassword } from "@/lib/auth";

export async function login(formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || !verifyPassword(password)) {
    redirect("/login?error=1");
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  redirect("/");
}
