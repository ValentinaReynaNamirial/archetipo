import { test } from "node:test";
import assert from "node:assert/strict";
import { coAssignees, engagementKey, isShared } from "./sharing";

test("isShared returns false for empty assignees", () => {
  assert.equal(isShared({ assignees: [] }), false);
});

test("isShared returns false for a single assignee", () => {
  assert.equal(isShared({ assignees: [{ devProfileId: "a" }] }), false);
});

test("isShared returns true for two assignees", () => {
  assert.equal(
    isShared({ assignees: [{ devProfileId: "a" }, { devProfileId: "b" }] }),
    true
  );
});

test("isShared returns true for many assignees", () => {
  assert.equal(
    isShared({
      assignees: [
        { devProfileId: "a" },
        { devProfileId: "b" },
        { devProfileId: "c" },
      ],
    }),
    true
  );
});

test("coAssignees excludes the current dev id", () => {
  const result = coAssignees(
    [{ devProfileId: "a" }, { devProfileId: "b" }, { devProfileId: "c" }],
    "b"
  );
  assert.deepEqual(result, [{ devProfileId: "a" }, { devProfileId: "c" }]);
});

test("coAssignees preserves input order", () => {
  const result = coAssignees(
    [{ devProfileId: "c" }, { devProfileId: "a" }, { devProfileId: "b" }],
    "a"
  );
  assert.deepEqual(result, [{ devProfileId: "c" }, { devProfileId: "b" }]);
});

test("coAssignees returns empty list when current dev is the only assignee", () => {
  const result = coAssignees([{ devProfileId: "a" }], "a");
  assert.deepEqual(result, []);
});

test("coAssignees returns full list when current dev is not in assignees", () => {
  const result = coAssignees(
    [{ devProfileId: "a" }, { devProfileId: "b" }],
    "z"
  );
  assert.deepEqual(result, [{ devProfileId: "a" }, { devProfileId: "b" }]);
});

test("coAssignees keeps extra fields untouched", () => {
  const result = coAssignees(
    [
      { devProfileId: "a", name: "Alice" },
      { devProfileId: "b", name: "Bob" },
    ],
    "a"
  );
  assert.deepEqual(result, [{ devProfileId: "b", name: "Bob" }]);
});

test("engagementKey is deterministic for same inputs", () => {
  const k1 = engagementKey("t1", "d1", "2026-05-06");
  const k2 = engagementKey("t1", "d1", "2026-05-06");
  assert.equal(k1, k2);
});

test("engagementKey distinguishes different tasks, devs, and days", () => {
  const base = engagementKey("t1", "d1", "2026-05-06");
  assert.notEqual(base, engagementKey("t2", "d1", "2026-05-06"));
  assert.notEqual(base, engagementKey("t1", "d2", "2026-05-06"));
  assert.notEqual(base, engagementKey("t1", "d1", "2026-05-07"));
});

test("engagementKey accepts Date and serializes to UTC ISO date", () => {
  const day = new Date(Date.UTC(2026, 4, 6, 23, 30, 0));
  assert.equal(engagementKey("t1", "d1", day), "t1|d1|2026-05-06");
});

test("engagementKey produces stable composite format", () => {
  assert.equal(
    engagementKey("task-1", "dev-1", "2026-05-06"),
    "task-1|dev-1|2026-05-06"
  );
});

test("engagementKey rejects non-ISO date strings", () => {
  assert.throws(() => engagementKey("t1", "d1", "2026-5-6"), /ISO date/);
  assert.throws(
    () => engagementKey("t1", "d1", "2026-05-06T10:00:00Z"),
    /ISO date/
  );
  assert.throws(() => engagementKey("t1", "d1", "06/05/2026"), /ISO date/);
});
