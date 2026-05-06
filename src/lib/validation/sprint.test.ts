import { test } from "node:test";
import assert from "node:assert/strict";
import { createSprintSchema } from "./sprint";

test("rejects empty name", () => {
  const result = createSprintSchema.safeParse({
    name: "   ",
    startDate: "2026-05-10",
    endDate: "2026-05-20",
  });
  assert.equal(result.success, false);
});

test("rejects when startDate equals endDate", () => {
  const result = createSprintSchema.safeParse({
    name: "Sprint",
    startDate: "2026-05-10",
    endDate: "2026-05-10",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const endIssue = result.error.issues.find((i) => i.path[0] === "endDate");
    assert.ok(endIssue, "expected endDate issue");
  }
});

test("rejects when startDate > endDate", () => {
  const result = createSprintSchema.safeParse({
    name: "Sprint",
    startDate: "2026-05-20",
    endDate: "2026-05-10",
  });
  assert.equal(result.success, false);
});

test("rejects malformed date string", () => {
  const result = createSprintSchema.safeParse({
    name: "Sprint",
    startDate: "10/05/2026",
    endDate: "2026-05-20",
  });
  assert.equal(result.success, false);
});

test("accepts valid input and trims name", () => {
  const result = createSprintSchema.safeParse({
    name: "  Sprint 5  ",
    startDate: "2026-05-10",
    endDate: "2026-05-20",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, "Sprint 5");
  }
});
