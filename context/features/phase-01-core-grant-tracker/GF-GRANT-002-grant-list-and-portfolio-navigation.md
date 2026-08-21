# GF-GRANT-002 — Grant List and Portfolio Navigation

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-GRANT-002 |
| **Phase** | Phase 1 — Core Grant Tracker |
| **Status** | Planned |
| **Product Goal** | Enable grant professionals to browse, search, filter, and sort their entire grant portfolio in a spreadsheet-replacement table |
| **MVP Classification** | MVP Core |
| **Roadmap Link** | [Phase 1 — Core Grant Tracker](../../roadmap.md#6-phase-1-core-grant-tracker) |

---

## 1. Feature

A centralized grant list view that serves as the primary portfolio browser. Features a data table with sortable columns, text search, status filter, tag filter, and sort controls. Filter state is persisted in URL search params, enabling shareable and bookmarkable views.

## 2. Purpose

Spreadsheets offer free-form sorting, filtering, and scanning. GF-GRANT-002 replaces this with a purpose-built grant table that is faster, more structured, and always consistent. It is the primary navigation surface for the grant portfolio.

## 3. User Outcome

Grant professionals can see all active grants in a compact table, search by keyword, filter by status and tags, sort by any column, and quickly open any grant for detail. The grant list answers "what grants exist and where are they in the lifecycle" at a glance.

## 4. Scope

- Grant table with columns: title, funder, status (badge), deadline, owner, amount requested, amount awarded, tags
- Sortable columns (click column header to sort asc/desc)
- Text search across grant title and funder name
- Status filter (multi-select from eleven lifecycle stages)
- Tag filter (multi-select from org tags)
- Active filter summary (shows which filters are applied)
- URL search param persistence for filter/sort state
- Pagination or incremental loading (MVP: pagination with configurable page size)
- Row click navigates to grant detail (GF-GRANT-003)
- Empty state for no grants vs. no filter matches

## 5. Out of Scope

- Advanced search (full-text search, field-specific search beyond title/funder)
- Saved searches or saved filter presets
- Bulk grant operations (select multiple, batch stage change, batch delete)
- Column customization (show/hide, reorder, resize)
- Export of grant list to CSV
- Grant list as a dashboard component (GF-DASH-001)
- Drag-and-drop reordering
- Inline editing within the table

## 6. User Stories

- As a **grant professional**, I want to see all my grants in a table so that I can scan my portfolio.
- As a **grant professional**, I want to search by grant title or funder name so that I can find specific grants.
- As a **grant professional**, I want to filter by status so that I can see only grants at a certain lifecycle stage.
- As a **grant professional**, I want to filter by tag so that I can see grants in a specific program area.
- As a **grant professional**, I want to sort by deadline so that I know what is due soonest.
- As a **grant professional**, I want to click a grant row so that I can view or edit its details.

## 7. Functional Requirements

1. **Grant table** renders with columns per §4.1. Each row represents one grant.
2. **Column sorting** — clicking a column header toggles ascending/descending sort. Default sort is by deadline ascending.
3. **Text search** — free-text input filters by grant title or funder name (case-insensitive contains match).
4. **Status filter** — multi-select dropdown or chip set showing all eleven status values. Grants matching any selected status are shown.
5. **Tag filter** — multi-select showing all org tags. Grants matching any selected tag are shown.
6. **Filter combination** — text search AND status filter AND tag filter work together (intersection of all criteria).
7. **URL persistence** — all filter and sort state is encoded in URL search params. Back/forward navigation preserves view state.
8. **Pagination** — results are paginated. Default page size: 50. Page controls at bottom of table.
9. **Row click** — navigates to grant detail route.
10. **Active grants only** — grants with `deletedAt: null` are shown.

## 8. Business Rules

1. Deleted grants are excluded from the grant list (unless an admin explicitly views deleted records — post-MVP).
2. Sort, filter, and search are applied server-side (Prisma queries with `WHERE`, `ORDER BY`, `LIKE`/`ILIKE`).
3. Filter state does not require user login to persist — it is in the URL, not in user preferences.
4. Pagination resets when filters change.

## 9. User Experience

- Table matches `screenshots/grants.png` — compact rows, status badges per `context/design.md` §7, aligned columns.
- Search input at top of table, auto-focusable, with clear button.
- Status filter as compact chips or multi-select dropdown.
- Tag filter as chip picker.
- Active filters shown as removable chips above the table.
- Column headers show sort direction indicator.
- Row hover highlight for interactivity.
- Loading: skeleton rows matching table geometry.
- Empty (no grants): "No grants in your portfolio. Create your first grant or import from a spreadsheet."
- Empty (no filter matches): "No grants match your search. Try adjusting your filters."

## 10. Data Requirements

- **Grant read query** joins across Grant, Funder, User (owner), Tag (via GrantTag)
- Fields needed per row: grant id, title, funder name, status, deadline, owner name, amountRequested, amountAwarded, tags (array of tag names/colors)
- Aggregation is done via Prisma `include` or `select` in a single query (avoid N+1)

## 11. Permissions

- All authenticated users can view the grant list scoped to their organization
- READ permission is the same for all roles; edit/delete is enforced at detail/action level

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton rows |
| **Empty (no grants)** | Explanatory empty state with "Create Grant" and "Import CSV" actions |
| **Empty (no filter matches)** | "No matching grants" with "Clear filters" action |
| **Normal** | Table with data rows |
| **Pagination (many pages)** | Page controls, page size indicator |
| **Sort active** | Sort indicator on column header |
| **Server error** | Error state with retry action |

## 13. Acceptance Criteria

- [ ] Grant table renders with all specified columns
- [ ] Text search filters by title and funder name
- [ ] Status filter works (multi-select)
- [ ] Tag filter works (multi-select)
- [ ] Filters combine correctly (intersection)
- [ ] Column sorting works for all sortable columns
- [ ] URL persistence: filters survive page reload and back/forward navigation
- [ ] Pagination works (page navigation, page size)
- [ ] Row click navigates to grant detail
- [ ] Empty states render correctly for both cases

## 14. Dependencies

- GF-DATA-001 (Grant, Funder, Tag, GrantTag tables with indexes)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell, navigation)
- GF-FUNDER-001 (funder data for funder name column)
- GF-GRANT-001 (grant records to populate the list)
- GF-TAG-001 (tag data for tag filter)

## 15. Completion Criteria

- All acceptance criteria pass
- Table matches `screenshots/grants.png`
- Filter/sort/search performs well (<200ms response for typical org data)
- Organization isolation verified
- URL state works correctly with browser navigation

---

**Unresolved decisions:**
- Responsive breakpoints (see [roadmap §14, Decision 6](../../roadmap.md#14-unresolved-decisions)). Grant table column visibility, density, and layout behavior across viewports depend on exact breakpoint values not yet finalized.

*Spec references: `context/database.md`, `context/design.md` §§6–7, `context/coding-standards.md` §4 (URL state over React state)*
