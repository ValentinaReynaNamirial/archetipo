"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findActiveProfileByToken } from "@/lib/profile";
import { getActiveSprintForOwner } from "@/lib/sprint";
import { isCommitmentEditable, todayInOrgTz } from "@/lib/commitment";
import { scheduleConfig } from "@/lib/config/schedule";
import { confirmCommitmentSchema } from "@/lib/validation/commitment";

export type ConfirmCommitmentState = {
  ok: boolean;
  fieldErrors?: { taskIds?: string };
  formError?: string;
};

const NEUTRAL_ERROR = "We couldn't save your plan. Please refresh and try again.";
const LOCKED_ERROR = "Today's plan is locked - the mid-day check-in window has started.";

export async function confirmCommitmentAction(
  _prev: ConfirmCommitmentState,
  formData: FormData
): Promise<ConfirmCommitmentState> {
  const token = String(formData.get("token") ?? "");
  const taskIds = formData.getAll("taskIds").map((v) => String(v));

  const parsed = confirmCommitmentSchema.safeParse({ token, taskIds });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      fieldErrors: {
        taskIds: flat.fieldErrors.taskIds?.[0],
      },
      formError: flat.fieldErrors.token?.[0] ? NEUTRAL_ERROR : undefined,
    };
  }

  const now = new Date();
  if (!isCommitmentEditable(now, scheduleConfig)) {
    return { ok: false, formError: LOCKED_ERROR };
  }

  const profile = await findActiveProfileByToken(prisma, parsed.data.token);
  if (!profile) {
    return { ok: false, formError: NEUTRAL_ERROR };
  }

  const sprint = await getActiveSprintForOwner(prisma, profile.ownerId, now);
  if (!sprint) {
    return { ok: false, formError: NEUTRAL_ERROR };
  }

  const today = todayInOrgTz(now, scheduleConfig.timezone);

  const ownedTasks = await prisma.task.findMany({
    where: {
      id: { in: parsed.data.taskIds },
      sprintId: sprint.id,
      assignees: { some: { devProfileId: profile.id } },
    },
    select: { id: true },
  });

  if (ownedTasks.length !== parsed.data.taskIds.length) {
    return { ok: false, formError: NEUTRAL_ERROR };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.dailyCommitment.deleteMany({
        where: {
          sprintDay: today,
          task: {
            sprintId: sprint.id,
            assignees: { some: { devProfileId: profile.id } },
          },
        },
      });
      await tx.dailyCommitment.createMany({
        data: parsed.data.taskIds.map((taskId) => ({
          taskId,
          sprintDay: today,
          createdById: profile.id,
        })),
        skipDuplicates: false,
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, formError: NEUTRAL_ERROR };
    }
    throw error;
  }

  revalidatePath(`/dev/${parsed.data.token}`);
  return { ok: true };
}
