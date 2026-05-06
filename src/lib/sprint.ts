import type { Sprint } from "@prisma/client";

export type SprintStatus = "active" | "upcoming" | "past";

export function isActiveSprint(
  sprint: Pick<Sprint, "startDate" | "endDate">,
  now: Date
): boolean {
  const nowMs = now.getTime();
  return sprint.startDate.getTime() <= nowMs && nowMs <= sprint.endDate.getTime();
}

export function getSprintStatus(
  sprint: Pick<Sprint, "startDate" | "endDate">,
  now: Date
): SprintStatus {
  const nowMs = now.getTime();
  if (nowMs < sprint.startDate.getTime()) return "upcoming";
  if (nowMs > sprint.endDate.getTime()) return "past";
  return "active";
}

export function formatSprintDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatSprintCode(index: number): string {
  return `SPR-${String(index).padStart(2, "0")}`;
}
