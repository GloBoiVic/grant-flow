# T001 — Replace Clerk Organization Tenancy

Status: DONE
Role: BUILD
Workstream: replace-clerk-organization-tenancy
Branch: solo/replace-clerk-organization-tenancy

## Assignment

Implement the frozen and reconciled `PLAN.md` and `ARCHITECTURE.md` contract for the
Critical local-tenancy reset. Replace Clerk Organization-based tenancy with the required
local `User.clerkUserId` → `User.organizationId` authority path, preserve current
organization-scoped domain behavior, and remove the obsolete Clerk Organization,
projection, role, claim, lease, activation, and webhook machinery.

## Required outcomes

- Final Prisma schema and one clean baseline migration contain the local Organization/User
  tenancy model, required User → Organization FK, unique Clerk user id, current domain
  models, and normalized per-organization Tag uniqueness; no obsolete auth persistence.
- Server authorization reads only authenticated Clerk `userId`, resolves one local User, and
  returns `unauthenticated`, `missing-local-user`, or `authenticated` with local ids.
- Root, organization onboarding, and organization-required routes/actions follow the frozen
  routing and failure contract; `/access` and projection retry behavior are removed.
- First-user onboarding strictly accepts `{ name }`, atomically creates User + Organization,
  converges duplicate/expected unique Clerk-user races, and never calls Clerk Organization,
  membership, profile, activation, metadata, webhook, claim, or lease machinery.
- Current funder, grant, tag, activity, shell, and related domain seams remain scoped by the
  server-resolved local organization, preserving tenant isolation and existing behavior.
- Current-user account/profile display uses Clerk client identity APIs without local profile
  synchronization or snapshot fields.
- Obsolete source/configuration/tests are deleted or replaced rather than left dormant.
- Regenerate Prisma Client and update focused tests/fixtures to the final tenancy model.

## Boundaries

Do not introduce local RBAC, Clerk Organizations, profile synchronization, compatibility
layers, organization switching, teammate management, new auth infrastructure, generalized
tenant repositories/policy engines/RLS, or unrelated domain behavior. Preserve unrelated
dirty state in `next.config.ts` and `.codegraph/`. The clean-baseline assumption is valid
because this repository has no production data; stop and escalate before changing migration
direction if that premise is disproven.

## Verification required

Run the relevant static checks, tests, Prisma validation/migration checks, and browser flow
when usable Clerk keys and local browser tooling permit. Report exact commands/results and
limitations. Run `git diff --check`, inspect final status/diff, and include changed paths in
the completion receipt.

## BUILD Receipt

- Replaced Clerk Organization tenancy with the local `User.clerkUserId` → `User.organizationId` authority path. Authorization now has only `unauthenticated`, `missing-local-user`, and `authenticated` resolutions, and all domain actions continue to use the server-resolved local organization.
- Replaced the Prisma migration history with the `20260904000000_local_tenancy_baseline` clean baseline. The final schema has the required User → Organization foreign key, unique Clerk user id, organization lookup index, current domain tables, and normalized per-organization Tag uniqueness without Clerk Organization/profile/claim/lease persistence.
- Implemented strict `{ name }` onboarding with one atomic nested User + Organization create, existing-user convergence, and expected Clerk-user `P2002` race resolution. Removed Clerk Organization recovery, membership, activation, metadata, projection, role, claim, lease, webhook, `/access`, and projection-retry paths.
- Updated the shell to pass only local organization identity from the server; the account menu reads current-user name/email/avatar from Clerk `useUser()` and preserves profile/sign-out controls.
- Updated focused auth, onboarding, shell/profile, migration, and tenant isolation fixtures/tests. Obsolete Clerk Organization/projection/claim/lease/webhook tests and the old tag-migration suite were removed; a new local-tenancy PostgreSQL onboarding race suite is present and skip-gated when no disposable database is configured.
- Checks passed: `npx prisma validate`; `npx prisma generate`; `npx tsc --noEmit`; `npx eslint`; `npm test -- --run` (122 passed, 26 skipped; 26 files passed, 3 integration files skipped); `npm run build` (routes contain no `/access` or Clerk webhook route); `npm run verify:prisma` (`✅ Connected`); and `git diff --check`.
- Migration evidence: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` generated the final baseline shape; the focused migration test passed. `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code` was attempted and stopped with Prisma’s “must set datasource.shadowDatabaseUrl” requirement; no migration was applied to the existing local database.
- Browser limitation: local-browser discovery reported “Local Host is not running”; real Clerk browser acceptance was not available. PostgreSQL integration coverage remained skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` was unset.
- Preservation evidence: pre-existing `next.config.ts` and `dispatch/ACTIVE.md` changes, untracked `.codegraph/`, and the local ignored environment were left untouched; no Git history or branches were changed. Final status/diff inspection confirmed the implementation paths above plus this owned receipt, with no `VALIDATION.md` or `REVIEW.md` created.
