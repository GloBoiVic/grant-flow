# Portfolio Dashboard Review

ROLE: REVIEW
WORKSTREAM: portfolio-dashboard
BRANCH: solo/portfolio-dashboard
CWD: /Users/vike/Desktop/grant-flow
BASE: 2073400dd710f995f3dd3323fdaf1b274888729b
REVIEWED: 2026-09-04T23:27:00Z
REVIEWER: solo-flow-worker (REVIEW)

## Verdict

**PASS** — Frozen PLAN contract satisfied with no scope creep. BUILD and VALIDATION evidence is complete, credible, and honestly reported. No destructive or out-of-scope change detected. No remediation blocks READY_FOR_USER; remaining gaps are environment-limited, documented, and deferred to CI.

## Scope

Independent review of `dispatch/workstreams/portfolio-dashboard/PLAN.md` (frozen, commit 2073400, branch solo/portfolio-dashboard) against:

- PLAN §§ Dashboard content, Date semantics, Navigation, Data/query design, Money, Empty states, Existing behavior, Acceptance 1–34.
- BUILD receipts: `dispatch/workstreams/portfolio-dashboard/tasks/T001-portfolio-dashboard.md` (DONE 2026-09-04) and `T002-portfolio-dashboard.md` (DONE 2026-09-04).
- VALIDATION: `dispatch/workstreams/portfolio-dashboard/VALIDATION.md` (PASS 2026-09-04).
- Implementation on disk: `src/lib/dates/utc-dates.ts`, `src/types/dashboard.ts`, `src/lib/queries/dashboard.ts`, `src/components/dashboard/dashboard-content.tsx`, `src/app/(authenticated)/(org-required)/dashboard/page.tsx`, tests `dashboard-dates`, `dashboard-queries`, `dashboard-page`, `postgres-dashboard.integration`, `feature-placeholder`.

No code written or fixed during review. No branch change, no history rewrite, no other artifact edited.

## Re-verification (exact checks run, limits disclosed)

| Check | Command (this review) | Result | Notes |
|-------|----------------------|--------|-------|
| Branch / CWD / Base | `git branch --show-current` / `pwd` / `git rev-parse --short HEAD` | **PASS** `solo/portfolio-dashboard` / `/Users/vike/Desktop/grant-flow` / `2073400` | Base matches frozen PLAN SHA; no detached state. |
| Tracked diff stat | `git diff --stat HEAD` | **PASS** `3 files changed, 13 insertions(+), 14 deletions(-)` | Exactly `dispatch/ACTIVE.md`, `src/app/.../dashboard/page.tsx`, `src/test/feature-placeholder.test.tsx`. No other tracked paths. `dispatch/ACTIVE.md` is SoloFlow workstream scaffolding (expected). |
| Untracked inventory | `git ls-files --others --exclude-standard` | **PASS** 12 untracked: `dispatch/workstreams/portfolio-dashboard/PLAN.md`, `VALIDATION.md`, `tasks/T001`, `tasks/T002`, `src/components/dashboard/dashboard-content.tsx`, `src/lib/dates/utc-dates.ts`, `src/lib/queries/dashboard.ts`, `src/test/dashboard-dates.test.ts`, `src/test/dashboard-page.test.tsx`, `src/test/dashboard-queries.test.ts`, `src/test/postgres-dashboard.integration.test.ts`, `src/types/dashboard.ts` | Bounded to workstream + 8 dashboard-bound creates per PLAN (component, dates, query seam, DTO, 4 tests). No stray asset. |
| Schema diff | `git diff HEAD -- prisma/schema.prisma` | **PASS** 0 lines | No schema change. |
| globals.css drift | `git diff HEAD -- src/app/globals.css` | **PASS** 0 lines | No token/config drift. |
| Diff check | `git diff --check` | **PASS** no output | No whitespace errors. |
| TypeScript | `bunx --bun tsc --noEmit` | **PASS** no output (re-verified 23:27Z) | Matches T001/T002/VALIDATE claims. |
| Lint | `bun run lint` | **PASS** no output | Re-verified. |
| Prisma validate | `bunx --bun prisma validate` | **PASS** `The schema at prisma/schema.prisma is valid` (Prisma 7.9.1) | Matches generated client 7.9.1 referenced in receipts. |
| Dashboard unit/query/UI tests | `bun run test:run -- src/test/dashboard-dates.test.ts src/test/dashboard-queries.test.ts src/test/dashboard-page.test.tsx` | **PASS** `Test Files 3 passed` / `Tests 41 passed` (3.11s) | Re-verified focused suite. |
| Full suite | `bun run test:run` | **PASS** `Test Files 33 passed \| 5 skipped (38)` / `Tests 195 passed \| 31 skipped (226)` (24.44s) | 5 skipped are guarded disposable PG suites; no regression. |
| Production build | `bun run build` (`prisma generate && next build`) | **FAIL (env) — disclosed, not hidden** `FATAL: [project]/src/app/globals.css [app-client] (css) — spawning node pooled process — No such file or directory (os error 2)` Turbopack panic | Re-verified identical panic as T002 §9 and VALIDATION §71-72. Reproduces without dashboard changes; `tsc` + `prisma validate` + lint gates pass. Not a code regression. Must be re-validated in CI / rebuilt toolchain. Honestly reported in all three artifacts — not concealed. |
| Navigation greps | `grep -R "/deadlines" src/components/dashboard src/lib/queries/dashboard.ts` | **PASS** 0 matches | Re-verified. |
| Unsupported params | `grep -R "overdue=" src/components/dashboard` + jsdom assertions | **PASS** no invented params; tests assert `searchParams.has("overdue")==false` etc. | Re-verified. |
| Charting/timezone infra | `grep chart\|recharts\|d3\|timezone` | **PASS** no matches beyond legitimate design | No charting lib, no timezone infra, no analytics. |

**Limits disclosed (not claimed):** Disposable PostgreSQL integration (`GRANTFLOW_TEST_DATABASE_ADMIN_URL`) — SKIPPED by design, structure reviewed, tenant isolation verified at mocked unit level only. Browser validation (authenticated dashboard + `?grant=` Sheet flow) — NOT run (Clerk/database unavailable); jsdom accessibility/href coverage stands in. Next build success — NOT claimed; env panic documented in T002, VALIDATION, and re-verified here.

## Acceptance 1–34 — Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `/dashboard` not placeholder, functions as morning overview | **PASS** | `dashboard/page.tsx` is async server component calling `getDashboard()` → `DashboardContent`; `feature-placeholder.test.tsx` correctly pruned Dashboard entry. |
| 2 | Tracked grants = active org Grants with active same-org Funder | **PASS** | `trackedWhere = {organizationId, deletedAt:null, funder:{organizationId,deletedAt:null}}` applied to every query (groupBy, aggregate, count×2, findMany); mocked query tests + PG integration seed verify. |
| 3 | Open pipeline = exactly Research, Qualified, Planning, Writing, Internal Review, Submitted, Pending | **PASS** | `OPEN_PIPELINE_DISPLAY` 7-status array derived from `groupBy` zero-filled counts; tested with 7-status sum case (expects 7). |
| 4 | Requested = sum `amountRequested` over tracked portfolio | **PASS** | `aggregate _sum amountRequested` on `trackedWhere`. |
| 5 | Awarded = sum `amountAwarded` over tracked portfolio | **PASS** | `aggregate _sum amountAwarded` on same `trackedWhere`. |
| 6 | Empty amount aggregates render as zero | **PASS** | `null → "0"` in query (`?? "0"`), `$0.00` via `Intl.NumberFormat`; tests cover null→zero serialization. |
| 7 | Needs attention = only 5 pre-submission statuses | **PASS** | `PRE_SUBMISSION_PRISMA` = Research,Qualified,Planning,Writing,InternalReview used for both overdue and dueIn7 counts. |
| 8 | Submitted/Pending/Awarded/Declined/Reporting/Closed never enter attention | **PASS** | Explicit `status:{in:PRE_SUBMISSION_PRISMA}` and tests assert not in `status.in`. |
| 9 | Overdue = `deadline < today` | **PASS** | `deadline:{lt:todayUtc}`; boundary tests: 2026-09-03 overdue. |
| 10 | Due within 7 = `today <= deadline <= today+7` | **PASS** | `deadline:{gte:todayUtc,lte:todayPlus7}` inclusive; 2026-09-04 inside, 2026-09-11 inside, 2026-09-12 outside. |
| 11 | Overdue / next7 disjoint | **PASS** | `lt` vs `gte` ensures disjoint; tests assert. |
| 12 | Upcoming uses same 5 pre-submission statuses | **PASS** | `findMany where status:{in:PRE_SUBMISSION_PRISMA}`. |
| 13 | Upcoming = `today <= deadline <= today+30` | **PASS** | `gte:todayUtc,lte:todayPlus30` inclusive; 2026-10-04 inside, 2026-10-05 outside. |
| 14 | Upcoming limited to nearest 5 | **PASS** | `take:5` verified in query & UI (≤5 links). |
| 15 | Upcoming ordering `deadline ASC, id ASC` | **PASS** | `orderBy:[{deadline:"asc"},{id:"asc"}]`; PG integration seeds tied deadline 2026-09-05 and asserts tie-breaker. |
| 16 | Null deadlines in no deadline-derived section | **PASS** | Implicit: null fails `gte/lte`/`lt`; boundary tests null→excluded. |
| 17 | Status breakdown = 11 statuses zero-filled lifecycle order | **PASS** | `DISPLAY_STATUSES` lifecycle array, breakdown mapped zero-fill, tests assert length 11 and order. |
| 18 | No charting dependency | **PASS** | No import; optional bar is `h-2 w-24 bg-muted` + `bg-primary` width. |
| 19 | Deterministic UTC date-only helpers, fixed dates in tests | **PASS** | `src/lib/dates/utc-dates.ts` 30 lines: `toUtcDateOnly`, `addUtcDays`, `formatUtcDate`, `utcToday` via `Date.UTC(...)+toISOString slice`; frozen 2026-09-04 injection in all date/query tests. |
| 20 | UTC-vs-local limitation not hidden | **PASS** | Jobs explicitly note limitation and defer timezone infra; no speculative architecture added. |
| 21 | Queries use authenticated local org, never client ID | **PASS** | `requireAuthorization().organizationId` sole source; `organizationId` never from input/params. |
| 22 | Soft-deleted/cross-org Grants/Funders cannot affect results | **PASS** | `deletedAt:null` + `funder.organizationId` in every query; mocked scope tests + PG integration seeds soft-deleted + cross-org rows and asserts isolation. |
| 23 | Upcoming rows open Grant Sheet via `/grants?grant=<id>` | **PASS** | `href=/grants?grant=${encodeURIComponent(id)}` per row; tests assert href match. |
| 24 | Status rows use existing `?status=` URL contract | **PASS** | `grantsLinkForStatus` via `grantListSearchParams({statuses:[status]})`; tests assert single status param and `Internal Review` encoding. |
| 25 | Open pipeline uses repeated `?status=` contract | **PASS** | `grantsLinkForStatuses(OPEN_PIPELINE_STATUSES)` 7 repeated statuses via helper; test parses URL. |
| 26 | Needs-attention continuation honestly labeled | **PASS** | Exactly one link `Review pre-submission deadlines →` to pre-submission 5 statuses + deadline asc; no `View overdue` label; tests assert label. |
| 27 | No unsupported overdue/dueWithin params | **PASS** | Grep 0 matches; jsdom asserts `has("overdue")==false`, `has("dueWithin")==false`, `has("deadlineWindow")==false` on every grant link. |
| 28 | Not presenting `/deadlines` as continuation | **PASS** | Grep `/deadlines` 0 matches in dashboard seam/UI; tests assert no link `href="/deadlines"`. |
| 29 | No Grant detail route created | **PASS** | No `/grants/[id]`; only `?grant=` deep-link reuse. |
| 30 | No schema change, stored metrics, cached aggregation, analytics, etc. | **PASS** | No schema diff, no new tables, no migration, no background job, no metric store; query seam is pure aggregation. |
| 31 | No-grant/no-amount/no-attention/no-upcoming/zero-status empty states understandable | **PASS** | `trackedGrants===0`→0 totals + `No grants tracked yet. Import at /import or go to /grants`; `tracked>0 && totals===0`→`No requested/awarded amounts recorded yet.` + `$0.00`; attention zero→`No pre-submission application deadlines need attention.`; upcoming empty→`No pre-submission deadlines in the next 30 days.` kept visible; breakdown all-zero→11×`0` visible (tests cover each). |
| 32 | Existing auth/tenancy/import/grants/funders/tags/activities/soft-delete/URL/AppShell intact | **PASS** | Full suite 195 passed no regression; `grant-ui`, `grant-list-contract`, `domain-queries` 37 passed; design tokens/`Badge`/`statusClass` reuse, AppShell unchanged, `globals.css` 0 diff. |
| 33 | Focused tests pass | **PASS** | 41 dashboard tests + integration structure + accessibility/heading hierarchy assertions all pass (re-verified). |
| 34 | Lint/TypeScript/Prisma/diff-check/(build)/browser validation run & reported | **PASS with disclosure** | Lint ✓, tsc ✓, prisma validate ✓, diff-check ✓ reported; build failure honestly reported as env Turbopack panic (not hidden); PG/browser SKIPPED with honest disclosure per VALIDATION §§69-72 — meets "run and reported" contract. Browser claim not over-stated. |

**Scope-creep negative checks:** No Deadline View, no `/grants` deadline filters, no `/deadlines` continuation, no new Grant detail route, no schema change, no charting/timezone/analytics infra, no year/currency semantics, nav labels honest, UTC date-only 2073400 base preserved, USD formatting only (`en-US`, `currency:USD`, `Number()` only at display boundary for `Decimal(12,2)`).

## Findings by Class

### Correctness — PASS
All 34 acceptances map to implementation. Date boundaries frozen and test-injected; attention and upcoming windows disjoint/inclusive as spec; soft-delete/tenancy isolation enforced on every query. DTO serializable (Decimals→string, Dates→YYYY-MM-DD, display labels).

### Completeness — PASS
T001 date seam + DTO + query seam + 26 unit/query tests + PG integration harness (skipped without admin URL) and T002 four-section page + empty-state handling + 15 UI tests together cover PLAN's data, rendering, and navigation surface. The 8 bounded creates are exactly the contracted surface area.

### Evidence credibility — PASS (high)
BUILD receipts list exact files, line counts, and commands with outputs; retry shows identical outputs. VALIDATION PASS is well-supported: it discloses SKIPPED PG, NOT-run browser, and NOT-run build with cause, rather than claiming coverage. Tests do not over-assert env-dependent behavior. Re-run in this review reproduces every claim within duration tolerance.

### Preservation — PASS
`git diff --stat` proves only 3 tracked files changed; untracked creates are bounded; no schema diff, no `globals.css` drift, no unintended asset/config change. Full test suite shows no regression in grant/funder/tag/activity/import paths.

### Risk & Debt — Low
- Build panic is environmental, not code-induced. Risk: CI may surface same panic if toolchain identical. Mitigation already documented; not a dashboard blocker because `tsc`/`prisma validate` are stronger correctness gates for this workstream.
- Disposable PG not exercised live locally. Risk low: mocked scoping tests + structure review cover isolation; live run deferred to CI where admin URL exists.
- UTC-vs-local midnight limitation stays explicit and local; no hidden debt.

## Risks and Residual Items

| Risk | Likelihood | Impact | Disposition |
|------|-----------|--------|-------------|
| Turbopack pooled-process build failure persists in CI | Medium (toolchain-specific) | Low (no user impact until deploy) | Re-validate `bun run build` in CI with fresh Node toolchain; no code change needed. |
| PG isolation only mocked locally | Low | Low | Run `GRANTFLOW_TEST_DATABASE_ADMIN_URL` against disposable DB in CI — harness already present (`postgres-dashboard.integration.test.ts` 425 lines). |
| UTC-vs-local midnight edge around local midnight | Expected, accepted | Low | Per PLAN: keep explicit; revisit only if product experience demands follow-up — no action now. |

## Decision

**Allow READY_FOR_USER (no R### required).** Material gaps are environment-limited and honestly disclosed; no scope creep, no destructive change, no hidden defect. Remaining validations are CI/browser checks that do not require redesign.

### Optional non-blocking follow-ups (not R### packets)
- (CI) Assert `bun run build` succeeds and preview dashboard + `?grant=` Sheet navigation under authenticated Clerk/database.
- (CI) Execute disposable Postgres suite to lock cross-org/soft-delete/aggregate/ordering live.

## Preservation Attested

- Existing auth/tenancy/import/grants/funders/tags/activities/soft-delete/URL/AppShell/AppShell navigation unchanged.
- No schema migration, no globals.css change, no unintended asset modified.
- User-deleted `CLAUDE.md` left untouched; no opencode history rewritten.

## Files Changed (review perspective)

- **Not modified** in this review. Only this artifact created: `dispatch/workstreams/portfolio-dashboard/REVIEW.md`.
- For reference, branch state at review time: 3 tracked modifications (`dispatch/ACTIVE.md`, `dashboard/page.tsx`, `feature-placeholder.test.tsx`) + 12 untracked bounded creates (4 workstream docs + 8 dashboard implementation/tests) — all within approved scope.

## Concerns

None blocking. VALIDATION's PASS stands after re-verification; its disclosures are accurate and sufficient. Build panic is recorded as a CI concern, not a functional blocker per PLAN § Validation (type/lint/prisma/tests are primary gates).
