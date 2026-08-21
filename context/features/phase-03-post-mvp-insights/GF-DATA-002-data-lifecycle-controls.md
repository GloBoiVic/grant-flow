# GF-DATA-002 — Data Lifecycle Controls

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-DATA-002 |
| **Phase** | Phase 3 — Post-MVP Portfolio Insights and Operational Enhancements |
| **Status** | Future |
| **Product Goal** | Provide data lifecycle management: archival, permanent deletion, and data portability controls |
| **MVP Classification** | Post-MVP |
| **Roadmap Link** | [Phase 3 — Post-MVP Portfolio Insights](../../roadmap.md#8-phase-3-post-mvp-portfolio-insights-and-operational-enhancements) |

---

## 1. Feature

Data lifecycle controls that go beyond the MVP soft-delete policy. Includes data archival (hiding old data without deleting), permanent deletion of records, full organization data export, and data retention policies.

## 2. Purpose

Organizations accumulate grant records over years. Without lifecycle management, the portfolio becomes cluttered with irrelevant records. Additionally, organizations may need to permanently delete data for compliance or export data when leaving the platform.

## 3. User Outcome

Grant professionals and admins can archive old grant records (hiding them from active views while preserving them), permanently delete records when needed, export all organization data, and configure data retention timelines.

## 4. Scope

- Grant archival: mark grants as archived (hidden from active views, accessible in archive)
- Permanent hard-delete: remove records permanently (with confirmation and consequences)
- Organization data export: downloadable archive of all org data (grants, funders, documents)
- Archived grants section (separate view)
- Bulk archive/unarchive actions
- Archival activity logging

## 5. Out of Scope

- Automated archival policies (archive after N months of inactivity — configurable)
- Granular retention policies per record type
- Data purge schedules (automated deletion after retention period)
- Legal hold or e-discovery capabilities
- Data import from other systems (GF-IMPORT-001 covers CSV import)
- Organization deletion (infrastructure-level operation)

## 6. User Stories

- As a **grant professional**, I want to archive closed grants so that my active portfolio is not cluttered.
- As an **admin**, I want to permanently delete obsolete records so that data is removed per our policy.
- As an **admin**, I want to export all organization data so that we have a backup or can migrate.
- As a **grant professional**, I want to view archived grants so that I can reference past records.

## 7. Functional Requirements

1. **Grant archival** — setting an `archived` flag on a grant. Archived grants are excluded from all active portfolio views, metrics, and reports.
2. **Archive view** — separate page or filter toggle showing archived grants.
3. **Unarchive** — restoring an archived grant to active status.
4. **Permanent hard-delete** — full deletion of a grant (and associated documents, activities, tags). Requires explicit confirmation and authorization (ADMIN only).
5. **Organization export** — generates a downloadable archive of all org data (JSON or CSV format). Includes grants, funders, contacts, documents (metadata — document files excluded due to storage).
6. **Bulk archive** — select and archive multiple grants at once.
7. **Activity logging** — archive, unarchive, and permanent delete actions are logged.

## 8. Business Rules

1. Archivng is reversible. Hard delete is irreversible.
2. Hard-deleted grants have all associated data removed (Documents, Activity entries — activity entries may be preserved as orphan records or also deleted; decision pending). **Contradiction note:** GF-ACTIVITY-001 §8.3 states "Activity entries are never deleted, even if the associated grant or funder is soft-deleted." Hard-delete behavior for activity entries is unresolved and contradicts the append-only contract. Resolution: if hard-delete is implemented, activity entries should be preserved as orphan records (retaining `grantId` for audit trail but excluded from active queries).
3. Archive status is independent of soft-delete status. A grant can be active, archived, soft-deleted, or hard-deleted.
4. Archived grants should appear in no active queries, metrics, or reports by default.
5. Permanent deletion requires ADMIN role and a two-step confirmation ("Type DELETE to confirm").
6. Organization export does not include document file content (too large; file metadata only).

## 9. User Experience

- Archive action: button on grant detail or bulk action in grant list. Confirmation dialog explaining that the grant will be hidden from active views.
- Archive view: toggle at top of grant list "Show archived grants" or a separate navigation item.
- Permanent delete: additional option in grant actions with explicit warning and confirmation.
- Organization export: button in settings/admin area. Generates file on demand; download notification when ready.

## 10. Data Requirements

**Grant entity addition:**
- `archivedAt` (timestamptz?) — nullable, set when archived, cleared when unarchived

**Activity entries** for archive/unarchive/hard-delete actions.

## 11. Permissions

| Role | Data Lifecycle Access |
|---|---|
| **ADMIN** | Archive, unarchive, permanent delete, organization export |
| **MEMBER** | Archive/unarchive own grants or grants they manage; no permanent delete |
| **VIEWER** | View archived grants (if visible); no mutation access |

## 12. States

| State | Behavior |
|---|---|
| **Grant active** | Normal behavior in all views |
| **Grant archived** | Hidden from active views; visible in archive view |
| **Grant hard-deleted** | Permanently removed; visible only in audit trail (if activity preserved) |
| **Bulk archive** | Progress indicator; count of grants archived |
| **Export generating** | Loading state; file download when ready |
| **Export ready** | Download link for the generated export file |

## 13. Acceptance Criteria

- [ ] Grants can be archived and unarchived
- [ ] Archived grants are excluded from active views
- [ ] Archive view displays archived grants
- [ ] Permanent hard-delete removes records (ADMIN only, with confirmation)
- [ ] Organization data export generates a downloadable archive
- [ ] Archive and delete actions are logged as activity
- [ ] Bulk archive works for multiple grants

## 14. Dependencies

- GF-DATA-001 (data persistence)
- GF-AUTH-001 (user session, ADMIN role enforcement)
- GF-SHELL-001 (application shell)
- GF-GRANT-001 (grant CRUD, archive integration)
- GF-GRANT-002 (grant list archive toggle)
- GF-ACTIVITY-001 (activity logging for lifecycle actions)

## 15. Completion Criteria

- All acceptance criteria pass
- Archive/unarchive workflow is verified end-to-end
- Permanent deletion removes data correctly
- Organization export produces a valid archive file
- Activity is logged for all lifecycle actions

---

*Spec references: `context/project-brief.md` §17 (Future Direction - Data retention/deletion), `context/database.md` §9 (Soft deletes)*
