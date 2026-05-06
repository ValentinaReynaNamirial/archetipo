"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { createSprintSchema, parseDateOnly } from "@/lib/validation/sprint";

export type CreateSprintResult =
  | { ok: true; sprintId: string }
  | { ok: false; fieldErrors: Record<string, string>; formError?: string };

export async function createSprintAction(
  _prev: CreateSprintResult | null,
  formData: FormData
): Promise<CreateSprintResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, fieldErrors: {}, formError: "You must be signed in to create a sprint." };
  }

  const parsed = createSprintSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const sprint = await prisma.sprint.create({
    data: {
      name: parsed.data.name.trim(),
      startDate: parseDateOnly(parsed.data.startDate),
      endDate: parseDateOnly(parsed.data.endDate),
      ownerId: user.id,
    },
  });

  revalidatePath("/sprints");
  return { ok: true, sprintId: sprint.id };
}
