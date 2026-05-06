export function TodayEmptyState({ sprintLabel }: { sprintLabel?: string | null }) {
  return (
    <section className="anim-fade-up anim-delay-2">
      <div className="placeholder-eyebrow">Today</div>

      <div className="placeholder-card">
        <div className="placeholder-glyph">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 12.5l2.5 2.5 4.5-5" />
          </svg>
        </div>
        <div className="placeholder-title">No tasks for today</div>
        <div className="placeholder-text">
          Valentina hasn&apos;t assigned anything to you in the active sprint.
          When she does, it&apos;ll appear here in priority order, with her notes attached.
        </div>
        <div className="placeholder-meta">
          <span className="live-dot" />
          <span>{sprintLabel ? `${sprintLabel} · listening` : "Listening for today's plan"}</span>
        </div>
      </div>
    </section>
  );
}
