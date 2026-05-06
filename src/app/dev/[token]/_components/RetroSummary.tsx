import type { RetroOutcome } from "@prisma/client";
import type { TodayTask } from "@/lib/task";
import type { RetroEntry } from "@/lib/retro";

const OUTCOME_LABEL: Record<RetroOutcome, string> = {
  Done: "Done",
  InProgress: "In Progress",
  NotStarted: "Not Started",
};

const OUTCOME_BADGE_CLASS: Record<RetroOutcome, string> = {
  Done: "badge badge-green badge-dot outcome-badge",
  InProgress: "badge badge-yellow badge-dot outcome-badge",
  NotStarted: "badge badge-muted badge-dot outcome-badge",
};

export function RetroSummary({
  committedTasks,
  retros,
  devFirstName,
  closedTimeLabel,
  closedDateLabel,
}: {
  committedTasks: TodayTask[];
  retros: RetroEntry[];
  devFirstName: string;
  closedTimeLabel: string;
  closedDateLabel: string;
}) {
  const byTaskId = new Map(retros.map((r) => [r.taskId, r] as const));

  return (
    <>
      <div className="retro-intro anim-fade-up anim-delay-1">
        <div className="retro-eyebrow">End-of-day retrospective</div>
        <div className="retro-title">
          Day closed, <em>{devFirstName}</em>.
        </div>
        <p className="retro-sub">
          Your outcomes are saved and shared with Valentina.{" "}
          <strong>This day is now read-only</strong> - outcomes can&apos;t be edited after submission. See you tomorrow morning.
        </p>
      </div>

      <div className="closed-header anim-fade-up anim-delay-2">
        <span className="closed-header-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <div className="closed-header-text">
          <div className="closed-header-title">
            Day closed at <strong>{closedTimeLabel}</strong>
          </div>
          <div className="closed-header-time">{closedDateLabel}</div>
        </div>
        <span className="closed-lock" aria-label="Read-only">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Read-only
        </span>
      </div>

      <section className="outcome-list anim-fade-up anim-delay-2">
        {committedTasks.map((task, index) => {
          const entry = byTaskId.get(task.id);
          if (!entry) return null;
          const number = String(index + 1).padStart(2, "0");
          return (
            <article key={task.id} className="outcome-row">
              <div className="outcome-row-head">
                <div className="outcome-row-num">{number}</div>
                <div className="outcome-row-title">{task.title}</div>
                <span className={OUTCOME_BADGE_CLASS[entry.outcome]}>
                  {OUTCOME_LABEL[entry.outcome]}
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
