# GrantFlow — Database Architecture

> **Status:** Design document with the Prisma foundation implemented; domain persistence remains planned.
> **Created:** 2026-08-09
> **Authority:** Defines the planned GrantFlow data model, database practices, and access conventions. Product requirements are sourced from `context/project-brief.md`. Migration evidence is sourced from `data/mock-grant-data.xlsx`.

> **Prisma schema, generated client, migrations, and Clerk projection boundary are implemented.** Domain queries, Server Actions, Route Handlers, and Supabase Storage remain planned. The simplified persistence path has two migrations, including the onboarding claim create lease; fresh disposable PostgreSQL migration checks pass.

---

## Table of Contents

1. [Database Philosophy](#1-database-philosophy)
2. [Multi-Tenant Organization Model](#2-multi-tenant-organization-model)
3. [Core Domain Entities](#3-core-domain-entities)
4. [Grant Lifecycle](#4-grant-lifecycle)
5. [Relationships and Ownership](#5-relationships-and-ownership)
6. [IDs](#6-ids)
7. [Dates and Money](#7-dates-and-money)
8. [Status and Lifecycle Data](#8-status-and-lifecycle-data)
9. [Soft Deletes and Historical Data](#9-soft-deletes-and-historical-data)
10. [Documents and File Storage](#10-documents-and-file-storage)
11. [Activity History](#11-activity-history)
12. [Tags and Categorization](#12-tags-and-categorization)
13. [Constraints and Indexes](#13-constraints-and-indexes)
14. [Prisma Conventions](#14-prisma-conventions)
15. [Data Migration / CSV Import](#15-data-migration--csv-import)
16. [Database Change Rules](#16-database-change-rules)

---

## 1. Database Philosophy

### Purpose

Every schema decision serves one product goal: **replace the spreadsheet-based grant tracker with a faster, cleaner, more reliable application.**

### Principles

- **Small, bounded MVP model.** Grants, funders, contacts, documents, activity, tags, organizations, users, and onboarding claims. No donor CRM, accounting, billing, AI, or event sourcing.
- **Organization-scoped isolation.** Every tenant-owned record carries an `organizationId`. Cross-org access is prohibited at every layer.
- **PostgreSQL + Prisma ORM.** Prisma is the single source of truth for schema definition, type-safe queries, and migration management.
- **Server-side data access only.** Reads in Server Components. Mutations in Server Actions or Route Handlers. Client components never touch the database.
- **Validation before persistence.** Zod schema gates every write before reaching Prisma. Database constraints are a second line of defense.
- **Fixed-precision money.** All monetary amounts use `decimal(12,2)`. No floating-point types for currency.
- **Calendar dates for deadlines, timestamps for events.** Deadlines are `date` (no time component). Creation/update/activity times are `timestamptz`.
- **Soft deletes for authoritative records.** Grants, funders, and contacts are soft-deleted to preserve reporting and activity history. Join and transient records may be hard-deleted.
- **Append-only activity history.** Simple chronological log — not event sourcing.

### Current Status

Prisma schema, generated client, and two migrations exist. Fresh disposable PostgreSQL integration confirms the clean migration chain, including the onboarding claim create lease. See `AGENTS.md` for the full repository inventory.

---

## 2. Multi-Tenant Organization Model

### Overview

GrantFlow is multi-tenant SaaS. Each **Organization** is a tenant. The signed Clerk session supplies the active organization and recognized role. Local `Organization` and `User` rows are webhook-maintained projections; Clerk is the identity authority. Exactly four projection webhooks are supported: `user.created`, `user.updated`, `organization.created`, and `organization.updated`. Unsupported membership/deletion events no-op.

### Entity: Organization

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Local internal primary key. |
| `clerkOrgId` | `text, unique` | Clerk organization ID from `auth().orgId`. |
| `name` | `text` | Organization display name. |
| `slug` | `text, unique` | URL-friendly identifier. |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Assumption:** The local `Organization` record mirrors a Clerk Organization created at tenant signup. `clerkOrgId` is the stable external identifier. The local `id` is used for internal relationships.

### Entity: User

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Local internal primary key. |
| `clerkUserId` | `text, unique` | Clerk user ID from `auth().userId`. |
| `email` | `text, unique` | Verified email from Clerk. |
| `name` | `text` | Display name from Clerk profile. |
| `avatarUrl` | `text?` | Clerk profile image URL. |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Resolved:** Synced by signed, Zod-validated, idempotent webhook upserts for `user.created` and `user.updated`. It exists for relationship integrity, grant ownership, activity actors, and display data; it is not authorization state.

### Organization Isolation Rule

Every tenant-owned table must have `organizationId` (required, `NOT NULL`). The `organizationId` for queries and mutations is derived from `auth().orgId` (Clerk session), **never** from client-provided form data, URL parameters, or request bodies. Organization reassignment is not supported.

> **Critical:** Never trust client-provided `organizationId` values. Always read the org ID from the authenticated session.

---

## 3. Core Domain Entities

### MVP Entity Model

```
Organization
  ├── User (Clerk projection; used by domain references)
  ├── Funder (1-to-many)
  │     └── FunderContact (1-to-many)
  ├── Grant (1-to-many)
  │     ├── Document (1-to-many)
  │     ├── Activity (1-to-many)
  │     └── Tag (via GrantTag, many-to-many)
  ├── Tag (1-to-many) ← scoped to org, reusable
  └── ImportStaging (1-to-many) ← CSV import processing
```

### Entity: Funder

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `organizationId` | UUID (FK → Organization) | Tenant scope. |
| `name` | `text` | Funder legal/display name. |
| `type` | `FunderType` (enum) | `FOUNDATION` \| `FAMILY_FUND` \| `CORPORATION` \| `OTHER`. Normalizes spreadsheet values (`Foundation`, `Family Fund`, `Corporation`). |
| `website` | `text?` | Funder URL. |
| `notes` | `text?` | Free-text institutional knowledge. |
| `countyServed` | `text?` | Geographic scope from spreadsheet. |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |
| `deletedAt` | `timestamptz?` | Soft delete. |

### Entity: FunderContact

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `organizationId` | UUID (FK → Organization) | Tenant scope (denormalized for query safety). |
| `funderId` | UUID (FK → Funder) | Parent funder. |
| `name` | `text` | Contact full name. |
| `email` | `text?` | |
| `phone` | `text?` | |
| `title` | `text?` | Job title at funder. |
| `notes` | `text?` | |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |
| `deletedAt` | `timestamptz?` | Soft delete. |

### Entity: Grant

Each row represents one specific grant opportunity or application cycle for a funder. There is no separate Opportunity or ApplicationCycle entity — repeated applications to the same funder across years are distinct Grant records. The year is implicit in the grant's deadline and decision dates. A funder may have multiple grant records across years or programs. See Section 15 for why repeated year columns from the spreadsheet must not become repeated schema fields.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `organizationId` | UUID (FK → Organization) | Tenant scope. |
| `funderId` | UUID (FK → Funder) | The funder for this opportunity. |
| `title` | `text` | Grant or program name. |
| `status` | `GrantStatus` (enum) | Bounded lifecycle stage (see Section 4). |
| `amountRequested` | `decimal(12,2)?` | Amount requested for this cycle. |
| `amountAwarded` | `decimal(12,2)?` | Amount awarded. |
| `currency` | `text` | ISO 4217 code. Default: `"USD"`. |
| `deadline` | `date?` | Submission deadline (calendar date). |
| `decisionDate` | `date?` | Expected/actual decision date. |
| `awardTimeframe` | `text?` | Award period description (from spreadsheet). |
| `designation` | `text?` | Program designation (from spreadsheet). |
| `countyServed` | `text?` | Geographic scope. |
| `nextSteps` | `text?` | Next action item (from spreadsheet). |
| `notes` | `text?` | Additional notes. |
| `ownerId` | UUID? (FK → User) | Primary responsible grant professional. One owner per grant (assumption; may need co-ownership post-MVP). |
| `createdById` | UUID (FK → User) | Creator. |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |
| `deletedAt` | `timestamptz?` | Soft delete. |

### Entity: Document

Metadata record pointing to a file in Supabase Storage. The actual file lives in the storage bucket; the DB record is a pointer.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `organizationId` | UUID (FK → Organization) | Tenant scope. |
| `grantId` | UUID (FK → Grant) | Parent grant. |
| `name` | `text` | Display name. |
| `type` | `text` | Category: `"RFP"`, `"Narrative"`, `"Budget"`, `"Award Letter"`, `"Report"`, `"Supporting Doc"`. |
| `fileKey` | `text` | Supabase Storage object key. |
| `fileSize` | `integer` | Bytes. |
| `mimeType` | `text` | MIME type. |
| `uploadedById` | UUID (FK → User) | Uploader. |
| `createdAt` | `timestamptz` | |

### Entity: Activity

Append-only log entry for notable events on a grant or funder.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `organizationId` | UUID (FK → Organization) | Tenant scope. |
| `grantId` | UUID? (FK → Grant) | Nullable — activity may be funder-level. |
| `funderId` | UUID? (FK → Funder) | Nullable — activity may be grant-level. At least one should be set. |
| `action` | `text` | Machine-readable key: `"status_changed"`, `"document_uploaded"`, `"grant_created"`, `"deadline_updated"`, etc. |
| `description` | `text` | Human-readable summary, generated at write time. |
| `metadata` | `jsonb?` | Structured data: previous/new values, document name, etc. |
| `actorId` | UUID? (FK → User) | Who performed the action (nullable for system events). |
| `createdAt` | `timestamptz` | Indexed for timeline queries. |

Activity entries are written in the same transaction as the originating mutation. They are never updated. This is append-oriented history, not event sourcing.

### Entity: Tag

Flat, organization-scoped, user-created, reusable label. Many-to-many with grants via GrantTag. No global taxonomy is imposed; the system does not seed or prescribe tags. Tag colors are a future addition — the `color` field is reserved but not required in MVP.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `organizationId` | UUID (FK → Organization) | Tenant scope. |
| `name` | `text` | Display name (e.g., "Housing"). |
| `color` | `text?` | Hex color for UI badge. |
| `createdAt` | `timestamptz` | |

**Unique:** `(organizationId, name)`.

### Entity: GrantTag

Join table: composite PK `(grantId, tagId)`. No separate `id` column. Hard-deleted when a tag is removed from a grant.

### Entity: ImportStaging

Temporary table for CSV import processing. See Section 15.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `organizationId` | UUID (FK → Organization) | Tenant scope. |
| `importBatchId` | `text` | Groups rows from the same upload. |
| `rowIndex` | `integer` | Original CSV row number. |
| `rawData` | `jsonb` | Full raw row as JSON. |
| `mappedData` | `jsonb?` | After column mapping. |
| `validationErrors` | `jsonb?` | Error objects: `{ field, message }`. |
| `status` | `text` | `"pending"` \| `"mapped"` \| `"validated"` \| `"imported"` \| `"error"` |
| `createdAt` | `timestamptz` | |
| `importedAt` | `timestamptz?` | When committed. |

---

## 4. Grant Lifecycle

### MVP Lifecycle Stages

Eleven bounded stages defined as a Prisma enum (`GrantStatus`):

```
Research → Qualified → Planning → Writing → Internal Review → Submitted → Pending → (Awarded | Declined) → Reporting → Closed
```

- **Forward progression is the default**, but regression and skipping are allowed (logged as Activity entries).
- The status enum labels where a grant *currently* is — it is not a strict state machine.
- `Closed` is terminal. `Declined` is typically terminal but may be re-opened.

### Spreadsheet-to-Lifecycle Mapping

From `data/mock-grant-data.xlsx` (six observed status values):

| Spreadsheet | Product Stage | Notes |
|---|---|---|
| `Submitted` | `Submitted` | Exact match. |
| `Approved Award` | `Awarded` | Product uses `Awarded`. |
| `Declined Award` | `Declined` | |
| `Declined LOI` | `Declined` | LOI is not a separate stage. Maps to `Declined` with note. |
| `To Apply` | **Review needed** | Could be `Research` or `Qualified`. Ambiguous — migration must prompt. Default to `Qualified` with a flag. |
| `In Progress` | **Review needed** | Could be `Planning`, `Writing`, or `Internal Review`. Most ambiguous. Migration must flag for manual selection — no safe default. |

---

## 5. Relationships and Ownership

### Relationship Map

```
Organization ──1:N──► Funder
Organization ──1:N──► Grant
Organization ──1:N──► Tag
Organization ──1:N──► User (through Clerk identity; local rows are projections)

Funder ──1:N──► FunderContact
Funder ──1:N──► Grant

Grant ──1:N──► Document
Grant ──1:N──► Activity
Grant ──M:N──► Tag (via GrantTag)

User ──1:N──► Grant (as ownerId, createdById)
User ──1:N──► Document (as uploadedById)
User ──1:N──► Activity (as actorId)
```

### Ownership Rules

| Record | Tenant Scope | Owner |
|---|---|---|
| Funder | `organizationId` | Organization |
| FunderContact | `organizationId` (denormalized) | Organization (via Funder) |
| Grant | `organizationId` | Organization; `ownerId` = responsible user |
| Document | `organizationId` | Organization; `uploadedById` = uploader |
| Activity | `organizationId` | Organization; `actorId` = performer |
| Tag | `organizationId` | Organization |
| GrantTag | Inherited from Grant + Tag | No separate scope |

### Organization Isolation on Join Tables

`GrantTag` has no `organizationId` — isolation is inherited through its related Grant and Tag records. Queries through `GrantTag` must still include an org filter on the grant or tag side.

---

## 6. IDs

- **All primary keys are UUID v4** (`@id @default(uuid())` in Prisma). Chosen for distributed uniqueness, opacity (no enumeration), and safe environment merging.
- **No auto-increment integers** for PKs. Sequential IDs are reserved for display reference numbers post-MVP (e.g., `GR-0042`).
- **Local `Organization.id` and `User.id` are internal PKs.** Clerk's identifiers are stored in separate `clerkOrgId` and `clerkUserId` columns. Never claim local UUIDs are Clerk IDs.
- **Foreign keys** follow `{referencedTable}Id` camelCase convention: `organizationId`, `funderId`, `ownerId`, `createdById`, `grantId`, `tagId`, `actorId`.
- **Branded TypeScript types** (e.g., `type GrantId = string & { readonly __brand: "GrantId" }`) are a future consideration for cross-entity ID safety.

---

## 7. Dates and Money

### Date Types

| Usage | PostgreSQL | Prisma |
|---|---|---|
| Deadlines, due dates, decision dates | `date` | `DateTime @db.Date` |
| Creation, update, activity timestamps | `timestamptz` | `DateTime @db.Timestamptz` |
| Soft-delete timestamps | `timestamptz` | `DateTime? @db.Timestamptz` |

- All `timestamptz` values stored in UTC. UI converts to user's local timezone.
- No user-specific timezone stored in the database.

### Money

- `amountRequested`, `amountAwarded`: `decimal(12,2)` — maximum $99,999,999,999.99.
- No floating-point types for currency.
- `currency` as ISO 4217 text (`"USD"`, `"EUR"`, `"GBP"`). Default: `"USD"`.
- Multi-currency conversion and reporting deferred post-MVP.

---

## 8. Status and Lifecycle Data

### GrantStatus Enum

Eleven values matching the project brief lifecycle:

`Research`, `Qualified`, `Planning`, `Writing`, `InternalReview`, `Submitted`, `Pending`, `Awarded`, `Declined`, `Reporting`, `Closed`

Planned Prisma enum definition (not yet implemented):
```prisma
enum GrantStatus { Research Qualified Planning Writing InternalReview Submitted Pending Awarded Declined Reporting Closed }
```

TypeScript const object (target, per coding-standards.md):
```typescript
const GrantStatus = { Research: "Research", Qualified: "Qualified", Planning: "Planning",
  Writing: "Writing", InternalReview: "Internal Review", Submitted: "Submitted",
  Pending: "Pending", Awarded: "Awarded", Declined: "Declined",
  Reporting: "Reporting", Closed: "Closed" } as const;
type GrantStatus = (typeof GrantStatus)[keyof typeof GrantStatus];
```

### FunderType Enum

`FOUNDATION`, `FAMILY_FUND`, `CORPORATION`, `OTHER` — based on spreadsheet evidence. Import normalization: `"Foundation"` → `FOUNDATION`, `"Family Fund"` → `FAMILY_FUND`, `"Corporation"` → `CORPORATION`, unknown → `OTHER`.

### ImportStaging Status

`"pending"` \| `"mapped"` \| `"validated"` \| `"imported"` \| `"error"`

---

## 9. Soft Deletes and Historical Data

### MVP Policy

- **Grants, Funders, FunderContacts**: soft-deleted via nullable `deletedAt` timestamp. Filtered from active queries by `deletedAt: null`.
- **Documents**: soft-deleted (preserves activity history links). Deletion also removes the Supabase Storage object.
- **Activity entries**: never deleted — append-only.
- **Tags**: soft-deleted. GrantTag rows for deleted tags are excluded from active queries but preserved for historical integrity.
- **GrantTag**: hard-deleted when a tag is removed from a grant.
- **ImportStaging**: hard-deleted or archived after successful import.
- **Organizations and Users**: not deleted via the application; Clerk remains the identity authority and local rows are projections. Organization deletion is an infrastructure-level operation.

### Rationale

Soft deletes preserve reporting integrity (historical funding totals, award rates), activity timeline references (entries point to grant/funder IDs), and enable accidental-deletion recovery without database restore. Detailed retention and cleanup policy (e.g., permanent deletion after N months) is deferred.

---

## 10. Documents and File Storage

### Architecture

Files live in Supabase Storage buckets. The `Document` table stores metadata + a `fileKey` pointer.

### Storage Path Convention

`/org_{organizationId}/grant_{grantId}/{documentId}_{sanitized-filename}`

This scopes files by organization (prevents cross-org access at the storage layer) and includes the document ID to prevent filename collisions.

### Upload Flow (Planned)

1. Client sends file + metadata to Server Action.
2. Server Action validates: file type allowlist, size limit (~20 MB), authorization, org scope.
3. Upload to Supabase Storage at convention path above.
4. Create `Document` record with returned `fileKey`.
5. Create `Activity` entry: `action: "document_uploaded"`.
6. Revalidate affected route.

### Deletion

1. Soft-delete the `Document` record.
2. Delete the corresponding Supabase Storage object.
3. Create `Activity` entry: `action: "document_deleted"`.

Storage operations use service-role credentials in server environment variables — never exposed to the client.

---

## 11. Activity History

### Design

A simple, append-only chronological log. Written in the same transaction as the originating mutation. Never updated. Not event sourcing — no event replay or state reconstruction.

### Actions

| Mutation | Action |
|---|---|
| Grant created | `"grant_created"` |
| Status changed | `"status_changed"` |
| Document uploaded | `"document_uploaded"` |
| Document deleted | `"document_deleted"` |
| Grant detail edited | `"grant_updated"` |
| Funder created/edited | `"funder_created"` / `"funder_updated"` |

### Query

Activities are fetched in reverse chronological order, scoped by `organizationId` and optionally `grantId` or `funderId`, with pagination (`take: 50`). The `description` field is human-readable text generated at write time.

---

## 12. Tags and Categorization

### Design (Resolved)

- **Flat** — no hierarchy, nesting, or parent-child relationships.
- **Organization-scoped** — tags are not shared across organizations.
- **User-created** — the system does not seed or prescribe tags. Users create, rename, delete, and assign them.
- **Reusable** — many-to-many with grants via `GrantTag` join table.
- **Optional** — a grant may have zero tags.
- **Color field reserved** — the `color` field exists in the schema but is not required in MVP. Color badge rendering is a later addition.
- **Unique per org** — tag names are unique within an org: unique constraint `(organizationId, name)`.
- **No bounded list** — tags are free-form. Users type any name. A bounded-list admin mode is post-MVP.

---

## 13. Constraints and Indexes

### Unique Constraints

| Table | Constraint | Purpose |
|---|---|---|
| Organization | `slug` unique | URL-safe identifier |
| Organization | `clerkOrgId` unique | Clerk identity lookup |
| User | `email` unique | Single account per email |
| User | `clerkUserId` unique | Clerk identity lookup |
| Tag | `(organizationId, name)` unique | No duplicate tag names within org |
| GrantTag | `(grantId, tagId)` unique (PK) | No duplicate tag assignments |

### Indexes (Recommended for MVP)

| Table | Index | Rationale |
|---|---|---|
| Grant | `(organizationId)` | All queries filter by org |
| Grant | `(organizationId, status)` | Portfolio views by stage |
| Grant | `(organizationId, deadline)` | Deadline-sorted dashboard |
| Grant | `(organizationId, deletedAt)` | Active-grant filtering |
| Grant | `(organizationId, ownerId)` | "My grants" queries |
| Grant | `(organizationId, funderId)` | Funder grant history |
| Funder | `(organizationId)` | Org-scoped funder queries |
| Funder | `(organizationId, deletedAt)` | Active-funder filtering |
| FunderContact | `(organizationId, funderId)` | Contacts by funder |
| Document | `(organizationId, grantId)` | Documents by grant |
| Activity | `(organizationId, grantId, createdAt)` | Grant timeline (covers filter + sort) |
| Activity | `(organizationId, createdAt)` | Dashboard recent activity |
| Tag | `(organizationId)` | Tag listing |
| ImportStaging | `(organizationId, importBatchId)` | Batch import processing |

Full-text search (`tsvector` + GIN) and partial indexes (`WHERE deletedAt IS NULL`) are deferred.

---

## 14. Prisma Conventions

### Schema

- Single file: `prisma/schema.prisma`. May be split post-MVP if the schema grows significantly.

### Naming

| Construct | Convention | Example |
|---|---|---|
| Models | PascalCase, singular | `Grant`, `FunderContact` |
| Fields | camelCase | `amountRequested`, `decisionDate` |
| Enums | PascalCase | `GrantStatus` |
| Enum values | PascalCase | `InternalReview`, `Awarded` |

### Field Order

`id` → `organizationId` (for tenant-scoped models) → domain fields → foreign keys → relation fields → `createdAt` → `updatedAt` → `deletedAt` (if soft-deleted).

### Required Attributes

- `@id @default(uuid())` on every `id`.
- `@default(now())` on `createdAt`.
- `@updatedAt` on `updatedAt`.
- `@db.Decimal(12, 2)` on money fields.
- `@db.Date` on calendar-date fields.
- `@db.Timestamptz` on timestamp fields.

### Client Singleton (Planned)

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Query Conventions

- Use `select` to fetch only required fields.
- Use `include` for eager relation loading (avoid N+1).
- Use `prisma.$transaction` for multi-step mutations.
- Always filter by `organizationId` in tenant-scoped queries.
- Filter `deletedAt: null` for active records on soft-deleted models.

### Migration Workflow

```bash
npx prisma migrate dev --name descriptive_name    # local development
npx prisma migrate deploy                          # production
npx prisma migrate status                          # view pending migrations
```

---

## 15. Data Migration / CSV Import

### Evidence: `data/mock-grant-data.xlsx`

- **One sheet:** `"Main Tracker - FOR BOARD"`
- **66 non-empty data rows**
- **15 columns:**

| Col | Header | Notes |
|---|---|---|
| A | Funder | Funder name |
| B | Type | Foundation, Family Fund, Corporation |
| C | Requested Year 2024 | Monetary amount |
| D | Awarded Year 2024 | Monetary amount |
| E | Requested Year 2025 | Monetary amount |
| F | 2025 Pending Requests | Monetary amount |
| G | Awarded Year 2025 | Monetary amount |
| H | Current Status | One of six values (see Section 4) |
| I | Next Steps | Free text |
| J | Due Date | Date |
| K | Approve/Decline Date | Date |
| L | Award Timeframe | Free text |
| M | Designation | Program name |
| N | County Served | Geographic scope |
| O | Notes | Free text |

### Why Repeated Year Columns Must Not Become Schema Fields

Columns C–G repeat the same logical fields (`requested`, `awarded`, `pending`) for each fiscal year. Copying this pattern into the database schema (`requested2024`, `awarded2024`, `requested2025`, `awarded2025`, `pending2025`) would cause four problems:

1. **Unbounded growth:** Next fiscal year adds five more columns. After 5 years, the grants table has 15+ year-specific columns.
2. **Query complexity:** "What was total requested in 2023?" requires knowing the correct column name per year.
3. **Reporting rigidity:** Cross-year comparisons need UNION queries or application-level reshaping — both fragile.
4. **Migration burden:** Every new fiscal year requires a schema migration + deployment + backfill.

**Solution:** Each annual cycle becomes a separate `Grant` record. The year is implicit in the grant's deadline and award timeframe. A funder like "Marjorie L. Christiansen Foundation" gets two Grant records (FY2024, FY2025). The import tool detects year patterns in column names and splits rows accordingly.

### Import Flow

```
Upload CSV → Parse + Validate Structure → Column Mapping → Data Review → Staged Import (ImportStaging) → Confirm + Commit → Cleanup
```

**Key behaviors:**
- Store raw rows in `ImportStaging` with `rawData` JSONB for error recovery.
- Detect and group year-pattern columns. User confirms year mapping.
- Validate each row: duplicate detection (funder name + title + year within org), monetary parsing, date parsing, funder matching.
- **Flag `"To Apply"` and `"In Progress"` statuses** for manual disambiguation (cannot auto-map).
- **Transactional write:** Wrap all creates in `prisma.$transaction`. For large imports (>100 rows), batch in 50–100 row transactions with independent rollback.
- **Write order:** Create/find Funders (dedup by name within org) → Create Grant records → (skip Document creation for MVP imports).
- **Error handling:** Row-level errors shown with original CSV row number, field name, problematic value, and fix suggestion. Re-upload corrects only failed rows.
- **Post-import:** Summary report, bulk activity entry, optional ImportStaging cleanup after 30 days.

**Duplicate prevention:** Detection at validation time, not write time. Query existing grants by org, funder name, title, and year. User chooses: skip, update, or import as new.

---

## 16. Database Change Rules

### Rule 1: Schema Changes Require a Migration

Every change to `prisma/schema.prisma` produces a new migration via `npx prisma migrate dev --name <name>`. Never edit an applied migration.

### Rule 2: No Raw SQL

All database access uses Prisma's typed client. Raw SQL (`prisma.$queryRaw`, `prisma.$executeRaw`) is prohibited. If a future architecture or database decision explicitly carves out an exception, it must be documented in a decision record and approved.

### Rule 3: Validate Before Persist

Every Server Action validates input with Zod, authorizes the user (org + role), executes the Prisma operation, and revalidates affected routes.

### Rule 4: Organization ID Is Never Client-Supplied

The `organizationId` for queries and mutations is derived from `auth().orgId` (Clerk session). Client-provided IDs in request bodies, URL parameters, or form fields are never trusted.

### Rule 5: Soft-Deleted Records Are Excluded by Default

Standard queries include `deletedAt: null`. Admin/reporting queries may explicitly include soft-deleted records. Enforced at the application layer for MVP (not via DB views or row-level security).

### Rule 6: Transactions for Multi-Step Writes

Any mutation creating or modifying more than one record uses `prisma.$transaction`. Examples: grant creation + activity entry, document upload + activity entry, batch import.

### Rule 7: Foreign Keys Have Indexes

Every foreign key column not already in a composite index (Section 13) must have a single-column index. Prisma does not auto-index FKs.

### Rule 8: Migrations Are Version-Controlled

All migration files in `prisma/migrations/` are committed to the repository and reviewed like code changes.

### Rule 9: No Ad-Hoc Schema Changes

Schema changes should be reflected in this document before implementation. The database architecture document is the authoritative reference for the data model.

### Rule 10: Production Migrations Run via `migrate deploy`

`prisma migrate dev` is for local development. `prisma migrate deploy` is for production. `prisma db push` is for prototyping only — never against production.

---

## Appendix: Assumptions vs. Confirmed Requirements

| # | Statement | Status |
|---|---|---|---|
| 1 | Local `Organization` and `User` rows are projections maintained by exactly four signed, Zod-validated, idempotent Clerk webhooks; `clerkOrgId` and `clerkUserId` are stable external identifiers. | **Confirmed** |
| 2 | The signed Clerk session's active `orgId` and recognized `orgRole` are authoritative for organization access and authorization. | **Confirmed** |
| 3 | One primary owner per grant. Co-ownership is post-MVP. | **Assumption** |
| 4 | USD is the default currency. Multi-currency deferred. | **Assumption** |
| 5 | UUIDs for all primary keys. | **Assumption** |
| 6 | The 11-value `GrantStatus` enum matches the project brief lifecycle. | **Confirmed** |
| 7 | Soft deletes for grants, funders, contacts, documents, tags preserve reporting and history. | **Assumption** |
| 8 | Activity is append-only without event sourcing. | **Assumption** |
| 9 | Tags are flat (no hierarchy), organization-scoped, user-created, reusable, many-to-many with grants. No global taxonomy. Colors deferred. | **Confirmed** |
| 10 | Clerk is the auth provider. | **Confirmed** |
| 11 | Supabase Storage for file hosting. | **Confirmed** |
| 12 | Prisma ORM with PostgreSQL. | **Confirmed** |

### Explicitly Out of Scope (MVP)

Donor CRM, accounting, billing/subscription, AI features, event sourcing/CQRS, multi-currency engine, granular permissions, workflow automations, and reporting engine.

---

*End of document. This document combines the implemented Prisma/Clerk foundation with the planned GrantFlow domain model. Final R2 review remains open; terminal GF-AUTH-001 completion is not claimed.*
