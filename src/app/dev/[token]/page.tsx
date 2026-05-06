import { prisma } from "@/lib/prisma";
import { findActiveProfileByToken, profileInitials, roleLabel, seniorityLabel } from "@/lib/profile";
import { getActiveSprintForOwner } from "@/lib/sprint";
import { getTodaysTasksForDev, type TodayTask } from "@/lib/task";
import {
  findTodayCommitmentForDev,
  formatPlanDate,
  formatTimeInTz,
  mapCommitmentState,
  todayInOrgTz,
} from "@/lib/commitment";
import { formatMidDayLabel, scheduleConfig } from "@/lib/config/schedule";
import { findTodayCheckIns, mapCheckInState } from "@/lib/checkin";
import { findTodayRetros, mapRetroState } from "@/lib/retro";
import { InvalidLinkState } from "../_components/InvalidLinkState";
import { TodayEmptyState } from "../_components/TodayEmptyState";
import { CommitmentEditor } from "./_components/CommitmentEditor";
import { CommittedPlan } from "./_components/CommittedPlan";
import { CommitmentLocked } from "./_components/CommitmentLocked";
import { CheckInForm } from "./_components/CheckInForm";
import { CheckInSummary } from "./_components/CheckInSummary";
import { SilentBanner } from "./_components/SilentBanner";
import { RetroForm } from "./_components/RetroForm";
import { RetroSummary } from "./_components/RetroSummary";
import "../../sprints/sprints.css";
import "./dev.css";
import "./commitment.css";
import "./checkin.css";
import "./retro.css";

export const dynamic = "force-dynamic";

function formatToday(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(now);
}

function firstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0]!;
}

export default async function DevDailyPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { token } = await params;
  const { edit } = await searchParams;
  const profile = await findActiveProfileByToken(prisma, token);

  if (!profile) {
    return <InvalidLinkState />;
  }

  const initials = profileInitials(profile.name);
  const now = new Date();
  const today = formatToday(now, scheduleConfig.timezone);
  const tokenPreview = `${profile.accessToken.slice(0, 4)}…${profile.accessToken.slice(-4)}`;

  const activeSprint = await getActiveSprintForOwner(prisma, profile.ownerId, now);
  const tasks: TodayTask[] = activeSprint
    ? await getTodaysTasksForDev(prisma, {
        devProfileId: profile.id,
        sprintId: activeSprint.id,
      })
    : [];

  const todayDate = todayInOrgTz(now, scheduleConfig.timezone);
  const commitment = activeSprint
    ? await findTodayCommitmentForDev(prisma, {
        devProfileId: profile.id,
        sprintId: activeSprint.id,
        today: todayDate,
      })
    : { taskIds: [], firstCommittedAt: null };

  const baseState = mapCommitmentState(commitment, now, scheduleConfig);
  const forceEdit = edit === "1" && baseState === "editable";
  const state = forceEdit ? "editor" : baseState;

  const checkIns =
    baseState === "locked" && commitment.taskIds.length > 0
      ? await findTodayCheckIns(prisma, {
          devProfileId: profile.id,
          sprintDay: todayDate,
        })
      : [];
  const checkInState = mapCheckInState(commitment.taskIds, checkIns, now, scheduleConfig);

  const retros =
    baseState === "locked" && commitment.taskIds.length > 0
      ? await findTodayRetros(prisma, {
          devProfileId: profile.id,
          sprintDay: todayDate,
        })
      : [];
  const retroState = mapRetroState(commitment.taskIds, retros, now, scheduleConfig);
  const showRetroForm = !forceEdit && retroState === "awaiting_retro";
  const showRetroSummary = !forceEdit && retroState === "day_closed";

  const showCheckInForm =
    !forceEdit &&
    retroState === null &&
    (checkInState === "awaiting_checkin" || checkInState === "silent_pending") &&
    commitment.taskIds.length > 0;
  const showSilentBanner =
    !forceEdit && retroState === null && checkInState === "silent_pending";
  const showCheckInSummary = !forceEdit && retroState === null && checkInState === "checked_in";
  const submittedAt = checkIns.length > 0 ? checkIns[0]!.submittedAt : null;
  const submittedTimeLabel = submittedAt
    ? formatTimeInTz(submittedAt, scheduleConfig.timezone)
    : "";
  const submittedDateLabel = submittedAt ? formatToday(submittedAt, scheduleConfig.timezone) : "";
  const retroClosedAt = retros.length > 0 ? retros[0]!.submittedAt : null;
  const retroClosedTimeLabel = retroClosedAt
    ? formatTimeInTz(retroClosedAt, scheduleConfig.timezone)
    : "";
  const retroClosedDateLabel = retroClosedAt
    ? formatToday(retroClosedAt, scheduleConfig.timezone)
    : "";
  const dateLine = activeSprint ? `${today} · ${activeSprint.name}` : today;
  const midDayLabel = formatMidDayLabel(scheduleConfig);
  const planDateLabel = formatPlanDate(todayDate, scheduleConfig.timezone);
  const committedAtLabel = commitment.firstCommittedAt
    ? formatTimeInTz(commitment.firstCommittedAt, scheduleConfig.timezone)
    : null;

  const committedSet = new Set(commitment.taskIds);
  const committedTasks = tasks.filter((t) => committedSet.has(t.id));
  const asideTasks = tasks.filter((t) => !committedSet.has(t.id));

  const mainClass =
    state === "locked"
      ? "dev-main commitment-main is-locked"
      : state === "editable"
      ? "dev-main commitment-main is-confirmed"
      : "dev-main commitment-main";

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

        <main className={mainClass}>
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

          {tasks.length === 0 ? (
            <TodayEmptyState sprintLabel={activeSprint?.name ?? null} />
          ) : showRetroSummary ? (
            <RetroSummary
              committedTasks={committedTasks}
              retros={retros}
              devFirstName={firstName(profile.name)}
              closedTimeLabel={retroClosedTimeLabel}
              closedDateLabel={retroClosedDateLabel}
            />
          ) : showRetroForm ? (
            <RetroForm
              token={token}
              committedTasks={committedTasks}
              devFirstName={firstName(profile.name)}
            />
          ) : showCheckInSummary ? (
            <CheckInSummary
              committedTasks={committedTasks}
              checkIns={checkIns}
              devFirstName={firstName(profile.name)}
              submittedTimeLabel={submittedTimeLabel}
              submittedDateLabel={submittedDateLabel}
            />
          ) : showCheckInForm ? (
            <>
              {showSilentBanner ? <SilentBanner /> : null}
              <CheckInForm
                token={token}
                committedTasks={committedTasks}
                devFirstName={firstName(profile.name)}
              />
            </>
          ) : state === "locked" ? (
            <CommitmentLocked
              committedTasks={committedTasks}
              planDateLabel={planDateLabel}
              midDayLabel={midDayLabel}
              committedAtLabel={committedAtLabel}
            />
          ) : state === "editable" ? (
            <CommittedPlan
              token={token}
              committedTasks={committedTasks}
              asideTasks={asideTasks}
              planDateLabel={planDateLabel}
              midDayLabel={midDayLabel}
              committedAtLabel={committedAtLabel}
            />
          ) : (
            <CommitmentEditor
              token={token}
              tasks={tasks}
              initialSelection={commitment.taskIds}
              midDayLabel={midDayLabel}
              isUpdate={commitment.taskIds.length > 0}
            />
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
