import assert from "node:assert/strict";
import test from "node:test";
import { chooseSourcePool, pickLeastAnswered } from "./cards";

test("mixes curated and generated pools at the 50 percent boundary", () => {
  assert.deepEqual(chooseSourcePool(["curated"], ["generated"], () => 0.49), ["curated"]);
  assert.deepEqual(chooseSourcePool(["curated"], ["generated"], () => 0.5), ["generated"]);
});

test("falls back to the available source", () => {
  assert.deepEqual(chooseSourcePool([], ["generated"]), ["generated"]);
});

test("selects only among least answered cards", () => {
  const cards = [
    { id: "a", _count: { answers: 2 } },
    { id: "b", _count: { answers: 0 } },
    { id: "c", _count: { answers: 0 } },
  ];
  assert.equal(pickLeastAnswered(cards, () => 0)?.id, "b");
  assert.equal(pickLeastAnswered(cards, () => 0.99)?.id, "c");
});
