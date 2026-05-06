import type { PrismaClient, CheckInStatus } from "@prisma/client";
import {
  endOfDayMinutes,
  midDayMinutes,
  silentThresholdMinutes,
  type ScheduleConfig,
} from "./config/schedule";

const PARTS_TYPE = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as const;

function getMinutesInTz(now: Date, timezone: string): number {
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
  return hour * 60 + get("minute");
}

export function isCheckInOpen(now: Date, config: ScheduleConfig): boolean {
  const nowMinutes = getMinutesInTz(now, config.timezone);
  return nowMinutes >= midDayMinutes(config) && nowMinutes < endOfDayMinutes(config);
}

export function nowMinutesInOrgTz(now: Date, config: ScheduleConfig): number {
  return getMinutesInTz(now, config.timezone);
}

export type CheckInEntry = {
  taskId: string;
  status: CheckInStatus;
  note: string | null;
  submittedAt: Date;
};

export type CheckInState =
  | "pre_checkin"
  | "awaiting_checkin"
  | "silent_pending"
  | "checked_in"
  | "post_checkin";

export function mapCheckInState(
  committedTaskIds: string[],
  checkIns: CheckInEntry[],
  now: Date,
  config: ScheduleConfig
): CheckInState {
  const minutes = getMinutesInTz(now, config.timezone);
  if (minutes < midDayMinutes(config)) return "pre_checkin";
  if (minutes >= endOfDayMinutes(config)) return "post_checkin";
  if (checkIns.length > 0) return "checked_in";
  if (committedTaskIds.length === 0) return "awaiting_checkin";
  if (minutes >= silentThresholdMinutes(config)) return "silent_pending";
  return "awaiting_checkin";
}

type CheckInFinder = Pick<PrismaClient["taskCheckIn"], "findMany">;

export async function findTodayCheckIns(
  client: { taskCheckIn: CheckInFinder },
  params: { devProfileId: string; sprintDay: Date }
): Promise<CheckInEntry[]> {
  const rows = await client.taskCheckIn.findMany({
    where: {
      devProfileId: params.devProfileId,
      sprintDay: params.sprintDay,
    },
    select: {
      taskId: true,
      status: true,
      note: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: "asc" },
  });
  return rows;
}
