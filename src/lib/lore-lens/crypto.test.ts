import assert from "node:assert/strict";
import test from "node:test";
import { createOauthState, decryptSecret, encryptSecret, verifyOauthState } from "./crypto";

test("encrypts OAuth credentials with authenticated encryption", () => {
  process.env.OAUTH_ENCRYPTION_KEY = "11".repeat(32);
  const encrypted = encryptSecret("refresh-token");
  assert.notEqual(encrypted, "refresh-token");
  assert.equal(decryptSecret(encrypted), "refresh-token");
});

test("signs and validates OAuth state", () => {
  process.env.SESSION_SECRET = "test-session-secret";
  const state = createOauthState();
  assert.equal(verifyOauthState(state), true);
  assert.equal(verifyOauthState(`${state}x`), false);
});
