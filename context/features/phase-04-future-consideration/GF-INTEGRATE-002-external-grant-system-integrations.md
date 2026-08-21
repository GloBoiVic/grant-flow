# GF-INTEGRATE-002 — External Grant-System Integrations

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-INTEGRATE-002 |
| **Phase** | Phase 4 — Future Consideration |
| **Status** | Future |
| **Product Goal** | Integrate with external grant databases and government portals for opportunity discovery |
| **MVP Classification** | Future |
| **Roadmap Link** | [Phase 4 — Future Consideration](../../roadmap.md#9-phase-4-future-consideration) |

---

## 1. Feature

Integration with external grant search databases and government portals (e.g., Grants.gov, Foundation Directory Online) to discover grant opportunities and import them directly into GrantFlow.

## 2. Purpose

Grant professionals spend significant time searching for funding opportunities across multiple databases. Integration reduces duplicate data entry by allowing direct import of discovered opportunities.

## 3. User Outcome

Grant professionals can search for grant opportunities within GrantFlow (powered by external APIs) and import them as new grant records, pre-populated with funder and opportunity data.

## 4. Scope

- Integration with Grants.gov API (opportunity search and import)
- Integration with Foundation Directory Online or similar (if API available)
- Grant opportunity search within GrantFlow
- One-click import of external opportunities as new Grant records
- Funder auto-creation from external data

## 5. Out of Scope

- Automated opportunity matching or recommendations
- Bid-matching or predictive opportunity alerts
- Integration with all available grant databases
- AI-powered grant search
- External system credentials management UI

## 6. User Stories

- As a **grant professional**, I want to search for grant opportunities within GrantFlow so that I don't have to use external databases separately.
- As a **grant professional**, I want to import an opportunity as a new grant so that I don't have to manually enter data.

## 7. Functional Requirements

1. **External API integration** with at least one major grant database (Grants.gov priority).
2. **Opportunity search** — search field within GrantFlow that queries the external database and returns results.
3. **Result display** — opportunity title, funder, deadline, amount, description.
4. **Import action** — selected opportunity creates a new Grant record with pre-populated fields (title, funder, deadline, amount, description).
5. **Funder creation** — if the funder doesn't exist in the org's directory, create a new funder record from opportunity data.

## 8. Business Rules

1. Import respects organization isolation — created grants are scoped to the user's organization.
2. External API rate limits and terms of service are respected.
3. Duplicate detection: if a grant with the same external opportunity ID already exists, warn and skip.

## 9. User Experience

- "Find Opportunities" action in the grant list or a dedicated view.
- Search results display in a compact list with import action.
- Import shows a preview of what will be created before confirming.

## 10. Data Requirements

- External opportunity ID stored on Grant record (optional, for deduplication)
- Funder external data mapped to local Funder entity fields

## 11. Permissions

- All roles can search and view external opportunities
- ADMIN and MEMBER can import opportunities as new grants

## 12. States

| State | Behavior |
|---|---|
| **Search ready** | Search input with database source selector |
| **Searching** | Loading results |
| **Results** | List of matching opportunities |
| **No results** | "No opportunities found" |
| **Importing** | Creating grant from opportunity |
| **Import success** | "Grant created" with link to new grant |
| **Duplicates found** | Warning with option to skip |

## 13. Acceptance Criteria

- [ ] External opportunity search returns results
- [ ] Import creates a new Grant with pre-populated fields
- [ ] Funder is created if not found in directory
- [ ] Duplicate detection prevents creating the same opportunity twice

## 14. Dependencies

- GF-AUTH-001 (user session, org context)
- GF-FUNDER-001 (funder auto-creation)
- GF-GRANT-001 (grant creation)

## 15. Completion Criteria

- All acceptance criteria pass
- Integration works with at least one external database

---

*Spec references: `context/project-brief.md` §17 (Future Direction - External APIs)*
