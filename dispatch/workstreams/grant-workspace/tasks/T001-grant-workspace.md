# T001 - Workspace route, existing data seams, and isolation coverage

Status: DONE
Role: BUILD
Workstream: grant-workspace
Branch: solo/grant-workspace

## Assignment

Implement the frozen PLAN's authenticated `/grants/[grantId]` server route using the existing `getGrant`, `notFound()`, `listFunders()`, and `listTags()` seams. Add the focused route/query and disposable PostgreSQL coverage required by the PLAN.

## Required outcome

- Add `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx` with the Promise-based `params` contract, awaited `grantId`, and `getGrant(grantId)`.
- Call `notFound()` immediately for a null Grant result; do not fetch Funder or Tag options after not-found.
- After a valid Grant only, load `listFunders()` and `listTags()` in parallel and hand the existing serializable `GrantDetailDto` through to the route-local workspace seam needed by T002.
- Reuse `getGrant` without a parallel workspace query. Preserve complete field serialization, active same-organization Funder scope, active organization-scoped tag scope, Activity organization scope/order, and `Internal Review` display serialization.
- Add focused mocked route/query assertions for params, query handoff, not-found short circuit, option-read ordering, scope, selection, serialization, and Activity order.
- Extend the smallest existing disposable PostgreSQL fixture or focused equivalent for authorized loading, another-organization denial, soft-deleted Grant denial, soft-deleted Funder denial, mismatched-organization Funder denial, complete fields, active tag scope, Activity scope/order, JSON-serializable DTOs, and current mutation isolation/no-op semantics where directly relevant.

## Constraints

- The PLAN is the frozen contract. If a required field, schema/migration/index need, new DTO/query, different authorization seam, or other material requirement appears, mark this task `BLOCKED` and return for developer review rather than expanding scope.
- Do not implement the full workspace presentation, edit/status/tag controls, Sheet link, or mutation revalidation; those belong to T002 unless the route needs a minimal server-compatible handoff seam.
- Do not change the Prisma schema, migrations, persistence models, authentication, tenant boundaries, or unrelated routes/queries.
- Do not accept organization scope from route params, search params, form input, or client state.
- Do not change branches or Git history or edit Solo-owned planning state or another role's evidence artifact.

## Relevant contract

Read `dispatch/workstreams/grant-workspace/PLAN.md` and the existing route, authorization, Grant query/serializer, Funder/Tag query, and focused test patterns before implementation. Follow the exact route, not-found, ordering, serialization, and no-follow-on-read contracts in the PLAN.

## Checks and receipt

Run focused route/query tests and the applicable PostgreSQL integration tests, type, lint, Prisma, build, and diff checks supported by the environment. Record exact commands, results, files changed, and concerns below. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

---

## Receipt

Status: DONE

### Implementation

- Added the authenticated `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx` route with the Promise-based params contract, awaited `grantId`, existing authorized `getGrant(grantId)`, immediate `notFound()` short-circuit, and `Promise.all` Funders/Tags reads after a valid Grant.
- Added the minimal server-compatible `GrantWorkspace` handoff seam receiving the existing serializable `GrantDetailDto`, Funder options, and Tag options. Full presentation and interactions remain assigned to T002.
- Confirmed no production query adjustment was needed: existing `getGrant` already enforces active same-organization Grant/Funder scope, active organization-scoped tags, organization-scoped newest-first Activity, complete field selection, and serializable status/date/amount values.
- Added mocked route coverage for awaited params, Grant ID handoff, valid DTO/options handoff, post-valid parallel option reads, and not-found no-follow-on reads.
- Extended domain query coverage for complete field selection/serialization, `InternalReview` display mapping, JSON-safe DTOs, and Activity ordering.
- Extended the disposable PostgreSQL domain fixture with populated fields, active/deleted/cross-organization tags, multiple ordered Activity rows, soft-deleted and mismatched Funders, and focused workspace isolation assertions. Preserved existing mutation isolation/no-op assertions by comparing against seeded Activity baselines where needed.
- No schema, migration, authentication, tenant-boundary, or unrelated route/query changes.

### Commands and Results

- `npx vitest run src/test/grant-workspace-route.test.ts src/test/domain-queries.test.ts` - PASS; 2 files, 24 tests.
- PostgreSQL-enabled `src/test/postgres-domain-isolation.integration.test.ts` run with the ignored local `GRANTFLOW_TEST_DATABASE_ADMIN_URL` loaded into the test process - PASS; 1 file, 22 tests.
- PostgreSQL-enabled `npm run test:run` run with the ignored local `GRANTFLOW_TEST_DATABASE_ADMIN_URL` loaded into the test process - PASS; 42 files, 243 tests, 0 skipped.
- `npm run lint` - PASS.
- `npx tsc --noEmit` - PASS.
- `npm run verify:prisma` - PASS; connected.
- `npm run build` - PASS; Prisma Client generated and Next production build completed, including `/grants/[grantId]`.
- `git diff --check` - PASS.
- Final `git status --short --branch` and diff inspection completed; pre-existing `dispatch/ACTIVE.md` and workstream files were preserved, and only T001 implementation/test paths plus this receipt were changed by BUILD.

### Files Changed

- `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx`
- `src/components/grants/grant-workspace.tsx`
- `src/test/grant-workspace-route.test.ts`
- `src/test/domain-queries.test.ts`
- `src/test/postgres-domain-isolation.integration.test.ts`
- `dispatch/workstreams/grant-workspace/tasks/T001-grant-workspace.md`

### Concerns

- None for T001. The workspace seam intentionally returns no presentation until T002; no T002 UI, actions, Sheet link, or revalidation work was implemented.
