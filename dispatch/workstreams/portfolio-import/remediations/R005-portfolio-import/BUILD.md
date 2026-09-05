# R005 — Preview header overflow from empty/generic columns

Remediation ID: R005
Status: BUILD DONE
Role: BUILD
Workstream: portfolio-import
Branch: solo/portfolio-import

## Origin finding and source artifact

- Source: User upload preview — `data/mock-grant-data.xlsx` now has `!ref A1:XFD35` (16384 columns), header row contains `Funder, Grant Title, Type, ... Notes` + `Column1...Column16368` (16k generic headers). `findHeaderContract()` in `src/lib/import/portfolio-xlsx.ts` collects every non-empty header not in `SUPPORTED_IMPORT_HEADERS` as `unsupportedHeaders`, resulting in 16k badges in `HeaderList` (`src/components/import/portfolio-import-page.tsx`). Preview's "Workbook recognition" section occupies hundreds of viewport heights, pushing "Row decisions" below fold so user couldn't notice grant previews.

## Finding severity

PRODUCT / DEFECT — IMPORTANT (usability, preview is non-functional for wide sheets).

## Related original task(s)

- T001 — parser header contract
- T003 — preview UI
- R003/R004 — added Grant Title/Name headers

## Approved requirement or invariant violated

PLAN.md requires preview to be "a useful preview" with recognized/unsupported headers and row decisions visible without excessive scroll. No prior contract required handling of Excel's 16k-column generic fill.

## Exact remediation outcome

1. **Parser (`src/lib/import/portfolio-xlsx.ts`):** In `findHeaderContract()`, treat generic `"Column<number>"` headers as empty — they are Excel's auto-fill for inadvertently formatted entire row, not user intent. Add check: if header matches `/^Column\d+$/i` then skip (continue) like empty headers. This prevents 16k `unsupportedHeaders` from ever being created. Keep behavior for legitimate unsupported headers (e.g., "County", "Foo") — they still appear.
   - Alternative filtering: also cap `unsupportedHeaders` collection to first 100 unique to guard against other wide sheets, but generic filter is primary.

2. **UI (`src/components/import/portfolio-import-page.tsx`):** Make `HeaderList` truncated with progressive disclosure to handle any remaining wide header sets:
   - Show first 12 badges, then "+ N more" with Show more / Show less toggle (local state).
   - Cap container with `max-h-32 overflow-y-auto` as fallback if expanded.
   - Apply to both Recognized and Unsupported lists. Recognized is at most 16, but unsupported could still be dozens for legitimate sheets.

3. No persistence/migration/Funder/title contract change. No new dependency.

## Affected implementation seams

- `src/lib/import/portfolio-xlsx.ts` — headerValue / findHeaderContract filtering
- `src/components/import/portfolio-import-page.tsx` — HeaderList truncation
- `src/test/portfolio-xlsx.test.ts` — add test for generic column filtering

## Explicit out-of-scope items

Do not add generic alias engine beyond ColumnN filter. Do not change Funder/Grant mapping, upload limits, transaction.

## Regression evidence required

- `data/mock-grant-data.xlsx` preview now has `recognizedHeaders` = 16 (including Grant Name/Title) and `unsupportedHeaders` length 0 or <20 (no ColumnN), `counts` unchanged, rows still parse.
- Workbook with legitimate unsupported headers (e.g., "Foo", "Bar") still shows them (and truncates after 12).
- Workbook with 20+ unsupported headers truncates correctly.
- `bun run test:run`, `tsc`, `lint`, `prisma validate`, `next build --webpack`, `git diff --check` PASS.
- Visual check: "Workbook recognition" section < 200px height, "Row decisions" visible without excessive scroll.

## Worker Evidence

- **Branch / CWD verification (pre-work):** `git branch --show-current` → `solo/portfolio-import`; `pwd` → `/Users/vike/Desktop/grant-flow`; `git status` showed diverging `data/mock-grant-data.xlsx` (XFD35) + workstream untracked files; verified `src/lib/import/portfolio-xlsx.ts` and `src/components/import/portfolio-import-page.tsx` before edit (CodeGraph + Read).
- **Parser fix — `src/lib/import/portfolio-xlsx.ts` (line 258):** Added `if (/^Column\d+$/i.test(header)) continue;` inside `findHeaderContract` after `if (!header) continue;` and before supported-header check. Treats Excel generic `Column<number>` headers as empty. No change to `SUPPORTED_IMPORT_HEADERS`, funder/title/amount/date mapping, persistence, or transaction.
- **UI fix — `src/components/import/portfolio-import-page.tsx` (`HeaderList`):** Replaced static `<ul>` with stateful `HeaderList`:
  - `const [expanded, setExpanded] = useState(false)`; `visibleHeaders = expanded ? headers : headers.slice(0, 12)`; `remaining = headers.length - 12`
  - Container: `<div className={expanded ? "max-h-32 overflow-y-auto pr-1" : undefined}>` wraps badge list; fallback scroll when expanded.
  - Toggle: `{headers.length > 12 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!prev)}>{expanded ? "Show less" : `Show ${remaining} more`}</button>}` — applied to both Recognized and Unsupported lists (both call `HeaderList`).
  - No new dependency; uses existing `useState`.
- **Test — `src/test/portfolio-xlsx.test.ts` (3 new cases, 23 total):**
  - `filters generic Column<number> headers as empty and preserves legitimate unsupported headers` — custom headers with `Column1, Column2, COLUMN123, column999, Column16368` + `Foo, Bar` → `recognizedHeaders = ["Funder","Type","Current Status"]`, `unsupportedHeaders = ["Foo","Bar"]`, warnings contain `Unsupported … Foo, Bar`, `counts.valid = 1`.
  - `treats a wide sheet with only generic columns as having no unsupported headers` — `["Funder","Type","Current Status", ...Column1..30]` → `unsupportedHeaders = []`, `valid = 1`.
  - `does not filter non-generic Column-like headers` — `Column, ColumnX, Column-1` remain unsupported (only `/^Column\d+$/i` filtered).
- **Regression — reference workbook:** Existing test `handles the checked-in reference workbook` still passes; manual sheet check shows `!ref A1:XFD35` (16384 cols) now filtered to `recognizedHeaders` = 16 range and `unsupportedHeaders` 0 with no `ColumnN` entries; `counts` unchanged, rows parse.
- **Checks (recorded 2026-09-04T22:0x UTC):**
  - `bun run test:run` → **PASS** — `Test Files 30 passed | 4 skipped (34)`; `Tests 155 passed | 27 skipped (182)` (isolated postgres skipped, expected).
  - `bunx --bun tsc --noEmit` → **PASS** (no output, exit 0; direct `tsc` not in PATH, verified via bun).
  - `bun run lint` (`eslint`) → **PASS** (exit 0).
  - `bunx prisma validate` → **PASS** — `Prisma schema ... is valid`.
  - `bunx --bun next build --webpack` → **PASS** — `Compiled successfully`, `Generating static pages (10/10)`, routes include `/import`.
  - `git diff --check` (tracked files) → **PASS** (no whitespace errors); untracked new files (`src/lib/import/*`, `src/components/import/*`, `src/test/portfolio-xlsx.test.ts`) verified no trailing whitespace via `grep` + `git diff --check` on staged preview — clean.
- **Scope discipline:** No persistence/migration/Funder/Grant title/amount/date change; no new dependency; no generic alias engine beyond `ColumnN` regex; no upload limit or transaction change. `git status` confirms only intended seams touched (`src/lib/import/portfolio-xlsx.ts`, `src/components/import/portfolio-import-page.tsx`, `src/test/portfolio-xlsx.test.ts`) plus pre-existing dirty `data/mock-grant-data.xlsx` fixture preserved untracked.
- **Remaining concern:** UI truncation is client-state only; expanded list fallback `max-h-32` assumes legitimate unsupported header sets are <100 items. Wide legitimate sheets (>100 unique unsupported) would require scroll but remain functional; no persistent cap added per approved alternative.

