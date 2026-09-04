# R002 Validation

Status: PASS
Role: VALIDATE
Workstream: replace-clerk-organization-tenancy
Remediation: R002
Branch: `solo/replace-clerk-organization-tenancy`

## Scope

Independently validated only the approved R002 Server Action export remediation against the
BUILD packet/receipt, frozen PLAN.md and ARCHITECTURE.md, prior T001/R001 evidence, the action
module, its reusable validation seam, focused tests, and the directly affected onboarding and
tenant regression boundary. No application, test, fixture, config, or completed evidence file
was edited during validation.

## Findings

| Severity | Class | Type | Finding | Disposition |
| --- | --- | --- | --- | --- |
| Important | PRODUCT | approved-scope DEFECT | The originating Next.js `"use server"` invalid non-function export blocked first-user onboarding with `POST /organization 500`. | Closed by R002: `actions.ts` imports the strict schema from `src/lib/validation/organization.ts`; its only runtime export is the async `createFirstOrganization` function (the result type is erased). |
| Informational | TOOLING | not a DEFECT / not NEW SCOPE | An independent `next build --webpack` rerun failed in Next's compiled webpack with `TypeError: Cannot read properties of null (reading 'hash')` under both Node v24.18.0 and v20.18.0. | Reported as a tooling limitation; it did not identify an action-export error. The BUILD packet records an earlier successful webpack build, and focused static/unit, PostgreSQL, and live unauthenticated route checks passed. |

No new PRODUCT or REGRESSION finding was found in the R002 boundary. No NEW SCOPE is proposed.

## Source and seam inspection

- `src/app/(authenticated)/organization/actions.ts` has the `"use server"` directive and exports
  only the async `createFirstOrganization` function at runtime; `CreateOrganizationResult` is a
  type-only export. The schema object is no longer exported from this action module.
- `src/lib/validation/organization.ts` is the non-Server-Action seam and exports the strict
  `{ name }` schema: trim, minimum 2, maximum 120, and reject extra keys.
- The action validates before reading Clerk identity or persistence, preserves the atomic nested
  User + Organization create, returns existing local tenancy without renaming, and catches only
  the expected Clerk-user unique conflict before resolving the winner.
- The only runtime source references to `createOrganizationSchema` are the validation seam and
  its action/test consumers. No `setActive` call remains in the onboarding route/action.

## Checks and evidence

- `/Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/vitest/vitest.mjs run src/test/organization-actions.test.ts src/test/smoke.test.ts`
  — PASS: 2 files, 9 tests passed. This covers strict validation ordering, extra-key rejection,
  unauthenticated failure, existing-tenant no-rename behavior, nested create shape, expected
  unique-race convergence, retryable race fallback, and propagation of unexpected persistence
  failures.
- `PATH="/Users/vike/.nvm/versions/node/v24.18.0/bin:$PATH" /Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit`
  — PASS.
- `PATH="/Users/vike/.nvm/versions/node/v24.18.0/bin:$PATH" /Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/eslint/bin/eslint.js 'src/app/(authenticated)/organization/actions.ts' src/lib/validation/organization.ts src/test/organization-actions.test.ts src/test/smoke.test.ts`
  — PASS.
- `GRANTFLOW_TEST_DATABASE_ADMIN_URL=postgresql://vike@127.0.0.1:5432/postgres PATH="/var/folders/d7/dvwxymhj0j74_dy2ctp09k_c0000gn/T/opencode:/Users/vike/.nvm/versions/node/v24.18.0/bin:$PATH" /Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/vitest/vitest.mjs run src/test/postgres-onboarding.integration.test.ts src/test/postgres-domain-isolation.integration.test.ts src/test/postgres-tag.integration.test.ts`
  — PASS: 3 files, 26 tests passed. Each disposable PostgreSQL database setup/deployment and
  teardown completed successfully; onboarding concurrency and duplicate/no-rename behavior
  passed alongside domain and tag isolation.
- `psql "postgresql://vike@127.0.0.1:5432/postgres" -Atc "SELECT datname FROM pg_database WHERE datname LIKE 'grantflow_%_test_%' ORDER BY datname;"`
  — PASS: no leftover disposable `grantflow_*_test_*` databases were returned.
- `PATH="/Users/vike/.nvm/versions/node/v24.18.0/bin:$PATH" /Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/next/dist/bin/next build --webpack`
  — TOOLING LIMITATION: failed before route output with the compiled-webpack
  `TypeError: Cannot read properties of null (reading 'hash')`.
- The same `next build --webpack` command under Node v20.18.0 failed with the same compiled-
  webpack error. This is not attributed to the R002 source change; the R002 BUILD receipt records
  a prior successful webpack build.
- `curl` route checks against the running local server at `http://localhost:3101` — PASS for
  unauthenticated `GET /`, `GET /organization`, and `GET /dashboard`: each returned HTTP 307 to
  `/login` with Clerk signed-out headers and the expected `redirect_url`.
- Local browser tab `tab-10` — PASS for `GET /organization` and `GET /`: both showed the GrantFlow
  sign-in page after redirect, and the browser console reported no errors. The tab was not
  authenticated, so it could not submit the onboarding Server Action or prove the authenticated
  `/organization` → `/dashboard` transition.
- `git diff --check` — PASS.

## Limitations and concerns

- Real authenticated browser acceptance remains unavailable. The available Clerk development
  browser session was signed out; Cloudflare/Clerk authentication could not be completed. This
  is reported separately and does not justify changing authentication infrastructure.
- The independent production webpack build is blocked by the compiled-webpack `null.hash` tooling
  failure under Node 20 and Node 24. Focused TypeScript, ESLint, unit, disposable PostgreSQL, and
  live route checks provide the available regression evidence; no new source defect was exposed.
- Vitest emitted its existing Vite CommonJS/ESM config warning, but all requested tests passed.

## Scope inspection

Final working-tree inspection showed the expected pre-existing T001/R001 changes and dirty paths,
including `next.config.ts`, `dispatch/ACTIVE.md`, and `.codegraph/`. Validation added no paths
beyond this owned `VALIDATION.md`; no branch or Git history was changed.
