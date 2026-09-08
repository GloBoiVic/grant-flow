# R003 - Mobile metrics alignment and funder add slideover

Remediation ID: R003
Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification

## Origin finding and source artifact

Developer visual observations 2026-09-08 (post-R002 READY_FOR_USER):

1. Mobile Dashboard: the Requested number does not properly align; there is weird left padding/indentation compared to Tracked grants (see Image 1). The four-metric strip uses `first:pl-0` only on the first cell, so on `grid-cols-2` mobile the second-row left cell (Requested) retains `px-4` and appears indented vs Tracked grants which is flush. Needs clean, breathable, consistent alignment at narrow width.

2. Funder page add: adding a funder renders an inline on-page card (`section#add-funder-form mt-6 rounded-lg border...`) instead of reusing the existing right slideover (`Sheet`/`SheetContent`) already used for Add grant / Grant detail / Funder detail edit (see Image 2). The funder add should reuse that slideover pattern for consistency.

Source: user message with screenshots, 2026-09-08.

## Finding severity

IMPORTANT (visual regression / composition inconsistency within approved reduction pass; no data loss but violates "one coherent surface" and width/composition contracts).

## Related original task(s)

- T001 - Dashboard composition
- T004 - Funder surfaces and bounded shell de-duplication

## Approved requirement or invariant violated

- Frozen PLAN Composition baseline: "Narrow layouts stack naturally" / "Page-level horizontal overflow is prohibited" / "Borders separate meaningful groups" (acceptance 9, 38).
- PLAN Scope T001: metrics strip must be one coherent accessible summary strip with `max-w-7xl` and narrow-safe layout.
- PLAN Scope T004: Funder add/edit behavior preserves validation etc., but composition should reuse existing Sheet slideover (as used for grants), not introduce a separate inline card surface. Previous Funder detail edit already uses Sheet; add should match.
- Previous R002 remedy kept metrics structure but introduced mobile left-padding inconsistency.

## Exact remediation outcome

1. **Dashboard mobile alignment**:
   - Fix the four-value metrics strip so left-column cells (Tracked grants and Requested) share the same left edge at narrow (`grid-cols-2`) and the strip remains uniform at desktop (`sm:grid-cols-4`). Eliminate the weird Requested indentation without introducing page-level horizontal overflow or double outer padding. Keep `divide-x divide-y border-y` and `max-w-7xl` and `sm:divide-y-0` contracts. Keep numbers `font-normal text-muted-foreground` (R002 gray) and keep Due-within-7-days right-aligned at `sm:`.
   - Ensure the Needs attention divider and breathing remain.

2. **Funder add slideover**:
   - Replace the inline `section#add-funder-form` card used for adding a funder on `FunderPage` with the right slideover (`Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`/`SheetDescription`) already used for grant add (`GrantForm`), Funder detail view/edit (`FunderDetailSheet`), and existing `Sheet` primitive. The slideover must: open from the Add funder button, show the same `FunderForm` fields/validation/feedback/actions, support dirty-check close confirmation, `router.refresh()` on success, and focus/close behavior matching `GrantForm`. Remove the inline card chrome (`mt-6 rounded-lg border...`) for the add flow. Keep `FunderList`/`FunderDetailSheet` edit flow unchanged except as needed for consistency. Keep organization isolation, URL normalization, dirty protection.
   - Update `FunderPage` button accessibility (remove `aria-controls="add-funder-form"` when slideover) and keep empty-state copy.

3. **Tests**:
   - Update focused assertions for metrics strip narrow-safe structure (if class-based) and for funder add using Sheet/slideover (role dialog, title, fields) rather than inline section. Preserve all functional invariants (no query/schema/auth change).

## Affected implementation seams

- `src/components/dashboard/dashboard-content.tsx` (metrics strip grid/cell padding)
- `src/components/funders/funder-page.tsx` (Add funder trigger + Sheet wrapper)
- `src/components/funders/funder-form.tsx` (add-mode rendering: replace inline section with Sheet; keep edit-mode form-only for Sheet parent)
- `src/components/ui/sheet.tsx` (no change expected; reuse)
- `src/test/dashboard-page.test.tsx` (if width/narrow-safe assertion covers cell classes)
- `src/test/funder-ui.test.tsx` (funder add slideover assertions)

## Explicit out-of-scope items

- No schema, migration, query, DTO, action, auth/tenancy, deadline/budget, import/export, or persisted-data change.
- No change to Grant list, Grant detail Sheet, Grant Workspace, Deadline View beyond what R002 already did.
- No new Funder fields, validation, or URL normalization beyond existing.
- No generic Button/Skeleton/Sheet primitive redesign, theme, animation, or design-system change.
- No widening of Funder list beyond `max-w-6xl` or Dashboard beyond `max-w-7xl`.

## Regression evidence required

- Focused tests: `src/test/dashboard-page.test.tsx` and `src/test/funder-ui.test.tsx` (and any existing funder integration) pass with updated narrow-safe/slideover assertions.
- Full `npm run test:run` baseline (292+ tests) without regression, or at least focused + funder/grant UI suites.
- `npx tsc --noEmit` passes.
- `npm run lint` (or scoped lint) passes.
- `git diff --check` clean.
- Manual/VALIDATE browser check (Safari Technology Preview if available, else snapshot) confirms mobile Requested/Tracked left edges align and Funder add opens as slideover, not inline card.

## Worker Evidence

Status: DONE
Branch: solo/ui-simplification (unchanged)
Date: 2026-09-08

### Implementation

1. **Dashboard mobile metrics alignment** (`src/components/dashboard/dashboard-content.tsx:125-156`)
   - Grid retains `grid grid-cols-2 divide-x divide-y border-y border-border sm:grid-cols-4 sm:divide-y-0` and `max-w-7xl` root (verified via code inspection, no overflow-x).
   - Cell 1 (Tracked grants): `first:pl-0 sm:first:pl-0` → `pl-0 sm:pl-0` via `px-4 py-4 pl-0 sm:px-5 sm:pl-0` (explicit left flush at narrow and sm).
   - Cell 2 (Open pipeline): `px-4 py-4 sm:px-5` unchanged.
   - Cell 3 (Requested): `px-4 py-4 sm:px-5` → `px-4 py-4 pl-0 sm:px-5` – left 0 at narrow (shares edge with Tracked), `sm:px-5` restores 1.25rem at desktop 4-col.
   - Cell 4 (Awarded): `sm:last:pr-0` → `sm:pr-0` (right flush at sm, px-4 at narrow). Verified no double outer padding and no horizontal overflow.
   - Numbers keep `text-metric font-normal text-muted-foreground tabular-nums tracking-metric` (R002 gray). Needs attention divider retains `mt-4 grid gap-6 sm:grid-cols-2 sm:gap-0 sm:divide-x` and Due-within `sm:text-right sm:pl-5` right-aligned at sm.

2. **Funder add slideover** (`src/components/funders/funder-form.tsx:1-191`, `src/components/funders/funder-page.tsx:33`)
   - `funder-form.tsx`: Removed inline `section#add-funder-form mt-6 rounded-lg border...` with `X` close. Add-mode now returns `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`/`SheetDescription sr-only` matching `GrantForm` pattern (`src/components/grants/grant-form.tsx:23`): `Sheet open` `onOpenChange` → `closeForm`, `SheetContent className="overflow-hidden"` `onEscapeKeyDown` dirty check, `SheetHeader` with `SheetTitle pr-8 text-h2 "Add funder"` and `SheetDescription sr-only "Create the funder record..."`, form `flex min-h-0 flex-1 flex-col` with inner `min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4` and actions `flex flex-col-reverse gap-2 border-t border-border bg-background px-4 pt-4 pb-4 sm:flex-row sm:justify-end`. Edit-mode unchanged (form-only for parent `FunderDetailSheet`). Dirty check broadened to `if (isDirty && !confirm)` for add+edit parity with `GrantForm` (`Discard unsaved funder changes?` for overlay/Escape/close). Preserved `router.refresh()` on success, validation, feedback, accessibility.
   - `funder-page.tsx:33`: `Button` removed `aria-controls="add-funder-form"` and `aria-expanded`; now `<Button onClick={() => setIsFormOpen(true)}>` opens Sheet state. `FunderForm open={isFormOpen} onClose={() => setIsFormOpen(false)}` remains. `FunderList` max-w-6xl unchanged. Verified via code inspection: no `id="add-funder-form"` remains, Sheet content uses `overflow-hidden`/`overflow-y-auto`.

3. **Tests**
   - `src/test/dashboard-page.test.tsx:323-347` updated `uses a max-w-7xl root and narrow-safe content structure` to assert grid `grid-cols-2 sm:grid-cols-4 divide-x divide-y border-y sm:divide-y-0`, left-column cells `pl-0` + `sm:px-5`, numbers `font-normal text-muted-foreground`, Due-within `sm:text-right`.
   - `src/test/funder-ui.test.tsx:34-83` updated `renders an accessible empty state and opens the creation form` to assert no `aria-controls`, `getByRole("dialog", {name: "Add funder"})`, no `section#add-funder-form`, `dialog` has `overflow-hidden` and `.overflow-y-auto overscroll-contain px-4`, fields still accessible. Fixed `shows server validation errors` and `refreshes...` to query submit via `within(dialog).getByRole("button", {name: /^Add funder$/})` (Radix hides background trigger via aria-hidden), and alert via `within(dialog)`.

### Checks / Evidence

- `npm run test:run -- src/test/dashboard-page.test.tsx src/test/funder-ui.test.tsx` → 2 passed, 30 passed (2026-09-08 11:18 UTC) after fix.
- `npx tsc --noEmit` → no output (pass).
- `git diff --check` → clean (no whitespace errors).
- `npm run test:run` (full) → 39 passed | 5 skipped (44 files), 259 passed | 37 skipped (296 tests) – no regression vs 292+ baseline.
- Manual code inspection: verified `max-w-7xl`, `divide-x divide-y border-y`, `font-normal text-muted-foreground`, `sm:text-right` preserved; `Request ed` indentation eliminated; funder add opens as `role="dialog"` slideover not inline card.

### Findings / Concerns

- Pre-existing uncommitted changes on branch `solo/ui-simplification` (R001/R002 etc.) remain untouched; diff shows 21 files M but only 5 files are R003-scoped (dashboard-content, funder-form, funder-page, dashboard-page.test, funder-ui.test). No schema/query/auth change.
- `sm:pr-0` on Awarded cell replaces `sm:last:pr-0` – visually equivalent for 4-cell grid, keeps desktop right edge flush without overflow; no functional difference.
- Funder add now shares dirty-confirm on overlay/Escape with `GrantForm` parity; add-mode previously had no dirty guard – now warns, matching spec "support dirty-check close confirmation".

### Files Changed (R003 scope)

- `src/components/dashboard/dashboard-content.tsx`
- `src/components/funders/funder-form.tsx`
- `src/components/funders/funder-page.tsx`
- `src/test/dashboard-page.test.tsx`
- `src/test/funder-ui.test.tsx`

