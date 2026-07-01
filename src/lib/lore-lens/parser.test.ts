import assert from "node:assert/strict";
import test from "node:test";
import { inspectMarkdown, questionFingerprint, selectRelatedNotes } from "./parser";
import type { ScannedNote } from "./types";

test("detects Obsidian gaps and links", () => {
  const result = inspectMarkdown("# History\n\nTBD\n\nWho founded [[Reekport]]??");
  assert.ok(result.gapScore >= 40);
  assert.deepEqual(result.links, ["reekport"]);
  assert.ok(result.gapSignals.includes("explicit placeholder or open question"));
});

test("normalizes question fingerprints", () => {
  assert.equal(
    questionFingerprint("Who founded Reekport?"),
    questionFingerprint(" who founded  REEKPORT "),
  );
});

test("collects outbound and backlink context to two hops", () => {
  const note = (id: string, name: string, links: string[]): ScannedNote => ({
    id,
    name,
    links,
    path: name,
    focus: "world",
    modifiedTime: new Date(0),
    content: "",
    contentHash: id,
    headings: [],
    gapScore: 1,
    gapSignals: [],
  });
  const notes = [
    note("a", "A.md", ["b"]),
    note("b", "B.md", ["c"]),
    note("c", "C.md", []),
    note("d", "D.md", ["a"]),
  ];
  assert.deepEqual(
    selectRelatedNotes(notes, [notes[0]]).map((item) => item.id).sort(),
    ["b", "c", "d"],
  );
});
