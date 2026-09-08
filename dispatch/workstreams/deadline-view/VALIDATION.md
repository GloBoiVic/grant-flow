# Deadline View Validation

ROLE: VALIDATE
WORKSTREAM: deadline-view
BRANCH: solo/deadline-view
TASK: NONE

## Assignment

Independently validate the completed T001/T002 implementation against the frozen `dispatch/workstreams/deadline-view/PLAN.md`, including scope, date/query semantics, serialization, organization isolation, UI/accessibility behavior, required repository checks, PostgreSQL availability, and browser limitations. Do not modify application or test code.

## Result

PASS

No Critical or Important findings remain. The implementation satisfies the frozen T001/T002 contract in current source and diff inspection. PostgreSQL integration execution and authenticated Safari visual acceptance are environment-limited, not product defects; they remain explicit handoff concerns below.

## Findings

- Approved-scope DEFECT: none.
- NEW SCOPE: none.
- Critical findings: 0.
- Important findings: 0.
- Minor findings: 0.

## Contract Evidence

- `src/lib/queries/deadlines.ts:10-16` contains exactly Research, Qualified, Planning, Writing, and Prisma `InternalReview`.
- `src/lib/queries/deadlines.ts:22-52` obtains organization scope only from `requireAuthorization()`, applies `organizationId` and `deletedAt: null` to both Grant reads, requires an active same-organization related Funder, selects only the required row fields, applies only `deadline <= today+30`, and orders by `deadline ASC, id ASC`.
- `src/lib/queries/deadlines.ts:55-73` normalizes date-only values with the existing UTC helpers, keeps overdue unbounded below, applies strict overdue and inclusive `today..today+7` / `today+8..today+30` partitioning, skips nulls, serializes `YYYY-MM-DD`, and maps `InternalReview` to `Internal Review`.
- `src/types/deadline.ts:3-19` contains only the serializable `DeadlineItem` and `DeadlineViewDto` fields required by the plan; no Date, Decimal, Prisma, or unrelated portfolio value crosses the DTO boundary.
- `src/app/(authenticated)/(org-required)/deadlines/page.tsx:6-9` is a server-owned query-to-view route with no client input.
- `src/components/deadlines/deadline-view.tsx:6-147` renders one H1, fixed H2 order, semantic lists and list items, title deep-links with encoded Grant IDs, raw ISO `<time dateTime>` values with UTC-safe display formatting, existing status classes, safe-noon locale `As of`, honest portfolio/group empty states, visible link focus, and `min-w-0`/`break-words` responsive text handling.
- Navigation, AppShell, authentication, Grant Sheet URL behavior, Prisma schema, migrations, dependencies, and unsupported deadline URL parameters are unchanged by the feature diff.
- Current source and tests preserve the exact eligible-status, organization/soft-delete, null, boundary, tie-order, no-overlap, serialization, UI hierarchy, deep-link, empty-state, and no-fabricated-control requirements. The dedicated PostgreSQL fixture also covers cross-organization, soft-deleted Grant/Funder, excluded statuses, boundaries, ancient overdue, null, and tied ordering cases.

## Required Checks

Environment: Node `v26.8.1`.

- `npm run test:run` - PASS; 36 files passed, 5 skipped; 202 tests passed, 32 skipped.
- `npx vitest run src/test/deadline-queries.test.ts src/test/deadline-view.test.tsx src/test/deadlines-route.test.ts src/test/dashboard-dates.test.ts src/test/dashboard-queries.test.ts src/test/feature-placeholder.test.tsx` - PASS; 6 files, 36 tests.
- `npm run lint` - PASS.
- `npx tsc --noEmit` - PASS.
- `npm run verify:prisma` - PASS; Prisma connected.
- `npm run build` - PASS; Prisma Client generated and Next production build completed with dynamic `/deadlines`.
- `npx vitest run src/test/postgres-dashboard.integration.test.ts` - SKIPPED by the test's environment guard; 1 file and 5 tests skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset. No PostgreSQL integration assertions were executed.
- `git diff --check` - PASS before and after the final inspection.

The Vitest command emitted the repository's existing Vite `configLoader: 'native'` warning; it did not fail a check.

## Safari Technology Preview

Attempted the required `discover -> snapshot/read -> interact -> verify` flow against a local `npm run dev -- --hostname 127.0.0.1` server.

- Discover: opened `http://127.0.0.1:3000/deadlines` in Safari Technology Preview MCP.
- Snapshot/read: the unauthenticated request resolved to `/login?redirect_url=.../deadlines`; the extracted page content was `Internal Server Error` in this environment, and there was no authenticated page snapshot.
- Interact: not performed because no authenticated session or usable login surface was available.
- Verify: page information confirmed the login redirect URL; no authenticated deadline data, responsive layout, keyboard focus, or Grant Sheet activation could be verified.

This is an environment-limited human gate, consistent with the T002 receipt. It is not classified as a product defect. Human Safari approval remains required before merge/GIT END.

## Final Git Inspection

- Branch: `solo/deadline-view`.
- The feature diff contains the expected deadline route/query/DTO/view and focused test/fixture changes. No package, lockfile, Prisma schema, migration, unsupported route, or unrelated application dependency change is present.
- `dispatch/ACTIVE.md` contains the pre-existing workstream state change and was not modified during validation.
- Only `dispatch/workstreams/deadline-view/VALIDATION.md` was modified by this VALIDATE role.
