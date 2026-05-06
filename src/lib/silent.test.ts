import { test } from "node:test";
import assert from "node:assert/strict";
import { isSilent, findSilentDevsForDate } from "./silent";
import { silentThresholdMinutes } from "./config/schedule";

const ROME = {
  midDayHour: 12,
  midDayMinute: 30,
  endOfDayHour: 18,
  endOfDayMinute: 0,
  silentThresholdHours: 2,
  timezone: "Europe/Rome",
};

const ROME_1H = { ...ROME, silentThresholdHours: 1 };
const ROME_4H = { ...ROME, silentThresholdHours: 4 };

test("silentThresholdMinutes = midDay + threshold * 60", () => {
  assert.equal(silentThresholdMinutes(ROME), 12 * 60 + 30 + 120);
  assert.equal(silentThresholdMinutes(ROME_1H), 12 * 60 + 30 + 60);
});

test("isSilent: false when no committed tasks (no commitment)", () => {
  const now = new Date("2026-05-06T14:00:00Z");
  assert.equal(isSilent([], [], now, ROME), false);
});

test("isSilent: false when at least one CheckIn exists, regardless of time", () => {
  const now = new Date("2026-05-06T15:00:00Z");
  assert.equal(isSilent(["t1"], [{}], now, ROME), false);
});

test("isSilent: false at threshold - 1 minute", () => {
  // threshold local = 14:30 Rome summer => 12:30 UTC; -1m = 12:29 UTC
  const now = new Date("2026-05-06T12:29:00Z");
  assert.equal(isSilent(["t1"], [], now, ROME), false);
});

test("isSilent: true exactly at threshold", () => {
  const now = new Date("2026-05-06T12:30:00Z");
  assert.equal(isSilent(["t1"], [], now, ROME), true);
});

test("isSilent: true after end-of-day with no check-in", () => {
  const now = new Date("2026-05-06T17:30:00Z");
  assert.equal(isSilent(["t1"], [], now, ROME), true);
});

test("isSilent: threshold tunable via config (1h fires earlier)", () => {
  // 1h threshold = midDay + 60 => 13:30 Rome local => 11:30 UTC summer
  const now = new Date("2026-05-06T11:30:00Z");
  assert.equal(isSilent(["t1"], [], now, ROME_1H), true);
  assert.equal(isSilent(["t1"], [], now, ROME), false);
});

test("isSilent: threshold tunable via config (4h fires later)", () => {
  // 4h threshold = midDay + 240 => 16:30 Rome local => 14:30 UTC summer; check at 13:00 UTC
  const now = new Date("2026-05-06T13:00:00Z");
  assert.equal(isSilent(["t1"], [], now, ROME_4H), false);
  assert.equal(isSilent(["t1"], [], now, ROME), true);
});

type Commitment = {
  taskId: string;
  task: { assignees: { devProfileId: string }[] };
};
type Profile = { id: string; ownerId: string; name: string };
type CheckIn = { devProfileId: string };

function makeClient(opts: {
  profiles: Profile[];
  commitments: Commitment[];
  checkIns: CheckIn[];
  recordCalls?: { profileWhere?: unknown[] };
}) {
  return {
    devProfile: {
      findMany: (async (args: { where: unknown }) => {
        opts.recordCalls?.profileWhere?.push(args.where);
        return opts.profiles;
      }) as never,
    },
    dailyCommitment: {
      findMany: (async () => opts.commitments) as never,
    },
    taskCheckIn: {
      findMany: (async () => opts.checkIns) as never,
    },
  };
}

const OWNER = "11111111-2222-4333-8444-555555555555";
const PAST = new Date("2026-05-06T14:00:00Z");
const PRE = new Date("2026-05-06T11:00:00Z");
const DEV_A = { id: "dev-a", ownerId: OWNER, name: "Anna" };
const DEV_B = { id: "dev-b", ownerId: OWNER, name: "Bruno" };
const DEV_C = { id: "dev-c", ownerId: OWNER, name: "Carla" };

test("findSilentDevsForDate: returns only devs with commitment + zero check-ins past threshold", async () => {
  const client = makeClient({
    profiles: [DEV_A, DEV_B, DEV_C],
    commitments: [
      { taskId: "t1", task: { assignees: [{ devProfileId: "dev-a" }] } },
      { taskId: "t2", task: { assignees: [{ devProfileId: "dev-b" }] } },
    ],
    checkIns: [{ devProfileId: "dev-b" }],
  });
  const result = await findSilentDevsForDate(client, {
    ownerId: OWNER,
    date: PAST,
    now: PAST,
    config: ROME,
  });
  assert.deepEqual(
    result.map((r) => r.id),
    ["dev-a"]
  );
  assert.deepEqual(result[0]!.committedTaskIds, ["t1"]);
});

test("findSilentDevsForDate: empty before threshold", async () => {
  const client = makeClient({
    profiles: [DEV_A],
    commitments: [{ taskId: "t1", task: { assignees: [{ devProfileId: "dev-a" }] } }],
    checkIns: [],
  });
  const result = await findSilentDevsForDate(client, {
    ownerId: OWNER,
    date: PRE,
    now: PRE,
    config: ROME,
  });
  assert.deepEqual(result, []);
});

test("findSilentDevsForDate: scopes profile query by ownerId and isActive", async () => {
  const profileWhere: unknown[] = [];
  const client = makeClient({
    profiles: [],
    commitments: [],
    checkIns: [],
    recordCalls: { profileWhere },
  });
  await findSilentDevsForDate(client, {
    ownerId: OWNER,
    date: PAST,
    now: PAST,
    config: ROME,
  });
  assert.deepEqual(profileWhere, [{ ownerId: OWNER, isActive: true }]);
});

test("findSilentDevsForDate: flip-back (CheckIn appears, dev no longer Silent)", async () => {
  const before = makeClient({
    profiles: [DEV_A],
    commitments: [{ taskId: "t1", task: { assignees: [{ devProfileId: "dev-a" }] } }],
    checkIns: [],
  });
  const after = makeClient({
    profiles: [DEV_A],
    commitments: [{ taskId: "t1", task: { assignees: [{ devProfileId: "dev-a" }] } }],
    checkIns: [{ devProfileId: "dev-a" }],
  });
  const r1 = await findSilentDevsForDate(before, { ownerId: OWNER, date: PAST, now: PAST, config: ROME });
  const r2 = await findSilentDevsForDate(after, { ownerId: OWNER, date: PAST, now: PAST, config: ROME });
  assert.equal(r1.length, 1);
  assert.equal(r2.length, 0);
});

test("findSilentDevsForDate: dev without commitment is excluded", async () => {
  const client = makeClient({
    profiles: [DEV_A],
    commitments: [],
    checkIns: [],
  });
  const result = await findSilentDevsForDate(client, {
    ownerId: OWNER,
    date: PAST,
    now: PAST,
    config: ROME,
  });
  assert.deepEqual(result, []);
});

test("findSilentDevsForDate: archived/inactive devs are filtered by isActive=true (canonical soft-delete)", async () => {
  const profileWhere: unknown[] = [];
  const client = makeClient({
    profiles: [],
    commitments: [],
    checkIns: [],
    recordCalls: { profileWhere },
  });
  await findSilentDevsForDate(client, {
    ownerId: OWNER,
    date: PAST,
    now: PAST,
    config: ROME,
  });
  const where = profileWhere[0] as { isActive: boolean };
  assert.equal(where.isActive, true);
});

test("findSilentDevsForDate: shared task counts for every co-assignee with no check-in", async () => {
  const client = makeClient({
    profiles: [DEV_A, DEV_B],
    commitments: [
      {
        taskId: "shared",
        task: { assignees: [{ devProfileId: "dev-a" }, { devProfileId: "dev-b" }] },
      },
    ],
    checkIns: [{ devProfileId: "dev-b" }],
  });
  const result = await findSilentDevsForDate(client, {
    ownerId: OWNER,
    date: PAST,
    now: PAST,
    config: ROME,
  });
  assert.deepEqual(
    result.map((r) => r.id),
    ["dev-a"]
  );
});
