import { prisma } from "@/lib/prisma";
import { findActiveProfileByToken, profileInitials, roleLabel, seniorityLabel } from "@/lib/profile";
import { getActiveSprintForOwner } from "@/lib/sprint";
import { getTodaysTasksForDev } from "@/lib/task";
import { InvalidLinkState } from "../_components/InvalidLinkState";
import { TodayTaskList } from "../_components/TodayTaskList";
import { TodayEmptyState } from "../_components/TodayEmptyState";
import "../../sprints/sprints.css";
import "./dev.css";

export const dynamic = "force-dynamic";

function formatToday(now: Date): string {
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function firstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0]!;
}

export default async function DevDailyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const profile = await findActiveProfileByToken(prisma, token);

  if (!profile) {
    return <InvalidLinkState />;
  }

  const initials = profileInitials(profile.name);
  const now = new Date();
  const today = formatToday(now);
  const tokenPreview = `${profile.accessToken.slice(0, 4)}…${profile.accessToken.slice(-4)}`;

  const activeSprint = await getActiveSprintForOwner(prisma, profile.ownerId, now);
  const tasks = activeSprint
    ? await getTodaysTasksForDev(prisma, {
        devProfileId: profile.id,
        sprintId: activeSprint.id,
      })
    : [];
  const dateLine = activeSprint ? `${today} · ${activeSprint.name}` : today;

  return (
    <div className="oggi-scope">
      <div className="dev-shell">
        <header className="dev-header">
          <div className="brand-block">
            <span className="brand-mark">Oggi</span>
            <span className="brand-sub">Dev · Daily</span>
          </div>

          <div className="dev-identity">
            <div className="identity-text">
              <span className="identity-name">{profile.name}</span>
              <div className="identity-meta">
                <span className="identity-role">{roleLabel(profile.role)}</span>
                <span className="badge badge-accent">{seniorityLabel(profile.seniority)}</span>
              </div>
            </div>
            <div className="identity-avatar" aria-hidden="true">
              {initials}
            </div>
          </div>
        </header>

        <main className="dev-main">
          <div className="hero anim-fade-up">
            <span className="oggi-mark">Oggi</span>
            <div className="date-line">{dateLine}</div>
          </div>

          <div className="greeting anim-fade-up anim-delay-1">
            <div className="greeting-name">
              Welcome, <em>{firstName(profile.name)}</em>.
            </div>
            <div className="greeting-sub">
              This is <strong>your page</strong> - a quiet space, just for you. No login, no clutter.
              Each morning Valentina prepares what&apos;s worth your focus today, and you&apos;ll find it here.
            </div>
          </div>

          {tasks.length > 0 ? (
            <TodayTaskList tasks={tasks} />
          ) : (
            <TodayEmptyState sprintLabel={activeSprint?.name ?? null} />
          )}
        </main>

        <footer className="dev-foot">
          <span>Oggi · Dev surface</span>
          <span className="foot-token">
            <span>Your link</span>
            <span className="foot-token-value">/dev/{tokenPreview}</span>
          </span>
        </footer>
      </div>
    </div>
  );
}
