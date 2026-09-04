# R002 — Fix onboarding Server Action export

Remediation ID: R002
Status: DONE
Role: BUILD
Workstream: replace-clerk-organization-tenancy
Branch: `solo/replace-clerk-organization-tenancy`

## Origin finding and source artifact

- Origin: manual browser acceptance on the local GrantFlow server after the user created a
  Clerk account and submitted the organization form on 2026-09-04.
- Source evidence: local dev server log recorded a `POST /organization 500` with:
  `Error: A "use server" file can only export async functions, found object.`
- Affected route: `/organization`; the page remains at `/organization` and displays the
  authenticated error boundary instead of completing onboarding.

## Finding classification

- Severity: Important product/runtime finding (first-user onboarding is blocked).
- Class: PRODUCT
- Type: approved-scope DEFECT
- Related original task: T001

## Approved requirement or invariant violated

The frozen PLAN.md and ARCHITECTURE.md require first-user onboarding to accept strict `{ name }`,
atomically create the local User and Organization, and navigate successfully to `/dashboard`.
The submitted server action currently fails at Next.js Server Action module evaluation before
the approved onboarding behavior can execute.

## Exact remediation outcome

Make the onboarding Server Action module valid under Next.js's `"use server"` export contract
while preserving strict validation, atomic local nested write, duplicate/race convergence,
and all existing behavior. Keep validation reusable only through an approved non-action seam if
needed; do not expose server-owned schema objects as Server Action exports.

## Affected implementation seams

- `src/app/(authenticated)/organization/actions.ts`
- Directly affected onboarding action tests and any focused static/browser verification.

## Explicit out-of-scope items

- Do not introduce Clerk Organizations, local RBAC, profile synchronization, compatibility
  layers, new auth infrastructure, or changes to the frozen tenancy architecture.
- Do not alter Prisma schema or migrations.
- Do not weaken strict `{ name }` validation or change onboarding semantics.
- Do not modify unrelated tests or configuration.
- Preserve unrelated dirty state in `next.config.ts`, `dispatch/ACTIVE.md`, and `.codegraph/`.

## Regression evidence required

- Reproduce and clear the `/organization` Server Action 500 under the local dev server.
- Run focused organization-action tests plus TypeScript and ESLint.
- Run the local PostgreSQL onboarding integration and directly affected tenant suites where
  the disposable local database is available.
- Exercise the browser onboarding transition through `/organization` to `/dashboard` when the
  user can complete Clerk authentication; report Cloudflare/Clerk limitations separately.
- Run `git diff --check` and record exact results.

## Worker Evidence

- Moved the strict `createOrganizationSchema` export to the non-Server-Action module
  `src/lib/validation/organization.ts`. The `"use server"` action module now exposes only
  the async `createFirstOrganization` function at runtime (plus its erased result type),
  removing the Next.js invalid non-function export while preserving the strict `{ name }`
  validation and all local-tenancy onboarding behavior.
- Updated the directly affected smoke test to import the reusable schema from its non-action
  validation seam. No schema, migration, auth infrastructure, or production onboarding
  semantics changed.
- `/Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/vitest/vitest.mjs run
  src/test/organization-actions.test.ts src/test/smoke.test.ts` — PASS: 2 files, 9 tests
  passed.
- `/Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit`
  — PASS.
- `/Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/eslint/bin/eslint.js
  'src/app/(authenticated)/organization/actions.ts' src/lib/validation/organization.ts
  src/test/organization-actions.test.ts src/test/smoke.test.ts` — PASS.
- `GRANTFLOW_TEST_DATABASE_ADMIN_URL=postgresql://vike@127.0.0.1:5432/postgres PATH=/var/folders/d7/dvwxymhj0j74_dy2ctp09k_c0000gn/T/opencode:$PATH /Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/vitest/vitest.mjs run src/test/postgres-onboarding.integration.test.ts src/test/postgres-domain-isolation.integration.test.ts src/test/postgres-tag.integration.test.ts` — PASS: 3 files, 26 tests passed; each disposable PostgreSQL database completed setup and teardown.
- `PATH=/Users/vike/.nvm/versions/node/v24.18.0/bin:$PATH /Users/vike/.nvm/versions/node/v24.18.0/bin/node node_modules/next/dist/bin/next build --webpack` — PASS: optimized production compilation, TypeScript, static generation, and route output completed. The default `next build` Turbopack mode was also attempted but was blocked by the environment with `spawning node pooled process: No such file or directory`; webpack build verified the Server Action export contract successfully.
- Local dev server verification: the existing server at `http://localhost:3101` returned HTTP `307` for `GET /organization` (redirect to login) after the fix, and the browser tab showed the login route with zero console errors. The dev log retains the historical pre-fix `POST /organization 500` and `A "use server" file can only export async functions, found object` entries from the R002 source evidence; no new instance appeared after the fix.
- Authenticated browser submission through `/organization` → `/dashboard` was not repeatable because the available Clerk browser session was unauthenticated and redirected to `/login`; real Clerk/Cloudflare acceptance remains a limitation. The unauthenticated route check did not exercise the action POST.
- `git diff --check` — PASS. Final scope inspection preserved pre-existing dirty paths (`.env.example`, `dispatch/ACTIVE.md`, `next.config.ts`, T001 implementation paths, and `.codegraph/`); R002 changed only this receipt plus `src/app/(authenticated)/organization/actions.ts`, `src/lib/validation/organization.ts`, and `src/test/smoke.test.ts`. No branch or Git history was changed.
