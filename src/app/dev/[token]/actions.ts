"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findActiveProfileByToken } from "@/lib/profile";
import { getActiveSprintForOwner } from "@/lib/sprint";
import { isCommitmentEditable, todayInOrgTz } from "@/lib/commitment";
import { isCheckInOpen } from "@/lib/checkin";
import { scheduleConfig } from "@/lib/config/schedule";
import { confirmCommitmentSchema } from "@/lib/validation/commitment";
import { submitCheckInSchema } from "@/lib/validation/checkin";

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

export type SubmitCheckInState = {
  ok: boolean;
  fieldError?: string;
  formError?: string;
};

const CHECKIN_NEUTRAL_ERROR = "We couldn't save your check-in. Please refresh and try again.";
const CHECKIN_CLOSED_ERROR = "The mid-day check-in window is not open right now.";
const CHECKIN_INCOMPLETE_ERROR = "Answer every committed task before submitting.";
const CHECKIN_ALREADY_SUBMITTED = "You've already submitted today's check-in.";

export async function submitCheckInAction(
  _prev: SubmitCheckInState,
  formData: FormData
): Promise<SubmitCheckInState> {
  const token = String(formData.get("token") ?? "");
  const payload = String(formData.get("entries") ?? "");

  let parsedEntries: unknown;
  try {
    parsedEntries = JSON.parse(payload);
  } catch {
    return { ok: false, formError: CHECKIN_NEUTRAL_ERROR };
  }

  const parsed = submitCheckInSchema.safeParse({ token, entries: parsedEntries });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const tokenErr = flat.fieldErrors.token?.[0];
    const entriesErr = flat.fieldErrors.entries?.[0];
    return {
      ok: false,
      fieldError: entriesErr,
      formError: tokenErr ? CHECKIN_NEUTRAL_ERROR : entriesErr ? undefined : CHECKIN_NEUTRAL_ERROR,
    };
  }

  const now = new Date();
  if (!isCheckInOpen(now, scheduleConfig)) {
    return { ok: false, formError: CHECKIN_CLOSED_ERROR };
  }

  const profile = await findActiveProfileByToken(prisma, parsed.data.token);
  if (!profile) {
    return { ok: false, formError: CHECKIN_NEUTRAL_ERROR };
  }

  const sprint = await getActiveSprintForOwner(prisma, profile.ownerId, now);
  if (!sprint) {
    return { ok: false, formError: CHECKIN_NEUTRAL_ERROR };
  }

  const today = todayInOrgTz(now, scheduleConfig.timezone);

  const committed = await prisma.dailyCommitment.findMany({
    where: {
      sprintDay: today,
      task: {
        sprintId: sprint.id,
        assignees: { some: { devProfileId: profile.id } },
      },
    },
    select: { taskId: true },
  });
  const committedSet = new Set(committed.map((r) => r.taskId));
  if (committedSet.size === 0) {
    return { ok: false, formError: CHECKIN_NEUTRAL_ERROR };
  }

  const entryTaskIds = parsed.data.entries.map((e) => e.taskId);
  const entrySet = new Set(entryTaskIds);
  if (
    entrySet.size !== entryTaskIds.length ||
    entrySet.size !== committedSet.size ||
    [...entrySet].some((id) => !committedSet.has(id))
  ) {
    return { ok: false, formError: CHECKIN_INCOMPLETE_ERROR };
  }

  const existing = await prisma.taskCheckIn.findFirst({
    where: {
      devProfileId: profile.id,
      sprintDay: today,
      taskId: { in: [...committedSet] },
    },
    select: { taskId: true },
  });
  if (existing) {
    return { ok: false, formError: CHECKIN_ALREADY_SUBMITTED };
  }

  try {
    await prisma.taskCheckIn.createMany({
      data: parsed.data.entries.map((e) => ({
        taskId: e.taskId,
        devProfileId: profile.id,
        sprintDay: today,
        status: e.status,
        note: e.note,
      })),
      skipDuplicates: false,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, formError: CHECKIN_ALREADY_SUBMITTED };
    }
    throw error;
  }

  revalidatePath(`/dev/${parsed.data.token}`);
  return { ok: true };
}
