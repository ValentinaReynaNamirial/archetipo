import { prisma } from "@/lib/prisma";
import { findActiveProfileByToken, profileInitials, roleLabel, seniorityLabel } from "@/lib/profile";
import { InvalidLinkState } from "../_components/InvalidLinkState";
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
  const today = formatToday(new Date());
  const tokenPreview = `${profile.accessToken.slice(0, 4)}…${profile.accessToken.slice(-4)}`;

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
            <div className="date-line">{today}</div>
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

          <section className="anim-fade-up anim-delay-2" data-slot="today">
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
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <div className="placeholder-title">Your tasks will appear here</div>
              <div className="placeholder-text">
                When Valentina prepares your daily plan, this is where it lands.
                Come back tomorrow morning - or whenever your link lights up.
              </div>
              <div className="placeholder-meta">
                <span className="live-dot" />
                <span>Listening for today&apos;s plan</span>
              </div>
            </div>
          </section>
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
