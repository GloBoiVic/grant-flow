# GF-EXPORT-001 — Data and Report Export

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-EXPORT-001 |
| **Phase** | Phase 3 — Post-MVP Portfolio Insights and Operational Enhancements |
| **Status** | Future |
| **Product Goal** | Enable users to export grant data and reports for external use |
| **MVP Classification** | Post-MVP |
| **Roadmap Link** | [Phase 3 — Post-MVP Portfolio Insights](../../roadmap.md#8-phase-3-post-mvp-portfolio-insights-and-operational-enhancements) |

---

## 1. Feature

Export capabilities for grant portfolio data and generated reports. Users can export the grant list, filtered views, and individual reports to CSV or PDF formats.

## 2. Purpose

Grant professionals need to share portfolio data with leadership, board members, and external stakeholders who do not use GrantFlow. Export provides the bridge between in-app data and external reporting needs.

## 3. User Outcome

Grant professionals can export the current grant list view (with active filters) as a CSV, or export a report as a PDF. Exported data reflects the live state of the portfolio.

## 4. Scope

- Grant list export to CSV (respects current filters and sort)
- Report export to PDF (per report type)
- Export action accessible from grant list toolbar and report views
- Server-generated export files
- Download via direct file response

## 5. Out of Scope

- Scheduled or automated exports
- Export templates or customizable export columns
- Bulk export of multiple reports
- Email delivery of exports
- Export of individual grant details as PDF
- Funder list export
- Activity history export
- Exports in formats other than CSV and PDF

## 6. User Stories

- As a **grant professional**, I want to export my grant list as a CSV so that I can share it with my team.
- As a **grant professional**, I want to export a report as a PDF so that I can include it in a board presentation.

## 7. Functional Requirements

1. **CSV export** — current grant list (respecting active filters and sort) exported as a CSV file with all visible columns.
2. **PDF export** — current report view exported as a formatted PDF document.
3. **Export action** — button in grant list toolbar ("Export CSV") and report view toolbar ("Export PDF").
4. **Server-side generation** — export files are generated server-side, not in the browser.
5. **Download** — file is returned as a download response (Content-Disposition: attachment).

## 8. Business Rules

1. CSV export respects organization isolation — only the current org's data is exported.
2. CSV export applies the same filters as the current view — the user exports what they see.
3. PDF export includes the report title, date range, and a generated timestamp.
4. Exports do not include soft-deleted grants.

## 9. User Experience

- Export button in toolbar: "Export CSV" for grant list, "Export PDF" for reports.
- Click triggers server-side generation and file download.
- Progress indicator if generation takes more than a few seconds.
- File downloads with a descriptive filename: `GrantFlow-Grants-2026-08-09.csv`.

## 10. Data Requirements

- Same data as the grant list or report queries, with org scope.
- No additional data persistence — exports are generated on demand.

## 11. Permissions

| Role | Export Access |
|---|---|
| **ADMIN** | Full export access |
| **MEMBER** | Export access (same scope as view) |
| **VIEWER** | Export access (same scope as view) |

## 12. States

| State | Behavior |
|---|---|
| **Ready** | Export button visible in toolbar |
| **Generating** | Loading indicator on export button |
| **Downloading** | File download initiated |
| **Error** | Error message with retry option |

## 13. Acceptance Criteria

- [ ] CSV export generates a valid CSV file with current grant list data
- [ ] CSV respects active filters
- [ ] PDF export generates a formatted PDF for reports
- [ ] Export is org-scoped
- [ ] Download works with descriptive filename

## 14. Dependencies

- GF-DATA-001 (data for export)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell)
- GF-GRANT-002 (grant list for CSV export)
- GF-REPORT-001 (reports for PDF export)

## 15. Completion Criteria

- All acceptance criteria pass
- CSV export works for any filtered grant list view
- PDF export works for any report view
- Files download correctly with proper naming

---

*Spec references: `context/project-brief.md` §13 (Reporting Philosophy - export)*
