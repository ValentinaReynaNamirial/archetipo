import { test } from "node:test";
import assert from "node:assert/strict";
import type { Sprint } from "@prisma/client";
import { getActiveSprintForOwner } from "./sprint";

const OWNER = "owner-1";
const OTHER = "owner-2";

function makeSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: "sprint-1",
    name: "Sprint 14",
    startDate: new Date("2026-05-01T00:00:00.000Z"),
    endDate: new Date("2026-05-14T00:00:00.000Z"),
    ownerId: OWNER,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

type FindArgs = {
  where: {
    ownerId: string;
    startDate: { lte: Date };
    endDate: { gte: Date };
  };
};

function makeClient(handler: (args: FindArgs) => Sprint | null) {
  const calls: FindArgs[] = [];
  const client = {
    sprint: {
      findFirst: (async (args: FindArgs) => {
        calls.push(args);
        return handler(args);
      }) as never,
    },
  };
  return { client, calls };
}

test("getActiveSprintForOwner returns sprint when now is inside window", async () => {
  const sprint = makeSprint();
  const { client } = makeClient(({ where }) =>
    where.ownerId === OWNER ? sprint : null
  );
  const result = await getActiveSprintForOwner(client, OWNER, new Date("2026-05-06T12:00:00.000Z"));
  assert.equal(result?.id, "sprint-1");
});

test("getActiveSprintForOwner filters by ownerId", async () => {
  const { client, calls } = makeClient(() => null);
  await getActiveSprintForOwner(client, OTHER, new Date("2026-05-06T12:00:00.000Z"));
  assert.equal(calls[0]!.where.ownerId, OTHER);
});

test("getActiveSprintForOwner passes now as both lte/gte bound", async () => {
  const now = new Date("2026-05-06T12:00:00.000Z");
  const { client, calls } = makeClient(() => null);
  await getActiveSprintForOwner(client, OWNER, now);
  assert.equal(calls[0]!.where.startDate.lte.getTime(), now.getTime());
  assert.equal(calls[0]!.where.endDate.gte.getTime(), now.getTime());
});

test("getActiveSprintForOwner returns null when no sprint matches", async () => {
  const { client } = makeClient(() => null);
  const result = await getActiveSprintForOwner(client, OWNER, new Date("2030-01-01T00:00:00.000Z"));
  assert.equal(result, null);
});

test("getActiveSprintForOwner returns null for empty ownerId without DB hit", async () => {
  const { client, calls } = makeClient(() => makeSprint());
  const result = await getActiveSprintForOwner(client, "", new Date());
  assert.equal(result, null);
  assert.equal(calls.length, 0);
});
