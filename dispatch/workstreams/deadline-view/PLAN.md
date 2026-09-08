# SoloFlow Plan - Deadline View

Status: READY_FOR_USER
Classification: Feature
Workstream: deadline-view
Base branch: main
Base SHA: dd9ca1231529441770c57c2f485d39b48ad0fac6
Execution branch: solo/deadline-view (created 2026-09-07 via GIT START)
Approval: Approved 2026-09-07 - explicit developer approval to proceed using the reconciled deadline-view PLAN as frozen contract (BUILD -> VALIDATE -> REVIEW -> READY_FOR_USER)
Phase: READY_FOR_USER
Task state: T001 DONE_WITH_CONCERNS, T002 DONE_WITH_CONCERNS, T003 DONE_WITH_CONCERNS
Architecture status: Not required; this is a bounded server-side read and a route-local presentation over the existing Grant/Funder models, with no schema change, new detail route, durable state, or cross-cutting infrastructure. The future date window and selected fields are bounded; overdue rows are intentionally unbounded below by date so all unresolved overdue pre-submission application deadlines remain visible.
Next action: Awaiting human Safari Technology Preview confirmation of the Dashboard cue and explicit merge approval

## Outcome

Replace the authenticated `/deadlines` placeholder with a focused work view for grant professionals who need to scan application deadlines without maintaining a parallel spreadsheet.

The view answers four daily questions:

- Which eligible pre-submission deadlines are overdue?
- Which eligible pre-submission deadlines are due within the next 7 days?
- Which eligible pre-submission deadlines fall later in the next 30 days?
- What is the chronological sequence of all current eligible application deadlines in that window?

The page is a deadline work view, not a calendar, reminder, notification, scheduling, or task-management system.

## Inspection findings

- `main` is clean and currently points to `dd9ca123` (`Update .env.example`), after the Node 26 jsdom storage compatibility commit `62fb214`.
- `dispatch/ACTIVE.md` had no active workstream before this plan. No execution branch is created during planning.
- `/deadlines` currently renders `FeaturePlaceholder` and has no data query or page-specific component.
- The authenticated route layout already supplies `AppShell`, navigation, authentication, and organization-required behavior. The existing `/deadlines` navigation entry can remain unchanged.
- `Grant` already provides `organizationId`, `funderId`, `title`, `status`, date-only `deadline`, and `deletedAt`. `Funder` provides organization ownership and `deletedAt`.
- Existing domain queries enforce the required organization and active-related-Funder scope through the authorized local `User.organizationId` seam.
- `Grant.deadline` is PostgreSQL `date`, represented by Prisma as a JavaScript `Date`; current deadline rendering uses UTC-safe date-only formatting.
- `src/lib/dates/utc-dates.ts` is the existing date-only seam. It already defines `toUtcDateOnly`, `addUtcDays`, `formatUtcDate`, and `utcToday` with the frozen inclusive-window contract.
- Dashboard already defines the five eligible pre-submission statuses and maps Prisma `InternalReview` to display `Internal Review`. The deadline query must preserve those semantics, not broaden them.
- The refined Dashboard continues to calculate deadline semantics in UTC but presents its `asOf` date as a user-locale long date from the serialized `YYYY-MM-DD` value using a safe noon anchor. Deadline View should follow that established presentation without changing UTC query semantics.
- Existing status classes in Dashboard and Grants, `Badge`, current design tokens, and the Dashboard's refined cards/list treatment are sufficient. No new design system or dependency is needed.
- `/grants?grant=<id>` already opens the existing Grant Sheet. There is no need for `/grants/[id]`.
- The current schema indexes organization, deadline, status, and soft-delete fields adequately for the intended Work-Ready v0 scale. No schema change is expected.
- Existing disposable PostgreSQL dashboard integration fixtures already contain relevant date boundaries, tied deadlines, other-organization records, soft-deleted Grants, and soft-deleted Funders. They can be extended to exercise the new query without creating a second large fixture.
- Visual references inspected: `screenshots/dashboard.png`, `screenshots/deadlines.png`, and `screenshots/grants.png`. The page should retain the shell, soft-gray canvas, white bordered surfaces, compact typography, status pills, and list scanning pattern while making urgency more explicit than the placeholder.
- Safari Technology Preview is the human browser/visual acceptance environment for GrantFlow frontend work. Automated tests do not replace this final rendered gate.
- Relevant SoloFlow specialist skills are available and should be used during BUILD: `solo-flow`, `frontend-design`, `web-design-guidelines`, and `vercel-react-best-practices`.

## Scope

### In scope

- Replace the `/deadlines` placeholder route with a server-owned deadline query and grouped page.
- Query only current, organization-scoped Grants whose related Funder is active and belongs to the same authorized organization.
- Limit deadline attention to Research, Qualified, Planning, Writing, and Internal Review.
- Present three disjoint chronological groups:
  1. Overdue
  2. Due in the next 7 days
  3. Later in the next 30 days
- Order every group by `deadline ASC`, then stable Grant `id ASC`.
- Show Grant title, Funder name, date-only deadline, and existing status styling in each row.
- Link each Grant title to `/grants?grant=<id>` so the existing Grant Sheet opens.
- Reuse UTC date-only helpers and permit fixed dates in query tests.
- Preserve the existing AppShell, navigation, authentication, tenancy, status vocabulary, and design tokens.
- Add responsive and accessible list rendering with clear group hierarchy, focus states, semantic headings, list items, and `<time>` dates.
- Add honest empty states for no Grants, no applicable eligible deadlines, and each empty group.
- Add deterministic unit/query, PostgreSQL isolation/window, UI/navigation, and accessibility coverage.
- Use the relevant frontend/UI/accessibility specialist skills during implementation.
- Stop at `READY_FOR_USER` for the human Safari Technology Preview visual/browser gate before merge.

### Explicitly out of scope

- Reminders, notifications, email, or background jobs.
- Calendar month/week/day UI, calendar integrations, recurring deadlines, or multiple deadline types.
- Reporting deadlines or any deadline source other than `Grant.deadline`.
- Task management, priority scores, inferred urgency, custom ranges, saved views, filters, pagination, drag/drop, or scheduling.
- New charting libraries, analytics, metrics stores, or new database tables.
- New `/grants/[id]` route or a second Grant detail surface.
- Full Grant Workspace, drafting, Notes/history, funder editing, export, deployment, or unrelated Work-Ready features.
- Organization timezone settings or a replacement date library.
- Changes to `/grants` URL parameters or unsupported deadline-window query parameters.
- Unrelated refactoring of the Dashboard or Grants page. Existing status styling may be reused directly; a shared extraction is not required for this bounded feature.
- Browser-automation infrastructure or a replacement for the human Safari Technology Preview gate.

## Frozen deadline contract

### Eligible status set

Application-deadline attention includes exactly:

- Research
- Qualified
- Planning
- Writing
- Internal Review (Prisma value `InternalReview`)

Submitted, Pending, Awarded, Declined, Reporting, and Closed are excluded even when their historical `Grant.deadline` is in a window. Null deadlines belong to no deadline group.

### Date-only semantics

Use the existing `src/lib/dates/utc-dates.ts` seam:

```text
today = current UTC calendar date at 00:00:00Z

overdue = deadline < today
dueSoon = today <= deadline <= today + 7 days
later = today + 8 days <= deadline <= today + 30 days
```

The `later` bucket is intentionally `today+8..today+30`, rather than another `today..today+30` query, so the three displayed groups are disjoint and every current eligible deadline appears in exactly one group. This is the frozen grouping and avoids double-counting due-soon rows in the 30-day section.

The query may use one eligible deadline read with an upper bound of `today+30`; its returned rows are partitioned using the explicit conditions above. There is intentionally **no lower deadline bound**, because every current overdue eligible application deadline must remain visible.

A nullable PostgreSQL date does not satisfy the deadline comparison and must also be covered by tests.

With injected `today = 2026-09-04`:

- `2026-09-03` is overdue.
- `2026-09-04` is due soon, not overdue, and not later.
- `2026-09-11` is due soon.
- `2026-09-12` is later.
- `2026-10-04` is later.
- `2026-10-05` is outside the view.
- `null` is in no group.

The known Work-Ready v0 UTC-vs-local-calendar limitation remains accepted and explicit. Do not introduce timezone infrastructure to change it.

### As-of presentation

The DTO's `asOf` value remains derived from UTC `today` and serialized as `YYYY-MM-DD`.

Visible presentation should match the refined Dashboard:

- format `asOf` as a user-locale long date, e.g. `As of September 7, 2026`;
- do not append `UTC` to the visible label;
- use a safe noon anchor when converting the date-only string for locale formatting so browser timezone conversion cannot move it to the prior day.

This is presentation only. Deadline classification remains UTC date-only.

Individual deadline rows continue to render from `YYYY-MM-DD` using UTC-safe date-only formatting, and their `<time dateTime>` value remains the raw ISO date.

## Query and DTO design

Add one small server-only query module following `src/lib/queries/` conventions, for example `src/lib/queries/deadlines.ts`, and a serializable type module, for example `src/types/deadline.ts`.

The page calls the query without client input. The query may accept only an optional injected `today` value for deterministic tests; it must obtain organization scope from `requireAuthorization()` and must never accept or trust a client-provided `organizationId`.

### Required query scope

Every Grant read must enforce:

```text
Grant.organizationId = authorized organizationId
Grant.deletedAt = null
Grant.funder.organizationId = authorized organizationId
Grant.funder.deletedAt = null
```

The query should use:

- one lightweight count of the scoped, active Grant set to distinguish no Grants from Grants with no applicable eligible deadline rows;
- one deadline-only `findMany` for eligible statuses and `deadline <= today+30`, selecting only `id`, `title`, `status`, `deadline`, and `funder.name`;
- database ordering `deadline ASC`, `id ASC`;
- application partitioning into the three frozen buckets;
- no loading of amounts, notes, activities, tags, documents, owners, or unrelated portfolio records.

The count is intentionally separate from the deadline read because a deadline-only query cannot distinguish an empty portfolio from a portfolio whose records do not belong to the current eligible application-deadline view. Both calls are organization-scoped and select only what this page requires.

The future window is bounded at `today+30` and the selected fields are narrow. Overdue rows are intentionally unbounded below by date. This is acceptable for Work-Ready v0 portfolio scale because the feature outcome requires surfacing every unresolved overdue pre-submission application deadline.

If BUILD discovers materially excessive overdue volume, stop and return to PLAN rather than silently introducing a cap, pagination, or changed deadline semantics.

### DTO

Use a compact serializable contract:

```text
DeadlineViewDto
  asOf: YYYY-MM-DD
  trackedGrantCount: number
  groups
    overdue: DeadlineItem[]
    dueSoon: DeadlineItem[]
    later: DeadlineItem[]

DeadlineItem
  id
  title
  funderName
  deadline: YYYY-MM-DD
  status: display GrantStatus
```

Do not include designation or next steps in the initial row. Title, Funder, date, and status provide the required action context without turning the page into a Grant Workspace. Add no Decimal, Date, Prisma enum, or other non-serializable value to the client-facing DTO.

`InternalReview` must serialize as `Internal Review`, matching the existing display Grant status contract. The query may expose `trackedGrantCount` only as a count; it must not expose unrelated portfolio totals.

## View and visual direction

Create a route-local presentational component such as `src/components/deadlines/deadline-view.tsx`. Keep it a server-compatible component; rows need only normal `Link` navigation and no client state.

Use the loaded frontend/design specialist skills when implementing the page. Treat this as a frontend product surface, not generic Tailwind assembly.

### Layout

- Keep the existing authenticated shell and content offset.
- Use the Dashboard's `max-w-6xl`, compact type scale, soft-gray page canvas, white bordered surfaces, rounded-xl cards, and restrained shadows.
- Start with an H1 `Deadlines` and concise copy explaining that this view covers pre-submission application deadlines.
- Show `asOf` context in the same user-locale long-date presentation as the refined Dashboard, using the serialized UTC-derived date with a safe noon anchor.
- Render all three H2 group sections in fixed chronological urgency order, even when a group is empty.
- Use semantic lists rather than a new table or calendar. Preserve data order in the DOM.
- Keep each row readable on narrow screens: title and Funder stack or wrap, while date and status remain visible without horizontal scrolling.
- Use `min-w-0`, truncation or wrapping where needed for long user-entered Grant titles and Funder names.

### Urgency hierarchy

- Overdue: strongest emphasis, a restrained destructive accent/border and subtle destructive-soft treatment. Red signals action but does not flood the page or use alarmist copy.
- Due in the next 7 days: clearly urgent but visually quieter than Overdue. Follow the refined Dashboard's visual principle that due-soon can retain urgency through icon/count/foreground treatment without requiring a destructive-filled panel.
- Later in the next 30 days: calm secondary treatment using the existing warning or neutral surface treatment, clearly distinct from both overdue and due-soon.
- Do not add a new color token, animation, chart, or icon-only control.
- Decorative icons, if used, are `aria-hidden`; section meaning must remain available as text.

### Row content and navigation

Each non-empty row contains:

- a title `Link` to `/grants?grant=<encoded id>`;
- Funder name;
- a `<time dateTime="YYYY-MM-DD">` rendered with UTC-safe `Intl.DateTimeFormat` matching current deadline formatting conventions;
- the display status in the existing status badge classes.

Do not make a non-semantic container clickable and do not invent row actions. Visible hover and `focus-visible` states must match existing link treatment. No link should target `/deadlines` from inside the page, and no unsupported `/grants` deadline filter parameter should be generated.

## Empty states

The page keeps the heading and all three group headings visible so the work view remains stable as data changes.

- No tracked Grants (`trackedGrantCount === 0`): show a page-level `No grants tracked yet` message with existing real next steps to `/import` or `/grants`; do not fabricate counts or rows.
- Grants exist but no eligible deadline rows: show `No eligible pre-submission application deadlines are currently in this view.` Supporting copy may explain: `Only Research, Qualified, Planning, Writing, and Internal Review grants are included in application-deadline attention.`
- No overdue rows: keep `Overdue` visible with `No overdue deadlines.`
- No due-soon rows: keep `Due in the next 7 days` visible with `No deadlines due in the next 7 days.`
- No later rows: keep `Later in the next 30 days` visible with `No other pre-submission deadlines in the next 30 days.`
- If only one or two groups have rows, empty messages appear only in their empty groups; populated groups remain chronological and unchanged.

Do not imply that excluded-status Grants lack recorded deadlines. They may have historical `Grant.deadline` values but are intentionally outside pre-submission application-deadline attention.

Do not add onboarding infrastructure, reminders, a calendar fallback, or a generic empty-screen abstraction.

## Proposed post-approval task breakdown

Tasks are not created until explicit developer approval and GIT START.

### T001 - Deadline query, DTO, and deterministic data coverage

- Add the minimal serializable `DeadlineViewDto`/`DeadlineItem` contract.
- Implement the server-only organization-scoped query using the authorized local organization.
- Enforce active Grant and same-organization active Funder filters.
- Enforce the exact five-status pre-submission filter and null-deadline exclusion through the date comparison.
- Reuse `toUtcDateOnly`, `addUtcDays`, `formatUtcDate`, and `utcToday`; accept injected `today` for tests.
- Query only the required row fields, order by `deadline ASC, id ASC`, and partition into overdue, due-soon, and later groups without overlap.
- Preserve the intentional no-lower-bound behavior for overdue rows and the `today+30` future upper bound.
- Add mocked query tests for scope, status exclusion, selection/order, serialization, boundaries, stable ties, and no double-counting.
- Extend the existing disposable PostgreSQL dashboard fixture/test or add the smallest equivalent deadline integration coverage for organization isolation, soft-deleted Grant/Funder exclusion, exact windows, nulls, excluded statuses, and tied ordering.

### T002 - `/deadlines` page, grouped UI, navigation, and accessibility coverage

- Replace the placeholder route with the new query and presentational component.
- Use relevant frontend/UI/accessibility specialist skills during implementation.
- Render the fixed H1/H2 hierarchy and three grouped lists in the approved urgency order.
- Render the user-locale long-form `asOf` presentation without changing UTC query semantics.
- Render title/Funder/date/status rows with existing Badge classes and `/grants?grant=<id>` links.
- Implement the no-Grants, no-eligible-deadlines, and per-group empty states.
- Preserve responsive behavior, visible focus, semantic list/time markup, accessible names, long-text handling, and the existing shell/tokens.
- Replace the deadline placeholder-route assertions with focused Deadline View/page UI tests while retaining generic `FeaturePlaceholder` tests.
- Cover row deep-links, status display, group order, empty states, accessible headings/lists/links, and absence of fabricated controls or unsupported filters.
- Stop at `READY_FOR_USER` for the human Safari Technology Preview visual/browser gate.

No additional product decisions are deferred to BUILD. A discovered schema need, new deadline type, new URL contract, pagination/cap requirement, or cross-cutting architecture requirement must stop BUILD and return to PLAN rather than expand silently.

### Approved follow-up: Dashboard overdue age cue

Following Safari review on 2026-09-07, the developer approved one bounded Dashboard clarification. The existing Dashboard attention summary should communicate overdue age without relying on darker red shades or duplicating the Deadline View:

- Extend the existing Dashboard attention DTO with `oldestOverdueDays: number | null`.
- Derive it from the earliest eligible pre-submission `Grant.deadline` strictly before the injected/UTC-derived `today`, using the same organization, active Grant, active same-organization Funder, and exact five-status scope as the existing overdue count.
- Select only the oldest deadline, keep the existing UTC date-only seam, and serialize the result as a non-negative integer day count or `null` when no eligible overdue deadline exists.
- Render `Oldest overdue: 1 day` or `Oldest overdue: N days` as muted text inside the existing overdue tile only when an overdue item exists. Do not change existing red/neutral urgency treatment.
- Keep this as Dashboard summary context; individual relative ages and row-level details remain on `/deadlines`.
- Preserve all existing Deadline View, URL, schema, dependency, navigation, and portfolio semantics.

### T003 - Dashboard overdue age cue

- Add the `oldestOverdueDays` field to the existing Dashboard DTO and query, including the same scope/status/date semantics and deterministic mocked coverage for no overdue, one-day overdue, and older overdue values.
- Render the singular/plural age copy in the existing overdue attention tile without adding color levels, controls, links, or layout infrastructure.
- Update focused Dashboard query/UI/integration assertions and preserve all existing T001/T002 behavior.
- Re-run the applicable repository validation gates and return to `READY_FOR_USER` for Safari verification.

## Acceptance

1. Authenticated `/deadlines` no longer renders `FeaturePlaceholder`.
2. The page has one H1 and three visible H2 deadline groups in the order Overdue, Due in the next 7 days, Later in the next 30 days.
3. Every query derives organization scope from the authenticated local User and does not trust client organization input.
4. Every Grant read requires the authorized `organizationId` and `deletedAt: null`.
5. Every selected Grant requires a related Funder with the same authorized `organizationId` and `deletedAt: null`.
6. Deadline attention includes exactly Research, Qualified, Planning, Writing, and Internal Review.
7. Submitted, Pending, Awarded, Declined, Reporting, and Closed never appear in deadline groups.
8. Null deadlines never appear in deadline groups.
9. Overdue is strictly `deadline < today`.
10. Due soon is inclusively `today <= deadline <= today+7`.
11. Later is inclusively `today+8 <= deadline <= today+30`.
12. Today appears only in Due in the next 7 days.
13. `today+7` appears only in Due in the next 7 days.
14. `today+8` appears only in Later in the next 30 days.
15. `today+30` appears in Later in the next 30 days.
16. `today+31` is outside the view.
17. Every deadline row appears in exactly one group; no row is double-counted.
18. All eligible overdue rows are shown with no arbitrary historical date cutoff.
19. Rows within every group are ordered by deadline ascending and Grant ID ascending for ties.
20. Each row shows Grant title, Funder, date, and display status.
21. Each title opens the existing Grant Sheet through `/grants?grant=<id>`.
22. No `/grants/[id]` route is created.
23. No unsupported overdue, due-within, or deadline-window query parameter is generated.
24. Existing status badge classes and design tokens are reused; no new design system or dependency is added.
25. Overdue is visibly urgent but restrained; due-soon and later sections are distinguishable without alarmist styling.
26. The page is responsive without horizontal scrolling and handles long Grant/Funder text safely.
27. The page uses semantic headings, lists, links, `<time>` dates, decorative-icon hiding, and visible keyboard focus.
28. The visible `asOf` date matches the refined Dashboard's user-locale long-date presentation while UTC remains the underlying deadline-classification contract.
29. The no-Grants state gives honest `/import` and `/grants` next steps.
30. A non-empty portfolio with no eligible deadline rows gets the honest message that no eligible pre-submission application deadlines are currently in this view; it does not imply excluded-status Grants lack recorded deadlines.
31. Empty Overdue, Due in the next 7 days, and Later in the next 30 days groups each retain their headings and own clear messages.
32. Query and integration tests prove organization isolation, soft-deleted Grant/Funder exclusion, status filtering, null exclusion, boundaries, stable ordering, no overlap, and the intentional no-lower-bound overdue behavior.
33. UI tests prove deep-links, accessible rendering, group order, status display, empty states, correct `asOf` presentation behavior, and absence of fabricated controls.
34. No schema, migration, reminder, notification, calendar, task, reporting deadline, or unrelated Work-Ready behavior changes.
35. Existing authentication, AppShell, navigation, Grant Sheet, `/grants` URL behavior, Portfolio Import, and other domain behavior remain intact.
36. Normal Node 26 repository validation passes.
37. The human Safari Technology Preview visual/browser gate is completed and explicitly approved before merge/GIT END.

## Validation expectations

### Deterministic date and query tests

Use an injected fixed date such as `2026-09-04T00:00:00.000Z`; tests must never depend on the wall clock.

Verify:

- `2026-09-03` -> Overdue;
- `2026-09-04` -> Due in the next 7 days only;
- `2026-09-11` -> Due in the next 7 days only;
- `2026-09-12` -> Later in the next 30 days only;
- `2026-10-04` -> Later in the next 30 days only;
- `2026-10-05` -> excluded;
- `null` -> excluded.

Also verify an older qualifying deadline remains in Overdue rather than being removed by an arbitrary historical lower bound.

Mocked query assertions must verify the authorized organization scope, active/related Funder scope, exact status list, selected fields, `deadline <= today+30`, absence of a lower deadline constraint, and `orderBy: [{ deadline: "asc" }, { id: "asc" }]`.

Response assertions must verify serialized `YYYY-MM-DD` dates, display `Internal Review`, stable tied ordering, and disjoint group IDs.

### PostgreSQL integration tests

Use the repository's disposable database pattern and fixed dates. Reuse the existing dashboard fixture where practical.

Verify:

- current organization rows are returned;
- another organization's rows are absent;
- soft-deleted Grants are absent;
- Grants attached to soft-deleted Funders are absent;
- active same-organization Funders are included;
- all eligible status rows are included when their dates qualify;
- all excluded statuses remain absent even with qualifying dates;
- old overdue/past/today/+7/+8/+30/+31 and null boundaries are exact;
- tied dates use Grant ID ascending;
- overdue rows have no artificial historical cutoff;
- the DTO contains no Date or Prisma objects.

### UI and accessibility tests

Verify:

- `/deadlines` page/component heading hierarchy and three stable groups;
- title/Funder/date/status row content;
- every title's `/grants?grant=<id>` deep-link;
- visible status badges and `Internal Review` display label;
- chronological group and row order;
- no duplicate row IDs across groups;
- no-Grants and no-eligible-deadlines states;
- no-eligible-deadlines copy does not claim excluded-status deadlines are absent;
- each empty group message while other groups remain populated;
- semantic list rendering, accessible link names, `<time>` date values, and no icon-only controls;
- `asOf` displays as a user-locale long date using the safe date-only presentation pattern while the source DTO remains `YYYY-MM-DD`;
- no links to `/deadlines` from the page and no invented deadline URL parameters;
- long-title/Funder layout classes or behavior do not force horizontal overflow.

### Repository and browser gates

After implementation, run and report the repository's normal checks under the current Node 26 environment:

- `npm run test:run`;
- focused deadline/date/query/UI tests as appropriate;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run verify:prisma`;
- `npm run build` using the repository-supported build path;
- disposable PostgreSQL integration tests when `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is available;
- `git diff --check`;
- final Git status and diff inspection.

Automated validation is required but does not substitute for rendered browser acceptance.

After VALIDATE and REVIEW, stop at `READY_FOR_USER`.

The human developer then performs the browser-visible acceptance in **Safari Technology Preview** against the local GrantFlow development server/database.

The human visual/browser gate includes:

- desktop layout;
- narrow/mobile responsive layout;
- urgency hierarchy;
- long Grant/Funder text behavior;
- keyboard focus and link affordances;
- no-Grants/no-eligible/per-group empty states where practical;
- activation of a Grant title and confirmation that the existing Grant Sheet opens through `/grants?grant=<id>`.

Do not merge or perform GIT END until the human explicitly approves the Safari Technology Preview result.

## Human visual gate

Do not merge or run GIT END until the developer explicitly approves the rendered result in Safari Technology Preview.

Inspect:

- desktop hierarchy and whether the first screen makes overdue work immediately scannable;
- restrained overdue emphasis versus due-soon and later distinction;
- row readability for title, Funder, date, and status;
- visual consistency with the refined Dashboard, Grants page, AppShell, tokens, and screenshots;
- user-locale `As of` presentation consistency with Dashboard;
- narrow/mobile stacking, long text, and absence of horizontal scrolling;
- keyboard focus visibility and link affordances;
- no-Grants, no-eligible-deadlines, and individual empty-group states;
- Grant Sheet deep-link behavior.

Automated tests do not substitute for this gate.

## Concerns and decisions for developer review

- **Grouping:** use the explicitly requested disjoint `today+8..today+30` later bucket. This is different from the Dashboard's overlapping `today..today+30` aggregate because this page must show each row once.
- **Overdue volume:** all current eligible overdue rows are shown; there is no arbitrary preview cap because making daily spreadsheet scanning unnecessary is the feature outcome. The selected fields and future window are bounded, but overdue rows are intentionally unbounded below by date. If that becomes materially excessive during BUILD, stop and return to PLAN rather than silently adding pagination or a cutoff.
- **No-Grants distinction:** one lightweight tracked-Grant count is required to distinguish an empty portfolio from a portfolio with no eligible pre-submission application deadlines in this view. No unrelated portfolio data is loaded.
- **Eligible-empty semantics:** a portfolio may contain recorded deadlines on Submitted/Awarded/etc. Grants while still having no eligible pre-submission deadline rows. Empty-state copy must describe the current view, not claim no deadlines are recorded.
- **Status reuse:** the existing five-status attention semantics are preserved exactly. Do not include Submitted or later statuses because a historical application deadline should not create false application urgency.
- **Date semantics:** UTC date-only behavior remains the existing Work-Ready v0 classification contract, including its known local-midnight limitation.
- **As-of presentation:** the DTO remains UTC-derived `YYYY-MM-DD`, but visible presentation follows the refined Dashboard's user-locale long-date format with a safe noon anchor. This does not change query semantics.
- **UI simplicity:** designation and next steps are omitted from rows. Title, Funder, date, and status are sufficient for a first action; opening the existing Sheet provides the rest.
- **Frontend quality:** use the loaded frontend/design/accessibility specialist skills during T002 and preserve the established GrantFlow visual language rather than inventing a new one.
- **Browser gate:** Safari Technology Preview is the human visual/browser acceptance environment. There is no Local Host dependency or Local Host limitation to report.
- **Architecture:** no `ARCHITECTURE.md` is required. If implementation reveals a genuinely cross-cutting need or schema requirement, stop and return to planning.
- **Approval gate:** this plan intentionally creates no execution branch, `tasks/` files, BUILD assignment, implementation, or merge activity until explicit approval.

## References

- `PRODUCT.md`
- `AGENTS.md`
- `dispatch/ACTIVE.md`
- `dispatch/COMPLETED.md`
- `dispatch/workstreams/portfolio-dashboard/PLAN.md`
- `prisma/schema.prisma`
- `src/lib/dates/utc-dates.ts`
- `src/lib/queries/dashboard.ts`
- `src/lib/queries/grants.ts`
- `src/lib/clerk/authorization.ts`
- `src/app/(authenticated)/(org-required)/deadlines/page.tsx`
- `src/app/(authenticated)/(org-required)/dashboard/page.tsx`
- `src/components/dashboard/dashboard-content.tsx`
- `src/components/grants/grants-page.tsx`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/navigation-list.tsx`
- `src/components/ui/badge.tsx`
- `src/app/globals.css`
- `src/test/dashboard-dates.test.ts`
- `src/test/dashboard-queries.test.ts`
- `src/test/dashboard-page.test.tsx`
- `src/test/postgres-dashboard.integration.test.ts`
- `src/test/postgres-domain-isolation.integration.test.ts`
- `src/test/feature-placeholder.test.tsx`
- `screenshots/dashboard.png`
- `screenshots/deadlines.png`
- `screenshots/grants.png`
- Relevant SoloFlow skills loaded: `solo-flow`, `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`.
