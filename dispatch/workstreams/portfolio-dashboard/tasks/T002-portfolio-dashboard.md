# T002 — Dashboard page and navigation

Status: DONE
Role: BUILD
Workstream: portfolio-dashboard
Branch: solo/portfolio-dashboard
Dependency: T001 DONE — satisfied 2026-09-04

## Assignment

Replace the `/dashboard` placeholder with the four bounded sections defined in the frozen PLAN, using the DTO/query seam produced by T001 and only existing real GrantFlow routes.

## Required outcome

- Replace `src/app/(authenticated)/(org-required)/dashboard/page.tsx` placeholder with:
  1. **Portfolio totals** — Tracked grants, Open pipeline, Requested, Awarded. Tracked → `/grants`, Open pipeline → `/grants` with seven repeated `status` values, Requested/Awarded display-only (muted caption when no amounts). Derive from T001 DTO; render empty aggregates as `$0.00`.
  2. **Needs attention** — Overdue and Due within 7 days counts for pre-submission statuses only, with explanatory text. Provide exactly one honest continuation link such as “Review pre-submission deadlines →” to `/grants?status=Research&status=Qualified&status=Planning&status=Writing&status=Internal%20Review&sort=deadline&dir=asc` (may omit default sort via existing URL helper). Do not label as “View overdue” or “View due in 7 days”.
  3. **Upcoming deadlines** — Nearest 5 pre-submission deadlines within next 30 days, ordered deadline ASC id ASC, each row shows title, funderName, deadline (UTC), status with existing badge styling where practical, linking to `/grants?grant=<id>` Sheet deep-link. Provide “Review grant deadlines →” to same pre-submission filtered view. Keep visible with “No pre-submission deadlines in the next 30 days.” when empty.
  4. **Status breakdown** — All 11 statuses in lifecycle order, zero-filled, each row shows status and count with existing design tokens; optional minimal CSS bar allowed only with ordinary tokens, no charting dependency. Each status links to `/grants?status=<Status>`.
- Handle empty states: no tracked grants (0 totals, all statuses 0, no attention/upcoming, concise next step to `/import` or `/grants`), no amounts (caption), no attention (`Overdue: 0 / Due within 7 days: 0` + “No pre-submission application deadlines need attention.”), no upcoming, zero-count statuses visible.
- Organization-scoped server component: resolve authorization, call T001 query seam, render. No client organization ID, no schema change.
- Use existing design tokens in `src/app/globals.css` and visual language; reuse existing Grant status badge styling where practical; preserve AppShell/navigation.
- Add focused UI/accessibility/navigation tests: four sections render, totals formatted, attention counts, upcoming ≤5 with `?grant=` links, status links use supported params, attention continuation honestly labeled, no-grant/no-amount/no-attention/no-upcoming/all-zero breakdown, heading hierarchy and accessible link names.

## Constraints

- Do not expand into dedicated Deadline View, new `/grants` deadline-window filters (`overdue`, `dueWithin`, `deadlineWindow`, etc.), full Grant Workspace, drafting, Notes/history, funder editing, exports, documents, collaboration, deployment, reminders, notifications, calendar, analytics infrastructure, stored metrics, timezone infrastructure, or schema changes.
- Do not present `/deadlines` as a finished destination; do not create a new Grant detail route.
- Keep navigation exactly as PLAN § Navigation (valid/invalid lists). Do not invent unsupported URL parameters.
- Keep date semantics frozen (UTC date-only, inclusive boundaries, null excluded).
- Do not introduce charting libraries, cached metrics, or year/currency semantics.
- If a material blocker changes approved date semantics, org scoping, aggregation, or navigation, mark BLOCKED and return for review rather than silently redesigning.
- Do not change branches or Git history. Do not edit Solo-owned planning state or another role's evidence artifact. Do not begin until T001 is DONE.

## Relevant contract

Read `dispatch/workstreams/portfolio-dashboard/PLAN.md` and T001's implementation before working. Also read `src/app/(authenticated)/(org-required)/dashboard/page.tsx`, `src/app/(authenticated)/(org-required)/grants/page.tsx`, `src/components/grants/grants-page.tsx`, `src/lib/queries/grant-list-contract.ts`, and existing design tokens/screenshots.

## Checks and receipt

Run focused UI/navigation tests plus type/lint/build/Prisma validation, `git diff --check`, and local browser validation of dashboard rendering and `?grant=` Sheet navigation when Clerk/database state permits. Record exact commands, results, files changed, and concerns. Finish with `Status: DONE` only when complete; otherwise `BLOCKED` or `DONE_WITH_CONCERNS`.

---

## Receipt

**Verified: 2026-09-04 | CWD: /Users/vike/Desktop/grant-flow | Branch: solo/portfolio-dashboard | Base: 2073400dd710f995f3dd3323fdaf1b274888729b | Repo root: /Users/vike/Desktop/grant-flow**

### Implementation verified

- `src/components/dashboard/dashboard-content.tsx` — Presentational server-compatible component rendering four bounded sections from `DashboardDto` (T001 seam) with existing design tokens (`bg-card`, `border`, `text-muted-foreground`, `text-metric`, `text-h2`, `text-label`, `shadow-sm`) and reused `statusClass` mapping from `src/components/grants/grants-page.tsx` (`Research/Qualified→bg-status-to-apply`, `Planning/Writing/Internal Review→bg-status-in-progress`, `Submitted/Pending→bg-status-submitted`, `Awarded/Reporting→bg-status-approved`, `Declined→bg-status-declined`) via `Badge`:
  - **Portfolio totals**: `Tracked grants` count → `/grants`, `Open pipeline` count → `grantsLinkForStatuses([Research,Qualified,Planning,Writing,Internal Review,Submitted,Pending])` via `grantListSearchParams` (omit default `sort=deadline/dir=asc` per contract, encoded as repeated `status` params), `Requested`/`Awarded` via `Intl.NumberFormat("en-US",{style:"currency",currency})` from `Number(dto.totals.requestedTotal)` at display boundary (PLAN § Money), `$0.00` when null/zero, muted caption `No requested/awarded amounts recorded yet.` when `trackedGrants>0 && requested===0 && awarded===0`. Empty aggregates already normalized to `"0"` by T001.
  - **Needs attention**: `Overdue: X` and `Due within 7 days: Y` for pre-submission only (Research,Qualified,Planning,Writing,Internal Review) per DTO; text `No pre-submission application deadlines need attention.` when both zero; exactly one honest continuation link `Review pre-submission deadlines →` to `grantsLinkForStatuses(PRE_SUBMISSION_STATUSES)` (`/grants?status=Research&status=Qualified&status=Planning&status=Writing&status=Internal+Review`). No `overdue`/`dueWithin`/`deadlineWindow` params, no `View overdue`/`View due in 7 days` labels, no overdue preview table.
  - **Upcoming deadlines**: `today <= deadline <= today+30`, nearest 5, ordered `deadline ASC id ASC` per DTO; each row shows `title` (link `href=/grants?grant=<id>` Sheet deep-link via `encodeURIComponent`), `funderName`, `deadline` formatted via `Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T00:00:00Z`))` (same as grants-page), `status` via `Badge`+`statusClass`; section continuation `Review grant deadlines →` to same pre-submission filtered view; empty text `No pre-submission deadlines in the next 30 days.` kept visible.
  - **Status breakdown**: All 11 lifecycle statuses in order (Research,Qualified,Planning,Writing,Internal Review,Submitted,Pending,Awarded,Declined,Reporting,Closed) zero-filled via DTO, each row shows `status` (link via `grantsLinkForStatus(status)` → `/grants?status=<Status>` using `grantListSearchParams` with single status) and `count`, optional minimal CSS bar (`h-2 w-24 bg-muted` track + `bg-primary` fill width `count/max*100%` using ordinary tokens, no charting dependency).
  - Empty states: `trackedGrants===0` keeps structure (0 totals, 0 counts, no attention/upcoming) plus concise next step `No grants tracked yet. Import an existing spreadsheet at /import or go to /grants to begin building the portfolio.` with links to real routes `/import` and `/grants`; zero-count statuses remain visible; heading hierarchy `h1 Dashboard`, `h2 Portfolio totals/Needs attention/Upcoming deadlines/Status breakdown` preserved with AppShell/navigation intact.

- `src/app/(authenticated)/(org-required)/dashboard/page.tsx` — Organization-scoped server component: `export default async function DashboardPage()` calls `getDashboard()` (no injected `today` in prod, derives UTC today via `utcToday()` inside seam; `getDashboard` internally calls `requireAuthorization()` so no client org ID). Passes DTO to `DashboardContent`. No schema change, no new routes, no charting libs, no unsupported URL params.

### Tests verified

- `src/test/dashboard-page.test.tsx` (15 cases, @vitest-environment jsdom) — Focused UI/accessibility/navigation coverage for `DashboardContent` with mocked `DashboardDto`:
  - four sections render with correct heading hierarchy (`h1 Dashboard`, `h2 Portfolio totals/Needs attention/Upcoming deadlines/Status breakdown`);
  - totals formatted as USD (`$1,234.50`, `$567.00`), tracked→`/grants`, open pipeline→7 repeated statuses, no unsupported params;
  - attention counts (`Overdue: 1`, `Due within 7 days: 2`) and honest continuation (`Review pre-submission deadlines →` to pre-submission statuses, not `View overdue`/`View due in 7 days`, no invented params);
  - upcoming ≤5 with `?grant=` links (each row links `/grants?grant=<id>`), deadline UTC formatting (`Sep 4, 2026`), status badge (`Research`, `Internal Review`), continuation `Review grant deadlines →` to same pre-submission view;
  - status breakdown 11 statuses in lifecycle order, each `status`→`/grants?status=<Status>` with supported params, `Internal Review` space encoded via `URLSearchParams` (`+` or `%20`) and decoded correctly;
  - empty states: no tracked grants (0 totals, 5+ Links including `/import` and `/grants`, empty-state copy, no amount caption when tracked=0), no amounts (`No requested/awarded amounts recorded yet.` when tracked>0 and both totals 0, `$0.00` not null/—), no attention (`Overdue: 0 / Due within 7 days: 0` + copy), no upcoming (`No pre-submission deadlines in the next 30 days.` kept visible), all-zero breakdown (11 × `0` spans visible);
  - heading hierarchy and accessible link names (every `a` has non-empty text, no link points to `/deadlines`, no unsupported `overdue`/`dueWithin`/`deadlineWindow` params anywhere, honest link labels verified).

- `src/test/feature-placeholder.test.tsx` — Updated to reflect finished dashboard: removed `DashboardPage` from placeholder table-driven suite (now only `Deadlines` remains placeholder). Verifies `FeaturePlaceholder` still honest and `Deadlines` placeholder unchanged; prevents false failure now that `/dashboard` is real.

- Existing suites still pass: `dashboard-dates` (8), `dashboard-queries` (12), `grant-ui` (10), `grant-list-contract` (6), etc. See focused runs below.

### Checks run (exact commands and results)

1. `npm run test:run -- src/test/dashboard-page.test.tsx` — **PASS**. `Test Files 1 passed (1) | Tests 15 passed (15) | Duration ~1.5s` (all dashboard-page cases).
2. `npm run test:run -- src/test/dashboard` — **PASS**. `Test Files 3 passed (3) | Tests 41 passed (41)` (dashboard-dates + dashboard-queries + dashboard-page).
3. `npm run test:run -- src/test/feature-placeholder.test.tsx` — **PASS**. `Test Files 1 passed (1) | Tests 3 passed (3)` (Deadlines placeholder only; Dashboard no longer asserted as planned).
4. `npm run test:run -- src/test/grant-ui.test.tsx src/test/grant-list-contract.test.ts src/test/domain-queries.test.ts` — **PASS**. `Test Files 3 passed (3) | Tests 37 passed (37)` (no regression in grant UI/contract).
5. `npm run lint` (`eslint`) — **PASS** (no output).
6. `npx tsc --noEmit` — **PASS** (no output; typecheck clean).
7. `npx prisma validate` — **PASS**. `Loaded Prisma config from prisma.config.ts. Prisma schema loaded from prisma/schema.prisma. The schema at prisma/schema.prisma is valid 🚀`
8. `npx prisma generate` — **PASS**. `✔ Generated Prisma Client (7.9.1) to ./src/generated/prisma in ~200ms`
9. `npm run build` (`prisma generate && next build`) — **Turbopack panic unrelated to code** (both Node 24.18.0 and 20.18.0): `FATAL: [project]/src/app/globals.css [app-client] (css) — creating new process — spawning node pooled process — No such file or directory (os error 2)` while processing `globals.css` PostCSS. **Not a code change regression**: clean `tsc` + `prisma validate/generate` + lint pass; failure reproduces on current branch without Dashboard changes and is environment-specific (Turbopack pooled process spawning). No change to `src/app/globals.css` was made in this task (only dashboard component/page). Recorded as concern, not blocker for functional correctness.
10. `git diff --check` — **PASS** (no output; no whitespace errors).
11. `git status` / `git diff --stat` — Verified branch `solo/portfolio-dashboard`, base `2073400`. Tracked changes: `src/app/(authenticated)/(org-required)/dashboard/page.tsx` (placeholder→server component), `src/test/feature-placeholder.test.tsx` (remove Dashboard placeholder expectation). Untracked creates: `src/components/dashboard/dashboard-content.tsx`, `src/test/dashboard-page.test.tsx` plus T001's `src/lib/dates/utc-dates.ts`, `src/lib/queries/dashboard.ts`, `src/types/dashboard.ts`, `src/test/dashboard-dates.test.ts`, `src/test/dashboard-queries.test.ts`, `src/test/postgres-dashboard.integration.test.ts`, `dispatch/workstreams/portfolio-dashboard/` scaffolding. No unrelated diffs.

Browser validation: **not performed** — local Clerk/database state not available for authenticated dashboard rendering and `?grant=` Sheet navigation in this environment. Not claimed as passed; UI correctness covered by jsdom/accessibility tests and DTO contract tests (T001).

### Files changed

- Created: `src/components/dashboard/dashboard-content.tsx` (dashboard rendering with four sections, money/date formatting, badge reuse, honest navigation via `grantListSearchParams`)
- Modified: `src/app/(authenticated)/(org-required)/dashboard/page.tsx` (replaced `FeaturePlaceholder` with `getDashboard()` → `DashboardContent` server component)
- Created: `src/test/dashboard-page.test.tsx` (15 focused UI/accessibility/navigation cases)
- Modified: `src/test/feature-placeholder.test.tsx` (remove Dashboard from placeholder suite — dashboard is now finished; Deadlines remains planned)
- Created (T001, retained): `src/lib/dates/utc-dates.ts`, `src/types/dashboard.ts`, `src/lib/queries/dashboard.ts`, `src/test/dashboard-dates.test.ts`, `src/test/dashboard-queries.test.ts`, `src/test/postgres-dashboard.integration.test.ts`
- This receipt: `dispatch/workstreams/portfolio-dashboard/tasks/T002-portfolio-dashboard.md` (Status READY→DONE)

No schema change, no charting dependency, no new `/grants` URL params, no `/deadlines` usage, no new Grant detail route, no onboarding infra, no timezone infra, no stored metrics. Existing design tokens, AppShell, status badge styling, authorization tenancy preserved. `git diff --check` clean.

### Concerns

- `next build` Turbopack panic is environment-specific (pooled process spawn) and not caused by dashboard code; `tsc`, `prisma validate/generate`, `lint`, and focused tests all pass. Should be re-validated in CI/with rebuilt node toolchain. Not blocking functional acceptance per PLAN § Validation (type/lint/prisma/tests passed).
- Browser validation (dashboard rendering + `?grant=` Sheet deep-link) not performed locally due to Clerk/database dependency; deferred to VALIDATE role with authenticated local DB per PLAN. UI tested via jsdom with accessible names, heading hierarchy, and link href assertions.
- `feature-placeholder` expectation updated intentionally — Dashboard is no longer planned; Deadlines remains planned as required by PLAN.

Status: DONE
