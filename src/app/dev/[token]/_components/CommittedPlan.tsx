import Link from "next/link";
import type { TodayTask } from "@/lib/task";

export function CommittedPlan({
  token,
  committedTasks,
  asideTasks,
  planDateLabel,
  midDayLabel,
  committedAtLabel,
}: {
  token: string;
  committedTasks: TodayTask[];
  asideTasks: TodayTask[];
  planDateLabel: string;
  midDayLabel: string;
  committedAtLabel: string | null;
}) {
  const count = committedTasks.length;
  return (
    <>
      <section className="anim-fade-up anim-delay-1">
        <div className="section-eyebrow">Your daily contract</div>
        <h1 className="section-lede">
          You&apos;ve committed to <em>{count} {count === 1 ? "task" : "tasks"}</em> for today.
        </h1>
        <p className="section-sub">
          This is the work you signed up for this morning. You can still update it until the
          mid-day check-in - after that, the plan locks until tomorrow.
        </p>
        <div className="window-meta anim-fade-up anim-delay-2">
          <span className="meta-dot" />
          <span>
            Editable until <strong>mid-day check-in · {midDayLabel}</strong>
          </span>
        </div>
      </section>

      <section className="anim-fade-up anim-delay-3">
        <div className="plan-panel">
          <div className="plan-head">
            <div className="plan-title-block">
              <span className="plan-eyebrow">Today&apos;s plan · {planDateLabel}</span>
              <h2 className="plan-title">
                {committedAtLabel ? `Confirmed at ${committedAtLabel}` : "Confirmed"}
              </h2>
            </div>
            <span className="committed-seal">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 6l3 3 5-5" />
              </svg>
              Committed
            </span>
          </div>

          <div className="plan-list">
            {committedTasks.map((task, index) => (
              <div key={task.id} className="plan-item">
                <div className="plan-marker">{String(index + 1).padStart(2, "0")}</div>
                <div className="plan-item-body">
                  <div className="plan-item-title">{task.title}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="plan-foot">
            <span>
              <strong>{count} {count === 1 ? "task" : "tasks"}</strong>
              {committedAtLabel ? ` · committed ${committedAtLabel}` : ""} · scope: today only
            </span>
            <Link href={`/dev/${token}?edit=1`} className="plan-edit-button">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit my plan
            </Link>
          </div>
        </div>
      </section>

      {asideTasks.length > 0 ? (
        <section className="aside-list anim-fade-up anim-delay-4">
          <div className="aside-eyebrow">
            Not in today&apos;s plan · {asideTasks.length} {asideTasks.length === 1 ? "task" : "tasks"}
          </div>
          {asideTasks.map((task, index) => (
            <div key={task.id} className="aside-row">
              <div className="aside-marker">
                {String(committedTasks.length + index + 1).padStart(2, "0")}
              </div>
              <div className="aside-title">{task.title}</div>
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}
