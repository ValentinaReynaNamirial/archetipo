import type { TodayTask } from "@/lib/task";

export function CommitmentLocked({
  committedTasks,
  planDateLabel,
  midDayLabel,
  committedAtLabel,
}: {
  committedTasks: TodayTask[];
  planDateLabel: string;
  midDayLabel: string;
  committedAtLabel: string | null;
}) {
  const count = committedTasks.length;
  const hasPlan = count > 0;

  return (
    <>
      <section className="anim-fade-up anim-delay-1">
        <div className="section-eyebrow" style={{ color: "var(--text-muted)" }}>
          Your daily contract · Locked
        </div>
        <h1 className="section-lede">
          {hasPlan
            ? "Mid-day check-in started - your plan is set."
            : "Mid-day check-in started - no plan was committed today."}
        </h1>
        <p className="section-sub">
          At {midDayLabel} the morning window closed.
          {hasPlan
            ? " The tasks below are the commitment you signed up for - focus on those, and use the check-in to flag anything that needs to move tomorrow."
            : " The plan opens again tomorrow morning."}
        </p>
      </section>

      <section className="anim-fade-up anim-delay-3">
        <div className="plan-panel is-locked">
          <div className="plan-head">
            <div className="plan-title-block">
              <span className="plan-eyebrow">Today&apos;s plan · {planDateLabel}</span>
              <h2 className="plan-title">Locked at {midDayLabel}</h2>
            </div>
            <span className="committed-seal locked-seal">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Locked
            </span>
          </div>

          <div className="lock-band">
            <div className="lock-glyph">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="lock-text">
              <div className="lock-title">Locked - mid-day check-in started.</div>
              <div className="lock-sub">
                Plan opens again tomorrow morning. To flag a change, use the check-in.
              </div>
            </div>
          </div>

          {hasPlan ? (
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
          ) : null}

          <div className="plan-foot">
            <span>
              {hasPlan ? (
                <>
                  <strong>
                    {count} {count === 1 ? "task" : "tasks"}
                  </strong>
                  {committedAtLabel ? ` · committed ${committedAtLabel}` : ""} · locked {midDayLabel} · read-only
                </>
              ) : (
                <>No commitment was confirmed · locked {midDayLabel}</>
              )}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Editing closed for today
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
