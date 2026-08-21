# GF-FUNDER-002 — Funder Portfolio and History

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-FUNDER-002 |
| **Phase** | Phase 2 — Spreadsheet Replacement MVP |
| **Status** | Planned |
| **Product Goal** | Provide a funder-focused view showing the complete grant portfolio organized by funder relationship |
| **MVP Classification** | MVP Complete |
| **Roadmap Link** | [Phase 2 — Spreadsheet Replacement MVP](../../roadmap.md#7-phase-2-spreadsheet-replacement-mvp) |

---

## 1. Feature

A funder detail view that expands the funder directory (GF-FUNDER-001) with a comprehensive grant history. Shows all grants associated with a funder, organized by lifecycle stage, with financial totals and key metrics. Enables grant professionals to understand their complete relationship with each funder.

## 2. Purpose

Understanding the full history with a funder — what has been requested, awarded, declined, and is currently pending — is essential for strategy. Spreadsheets scatter this across rows. GF-FUNDER-002 consolidates it into a single view.

## 3. User Outcome

Grant professionals visiting a funder's page can see: all grants ever submitted to that funder, total requested and awarded amounts, active/pending grants, success rate with that funder, and a chronological view of the relationship.

## 4. Scope

- Funder detail page (full page, accessible from funder list)
- Grant history section: all grants associated with the funder, sortable and filterable
- Funder metrics: total grants, total requested, total awarded, success rate with this funder
- Active grants with this funder (grants in active lifecycle stages)
- Grant status distribution for this funder
- Grant list per funder: title, status, deadline, amount requested/awarded, year
- Row click opens grant detail drawer (GF-GRANT-003)
- Funder contacts section

## 5. Out of Scope

- **External funder accounts, portals, or funder-facing workflows** — GF-FUNDER-002 is an **internal GrantFlow view only**. Funders do not log in, manage accounts, or submit applications through GrantFlow.
- Funder performance analytics beyond basic aggregates (GF-REPORT-001)
- Funder comparison (side-by-side funder metrics)
- Funder activity timeline (activity entries for funder-level events — post-MVP)
- Funder document management (documents are per-grant)
- Funders without grants should still be viewable (shows empty grant history)
- Funders with deleted grants: deleted grants excluded from active metrics

## 6. User Stories

- As a **grant professional**, I want to see all grants for a specific funder so that I understand our full relationship.
- As a **grant professional**, I want to see how much we've requested and been awarded by a funder so that I can report on the relationship.
- As a **grant professional**, I want to see active grants with a funder so that I know what's in progress.
- As a **grant professional**, I want to see our success rate with a funder so that I can evaluate our strategy.

## 7. Functional Requirements

1. **Funder detail page** displays: funder name, type, website, notes, contacts list.
2. **Grant history table** shows all grants for this funder, ordered by deadline descending (most recent first).
3. **Grant history columns:** title, status badge, deadline, amount requested, amount awarded, owner, year (derived from deadline or award timeframe).
4. **Funder metrics:** total grant count, total requested (sum), total awarded (sum), success rate (awarded / (awarded + declined) for this funder).
5. **Active grants section** highlights grants currently in active lifecycle stages (Planning through Pending).
6. **Status distribution** shows count of grants per status for this funder.
7. **Soft-deleted grants** excluded from active metrics but may be visible in grant history with a "deleted" indicator.
8. **Contacts section** shows funder contacts with name, email, phone, title.

## 8. Business Rules

1. Funder metrics exclude soft-deleted grants.
2. Success rate formula: awarded / (awarded + declined) * 100 for grants associated with this funder.
3. Year is derived from the grant's deadline year or award timeframe text. If neither is available, year defaults to the grant's creation year.
4. If a funder has no grants, the grant history shows an empty state with guidance to create a grant.

## 9. User Experience

- Funder detail page accessible via clicking a funder row in the funder list (GF-FUNDER-001).
- Header: funder name, type badge, website link, edit action.
- Metrics row: compact cards showing total grants, total requested, total awarded, success rate.
- Grant history section uses the same table conventions as the grant list (GF-GRANT-002).
- Row click opens grant detail drawer.
- Contacts section: compact list with add/edit/delete actions.
- Empty grant history: "No grants yet for this funder. Create your first grant."
- The page matches a composite of `screenshots/funders.png` and grant detail conventions.

## 10. Data Requirements

- Funder query by id (with org scope)
- Grants query: all grants for funder, with status, amounts, owner, deadline
- Aggregate metrics: sum of amounts, count by status, success rate calculation
- Contacts for the funder

## 11. Permissions

| Role | Funder Detail Access |
|---|---|
| **ADMIN** | Full access; can edit funder, manage grants |
| **MEMBER** | Read funder detail; can create grants for this funder |
| **VIEWER** | Read only |

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton for funder info, metrics, grant list, contacts |
| **Normal** | Full funder detail with all sections |
| **Empty (no grants)** | "No grants yet for this funder" with "Create Grant" action |
| **Empty (no contacts)** | "No contacts yet" with "Add Contact" action |
| **Funder not found** | "Funder not found" with link back to funder list |
| **Error** | Error state with retry |

## 13. Acceptance Criteria

- [ ] Funder detail page renders with all funder fields
- [ ] Grant history shows all grants for the funder
- [ ] Funder metrics display correct totals and success rate
- [ ] Active grants section highlights in-progress grants
- [ ] Status distribution shows grant count per status
- [ ] Contacts section displays and supports add/edit/delete
- [ ] Row click in grant history opens grant detail drawer
- [ ] Empty states render for no grants and no contacts
- [ ] Soft-deleted grants are excluded from metrics

## 14. Dependencies

- GF-DATA-001 (Grant, Funder, FunderContact tables)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell)
- GF-FUNDER-001 (funder data and edit capability)
- GF-GRANT-001 (grant data for history — each distinct Grant record associated with the funder is a separate row)
- GF-GRANT-003 (drawer for grant detail)
- GF-ACTIVITY-001 (activity data if displayed on funder page — optional for MVP)

## 15. Completion Criteria

- All acceptance criteria pass
- Funder detail page provides complete grant history view
- Metrics are accurate and scoped to funder + org
- Navigation from funder detail to grant detail works via drawer
- Funder detail is a natural extension of the funder directory

---

*Spec references: `context/database.md` §3 (Funder entity, grant relationship), `context/project-brief.md` §8 (Funder Management), `screenshots/funders.png`*
