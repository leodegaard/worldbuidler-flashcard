import assert from "node:assert/strict";
import test from "node:test";
import { calculateCostMicros } from "./generator";

test("calculates GPT-5.4 mini cost in micro-dollars", () => {
  assert.equal(calculateCostMicros(100_000, 5_000), 97_500);
});
