"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/validation/task";
import {
  arraysEqualInOrder,
  reorderTasksSchema,
} from "@/lib/validation/task-order";
import { computeAssigneeDiff } from "@/lib/validation/task-assignees";

export type TaskActionResult =
  | { ok: true; taskId: string }
  | { ok: false; fieldErrors: Record<string, string>; formError?: string };

const UNAUTH: TaskActionResult = {
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

async function assertSprintOwnership(sprintId: string, userId: string): Promise<boolean> {
  const sprint = await prisma.sprint.findFirst({
    where: { id: sprintId, ownerId: userId },
    select: { id: true },
  });
  return sprint !== null;
}

async function assertAssigneesUsable(
  assigneeIds: readonly string[],
  userId: string
): Promise<boolean> {
  const devs = await prisma.devProfile.findMany({
    where: { id: { in: [...assigneeIds] }, ownerId: userId, isActive: true },
    select: { id: true },
  });
  return devs.length === assigneeIds.length;
}

async function validateOwnershipAndAssignees(
  data: CreateTaskInput | UpdateTaskInput,
  userId: string
): Promise<{ ok: true } | { ok: false; result: TaskActionResult }> {
  const sprintOk = await assertSprintOwnership(data.sprintId, userId);
  if (!sprintOk) {
    return {
      ok: false,
      result: { ok: false, fieldErrors: {}, formError: "Sprint not found." },
    };
  }
  const assigneesOk = await assertAssigneesUsable(data.assigneeIds, userId);
  if (!assigneesOk) {
    return {
      ok: false,
      result: {
        ok: false,
        fieldErrors: { assigneeIds: "One or more selected developers are not available." },
      },
    };
  }
  return { ok: true };
}

function readAssigneeIds(formData: FormData): string[] {
  return formData
    .getAll("assigneeIds")
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

export async function createTaskAction(
  _prev: TaskActionResult | null,
  formData: FormData
): Promise<TaskActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTH;

  const parsed = createTaskSchema.safeParse({
    sprintId: formData.get("sprintId"),
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    assigneeIds: readAssigneeIds(formData),
    rationale: formData.get("rationale") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const validation = await validateOwnershipAndAssignees(parsed.data, user.id);
  if (!validation.ok) return validation.result;

  const task = await prisma.task.create({
    data: {
      sprintId: parsed.data.sprintId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      rationale: parsed.data.rationale ?? null,
      assignees: {
        create: parsed.data.assigneeIds.map((devProfileId) => ({ devProfileId })),
      },
    },
  });

  revalidatePath(`/sprints/${parsed.data.sprintId}`);
  return { ok: true, taskId: task.id };
}

export async function updateTaskAction(
  _prev: TaskActionResult | null,
  formData: FormData
): Promise<TaskActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTH;

  const parsed = updateTaskSchema.safeParse({
    id: formData.get("id"),
    sprintId: formData.get("sprintId"),
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    assigneeIds: readAssigneeIds(formData),
    rationale: formData.get("rationale") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const validation = await validateOwnershipAndAssignees(parsed.data, user.id);
  if (!validation.ok) return validation.result;

  const existing = await prisma.task.findFirst({
    where: {
      id: parsed.data.id,
      sprintId: parsed.data.sprintId,
      sprint: { ownerId: user.id },
    },
    select: { id: true, assignees: { select: { devProfileId: true } } },
  });

  if (!existing) {
    return { ok: false, fieldErrors: {}, formError: "Task not found." };
  }

  const currentIds = existing.assignees.map((a) => a.devProfileId);
  const { toAdd, toRemove } = computeAssigneeDiff(currentIds, parsed.data.assigneeIds);

  await prisma.$transaction([
    prisma.task.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        rationale: parsed.data.rationale ?? null,
      },
    }),
    ...(toRemove.length > 0
      ? [
          prisma.taskAssignee.deleteMany({
            where: { taskId: parsed.data.id, devProfileId: { in: toRemove } },
          }),
        ]
      : []),
    ...(toAdd.length > 0
      ? [
          prisma.taskAssignee.createMany({
            data: toAdd.map((devProfileId) => ({
              taskId: parsed.data.id,
              devProfileId,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  revalidatePath(`/sprints/${parsed.data.sprintId}`);
  return { ok: true, taskId: parsed.data.id };
}

export async function deleteTaskAction(taskId: string): Promise<TaskActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTH;

  const task = await prisma.task.findFirst({
    where: { id: taskId, sprint: { ownerId: user.id } },
    select: { id: true, sprintId: true },
  });

  if (!task) {
    return { ok: false, fieldErrors: {}, formError: "Task not found." };
  }

  await prisma.task.delete({ where: { id: task.id } });

  revalidatePath(`/sprints/${task.sprintId}`);
  return { ok: true, taskId: task.id };
}

export type ReorderActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function reorderTasksAction(
  sprintId: string,
  orderedTaskIds: string[]
): Promise<ReorderActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const parsed = reorderTasksSchema.safeParse({ sprintId, orderedTaskIds });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const sprintOk = await assertSprintOwnership(parsed.data.sprintId, user.id);
  if (!sprintOk) return { ok: false, error: "Sprint not found." };

  const persisted = await prisma.task.findMany({
    where: { sprintId: parsed.data.sprintId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const persistedIds = persisted.map((t) => t.id);
  const submittedIds = parsed.data.orderedTaskIds;

  const persistedSet = new Set(persistedIds);
  const sameSize = persistedIds.length === submittedIds.length;
  const allKnown = submittedIds.every((id) => persistedSet.has(id));
  if (!sameSize || !allKnown) {
    return {
      ok: false,
      error: "Task ids do not match the sprint backlog.",
    };
  }

  if (arraysEqualInOrder(persistedIds, submittedIds)) {
    return { ok: true };
  }

  await prisma.$transaction(
    submittedIds.map((taskId, index) =>
      prisma.task.update({
        where: { id: taskId },
        data: { position: index },
      })
    )
  );

  revalidatePath(`/sprints/${parsed.data.sprintId}`);
  return { ok: true };
}
