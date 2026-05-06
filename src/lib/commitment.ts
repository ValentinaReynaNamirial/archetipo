import type { PrismaClient } from "@prisma/client";
import type { ScheduleConfig } from "./config/schedule";

const PARTS_TYPE = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as const;

function getPartsInTz(now: Date, timezone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    ...PARTS_TYPE,
    timeZone: timezone,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => {
    const p = parts.find((x) => x.type === type);
    if (!p) throw new Error(`Missing ${type} part for timezone ${timezone}`);
    return Number.parseInt(p.value, 10);
  };
  let hour = get("hour");
  if (hour === 24) hour = 0;
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
  };
}

export function todayInOrgTz(now: Date, timezone: string): Date {
  const { year, month, day } = getPartsInTz(now, timezone);
  return new Date(Date.UTC(year, month - 1, day));
}

export function isCommitmentEditable(now: Date, config: ScheduleConfig): boolean {
  const { hour, minute } = getPartsInTz(now, config.timezone);
  const nowMinutes = hour * 60 + minute;
  const cutoff = config.midDayHour * 60 + config.midDayMinute;
  return nowMinutes < cutoff;
}

export type CommitmentState = "editor" | "editable" | "locked";

export type TodayCommitmentSummary = {
  taskIds: string[];
  firstCommittedAt: Date | null;
};

export function mapCommitmentState(
  commitment: TodayCommitmentSummary | null,
  now: Date,
  config: ScheduleConfig
): CommitmentState {
  const editable = isCommitmentEditable(now, config);
  if (!editable) return "locked";
  if (!commitment || commitment.taskIds.length === 0) return "editor";
  return "editable";
}

type CommitmentFinder = Pick<PrismaClient["dailyCommitment"], "findMany">;

export async function findTodayCommitmentForDev(
  client: { dailyCommitment: CommitmentFinder },
  params: { devProfileId: string; sprintId: string; today: Date }
): Promise<TodayCommitmentSummary> {
  const rows = await client.dailyCommitment.findMany({
    where: {
      sprintDay: params.today,
      task: {
        sprintId: params.sprintId,
        assignees: { some: { devProfileId: params.devProfileId } },
      },
    },
    orderBy: { createdAt: "asc" },
    select: { taskId: true, createdAt: true },
  });
  return {
    taskIds: rows.map((r) => r.taskId),
    firstCommittedAt: rows.length > 0 ? rows[0]!.createdAt : null,
  };
}

export function formatTimeInTz(date: Date, timezone: string): string {
  const { hour, minute } = getPartsInTz(date, timezone);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatPlanDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}
