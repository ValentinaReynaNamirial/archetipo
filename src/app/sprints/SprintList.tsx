import Link from "next/link";
import type { Sprint } from "@prisma/client";
import { formatSprintCode, formatSprintDate, getSprintStatus } from "@/lib/sprint";

export function SprintList({ sprints, now }: { sprints: Sprint[]; now: Date }) {
  if (sprints.length === 0) {
    return (
      <div className="empty-stage anim-fade-up anim-delay-1">
        <div className="empty-card">
          <div className="empty-glyph">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 2v4M16 2v4" />
              <path d="M12 14v3M10.5 15.5h3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="page-eyebrow" style={{ marginBottom: "var(--spacing-sm)" }}>
            No sprint yet
          </div>
          <h2 className="empty-title">Define the rhythm.</h2>
          <p className="empty-subtitle">
            A sprint is the time window in which your team commits, ships, and reflects. Start by giving the next two weeks a shape.
          </p>
          <div className="hint-row">
            <span className="hint-pill">name</span>
            <span className="hint-pill">start date</span>
            <span className="hint-pill">end date</span>
          </div>
          <div className="empty-meta-row">
            <div className="empty-meta-item">
              <div className="num">0</div>
              <div className="label">Active</div>
            </div>
            <div className="empty-meta-item">
              <div className="num">0</div>
              <div className="label">Upcoming</div>
            </div>
            <div className="empty-meta-item">
              <div className="num">0</div>
              <div className="label">Past</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ascending = [...sprints].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const codeById = new Map(ascending.map((s, idx) => [s.id, formatSprintCode(idx + 1)]));

  const active = sprints.filter((s) => getSprintStatus(s, now) === "active");
  const upcoming = sprints
    .filter((s) => getSprintStatus(s, now) === "upcoming")
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const past = sprints
    .filter((s) => getSprintStatus(s, now) === "past")
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

  return (
    <>
      {active.map((sprint) => (
        <div key={sprint.id} className="active-sprint-card anim-fade-up anim-delay-1" data-testid="active-sprint">
          <div className="sprint-meta-row">
            <span className="badge badge-green badge-dot">Active</span>
            <span className="t-mono t-very-muted">{codeById.get(sprint.id)}</span>
          </div>
          <div className="flex items-center justify-between" style={{ gap: "var(--spacing-lg)", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h2 className="t-title" style={{ fontSize: "1.5rem" }}>
                <Link href={`/sprints/${sprint.id}`} className="sprint-link">
                  {sprint.name}
                </Link>
              </h2>
              <div className="sprint-dates">
                <span>{formatSprintDate(sprint.startDate)}</span>
                <span className="date-arrow">→</span>
                <span>{formatSprintDate(sprint.endDate)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {upcoming.length > 0 && (
        <>
          <div className="section-divider anim-fade-up anim-delay-2">
            <span className="label">Upcoming</span>
            <span className="line" />
            <span className="t-mono t-very-muted" style={{ fontSize: "0.6875rem" }}>
              {upcoming.length}
            </span>
          </div>
          <div className="sprint-list anim-fade-up anim-delay-2">
            {upcoming.map((sprint) => (
              <Link
                key={sprint.id}
                href={`/sprints/${sprint.id}`}
                className="sprint-row sprint-row-link"
              >
                <span className="sprint-code">{codeById.get(sprint.id)}</span>
                <div>
                  <div className="sprint-row-name">{sprint.name}</div>
                  <div className="sprint-row-dates">
                    {formatSprintDate(sprint.startDate)} → {formatSprintDate(sprint.endDate)}
                  </div>
                </div>
                <span className="badge badge-blue badge-dot">Upcoming</span>
                <span style={{ width: 30 }} />
              </Link>
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <div className="section-divider anim-fade-up anim-delay-3">
            <span className="label">Past</span>
            <span className="line" />
            <span className="t-mono t-very-muted" style={{ fontSize: "0.6875rem" }}>
              {past.length}
            </span>
          </div>
          <div className="sprint-list anim-fade-up anim-delay-3">
            {past.map((sprint, idx) => (
              <Link
                key={sprint.id}
                href={`/sprints/${sprint.id}`}
                className="sprint-row sprint-row-link"
                style={{ opacity: Math.max(0.65, 0.85 - idx * 0.05) }}
              >
                <span className="sprint-code">{codeById.get(sprint.id)}</span>
                <div>
                  <div className="sprint-row-name">{sprint.name}</div>
                  <div className="sprint-row-dates">
                    {formatSprintDate(sprint.startDate)} → {formatSprintDate(sprint.endDate)}
                  </div>
                </div>
                <span className="badge badge-muted badge-dot">Closed</span>
                <span style={{ width: 30 }} />
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
