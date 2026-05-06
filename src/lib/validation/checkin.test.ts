import { test } from "node:test";
import assert from "node:assert/strict";
import { checkInEntrySchema, submitCheckInSchema } from "./checkin";

const TASK_ID = "11111111-1111-1111-1111-111111111111";
const TOKEN = "22222222-2222-2222-2222-222222222222";

test("checkInEntrySchema: OnTrack with no note is valid", () => {
  const out = checkInEntrySchema.parse({ taskId: TASK_ID, status: "OnTrack" });
  assert.equal(out.note, null);
});

test("checkInEntrySchema: OnTrack with non-empty note is rejected", () => {
  const r = checkInEntrySchema.safeParse({ taskId: TASK_ID, status: "OnTrack", note: "x" });
  assert.equal(r.success, false);
});

test("checkInEntrySchema: TaskChanged with non-empty note is rejected", () => {
  const r = checkInEntrySchema.safeParse({ taskId: TASK_ID, status: "TaskChanged", note: "x" });
  assert.equal(r.success, false);
});

test("checkInEntrySchema: OnTrack with whitespace-only note is normalised to null", () => {
  const out = checkInEntrySchema.parse({ taskId: TASK_ID, status: "OnTrack", note: "   " });
  assert.equal(out.note, null);
});

test("checkInEntrySchema: Blocked with note trims and keeps it", () => {
  const out = checkInEntrySchema.parse({ taskId: TASK_ID, status: "Blocked", note: "  hi  " });
  assert.equal(out.note, "hi");
});

test("checkInEntrySchema: Blocked with empty note is allowed and stored as null", () => {
  const out = checkInEntrySchema.parse({ taskId: TASK_ID, status: "Blocked", note: "" });
  assert.equal(out.note, null);
});

test("checkInEntrySchema: note longer than 500 chars is rejected", () => {
  const r = checkInEntrySchema.safeParse({
    taskId: TASK_ID,
    status: "Blocked",
    note: "x".repeat(501),
  });
  assert.equal(r.success, false);
});

test("checkInEntrySchema: invalid status value is rejected", () => {
  const r = checkInEntrySchema.safeParse({ taskId: TASK_ID, status: "Wat" });
  assert.equal(r.success, false);
});

test("submitCheckInSchema: rejects empty entries", () => {
  const r = submitCheckInSchema.safeParse({ token: TOKEN, entries: [] });
  assert.equal(r.success, false);
});

test("submitCheckInSchema: accepts valid payload", () => {
  const r = submitCheckInSchema.safeParse({
    token: TOKEN,
    entries: [{ taskId: TASK_ID, status: "OnTrack" }],
  });
  assert.equal(r.success, true);
});
