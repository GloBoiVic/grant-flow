# GF-GRANT-001 — Grant Records and Lifecycle

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-GRANT-001 |
| **Phase** | Phase 1 — Core Grant Tracker |
| **Status** | Planned |
| **Product Goal** | Enable grant professionals to create, edit, and manage grant records through their lifecycle stages |
| **MVP Classification** | MVP Core |
| **Roadmap Link** | [Phase 1 — Core Grant Tracker](../../roadmap.md#6-phase-1-core-grant-tracker) |

---

## 1. Feature

The central domain entity of GrantFlow. A grant record represents a single funding opportunity the organization is pursuing or has pursued. Grants track title, funder, lifecycle stage, financial amounts, deadlines, owner, notes, and associated tags. Every grant progresses through an opinionated lifecycle of eleven stages.

## 2. Purpose

Spreadsheet-based grant tracking lacks structured lifecycle management, consistent data entry, and institutional continuity. GF-GRANT-001 provides a rigorous but flexible grant record with defined lifecycle stages, financial tracking, ownership, and structured data that replaces ad-hoc spreadsheet columns.

## 3. User Outcome

Grant professionals can create grant records with all essential information, advance grants through lifecycle stages, track requested and awarded amounts, assign owners, set deadlines, and maintain notes. Grant data is structured, consistent, and searchable.

## 4. Scope

- Grant creation with required and optional fields
- Grant editing (all fields)
- Grant lifecycle stage transitions (eleven stages)
- Grant financial tracking (amount requested, amount awarded, currency)
- Grant deadline and decision date tracking
- Grant ownership assignment (one primary owner)
- Grant notes and next steps
- Grant soft delete
- Grant lifecycle stage enum with forward progression as default
- Integration with funder selection (GF-FUNDER-001)

## 5. Out of Scope

- Grant detail view and slide-over panel (GF-GRANT-003)
- Grant list with search/filter/sort (GF-GRANT-002)
- Activity history logging (GF-ACTIVITY-001 — but FRs below note where activity hooks are required)
- Document attachment (GF-DOCUMENT-001)
- Tag assignment (GF-TAG-001)
- Grant duplication or templating
- Grant version history or change tracking (beyond activity log)
- Co-ownership (single owner for MVP)
- Grant archival policies beyond soft delete
- Recurring grant relationships

## 6. User Stories

- As a **grant professional**, I want to create a grant record so that I can track a funding opportunity.
- As a **grant professional**, I want to update a grant's lifecycle stage so that I know where it is in the process.
- As a **grant professional**, I want to track requested and awarded amounts so that I understand our funding pipeline.
- As a **grant professional**, I want to set a deadline so that I know when to submit.
- As a **grant professional**, I want to assign an owner so that responsibility is clear.
- As a **grant professional**, I want to add notes so that I can capture context and next steps.
- As a **grant professional**, I want to remove a grant (soft delete) so that closed or irrelevant records don't clutter my portfolio.

## 7. Functional Requirements

1. **Grant create** accepts: title (required), funderId (required, references existing funder), status (default: Research), amountRequested (optional, decimal), amountAwarded (optional, decimal), currency (default: USD), deadline (optional, date), decisionDate (optional, date), awardTimeframe (optional, text), designation (optional, text), countyServed (optional, text), nextSteps (optional, text), notes (optional, text), ownerId (optional, FK → User).
2. **Grant edit** updates any field. Save persists all changes.
3. **Lifecycle stage change** advances or regresses through the eleven stages. Default expectation is forward progression; regression is allowed but logged as activity.
4. **Stage enum values:** Research, Qualified, Planning, Writing, InternalReview, Submitted, Pending, Awarded, Declined, Reporting, Closed.
5. **Soft delete** sets `deletedAt` timestamp. Grants are excluded from active queries but preserved for historical reporting.
6. **Owner assignment** selects one user from the organization's membership list.
7. **Activity logging hooks** — The following mutations must write Activity entries (implementation detail: in the same transaction):
   - Grant created: `"grant_created"`
   - Status changed: `"status_changed"` (with old/new values)
   - Grant detail edited: `"grant_updated"`
   - Grant deleted: `"grant_deleted"`

## 8. Business Rules

1. Forward progression through lifecycle stages is the default, but regression and skipping are allowed. All transitions are logged.
2. `Closed` is terminal but not permanent — a grant may be re-opened.
3. `Declined` is typically terminal but may be re-opened for re-submission.
4. A grant must reference exactly one funder. Funder reassignment is allowed.
5. A grant may have zero or one owner. Co-ownership is post-MVP.
6. `amountRequested` and `amountAwarded` are independent — requested does not imply awarded.
7. `deadline` and `decisionDate` are calendar dates without time components.
8. All mutations that change grant data must write an Activity entry in the same transaction.

## 9. User Experience

- Grant creation is a form (slide-over or full page) with grouped fields per `context/design.md` §8.
- Lifecycle stage is a dropdown or stage-picker control showing all eleven stages with visual grouping.
- Owner selection uses a user dropdown filtered to org members.
- Financial fields use formatted currency input.
- Date fields use date picker or calendar input.
- Notes and next steps are textareas.
- Stage change is visually reflected throughout the app (badge color per status mapping).
- Save action shows progress and confirms success inline.

## 10. Data Requirements

**Grant entity** (per `context/database.md` §3):
- All fields listed in §7.1 above plus: `id` (UUID), `organizationId` (FK → Organization), `createdById` (FK → User), `createdAt`, `updatedAt`, `deletedAt`

**Activity entries** are created alongside grant mutations (see GF-ACTIVITY-001 for definition).

## 11. Permissions

| Role | Grant Access |
|---|---|
| **ADMIN** | Full CRUD including delete and stage changes |
| **MEMBER** | Create, read, update, stage changes; no delete |
| **VIEWER** | Read only |

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton or spinner during grant load |
| **Grant not found** | 404 or "Grant not found" with navigation back |
| **Create/edit form** | Field validation (inline + server), save in progress state |
| **Stage transition** | Confirmation for regression (going backward); success indicator for forward |
| **Delete confirmation** | Confirmation dialog explaining soft-delete and historical preservation |
| **Server error** | Error state with retry; preserve form values on validation failure |
| **Owner unassigned** | Show "Unassigned" badge or text |

## 13. Acceptance Criteria

- [ ] Grant can be created with all fields
- [ ] Grant can be edited, any field updated
- [ ] Lifecycle stage changes are functional for all eleven stages
- [ ] Stage transition logs activity entry with old/new values
- [ ] Amount fields support decimal values with proper formatting
- [ ] Date fields store calendar dates without time
- [ ] Owner assignment works from org member list
- [ ] Soft delete removes grant from active queries
- [ ] Activity is logged for create, edit, stage change, and delete

## 14. Dependencies

- GF-DATA-001 (Grant table, GrantStatus enum)
- GF-AUTH-001 (user session, org context, owner reference)
- GF-SHELL-001 (application shell)
- GF-FUNDER-001 (funder selection for grant creation)
- GF-ACTIVITY-001 (activity logging hooks)

**Resolved decisions:**
- **Grant semantics** — One Grant = one specific opportunity/application cycle. Repeated annual applications are distinct Grant records associated with the same Funder. Year is implicit in deadline/decision dates. No separate Opportunity entity.
- The project brief has been updated to reflect this resolution.

**Remaining unresolved decisions (do not block GF-GRANT-001):**
- Stage transition semantics — exactly which regression transitions should require user confirmation vs. proceed silently. MVP defaults: forward proceeds silently, regression shows a brief confirmation. Polish deferred.

## 15. Completion Criteria

- All acceptance criteria pass
- Grant CRUD works end-to-end
- All eleven lifecycle stages are functional and visually distinct
- Activity entries are created for all grant mutations
- Organization isolation verified

---

*Spec references: `context/database.md` §§3–5, `context/project-brief.md` §§9–10, `context/design.md` §§7–8*
