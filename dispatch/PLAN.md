# Proposed Plan — GF-TAG-001 Organization-Scoped Grant Categorization

## Status

**Approved — feature-branch ready.** GF-TAG-001 is approved for implementation under this blueprint. The dedicated feature branch and `READY` receipt are verified; implementation, migrations, database access, dependency changes, environment changes, commits, pushes, merges, deployment, and cleanup remain separately unauthorized until dispatched.

GF-PHASE1-001 is complete; its durable completion, decisions, and review history remain in `dispatch/COMPLETED.md`, `dispatch/DECISIONS.md`, and `dispatch/REVIEW.md`.

## Outcome

Deliver the smallest secure tag slice on the existing grants experience: an active-organization member or admin can create a reusable tag, see active tags for that organization, assign or remove tags on an active grant, and see assigned tags in the grants list and existing grant-detail Sheet.

## In scope

1. Organization-scoped active-tag listing and tag creation.
2. Case-insensitive tag-name uniqueness guaranteed by PostgreSQL, including concurrent creates.
3. Many-to-many assignment and removal through the existing `GrantTag` join table.
4. Assigned-tag display in the current grants list and query-parameter-controlled grant-detail Sheet.
5. Zod contracts, serialized DTOs, Clerk-derived authorization, soft-delete filtering, and database-backed tenant/isolation coverage.
6. One Prisma schema migration to replace the current case-sensitive uniqueness guarantee with a case-insensitive database-backed guarantee.

## Agreed language

- **Active tag:** a Tag in the signed Clerk session's active organization with `deletedAt: null`.
- **Active grant:** a Grant in that organization with `deletedAt: null` whose Funder is also active and organization-scoped, matching the current grant boundary.
- **Same tag name:** names equal after leading/trailing whitespace is removed and letters are lowercased. Internal whitespace is not collapsed.
- **Reusable:** an existing active organization tag is offered for assignment to any active grant in that organization; users do not create a grant-specific copy.
- **Assigned tag:** an active, same-organization Tag connected to an active Grant by `GrantTag`. Malformed cross-organization or soft-deleted-tag associations are never serialized to clients.

## Decisions

- **Confirmed — authorization:** only the current recognized Clerk roles exist. Both `org:member` and `org:admin` may read/create tags and assign/remove them. No viewer role or local membership authorization is introduced.
- **Confirmed — server-owned scope:** `organizationId`, deletion state, timestamps, and all tenant scope come from the server. Strict Zod contracts accept only tag/grant identifiers and tag names.
- **Proposed — case-insensitive uniqueness:** add a server-owned `normalizedName` column to Tag and replace `@@unique([organizationId, name])` with `@@unique([organizationId, normalizedName])`. Set it from the trimmed, lowercased display name on every tag create. This is the smallest Prisma-native database constraint that closes the concurrent-write race; an application-only precheck is explicitly insufficient.
- **Confirmed — migration required:** the existing database constraint is case-sensitive, so GF-TAG-001 requires one reviewed Prisma migration. The migration backfills existing rows using the same trim/lower rule, refuses to silently merge collisions, makes `normalizedName` required, and installs the new unique constraint.
- **Proposed — duplicate behavior:** a duplicate create returns a field-level “A tag with this name already exists.” failure. A friendly precheck may improve UX, but the unique constraint and handled Prisma unique violation are authoritative.
- **Proposed — idempotent assignment:** assigning an already-assigned tag and removing an already-absent assignment both return success without an additional write. The composite `GrantTag` primary key remains the duplicate-assignment guard.
- **Confirmed — Activity behavior:** do not create Activity for tag creation, assignment, or removal. GF-ACTIVITY-001 explicitly defers tag-change activity, and the slice must not invent `tag_created`, `tag_assigned`, `tag_removed`, or misleading `grant_updated` actions.
- **Confirmed — Sheet-only detail:** extend the existing `/grants?grant=<id>` Sheet. Do not add `/grants/[id]`, intercepting routes, or a second detail experience.
- **Deferred — filtering:** tag filtering stays with GF-GRANT-002. No tag search param, filter chips, query predicate, pagination reset, or no-match state is included here.

## Fixed implementation rules

- Active tag queries filter by server-derived `organizationId` and `deletedAt: null`.
- Grant list/detail tag relations filter the related Tag by the same organization and `deletedAt: null`; do not trust `GrantTag` foreign keys to prove tenant equality.
- Assignment/removal actions verify both the active grant boundary and active tag boundary inside the mutation transaction. Cross-org, missing, and soft-deleted records share a generic not-found result.
- `GrantTag` remains without `organizationId`; no denormalization or composite foreign-key redesign is included in this slice.
- Tag deletion/restore is not exposed. Existing soft-deleted tags and their historical associations remain untouched and hidden. The current all-row uniqueness policy means a soft-deleted tag name remains reserved until rename/delete/restore semantics are designed later.
- Return plain `TagDto` values and Grant DTOs containing serialized tag arrays; never pass Prisma records to Client Components.
- No new package, API Route Handler, global state, standalone tag route, tag settings page, or direct client database access.
- Use existing tokens and owned UI primitives. Color is not read from or written to Tag; badges use the existing neutral/default treatment and visible text.
- Preserve the current grants list pagination and URL Sheet state. In the dense table, show a bounded badge preview with an accessible remainder count; the Sheet shows the complete active assignment set.

## Explicit deferrals

Tag filtering/search, tag rename, tag soft delete/restore, color selection/rendering, hierarchy/groups, tag dashboard/settings, bulk assignment, tag import, tag analytics/reporting, suggested/automatic tags, full grant-detail route, funder-detail tag display, and tag-change Activity.

## Ordered implementation after approval

1. Approval and feature-branch readiness are recorded below; implementation may be dispatched against this approved blueprint. The branch is `feature/gf-tag-001` in `/Users/vike/Desktop/grant-flow`; no implementation Git operation is implied by this receipt.
2. Update the Tag data-model authority and Prisma schema with required `normalizedName`; create and review the single migration, including collision detection/backfill and fresh/upgrade migration verification.
3. Add strict tag create/assignment/removal Zod contracts and plain Tag/action-result DTO contracts.
4. Add the organization-scoped active-tag query and extend grant list/detail queries and serializers to include only active same-org assigned tags without N+1 reads.
5. Add `createTag`, `assignTagToGrant`, and `removeTagFromGrant` Server Actions with current Clerk authorization, relation checks, idempotency, handled uniqueness conflicts, transactions for relation mutations, and `/grants` revalidation.
6. Extend the existing grants list and grant-detail Sheet with neutral text badges, reusable active-tag selection, inline tag creation, assignment/removal, and complete loading/empty/error/success/keyboard states.
7. Add focused contract, query, action, DTO, and UI tests; extend disposable-PostgreSQL coverage for migration safety, concurrent uniqueness, tenant hiding, soft deletes, relation integrity, idempotency, roles, and absence of tag Activity.
8. Run validation and independent review. Stop and return to architecture if Prisma cannot represent the proposed constraint cleanly or migration preflight finds existing normalized-name collisions.

## Validation and acceptance

- Lint, strict TypeScript, build, Prisma generation/validation/verifier, normal Vitest, and opt-in disposable-PostgreSQL suites pass.
- Fresh migration deployment passes, and an upgrade fixture proves existing non-conflicting tags receive the correct normalized value. A collision fixture fails clearly without silently deleting, renaming, or merging tags/assignments.
- Concurrent same-org creates such as `Housing` and `housing` produce exactly one tag; the loser receives the duplicate-name result. The same normalized name remains valid in different organizations.
- Admin and member can create, assign, and remove. Unauthenticated, unrecognized-role, cross-org, missing, active/soft-delete boundary failures produce no unauthorized Tag or GrantTag change.
- Lists/details never expose another organization's tag, a soft-deleted tag, or a malformed cross-org association.
- Assignment and removal are idempotent, duplicate `GrantTag` rows are impossible, and no tag operation writes Activity.
- Grant DTOs remain fully serializable; current grant amount/date/status/activity behavior and cursor pagination do not regress.
- The existing Sheet remains the only detail surface. Assigned tags appear in list summaries and in full within the Sheet; no filter, rename/delete, color, hierarchy, dashboard, import, or analytics UI appears.

## Assumptions requiring approval

- **Assumed, medium confidence:** tag names are trimmed, required, and limited to 50 characters for a compact label UI; Unicode remains allowed.
- **Assumed, high confidence:** full-row normalized uniqueness retains the existing behavior that soft-deleted names stay reserved. Reuse-after-delete is deferred with tag deletion.
- **Assumed, high confidence:** per-tag assign/remove actions are sufficient for many-to-many management; bulk replacement is unnecessary in this slice.

## Approval gate

The developer has explicitly approved this blueprint and workflow. The feature branch is ready for dispatch. Approval and readiness do not authorize migration execution, database access, dependency/environment changes, commit, push, merge, deployment, or cleanup; those require their own workflow receipts/confirmations.
