import { NextResponse } from "next/server";
import { createOauthState } from "@/lib/lore-lens/crypto";
import { createGoogleOauthClient } from "@/lib/lore-lens/drive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const state = createOauthState();
    const auth = createGoogleOauthClient();
    const authorizationUrl = auth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
      scope: ["https://www.googleapis.com/auth/drive.readonly"],
      state,
    });
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set("lore_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google OAuth is not configured";
    return NextResponse.redirect(
      new URL(`/lore-lens?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
