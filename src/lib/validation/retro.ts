import { z } from "zod";

export const retroOutcomeEnum = z.enum(["Done", "InProgress", "NotStarted"]);

export const retroEntrySchema = z.object({
  taskId: z.string().uuid(),
  outcome: retroOutcomeEnum,
});

export const submitRetroSchema = z.object({
  token: z.string().uuid(),
  entries: z.array(retroEntrySchema).min(1),
});

export type SubmitRetroInput = z.infer<typeof submitRetroSchema>;
export type RetroEntryInput = z.infer<typeof retroEntrySchema>;
