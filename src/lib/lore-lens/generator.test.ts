import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGenerationRequest,
  buildQuestionJsonSchema,
  calculateCostMicros,
  formatGenerationDebugPreview,
} from "./generator";
import type { ScannedNote } from "./types";

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

test("debug preview contains every part of the OpenAI request", () => {
  const note: ScannedNote = {
    id: "note-1",
    name: "Reekport.md",
    path: "world/Reekport.md",
    focus: "world",
    modifiedTime: new Date(0),
    content: "# Reekport\n\nTBD",
    contentHash: "hash",
    links: [],
    headings: ["Reekport"],
    gapScore: 12,
    gapSignals: ["explicit placeholder or open question"],
  };
  const { request } = buildGenerationRequest({
    focus: "world",
    primaryNotes: [note],
    relatedNotes: [],
    priorPrompts: ["What does Reekport fear?"],
    draftAnswers: [{ prompt: "Who rules Reekport?", body: "A council." }],
  });
  const preview = formatGenerationDebugPreview(request);

  assert.match(preview, /focused worldbuilding editor/);
  assert.match(preview, /# Reekport/);
  assert.match(preview, /What does Reekport fear\?/);
  assert.match(preview, /A council\./);
  assert.match(preview, /note-1/);
  assert.match(preview, /json_schema/);
});
