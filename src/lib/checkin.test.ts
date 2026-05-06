import { test } from "node:test";
import assert from "node:assert/strict";
import { isCheckInOpen, mapCheckInState, type CheckInEntry } from "./checkin";

const ROME = {
  midDayHour: 12,
  midDayMinute: 30,
  endOfDayHour: 18,
  endOfDayMinute: 0,
  timezone: "Europe/Rome",
};

const UTC = { ...ROME, timezone: "UTC" };

test("isCheckInOpen: false before mid-day trigger (Rome, summer DST)", () => {
  const now = new Date("2026-05-06T10:00:00Z");
  assert.equal(isCheckInOpen(now, ROME), false);
});

test("isCheckInOpen: true exactly at mid-day trigger (Rome, summer DST)", () => {
  const now = new Date("2026-05-06T10:30:00Z");
  assert.equal(isCheckInOpen(now, ROME), true);
});

test("isCheckInOpen: true mid-window", () => {
  const now = new Date("2026-05-06T13:00:00Z");
  assert.equal(isCheckInOpen(now, ROME), true);
});

test("isCheckInOpen: false at end-of-day cutoff", () => {
  const now = new Date("2026-05-06T16:00:00Z");
  assert.equal(isCheckInOpen(now, ROME), false);
});

test("isCheckInOpen: UTC at exact open is true", () => {
  const now = new Date("2026-05-06T12:30:00Z");
  assert.equal(isCheckInOpen(now, UTC), true);
});

test("isCheckInOpen: UTC at exact close is false", () => {
  const now = new Date("2026-05-06T18:00:00Z");
  assert.equal(isCheckInOpen(now, UTC), false);
});

const COMMITTED = ["t1", "t2"];
const ENTRIES: CheckInEntry[] = [
  { taskId: "t1", status: "OnTrack", note: null, submittedAt: new Date("2026-05-06T11:00:00Z") },
  { taskId: "t2", status: "Blocked", note: "x", submittedAt: new Date("2026-05-06T11:00:00Z") },
];

test("mapCheckInState: pre_checkin before mid-day", () => {
  const now = new Date("2026-05-06T07:00:00Z");
  assert.equal(mapCheckInState(COMMITTED, [], now, ROME), "pre_checkin");
});

test("mapCheckInState: awaiting_checkin in window with no submission", () => {
  const now = new Date("2026-05-06T11:00:00Z");
  assert.equal(mapCheckInState(COMMITTED, [], now, ROME), "awaiting_checkin");
});

test("mapCheckInState: checked_in in window with submitted entries", () => {
  const now = new Date("2026-05-06T11:00:00Z");
  assert.equal(mapCheckInState(COMMITTED, ENTRIES, now, ROME), "checked_in");
});

test("mapCheckInState: post_checkin after end-of-day", () => {
  const now = new Date("2026-05-06T17:00:00Z");
  assert.equal(mapCheckInState(COMMITTED, ENTRIES, now, ROME), "post_checkin");
});

test("mapCheckInState: awaiting_checkin when no committed tasks (window open)", () => {
  const now = new Date("2026-05-06T11:00:00Z");
  assert.equal(mapCheckInState([], [], now, ROME), "awaiting_checkin");
});
