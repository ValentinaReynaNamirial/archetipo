export type AssigneeRef = { devProfileId: string };

export function isShared<T extends { assignees: readonly unknown[] }>(task: T): boolean {
  return task.assignees.length > 1;
}

export function coAssignees<T extends AssigneeRef>(
  assignees: readonly T[],
  currentDevId: string
): T[] {
  return assignees.filter((a) => a.devProfileId !== currentDevId);
}

export type EngagementKey = `${string}|${string}|${string}`;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function engagementKey(
  taskId: string,
  devProfileId: string,
  sprintDay: Date | string
): EngagementKey {
  const day = typeof sprintDay === "string" ? normalizeIsoDate(sprintDay) : toIsoDate(sprintDay);
  return `${taskId}|${devProfileId}|${day}`;
}

function normalizeIsoDate(value: string): string {
  if (!ISO_DATE_RE.test(value)) {
    throw new Error(
      `engagementKey: sprintDay string must be ISO date YYYY-MM-DD, received: ${value}`
    );
  }
  return value;
}

function toIsoDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
