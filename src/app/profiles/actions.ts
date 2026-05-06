"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { createProfileSchema, updateProfileSchema } from "@/lib/validation/profile";

export type ProfileActionResult =
  | { ok: true; profileId: string }
  | { ok: false; fieldErrors: Record<string, string>; formError?: string };

const UNAUTH: ProfileActionResult = {
  ok: false,
  fieldErrors: {},
  formError: "You must be signed in.",
};

function fieldErrorsFromZod(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function createProfileAction(
  _prev: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTH;

  const parsed = createProfileSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    seniority: formData.get("seniority"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const profile = await createWithUniqueToken(user.id, parsed.data);
  revalidatePath("/profiles");
  return { ok: true, profileId: profile.id };
}

export async function updateProfileAction(
  _prev: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTH;

  const parsed = updateProfileSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    role: formData.get("role"),
    seniority: formData.get("seniority"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const result = await prisma.devProfile.updateMany({
    where: { id: parsed.data.id, ownerId: user.id },
    data: {
      name: parsed.data.name.trim(),
      role: parsed.data.role,
      seniority: parsed.data.seniority,
    },
  });

  if (result.count === 0) {
    return { ok: false, fieldErrors: {}, formError: "Profile not found." };
  }

  revalidatePath("/profiles");
  return { ok: true, profileId: parsed.data.id };
}

export async function softDeleteProfileAction(profileId: string): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTH;

  const result = await prisma.devProfile.updateMany({
    where: { id: profileId, ownerId: user.id, isActive: true },
    data: { isActive: false, archivedAt: new Date() },
  });

  if (result.count === 0) {
    return { ok: false, fieldErrors: {}, formError: "Profile not found." };
  }

  revalidatePath("/profiles");
  revalidatePath("/profiles/archived");
  return { ok: true, profileId };
}

export async function regenerateTokenAction(profileId: string): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTH;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await prisma.devProfile.updateMany({
        where: { id: profileId, ownerId: user.id, isActive: true },
        data: { accessToken: randomUUID() },
      });
      if (result.count === 0) {
        return { ok: false, fieldErrors: {}, formError: "Profile not found." };
      }
      revalidatePath("/profiles");
      return { ok: true, profileId };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt === 0
      ) {
        continue;
      }
      throw err;
    }
  }

  return { ok: false, fieldErrors: {}, formError: "Failed to regenerate token." };
}

async function createWithUniqueToken(
  ownerId: string,
  data: { name: string; role: "frontend" | "backend"; seniority: "junior" | "senior" }
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await prisma.devProfile.create({
        data: {
          ownerId,
          name: data.name.trim(),
          role: data.role,
          seniority: data.seniority,
          accessToken: randomUUID(),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt === 0
      ) {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to allocate a unique access token.");
}
