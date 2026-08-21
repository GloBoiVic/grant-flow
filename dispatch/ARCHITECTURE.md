# Proposed Architecture — GF-TAG-001 Organization-Scoped Grant Categorization

## Status and authority

**Approved — feature-branch ready.** This is the implementation-shaping authority for GF-TAG-001. Approval is recorded and builders may receive it through the dispatch workflow. GF-PHASE1-001 history remains authoritative in `dispatch/COMPLETED.md`, `dispatch/DECISIONS.md`, and `dispatch/REVIEW.md`.

## System boundary

GF-TAG-001 extends the existing grants vertical slice; it does not create a standalone tag product area.

```text
Grants Server Component
  -> listGrants/getGrant/listTags query modules
  -> serialized GrantDto + TagDto
  -> existing GrantsPage and query-controlled GrantDetailSheet
  -> tag Server Actions
  -> Zod -> Clerk authorization -> Prisma transaction -> revalidate /grants
```

Route Handlers, client-side initial fetches, direct client Prisma access, a `/tags` route, and a full grant-detail route are outside the boundary.

## Data model and migration

### Proposed schema delta

- Keep Tag display field `name` unchanged.
- Add required server-owned `Tag.normalizedName: String`.
- Replace `@@unique([organizationId, name])` with `@@unique([organizationId, normalizedName])`.
- Keep `Tag.color`, `Tag.deletedAt`, and the `GrantTag` composite primary key unchanged.
- Do not add `organizationId` to GrantTag in this slice.

### Normalization contract

The authoritative normalization function removes leading/trailing whitespace and lowercases the result. Zod returns the trimmed display `name`; the action derives `normalizedName` and never accepts it from a caller. Internal spaces and original display casing are preserved in `name`.

### Why a migration is mandatory

The current `(organizationId, name)` unique index allows `Housing` and `housing`. A pre-insert query races under concurrent requests and cannot satisfy the product guarantee. A database unique constraint over the normalized key is therefore required. No application-only workaround is approved.

### Migration safety

The reviewed Prisma migration must:

1. add `normalizedName` in a backfillable state;
2. populate existing rows with the agreed trim/lower rule;
3. detect duplicate `(organizationId, normalizedName)` values before installing the constraint;
4. abort with actionable evidence if collisions exist—never auto-merge, delete, or rewrite Tag/GrantTag history;
5. make the field required, create the new unique index, and remove the old case-sensitive index.

No runtime raw SQL is introduced. Migration SQL remains a versioned Prisma Migrate artifact. If collision preflight fails, implementation stops for a separately approved data-remediation decision.

### Rollback implications

The feature can be rolled back while leaving the additive column and stronger constraint in place; the current application has no tag write path and will ignore them. Do not attempt a destructive production down-migration as routine rollback. A schema reversal would require a separately reviewed migration and could re-open case-variant duplicates.

## Contracts and ownership

### Validation

Create strict schemas in `src/lib/validations/tag.ts`:

- create: `{ name }` only;
- assign: `{ grantId, tagId }` only;
- remove: `{ grantId, tagId }` only.

Reject `organizationId`, `normalizedName`, `color`, `deletedAt`, timestamps, and unknown keys before authorization/persistence. Proposed name rule: trimmed, 1–50 Unicode characters.

### DTOs

Create `src/types/tag.ts` with plain `TagDto` and action-result contracts. `TagDto` exposes only `id` and display `name` for this slice. Extend grant list/detail DTOs with `tags: TagDto[]`. All action/query returns are plain serializable data; Prisma relation wrappers and Date values do not cross the server/client boundary.

## Read architecture

Add `src/lib/queries/tags.ts`:

- call `requireAuthorization()`;
- list `organizationId = authorization.organizationId` and `deletedAt: null` only;
- select only DTO fields;
- use deterministic `name`, then `id`, ordering.

Extend `listGrants` and `getGrant` in the existing query module with a nested GrantTag select that filters the related Tag by both active `organizationId` and `deletedAt: null`. Serialize the nested relation to a flat `tags` array in one Prisma query. This prevents N+1 reads and hides malformed cross-org joins rather than trusting the join table.

## Mutation architecture

Co-locate tag actions with the grants feature in a dedicated `tag-actions.ts` to avoid broadening the existing grant CRUD action file.

### `createTag(input)`

1. Strict Zod parse.
2. `authorizeAction()` using the current recognized Clerk role.
3. Derive `organizationId` and `normalizedName` server-side.
4. Optionally precheck for friendly UX, then create the Tag; the database unique constraint remains authoritative.
5. Convert the relevant Prisma unique violation to the stable field error.
6. Revalidate `/grants`; return `TagDto`.

This single-record mutation writes no Activity and does not require a transaction.

### `assignTagToGrant(input)`

Within one Prisma transaction:

1. verify the Grant by id, active organization, `deletedAt: null`, and active same-org Funder;
2. verify the Tag by id, active organization, and `deletedAt: null`;
3. create the GrantTag with duplicate-safe/idempotent semantics backed by the composite primary key;
4. return the current active same-org assigned-tag DTO set.

If either relation is unavailable, return the same generic “Grant or tag not found.” result and write nothing. Revalidate `/grants` after a successful boundary result.

### `removeTagFromGrant(input)`

Within one Prisma transaction, perform the same active grant/tag verification, then `deleteMany` the exact composite relation. Zero deleted rows is a successful idempotent no-op. Return the current active same-org assigned-tag DTO set and revalidate `/grants`.

### Activity contract

No Activity row is created for any tag operation. GF-ACTIVITY-001 explicitly places tag changes out of scope. Do not alias assignment/removal to `grant_updated` and do not introduce undocumented action keys.

## Authorization and tenant isolation

- Signed Clerk `userId`, active `orgId`, and recognized `orgRole` remain authoritative.
- Local User/Organization rows are projections used by `requireAuthorization`/`authorizeAction`; they do not grant access.
- Both current roles (`org:member`, `org:admin`) may use this slice. No viewer role is added.
- Organization IDs never appear in client contracts.
- Cross-org/missing/soft-deleted entities are indistinguishable to callers.
- The schema still cannot prove Grant and Tag tenant equality through GrantTag. Every write verifies both sides, every read filters the Tag side, and database-backed tests are a release gate.

## Soft-delete behavior

- Only `deletedAt: null` tags are listed, displayed, or assignable.
- Soft-deleted grants and grants whose funder is soft-deleted are not manageable.
- Existing joins to soft-deleted tags remain untouched and hidden, preserving historical references.
- Rename/delete/restore actions are absent. Because the proposed normalized unique key covers all rows, soft-deleted names remain reserved; reuse-after-delete must be resolved with the deferred delete/restore design.

## UI composition

### Grants list

Render assigned tags as compact neutral text badges within the current identity/title cell so the table's existing columns, horizontal-scroll behavior, pagination, and row navigation remain stable. Render a bounded preview and an accessible “+N more” count when needed. Do not add filter controls or URL state.

### Existing grant-detail Sheet

Add a “Tags” region after status/summary and before Activity, consistent with the documented disclosure order. It contains:

- all assigned active tags as text badges;
- an accessible remove button per tag with no confirmation;
- a compact control listing unassigned active organization tags for assignment;
- an inline create-tag field/action;
- explicit no-tags, all-tags-assigned, pending, validation, duplicate, authorization/not-found, and success states.

Use server-confirmed updates followed by local DTO reconciliation and/or `router.refresh`; do not add a client data cache or global state. Preserve Sheet focus behavior, Escape/scrim handling, and the 480px/near-full-width contract.

### Visual boundary

Use existing `Badge`, `Button`, field, border, focus, and semantic tokens. Do not read/render Tag.color, introduce a picker, invent colors/tokens, or communicate tags by color alone.

## Failure handling

- Validation: typed `ActionResult` with field errors; no authorization or database work before parse succeeds.
- Duplicate name: stable field error, including database-race losers.
- Missing/cross-org/deleted relation: generic not-found result; no existence leak.
- Unexpected database failure: propagate to the existing route error boundary.
- Migration collision: halt migration/implementation and request an explicit remediation decision.
- Assignment/remove races: idempotent success; no duplicate relation and no Activity noise.

## Planned file impact

### Data and authority

- `context/database.md` — document `normalizedName` and the case-insensitive unique key after blueprint approval.
- `prisma/schema.prisma` — Tag field/constraint delta.
- `prisma/migrations/<timestamp>_tag_case_insensitive_name/migration.sql` — one reviewed migration.
- `src/generated/prisma/**` — regenerated Prisma client artifacts.

### Contracts, reads, and mutations

- `src/lib/validations/tag.ts` — new strict tag schemas/normalizer.
- `src/types/tag.ts` — new DTO/action-result contracts.
- `src/types/grant.ts` — add serialized tag arrays.
- `src/lib/queries/tags.ts` — new active organization tag list.
- `src/lib/queries/grants.ts` — include/filter/serialize assigned tags.
- `src/app/(authenticated)/(org-required)/grants/tag-actions.ts` — new tag actions.
- `src/app/(authenticated)/(org-required)/grants/page.tsx` — load active tags for the Sheet.

### UI

- `src/components/grants/grants-page.tsx` — list badge preview and tag props.
- `src/components/grants/grant-detail-sheet.tsx` — assigned display and management region.
- `src/components/grants/tag-manager.tsx` — focused client interaction island.

### Verification

- `src/test/domain-contracts.test.ts` — strict tag/name contracts.
- `src/test/domain-queries.test.ts` — scoped tag and nested-assignment reads/DTOs.
- `src/test/domain-actions.test.ts` — action authorization, relation, uniqueness, idempotency, and no-Activity behavior.
- `src/test/grant-ui.test.tsx` — badge display and Sheet tag states/interactions/accessibility.
- `src/test/postgres-domain-isolation.integration.test.ts` — real tenant/soft-delete/role/assignment/no-Activity coverage.
- `src/test/postgres-tag-migration.integration.test.ts` — focused disposable-PostgreSQL upgrade/backfill and collision-refusal coverage.

No dependency, environment-variable, Route Handler, app-shell, dashboard, funder-detail, import, or filter file is planned.

## Constraints and risks

- **Migration collision risk:** manually inserted case variants may exist despite no current UI. Preflight and fail closed; never silently merge.
- **Cross-tenant join integrity:** GrantTag lacks database tenant equality. Keep the current model for scope discipline and enforce both sides at all app boundaries plus PostgreSQL tests.
- **Unbounded tag count:** the active-tag picker lists all org tags. This matches the target 1–10-person MVP and avoids premature pagination; revisit only with measured need.
- **Current dense components:** existing grant components are compact. Keep the tag manager isolated rather than further embedding mutation logic in the Sheet.
- **Filter coupling:** adding a tag filter now would expand URL/query/pagination/empty-state contracts and is therefore deferred to GF-GRANT-002.

## Validation gates

1. Prisma schema/client/migration validation and fresh migration deployment.
2. Upgrade/backfill fixture plus explicit normalized-collision refusal.
3. Unit/component suites for contracts, DTOs, actions, UI states, and accessibility.
4. Disposable PostgreSQL proof for concurrent case-insensitive uniqueness, same-name-across-org allowance, tenant hiding, soft deletes, assignment/removal, idempotency, roles, and no Activity.
5. Lint, strict TypeScript, full tests, build, and Prisma verifier.
6. Independent R1 review against this approved blueprint before completion.

## Explicit deferrals

Tag filtering/search, rename, delete/restore, colors, hierarchy/groups, standalone management, bulk operations, import, analytics/reporting, suggestions/automation, funder-detail display, full grant-detail routing, and tag Activity.

## Approval and isolation

Implementation cwd: `/Users/vike/Desktop/grant-flow`. Isolation is verified on dedicated local branch `feature/gf-tag-001` in the current checkout through the exact `READY` receipt recorded in `dispatch/TASKS.md`. No commit, push, merge, migration execution, deployment, or cleanup is automatically authorized. The planning records are uncommitted in this checkout; this receipt does not claim they are committed.
