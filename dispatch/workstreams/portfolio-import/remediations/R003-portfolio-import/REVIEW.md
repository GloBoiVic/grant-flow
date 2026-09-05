# R003 — Optional Grant Title column support — Review

ROLE: REVIEW
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R003
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R003-portfolio-import/REVIEW.md

## Result

**PASS** — R003 is strictly additive, placeholder-aware, backward-compatible, and introduces no scope creep. The full Portfolio Import workstream has no unresolved CRITICAL or IMPORTANT findings and satisfies the frozen PLAN contract for closure.

## Scope verification — R003 Grant Title

### Additive and optional-only

- `src/lib/import/portfolio-xlsx.ts:13-28` adds `"Grant Title"` to `OPTIONAL_IMPORT_HEADERS` (now 13 entries). `SUPPORTED_IMPORT_HEADERS` spreads it, so `findHeaderContract` (:243-285) recognizes it as `recognizedHeaders` and no longer emits it as `unsupportedHeaders`/`unsupportedSourceWarnings`. No required-header, worksheet-selection, or matching-sheet contract changed — `REQUIRED_IMPORT_HEADERS` remains `["Funder","Type","Current Status"]`.
- `mapCandidateRow` (:525-537) reads `optionalText(cells.get("Grant Title"),...)` and derives `title = grantTitle ?? (funderName ? (designation ? `${funderName} — ${designation}` : funderName) : null)`. When a non-placeholder title exists it is used verbatim; otherwise fallback is the frozen derived title. Persistence, `Grant.currency`, amount/date/status/type, `Designation`/`County Served`/`Notes`/`Next Steps` mappings untouched (:514-524, :528-602 verified unchanged).
- No schema or migration change: `prisma/schema.prisma` contains no `ImportStaging`, no new model/field; forward drop migration `20260904010000_remove_import_staging` preserved; `bunx prisma validate` PASS. `next.config.ts` 6 MiB Server Action limit, `xlsx` CDN distribution, upload bounds, Funder resolution, and transaction seams unchanged.

### Placeholder-aware

- Reuses existing `FUNDER_PLACEHOLDERS` = `["-","n/a","na","none","unknown","tbd","not applicable"]` via `normalizeKey` (case-insensitive) plus `normalizeWhitespace` (collapsed internal whitespace):
  ```ts
  const rawGrantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors);
  const grantTitle = rawGrantTitle && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantTitle)) ? normalizeWhitespace(rawGrantTitle) : null;
  ```
- `optionalText` (:332-336) correctly maps blank/`"-"` → `null` and formula → error + `null`, so a formula in `Grant Title` invalidates the row rather than being silently used — consistent with PLAN's "formulas in recognized fields invalidate".
- Covered exhaustively: test `uses Grant Title when present and falls back to derived title for placeholders and blank` verifies `"Real Title"` overrides Designation, `"  Real   Title  "` collapses to `"Real Title"`, and all placeholders `"-","None","none","N/A","n/a","NA","na","Unknown","UNKNOWN","TBD","tbd","Not applicable","NOT APPLICABLE","not Applicable","",null,"   "` each fallback to `"North Star Foundation — Housing Stability"`; placeholder with no Designation falls back to bare funder `"Lone Funder"`. Test `recognizes Grant Title as a supported header` verifies `recognizedHeaders` contains `Grant Title` and `unsupportedHeaders` is `[]`.

### Backward-compatible

- Workbook without `Grant Title` column: `derives Funder — Designation title when Grant Title column is absent` PASS — derives `"North Star Foundation — Housing Stability"` and `recognizedHeaders` does not contain `Grant Title`.
- Dirty fixture `data/mock-grant-data.xlsx` (18580 → 237647 bytes) now contains `Grant Title: "None"` for all rows. Parser treats it as placeholder fallback; `handles the checked-in reference workbook` still PASS with worksheet `Main Tracker`/`Main Tracker - FOR BOARD` and candidate bound enforced. No spurious `"None"` titles.
- Fingerprint/duplicate logic automatically correct: `581-583` and post-`resolveFunders` `662-667` fingerprints include `grant.title`, so distinct Grant Titles remain distinct Grants and identical titles collapse with `collapsedSourceRows` evidence — no separate duplicate change needed.

### No scope creep

R003 does not change worksheet selection, `.xlsx` signature or 5 MiB/1,000-row bounds, status/type/amount/date contracts, Funder matching/ambiguity/conflicting-type rules, authorization, persistence/transaction (`src/app/(authenticated)/(org-required)/import/actions.ts` unchanged), UI beyond recognized-header handling, or introduce generic column-mapping, reusable import framework, schema fields, or durable staging. Out-of-scope explicitly excluded in R003 BUILD.md is respected.

## Full workstream judgment — no unresolved CRITICAL/IMPORTANT

Inspected: frozen `PLAN.md` (Phase REMEDIATION_REVIEW), `PRODUCT.md`, T001/T002/T003 receipts (`DONE_WITH_CONCERNS`), original `VALIDATION.md` (one PRODUCT/DEFECT), R001 BUILD/VALIDATION/REVIEW (formula-only defect), R002 BUILD/VALIDATION/REVIEW (required-placeholder defect), R003 BUILD/VALIDATION, current parser/actions/UI/schema/migration/configuration/tests/status.

- Original `VALIDATION.md` defect (formula-only recognized value classified as structural) — **resolved** by R001 (`isClearlyStructuralRow` now treats recognized formulas as candidate evidence unless independently total/section; validated PASS, REVIEW PASS for originating defect).
- R001 REVIEW IMPORTANT defect (literal `-` in required fields treated as structural) — **resolved** by R002 (separate `isLiteralPlaceholder` detection, candidate evidence + bound enforcement; `Funder is required.` / `Type is required.` / `Current Status is required.` errors visible; validated PASS WITH CONCERNS for tooling, REVIEW PASS).
- Remaining **MINOR** — `Award Timeframe` mapped/persisted but not rendered in `src/components/import/portfolio-import-page.tsx:103-117` row details. Explicitly deferred per PLAN.md:376 ("non-blocking minor omission ... No unresolved Critical or Important findings remain") and R001/R002 reviews. Does not corrupt persistence; not a CRITICAL/IMPORTANT blocker under SoloFlow.
- No new PRODUCT/REGRESSION/NEW SCOPE defect introduced by R003 (verified via scope section above).
- Dirty-fixture concern previously blocking `bun run test:run` is now resolved: parser test accepts `["Main Tracker","Main Tracker - FOR BOARD"]`; `bun run test:run` now shows no fixture failure.

## Evidence and checks

- Branch/CWD/repository root verified: `solo/portfolio-import` on `/Users/vike/Desktop/grant-flow` (`git branch --show-current`, `pwd`, `git rev-parse --show-toplevel`).
- Current impl inspected: `src/lib/import/portfolio-xlsx.ts`, `src/app/(authenticated)/(org-required)/import/actions.ts`, `src/components/import/portfolio-import-page.tsx`, `prisma/schema.prisma`, `prisma/migrations/20260904010000_remove_import_staging/migration.sql`, `next.config.ts`, `package.json` (SheetJS CDN `xlsx-0.20.3`), and all `src/test/portfolio-*.test.*` + `migration-chain.test.ts`.
- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — **PASS** (17 passed; 3 new Grant Title tests PASS, 14 existing PASS including formula/placeholder/bound/structural/dedup/funder/date/config fixture tests).
- `bun run test:run` — **PASS** (30 passed | 4 skipped; 149 passed | 27 skipped; previously 1 failure on fixture now cleared).
- `bunx --bun tsc --noEmit` — **PASS** (exit 0).
- `bun run lint` — **PASS** (exit 0).
- `bunx --bun prisma validate` — **PASS** (`The schema at prisma/schema.prisma is valid`).
- `bunx --bun next build --webpack` — **PASS** (`Compiled successfully`, `/import` emitted as dynamic `ƒ /import`).
- `git diff --check` — **PASS** (no whitespace/conflict markers; HEAD diff empty because workstream files are untracked/modified on `solo/portfolio-import` — inspected file content directly).
- Opt-in `src/test/postgres-portfolio-import.integration.test.ts` — **SKIPPED** (expected; `GRANTFLOW_TEST_DATABASE_ADMIN_URL` unset). Authorization-first, org-scoped `findMany` with `deletedAt: null`, `createManyAndReturn` bulk flow and `revalidatePath("/grants"|"/funders")` verified by code inspection and focused action tests.
- `bun run build` (Turbopack) — **BLOCKED** by environment `node` spawn failure processing `src/app/globals.css`; `bun run verify:prisma` — **BLOCKED** by Bun/tsx `./cjs/index.cjs` resolution; `prisma migrate diff --shadowDatabaseUrl` — **BLOCKED** by missing `datasource.shadowDatabaseUrl`. Documented environment limitations; not product defects. `vitest configLoader: 'native'` warning informational.

Reviewer wrote only this assigned artifact; application, tests, fixtures, configuration, planning state, and prior evidence artifacts were not edited.

## Terminal status

**DONE — REVIEW PASS**
