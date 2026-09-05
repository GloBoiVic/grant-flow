# SoloFlow Plan — Portfolio Import

Status: READY_FOR_USER
Classification: Feature
Workstream: portfolio-import
Base branch: main
Base SHA: 7bbae64ed937269031717e8668e751ffec448082
Execution branch: solo/portfolio-import
Approval: Explicit developer approval received: "Approved. Proceed with implementation using the reconciled `portfolio-import` PLAN as the frozen contract." (2026-09-04)
Phase: READY_FOR_USER
Task state: T001 DONE_WITH_CONCERNS; T002 DONE_WITH_CONCERNS; T003 DONE_WITH_CONCERNS; R001 BUILD DONE, VALIDATE PASS, REVIEW FAIL; R002 BUILD DONE, VALIDATE PASS_WITH_CONCERNS, REVIEW PASS; R003 BUILD DONE, VALIDATE PASS, REVIEW PASS; R004 BUILD DONE, VALIDATE PASS, REVIEW PASS; R005 BUILD DONE, VALIDATE PASS, REVIEW PASS.
Architecture status: Not required; the reconciled design uses the existing authenticated App Router seam, bounded server-side XLSX parsing, ephemeral preview state, and one organization-scoped database transaction. No new service, durable staging system, queue, or cross-cutting architecture is introduced.
Next action: Developer merge approval; empty-column preview fix recorded — preview now compact (see closing note).

## Outcome

Let a grant professional upload an existing Excel grant tracker at `/import`, see exactly what GrantFlow recognized, mapped, skipped, and rejected, deliberately confirm the valid portion, and receive an organization-scoped portfolio of funders and grants in the existing `/grants` and `/funders` experiences.

The first release is optimized for the concrete single-user work deployment and the repository's reference workbook. It is not a general spreadsheet migration platform.

## Inspection findings

- `src/app/(authenticated)/(org-required)/import/page.tsx` is currently a placeholder. The authenticated organization-required route already resolves local GrantFlow authorization before the page is usable.
- The current authority seam is `authorizeAction()` / `requireAuthorization()`: Clerk supplies the authenticated person and the local `User` supplies `organizationId` and local `userId`. No client-provided organization identifier is authoritative.
- `Grant` requires a funder, title, and constrained `GrantStatus`; its optional working fields include requested/awarded amounts, deadline, decision date, award timeframe, designation, county served, next steps, and notes.
- `Funder` requires a name and constrained `FunderType`.
- Existing grant and funder creation writes create append-only `Activity` records in the same transaction.
- Existing grant, funder, and tag reads/mutations scope by the authorized organization and exclude soft-deleted records where applicable.
- `ImportStaging` exists in the Prisma schema and current baseline migration but has no application code path. The required preview → confirm flow does not require durable staging.
- `package.json` currently has no spreadsheet parser.
- The current `next.config.ts` does not raise the default Server Action body-size limit. If Server Actions receive the workbook directly, BUILD must explicitly configure enough request capacity for the approved file limit plus multipart overhead. A Route Handler is acceptable only if it produces a materially simpler implementation while preserving the same authorization and validation contract.
- If SheetJS Community Edition is selected for XLSX parsing, use its current maintained official distribution rather than the stale public npm-registry `xlsx` release. Do not add a generic spreadsheet abstraction around the chosen parser.

### Reference workbook findings

Solo's inspection of `data/mock-grant-data.xlsx` found one relevant worksheet, `Main Tracker - FOR BOARD`, with a header row containing:

`Funder`, `Type`, `Requested Year 2024`, `Awarded Year 2024`, `Requested Year 2025`, `2025 Pending Requests`, `Awarded Year 2025`, `Current Status`, `Next Steps`, `Due Date`, `Approve/Decline Date`, `Award Timeframe`, `Designation`, `County Served`, and `Notes`.

The inspected workbook contains candidate grant rows plus blank separators, a formula totals row, and a `2026 Opportunities:` section heading.

The source uses statuses including:

- `Approved Award`
- `Declined Award`
- `Declined LOI`
- `Submitted`
- `To Apply`
- `In Progress`

The source includes Excel date cells, numeric date serials, and at least one bare numeric year in a date column that must not be guessed into a calendar date.

The workbook has no dedicated Grant title or tags column.

It also contains multiple years of requested/awarded amounts and a pending-request amount, while the current Grant model has only one structured requested amount and one structured awarded amount. The importer must make these mapping decisions visible and must not silently discard populated source values that are not selected for structured fields.

## Scope

### In scope

- Replace the `/import` placeholder with an authenticated `.xlsx` upload, analyze/preview, deliberate-confirmation, and completion flow.
- Add one small server-only XLSX parsing/mapping seam using one maintained parser dependency.
- Accept `.xlsx` only for this release.
- Identify the source worksheet deterministically:

  - inspect workbook worksheets for the required header contract;
  - use the worksheet when exactly one sheet contains the required import headers;
  - reject the workbook when no worksheet matches or more than one worksheet independently matches;
  - do not reject an otherwise valid workbook merely because it contains unrelated auxiliary/archive worksheets.

- Enforce bounded input:

  - maximum workbook size: 5 MiB;
  - maximum candidate rows: 1,000;
  - no formula evaluation;
  - formulas in recognized fields of candidate rows invalidate those rows rather than trusting cached formula results.

- If Server Actions receive the file, configure the Next.js Server Action request-body limit above 5 MiB with sufficient multipart overhead while retaining the application-level 5 MiB file check.
- Skip clearly structural blank, total, and section-heading rows without representing them as invalid Grants.
- Return a serializable server-produced preview containing:

  - source row number;
  - derived GrantFlow values;
  - funder reuse/create decision;
  - duplicate disposition;
  - unsupported-source warnings;
  - row-level validation errors.

- Retain the selected File on the client only long enough to submit it again for confirmation. Do not persist the raw workbook.
- Re-parse, re-map, re-validate, and re-resolve organization funders from the uploaded workbook during confirmation. Preview JSON is display state and is never persistence authority.
- Persist all confirmed valid, deduplicated rows atomically in one organization-scoped Prisma transaction.
- Use bulk Prisma operations where practical rather than looping through hundreds of independent `create()` calls:

  - create new Funders and obtain their IDs;
  - create Grants;
  - create corresponding Activity rows;
  - preserve atomic rollback for the full confirmed set.

- Revalidate `/grants` and `/funders` after a successful commit.
- Show created, reused, collapsed, and excluded counts with links to the existing portfolio views.
- Remove unused `ImportStaging` from the Prisma schema and Organization relation through a forward migration. Preserve the current applied migration history; do not rewrite the local-tenancy baseline.
- Add focused parser/mapper, action, PostgreSQL isolation, UI, configuration, and migration coverage while preserving existing portfolio, tag, authentication, onboarding, and tenant-isolation behavior.

### Explicitly out of scope

- CSV, `.xls`, `.xlsm`, Google Sheets, or support for multiple spreadsheet file formats.
- A worksheet-selection UI when the workbook has exactly one unambiguous sheet matching the import contract.
- Arbitrary header aliases or a generic column-mapping interface.
- A reusable import framework.
- Fuzzy funder/entity resolution or external funder matching.
- Durable uploaded-file storage.
- Durable preview/staging state.
- Import-history screens.
- Resumable uploads.
- Background jobs, queues, distributed processing, or asynchronous import workers.
- Updating existing Grants.
- Generalized matching/deduplication against existing Grants.
- Funder contacts, documents, dashboard, deadlines, exports, grant workspace, drafting, collaboration, or deployment.
- Automatic Tag creation/assignment because the inspected source does not contain tag data.
- Adding Grant or Funder fields merely to reproduce every spreadsheet column.

## Source-to-domain contract

The parser normalizes expected header whitespace and cell whitespace for the fixed source contract. It does not guess arbitrary columns.

The required headers are:

- `Funder`
- `Type`
- `Current Status`

Other known workbook headers are optional recognized inputs.

Missing required headers reject the candidate worksheet.

Unknown headers are disclosed in preview as unsupported and are not silently interpreted.

| Source column                                                           | GrantFlow destination                        | Contract                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Funder`                                                                | `Funder.name`; part of derived `Grant.title` | Trim surrounding whitespace and collapse repeated internal whitespace for deterministic matching. Missing or placeholder funder names invalidate the row.                                                                                                                                                                                                                             |
| `Type`                                                                  | `Funder.type`                                | Case/whitespace-normalized exact mapping: `Foundation` → `FOUNDATION`; `Family Fund` → `FAMILY_FUND`; `Corporation` → `CORPORATION`; `Other` → `OTHER`. Unknown nonblank values are invalid rather than silently mapped to `OTHER`.                                                                                                                                                   |
| no source title                                                         | `Grant.title`                                | Derive a human-readable durable title. Use `[Funder] — [Designation]` when Designation is populated; otherwise use the Funder name. Do not place source row numbers, import batch IDs, filenames, or other migration artifacts in the durable title. Distinct Grants are allowed to share a title.                                                                                    |
| `Current Status`                                                        | `Grant.status`                               | Case/whitespace-normalized exact mapping: `Approved Award` → `Awarded`; `Declined Award` and `Declined LOI` → `Declined`; `Submitted` → `Submitted`; `To Apply` → `Research`; `In Progress` → `Planning`. Unknown or blank values invalidate the row.                                                                                                                                 |
| `Requested Year 2025` / `2025 Pending Requests` / `Requested Year 2024` | `Grant.amountRequested`                      | Use the first populated value in this order: Requested Year 2025, 2025 Pending Requests, Requested Year 2024. A pending-request value represents money requested when no primary 2025 requested value is available. Never sum these columns. Any additional populated requested values not selected for the structured field are preserved in the source-values note described below. |
| `Awarded Year 2025` / `Awarded Year 2024`                               | `Grant.amountAwarded`                        | Use 2025 first and 2024 only when 2025 is blank/`-`. Never add years together. Any populated awarded value not selected for the structured field is preserved in the source-values note.                                                                                                                                                                                              |
| non-selected yearly/pending amount values                               | `Grant.notes` supplement                     | Preserve populated source monetary values that do not fit the one-requested/one-awarded Grant model in an explicit labeled `Imported spreadsheet values` block. This prevents the importer from silently losing historical spreadsheet data while avoiding new schema fields in this workstream.                                                                                      |
| `Next Steps`                                                            | `Grant.nextSteps`                            | Optional trimmed text; blank/`-` becomes `null`.                                                                                                                                                                                                                                                                                                                                      |
| `Due Date`                                                              | `Grant.deadline`                             | Optional. Accept an actual Excel date, a valid Excel date serial interpreted using the workbook's date system, or strict `YYYY-MM-DD` text. Reject bare numeric years, impossible dates, formulas, and out-of-contract date values rather than guessing.                                                                                                                              |
| `Approve/Decline Date`                                                  | `Grant.decisionDate`                         | Same date contract as `Due Date`.                                                                                                                                                                                                                                                                                                                                                     |
| `Award Timeframe`                                                       | `Grant.awardTimeframe`                       | Optional trimmed text. Numeric year values may be represented as text; do not force date semantics.                                                                                                                                                                                                                                                                                   |
| `Designation`                                                           | `Grant.designation`                          | Optional trimmed text. Also participates in the human-readable derived title when populated.                                                                                                                                                                                                                                                                                          |
| `County Served`                                                         | `Grant.countyServed`                         | Optional trimmed text. Keep this as grant-level geography.                                                                                                                                                                                                                                                                                                                            |
| `Notes`                                                                 | `Grant.notes`                                | Optional trimmed source notes plus any explicitly labeled imported-source-values block. Reject rather than truncate if the final normalized note exceeds the existing Grant validation limit.                                                                                                                                                                                         |
| tags                                                                    | none                                         | The inspected workbook does not represent tags, so no Tag or GrantTag rows are created.                                                                                                                                                                                                                                                                                               |
| currency                                                                | `Grant.currency` default                     | The source has no currency column. Retain GrantFlow's existing USD default.                                                                                                                                                                                                                                                                                                           |

Blank optional cells and the literal `-` placeholder become `null`.

Required cells containing blank/`-` are invalid.

Amounts must be finite, nonnegative values compatible with the existing `Decimal(12,2)` and Grant validation contract.

The parser may normalize ordinary Excel numeric representations into canonical decimal strings, but must not guess malformed currency/text values. Currency symbols, malformed text, excessive precision, formulas, or values outside the database range are invalid.

Every mapped candidate Grant and Funder must pass the applicable current GrantFlow domain-validation semantics after the explicit spreadsheet representation conversion.

## Funder matching and row deduplication

Funder matching is deterministic and organization-local, not entity resolution:

1. Normalize the source Funder name to a comparison key by trimming, collapsing internal whitespace, and applying case-insensitive comparison.
2. Resolve authorization before loading any existing funders.
3. Load only active funders for the authorized `organizationId`.
4. If exactly one active funder matches the normalized key, reuse that Funder.
5. Reusing an existing Funder never mutates its name, type, website, notes, geography, or other fields as a side effect of import.
6. If the source Funder type differs from the reused existing Funder type, show a preview warning that the existing GrantFlow Funder remains authoritative; do not silently hide the discrepancy.
7. If multiple active organization funders match the normalized key, affected rows are invalid as ambiguous rather than choosing arbitrarily.
8. If no active Funder matches, group source rows by normalized Funder key and create one new active Funder for that group.
9. Conflicting source Funder types within one new-Funder group invalidate the affected rows rather than choosing one.
10. A soft-deleted prior Funder is not restored or matched; preview identifies that a new active Funder will be created.

Do not add generalized concurrency or normalized-Funder infrastructure in this workstream.

Rows are exact-duplicate collapsed after normalization of every source value that affects the resulting persisted Grant, including the final source-values note.

The first source row is canonical and the preview identifies the other collapsed source row numbers.

Distinct rows for one Funder remain distinct Grants. The importer does not append source-row suffixes to their durable titles merely to force visual uniqueness.

Existing Grants are not used as a match key in this release.

## Validation, preview, and confirmation

### Row states

- **Structural/skipped:** fully blank rows, totals rows with no Funder, and clearly isolated section labels such as a single populated heading ending in `:`. Structural rows are counted but never represented as invalid Grants.
- **Candidate:** any non-structural row containing a Funder or recognized mapped value.
- **Valid:** a candidate whose normalized Funder and derived Grant satisfy the source-to-domain contract and current domain validation.
- **Collapsed duplicate:** an exact normalized duplicate of a valid canonical source row. It does not create a second Grant.
- **Invalid:** excluded from confirmation because of a missing required value, unknown constrained value, malformed amount/date, formula in a recognized field, ambiguous Funder match, conflicting new-Funder type, or final field-value validation error.

The preview is a server-produced read-only report.

It includes:

- selected file name;
- selected worksheet;
- recognized headers;
- unsupported headers;
- structural/candidate/valid/invalid/collapsed counts;
- status mapping;
- requested/awarded amount selection;
- preserved source values;
- derived titles;
- Funder reuse/create decisions;
- existing-Funder type mismatch warnings;
- row-level validation errors;
- source row numbers.

Invalid rows are visibly excluded and are never silently dropped.

If all candidate rows are invalid, confirmation is unavailable and the user is told to correct the workbook and analyze it again.

The user must explicitly acknowledge language equivalent to:

`I reviewed the valid rows and understand that this import will create new GrantFlow grant records.`

before `Import N valid grants` is enabled.

There is no automatic mutation when the workbook is selected or analyzed.

Confirmation submits the workbook again and the server performs the complete authorization, workbook selection, parse, mapping, validation, deduplication, and Funder-resolution process again.

No client-supplied `organizationId`, Funder ID, preview object, mapped value, or duplicate decision is authoritative.

After a successful import:

- clear the selected workbook/preview state;
- disable any repeated confirmation from the completed state;
- show the final created/reused/collapsed/excluded counts;
- link to `/grants` and `/funders`.

This release remains create-only for Grants.

The UI must clearly warn before confirmation that intentionally importing the same workbook again later can create additional Grant records. Generalized historical-import idempotency is deferred until there is a reliable product requirement and source identity.

Within one confirmed import, all valid non-collapsed rows commit atomically. Invalid and collapsed rows remain excluded exactly as shown in the regenerated server decision.

## Persistence, tenancy, and Activity

- Preview and confirmation execute only through authenticated server-side code using the existing authorization seam.
- They never accept a client organization identifier as authority.
- Every existing-Funder lookup uses the authorized organization and `deletedAt: null`.
- Every new Funder receives the authorized `organizationId`.
- Every new Grant receives:

  - the authorized `organizationId`;
  - a server-resolved organization Funder ID;
  - `ownerId` = authorized local User;
  - `createdById` = authorized local User.

- The entire confirmed write set is atomic.
- Prefer bounded bulk Prisma operations rather than one network/database call per imported row:

  1. create and return required new Funders;
  2. resolve the complete Funder-ID map;
  3. create and return Grants;
  4. create the corresponding Activity rows;
  5. commit as one transaction.

- A persistence failure rolls back all Funders, Grants, and Activity records created by that confirmation.
- Preserve the current Activity vocabulary:

  - one `funder_created` Activity for each newly created Funder;
  - one `grant_created` Activity for each committed Grant.

- Import-created Activity records use the authorized actor.
- Import metadata may include:

  - `source: "portfolio-import"`;
  - source worksheet;
  - canonical source row;
  - collapsed duplicate source rows when applicable;
  - one per-confirmation import batch UUID for diagnostic grouping.

- Reused Funders, structural rows, invalid rows, and collapsed duplicates do not create separate Activity noise.
- Do not introduce an organization-level synthetic audit event or separate audit subsystem.
- Remove `ImportStaging` from the Prisma schema and Organization relation and create a forward migration that drops the unused table.
- Do not rewrite the existing local-tenancy baseline migration.
- Preview data and the workbook are ephemeral and are not retained after the interaction.

## Proposed post-approval task breakdown

Tasks are intentionally not created until explicit developer approval and GIT START.

1. **T001 — XLSX parser and domain contract**

   - add the maintained XLSX parser dependency;
   - configure upload transport/body limits if Server Actions receive the workbook;
   - implement bounded workbook/sheet selection;
   - implement parser/mapping/normalization;
   - implement status, amount, date, structural-row, duplicate, Funder, and derived-title rules;
   - define import DTOs;
   - remove `ImportStaging` with a forward migration;
   - add parser, mapping, configuration, and migration tests.

2. **T002 — scoped atomic preview/commit**

   - implement authorization-first analysis and confirmation;
   - resolve existing Funders only within the authorized organization;
   - implement bulk transactional creation of new Funders, Grants, and Activity records;
   - re-parse/re-validate on confirmation;
   - implement rollback/error behavior;
   - add action and PostgreSQL tenant-isolation/integration coverage.

3. **T003 — preview and confirmation UI**

   - replace `/import` placeholder;
   - add `.xlsx` file selection and analysis;
   - show recognized/unsupported headers and mapping summary;
   - show valid, invalid, skipped, and collapsed-row states;
   - show Funder create/reuse/type-warning decisions;
   - add explicit acknowledgement and confirmation;
   - add completion state and portfolio links;
   - add accessible UI/route coverage using existing GrantFlow design tokens.

## Acceptance

1. An authenticated GrantFlow user can open `/import`, select an `.xlsx`, analyze it, and see a useful preview without mutating portfolio data.
2. The importer accepts only the bounded `.xlsx` contract for this release.
3. A workbook is accepted when exactly one worksheet matches the required import headers, even if unrelated auxiliary worksheets also exist.
4. A workbook is rejected when no worksheet matches or more than one worksheet independently matches the required contract.
5. Files over 5 MiB and sheets over 1,000 candidate rows are rejected before persistence.
6. The upload transport actually supports the approved 5 MiB application limit; Server Action configuration must account for multipart request overhead if Server Actions carry the file.
7. Malformed workbooks, missing required headers, unsafe formula-bearing candidate values, and unsupported file types receive clear errors.
8. Structural blank/total/section rows are skipped and counted rather than converted into invalid Grants.
9. The reference workbook's known columns are handled through the explicit source-to-domain mapping.
10. Durable Grant titles are human-readable and never contain import row numbers or batch identifiers.
11. Current Grant statuses and Funder types are mapped only through explicit maps. Unknown constrained values are invalid.
12. Requested and awarded amounts use the explicit latest/current selection rules without summing years.
13. Populated source monetary values that cannot occupy the one requested/one awarded structured fields are preserved in a clearly labeled Grant-notes block rather than silently discarded.
14. Blank optional cells and `-` placeholders become null.
15. Valid Excel dates and serials use the workbook date system and become stable calendar dates.
16. Bare numeric years such as `2025` in a date column are not guessed into dates.
17. Exact repeated source rows are collapsed with source-row evidence.
18. Same-name Funders within one import resolve to one new or one existing active organization Funder when deterministic.
19. Existing Funders are matched only by deterministic normalized exact name inside the authorized organization.
20. Cross-organization and soft-deleted Funders cannot be matched, exposed, or mutated.
21. Existing-Funder type disagreement is visible in preview and does not silently mutate the existing Funder.
22. Confirmation requires deliberate acknowledgement.
23. Confirmation re-parses, re-maps, re-validates, and re-resolves the workbook server-side.
24. No client-supplied organization ID, Funder ID, preview result, mapped value, or duplicate disposition bypasses server validation.
25. A successful confirmation atomically creates the full valid deduplicated set of new Funders, Grants, and minimum useful Activity records.
26. A persistence failure creates none of the records from that confirmation.
27. Invalid, structural, and collapsed rows create no Grant/Funder/Activity records beyond the canonical valid rows they represent.
28. Newly created Grants appear through existing `/grants` behavior and newly created Funders through `/funders`.
29. Existing portfolio, tag, authentication, onboarding, and tenant-isolation behavior remains intact.
30. After completion the UI cannot accidentally submit the same analyzed workbook again without beginning a new import.
31. The user is warned that deliberately importing the same workbook again as a new import can create additional Grants.
32. No durable staging, uploaded-file retention, queue, job system, generic mapping engine, fuzzy entity resolution, or unrelated Work-Ready feature is introduced.
33. The unused `ImportStaging` model/table is removed through a forward migration.
34. Focused unit, action, UI, migration, configuration, and opt-in PostgreSQL isolation tests are run and reported with exact limitations.
35. Lint, TypeScript/build validation, `git diff --check`, and browser validation follow the normal SoloFlow evidence requirements.

## Concerns and decisions for developer review

- **Grant title:** the workbook has no explicit Grant title. This contract derives `[Funder] — [Designation]` when a designation exists and otherwise uses the Funder name. Source row numbers are intentionally excluded from durable user-facing titles.
- **Multi-year amounts:** the current Grant model has only one requested amount and one awarded amount. This contract selects the most relevant available structured value while preserving additional populated yearly/pending values in a labeled notes block. No amount-history schema is added in this workstream.
- **Pending-request amount:** `2025 Pending Requests` is used as an `amountRequested` fallback only when the primary 2025 requested value is absent. If another requested amount is selected, the pending value is preserved in the labeled source-values note.
- **Dates:** Excel serials must respect the workbook's date system. Bare years and ambiguous numeric values are rejected rather than interpreted heuristically.
- **XLSX dependency:** if SheetJS is selected, use its maintained official distribution rather than the stale public npm-registry release.
- **Upload limit:** the 5 MiB product limit requires explicit transport support if Server Actions carry the workbook because the framework default is smaller.
- **`ImportStaging`:** no application path uses it and this flow does not require durable staging, so the model/table should be removed through a forward migration. If meaningful persisted staging data is discovered before migration, stop and return for a preservation decision.
- **Repeated imports:** generalized Grant idempotency is deliberately deferred because the existing schema has no reliable external source identity. The completed UI prevents accidental repeat confirmation in one session and explicitly warns that beginning a new import with the same source may create duplicate Grants.
- **Architecture:** no separate ARCHITECTURE.md is required unless BUILD inspection disproves the bounded server-side parsing + transaction design and reveals a genuinely cross-cutting architecture decision.
- **Review disposition:** the non-blocking minor omission of `Award Timeframe` from per-row UI details is deferred; the value remains mapped, persisted, and present in the server-produced preview DTO. No unresolved Critical or Important findings remain.
- **Validation limitations:** PostgreSQL isolation/rollback coverage, authenticated browser interaction, the default Turbopack build, `verify:prisma`, and migration diff remain limited by the documented environment constraints. The unrelated dirty `data/mock-grant-data.xlsx` fixture and lock file were preserved; the focused feature checks and webpack build pass.

### Closing note — optional Grant Title / Grant Name + empty-column fix (R003 + R004 + R005, user-approved SoloFlow patches)

- **Decisions:** 
  - **R003:** Added optional `Grant Title` — `OPTIONAL_IMPORT_HEADERS` now includes `"Grant Title"` with placeholder-aware fallback (`"-", "None","N/A","NA","Unknown","TBD","Not applicable"` → falls back to derived `Funder — Designation`) via `R003 BUILD → VALIDATE → REVIEW PASS`.
  - **R004:** Added optional `Grant Name` as **primary** — `OPTIONAL_IMPORT_HEADERS` now includes **both** `"Grant Name"` and `"Grant Title"` (14 optional headers). `GrantFlow` stores `Grant.title` but displays as *Grant Name*. Mapper reads both via `optionalText` + `FUNDER_PLACEHOLDERS`: `effectiveTitle = grantName ?? grantTitleAlias ?? derived`. `Grant Name` wins when both present and non-placeholder; `Grant Title` remains as alias (your `data/mock-grant-data.xlsx` still has `Grant Title: "None"` → falls back to derived). User-approved: "I want the mapper to be Grant Name instead. But Grant Name and Grant Title can map to Grant Name in GrantFlow".
  - **R005 (current):** Fixed empty-column preview overflow — your upload preview listed empty/generic `Column1...Column16368` (workbook `!ref A1:XFD35` = 16384 columns) as 16k unsupported badges, burying grant previews. Parser now filters `/^Column\d+$/i` as empty in `findHeaderContract()`; UI `HeaderList` truncates after 12 badges with `Show N more` / `Show less` + `max-h-32 overflow-y-auto`. Preview's "Workbook recognition" is now compact and "Row decisions" are immediately visible.
- **Rationale:** Trackers are funder-centric but headers vary; generic empty columns are Excel formatting artifacts, not user intent.
- **Evidence:** `src/lib/import/portfolio-xlsx.ts` + `src/components/import/portfolio-import-page.tsx` + `src/test/portfolio-xlsx.test.ts` (R005: +3 tests → 23 parser tests), `bun run test:run` 30/34 files (155 tests) + 27 skipped isolation, `tsc`/`lint`/`prisma validate`/`next build --webpack` PASS, `R003`+`R004`+`R005 VALIDATION/REVIEW PASS`.
- **Operator pause:** You (human) correctly have **not** yet performed the user-side upload. Workstream is now `READY_FOR_USER` on `solo/portfolio-import` with local DB migrated (`grantflow` @ `postgresql://vike@127.0.0.1:5432/grantflow`). Restart `bun run dev` and re-analyze — the preview will now be compact.
