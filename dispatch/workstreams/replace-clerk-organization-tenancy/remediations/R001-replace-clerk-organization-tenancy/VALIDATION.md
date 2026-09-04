# R001 Validation

Status: PASS
Role: VALIDATE
Workstream: replace-clerk-organization-tenancy
Remediation: R001
Branch: `solo/replace-clerk-organization-tenancy`

## Scope

Independently validated only the approved PostgreSQL onboarding test-isolation remediation
against the R001 BUILD packet/receipt and the frozen PLAN.md and ARCHITECTURE.md. The
remediation is limited to the test lifecycle and fixtures in
`src/test/postgres-onboarding.integration.test.ts`.

## Findings

| Finding | Severity | Classification | Type | Result |
| --- | --- | --- | --- | --- |
| Originating shared-database onboarding failure | Important | REGRESSION / TOOLING | approved-scope DEFECT | Remediated and closed; no product authorization defect demonstrated. |

No PRODUCT finding, regression in the affected PostgreSQL suites, or NEW SCOPE was found.

## Checks and evidence

- `GRANTFLOW_TEST_DATABASE_ADMIN_URL=postgresql://vike@127.0.0.1:5432/postgres PATH="/var/folders/d7/dvwxymhj0j74_dy2ctp09k_c0000gn/T/opencode:$PATH" /Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/vitest/vitest.mjs run src/test/postgres-onboarding.integration.test.ts`
  — PASS: 1 file, 2 tests passed. Fresh temporary database creation, checked-in baseline
  deployment, onboarding tests, and teardown completed successfully.
- The same Node/Vitest command with
  `src/test/postgres-onboarding.integration.test.ts`,
  `src/test/postgres-domain-isolation.integration.test.ts`, and
  `src/test/postgres-tag.integration.test.ts` — PASS: 3 files, 26 tests passed. All three
  disposable database lifecycles completed successfully.
- Independent admin-database inspection after the suites — PASS: no leftover databases
  matched `grantflow_onboarding_test_%`, `grantflow_domain_test_%`, or
  `grantflow_tag_test_%`.
- `/Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/eslint/bin/eslint.js src/test/postgres-onboarding.integration.test.ts`
  — PASS.
- `/Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit`
  — PASS.
- `git diff --check` — PASS.

## Scope inspection

- The R001 test change exercises per-test deletion of suite-owned Users before
  Organizations and resets the mocked Clerk user, making the concurrent and duplicate/no-
  rename cases independent without changing production onboarding or authorization.
- No implementation, Prisma schema, or migration path was changed during this validation.
  The working tree already contained the broader T001 production/schema/baseline-migration
  changes recorded in the BUILD receipt; the start and end status inspections showed no new
  paths from running R001 checks. Existing `next.config.ts`, `dispatch/ACTIVE.md`, and
  `.codegraph/` changes were preserved.

## Limitations

The admin URL was supplied by the R001 packet and was not present in the validator's inherited
environment; the explicit disposable local URL above was usable. Browser/Clerk acceptance was
not run because this validation is bounded to the PostgreSQL test-isolation remediation.
