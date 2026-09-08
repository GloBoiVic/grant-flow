# R007 - Deadlines left padding true grant alignment

Remediation ID: R007
Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification

## Origin finding and source artifact

User 2026-09-08: "The deadlines page still has a weird padding. The DB is running" — following R006 which set heading `px-4 sm:px-6` to match rows `px-4`. At desktop `sm:` the heading remains 24px left while rows are 16px, and the empty/no-grants states `px-5 sm:px-6` add further 4-8px offset vs Grants table `px-4` baseline. Safari inspection needed with DB running to verify.

## Finding severity

IMPORTANT (visual alignment regression).

## Related original task(s)

- T003 Deadlines View
- R006 muted zero + heading px-4

## Approved requirement or invariant violated

- PLAN width/composition: Deadlines and Grants share `max-w-7xl` outer; inner card padding must align left edge between deadline headings/rows/empty and grants table cells.

## Exact remediation outcome

- `src/components/deadlines/deadline-view.tsx:92,94,108,122,129,60`:
  - Outer `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8` stays (matches Grants `max-w-7xl px-4 py-7 sm:px-6 lg:px-8`).
  - Inner card `mt-6 overflow-hidden rounded-xl border border-border bg-card` stays single surface.
  - Heading container `122`: change `px-4 py-5 sm:px-6` → `px-4 py-5` (remove `sm:px-6`).
  - No-grants tracked `94` and no-eligible `108`: change `px-5 py-4 sm:px-6` → `px-4 py-4` to match heading/rows.
  - Rows `60` stay `px-4 py-4`; empty group `129` `px-4 py-5` stays.
  - Result: at all breakpoints heading, rows, empty states all `px-4` left, aligning with Grants `th/td px-4` (which has no `sm:` bump). Keeps `py-5` heading breathing.

## Affected implementation seams

- `src/components/deadlines/deadline-view.tsx`
- `src/test/deadline-view.test.tsx` (heading py-5 px-4 assertion)

## Explicit out-of-scope items

- No font/mono/color change, no width change beyond inner px, no schema/query.

## Regression evidence required

- `npm run test:run` (deadline + grants), `npx tsc --noEmit`, `git diff --check`, `npm run build` with DB running check `psql` if available. Safari Technology Preview visual: headings/rows left edge aligns with Grants table left edge at mobile and `≥1024px`.

## Worker Evidence

Executed 2026-09-08 on branch solo/ui-simplification.

- **codegraph_explore** used for `deadline-view.tsx deadline-view` before edit; verified verbatim source showed heading container `px-4 py-5 sm:px-6` at `:122` and no-grants states `px-5 py-4 sm:px-6` at `:94` and `:108`, rows `px-4 py-4` at `:60` — matching BUILD requirement intent to align left edge with Grants `th/td px-4`.
- **DeadlineView fix** `src/components/deadlines/deadline-view.tsx`:
  - Heading container `:122` changed `px-4 py-5 sm:px-6` → `px-4 py-5` (removed `sm:px-6`), now all breakpoints use 16px left aligning with rows.
  - No-grants tracked `:94` changed `px-5 py-4 sm:px-6` → `px-4 py-4`.
  - No-eligible `:108` changed `px-5 py-4 sm:px-6` → `px-4 py-4` to match heading/rows.
  - Rows `:60` remain `px-4 py-4`; empty group `:129` remains `px-4 py-5`; outer `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8` at `:84` and inner card `mt-6 overflow-hidden rounded-xl border border-border bg-card` at `:92` unchanged — single surface, `py-5` breathing kept on headings.
  - Verified via `Read` post-edit: `:94`, `:108` are `border-b border-border px-4 py-4`; `:122` is `px-4 py-5`; `:60` and `:129` remain `px-4`.
- **Tests**: `npm run test:run` PASS — Test Files 39 passed (5 skipped), Tests 259 passed (37 skipped), Duration 2.10s. Existing `src/test/deadline-view.test.tsx:39` asserts `py-5` on heading parent and `py-4` on rows; no `sm:px-6` assertion exists so no test update required — verified alignment now holds at all breakpoints.
- **Types**: `npx tsc --noEmit` PASS (exit 0, no output).
- **Lint/diff**: `git diff --check` clean (exit 0, no whitespace errors).
- **Build**: `npm run build` PASS — `prisma generate` + Next 16.3.0 compiled successfully in 565ms, TypeScript finished in 1001ms, 11 routes generated (/, dashboard, deadlines, funders, grants, etc.).
- **Diff scope**: For R007 only `src/components/deadlines/deadline-view.tsx` changed within approved seam; verified via `git diff -- src/components/deadlines/deadline-view.tsx` shows only heading `sm:px-6` removal and both no-grants `px-5 sm:px-6` → `px-4`. No font/mono/color/width/schema change beyond inner px.

Status: DONE

