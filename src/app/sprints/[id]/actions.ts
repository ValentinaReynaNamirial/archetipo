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

async function assertAssigneeUsable(
  assignedDevId: string,
  userId: string
): Promise<boolean> {
  const dev = await prisma.devProfile.findFirst({
    where: { id: assignedDevId, ownerId: userId, isActive: true },
    select: { id: true },
  });
  return dev !== null;
}

async function validateOwnershipAndAssignee(
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
  const assigneeOk = await assertAssigneeUsable(data.assignedDevId, userId);
  if (!assigneeOk) {
    return {
      ok: false,
      result: {
        ok: false,
        fieldErrors: { assignedDevId: "Selected developer is not available." },
      },
    };
  }
  return { ok: true };
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
    assignedDevId: formData.get("assignedDevId"),
    rationale: formData.get("rationale") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const validation = await validateOwnershipAndAssignee(parsed.data, user.id);
  if (!validation.ok) return validation.result;

  const task = await prisma.task.create({
    data: {
      sprintId: parsed.data.sprintId,
      assignedDevId: parsed.data.assignedDevId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      rationale: parsed.data.rationale ?? null,
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
    assignedDevId: formData.get("assignedDevId"),
    rationale: formData.get("rationale") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const validation = await validateOwnershipAndAssignee(parsed.data, user.id);
  if (!validation.ok) return validation.result;

  const result = await prisma.task.updateMany({
    where: { id: parsed.data.id, sprintId: parsed.data.sprintId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      assignedDevId: parsed.data.assignedDevId,
      rationale: parsed.data.rationale ?? null,
    },
  });

  if (result.count === 0) {
    return { ok: false, fieldErrors: {}, formError: "Task not found." };
  }

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
