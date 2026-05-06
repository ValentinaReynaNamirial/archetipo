import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { Sidebar } from "../../sprints/Sidebar";
import { ProfilesTabs } from "../ProfilesTabs";
import {
  formatProfileDate,
  profileInitials,
  roleLabel,
  seniorityLabel,
} from "@/lib/profile";
import "../../sprints/sprints.css";
import "../profiles.css";

export const dynamic = "force-dynamic";

export default async function ArchivedProfilesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [archivedProfiles, activeCount] = await Promise.all([
    prisma.devProfile.findMany({
      where: { ownerId: user.id, isActive: false },
      orderBy: { archivedAt: "desc" },
    }),
    prisma.devProfile.count({ where: { ownerId: user.id, isActive: true } }),
  ]);

  const userName = user.name ?? user.email ?? "User";
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="oggi-scope">
      <div className="app-shell">
        <Sidebar active="profiles" userName={userName} initials={initials} />
        <main className="main-content">
          <div className="page-container">
            <div className="page-header anim-fade-up">
              <div className="page-eyebrow">Team Onboarding</div>
              <h1 className="t-headline">Developer Profiles</h1>
              <div className="t-small t-very-muted" style={{ marginTop: "var(--spacing-xs)" }}>
                History of past collaborators. Read-only.
              </div>
            </div>

            <ProfilesTabs active="archived" activeCount={activeCount} archivedCount={archivedProfiles.length} />

            <div className="archived-banner anim-fade-up anim-delay-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="12" height="3" rx="1" />
                <path d="M3 6v7a1 1 0 001 1h8a1 1 0 001-1V6M6 9h4" />
              </svg>
              These profiles are inactive. Their links no longer work and they cannot be assigned to tasks. History is
              preserved for retros and reporting.
            </div>

            {archivedProfiles.length === 0 ? (
              <div className="profile-empty anim-fade-up anim-delay-3">
                <div className="t-eyebrow">Empty archive</div>
                <h2>No archived profiles.</h2>
                <p>Soft-deleted profiles will appear here.</p>
              </div>
            ) : (
              <div className="archived-list anim-fade-up anim-delay-3">
                {archivedProfiles.map((p) => (
                  <div className="archived-row" key={p.id} data-testid="archived-row">
                    <div className="archived-avatar">{profileInitials(p.name)}</div>
                    <div>
                      <div className="archived-name">{p.name}</div>
                      <div className="archived-meta">
                        <span className="badge badge-muted">{roleLabel(p.role)}</span>
                        <span className="badge badge-muted">{seniorityLabel(p.seniority)}</span>
                      </div>
                    </div>
                    <span className="url-disabled">
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3l10 10M13 3L3 13" />
                      </svg>
                      Link disabled
                    </span>
                    <div className="archived-date">
                      <small>Archived</small>
                      {p.archivedAt ? formatProfileDate(p.archivedAt) : "-"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
