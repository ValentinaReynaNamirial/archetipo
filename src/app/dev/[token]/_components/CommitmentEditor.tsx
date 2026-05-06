"use client";

import { useActionState, useMemo, useState } from "react";
import type { TodayTask } from "@/lib/task";
import { confirmCommitmentAction, type ConfirmCommitmentState } from "../actions";

const initialState: ConfirmCommitmentState = { ok: false };

function priorityClass(index: number): string {
  if (index === 0) return "priority-1";
  if (index === 1) return "priority-2";
  return "priority-3";
}

export function CommitmentEditor({
  token,
  tasks,
  initialSelection,
  midDayLabel,
  isUpdate,
}: {
  token: string;
  tasks: TodayTask[];
  initialSelection: string[];
  midDayLabel: string;
  isUpdate: boolean;
}) {
  const initialSet = useMemo(() => new Set(initialSelection), [initialSelection]);
  const [selected, setSelected] = useState<Set<string>>(initialSet);
  const [state, formAction, pending] = useActionState(confirmCommitmentAction, initialState);

  const count = selected.size;
  const fieldError = state.fieldErrors?.taskIds;
  const formError = state.formError;

  const submitLabel = isUpdate ? "Update today's plan" : "Confirm today's plan";
  const eyebrowLabel = isUpdate ? "Today's commitment · editing" : "Today's commitment";
  const ledePrefix = isUpdate ? "Update the tasks you'll" : "Pick the tasks you'll";

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <section className="anim-fade-up anim-delay-1">
        <div className="section-eyebrow">{eyebrowLabel}</div>
        <h1 className="section-lede">
          {ledePrefix} <em>actually</em> work on today.
        </h1>
        <p className="section-sub">
          One commitment, made in the morning, beats drifting through the backlog.
          Select any subset of today&apos;s tasks - at least one - and confirm in a single action.
        </p>
        <div className="window-meta anim-fade-up anim-delay-2">
          <span className="meta-dot" />
          <span>
            You can change this until <strong>mid-day check-in · {midDayLabel}</strong>
          </span>
        </div>
      </section>

      <form action={formAction} className="commitment-form">
        <input type="hidden" name="token" value={token} />

        <section className="anim-fade-up anim-delay-3">
          <div className="section-eyebrow" style={{ color: "var(--text-muted)" }}>
            Today · {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </div>

          <div className="task-list">
            {tasks.map((task, index) => {
              const isSelected = selected.has(task.id);
              const number = String(index + 1).padStart(2, "0");
              return (
                <label
                  key={task.id}
                  className={`task-row ${priorityClass(index)} ${isSelected ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    name="taskIds"
                    value={task.id}
                    checked={isSelected}
                    onChange={() => toggle(task.id)}
                    disabled={pending}
                  />
                  <div className="checkbox" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </div>
                  <div className="task-priority-num">{number}</div>
                  <div className="task-body">
                    <div className="task-title">{task.title}</div>
                    {task.description ? (
                      <div className="task-description">{task.description}</div>
                    ) : null}
                    {task.rationale ? (
                      <p className="task-rationale">{task.rationale}</p>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <div className="confirm-bar">
          <div className="confirm-inner">
            <div className="confirm-counter">
              <span className="confirm-count-num">{count}</span>
              <span className="confirm-count-label">
                {count === 0
                  ? "select at least one task"
                  : count === 1
                  ? "task selected for today"
                  : "tasks selected for today"}
              </span>
            </div>
            {fieldError ? (
              <span className="confirm-error" role="alert">
                {fieldError}
              </span>
            ) : null}
            {formError ? (
              <span className="confirm-error" role="alert">
                {formError}
              </span>
            ) : null}
            <button
              type="submit"
              className="commitment-submit"
              disabled={pending || count === 0}
            >
              {pending ? "Saving…" : submitLabel}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
