# Plan — GF-PHASE1-001 Organization-Scoped Grant Tracking

## Status

**Approved with scope correction — feature-branch readiness complete.** The required `READY` receipt and approved branch setup are verified; implementation is authorized under this blueprint. No migration, dependency, commit, push, deployment, or cleanup is authorized.

## Outcome

Deliver the smallest secure vertical slice that replaces a spreadsheet grant row: an active-organization user can create a prerequisite funder, then create, list, view, edit, and change the lifecycle status of grants. Each real grant mutation creates append-only domain Activity in the same transaction.

## In scope

1. Provide minimal funder listing and creation: name, type, optional website.
2. Provide grant create, paginated list, slide-over detail/edit, and dedicated status-change behavior.
3. Use server-derived Clerk authorization and local projections at every domain read and mutation boundary.
4. Validate separate create, edit, and status inputs with Zod; use transactionally-created Activity records.
5. Add focused authorization, validation, activity, UI-state, accessibility, and database-backed tenant-isolation tests.

## Fixed implementation rules

- Both `org:member` and `org:admin` may create and edit funders and grants.
- `organizationId`, owner, creator, actor, currency, deletion, and timestamps are server-owned; callers never supply them.
- Grant creation assigns the current projected user as `ownerId` and `createdById`; ownership is not transferable in this slice.
- Funder and grant reads/writes must apply active `organizationId` and `deletedAt: null`; unavailable cross-org records are not distinguishable from missing records.
- A supplied funder must be verified as active and in the current organization within the mutation transaction.
- All eleven existing lifecycle statuses may transition to any other status. Actual changes log prior/new status; same-status submissions write nothing.
- Money is decimal text with at most two fractional digits. Calendar dates use normalized `YYYY-MM-DD` values. Query DTOs serialize Decimal/date values before reaching client components.
- Use the existing `/grants` query-parameter-controlled right-side Sheet (480px desktop, near-full-width on small screens), not an intercepting or standalone detail route.
- No Prisma migration is planned.

## Explicit deferrals

Documents, tags, CSV import, dashboard aggregation, search/filtering, reporting/export, funder contacts and full funder management, arbitrary owner assignment, deletion/restoration, bulk actions, organization switching, notifications, configurable workflows, generic audit/reconciliation infrastructure, versioning, locking, and idempotency systems. The standalone authentication audit and broader production-hardening assessment are deferred to the production-hardening backlog and do not gate this feature.

## Ordered execution after approval

1. Obtain dedicated feature-branch `READY` receipt through the worktrees workflow — complete.
2. Implement validation/DTO/action-result contracts.
3. Implement organization-scoped funder/grant/activity query boundaries.
4. Implement atomic funder and grant Server Actions.
5. Build the minimal funder prerequisite UI.
6. Build grants list and query-parameter-controlled slide-over.
7. Add loading, error, empty, accessibility, and dirty-form states.
8. Add database-backed domain/tenant tests.
9. Conduct independent review and complete validation gates.

## Validation and acceptance

- Lint, strict TypeScript, build, Prisma validation/verifier, and automated tests pass.
- PostgreSQL-backed tests prove one organization cannot list, read, mutate, status-change, or attach another organization's records.
- Failed validation, authorization, or relation verification produces neither domain change nor Activity.
- Successful funder/grant mutations produce the appropriate Activity atomically.
- Admin and member acceptance flows work; soft-deleted records remain inaccessible.
- The UI has no out-of-scope delete, bulk, owner-transfer, document, tag, or contact controls and matches the existing screenshot/token authorities.
