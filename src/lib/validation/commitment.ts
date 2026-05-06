import { z } from "zod";

export const confirmCommitmentSchema = z.object({
  token: z.string().uuid(),
  taskIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one task."),
});

export type ConfirmCommitmentInput = z.infer<typeof confirmCommitmentSchema>;
