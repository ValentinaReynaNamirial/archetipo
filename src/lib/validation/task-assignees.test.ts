import { test } from "node:test";
import assert from "node:assert/strict";
import { computeAssigneeDiff } from "./task-assignees";

test("returns empty diff when current and next are identical", () => {
  const result = computeAssigneeDiff(["a", "b"], ["a", "b"]);
  assert.deepEqual(result, { toAdd: [], toRemove: [] });
});

test("returns empty diff when sets are equal regardless of order", () => {
  const result = computeAssigneeDiff(["a", "b"], ["b", "a"]);
  assert.deepEqual(result, { toAdd: [], toRemove: [] });
});

test("identifies ids to add", () => {
  const result = computeAssigneeDiff(["a"], ["a", "b", "c"]);
  assert.deepEqual(result.toAdd, ["b", "c"]);
  assert.deepEqual(result.toRemove, []);
});

test("identifies ids to remove", () => {
  const result = computeAssigneeDiff(["a", "b", "c"], ["b"]);
  assert.deepEqual(result.toAdd, []);
  assert.deepEqual(result.toRemove, ["a", "c"]);
});

test("identifies both add and remove", () => {
  const result = computeAssigneeDiff(["a", "b"], ["b", "c"]);
  assert.deepEqual(result.toAdd, ["c"]);
  assert.deepEqual(result.toRemove, ["a"]);
});

test("handles empty current", () => {
  const result = computeAssigneeDiff([], ["a", "b"]);
  assert.deepEqual(result, { toAdd: ["a", "b"], toRemove: [] });
});

test("handles empty next", () => {
  const result = computeAssigneeDiff(["a", "b"], []);
  assert.deepEqual(result, { toAdd: [], toRemove: ["a", "b"] });
});

test("ignores duplicates within next", () => {
  const result = computeAssigneeDiff(["a"], ["b", "b", "c"]);
  assert.deepEqual(result.toAdd, ["b", "c"]);
  assert.deepEqual(result.toRemove, []);
});

test("ignores duplicates within current", () => {
  const result = computeAssigneeDiff(["a", "a", "b"], ["b"]);
  assert.deepEqual(result.toAdd, []);
  assert.deepEqual(result.toRemove, ["a"]);
});
