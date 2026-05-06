import { z } from "zod";

export const REORDER_MAX_TASKS = 200;

export const reorderTasksSchema = z
  .object({
    sprintId: z.string().uuid("Invalid sprint id"),
    orderedTaskIds: z
      .array(z.string().uuid("Invalid task id"))
      .min(1, "At least one task is required")
      .max(
        REORDER_MAX_TASKS,
        `At most ${REORDER_MAX_TASKS} tasks can be reordered at once`
      ),
  })
  .refine(
    (value) => new Set(value.orderedTaskIds).size === value.orderedTaskIds.length,
    { message: "Duplicate task ids are not allowed", path: ["orderedTaskIds"] }
  );

export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;

export function moveTaskToPosition(
  orderedIds: readonly string[],
  taskId: string,
  newIndex: number
): string[] {
  const currentIndex = orderedIds.indexOf(taskId);
  if (currentIndex === -1) {
    throw new Error(`Task id ${taskId} not in ordered list`);
  }

  const clamped = Math.max(0, Math.min(newIndex, orderedIds.length - 1));
  if (clamped === currentIndex) return [...orderedIds];

  const next = [...orderedIds];
  next.splice(currentIndex, 1);
  next.splice(clamped, 0, taskId);
  return next;
}

export function arraysEqualInOrder(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
