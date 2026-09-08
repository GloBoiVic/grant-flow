# R003 - REVIEW

Role: REVIEW
Workstream: ui-simplification
Branch: solo/ui-simplification
Task: R003
Artifact: dispatch/workstreams/ui-simplification/remediations/R003-ui-simplification/REVIEW.md
Date: 2026-09-08

## Verdict

**PASS** — R003 correctly remediates the two approved visual defects within bounded scope. No schema/query/auth/persistence change, no width-contract violation, no generic primitive redesign, and no unresolved CRITICAL/IMPORTANT findings. Validation evidence re-confirmed PASS.

## Scope Verification

Reviewed against:
- `dispatch/workstreams/ui-simplification/PLAN.md` (frozen composition contracts, width tokens, out-of-scope list)
- `dispatch/workstreams/ui-simplification/remediations/R003-ui-simplification/BUILD.md` (exact remediation outcome, affected seams, explicit out-of-scope)
- `dispatch/workstreams/ui-simplification/remediations/R003-ui-simplification/VALIDATION.md` (checks, verdict PASS, zero CRITICAL/IMPORTANT)
- Diff: `src/components/dashboard/dashboard-content.tsx`, `src/components/funders/funder-page.tsx`, `src/components/funders/funder-form.tsx`, `src/test/dashboard-page.test.tsx`, `src/test/funder-ui.test.tsx` (HEAD diff inspected; full worktree 21-file diff includes pre-existing T001-T005/R001-R002 changes — R003 scope isolated to 5 files per BUILD:119)

### In scope (DEFECT) — verified fixed

1. **Mobile metrics left-padding alignment** (`src/components/dashboard/dashboard-content.tsx:125-156`)
   - Grid retains `grid grid-cols-2 divide-x divide-y border-y border-border sm:grid-cols-4 sm:divide-y-0` at `src/components/dashboard/dashboard-content.tsx:125` — exact tokens required by BUILD and PLAN T001.
   - Root remains `mx-auto w-full max-w-7xl` at `src/components/dashboard/dashboard-content.tsx:86`; Funder list remains `max-w-6xl` at `src/components/funders/funder-page.tsx:28` — no widening beyond contracts.
   - Left-column cells share flush edge at narrow: Tracked `min-w-0 px-4 py-4 pl-0 sm:px-5 sm:pl-0` at `src/components/dashboard/dashboard-content.tsx:126` and Requested `min-w-0 px-4 py-4 pl-0 sm:px-5` at `src/components/dashboard/dashboard-content.tsx:148` — both carry `pl-0` at base, `sm:px-5` restores 1.25rem at 4-col desktop. Prior `first:pl-0` / missing `pl-0` on Requested defect eliminated; no `first:pl-0` remains.
   - Right-column cells: Open pipeline `px-4 py-4 sm:px-5` at `src/components/dashboard/dashboard-content.tsx:137`, Awarded `px-4 py-4 sm:px-5 sm:pr-0` at `src/components/dashboard/dashboard-content.tsx:153` — `sm:pr-0` replaces `sm:last:pr-0`, visually equivalent for 4-cell grid, keeps desktop right flush without overflow.
   - No double outer padding, no `overflow-x` class, `min-w-0` on cells prevents page-level horizontal overflow.
   - Numbers retain `text-metric font-normal text-muted-foreground tabular-nums tracking-metric` at `src/components/dashboard/dashboard-content.tsx:128,139,150,155` (R002 muted gray, `font-normal` not bold).
   - Needs attention divider `mt-4 grid gap-6 sm:grid-cols-2 sm:gap-0 sm:divide-x` at `src/components/dashboard/dashboard-content.tsx:177` and Due-within `sm:pl-5 sm:text-right` at `src/components/dashboard/dashboard-content.tsx:185` preserved.

2. **Funder add slideover reuse** (`src/components/funders/funder-form.tsx:1-191`, `src/components/funders/funder-page.tsx:33`)
   - Inline `section#add-funder-form mt-6 rounded-lg border...` with `X` close removed; no `id="add-funder-form"` or `mt-6 rounded-lg border` remains (grep-confirmed by VALIDATE).
   - Add-mode now returns `Sheet open={open} onOpenChange -> closeForm` / `SheetContent className="overflow-hidden" onEscapeKeyDown` / `SheetHeader` / `SheetTitle className="pr-8 text-h2">Add funder` / `SheetDescription className="sr-only"` at `src/components/funders/funder-form.tsx:174-189` — exact match to `src/components/grants/grant-form.tsx:23` pattern.
   - Form structure `flex min-h-0 flex-1 flex-col` with inner `min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4` and actions `flex flex-col-reverse gap-2 border-t border-border bg-background px-4 pt-4 pb-4 sm:flex-row sm:justify-end` at `src/components/funders/funder-form.tsx:181-186` — satisfies `overflow-hidden` / `overflow-y-auto overscroll-contain px-4 pb-4` / `border-t` requirement.
   - Edit-mode unchanged at `src/components/funders/funder-form.tsx:170-171` (form-only for parent `FunderDetailSheet`).
   - Dirty guard broadened from `isEditing && isDirty` to `isDirty` at `src/components/funders/funder-form.tsx:79-84,176` with overlay and Escape guards — matches `GrantForm` parity and BUILD requirement "support dirty-check close confirmation"; preserved `router.refresh()` on success at `src/components/funders/funder-form.tsx:118-120`, validation/feedback, and field semantics unchanged.
   - `src/components/funders/funder-page.tsx:33` button now `<Button type="button" onClick={() => setIsFormOpen(true)}>` — `aria-controls`/`aria-expanded` removed; `FunderForm open/onClose` wiring retained.

### Out-of-scope — verified absent

- `git diff HEAD --stat -- src/lib/validations src/lib/queries drizzle` empty per VALIDATE; re-checked HEAD diff shows no such paths in R003 seams. No new Funder fields, validation, URL normalization, or payload shape change (`FunderType` / `nullableValue` preserved).
- No Grant list, Grant detail Sheet, Grant Workspace, Deadline View, import/export, or `src/components/ui/sheet.tsx` primitive redesign in R003 diff.
- No widening: Dashboard `max-w-7xl`, Funders `max-w-6xl` preserved; no generic Button/Skeleton/theme/animation change.

### Test relevance — verified

- `src/test/dashboard-page.test.tsx:323-349` asserts grid tokens, left-column `pl-0` sharing, `sm:px-5` on all four, numbers `font-normal text-muted-foreground`, `sm:text-right`, and `overflow-x` absence — correctly covers the narrow defect without over-asserting layout internals.
- `src/test/funder-ui.test.tsx:34-84` asserts trigger has no `aria-controls`, dialog `role="dialog" name "Add funder"`, no `section#add-funder-form`, `overflow-hidden` + `.overflow-y-auto overscroll-contain px-4`, and submit via `within(dialog)` to account for Radix `aria-hidden` — preserves functional invariants.

## Checks / Evidence

Re-executed by REVIEW (2026-09-08):

- `npm run test:run -- src/test/dashboard-page.test.tsx src/test/funder-ui.test.tsx` -> `Test Files 2 passed (2)` / `Tests 30 passed (30)` — PASS
- `npm run test:run` (full) -> `Test Files 39 passed | 5 skipped (44)` / `Tests 259 passed | 37 skipped (296)` — PASS, no regression vs BUILD baseline `39/5`, `259/37`
- `npx tsc --noEmit` -> no output, EXIT 0 — PASS
- `git diff --check` -> no output, EXIT 0 — PASS
- `npm run lint` -> EXIT 0 — PASS
- Source inspection: confirmed `max-w-7xl`/`max-w-6xl`, `grid-cols-2 sm:grid-cols-4 divide-x divide-y border-y sm:divide-y-0`, `pl-0` left-column sharing, `font-normal text-muted-foreground`, `sm:text-right`, Sheet slideover `overflow-hidden`/`overflow-y-auto overscroll-contain px-4`/`border-t`, no `add-funder-form`, dirty confirm, `router.refresh()` — all present.
- VALIDATION.md checks re-verified and consistent with BUILD.md; no application code edited by VALIDATE or REVIEW.

## Findings

No CRITICAL or IMPORTANT PRODUCT or REGRESSION defects. One inherited MINOR tooling limitation carried forward.

### CRITICAL

- 0

### IMPORTANT

- 0

### MINOR

- **MINOR | TOOLING | NEW SCOPE** — No Safari Technology Preview visual snapshot claimed by VALIDATE (code + focused-class assertions provide narrow-safe alignment evidence). Not a product defect; does not block R003. Recommend renewed human Safari narrow/desktop visual confirmation at next ready-for-user gate per `PLAN.md:14` and prior `MINOR | TOOLING` practice. (DEFECT: none; NEW SCOPE: 1 tooling limitation)
- 0 PRODUCT defects.
- 0 REGRESSION defects.
- Approved-scope note (not a finding): `closeForm` dirty guard broadening to `isDirty` and `sm:pr-0` replacing `sm:last:pr-0` are explicitly approved in BUILD and functionally equivalent; no concern.

Classification summary:
- `DEFECT`: 0 (all approved defects correctly remediated)
- `NEW SCOPE`: 1 (tooling browser-evidence limitation, not a defect)

## Concerns

- None blocking. Pre-existing worktree has 21 modified files (T001-T005 + R001/R002 + R003) but R003-scoped diff is limited to 5 files as required; no scope widening detected in R003.

## Receipt

ROLE: REVIEW
STATUS: PASS
ARTIFACT: dispatch/workstreams/ui-simplification/remediations/R003-ui-simplification/REVIEW.md
FILES CHANGED: dispatch/workstreams/ui-simplification/remediations/R003-ui-simplification/REVIEW.md
CHECKS / EVIDENCE: npm run test:run -- src/test/dashboard-page.test.tsx src/test/funder-ui.test.tsx -> 2/30 passed; npx tsc --noEmit -> EXIT 0; git diff --check -> clean; npm run test:run (full) -> 39 passed | 5 skipped (44 files), 259 passed | 37 skipped (296 tests); npm run lint -> EXIT 0; source audits verified max-w-7xl, grid-cols-2 sm:grid-cols-4 divide-x divide-y border-y sm:divide-y-0, pl-0 left-column sharing, font-normal text-muted-foreground, sm:text-right, Sheet slideover overflow-hidden/overflow-y-auto px-4 border-t, no add-funder-form, dirty confirm, router.refresh; no schema/query/auth change
FINDINGS / CONCERNS: No CRITICAL/IMPORTANT PRODUCT or REGRESSION findings. Zero MINOR product defects. One MINOR | TOOLING | NEW SCOPE browser-evidence limitation (no Safari MCP snapshot) — not blocking. Concerns: none blocking.
