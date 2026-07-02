import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { requireEnv } from "./config";

function encryptionKey(): Buffer {
  const raw = requireEnv("OAUTH_ENCRYPTION_KEY");
  const key = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("OAUTH_ENCRYPTION_KEY must encode exactly 32 bytes");
  }
  return key;
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(value: string): string {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Stored OAuth credential is malformed");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function createOauthState(): string {
  const nonce = randomBytes(24).toString("base64url");
  const signature = createHmac("sha256", requireEnv("SESSION_SECRET"))
    .update(nonce)
    .digest("base64url");
  return `${nonce}.${signature}`;
}

export function verifyOauthState(value: string | undefined): boolean {
  if (!value) return false;
  const [nonce, signature] = value.split(".");
  if (!nonce || !signature) return false;
  const expected = createHmac("sha256", requireEnv("SESSION_SECRET"))
    .update(nonce)
    .digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
