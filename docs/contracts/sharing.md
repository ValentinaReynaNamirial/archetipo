# Shared-task Data Contract (US-022)

This contract is **prescriptive**: US-008..US-012 must adopt the shapes defined here. Deviating means US-022 will need a migration task to rebuild these tables.

Source of truth: `prisma/schema.prisma`. Helpers: `src/lib/sharing.ts`.

---

## Sharedness is derived

A task is shared when `task.assignees.length > 1`. There is no `isShared` flag on the `Task` model. Use `isShared(task)` from `src/lib/sharing.ts`.

This avoids the inconsistency between "task with one assignee" and "shared task reduced to one".

---

## Commitment is task-keyed (shared)

Model: `DailyCommitment` with primary key `(taskId, sprintDay)`.

- One row per task per day. All co-assignees inherit the same commitment.
- `createdById` is informative (audit / "committed by" badge), not part of the key.
- A second insert for the same `(taskId, sprintDay)` MUST fail.

**US-008 query for "today's plan" of a dev:**

```ts
prisma.dailyCommitment.findMany({
  where: {
    sprintDay: today,
    task: { assignees: { some: { devProfileId: currentDev.id } } },
  },
  include: { task: { include: { assignees: { include: { devProfile: true } } } } },
});
```

**Server-side invariant for the commit action:** a task can be committed by a dev only if that dev is in `task.assignees`.

---

## Engagement is per-dev (independent)

Three tables, all with compound primary key `(taskId, devProfileId, sprintDay)`:

| Model            | Field         | Type / enum                           |
| ---------------- | ------------- | ------------------------------------- |
| `TaskCheckIn`    | `status`      | `CheckInStatus` (OnTrack / Blocked / TaskChanged) |
| `TaskCheckIn`    | `note`        | `String?` (applicative invariant: server actions for US-009 reject `note` unless `status = Blocked`; the DB does not enforce this) |
| `TaskRetro`      | `outcome`     | `RetroOutcome` (Done / InProgress / NotStarted) |
| `TaskSilentFlag` | `flaggedAt`   | `DateTime`                            |

Rules:

- **US-009 / US-010:** a write MUST set `devProfileId = currentDev.id`. A dev cannot submit on behalf of another co-assignee.
- **Summary queries on the dev page** filter by `devProfileId = currentDev.id`. Never aggregate across co-assignees.
- **US-011 silent job:** for each `(devProfileId, taskId)` of a committed task, if no `TaskCheckIn` exists by `midDayTime + 2h`, insert a `TaskSilentFlag`. Iterate per dev — do not assume single-assignee.
- FK on `devProfile` is `Restrict` (preserve historical engagement after soft-delete). FK on `task` is `Cascade`.
- Secondary index `(devProfileId, sprintDay)` supports dev page and dashboard queries.

---

## UI hooks

### TodayTaskCard (US-007)

When `isShared(task)`:

- Show a "Shared with: …" line with chips for `coAssignees(task.assignees, currentDev.id)`.
- Show a `Users` icon (lucide-react) inline with the title.

Reuse the chip styling already introduced by US-021 in the backlog.

### Team dashboard (US-012)

One row per active dev. For each shared task in that dev's row:

- Render the `Users` icon next to the task title.
- The cell state (On Track / Blocked / Silent / Done…) is read from `TaskCheckIn` / `TaskRetro` / `TaskSilentFlag` filtered on `devProfileId = row.devId`. Never aggregated across co-assignees.

---

## Helper API (`src/lib/sharing.ts`)

- `isShared(task) => boolean` — `task.assignees.length > 1`
- `coAssignees(assignees, currentDevId) => assignees[]` — preserves input order
- `engagementKey(taskId, devProfileId, sprintDay) => string` — canonical composite key for in-memory maps and cache keys

All helpers are pure; no Prisma runtime dependency.
