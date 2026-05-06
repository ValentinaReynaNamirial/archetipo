import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createTaskSchema,
  updateTaskSchema,
  TASK_TITLE_MAX,
  TASK_DESCRIPTION_MAX,
  MAX_RATIONALE_LENGTH,
} from "./task";

const VALID_UUID_A = "11111111-1111-4111-8111-111111111111";
const VALID_UUID_B = "22222222-2222-4222-8222-222222222222";
const VALID_UUID_C = "33333333-3333-4333-8333-333333333333";
const VALID_UUID_D = "44444444-4444-4444-8444-444444444444";

test("rejects empty title", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "",
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, false);
});

test("rejects whitespace-only title", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "   ",
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path[0] === "title");
    assert.ok(issue, "expected title issue");
  }
});

test("rejects empty assignee list", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [],
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path[0] === "assigneeIds");
    assert.ok(issue, "expected assigneeIds issue");
  }
});

test("rejects missing assigneeIds field", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
  });
  assert.equal(result.success, false);
});

test("rejects non-uuid assignee in list", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B, "not-a-uuid"],
  });
  assert.equal(result.success, false);
});

test("accepts a single assignee", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data.assigneeIds, [VALID_UUID_B]);
  }
});

test("accepts multiple assignees", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B, VALID_UUID_C, VALID_UUID_D],
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data.assigneeIds, [
      VALID_UUID_B,
      VALID_UUID_C,
      VALID_UUID_D,
    ]);
  }
});

test("deduplicates assignees while preserving order", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B, VALID_UUID_C, VALID_UUID_B, VALID_UUID_D],
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data.assigneeIds, [
      VALID_UUID_B,
      VALID_UUID_C,
      VALID_UUID_D,
    ]);
  }
});

test("rejects title exceeding max length", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "x".repeat(TASK_TITLE_MAX + 1),
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, false);
});

test("rejects description exceeding max length", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    description: "x".repeat(TASK_DESCRIPTION_MAX + 1),
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, false);
});

test("accepts valid input and trims title", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "  Wire backlog route  ",
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.title, "Wire backlog route");
    assert.equal(result.data.description, undefined);
  }
});

test("accepts valid input with description and trims it", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    description: "  add header and stats  ",
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.description, "add header and stats");
  }
});

test("treats blank description as absent", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    description: "   ",
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.description, undefined);
  }
});

test("update schema requires task id", () => {
  const result = updateTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, false);
});

test("update schema accepts a valid task id", () => {
  const result = updateTaskSchema.safeParse({
    id: VALID_UUID_C,
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, true);
});

test("update schema requires non-empty assignee list", () => {
  const result = updateTaskSchema.safeParse({
    id: VALID_UUID_C,
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [],
  });
  assert.equal(result.success, false);
});

test("accepts rationale up to MAX_RATIONALE_LENGTH chars", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B],
    rationale: "x".repeat(MAX_RATIONALE_LENGTH),
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.rationale, "x".repeat(MAX_RATIONALE_LENGTH));
  }
});

test("rejects rationale over MAX_RATIONALE_LENGTH chars", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B],
    rationale: "x".repeat(MAX_RATIONALE_LENGTH + 1),
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path[0] === "rationale");
    assert.ok(issue, "expected rationale issue");
  }
});

test("accepts undefined rationale", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B],
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.rationale, undefined);
  }
});

test("transforms empty rationale to null", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B],
    rationale: "",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.rationale, null);
  }
});

test("transforms whitespace-only rationale to null", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B],
    rationale: "   \n\t  ",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.rationale, null);
  }
});

test("trims rationale value when persisted", () => {
  const result = updateTaskSchema.safeParse({
    id: VALID_UUID_C,
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assigneeIds: [VALID_UUID_B],
    rationale: "  ship blocker for compliance  ",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.rationale, "ship blocker for compliance");
  }
});
