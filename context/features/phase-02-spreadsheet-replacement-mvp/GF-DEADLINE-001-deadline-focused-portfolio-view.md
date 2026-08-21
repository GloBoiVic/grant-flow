# GF-DEADLINE-001 — Deadline-Focused Portfolio View

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-DEADLINE-001 |
| **Phase** | Phase 2 — Spreadsheet Replacement MVP |
| **Status** | Planned |
| **Product Goal** | Provide a dedicated deadline-centric view of the grant portfolio, sorted by urgency |
| **MVP Classification** | MVP Complete |
| **Roadmap Link** | [Phase 2 — Spreadsheet Replacement MVP](../../roadmap.md#7-phase-2-spreadsheet-replacement-mvp) |

---

## 1. Feature

A focused portfolio view organized around submission deadlines. Grants are displayed in a list sorted by deadline (ascending), with overdue deadlines prominently flagged and approaching deadlines visibly marked. Users can quickly identify what needs attention and when.

## 2. Purpose

Missed deadlines are one of the most costly problems in grant management. GF-DEADLINE-001 provides a dedicated deadline view — not a secondary sort on a general list — so that grant professionals can immediately see what is due soonest and what is overdue.

## 3. User Outcome

Grant professionals can open the deadlines view and instantly see: which grants are overdue, what is due this week/this month, and the chronological order of all upcoming deadlines. They can click any grant to open the detail drawer.

## 4. Scope

- Deadline-ordered list of all grants with deadline dates
- Urgency indicators: overdue (red), due this week (amber), due this month (neutral attention)
- Grouped sections: Overdue, Due This Week, Due This Month, Upcoming
- Grant identity info: title, funder, status, owner, amount requested
- Filter by lifecycle status
- Row click opens grant detail drawer (GF-GRANT-003)
- Grants without deadlines shown separately or excluded (decision: exclude from deadline view, listed in "No deadline set" section)

## 5. Out of Scope

- Calendar view or month-grid layout (post-MVP)
- Deadline notifications or reminders (GF-NOTIFY-001)
- Deadline editing within the deadline view (edit from grant detail)
- Recurring deadline patterns
- Deadline countdown widget for dashboard (GF-DASH-001 may include this)
- Export of deadline list
- Deadline import from CSV (handled by GF-IMPORT-001)

**Terminal grant behavior note:** Grants in terminal stages (Closed, Declined) appear in the deadline view with their past deadlines but are excluded from "overdue" urgency treatment. They are displayed as informational only. Grants in terminal stages with upcoming deadlines (e.g., future reporting deadline after Award) appear in the appropriate urgency group. Terminal grants with non-null deadlines are included by default; a future enhancement could exclude terminal grants with past deadlines entirely since they are no longer actionable.

## 6. User Stories

- As a **grant professional**, I want to see all deadlines in order so that I know what is due soonest.
- As a **grant professional**, I want to see overdue deadlines prominently so that I don't miss anything.
- As a **grant professional**, I want to see deadlines grouped by timeframe (overdue, this week, this month) so that I can plan my work.
- As a **grant professional**, I want to click a grant to see details so that I can take action on a deadline.

## 7. Functional Requirements

1. **Deadline list** shows all active (non-deleted) grants with a non-null deadline, ordered by deadline ascending.
2. **Urgency grouping:**
   - **Overdue** — deadline is before today
   - **Due this week** — deadline is today through 7 days from now
   - **Due this month** — deadline is 8+ days from now through end of current month
   - **Upcoming** — deadline is after current month
3. **Each row** shows: grant title, funder name, status badge, deadline date, days remaining (or "Overdue by N days"), owner name, amount requested.
4. **Urgency treatment:** overdue items use red urgency badge/treatment; due-this-week items use amber; due-this-month and upcoming use neutral.
5. **Status filter** — filter deadlines by lifecycle status (multi-select).
6. **Row click** opens grant detail drawer (GF-GRANT-003).
7. **Grants without deadlines** are not shown in this view. A toggle or secondary section may show them as "No deadline set."

## 8. Business Rules

1. Only grants with a non-null `deadline` value appear in the deadline view.
2. Overdue determination is based on calendar date comparison (UTC). "Today" is determined server-side.
3. Grants in terminal stages (Closed, Declined) with past deadlines are excluded from "overdue" (they are no longer actionable).
4. Urgency grouping is recalculated on each page load.

## 9. User Experience

- View matches `screenshots/deadlines.png` — compact list with clear urgency hierarchy.
- Section headers for each urgency group (Overdue, Due This Week, Due This Month, Upcoming).
- Each grant row shows deadline date prominently, with colored urgency indicator.
- Days remaining shown as: "3 days left", "Overdue by 2 days", "Due today".
- Status filter at top to narrow by lifecycle stage.
- Empty state: "No upcoming deadlines. All your grants are in good shape — or you haven't added deadlines yet."
- Row interaction matches grant list conventions (hover, click opens drawer).

## 10. Data Requirements

- Read query fetches active grants with non-null deadlines, sorted by deadline ascending.
- Fields needed: grant id, title, funder name, status, deadline, owner name, amountRequested.
- Urgency grouping is computed server-side based on the current date.

## 11. Permissions

- All authenticated users can view the deadline list (read-only access)

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton rows grouped by urgency sections |
| **Normal** | Grouped deadline list with grants |
| **Empty (all deadlines met)** | "No upcoming deadlines. Add deadlines to your grants to see them here." |
| **Empty (no deadlines set)** | "No deadlines set yet. Add a deadline to any grant to track it here." |
| **Filtered** | Deadline list filtered by selected status values |
| **No filter matches** | "No deadlines match your filter" with clear filter action |

## 13. Acceptance Criteria

- [ ] Deadline list shows all active grants with deadlines, sorted ascending
- [ ] Urgency grouping works: Overdue, Due This Week, Due This Month, Upcoming
- [ ] Overdue items show red urgency treatment
- [ ] Due-this-week items show amber treatment
- [ ] Each row shows title, funder, status, deadline, days remaining, owner, amount
- [ ] Status filter works (multi-select)
- [ ] Row click opens grant detail drawer
- [ ] Terminal grants (Closed, Declined) with past deadlines are not shown as overdue
- [ ] Empty states render correctly

## 14. Dependencies

- GF-DATA-001 (Grant table with deadline field, proper indexes)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell, navigation)
- GF-GRANT-001 (grants with deadline data)
- GF-GRANT-002 (grant list conventions for rows)
- GF-GRANT-003 (drawer opens on row click)

## 15. Completion Criteria

- All acceptance criteria pass
- View matches `screenshots/deadlines.png`
- Urgency grouping is accurate and recalculates on each load
- Row click correctly opens grant detail drawer
- Organization isolation verified

---

*Spec references: `context/design.md` §6 (tables, deadline treatment), `screenshots/deadlines.png`, `context/database.md` §3 (deadline field)*
