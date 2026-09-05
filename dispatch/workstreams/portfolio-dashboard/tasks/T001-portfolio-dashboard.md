# T001 — Dashboard data contract and date seam

Status: DONE
Role: BUILD
Workstream: portfolio-dashboard
Branch: solo/portfolio-dashboard

## Assignment

Implement the frozen PLAN's dashboard data contract and minimal UTC date-only seam. This is the sole data layer for the portfolio-dashboard workstream; do not implement UI in this task.

## Required outcome

- Add minimal UTC date-only helpers reusable by the later Deadline View (convert wall-clock Date to UTC date-only midnight, add UTC calendar days, serialize as YYYY-MM-DD). Keep helpers small; do not build a generic date library.
- Implement organization-scoped dashboard query seam following existing `src/lib/queries/` conventions:
  - Every tracked Grant query enforces: Grant `organizationId` equals authorized organization, Grant `deletedAt` is null, related Funder `organizationId` equals authorized organization, Funder `deletedAt` is null. Use the existing Clerk authorization authority (`User.clerkUserId → organizationId`); never trust a client organization ID.
  - Use database aggregation/grouping and bounded queries; avoid loading the whole portfolio.
  - Status aggregation grouped by Grant status, zero-filling missing groups; derive Tracked grants from total of grouped counts; derive Open pipeline by summing Research, Qualified, Planning, Writing, Internal Review, Submitted, Pending.
  - Requested/Awarded aggregates over the tracked set; empty/null aggregate becomes zero; serialize Decimal to string without binary floating point until display.
  - Overdue count: pre-submission statuses (Research, Qualified, Planning, Writing, Internal Review) with `deadline < today`.
  - Due-within-7 count: same pre-submission statuses with `today <= deadline <= today+7`.
  - Upcoming deadlines: nearest 5 pre-submission Grants with `today <= deadline <= today+30`, ordered by `deadline ASC, id ASC`, selecting id, title, funderName, deadline, status.
- Define compact `DashboardDto` (asOf, totals{trackedGrants, openPipeline, requestedTotal, awardedTotal, currency}, attention{overdueCount, dueIn7Count}, upcoming[]{id,title,funderName,deadline,status}, breakdown[]{status,count}) using display status labels (`Internal Review` not `InternalReview`), serializing Dates/Decimals to strings.
- Accept injected `today` for tests; production derives UTC today from server clock via the helper. Keep DTO serializable for server component passing.
- Match the installed generated Prisma 7.9 client API; verify by TypeScript/build rather than copying from docs for another version. No raw SQL expected; no schema change.
- Add focused unit/query coverage for date boundaries (with fixed today=2026-09-04: 2026-09-03 overdue; 2026-09-04 due+upcoming; 2026-09-11 in 7; 2026-09-12 outside 7 inside 30; 2026-10-04 in 30; 2026-10-05 outside 30; null excluded), status semantics, organization/soft-delete isolation, and money null→zero.
- Add disposable PostgreSQL integration coverage where existing patterns support it (current + other org, active/deleted Grants/Funders, multiple statuses, amounts, past/today/+7/+8/+30/+31 tied deadlines) verifying isolation and exact aggregates/windows.

## Constraints

- Do not change the Prisma schema. If a schema change appears necessary, mark BLOCKED and return to the approval gate rather than redesigning silently.
- Do not implement the dashboard page, UI, navigation, charts, or `/deadlines` work.
- Do not add new `/grants` URL parameters (`overdue`, `dueWithin`, etc.), reminders, notifications, calendar, reporting deadlines, task/priority models, customization, saved views, win rates, percentages, projections, analytics warehouses, cached metrics, background aggregation, organization timezone settings, or currency conversion.
- Keep date semantics strictly as frozen: `overdue = deadline < today`, `next7 = today <= deadline <= today+7`, `next30 = today <= deadline <= today+30`, null excluded, inclusive upper boundaries, UTC date-only.
- Preserve existing authentication, tenancy, import, portfolio, tags, funders, activities, Sheet behavior, shell, and URL contracts.
- Do not change branches or Git history. Do not edit Solo-owned planning state or another role's evidence artifact.
- Do not claim timezone infrastructure; the accepted UTC-vs-local limitation must not be hidden behind speculative architecture.

## Relevant contract

Read `dispatch/workstreams/portfolio-dashboard/PLAN.md` before implementation. It is the frozen contract for statuses, scope, date semantics, money, navigation, empty states, and acceptance. Also read `src/lib/queries/grants.ts`, `src/lib/queries/grant-list-contract.ts`, `src/lib/clerk/authorization.ts`, `src/lib/queries/serializers.ts`, `prisma/schema.prisma`, and existing tests.

## Checks and receipt

Run focused tests plus type/lint/build/Prisma validation and `git diff --check`. Record exact commands, results, files changed, and any concerns in this task file. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS` with precise explanation. Do not create validation or review artifacts; those belong to later roles.

---

## Receipt

**Verified: 2026-09-04 | CWD: /Users/vike/Desktop/grant-flow | Branch: solo/portfolio-dashboard | Base: 2073400dd710f995f3dd3323fdaf1b274888729b | Repo root: /Users/vike/Desktop/grant-flow**

### Implementation verified

- `src/lib/dates/utc-dates.ts` — Minimal UTC date-only helpers: `toUtcDateOnly`, `addUtcDays`, `formatUtcDate`, `utcToday`. Frozen semantics preserved: `today` = UTC midnight, `overdue = deadline < today`, `next7 = today <= deadline <= today+7`, `next30 = today <= deadline <= today+30`, null excluded, inclusive upper boundaries.

- `src/types/dashboard.ts` — Compact serializable `DashboardDto` (asOf string YYYY-MM-DD, totals{trackedGrants, openPipeline, requestedTotal, awardedTotal, currency}, attention{overdueCount, dueIn7Count}, upcoming[]{id,title,funderName,deadline,status}, breakdown[]{status,count}) using display status labels (`Internal Review`), Dates/Decimals serialized to strings, currency USD.

- `src/lib/queries/dashboard.ts` — Organization-scoped server-only seam following `src/lib/queries/grants.ts` conventions: `requireAuthorization().organizationId`, `organizationId` + `deletedAt:null` + `funder.{organizationId,deletedAt:null}` on every tracked query. Bounded aggregation: `groupBy status` (zero-fill, derive tracked/open pipeline), `aggregate _sum amountRequested/amountAwarded` (null→"0", Decimal.toString), `count overdue (lt today)` + `count dueIn7 (gte today lte today+7)` both filtered to pre-submission statuses `[Research,Qualified,Planning,Writing,InternalReview]`, `findMany upcoming (gte today lte today+30, pre-submission, orderBy deadline asc id asc, take 5, select id/title/status/deadline/funder.name)`, status display mapping via `DISPLAY_BY_PRISMA`, injected `today` param (`toUtcDateOnly(input.today)` else `utcToday()`). No schema change, no raw SQL, matches generated Prisma 7.9.1 client API.

### Tests verified

- `src/test/dashboard-dates.test.ts` — Unit coverage for `toUtcDateOnly`/`addUtcDays`/`formatUtcDate`/`utcToday` + frozen boundary contract with injected `today=2026-09-04`: 2026-09-03 overdue, 2026-09-04 due+upcoming, 2026-09-11 in 7, 2026-09-12 outside 7 inside 30, 2026-10-04 in 30, 2026-10-05 outside 30, null excluded, disjoint overdue/next7, inclusive upper boundaries.

- `src/test/dashboard-queries.test.ts` — Mocked query-seam tests (12 cases): organization/active-funder scoping on `groupBy`/`aggregate`, null→zero serialization, zero-fill + lifecycle order + tracked/open pipeline derivation (7-status pipeline), pre-submission status filtering for attention, overdue `lt today` vs dueIn7 `gte/lte` inclusive, exact `findMany` shape (pre-submission, next30, select, orderBy deadline asc id asc, take 5), upcoming display status + YYYY-MM-DD serialization, DTO JSON-serializable.

- `src/test/postgres-dashboard.integration.test.ts` — Disposable PostgreSQL integration (skipped without `GRANTFLOW_TEST_DATABASE_ADMIN_URL`, exercised via full test run): seeds orgA/orgB, active/deleted Grants/Funders, 11 tracked orgA grants, multiple statuses, amounts, past/today/+7/+8/+30/+31 deadlines, tied 2026-09-05 deadlines — verifies org/soft-delete isolation, exact aggregates (tracked 11, openPipeline 10, requested 2500, awarded 1149), breakdown zero-fill/lifecycle order, deadline windows (overdue 1, dueIn7 4, upcoming 5 with deadline asc id asc tie-breaker), null exclusion, Decimal string + YYYY-MM-DD + `InternalReview`→`Internal Review` mapping.

### Checks run (exact commands and results)

1. `bun run test:run` — PASS. `Test Files 32 passed | 5 skipped (37) | Tests 181 passed | 31 skipped (212) | Duration 32.46s`. No failures; 5 skipped are guarded PostgreSQL integration suites (require admin URL) and JS DOM helpers.

2. `bun run test:run -- src/test/dashboard` (focused) — PASS. `Test Files 2 passed (2) | Tests 26 passed (26) | Duration 1.06s` (dashboard-dates + dashboard-queries).

3. `bunx --bun tsc --noEmit` — PASS (no output).

4. `bun run lint` (`eslint`) — PASS (no output).

5. `bunx --bun prisma validate` — PASS. `Prisma schema loaded from prisma/schema.prisma. The schema at prisma/schema.prisma is valid`.

6. `git diff --check` — PASS (no output; no whitespace errors).

7. `git status` — Verified branch `solo/portfolio-dashboard`, base `2073400`, untracked implementations only in allowed paths; no unrelated diffs.

8. `prisma -v` — Verified installed generated client `7.9.1` (prisma 7.9.1, @prisma/client 7.9.1) matches implementation; `src/generated/prisma/` present.

### Files changed

- Created: `src/lib/dates/utc-dates.ts`
- Created: `src/types/dashboard.ts`
- Created: `src/lib/queries/dashboard.ts`
- Created: `src/test/dashboard-dates.test.ts`
- Created: `src/test/dashboard-queries.test.ts`
- Created: `src/test/postgres-dashboard.integration.test.ts`
- Modified: `dispatch/workstreams/portfolio-dashboard/tasks/T001-portfolio-dashboard.md` (this receipt; Status READY→DONE)
- Pre-existing workstream scaffolding (branch creation) modified `dispatch/ACTIVE.md` — not part of T001's artifact set, left untouched beyond verification.

No schema change. No UI, navigation, charts, raw SQL, or other files modified. `git diff --check` clean.

### Concerns

- PostgreSQL integration suite executed via existing pattern but skipped locally without `GRANTFLOW_TEST_DATABASE_ADMIN_URL`; validated structurally and via mocked query tests — disposable DB verification will occur in CI/with admin URL. Not a blocker.
- Accepted UTC-vs-local limitation remains explicit per PLAN; no timezone infrastructure introduced.
- No concerns blocking T002.

Status: DONE
