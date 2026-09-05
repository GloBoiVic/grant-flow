# R001 — Portfolio Import Review

ROLE: REVIEW
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R001
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R001-portfolio-import/REVIEW.md

## Result

**FAIL** — R001 resolves the originating formula-only candidate defect without scope or
contract drift, but the whole Portfolio Import feature still has one unresolved IMPORTANT
approved-contract defect. A separate minor UI reviewability gap is also recorded.

## Originating remediation judgment

- **PASS — PRODUCT / DEFECT resolved:** `src/lib/import/portfolio-xlsx.ts` now treats a
  formula in a recognized field as candidate evidence unless the row is independently a
  clear section/total row. Mapping still never evaluates formulas and exposes row-level
  formula errors.
- The focused formula-only Funder, formula-only Current Status, mixed-formula, and
  candidate-bound tests cover the originating failure. The remediation changed only the
  parser seam and its focused tests; it did not alter upload, mapping, persistence, UI,
  schema, migration, authorization, or Funder-resolution contracts.

## Findings

### PRODUCT / DEFECT — IMPORTANT — required placeholder-only rows are silently structural

`src/lib/import/portfolio-xlsx.ts:199-202,716-720` treats the literal `-` as blank while
deciding whether a row has recognized evidence. A row containing only `Funder: "-"`, or
only `Type: "-"` / `Current Status: "-"`, therefore reaches
`isClearlyStructuralRow()` with no values and is counted as structural rather than mapped
as an invalid candidate. The frozen source contract explicitly says required blank/`-`
cells are invalid, while structural rows are only fully blank, totals without a Funder, or
clear section headings. Such rows are consequently omitted from row-level invalid evidence,
candidate counts, and the visible excluded count. This is an approved-scope **DEFECT**, not
new scope, and requires the next remediation before closure.

### PRODUCT / DEFECT — MINOR — Award Timeframe is not shown in row review

`src/components/import/portfolio-import-page.tsx:103-117` renders the mapped row details
but omits `row.grant.awardTimeframe`, even though `Award Timeframe` is an approved source
mapping and is persisted by confirmation. The value is therefore not reviewable in the
server-produced preview. This does not corrupt persistence, but it weakens the approved
“see exactly what GrantFlow recognized/mapped” review contract. It is a minor **DEFECT** and
does not independently block a review pass.

No REGRESSION or NEW SCOPE finding was identified. The database, migration, tenancy,
authorization, transaction, parser, upload-bound, and confirmation seams otherwise align
with PLAN.md.

## Review evidence

- Branch/CWD/repository root verified as `solo/portfolio-import` and
  `/Users/vike/Desktop/grant-flow`.
- Original T001/T002/T003 receipts, failed original VALIDATION.md, R001 BUILD.md, R001
  VALIDATION.md, frozen PLAN.md, PRODUCT.md, current implementation, tests, schema,
  migration, configuration, and current worktree state were inspected.
- Authorization precedes analysis reads/parsing; confirmation re-parses and re-resolves
  inside one Prisma transaction. Organization, active-Funder, owner/creator, Activity,
  client-preview, and revalidation boundaries are correct.
- The forward `ImportStaging` drop preserves the baseline migration. The maintained SheetJS
  distribution and 6 MiB Server Action transport headroom are present alongside the 5 MiB
  application bound.
- Current diff/status showed the expected in-progress workstream changes. Reviewer wrote
  only this assigned artifact; application, tests, fixtures, config, planning state, and
  completed evidence artifacts were not edited.

## Checks

- `bun run test:run` — PASS (30 files passed, 4 skipped; 141 tests passed, 27 skipped).
- `bunx --bun tsc --noEmit` — PASS.
- `bun run lint` — PASS.
- `bunx --bun prisma validate` — PASS.
- `bunx --bun next build --webpack` — PASS; `/import` emitted as a dynamic route.
- `git diff --check` — PASS.
- `bun run build` — BLOCKED by the documented environment failure spawning the missing
  `node` executable from Turbopack while processing `src/app/globals.css`.
- `bun run verify:prisma` — BLOCKED by the documented Bun/tsx
  `Cannot find module './cjs/index.cjs'` error.

## Limitations and concerns

- The opt-in PostgreSQL isolation/rollback suite remains skipped because
  `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset. The implementation and focused action tests
  preserve the intended transaction boundary, but database-backed isolation and rollback
  evidence remains unavailable in this environment.
- Authenticated browser upload/preview/confirmation remains unexecuted because Local Host
  currently resolves `/import` to the login route and no authenticated test session is
  available. The login page was checked with no console errors; focused UI coverage and the
  webpack build passed.
- The previously documented Prisma migration-diff limitation (missing
  `datasource.shadowDatabaseUrl`) remains applicable.
- An unrelated untracked `data/.~mock-grant-data.xlsx` lock file was observed in the worktree
  during review and was left untouched.

## Terminal status

**DONE — REVIEW FAIL; next action is a new remediation for the IMPORTANT placeholder-only
required-row classification defect.**
