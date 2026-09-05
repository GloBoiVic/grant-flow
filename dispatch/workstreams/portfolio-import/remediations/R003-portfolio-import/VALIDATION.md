# R003 — Optional Grant Title column support

ROLE: VALIDATE
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R003
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R003-portfolio-import/VALIDATION.md

## Result

**PASS** — R003 implements the approved optional `Grant Title` override exactly as specified in `dispatch/workstreams/portfolio-import/remediations/R003-portfolio-import/BUILD.md` against the frozen `dispatch/workstreams/portfolio-import/PLAN.md` contract. No PRODUCT, REGRESSION, or NEW SCOPE defect was found.

## Frozen PLAN vs BUILD scope

- `PLAN.md` Source-to-domain contract derives `Grant.title` as `[Funder] — [Designation]` when Designation is populated otherwise Funder name; workbook has no title column. PLAN required headers are `Funder`, `Type`, `Current Status`; other headers are optional recognized inputs.
- `R003 BUILD.md` is additive backward-compatible: add `Grant Title` to `OPTIONAL_IMPORT_HEADERS`, in `mapCandidateRow()` read `grantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors)` with placeholder-aware fallback via `FUNDER_PLACEHOLDERS` + `normalizeWhitespace`, use `grantTitle` when non-placeholder otherwise derived title. No schema/migration, no persistence/upload/Funder contract change, no generic mapping, no required title.
- This validation confirms the patch is strictly within that additive scope and does not alter persistence, upload limits, Funder matching, amount/date contracts, or authorization.

## Acceptance evidence

### Implementation — `src/lib/import/portfolio-xlsx.ts`

- `13-27` `OPTIONAL_IMPORT_HEADERS` now 13 entries including `"Grant Title"`; `28` `SUPPORTED_IMPORT_HEADERS` spreads it, so `findHeaderContract` (`243-285`) recognizes it as `recognizedHeaders` not `unsupportedHeaders`.
- `49` `FUNDER_PLACEHOLDERS = Set(["-", "n/a", "na", "none", "unknown", "tbd", "not applicable"])` reused for Grant Title; `192-198` `normalizeWhitespace`/`normalizeKey` provide case-insensitive, whitespace-collapsed comparison.
- `525-526`:
  ```ts
  const rawGrantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors);
  const grantTitle = rawGrantTitle && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantTitle)) ? normalizeWhitespace(rawGrantTitle) : null;
  ```
  Reuses `optionalText` (`332-336`) which handles blank/`"-"` → `null` and formula → `errors.push(...)` + `null`; placeholders `None`/`N/A`/`Unknown`/`TBD`/`Not applicable` etc collapse to `null` via `FUNDER_PLACEHOLDERS` case-insensitive. Whitespace collapsed deterministically.
- `537` `const title = grantTitle ?? (funderName ? (designation ? `${funderName} — ${designation}` : funderName) : null);` — placeholder-aware fallback to derived `Funder — Designation` / `Funder`. No change to `Funder`, `Type`, `Current Status`, amounts, dates, `Designation`, or other mappings (`514-534`, `536-602` untouched).
- `581-583` fingerprint `JSON.stringify({ funder: funder.normalizedName, type: funder.type, grant, preservedSourceValues })` and `662-667` post-`resolveFunders` fingerprint both include `grant.title`, so duplicate collapsing automatically distinguishes distinct Grant Title values without separate logic.
- No schema/migration, persistence, upload, Funder resolution, amount/date, or authorization changes. `IMPORT_STAGING` removal and other portfolio-import contracts untouched (verified via `prisma/schema.prisma` — no ImportStaging model, and `git status` shows no R003-induced migration diff).

### Header recognition — `recognizedHeaders` correct, no spurious unsupported

- Test `recognizes Grant Title as a supported header without emitting unsupported warnings` — **PASS**: asserts `recognizedHeaders` contains `"Grant Title"` and all of `["Funder","Type","Current Status","Grant Title"]`, `unsupportedHeaders` is `[]` and does not contain `"Grant Title"`, title is `"Custom Grant Title"`.
- Test `uses Grant Title when present and falls back to derived title for placeholders and blank` — **PASS**: asserts `recognizedHeaders` contains `"Grant Title"`, `unsupportedHeaders` does not contain `"Grant Title"`, real title `"Real Title"` overrides Designation, whitespace `"  Real   Title  "` → `"Real Title"`.
- PLACEHOLDER set coverage verified in same test: loops `["-", "None", "none", "N/A", "n/a", "NA", "na", "Unknown", "UNKNOWN", "TBD", "tbd", "Not applicable", "NOT APPLICABLE", "not Applicable", "", null, "   "]` each falling back to `"North Star Foundation — Housing Stability"`; placeholder with no Designation falls back to bare funder `"Lone Funder"`.
- `derives Funder — Designation title when Grant Title column is absent` — **PASS**: workbook without Grant Title still derives `"North Star Foundation — Housing Stability"` and `recognizedHeaders` does not contain `"Grant Title"`.

### No persistence / upload / Funder regression

- Existing funder-centric workbook (no Grant Title) still derives `Funder — Designation` — verified by the third new test above and existing mapper tests.
- Workbook with `Grant Title = "None"` (dirty fixture `data/mock-grant-data.xlsx` now 18580 → 237647 bytes) still parses — `handles the checked-in reference workbook` **PASS**; placeholder `"None"` falls back to derived titles so no spurious `"None"` titles.
- Funder matching, amount/date, status/type maps, structural-row, formula, and bound logic untouched — existing tests continue to pass (see suite evidence below).
- Schema valid, no new fields — `bunx prisma validate` **PASS** (`The schema at prisma/schema.prisma is valid 🚀`).
- Upload/transaction seams unchanged — `src/app/(authenticated)/(org-required)/import/actions.ts` and `src/lib/import/portfolio-xlsx.ts` MAX_IMPORT_* constants unchanged; `src/test/portfolio-import-actions.test.ts` still authorizes before org-scoped `findMany` and bulk-transaction flow.

## Checks

- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — **PASS** (1 file, 17 tests). Covers the 3 new Grant Title regressions + 14 existing parser/mapper tests (mapping, amount preservation, dedup collapse, funder reuse/type-warning, formula/blank-year rejection, placeholder handling, structural skip, 1904 date system, reference workbook bound, sheet/type/size/bound rejections).
- `bun run test:run -- src/test/portfolio-xlsx.test.ts -t "Grant Title"` — **PASS** (3 passed | 14 skipped).
- `bun run test:run` (broader suite) — **PASS** (30 passed | 4 skipped (34 files); 149 passed | 27 skipped (176 tests); Duration 36.99s). No regression in action/UI/configuration/migration tests.
- `bunx tsc --noEmit` — **PASS** (exit 0, no output).
- `bun run lint` (`eslint`) — **PASS** (exit 0).
- `bunx prisma validate` — **PASS**.
- `bunx next build --webpack` — **PASS** (Compiled successfully 8.3s; TypeScript 7.4s; `/import` emitted as dynamic `ƒ /import`).
- `git diff --check` — **PASS** (exit 0; no trailing whitespace or conflict markers). Note: `src/lib/import/portfolio-xlsx.ts` and `src/test/portfolio-xlsx.test.ts` are untracked on `solo/portfolio-import` as part of the in-progress workstream, so HEAD diff is empty; `git status` shows expected modified/untracked workstream state (verified: CWD `/Users/vike/Desktop/grant-flow`, branch `solo/portfolio-import`).

## Findings

- No **PRODUCT / DEFECT**: placeholder list exactly matches `FUNDER_PLACEHOLDERS` (`"-"`, `"n/a"`, `"na"`, `"none"`, `"unknown"`, `"tbd"`, `"not applicable"`) case-insensitive via `normalizeKey`; whitespace collapsed; `Grant Title` is optional, not required; formula in Grant Title correctly invalidates via `optionalText` error propagation.
- No **REGRESSION / DEFECT**: funder-centric workbooks still derive titles; recognized/unsupported header contract preserved; duplicate fingerprint includes title; `data/mock-grant-data.xlsx` with `Grant Title: "None"` correctly falls back.
- No **NEW SCOPE** beyond approved BUILD: no worksheet selection change, no persistence/transaction change, no generic mapping, no schema migration.

## Diff and limitations

- R003 touches only `src/lib/import/portfolio-xlsx.ts` and `src/test/portfolio-xlsx.test.ts` (3 focused tests). Diff is untracked on this workstream; inspected file content directly rather than `git diff HEAD`. No other file was edited by this remediation — pre-existing workstream changes (`data/mock-grant-data.xlsx`, `dispatch/ACTIVE.md`, `next.config.ts`, `package.json`, `prisma/schema.prisma`, `/import/page.tsx`, `vitest.config.ts`, migrations, actions, components, other tests) were left untouched.
- PostgreSQL isolation/rollback integration tests remain **SKIPPED** (27 skipped) because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset — expected, no new failure.
- Authenticated browser upload/preview/confirmation not exercised (no local auth session); R003 is parser/mapper-only (header recognition + title derivation) and does not change server actions, persistence, or UI components beyond recognized header handling.
- `bun run build` (Turbopack) and `verify:prisma` remain blocked by environment constraints as previously documented; `next build --webpack` is the validated build seam.
- Vitest emits the existing `configLoader: 'native'` CommonJS/ESM warning; does not affect results.

## Terminal status

**DONE** — R003 validation complete; only this assigned validation artifact was written.
