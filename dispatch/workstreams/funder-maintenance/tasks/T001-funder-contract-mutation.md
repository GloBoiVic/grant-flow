# T001 - Funder Contract, Query, Mutation, and Isolation

Status: DONE
Role: BUILD
Workstream: funder-maintenance
Branch: solo/funder-maintenance
Dependency: None

## Outcome

Implement the approved Funder data contract and organization-scoped maintenance mutation without changing persistence schema or expanding the product boundary.

## Scope

- Extend the shared Funder validation contract, DTO, query select/serialization, and existing create action to cover Name, Type, Website, County served, and Notes.
- Reuse County served (200) and Notes (10,000) limits from the existing Grant contract.
- Add the organization-scoped Funder edit action in the existing domain action module with strict input, validation-before-authorization, active same-organization lookup, generic not-found behavior, atomic update, `funder_updated` Activity, complete DTO return, and exact approved route revalidation.
- Propagate the complete nested Funder DTO through `getGrant()` and existing Grant action selects/serializers without changing Grant behavior or adding another query.
- Extend focused domain/query/action tests and the existing PostgreSQL isolation fixture for all approved validation, authorization, no-write, DTO, Activity, nullable-clearing, import-boundary, and freshness requirements.

## Constraints

- Do not add schema, migrations, indexes, fields, routes, cache abstractions, contact/CRM behavior, revision/audit infrastructure, or unrelated Grant behavior.
- Do not trust client-provided organization, actor, timestamps, deletion flags, or Activity fields.
- If implementation reveals a material requirement outside the approved PLAN, stop and report it for developer review instead of expanding scope.

## Required Evidence

- Focused domain/query/action and PostgreSQL integration checks pass with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` exported without exposing its value.
- Existing create and Portfolio Import behavior remains covered.
- Complete serializable Funder DTOs and exact revalidation behavior are covered.

## Worker Evidence

Status: DONE

Files changed:

- `src/app/(authenticated)/(org-required)/grants/actions.ts`
- `src/lib/queries/funders.ts`
- `src/lib/queries/grants.ts`
- `src/lib/validations/funder.ts`
- `src/types/funder.ts`
- `src/test/domain-actions.test.ts`
- `src/test/domain-contracts.test.ts`
- `src/test/domain-queries.test.ts`
- `src/test/funder-ui.test.tsx`
- `src/test/grant-ui.test.tsx`
- `src/test/grant-workspace-route.test.ts`
- `src/test/postgres-domain-isolation.integration.test.ts`
- `src/test/postgres-portfolio-import.integration.test.ts`
- `dispatch/workstreams/funder-maintenance/tasks/T001-funder-contract-mutation.md`

Checks/evidence:

- Focused domain/query/action/UI/import checks: 7 files, 88 tests passed.
- PostgreSQL domain isolation and portfolio import integration: 2 files, 25 tests passed with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` exported into the process; its value was not printed or persisted.
- Full suite: 42 files, 262 tests passed.
- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `npm run verify:prisma` passed and connected.
- `npm run build` passed.
- `git diff --check` passed.

Findings/concerns:

- None. No schema, migration, route, cache, CRM/contact, or unrelated Grant behavior was added.
