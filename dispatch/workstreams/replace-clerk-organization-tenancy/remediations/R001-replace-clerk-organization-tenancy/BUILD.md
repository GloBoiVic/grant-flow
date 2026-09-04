# R001 — Isolate PostgreSQL onboarding integration tests

Remediation ID: R001
Status: DONE
Role: BUILD
Workstream: replace-clerk-organization-tenancy
Branch: `solo/replace-clerk-organization-tenancy`

## Origin finding and source artifact

- Origin: local PostgreSQL acceptance rerun after the user supplied a local Postgres
  instance on 2026-09-04.
- Source evidence: `GRANTFLOW_TEST_DATABASE_ADMIN_URL=postgresql://vike@127.0.0.1:5432/postgres`
  rerun of the three PostgreSQL integration files.
- Failing test: `src/test/postgres-onboarding.integration.test.ts` — “returns the existing
  tenant on a later request without renaming it”. The suite's first test leaves one
  organization in the shared temporary database; the later test queries that prior row and
  receives `First submitted name` instead of `Original name`.

## Finding classification

- Severity: Important regression/test-integrity finding (the newly enabled PostgreSQL suite
  fails; no product authorization defect has been demonstrated).
- Class: REGRESSION / TOOLING
- Type: approved-scope DEFECT
- Related original task: T001

## Approved requirement or invariant violated

T001 and the frozen ARCHITECTURE.md required real PostgreSQL onboarding coverage for
duplicate/idempotent behavior, concurrent same-user convergence, and clean isolated test
databases. The onboarding integration suite must be deterministic and pass against the clean
baseline.

## Exact remediation outcome

Make each onboarding integration test independent and deterministic while preserving the
production onboarding implementation and frozen local-tenancy contract. Ensure the later
duplicate/idempotence test observes the organization it creates, not data left by another
test, and retain coverage for concurrent convergence and no-rename behavior.

## Affected implementation seams

- `src/test/postgres-onboarding.integration.test.ts` test lifecycle/fixtures only.

## Explicit out-of-scope items

- Do not alter application authorization or onboarding code.
- Do not alter Prisma schema or migrations.
- Do not add retries, locks, compatibility layers, or new auth infrastructure.
- Do not change the approved product contract or unrelated tests.
- Preserve unrelated dirty state in `next.config.ts`, `dispatch/ACTIVE.md`, and `.codegraph/`.

## Regression evidence required

- Run the onboarding PostgreSQL integration file with the local disposable admin URL and
  confirm all tests pass and cleanup succeeds.
- Run the other PostgreSQL tenant/tag integration files to confirm no regression.
- Run focused static/test checks appropriate to the test-only change and `git diff --check`.
- Record exact results and limitations in this BUILD receipt.

## Worker Evidence

- Updated only `src/test/postgres-onboarding.integration.test.ts` for the approved
  test-lifecycle remediation. The async `beforeEach` now deletes Users before Organizations
  from the suite-owned temporary database, then assigns a fresh mocked Clerk user. This keeps
  the concurrent-write and duplicate/no-rename cases independent without changing production
  onboarding, authorization, schema, migrations, or unrelated tests.
- `GRANTFLOW_TEST_DATABASE_ADMIN_URL=postgresql://vike@127.0.0.1:5432/postgres
  PATH=/var/folders/d7/dvwxymhj0j74_dy2ctp09k_c0000gn/T/opencode:$PATH
  /Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/vitest/vitest.mjs run
  src/test/postgres-onboarding.integration.test.ts` — PASS: 1 file, 2 tests passed. The
  suite created a temporary database, deployed the checked-in baseline, and completed teardown
  successfully.
- The same command with
  `src/test/postgres-onboarding.integration.test.ts`,
  `src/test/postgres-domain-isolation.integration.test.ts`, and
  `src/test/postgres-tag.integration.test.ts` — PASS: 3 files, 26 tests passed. All temporary
  database setup/teardown completed successfully.
- `node node_modules/typescript/bin/tsc --noEmit` using Node `v24.18.0` — PASS.
- `node node_modules/eslint/bin/eslint.js src/test/postgres-onboarding.integration.test.ts`
  using Node `v24.18.0` — PASS.
- `git diff --check` — PASS.
- The shell had no `npm`/`npx` on `PATH`; checks used the installed Node `v24.18.0` Vitest
  entrypoint and a temporary outside-repository `npx` shim so the existing test setup could
  invoke the checked-in Prisma CLI. An initial Bun-hosted Vitest attempt failed before test
  execution on a Bun/Zod module interop error; the required checks passed under Node.
- Final scope inspection: only this R001 receipt and the directly affected onboarding
  integration test changed in this remediation; pre-existing T001 implementation changes,
  `next.config.ts`, `dispatch/ACTIVE.md`, and `.codegraph/` were preserved. No Git history or
  branch was changed.
