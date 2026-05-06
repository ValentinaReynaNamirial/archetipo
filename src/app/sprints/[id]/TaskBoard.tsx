"use client";

import { useState } from "react";
import type { DevRole } from "@prisma/client";
import { TaskFormDialog } from "./TaskFormDialog";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { SortableTaskList } from "./SortableTaskList";

export type DevOption = {
  id: string;
  name: string;
  role: DevRole;
};

export type TaskRowData = {
  id: string;
  title: string;
  description: string | null;
  rationale: string | null;
  assignees: DevOption[];
};

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; task: TaskRowData }
  | { kind: "delete"; task: TaskRowData }
  | null;

export function TaskBoard({
  sprintId,
  sprintCode,
  sprintName,
  statusLabel,
  statusBadgeClass,
  statusBadgeLabel,
  startDate,
  endDate,
  remainingDays,
  taskCount,
  assigneeCount,
  tasks,
  devProfiles,
}: {
  sprintId: string;
  sprintCode: string;
  sprintName: string;
  statusLabel: string;
  statusBadgeClass: string;
  statusBadgeLabel: string;
  startDate: string;
  endDate: string;
  remainingDays: number | null;
  taskCount: number;
  assigneeCount: number;
  tasks: TaskRowData[];
  devProfiles: DevOption[];
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);

  const canCreate = devProfiles.length > 0;

  return (
    <>
      <div
        className="page-header anim-fade-up"
        style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "var(--spacing-lg)" }}
      >
        <div className="page-eyebrow">{statusLabel}</div>
        <div className="flex items-center justify-between">
          <h1 className="t-headline">{sprintName}</h1>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setDialog({ kind: "create" })}
            disabled={!canCreate}
            title={canCreate ? undefined : "Create a developer profile first"}
          >
            <PlusIcon />
            New task
          </button>
        </div>
      </div>

      <div className="sprint-strip anim-fade-up anim-delay-1">
        <div
          className="flex items-center justify-between"
          style={{ gap: "var(--spacing-lg)", flexWrap: "wrap" }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="sprint-strip-meta">
              <span className={statusBadgeClass}>{statusBadgeLabel}</span>
              <span className="t-mono t-very-muted">{sprintCode}</span>
            </div>
            <div className="strip-dates">
              <span>{startDate}</span>
              <span className="arrow">→</span>
              <span>{endDate}</span>
              {remainingDays !== null && (
                <>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ color: "var(--accent-light)" }}>
                    {remainingDays} {remainingDays === 1 ? "day" : "days"} remaining
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="stat-cluster">
            <div>
              <div className="num" style={{ color: "var(--accent-light)" }}>
                {taskCount}
              </div>
              <div className="lab">Tasks</div>
            </div>
            <div>
              <div className="num">{assigneeCount}</div>
              <div className="lab">Devs</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider anim-fade-up anim-delay-2">
        <span className="label">Backlog</span>
        <span className="line" />
        <span className="t-mono t-very-muted" style={{ fontSize: "0.6875rem" }}>
          {taskCount}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-backlog anim-fade-up anim-delay-2" data-testid="empty-backlog">
          <h3>No tasks yet</h3>
          <p>
            {canCreate
              ? "Add the first task to give the sprint its shape."
              : "Create a developer profile first, then start filling the backlog."}
          </p>
          {canCreate && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setDialog({ kind: "create" })}
            >
              <PlusIcon />
              Add the first task
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="reorder-hint anim-fade-up anim-delay-2">
            <DotsIcon />
            <span>Drag the handle to reorder</span>
            <span className="dot">·</span>
            <span>or type a number in the position box</span>
          </div>
          <SortableTaskList
            sprintId={sprintId}
            tasks={tasks}
            onEdit={(task) => setDialog({ kind: "edit", task })}
            onDelete={(task) => setDialog({ kind: "delete", task })}
          />
        </>
      )}

      {tasks.length > 0 && canCreate && (
        <button
          type="button"
          className="add-launcher anim-fade-up anim-delay-3"
          onClick={() => setDialog({ kind: "create" })}
        >
          <span className="flex items-center gap-sm">
            <span className="plus">
              <PlusIcon size={10} strokeWidth={2.4} />
            </span>
            Add another task to the backlog
          </span>
          <span style={{ fontSize: "0.6875rem" }}>⏎</span>
        </button>
      )}

      {dialog?.kind === "create" && (
        <TaskFormDialog
          mode="create"
          sprintId={sprintId}
          sprintCode={sprintCode}
          sprintName={sprintName}
          devProfiles={devProfiles}
          onClose={close}
        />
      )}

      {dialog?.kind === "edit" && (
        <TaskFormDialog
          mode="edit"
          sprintId={sprintId}
          sprintCode={sprintCode}
          sprintName={sprintName}
          devProfiles={devProfiles}
          task={dialog.task}
          onClose={close}
        />
      )}

      {dialog?.kind === "delete" && (
        <DeleteTaskDialog task={dialog.task} onClose={close} />
      )}
    </>
  );
}

function PlusIcon({ size = 12, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="4" r="1" />
      <circle cx="10" cy="4" r="1" />
      <circle cx="6" cy="8" r="1" />
      <circle cx="10" cy="8" r="1" />
      <circle cx="6" cy="12" r="1" />
      <circle cx="10" cy="12" r="1" />
    </svg>
  );
}
