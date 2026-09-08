# R006 - REVIEW

Role: REVIEW
Workstream: ui-simplification
Branch: solo/ui-simplification
Task: R006
Artifact: dispatch/workstreams/ui-simplification/remediations/R006-muted-zero-deadline-pad/REVIEW.md
Date: 2026-09-08

## Verdict

**PASS** — R006 correctly implements the approved muted-zero and deadline-padding alignment remediation within bounded scope. Dashboard Needs attention zero numbers at `src/components/dashboard/dashboard-content.tsx:180,187` now use `text-muted-foreground` when zero (red `text-destructive` only when >0), and Deadline group heading at `src/components/deadlines/deadline-view.tsx:122` now `px-4 py-5 sm:px-6` aligning with row `px-4 py-4` at `:60` and empty `li` `px-4 py-5` at `:129` on the single `max-w-7xl` bordered surface at `:84,92`. Consistent with Grants table `px-4` baseline and Dashboard metrics muted-zero pattern, no schema/width/auth change, and all required checks passing. No CRITICAL or IMPORTANT findings.

## Scope Verification

Reviewed against:
- `dispatch/workstreams/ui-simplification/PLAN.md` (frozen acceptance `PLAN:5` restrained urgency, `PLAN:243-282` width/composition `max-w-7xl` Dashboard/Grants/Deadlines vs `max-w-6xl` Workspace/Funders/Import, `PLAN:178-189` single coherent Deadline surface, functional invariants, explicit out-of-scope)
- `dispatch/workstreams/ui-simplification/remediations/R006-muted-zero-deadline-pad/BUILD.md` (exact outcome: muted zero `dashboard-content.tsx:180,187` and deadline heading/row `px-4` alignment `deadline-view.tsx:92,122,58-60,129`, affected seams, out-of-scope, regression evidence BUILD:58-62)
- `dispatch/workstreams/ui-simplification/remediations/R006-muted-zero-deadline-pad/VALIDATION.md` (checks, verdict PASS, 259/37 tests, tsc/build/diff clean, no out-of-scope violation)
- Diff vs `HEAD` (`08181a9`): `src/components/dashboard/dashboard-content.tsx`, `src/components/deadlines/deadline-view.tsx` as R006-isolated hunks; full worktree 24-file diff includes accumulated T001-T005 + R001-R005 — R006 touches only these 2 seams per BUILD:48-52

### In scope (DEFECT) — verified fixed

1. **Dashboard Needs attention zero muted grey** (`src/components/dashboard/dashboard-content.tsx:180,187`)
   - `src/components/dashboard/dashboard-content.tsx:81-83` predicates unchanged: `const hasAttention = dto.attention.overdueCount > 0 || dto.attention.dueIn7Count > 0`, `const hasOverdue = dto.attention.overdueCount > 0`, `const hasDueSoon = dto.attention.dueIn7Count > 0`.
   - `src/components/dashboard/dashboard-content.tsx:180` now `<dd className={`mt-1 text-2xl font-semibold tabular-nums ${hasOverdue ? "text-destructive" : "text-muted-foreground"}`}>{dto.attention.overdueCount}</dd>` — muted branch is `text-muted-foreground` (#6B7280), not `text-foreground` (#1F2937); retains `font-semibold tabular-nums text-2xl`.
   - `src/components/dashboard/dashboard-content.tsx:187` now `<dd className={`mt-1 text-2xl font-semibold tabular-nums ${hasDueSoon ? "text-destructive" : "text-muted-foreground"}`}>{dto.attention.dueIn7Count}</dd>` — same muted zero for due. Parent `div` `sm:pl-5 sm:text-right` at `:185` retained; `sm:text-right` on due side preserved per BUILD:37-38.
   - Section wrapper at `:163` `border-destructive/40 bg-destructive-soft/20` when `hasAttention` else `border-border bg-card` unchanged — only number color muted, not border/background.
   - Consistent with Dashboard metrics `src/components/dashboard/dashboard-content.tsx:128,139,150,155` all `font-mono font-normal text-muted-foreground tabular-nums` and status breakdown zero `src/components/dashboard/dashboard-content.tsx:247` `text-muted-foreground` — grey for zero now uniform. Red `#DC2626` (`text-destructive`) appears only when count >0 per BUILD:38.
   - `git diff HEAD -- src/components/dashboard/dashboard-content.tsx` confirms only these two `text-foreground`→`text-muted-foreground` hunks within the R006 slice (other accumulated hunks are T001 font/strip/breakdown scope, pre-dating R006).
   - No test asserts `text-foreground` for zero: `src/test/dashboard-page.test.tsx` has no zero `text-foreground` assertion per BUILD:71 and VALIDATION:40; `npm run test:run` PASS without update.

2. **Deadline heading/row px-4 left alignment with Grants table** (`src/components/deadlines/deadline-view.tsx:84,92,122,60,129`)
   - `src/components/deadlines/deadline-view.tsx:84` outer remains `<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">` — `max-w-7xl px-4 sm:px-6 lg:px-8` identical to `src/components/grants/grants-page.tsx:141` `mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8` and `src/components/dashboard/dashboard-content.tsx:86` `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8` — outer horizontal scale identical (`px-4` base, `sm:px-6`, `lg:px-8`), no extra `mx-` offset per BUILD:41 and VALIDATION:48-49.
   - `src/components/deadlines/deadline-view.tsx:92` single coherent surface `<div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">` with no per-group shadow; `groupConfig` at `:14-39` `sectionClass` `""` / `"border-t border-border"` dividers preserved; `headerClass` tint removed — matches `PLAN:185` one bordered three-group surface.
   - `src/components/deadlines/deadline-view.tsx:122` heading now `<div className="px-4 py-5 sm:px-6">` for group heading — was `px-5 py-5 sm:px-6` per diff `60db780..c37d6b8`; now `px-4` aligns with:
     - `src/components/deadlines/deadline-view.tsx:60` `DeadlineRow li` `px-4 py-4` (`group flex min-w-0 flex-col gap-2 px-4 py-4 ... sm:flex-row ... ${rowClass}`)
     - `src/components/deadlines/deadline-view.tsx:129` empty `<li className="px-4 py-5 text-sm text-muted-foreground">{group.emptyMessage}</li>` — same `px-4`.
     - `src/components/grants/grants-page.tsx:157` header `th` `px-4 py-3` and body `td/th` `px-4 py-2` — Grants table baseline `px-4`; deadlines heading/rows now consistent, fixing prior 4px (1 unit) left shift (`px-5` vs `px-4`) noted in BUILD:14.
   - `git diff HEAD -- src/components/deadlines/deadline-view.tsx` confirms single `px-5`→`px-4` hunk at `:122` within R006 (other hunks in that file are accumulated T003/R005 mono/alignment scope: `sectionClass`/`headerClass` removal, `py-3.5`→`py-4`, `font-sans` on time/Badge, `max-w-6xl`→`max-w-7xl`).
   - No width token change in R006: outer `max-w-7xl` unchanged; heading change is padding only per BUILD:56.

### Out-of-scope — verified absent

- No font change: `src/app/layout.tsx`/`src/app/globals.css` retain `Geist_Mono` + `IBM_Plex_Sans` with `variable --font-mono/--font-sans` weight 400/500/600/700 display swap from R005; R006 diff touches neither file per `git diff HEAD -- src/app/layout.tsx src/app/globals.css` empty for R006 slice. `font-semibold tabular-nums` on zero `dd` retained, no weight change.
- No color token addition: only existing tokens `text-destructive` and `text-muted-foreground` reused; no new `--urgency-*` or `--destructive*` token introduced.
- No schema, migration, query, DTO, action, auth/tenancy, status/deadline bucket, or import/export change: `git diff --stat HEAD` shows no `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/queries/*`, `src/lib/validations/*`, `src/generated/prisma/*`, `supabase/*`, or `src/app/**/actions.ts` attributable to R006; R006-scoped files limited to the two seams above per BUILD:48-52 and VALIDATION:60-68. `npx tsc --noEmit` and `npm run build` PASS confirm no query/DTO breakage.
- No width change beyond padding alignment: scanning surfaces remain `dashboard-content.tsx:86 max-w-7xl`, `grants-page.tsx:141 max-w-7xl`, `deadline-view.tsx:84 max-w-7xl` vs constrained `grant-workspace.tsx max-w-6xl`; R006 only adjusted deadline heading `px-4` per VALIDATION:56 note, not outer width token (BUILD:56 out-of-scope satisfied).
- No universal search or new design tokens/infrastructure introduced.

### Test relevance — verified

- `src/test/dashboard-page.test.tsx` (Needs attention `Overdue`/`Due within 7 days` values, oldest-overdue singular/plural, metrics, upcoming, status breakdown) remains relevant to muted-zero scope; correct that it does not assert `text-foreground` for zero, so no update required per BUILD:71 and VALIDATION:40. `npm run test:run` focused still PASS.
- `src/test/deadline-view.test.tsx` only asserts `py-5` on heading parent at `:39`, not `px-5`; verified by BUILD:71 — heading `px-4` change does not break existing heading padding assertion; suite PASS.
- Full suite `npm run test:run` 259 passed / 37 skipped (296 total) baseline preserved across BUILD and VALIDATION and now REVIEW (re-executed below).

## Checks / Evidence

Re-executed by REVIEW (2026-09-08, branch `solo/ui-simplification` worktree, Node 26 as per `PLAN:767`):

- `npm run test:run` -> `Test Files 39 passed | 5 skipped (44)` / `Tests 259 passed | 37 skipped (296)` Duration 1.98s — PASS, matches BUILD `39/5, 259/37 (296 total)` and VALIDATION:21
- `npx tsc --noEmit` -> no output, EXIT 0 — PASS
- `git diff --check` -> no output, EXIT 0 — PASS, clean whitespace
- `npm run build` -> `prisma generate` OK, `next build 16.3.0` `Compiled successfully in 316ms`, `Finished TypeScript in 837ms`, `Generating static pages 11/11 in 131ms`, 11 routes (`/dashboard`, `/deadlines`, `/grants`, etc.) — PASS
- Source inspection (current on-disk, post-BUILD):
  - `src/components/dashboard/dashboard-content.tsx:81-83` predicates `hasOverdue/hasDueSoon` `>0`; `:180` Overdue `dd` `hasOverdue ? "text-destructive" : "text-muted-foreground"` `font-semibold tabular-nums text-2xl`; `:187` Due `dd` same muted zero with parent `sm:pl-5 sm:text-right`; `:128,139,150,155` metrics `font-mono font-normal text-muted-foreground tabular-nums`; `:243,247` breakdown zero `text-muted-foreground` — all present.
  - `src/components/deadlines/deadline-view.tsx:84` outer `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8`; `:92` `mt-6 overflow-hidden rounded-xl border border-border bg-card` single surface; `:14-39` `groupConfig sectionClass "" / "border-t border-border"`; `:60` `DeadlineRow li px-4 py-4`; `:122` heading `px-4 py-5 sm:px-6`; `:129` empty `li px-4 py-5`; `:71,74` `font-sans` on time/Badge retained from R005 — all present.
  - `src/components/grants/grants-page.tsx:141` outer `max-w-7xl px-4 py-7 sm:px-6 lg:px-8` baseline confirmed matching deadlines/dashboard.
  - `git diff HEAD -- src/components/dashboard/dashboard-content.tsx src/components/deadlines/deadline-view.tsx` isolates R006 to the two `text-muted-foreground` swaps and single `px-5`→`px-4` hunk; other hunks in those files are accumulated T001/R005 scope.
- Diff stat: `24 files changed` (accumulated T001-T005 + R001-R006); R006-scoped hunks limited to muted-zero and padding as above; no generated/migration/schema/auth paths.
- VALIDATION.md checks re-verified and consistent with BUILD.md; no application code edited by VALIDATE or REVIEW.

## Findings

No CRITICAL or IMPORTANT PRODUCT or REGRESSION defects. One inherited MINOR tooling limitation carried forward.

### CRITICAL

- 0

### IMPORTANT

- 0

### MINOR

- **MINOR | TOOLING | NEW SCOPE** — No Safari Technology Preview visual run claimed by VALIDATE or REVIEW for R006 (muted-zero grey `#6B7280` vs foreground `#1F2937` and heading/row `px-4` left-edge alignment with Grants table `px-4` judged from source + outer `max-w-7xl` reuse and `git diff` `px-5`→`px-4` hunk). Not a product defect; does not block R006. Recommend renewed human Safari visual confirmation of Needs attention `Overdue 0` / `Due within 7 days 0` muted grey vs metrics grey, and Deadline card heading vs row vs Grants table left-edge alignment at narrow and desktop, at next ready-for-user gate per `PLAN:14` and prior `MINOR | TOOLING` practice. (DEFECT: none; NEW SCOPE: 1 tooling limitation)
- 0 PRODUCT defects.
- 0 REGRESSION defects.
- Approved-scope note (not a finding): Branch-wide `max-w-7xl` on Dashboard/Grants/Deadlines vs `max-w-6xl` on Workspace/Funders/Import is intentional workstream-bounded reduction pre-dating R006 (VALIDATION:79) and is not introduced by R006.

Classification summary:
- `DEFECT`: 0 (both approved R006 defects correctly remediated — muted zero and deadline padding aligned)
- `NEW SCOPE`: 1 (tooling browser-evidence limitation, not a defect)

## Concerns

- None blocking. R006 diff is limited to 2 seams as bounded remediation; no scope widening detected. Full worktree has 24 modified files (T001-T005 + R001-R006) but R006-scoped hunks introduce no schema, width-token, or auth change. Inherited Safari visual gate remains open at workstream level per `PLAN:14`, not R006-specific.

## Receipt

ROLE: REVIEW
STATUS: PASS
ARTIFACT: dispatch/workstreams/ui-simplification/remediations/R006-muted-zero-deadline-pad/REVIEW.md
FILES CHANGED: dispatch/workstreams/ui-simplification/remediations/R006-muted-zero-deadline-pad/REVIEW.md
CHECKS / EVIDENCE: npm run test:run -> 39 passed | 5 skipped (44 files), 259 passed | 37 skipped (296 tests) Duration 1.98s; npx tsc --noEmit -> EXIT 0; git diff --check -> EXIT 0 clean; npm run build -> Prisma generate OK, Next 16.3.0 Compiled successfully in 316ms, TypeScript 837ms, 11 static pages, fonts via next/font; source audits verified dashboard-content.tsx:180,187 text-muted-foreground muted zero (hasOverdue/hasDueSoon ? text-destructive : text-muted-foreground) font-semibold tabular-nums, deadline-view.tsx:84 max-w-7xl px-4 sm:px-6 lg:px-8 + :92 single rounded-xl border + :122 px-4 py-5 sm:px-6 heading + :60 px-4 py-4 row + :129 px-4 py-5 empty li + grants-page.tsx:141 max-w-7xl px-4 baseline; git diff --stat 24 files (T001-R006 accumulated), R006 hunks isolated to muted-zero + px-5->px-4
FINDINGS / CONCERNS: No CRITICAL/IMPORTANT PRODUCT or REGRESSION findings. Zero MINOR product defects. One MINOR | TOOLING | NEW SCOPE browser-evidence limitation (no Safari snapshot) — not blocking. Concerns: none blocking.
