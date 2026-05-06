import { test } from "node:test";
import assert from "node:assert/strict";
import type { DevProfile } from "@prisma/client";
import { findActiveProfileByToken } from "./profile";

const VALID_UUID = "8f2a4c91-3d7b-4e2f-9a18-c0b6e7d34b1c";
const OTHER_UUID = "11111111-2222-4333-8444-555555555555";

function makeProfile(overrides: Partial<DevProfile> = {}): DevProfile {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    ownerId: "00000000-0000-4000-8000-000000000002",
    name: "Filippo",
    role: "frontend",
    seniority: "junior",
    accessToken: VALID_UUID,
    isActive: true,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeClient(handler: (args: { where: { accessToken: string; isActive: boolean } }) => DevProfile | null) {
  const calls: unknown[] = [];
  const client = {
    devProfile: {
      findFirst: (async (args: { where: { accessToken: string; isActive: boolean } }) => {
        calls.push(args);
        return handler(args);
      }) as never,
    },
  };
  return { client, calls };
}

test("findActiveProfileByToken returns profile for valid uuid + active row", async () => {
  const { client, calls } = makeClient(({ where }) =>
    where.accessToken === VALID_UUID && where.isActive ? makeProfile() : null
  );
  const result = await findActiveProfileByToken(client, VALID_UUID);
  assert.notEqual(result, null);
  assert.equal(result?.accessToken, VALID_UUID);
  assert.equal(calls.length, 1);
});

test("findActiveProfileByToken returns null when row is inactive (soft-deleted)", async () => {
  const { client } = makeClient(({ where }) =>
    where.accessToken === VALID_UUID && where.isActive ? null : null
  );
  const result = await findActiveProfileByToken(client, VALID_UUID);
  assert.equal(result, null);
});

test("findActiveProfileByToken returns null for unknown token", async () => {
  const { client } = makeClient(() => null);
  const result = await findActiveProfileByToken(client, OTHER_UUID);
  assert.equal(result, null);
});

test("findActiveProfileByToken returns null for malformed token without DB hit", async () => {
  const { client, calls } = makeClient(() => makeProfile());
  const result = await findActiveProfileByToken(client, "not-a-uuid");
  assert.equal(result, null);
  assert.equal(calls.length, 0);
});

test("findActiveProfileByToken returns null for empty token without DB hit", async () => {
  const { client, calls } = makeClient(() => makeProfile());
  const result = await findActiveProfileByToken(client, "");
  assert.equal(result, null);
  assert.equal(calls.length, 0);
});

test("findActiveProfileByToken returns null after token regeneration (old token no match)", async () => {
  const { client } = makeClient(({ where }) =>
    where.accessToken === OTHER_UUID && where.isActive ? makeProfile({ accessToken: OTHER_UUID }) : null
  );
  const oldResult = await findActiveProfileByToken(client, VALID_UUID);
  const newResult = await findActiveProfileByToken(client, OTHER_UUID);
  assert.equal(oldResult, null);
  assert.notEqual(newResult, null);
  assert.equal(newResult?.accessToken, OTHER_UUID);
});

test("findActiveProfileByToken always filters on isActive=true", async () => {
  let observed: { accessToken: string; isActive: boolean } | null = null;
  const { client } = makeClient(({ where }) => {
    observed = where;
    return null;
  });
  await findActiveProfileByToken(client, VALID_UUID);
  assert.notEqual(observed, null);
  assert.equal(observed!.isActive, true);
  assert.equal(observed!.accessToken, VALID_UUID);
});
