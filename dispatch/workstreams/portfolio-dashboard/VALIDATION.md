# Portfolio Dashboard Validation

ROLE: VALIDATE
WORKSTREAM: portfolio-dashboard
BRANCH: solo/portfolio-dashboard
TASK: NONE

## Result

**PASS** — BUILD delivers the frozen portfolio-dashboard contract with no blocking defect. All required date, data, page, and navigation semantics verify under inspection and passing tests; remaining gaps are environment-limited and documented.

## Scope

Independent VALIDATION of portfolio-dashboard at frozen PLAN `dispatch/workstreams/portfolio-dashboard/PLAN.md` (commit `2073400`, branch `solo/portfolio-dashboard`). Read dispatch/ACTIVE.md, PLAN.md, T001/T002 receipts, and inspected `src/lib/dates/utc-dates.ts`, `src/types/dashboard.ts`, `src/lib/queries/dashboard.ts`, `src/components/dashboard/dashboard-content.tsx`, `src/app/(authenticated)/(org-required)/dashboard/page.tsx`. No code was written or fixed during validation.

Validated against PLAN § Dashboard content, Date semantics, Navigation, Data/query design, Money, Empty states, Existing behavior, and Acceptance 1–34 per task brief.

## Findings

None blocking. All contract sections verified:

### Date semantics — PASS
- `src/lib/dates/utc-dates.ts` (30 lines, minimal) implements exactly the three helpers plus `utcToday`: `toUtcDateOnly` via `Date.UTC(Y,M,D)`, `addUtcDays` via `Date.UTC(Y,M,D+days)` (handles month/year rollover), `formatUtcDate` via `toISOString().slice(0,10)`, `utcToday` via `toUtcDateOnly(new Date())`. No generic library, no timezone infra.
- Frozen boundaries `today=2026-09-04T00:00:00.000Z`, `overdue = deadline < today`, `next7 = today <= d <= today+7`, `next30 = today <= d <= today+30`, null excluded, disjoint `overdue`/`next7`, inclusive upper edges all match PLAN examples (2026-09-03 overdue, 09-04 inside next7/next30, 09-11 inside next7, 09-12 outside next7 inside next30, 10-04 inside next30, 10-05 outside). Tests in `dashboard-dates.test.ts` inject today and assert each boundary; no wall-clock dependency.

### Data contract — PASS
- `src/types/dashboard.ts` DTO is serializable: `asOf: string (YYYY-MM-DD)`, `totals.{trackedGrants,openPipeline,requestedTotal,awardedTotal,currency}`, `attention.{overdueCount,dueIn7Count}`, `upcoming[]{id,title,funderName,deadline,status}`, `breakdown[]{status,count}` — Decimals as strings, Dates as `YYYY-MM-DD`, display status `"Internal Review"` via existing `GrantStatus` validation, no raw Decimal/Date leakage, JSON round-trip preserved in tests.
- `src/lib/queries/dashboard.ts` uses `requireAuthorization` → `organizationId` never trusts client ID. `trackedWhere = {organizationId, deletedAt:null, funder:{organizationId, deletedAt:null}}` applied to every query (groupBy, aggregate, both counts, findMany). Verified in `dashboard-queries.test.ts` mock assertions.
- `groupBy` on `by:["status"]` with `_count._all`, zero-filled to 11 display statuses in lifecycle order `Research,Qualified,Planning,Writing,Internal Review,Submitted,Pending,Awarded,Declined,Reporting,Closed` via `PRISMA_BY_DISPLAY`/`DISPLAY_BY_PRISMA` mapping (`InternalReview` ↔ `Internal Review`). Tracked = sum(breakdown), open pipeline = sum of 7 statuses `Research,Qualified,Planning,Writing,Internal Review,Submitted,Pending` derived without redundant count query.
- `aggregate _sum {amountRequested,amountAwarded}` null → `"0"` string, `Number()` only at display boundary (`formatMoney`), `currency:"USD"`, no floating-point aggregation.
- Attention/upcoming pre-submission filter exactly `["Research","Qualified","Planning","Writing","InternalReview"]`; `Submitted,Pending,Awarded,Declined,Reporting,Closed` excluded and explicitly asserted not in `status.in`. `deadline:{lt:todayUtc}` for overdue, `{gte:todayUtc,lte:todayPlus7}` for dueIn7 (disjoint, today inclusive to next7), `{gte:todayUtc,lte:todayPlus30}` for upcoming, null implicit excluded (no deadline passes gte/lte). `take:5`, `orderBy:[{deadline:"asc"},{id:"asc"}]` verified.
- Prisma API matches installed `7.9.1` — `groupBy`, `aggregate`, `count`, `findMany` with above args type-check via `bunx --bun tsc --noEmit` PASS, `prisma validate` PASS. No schema change (`prisma/schema.prisma` unchanged: `GrantStatus` enum, `Grant.deadline @db.Date`, existing indexes on `organizationId,status,deadline,deletedAt` retained).
- `getDashboard(input?:{today?:Date})` accepts injected today (tests use `2026-09-04`), production derives `utcToday()` — `toUtcDateOnly(input.today)` applied consistently.

### Page & navigation — PASS
- `src/app/(authenticated)/(org-required)/dashboard/page.tsx` replaces `FeaturePlaceholder` with async server component `getDashboard()` → `DashboardContent`, no new route, no client org ID.
- `src/components/dashboard/dashboard-content.tsx` renders four sections with headings `h1 Dashboard`, `h2 Portfolio totals/Needs attention/Upcoming deadlines/Status breakdown` (`aria-labelledby`), using existing tokens (`bg-card`, `border-border`, `text-muted-foreground`, `text-metric`, `text-h2`, `text-label`, `shadow-sm`, `bg-status-*` via `Badge` reuse from grants-page).
- **Portfolio totals:** `Tracked grants` count → `/grants`, `Open pipeline` → `/grants?status=Research&status=Qualified&status=Planning&status=Writing&status=Internal%20Review&status=Submitted&status=Pending` (7 repeated statuses via `grantListSearchParams`), `Requested`/`Awarded` via `Intl.NumberFormat("en-US",{style:"currency",currency})` from `Number(dto.totals.requestedTotal)` → `$0.00` when empty, muted caption `No requested/awarded amounts recorded yet.` only when `trackedGrants>0 && requested===0 && awarded===0`.
- **Needs attention:** `Overdue: X` / `Due within 7 days: Y` counts, zero case shows `No pre-submission application deadlines need attention.`, honest continuation `Review pre-submission deadlines →` → pre-submission 5 statuses + `sort=deadline&dir=asc` via `grantListSearchParams` (defaults omitted by helper). No `overdue`/`dueWithin`/`deadlineWindow` params, no `View overdue` / `View due in 7 days` labels, no overdue preview table.
- **Upcoming:** `today..today+30` nearest 5, each row `title`→`/grants?grant=<id>` (`encodeURIComponent`), `funderName · Sep 4, 2026` via `Intl.DateTimeFormat(... timeZone:"UTC").format(new Date(value+"T00:00:00Z"))`, `Badge` with `statusClass`. Continuation `Review grant deadlines →` same pre-submission link. Empty shows `No pre-submission deadlines in the next 30 days.` section kept visible.
- **Status breakdown:** 11 rows lifecycle-order, each `status`→`/grants?status=<Status>` (single param via `grantListSearchParams`, `Internal Review` space encoded as `+`/`%20`), count + minimal CSS bar `h-2 w-24 bg-muted` + `bg-primary` width `count/max*100%`, no charting dependency.
- No `/deadlines` usage verified (`grep -R "/deadlines" src/components/dashboard src/lib/queries/dashboard.ts` → no matches, jsdom test asserts no link `href="/deadlines"` and no unsupported params anywhere).
- No new Grant detail route (`/grants/[id]` not created, only `?grant=` deep-link).
- No charting/timezone infra (`grep chart|recharts|d3|timezone` → no matches beyond legitimate design).
- Empty states: `trackedGrants===0` keeps structure with 0 totals, 0 attention/upcoming, all-zero breakdown plus `No grants tracked yet. Import an existing spreadsheet at /import or go to /grants to begin building the portfolio.` with links to `/import` and `/grants`; `trackedGrants===0` suppresses amount caption; all-zero breakdown renders 11× `0` spans; heading hierarchy and accessible link names verified in jsdom.
- `src/test/feature-placeholder.test.tsx` updated to expect only `Deadlines` placeholder (Dashboard no longer placeholder) — intentional.

### Existing behavior preserved — PASS
- Clerk auth/tenancy (`requireAuthorization`), import/grants/funders/tags/activities, soft-delete handling, `/grants` URL contract (`grantListSearchParams`, repeated `status`, `sort/deadline asc`, `?grant=` sheet), design tokens and AppShell unchanged. Full suite shows no regression.

### Tests — PASS
- `dashboard-dates` boundaries, `dashboard-queries` scoping/zero-fill/pre-submission exclusion/take/order/serialization, `dashboard-page` sections/formatting/navigation/empty states/hierarchy/accessibility.
- Postgres integration structure present (`src/test/postgres-dashboard.integration.test.ts` 425 lines, disposable PG via `GRANTFLOW_TEST_DATABASE_ADMIN_URL`, seeds two orgs, active/soft-deleted grants+funders, multiple statuses, amounts, past/today/+7/+8/+30/+31 deadlines, tied deadlines, exact aggregate/window assertions) — execution skipped without admin URL (expected disposable pattern).

## Checks

- Source inspection — `src/lib/dates/utc-dates.ts`, `src/types/dashboard.ts`, `src/lib/queries/dashboard.ts`, `src/components/dashboard/dashboard-content.tsx`, `src/app/(authenticated)/(org-required)/dashboard/page.tsx` read verbatim (CodeGraph + Read).
- `bun run test:run -- src/test/dashboard-dates.test.ts src/test/dashboard-queries.test.ts src/test/dashboard-page.test.tsx` — **PASS** `Test Files 3 passed (3) | Tests 41 passed (41) | Duration 3.19s`.
- `bun run test:run` (full) — **PASS** `Test Files 33 passed | 5 skipped (38) | Tests 195 passed | 31 skipped (226) | Duration 31.85s`. No regression in grant-ui/contract/domain suites.
- `bunx --bun tsc --noEmit` — **PASS** (no output).
- `bun run lint` — **PASS** (no output).
- `bunx --bun prisma validate` — **PASS** `Prisma schema loaded from prisma/schema.prisma. The schema at prisma/schema.prisma is valid 🚀` (Prisma 7.9.1).
- `git diff --check` — **PASS** (no output).
- `git status --porcelain=v1` — `M dispatch/ACTIVE.md`, `M src/app/(authenticated)/(org-required)/dashboard/page.tsx`, `M src/test/feature-placeholder.test.tsx` plus 8 untracked creates: `dispatch/workstreams/portfolio-dashboard/`, `src/components/dashboard/`, `src/lib/dates/`, `src/lib/queries/dashboard.ts`, `src/test/dashboard-dates.test.ts`, `src/test/dashboard-page.test.tsx`, `src/test/dashboard-queries.test.ts`, `src/test/postgres-dashboard.integration.test.ts`, `src/types/dashboard.ts`.
- `git diff --stat HEAD` — `3 files changed, 13 insertions(+), 14 deletions(-)` (only the 3 modified tracked files); no other tracked paths changed, no schema diff, no `globals.css`/config drift.
- `grep -R "/deadlines" src/components/dashboard src/lib/queries/dashboard.ts` — **0 matches** (no deadlines continuation).
- `grep -R "overdue|dueWithin|deadlineWindow" /grants links` — verified absent in UI tests (assert `searchParams.has("overdue")==false` etc.).

### NOT run (and not claimed)
- Disposable PostgreSQL integration `src/test/postgres-dashboard.integration.test.ts` — **SKIPPED** because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset (opt-in `describe.skipIf(!enabled)`); tenant isolation/windows verified at unit level + structure review only.
- Browser validation (authenticated dashboard rendering and `?grant=` Sheet navigation via Local Host) — **NOT run**: Clerk/database state unavailable locally; jsdom accessibility/href assertions cover navigation but do not replace in-browser check. Not claimed as passed.
- `bun run build` / `next build` — **NOT run** in this VALIDATE (environment Turbopack `globals.css` pooled-process spawn issue is pre-existing per T002 receipt; `tsc` + `prisma validate` + `lint` + full tests pass as build gates). Should be re-validated in CI.

## Concerns / Deferrals

- Validate `npm run build` / production build and browser dashboard + `?grant=` Sheet flow in CI/with authenticated local DB (Clerk + `DATABASE_URL`) before READY_FOR_USER — environment limits prevented both here; no code defect observed.
- Run disposable Postgres isolation suite (`GRANTFLOW_TEST_DATABASE_ADMIN_URL` against throwaway DB) to exercise cross-org/soft-delete/aggregate/ordering assertions live — structure matches `postgres-portfolio-import.integration.test.ts` pattern and is skipped by design without admin URL.
- Known Work-Ready v0 UTC-vs-local-midnight limitation remains explicit per PLAN (no timezone infra); reassess only if product experience proves local-calendar alignment needs follow-up.
- This validator changed only this artifact (`dispatch/workstreams/portfolio-dashboard/VALIDATION.md`) and did not change branches, Git history, planning state, or other artifacts.
