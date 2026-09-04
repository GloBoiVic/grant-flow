# T001 Validation

Status: PASS WITH LIMITATIONS
Role: VALIDATE
Workstream: replace-clerk-organization-tenancy
Task: T001
Branch: `solo/replace-clerk-organization-tenancy`

## Result

No blocking local-tenancy, authorization, schema, migration-shape, or route-build defect
found. The implementation matches the frozen PLAN/ARCHITECTURE contract: Clerk `userId`
resolves to one local User and required Organization, onboarding uses an atomic nested
write, domain seams use resolved local scope, and obsolete Clerk Organization/projection/
role/claim/lease/webhook artifacts are absent from runtime source and migrations.

## Checks and evidence

- `npx prisma validate` — PASS.
- `npx prisma generate` — PASS.
- `npx tsc --noEmit` — PASS on a sequential rerun after generation.
- `npx eslint` — PASS.
- `npm test -- --run` — PASS: 122 passed, 26 skipped; 26 files passed and 3 PostgreSQL
  integration files skipped.
- `npm run build` — PASS; route output contains `/`, `/dashboard`, `/deadlines`,
  `/funders`, `/grants`, `/import`, `/login`, `/organization`, and `/sign-up`, with no
  `/access` or Clerk webhook route.
- `npm run verify:prisma` — PASS (`✅ Connected`).
- `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` —
  PASS; generated SQL matches the checked-in baseline apart from a trailing newline.
- `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma
  --exit-code` — BLOCKED by Prisma requiring `datasource.shadowDatabaseUrl`; no migration
  was applied.
- `npx prisma migrate status` — confirms the connected development database still has
  the deleted historical migration chain and has not applied the new clean baseline.
- `git diff --check` — PASS. Final status showed only the task implementation, canonical
  workstream artifacts, and documented pre-existing dirty paths (`next.config.ts`,
  `dispatch/ACTIVE.md`, `.codegraph/`).
- Local-browser discovery and active-tab discovery — BLOCKED: “Local Host is not running.”
  No real Clerk browser acceptance was possible.

## Findings

- **P2 | PRODUCT | DEFECT** — `src/components/auth/organization-onboarding-form.tsx:28-29`:
  the asynchronous success state is a plain paragraph without `role="status"` or an
  `aria-live` region, so assistive technology is not guaranteed to hear the transition.
- **P3 | PRODUCT | DEFECT** — `src/components/auth/organization-onboarding-form.tsx:35`:
  the organization-name input has a label and name but no `autoComplete="organization"`,
  contrary to the applicable form guidance.
- **P3 | PRODUCT | DEFECT** — `src/components/auth/organization-onboarding-form.tsx:37`:
  the raw primary submit button has no hover state class, unlike the shared Button
  component, reducing pointer feedback on onboarding.
- **P3 | TOOLING | DEFECT** — `src/test/app-shell.test.tsx:72` retains an unused
  `openOrganizationProfile` Clerk mock property. It has no runtime impact but is dormant
  Clerk Organization test residue contrary to the deletion inventory.
- **P2 | TOOLING | NEW SCOPE** — The required PostgreSQL integration suites were skipped
  because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset. The connected database is an old
  development database, so fresh baseline deployment and real cross-tenant/race behavior
  remain unverified here.
- **P2 | TOOLING | NEW SCOPE** — No local browser host was available, and no dedicated
  automated test covers the onboarding form submit/redirect or root/organization route
  branches end-to-end. Static compilation and focused authorization/routing tests pass.

The findings are non-blocking for the requested tenancy reset; the last two are validation
environment/coverage limitations rather than evidence of a runtime authorization defect.
