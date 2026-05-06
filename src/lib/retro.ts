import type { PrismaClient, RetroOutcome } from "@prisma/client";
import { endOfDayMinutes, type ScheduleConfig } from "./config/schedule";
import { nowMinutesInOrgTz } from "./checkin";

export type RetroEntry = {
  taskId: string;
  outcome: RetroOutcome;
  submittedAt: Date;
};

export type RetroState = "awaiting_retro" | "day_closed";

export function isRetroOpen(now: Date, config: ScheduleConfig): boolean {
  return nowMinutesInOrgTz(now, config) >= endOfDayMinutes(config);
}

export function mapRetroState(
  committedTaskIds: string[],
  retros: RetroEntry[],
  now: Date,
  config: ScheduleConfig
): RetroState | null {
  if (!isRetroOpen(now, config)) return null;
  if (committedTaskIds.length === 0) return null;
  if (retros.length > 0) return "day_closed";
  return "awaiting_retro";
}

type RetroFinder = Pick<PrismaClient["taskRetro"], "findMany">;

export async function findTodayRetros(
  client: { taskRetro: RetroFinder },
  params: { devProfileId: string; sprintDay: Date }
): Promise<RetroEntry[]> {
  const rows = await client.taskRetro.findMany({
    where: {
      devProfileId: params.devProfileId,
      sprintDay: params.sprintDay,
    },
    select: {
      taskId: true,
      outcome: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: "asc" },
  });
  return rows;
}
