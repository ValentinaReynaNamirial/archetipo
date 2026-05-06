import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDevUrl, profileInitials } from "./profile";
import { createProfileSchema, updateProfileSchema } from "./validation/profile";

test("buildDevUrl strips trailing slashes from origin", () => {
  assert.equal(
    buildDevUrl("abc", "https://oggi.app/"),
    "https://oggi.app/dev/abc"
  );
  assert.equal(
    buildDevUrl("abc", "https://oggi.app///"),
    "https://oggi.app/dev/abc"
  );
});

test("buildDevUrl encodes the token", () => {
  assert.equal(
    buildDevUrl("a/b c", "https://oggi.app"),
    "https://oggi.app/dev/a%2Fb%20c"
  );
});

test("profileInitials handles single, multi, and empty names", () => {
  assert.equal(profileInitials("Filippo"), "F");
  assert.equal(profileInitials("Filippo Gentile"), "FG");
  assert.equal(profileInitials("anna maria moretti"), "AM");
  assert.equal(profileInitials("   "), "?");
});

test("createProfileSchema rejects empty/whitespace name", () => {
  assert.equal(createProfileSchema.safeParse({ name: "   ", role: "frontend", seniority: "junior" }).success, false);
  assert.equal(createProfileSchema.safeParse({ name: "", role: "frontend", seniority: "junior" }).success, false);
});

test("createProfileSchema rejects invalid enums", () => {
  assert.equal(
    createProfileSchema.safeParse({ name: "Anna", role: "fullstack", seniority: "junior" }).success,
    false
  );
  assert.equal(
    createProfileSchema.safeParse({ name: "Anna", role: "frontend", seniority: "lead" }).success,
    false
  );
});

test("createProfileSchema accepts valid input and trims", () => {
  const parsed = createProfileSchema.safeParse({ name: "  Anna  ", role: "frontend", seniority: "senior" });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.name, "Anna");
    assert.equal(parsed.data.role, "frontend");
    assert.equal(parsed.data.seniority, "senior");
  }
});

test("updateProfileSchema rejects missing or invalid id", () => {
  assert.equal(
    updateProfileSchema.safeParse({ name: "Anna", role: "frontend", seniority: "junior" }).success,
    false
  );
  assert.equal(
    updateProfileSchema.safeParse({ id: "not-a-uuid", name: "Anna", role: "frontend", seniority: "junior" }).success,
    false
  );
});

test("updateProfileSchema strips unknown fields like accessToken", () => {
  const parsed = updateProfileSchema.safeParse({
    id: "00000000-0000-4000-8000-000000000000",
    name: "Anna",
    role: "frontend",
    seniority: "junior",
    accessToken: "attempt-to-override",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal("accessToken" in parsed.data, false);
  }
});
