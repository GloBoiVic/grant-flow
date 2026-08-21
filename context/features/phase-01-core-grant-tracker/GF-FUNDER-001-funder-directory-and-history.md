# GF-FUNDER-001 — Funder Directory and History

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-FUNDER-001 |
| **Phase** | Phase 1 — Core Grant Tracker |
| **Status** | Planned |
| **Product Goal** | Enable grant professionals to maintain a centralized directory of funders with contact information and institutional knowledge |
| **MVP Classification** | MVP Core |
| **Roadmap Link** | [Phase 1 — Core Grant Tracker](../../roadmap.md#6-phase-1-core-grant-tracker) |

---

## 1. Feature

A funder directory where users can create, view, edit, and soft-delete funder records. Each funder stores name, type, website, notes, geographic scope, and associated contacts. Funders serve as the parent entity for grant records — every grant belongs to one funder.

## 2. Purpose

Spreadsheet-based grant tracking often scatters funder information across rows, losing institutional knowledge when staff leave. GF-FUNDER-001 centralizes funder data: who they are, what type of funder, how to reach them, and historical context. This is the foundation for funder-level portfolio views and funder performance analysis.

## 3. User Outcome

Grant professionals can maintain a complete directory of grant-making entities. When creating a new grant, they can select from existing funders or create a new one. Funder details (contacts, notes, type) are preserved and accessible.

## 4. Scope

- Funder list view (table with name, type, active grants count, website)
- Funder create, read, update, soft-delete
- Funder type enum: Foundation, Family Fund, Corporation, Other
- Funder contacts: name, email, phone, title, notes (multiple contacts per funder)
- Funder notes field for institutional knowledge
- Funder search by name
- Funder detail view with contacts and grants list (grants list is a reference to GF-GRANT-001)
- Soft delete with recovery capability

## 5. Out of Scope

- Funder performance metrics or analytics (GF-REPORT-001, post-MVP)
- Funder relationship timeline or activity history (history is on grants; funder activity tracking is post-MVP)
- CRM-level contact management (relationship history, interaction logging)
- Funder import during CSV import (CSV import creates funders as part of import flow — GF-IMPORT-001)
- Funder deduplication detection or merge
- Bulk funder operations
- Funder sharing across organizations

## 6. User Stories

- As a **grant professional**, I want to add a funder so that I can track which organizations I apply to.
- As a **grant professional**, I want to view all funders so that I can browse my organization's funder relationships.
- As a **grant professional**, I want to search funders by name so that I can quickly find a specific funder.
- As a **grant professional**, I want to add contacts to a funder so that I know who to reach out to.
- As a **grant professional**, I want to view a funder's details and associated grants so that I understand our relationship history.
- As a **grant professional**, I want to edit funder information so that it stays current.
- As a **grant professional**, I want to remove a funder (soft delete) so that outdated records don't clutter my directory.

## 7. Functional Requirements

1. **Funder list** displays all active (non-deleted) funders in a table with columns: name, type, website, active grants count.
2. **Funder create form** accepts: name (required), type (select from enum, required), website (optional), county served (optional), notes (optional textarea).
3. **Funder edit** updates any field. Save persists all changes.
4. **Funder delete** performs soft delete (sets `deletedAt`). The funder and its grants remain in the database for historical integrity.
5. **Funder detail view** shows all funder fields, contact list, and a reference list of associated grants (read-only from the funder perspective; users navigate to grant detail for full grant information).
6. **Contact management** within a funder: add, edit, delete contacts. Contact delete is soft delete.
7. **Funder search** filters by name (case-insensitive contains match).
8. **Funder type** defaults to "Other" if not specified.

## 8. Business Rules

1. A funder cannot be permanently deleted while associated grants exist (soft delete only).
2. Funder name should be unique within an organization (display warning on duplicate; not enforced as a strict DB constraint beyond practical uniqueness).
3. Deleting a funder soft-deletes associated contacts but does NOT soft-delete associated grants (grants remain accessible; the funder column shows the funder name for historical reference even if the funder is deleted).
4. At least one funder must exist before grants can be created (grants require `funderId`).

## 9. User Experience

- Funder list is a compact table matching `screenshots/funders.png`.
- Each row shows funder name, type badge, website link, active grants count.
- Row click opens funder detail view (full page initially; slide-over is a future enhancement).
- Create/edit form follows the form conventions from `context/design.md` §8: grouped fields, inline validation, save action.
- Contacts display as a compact list within the funder detail, with add/edit/delete actions.
- Search is a text input at the top of the list; results filter as user types.
- Empty state: "No funders yet. Add your first funder to start tracking grant-making organizations."

## 10. Data Requirements

**Funder entity** (per `context/database.md` §3):
- `id` (UUID), `organizationId` (FK → Organization), `name` (text), `type` (FunderType enum), `website` (text?), `countyServed` (text?), `notes` (text?), `createdAt`, `updatedAt`, `deletedAt`

**FunderContact entity** (per `context/database.md` §3):
- `id` (UUID), `organizationId` (FK → Organization), `funderId` (FK → Funder), `name` (text), `email` (text?), `phone` (text?), `title` (text?), `notes` (text?), `createdAt`, `updatedAt`, `deletedAt`

## 11. Permissions

| Role | Funder Access |
|---|---|
| **ADMIN** | Full CRUD including delete |
| **MEMBER** | Create, read, update; no delete |
| **VIEWER** | Read only |

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton table rows matching funder list geometry |
| **Empty (no funders)** | Explanatory empty state with "Add Funder" primary action |
| **Normal** | Funder list rendered in table |
| **Search active** | Filtered results; "No funders match your search" empty state when no results |
| **Funder detail loading** | Skeleton for funder info + contacts |
| **Funder detail error** | Error state with retry for failed funder load |
| **Create/edit form** | Inline validation errors, server validation errors, save in progress |
| **Delete confirmation** | Confirmation dialog explaining soft-delete behavior |

## 13. Acceptance Criteria

- [ ] Funder list loads and displays all active funders
- [ ] User can create a new funder with required fields
- [ ] User can edit all funder fields
- [ ] Soft delete removes funder from list but preserves data
- [ ] Contacts can be added, edited, and removed within a funder
- [ ] Search filters funders by name
- [ ] Funder detail shows associated grants (reference list)
- [ ] Empty state guides user to create first funder
- [ ] All CRUD operations enforce organization isolation
- [ ] Funder list matches `screenshots/funders.png`

## 14. Dependencies

- GF-DATA-001 (Funder and FunderContact tables)
- GF-AUTH-001 (user session, organization context)
- GF-SHELL-001 (application shell)

## 15. Completion Criteria

- All acceptance criteria pass
- Funder list and detail match screenshot design
- CRUD operations work end-to-end with server validation
- Organization isolation verified (users see only their org's funders)
- Soft delete behavior tested: deleted funder disappears from list, associated grants still reference it

---

*Spec references: `context/database.md` §3, `context/project-brief.md` §8, `context/design.md` §§6, 8*
