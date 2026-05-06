import { z } from "zod";

export const CHECKIN_NOTE_MAX = 500;

const statusEnum = z.enum(["OnTrack", "Blocked", "TaskChanged"]);

export const checkInEntrySchema = z
  .object({
    taskId: z.string().uuid(),
    status: statusEnum,
    note: z.string().max(CHECKIN_NOTE_MAX).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const trimmed = value.note?.trim() ?? "";
    if (value.status !== "Blocked" && trimmed.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["note"],
        message: "Note is only allowed when status is Blocked.",
      });
    }
  })
  .transform((value) => {
    if (value.status !== "Blocked") {
      return { ...value, note: null };
    }
    const trimmed = value.note?.trim() ?? "";
    return { ...value, note: trimmed.length > 0 ? trimmed : null };
  });

export const submitCheckInSchema = z.object({
  token: z.string().uuid(),
  entries: z.array(checkInEntrySchema).min(1),
});

export type SubmitCheckInInput = z.infer<typeof submitCheckInSchema>;
export type CheckInEntryInput = z.infer<typeof checkInEntrySchema>;
