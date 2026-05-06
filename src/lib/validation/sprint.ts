import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const createSprintSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Sprint name is required")
      .max(120, "Sprint name must be at most 120 characters"),
    startDate: dateString,
    endDate: dateString,
  })
  .refine((data) => data.startDate < data.endDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type CreateSprintInput = z.infer<typeof createSprintSchema>;

export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
