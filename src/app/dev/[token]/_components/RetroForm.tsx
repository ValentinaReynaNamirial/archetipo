"use client";

import { useActionState, useMemo, useState } from "react";
import type { TodayTask } from "@/lib/task";
import { submitRetroAction, type SubmitRetroState } from "../actions";

type OutcomeKey = "Done" | "InProgress" | "NotStarted";

const initialState: SubmitRetroState = { ok: false };

const OUTCOME_OPTIONS: ReadonlyArray<{
  value: OutcomeKey;
  label: string;
  dataOutcome: "done" | "progress" | "not";
  glyph: string;
}> = [
  { value: "Done", label: "Done", dataOutcome: "done", glyph: "✓" },
  { value: "InProgress", label: "In Progress", dataOutcome: "progress", glyph: "◑" },
  { value: "NotStarted", label: "Not Started", dataOutcome: "not", glyph: "○" },
];

export function RetroForm({
  token,
  committedTasks,
  devFirstName,
}: {
  token: string;
  committedTasks: TodayTask[];
  devFirstName: string;
}) {
  const initial = useMemo<Record<string, OutcomeKey | null>>(() => {
    const map: Record<string, OutcomeKey | null> = {};
    for (const t of committedTasks) map[t.id] = null;
    return map;
  }, [committedTasks]);

  const [rows, setRows] = useState<Record<string, OutcomeKey | null>>(initial);
  const [state, formAction, pending] = useActionState(submitRetroAction, initialState);

  const answeredCount = Object.values(rows).filter((v) => v !== null).length;
  const total = committedTasks.length;
  const allAnswered = answeredCount === total;

  function setOutcome(taskId: string, outcome: OutcomeKey) {
    setRows((prev) => ({ ...prev, [taskId]: outcome }));
  }

  const entriesPayload = JSON.stringify(
    committedTasks
      .filter((t) => rows[t.id] !== null)
      .map((t) => ({ taskId: t.id, outcome: rows[t.id] }))
  );

  return (
    <>
      <div className="retro-intro anim-fade-up anim-delay-1">
        <div className="retro-eyebrow">End-of-day retrospective</div>
        <div className="retro-title">
          How did today land, <em>{devFirstName}</em>?
        </div>
        <p className="retro-sub">
          Mark each task you committed to this morning with an honest outcome.{" "}
          <strong>Done, In Progress, or Not Started</strong> - one per task.
          Once submitted, the day is closed and outcomes can&apos;t be edited.
        </p>
      </div>

      {state.formError ? (
        <div className="retro-error" role="alert">
          <span className="retro-error-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </span>
          <div>
            <div className="retro-error-title">Retrospective not saved</div>
            <div className="retro-error-msg">{state.formError}</div>
          </div>
        </div>
      ) : null}

      <form action={formAction} className="retro-form anim-fade-up anim-delay-2" noValidate>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="entries" value={entriesPayload} />

        {committedTasks.map((task, index) => {
          const selected = rows[task.id] ?? null;
          const number = String(index + 1).padStart(2, "0");
          const isAnswered = selected !== null;
          return (
            <div
              key={task.id}
              className={`retro-row${isAnswered ? " is-answered" : ""}`}
            >
              <div className="retro-row-head">
                <div className="retro-row-num">{number}</div>
                <div className="retro-row-title-block">
                  <div className="retro-row-title">{task.title}</div>
                </div>
              </div>

              <div
                className="outcome-group"
                role="radiogroup"
                aria-label={`Outcome for task ${number}`}
              >
                {OUTCOME_OPTIONS.map((opt) => {
                  const isSelected = selected === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`outcome-option${isSelected ? " is-selected" : ""}`}
                      data-outcome={opt.dataOutcome}
                    >
                      <input
                        type="radio"
                        name={`outcome-${task.id}`}
                        value={opt.value}
                        checked={isSelected}
                        onChange={() => setOutcome(task.id, opt.value)}
                        disabled={pending}
                      />
                      <span className="outcome-glyph">{opt.glyph}</span>
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="submit-bar">
          <span className="submit-meta">
            <strong>{answeredCount}</strong> of {total} marked
          </span>
          {!allAnswered && state.fieldError ? (
            <span className="confirm-error" role="alert">
              {state.fieldError}
            </span>
          ) : null}
          <button
            type="submit"
            className="btn btn-primary btn-lg commitment-submit"
            disabled={pending || !allAnswered}
          >
            {pending ? "Submitting…" : "Submit retrospective"}
          </button>
        </div>
      </form>
    </>
  );
}
