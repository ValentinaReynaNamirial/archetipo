import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { Sidebar } from "./Sidebar";
import { SprintList } from "./SprintList";
import "./sprints.css";

export const dynamic = "force-dynamic";

export default async function SprintsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const sprints = await prisma.sprint.findMany({
    where: { ownerId: user.id },
    orderBy: { startDate: "desc" },
  });

  const userName = user.name ?? user.email ?? "User";
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const now = new Date();

  return (
    <div className="oggi-scope">
      <div className="app-shell">
        <Sidebar active="sprints" userName={userName} initials={initials} />
        <main className="main-content">
          <div className="page-container">
            <div className="page-header anim-fade-up">
              <div className="page-eyebrow">Sprint Management</div>
              <div className="flex items-center justify-between">
                <h1 className="t-headline">Sprints</h1>
                <div className="flex gap-sm">
                  <Link href="/sprints/new" className="btn btn-primary btn-sm">
                    + New Sprint
                  </Link>
                </div>
              </div>
            </div>
            <SprintList sprints={sprints} now={now} />
          </div>
        </main>
      </div>
    </div>
  );
}
