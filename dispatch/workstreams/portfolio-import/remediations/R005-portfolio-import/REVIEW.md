# R005 — Preview header overflow from empty/generic columns — Review

ROLE: REVIEW
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R005
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R005-portfolio-import/REVIEW.md

## Result

**PASS** — R005 correctly and minimally fixes the empty-column overflow. Generic `Column<number>` headers are filtered at the parser, `HeaderList` truncates with progressive disclosure, the reference workbook no longer floods the preview, legitimate unsupported headers remain disclosed, and row decisions are visible without excessive scroll. No scope creep and no new PRODUCT/REGRESSION defect introduced. The full Portfolio Import workstream has no unresolved CRITICAL or IMPORTANT findings and satisfies the frozen PLAN contract for closure.

## R005 scope verification — correct and minimal

### Parser — `src/lib/import/portfolio-xlsx.ts:255-268`

```ts
for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
  const header = headerValue(worksheet, rowIndex, columnIndex);
  if (!header) continue;
  if (/^Column\d+$/i.test(header)) continue;
  if ((SUPPORTED_IMPORT_HEADERS as readonly string[]).includes(header)) { ... }
  else { unsupportedHeaders.push(header); }
}
```

- Inserted **one line** `if (/^Column\d+$/i.test(header)) continue;` after empty-header skip and before supported-header check. Treats Excel auto-fill `Column<number>` (case-insensitive, digits-only) as empty, preventing 16k `unsupportedHeaders` from `data/mock-grant-data.xlsx` (`!ref A1:XFD35`, 16384 columns).
- Exact regex: `Column1`, `Column2`, `COLUMN123`, `column999`, `Column16368` filtered; `Column`, `Column `, `ColumnX`, `Column-1` preserved — verified by dedicated tests below. No change to `REQUIRED_IMPORT_HEADERS`, `OPTIONAL_IMPORT_HEADERS` (14 entries: 3 required + 14 optional including `Grant Name`/`Grant Title`), `SUPPORTED_IMPORT_HEADERS`, amount/date/status/type mapping, title derivation, Funder resolution, duplicate collapse, upload bounds, transaction, or schema.

### UI — `src/components/import/portfolio-import-page.tsx:48-77`

```tsx
function HeaderList({ headers, emptyMessage }: { headers: string[]; emptyMessage: string }) {
  const [expanded, setExpanded] = useState(false);
  if (headers.length === 0) return <p>{emptyMessage}</p>;
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
          className="self-start text-sm font-medium text-primary ...">
          {expanded ? "Show less" : `Show ${remaining} more`}
        </button>
      )}
    </div>
  );
}
```

- Stateful `HeaderList` shows first 12 badges, `Show N more` / `Show less` toggle with `useState(false)` and `aria-expanded`. Expanded fallback `max-h-32 overflow-y-auto pr-1` keeps UI bounded. Applied to **both** Recognized and Unsupported lists (lines 269, 273 call `HeaderList`). Recognized is at most 17 (3 required + 14 optional) so below threshold; unsupported could be dozens for legitimate sheets and now truncates. No new dependency (`useState` existing).
- No persistence, authorization, schema, or generic mapping change. Minimal two-seam fix as approved in `R005 BUILD.md`.

### No scope creep

- No generic header-alias engine beyond `ColumnN` regex, no Funder/Grant mapping change, no upload limit or transaction change, no migration, no new dependency. Explicit out-of-scope items in `R005 BUILD.md` respected.

## Evidence — tests and workbook

- **Parser tests `src/test/portfolio-xlsx.test.ts` — 23/23 PASS** (3 new R005 cases):
  - `filters generic Column<number> headers as empty and preserves legitimate unsupported headers` — headers `["Funder","Type","Current Status","Column1","Column2","COLUMN123","column999","Column16368","Foo","Bar"]` → `recognizedHeaders=["Funder","Type","Current Status"]`, `unsupportedHeaders=["Foo","Bar"]`, warnings `Unsupported … Foo, Bar`, `counts.valid=1`, asserts `not arrayContaining ColumnN`. Filter + preservation proven.
  - `treats a wide sheet with only generic columns as having no unsupported headers` — `["Funder","Type","Current Status", ...Column1..30]` → `unsupportedHeaders=[]`, `valid=1`. Wide-sheet guard.
  - `does not filter non-generic Column-like headers` — `["Funder","Type","Current Status","Column","Column ","ColumnX","Column-1"]` → `unsupportedHeaders` contains `Column, ColumnX, Column-1` and not `Column1`. Regex not over-broad.
- **Reference workbook** `data/mock-grant-data.xlsx` — `!ref A1:XFD35` verified on-disk (16384 columns, header auto-fill `Column1..Column16368`). Prior defect would produce `unsupportedHeaders.length ≈ 16k` (>hundreds of viewport heights). After fix, existing test `handles the checked-in reference workbook` still **PASS** (valid 18 / invalid 1 / structural 15 pattern broadly stable; `counts.candidate` bounded < 1,000). Manual workbook decode confirms header row contains supported headers plus `Column1..` tail; validator previously showed filtered result `recognized 13 / unsupported 3 (2026 cols) / hasColumnN false` — material invariant holds. Raw decode shows `Column1` now present in file's header row tail but filtered before `unsupportedHeaders` creation.
- **UI tests `src/test/portfolio-import-ui.test.tsx` — 3/3 PASS** — preview still renders `Unsupported headers`, `Excluded because`, `Collapsed duplicate`, acknowledgement gate, completion counts/links. No visual regression.
- **Workbook recognition → Row decisions visibility**: With 13 recognized + 3 unsupported badges (not 16k), `Workbook recognition` section is bounded (~two flex-wrap rows, <200px). `PreviewReport` structure verified: `Workbook recognition` grid (`263-283`) immediately followed by `Mapping decisions` and `Row decisions` (`316-331` `aria-labelledby="import-rows-title"` rendering `ImportRow` per candidate). Prior defect pushed `Row decisions` below fold; now visible without excessive scroll.

## Full workstream judgment — no unresolved CRITICAL/IMPORTANT

Inspected: frozen `PLAN.md` (Phase REMEDIATION_REVIEW, `READY_FOR_USER` closing note), `PRODUCT.md` boundary, T001/T002/T003 receipts (`DONE_WITH_CONCERNS`), original `VALIDATION.md` (one PRODUCT/DEFECT), R001 BUILD/VALIDATION/REVIEW, R002 BUILD/VALIDATION/REVIEW, R003 BUILD/VALIDATION/REVIEW, R004 BUILD/VALIDATION/REVIEW, R005 BUILD/VALIDATION, current parser/actions/UI/schema/migration/configuration/tests/status/diff.

- Original `VALIDATION.md` defect — formula-only recognized value classified as structural, evading candidate bound — **resolved by R001** (`isClearlyStructuralRow` returns `false` for recognized formulas unless independently total/section; `candidateRows` counts formula cells via `|| cell.formula`; tests for formula-only Funder/Current Status and `counts formula-bearing candidates toward the candidate bound` still PASS after R005).
- R001 REVIEW IMPORTANT — literal `-` in required fields treated as structural — **resolved by R002** (`isLiteralPlaceholder` / `hasRequiredPlaceholder`, `candidateRows` counts placeholders, `isClearlyStructuralRow` returns `false` when `hasRequiredPlaceholder`, mapper emits `Funder is required.` etc.). Tests for literal Funder/Type/Current Status placeholders and `counts required placeholders toward and enforces the candidate bound` still PASS after R005.
- R003 additive `Grant Title` — **no regression** (3 tests PASS, reference workbook with `Grant Title: "None"` placeholder still fallback-correct).
- R004 additive `Grant Name` primary / `Grant Title` alias — **no regression** (3 tests PASS, precedence `grantName ?? grantTitleAlias` correct, placeholder-aware, formula invalidates correctly, backward compat preserved).
- R005 overflow fix — **no regression** (evidence above). No new PRODUCT/REGRESSION/NEW SCOPE defect.
- Remaining **MINOR** — `Award Timeframe` mapped (`awardTimeframe` in `mapCandidateRow:524`, persisted `grant.awardTimeframe`, DTO present) but not rendered in per-row `Detail` grid (`portfolio-import-page.tsx:121-134`). Explicitly deferred per `PLAN.md:376` ("non-blocking minor omission ... No unresolved Critical or Important findings remain") and each R001–R004 review. Does not corrupt persistence; not a CRITICAL/IMPORTANT blocker under SoloFlow. R005 deliberately out-of-scope and does not worsen it.
- No new CRITICAL/IMPORTANT introduced. Concerns are TOOLING / ENVIRONMENT only (see Limitations).

## Checks

- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — **PASS** (1 file, 23 passed; 3 new R005 + 3 R004 + 3 R003 + 14 original including placeholder/formula/bound/structural/dedup/funder/date/config fixture).
- `bun run test:run` — **PASS** (30 passed | 4 skipped (34 files); 155 passed | 27 skipped (182 tests); Duration 33.68s). No fixture failure.
- `bunx --bun tsc --noEmit` — **PASS** (exit 0).
- `bun run lint` (`eslint`) — **PASS** (exit 0).
- `bunx prisma validate` — **PASS** (`The schema at prisma/schema.prisma is valid`).
- `bunx --bun next build --webpack` — inspected via prior R005 VALIDATION evidence **PASS** (Compiled successfully, `/import` emitted as dynamic `ƒ /import`; re-validated via `tsc`/`lint`/`prisma` above — webpack rebuild not repeated here to avoid redundant cost, but prior evidence shows `Compiled successfully` on this exact file set).
- `git diff --check` — **PASS** (exit 0, no whitespace/conflict markers; tracked diff empty because workstream files are untracked on `solo/portfolio-import` — inspected file content directly via `Read` + `codegraph_explore`).
- Branch/CWD/repository root verified: `solo/portfolio-import` on `/Users/vike/Desktop/grant-flow` (`git branch --show-current`, `pwd`, `git rev-parse --show-toplevel`).
- `git status --porcelain` shows expected workstream branch state: modified `data/mock-grant-data.xlsx`, `dispatch/ACTIVE.md`, `next.config.ts`, `package.json`, `prisma/schema.prisma`, `src/app/(authenticated)/(org-required)/import/page.tsx`, `src/test/feature-placeholder.test.tsx`, `src/test/migration-chain.test.ts`, `vitest.config.ts`; untracked `dispatch/workstreams/portfolio-import/`, `prisma/migrations/20260904010000_remove_import_staging/`, `src/app/(authenticated)/(org-required)/import/actions.ts`, `src/components/import/`, `src/lib/import/`, other `src/test/portfolio-*.test.*`. No unrelated application/runtime assets altered.

## Findings

- No **PRODUCT / DEFECT** (CRITICAL/IMPORTANT): ColumnN filter is exact `/^Column\d+$/i` applied before supported-header check; `HeaderList` truncation is 12 → toggle → `max-h-32 overflow-y-auto`, `aria-expanded` correct, applied to both lists; mock workbook no longer shows 16k unsupported, legitimate unsupported still disclosed with warnings, row decisions visible, invalid/collapsed/excluded counts preserved.
- No **REGRESSION / DEFECT**: All prior portfolio-xlsx cases (amount preservation/duplicate collapse, funder reuse/type warning, formula/bare-year rejection, placeholder handling, date systems, candidate bound, Grant Title/Grant Name precedence/placeholder/formula) still PASS; action/UI/configuration/migration tests PASS; build emits `/import`.
- No **NEW SCOPE** beyond approved BUILD: no new dependency, no generic alias engine beyond ColumnN, no Funder/Grant mapping change, no upload limit/transaction/schema change.
- **Minor documentation variance (non-blocking, noted in prior VALIDATION)**: `R005 BUILD.md` § Regression evidence states `recognizedHeaders = 16` for mock workbook shorthand; actual parse yields 13 recognized (mock lacks `Requested Year 2025`, `2025 Pending Requests`, `Awarded Year 2025`, `Grant Name`) plus 3 legitimate 2026 unsupported and 0 ColumnN. Accurate per file, not a defect — recommend aligning BUILD prose to `13 recognized / 3 unsupported / 0 ColumnN` or "up to 17" phrasing. No code change needed.

## Limitations and concerns

- Opt-in `src/test/postgres-portfolio-import.integration.test.ts` — **SKIPPED** (4 files skipped, 27 skipped) because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` unset — expected, no new failure. Authorization-first, org-scoped `findMany` with `deletedAt: null`, bulk `createManyAndReturn` flow and `revalidatePath("/grants"|"/funders")` verified by code inspection and focused action tests.
- Authenticated browser upload/preview/confirmation not exercised (no local auth session; `/import` redirects to `/login?redirect_url=...` without credentials). R005 is parser (`ColumnN` filter) + UI (`HeaderList` truncation) only and does not change server actions, persistence, or authorization. Visual height claim is badge-count bounded, not screenshot-measured, consistent with prior VALIDATION limitation.
- `bun run build` (Turbopack) and `verify:prisma` remain blocked by environment constraints (`node` spawn failure processing `globals.css`, Bun/tsx `./cjs/index.cjs` resolution) as previously documented; `next build --webpack` is the validated build seam.
- `vitest configLoader: 'native'` CommonJS/ESM warning informational, does not affect results.

## Terminal status

**DONE — REVIEW PASS**

Reviewer wrote only this assigned artifact; application, tests, fixtures, configuration, planning state, and prior evidence artifacts were not edited.
