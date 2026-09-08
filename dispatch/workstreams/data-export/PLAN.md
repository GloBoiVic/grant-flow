# SoloFlow Plan - Data Export

Status: COMPLETE
Classification: Feature
Workstream: data-export
Base branch: main
Base SHA: da091e584e0973a8e4d113bef5d0ef97e56921d9
Execution branch: solo/data-export
Approval: Human Safari export confirmed; explicit commit, merge, Git End, and GitHub push approval received
Phase: COMPLETE
Task state: T001 DONE; T002 DONE
Validation state: Validation PASS; review PASS; human Safari export confirmed
Architecture status: Not required; this is a bounded authenticated download using one self-authorizing server-only query and one pure CSV serializer. No new persistence model, migration, export framework, cache layer, public API, or reporting architecture is expected.
Next action: None; merged to main and pushed to origin. The local execution branch is safe to remove.

## Outcome

Give an authenticated grant professional a reliable Work-Ready v0 escape hatch from GrantFlow: one downloadable CSV containing the organization's current non-deleted Grant portfolio and the related Funder information maintained alongside those Grants.

This is data export, not document export, database backup, round-trip restore, or reporting.

The export represents the canonical current Grant portfolio rather than the currently filtered or paginated `/grants` view, so maintaining a parallel tracking spreadsheet is not required for portability.

## Inspection Findings

- `main` is at `da091e584e0973a8e4d113bef5d0ef97e56921d9` (`da091e5`). Solo inspection recorded the local worktree as clean and matching `origin/main`. No execution branch has been created.
- `dispatch/ACTIVE.md` remains clear during this planning gate and records `No active workstream.` The `data-export` workstream does not become active until explicit developer approval and GIT START.
- `PRODUCT.md` defines GrantFlow as the source of truth for the active Grant portfolio and Grant-specific work and distinguishes structured product data from future Word/PDF interchange formats. A Grant-centered structured export supports that boundary without becoming document export or reporting.
- The Prisma schema already contains all required persisted fields. `Grant` has title, status, currency, requested/awarded amounts, deadline, decision date, award timeframe, designation, county served, next steps, notes, and soft-delete state. `Funder` has name, type, website, notes, county served, and soft-delete state. `Tag` and `GrantTag` provide organization-local tag assignments.
- Existing Grant/Funder query serializers already establish the relevant semantic contracts: Decimal amounts become strings, date-only values become `YYYY-MM-DD`, persisted `InternalReview` becomes `Internal Review`, and Funder/Tag values are serialized without exposing Prisma objects.
- `serializeDate()` already provides the accepted UTC-safe `YYYY-MM-DD` date-only conversion. The export should reuse that semantic rather than introducing locale formatting.
- Existing Grant query behavior defines an “active” domain record as `deletedAt: null`; it does not mean a particular lifecycle status. The export must therefore include every non-deleted Grant regardless of status, including Submitted, Awarded, Declined, Reporting, and Closed.
- `listGrants()` is organization-scoped and excludes deleted Grants and deleted/mismatched Funders, but it is a paginated live view capped by `GRANT_LIST_PAGE_SIZE` and has user-controlled filters/sort. It is not the export query.
- The current Grant query already demonstrates Prisma nulls-last ordering, same-organization Funder predicates, active Tag predicates, and nested Tag ordering patterns that the export can follow without changing existing list behavior.
- `getGrant()` and the Grant action nested Funder selects now include the complete maintained Funder contract, including Funder Notes and County served. Export can select the corresponding server fields directly without widening client DTOs.
- Funder Maintenance completed the shared `FunderDto` with Name, Type, Website, County served, Notes, and timestamps. No Funder DTO change is needed for export.
- Portfolio Import remains XLSX-only. Its source `Notes` and `County Served` columns remain Grant fields, and imported Funders intentionally do not inherit those values. Export does not alter that import contract and is not promised to be directly re-importable by the current importer.
- `package.json` already contains the official SheetJS `xlsx` package used for import, but the approved export is deliberately one flat Grant table. CSV is smaller than generating a workbook, requires no new dependency, and keeps quoting and spreadsheet-formula safety explicit.
- There is no existing export/download implementation that should be reused.
- Current reads conventionally own their authorization seam themselves: `listGrants()`, `getGrant()`, and `listFunders()` call `requireAuthorization()` internally rather than accepting an organization ID.
- The export query should follow that same convention. It calls `requireAuthorization()` itself and performs the organization-scoped Prisma read. The Route Handler calls that self-authorizing query and catches `AuthorizationError`; it must not separately call `requireAuthorization()` and perform the same authorization lookup twice.
- The React route groups `(authenticated)` and `(org-required)` organize the filesystem and do not replace Route Handler authorization. The export execution path must remain self-authorizing even though the handler lives under those groups.
- `src/proxy.ts` protects non-public extensionless application routes with Clerk, but its static-file matcher intentionally excludes paths ending in `.csv`. Therefore the browser route should remain extensionless as `/export/portfolio`; the `.csv` extension belongs only in `Content-Disposition`.
- Proxy protection is defense in depth. The self-authorizing export query remains the tenant boundary even if proxy matching changes.
- Existing unauthenticated browser requests may be handled by Clerk proxy protection before the Route Handler executes. If the handler is reached and its self-authorizing query throws `AuthorizationError`, the handler returns the frozen generic 401 response. This workstream does not change existing Clerk redirect/protection behavior.
- Current Next.js Route Handlers use standard Web `Request`/`Response` APIs and are appropriate for a native attachment response. No Server Action/Blob client pipeline is needed.
- The current `/grants` page is a client surface with a compact header action area, URL-backed filters, and fixed pagination. It is the appropriate place for one portfolio-wide download action.
- `Button` already supports the `asChild` pattern, so the export can remain a native anchor styled consistently with existing GrantFlow buttons.
- The post-Funder-Maintenance baseline is 279 tests passed and 0 skipped with PostgreSQL integration enabled.
- Planning does not rerun tests, lint, TypeScript, Prisma verification, or production build.
- Relevant specialist guidance loaded for this plan: `solo-flow`, `frontend-design`, `web-design-guidelines`, and `vercel-react-best-practices`. Existing GrantFlow tokens and `screenshots/grants.png` remain the visual authorities.

## Scope

### In Scope

- Add one authenticated `GET /export/portfolio` Route Handler at `src/app/(authenticated)/(org-required)/export/portfolio/route.ts` for direct browser download.
- Keep the browser URL extensionless so it remains covered by the current Clerk proxy matcher. The downloaded filename carries the `.csv` extension.
- Add one self-authorizing server-only export query that loads the complete non-deleted Grant portfolio in one organization-scoped Prisma read without pagination or user-supplied filtering.
- Add one small pure CSV serializer with a frozen column order and explicit safety rules.
- Export one row per non-deleted Grant whose related Funder is also non-deleted and belongs to the authorized organization.
- Include Grants in every lifecycle status. “Active” in this contract means not soft-deleted, not a status subset.
- Include the related Funder's maintained Name, Type, Website, County served, and Notes as columns on each included Grant row.
- Include every maintained/user-facing Grant record field required for the current portfolio: title, status, currency, requested amount, awarded amount, deadline, decision date, award timeframe, designation, county served, next steps, notes, and tags.
- Use human-readable Grant status and Funder type values.
- Preserve the stored Grant currency value without adding or implying new currency-selection behavior. The current product contract remains USD-focused.
- Preserve nullable values as blank cells.
- Keep the current Portfolio Import field contract unchanged.
- Add one visible `Export portfolio` action in the existing `/grants` header beside `Add grant`.
- Do not propagate current list search/filter/sort/page parameters to the download.
- Add focused serializer, query, Route Handler, PostgreSQL isolation, and Grants UI coverage.
- Run normal Node 26 validation gates after approval and BUILD.
- Stop after BUILD → VALIDATE → REVIEW at `READY_FOR_USER` for explicit Safari Technology Preview human download/file inspection approval.

### Explicitly Out of Scope

- XLSX generation, DOCX export, PDF export, Grant Draft export, document/file export, or a multi-sheet workbook.
- Activity export, Activity report builder, revision history export, analytics, dashboard changes, or reporting infrastructure.
- A complete database/account backup or round-trip restore format.
- Making this CSV directly compatible with the current Portfolio Import format.
- A Funder-only export row, standalone Funder CSV, separate Funder sheet/file, relational export bundle, or fake Grant rows for unlinked Funders.
- Exporting non-deleted Funders that have no included non-deleted Grant in this portfolio file.
- Exporting unused Tags that are not assigned to an included Grant.
- Exporting soft-deleted Grants, soft-deleted Funders, mismatched Grant/Funder relations, soft-deleted Tags, or cross-organization Tag assignments.
- Client-provided organization IDs, filters, sort values, Grant IDs, Funder IDs, Clerk identifiers, owner/creator identifiers, authorization metadata, secrets, timestamps, or deletion metadata in the file.
- A configurable report builder, column-selection UI, export-only filters, saved reports, scheduled exports, email delivery, cloud storage, backup service, or public API.
- Changes to Portfolio Import, import mappings, import limits, Grant/Funder DTO contracts, schema, migrations, indexes, or persisted data models unless BUILD discovers a genuine defect that requires returning to PLAN.

## Frozen Export Contract

### Format, Route, and File

- Format: UTF-8 CSV with a UTF-8 BOM for spreadsheet applications that may otherwise misread non-ASCII text.
- CSV records use `CRLF` (`\r\n`) row endings.
- Every header and data cell is CSV-quoted.
- Embedded `"` characters are escaped as `""`.
- Route: `GET /export/portfolio`.
- The UI emits exactly `/export/portfolio`.
- No query parameter influences organization scope, record inclusion, sorting, or output.
- If query parameters are manually appended to the URL, the handler ignores them rather than treating them as export authority.
- Success response headers:
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="grantflow-portfolio-YYYY-MM-DD.csv"`
  - `Cache-Control: private, no-store`
  - `X-Content-Type-Options: nosniff`
- The filename date is the current UTC calendar date.
- Reuse the existing UTC date-only semantic, such as `formatUtcDate(utcToday())`, or an equivalently bounded current-UTC implementation. Do not introduce locale-derived filename dates.
- Filename convention is exactly `grantflow-portfolio-YYYY-MM-DD.csv`.
- The filename contains no organization name, user name, database ID, or client-provided text.
- A successful empty portfolio returns the normal fixed header row only, with no fabricated data row.
- Empty portfolio remains a successful `200` attachment, not `204`.
- If the self-authorizing export query throws `AuthorizationError` and the handler receives it, the handler returns:
  - status `401`
  - `Content-Type: text/plain; charset=utf-8`
  - `Cache-Control: private, no-store`
  - `X-Content-Type-Options: nosniff`
  - body `Unable to export this portfolio.`
  - no attachment header
- Existing Clerk proxy behavior may handle an unauthenticated browser request before the handler; this workstream does not replace that behavior.
- Unexpected export failure returns:
  - status `500`
  - `Content-Type: text/plain; charset=utf-8`
  - `Cache-Control: private, no-store`
  - `X-Content-Type-Options: nosniff`
  - body `We could not export this portfolio. Please try again.`
  - no attachment header
- Query and serialization complete before the successful attachment `Response` is constructed, so a failure never produces a partial CSV.
- Unsupported HTTP methods use normal Route Handler behavior and are not part of the UI contract.
- Do not add a `.csv` URL route because the current proxy matcher excludes static-looking `.csv` paths.

### Exact Columns and Stable Order

The first row contains these exact column names in this exact order.

Every data row has exactly 18 cells in the same order.

| Order | Column                 | Source and representation                                                          |
| ----: | ---------------------- | ---------------------------------------------------------------------------------- |
|     1 | `Grant title`          | `Grant.title`, preserved as maintained text                                        |
|     2 | `Funder name`          | Related non-deleted same-organization `Funder.name`                                |
|     3 | `Funder type`          | `Foundation`, `Family Fund`, `Corporation`, or `Other`                             |
|     4 | `Funder website`       | Related Funder Website; blank when null                                            |
|     5 | `Funder county served` | Related Funder County served; blank when null                                      |
|     6 | `Funder notes`         | Related Funder Notes; blank when null; stored line breaks preserved                |
|     7 | `Status`               | Existing human-readable Grant status, including `Internal Review`                  |
|     8 | `Amount requested`     | Exact decimal text with two fractional digits, no symbol/grouping; blank when null |
|     9 | `Amount awarded`       | Same exact decimal contract                                                        |
|    10 | `Currency`             | Stored Grant currency value; no currency expansion or conversion                   |
|    11 | `Deadline`             | `YYYY-MM-DD`; blank when null                                                      |
|    12 | `Decision date`        | `YYYY-MM-DD`; blank when null                                                      |
|    13 | `Award timeframe`      | Grant Award timeframe; blank when null                                             |
|    14 | `Designation`          | Grant Designation; blank when null                                                 |
|    15 | `County served`        | Grant County served; blank when null                                               |
|    16 | `Next steps`           | Grant Next steps; blank when null; stored line breaks preserved                    |
|    17 | `Notes`                | Grant Notes; blank when null; stored line breaks preserved                         |
|    18 | `Tags`                 | JSON array of active assigned Tag names in deterministic order; `[]` when none     |

No internal database IDs are emitted.

Grant/Tag IDs may be used internally as hidden database sort tie-breakers if needed, but must not appear in the export row contract or CSV.

The absence of IDs is intentional: this is a human-portable portfolio escape hatch, not a round-trip database backup or re-import contract.

### Inclusion and Ordering

- The export query itself calls `requireAuthorization()` exactly once for the export execution path.
- It obtains the organization ID only from the authenticated local User.
- It accepts no organization ID argument from the Route Handler or browser.
- Grant inclusion predicate:
  - `Grant.organizationId = authorized organizationId`
  - `Grant.deletedAt IS NULL`
  - related Funder has `organizationId = authorized organizationId`
  - related Funder has `deletedAt IS NULL`
- No lifecycle status is excluded.
- Research, Qualified, Planning, Writing, Internal Review, Submitted, Pending, Awarded, Declined, Reporting, and Closed Grants are all eligible when non-deleted.
- Tag inclusion predicate:
  - related Tag has `organizationId = authorized organizationId`
  - related Tag has `deletedAt IS NULL`
- One row is emitted for every included Grant regardless of current `/grants`:
  - page
  - search
  - status filter
  - Tag filter
  - displayed sort
  - selected Sheet
  - create state
- The query has no `skip`, `take`, client filter, or client sort input.
- Stable Grant row order is:
  1. `Grant.deadline ASC NULLS LAST`
  2. related `Funder.name ASC`
  3. `Grant.title ASC`
  4. `Grant.id ASC` as hidden final tie-breaker
- Stable Tag order is:
  1. `Tag.name ASC`
  2. `Tag.id ASC` as hidden tie-breaker
- Tag IDs are never emitted.
- Funder Notes and Funder County served are repeated on every related Grant row because the export is deliberately a flat Grant portfolio.
- A non-deleted Funder with no included Grant has no row in this file.
- This is an explicit scope decision, not an accidental query omission. A full Funder/account backup is not part of this Work-Ready v0 portfolio-export slice.

### Cell and Safety Semantics

- Null values become empty CSV cells, not:
  - `null`
  - `N/A`
  - dash
  - zero
  - fake dates
  - placeholder prose
- Since every cell is quoted, a blank data cell serializes as `""`.
- Amounts are formatted without converting through JavaScript `Number`.
- Use the database Decimal's exact representation and produce two fractional digits, e.g. `100.00`, `0.00`.
- The server-only export query should convert Decimal instances into exact strings before returning its internal export rows.
- The pure CSV serializer must not receive Prisma Decimal objects.
- Date-only values use the existing `YYYY-MM-DD` serialization semantic.
- The server-only export query converts Date instances into strings before handing rows to the pure serializer.
- The pure serializer must not receive `Date` instances.
- Status is converted to the existing display vocabulary before CSV output.
- `InternalReview` must never appear in the CSV; it becomes `Internal Review`.
- Funder Type uses the current display vocabulary rather than raw Prisma enum tokens.
- Stored currency is emitted as stored without conversion or validation expansion.
- Funder Notes, Grant Notes, and Next steps preserve stored line breaks inside their quoted CSV cells.
- Do not flatten, truncate, or replace working-content line breaks.
- CSV quoting happens after textual safety normalization.
- Spreadsheet formula injection is treated as a real safety concern for user-controlled textual cells.
- Before CSV quoting, if the first non-whitespace character of a user-controlled textual cell is:
  - `=`
  - `+`
  - `-`
  - `@`
    then prefix the exported textual representation with a single apostrophe.
- The formula guard applies to user-controlled text such as:
  - Grant title
  - Funder text
  - Website
  - Funder Notes
  - Funder County served
  - Award timeframe
  - Designation
  - County served
  - Next steps
  - Grant Notes
- The deterministic Tags JSON cell may pass through the same guard helper; its normal serialized representation begins with `[` and therefore remains unchanged.
- Generated structured values such as fixed headers, human-readable enum labels, exact amounts, currency, and generated ISO dates are not treated as user-authored spreadsheet formulas.
- Formula guarding intentionally changes the raw exported representation of suspicious formula-looking text by adding the safety apostrophe.
- Ordinary text is preserved.
- No formula cell is generated.
- Fixed headers are not user-controlled and are not formula-guarded.

## Authorization and Failure Contract

- Authorization occurs once in the self-authorizing server-only export query through `requireAuthorization()`.
- Do not call `requireAuthorization()` once in the Route Handler and again inside the query.
- The export query follows the same authorization ownership pattern as the existing Grant/Funder query modules.
- The Route Handler does not accept an organization ID and does not derive organization scope from:
  - URL
  - search parameters
  - request body
  - headers
  - client state
- The Route Handler calls the self-authorizing query, serializes its returned plain rows, and catches `AuthorizationError` for the generic handler-level 401 contract.
- Clerk proxy continues to protect the extensionless route as an outer authentication layer.
- The query's local-user authorization remains authoritative for tenancy even if proxy behavior changes.
- The export query scopes:
  - Grant
  - related Funder
  - assigned Tags
    to the same authorized organization and active/non-deleted state.
- No Activity, Document, FunderContact, User, Organization, Clerk, ownership, actor, or authorization relation is selected for export.
- No export result is cached as a public/shared response.
- No export snapshot/history is persisted.
- No export data is logged as part of ordinary error handling.
- Generic error responses contain no:
  - tenant-existence details
  - record IDs
  - Prisma/database details
  - Clerk details
  - partial CSV content
- Existing proxy handling may intercept unauthenticated browser requests before the Route Handler. Handler-level tests should still prove its own safe `AuthorizationError` response contract.

## Implementation Seams

### Server Query and Serializer

- Add one focused server-only query module, expected at `src/lib/queries/portfolio-export.ts`.
- The query calls `requireAuthorization()` and performs the single Prisma portfolio read.
- It selects only fields required by the frozen export plus any hidden IDs strictly required for deterministic ordering.
- It returns a small internal plain export-row contract containing only:
  - strings
  - `null`
  - deterministic Tag-name arrays
- It does not return:
  - Prisma Decimal objects
  - Date objects
  - client DTOs
  - ownership metadata
- Reuse the existing date-only semantic from `serializeDate()` or an equivalently bounded helper.
- Convert amounts exactly to two-decimal strings server-side without JavaScript `Number`.
- Convert `InternalReview` to `Internal Review` using the established display vocabulary.
- Convert Funder Type to existing human-readable labels without creating a generalized enum-display framework.
- Keep existing `GrantDto` and `FunderDto` unchanged.
- Add one focused pure serializer, expected at `src/lib/export/portfolio-csv.ts`.
- The pure serializer owns:
  - exact header contract
  - row-to-cell mapping
  - Tags JSON representation
  - formula guard
  - CSV quoting
  - BOM
  - CRLF record boundaries
- It must be testable without Prisma, Clerk, or Next.js.
- Add the Route Handler at `src/app/(authenticated)/(org-required)/export/portfolio/route.ts`.
- The handler composes:
  - self-authorizing query
  - pure serializer
  - safe attachment response
- Do not add a second authorization lookup in the handler.
- Do not add:
  - export base class
  - generic report interface
  - workbook abstraction
  - streaming infrastructure
  - client Blob pipeline
  - public API package
  - persisted export job
- Current portfolio size and Work-Ready single-user/small-team scope do not warrant streaming infrastructure.

### Grants Surface

- Add one native `<a>` styled with the existing `Button asChild` pattern and `outline` variant in the `/grants` header beside `Add grant`.
- Visible text is exactly `Export portfolio`.
- The control's accessible description/name or restrained tooltip/title should make clear that it downloads the current non-deleted Grant portfolio and related Funder information as CSV without adding persistent explanatory UI clutter.
- Target is exactly `/export/portfolio`.
- Do not append:
  - `q`
  - status
  - Tag
  - sort
  - direction
  - page
  - selected Grant
  - create state
- The export control remains available when the visible Grant list is empty, including when filters produce an empty page.
- It also remains available when the organization has no Grants so the header-only CSV contract can be downloaded.
- Use browser-native navigation/download behavior and server `Content-Disposition`.
- Do not use `fetch()`, `Blob`, object URLs, download state stores, or client-side CSV generation.
- Keep the action semantic, keyboard accessible, focus-visible, responsive, and visually consistent with the existing header.
- Do not add a new navigation item, settings page, reporting page, or export menu for one file.
- Direct-route generic error responses are the bounded failure behavior. Do not show a fake success toast before a file is received.

## Proposed Task Breakdown After Approval

Tasks must not be created until explicit developer approval and GIT START.

### T001 - Scoped CSV Contract, Query, and Download Route

- Implement the self-authorizing server-only export query.
- Preserve exact:
  - organization scope
  - non-deleted Grant predicate
  - active same-organization Funder predicate
  - active same-organization Tag predicate
  - all-status inclusion
  - stable ordering
- Convert Prisma Decimal/Date values into the internal plain export-row contract before the pure serializer boundary.
- Implement the pure CSV serializer and all frozen output/safety rules.
- Implement the authenticated extensionless Route Handler.
- Ensure authorization resolves exactly once in the export query rather than once in both handler and query.
- Implement exact success and handler-level generic error responses.
- Add focused unit/query/route coverage for:
  - exact 18-column names/order
  - non-deleted organization scope
  - inclusion across lifecycle statuses
  - cross-tenant exclusion
  - soft-delete exclusion
  - related Funder fields
  - active local Tags
  - deterministic Tag order
  - stable Grant row order
  - human-readable status/type
  - stored currency preservation
  - exact two-decimal amounts
  - zero and null amounts
  - date-only formatting
  - nullable cells
  - Notes/Next steps/Funder Notes line breaks
  - CSV quotes/commas/CRLF
  - UTF-8 BOM
  - formula safety
  - empty header-only export
  - current UTC filename
  - attachment/cache/nosniff headers
  - handler-level AuthorizationError behavior
  - unexpected generic failure
  - ignored query parameters
  - no duplicate authorization lookup
- Extend PostgreSQL integration coverage using the configured disposable database pattern.
- Do not change schema, migration, DTO, or import contracts.

### T002 - Grants Action and Browser Download Surface

- Add the single `/grants` header export action using the existing Button/anchor seam.
- Preserve:
  - Grant list
  - filters
  - search
  - sort
  - pagination
  - create flow
  - detail Sheet
  - empty states
- Add/update component coverage for:
  - visible `Export portfolio`
  - semantic native link
  - accessible CSV/current-portfolio description
  - exact `/export/portfolio` target
  - no query-state propagation
  - presence in populated portfolio
  - presence in true empty portfolio
  - presence when current filters produce no visible rows
  - focus behavior
  - no new settings/reporting/Activity/document controls
- Perform Safari Technology Preview download validation after BUILD, VALIDATE, and REVIEW.
- Human validation must download and inspect the resulting file rather than merely activating the link.

No product decision is deferred to BUILD.

A discovered need for XLSX generation, a second Funder export, IDs for re-import, schema/migration changes, a public API, a new authorization seam, streaming/export infrastructure, or a broader report contract must stop BUILD and return to PLAN rather than expanding silently.

## Acceptance

1. An authenticated GrantFlow user with a valid local User can activate `Export portfolio` from the existing `/grants` header.
2. The action is a semantic keyboard-accessible native link with visible focus and an accessible description identifying the CSV portfolio export.
3. The action targets exactly `/export/portfolio` and never propagates visible Grant filters, search, sort, pagination, selected-Grant, or create-state query parameters.
4. The extensionless route remains covered by the current Clerk proxy matcher, while tenant authorization is independently enforced by the self-authorizing export query.
5. Authorization is resolved exactly once in the export execution path; the Route Handler does not duplicate the query's `requireAuthorization()` call.
6. A successful response is a direct attachment named `grantflow-portfolio-YYYY-MM-DD.csv` using the current UTC date.
7. Success uses `text/csv; charset=utf-8`, attachment disposition, `private, no-store`, and `nosniff`.
8. The CSV contains one fixed header row with exactly the 18 approved columns in the approved order.
9. Each data row represents one non-deleted Grant with a non-deleted same-organization Funder.
10. Every non-deleted Grant lifecycle status is eligible; Closed, Declined, Awarded, Reporting, and other non-deleted statuses are not silently treated as inactive.
11. All included Grants are exported regardless of visible `/grants` page, filters, search, sort, or pagination.
12. Other organizations' Grants/Funders are excluded, and no browser-provided organization/scope value is authoritative.
13. Soft-deleted Grants, soft-deleted Funders, mismatched Grant/Funder relations, soft-deleted Tags, and cross-organization Tags are excluded.
14. The export includes all approved maintained Grant fields, including Award timeframe, Designation, County served, Next steps, Notes, and Tags.
15. The export includes related Funder Name, human-readable Type, Website, County served, and Notes without creating duplicate Grant rows or a second file.
16. Non-deleted Funders with no included Grant are intentionally absent from this Grant portfolio CSV; the feature is not represented as a complete account/database backup.
17. Status values are human-readable, including `Internal Review`; raw `InternalReview` is never emitted.
18. Funder types are `Foundation`, `Family Fund`, `Corporation`, and `Other`.
19. Requested/awarded amounts are exact decimal text with two fractional digits, no JS Number precision conversion, blank for null, and `0.00` for zero.
20. Currency is emitted as stored without adding currency-selection or conversion behavior.
21. Deadline and Decision date are `YYYY-MM-DD` and cannot be locale-reordered or timezone-shifted; null dates are blank.
22. All nullable fields are blank rather than fabricated.
23. Tags are a deterministic JSON array of active assigned Tag names with stable name/ID ordering and `[]` for none; no Tag IDs are emitted.
24. Notes, Next steps, and Funder Notes preserve useful stored line breaks inside valid quoted CSV cells.
25. Commas, double quotes, embedded CR/LF content, UTF-8 text, and empty values do not corrupt row/column structure.
26. Formula-looking user-controlled textual values whose first non-whitespace character is `=`, `+`, `-`, or `@` are apostrophe-guarded before CSV quoting and open as text rather than formulas.
27. No Grant/Funder IDs, Clerk identifiers, owner/creator IDs, Activity, authorization metadata, secrets, timestamps, or deletion metadata appear in the CSV.
28. An empty portfolio downloads a valid header-only CSV with the same successful attachment contract.
29. Handler-level authorization and unexpected failures produce generic non-attachment responses with no partial CSV, tenant-existence leakage, or internal details; existing Clerk proxy interception remains unchanged.
30. Existing Grant list/filter/pagination/create/detail behavior, Funder surfaces, and Portfolio Import remain behaviorally intact.
31. No schema, migration, dependency, public API, report builder, configurable export, scheduled job, storage/backup system, client Blob pipeline, or document export is introduced.
32. Focused unit, query, Route Handler, PostgreSQL isolation, and UI tests cover the frozen contract; full Node 26 validation passes with PostgreSQL integration enabled and Safari Technology Preview download/file inspection is explicitly approved before merge/GIT END.

## Validation Expectations

### Focused Unit, Query, Route, and UI Tests

Add only the smallest focused coverage needed.

Expected seams are:

- `src/test/portfolio-export.test.ts` or equivalent:
  - exact 18-column header contract/order
  - deterministic row serialization
  - human-readable statuses
  - human-readable Funder types
  - exact stored currency value
  - two-decimal amounts
  - zero
  - nulls
  - `YYYY-MM-DD`
  - JSON Tag arrays
  - empty Tags
  - commas
  - double quotes
  - LF
  - CRLF
  - UTF-8/non-ASCII
  - BOM
  - quoted empty cells
  - formula-looking Grant/Funder/Website/Notes/Next steps values
  - deterministic CRLF record boundaries

- `src/test/domain-queries.test.ts` or a focused companion:
  - `requireAuthorization()` is called by the export query
  - only one authorization resolution occurs through the export execution seam
  - Grant organization + `deletedAt: null`
  - related Funder organization + `deletedAt: null`
  - active same-organization Tag scope
  - all lifecycle statuses remain eligible
  - no `skip`/`take`
  - no browser filter/sort input
  - exact stable row order
  - exact stable Tag order
  - all approved Grant/Funder fields
  - internal returned export rows contain no Prisma Date/Decimal instances

- `src/test/portfolio-export-route.test.ts` or equivalent:
  - authenticated success
  - exact response headers
  - current UTC filename
  - empty header-only body
  - handler-level `AuthorizationError` generic 401
  - unexpected generic 500
  - no attachment on errors
  - no partial CSV on failure
  - arbitrary query parameters do not influence output/scope
  - handler does not perform a second authorization lookup

- `src/test/postgres-domain-isolation.integration.test.ts` or the smallest focused PostgreSQL companion:
  - local non-deleted Grants exported
  - multiple lifecycle statuses included
  - other-organization Grant/Funder absent
  - soft-deleted Grant absent
  - soft-deleted Funder relation absent
  - mismatched Funder relation absent where existing fixture allows
  - active local Tags included
  - soft-deleted/other-organization Tags absent
  - Funder Notes/County present
  - all Grant fields present
  - stable row order
  - stable Tag order
  - Activity/internal authorization data absent

- `src/test/grant-ui.test.tsx`:
  - visible `Export portfolio`
  - semantic anchor
  - accessible CSV/current-portfolio description
  - exact `/export/portfolio`
  - no current list-query propagation
  - present in populated state
  - present in unfiltered empty state
  - present in filtered-empty state
  - visible focus-compatible styling through existing Button seam
  - existing Grant controls preserved
  - no out-of-scope reporting/document controls

Route/query tests must exercise or mock the actual server authorization seam.

Do not invent client organization scope.

### PostgreSQL Integration

Use the existing disposable PostgreSQL setup and current migration chain.

Before running PostgreSQL-enabled tests, export the ignored local `GRANTFLOW_TEST_DATABASE_ADMIN_URL` into the test process.

Never:

- print its value;
- enable shell tracing that exposes it;
- write it into tracked files;
- include it in receipts.

The PostgreSQL coverage must run rather than silently count as skipped when the variable is available.

Seed or reuse at least:

- two organizations and local Users;
- multiple non-deleted local Grants across different statuses;
- different deadlines including null;
- multiple Funders;
- requested/awarded amounts including zero/null;
- nullable dates/text;
- line-break content;
- active Tags;
- one other-organization Grant/Funder;
- one soft-deleted local Grant;
- one soft-deleted local Funder with a related Grant;
- a mismatched Grant/Funder relation if the existing isolation fixture permits it;
- one soft-deleted local Tag;
- one other-organization Tag;
- Funder Notes and County served.

Assert:

- exact tenant-scoped inclusion;
- all-status inclusion for non-deleted Grants;
- soft-delete exclusion;
- complete approved fields;
- exact Decimal serialization;
- date-only values;
- active local Tag representation;
- deterministic row/Tag ordering;
- no Activity/Document/Contact/User/auth metadata;
- live data on each request;
- no persisted snapshot/export history.

### Repository Gates

After implementation, run and report exactly what ran under Node 26:

- focused export serializer/query/Route Handler/UI/PostgreSQL tests;
- full normal suite: `npm run test:run`;
- PostgreSQL integration suites with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` exported into the process and its value never printed;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run verify:prisma`;
- `npm run build`;
- `git diff --check`;
- final `git status` and diff inspection confirming only approved paths changed.

Current pre-workstream baseline:

- 279 tests passed
- 0 skipped

Counts may increase.

Planning runs none of these implementation gates.

BUILD and VALIDATE own the evidence after approval and GIT START.

## Human Browser Gate

After BUILD, VALIDATE, and REVIEW, stop at `READY_FOR_USER`.

Wait for explicit human approval.

Do not merge or perform GIT END before approval.

Safari Technology Preview is the human visual/browser and download environment.

The concise checklist is:

- Open `/grants` with a populated portfolio.
- Confirm the page remains visually consistent and the single `Export portfolio` action sits beside the existing Grant action without adding reporting/settings UI.
- Confirm the export control is keyboard reachable and has visible focus.
- Activate it from a filtered or paginated `/grants` view and confirm the link itself remains `/export/portfolio` with no filter/query propagation.
- Confirm Safari downloads `grantflow-portfolio-YYYY-MM-DD.csv`.
- Open the CSV in a spreadsheet application and, when useful for raw structure inspection, a text editor.
- Confirm the file contains the complete non-deleted Grant portfolio rather than only the current visible page/filter result.
- Confirm non-deleted records across lifecycle statuses remain included rather than treating Closed/Declined/etc. as deleted.
- Inspect the exact header names/order.
- Inspect representative:
  - populated fields
  - null fields
  - zero amount
  - requested/awarded amounts
  - dates
  - status
  - currency
  - Funder fields
  - Tags
- Confirm `Internal Review` and human-readable Funder types appear and raw storage enum values do not.
- Confirm related Funder Notes and County served are present on Grant rows.
- Confirm Notes, Next steps, and Funder Notes retain line breaks without malformed columns.
- Confirm commas and quotes in text do not split cells.
- If a safe local test record contains formula-looking text, confirm the spreadsheet displays it as text rather than evaluating it.
- Confirm no IDs, Clerk values, Activity, owner/creator metadata, or authorization data appears.
- Confirm an organization with no Grants can download a valid header-only CSV.
- Confirm ordinary Safari download behavior and that adding the export action did not alter existing Grant Sheet/create/filter/pagination interactions.

## Concerns and Decisions for Developer Review

- **Planning state:** `dispatch/ACTIVE.md` remains clear during PLAN. `data-export` becomes active only after approval and GIT START.
- **CSV over XLSX:** the installed `xlsx` package could generate workbooks, but this feature is intentionally one flat Grant portfolio. CSV adds no dependency or workbook abstraction and keeps the safety contract inspectable.
- **Grant portfolio, not full backup:** the export is the spreadsheet-replacement escape hatch for current Grant portfolio data. It is not a full database/account backup. A Funder with no included Grant and an unused Tag are intentionally absent.
- **No round-trip promise:** current Portfolio Import has a different bounded XLSX contract. Export does not change import and is not promised to restore every exported field automatically.
- **All lifecycle statuses:** “active” means `deletedAt: null`, not a deadline/status subset. No lifecycle status is excluded from export.
- **Direct Route Handler over Server Action:** a Route Handler returns the attachment natively. A Server Action would require pushing file contents through the RSC action response and adding a client Blob/download path for no product benefit.
- **Authorization ownership:** follow existing query conventions. The export query calls `requireAuthorization()` itself. The Route Handler catches its `AuthorizationError`; it does not authorize a second time.
- **Route groups:** placement under `(authenticated)/(org-required)` organizes the route but does not substitute for the self-authorizing server query.
- **Extensionless route:** current proxy matching excludes `.csv`-looking static paths. `/export/portfolio` remains extensionless for proxy coverage, while `Content-Disposition` provides the `.csv` filename.
- **Proxy versus handler behavior:** Clerk proxy may intercept unauthenticated browser requests before the handler. The handler's own generic 401 remains a defense-in-depth/testable contract if an `AuthorizationError` reaches it.
- **All current portfolio rows:** export is deliberately unpaginated and independent of visible filters/search/sort.
- **Funder-only data:** Funder Notes/County are included as repeated related columns so maintained Funder information attached to Grants is not silently omitted. A second Funder file is not justified for this bounded Grant portfolio escape hatch.
- **Activity exclusion:** Activity is historical event data, not current flat portfolio-row data. Including it would duplicate rows or require a relational/reporting bundle.
- **Exact columns:** current maintained Grant fields and the five maintained related Funder fields are included. Internal IDs/ownership/timestamps/deletion/auth fields remain excluded.
- **Amounts:** database Decimals are converted exactly to two fractional digits without JavaScript `Number`.
- **Currency:** export preserves the stored currency value. This does not reopen deferred currency-selection expansion.
- **Dates:** date-only values remain ISO `YYYY-MM-DD`, avoiding locale ambiguity and timezone shift.
- **Tags:** deterministic JSON arrays avoid ambiguous comma/semicolon delimiters inside Tag names and require no Tag IDs.
- **Formula safety:** suspicious user-controlled text is prefixed with an apostrophe before CSV quoting. This intentionally prioritizes safe spreadsheet opening over byte-for-byte reproduction of formula-looking text.
- **Nulls and empty portfolio:** nullable values become blank cells; an empty portfolio still returns the useful fixed header contract.
- **No client DTO expansion:** export stays server-only and uses an internal export-row contract.
- **No streaming:** Work-Ready v0 portfolio size does not justify stream/export-job infrastructure. A future demonstrated scale problem can revisit that decision.
- **No schema:** all required data already exists. A discovered data-model requirement blocks BUILD and returns to PLAN.
- **Architecture:** no `ARCHITECTURE.md` is required unless implementation inspection disproves this bounded query/serializer/Route Handler design and reveals a genuinely cross-cutting decision.
- **Approval gate:** this plan creates no execution branch, task assignment, implementation, dependency change, test change, production build, or merge activity until explicit developer approval.

## References

- `PRODUCT.md`
- `AGENTS.md`
- `dispatch/ACTIVE.md`
- `dispatch/COMPLETED.md`
- `prisma/schema.prisma`
- `package.json`
- `next.config.ts`
- `src/proxy.ts`
- `src/lib/clerk/authorization.ts`
- `src/lib/queries/grants.ts`
- `src/lib/queries/funders.ts`
- `src/lib/queries/tags.ts`
- `src/lib/queries/serializers.ts`
- `src/lib/queries/grant-list-contract.ts`
- `src/lib/dates/utc-dates.ts`
- `src/lib/validations/grant.ts`
- `src/lib/validations/funder.ts`
- `src/lib/validations/tag.ts`
- `src/types/grant.ts`
- `src/types/funder.ts`
- `src/types/tag.ts`
- `src/app/(authenticated)/(org-required)/grants/page.tsx`
- `src/app/(authenticated)/(org-required)/grants/actions.ts`
- `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx`
- `src/components/grants/grants-page.tsx`
- `src/components/ui/button.tsx`
- `src/components/funders/funder-page.tsx`
- `src/lib/import/portfolio-xlsx.ts`
- `src/test/domain-queries.test.ts`
- `src/test/domain-actions.test.ts`
- `src/test/postgres-domain-isolation.integration.test.ts`
- `src/test/grant-ui.test.tsx`
- `src/test/grants-route.test.ts`
- `src/test/portfolio-xlsx.test.ts`
- `src/test/portfolio-import-actions.test.ts`
- `src/test/auth-simplified.test.ts`
- `screenshots/grants.png`
- Current Next.js 16 Route Handler documentation
- Relevant SoloFlow skills: `solo-flow`, `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`
