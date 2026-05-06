import { test } from "node:test";
import assert from "node:assert/strict";
import { isRetroOpen, mapRetroState, type RetroEntry } from "./retro";
import { submitRetroSchema } from "./validation/retro";

const ROME = {
  midDayHour: 12,
  midDayMinute: 30,
  endOfDayHour: 18,
  endOfDayMinute: 0,
  timezone: "Europe/Rome",
};

const UTC = { ...ROME, timezone: "UTC" };

test("isRetroOpen: false before end-of-day trigger (Rome, summer DST)", () => {
  const now = new Date("2026-05-06T15:59:00Z");
  assert.equal(isRetroOpen(now, ROME), false);
});

test("isRetroOpen: true exactly at end-of-day trigger (Rome, summer DST)", () => {
  const now = new Date("2026-05-06T16:00:00Z");
  assert.equal(isRetroOpen(now, ROME), true);
});

test("isRetroOpen: true after trigger", () => {
  const now = new Date("2026-05-06T20:00:00Z");
  assert.equal(isRetroOpen(now, ROME), true);
});

test("isRetroOpen: UTC at exact trigger is true", () => {
  const now = new Date("2026-05-06T18:00:00Z");
  assert.equal(isRetroOpen(now, UTC), true);
});

test("isRetroOpen: UTC just before trigger is false", () => {
  const now = new Date("2026-05-06T17:59:00Z");
  assert.equal(isRetroOpen(now, UTC), false);
});

const COMMITTED = ["t1", "t2"];
const RETROS: RetroEntry[] = [
  { taskId: "t1", outcome: "Done", submittedAt: new Date("2026-05-06T16:05:00Z") },
  { taskId: "t2", outcome: "InProgress", submittedAt: new Date("2026-05-06T16:05:00Z") },
];

test("mapRetroState: null before trigger (US-009 view stays)", () => {
  const now = new Date("2026-05-06T11:00:00Z");
  assert.equal(mapRetroState(COMMITTED, [], now, ROME), null);
});

test("mapRetroState: awaiting_retro after trigger with no rows", () => {
  const now = new Date("2026-05-06T16:00:00Z");
  assert.equal(mapRetroState(COMMITTED, [], now, ROME), "awaiting_retro");
});

test("mapRetroState: day_closed after trigger with rows", () => {
  const now = new Date("2026-05-06T16:30:00Z");
  assert.equal(mapRetroState(COMMITTED, RETROS, now, ROME), "day_closed");
});

test("mapRetroState: null when no committed tasks even after trigger", () => {
  const now = new Date("2026-05-06T16:30:00Z");
  assert.equal(mapRetroState([], [], now, ROME), null);
});

const TOKEN_UUID = "11111111-1111-4111-8111-111111111111";
const TASK_UUID_A = "22222222-2222-4222-8222-222222222222";
const TASK_UUID_B = "33333333-3333-4333-8333-333333333333";
const TASK_UUID_C = "44444444-4444-4444-8444-444444444444";

test("submitRetroSchema: rejects empty entries", () => {
  const result = submitRetroSchema.safeParse({ token: TOKEN_UUID, entries: [] });
  assert.equal(result.success, false);
});

test("submitRetroSchema: rejects non-enum outcome", () => {
  const result = submitRetroSchema.safeParse({
    token: TOKEN_UUID,
    entries: [{ taskId: TASK_UUID_A, outcome: "Maybe" }],
  });
  assert.equal(result.success, false);
});

test("submitRetroSchema: rejects non-uuid taskId", () => {
  const result = submitRetroSchema.safeParse({
    token: TOKEN_UUID,
    entries: [{ taskId: "not-a-uuid", outcome: "Done" }],
  });
  assert.equal(result.success, false);
});

test("submitRetroSchema: accepts well-formed payload with all three outcomes", () => {
  const result = submitRetroSchema.safeParse({
    token: TOKEN_UUID,
    entries: [
      { taskId: TASK_UUID_A, outcome: "Done" },
      { taskId: TASK_UUID_B, outcome: "InProgress" },
      { taskId: TASK_UUID_C, outcome: "NotStarted" },
    ],
  });
  assert.equal(result.success, true);
});
