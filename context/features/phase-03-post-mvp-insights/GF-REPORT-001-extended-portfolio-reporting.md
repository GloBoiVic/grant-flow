# GF-REPORT-001 — Extended Portfolio Reporting

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-REPORT-001 |
| **Phase** | Phase 3 — Post-MVP Portfolio Insights and Operational Enhancements |
| **Status** | Future |
| **Product Goal** | Enable grant professionals and leadership to generate portfolio reports from existing grant data |
| **MVP Classification** | Post-MVP |
| **Roadmap Link** | [Phase 3 — Post-MVP Portfolio Insights](../../roadmap.md#8-phase-3-post-mvp-portfolio-insights-and-operational-enhancements) |

---

## 1. Feature

Extended portfolio reporting views that derive insights from existing grant data without requiring manual re-entry. Reports include funder performance analysis, award trends over time, status distribution, program area (tag) analysis, and funding pipeline summaries.

## 2. Purpose

Grant professionals currently recreate reports in spreadsheets for leadership and board meetings. GF-REPORT-001 generates these reports from live grant data, eliminating manual work and ensuring accuracy.

## 3. User Outcome

Grant professionals and fund development directors can view portfolio reports — funder performance, award trends, status distribution, program area analysis — filtered by date ranges and program areas, without exporting data to spreadsheets.

## 4. Scope

- Funder performance report: total requested/awarded per funder, success rate, grant count
- Award trend report: awarded amounts over time (by year/quarter)
- Status distribution report: grants grouped by lifecycle stage with amounts
- Program area (tag) analysis: grants and amounts by tag
- Funding pipeline summary: potential pipeline value by stage
- Date range filtering (all reports)
- Tag/program area filtering (where applicable)
- In-app presentation as read-only views

## 5. Out of Scope

- Custom report builder or drag-and-drop report designer
- Scheduled report generation or delivery
- Report dashboards with multiple charts
- PDF report generation (GF-EXPORT-001)
- Trend forecasting or predictive analytics
- Benchmarking against external data
- Report templates or saved report configurations

## 6. User Stories

- As a **fund development director**, I want to see funder performance so that I can evaluate funder relationships.
- As a **fund development director**, I want to see award trends over time so that I can report on growth.
- As a **grant professional**, I want to see status distribution so that I understand portfolio composition.
- As a **grant professional**, I want to analyze grants by program area (tag) so that I can see funding per area.

## 7. Functional Requirements

1. **Funder performance report:** lists all funders with grant count, total requested, total awarded, success rate. Sortable by any column.
2. **Award trend report:** aggregates awarded amounts by year and/or quarter. Shows year-over-year comparison.
3. **Status distribution report:** grants grouped by lifecycle stage with grant count and total amounts per stage.
4. **Tag analysis report:** grants grouped by tag with count and total amounts per tag.
5. **Date range filter:** all reports filterable by date (deadline year, creation date, decision date).
6. **Tag filter:** tag analysis can be filtered by selected tags.
7. **All reports** are read-only views generated from live Prisma aggregate queries.

## 8. Business Rules

1. All reports are scoped to the current organization.
2. Soft-deleted grants are excluded from all reports.
3. Reports are generated from live data — no materialized views or caching for initial release.
4. Monetary amounts are in the grant's currency. Multi-currency conversion is not performed — amounts are shown in the source currency with the currency label.
5. Date range defaults to "All time" unless specified.

## 9. User Experience

- Reports accessed from a "Reports" navigation item (added to sidebar post-MVP).
- Report list shows available report types. Selecting a type opens the report view.
- Each report has filter controls at the top (date range, tag selector as applicable).
- Data is presented in tables with sortable columns. No charts for initial release.
- Empty data: "No data available for this report" with guidance to add grants.
- Loading state: skeleton for report table.

## 10. Data Requirements

- Aggregate queries on Grant, Funder, Tag tables via Prisma `aggregate`, `groupBy`, `count`
- All queries scoped by `organizationId`

## 11. Permissions

| Role | Report Access |
|---|---|
| **ADMIN** | Full access to all reports |
| **MEMBER** | Access to all reports |
| **VIEWER** | Access to all reports (read-only) |

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton table for report data |
| **Normal** | Report table with data |
| **Empty (no data)** | "No data available" with guidance |
| **Filtered** | Report data scoped to filter criteria |
| **No filter matches** | "No data matches your filters" with clear filter action |

## 13. Acceptance Criteria

- [ ] Funder performance report displays all funders with metrics
- [ ] Award trend report shows amounts by year/quarter
- [ ] Status distribution report groups grants by lifecycle stage
- [ ] Tag analysis report groups grants by tag
- [ ] Date range filtering works for all reports
- [ ] All reports are org-scoped
- [ ] Reports are read-only, generated live from grant data

## 14. Dependencies

- GF-DATA-001 (Grant, Funder, Tag tables with proper indexes for aggregates)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell, sidebar navigation addition)
- GF-FUNDER-001 (funder data)
- GF-GRANT-001 (grant data)
- GF-TAG-001 (tag data for program area analysis)

## 15. Completion Criteria

- All acceptance criteria pass
- Reports are accessible from navigation
- Filter controls work correctly
- Aggregate queries perform acceptably (<500ms for typical org data)

---

**Resolved decisions:**
- **Grant semantics** — One Grant = one specific opportunity/application cycle. Repeated annual submissions are distinct Grant records for the same Funder. Report aggregations (funder performance, award trends, status distribution) operate on distinct grant records.

*Spec references: `context/project-brief.md` §13 (Reporting Philosophy), `context/architecture.md` §12*
