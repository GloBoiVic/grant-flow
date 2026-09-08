# R002 - Visual density refinements

Remediation ID: R002
Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification

## Origin feedback

Developer Safari visual-gate observations received 2026-09-08:

- Amount display is too bold; reduce the boldness or darkness.
- Amount decimals should be reduced: `$100.00` should display as `$100`.
- Needs Attention spacing needs improvement; push Due within 7 days to the right and use a thin separator if useful.
- The Deadlines section looks clustered and needs more spacing.

These are bounded presentation refinements within the approved reduction pass, not new product scope.

## Related original task(s)

- T001 - Dashboard composition
- T002 - Grant list, quick Sheet, and form copy
- T003 - Grant Workspace and Deadline View

## Approved requirement or invariant addressed

- Frozen PLAN composition baseline: typography and spacing establish hierarchy; narrow layouts stack naturally; urgency remains clear without competing treatments.
- Acceptance criteria 5, 6, 9, 13, 19, 23, 25, 38, and 42: retain the approved attention/deadline surfaces, explicit currency presentation, responsive layout, and qualitative visual result.
- Functional invariants: amount values and stored currency remain unchanged; no query, navigation, status, deadline-bucket, persistence, or import/export behavior changes.

## Exact remediation outcome

- Format visible UI currency amounts with up to two meaningful fractional digits and no trailing zero decimals, so whole-dollar values render without `.00` while meaningful cents remain visible.
- Soften the visual weight/darkness of visible amount values without weakening labels, readability, explicit currency code requirements, or semantic status styling.
- Add a restrained separator and improved spacing between the Needs Attention metrics, especially at the desktop two-column layout, while keeping the existing mobile stack.
- Increase breathing room in the Dashboard upcoming-deadline list and Deadline View grouped rows/headers without changing the one-surface three-group composition, row data, links, or ordering.
- Update only focused assertions that describe the changed amount output or bounded visual structure.

## Affected implementation seams

- `src/components/dashboard/dashboard-content.tsx`
- `src/components/grants/grants-page.tsx`
- `src/components/grants/grant-detail-sheet.tsx`
- `src/components/grants/grant-workspace.tsx`
- `src/components/deadlines/deadline-view.tsx`
- Focused tests for these surfaces.

## Explicitly out of scope

- No schema, persistence, DTO/query/domain, actions, auth/tenancy, routes, navigation, status/deadline semantics, import/export contracts, or shared primitive changes.
- No new currency selection, currency conversion, precision policy, or financial behavior; this is display formatting only.
- No redesign of Dashboard, Workspace, Deadline View, list, Sheet, or generic design tokens beyond the directly requested presentation adjustments.
- No page-level overflow workaround, animation, theme, new abstraction, or unrelated copy change.

## Regression evidence required

- Focused tests verify whole-dollar and meaningful-decimal formatting in every changed visible amount surface, explicit Workspace currency-code output, existing null/empty behavior, unchanged amount values/links, Needs Attention structure, deadline rows/groups/links/order, and narrow-safe layout.
- Run scoped lint, TypeScript, and `git diff --check`; record exact results.
- Independent R002 VALIDATE and REVIEW must confirm no product/regression findings before returning to `READY_FOR_USER`.

## Worker Evidence

Status: DONE

Files changed:

- `src/components/dashboard/dashboard-content.tsx`
- `src/components/grants/grants-page.tsx`
- `src/components/grants/grant-detail-sheet.tsx`
- `src/components/grants/grant-workspace.tsx`
- `src/components/deadlines/deadline-view.tsx`
- `src/test/dashboard-page.test.tsx`
- `src/test/grant-ui.test.tsx`
- `src/test/deadline-view.test.tsx`
- `dispatch/workstreams/ui-simplification/remediations/R002-ui-simplification/BUILD.md`

Implementation:

- Updated each existing surface-local currency formatter to display up to two fractional digits without trailing zeroes. The Detail Sheet and Workspace retain explicit currency-code output; null/empty placeholders remain unchanged.
- Reduced amount value emphasis with local muted/normal-weight classes in the Dashboard, Grant list, Detail Sheet, and Workspace.
- Added a desktop-only divider and side spacing between Needs Attention metrics while retaining the mobile gap stack.
- Increased Dashboard upcoming-row padding and Deadline View group header, populated-row, and empty-row padding without changing the single surface, three groups, order, links, data, or semantics.
- Updated only focused assertions for amount output, amount emphasis, metric structure, and row/header spacing.

Checks / evidence:

- `npm run test:run -- src/test/dashboard-page.test.tsx src/test/grant-ui.test.tsx src/test/deadline-view.test.tsx` -> passed: 3 files, 45 tests.
- `npm run lint -- src/components/dashboard/dashboard-content.tsx src/components/grants/grants-page.tsx src/components/grants/grant-detail-sheet.tsx src/components/grants/grant-workspace.tsx src/components/deadlines/deadline-view.tsx src/test/dashboard-page.test.tsx src/test/grant-ui.test.tsx src/test/deadline-view.test.tsx` -> passed.
- `npx tsc --noEmit` -> passed.
- `git diff --check` -> passed before receipt write; final tracked diff check rerun after receipt write -> passed.
- Existing Vitest `configLoader: 'native'` compatibility warning was emitted and did not affect the focused result.

Findings / concerns:

- None for the bounded R002 implementation. The existing human Safari visual gate remains required; automated checks do not claim that approval.

## Receipt

ROLE: BUILD
STATUS: DONE
ARTIFACT: dispatch/workstreams/ui-simplification/remediations/R002-ui-simplification/BUILD.md
FILES CHANGED: src/components/dashboard/dashboard-content.tsx; src/components/grants/grants-page.tsx; src/components/grants/grant-detail-sheet.tsx; src/components/grants/grant-workspace.tsx; src/components/deadlines/deadline-view.tsx; src/test/dashboard-page.test.tsx; src/test/grant-ui.test.tsx; src/test/deadline-view.test.tsx; this receipt
CHECKS / EVIDENCE: Focused changed-surface tests 3 files/45 tests passed; scoped lint, TypeScript, and final tracked diff check passed.
FINDINGS / CONCERNS: None for R002; existing human Safari visual gate remains pending and is not claimed.
