import type { PrismaClient } from "@prisma/client";
import { silentThresholdMinutes, type ScheduleConfig } from "./config/schedule";
import { nowMinutesInOrgTz } from "./checkin";
import { todayInOrgTz } from "./commitment";

export function isSilent(
  committedTaskIds: readonly string[],
  checkIns: readonly unknown[],
  now: Date,
  config: ScheduleConfig
): boolean {
  if (committedTaskIds.length === 0) return false;
  if (checkIns.length > 0) return false;
  return nowMinutesInOrgTz(now, config) >= silentThresholdMinutes(config);
}

type SilentDevsClient = {
  devProfile: Pick<PrismaClient["devProfile"], "findMany">;
  dailyCommitment: Pick<PrismaClient["dailyCommitment"], "findMany">;
  taskCheckIn: Pick<PrismaClient["taskCheckIn"], "findMany">;
};

export type SilentDev = {
  id: string;
  ownerId: string;
  name: string;
  committedTaskIds: string[];
};

export async function findSilentDevsForDate(
  client: SilentDevsClient,
  params: { ownerId: string; date: Date; now: Date; config: ScheduleConfig }
): Promise<SilentDev[]> {
  const { ownerId, date, now, config } = params;
  if (nowMinutesInOrgTz(now, config) < silentThresholdMinutes(config)) return [];

  const sprintDay = todayInOrgTz(date, config.timezone);

  const profiles = await client.devProfile.findMany({
    where: { ownerId, isActive: true },
    select: { id: true, ownerId: true, name: true },
  });
  if (profiles.length === 0) return [];

  const profileIds = profiles.map((p) => p.id);

  const commitments = await client.dailyCommitment.findMany({
    where: {
      sprintDay,
      task: {
        assignees: { some: { devProfileId: { in: profileIds } } },
      },
    },
    select: {
      taskId: true,
      task: {
        select: {
          assignees: { select: { devProfileId: true } },
        },
      },
    },
  });

  const committedByDev = new Map<string, string[]>();
  for (const row of commitments) {
    for (const a of row.task.assignees) {
      if (!profileIds.includes(a.devProfileId)) continue;
      const list = committedByDev.get(a.devProfileId) ?? [];
      list.push(row.taskId);
      committedByDev.set(a.devProfileId, list);
    }
  }

  const checkIns = await client.taskCheckIn.findMany({
    where: { sprintDay, devProfileId: { in: profileIds } },
    select: { devProfileId: true },
  });
  const checkInsByDev = new Map<string, { devProfileId: string }[]>();
  for (const c of checkIns) {
    const list = checkInsByDev.get(c.devProfileId) ?? [];
    list.push(c);
    checkInsByDev.set(c.devProfileId, list);
  }

  return profiles
    .filter((p) => {
      const committed = committedByDev.get(p.id) ?? [];
      const submitted = checkInsByDev.get(p.id) ?? [];
      return isSilent(committed, submitted, now, config);
    })
    .map((p) => ({
      id: p.id,
      ownerId: p.ownerId,
      name: p.name,
      committedTaskIds: committedByDev.get(p.id) ?? [],
    }));
}
