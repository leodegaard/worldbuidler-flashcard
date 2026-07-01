import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptSecret, verifyOauthState } from "@/lib/lore-lens/crypto";
import { createGoogleOauthClient } from "@/lib/lore-lens/drive";

export const dynamic = "force-dynamic";

function loreLensRedirect(request: NextRequest, key: "connected" | "error", value: string) {
  const response = NextResponse.redirect(
    new URL(`/lore-lens?${key}=${encodeURIComponent(value)}`, request.url),
  );
  response.cookies.delete("lore_oauth_state");
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const state = request.nextUrl.searchParams.get("state") ?? undefined;
    const cookieState = request.cookies.get("lore_oauth_state")?.value;
    if (state !== cookieState || !verifyOauthState(state)) {
      return loreLensRedirect(request, "error", "Google OAuth state validation failed");
    }
    const code = request.nextUrl.searchParams.get("code");
    if (!code) return loreLensRedirect(request, "error", "Google did not return an authorization code");

    const auth = createGoogleOauthClient();
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);
    const existing = await db.googleConnection.findUnique({ where: { id: "primary" } });
    const refreshToken = tokens.refresh_token
      ? encryptSecret(tokens.refresh_token)
      : existing?.encryptedRefreshToken;
    if (!refreshToken) {
      return loreLensRedirect(request, "error", "Google did not return a refresh token; reconnect and consent again");
    }

    const drive = google.drive({ version: "v3", auth });
    const about = await drive.about.get({ fields: "user(emailAddress)" });
    await db.googleConnection.upsert({
      where: { id: "primary" },
      create: {
        encryptedRefreshToken: refreshToken,
        accountEmail: about.data.user?.emailAddress ?? null,
        scope: tokens.scope ?? "https://www.googleapis.com/auth/drive.readonly",
      },
      update: {
        encryptedRefreshToken: refreshToken,
        accountEmail: about.data.user?.emailAddress ?? null,
        scope: tokens.scope ?? "https://www.googleapis.com/auth/drive.readonly",
      },
    });
    return loreLensRedirect(request, "connected", "Google Drive connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google OAuth failed";
    return loreLensRedirect(request, "error", message);
  }
}
