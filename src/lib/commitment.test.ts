import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isCommitmentEditable,
  mapCommitmentState,
  todayInOrgTz,
} from "./commitment";

const ROME = { midDayHour: 12, midDayMinute: 30, endOfDayHour: 18, endOfDayMinute: 0, silentThresholdHours: 2, timezone: "Europe/Rome" };
const UTC = { midDayHour: 12, midDayMinute: 30, endOfDayHour: 18, endOfDayMinute: 0, silentThresholdHours: 2, timezone: "UTC" };

test("isCommitmentEditable returns true well before the cutoff (Rome)", () => {
  const now = new Date("2026-05-06T07:00:00Z");
  assert.equal(isCommitmentEditable(now, ROME), true);
});

test("isCommitmentEditable returns true one minute before the cutoff (Rome, summer DST)", () => {
  const now = new Date("2026-05-06T10:29:00Z");
  assert.equal(isCommitmentEditable(now, ROME), true);
});

test("isCommitmentEditable returns false at the exact cutoff minute (Rome, summer DST)", () => {
  const now = new Date("2026-05-06T10:30:00Z");
  assert.equal(isCommitmentEditable(now, ROME), false);
});

test("isCommitmentEditable returns false after the cutoff (Rome)", () => {
  const now = new Date("2026-05-06T15:00:00Z");
  assert.equal(isCommitmentEditable(now, ROME), false);
});

test("isCommitmentEditable in UTC at exactly the cutoff is locked", () => {
  const now = new Date("2026-05-06T12:30:00Z");
  assert.equal(isCommitmentEditable(now, UTC), false);
});

test("todayInOrgTz returns calendar day in org timezone, not UTC", () => {
  const justAfterMidnightRome = new Date("2026-05-05T22:30:00Z");
  const day = todayInOrgTz(justAfterMidnightRome, "Europe/Rome");
  assert.equal(day.toISOString(), "2026-05-06T00:00:00.000Z");
});

test("todayInOrgTz preserves UTC date when timezone is UTC", () => {
  const now = new Date("2026-05-06T23:59:00Z");
  const day = todayInOrgTz(now, "UTC");
  assert.equal(day.toISOString(), "2026-05-06T00:00:00.000Z");
});

test("todayInOrgTz handles late-night UTC that is next day in Tokyo", () => {
  const now = new Date("2026-05-05T16:00:00Z");
  const day = todayInOrgTz(now, "Asia/Tokyo");
  assert.equal(day.toISOString(), "2026-05-06T00:00:00.000Z");
});

test("mapCommitmentState: editor when no commitment and window open", () => {
  const now = new Date("2026-05-06T07:00:00Z");
  assert.equal(mapCommitmentState(null, now, ROME), "editor");
});

test("mapCommitmentState: editor when commitment is empty and window open", () => {
  const now = new Date("2026-05-06T07:00:00Z");
  assert.equal(
    mapCommitmentState({ taskIds: [], firstCommittedAt: null }, now, ROME),
    "editor"
  );
});

test("mapCommitmentState: editable when commitment exists and window open", () => {
  const now = new Date("2026-05-06T07:00:00Z");
  assert.equal(
    mapCommitmentState(
      { taskIds: ["t1"], firstCommittedAt: new Date("2026-05-06T07:00:00Z") },
      now,
      ROME
    ),
    "editable"
  );
});

test("mapCommitmentState: locked after the cutoff regardless of commitment", () => {
  const now = new Date("2026-05-06T15:00:00Z");
  assert.equal(mapCommitmentState(null, now, ROME), "locked");
  assert.equal(
    mapCommitmentState(
      { taskIds: ["t1"], firstCommittedAt: new Date("2026-05-06T07:00:00Z") },
      now,
      ROME
    ),
    "locked"
  );
});
