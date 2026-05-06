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

test("rejects empty title", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "",
    assignedDevId: VALID_UUID_B,
  });
  assert.equal(result.success, false);
});

test("rejects whitespace-only title", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "   ",
    assignedDevId: VALID_UUID_B,
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path[0] === "title");
    assert.ok(issue, "expected title issue");
  }
});

test("rejects missing assignee", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assignedDevId: "",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path[0] === "assignedDevId");
    assert.ok(issue, "expected assignedDevId issue");
  }
});

test("rejects non-uuid assignee", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assignedDevId: "not-a-uuid",
  });
  assert.equal(result.success, false);
});

test("rejects title exceeding max length", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "x".repeat(TASK_TITLE_MAX + 1),
    assignedDevId: VALID_UUID_B,
  });
  assert.equal(result.success, false);
});

test("rejects description exceeding max length", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    description: "x".repeat(TASK_DESCRIPTION_MAX + 1),
    assignedDevId: VALID_UUID_B,
  });
  assert.equal(result.success, false);
});

test("accepts valid input and trims title", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "  Wire backlog route  ",
    assignedDevId: VALID_UUID_B,
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
    assignedDevId: VALID_UUID_B,
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
    assignedDevId: VALID_UUID_B,
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
    assignedDevId: VALID_UUID_B,
  });
  assert.equal(result.success, false);
});

test("update schema accepts a valid task id", () => {
  const result = updateTaskSchema.safeParse({
    id: VALID_UUID_C,
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assignedDevId: VALID_UUID_B,
  });
  assert.equal(result.success, true);
});

test("accepts rationale up to MAX_RATIONALE_LENGTH chars", () => {
  const result = createTaskSchema.safeParse({
    sprintId: VALID_UUID_A,
    title: "Wire backlog route",
    assignedDevId: VALID_UUID_B,
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
    assignedDevId: VALID_UUID_B,
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
    assignedDevId: VALID_UUID_B,
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
    assignedDevId: VALID_UUID_B,
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
    assignedDevId: VALID_UUID_B,
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
    assignedDevId: VALID_UUID_B,
    rationale: "  ship blocker for compliance  ",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.rationale, "ship blocker for compliance");
  }
});
