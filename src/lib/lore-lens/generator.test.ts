import assert from "node:assert/strict";
import test from "node:test";
import { buildQuestionJsonSchema, calculateCostMicros } from "./generator";

test("calculates GPT-5.4 mini cost in micro-dollars", () => {
  assert.equal(calculateCostMicros(100_000, 5_000), 97_500);
});

test("constrains generated source IDs to the primary candidate set", () => {
  const schema = buildQuestionJsonSchema(["primary-a", "primary-b"]);
  assert.deepEqual(
    schema.properties.questions.items.properties.sourceFileId.enum,
    ["primary-a", "primary-b"],
  );
});
