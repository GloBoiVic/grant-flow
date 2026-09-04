# R002 Review

Status: PASS
Role: REVIEW
Workstream: replace-clerk-organization-tenancy
Remediation: R002
Branch: `solo/replace-clerk-organization-tenancy`

## Decision

PASS. The originating Important onboarding runtime defect is closed. No unresolved Critical or
Important finding remains, and the remediation stays within the approved R002 scope.

## Finding disposition

| Severity | Class | Type | Finding | Disposition |
| --- | --- | --- | --- | --- |
| Important | PRODUCT | approved-scope DEFECT | The onboarding module's non-function export caused Next.js to fail `POST /organization` with the `"use server"` export-contract error. | Closed: the action module now has only the async runtime export `createFirstOrganization`; the result type is erased and the schema is imported from a separate non-action module. |
| Informational | TOOLING | not a DEFECT / not NEW SCOPE | Independent `next build --webpack` reruns failed with compiled-webpack `null.hash` under Node 20 and Node 24. | Validation limitation. The R002 BUILD packet records a successful webpack build after the fix, and focused static, unit, PostgreSQL, and route checks passed. |
| Informational | TOOLING | not a DEFECT / not NEW SCOPE | Authenticated browser submission could not be repeated because the available Clerk browser session was signed out; only unauthenticated redirects were exercised. | Coverage limitation, separately reported; no authentication or product scope change is proposed. |

No new PRODUCT or REGRESSION finding was identified. No NEW SCOPE is proposed.

## Independent review

- **Server Action contract:** `actions.ts` retains the module-level `"use server"` directive and
  exports only the async `createFirstOrganization` function at runtime. `CreateOrganizationResult`
  is type-only, and `createOrganizationSchema` is not exported from the action module. The
  reusable schema module has no Server Action directive or action export.
- **Onboarding semantics:** The strict schema trims the name, enforces 2–120 characters, and
  rejects extra keys. The action validates before Clerk identity or persistence access, uses only
  the authenticated Clerk `userId`, performs the atomic nested local User + Organization create,
  preserves existing-tenant/no-rename behavior, and limits race convergence to the expected
  Clerk-user unique conflict followed by a local winner lookup. Unexpected persistence failures
  still throw.
- **Coverage:** Focused tests cover validation ordering and spoofed keys, unauthenticated failure,
  existing-tenant behavior, nested-write shape, unique-race convergence/fallback, and unexpected
  error propagation. The enabled PostgreSQL onboarding, domain-isolation, and tag suites passed
  with 26 tests and cleaned up their disposable databases.
- **Scope:** The R002 implementation delta is limited to
  `src/app/(authenticated)/organization/actions.ts`,
  `src/lib/validation/organization.ts`, and `src/test/smoke.test.ts`, plus this owned receipt.
  No schema, migration, auth infrastructure, configuration, or unrelated implementation was
  changed; pre-existing T001/R001 and dirty paths were preserved.

## Checks / evidence

- Reviewed the frozen `PLAN.md` and `ARCHITECTURE.md`, T001 task and review evidence, R001
  BUILD/VALIDATION/REVIEW evidence, R002 BUILD/VALIDATION packets, and the originating server
  error evidence.
- Review-side focused Vitest command: PASS, 2 files / 9 tests.
- Review-side TypeScript `tsc --noEmit`: PASS.
- Review-side ESLint on the R002 action, validation module, and affected tests: PASS.
- `git diff --check`: PASS.
- Accepted R002 evidence: disposable PostgreSQL suites PASS (3 files / 26 tests), no leftover
  disposable databases, and a prior post-fix webpack build PASS. The independent webpack failure
  and unavailable authenticated browser flow remain the limitations above.

## Concerns

None blocking. Vitest emitted the existing Vite CommonJS/ESM configuration warning; tests still
passed. Real Clerk-authenticated browser acceptance remains unverified.
