import type { CheckInStatus } from "@prisma/client";
import type { TodayTask } from "@/lib/task";
import type { CheckInEntry } from "@/lib/checkin";

const STATUS_LABEL: Record<CheckInStatus, string> = {
  OnTrack: "On Track",
  Blocked: "Blocked",
  TaskChanged: "Task Changed",
};

const STATUS_BADGE_CLASS: Record<CheckInStatus, string> = {
  OnTrack: "badge badge-green badge-dot summary-badge",
  Blocked: "badge badge-red badge-dot summary-badge",
  TaskChanged: "badge badge-muted badge-dot summary-badge",
};

export function CheckInSummary({
  committedTasks,
  checkIns,
  devFirstName,
  submittedTimeLabel,
  submittedDateLabel,
}: {
  committedTasks: TodayTask[];
  checkIns: CheckInEntry[];
  devFirstName: string;
  submittedTimeLabel: string;
  submittedDateLabel: string;
}) {
  const byTaskId = new Map(checkIns.map((c) => [c.taskId, c] as const));

  return (
    <>
      <div className="checkin-intro anim-fade-up anim-delay-1">
        <div className="checkin-eyebrow">Mid-day check-in</div>
        <div className="checkin-title">
          Thanks, <em>{devFirstName}</em>.
        </div>
        <p className="checkin-sub">
          Your pulse is in. <strong>Valentina has the picture</strong> - no follow-up needed unless something shifts.
          Come back tomorrow morning for the next plan.
        </p>
      </div>

      <div className="summary-header anim-fade-up anim-delay-2">
        <span className="summary-header-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        </span>
        <div className="summary-header-text">
          <div className="summary-header-title">Mid-day check-in submitted</div>
          <div className="summary-header-time">
            at <strong>{submittedTimeLabel}</strong> · {submittedDateLabel}
          </div>
        </div>
      </div>

      <section className="summary-list anim-fade-up anim-delay-2">
        {committedTasks.map((task, index) => {
          const entry = byTaskId.get(task.id);
          if (!entry) return null;
          const number = String(index + 1).padStart(2, "0");
          return (
            <article key={task.id} className="summary-row">
              <div className="summary-row-head">
                <div className="summary-row-num">{number}</div>
                <div className="summary-row-title">{task.title}</div>
                <span className={STATUS_BADGE_CLASS[entry.status]}>
                  {STATUS_LABEL[entry.status]}
                </span>
              </div>
              {entry.status === "Blocked" && entry.note ? (
                <div className="summary-blocker-note">
                  <span className="summary-blocker-note-label">Blocker note</span>
                  {entry.note}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </>
  );
}
