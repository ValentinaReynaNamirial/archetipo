import type { PrismaClient } from "@prisma/client";

export type TodayTask = {
  id: string;
  title: string;
  description: string | null;
  rationale: string | null;
  position: number;
};

type TaskFinder = Pick<PrismaClient["task"], "findMany">;

export async function getTodaysTasksForDev(
  client: { task: TaskFinder },
  params: { devProfileId: string; sprintId: string }
): Promise<TodayTask[]> {
  const { devProfileId, sprintId } = params;
  if (!devProfileId || !sprintId) return [];
  const rows = await client.task.findMany({
    where: {
      sprintId,
      assignees: { some: { devProfileId } },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      rationale: true,
      position: true,
    },
  });
  return rows;
}
