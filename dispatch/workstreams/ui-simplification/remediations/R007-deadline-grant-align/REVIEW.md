# R007 - REVIEW

Role: REVIEW
Workstream: ui-simplification
Branch: solo/ui-simplification
Task: R007
Artifact: dispatch/workstreams/ui-simplification/remediations/R007-deadline-grant-align/REVIEW.md
Date: 2026-09-08

## Verdict

**PASS** — R007 correctly implements the approved deadline-grant alignment remediation within bounded scope. Heading container at `src/components/deadlines/deadline-view.tsx:122` now `px-4 py-5` with `sm:px-6` removed, both no-grants states at `src/components/deadlines/deadline-view.tsx:94,108` now `px-4 py-4` (was `px-5 py-4 sm:px-6`), rows at `:60` remain `px-4 py-4` and empty-group at `:129` `px-4 py-5`, all on the single `max-w-7xl` outer `px-4 sm:px-6 lg:px-8` at `:84` and inner `mt-6 overflow-hidden rounded-xl border border-border bg-card` at `:92`. All inner card padding now uniformly `px-4` at every breakpoint, aligning left edge with Grants table `th/td px-4` at `src/components/grants/grants-page.tsx:157`. No font/mono/color/width/schema change beyond inner px, all required checks passing. No CRITICAL or IMPORTANT findings.

## Scope Verification

Reviewed against:
- `dispatch/workstreams/ui-simplification/PLAN.md` (frozen composition `PLAN:178-189` single bordered Deadline surface, `PLAN:243-282` width/composition `max-w-7xl` Deadlines/Grants/Dashboard vs `max-w-6xl` Workspace/Funders/Import, functional invariants, explicit out-of-scope)
- `dispatch/workstreams/ui-simplification/remediations/R007-deadline-grant-align/BUILD.md` (exact outcome: heading `:122` `px-4 py-5 sm:px-6` → `px-4 py-5`, no-grants `:94,108` `px-5 py-4 sm:px-6` → `px-4 py-4`, rows `:60` `px-4 py-4`, empty `:129` `px-4 py-5`, outer/inner unchanged, affected seams, out-of-scope, regression evidence BUILD:45-48)
- `dispatch/workstreams/ui-simplification/remediations/R007-deadline-grant-align/VALIDATION.md` (checks, verdict PASS, 259/37 tests, tsc/build/diff clean, grep px- inner only `px-4`, no inner `sm:px-6`/`px-5` remains)
- Diff vs `HEAD` (`08181a9`): full worktree 24 files (`T001-T005 + R001-R007` accumulated); R007-isolated delta confirmed via `git diff -- src/components/deadlines/deadline-view.tsx` as only heading `sm:px-6` removal and both no-grants `px-5 sm:px-6` → `px-4` (BUILD:64)

### In scope (DEFECT) — verified fixed

1. **Heading px-4 alignment — `sm:px-6` removed** (`src/components/deadlines/deadline-view.tsx:84,92,122`)
   - `src/components/deadlines/deadline-view.tsx:84` outer remains `<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">` — `max-w-7xl px-4 sm:px-6 lg:px-8` identical to `src/components/grants/grants-page.tsx:141` `mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8` — shared horizontal scale at all breakpoints, no extra offset per BUILD:29 and VALIDATION:35.
   - `src/components/deadlines/deadline-view.tsx:92` single coherent surface `<div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">` preserved — no per-group shadow reintroduced; `groupConfig` at `src/components/deadlines/deadline-view.tsx:14-39` `sectionClass ""` / `"border-t border-border"` dividers preserved.
   - `src/components/deadlines/deadline-view.tsx:122` heading now `<div className="px-4 py-5">` — verified via `Read` and `grep -n px-` shows `:122 px-4 py-5` with no `sm:px-6`; previously `px-4 py-5 sm:px-6` per BUILD worker evidence at `:54` (R006 residue). `py-5` breathing retained per BUILD:34.
   - `grep -n px- src/components/deadlines/deadline-view.tsx` now reports `:60 px-4 py-4`, `:84 px-4 sm:px-6 lg:px-8`, `:94 px-4 py-4`, `:108 px-4 py-4`, `:122 px-4 py-5`, `:129 px-4 py-5` — only outer retains `sm:px-6`/`lg:px-8`; all inner are `px-4` (VALIDATION:38 verified same). No inner `px-5` or inner `sm:px-6` remains.
   - Fixes desktop `sm:` left misalignment: previously at `≥640px` heading was 24px left (`sm:px-6`) while rows were 16px (`px-4`), an 8px shift vs Grants `th px-4`; now both 16px at every breakpoint (BUILD:30-34).

2. **No-grants / no-eligible px-4 aligns with rows and Grants table** (`src/components/deadlines/deadline-view.tsx:60,94,108,129` + `src/components/grants/grants-page.tsx:157`)
   - `src/components/deadlines/deadline-view.tsx:94` no-grants tracked `<div className="border-b border-border px-4 py-4">` — was `px-5 py-4 sm:px-6` per BUILD:56; now `px-4 py-4` matches heading/rows.
   - `src/components/deadlines/deadline-view.tsx:108` no-eligible `<div className="border-b border-border px-4 py-4">` — same `px-5 sm:px-6` → `px-4` fix (BUILD:57).
   - `src/components/deadlines/deadline-view.tsx:60` `DeadlineRow li` `px-4 py-4` (`group flex min-w-0 flex-col gap-2 px-4 py-4 ... ${rowClass}`) unchanged.
   - `src/components/deadlines/deadline-view.tsx:129` empty-group `<li className="px-4 py-5 text-sm text-muted-foreground">` unchanged.
   - `src/components/grants/grants-page.tsx:157` baseline confirmed: header `th px-4 py-3` and body `td/th px-4 py-2` — Grants left edge is `px-4` with no `sm:` bump; deadlines heading/rows/empty/no-grants now all `px-4` at mobile and `≥640px`/`≥1024px`, so left edges align (VALIDATION:52).
   - `src/test/deadline-view.test.tsx:39` asserts `expect(screen.getByRole("heading", { name: "Overdue" }).parentElement).toHaveClass("py-5")` — still holds since `py-5` retained; row `py-4` asserted at `:40` — both PASS; no `sm:px-6`/`px-5` assertion exists so no test churn required per BUILD:60 and VALIDATION:53.
   - `git diff -- src/components/deadlines/deadline-view.tsx` isolates R007 to exactly heading `sm:px-6` removal and both no-grants `px-5 sm:px-6` → `px-4` (other hunks in that file are accumulated `T003/R005/R006` scope: `sectionClass`/`headerClass` removal, `max-w-6xl`→`max-w-7xl`, `py-3.5`→`py-4`, `font-sans`).

### Out-of-scope — verified absent

- No font/mono/color change: `src/app/layout.tsx`/`src/app/globals.css` untouched in R007; `git diff -- src/components/deadlines/deadline-view.tsx` shows only padding tokens, no `Geist_Mono`/`IBM_Plex_Sans` swap (R005 scope preserved) and no `statusClass`/`groupConfig` color change beyond R003-R005 tokens per VALIDATION:63.
- No width change beyond inner px: outer `max-w-7xl` at `src/components/deadlines/deadline-view.tsx:84` unchanged; inner card `rounded-xl border` unchanged; scanning vs constrained widths remain `dashboard-content.tsx:86 max-w-7xl`, `grants-page.tsx:141 max-w-7xl`, `deadline-view.tsx:84 max-w-7xl` vs `grant-workspace.tsx max-w-6xl` / `funder-page.tsx max-w-6xl` (full `git diff --stat HEAD` 24 files, `max-w-7xl` vs `max-w-6xl` contract unchanged by R007 per VALIDATION:64).
- No schema, migration, query, DTO, action, auth/tenancy, or import/export change: `git diff --stat HEAD` shows no `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/queries/*`, `src/generated/prisma/*`; `npx tsc --noEmit` EXIT 0 and `npm run build` 11 routes PASS confirm no DTO/query breakage (VALIDATION:62).
- No decorative/shadow reintroduction: `deadline-view.tsx:92` stays single surface without per-group `shadow-sm`; `headerClass` tint remains removed.

### Test relevance — verified

- `src/test/deadline-view.test.tsx` remains relevant to R007 padding alignment scope; BUILD focused logic expects only `py-5`/`py-4` assertions — correct PASS without `px-4` churn.
- Full suite `npm run test:run` 259 passed / 37 skipped (296 total) baseline preserved across BUILD (2.10s) and VALIDATION (2.38s) and now REVIEW (2.04s).

## Checks / Evidence

Re-executed by REVIEW (2026-09-08, branch `solo/ui-simplification` worktree):

- `npm run test:run` -> `Test Files 39 passed | 5 skipped (44)` / `Tests 259 passed | 37 skipped (296)` Duration 2.04s — PASS, matches BUILD `39/5, 259/37` and VALIDATION `39/5, 259/37`
- `npx tsc --noEmit` -> no output, EXIT 0 — PASS
- `git diff --check` -> no output, EXIT 0 — PASS, clean whitespace (including `deadline-view.tsx:129` indented `li` hunk — no trailing whitespace)
- `npm run build` -> `prisma generate` OK, `next build 16.3.0` `Compiled successfully in 833ms` (review run: 836ms TypeScript), `Generating static pages 11/11 in 129ms`, 11 routes (`/dashboard`, `/deadlines`, `/grants`, `/grants/[grantId]`, `/funders`, `/import`, etc.) — PASS
- Source inspection (current on-disk, post-BUILD):
  - `src/components/deadlines/deadline-view.tsx:60` `li px-4 py-4` row; `:84` outer `max-w-7xl px-4 py-6 sm:px-6 lg:px-8`; `:92` inner `mt-6 overflow-hidden rounded-xl border border-border bg-card`; `:94` `border-b border-border px-4 py-4` no-grants; `:108` `border-b border-border px-4 py-4` no-eligible; `:122` `px-4 py-5` heading (no `sm:px-6`); `:129` `px-4 py-5` empty group; `grep -n px-` only inner `px-4` + outer `px-4 sm:px-6 lg:px-8`
  - `src/components/grants/grants-page.tsx:141` outer `max-w-7xl px-4 py-7 sm:px-6 lg:px-8`; `:157` `th px-4 py-3` / `td px-4 py-2` baseline
  - `src/test/deadline-view.test.tsx:39` `py-5` heading-parent assertion present
  - `git diff -- src/components/deadlines/deadline-view.tsx` isolates R007 to heading `sm:px-6` removal and both no-grants `px-5 sm:px-6` → `px-4`; other diff hunks in file are accumulated `T003/R005` scope (`max-w-6xl`→`max-w-7xl`, `sectionClass`/`headerClass`, `py-3.5`→`py-4`, `font-sans`)
- Diff stat: `24 files changed, 662 insertions(+), 690 deletions(-)` (accumulated `T001-T005 + R001-R007`); R007-scoped hunks limited to inner `px-4` alignment as above; no generated/migration/schema/auth paths attributable to R007.
- VALIDATION.md checks re-verified and consistent with BUILD.md; no application code edited by VALIDATE or REVIEW.

## Findings

No CRITICAL or IMPORTANT PRODUCT or REGRESSION defects. One inherited MINOR tooling limitation carried forward.

### CRITICAL

- 0

### IMPORTANT

- 0

### MINOR

- **MINOR | TOOLING | NEW SCOPE** — No Safari Technology Preview visual run claimed by VALIDATE or REVIEW for R007 (heading/row/no-grants `px-4` left-edge alignment with Grants `th/td px-4` judged from source `px-4` consistency + shared `max-w-7xl px-4 sm:px-6 lg:px-8` outer and `grep -n px-` / `git diff -- src/components/deadlines/deadline-view.tsx` isolation). Not a product defect; does not block R007. Recommend renewed human Safari visual confirmation of Deadlines heading vs DeadlineRow vs Grants table left-edge alignment at narrow (`<640px`) and desktop (`≥1024px`) and no-grants/no-eligible states inside the single `rounded-xl border` card, at next ready-for-user gate per `PLAN.md:14` and prior `MINOR | TOOLING` practice. (DEFECT: none; NEW SCOPE: 1 tooling limitation)
- 0 PRODUCT defects.
- 0 REGRESSION defects.
- Approved-scope note (not a finding): Branch-wide `max-w-7xl` on Dashboard/Grants/Deadlines vs `max-w-6xl` on Workspace/Funders/Import is intentional workstream-bounded reduction pre-dating R007 (VALIDATION:64, R006 REVIEW:90) and is not introduced by R007.

Classification summary:
- `DEFECT`: 0 (approved R007 defect correctly remediated — heading `sm:px-6` removed, no-grants `px-5 sm:px-6` → `px-4`)
- `NEW SCOPE`: 1 (tooling browser-evidence limitation, not a defect)

## Concerns

- None blocking. R007 diff is limited to 3 padding sites (`src/components/deadlines/deadline-view.tsx:94,108,122`) as bounded remediation; no scope widening detected. Full worktree has 24 modified files (`T001-T005 + R001-R007`) but R007-isolated hunks introduce no font/mono/color/width/schema/query change. Inherited Safari visual gate remains open at workstream level per `PLAN.md:14`, not R007-specific.

## Receipt

ROLE: REVIEW
STATUS: PASS
ARTIFACT: dispatch/workstreams/ui-simplification/remediations/R007-deadline-grant-align/REVIEW.md
FILES CHANGED: dispatch/workstreams/ui-simplification/remediations/R007-deadline-grant-align/REVIEW.md
CHECKS / EVIDENCE: npm run test:run -> 39 passed | 5 skipped (44 files), 259 passed | 37 skipped (296 tests) Duration 2.04s; npx tsc --noEmit -> EXIT 0; git diff --check -> EXIT 0 clean; npm run build -> Prisma generate OK, Next 16.3.0 Compiled successfully, TypeScript 836ms, 11 static pages; source audits verified deadline-view.tsx:84 max-w-7xl px-4 sm:px-6 lg:px-8 + :92 single rounded-xl border + :122 px-4 py-5 heading no sm:px-6 + :94,108 px-4 py-4 no-grants/no-eligible + :60 px-4 py-4 row + :129 px-4 py-5 empty + grants-page.tsx:141 max-w-7xl px-4 baseline + deadline-view.test.tsx:39 py-5 assertion; git diff --stat 24 files (T001-R007 accumulated), R007 hunks isolated to heading sm:px-6 removal + px-5 sm:px-6 -> px-4; grep -n px- only inner px-4 + outer px-4 sm:px-6 lg:px-8
FINDINGS / CONCERNS: No CRITICAL/IMPORTANT PRODUCT or REGRESSION findings. Zero MINOR product defects. One MINOR | TOOLING | NEW SCOPE browser-evidence limitation (no Safari snapshot) — not blocking. Concerns: none blocking.
