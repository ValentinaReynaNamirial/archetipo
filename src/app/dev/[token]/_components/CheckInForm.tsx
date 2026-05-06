"use client";

import { useActionState, useMemo, useState } from "react";
import type { TodayTask } from "@/lib/task";
import { CHECKIN_NOTE_MAX } from "@/lib/validation/checkin";
import { submitCheckInAction, type SubmitCheckInState } from "../actions";

type StatusKey = "OnTrack" | "Blocked" | "TaskChanged";

const initialState: SubmitCheckInState = { ok: false };

const STATUS_OPTIONS: ReadonlyArray<{
  value: StatusKey;
  label: string;
  dataStatus: "ontrack" | "blocked" | "changed";
}> = [
  { value: "OnTrack", label: "On Track", dataStatus: "ontrack" },
  { value: "Blocked", label: "Blocked", dataStatus: "blocked" },
  { value: "TaskChanged", label: "Task Changed", dataStatus: "changed" },
];

type RowState = { status: StatusKey | null; note: string };

export function CheckInForm({
  token,
  committedTasks,
  devFirstName,
}: {
  token: string;
  committedTasks: TodayTask[];
  devFirstName: string;
}) {
  const initial = useMemo<Record<string, RowState>>(() => {
    const map: Record<string, RowState> = {};
    for (const t of committedTasks) map[t.id] = { status: null, note: "" };
    return map;
  }, [committedTasks]);

  const [rows, setRows] = useState<Record<string, RowState>>(initial);
  const [state, formAction, pending] = useActionState(submitCheckInAction, initialState);

  const answeredCount = Object.values(rows).filter((r) => r.status !== null).length;
  const total = committedTasks.length;
  const allAnswered = answeredCount === total;

  function setStatus(taskId: string, status: StatusKey) {
    setRows((prev) => ({
      ...prev,
      [taskId]: {
        status,
        note: status === "Blocked" ? prev[taskId]?.note ?? "" : "",
      },
    }));
  }

  function setNote(taskId: string, note: string) {
    setRows((prev) => ({
      ...prev,
      [taskId]: { status: prev[taskId]?.status ?? null, note },
    }));
  }

  const entriesPayload = JSON.stringify(
    committedTasks
      .filter((t) => rows[t.id]?.status !== null)
      .map((t) => ({
        taskId: t.id,
        status: rows[t.id]!.status,
        note: rows[t.id]!.status === "Blocked" ? rows[t.id]!.note : null,
      }))
  );

  return (
    <>
      <div className="checkin-intro anim-fade-up anim-delay-1">
        <div className="checkin-eyebrow">Mid-day check-in</div>
        <div className="checkin-title">
          A quick pulse, <em>{devFirstName}</em>.
        </div>
        <p className="checkin-sub">
          Where do your committed tasks stand right now? <strong>One status each</strong> -
          no meeting, no formality. If something&apos;s blocked, leave a line so Valentina knows what got in the way.
        </p>
      </div>

      {state.formError ? (
        <div className="checkin-error" role="alert">
          <span className="checkin-error-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </span>
          <div className="checkin-error-body">
            <div className="checkin-error-title">Check-in not saved</div>
            <div className="checkin-error-msg">{state.formError}</div>
          </div>
        </div>
      ) : null}

      <form action={formAction} className="checkin-form anim-fade-up anim-delay-2" noValidate>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="entries" value={entriesPayload} />

        {committedTasks.map((task, index) => {
          const row = rows[task.id] ?? { status: null, note: "" };
          const number = String(index + 1).padStart(2, "0");
          const isAnswered = row.status !== null;
          const showNote = row.status === "Blocked";
          return (
            <div
              key={task.id}
              className={`checkin-row${isAnswered ? " is-answered" : ""}`}
            >
              <div className="checkin-row-head">
                <div className="checkin-row-num">{number}</div>
                <div className="checkin-row-title-block">
                  <div className="checkin-row-title">{task.title}</div>
                </div>
              </div>

              <div
                className="status-group"
                role="radiogroup"
                aria-label={`Status for task ${number}`}
              >
                {STATUS_OPTIONS.map((opt) => {
                  const selected = row.status === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`status-option${selected ? " is-selected" : ""}`}
                      data-status={opt.dataStatus}
                    >
                      <input
                        type="radio"
                        name={`status-${task.id}`}
                        value={opt.value}
                        checked={selected}
                        onChange={() => setStatus(task.id, opt.value)}
                        disabled={pending}
                      />
                      <span className="status-dot" />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>

              {showNote ? (
                <div className="blocker-note">
                  <span className="blocker-note-label">What&apos;s blocking</span>
                  <textarea
                    className="blocker-textarea"
                    name={`note-${task.id}`}
                    maxLength={CHECKIN_NOTE_MAX}
                    placeholder="A short note for Valentina - what you need to move forward."
                    value={row.note}
                    onChange={(e) => setNote(task.id, e.target.value)}
                    disabled={pending}
                  />
                  <span className="char-counter">
                    <strong>{row.note.length}</strong> / {CHECKIN_NOTE_MAX}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="submit-bar">
          <span className="submit-meta">
            <strong>{answeredCount}</strong> of {total} answered
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
            {pending ? "Submitting…" : "Submit check-in"}
          </button>
        </div>
      </form>
    </>
  );
}
