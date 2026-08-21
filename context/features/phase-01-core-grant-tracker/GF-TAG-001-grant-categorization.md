# GF-TAG-001 — Grant Categorization

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-TAG-001 |
| **Phase** | Phase 1 — Core Grant Tracker |
| **Status** | Planned |
| **Product Goal** | Enable grant professionals to categorize grants using customizable, organization-scoped labels |
| **MVP Classification** | MVP Core |
| **Roadmap Link** | [Phase 1 — Core Grant Tracker](../../roadmap.md#6-phase-1-core-grant-tracker) |

---

## 1. Feature

A flat, organization-scoped tagging system. Users create, rename, and delete tags (e.g., "Housing", "Healthcare", "Youth Services", "Rural Development"). Tags are assigned to grants via a many-to-many relationship. Tags support filtering in the grant list (GF-GRANT-002) and categorization across the portfolio.

## 2. Purpose

Spreadsheets often have a "program area" or "category" column with inconsistent values. GF-TAG-001 replaces this with a structured but flexible tagging system that is organization-specific, reusable across grants, and supports portfolio filtering and reporting.

## 3. User Outcome

Grant professionals can create tags that match their organization's program areas or grant categories, assign multiple tags to each grant, and filter the grant portfolio by tag. Tags provide consistent categorization without rigid taxonomies.

## 4. Scope

- Tag CRUD (create, read, update name, soft delete)
- Optional tag color (hex) for UI badges
- Tag assignment to grants (many-to-many via GrantTag join table)
- Tag removal from grants
- Tag filter in grant list (GF-GRANT-002)
- Tag display on grant cards, grant detail, and funder detail
- Tag uniqueness within organization (case-insensitive name)
- Soft delete preserves historical references

## 5. Out of Scope

- Tag hierarchy or parent-child relationships
- Tag groups or categories of tags
- Auto-tagging or tag suggestions
- Tag analytics (usage counts, grant distribution by tag — post-MVP)
- Tag import during CSV import (deferred — GF-IMPORT-001 explicitly excludes tag import from MVP; tags are created manually or post-MVP. **Contradiction note:** earlier versions of this spec suggested tags might be created during import. GF-IMPORT-001 is authoritative: tag import is out of MVP scope.)
- Org-wide tag management dashboard beyond the grant context
- Shared tag libraries across organizations
- Required tags or tag validation on grants

## 6. User Stories

- As a **grant professional**, I want to create tags so that I can categorize grants by program area.
- As a **grant professional**, I want to assign tags to grants so that I can organize my portfolio.
- As a **grant professional**, I want to filter grants by tag so that I can focus on a specific program area.
- As a **grant professional**, I want to see tags on grant cards and detail views so that I know how a grant is categorized.
- As a **grant professional**, I want to rename or delete tags so that my taxonomy stays current.

## 7. Functional Requirements

1. **Tag create** — name (required, unique within org) and optional color (hex).
2. **Tag rename** — update tag name. New name must be unique within org.
3. **Tag soft delete** — sets `deletedAt`. Existing GrantTag associations are preserved but excluded from active queries. GrantTag rows are hard-deleted.
4. **Tag assignment** — one or more tags can be assigned to a grant. Same tag cannot be assigned twice to the same grant.
5. **Tag removal** — removes a tag from a grant (hard-deletes GrantTag row).
6. **Tag display** — tags render as compact colored badges with text label.
7. **Tag filter** — grant list filter shows all active tags. Multi-select: grants matching any selected tag are shown.
8. **Tag uniqueness** — enforced at database level: unique constraint on `(organizationId, name)`.

## 8. Business Rules

1. Tags are flat — no hierarchy, nesting, or parent-child relationships.
2. Tags are optional — a grant may have zero tags.
3. Tags are organization-scoped — not shared across organizations.
4. The system does not seed or prescribe tags. Users create all tags.
5. Deleting a tag does not delete the grant. GrantTag associations are removed (hard-deleted for the join, soft-deleted for the tag).
6. Tag colors are optional. If not specified, a default color is used for the badge.

## 9. User Experience

- Tags appear as compact rounded badges in grant rows, cards, and detail views.
- Tag creation: inline text input with color picker or default color.
- Tag assignment: tag picker/combobox within grant create/edit form, showing all active org tags.
- Tag filter: multi-select chip filter in grant list, showing available tags as selectable chips.
- Tags support keyboard navigation and screen reader labels (badges include text, not just color).
- Empty state: "No tags yet. Create your first tag to start categorizing grants."

## 10. Data Requirements

**Tag entity** (per `context/database.md` §3):
- `id` (UUID), `organizationId` (FK → Organization), `name` (text), `color` (text?), `createdAt`
- Unique: `(organizationId, name)`

**GrantTag entity** (per `context/database.md` §3):
- Composite PK: `(grantId, tagId)`. No separate `id`. Hard-deleted.

## 11. Permissions

| Role | Tag Access |
|---|---|
| **ADMIN** | Full CRUD on tags, assign/remove from any grant |
| **MEMBER** | Create, read tags; assign/remove tags on grants they can edit |
| **VIEWER** | Read tags, see tag assignments |

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton badges or loading indicator |
| **Empty (no tags)** | "No tags yet. Create your first tag." |
| **Normal** | Tags displayed as colored badges |
| **Tag picker (assign)** | Combobox showing all tags with search, multi-select |
| **Tag removal** | Confirmation not needed (low-risk action); instant removal |
| **Tag delete** | Confirmation explaining that tag is removed from all grants |

## 13. Acceptance Criteria

- [ ] Tag can be created with name and optional color
- [ ] Tag can be renamed (name uniqueness enforced)
- [ ] Tag soft delete removes it from active queries
- [ ] Tags can be assigned to grants (many-to-many)
- [ ] Tags can be removed from grants
- [ ] Tag list shows all active org tags
- [ ] Tag filter in grant list works (multi-select, intersection with other filters)
- [ ] Tags display as colored badges with text
- [ ] Organization isolation: tags are scoped to org
- [ ] Creation/rename enforces unique constraint within org

## 14. Dependencies

- GF-DATA-001 (Tag and GrantTag tables)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell)
- GF-GRANT-001 (grants for tag assignment)
- GF-GRANT-002 (tag filter in grant list)

**Resolved decisions:**
- **Tag taxonomy** — Free-form. Users type any name. Unique constraint `(organizationId, name)` prevents duplicates. Bounded-list admin mode is post-MVP.
- **Tag-to-grant cardinality** — Unlimited (many-to-many).
- **Tag scope** — Organization-scoped. Not shared across organizations.
- **Tag creation** — User-created. The system does not seed or prescribe tags.
- **Tag colors** — Deferred. The `color` field exists in the schema for future use but is not required in MVP. Badge rendering uses default colors.

## 15. Completion Criteria

- All acceptance criteria pass
- Tag create/rename/delete works end-to-end
- Tag assignment and removal work on grants
- Tag filter integrates with grant list
- Tags display correctly on grant cards and detail views
- Organization isolation verified

---

*Spec references: `context/database.md` §12, `context/project-brief.md` §8 (Categorization), `context/design.md` §6*
