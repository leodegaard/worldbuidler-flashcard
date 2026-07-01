export const AUTH_COOKIE = "wf_auth";

const SESSION_VALUE = "authenticated";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return toHex(signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

export async function createSessionToken(): Promise<string> {
  const signature = await sign(requireSessionSecret(), SESSION_VALUE);
  return `${SESSION_VALUE}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const [value, signature] = token.split(".");
  if (value !== SESSION_VALUE || !signature) return false;
  const expected = await sign(requireSessionSecret(), SESSION_VALUE);
  return timingSafeEqual(signature, expected);
}

export function verifyPassword(password: string): boolean {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) throw new Error("APP_PASSWORD is not set");
  return timingSafeEqual(password, appPassword);
}
