# GF-DASH-001 — Portfolio Dashboard

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-DASH-001 |
| **Phase** | Phase 2 — Spreadsheet Replacement MVP |
| **Status** | Planned |
| **Product Goal** | Provide the five-second portfolio health readout: metrics, attention items, active opportunities, and approaching deadlines |
| **MVP Classification** | MVP Complete |
| **Roadmap Link** | [Phase 2 — Spreadsheet Replacement MVP](../../roadmap.md#7-phase-2-spreadsheet-replacement-mvp) |

---

## 1. Feature

The home screen of GrantFlow — a dashboard that provides at-a-glance portfolio health. Displays compact metric cards, upcoming deadlines, recent activity, active grants, and high-priority attention items. Users understand portfolio health within five seconds.

## 2. Purpose

Grant professionals open the app and need immediate answers: "How healthy is my portfolio? What needs attention? What's active? What deadlines are approaching?" The dashboard replaces the need to scan a spreadsheet for these answers.

## 3. User Outcome

Within five seconds of opening GrantFlow, users understand: total funding requested and awarded, pending requests, upcoming deadlines, success rate, active grants, recent activity, and high-priority items that need action.

## 4. Scope

- Portfolio metric cards: total funding requested, total funding awarded, pending requests, upcoming deadlines count, success rate, active grants count
- Deadline attention list: next upcoming/overdue deadlines (compact list)
- Recent activity feed: latest activity across the portfolio
- Active grants summary: grants in active lifecycle stages (Planning through Pending)
- High-priority items: grants with approaching/overdue deadlines, grants needing attention
- Metric periods: "All time" default; future: current fiscal year toggle
- Row clicks open grant detail drawer (GF-GRANT-003)

## 5. Out of Scope

- Charts and visualizations (chart library undecided — post-MVP)
- Period-over-period comparison (post-MVP)
- Customizable dashboard layout or widgets
- Saved dashboard views or filters
- Dashboard export or print
- Role-specific dashboards (same dashboard for all roles)
- Organization-level vs. user-level metrics (org-level for MVP)
- Dashboard notification badges

## 6. User Stories

- As a **grant professional**, I want to see total requested and awarded amounts so that I understand our portfolio scale.
- As a **grant professional**, I want to see my success rate so that I know how effective our grant efforts are.
- As a **grant professional**, I want to see upcoming deadlines so that I know what to prioritize.
- As a **grant professional**, I want to see recent activity so that I know what has changed.
- As a **grant professional**, I want to see active grants so that I know what's in progress.
- As a **fund development director**, I want a quick portfolio health overview so that I can report to leadership.

## 7. Functional Requirements

1. **Metric cards** display:
   - Total funding requested (sum of `amountRequested` across all active grants)
   - Total funding awarded (sum of `amountAwarded` across all grants)
   - Pending requests (count of grants in `Submitted` or `Pending` status)
   - Upcoming deadlines (count of grants with deadlines within 30 days)
   - Success rate (percentage of decided grants that are `Awarded`: awarded / (awarded + declined))
   - Active grants (count of grants in stages: Planning, Writing, InternalReview, Submitted, Pending)
2. **Deadline attention list** — top 5 upcoming/overdue deadlines with grant title, funder, deadline date, urgency indicator.
3. **Recent activity feed** — last 10 activity entries across all grants, with actor, description, timestamp.
4. **Active grants summary** — list or compact table of grants in active stages.
5. **Metric definitions** are computed server-side from live Prisma queries. No caching for MVP.

## 8. Business Rules

1. All metrics are scoped to the current organization.
2. Soft-deleted grants are excluded from all metrics.
3. Success rate formula: `awarded / (awarded + declined) * 100`. Grants still in progress (not yet decided) do not affect the denominator.
4. "Active grants" includes stages: Planning, Writing, InternalReview, Submitted, Pending. Research (exploration), Qualified (identified but not yet pursuing), Awarded/Reporting (post-award), Declined/Closed (terminal).
5. Metric periods: "All time" for MVP. The period/scope should be visible in the metric label.

## 9. User Experience

- Dashboard matches `screenshots/dashboard.png` — metric cards row at top, then two-column layout (deadlines/recent activity below, or active grants attention feed).
- Metric cards are compact, with a numeric value and plain-language label.
- Upcoming deadlines show days remaining or overdue treatment.
- Recent activity shows relative timestamps ("2 hours ago").
- Clicking a grant row in any list opens the slide-over drawer.
- Empty state: "Welcome to GrantFlow! Add your first grant or import from a spreadsheet to see your portfolio dashboard."
- Partial data state: some metrics show "0" or "—" if data is missing, with helpful context.

## 10. Data Requirements

- **Metrics:** Aggregate queries using Prisma `aggregate` and `count` on Grant table, filtered by orgId and deletedAt=null.
- **Deadline list:** Grants with non-null deadline, ordered by deadline, top 5.
- **Activity feed:** Activity entries, reverse chronological, top 10, with actor join.
- **Active grants:** Grants in active statuses, with funder and owner joins.

## 11. Permissions

- All authenticated users can view the dashboard (org-scoped)
- No write operations on the dashboard (it is a read-only overview)

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton metric cards and list placeholders |
| **Normal** | Full dashboard with metrics, deadlines, activity, active grants |
| **Empty (no data)** | "Welcome to GrantFlow" empty state with actions: Create Grant, Import CSV |
| **Partial data (some grants, no deadlines)** | Metrics show valid values; deadline section shows "No upcoming deadlines" |
| **Error** | Error boundary with retry; partial data may be shown if some queries succeed |
| **Loading failure** | "Unable to load dashboard" with retry action |

## 13. Acceptance Criteria

- [ ] All six metric cards display correct values
- [ ] Metric values are computed from live grant data
- [ ] Deadline attention list shows top 5 upcoming/overdue deadlines
- [ ] Recent activity feed shows last 10 activity entries
- [ ] Active grants summary shows grants in active stages
- [ ] Row clicks open grant detail drawer
- [ ] Empty state renders with create/import actions
- [ ] Dashboard matches `screenshots/dashboard.png` composition
- [ ] Metrics are scoped to organization

## 14. Dependencies

- GF-DATA-001 (Grant, Activity tables with indexes for aggregate queries)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell as home route)
- GF-GRANT-001 (grant data for metrics)
- GF-GRANT-003 (drawer opens on row click)
- GF-ACTIVITY-001 (activity feed data)
- GF-DEADLINE-001 (deadline data)

**Unresolved decisions:**
- Metric period definitions: "All time" vs. configurable date ranges
- Chart library for visualizations (if any) — no chart in MVP unless explicitly decided
- Dashboard metric cards with/without trend indicators
- Responsive breakpoints (see [roadmap §14, Decision 6](../../roadmap.md#14-unresolved-decisions)). Dashboard layout must adapt across viewports; exact breakpoint values and stacking behavior are unresolved.

## 15. Completion Criteria

- All acceptance criteria pass
- Dashboard matches `screenshots/dashboard.png`
- All metrics are accurate and scoped to org
- Deadline and activity lists are up-to-date
- Navigation from dashboard to grant detail works via drawer
- Empty and loading states are polished

---

*Spec references: `context/project-brief.md` §7 (5-second comprehension), §8 (Dashboard), `context/design.md` §5, `screenshots/dashboard.png`*
