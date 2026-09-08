# Deadline View T003 Review

ROLE: REVIEW
WORKSTREAM: deadline-view
BRANCH: solo/deadline-view
TASK: T003

## Assignment

Independently review the approved T003 Dashboard overdue-age follow-up against the amended PLAN, T003 BUILD receipt, and T003 validation artifact. Confirm scope, regressions, accessibility/UI behavior, and unresolved Critical/Important findings. Do not modify application or test code.

## Result

PASS - READY_FOR_USER

No unresolved Critical or Important findings remain. T003 stays within the approved Dashboard overdue-age follow-up, and the existing T001/T002 Deadline View contract is preserved. The disposable PostgreSQL assertions remain environment-skipped; the developer's explicit human/browser approval before merge or GIT END remains required by the canonical PLAN.

## Findings

- Approved-scope DEFECT: none.
- NEW SCOPE: none.
- Critical findings: 0.
- Important findings: 0.
- Minor findings: 0.

## Contract Judgment

- **DTO:** `src/types/dashboard.ts:12-16` adds only `attention.oldestOverdueDays: number | null`; the value crossing the Dashboard query boundary is a primitive number or null and is JSON serializable.
- **Authorization and scope:** `src/lib/queries/dashboard.ts:83-95,122-130` derives the organization only from `requireAuthorization()`. The oldest-overdue read reuses the active Grant and active same-organization Funder scope, the exact five pre-submission Prisma statuses, and `deletedAt: null`.
- **Strict date semantics:** `src/lib/queries/dashboard.ts:87-89,122-130,170-172` compares `deadline < todayUtc`, where injected/server today is normalized through the UTC date-only seam. The selected deadline is normalized through `toUtcDateOnly` before the midnight-to-midnight day difference, producing a non-negative integer age.
- **Deterministic selection:** The oldest read selects only `deadline` and orders by `deadline ASC, id ASC`, so equal deadlines resolve deterministically without exposing the Grant row or unrelated data.
- **Null and no-overdue behavior:** A null `findFirst` result produces `oldestOverdueDays: null`; the existing overdue count remains zero in the no-overdue case. The UI also omits age copy unless the overdue count is positive and the DTO age is non-null.
- **Copy and placement:** `src/components/dashboard/dashboard-content.tsx:284-288` renders `Oldest overdue: 1 day` for one and `Oldest overdue: N days` otherwise, using the existing muted text token inside the existing overdue tile. No red urgency class or surrounding tile treatment was changed.
- **Scope boundary:** T003 application changes are limited to the Dashboard DTO, query, Dashboard presentation, focused Dashboard tests, and existing PostgreSQL fixture assertions. No new colors, controls, links, filters, routes, schema/migrations, dependencies, or Deadline View implementation changes were introduced.
- **Deadline View regression:** Current `src/lib/queries/deadlines.ts`, `src/types/deadline.ts`, `src/components/deadlines/deadline-view.tsx`, and the authenticated deadlines route still implement the exact five-status scope, strict UTC date-only grouping, deterministic row ordering, serializable DTO, fixed three-section hierarchy, existing status styling, safe-noon `As of`, semantic lists/times, focus treatment, empty states, responsive wrapping, and Grant Sheet links.

## Accessibility, Design, and Performance

- The new cue is plain text and adds no interactive surface or icon; existing Dashboard links retain semantic anchors and visible focus treatment.
- The cue uses the established muted caption token and remains subordinate to the existing overdue count and red treatment. It does not introduce a new urgency level or duplicate the Deadline View.
- Current Safari inspection at `390x844` showed the cue readable inside the overdue tile; document and body scroll widths were `373px` against a `390px` viewport. The Deadline View retained one H1, three H2 sections, three lists, and no observed horizontal overflow.
- The authenticated Safari session showed `Oldest overdue: 116 days` on Dashboard desktop and mobile. Activating the first Deadline View title opened the existing `/grants?grant=...` Grant Sheet for `IMPACT 211`.
- The fetched Web Interface Guidelines review found no new accessibility violation. T003 adds no client state, client fetch, layout measurement, or dependency; the existing Dashboard `Promise.all` query pattern remains intact.

## Checks and Evidence

Environment: Node `v26.8.1`.

- `npm run test:run` - PASS; 36 files passed, 5 skipped; 206 tests passed, 32 skipped.
- `npx vitest run src/test/dashboard-dates.test.ts src/test/dashboard-queries.test.ts src/test/dashboard-page.test.tsx src/test/deadline-queries.test.ts src/test/deadline-view.test.tsx src/test/deadlines-route.test.ts src/test/feature-placeholder.test.tsx` - PASS; 7 files, 55 tests.
- `npm run lint` - PASS.
- `npx tsc --noEmit` - PASS.
- `npm run verify:prisma` - PASS; connected.
- `npm run build` - PASS; Prisma Client generated and Next production build completed with dynamic `/dashboard` and `/deadlines` routes.
- `npx vitest run src/test/postgres-dashboard.integration.test.ts` - SKIPPED by the environment guard; 1 file and 5 tests skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset. No PostgreSQL assertions executed.
- `git diff --check` - PASS.
- Vitest emitted the repository's existing Vite `configLoader: 'native'` warning; it did not fail a check.
- Safari console contained only the development HMR suspension and Clerk development-key warnings; no application error was observed during the authenticated Dashboard, Deadline View, or Grant Sheet flow.

## Final Git Inspection

- Branch: `solo/deadline-view`.
- `git status --short` shows the expected pre-existing T001/T002 worktree files, the approved T003 Dashboard/test/fixture changes, the pre-existing `dispatch/ACTIVE.md` change, and assigned workstream artifacts.
- The T003 tracked diff is limited to `src/types/dashboard.ts`, `src/lib/queries/dashboard.ts`, `src/components/dashboard/dashboard-content.tsx`, `src/test/dashboard-queries.test.ts`, `src/test/dashboard-page.test.tsx`, and the existing `src/test/postgres-dashboard.integration.test.ts` fixture/assertions.
- No package, lockfile, Prisma schema/migration, unrelated dependency, Deadline View implementation, or unrelated application change was attributed to T003.
- Only `dispatch/workstreams/deadline-view/T003-REVIEW.md` was written during this review.
