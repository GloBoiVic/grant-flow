# R004 — Grant Name primary, Grant Title alias

ROLE: VALIDATE
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R004
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R004-portfolio-import/VALIDATION.md

## Result

**PASS** — R004 implements the approved `Grant Name` primary patch exactly as specified in `dispatch/workstreams/portfolio-import/remediations/R004-portfolio-import/BUILD.md` against the frozen `dispatch/workstreams/portfolio-import/PLAN.md` contract. No PRODUCT, REGRESSION, or NEW SCOPE defect was found. `Grant Name` wins over `Grant Title`, placeholder-aware fallback to derived `Funder — Designation` is correct, `Grant Title` remains as backward-compatible alias, and no persistence/upload/Funder/amount/date regression was observed.

## Frozen PLAN vs BUILD scope

- `PLAN.md` Source-to-domain contract: `Grant.title` is derived `[Funder] — [Designation]` when Designation populated otherwise `Funder` name; workbook has no required title column. Required headers are `Funder`, `Type`, `Current Status`; all other known workbook headers are optional recognized inputs. Title must never contain row numbers/batch IDs and distinct grants may share a title.
- `R003` added optional `Grant Title` with placeholder-aware fallback (`"-","None","N/A","NA","Unknown","TBD","Not applicable"` → derived) — additive, backward-compatible, no schema/migration.
- `R004 BUILD.md` is additive backward-compatible: add `Grant Name` alongside retained `Grant Title` in `OPTIONAL_IMPORT_HEADERS` (14 entries total), in `mapCandidateRow()` read both via `optionalText`, normalize `grantName = rawGrantName && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantName)) ? normalizeWhitespace(rawGrantName) : null`, `grantTitleAlias` similarly, `effectiveTitle = grantName ?? grantTitleAlias`, `title = effectiveTitle ?? (funderName ? (designation ? `${funderName} — ${designation}` : funderName) : null)`. Precedence `Grant Name` wins when both non-placeholder; both optional, never required; formula in either invalidates row; no schema/migration, no persistence/upload/Funder/amount/date/authorization change; no generic alias engine.
- This validation confirms the patch is strictly within that additive scope and does not alter persistence, upload limits, Funder matching, amount/date, or authorization contracts.

## Acceptance evidence

### Implementation — `src/lib/import/portfolio-xlsx.ts`

- `13-28` `OPTIONAL_IMPORT_HEADERS` now 14 entries ending with `"Grant Name","Grant Title"` (added `"Grant Name"` alongside retained `"Grant Title"`); `29` `SUPPORTED_IMPORT_HEADERS` spreads it, so `findHeaderContract` (`244-286`) recognizes either as `recognizedHeaders` and excludes them from `unsupportedHeaders`/`unsupportedSourceWarnings`.
- `50` `FUNDER_PLACEHOLDERS = Set(["-", "n/a", "na", "none", "unknown", "tbd", "not applicable"])` reused for both title columns; `193-199` `normalizeWhitespace`/`normalizeKey` provide case-insensitive, whitespace-collapsed comparison.
- `526-530`:
  ```ts
  const rawGrantName = optionalText(cells.get("Grant Name"), "Grant Name", errors);
  const rawGrantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors);
  const grantName = rawGrantName && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantName)) ? normalizeWhitespace(rawGrantName) : null;
  const grantTitleAlias = rawGrantTitle && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantTitle)) ? normalizeWhitespace(rawGrantTitle) : null;
  const effectiveTitle = grantName ?? grantTitleAlias;
  ```
  Reuses `optionalText` (`333-337`) which handles blank/`"-"` → `null` and formula → `errors.push('Formula values are not accepted in "Grant Name/Title".')` + `null`. Placeholders via `FUNDER_PLACEHOLDERS` case-insensitive, whitespace collapsed via `normalizeWhitespace`.
- `541` `const title = effectiveTitle ?? (funderName ? (designation ? `${funderName} — ${designation}` : funderName) : null);` — when `effectiveTitle` present (Grant Name wins, else Grant Title alias) it is used verbatim; otherwise fallback is existing derived `Funder — Designation` / `Funder`. No change to `Funder` (`515`), `Type` (`516`), `Current Status` (`517`), amounts (`532-538`), dates (`524-525`), `Designation`/`Notes` etc.
- `585-587` fingerprint `JSON.stringify({ funder: funder.normalizedName, type: funder.type, grant, preservedSourceValues })` and `666-671` post-`resolveFunders` fingerprint both include `grant.title`, so duplicate collapsing (`675-687`) automatically distinguishes distinct title values without separate logic.
- No schema/migration, persistence, upload, Funder resolution, amount/date, or authorization changes. `MAX_IMPORT_FILE_BYTES`/`MAX_IMPORT_CANDIDATE_ROWS`/`IMPORT_FILE_EXTENSION` (`8-10`) unchanged; `prisma/schema.prisma` still has no `ImportStaging` model; no new migration added for R004 (verified `prisma/migrations/` still only `20260904010000_remove_import_staging`).

### Both headers recognized, not unsupported

- Test `uses Grant Name as primary title when present (Grant Title absent) and normalizes whitespace` — **PASS**: constructs header set with `Grant Name` only, asserts `recognizedHeaders` contains `"Grant Name"`, `unsupportedHeaders` is `[]` and does not contain `"Grant Name"`, title is `"Real Name"` with state valid, and whitespace `"  Real   Name  "` → `"Real Name"`.
- Test `prefers Grant Name over Grant Title and falls back through placeholders to derived title` — **PASS**: both headers present → asserts `recognizedHeaders` contains both `"Grant Name"` and `"Grant Title"`, neither in `unsupportedHeaders`.
- Test `recognizes Grant Name as supported header and invalidates formula-bearing title cells` — **PASS**: single `Grant Name` row asserts both `"Grant Name"` and `"Grant Title"` in `recognizedHeaders`, neither in `unsupportedHeaders`, title `"Custom Grant Name"`; both present differing → `"Name Wins"`.

### Grant Name wins precedence (Grant Title is alias)

- Test `prefers Grant Name over Grant Title ...` — **PASS**: `Grant Name="Name Wins"` + `Grant Title="Title Alias"` → title `"Name Wins"` (Grant Name wins). Verified again in third test with same assertion.
- No hard error when both differ and both non-placeholder — documented precedence, no invalid state, `Grant Name` wins as specified.

### Placeholder-aware fallback to derived `Funder — Designation`

- Test `uses Grant Name as primary title ...` implicitly covers non-placeholder path; placeholder path covered extensively in second test:
  - `Grant Name=null` + `Grant Title="Fallback Title"` → `"Fallback Title"` (Grant Title alias used when Grant Name absent).
  - `Grant Name="None"` + `Grant Title="Fallback Title"` → `"Fallback Title"`; `Grant Name="-"` similarly.
  - Loop over `["N/A","n/a","NA","Unknown","TBD","Not applicable","NOT APPLICABLE"]` each as `Grant Name` with `Grant Title="Fallback Title"` → `"Fallback Title"` — placeholder list exactly matches `FUNDER_PLACEHOLDERS` case-insensitive via `normalizeKey`.
  - Both placeholders `Grant Name="None"` + `Grant Title="-"` → derived `"North Star Foundation — Housing Stability"` (with Designation).
  - Both placeholders no Designation: `Grant Name="N/A"` + no Designation → `"North Star Foundation"`; `Grant Name="None"` + `Grant Title="N/A"` with `Lone Funder` and no Designation → `"Lone Funder"`.
- R003 placeholder semantics preserved: `Grant Title` alone with placeholders already verified to fallback; R004 extends same semantics to `Grant Name` primary without changing derivation.

### Backward compatibility — `Grant Title` still works

- Existing R003 tests still present and PASS (5 tests matching `Grant Title`):
  - `uses Grant Title when present and falls back to derived title for placeholders and blank` — **PASS**: `"Real Title"` overrides Designation, whitespace collapsed, full placeholder loop (`"-","None","N/A","Unknown","TBD","Not applicable"` etc) falls back to derived, no-designation fallback to bare funder.
  - `recognizes Grant Title as a supported header without emitting unsupported warnings` — **PASS**.
  - `derives Funder — Designation title when Grant Title column is absent` — **PASS**: workbook without Grant Title column still derives `"North Star Foundation — Housing Stability"`.
- Reference workbook `data/mock-grant-data.xlsx` (with `Grant Title: "None"`) still parses: `handles the checked-in reference workbook without exceeding the import bound` — **PASS**. Placeholder `"None"` correctly falls back to derived titles so no spurious `"None"` titles, even with new `Grant Name` support.

### Formula handling — either column invalidates row

- Test `recognizes Grant Name as supported header and invalidates formula-bearing title cells` — **PASS**: formula in `Grant Name` cell → `state: "invalid"` with error `Formula values are not accepted in "Grant Name".`; formula in `Grant Title` cell → `state: "invalid"` with `Formula values are not accepted in "Grant Title".` via `optionalText` error propagation (`333-337` → `textValue` `321-324`). Satisfies BUILD requirement that formula in either invalidates that row.

### No persistence / upload / Funder regression

- Funder matching, amount/date, status/type maps, structural-row, duplicate collapse, and domain validation untouched — all existing mapper tests continue to pass (see suite evidence).
- Schema valid, no new fields — `bunx prisma validate` **PASS**.
- Upload/transaction seams unchanged — `src/app/(authenticated)/(org-required)/import/actions.ts` still authorization-first, org-scoped `findMany` with `deletedAt: null`, bulk-transaction flow; `MAX_IMPORT_*` constants unchanged; `src/test/portfolio-import-actions.test.ts` authorizes before org-scoped operations (covered by broader suite).
- `Award Timeframe` UI minor gap remains out-of-scope as before (PLAN Concerns); not introduced by R004.

## Checks

- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — **PASS** (1 file, 20 tests — 3 new R004 + 3 R003 + 14 original; all Grant Name/Title/placeholder/formula/structural/bound/reference cases pass).
- `bun run test:run -- src/test/portfolio-xlsx.test.ts -t "Grant Name"` — **PASS** (3 passed | 17 skipped).
- `bun run test:run -- src/test/portfolio-xlsx.test.ts -t "Grant Title"` — **PASS** (5 passed | 15 skipped) — backward compat verified.
- `bun run test:run` (broader suite) — **PASS** (30 passed | 4 skipped (34 files); 152 passed | 27 skipped (179 tests); Duration 20.95s). No regression in action/UI/configuration/migration tests.
- `bunx tsc --noEmit` — **PASS** (exit 0, no output).
- `bun run lint` (`eslint`) — **PASS** (exit 0).
- `bunx prisma validate` — **PASS** (`The schema at prisma/schema.prisma is valid 🚀`).
- `bunx next build --webpack` — **PASS** (Compiled successfully 8.3s; TypeScript 5.6s; `/import` emitted as dynamic `ƒ /import`; all routes generated).
- `git diff --check` — **PASS** (exit 0; no trailing whitespace or conflict markers). Note: `src/lib/import/portfolio-xlsx.ts` and `src/test/portfolio-xlsx.test.ts` are untracked on `solo/portfolio-import` as part of the in-progress workstream, so staged diff is empty; file content inspected directly via `Read`/`codegraph_explore`. `git status` shows expected modified/untracked workstream state (verified: CWD `/Users/vike/Desktop/grant-flow`, branch `solo/portfolio-import`).

## Findings

- No **PRODUCT / DEFECT**: `Grant Name`/`Grant Title` recognition correct, precedence `Grant Name ?? Grant Title` correct, placeholder set exactly `FUNDER_PLACEHOLDERS` case-insensitive via `normalizeKey`, whitespace collapsed, both optional not required, formula in either column correctly invalidates row, fallback to derived `Funder — Designation`/`Funder` correct, fingerprint includes title so duplicate logic unaffected.
- No **REGRESSION / DEFECT**: `Grant Title` alias still works standalone; funder-centric workbooks without either header still derive titles; recognized/unsupported header contract preserved for both headers; existing formula/placeholder/bound/amount/date/status tests still pass; reference workbook still parses.
- No **NEW SCOPE** beyond approved BUILD: no worksheet selection change, no persistence/transaction change, no generic mapping, no schema migration, no required title, no other alias (e.g., Project Name) added — deliberately out-of-scope and remains unsupported.

## Diff and limitations

- R004 touches only `src/lib/import/portfolio-xlsx.ts` (header list + dual-read `mapCandidateRow`) and `src/test/portfolio-xlsx.test.ts` (3 focused Grant Name regressions). Diff is untracked on this workstream; inspected file content directly rather than `git diff HEAD`. No other file was edited by this remediation — pre-existing workstream changes (`data/mock-grant-data.xlsx`, `dispatch/ACTIVE.md`, `next.config.ts`, `package.json`, `prisma/schema.prisma`, `/import/*`, `src/components/import/*`, other `src/test/*`, `prisma/migrations/20260904010000_remove_import_staging/`, `vitest.config.ts`) were left untouched.
- PostgreSQL isolation/rollback integration tests remain **SKIPPED** (27 skipped, 4 files skipped) because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset — expected, no new failure.
- Authenticated browser upload/preview/confirmation not exercised (no local auth session); R004 is parser/mapper-only (header recognition + title derivation) and does not change server actions, persistence, or UI components beyond recognized header handling.
- `bun run build` (Turbopack) and `verify:prisma` remain blocked by environment constraints as previously documented; `next build --webpack` is the validated build seam.
- Vitest emits the existing `configLoader: 'native'` CommonJS/ESM warning; does not affect results.

## Terminal status

**DONE** — R004 validation complete; only this assigned validation artifact was written.
