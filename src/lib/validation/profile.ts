import { z } from "zod";

export const PROFILE_NAME_MAX = 120;

export const devRoleSchema = z.enum(["frontend", "backend"]);
export const devSenioritySchema = z.enum(["junior", "senior"]);

export const createProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(PROFILE_NAME_MAX, `Name must be at most ${PROFILE_NAME_MAX} characters`),
  role: devRoleSchema,
  seniority: devSenioritySchema,
});

export const updateProfileSchema = createProfileSchema.extend({
  id: z.string().uuid("Invalid profile id"),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
