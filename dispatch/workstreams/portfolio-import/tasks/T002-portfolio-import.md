# T002 — Scoped atomic preview and commit

Status: DONE_WITH_CONCERNS
Role: BUILD
Workstream: portfolio-import
Branch: solo/portfolio-import
Dependency: T001 DONE

## Assignment

Implement the frozen PLAN's authenticated analysis/confirmation actions and atomic
organization-scoped persistence for Portfolio Import, using the parser and DTO contract
produced by T001. Do not begin until T001 is complete.

## Required outcome

- Analyze and confirm only after resolving the existing server-side authorization seam.
- Resolve active Funders only within the authorized organization; reuse deterministic exact
  normalized matches, expose type mismatches, reject ambiguity, and group new Funders with
  conflicting source types rejected.
- Re-parse, re-map, re-validate, deduplicate, and re-resolve Funders on confirmation. Treat
  preview JSON and client identifiers/decisions as display-only and non-authoritative.
- Atomically bulk-create required new Funders, Grants, and corresponding `funder_created`
  and `grant_created` Activity records in one organization-scoped transaction, with the
  authorized local user as actor/owner/creator.
- Preserve rollback on any persistence failure, avoid Activity noise for reused Funders,
  structural rows, invalid rows, or collapsed duplicates, and revalidate `/grants` and
  `/funders` after success.
- Add focused action and opt-in PostgreSQL isolation/integration coverage.

## Constraints

- Do not broaden the approved Portfolio Import contract or add idempotency, staging,
  queues, background processing, generic import infrastructure, fuzzy matching, or update
  behavior for existing Grants.
- Do not change branches or Git history. Do not edit Solo-owned planning state or another
  role's evidence artifact.
- If the parser, upload, persistence, or mapping contract cannot be honored without a
  material redesign, mark BLOCKED and escalate rather than silently redesigning it.

## Relevant contract

Read `dispatch/workstreams/portfolio-import/PLAN.md` and T001's implementation before
working. The PLAN is the frozen source of truth for authorization, tenancy, transaction,
Activity, and confirmation semantics.

## Checks and receipt

Run focused action/integration tests plus applicable type/lint checks. Record exact commands,
results, files changed, and concerns in this task file. Finish with `Status: DONE` only when
implementation and task-level checks are complete.

## BUILD Receipt

- Implemented authenticated `analyzePortfolioImport` and `confirmPortfolioImport` Server Actions at the existing organization-required `/import` seam.
- Authorization is resolved before workbook parsing or Funder reads. Analysis loads only active Funders for the authorized organization; confirmation repeats that scoped lookup inside one Prisma interactive transaction.
- Confirmation ignores client preview JSON, organization/Funder identifiers, mapped values, and duplicate decisions. It reads the workbook again and re-parses, re-maps, re-validates, deduplicates, and resolves Funders server-side.
- Confirmation uses `createManyAndReturn` for newly created Funders and Grants and `createMany` for `funder_created`/`grant_created` Activity rows. Server-assigned UUIDs make the Funder-ID map independent of bulk-return order. All writes use the authorized organization and local User; transaction failures return a safe error and do not revalidate portfolio paths.
- Added import batch/worksheet/source-row metadata, completion counts for created/reused/collapsed/excluded/structural rows, and `/grants` plus `/funders` revalidation after commit.
- Added focused Server Action coverage for authorization-first lookup, tenant-owned persistence inputs, regenerated confirmation state, acknowledgement gating, invalid-row exclusion, transaction failure handling, and unauthenticated access.
- Added an opt-in disposable PostgreSQL integration test covering organization-local Funder resolution, bulk persistence, duplicate collapse, actor/owner attribution, Activity vocabulary, and cross-organization isolation.

### Checks

- `bun run test:run -- src/test/portfolio-import-actions.test.ts src/test/postgres-portfolio-import.integration.test.ts` — PASS (1 file passed, 1 skipped; 6 tests passed, 1 skipped); PostgreSQL integration suite skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is not configured.
- `bun run test:run` — PASS (29 files passed, 4 skipped; 136 tests passed, 27 skipped).
- `bunx --bun tsc --noEmit` — PASS.
- `bun run lint -- src/app/'(authenticated)'/'(org-required)'/import/actions.ts src/test/portfolio-import-actions.test.ts src/test/postgres-portfolio-import.integration.test.ts` — PASS.
- `bun run lint` — PASS.
- `bunx --bun prisma validate` — PASS.
- `git diff --check` — PASS.
- `bunx --bun next build --webpack` — PASS; emitted `Unhandled Rejection: TypeError: null is not an object (evaluating 'v.hash')` during compilation but completed TypeScript, page generation, and route output successfully.
- `bun run build` — BLOCKED by the environment's missing `node` executable when Turbopack tried to spawn a pooled Node process while processing CSS; the same limitation was recorded by T001.

### Files changed

- `src/app/(authenticated)/(org-required)/import/actions.ts`
- `src/test/portfolio-import-actions.test.ts`
- `src/test/postgres-portfolio-import.integration.test.ts`

### Concerns

- The real PostgreSQL transaction/tenant-isolation test remains opt-in and was not executable in this environment without `GRANTFLOW_TEST_DATABASE_ADMIN_URL`. Unit coverage verifies the action's transaction boundary and safe failure response; the database-backed rollback path still needs the disposable PostgreSQL environment.
- The default Turbopack build remains environment-blocked; the webpack build completed successfully with the warning noted above.

Status: DONE_WITH_CONCERNS
