# T003 - Dashboard overdue age cue

Status: DONE_WITH_CONCERNS
Role: BUILD
Workstream: deadline-view
Branch: solo/deadline-view
Dependency: T001 DONE_WITH_CONCERNS, T002 DONE_WITH_CONCERNS

## Assignment

Implement the developer-approved Dashboard follow-up recorded in the canonical PLAN. Add explicit oldest overdue age context to the existing Dashboard attention tile without changing Deadline View semantics or introducing urgency color levels.

## Required outcome

- Extend `DashboardDto.attention` with `oldestOverdueDays: number | null`.
- In `getDashboard`, query the earliest eligible pre-submission deadline strictly before the injected/UTC-derived `today`, using the existing authorized organization, active Grant, active same-organization Funder, and exact five-status scope.
- Select only the deadline required for this cue, order deterministically by deadline ascending and Grant ID ascending, derive a non-negative UTC date-only day count, and return `null` when there is no overdue deadline.
- Render `Oldest overdue: 1 day` or `Oldest overdue: N days` inside the existing overdue tile only when an overdue item exists. Use muted text and retain the current red/neutral styling.
- Add focused query and UI tests for no overdue, one-day overdue, plural older overdue, and existing count/empty behavior. Update disposable PostgreSQL assertions when practical.
- Preserve all existing Dashboard, Deadline View, URL, schema, dependency, navigation, and portfolio behavior.

## Constraints

- Do not add new urgency colors, filters, links, controls, deadline types, routes, pagination/caps, schema/migrations, dependencies, or unrelated refactors.
- Keep relative-age calculation UTC date-only and deterministic under injected `today`; do not use browser wall-clock state for classification.
- Do not edit completed T001/T002 receipts, VALIDATION.md, REVIEW.md, ACTIVE.md, or any other dispatch artifact.
- If implementation needs a material architecture, schema, URL, or semantic change beyond this assignment, stop and mark BLOCKED rather than expanding scope.

## Checks and receipt

Run focused Dashboard query/UI tests plus applicable full test, lint, TypeScript, Prisma, build, integration, and diff checks. Record exact commands, results, files changed, and concerns below. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

---

## Receipt

Status: DONE_WITH_CONCERNS

Implemented the approved Dashboard overdue-age cue. `DashboardDto.attention` now includes `oldestOverdueDays: number | null`. `getDashboard` uses the existing authorized active-Grant/active same-organization-Funder scope and exact five-status scope, selects only the earliest strictly overdue deadline with deterministic `deadline ASC, id ASC` ordering, and computes a non-negative UTC date-only age. The existing overdue tile renders muted singular/plural age copy only when overdue exists; urgency styling and Deadline View are unchanged.

Focused coverage includes null/no overdue, one-day overdue, plural older overdue, UTC date-only normalization, scope/status/selection/order assertions, singular/plural UI copy, tile placement, and existing count/empty behavior. The disposable Dashboard integration assertions now verify the fixture's oldest overdue age and preserved isolation behavior.

### Files Changed

- `src/types/dashboard.ts`
- `src/lib/queries/dashboard.ts`
- `src/components/dashboard/dashboard-content.tsx`
- `src/test/dashboard-queries.test.ts`
- `src/test/dashboard-page.test.tsx`
- `src/test/postgres-dashboard.integration.test.ts`
- `dispatch/workstreams/deadline-view/tasks/T003-dashboard-overdue-age.md`

Prior T001/T002 worktree changes were preserved. No Deadline View implementation files were changed for T003.

### Checks / Evidence

- `npx vitest run src/test/dashboard-queries.test.ts src/test/dashboard-page.test.tsx` - PASS, 2 files and 31 tests.
- `npm run test:run` - PASS, 36 files and 206 tests passed; 5 files and 32 tests skipped.
- `npm run lint` - PASS.
- `npx tsc --noEmit` - PASS.
- `npm run verify:prisma` - PASS, connected.
- `npm run build` - PASS, Prisma client generated and Next production build completed.
- `npx vitest run src/test/postgres-dashboard.integration.test.ts` - SKIPPED, 1 file and 5 tests because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unavailable.
- `git diff --check` - PASS.

### Concerns

- Disposable PostgreSQL integration coverage could not execute in this environment; the existing fixture assertions are updated for the new age field.
- Safari Technology Preview human visual acceptance remains pending as required by the canonical PLAN; automated UI and repository checks pass.
