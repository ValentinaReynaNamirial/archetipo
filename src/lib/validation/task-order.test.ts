import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REORDER_MAX_TASKS,
  arraysEqualInOrder,
  moveTaskToPosition,
  reorderTasksSchema,
} from "./task-order";

const SPRINT_ID = "11111111-1111-4111-8111-111111111111";
const T1 = "22222222-2222-4222-8222-222222222222";
const T2 = "33333333-3333-4333-8333-333333333333";
const T3 = "44444444-4444-4444-8444-444444444444";

test("reorderTasksSchema: accepts a valid payload", () => {
  const result = reorderTasksSchema.safeParse({
    sprintId: SPRINT_ID,
    orderedTaskIds: [T1, T2, T3],
  });
  assert.equal(result.success, true);
});

test("reorderTasksSchema: rejects empty orderedTaskIds", () => {
  const result = reorderTasksSchema.safeParse({
    sprintId: SPRINT_ID,
    orderedTaskIds: [],
  });
  assert.equal(result.success, false);
});

test("reorderTasksSchema: rejects duplicate task ids", () => {
  const result = reorderTasksSchema.safeParse({
    sprintId: SPRINT_ID,
    orderedTaskIds: [T1, T2, T1],
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error.issues[0]!.message, /duplicate/i);
  }
});

test("reorderTasksSchema: rejects non-uuid task id", () => {
  const result = reorderTasksSchema.safeParse({
    sprintId: SPRINT_ID,
    orderedTaskIds: ["not-a-uuid"],
  });
  assert.equal(result.success, false);
});

test("reorderTasksSchema: rejects non-uuid sprint id", () => {
  const result = reorderTasksSchema.safeParse({
    sprintId: "not-a-uuid",
    orderedTaskIds: [T1],
  });
  assert.equal(result.success, false);
});

test("reorderTasksSchema: rejects oversize array", () => {
  const ids = Array.from({ length: REORDER_MAX_TASKS + 1 }, (_, i) =>
    `${(i + 1).toString(16).padStart(8, "0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`
  );
  const result = reorderTasksSchema.safeParse({
    sprintId: SPRINT_ID,
    orderedTaskIds: ids,
  });
  assert.equal(result.success, false);
});

test("moveTaskToPosition: moves item up", () => {
  const result = moveTaskToPosition([T1, T2, T3], T3, 0);
  assert.deepEqual(result, [T3, T1, T2]);
});

test("moveTaskToPosition: moves item down", () => {
  const result = moveTaskToPosition([T1, T2, T3], T1, 2);
  assert.deepEqual(result, [T2, T3, T1]);
});

test("moveTaskToPosition: clamps newIndex above range", () => {
  const result = moveTaskToPosition([T1, T2, T3], T1, 99);
  assert.deepEqual(result, [T2, T3, T1]);
});

test("moveTaskToPosition: clamps newIndex below zero", () => {
  const result = moveTaskToPosition([T1, T2, T3], T3, -5);
  assert.deepEqual(result, [T3, T1, T2]);
});

test("moveTaskToPosition: no-op when newIndex equals currentIndex", () => {
  const result = moveTaskToPosition([T1, T2, T3], T2, 1);
  assert.deepEqual(result, [T1, T2, T3]);
});

test("moveTaskToPosition: throws when task is not in list", () => {
  assert.throws(() => moveTaskToPosition([T1, T2], T3, 0));
});

test("arraysEqualInOrder: true for equal arrays", () => {
  assert.equal(arraysEqualInOrder([T1, T2], [T1, T2]), true);
});

test("arraysEqualInOrder: false for different order", () => {
  assert.equal(arraysEqualInOrder([T1, T2], [T2, T1]), false);
});

test("arraysEqualInOrder: false for different length", () => {
  assert.equal(arraysEqualInOrder([T1], [T1, T2]), false);
});
