# Deadline View T003 Validation

ROLE: VALIDATE
WORKSTREAM: deadline-view
BRANCH: solo/deadline-view
TASK: T003

## Assignment

Independently validate the approved T003 Dashboard oldest-overdue age cue against the amended canonical PLAN, T003 BUILD receipt, and the completed T001/T002 contract. Do not modify application or test code.

## Result

PASS

No Critical or Important findings remain. T003 satisfies the approved Dashboard overdue-age follow-up, and the original T001/T002 Deadline View contract remains intact in source, focused tests, full-suite checks, and authenticated Safari inspection. PostgreSQL integration assertions were environment-skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset. Developer merge approval for the human browser gate remains governed by the canonical PLAN.

## Findings

- Approved-scope DEFECT: none.
- NEW SCOPE: none.
- Critical findings: 0.
- Important findings: 0.
- Minor findings: 0.

## T003 Contract Evidence

- `src/types/dashboard.ts:12-16` extends `DashboardDto.attention` with only `oldestOverdueDays: number | null`.
- `src/lib/queries/dashboard.ts:98-130` adds one `findFirst` for the oldest overdue row. It uses the authorized organization, active Grant, active same-organization Funder, exact five-status pre-submission scope, strict `deadline < todayUtc`, `select: { deadline: true }`, and deterministic `orderBy: [{ deadline: "asc" }, { id: "asc" }]`.
- `src/lib/queries/dashboard.ts:87-88,170-172` derives and normalizes UTC date-only `today`, normalizes the selected deadline, and computes a non-negative integer day difference. A null row produces `null`; strict overdue semantics make one-day overdue produce `1` and older dates produce plural values.
- `src/components/dashboard/dashboard-content.tsx:280-288` renders `Oldest overdue: 1 day` or `Oldest overdue: N days` as muted text inside the existing overdue tile only when `overdueCount > 0` and the DTO value is non-null. No existing urgency color treatment changed.
- `src/test/dashboard-queries.test.ts:135-169` verifies scope, exact status/date filters, narrow selection, stable ordering, one-day age, null/no-overdue behavior, and a plural UTC date-only age.
- `src/test/dashboard-page.test.tsx:88-110,246-261` verifies singular copy, no-overdue omission, plural copy placement in the overdue tile, and preserved neighboring attention behavior.
- `src/test/postgres-dashboard.integration.test.ts:430-475` updates the existing fixture assertions for the oldest qualifying overdue row while retaining the existing isolation/window coverage when the database is available.

## T001/T002 Regression Evidence

- `src/lib/queries/deadlines.ts:10-73` remains scoped to the exact five eligible statuses, active same-organization Grants and Funders, `deadline <= today+30` with no lower bound, `deadline ASC` then `id ASC`, narrow selected fields, UTC date-only partitioning, null exclusion, and disjoint overdue/due-soon/later groups.
- `src/components/deadlines/deadline-view.tsx:83-147` remains a server-compatible view with one H1, three fixed H2 groups, semantic lists, UTC-safe `<time>` values, existing status badges, safe-noon `As of` presentation, deep-links to the existing Grant Sheet, empty states, wrapping, and visible focus classes.
- T003 tracked changes do not include the Deadline View query, DTO, route, component, navigation, URL contract, schema, migration, package, or lockfile. The final worktree contains the expected pre-existing T001/T002 changes and the T003 Dashboard follow-up only.

## Design and Performance Review

- The dashboard cue uses the established muted text token and stays subordinate to the overdue count; no new color level, control, or duplicated row-level detail was introduced.
- Desktop and mobile browser inspection preserved the established shell, cards, compact type scale, urgency hierarchy, and responsive stacking. The Deadline View remains a focused list rather than a calendar or dashboard duplicate.
- Semantic headings, lists, links, `<time>` elements, decorative icon hiding, long-text wrapping, and visible `focus-visible` link treatment conform to the reviewed Web Interface Guidelines.
- The Dashboard query continues to run independent reads through `Promise.all`; T003 adds no client state, client fetch, dependency, or render-time layout measurement.

## Required Checks

Environment: Node `v26.8.1`.

- `npm run test:run` - PASS; 36 files passed, 5 skipped; 206 tests passed, 32 skipped.
- `npx vitest run src/test/dashboard-dates.test.ts src/test/dashboard-queries.test.ts src/test/dashboard-page.test.tsx src/test/deadline-queries.test.ts src/test/deadline-view.test.tsx src/test/deadlines-route.test.ts src/test/feature-placeholder.test.tsx` - PASS; 7 files, 55 tests.
- `npm run lint` - PASS.
- `npx tsc --noEmit` - PASS.
- `npm run verify:prisma` - PASS; Prisma connected.
- `npm run build` - PASS; Prisma Client generated and Next production build completed. `/dashboard` and `/deadlines` remain dynamic server-rendered routes.
- `npx vitest run src/test/postgres-dashboard.integration.test.ts` - SKIPPED by the test guard; 1 file and 5 tests skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset. No PostgreSQL assertions executed.
- `git diff --check` - PASS.

Vitest emitted the repository's existing Vite `configLoader: 'native'` warning; it did not fail a check.

## Safari Technology Preview

Completed the required `discover -> snapshot/read -> interact -> verify` flow using the authenticated Safari Technology Preview MCP session and the local development server at `http://localhost:3000`.

- Dashboard desktop snapshot and screenshot showed `Oldest overdue: 116 days` inside the existing overdue tile, beneath the red count and in muted text. The cue did not alter the red overdue treatment or add a new control.
- Dashboard mobile inspection at `390x844` showed the attention section stacking within the viewport. The cue remained readable and subordinate to the overdue count.
- `/deadlines` desktop inspection showed one overdue section with restrained red emphasis, a quieter due-soon section, and a neutral later section in the required order.
- `/deadlines` mobile inspection at `390x844` showed stacked rows, wrapped long title text, visible dates/statuses, and no observed horizontal overflow.
- Focus inspection found the first deadline title link matched `:focus-visible`; the rendered screenshot showed the visible focus ring around the link.
- The first overdue title link resolved to `/grants?grant=ccc86b7a-2ef4-42f3-a267-beb79e95ee72`. Activating it opened the existing Grants surface with the Grant Sheet dialog titled `IMPACT 211` and `Grant details`.
- Current `/dashboard`, `/deadlines`, and Grant Sheet content loaded successfully. The console contained a historical 500 for the earlier unauthenticated `/login?redirect_url=.../deadlines` attempt and development HMR suspension messages; neither blocked the authenticated flow or produced a T003 behavior failure.

## Final Git Inspection

- Branch: `solo/deadline-view`.
- `git status --short` showed the expected pre-existing workstream implementation/test changes, the pre-existing `dispatch/ACTIVE.md` change, and the assigned workstream artifacts. No package, lockfile, Prisma schema/migration, or unrelated dependency change was present.
- The tracked T003 diff is limited to `src/types/dashboard.ts`, `src/lib/queries/dashboard.ts`, `src/components/dashboard/dashboard-content.tsx`, the Dashboard tests, and the existing PostgreSQL fixture assertions. Deadline View implementation files are unchanged by T003.
- Only `dispatch/workstreams/deadline-view/T003-VALIDATION.md` was written during this validation.
