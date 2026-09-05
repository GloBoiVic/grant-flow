# R004 — Grant Name as primary title header, Grant Title as alias

Remediation ID: R004
Status: DONE
Role: BUILD
Workstream: portfolio-import
Branch: solo/portfolio-import

## Origin finding and source artifact

- Source: Developer clarification — real trackers use `Grant Name`, not `Grant Title`; `data/mock-grant-data.xlsx` currently has `Grant Title: "None"` (R003 fallback works, but header is unnatural). `GrantFlow` stores `Grant.title` (displayed as Grant Name).
- Finding: `src/lib/import/portfolio-xlsx.ts` after R003 only recognizes `Grant Title`. `Grant Name` is still `unsupportedHeaders` and ignored.

## Finding severity

PRODUCT / NEW SCOPE — MINOR, additive, backward-compatible.

## Related original task(s)

- T001 — XLSX parser and domain contract
- R003 — Optional Grant Title support (adds title override)

## Approved requirement or invariant violated

No invariant violated. PLAN.md derived title remains fallback. This patch adds the natural header alias so heterogeneous trackers with `Grant Title` or `Grant Name` both work. Persistence, upload, Funder, amount/date contracts unchanged.

## Exact remediation outcome

Add `Grant Name` as optional recognized header alongside `Grant Title` (keep both for backward compatibility — R003 workbooks still have `Grant Title: "None"`):

1. Add `"Grant Name"` to `OPTIONAL_IMPORT_HEADERS` in `src/lib/import/portfolio-xlsx.ts` (keep `"Grant Title"`).
2. In `mapCandidateRow()`, read both:
    ```
    rawGrantName = optionalText(cells.get("Grant Name"), "Grant Name", errors)
    rawGrantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors)
    grantName = rawGrantName && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantName)) ? normalizeWhitespace(rawGrantName) : null
    grantTitleAlias = rawGrantTitle && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantTitle)) ? normalizeWhitespace(rawGrantTitle) : null
    effectiveTitle = grantName ?? grantTitleAlias
    title = effectiveTitle ?? (funderName ? (designation ? `${funderName} — ${designation}` : funderName) : null)
    ```
    Precedence: `Grant Name` wins when both are present and non-placeholder; `Grant Title` is alias fallback; placeholder `None`/`-`/`N/A`/etc still falls back to derived. Formula in either invalidates that row.
3. If both `Grant Name` and `Grant Title` columns exist and both are non-placeholder and differ, no hard error — `Grant Name` wins (documented). No schema/migration change.
4. Preview: both headers appear in `recognizedHeaders` when present; `Grant Name` not listed in `unsupportedHeaders`.

## Affected implementation seams

- `src/lib/import/portfolio-xlsx.ts` — header list and `mapCandidateRow` title resolution
- `src/test/portfolio-xlsx.test.ts` — extend coverage for Grant Name

## Explicit out-of-scope items

Do not add generic header alias engine, do not make Grant Name required, do not change Grant.title persistence/display, do not introduce new schema fields, do not handle other aliases (Project Name etc).

## Regression evidence required

- Workbook with `Grant Name = "Real Name"` uses it as title (no Grant Title)
- Workbook with `Grant Title = "Real Title"` (no Grant Name) still uses it (backward compat)
- Workbook with both `Grant Name = "Name Wins"` + `Grant Title = "Title Alias"` → title is `Name Wins`
- Workbook with `Grant Name = "None"` / `"-"` + `Grant Title = "Fallback Title"` → title is `Fallback Title`; both placeholders → derived `Funder — Designation`
- `Grant Name` recognizedHeaders, not unsupported
- Existing 17 tests + new Grant Name tests (19-20) pass; full suite, tsc, lint, prisma validate, next build --webpack pass
- `git diff --check` pass

## Worker Evidence

### Pre-work verification

- `pwd` → `/Users/vike/Desktop/grant-flow` (CWD verified)
- `git branch --show-current` → `solo/portfolio-import` (workstream branch verified)
- `git status` pre-work: workstream branch with prior portfolio-import seams (actions, page, import lib, components, tests, prisma migration, config) present as modified/untracked; repository root verified via `prisma/schema.prisma` and `src/lib/import/portfolio-xlsx.ts`.
- Read `dispatch/workstreams/portfolio-import/PLAN.md` and `dispatch/workstreams/portfolio-import/remediations/R004-portfolio-import/BUILD.md` before acting; CodeGraph explored for `OPTIONAL_IMPORT_HEADERS` / `mapCandidateRow` seams.

### Implementation receipt

- Updated `src/lib/import/portfolio-xlsx.ts`:
  - `OPTIONAL_IMPORT_HEADERS` now 14 entries: added `"Grant Name"` alongside retained `"Grant Title"` at end of array. `SUPPORTED_IMPORT_HEADERS` spreads both, so `findHeaderContract` now recognizes either header as `recognizedHeaders` and excludes them from `unsupportedHeaders`/`unsupportedSourceWarnings`.
  - In `mapCandidateRow` (lines 526-530), replaced single `rawGrantTitle`/`grantTitle` logic with dual read:
    ```ts
    const rawGrantName = optionalText(cells.get("Grant Name"), "Grant Name", errors);
    const rawGrantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors);
    const grantName = rawGrantName && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantName)) ? normalizeWhitespace(rawGrantName) : null;
    const grantTitleAlias = rawGrantTitle && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantTitle)) ? normalizeWhitespace(rawGrantTitle) : null;
    const effectiveTitle = grantName ?? grantTitleAlias;
    ```
    Reuses `optionalText` (blank/`-` → `null`, formula → pushes `Formula values are not accepted in "Grant Name/Title"` and returns `null`) and `FUNDER_PLACEHOLDERS` (`"-", "n/a", "na", "none", "unknown", "tbd", "not applicable"` via `normalizeKey` case-insensitive) to treat all listed placeholders as `null`. Whitespace collapsed via `normalizeWhitespace` for deterministic titles. Precedence: `grantName ?? grantTitleAlias`.
  - Changed title derivation from `grantTitle ?? (funderName ? ...)` to `effectiveTitle ?? (funderName ? (designation ? `${funderName} — ${designation}` : funderName) : null)`. When `effectiveTitle` present (Grant Name wins, else Grant Title alias), it is used verbatim; otherwise fallback is existing derived `Funder — Designation` / `Funder`. No change to `Funder`, `Type`, `Current Status`, amounts, dates, `Designation`, or other mappings. Fingerprint/duplicate collapsing automatically reflects new title because `grant.title` is part of the fingerprint JSON.
  - No persistence, upload, Funder matching, amount/date, schema, migration, or authorization changes. `IMPORT_STAGING` removal and other portfolio-import contracts untouched. Both headers optional, never required.

### Test coverage added

- Updated `src/test/portfolio-xlsx.test.ts` (previously 17 tests, now 20 in file; 152 passed total, 179 overall with 27 skipped):
  - Preserved existing 17 tests (including R003's 3 Grant Title regressions) — backward compat verified.
  - Added 3 focused Grant Name regressions:
    1. `uses Grant Name as primary title when present (Grant Title absent) and normalizes whitespace` — constructs `Grant Name`-only header set, verifies `recognizedHeaders` contains `"Grant Name"` and `unsupportedHeaders` is `[]` (not unsupported), title is `"Real Name"`, state valid, and whitespace `"  Real   Name  "` → `"Real Name"`.
    2. `prefers Grant Name over Grant Title and falls back through placeholders to derived title` — constructs headers with both `Grant Name` and `Grant Title`, verifies: both present → `Grant Name` wins (`"Name Wins"` over `"Title Alias"`), `Grant Title` alone → `"Fallback Title"` (backward compat), `Grant Name = "None"` / `"-"` + `Grant Title = "Fallback Title"` → `"Fallback Title"`, placeholders `"N/A","n/a","NA","Unknown","TBD","Not applicable"` similarly fall back, both placeholders `None`+`-` → derived `"North Star Foundation — Housing Stability"`, both placeholders with no designation + funder `"Lone Funder"` → `"Lone Funder"`. Verifies both headers in `recognizedHeaders`, neither in `unsupportedHeaders`.
    3. `recognizes Grant Name as supported header and invalidates formula-bearing title cells` — verifies `Grant Name` alone → `"Custom Grant Name"` with both headers recognized, both present differing → `Grant Name` wins, formula in `Grant Name` cell → `state: "invalid"` with error `Formula values are not accepted in "Grant Name".`, formula in `Grant Title` cell → `state: "invalid"` with `Formula values are not accepted in "Grant Title".` Covers spec requirement that formula in either invalidates row.

### Checks

- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — PASS (1 file, 20 tests — 3 new + 17 existing; all Grant Name/Title/placeholder/formula cases pass).
- `bun run test:run` — PASS (30 passed | 4 skipped (34 files); 152 passed | 27 skipped (179 tests); Duration ~35.8s). Existing formula/placeholder/bound/action/UI/configuration/migration/reference-workbook tests continue to pass.
- `bunx tsc --noEmit` — PASS (no output, exit 0).
- `bun run lint` — PASS (no output, exit 0; `eslint`).
- `bunx prisma validate` — PASS (`The schema at prisma/schema.prisma is valid 🚀`; no schema change).
- `bunx next build --webpack` — PASS (Compiled successfully in ~13.0s; TypeScript finished; `/import` emitted as dynamic `ƒ /import`; all routes generated).
- `git diff --check` — PASS (exit 0, no trailing whitespace or conflict markers).
- `git status` post-work shows only the two task-owned file changes in worktree diff (`src/lib/import/portfolio-xlsx.ts`, `src/test/portfolio-xlsx.test.ts`) plus this `BUILD.md` receipt; pre-existing workstream untracked/modified portfolio-import seams (`data/mock-grant-data.xlsx`, `dispatch/ACTIVE.md`, `next.config.ts`, `package.json`, `prisma/schema.prisma`, `/import/*`, `src/components/import/*`, other `src/test/*`, `prisma/migrations/20260904010000_remove_import_staging/`, `vitest.config.ts`) preserved per scope rules.

### Limitations and concerns

- PostgreSQL isolation/rollback integration tests remain skipped (`27 skipped`) because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset in this environment; no new failure observed.
- Authenticated browser upload/preview/confirmation not exercised (no local auth session); this remediation is parser/mapper-only and does not touch server actions, persistence, or UI components beyond header recognition.
- No schema/migration change; `prisma validate` confirms schema still valid. `Award Timeframe` UI minor gap remains out-of-scope as before.
- Generic header alias engine deliberately not introduced; only `Grant Name` + `Grant Title` are recognized. Other aliases remain unsupported and disclosed.

### Files changed (this remediation only)

- `src/lib/import/portfolio-xlsx.ts`
- `src/test/portfolio-xlsx.test.ts`
- `dispatch/workstreams/portfolio-import/remediations/R004-portfolio-import/BUILD.md` (this receipt)

Pre-existing workstream files (`dispatch/ACTIVE.md`, `next.config.ts`, `package.json`, `prisma/schema.prisma`, `src/app/(authenticated)/(org-required)/import/*`, `src/components/import/*`, other `src/test/*`, `prisma/migrations/20260904010000_remove_import_staging/`, `vitest.config.ts`, `data/mock-grant-data.xlsx`) were left untouched by this patch and remain as staged/untracked on `solo/portfolio-import`.

## Terminal status

**DONE — BUILD**
