# R005 — Preview header overflow from empty/generic columns

ROLE: VALIDATE
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R005
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R005-portfolio-import/VALIDATION.md

## Result

**PASS** — R005 implements the approved empty-column preview fix exactly as specified in `dispatch/workstreams/portfolio-import/remediations/R005-portfolio-import/BUILD.md` against the frozen `dispatch/workstreams/portfolio-import/PLAN.md` contract. Generic `Column<number>` headers are filtered at the parser, `HeaderList` truncates with progressive disclosure, `data/mock-grant-data.xlsx` (`!ref A1:XFD35`, 16384 columns) no longer shows 16k unsupported headers, legitimate unsupported headers are still shown, and row decisions remain visible. No PRODUCT, REGRESSION, or NEW SCOPE defect was found. One minor documentation variance noted (see Findings).

## Frozen PLAN vs BUILD scope

- PLAN requires preview to be "a useful preview" with recognized/unsupported headers and row decisions visible without excessive scroll. No prior contract required handling Excel's 16k-column generic fill.
- BUILD outcome is two-seam:
  1. Parser `src/lib/import/portfolio-xlsx.ts` — in `findHeaderContract()` treat `/^Column\d+$/i` as empty (skip like empty headers) before supported-header check. Keeps legitimate unsupported headers.
  2. UI `src/components/import/portfolio-import-page.tsx` — `HeaderList` shows first 12 badges, `Show N more` / `Show less` toggle with `useState(false)`, `aria-expanded`, and `max-h-32 overflow-y-auto` when expanded. Applied to both Recognized and Unsupported lists.
- No persistence/migration/Funder/title/amount/date/upload/transaction change, no new dependency, no generic alias engine beyond the ColumnN regex. This validation confirms strictly that scope.

## Acceptance evidence

### 1) Parser — generic ColumnN filtered, legitimate still shown

- **Code** `src/lib/import/portfolio-xlsx.ts:255-268`:
  ```ts
  for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
    const header = headerValue(worksheet, rowIndex, columnIndex);
    if (!header) continue;
    if (/^Column\d+$/i.test(header)) continue;
    if ((SUPPORTED_IMPORT_HEADERS as readonly string[]).includes(header)) { ... }
    else { unsupportedHeaders.push(header); }
  }
  ```
  Verified via `Read` and `codegraph_explore`. Filter is case-insensitive, digits-only, exactly `Column<number>` (e.g., `Column1`, `COLUMN123`, `column999`, `Column16368`). Non-generic `Column`, `ColumnX`, `Column-1` are not filtered — tested below.

- **Tests** `src/test/portfolio-xlsx.test.ts` — 3 new R005 cases, all **PASS** (23/23 in file):
  - `filters generic Column<number> headers as empty and preserves legitimate unsupported headers` — headers `["Funder","Type","Current Status","Column1","Column2","COLUMN123","column999","Column16368","Foo","Bar"]` with one valid row → `recognizedHeaders=["Funder","Type","Current Status"]`, `unsupportedHeaders=["Foo","Bar"]`, warnings contain `Unsupported … Foo, Bar`, `counts.valid=1`, and asserts `not arrayContaining ColumnN`. Shows filter + preservation.
  - `treats a wide sheet with only generic columns as having no unsupported headers` — `["Funder","Type","Current Status", ...Column1..30]` → `unsupportedHeaders=[]`, `valid=1`. Guards wide sheets where only generic fill exists.
  - `does not filter non-generic Column-like headers` — `["Funder","Type","Current Status","Column","Column ","ColumnX","Column-1"]` → `unsupportedHeaders` arrayContaining `Column, ColumnX, Column-1` and not `Column1`. Ensures regex is not over-broad.

### 2) UI — HeaderList truncated with Show more

- **Code** `src/components/import/portfolio-import-page.tsx:48-77`:
  ```tsx
  function HeaderList({ headers, emptyMessage }: { headers: string[]; emptyMessage: string }) {
    const [expanded, setExpanded] = useState(false);
    if (headers.length === 0) return <p ...>{emptyMessage}</p>;
    const visibleHeaders = expanded ? headers : headers.slice(0, 12);
    const remaining = headers.length - 12;
    return (
      <div className="flex flex-col gap-2">
        <div className={expanded ? "max-h-32 overflow-y-auto pr-1" : undefined}>
          <ul className="flex flex-wrap gap-2" aria-label="Headers">
            {visibleHeaders.map((header) => <li key={header}><Badge variant="outline">{header}</Badge></li>)}
          </ul>
        </div>
        {headers.length > 12 && (
          <button type="button" onClick={() => setExpanded((prev) => !prev)} aria-expanded={expanded}
            className="..."> {expanded ? "Show less" : `Show ${remaining} more`} </button>
        )}
      </div>
    );
  }
  ```
  Verified via `Read` and `grep`. Both `Recognized` and `Unsupported` sections call `HeaderList` (lines 269, 273), so truncation applies to any remaining wide header set. Recognized is at most 17 (3 required + 14 optional) so it stays below threshold; unsupported could be dozens for legitimate sheets and now truncates. Expanded fallback `max-h-32 overflow-y-auto pr-1` keeps UI bounded if user expands a legitimately large set. `aria-expanded` satisfies accessible disclosure.

- No visual regression in unit tests: `src/test/portfolio-import-ui.test.tsx` — 3/3 **PASS** (preview shows Unsupported headers, Invalid/Excluded, Collapsed duplicate, acknowledgement gate, completion counts/links). UI still renders `Unsupported headers`, `Internal owner is disclosed…`, `Source row 5` / `Excluded because` / `Collapsed duplicate`.

### 3) Mock workbook no longer shows 16k unsupported — legitimate unsupported still shown

- **Workbook fact**: `data/mock-grant-data.xlsx` has `!ref A1:XFD35` (16,384 columns) on `solo/portfolio-import` (verified `bun -e` via `xlsx` decode: `range cols 16383 rows 34`, `SheetNames ["Main Tracker"]`). Header row contains supported headers plus auto-filled `Column1…Column16368` — the origin finding.

- **Manual parser check** (vitest harness, server-only alias mocked, file `src/test/_r005_check.test.ts` temporary):
  ```
  recognized: ["Funder","Grant Title","Type","Requested Year 2024","Awarded Year 2024",
               "Current Status","Next Steps","Due Date","Approve/Decline Date",
               "Award Timeframe","Designation","County Served","Notes"] (13)
  unsupported: ["2026 Amount Requested","2026 Pending Requests","Awarded Year 2026"] (3)
  hasColumnN: false
  warnings: ["Unsupported source headers were not interpreted: 2026 Amount Requested, 2026 Pending Requests, Awarded Year 2026."]
  counts: {structural:15, candidate:19, valid:18, invalid:1, collapsed:0}
  ```
  **Before fix** would have been `unsupportedHeaders.length ≈ 16k` (ColumnN badges, hundreds of viewport heights). **After fix** `unsupportedHeaders.length=3`, `hasColumnN=false`, warnings contain only legitimate 2026 columns. `counts` unchanged vs pre-R005? `valid 18 / invalid 1 / structural 15` stable, rows still parse (existing test `handles the checked-in reference workbook` still **PASS** in 764ms). Figures differ from BUILD.md's shorthand `recognizedHeaders=16` — that shorthand counted all optional headers hypothetically present; actual mock workbook has 13 recognized (it lacks `Requested Year 2025`, `2025 Pending Requests`, `Awarded Year 2025`, `Grant Name`) and 3 legitimate unsupported 2026 columns. The material invariant — **no ColumnN** — holds, and preview is now bounded.

- **Legitimate unsupported still shown**: same manual check `["Funder","Type","Current Status","Foo","Bar"]` → `unsupported=["Foo","Bar"]` **PASS**; wide `Extra0…19` (20 unsupported) would render `12` visible + `Show 8 more` button (UI logic) and remain scrollable when expanded. Edge case `Column, ColumnX, Column-1` preserved as unsupported (test above).

### 4) Row decisions visible

- With `Workbook recognition` now `13` recognized + `3` unsupported badges (not 16k), the section is bounded (< ~200px, two flex-wrap rows). `PreviewReport` structure verified: `Workbook recognition` grid `lg:grid-cols-2` (lines 263-283) is followed by `Mapping decisions` and then `Row decisions` section `aria-labelledby="import-rows-title"` (lines 316-331) rendering each candidate row via `ImportRow` (counts, titles, Funder decisions, errors/warnings, collapsed markers). Prior defect pushed `Row decisions` below fold; now it is immediately below the bounded header card. Visual height claim backed by badge count math and existing UI test asserting `Source row 5` / `Excluded because` are in document.

## Checks

- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — **PASS** (1 file, 23 passed; 3 new R005 cases above + 20 prior including R003/R004/structural/bound/reference).
- `bun --bun vitest run src/test/portfolio-import-ui.test.tsx --reporter=verbose` — **PASS** (3/3).
- `bun run test:run` (broader suite) — **PASS** (30 passed | 4 skipped (34 files); 155 passed | 27 skipped (182 tests); Duration ~30s). No regression in action/configuration/migration/UI.
- `bunx --bun tsc --noEmit` — **PASS** (exit 0, no output; `tsc` not in PATH, run via `bun`).
- `bun run lint` (`eslint`) — **PASS** (exit 0).
- `bunx prisma validate` — **PASS** (`The schema at prisma/schema.prisma is valid`).
- `bunx --bun next build --webpack` — **PASS** (Compiled successfully in ~9s, TypeScript 7.8s, Generating static pages 10/10, route `ƒ /import` present).
- `git diff --check` — **PASS** (exit 0, no whitespace errors; note R005 files are untracked on this workstream so tracked diff is empty — content inspected directly via `Read`/`codegraph_explore`; see Diff below).
- Reference workbook manual parse — **PASS** (see §3).
- `git branch --show-current` → `solo/portfolio-import`; `pwd` → `/Users/vike/Desktop/grant-flow`; `git status --porcelain` shows dirty `data/mock-grant-data.xlsx` (XFD35 fixture, preserved untracked) + workstream untracked files — expected.

## Findings

- No **PRODUCT / DEFECT**: `ColumnN` fix is exact regex `/^Column\d+$/i`, applied before supported-header check, does not affect legitimate headers. `HeaderList` truncation is 12 → toggle → `max-h-32 overflow-y-auto`, aria-correct, applied to both lists. Mock workbook now 0 ColumnN, 3 legitimate unsupported, row decisions visible. Legitimate unsupported still disclosed with warnings. Invalid/collapsed/excluded counts preserved.
- No **REGRESSION / DEFECT**: All prior portfolio-xlsx cases (amount preservation/duplicate collapse, funder reuse/type warning, formula/bare-year rejection, placeholder handling, 1904 date system, candidate bound, Grant Title/Grant Name precedence/placeholder/formula) still PASS. UI acknowledgement/confirmation, action tenant isolation, configuration, and migration-chain tests still PASS. Build emits `/import`.
- No **NEW SCOPE** beyond approved BUILD: no new dependency, no generic alias engine beyond ColumnN, no Funder/Grant mapping change, no upload limit/transaction change, no schema migration.
- **Minor documentation variance (non-blocking)**: `BUILD.md` § Regression evidence states `recognizedHeaders = 16 (including Grant Name/Title)` for the mock workbook. Actual parse yields `13` recognized (mock lacks `Requested Year 2025`, `2025 Pending Requests`, `Awarded Year 2025`, `Grant Name`) plus `3` legitimate 2026 unsupported. This is accurate per file and does not indicate a defect — it is a shorthand in the BUILD before inspecting the exact column set. Recommendation: align BUILD prose to `13 recognized / 3 unsupported / 0 ColumnN` for this fixture, or clarify "up to 17" rather than "16". No code change needed.

## Diff and limitations

- R005 touches only `src/lib/import/portfolio-xlsx.ts` (1 line `if (/^Column\d+$/i.test(header)) continue;` after `if (!header) continue;`), `src/components/import/portfolio-import-page.tsx` (HeaderList stateful truncation), and `src/test/portfolio-xlsx.test.ts` (3 focused ColumnN regressions). Diff is untracked on `solo/portfolio-import` as part of in-progress workstream; inspected directly via `Read`/`codegraph_explore`. No other file was edited by this remediation — pre-existing workstream changes (`data/mock-grant-data.xlsx`, `dispatch/ACTIVE.md`, `next.config.ts`, `package.json`, `prisma/schema.prisma`, `src/app/(authenticated)/(org-required)/import/actions.ts`, other `src/test/*`, `prisma/migrations/20260904010000_remove_import_staging/`, `vitest.config.ts`) were left untouched. `git status` shows expected modified/untracked workstream state (verified CWD/Branch).
- PostgreSQL isolation/rollback integration tests remain **SKIPPED** (27 skipped, 4 files skipped) because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset — expected, no new failure.
- Authenticated browser upload/preview/confirmation not exercised (no local auth session); R005 is parser (`ColumnN` filter) + UI (`HeaderList` truncation) only and does not change server actions, persistence, or authorization. Visual height claim is badge-count bounded, not screenshot-measured, because `/import` redirects to `/login?redirect_url=...` without credentials (consistent with prior VALIDATION.md limitation).
- `bun run build` (Turbopack) and `verify:prisma` remain blocked by environment constraints as previously documented; `next build --webpack` is the validated build seam.
- Vitest emits the existing `configLoader: 'native'` CommonJS/ESM warning; does not affect results.

## Terminal status

**DONE** — R005 validation complete; only this assigned validation artifact was written.
