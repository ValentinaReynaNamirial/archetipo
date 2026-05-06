import { test } from "node:test";
import assert from "node:assert/strict";
import { getSprintStatus, isActiveSprint } from "./sprint";

const sprint = {
  startDate: new Date("2026-05-10T00:00:00.000Z"),
  endDate: new Date("2026-05-20T00:00:00.000Z"),
};

test("isActiveSprint: false before window", () => {
  assert.equal(isActiveSprint(sprint, new Date("2026-05-09T23:59:59.000Z")), false);
});

test("isActiveSprint: true at exact start", () => {
  assert.equal(isActiveSprint(sprint, new Date("2026-05-10T00:00:00.000Z")), true);
});

test("isActiveSprint: true inside window", () => {
  assert.equal(isActiveSprint(sprint, new Date("2026-05-15T12:00:00.000Z")), true);
});

test("isActiveSprint: true at exact end", () => {
  assert.equal(isActiveSprint(sprint, new Date("2026-05-20T00:00:00.000Z")), true);
});

test("isActiveSprint: false after window", () => {
  assert.equal(isActiveSprint(sprint, new Date("2026-05-20T00:00:01.000Z")), false);
});

test("getSprintStatus: upcoming/active/past", () => {
  assert.equal(getSprintStatus(sprint, new Date("2026-05-01T00:00:00.000Z")), "upcoming");
  assert.equal(getSprintStatus(sprint, new Date("2026-05-15T00:00:00.000Z")), "active");
  assert.equal(getSprintStatus(sprint, new Date("2026-06-01T00:00:00.000Z")), "past");
});
