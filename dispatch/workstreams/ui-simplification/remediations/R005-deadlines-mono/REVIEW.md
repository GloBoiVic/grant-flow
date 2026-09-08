# R005 - REVIEW

Role: REVIEW
Workstream: ui-simplification
Branch: solo/ui-simplification
Task: R005
Artifact: dispatch/workstreams/ui-simplification/remediations/R005-deadlines-mono/REVIEW.md
Date: 2026-09-08

## Verdict

**PASS** — R005 correctly implements the approved Deadlines alignment, status-padding, and mono dotted-zero remediation within bounded scope. Geist Mono plain-zero swap (keeping IBM Plex Sans for words), `DeadlineRow` alignment restoration (`py-4`, `sm:items-center`, `font-sans` on time/Badge), and grants/deadlines Badge unification (`px-2 py-0.5 text-xs font-medium rounded-full` via shared `Badge`) are verified in source at cited lines, with tabular-nums preserved on numbers, `max-w-7xl`/`max-w-6xl` width contracts intact, no schema/query/DTO/auth/import/export change, and all required checks passing. No CRITICAL or IMPORTANT findings.

## Scope Verification

Reviewed against:
- `dispatch/workstreams/ui-simplification/PLAN.md` (frozen composition `PLAN:178-189` single bordered Deadline surface, `PLAN:243-282` width/composition contracts, functional invariants, explicit out-of-scope)
- `dispatch/workstreams/ui-simplification/remediations/R005-deadlines-mono/BUILD.md` (exact outcome: mono plain zero, deadlines alignment `deadline-view.tsx:58-78`, status padding via `badge.tsx:8`, affected seams, out-of-scope, regression evidence)
- `dispatch/workstreams/ui-simplification/remediations/R005-deadlines-mono/VALIDATION.md` (checks, verdict PASS, zero CRITICAL/IMPORTANT, 259/37 tests, tsc/build clean)
- Diff vs `HEAD` (`08181a9`): `src/app/layout.tsx`, `src/app/globals.css`, `src/components/deadlines/deadline-view.tsx`, `src/components/grants/grants-page.tsx`, `src/components/dashboard/dashboard-content.tsx`, `src/components/grants/grant-workspace.tsx` (HEAD diff inspected; full worktree 24-file diff includes accumulated T001-T005 + R001-R004 — R005 isolated to these 6 seams per BUILD:49-54; `badge.tsx` correctly untouched)

### In scope (DEFECT) — verified fixed

1. **Mono dotted zero replaced with plain-zero mono** (`src/app/layout.tsx:1-3,12-17,24-28`, `src/app/globals.css:8-14,25-27`)
   - `src/app/layout.tsx:2` now `import { Geist_Mono, IBM_Plex_Sans } from "next/font/google"` — `IBM_Plex_Mono` (dotted center-dot zero) removed, `Geist_Mono` introduced as `geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400","500","600","700"], display: "swap" })` at `:12-17` — matches BUILD:36 `variable: "--font-mono"` / `subsets latin` / `weight 400/500/600/700` / `display swap`. Both variables applied at `:28` as `` `${ibmPlexSans.variable} ${geistMono.variable} h-full antialiased` `` — IBM Plex Sans for words preserved.
   - `ibmPlexSans` at `:5-10` retains `variable: "--font-sans"` weight 400/500/600/700 display swap — precisely keeps approved C words stack per BUILD:36 and out-of-scope BUILD:58.
   - `src/app/globals.css:9,13,25-27` header updated to `IBM Plex Sans / Geist Mono are loaded via next/font with variables: "--font-sans" / "--font-mono"` and `Fonts: IBM Plex Sans (--font-sans) + Geist Mono (--font-mono)`, `:root --font-sans: "IBM Plex Sans", ...` retained, `--font-mono: "Geist Mono", ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace;` — `Geist Mono` plain oval zero (no center dot) replaces `IBM Plex Mono` dotted zero; `@theme inline --font-sans/--font-mono` at `:118-121` preserved.
   - `grep -r IBM_Plex_Mono src/` returns no matches — swap complete. `git diff HEAD -- src/app/layout.tsx` confirms exactly this hunk with no `--font-sans` body-stack regression.

2. **Deadlines alignment restored** (`src/components/deadlines/deadline-view.tsx:58-76`)
   - `DeadlineRow li` at `:60` now `group flex min-w-0 flex-col gap-2 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${rowClass}` — `py-4` (was `py-3.5`) restores scan density after Geist Mono metric change, `sm:items-center` + `sm:justify-between` centers title/funder vs right cluster per BUILD:41.
   - Right cluster `div` at `:70` `flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:shrink-0` — `items-center` + `shrink-0` prevents badge wrap misalignment as required.
   - `time` at `:71` now `shrink-0 whitespace-nowrap text-sm tabular-nums text-muted-foreground font-sans` — explicit `font-sans` prevents mono line-height offset while `tabular-nums` retained for date digits; `dateTime={item.deadline}` preserved.
   - `Badge` at `:74` now `shrink-0 font-sans ${statusClass[item.status] ?? ""}` — `font-sans` forces sans metric matching grants page (see #3).
   - Outer surface at `:92` remains `mt-6 overflow-hidden rounded-xl border border-border bg-card` single coherent surface with `groupConfig` `sectionClass` `""` / `"border-t border-border"` at `:19,27,35` (tinted `headerClass` removed) and `headingClass` `text-destructive` / `text-urgency-soon-fg` / `text-foreground` — matches `PLAN:178-189` one bordered three-group surface with `border-t` dividers, no card-per-group.
   - Header at `:84-90` now `max-w-7xl` + `Deadlines` H1 only (`As of` retained in header `:89`), restating subtitle removed — aligns with width contract and reduction principle.
   - `git diff HEAD -- src/components/deadlines/deadline-view.tsx` confirms exactly these 4 hunks (`sectionClass`/`headerClass` removal, `py-3.5`→`py-4`, `font-sans` on time/Badge, `max-w-6xl`→`max-w-7xl` via earlier T003 but retained here).

3. **Status padding matches grants page via shared Badge** (`src/components/ui/badge.tsx:7-9`, `src/components/deadlines/deadline-view.tsx:74`, `src/components/grants/grants-page.tsx:157`, `src/components/dashboard/dashboard-content.tsx:225`)
   - `src/components/ui/badge.tsx:7-9` `badgeVariants` = `inline-flex w-fit shrink-0 items-center justify-center ... px-2 py-0.5 text-xs font-medium ... rounded-full` — unchanged; both surfaces reuse it without fork per BUILD:44-45.
   - `deadline-view.tsx:74` uses `<Badge className={`shrink-0 font-sans ${statusClass...}`}>` — same `px-2 py-0.5 text-xs font-medium rounded-full` with `font-sans` so height matches grants.
   - `grants-page.tsx:157` status cell changed from `<span className="inline-flex rounded-md px-2 py-0.5 text-caption font-semibold ...">` to `<Badge className={`font-sans ${statusClass[grant.status]}`}>{grant.status}</Badge>` — verified in `git diff HEAD -- src/components/grants/grants-page.tsx` hunk: `rounded-md`/`text-caption`/`font-semibold` divergence removed, now identical `px-2 py-0.5 text-xs font-medium rounded-full` via shared `Badge`; `font-sans` ensures same ascent as deadlines (BUILD:45).
   - `dashboard-content.tsx:225` upcoming `Badge` also `shrink-0 font-sans ${statusClass...}` — same pattern, no mono metric leakage.
   - `badge.tsx` not modified in R005 (diff empty) — correct reuse per BUILD:52.

4. **Numbers remain font-mono tabular-nums (prose stays sans)** (`src/components/dashboard/dashboard-content.tsx:128,139,150,155`, `src/components/grants/grants-page.tsx:157-158`, `src/components/grants/grant-detail-sheet.tsx:62`, `src/components/grants/grant-workspace.tsx:107-108`, `src/components/deadlines/deadline-view.tsx:71`)
   - Dashboard metrics at `dashboard-content.tsx:128,139,150,155` retain `font-mono text-metric font-normal text-muted-foreground tabular-nums tracking-metric` (Tracked grants, Open pipeline, Requested, Awarded) — unchanged from R004, plain Geist zero applied.
   - Grants table money cells at `grants-page.tsx:157-158` via diff now `font-mono text-muted-foreground tabular-nums` (right-aligned) — `date` cells remain sans `whitespace-nowrap` (correct, prose-adjacent).
   - `grant-detail-sheet.tsx:62` amount `font-mono text-sm font-normal text-muted-foreground tabular-nums` with `currencyDisplay: "code"`; `grant-workspace.tsx:107-108` amounts `font-mono font-normal text-muted-foreground tabular-nums` with `currencyDisplay: "code"` — amounts only, header/badge/funder prose remain sans (`grant-workspace.tsx:82` Badge `font-sans`).
   - `deadline-view.tsx:71` time explicitly `font-sans` — intentional: deadline dates stay sans tabular-nums, metrics/money stay mono.

### Out-of-scope — verified absent

- No schema, migration, query, DTO, action, auth/tenancy, status/deadline bucket, or import/export change: `git diff --stat HEAD` shows no `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/queries/*`, `src/lib/validations/*`, `src/generated/prisma/*`, `supabase/*`, or `src/app/**/actions.ts`; R005-scoped files limited to typography/alignment/badge normalization as listed in BUILD:49-54 and VALIDATION:86-89. `badge.tsx` untouched, status color mapping `statusClass` unchanged.
- No width change attributable to R005: scanning surfaces `dashboard-content.tsx:86 max-w-7xl`, `grants-page.tsx:141 max-w-7xl`, `deadline-view.tsx:84 max-w-7xl` vs constrained `grant-workspace.tsx:70 max-w-6xl` — matches workstream-bounded reduction (T002/T003) preserved; R005 itself only adjusted `deadline-view` `py-4`/`font-sans` and `Badge` normalization, not width token (VALIDATION:87 notes branch-wide `max-w-7xl` shift pre-dates R005). `funder-page`/`import` remain `max-w-6xl` (full worktree diff shows those files unchanged beyond prior T004/T005).
- No `IBM Plex Sans` body-font change, no sidebar org/app color change, no universal search, no logo/gradient, no new design tokens beyond mono swap: `--font-sans` still `IBM Plex Sans` at `globals.css:26` / `layout.tsx:5-10`; sidebar files not in R005 diff (BUILD:58 out-of-scope satisfied).

### Test relevance — verified

- `src/test/deadline-view.test.tsx` (deadline grouping, row fields, links, time values, per-group empty states) and `src/test/grant-ui.test.tsx` (grants table, grant sheet/workspace, money/currency) remain relevant to R005 alignment/badge/mono scope; BUILD focused run `deadline-view + grant-ui` 27 tests PASS, rated in VALIDATION:20-25.
- `src/test/dashboard-page.test.tsx` metrics expectations retain `font-mono tabular-nums` on four metrics — correctly passes with Geist Mono (plain zero) without churn.
- Full suite `npm run test:run` 259 passed / 37 skipped (296 total) baseline preserved across BUILD and VALIDATION and now REVIEW.

## Checks / Evidence

Re-executed by REVIEW (2026-09-08):

- `npm run test:run` -> `Test Files 39 passed | 5 skipped (44)` / `Tests 259 passed | 37 skipped (296)` Duration 1.95s — PASS, matches BUILD `39/5, 259/37 (296 total)` and VALIDATION:20
- `npx tsc --noEmit` -> no output, EXIT 0 — PASS
- `git diff --check` -> no output, EXIT 0 — PASS, clean whitespace
- `npm run lint` (eslint) -> EXIT 0 — PASS
- `npm run build` -> `Prisma generate` OK, `Next.js 16.3.0` `Compiled successfully in 316ms`, `Finished TypeScript in 889ms`, `Generating static pages 11/11 in 121ms`, 11 routes (`/dashboard`, `/deadlines`, `/grants`, etc.), fonts via `next/font` with no error — PASS
- Source inspection: confirmed `layout.tsx:2 Geist_Mono + IBM_Plex_Sans variable --font-mono/--font-sans weight 400/500/600/700 display swap` at `:12-17`, `:28` both variables on `<html>`, `globals.css:9 IBM Plex Sans / Geist Mono via next/font`, `:13 Fonts: IBM Plex Sans + Geist Mono`, `:27 --font-mono: "Geist Mono" plain oval zero`, `deadline-view.tsx:60 py-4 sm:items-center + :71 time font-sans tabular-nums + :74 Badge shrink-0 font-sans + :84 max-w-7xl single rounded-xl border bg-card + :19,27,35 sectionClass border-t`, `badge.tsx:8 px-2 py-0.5 text-xs font-medium rounded-full` shared, `grants-page.tsx:157 Badge font-sans vs prior span rounded-md text-caption font-semibold`, `dashboard-content.tsx:128,139,150,155 font-mono text-metric tabular-nums`, `grant-workspace.tsx:107-108 font-mono tabular-nums amounts`, `grant-detail-sheet.tsx:62 font-mono tabular-nums` — all present.
- Diff stat: `24 files changed` (accumulated T001-T005 + R001-R005); R005-scoped hunks limited to mono/alignment/badge as above; no generated/migration/schema/auth paths.
- VALIDATION.md checks re-verified and consistent with BUILD.md; no application code edited by VALIDATE or REVIEW.

## Findings

No CRITICAL or IMPORTANT PRODUCT or REGRESSION defects. One inherited MINOR tooling limitation carried forward.

### CRITICAL

- 0

### IMPORTANT

- 0

### MINOR

- **MINOR | TOOLING | NEW SCOPE** — No Safari Technology Preview visual run claimed by VALIDATE or REVIEW for R005 (alignment and badge-height equivalence judged from source + shared `Badge` reuse; plain-zero zero verified via Geist Mono documented glyph vs IBM Plex Mono dotted zero). Not a product defect; does not block R005. Recommend renewed human Safari visual confirmation of Deadlines row baseline (title/funder vs time/badge `sm:items-center`), Grants vs Deadlines badge height match, and Geist Mono plain-zero rendering at next ready-for-user gate per `PLAN.md:14` and prior `MINOR | TOOLING` practice. (DEFECT: none; NEW SCOPE: 1 tooling limitation)
- 0 PRODUCT defects.
- 0 REGRESSION defects.
- Approved-scope note (not a finding): Branch-wide `max-w-7xl` on Dashboard/Grants/Deadlines vs `max-w-6xl` on Workspace/Funders/Import is intentional workstream-bounded reduction pre-dating R005 (VALIDATION:87) and widening is not introduced by R005.

Classification summary:
- `DEFECT`: 0 (all three approved R005 defects correctly remediated)
- `NEW SCOPE`: 1 (tooling browser-evidence limitation, not a defect)

## Concerns

- None blocking. R005 diff is limited to 6 seams as bounded remediation; no scope widening detected. Full worktree has 24 modified files (T001-T005 + R001-R005) but R005-scoped hunks introduce no width/schema/auth change.

## Receipt

ROLE: REVIEW
STATUS: PASS
ARTIFACT: dispatch/workstreams/ui-simplification/remediations/R005-deadlines-mono/REVIEW.md
FILES CHANGED: dispatch/workstreams/ui-simplification/remediations/R005-deadlines-mono/REVIEW.md
CHECKS / EVIDENCE: npm run test:run -> 39 passed | 5 skipped (44 files), 259 passed | 37 skipped (296 tests) Duration 1.95s; npx tsc --noEmit -> EXIT 0; git diff --check -> EXIT 0 clean; npm run lint -> EXIT 0; npm run build -> Prisma generate OK, Next 16.3.0 Compiled successfully in 316ms, TypeScript 889ms, 11 static pages, fonts via next/font; source audits verified layout.tsx:2 Geist_Mono + IBM_Plex_Sans variable --font-mono/--font-sans weight 400/500/600/700 display swap, :28 both variables, globals.css:9,13,27 Geist Mono plain zero fallback, deadline-view.tsx:60 py-4 sm:items-center sm:justify-between + :71 time font-sans tabular-nums + :74 Badge shrink-0 font-sans + :84 max-w-7xl single rounded-xl border + :19,27,35 border-t dividers, badge.tsx:8 px-2 py-0.5 text-xs font-medium rounded-full shared, grants-page.tsx:157 Badge font-sans identical padding, dashboard-content.tsx:128,139,150,155 font-mono text-metric tabular-nums; git diff --stat 24 files (T001-R005 accumulated), R005 hunks isolated
FINDINGS / CONCERNS: No CRITICAL/IMPORTANT PRODUCT or REGRESSION findings. Zero MINOR product defects. One MINOR | TOOLING | NEW SCOPE browser-evidence limitation (no Safari snapshot) — not blocking. Concerns: none blocking.
