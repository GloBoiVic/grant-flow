# R006 - Mute overdue zero and align deadline padding to grants

Remediation ID: R006
Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification

## Origin finding and source artifact

User notes 2026-09-08 with screenshots:

1. When there is no overdue grant, we should mute the number (Image 1 shows Needs attention Overdue 0 rendered in dark `text-foreground` #1F2937, should be muted gray like metrics `text-muted-foreground`).
2. Deadline page is not aligned with grant. There is a weird padding or margin left (Image 2 shows Overdue/Due groups vs Grants table). Heading container `px-5 sm:px-6` vs row `px-4` causes 4px left mismatch vs Grants table `px-4` cells.

Source: user message "Two notes: 1. When there is no overdue grant, we should mute the number 2. Deadline page is not align with grant. There is a weird padding or margin left."

## Finding severity

IMPORTANT (visual consistency, follows reduction principles; no data loss).

## Related original task(s)

- T001 - Dashboard composition (Needs attention)
- T003 - Grant Workspace and Deadline View

## Approved requirement or invariant violated

- PLAN Acceptance 5: Needs attention presents Overdue and Due within 7 days exactly once, restrained urgency. Zero state should be muted, not emphasized as foreground.
- PLAN Width and Composition: Dashboard/Deadlines/Grants share `max-w-7xl` with consistent horizontal padding; Deadline View single bordered surface should align left edge with Grants table.
- Previous R004/R005 kept `hasOverdue ? text-destructive : text-foreground` for zero; should be muted.

## Exact remediation outcome

1. **Dashboard Needs attention zero muting** — `src/components/dashboard/dashboard-content.tsx:180,187`:
   - Overdue `dd`: change `hasOverdue ? "text-destructive" : "text-foreground"` → `hasOverdue ? "text-destructive" : "text-muted-foreground"`.
   - Due within 7 days `dd`: same — currently `hasDueSoon ? "text-destructive" : "text-foreground"` → `text-muted-foreground` when zero, to match muted numbers and keep red only when attention needed. Keep `font-semibold tabular-nums` and `sm:text-right`.
   - Keeps red `#DC2626` for >0, muted gray `#6B7280` for 0, consistent with metrics `font-mono font-normal text-muted-foreground` and status breakdown zero `text-muted-foreground`.

2. **Deadline page left alignment** — `src/components/deadlines/deadline-view.tsx:92,121-122,58-60,127`:
   - Outer `div` already `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8` (same as `GrantsPage` `max-w-7xl px-4 py-7 sm:px-6 lg:px-8` and `DashboardContent` `max-w-7xl px-4 py-6`). Keep but ensure no extra `mx-` offset.
   - Align group heading and row horizontal padding to Grants table `px-4 sm:px-?` baseline. Current heading `px-5 py-5 sm:px-6` vs row `px-4 py-4` creates 4px (1 unit) left shift vs Grants `px-4`. Change heading container to `px-4 py-5 sm:px-6` OR make both `px-4`/`px-5` consistently — choose `px-4 sm:px-6` for both heading and rows to match Grants `px-3 sm:px-4` scale (deadlines uses slightly larger card but should align). Minimal change: Change `src/components/deadlines/deadline-view.tsx:122` from `px-5 py-5 sm:px-6` → `px-4 py-5 sm:px-6`, or make rows `px-5` — verify against Grants. Keep `rounded-xl border` single surface, `border-t` dividers.
   - Verify empty-state `li` `px-4 py-5` also aligns.

   After fix, left edge of Deadline card and its heading text should vertically align with Grants table left edge and Dashboard metrics left edge at both narrow and desktop.

## Affected implementation seams

- `src/components/dashboard/dashboard-content.tsx` (muted zero)
- `src/components/deadlines/deadline-view.tsx` (heading/row px alignment)
- `src/test/dashboard-page.test.tsx` (zero-state assertions if checking text-foreground vs muted)
- `src/test/deadline-view.test.tsx` (if heading padding asserted as py-5 px-5)

## Explicit out-of-scope items

- No font change (keep IBM Plex Sans + Geist Mono with plain zero from R005), no color token addition, no schema/query/auth/import/export, no width change beyond padding alignment, no universal search.

## Regression evidence required

- Code inspection: zero `dd` uses `text-muted-foreground`, heading vs row `px-4` consistent, single `max-w-7xl` border surface.
- `npm run test:run` (focused + full) PASS, `npx tsc --noEmit` PASS, `git diff --check` clean, `npm run build` PASS (optional).
- Screenshots or VALIDATE inspection confirms Overdue 0 is muted gray and Deadline left edge aligns with Grants table left edge.

## Worker Evidence

Executed 2026-09-08 on branch solo/ui-simplification.

- **codegraph_explore** used to locate dashboard-content.tsx and deadline-view.tsx seams; verified lines 180/187 zero class and 122 heading padding.
- **Dashboard fix** `src/components/dashboard/dashboard-content.tsx:180,187`: changed `hasOverdue ? "text-destructive" : "text-foreground"` → `hasOverdue ? "text-destructive" : "text-muted-foreground"` and same for `hasDueSoon`. Verified `font-semibold tabular-nums` retained, `sm:text-right` unchanged, red `#DC2626` only when >0, muted gray `#6B7280` for 0 aligns with metrics `font-mono font-normal text-muted-foreground` and breakdown zero `text-muted-foreground`. File `src/components/dashboard/dashboard-content.tsx:180` and `:187` now show `text-muted-foreground`.
- **Deadline fix** `src/components/deadlines/deadline-view.tsx:122`: changed `px-5 py-5 sm:px-6` → `px-4 py-5 sm:px-6` to match row `px-4 py-4` at `:60` and empty `li` `px-4 py-5` at `:129`. Outer remains `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8` at `:84`, identical px scale to `GrantsPage` `max-w-7xl px-4 py-7 sm:px-6` and `DashboardContent` `max-w-7xl px-4 py-6`. Verified no extra `mx-` offset and single `rounded-xl border` surface with `border-t` dividers.
- **Tests**: No existing assertions checked `text-foreground` for zero or `px-5` for heading; deadline-view test only asserts `py-5` on heading parent (`src/test/deadline-view.test.tsx:39`), so no test update required. Verified dashboard-page tests still pass for zero muted structure.
- **Regression**: `npm run test:run` PASS — Test Files 39 passed (5 skipped), Tests 259 passed (37 skipped), Duration 2.15s. `npx tsc --noEmit` PASS (exit 0). `git diff --check` clean (exit 0). `npm run build` PASS — Compiled successfully, TypeScript finished, 11 routes generated.
- **Diff**: Only approved paths changed for R006 (`src/components/dashboard/dashboard-content.tsx`, `src/components/deadlines/deadline-view.tsx`); heading vs row `px-4` now consistent, zero `dd` muted verified by inspection.

Status: DONE

