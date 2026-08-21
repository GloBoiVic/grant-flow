# GF-IMPORT-001 — CSV Migration Workflow

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-IMPORT-001 |
| **Phase** | Phase 2 — Spreadsheet Replacement MVP |
| **Status** | Planned |
| **Product Goal** | Enable organizations to migrate grant data from existing spreadsheets into GrantFlow |
| **MVP Classification** | MVP Complete |
| **Roadmap Link** | [Phase 2 — Spreadsheet Replacement MVP](../../roadmap.md#7-phase-2-spreadsheet-replacement-mvp) |

---

## 1. Feature

A multi-step CSV import wizard that guides users through: uploading a CSV file, previewing and parsing structure, mapping spreadsheet columns to GrantFlow fields, reviewing data with validation feedback, and committing the import. Raw rows are stored in ImportStaging for error recovery and user review.

## 2. Purpose

Organizations migrating from spreadsheets have years of grant history in CSV/Excel files. Manual data entry is a barrier to adoption. GF-IMPORT-001 provides a structured import flow that maps spreadsheet columns to GrantFlow entities, handles ambiguous status values, detects duplicates, and produces clear error feedback.

## 3. User Outcome

Grant professionals can upload their existing grant spreadsheet, map columns to GrantFlow fields, review and fix issues, and import their entire grant history in minutes rather than hours of manual entry.

## 4. Scope

- CSV file upload (client-side file selection → Server Action)
- CSV parsing and structure validation (headers, row count, encoding)
- Column mapping step: user maps spreadsheet columns to GrantFlow fields (title, funder, status, deadline, amounts, etc.)
- Year-pattern column detection and splitting (e.g., "Requested Year 2024" and "Requested Year 2025" create separate Grant records per year)
- Data preview and validation (row-by-row errors, warnings, ambiguous statuses)
- Duplicate detection (existing grants matched by org + funder name + title + year)
- User resolution options: skip, update, import as new
- Transactional commit (batch writes with rollback on failure)
- Import summary report (grants created, skipped, errors)
- ImportStaging table for raw data and error recovery
- Sample data at `data/mock-grant-data.xlsx` as reference for column mapping

## 5. Out of Scope

- Excel (.xlsx) direct import (CSV only for MVP; .xlsx can be converted to CSV by user)
- Document import from spreadsheets (documents are added manually post-import)
- Tag import from spreadsheet columns (tags are created manually or post-MVP)
- Contact import from spreadsheets (contacts are managed manually within funders)
- Automated funder matching during column mapping (user identifies funder column)
- Scheduled/recurring imports
- Incremental import (importing only new/changed rows)
- Data transformation beyond column mapping and year splitting

## 6. User Stories

- As a **grant professional**, I want to upload my grant spreadsheet so that I can migrate my data to GrantFlow.
- As a **grant professional**, I want to map spreadsheet columns to GrantFlow fields so that data goes to the right places.
- As a **grant professional**, I want to see validation errors before importing so that I can fix issues.
- As a **grant professional**, I want GrantFlow to detect duplicate grants so that I don't create duplicates.
- As a **grant professional**, I want a summary of what was imported so that I know what succeeded.

## 7. Functional Requirements

1. **File upload** accepts .csv files. Validates file type and size (limit TBD, ~20MB).
2. **CSV parsing** reads headers and data rows. Detects encoding issues and malformed rows.
3. **Column mapping UI** shows spreadsheet headers and GrantFlow field options. User maps each column.
4. **Year-pattern detection** recognizes columns with year patterns (e.g., "Requested Year 2024", "Awarded Year 2025") and offers to split into separate Grant records per year.
5. **Data validation** per row:
   - Required fields: title, funder name (title derived from combined spreadsheet row data)
   - Monetary fields: parse as decimal
   - Date fields: parse as calendar dates
   - Status mapping: spreadsheet status values mapped to GrantStatus enum
   - `"To Apply"` and `"In Progress"` flagged for manual selection (ambiguous mapping)
6. **Duplicate detection** queries existing grants by org + funder name + title + year. User chooses per match: skip, update, or import as new.
7. **Transactional commit** wraps row creation in Prisma transactions. For large imports (>100 rows), batch in 50–100 row transactions.
8. **Write order:** Find/create Funders (dedup by name within org) → Create Grant records → Create Activity entries.
9. **Import summary** shows counts: total rows, imported, skipped, errors.
10. **ImportStaging cleanup** after successful import (hard-delete or archive after 30 days).

## 8. Business Rules

1. Import failure semantics: MVP behavior is per-batch rollback. If a batch fails, all rows in that batch fail. Post-MVP: row-level retry for files >500 rows.
2. Year-pattern columns are recognized by presence of a 4-digit year in the column name. User confirms or overrides.
3. Funder deduplication: if a funder with the same name exists in the org, use existing funder instead of creating a duplicate.
4. Duplicate grant detection: match on funder name + grant title + year. User decides on action per match.
5. Activity entries: one bulk activity entry per import ("Imported N grants from spreadsheet") rather than per-grant entries.
6. ImportStaging rows with `"error"` status are retained for retry. Rows with `"imported"` status are retained for audit.

## 9. User Experience

- Multi-step wizard: Upload → Map Columns → Review & Validate → Confirm → Summary
- Progress indicator showing current step and overall progress.
- Column mapping: dropdown for each spreadsheet header showing available GrantFlow fields.
- Year detection is suggested to user with option to confirm or adjust.
- Validation errors shown per row with original CSV row number, field name, problematic value, and fix suggestion.
- Status ambiguity: `"To Apply"` and `"In Progress"` shown with dropdown to select correct GrantFlow status.
- Duplicate detection: highlighted matches with action per row (skip, update, import as new).
- Import summary: clear success/failure counts, link to imported grants.
- Error recovery: user can fix errors and retry the upload.

## 10. Data Requirements

**ImportStaging entity** (per `context/database.md` §3):
- `id` (UUID), `organizationId` (FK → Organization), `importBatchId` (text), `rowIndex` (integer), `rawData` (jsonb), `mappedData` (jsonb?), `validationErrors` (jsonb?), `status` (text: pending/mapped/validated/imported/error), `createdAt`, `importedAt`

## 11. Permissions

| Role | Import Access |
|---|---|
| **ADMIN** | Full import access (upload, map, validate, commit) |
| **MEMBER** | Upload and preview; may need admin or require review before commit (TBD) |
| **VIEWER** | No import access |

## 12. States

| State | Behavior |
|---|---|
| **No import started** | Upload area with instructions, accepted file types, size limit |
| **Uploading** | Progress indicator |
| **Upload error** | Error message (invalid file, too large, malformed) with retry |
| **Column mapping** | Spreadsheet columns listed with GrantFlow field dropdowns |
| **Year detection** | Detected year patterns shown; user confirms or adjusts |
| **Validation in progress** | Progress bar |
| **Validation errors** | Error rows listed with details; user fixes and re-validates |
| **Duplicate preview** | Duplicate matches shown with action per row |
| **Committing** | Progress indicator; batch processing |
| **Commit success** | Summary report; link to imported grants |
| **Commit partial failure** | Failure summary with details; option to retry failed batches |

## 13. Acceptance Criteria

- [ ] CSV file upload works with validation
- [ ] Column mapping UI lets user map each spreadsheet column
- [ ] Year-pattern columns are detected and can be split into separate grant records
- [ ] Data validation reports row-level errors with field and value details
- [ ] Ambiguous statuses (To Apply, In Progress) are flagged for manual selection
- [ ] Duplicate detection finds existing grants by funder name + title + year
- [ ] User can choose to skip, update, or import as new for each duplicate
- [ ] Import commits successfully with correct write order
- [ ] Import summary shows clear counts
- [ ] ImportStaging stores raw data for error recovery
- [ ] The mock data at `data/mock-grant-data.xlsx` can be imported successfully

## 14. Dependencies

- GF-DATA-001 (Grant, Funder, ImportStaging tables)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell, navigation)
- GF-FUNDER-001 (funder deduplication during import)
- GF-GRANT-001 (grant creation during import)

**Remaining unresolved decisions (do not block GF-IMPORT-001 design):**
- Import failure semantics: batch rollback vs. row-level handling for large files. MVP defaults to batch rollback; row-level handling deferred.
- Status mapping: exact mapping for "In Progress" spreadsheet value (ambiguous among Planning/Writing/InternalReview). Users prompted to select during import.

## 15. Completion Criteria

- All acceptance criteria pass
- The provided mock data spreadsheet imports successfully
- Column mapping handles all 15 columns from the sample data
- Year-pattern splitting creates correct separate grant records
- Import summary is accurate and actionable
- Error recovery workflow works end-to-end

---

*Spec references: `context/database.md` §15, `context/architecture.md` §13, `context/project-brief.md` §12, `data/mock-grant-data.xlsx`*
