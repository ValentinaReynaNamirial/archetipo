"use client";

import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskRowData } from "./TaskBoard";

export function SortableTaskRow({
  task,
  position,
  total,
  onEdit,
  onDelete,
  onPositionCommit,
}: {
  task: TaskRowData;
  position: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onPositionCommit: (taskId: string, oneBasedPosition: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [draftPosition, setDraftPosition] = useState<string>(String(position));

  useEffect(() => {
    setDraftPosition(String(position));
  }, [position]);

  const MAX_VISIBLE_ASSIGNEES = 3;
  const visibleAssignees = task.assignees.slice(0, MAX_VISIBLE_ASSIGNEES);
  const overflowCount = task.assignees.length - visibleAssignees.length;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  const commit = () => {
    const parsed = Number.parseInt(draftPosition, 10);
    if (!Number.isFinite(parsed)) {
      setDraftPosition(String(position));
      return;
    }
    const clamped = Math.max(1, Math.min(total, parsed));
    setDraftPosition(String(clamped));
    if (clamped === position) return;
    onPositionCommit(task.id, clamped);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-row"
      data-testid="task-row"
      data-task-id={task.id}
    >
      <button
        type="button"
        className="drag-handle"
        title="Drag to reorder"
        aria-label={`Drag ${task.title} to reorder`}
        {...attributes}
        {...listeners}
      >
        <DragHandleIcon />
      </button>
      <div className="pos-cell">
        <input
          className="pos-input"
          type="number"
          min={1}
          max={total}
          value={draftPosition}
          aria-label={`Position of ${task.title}`}
          onChange={(e) => setDraftPosition(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            } else if (e.key === "Escape") {
              setDraftPosition(String(position));
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>
      <div>
        <div className="task-title">{task.title}</div>
        {task.description ? (
          <div className="task-desc">{task.description}</div>
        ) : (
          <div className="task-desc empty">No description</div>
        )}
        {task.rationale && (
          <div className="task-rationale" data-testid="task-rationale">
            {task.rationale}
          </div>
        )}
      </div>
      <div
        className="task-chip-list"
        style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}
      >
        {visibleAssignees.map((dev) => {
          const initials = avatarInitials(dev.name);
          const roleClass = dev.role === "frontend" ? "fe" : "be";
          const roleLabel = dev.role === "frontend" ? "FE" : "BE";
          return (
            <div className="task-chip" key={dev.id}>
              <div className={`task-chip-avatar ${roleClass}`}>{initials}</div>
              <span className="task-chip-name">{dev.name}</span>
              <span className="task-chip-role">{roleLabel}</span>
            </div>
          );
        })}
        {overflowCount > 0 && (
          <div
            className="task-chip"
            title={task.assignees
              .slice(MAX_VISIBLE_ASSIGNEES)
              .map((d) => d.name)
              .join(", ")}
          >
            <span className="task-chip-name">+{overflowCount}</span>
          </div>
        )}
      </div>
      <div className="row-actions">
        <button type="button" className="icon-btn" title="Edit" aria-label="Edit task" onClick={onEdit}>
          <EditIcon />
        </button>
        <button
          type="button"
          className="icon-btn danger"
          title="Delete"
          aria-label="Delete task"
          onClick={onDelete}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function DragHandleIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="3" cy="3" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7" cy="3" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="3" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="3" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7" cy="11" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 2l3 3-8 8H3v-3z" />
      <path d="M9 4l3 3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h10M6 4V2.5h4V4M5 4l1 10h4l1-10" />
    </svg>
  );
}
