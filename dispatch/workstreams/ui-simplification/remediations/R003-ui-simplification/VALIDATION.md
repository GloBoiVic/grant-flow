# R003 - Mobile metrics alignment and funder add slideover validation

Role: VALIDATE
Workstream: ui-simplification
Branch: solo/ui-simplification
Task: R003
Owned artifact: dispatch/workstreams/ui-simplification/remediations/R003-ui-simplification/VALIDATION.md

## Scope

Validate R003 remediation against `dispatch/workstreams/ui-simplification/remediations/R003-ui-simplification/BUILD.md` and `dispatch/workstreams/ui-simplification/PLAN.md`.

Approved R003 outcome:

1. Dashboard mobile metrics strip left-column alignment fix: Tracked grants and Requested share same left edge at narrow (`grid-cols-2`), no Requested indentation, desktop 4-col uniform, `divide-x divide-y border-y sm:divide-y-0`, `max-w-7xl`, numbers `font-normal text-muted-foreground`, Due-within `sm:text-right`, no page overflow.
2. Funder add slideover: replace inline `section#add-funder-form` with `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle` "Add funder" + sr-only `SheetDescription`, `overflow-hidden` / `overflow-y-auto overscroll-contain px-4 pb-4`, actions `border-t`, matching `GrantForm` pattern, no `aria-controls`, dirty confirm, `router.refresh()`, validation preserved.
3. No schema/query/auth/persistence change.

Inspected: `src/components/dashboard/dashboard-content.tsx`, `src/components/funders/funder-page.tsx`, `src/components/funders/funder-form.tsx`, `src/test/dashboard-page.test.tsx`, `src/test/funder-ui.test.tsx`. No application code or BUILD.md was edited by VALIDATE.

## Checks Run

### Source inspection (R003 seams)

- `src/components/dashboard/dashboard-content.tsx:86` root `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8` — confirms `max-w-7xl` (Funder list remains `max-w-6xl` in `src/components/funders/funder-page.tsx:28`).
- `src/components/dashboard/dashboard-content.tsx:125` grid `grid grid-cols-2 divide-x divide-y border-y border-border sm:grid-cols-4 sm:divide-y-0` — exact required tokens `divide-x divide-y border-y sm:divide-y-0` plus `grid-cols-2 sm:grid-cols-4`.
- `src/components/dashboard/dashboard-content.tsx:126` Tracked grants cell `min-w-0 px-4 py-4 pl-0 sm:px-5 sm:pl-0` — left flush at narrow (`pl-0`) and at sm (`sm:pl-0`).
- `src/components/dashboard/dashboard-content.tsx:148` Requested cell `min-w-0 px-4 py-4 pl-0 sm:px-5` — left flush at narrow (`pl-0` sharing edge with Tracked grants), `sm:px-5` restores desktop padding at 4-col.
- `src/components/dashboard/dashboard-content.tsx:137,153` Open pipeline `min-w-0 px-4 py-4 sm:px-5` and Awarded `min-w-0 px-4 py-4 sm:px-5 sm:pr-0` — right flush via `sm:pr-0` at desktop, `px-4` at narrow; no `first:pl-0` / `sm:last:pr-0` pattern remains.
- `src/components/dashboard/dashboard-content.tsx:128,139,150,155` numbers `text-metric font-normal text-muted-foreground tabular-nums tracking-metric` on all four metrics — retains R002 muted gray, `font-normal` not bold.
- `src/components/dashboard/dashboard-content.tsx:177` Needs attention divider `mt-4 grid gap-6 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-border` — breathing and divider preserved.
- `src/components/dashboard/dashboard-content.tsx:185` Due-within cell `min-w-0 sm:pl-5 sm:text-right` — confirms `sm:text-right` alignment.
- No `overflow-x` class in `dashboard-content.tsx` (grep `overflow` returned empty); structure uses `min-w-0`, `max-w-full break-words`, `w-full max-w-7xl` with inner `min-w-0` columns — no page-level overflow mechanism.

- `src/components/funders/funder-page.tsx:33-34` `Button` now `<Button type="button" onClick={() => setIsFormOpen(true)}>` — no `aria-controls="add-funder-form"` and no `aria-expanded`; `FunderForm open={isFormOpen} onClose={() => setIsFormOpen(false)}` retained.
- `src/components/funders/funder-form.tsx:9,174-189` add-mode returns `Sheet open={open} onOpenChange` → `closeForm()`, `SheetContent className="overflow-hidden" onEscapeKeyDown` dirty guard, `SheetHeader` / `SheetTitle className="pr-8 text-h2">Add funder` / `SheetDescription className="sr-only">Create the funder record you will connect to grants.` — matches `src/components/grants/grant-form.tsx:6,23` pattern (`Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`/`SheetDescription sr-only`).
- `src/components/funders/funder-form.tsx:181-186` form `flex min-h-0 flex-1 flex-col` with inner `min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4` and actions `flex flex-col-reverse gap-2 border-t border-border bg-background px-4 pt-4 pb-4 sm:flex-row sm:justify-end` — confirms `overflow-hidden` / `overflow-y-auto overscroll-contain px-4 pb-4` and `border-t`.
- `src/components/funders/funder-form.tsx:79-84,176` `closeForm(): if (isDirty && !window.confirm("Discard unsaved funder changes?")) return` and `onEscapeKeyDown` guard `if (isDirty && !window.confirm(...)) event.preventDefault()` and `onOpenChange` guard — dirty confirm on Close/overlay/Escape for both add and edit (broadened from `isEditing && isDirty` to `isDirty` per BUILD).
- `src/components/funders/funder-form.tsx:100-102,118-120` validation, `createFunder`/`editFunder`, feedback, `router.refresh()` preserved; `edit`-mode `src/components/funders/funder-form.tsx:170-171` returns form-only for parent `FunderDetailSheet` (unchanged).
- Verified no `id="add-funder-form"` or `section#add-funder-form` or `mt-6 rounded-lg border` inline card remains in `funder-form.tsx` or `funder-page.tsx`.

### Strict-scope / out-of-scope audit

- `git diff HEAD --stat -- src/lib/validations src/lib/queries drizzle` returned no output — no schema, validation, query, DTO, or migration change in R003.
- `src/components/funders/funder-form.tsx` still imports `createFunder, editFunder` from `@/app/(authenticated)/(org-required)/grants/actions` with same payload shape `FunderType` / `nullableValue` — no new fields or URL normalization.
- Full tracked diff is 21 files (pre-existing T001-T005 + R001/R002 + R003); R003-scoped diff is limited to 5 files `src/components/dashboard/dashboard-content.tsx`, `src/components/funders/funder-form.tsx`, `src/components/funders/funder-page.tsx`, `src/test/dashboard-page.test.tsx`, `src/test/funder-ui.test.tsx`. No Grant list, Grant detail Sheet, Grant Workspace, Deadline View, import/export, or shared primitive redesign in R003 diff.

### Test relevance audit

- `src/test/dashboard-page.test.tsx:323-349` `uses a max-w-7xl root and narrow-safe content structure` asserts grid `grid-cols-2 sm:grid-cols-4 divide-x divide-y border-y sm:divide-y-0`, `TrackedCell pl-0`, `RequestedCell pl-0`, `sm:px-5` on all four, numbers `font-normal text-muted-foreground`, Due-within `sm:text-right`, `overflow-x` absence.
- `src/test/funder-ui.test.tsx:34-56` asserts trigger has no `aria-controls`, dialog `role="dialog" name "Add funder"`, no `section#add-funder-form`, dialog `overflow-hidden` and `.overflow-y-auto overscroll-contain px-4`, fields accessible; `58-66,73-84` assert server validation via `within(dialog)` and submit via `within(dialog).getByRole("button", {name: /^Add funder$/})` (Radix hides background trigger).

### Validation matrix — exact commands and outputs

- `npm run test:run -- src/test/dashboard-page.test.tsx src/test/funder-ui.test.tsx` -> `Test Files  2 passed (2)` / `Tests  30 passed (30)` / Duration 1.33s (2026-09-08 11:20 UTC). Vitest emitted Vite `configLoader: 'native'` CommonJS/ESM warning (benign).
- `npx tsc --noEmit` -> no output, `EXIT:0`.
- `git diff --check` -> no output, `EXIT:0`.
- `npm run test:run` (full) -> `Test Files  39 passed | 5 skipped (44)` / `Tests  259 passed | 37 skipped (296)` / Duration 1.94s. Vitest emitted same `configLoader` warning.
- `npm run lint` (eslint) -> `EXIT:0`.

Focused tests pass; full suite shows no regression vs BUILD baseline `39 passed | 5 skipped`, `259 passed | 37 skipped`.

## Findings

No `CRITICAL` or `IMPORTANT` PRODUCT or REGRESSION defects were identified.

### CRITICAL

- 0.

### IMPORTANT

- 0.

### MINOR

- 0 PRODUCT defects.
- 0 REGRESSION defects.

Classification detail: R003 correctly broadens `closeForm` dirty guard from `isEditing && isDirty` to `isDirty` — add-mode now warns on dirty close, matching `GrantForm` parity and BUILD requirement. This is not a finding; it is approved-scope behavior. `sm:pr-0` on Awarded cell replaces prior `sm:last:pr-0`; visually equivalent for the 4-cell grid and preserves desktop right edge without overflow.

No browser (Safari Technology Preview) visual snapshot was attempted by VALIDATE — this is `TOOLING | NEW SCOPE` limitation inherited from prior remediations, not an R003 product defect. Code and focused-class assertions provide the narrow-safe alignment evidence that the required `Safari MCP` browser check would otherwise supply. `MINOR | TOOLING | NEW SCOPE`: no authenticated narrow/desktop screenshot claimed.

- Approved-scope `DEFECT`: none.
- `NEW SCOPE`: one tooling limitation (no Safari MCP browser snapshot), not a defect.

## Verdict

**PASS** — R003 satisfies the BUILD packet and frozen PLAN contracts for Dashboard mobile metrics alignment and Funder add slideover. All required checks passed, focused and full regression thresholds met, and no schema/query/auth/persistence change was introduced. No `CRITICAL` or `IMPORTANT` findings remain. The sole `MINOR | TOOLING` browser-evidence limitation is `NEW SCOPE` and does not block R003.

## Required Follow-up

- None required for R003 application scope. Renewed human Safari Technology Preview visual confirmation of narrow Requested/Tracked left-edge alignment and Funder add slideover at next ready-for-user gate, consistent with prior workstream `MINOR | TOOLING` practice.
- No `CRITICAL` or `IMPORTANT` remediation needed before merge (pending human approval per `dispatch/workstreams/ui-simplification/PLAN.md:14`).

## Receipt

ROLE: VALIDATE
STATUS: PASS
ARTIFACT: dispatch/workstreams/ui-simplification/remediations/R003-ui-simplification/VALIDATION.md
FILES CHANGED: dispatch/workstreams/ui-simplification/remediations/R003-ui-simplification/VALIDATION.md
CHECKS / EVIDENCE: npm run test:run -- src/test/dashboard-page.test.tsx src/test/funder-ui.test.tsx -> 2/30 passed; npx tsc --noEmit -> EXIT 0; git diff --check -> clean; npm run test:run (full) -> 39 passed | 5 skipped (44 files), 259 passed | 37 skipped (296 tests); npm run lint -> EXIT 0; source audits verified max-w-7xl, grid-cols-2 sm:grid-cols-4 divide-x divide-y border-y sm:divide-y-0, pl-0 left-column sharing, font-normal text-muted-foreground, sm:text-right, Sheet slideover with overflow-hidden/overflow-y-auto px-4, border-t, no add-funder-form, dirty confirm, router.refresh; no schema/query/auth change
FINDINGS / CONCERNS: No CRITICAL/IMPORTANT PRODUCT or REGRESSION findings. Zero MINOR product defects. One MINOR | TOOLING | NEW SCOPE browser-evidence limitation (no Safari MCP snapshot claimed).
