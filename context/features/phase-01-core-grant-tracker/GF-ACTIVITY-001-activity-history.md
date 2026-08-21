# GF-ACTIVITY-001 — Activity History

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-ACTIVITY-001 |
| **Phase** | Phase 1 — Core Grant Tracker |
| **Status** | Planned |
| **Product Goal** | Record and display an append-only chronological log of meaningful events on grants and funders |
| **MVP Classification** | MVP Core |
| **Roadmap Link** | [Phase 1 — Core Grant Tracker](../../roadmap.md#6-phase-1-core-grant-tracker) |

---

## 1. Feature

An append-only chronological log that records meaningful mutations on grants and funders: creation, stage changes, edits, document uploads/deletions, and key updates. Activity entries are written in the same transaction as the originating mutation and are never updated or deleted.

## 2. Purpose

Spreadsheets lack a native audit trail — users rely on memory, email trails, and folder modification dates to understand what happened to a grant. GF-ACTIVITY-001 preserves institutional knowledge by automatically recording who did what and when. It is not event sourcing — no event replay or state reconstruction.

## 3. User Outcome

Grant professionals can see a timeline of everything that has happened to a grant or funder: when it was created, when the stage changed, when documents were uploaded, and who performed each action. This replaces lost institutional knowledge when staff leave.

## 4. Scope

- Activity entries written automatically during grant mutations (create, stage change, edit, delete)
- Activity entries written during document operations (upload, delete)
- Activity timeline displayed on grant detail page (GF-GRANT-003)
- Activity entries for funder create and edit (future: funder detail timeline)
- Dashboard recent activity feed (GF-DASH-001) — reference to the activity data
- Human-readable description generated at write time
- Structured metadata (JSONB) for machine-readable context
- Reverse chronological ordering with pagination

## 5. Out of Scope

- Event sourcing or state reconstruction from activity log
- Activity for tag changes, owner changes, or contact changes (post-MVP)
- User-configurable activity entry types
- Activity filtering beyond entity-scoped timeline
- Activity search or export
- Activity for CSV import operations (import has its own summary)
- Activity for view actions (only mutations are recorded)
- Before/after snapshot comparison (post-MVP audit trail enhancement)

## 6. User Stories

- As a **grant professional**, I want to see what has happened to a grant so that I understand its history without asking colleagues.
- As a **grant professional**, I want to see who made changes so that I know who to follow up with.
- As a **grant professional**, I want to see when the stage changed and what the previous stage was so that I can track progress.

## 7. Functional Requirements

1. **Activity entry creation** happens in same transaction as the originating mutation.
2. **Recorded actions:**
   - `"grant_created"` — grant created
   - `"status_changed"` — stage changed (metadata: previousStatus, newStatus)
   - `"grant_updated"` — grant detail edited
   - `"grant_deleted"` — grant soft-deleted
   - `"document_uploaded"` — document uploaded (metadata: documentName)
   - `"document_deleted"` — document deleted (metadata: documentName)
   - `"funder_created"` — funder created
   - `"funder_updated"` — funder details edited
3. **Description** is human-readable text generated at write time (e.g., "Jane Smith changed status from Writing to Submitted").
4. **Metadata** is optional JSONB for structured context (old/new values, document names, etc.).
5. **Actor** is recorded as the user who performed the action (nullable for system events).
6. **Scope** — activity is associated with grantId (for grant actions) or funderId (for funder actions). At least one must be set.
7. **Query** — activities fetched in reverse chronological order, scoped by organizationId and optionally grantId or funderId. Pagination limit: 50 per page.
8. **No updates or deletes** — activity entries are immutable once written.

## 8. Business Rules

1. Activity entries are written in the same Prisma transaction as the originating mutation. If the mutation fails, no activity entry is written.
2. Activity descriptions are generated at write time — not computed on read. This ensures historical descriptions don't change if display logic changes.
3. Activity entries are never deleted, even if the associated grant or funder is soft-deleted.
4. Activity entries for soft-deleted records remain visible for historical reference.

## 9. User Experience

- Activity timeline is a compact, reverse-chronological list on the grant detail page.
- Each entry shows: actor avatar/name, action description, relative timestamp ("2 hours ago", "3 days ago").
- Stage changes show a visual indicator of the transition (e.g., an arrow or badge showing old → new status).
- Document actions show the document name as a link.
- Timeline is scrollable with "Load more" pagination.
- No activity entry: Appears as an empty state on the grant detail page.

## 10. Data Requirements

**Activity entity** (per `context/database.md` §3):
- `id` (UUID), `organizationId` (FK → Organization), `grantId` (UUID?, FK → Grant), `funderId` (UUID?, FK → Funder), `action` (text), `description` (text), `metadata` (jsonb?), `actorId` (UUID?, FK → User), `createdAt` (timestamptz)

Indexes: `(organizationId, grantId, createdAt)`, `(organizationId, createdAt)`

## 11. Permissions

- All roles can view activity history (read-only data)
- Activity entries are created automatically by Server Actions — no user-facing write operations

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton timeline entries |
| **Normal** | Chronological activity list with entries |
| **Empty (no activity)** | "No activity recorded yet" message |
| **Paginated** | "Load more" button at bottom of initial set |

## 13. Acceptance Criteria

- [ ] Activity entry is created when a grant is created
- [ ] Activity entry is created when grant stage changes (with old/new values in metadata)
- [ ] Activity entry is created when grant details are edited
- [ ] Activity entry is created when grant is soft-deleted
- [ ] Activity entries are immutable (no update, no delete)
- [ ] Activity timeline displays on grant detail page in reverse chronological order
- [ ] Human-readable descriptions are accurate
- [ ] Actor information is displayed
- [ ] Pagination works (50 per page)

## 14. Dependencies

- GF-DATA-001 (Activity table)
- GF-AUTH-001 (user session, actor reference)
- GF-SHELL-001 (application shell)

**Note on activity as a capability contract:** GF-ACTIVITY-001 defines the Activity table schema, entry shape, and write pattern (same-transaction, immutable, append-only). Features that log activity (GF-GRANT-001, GF-DOCUMENT-001, etc.) depend on this **contract** — not on the full GF-ACTIVITY-001 feature (which includes the timeline UI). The contract can be established during Phase 1 and consumed by Phase 2 features without requiring the timeline UI first. This prevents GF-ACTIVITY-001 from becoming a blanket prerequisite for Phase 2.

**Resolved grant semantics:** Activity entries are associated with distinct Grant records. There is no separate Opportunity entity — each Grant record is a unique opportunity/cycle, and activity traces that record's lifecycle.

## 15. Completion Criteria

- All acceptance criteria pass
- Activity entries are verified as immutable (no API to update or delete)
- Activity timeline is integrated into grant detail page
- Activity is logged for all required mutation types
- Activity entries written in same transaction as originating mutation

---

*Spec references: `context/database.md` §11, `context/architecture.md` §6 (activity section), `context/project-brief.md` §11*
