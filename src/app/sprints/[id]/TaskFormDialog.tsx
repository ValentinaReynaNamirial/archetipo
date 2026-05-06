"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TASK_TITLE_MAX,
  TASK_DESCRIPTION_MAX,
  MAX_RATIONALE_LENGTH,
} from "@/lib/validation/task";
import {
  createTaskAction,
  updateTaskAction,
  type TaskActionResult,
} from "./actions";
import type { DevOption, TaskRowData } from "./TaskBoard";

const initial: TaskActionResult | null = null;

type Props = {
  mode: "create" | "edit";
  sprintId: string;
  sprintCode: string;
  sprintName: string;
  devProfiles: DevOption[];
  task?: TaskRowData;
  onClose: () => void;
};

export function TaskFormDialog({
  mode,
  sprintId,
  sprintCode,
  sprintName,
  devProfiles,
  task,
  onClose,
}: Props) {
  const router = useRouter();
  const action = mode === "create" ? createTaskAction : updateTaskAction;
  const [state, formAction] = useActionState(action, initial);
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [rationale, setRationale] = useState(task?.rationale ?? "");
  const [assignedDevIds, setAssignedDevIds] = useState<string[]>(() => {
    if (task) return task.assignees.map((a) => a.id);
    const first = devProfiles[0]?.id;
    return first ? [first] : [];
  });

  const fieldErrors = state?.ok === false ? state.fieldErrors : {};
  const titleError = fieldErrors.title;
  const assigneeError = fieldErrors.assigneeIds;
  const rationaleError = fieldErrors.rationale;
  const formError = state?.ok === false ? state.formError : undefined;
  const rationaleCount = rationale.length;
  const rationaleOver = rationaleCount > MAX_RATIONALE_LENGTH;

  useEffect(() => {
    if (state?.ok) {
      setPending(false);
      router.refresh();
      onClose();
    } else if (state) {
      setPending(false);
    }
  }, [state, router, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending, onClose]);

  const onSubmit = (formData: FormData) => {
    setPending(true);
    startTransition(() => formAction(formData));
  };

  const toggleAssignee = (id: string) => {
    setAssignedDevIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const blocking =
    !title.trim() || assignedDevIds.length === 0 || rationaleOver;

  const eyebrow =
    mode === "create" ? `New Task · ${sprintCode}` : `Edit Task · ${sprintCode}`;
  const heading = mode === "create" ? "Add to the backlog" : "Edit task";
  const subline =
    mode === "create"
      ? `It will appear at the bottom of the ${sprintName} backlog.`
      : "Changes will replace the current task data.";
  const submitLabel = mode === "create" ? "Add task" : "Save changes";
  const submitBusyLabel = mode === "create" ? "Adding…" : "Saving…";

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={() => !pending && onClose()}
    >
      <form
        className="modal"
        action={onSubmit}
        noValidate
        onClick={(e) => e.stopPropagation()}
      >
        <input type="hidden" name="sprintId" value={sprintId} />
        {mode === "edit" && task && <input type="hidden" name="id" value={task.id} />}

        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">{eyebrow}</div>
            <div className="modal-title">{heading}</div>
            <div className="t-small t-very-muted" style={{ marginTop: 4 }}>
              {subline}
            </div>
          </div>
          <button
            type="button"
            className="icon-btn-x"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="taskTitle">
              Title
            </label>
            <input
              id="taskTitle"
              name="title"
              type="text"
              className={`form-input${titleError ? " error" : ""}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to happen?"
              maxLength={TASK_TITLE_MAX}
              aria-invalid={!!titleError}
              aria-describedby={titleError ? "taskTitleError" : undefined}
              required
              autoFocus
            />
            {titleError && (
              <div className="field-error" id="taskTitleError">
                <span>{titleError}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taskDescription">
              Description <span className="optional-tag">- optional</span>
            </label>
            <textarea
              id="taskDescription"
              name="description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context, links, acceptance criteria…"
              maxLength={TASK_DESCRIPTION_MAX}
              rows={4}
            />
          </div>

          {mode === "edit" && (
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="taskRationale">
                  Priority rationale <span className="optional-tag">- optional</span>
                </label>
                <span
                  className={`char-counter${rationaleOver ? " over" : ""}`}
                  aria-live="polite"
                >
                  {rationaleCount}/{MAX_RATIONALE_LENGTH}
                </span>
              </div>
              <textarea
                id="taskRationale"
                name="rationale"
                className={`form-textarea${rationaleError || rationaleOver ? " error" : ""}`}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why is this task prioritized? Devs will see this note."
                rows={3}
                maxLength={MAX_RATIONALE_LENGTH}
                aria-invalid={!!rationaleError || rationaleOver}
                aria-describedby={rationaleError ? "taskRationaleError" : undefined}
              />
              {rationaleError && (
                <div className="field-error" id="taskRationaleError">
                  <span>{rationaleError}</span>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Assignees <span className="optional-tag">- one or more</span>
            </label>
            {assignedDevIds.map((id) => (
              <input key={id} type="hidden" name="assigneeIds" value={id} />
            ))}
            {devProfiles.length === 0 ? (
              <div className="field-error">
                <span>No active developer profiles. Create one first.</span>
              </div>
            ) : (
              <div className="assignee-options" role="group" aria-label="Assignees">
                {devProfiles.map((dev) => {
                  const initials = devInitials(dev.name);
                  const roleClass = dev.role === "frontend" ? "fe" : "be";
                  const roleLabel = dev.role === "frontend" ? "FE" : "BE";
                  const selected = assignedDevIds.includes(dev.id);
                  return (
                    <button
                      key={dev.id}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      className={`assignee-option${selected ? " selected" : ""}`}
                      onClick={() => toggleAssignee(dev.id)}
                    >
                      <div className={`opt-avatar ${roleClass}`}>{initials}</div>
                      <span className="opt-name">{dev.name}</span>
                      <span className="opt-role">{roleLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {assigneeError && (
              <div className="field-error">
                <span>{assigneeError}</span>
              </div>
            )}
          </div>

          {formError && (
            <div className="error-banner" role="alert">
              <div>
                <div className="error-banner-title">
                  {mode === "create" ? "Could not add task" : "Could not save changes"}
                </div>
                <div className="error-banner-msg">{formError}</div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={blocking || pending}>
            {pending ? submitBusyLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function devInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
