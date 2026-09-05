# R004 — Grant Name primary, Grant Title alias — Review

ROLE: REVIEW
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R004
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R004-portfolio-import/REVIEW.md

## Result

**PASS** — R004 is strictly additive, correct, and introduces no scope creep. `Grant Name` is now primary, `Grant Title` remains as alias, both are placeholder-aware and optional, precedence is deterministic, and no persistence/upload/Funder/amount/date/authorization/schema contract was altered. The full Portfolio Import workstream has no unresolved CRITICAL or IMPORTANT findings and satisfies the frozen PLAN contract for closure.

## Scope verification — R004 Grant Name primary, Grant Title alias

### Additive and correct

- `src/lib/import/portfolio-xlsx.ts:13-28` `OPTIONAL_IMPORT_HEADERS` now 14 entries ending with `"Grant Name","Grant Title"` (added `"Grant Name"` alongside retained `"Grant Title"`). `29` `SUPPORTED_IMPORT_HEADERS` spreads it, so `findHeaderContract` (`244-286`) recognizes either header as `recognizedHeaders` and excludes them from `unsupportedHeaders`/`unsupportedSourceWarnings`. `REQUIRED_IMPORT_HEADERS` remains `["Funder","Type","Current Status"]` — no required-header, worksheet-selection, or matching-sheet contract changed.
- `mapCandidateRow` (`526-541`) reads both via existing `optionalText` (`333-337`) and applies existing `FUNDER_PLACEHOLDERS` = `["-","n/a","na","none","unknown","tbd","not applicable"]` via `normalizeKey` + `normalizeWhitespace`:
  ```ts
  const rawGrantName = optionalText(cells.get("Grant Name"), "Grant Name", errors);
  const rawGrantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors);
  const grantName = rawGrantName && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantName)) ? normalizeWhitespace(rawGrantName) : null;
  const grantTitleAlias = rawGrantTitle && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantTitle)) ? normalizeWhitespace(rawGrantTitle) : null;
  const effectiveTitle = grantName ?? grantTitleAlias;
  const title = effectiveTitle ?? (funderName ? (designation ? `${funderName} — ${designation}` : funderName) : null);
  ```
  Precedence `grantName ?? grantTitleAlias` — `Grant Name` wins when both present and non-placeholder; both optional, never required; formula in either column invalidates the row via `optionalText` → `textValue` (`320-324`) error `Formula values are not accepted in "Grant Name/Title".`; placeholder values (`"-","None","N/A","NA","Unknown","TBD","Not applicable"` case-insensitive, whitespace-collapsed, blank/`"-"` → `null`) fall back to derived `Funder — Designation` / `Funder`. When `effectiveTitle` present it is used verbatim; otherwise fallback is the frozen derived title. Distinct titles remain distinct Grants; duplicate titles are allowed. Title never contains row numbers or batch IDs.
- Fingerprint/duplicate logic automatically correct: `585-587` and post-`resolveFunders` `666-671` fingerprints include `grant.title`, so distinct Grant Names remain distinct Grants and identical normalized titles collapse with `collapsedSourceRows` evidence — no separate duplicate change needed. Amount/date/status/type/Funder/Designation/County/Notes/Next Steps mappings (`514-525, 532-538, 540-556`) verified unchanged.
- No schema or migration change: `prisma/schema.prisma` contains no `ImportStaging`, no new model/field; forward drop migration `20260904010000_remove_import_staging` preserved; `bunx prisma validate` PASS; `next.config.ts` 6 MiB Server Action limit, `xlsx` CDN `xlsx-0.20.3`, upload bounds, Funder resolution, transaction seams unchanged.

### Placeholder-aware

- Reuses `FUNDER_PLACEHOLDERS` via `normalizeKey` (case-insensitive) plus `normalizeWhitespace` (collapsed internal whitespace) — same mechanism R003 used for `Grant Title`, now extended to `Grant Name` primary.
- `optionalText` correctly maps blank/`"-"` → `null` and formula → error + `null`, so a formula in `Grant Name` or `Grant Title` invalidates the row rather than being silently used — consistent with PLAN's "formulas in recognized fields invalidate".
- Covered exhaustively by new tests: `uses Grant Name as primary title when present (Grant Title absent) and normalizes whitespace` verifies `"Real Name"` overrides Designation and `"  Real   Name  "` collapses to `"Real Name"`; `prefers Grant Name over Grant Title and falls back through placeholders to derived title` verifies both present → `Grant Name` wins, Title-only → fallback, `None`/`"-"`/`"N/A"`/`"Unknown"`/`"TBD"`/`"Not applicable"` each fall back to `Grant Title` alias then derived, both placeholders `None`+`-` → `"North Star Foundation — Housing Stability"` and no-designation fallback to bare funder `"Lone Funder"`; formula test verifies `Grant Name` formula → invalid with `Formula values are not accepted in "Grant Name".` and `Grant Title` formula → invalid with `Formula values are not accepted in "Grant Title".`.

### Backward-compatible

- Workbook without `Grant Name` column: `Grant Title` alias still drives title (`"Fallback Title"`), verified by `prefers Grant Name over Grant Title ...` title-only path and by preserved R003 tests (`uses Grant Title when present...`, `recognizes Grant Title as supported header`, `derives Funder — Designation title when Grant Title column is absent` — all PASS).
- Workbook without either header: derives `Funder — Designation` / `Funder` as before (PLAN derived title). No required-header change.
- Dirty fixture `data/mock-grant-data.xlsx` now contains `Grant Title: "None"` (R003) for all rows and no `Grant Name` column. Parser treats `"None"` as placeholder fallback; `handles the checked-in reference workbook without exceeding the import bound` still PASS with worksheet `Main Tracker`/`Main Tracker - FOR BOARD` and candidate bound enforced. Adding `Grant Name` support does not create spurious `"None"` titles.

### No scope creep

R004 does not change worksheet selection, `.xlsx` signature or 5 MiB/1,000-row bounds, status/type/amount/date contracts, Funder matching/ambiguity/conflicting-type rules, authorization, persistence/transaction (`src/app/(authenticated)/(org-required)/import/actions.ts` unchanged), UI beyond recognized-header handling, or introduce generic column-mapping engine, reusable import framework, schema fields, durable staging, queues, or other aliases (e.g., Project Name). Out-of-scope explicitly excluded in R004 BUILD.md is respected. Both headers remain optional recognized inputs; no new required column added.

## Full workstream judgment — no unresolved CRITICAL/IMPORTANT

Inspected: frozen `PLAN.md` (Phase REMEDIATION_REVIEW, `READY_FOR_USER` closing note), `PRODUCT.md`, T001/T002/T003 receipts (`DONE_WITH_CONCERNS`), original `VALIDATION.md` (one PRODUCT/DEFECT), R001 BUILD/VALIDATION/REVIEW (formula-only defect), R002 BUILD/VALIDATION/REVIEW (required-placeholder defect), R003 BUILD/VALIDATION/REVIEW (Grant Title), R004 BUILD/VALIDATION, current parser/actions/UI/schema/migration/configuration/tests/status/diff.

- Original `VALIDATION.md` defect (formula-only recognized value classified as structural, evading candidate bound) — **resolved** by R001 (`isClearlyStructuralRow` now treats recognized formulas as candidate evidence unless independently total/section; validated PASS, REVIEW PASS for originating defect). R004 preserves: `isClearlyStructuralRow` (`689-717`) still returns `false` for recognized formulas unless total row, `candidateRows` (`719-751`) still counts formula-bearing recognized cells toward `MAX_IMPORT_CANDIDATE_ROWS`. Tests `treats a formula-only Funder/Current Status cell as invalid candidate` and `counts formula-bearing candidates toward the candidate bound` remain PASS after R004.
- R001 REVIEW IMPORTANT defect (literal `-` in required fields treated as structural) — **resolved** by R002 (separate `isLiteralPlaceholder`/`hasRequiredPlaceholder` detection, `candidateRows` counts placeholders as recognized candidates, `isClearlyStructuralRow` returns `false` when `hasRequiredPlaceholder`, mapper emits `Funder is required.` / `Type is required.` / `Current Status is required.`). Tests `treats a literal Funder/Type/Current Status placeholder as invalid candidate` and `counts required placeholders toward and enforces the candidate bound` remain PASS after R004.
- Remaining **MINOR** — `Award Timeframe` mapped/persisted (`524` `awardTimeframe`, `545-551` grant object, validated) but not rendered in `src/components/import/portfolio-import-page.tsx:103-117` per-row `Detail` grid. Explicitly deferred per PLAN.md:376 ("non-blocking minor omission ... value remains mapped, persisted, and present in the server-produced preview DTO. No unresolved Critical or Important findings remain") and R001/R002/R003 reviews. Does not corrupt persistence; not a CRITICAL/IMPORTANT blocker under SoloFlow. R004 does not worsen or fix it — deliberately out of scope for this remediation.
- R003 additive Grant Title patch — **no regression** after R004: 5 Grant Title tests still PASS, reference workbook still parses, placeholder semantics preserved.
- No new PRODUCT/REGRESSION/NEW SCOPE defect introduced by R004 (verified via scope section above). `Grant Name` recognition, precedence, placeholder fallback, whitespace normalization, formula invalidation, and backward compat all verified.

## Evidence and checks

- Branch/CWD/repository root verified: `solo/portfolio-import` on `/Users/vike/Desktop/grant-flow` (`git branch --show-current`, `pwd`, `git rev-parse --show-toplevel`).
- Current impl inspected: `src/lib/import/portfolio-xlsx.ts`, `src/app/(authenticated)/(org-required)/import/actions.ts`, `src/components/import/portfolio-import-page.tsx`, `prisma/schema.prisma`, `prisma/migrations/20260904010000_remove_import_staging/migration.sql`, `next.config.ts`, `package.json` (SheetJS CDN `xlsx-0.20.3`), and all `src/test/portfolio-*.test.*` + `migration-chain.test.ts`.
- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — **PASS** (20 passed; 3 new R004 Grant Name tests PASS, 5 Grant Title tests PASS, 12 remaining including formula/placeholder/bound/structural/dedup/funder/date/config fixture tests PASS).
- `bun run test:run` — **PASS** (30 passed | 4 skipped (34 files); 152 passed | 27 skipped (179 tests); Duration ~34s). No fixture failure; dirty-fixture concern previously blocking is cleared (parser accepts `Main Tracker - FOR BOARD` / `Main Tracker`).
- `bunx tsc --noEmit` — **PASS** (exit 0).
- `bun run lint` — **PASS** (exit 0).
- `bunx prisma validate` — **PASS** (`The schema at prisma/schema.prisma is valid`).
- `bunx next build --webpack` — **PASS** (`Compiled successfully`, `/import` emitted as dynamic `ƒ /import`).
- `git diff --check` — **PASS** (no whitespace/conflict markers; HEAD diff reflects workstream branch untracked/modified state — inspected file content directly).
- Opt-in `src/test/postgres-portfolio-import.integration.test.ts` — **SKIPPED** (expected; `GRANTFLOW_TEST_DATABASE_ADMIN_URL` unset). Authorization-first, org-scoped `findMany` with `deletedAt: null`, `createManyAndReturn` bulk flow and `revalidatePath("/grants"|"/funders")` verified by code inspection and focused action tests (`portfolio-import-actions.test.ts` 6 tests PASS).
- `bun run build` (Turbopack) — **BLOCKED** by environment `node` spawn failure processing `src/app/globals.css`; `bun run verify:prisma` — **BLOCKED** by Bun/tsx `./cjs/index.cjs` resolution; `prisma migrate diff --shadowDatabaseUrl` — **BLOCKED** by missing `datasource.shadowDatabaseUrl`. Documented environment limitations; not product defects. `vitest configLoader: 'native'` warning informational.
- `git status` shows expected workstream branch state: modified `data/mock-grant-data.xlsx`, `dispatch/ACTIVE.md`, `next.config.ts`, `package.json`, `prisma/schema.prisma`, `src/app/(authenticated)/(org-required)/import/page.tsx`, `src/test/feature-placeholder.test.tsx`, `src/test/migration-chain.test.ts`, `vitest.config.ts`; untracked `dispatch/workstreams/portfolio-import/`, `prisma/migrations/20260904010000_remove_import_staging/`, `src/app/(authenticated)/(org-required)/import/actions.ts`, `src/components/import/`, `src/lib/import/`, other `src/test/portfolio-*.test.*`; no unrelated application/runtime assets altered.

Reviewer wrote only this assigned artifact; application, tests, fixtures, configuration, planning state, and prior evidence artifacts were not edited.

## Terminal status

**DONE — REVIEW PASS**
