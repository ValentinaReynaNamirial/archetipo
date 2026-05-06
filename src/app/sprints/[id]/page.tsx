import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { Sidebar } from "../Sidebar";
import {
  formatSprintCode,
  formatSprintDate,
  getSprintStatus,
  type SprintStatus,
} from "@/lib/sprint";
import { TaskBoard } from "./TaskBoard";
import "../sprints.css";
import "./backlog.css";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<SprintStatus, string> = {
  active: "Active Sprint",
  upcoming: "Upcoming Sprint",
  past: "Past Sprint",
};

const STATUS_BADGE_CLASS: Record<SprintStatus, string> = {
  active: "badge badge-green badge-dot",
  upcoming: "badge badge-blue badge-dot",
  past: "badge badge-muted badge-dot",
};

const STATUS_BADGE_LABEL: Record<SprintStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  past: "Closed",
};

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [sprint, ownerSprintsAsc, devProfiles] = await Promise.all([
    prisma.sprint.findFirst({ where: { id, ownerId: user.id } }),
    prisma.sprint.findMany({
      where: { ownerId: user.id },
      orderBy: { startDate: "asc" },
      select: { id: true },
    }),
    prisma.devProfile.findMany({
      where: { ownerId: user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!sprint) notFound();

  const tasks = await prisma.task.findMany({
    where: { sprintId: sprint.id },
    include: { assignedDev: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  const userName = user.name ?? user.email ?? "User";
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sprintIndex = ownerSprintsAsc.findIndex((s) => s.id === sprint.id);
  const sprintCode = formatSprintCode(sprintIndex >= 0 ? sprintIndex + 1 : 1);

  const now = new Date();
  const status = getSprintStatus(sprint, now);
  const assigneeIds = new Set(tasks.map((t) => t.assignedDevId));
  const remainingDays =
    status === "active"
      ? Math.max(0, Math.ceil((sprint.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

  return (
    <div className="oggi-scope">
      <div className="app-shell">
        <Sidebar active="sprints" userName={userName} initials={initials} />
        <main className="main-content">
          <div className="page-container">
            <div className="crumbs anim-fade-up">
              <Link href="/sprints">Sprints</Link>
              <span className="sep">/</span>
              <span className="current">
                {sprintCode} - {sprint.name}
              </span>
            </div>

            <TaskBoard
              sprintId={sprint.id}
              sprintCode={sprintCode}
              sprintName={sprint.name}
              statusLabel={STATUS_LABEL[status]}
              statusBadgeClass={STATUS_BADGE_CLASS[status]}
              statusBadgeLabel={STATUS_BADGE_LABEL[status]}
              startDate={formatSprintDate(sprint.startDate)}
              endDate={formatSprintDate(sprint.endDate)}
              remainingDays={remainingDays}
              taskCount={tasks.length}
              assigneeCount={assigneeIds.size}
              tasks={tasks.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                rationale: t.rationale,
                assignedDevId: t.assignedDevId,
                assignee: {
                  id: t.assignedDev.id,
                  name: t.assignedDev.name,
                  role: t.assignedDev.role,
                },
              }))}
              devProfiles={devProfiles.map((p) => ({
                id: p.id,
                name: p.name,
                role: p.role,
              }))}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
