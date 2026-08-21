# GF-DATA-001 — Core Persistence Foundation

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-DATA-001 |
| **Phase** | Phase 0 — Platform Foundation |
| **Status** | Complete |
| **Product Goal** | Establish the database, ORM, and migration infrastructure that all features depend on |
| **MVP Classification** | Prerequisite — no standalone user-facing value |
| **Roadmap Link** | [Phase 0 — Platform Foundation](../../roadmap.md#5-phase-0-platform-foundation) |

---

## 1. Feature

Provision a PostgreSQL database, define the Prisma schema for all domain entities, establish the Prisma client singleton, create initial migrations, and set up index and constraint strategy. This is the data persistence layer that all feature Server Actions and queries execute against.

## 2. Purpose

No functional feature can persist or retrieve data without a database foundation. GF-DATA-001 creates the storage infrastructure, the schema definition, the client access pattern, and the migration workflow that every subsequent feature depends on.

## 3. User Outcome

No direct user outcome — the database is invisible to end users. Enables all grant, funder, document, activity, tag, and import features.

## 4. Scope

- PostgreSQL database provisioning (local development and production targets)
- `prisma/schema.prisma` with all MVP entities: Organization, User, Membership, Funder, FunderContact, Grant, Document, Activity, Tag, GrantTag, ImportStaging
- Prisma enums: GrantStatus (11 values), MembershipRole (ADMIN, MEMBER, VIEWER), FunderType (FOUNDATION, FAMILY_FUND, CORPORATION, OTHER)
- Prisma client singleton at `src/lib/prisma.ts`
- Initial migration creation and deployment workflow
- Index and unique constraint definitions
- Seed script for development data (optional)

## 5. Out of Scope

- Row-level security or database views
- Read replicas or connection pooling configuration
- Database backup, archival, or point-in-time recovery strategy
- Full-text search indexes (tsvector + GIN)
- Multi-currency conversion tables
- Materialized views for reporting
- Event sourcing or CQRS infrastructure
- Database monitoring or observability tooling

## 6. User Stories

- As a **developer**, I want a defined database schema so that I can write type-safe queries and mutations.
- As a **developer**, I want a Prisma client singleton so that database connections are managed efficiently.
- As a **developer**, I want migration tooling so that schema changes are versioned and reviewable.
- As a **developer**, I want defined indexes so that common queries perform well.

## 7. Functional Requirements

1. **Prisma schema** defines all MVP entities with correct fields, types, relations, indexes, and constraints per `context/database.md`.
2. **Organization isolation** — Every tenant-owned entity carries a required `organizationId` foreign key.
3. **Soft delete support** — Grants, Funders, FunderContacts, Documents, Tags use nullable `deletedAt` timestamps. Activity and join tables (GrantTag) use hard delete.
4. **UUID primary keys** on all entities.
5. **Money fields** use `decimal(12,2)` with ISO 4217 currency column.
6. **Calendar dates** use `@db.Date`; timestamps use `@db.Timestamptz`.
7. **Unique constraints** defined for:
   - Organization: `slug`, `clerkOrgId`
   - User: `email`, `clerkUserId`
   - Membership: `(organizationId, userId)`
   - Tag: `(organizationId, name)`
   - GrantTag: `(grantId, tagId)` (composite PK)
8. **Indexes** defined per `context/database.md` §13 for all common query patterns.
9. **Prisma client singleton** uses globalThis pattern to prevent multiple instances in development.
10. **Migration** is created with `prisma migrate dev` and deployable via `prisma migrate deploy`.

## 8. Business Rules

1. All schema changes require a migration. Never edit an applied migration.
2. No raw SQL — Prisma typed queries only.
3. Schema design in `context/database.md` is the authoritative reference. Changes to this document precede schema changes.
4. Foreign keys on all relation columns. Prisma does not auto-index FKs — add explicit indexes.

## 9. User Experience

Not a user-facing feature. Developer experience considerations:
- Seed script creates test organizations, users, funders, grants for development
- Prisma Studio available for ad-hoc data inspection
- Migration status command (`prisma migrate status`) for confidence

## 10. Data Requirements

Full schema defined in `context/database.md` §§2–13. This feature implements that design. Key entities:
- **Organization** — Tenant root; synced from Clerk
- **User** — Person; synced from Clerk
- **Membership** — Org-user link with role
- **Funder** — Grant-making entity
- **FunderContact** — Person at funder
- **Grant** — Funding opportunity with lifecycle
- **Document** — File metadata (file lives in Supabase Storage)
- **Activity** — Append-only event log
- **Tag** — Org-scoped label
- **GrantTag** — Many-to-many join
- **ImportStaging** — CSV import processing

## 11. Permissions

- Database credentials in server environment variables only. Never exposed to client code.
- Prisma client runs server-side only. Client components never import Prisma.
- Organization ID derived from Clerk session (`auth().orgId`), never client-supplied.

## 12. States

| State | Behavior |
|---|---|
| **Database unavailable** | Server Actions and queries fail with connection error; propagates to error boundaries |
| **Migration pending** | Prisma warns on connection; deploy migrations before use |
| **Seeded data** | Development seed script populates test records |
| **Clean (no data)** | Prisma schema exists; all tables empty |

## 13. Acceptance Criteria

- [ ] `prisma/schema.prisma` defines all MVP entities matching `context/database.md`
- [ ] All enums defined (GrantStatus, MembershipRole, FunderType)
- [ ] Prisma client singleton (`src/lib/prisma.ts`) compiles and exports
- [ ] `prisma migrate dev` produces an initial migration
- [ ] `prisma migrate deploy` applies migrations cleanly
- [ ] All unique constraints are present
- [ ] All recommended indexes are present
- [ ] Organization isolation pattern is verified: every tenant entity has `organizationId`
- [ ] Money fields use `decimal(12,2)`
- [ ] Soft-delete columns use nullable `@db.Timestamptz`
- [ ] Schema compiles with `prisma generate` with no errors

## 14. Dependencies

None — GF-DATA-001 is a foundational prerequisite.

**Resolved decisions:**
- **Grant semantics** — One Grant = one specific opportunity/application cycle. Repeated annual applications are distinct Grant records associated with the same Funder. No separate Opportunity entity. Year is implicit in deadline/decision dates.
- **Tag semantics** — Tags are flat, organization-scoped, user-created, reusable, many-to-many with grants. No global taxonomy. Colors deferred.
- **Role model** — Exactly ADMIN, MEMBER, VIEWER as the local MembershipRole enum.
- **Identity reconciliation** — Database-backed, idempotent, retry-safe webhook sync via Clerk adapter boundary.
- **Testing stack** — Vitest + React Testing Library for unit/integration; Playwright for E2E. Not installed.

**GF-DATA-001 is the first implementation target.** All foundation features depend on its schema. Subsequent phases build against the data model defined in `context/database.md`.

## 15. Completion Criteria

- All acceptance criteria pass
- Prisma schema is committed and reviewed
- Initial migration is committed and reviewable
- Seed script exists and populates development data
- `context/database.md` is referenced as the authoritative schema reference; schema implementation may reveal adjustments that require updates to that document

---

*Spec references: `context/database.md`, `context/tech-stack.md`, `context/architecture.md`*
