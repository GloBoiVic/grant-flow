# R003 — Optional Grant Title column support

Remediation ID: R003
Status: DONE
Role: BUILD
Workstream: portfolio-import
Branch: solo/portfolio-import

## Origin finding and source artifact

- Source: Developer decision on Grant Title handling — tracker is funder-centric, but heterogeneous workbooks may contain a meaningful `Grant Title` column (e.g., edited `data/mock-grant-data.xlsx` now has `Grant Title: "None"` for all rows).
- Finding: `Grant Title` is currently `unsupportedHeaders` via `src/lib/import/portfolio-xlsx.ts` `SUPPORTED_IMPORT_HEADERS`; title is always derived `Funder — Designation`. Future workbooks with real grant titles would lose that value.

## Finding severity

PRODUCT / NEW SCOPE — MINOR, additive, backward-compatible.

## Related original task(s)

- T001 — XLSX parser and domain contract (source-to-domain mapping, Title derivation)
- T003 — Preview and confirmation UI (displays derived title)

## Approved requirement or invariant violated

No invariant violated. PLAN.md derived title `[Funder] — [Designation]` is correct for funder-centric trackers. This patch adds an optional, placeholder-aware override for heterogeneous trackers without changing persistence, upload, or Funder contracts.

## Exact remediation outcome

Add `Grant Title` as an optional recognized header:

1. Add `"Grant Title"` to `OPTIONAL_IMPORT_HEADERS` in `src/lib/import/portfolio-xlsx.ts`.
2. In `mapCandidateRow()`, read `grantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors)` — treats blank/`-`/`None`/`N/A`/etc via `FUNDER_PLACEHOLDERS` handling. If `grantTitle` non-blank and not placeholder, use it as `title`; else fallback to derived `Funder — Designation`.
3. Ensure placeholder `None`/`N/A` in `Grant Title` does not create spurious title — fallback to derived.
4. No schema/migration change. No UI change beyond preview now showing `Grant Title` as recognized (not unsupported).
5. Update `src/test/portfolio-xlsx.test.ts` to cover: Grant Title present, Grant Title placeholder falls back, no regression.

## Affected implementation seams

- `src/lib/import/portfolio-xlsx.ts` — header list and `mapCandidateRow` title derivation
- `src/test/portfolio-xlsx.test.ts` — add coverage

## Explicit out-of-scope items

Do not change worksheet selection, persistence/transaction, upload limits, Funder resolution, amount/date contracts, or introduce generic mapping. Do not add required `Grant Title`. Do not persist extra columns.

## Regression evidence required

- Existing funder-centric workbook (no Grant Title) still derives `Funder — Designation`
- Workbook with `Grant Title = "Real Title"` uses it as title
- Workbook with `Grant Title = "None"` / `"-"` / blank falls back to derived
- `Grant Title` appears in `recognizedHeaders`, not `unsupportedHeaders`
- Existing formula/placeholder/bound tests still pass
- `bun run test:run`, `tsc --noEmit`, `next build --webpack`, `prisma validate`, `git diff --check` pass

## Worker Evidence

### Pre-work verification

- `pwd` → `/Users/vike/Desktop/grant-flow` (CWD verified)
- `git branch --show-current` → `solo/portfolio-import` (workstream branch verified)
- `git status` pre-work: `src/lib/import/portfolio-xlsx.ts`, `src/test/portfolio-xlsx.test.ts`, `dispatch/workstreams/portfolio-import/`, and related portfolio-import seams present as untracked/modified on the workstream branch; repository root verified via `ls` and `prisma/schema.prisma`.
- Read `dispatch/workstreams/portfolio-import/PLAN.md` and `dispatch/workstreams/portfolio-import/remediations/R003-portfolio-import/BUILD.md` before acting; CodeGraph explored for `portfolio-xlsx.ts` seams.

### Implementation receipt

- Updated `src/lib/import/portfolio-xlsx.ts`:
  - Added `"Grant Title"` to `OPTIONAL_IMPORT_HEADERS` (now 13 optional headers); `SUPPORTED_IMPORT_HEADERS` automatically includes it, so `findHeaderContract` recognizes it as `recognizedHeaders` and no longer emits it as `unsupportedHeaders`/`unsupportedSourceWarnings`.
  - In `mapCandidateRow`, added:
    ```ts
    const rawGrantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors);
    const grantTitle = rawGrantTitle && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantTitle)) ? normalizeWhitespace(rawGrantTitle) : null;
    ```
    This reuses `optionalText` (blank/`-` → `null`, formula → error + `null`) and `FUNDER_PLACEHOLDERS` (`"-"`, `"n/a"`, `"na"`, `"none"`, `"unknown"`, `"tbd"`, `"not applicable"` case-insensitive via `normalizeKey`) to treat all listed placeholders as `null`. Whitespace is collapsed via `normalizeWhitespace` for deterministic titles.
  - Changed title derivation from `funderName ? (designation ? ...)` to `grantTitle ?? (funderName ? (designation ? ... ) : funderName)`. When `grantTitle` is present and non-placeholder, it is used verbatim; otherwise fallback is the existing derived `Funder — Designation` / `Funder` logic. No change to `Funder`, `Type`, `Current Status`, amounts, dates, `Designation`, or other mappings.
  - Fingerprint/duplicate collapsing automatically reflects the new title because `grant.title` is part of the fingerprint JSON; no separate duplicate logic change.
- No persistence, upload, Funder matching, amount/date, schema, migration, or authorization changes. `IMPORT_STAGING` removal and other portfolio-import contracts untouched.
- Verified `data/mock-grant-data.xlsx` (now containing `Grant Title: "None"` for all rows) still parses via existing test `handles the checked-in reference workbook` and via manual reasoning: placeholder `"None"` falls back to derived titles, so no spurious `"None"` titles are created.

### Test coverage added

- Updated `src/test/portfolio-xlsx.test.ts`:
  - Existing 14 tests preserved; added 3 focused regressions (total 17 in file, 149 overall):
    1. `uses Grant Title when present and falls back to derived title for placeholders and blank` — creates a `Grant Title`-aware header set, verifies real title `"Real Title"` overrides `Designation`, verifies whitespace collapse `"  Real   Title  "` → `"Real Title"`, loops over all placeholders `"-", "None", "none", "N/A", "n/a", "NA", "na", "Unknown", "UNKNOWN", "TBD", "tbd", "Not applicable", "NOT APPLICABLE", "not Applicable", "", null, "   "` each falling back to `"North Star Foundation — Housing Stability"`, and verifies placeholder with no designation falls back to bare funder `"Lone Funder"`.
    2. `recognizes Grant Title as a supported header without emitting unsupported warnings` — asserts `recognizedHeaders` contains `"Grant Title"` and all of `["Funder","Type","Current Status","Grant Title"]`, `unsupportedHeaders` is `[]` and does not contain `"Grant Title"`, title is `"Custom Grant Title"`.
    3. `derives Funder — Designation title when Grant Title column is absent` — verifies workbook without `Grant Title` column still derives `"North Star Foundation — Housing Stability"` and `recognizedHeaders` does not contain `"Grant Title"`.
  - All new tests use the existing `workbookBytes` helper and `XLSX` sheet construction; no new dependencies.

### Checks

- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — PASS (1 file, 17 tests).
- `bun run test:run` — PASS (30 passed | 4 skipped (34 files); 149 passed | 27 skipped (176 tests); Duration 35.71s). Existing formula/placeholder/bound/action/UI/configuration/migration tests continue to pass.
- `bunx tsc --noEmit` — PASS (no output, exit 0).
- `bun run lint` — PASS (no output, exit 0; `eslint`).
- `bunx prisma validate` — PASS (`The schema at prisma/schema.prisma is valid 🚀`).
- `bunx next build --webpack` — PASS (Compiled successfully in 12.0s; TypeScript finished; `/import` emitted as dynamic `ƒ /import`; all routes generated).
- `git diff --check` — PASS (exit 0, no trailing whitespace or conflict markers).
- `git status` post-work shows only the two task-owned file changes in the worktree diff plus pre-existing workstream untracked/modified portfolio-import seams (e.g., `data/mock-grant-data.xlsx`, `dispatch/ACTIVE.md`, `next.config.ts`, `package.json`, `prisma/schema.prisma`, `/import/page.tsx`, `vitest.config.ts`, migrations, actions, components, other test files) intentionally preserved per scope rules.

### Limitations and concerns

- PostgreSQL isolation/rollback integration tests remain skipped (`27 skipped`) because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset in this environment; no new failure observed.
- Authenticated browser upload/preview/confirmation not exercised (no local auth session); this remediation is parser/mapper-only and does not touch server actions, persistence, or UI components beyond header recognition.
- `data/mock-grant-data.xlsx` binary diff (18580 → 237647 bytes) reflects the upstream `Grant Title: "None"` column addition; parser correctly treats it as placeholder fallback, so no data loss.
- No schema/migration change; `prisma validate` confirms schema still valid. `Award Timeframe` UI minor gap remains out-of-scope as before.

### Files changed (this remediation only)

- `src/lib/import/portfolio-xlsx.ts`
- `src/test/portfolio-xlsx.test.ts`
- `dispatch/workstreams/portfolio-import/remediations/R003-portfolio-import/BUILD.md` (this receipt)

Pre-existing workstream files (`dispatch/ACTIVE.md`, `next.config.ts`, `package.json`, `prisma/schema.prisma`, `src/app/(authenticated)/(org-required)/import/*`, `src/components/import/*`, other `src/test/*`, `prisma/migrations/20260904010000_remove_import_staging/`, `vitest.config.ts`, `data/mock-grant-data.xlsx`) were left untouched by this patch and remain as staged/untracked on `solo/portfolio-import`.

## Terminal status

**DONE — BUILD**
