import { test } from "node:test";
import assert from "node:assert/strict";
import { getTodaysTasksForDev, type TodayTask } from "./task";

const DEV = "dev-1";
const SPRINT = "sprint-1";

type FindArgs = {
  where: {
    sprintId: string;
    assignees: { some: { devProfileId: string } };
  };
  orderBy: Array<Record<string, "asc" | "desc">>;
  select: Record<string, boolean>;
};

function makeClient(handler: (args: FindArgs) => TodayTask[]) {
  const calls: FindArgs[] = [];
  const client = {
    task: {
      findMany: (async (args: FindArgs) => {
        calls.push(args);
        return handler(args);
      }) as never,
    },
  };
  return { client, calls };
}

test("getTodaysTasksForDev filters by sprintId and devProfileId via assignees.some", async () => {
  const { client, calls } = makeClient(() => []);
  await getTodaysTasksForDev(client, { devProfileId: DEV, sprintId: SPRINT });
  const where = calls[0]!.where;
  assert.equal(where.sprintId, SPRINT);
  assert.equal(where.assignees.some.devProfileId, DEV);
});

test("getTodaysTasksForDev orders by position asc then createdAt asc", async () => {
  const { client, calls } = makeClient(() => []);
  await getTodaysTasksForDev(client, { devProfileId: DEV, sprintId: SPRINT });
  assert.deepEqual(calls[0]!.orderBy, [
    { position: "asc" },
    { createdAt: "asc" },
  ]);
});

test("getTodaysTasksForDev returns mapped rows in given order", async () => {
  const rows: TodayTask[] = [
    { id: "t1", title: "First", description: null, rationale: "Why first", position: 0 },
    { id: "t2", title: "Second", description: "Desc", rationale: null, position: 1 },
  ];
  const { client } = makeClient(() => rows);
  const result = await getTodaysTasksForDev(client, { devProfileId: DEV, sprintId: SPRINT });
  assert.deepEqual(result, rows);
});

test("getTodaysTasksForDev returns [] when no tasks match", async () => {
  const { client } = makeClient(() => []);
  const result = await getTodaysTasksForDev(client, { devProfileId: DEV, sprintId: SPRINT });
  assert.deepEqual(result, []);
});

test("getTodaysTasksForDev short-circuits when devProfileId is empty", async () => {
  const { client, calls } = makeClient(() => [
    { id: "x", title: "x", description: null, rationale: null, position: 0 },
  ]);
  const result = await getTodaysTasksForDev(client, { devProfileId: "", sprintId: SPRINT });
  assert.deepEqual(result, []);
  assert.equal(calls.length, 0);
});

test("getTodaysTasksForDev short-circuits when sprintId is empty", async () => {
  const { client, calls } = makeClient(() => [
    { id: "x", title: "x", description: null, rationale: null, position: 0 },
  ]);
  const result = await getTodaysTasksForDev(client, { devProfileId: DEV, sprintId: "" });
  assert.deepEqual(result, []);
  assert.equal(calls.length, 0);
});

test("getTodaysTasksForDev requests slim select shape", async () => {
  const { client, calls } = makeClient(() => []);
  await getTodaysTasksForDev(client, { devProfileId: DEV, sprintId: SPRINT });
  assert.deepEqual(calls[0]!.select, {
    id: true,
    title: true,
    description: true,
    rationale: true,
    position: true,
  });
});
