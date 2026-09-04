# SoloFlow Plan — Replace Clerk Organization Tenancy

Status: IN_PROGRESS
Classification: Critical
Workstream: replace-clerk-organization-tenancy
Base branch: main
Base SHA: a5e49463c6ee50597a843a6853c9a7ed050f8e05
Execution branch: solo/replace-clerk-organization-tenancy
Approval: Explicit developer implementation approval received for the reconciled PLAN and ARCHITECTURE.
Phase: GIT_END
Task state: T001 DONE; original validation/review passed; R001 and R002 BUILD, validation, and review PASS.
Architecture status: FROZEN FOR ARCHITECTURE RECONCILIATION; reconciled into this plan.
Next action: Verify final branch state, commit the approved feature branch, merge it into `main`, and complete the required GIT END cleanup.

## Outcome

Replace Clerk Organization-based tenancy with the smallest local GrantFlow tenant model:

- Clerk authenticates people and supplies the authenticated Clerk `userId`.
- GrantFlow owns Organizations and the permanent User → Organization relationship.
- Each local User belongs to exactly one local Organization.
- An Organization may contain multiple Users in the future, but a User cannot belong to or switch between multiple Organizations.
- Server-side reads and mutations derive tenant scope from authenticated Clerk `userId` → local User → local `organizationId`.
- Client-provided organization IDs are never authorization authority.
- A first-time authenticated Clerk user creates one local User and one local Organization atomically and enters the application.
- Clerk Organizations, memberships, active organizations, Clerk organization roles, organization webhooks, profile projections, claims, leases, and equivalent compatibility machinery are removed.

This workstream does not introduce application roles or teammate management. Those are future product requirements and must be added only when an approved feature needs them.

## Reconciled architecture contract

The ARCHITECTURE.md contract is frozen and reconciled into this plan:

- `Organization` keeps a locally generated UUID, name, timestamps, and current domain relations. `clerkOrgId` and `slug` are removed. Organization names are not unique.
- `User` becomes a minimal local application identity:

  - locally generated UUID;
  - unique `clerkUserId`;
  - required local `organizationId`;
  - timestamps;
  - existing Grant owner/creator, Document uploader, and Activity actor relations.

- `User.email`, `User.name`, and `User.avatarUrl` are removed. Clerk remains authoritative for current-user profile display; the existing client-side account menu obtains current-user profile data through Clerk rather than maintaining a local profile projection.
- No local role enum or role hierarchy is added in this workstream. All currently implemented GrantFlow operations have the same authorization level.
- Server authorization has only three normal resolutions:

  - `unauthenticated`;
  - `missing-local-user`;
  - `authenticated`.

- Authenticated tenant resolution queries one local User by `clerkUserId` and returns its local User id and `organizationId`. It does not read Clerk organization state, Clerk roles, memberships, slugs, metadata, or caller-provided scope.
- A required User → Organization foreign key is the persistence invariant. Unexpected database/Prisma failures are application errors and must not produce a new authorization state machine.
- `/access` and projection-pending behavior are removed because the architecture no longer has a projection or role reconciliation state.
- First-user onboarding validates strict `{ name }`, obtains authenticated Clerk `userId`, and performs one atomic Prisma nested write that creates the local User and its Organization together.
- Concurrent onboarding for the same Clerk user converges through the unique `User.clerkUserId` constraint. A losing request may resolve the already-created local User after a `P2002`; no lease, claim, lock service, webhook, metadata handshake, or Clerk Organization recovery mechanism is introduced.
- Existing grant, funder, tag, activity, shell, and related organization-owned seams continue to use only the locally resolved `organizationId`.
- The current three Prisma migrations are replaced with one clean baseline because there is no production data. The baseline directly represents the final schema and final normalized Tag uniqueness.

## Current implementation findings

- `src/lib/clerk/session.ts` currently exposes Clerk `orgId` and `orgRole` alongside `userId`.
- `src/lib/clerk/authorization.ts` currently requires an active Clerk Organization and recognized Clerk Organization role before resolving local projection rows.
- `src/lib/clerk/projections.ts` independently resolves a global local User and an Organization by `Organization.clerkOrgId`; the User is not currently related to an Organization.
- `prisma/schema.prisma` currently contains:

  - `Organization.clerkOrgId`;
  - `Organization.slug`;
  - a User without `organizationId`;
  - local User profile snapshot fields;
  - `OnboardingClaim` and lease state.

- `src/lib/clerk/roles.ts` exists solely to map Clerk Organization roles and is not needed by current domain behavior.
- `src/app/(authenticated)/organization/actions.ts`, `src/lib/clerk/onboarding.ts`, and `src/lib/clerk/onboarding-clerk.ts` currently coordinate Clerk memberships, Clerk Organization creation/recovery, private metadata, deterministic slugs, and database leases.
- `src/components/auth/organization-onboarding-form.tsx` currently calls Clerk `setActive` after organization creation.
- `src/lib/clerk/webhook.ts` and `/api/webhooks/clerk` currently project Clerk User and Organization lifecycle events into local persistence.
- `.env.example` still includes the Clerk webhook signing secret required by that obsolete projection route.
- `/access` and `projection-pending-retry.tsx` exist to handle Clerk projection/role states that disappear under local tenancy.
- The current account menu is already a Clerk-backed Client Component and can use Clerk's current-user data directly instead of receiving local profile snapshots.
- Domain queries and Server Actions already obtain organization scope from the central authorization seam. Existing organization predicates, cross-entity checks, Activity atomicity, tag idempotency, and portfolio behavior should remain unchanged while the authorization source becomes local User tenancy.
- Existing tests encode both valuable tenant isolation and obsolete Clerk Organization/projection/onboarding behavior. Valuable domain isolation tests must be retained; tests whose only purpose is the removed architecture should be deleted or replaced.

## Scope

### In scope

- Replace the current User/Organization tenancy schema with a direct required User → Organization relation.
- Replace the current migration history with one clean baseline that represents the final schema.
- Remove `Organization.clerkOrgId`, Organization `slug`, `OnboardingClaim`, lease fields, and equivalent obsolete persistence.
- Remove local User profile projection fields that are not GrantFlow domain data.
- Resolve authenticated tenant scope from Clerk `userId` → local User → local `organizationId`.
- Remove Clerk organization and role inputs from all server authorization contracts.
- Remove the unused generalized role hierarchy rather than replacing Clerk roles with local roles.
- Route authenticated Clerk users without a local User to local organization onboarding.
- Implement first-user onboarding as one atomic local nested write.
- Preserve organization scoping for all currently implemented grant, funder, tag, activity, shell, and related domain reads/mutations.
- Update the account-menu/profile display to read the current Clerk User client-side rather than from local profile snapshots.
- Delete Clerk Organization creation/recovery, membership inspection, private metadata, projection/webhook, activation, claim, lease, and retry machinery.
- Delete `/api/webhooks/clerk` and remove its public proxy exception and webhook environment variable.
- Delete `/access` and projection-pending UI if no remaining code path requires them after the simplified authorization flow.
- Replace obsolete tests with focused local-auth, onboarding, migration, tenant-isolation, and shell/profile coverage.
- Exercise the real browser flow when environment and local browser tooling permit.

### Explicitly out of scope

- Clerk Organizations.
- Active Clerk organization state.
- Organization switching.
- Multi-organization membership.
- Teammate invitations or member-management UX.
- Local ADMIN/MEMBER roles or generalized RBAC.
- Fine-grained permissions.
- Clerk profile synchronization or local profile snapshots.
- Email workflows.
- SSO.
- Billing.
- Organization ownership transfer.
- Account transfer.
- Background jobs.
- Queues.
- Event buses.
- Audit infrastructure beyond current Activity behavior.
- New domain features.
- Backward-compatible production migration.

If future teammate management requires roles, invitations, or administrative permissions, those belong to that future feature's requirements rather than this tenancy reset.

## Acceptance

1. The final schema has:

   - local `Organization`;
   - local `User`;
   - unique `User.clerkUserId`;
   - non-null `User.organizationId`;
   - required User → Organization relation;
   - no `clerkOrgId`;
   - no Organization `slug`;
   - no `OnboardingClaim`;
   - no lease state;
   - no local auth role machinery;
   - no Clerk profile snapshot fields unless BUILD demonstrates a current product requirement that cannot be satisfied through Clerk's existing client identity APIs and escalates before adding them.

2. Normal authenticated server behavior is:

   - read Clerk `userId`;
   - resolve one local User;
   - obtain `user.id` and `user.organizationId`;
   - use only that local organization ID for tenant-scoped work.

3. Authorization has no active-organization, membership, projection-pending, role-mismatch, or organization-switching state.

4. Authenticated Clerk users without a local User are routed to `/organization`. Unauthenticated users cannot access authenticated application routes.

5. First-user onboarding:

   - accepts only strict `{ name }`;
   - creates exactly one local User and one local Organization atomically;
   - binds the authenticated Clerk `userId`;
   - requires no Clerk profile read;
   - requires no Clerk Organization call;
   - requires no webhook;
   - enters `/dashboard` when successful.

6. Duplicate/concurrent onboarding for one Clerk user leaves exactly one local User and one committed Organization. A losing unique-write race resolves the existing local User or returns a normal retryable failure; it does not introduce coordination infrastructure.

7. A returning Clerk account resolves the same local User and Organization after sign-out/sign-in without an organization choice.

8. Grant, funder, tag, activity, and all current organization-owned operations remain scoped to the locally resolved Organization for reads, writes, relations, and Activity rows.

9. Existing domain tenant-isolation protection is preserved or strengthened. Caller-supplied organization IDs cannot select or override tenant scope.

10. Current-user profile display remains available through Clerk's client identity APIs without a local Clerk profile synchronization system.

11. The clean Prisma baseline contains the current domain model and final Tag normalized-name constraint and contains no obsolete Clerk Organization/onboarding persistence.

12. `.env.example`, proxy/public route configuration, source code, and tests contain no requirement for the deleted Clerk webhook endpoint or signing secret.

13. Static checks, tests, Prisma validation/migration verification, disposable PostgreSQL coverage where available, and browser acceptance are reported with exact results and limitations.

## Reconciled implementation boundaries

- Delete Clerk Organization identity, role, membership, activation, recovery, metadata, webhook, claim, and lease paths rather than leaving compatibility code.
- Do not replace `src/lib/clerk/roles.ts` with a new local role framework.
- Do not preserve `src/lib/clerk/projections.ts` merely as an abstraction name. Authorization may directly resolve the local User.
- Do not preserve `getClerkSessionState` if it no longer provides useful behavior beyond reading `auth().userId`; BUILD may simplify or inline this seam.
- Keep Clerk authentication provider, sign-in/sign-up pages, middleware protection, sign-out, profile UI, and current-user client identity where they remain useful.
- Replace the shell's local user profile DTO with Clerk client profile data; retain only the local organization information the shell actually needs.
- Preserve existing organization predicates in grant/funder/tag/activity code. The source of `organizationId` changes; domain behavior does not.
- Use the simplest Prisma atomic write that creates the User and related Organization together. Do not introduce explicit transaction isolation, locks, retries, or coordination unless the demonstrated database behavior requires it.
- Catch only the expected Clerk-user unique conflict for duplicate/concurrent onboarding and resolve the existing local User. Unexpected persistence errors must remain errors.
- Remove obsolete migration-order, projection, webhook, membership, claim, lease, Clerk Organization creation, activation, and role tests rather than keeping them skipped.
- Keep valuable domain and PostgreSQL tenant-isolation tests and update only their auth/User fixtures to the local tenancy model.

## Concerns

- Pre-existing unrelated dirty state must remain untouched: modified `next.config.ts` and untracked `.codegraph/`.
- The clean schema reset changes generated Prisma types and many old test fixtures; BUILD must regenerate the client and update tests to the new model rather than preserving obsolete architecture to satisfy old fixtures.
- PostgreSQL integration coverage is opt-in and may not be available in every validation environment. Skipped integration tests are not equivalent to passing tests.
- Browser validation requires usable Clerk keys and a disposable/empty local database.
- Removing local user profile fields requires a small shell/account-menu adjustment. This is part of simplifying identity ownership, not a redesign of the shell.
- The clean baseline assumption depends on the confirmed fact that GrantFlow has no production data. If that changes before implementation, stop and obtain a separate migration-preservation decision.
