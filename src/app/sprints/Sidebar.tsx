import Link from "next/link";

function SprintIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M2 6h12M5 1v3M11 1v3" />
    </svg>
  );
}

function BacklogIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ProfilesIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="2.5" />
      <path d="M2 14c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="5" r="2.5" />
      <circle cx="11" cy="5" r="2.5" />
      <path d="M1 13c0-2.2 2.2-4 5-4M7 13c0-2.2 2.2-4 5-4" />
    </svg>
  );
}

const managementItems: { key: "sprints" | "backlog" | "team" | "profiles"; href: string; label: string; icon: React.ReactNode }[] = [
  { key: "sprints", href: "/sprints", label: "Sprints", icon: <SprintIcon /> },
  { key: "backlog", href: "/backlog", label: "Sprint & Backlog", icon: <BacklogIcon /> },
  { key: "profiles", href: "/profiles", label: "Dev Profiles", icon: <ProfilesIcon /> },
  { key: "team", href: "/team", label: "Team Dashboard", icon: <TeamIcon /> },
];

export function Sidebar({
  active,
  userName,
  initials,
}: {
  active: "sprints" | "backlog" | "team" | "profiles";
  userName: string;
  initials: string;
}) {

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">Oggi</div>
        <div className="logo-sub">Daily Focus Tool</div>
      </div>
      <nav>
        <div className="nav-section">
          <div className="nav-label">Management</div>
          {managementItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${item.key === active ? " active" : ""}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="avatar">{initials}</div>
          <div>
            <div className="t-small" style={{ fontWeight: 500 }}>
              {userName}
            </div>
            <div className="t-tiny t-very-muted">Manager</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
