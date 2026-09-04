# Architecture Contract — Replace Clerk Organization Tenancy

Status: FROZEN FOR ARCHITECTURE RECONCILIATION
Workstream: `replace-clerk-organization-tenancy`
Base branch: `main`
Role: `ARCHITECT`

This is the implementation contract for the clean local-tenancy reset. It is based on the reconciled PLAN, current Prisma schema and migrations, current auth/onboarding routes and actions, current shell/profile seams, current grant/funder/tag/activity query and mutation seams, and existing auth/onboarding/migration/PostgreSQL isolation tests.

## Contract vocabulary

- **Clerk identity** means the authenticated Clerk `userId`.
- **Local identity** means the one GrantFlow `User` row selected by `User.clerkUserId`.
- **Local tenant** means the required `User.organizationId`.
- **Current-user profile** means display data owned by Clerk and read through Clerk's client identity API where the current shell needs it.
- Requirements below marked **Frozen requirement** are binding.
- Text marked **Implementation note** describes the smallest expected implementation shape without authorizing new product behavior.

## 1. Final local schema and migration direction

### Frozen requirement: schema

Retain the current domain models and existing organization-owned fields and make this local tenancy model authoritative:

```text
Organization
  id          UUID primary key, generated locally
  name        required text
  createdAt   timestamptz, default now
  updatedAt   timestamptz, updated automatically
  users       User[]
  + existing Funder, FunderContact, Grant, Document, Activity, Tag,
    ImportStaging relations

User
  id             UUID primary key, generated locally
  clerkUserId    required text, unique
  organizationId required UUID, foreign key to Organization.id
  createdAt      timestamptz, default now
  updatedAt      timestamptz, updated automatically
  organization   Organization
  + existing Grant owner/creator, Document uploader, Activity actor relations
```

The `User.organization` relation uses required `organizationId` with `onDelete: Restrict` and `onUpdate: NoAction`, matching the current persistence policy.

An index on `User.organizationId` is permitted as the straightforward foreign-key lookup index. No additional User indexes are introduced.

`User.clerkUserId` is the only Clerk identifier stored locally and the only User uniqueness used by onboarding.

Do not persist Clerk profile display data in this workstream:

- no local `email`;
- no local `name`;
- no local `avatarUrl`.

The current application only requires those values for current-user shell/profile display. That display must read Clerk's current signed-in User client-side instead of introducing a synchronization or Backend API dependency.

Do not add `UserRole`, ADMIN/MEMBER authorization, a membership table, organization owner id, invitation state, organization selector state, or profile-sync state.

The current application has no approved behavior requiring distinct authorization levels between local users.

The existing organization-owned models remain organization-scoped:

- `Funder.organizationId`
- `FunderContact.organizationId`
- `Grant.organizationId`
- `Document.organizationId`
- `Activity.organizationId`
- `Tag.organizationId`
- `ImportStaging.organizationId`

`GrantTag` remains the existing composite join of `grantId` and `tagId`. It does not gain redundant `organizationId`.

### Frozen requirement: fields and models removed

Remove:

- `Organization.clerkOrgId`;
- Organization `slug`;
- User `email`;
- User `name`;
- User `avatarUrl`;
- `OnboardingClaim`;
- `createLeaseToken`;
- `createLeaseExpiresAt`;
- all claim/lease indexes;
- all Clerk Organization projection persistence;
- any local auth role introduced solely to replace Clerk Organization roles.

No equivalent compatibility fields or synchronization state may replace them.

### Frozen requirement: clean baseline migration

The repository has no production data.

Replace the three existing timestamped migrations with one fresh baseline migration:

1. Remove the current init, onboarding-lease, and tag-normalization migration directories as the active migration chain.
2. Create one baseline containing the final schema and all current domain tables/foreign keys.
3. Create `Tag.normalizedName` as non-null and create its `(organizationId, normalizedName)` unique constraint directly in the baseline.
4. Do not create `OnboardingClaim`, Clerk organization identifiers, Organization slug, local Clerk profile snapshot fields, role state, or lease indexes.
5. Regenerate Prisma Client from the final schema.
6. Migration tests verify the fresh baseline and absence of obsolete identifiers rather than old migration ordering.

**Implementation note:** This is a tenancy/auth reset, not a domain-model rewrite. Preserve current PostgreSQL UUID, timestamptz, date, Decimal, JSONB, delete behavior, and existing domain columns unless the schema cannot compile without a narrow correction.

## 2. Authorization resolution and route behavior

### Frozen requirement: one authority path

Server authorization uses Clerk only to answer:

```text
Who is signed in?
```

GrantFlow answers:

```text
Which Organization does that User belong to?
```

The authorization resolution order is exactly:

1. Read Clerk `userId`.
2. If no `userId`, return `unauthenticated`.
3. Query one local User by `User.clerkUserId = userId`, selecting:

   - local User id;
   - `organizationId`.

4. If no local User exists, return `missing-local-user`.
5. Return `authenticated` with:

   - `clerkUserId`;
   - local `userId`;
   - local `organizationId`.

No authorization query or context may contain:

- Clerk `orgId`;
- Clerk `orgRole`;
- active organization state;
- Clerk membership;
- Organization slug;
- local role;
- caller-provided organization scope.

The normal resolution union is:

```text
unauthenticated
missing-local-user
authenticated
```

No `missing-local-organization`, `projection-pending`, `role-mismatch`, or `insufficient-role` application state is introduced.

The required database foreign key is responsible for User → Organization referential integrity. Unexpected Prisma/database corruption or connectivity failures throw through the normal application error path rather than expanding the authorization protocol.

There is no `minimumRole` parameter. No current GrantFlow operation has an approved admin-only authorization requirement.

**Implementation note:** BUILD may simplify or delete `getClerkSessionState` if it becomes a wrapper around only `auth().userId`. The architecture requires one obvious userId → local User authority path, not preservation of old helper names.

### Frozen requirement: route/action behavior

| Resolution           | Server-rendered route behavior                                                                          | Server Action behavior                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `unauthenticated`    | Redirect/protect to `/login`                                                                            | `{ success: false, error: "Unauthorized", code: "UNAUTHENTICATED" }`    |
| `missing-local-user` | Redirect to `/organization` when local tenancy is required                                              | `{ success: false, error: "Unauthorized", code: "MISSING_LOCAL_USER" }` |
| `authenticated`      | Permit organization-required routes; `/` and `/organization` redirect to `/dashboard` where appropriate | Return local context and continue                                       |

Clerk middleware continues to protect non-public routes from unauthenticated requests.

The root page branches on local authorization rather than Clerk `orgId`.

The organization page:

- redirects unauthenticated users to `/login` where middleware has not already done so;
- renders onboarding only for `missing-local-user`;
- redirects an already-local user to `/dashboard`;
- does not render a chooser.

The organization-required layout:

- resolves the local User;
- redirects `missing-local-user` to `/organization`;
- renders the application shell only for `authenticated`.

The existing `/access` page and projection retry UI are deleted unless BUILD identifies an independent current product use unrelated to the removed projection/role architecture and escalates before preserving them.

## 3. First-user onboarding

### Frozen requirement: action input

The action remains conceptually `createFirstOrganization(input: unknown)` unless BUILD finds a narrower name that reduces confusion.

Its strict input is exactly:

```text
{ name: string }
```

Requirements:

- trim `name`;
- accept 2–120 characters after trimming;
- reject extra keys;
- client identity, organization ID, Clerk org ID, role, email, avatar, or other server-owned values are invalid input.

Validation occurs before persistence work.

After validation, the action reads authenticated Clerk `userId`.

No Clerk User Backend API/profile fetch is required for onboarding.

### Frozen requirement: atomic create and duplicate/race behavior

For an authenticated Clerk user without a local User:

1. Execute one Prisma nested relational create that creates the local User and its local Organization as one atomic operation.

Conceptually:

```text
User.create
  clerkUserId = authenticated Clerk userId
  organization.create
    name = validated organization name
```

2. Prisma's nested write must guarantee that both records commit or neither commits.
3. The created User's `organizationId` becomes the permanent GrantFlow tenant binding.
4. No Clerk Organization, membership, activation, metadata, webhook, profile, claim, lease, or recovery call occurs.

The action returns:

```text
success
status: created | existing
organizationId
```

### Frozen requirement: idempotence and concurrency

`User.clerkUserId` is the one concurrency key.

Behavior:

- If the local User already exists, return `existing` with its current `organizationId`.
- If two requests race to onboard the same Clerk user, one create succeeds.
- A losing request that receives the expected unique-key conflict resolves `User.clerkUserId`.
- If that local User exists, return `existing` with the same `organizationId`.
- The losing nested write must not leave an extra Organization because the related create is atomic.
- Different submitted organization names converge on the first committed Organization.
- Do not rename the existing Organization on duplicate submission.
- If an expected unique conflict occurs but the local User cannot be resolved, return a normal retryable/error result.
- Unexpected persistence failures remain errors.

Do not add:

- explicit database leases;
- advisory locks;
- transaction lease tokens;
- custom distributed locking;
- Clerk metadata;
- retry queues;
- webhook convergence;
- Clerk Organization recovery.

**Implementation note:** An explicit interactive `$transaction` is not required when a single Prisma nested relational create provides the needed atomicity. BUILD should prefer the smaller nested-write implementation unless a demonstrated Prisma/PostgreSQL behavior requires otherwise.

### Frozen requirement: client success

The onboarding form:

- calls the local server action;
- shows normal pending/error UI;
- on success navigates to `/dashboard`;
- refreshes if required by the existing App Router seam.

It does not call:

- `setActive`;
- Clerk Organization APIs;
- membership APIs;
- activation polling;
- projection retry.

A returning user signs in through Clerk and resolves the existing local User automatically.

## 4. Tenant-scoped seams and join invariants

All current domain read and mutation seams resolve authorization server-side and use only the returned local `organizationId`.

No seam accepts a client organization ID as an authorization alternative.

### Frozen requirement: current reads

| Seam                        | Required local scope and joins                                                                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listFunders`               | Active Funder with `Funder.organizationId = auth.organizationId`.                                                                                                                                    |
| `listTags`                  | Active Tag with `Tag.organizationId = auth.organizationId`; preserve current DTO.                                                                                                                    |
| `listActivities`            | `Activity.organizationId = auth.organizationId`; optional Grant/Funder relations remain constrained to the same organization and active rows as current behavior requires.                           |
| `listGrants`                | Grant organization, active Grant, active Funder, Tag filters, returned tags, search/filter/sort, and pagination preserve current tenant and active-row predicates.                                   |
| `getGrant`                  | Grant id must belong to the authorized organization and preserve current active Funder/Tag/Activity restrictions. Foreign or soft-deleted ids do not produce a detail DTO.                           |
| shell organization identity | Resolve only the local Organization information the shell needs from `auth.organizationId`. Current-user name/email/avatar display comes from Clerk client identity, not a local profile projection. |

`/dashboard`, `/deadlines`, and `/import` remain organization-gated even while their content remains placeholder-level.

### Frozen requirement: current mutations

| Action                                    | Required behavior                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createFunder`                            | Create under authorized organization; preserve atomic `funder_created` Activity with authorized local actor.                                                 |
| `createGrant`                             | Verify active same-organization Funder; create Grant with authorized organization, local owner, and local creator; preserve atomic `grant_created` Activity. |
| `editGrant`                               | Verify active same-organization Grant and Funder/replacement Funder; reject foreign/soft-deleted relations; preserve `grant_updated` Activity.               |
| `changeGrantStatus`                       | Verify active same-organization Grant/Funder; preserve same-value no-op; otherwise preserve atomic `status_changed` Activity.                                |
| `createTag`                               | Create under authorized organization; preserve normalized per-organization uniqueness and existing duplicate behavior.                                       |
| `assignTagToGrant` / `removeTagFromGrant` | Verify active same-organization Grant and Tag before operating on their exact GrantTag pair; preserve idempotence and no-Activity behavior.                  |

Existing action validation remains server-side and strict where server-owned fields must be rejected.

### Frozen requirement: domain relation invariants

- Every Funder, FunderContact, Grant, Document, Activity, Tag, and ImportStaging row belongs to exactly one local Organization.
- A FunderContact's Funder must be in its organization.
- A Grant's Funder must be in its organization.
- A Grant's nullable owner and required creator must be local Users in the Grant's organization.
- A Document's Grant and uploader must be in the Document's organization.
- An Activity's optional Grant, Funder, and actor must be in its organization.
- A GrantTag must join a Grant and Tag from the same organization.
- Current server seams must not expose malformed cross-tenant relations.
- Do not invent FunderContact, Document, ImportStaging, teammate, or role-management operations in this workstream.

The baseline retains the current simple FK topology. Do not add generalized row-level-security, tenant repository, policy engine, or redundant `organizationId` to GrantTag as part of this reset.

## 5. Explicit Clerk deletion inventory

| Obsolete behavior/artifact                              | Required disposition                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Clerk `orgId` / `orgRole` session contract              | Remove. Server tenancy reads only Clerk `userId`.                                                                                         |
| `src/lib/clerk/roles.ts`                                | Delete. Do not replace with local RBAC in this workstream.                                                                                |
| `Organization.clerkOrgId`                               | Remove from schema, migrations, source, fixtures, and tests.                                                                              |
| Organization `slug` used for Clerk onboarding           | Remove from schema, migrations, source, fixtures, and tests.                                                                              |
| Local User email/name/avatar projection                 | Remove from schema and projection persistence; current-user profile display moves to Clerk client identity.                               |
| `OnboardingClaim` and all claim/lease behavior          | Delete schema, migrations, modules, fixtures, and tests.                                                                                  |
| Clerk membership inventory                              | Delete.                                                                                                                                   |
| Clerk Organization creation/recovery                    | Delete.                                                                                                                                   |
| onboarding private metadata                             | Delete.                                                                                                                                   |
| `src/lib/clerk/projections.ts`                          | Delete unless BUILD can demonstrate a remaining purpose distinct from local User lookup; do not retain it as a compatibility abstraction. |
| `src/lib/clerk/webhook.ts`                              | Delete.                                                                                                                                   |
| `/api/webhooks/clerk`                                   | Delete.                                                                                                                                   |
| Clerk webhook public proxy matcher                      | Delete.                                                                                                                                   |
| `CLERK_WEBHOOK_SIGNING_SECRET` repository configuration | Remove from `.env.example` and code.                                                                                                      |
| `setActive({ organization: ... })` and activation UI    | Delete.                                                                                                                                   |
| projection-pending retry UI                             | Delete.                                                                                                                                   |
| `/access` projection/role state                         | Delete unless a separate current product requirement is demonstrated before implementation.                                               |
| old Clerk org/profile projection tests                  | Delete or replace with local tenancy tests; do not leave dormant.                                                                         |

Keep:

- `ClerkProvider`;
- sign-in/sign-up pages;
- Clerk middleware authentication;
- current-user client identity through `useUser()` where profile display is needed;
- `useClerk()` sign-out;
- `openUserProfile()`.

Clerk remains authentication and current-user profile infrastructure, not GrantFlow tenancy infrastructure.

## 6. Examples and boundary matrix

### Authentication

- **Valid:** Clerk `userId = "user_a"` and local User `{ clerkUserId: "user_a", organizationId: "org_a" }` resolve to local User A and `org_a`.
- **Valid:** Clerk may internally have Organization state; GrantFlow does not read it.
- **Invalid:** no Clerk `userId` is unauthenticated and cannot produce tenant context.
- **Invalid:** signed-in `user_a` with no local User is routed to `/organization`.
- **Boundary:** unexpected database errors do not become a new authorization status; they fail through the normal application error path.

### Onboarding

- **Valid:** trimmed `"Acme Grants"` creates one local User and one local Organization atomically.
- **Boundary valid:** exactly 2 and exactly 120 trimmed characters are accepted.
- **Invalid:** blank, one-character, over-120-character, or non-string names fail validation.
- **Invalid:** extra keys such as `clerkUserId`, `organizationId`, `orgId`, `role`, `email`, or `avatarUrl` are rejected.
- **Duplicate:** an already-local Clerk user returns `existing` for the same organization.
- **Race:** two simultaneous valid requests for the same Clerk user leave one local User and one committed Organization. One result is `created`; the other converges to `existing` or a normal retryable error if the winner cannot yet be observed.
- **Different-name race:** the first committed Organization name wins; the second request does not rename it.

### Tenancy

- **Valid:** user A sees and mutates only Organization A's current domain rows.
- **Invalid:** user A supplies Organization B's Grant/Funder/Tag ids; reads return missing/empty as current contracts require and mutations perform no foreign write or Activity.
- **Invalid:** client input contains `organizationId = "org_b"`; strict validation rejects the server-owned field where such input is not part of the action contract.
- **Invalid:** malformed cross-tenant Grant/Funder/Tag/GrantTag relations cannot leak through list/detail/action seams.
- **Boundary:** arbitrary URL/search parameters never replace authorization-derived tenant scope.

### Current-user profile

- **Valid:** the account menu displays current Clerk User name/email/avatar through Clerk's client User object.
- **Boundary:** Clerk profile loading may temporarily render a fallback/skeleton/initial state but cannot affect GrantFlow authorization.
- **Invalid:** client Clerk profile values never determine local User id, organization id, grant ownership, Activity actor id, or tenant scope.

## 7. Required automated coverage

The minimum acceptance matrix is intentionally focused on current behavior rather than hypothetical authorization states.

### Authorization and routing

- unauthenticated resolution;
- missing-local-user resolution;
- authenticated local User resolution;
- exact local `organizationId` returned from `User.clerkUserId`;
- no Clerk organization fields in the server auth contract;
- root routing;
- organization onboarding routing;
- organization-required layout routing;
- action failures for unauthenticated and missing-local-user states;
- no write after failed authorization.

### Onboarding and schema

- strict input validation and 2/120 boundaries;
- rejection of client identity/scope/profile keys;
- successful atomic User + Organization create;
- resulting local User has authenticated `clerkUserId` and required `organizationId`;
- duplicate request returns existing organization;
- concurrent same-user create converges on the unique Clerk user key;
- nested-write failure leaves no partial Organization;
- fresh PostgreSQL migration deploy verifies:

  - User → Organization FK;
  - unique Clerk user id;
  - non-null organization id;
  - Tag normalized-name uniqueness;
  - absence of Clerk org ids, slug, OnboardingClaim, lease fields, local roles, and local profile projection fields.

### Tenant reads and mutations

Preserve existing meaningful coverage for:

- funder organization isolation;
- grant list/detail isolation;
- activity isolation;
- tag isolation;
- nested Funder checks;
- nested Tag checks;
- cross-tenant Funder rejection;
- cross-tenant Tag rejection;
- soft-deleted rows;
- malformed GrantTag protection;
- pagination/search/filter behavior;
- atomic Funder/Grant/Activity writes;
- same-status no-op;
- strict server-owned input;
- tag normalized uniqueness;
- tag assignment/removal idempotence.

Update auth fixtures from Clerk Organization sessions/projections to Clerk `userId` + local User tenancy.

PostgreSQL isolation tests seed at least two local Users attached to different Organizations and preserve current cross-tenant read/write assertions.

### Shell/profile

- shell obtains organization name from the local authorized organization;
- current-user account menu uses Clerk current-user profile state;
- profile display does not participate in authorization;
- removal of local profile snapshot fields does not remove sign-out or profile access.

### Obsolete behavior removal

Delete rather than skip tests dedicated to:

- Clerk Organization roles;
- active Clerk org;
- membership inventory;
- projection pending;
- Clerk user/org projection webhooks;
- Clerk Organization creation/recovery;
- onboarding claim/lease;
- private metadata proof;
- `setActive` activation.

Add a bounded static/schema assertion across runtime source and Prisma migrations for absence of obsolete tenancy identifiers where useful. Do not scan archived SoloFlow receipts/history as runtime source.

## 8. Browser acceptance and tooling limitations

### Frozen browser acceptance

When BUILD is available with Clerk keys and an empty/disposable database:

1. Anonymous access to `/` or protected application pages results in sign-in.
2. A newly authenticated Clerk user with no local User reaches `/organization`.
3. The onboarding page shows one organization-name form and no organization chooser.
4. Submitting a valid name creates the local tenancy and reaches `/dashboard`.
5. The shell displays the local Organization and current Clerk user profile.
6. Refresh does not require organization activation.
7. Sign out and sign back in returns the same Clerk user to the same local Organization.
8. Create/use a Funder.
9. Create a Grant.
10. Edit or change Grant status.
11. Use current grant portfolio search/filter behavior.
12. Confirm the resulting data remains available after sign-out/sign-in.
13. Where seeded cross-tenant data exists, the UI exposes no foreign Grant/Funder/Tag detail.

There is no expected Clerk Organization creation, membership, activation, recovery, projection, or webhook dependency in this flow.

### Honest limitations

- The ARCHITECT pass does not implement or run the browser flow.
- PostgreSQL integration suites remain opt-in behind the repository's test database environment. A skipped suite is reported as skipped.
- Real Clerk authentication acceptance requires valid Clerk environment keys and a real development Clerk user.
- Unit mocks do not prove Clerk middleware/provider behavior.
- No browser automation framework should be added merely to satisfy this workstream if SoloFlow's available local-browser validation can perform the acceptance checks.

## 9. Blocking unknowns and risks

There is no unresolved product or tenancy decision blocking implementation.

The clean-baseline decision is contingent on the confirmed absence of production data. If that changes, stop and obtain a separate migration/data-preservation decision.

Implementation risks to verify without expanding scope:

- Confirm the generated Prisma nested create shape for required User → Organization relation after the schema change.
- Catch Prisma's expected unique-constraint failure for the Clerk-user race and re-read by `clerkUserId`; do not convert unrelated persistence errors into successful convergence.
- Ensure the account-menu Clerk profile loading state remains usable after local profile fields are removed.
- Ensure no existing domain DTO or UI unexpectedly depends on persisted local user profile fields outside the current shell; if one does, report the exact dependency before adding persistence back.
- Remove the webhook signing-secret example and webhook public proxy exception with the webhook route.
- Generated Prisma types and obsolete fixtures will become stale after the baseline reset; regenerate and update them rather than weakening the architecture.
- Preserve unrelated dirty state and modify only approved implementation/test/configuration paths.
