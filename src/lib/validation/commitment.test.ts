import { test } from "node:test";
import assert from "node:assert/strict";
import { confirmCommitmentSchema } from "./commitment";

const VALID_TOKEN = "11111111-1111-4111-8111-111111111111";
const VALID_TASK = "22222222-2222-4222-8222-222222222222";

test("accepts a valid token + non-empty taskIds array of UUIDs", () => {
  const result = confirmCommitmentSchema.safeParse({
    token: VALID_TOKEN,
    taskIds: [VALID_TASK],
  });
  assert.equal(result.success, true);
});

test("rejects an empty taskIds array with field error", () => {
  const result = confirmCommitmentSchema.safeParse({
    token: VALID_TOKEN,
    taskIds: [],
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const flat = result.error.flatten();
    assert.equal(flat.fieldErrors.taskIds?.[0], "Select at least one task.");
  }
});

test("rejects non-UUID taskIds", () => {
  const result = confirmCommitmentSchema.safeParse({
    token: VALID_TOKEN,
    taskIds: ["not-a-uuid"],
  });
  assert.equal(result.success, false);
});

test("rejects invalid token", () => {
  const result = confirmCommitmentSchema.safeParse({
    token: "not-a-uuid",
    taskIds: [VALID_TASK],
  });
  assert.equal(result.success, false);
});
