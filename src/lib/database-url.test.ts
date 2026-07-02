import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDatabaseUrl } from "./database-url";

test("makes the current strict Postgres SSL behavior explicit", () => {
  assert.equal(
    normalizeDatabaseUrl("postgresql://example.test/db?sslmode=require"),
    "postgresql://example.test/db?sslmode=verify-full",
  );
  assert.equal(
    normalizeDatabaseUrl("postgresql://example.test/db?pool=true&sslmode=prefer"),
    "postgresql://example.test/db?pool=true&sslmode=verify-full",
  );
});

test("preserves explicit libpq compatibility", () => {
  const url = "postgresql://example.test/db?uselibpqcompat=true&sslmode=require";
  assert.equal(normalizeDatabaseUrl(url), url);
});
