import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { Sidebar } from "../sprints/Sidebar";
import "../sprints/sprints.css";
import "./profiles.css";
import { ProfileForm } from "./ProfileForm";
import { ProfileList } from "./ProfileList";
import { ProfilesTabs } from "./ProfilesTabs";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [activeProfiles, archivedCount] = await Promise.all([
    prisma.devProfile.findMany({
      where: { ownerId: user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.devProfile.count({ where: { ownerId: user.id, isActive: false } }),
  ]);

  const userName = user.name ?? user.email ?? "User";
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

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
                Each developer gets a personal, link-only access. No accounts required.
              </div>
            </div>

            <ProfilesTabs active="active" activeCount={activeProfiles.length} archivedCount={archivedCount} />

            <div className="profiles-layout">
              <aside className="anim-fade-up anim-delay-2">
                <div className="create-card">
                  <div className="form-eyebrow">+ New Profile</div>
                  <h2>Onboard a developer</h2>
                  <p className="form-hint">
                    Fill the basics. We&apos;ll mint a private URL you can hand over - no signup, no password.
                  </p>
                  <ProfileForm />
                </div>
              </aside>

              <div className="anim-fade-up anim-delay-3">
                <ProfileList profiles={activeProfiles} origin={origin} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
