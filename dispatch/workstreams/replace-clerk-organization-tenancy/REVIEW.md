# T001 Review

Status: PASS
Role: REVIEW
Workstream: replace-clerk-organization-tenancy
Task: T001
Branch: `solo/replace-clerk-organization-tenancy`

## Decision

PASS. No unresolved Critical or Important findings. The implementation is within the
approved scope and follows the frozen local-tenancy contract. The remaining findings are
Minor and do not block closure; validation limitations are recorded rather than treated as
runtime evidence.

## Independent judgment

- **Scope:** The clean baseline, direct local User → Organization relation, removal of Clerk
  Organization/projection/role/claim/lease/webhook machinery, local profile removal, and
  focused fixture/test updates match PLAN.md and ARCHITECTURE.md. No new RBAC, switching,
  synchronization, repository abstraction, RLS, or domain feature was introduced.
- **Tenant authority:** `auth().userId` is the only Clerk authorization input. Server
  resolution queries `User` by unique `clerkUserId` and returns only local User and
  `organizationId`; domain reads and mutations use that returned organization scope. Strict
  action schemas reject caller-owned organization/scope fields, and onboarding binds the
  authenticated Clerk user rather than client input.
- **Persistence/onboarding:** The schema and checked-in baseline have the required UUID
  local Organization/User model, non-null User foreign key, unique Clerk user key, retained
  domain tables, and normalized per-organization Tag uniqueness. The nested User create is
  atomic; duplicate/concurrent Clerk-user conflicts are the only expected convergence path
  and do not rename the winner's organization.
- **Deletion inventory:** Runtime source and migrations contain no obsolete Clerk org/role,
  projection, claim, lease, webhook route, webhook secret example, activation, or `/access`
  path. The remaining `openOrganizationProfile` mock in `src/test/app-shell.test.tsx:72` is
  dormant test residue only. The pre-existing `next.config.ts`, `dispatch/ACTIVE.md`, and
  `.codegraph/` state were preserved as required.
- **Regression posture:** Existing funder, grant, tag, activity, shell, profile, strict
  input, idempotency, soft-delete, and cross-tenant assertions were retained or updated to
  local tenancy. The build receipt and validation evidence show no static, type, lint, build,
  or unit-test failure.

## Findings

| Severity | Class | Type | Finding | Disposition |
| --- | --- | --- | --- | --- |
| Minor (P2) | PRODUCT | DEFECT | `src/components/auth/organization-onboarding-form.tsx:29` renders the async success transition as a plain paragraph without an explicit live/status announcement. | Non-blocking accessibility follow-up. |
| Minor (P3) | PRODUCT | DEFECT | `src/components/auth/organization-onboarding-form.tsx:35` omits `autoComplete="organization"`. | Non-blocking form-guidance follow-up. |
| Minor (P3) | PRODUCT | DEFECT | `src/components/auth/organization-onboarding-form.tsx:37` has no hover-state class on its raw submit button. | Non-blocking interaction-feedback follow-up. |
| Minor (P3) | TOOLING | DEFECT | `src/test/app-shell.test.tsx:72` retains an unused `openOrganizationProfile` mock property from the removed Clerk Organization surface. | Non-blocking deletion-inventory cleanup. |
| Minor (P2) | TOOLING | NEW SCOPE | PostgreSQL integration suites were skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset; the connected development database still has the deleted migration chain. Fresh baseline deployment, real tenant isolation, and database race behavior were not independently exercised here. | Environment limitation; not evidence of a product defect. |
| Minor (P2) | TOOLING | NEW SCOPE | Local Host was unavailable, so browser acceptance and an end-to-end onboarding submit/redirect check were not run. | Environment/coverage limitation; not evidence of a product defect. |

No finding affects the authority path, schema contract, migration shape, deletion boundary,
or currently implemented domain behavior. No remediation packet is required from this review.

## Checks / evidence

- Inspected the approved `PLAN.md`, frozen `ARCHITECTURE.md`, completed T001 BUILD receipt,
  and `VALIDATION.md`.
- Inspected the implementation diff, final schema, clean baseline SQL, authorization and
  onboarding paths, route redirects, shell/profile seams, domain query/action predicates,
  focused tests, and deletion inventory.
- Current-source static inspection found no obsolete tenancy identifiers in runtime source or
  Prisma schema/migrations; the only identified residue is the dormant test mock listed above.
- `git diff --check` — PASS (review-side rerun).
- Accepted validation evidence: Prisma validate/generate, TypeScript, ESLint, 122 passing
  tests with 26 skipped, production build, Prisma connectivity, baseline diff, and focused
  migration test all passed. Migration diff from existing migrations was blocked by the
  missing `datasource.shadowDatabaseUrl`, with no migration applied.
- Review-side `npm`/`npx` reruns were unavailable in this shell (`command not found`; only
  Bun was present), so the recorded VALIDATION results are the executable-check evidence.
