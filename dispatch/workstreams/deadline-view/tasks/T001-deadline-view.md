# T001 - Deadline query, DTO, and deterministic data coverage

Status: DONE_WITH_CONCERNS
Role: BUILD
Workstream: deadline-view
Branch: solo/deadline-view

## Assignment

Implement the frozen PLAN's serializable deadline DTO and server-only organization-scoped query. Add deterministic mocked query/date coverage and the smallest disposable PostgreSQL integration coverage supported by the existing repository pattern.

## Required outcome

- Add `DeadlineViewDto` and `DeadlineItem` with only the fields in the frozen PLAN.
- Query through `requireAuthorization()` and enforce active same-organization Grant and Funder scope on every read.
- Include exactly Research, Qualified, Planning, Writing, and Internal Review; exclude all other statuses and null deadlines.
- Reuse `toUtcDateOnly`, `addUtcDays`, `formatUtcDate`, and `utcToday`; accept only an injected `today` for deterministic tests.
- Query required fields only, apply `deadline <= today+30` with no lower deadline bound, order by `deadline ASC, id ASC`, and partition into disjoint overdue, due-soon, and later groups using the frozen inclusive boundaries.
- Keep overdue rows unbounded below so all eligible historical overdue rows remain visible.
- Add mocked tests for scope, statuses, selection/order, serialization, boundaries, stable ties, nulls, no overlap, and no historical cutoff.
- Extend or minimally add disposable PostgreSQL integration coverage for isolation, soft deletes, statuses, nulls, boundaries, and tied ordering when the test database env is available.

## Constraints

- Do not change the Prisma schema, migrations, deadline types, URL semantics, pagination/capping, or unrelated query behavior.
- Do not implement the `/deadlines` UI, navigation, reminders, calendar, tasks, filters, or new routes.
- Do not accept organization input from callers or expose Date, Decimal, Prisma, or unrelated portfolio data in the DTO.
- Do not change branches or Git history or edit Solo-owned planning state or another role's evidence artifact.

## Relevant contract

Read `dispatch/workstreams/deadline-view/PLAN.md` and existing date, authorization, grant-query, dashboard-query, serializer, Prisma, and test patterns before implementation. The PLAN is the frozen contract; a material schema, pagination/cap, deadline-type, URL, or architecture need must stop BUILD and return for review.

## Checks and receipt

Run focused deadline/date/query tests plus the applicable type, lint, Prisma, integration, and diff checks. Record exact commands, results, files changed, and concerns below. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

---

## Receipt

Status: DONE_WITH_CONCERNS

### Implementation

- Added serializable `DeadlineViewDto` and `DeadlineItem` with only the frozen fields.
- Added server-only `getDeadlineView`, deriving organization scope from `requireAuthorization()`.
- Applied active same-organization Grant/Funder scope to both reads, exact pre-submission status filtering, `deadline <= today+30`, no lower deadline bound, and `deadline ASC, id ASC` ordering.
- Partitioned normalized UTC date-only rows into disjoint overdue, due-soon, and later groups; null deadlines are excluded and `InternalReview` serializes as `Internal Review`.
- Added deterministic mocked query coverage for scope, status list, selection, ordering, serialization, boundaries, stable ties, nulls, no overlap, and historical overdue rows.
- Extended the existing disposable PostgreSQL dashboard fixture with ancient overdue, excluded-status, and deadline-view isolation/window assertions.
- No schema, migration, URL, infrastructure, pagination, cap, or new deadline type changes.

### Commands and Results

- `npx vitest run src/test/deadline-queries.test.ts src/test/dashboard-queries.test.ts src/test/dashboard-dates.test.ts` - PASS; 3 files, 29 tests.
- `npx vitest run src/test/postgres-dashboard.integration.test.ts` - PASS process; 1 file and 5 tests skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unavailable.
- `npm run test:run` - PASS; 34 files passed, 5 skipped; 198 tests passed, 32 skipped.
- `npm run lint` - PASS.
- `npx tsc --noEmit` - PASS.
- `npm run verify:prisma` - BLOCKED by environment; Prisma `P1001`, configured `127.0.0.1:5432` is unreachable.
- `npm run build` - PASS; Prisma Client generated and Next production build completed.
- `git diff --check` - PASS.

### Files Changed

- `src/types/deadline.ts` - added DTO contract.
- `src/lib/queries/deadlines.ts` - added server-only deadline query.
- `src/test/deadline-queries.test.ts` - added deterministic mocked query tests.
- `src/test/postgres-dashboard.integration.test.ts` - extended fixture and PostgreSQL deadline coverage.
- `dispatch/workstreams/deadline-view/tasks/T001-deadline-view.md` - recorded this immutable BUILD receipt.

### Concerns

- PostgreSQL-backed integration assertions require a disposable database and remain unexecuted in this environment.
- `verify:prisma` requires the configured local PostgreSQL server to be available.
- Pre-existing `dispatch/ACTIVE.md` changes were left untouched; no other dispatch artifact was edited.
