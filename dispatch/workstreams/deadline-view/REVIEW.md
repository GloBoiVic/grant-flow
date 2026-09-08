# Deadline View Review

ROLE: REVIEW
WORKSTREAM: deadline-view
BRANCH: solo/deadline-view
TASK: NONE

## Assignment

Independently review the completed deadline-view workstream against the frozen PLAN, T001/T002 BUILD receipts, and VALIDATION.md. Inspect the final diff for scope, behavioral regressions, accessibility/UI risks, and unresolved Critical/Important findings. Do not modify application or test code.

## Result

PASS - READY_FOR_USER

No unresolved Critical or Important findings remain. No approved-scope DEFECT or NEW SCOPE finding was identified. The feature is ready for the developer's required human Safari Technology Preview and disposable PostgreSQL gates; it is not merge/GIT END approved until those gates are explicitly completed.

## Findings

- CRITICAL: 0
- IMPORTANT: 0
- MINOR: 0
- Approved-scope DEFECT: none.
- NEW SCOPE: none.

## Frozen Requirement Judgment

- **Date and partition semantics:** `src/lib/queries/deadlines.ts:22-73` derives UTC today, queries through `today+30` with no lower deadline bound, and partitions strictly as overdue `< today`, due-soon `today..today+7`, and later `today+8..today+30`. Nulls are skipped and rows cannot be double-counted.
- **Eligibility and tenancy:** The exact five Prisma statuses are used at `src/lib/queries/deadlines.ts:10-16`; both count and row reads enforce authorized `organizationId`, Grant `deletedAt: null`, and same-organization active Funder scope at `src/lib/queries/deadlines.ts:30-42`.
- **Selection and serialization:** `src/lib/queries/deadlines.ts:44-52` selects only id, title, status, date, and Funder name, ordered by deadline then Grant ID. `src/types/deadline.ts:3-19` contains only the serializable DTO fields, with `InternalReview` mapped to `Internal Review`.
- **Route and navigation:** `src/app/(authenticated)/(org-required)/deadlines/page.tsx:6-9` has no client input and calls the server-owned query. `src/components/deadlines/deadline-view.tsx:65-67` generates encoded `/grants?grant=<id>` links to the existing Grant Sheet; no unsupported deadline parameters or `/grants/[id]` route were added.
- **UI contract:** `src/components/deadlines/deadline-view.tsx:83-147` renders one H1, the fixed three-H2 order, all groups even when empty, semantic `section`/`ul`/`li` markup, raw ISO `<time dateTime>` values with UTC-safe display formatting, safe-noon locale `As of`, visible focus outlines, and no fabricated controls.
- **Responsive and visual contract:** Rows use `min-w-0`, `break-words`, mobile stacking, existing background/status/destructive tokens, and the established Badge/status classes. Long Grant and Funder text does not require horizontal scrolling from the feature markup.
- **Empty states:** The no-Grants state links to `/import` and `/grants`; the no-eligible state describes the current view without claiming historical deadlines are absent; each empty group retains its own explicit message.
- **Scope and regression safety:** The final feature changes are limited to the deadline route, query, DTO, view, focused tests, and the approved existing PostgreSQL fixture/placeholder-test adjustments. No schema, migration, package, lockfile, dependency, unrelated application, reminder, calendar, task, or reporting-deadline changes are present.

## Checks and Evidence

- Read the frozen `PLAN.md`, mutable `ACTIVE.md`, immutable T001/T002 receipts, `VALIDATION.md`, current source/tests, surrounding authorization/Grant Sheet/layout/schema code, and final Git status/diff.
- Fetched and applied the current Vercel Web Interface Guidelines source. No accessibility or web-interface finding remained after checking semantic markup, labels/names, links, focus, text wrapping, date formatting, and state handling.
- `npm run test:run` - PASS; 36 files passed, 5 skipped; 202 tests passed, 32 skipped.
- Focused deadline/dashboard/placeholder matrix - PASS; 6 files, 36 tests.
- `npm run lint` - PASS.
- `npx tsc --noEmit` - PASS.
- `npm run verify:prisma` - PASS; Prisma connected.
- `npm run build` - PASS; production build completed and `/deadlines` is dynamic.
- `git diff --check` - PASS.
- `npx vitest run src/test/postgres-dashboard.integration.test.ts` - SKIPPED; all 5 tests were guarded because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset. The source assertions cover organization isolation, both soft-delete cases, exact statuses/windows, nulls, ancient overdue rows, ties, serialization, and unsupported rows, but they were not executed in this environment.
- The only test warning was the repository's existing Vite `configLoader: 'native'` warning; it did not fail validation.

## Residual Gates

- **PostgreSQL:** Run the disposable PostgreSQL integration suite with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` configured and confirm all five integration tests pass.
- **Safari Technology Preview:** Authenticate against the local app and inspect desktop/mobile hierarchy, restrained urgency styling, long-text behavior, keyboard focus, empty states, and activation of a deadline title into the existing Grant Sheet. The recorded browser attempt redirected to login and could not perform authenticated interaction, so this human gate remains open.

## Final Git Inspection

- Branch is `solo/deadline-view` at the frozen base HEAD with the expected workstream files present.
- `dispatch/ACTIVE.md` contains the SoloFlow state transition and was not modified by this review. Existing tracked workstream changes in the route and test fixture remain intact; no unrelated status changes were reverted.
- This review updated only `dispatch/workstreams/deadline-view/REVIEW.md`.
