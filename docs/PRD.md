# Oggi — Product Requirements Document

**Author:** Archetipo
**Date:** 2026-05-06
**Version:** 1.0

---

## Elevator Pitch

> For **software development teams**, who struggle with **self-organization and unclear daily priorities**, **Oggi** is a **daily focus tool** that **surfaces the right task at the right time and holds developers accountable through lightweight commitment tracking**. Unlike sprint boards and standup meetings, our product **creates a shared, real-time context between the PO and the team, turning implicit priorities into explicit daily contracts**.

---

## Vision

Oggi gives every developer a clear horizon for the day and gives the team lead full visibility of where the team stands at any moment, without micromanagement.

### Product Differentiator

Oggi transforms the standup from a passive ritual into an active daily contract. By combining priority guidance from the PO with a lightweight commitment-and-checkin loop, it creates a continuous feedback layer that surfaces blockers early and builds the habit of self-organization in junior developers — without alienating senior ones.

---

## User Personas

### Persona 1: Filippo

**Role:** Junior Frontend Developer
**Age:** 24 | **Background:** Computer Science graduate, 1 year on the job

**Goals:**
- Understand what to work on without having to ask repeatedly
- Feel productive and make visible progress each day
- Learn to estimate and plan his own work

**Pain Points:**
- Overwhelmed by open tasks — does not know where to start
- Waits for instructions instead of acting autonomously
- Silently blocks on difficult tasks without raising the issue
- Loses focus after lunch

**Behaviors & Tools:**
Uses Jira passively (only when asked), communicates mostly via Teams, prefers explicit guidance.

**Motivations:** Wants to grow fast, prove himself, stop feeling like a burden to seniors
**Tech Savviness:** Medium — comfortable with web tools but not a power user

#### Customer Journey — Filippo

| Phase | Action | Thought | Emotion | Opportunity |
|---|---|---|---|---|
| Awareness | Valentina shares his personal Oggi link | "Another tool?" | Skeptical | Make the first experience immediately relevant — show his tasks, not a generic dashboard |
| Consideration | Opens the page, sees his sprint tasks ordered by priority with context | "Oh, this tells me what to do AND why" | Curious, relieved | Show the priority rationale explicitly — not just order, but a brief reason |
| First Use | Declares his morning commitment | "I can do this — I am picking these two tasks" | Confident | Keep the UI frictionless — 2 clicks max to commit |
| Regular Use | Responds to mid-day check-in when blocked | "I can say I am blocked without feeling judged" | Safer | Normalize blockers as data, not failure |
| Advocacy | Valentina mentions his improvement in standup | "She noticed" | Proud | Provide Valentina with positive signals to share |

---

### Persona 2: Sara

**Role:** Senior Backend Developer
**Age:** 31 | **Background:** 5 years of experience, worked in startups and scale-ups

**Goals:**
- Work autonomously without feeling micromanaged
- Have context on priorities without attending every meeting
- Finish high-impact work, not just high-volume work

**Pain Points:**
- Tends to pick interesting or quick-win tasks over the truly priority ones
- Reactive to urgent requests that derail her planned work
- Finds standup meetings redundant if she already knows what to do

**Behaviors & Tools:**
Power user — Jira, CLI, code reviews. Vocal about process inefficiency. Values her autonomy.

**Motivations:** Mastery, impact, efficiency
**Tech Savviness:** High

#### Customer Journey — Sara

| Phase | Action | Thought | Emotion | Opportunity |
|---|---|---|---|---|
| Awareness | Hears Filippo mention Oggi in chat | "Another task tracker?" | Mildly resistant | Let Sara self-discover — avoid forcing onboarding |
| Consideration | Opens her link, sees priority rationale written by Valentina | "Ok, at least it explains why" | Neutral to curious | The why-text from Valentina is the feature that wins Sara |
| First Use | Commits to 3 tasks, notices she skipped the top priority | "Fair enough — let me pick it" | Self-aware | Commitment friction is the feature — not a bug |
| Regular Use | Uses mid-day check-in as a mini-retrospective | "I changed task because of a prod bug — logged it" | In control | Give Sara a way to document context changes, not just flag them |
| Advocacy | Shares Oggi link with a dev at a meetup | "It is surprisingly lightweight for what it does" | Satisfied | Word of mouth from a skeptic is the strongest signal |

---

## Brainstorming Insights

> Key discoveries and alternative directions explored during the inception session.

### Assumptions Challenged

1. **"Developers will follow a reminder if you show it."** — The real issue may be conscious avoidance of difficult tasks, not forgetfulness. Oggi addresses this through the morning commitment: the act of declaring creates psychological accountability (implementation intention).
2. **"The backlog defined in the morning stays valid all day."** — Interruptions, bugs, and urgent requests are constant. Oggi's check-in loop surfaces deviations explicitly instead of hiding them.
3. **"Junior and senior developers need the same guidance."** — Filippo needs directives; Sara needs context and autonomy. Oggi addresses this through the priority rationale text and optional commitment granularity.

### New Directions Discovered

- The core value is not the reminder — it is the **shared context board**: Valentina's priorities become visible to the team, and the team's blockers become visible to Valentina, in real time.
- The morning commitment turns Oggi from a passive reminder into a **lightweight daily contract with oneself** — a proven behavior-change mechanism (implementation intention).
- A senior dev's resistance is a design input: Oggi wins Sara through the **priority rationale text**, not through directives.

---

## Product Scope

### MVP — Minimum Viable Product

- Sprint creation and management by Valentina (single authenticated user)
- Backlog with tasks, priority ordering, and dev assignment
- Developer profiles managed by Valentina (no auth required for devs)
- Unique per-dev link for frictionless access
- Morning commitment declaration
- Mid-day check-in (On Track / Blocked / Task Changed)
- End-of-day retrospective
- Team dashboard for Valentina with real-time status, blockers, and commitment vs. outcome

### Growth Features (Post-MVP)

- Individual dev accounts with authentication
- Integration with existing Kanban board (task import)
- Automatic blocker detection (task overdue, no check-in response)
- Velocity tracking per developer
- Sprint summary report for Valentina

### Vision (Future)

- AI-powered priority suggestions based on historical velocity and estimates
- Automatic effort estimation from past similar tasks
- Mood/energy self-reporting to adapt task recommendations
- Team retrospective at sprint end with pattern analysis

---

## Technical Architecture

> **Proposed by:** Leonardo (Architect)

### System Architecture

Oggi is a web application with two distinct interaction surfaces: a fully authenticated management interface for Valentina, and token-based public pages for each developer (no login required in MVP).

**Architectural Pattern:** Modular Monolith with Next.js App Router

A monolithic architecture is appropriate given the small team size (7 devs), cohesive domain logic, and MVP velocity requirements. Feature folders enforce modularity without the operational overhead of microservices.

**Main Components:**
- **Management surface** — authenticated Next.js pages for sprint/backlog management and team dashboard (Valentina only)
- **Developer surface** — public token-based pages (`/dev/[token]`) for commitment, check-in, and retrospective
- **API layer** — Next.js Server Actions for all mutations
- **Cron layer** — Vercel Cron Jobs to trigger time-sensitive reminder flags (mid-day, end-of-day)
- **Real-time layer** — Supabase Realtime for live team dashboard updates

### Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Language | TypeScript | 5.x | type safety across full stack |
| Framework | Next.js (App Router) | 15.x | existing boilerplate, SSR + Server Actions |
| Auth | Supabase Auth | managed | existing boilerplate, OAuth GitHub/Google |
| Database | Supabase PostgreSQL | managed | existing boilerplate |
| ORM | Prisma | 5.x | existing boilerplate, type-safe queries |
| UI | shadcn/ui | latest | existing boilerplate |
| Styling | Tailwind CSS | v4 | existing boilerplate |
| Real-time | Supabase Realtime | managed | live dashboard without polling |
| Cron | Vercel Cron Jobs | - | time-based reminder triggers |

### Project Structure

**Organizational pattern:** Feature-based routing with shared component library

```
src/
  app/
    (existing: layout, page, dashboard, auth, api)
    sprint/
      page.tsx                      # sprint + backlog management (MANAGER only)
    team/
      page.tsx                      # real-time team dashboard (MANAGER only)
    dev/
      [token]/
        page.tsx                    # dev daily view (public, token-based)
        checkin/page.tsx            # mid-day check-in
        retro/page.tsx              # end-of-day retrospective
    api/
      cron/
        checkin-reminder/route.ts   # Vercel Cron trigger
        retro-reminder/route.ts     # Vercel Cron trigger
  components/
    sprint/                         # SprintForm, TaskCard, BacklogList
    my-day/                         # CommitmentPicker, DailyFocus
    checkin/                        # CheckinForm, StatusBadge
    team/                           # TeamStatusGrid, BlockerAlert, DailyReport
  lib/
    actions/
      sprint.ts
      tasks.ts
      commitment.ts
      checkin.ts
prisma/
  schema.prisma                     # extended with Sprint, Task, DevProfile, Commitment, Checkin
```

### Development Environment

Standard Next.js local development with Supabase cloud project (no local Supabase required in MVP).

**Required tools:** Node.js 20+, npm, Prisma CLI

### CI/CD & Deployment

**Build tool:** Next.js / Turbopack

**Pipeline:** Vercel automatic deployments on push to main

**Deployment:** Vercel (zero-config for Next.js + built-in Cron Jobs support)

**Target infrastructure:** Vercel (frontend + API + cron) + Supabase managed (database + auth + realtime)

### Architecture Decision Records (ADR)

- **ADR-1: Token-based dev access over per-dev auth** — In MVP, developer profiles are managed entities without Supabase accounts. Each dev receives a unique URL with a UUID v4 token. Rationale: eliminates onboarding friction (no account creation, no password). Trade-off: tokens are not revocable in real-time; mitigated by UUID v4 entropy (128-bit).
- **ADR-2: In-page reminders over push notifications** — Vercel Cron marks a reminder as due in the DB at the scheduled time; the dev page reads this flag on load and shows a contextual prompt. No browser Push API required in MVP. Trade-off: requires the dev to open the page; acceptable given the team is expected to reference it during the day.
- **ADR-3: Single authenticated user (Valentina) in MVP** — Simplifies auth scope dramatically. Dev interaction is unauthenticated but gated by opaque token. Growth phase adds individual dev accounts.

---

## Functional Requirements

**Sprint & Backlog Management**

- FR1: Valentina can create a sprint with name, start date, and end date
- FR2: Valentina can add tasks to the sprint backlog with title, description, priority order, and assigned dev profile
- FR3: Valentina can reorder tasks by priority via drag-and-drop or manual order input
- FR4: Valentina can add a priority rationale note to each task (displayed to the assigned dev)
- FR5: Valentina can create and manage dev profiles (name, role: frontend/backend, seniority: junior/senior)
- FR6: Each dev profile automatically receives a unique, shareable access token and URL upon creation

**Developer Daily View**

- FR7: A developer accesses their personal page via unique URL without authentication
- FR8: The page displays the developer's tasks for the current sprint day, ordered by priority, with the rationale note from Valentina
- FR9: The developer declares their morning commitment by selecting which tasks they will work on today (multi-select, confirmed with a single action)

**Check-in & Retrospective**

- FR10: At mid-day, the developer's page shows a check-in prompt for each committed task
- FR11: The developer responds to each check-in with one of three statuses: On Track / Blocked (with optional note) / Task Changed
- FR12: At end-of-day, the page shows a retrospective form where the developer marks each committed task as Done / In Progress / Not Started
- FR13: If a developer has not responded to a check-in within 2 hours of the scheduled time, the system marks their status as Silent and surfaces it in Valentina's dashboard

**Team Dashboard**

- FR14: Valentina sees a real-time grid of all dev profiles with current task, last check-in status, and any open blockers

---

## Non-Functional Requirements

### Security

- Developer access tokens are UUID v4 (128-bit entropy) — not guessable by enumeration
- All management routes are protected by Supabase Auth session middleware
- No sensitive personal data stored beyond name, role, and seniority

### Integrations

- **Vercel Cron Jobs** — triggers check-in and retrospective reminder flags at scheduled times
- **Supabase Realtime** — powers live updates on the team dashboard without polling
- Future (Growth): Jira/Linear webhook for task import

---

## Next Steps

1. **UX Design** — Define interaction flows and wireframes for: sprint setup, dev daily view, check-in form, team dashboard
2. **Backlog** — Decompose functional requirements into epics and user stories with `/archetipo-spec`
3. **Detailed Architecture** — Finalize Prisma schema extensions and token generation strategy
4. **Validation** — Share with 1-2 devs on the team before building to validate the commitment UX

---

_PRD generated via Archetipo Product Inception — 2026-05-06_
_Session conducted by: Valentina Reyna with the Archetipo team_
