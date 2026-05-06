import { z } from "zod";

export const TASK_TITLE_MAX = 200;
export const TASK_DESCRIPTION_MAX = 2000;
export const MAX_RATIONALE_LENGTH = 500;

const rationaleField = z
  .string()
  .max(MAX_RATIONALE_LENGTH, `Rationale must be at most ${MAX_RATIONALE_LENGTH} characters`)
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

export const createTaskSchema = z.object({
  sprintId: z.string().uuid("Invalid sprint id"),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(TASK_TITLE_MAX, `Title must be at most ${TASK_TITLE_MAX} characters`),
  description: z
    .string()
    .max(TASK_DESCRIPTION_MAX, `Description must be at most ${TASK_DESCRIPTION_MAX} characters`)
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    }),
  assignedDevId: z.string().uuid("Assignee is required"),
  rationale: rationaleField,
});

export const updateTaskSchema = createTaskSchema.extend({
  id: z.string().uuid("Invalid task id"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
