# R002 — Required placeholder candidate validation

ROLE: VALIDATE
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R002
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R002-portfolio-import/VALIDATION.md

## Result

**PASS WITH CONCERNS** — R002 resolves the immutable R001 IMPORTANT
`PRODUCT / DEFECT`: required `-` values are now candidate rows, receive visible
required-field errors, and count toward the 1,000-candidate bound. Optional
placeholder and structural-row behavior remains intact. No R002 PRODUCT or
REGRESSION defect was found.

## Acceptance evidence

- `src/lib/import/portfolio-xlsx.ts:204-205, 722-726` separately detects a
  literal required placeholder from the existing null/blank predicate, so
  `Funder: "-"`, `Type: "-"`, and `Current Status: "-"` provide candidate
  evidence. `:698-700` prevents those rows from being structural, and
  `:737-740` applies the candidate bound after counting them.
- The existing mapper emits `Funder is required.`, `Type is required.`, or
  `Current Status is required.` (`:337-385`), and the preview UI renders row
  errors in the visible `Excluded because` alert (`src/components/import/portfolio-import-page.tsx:151-157`).
- Focused regression command:
  `bunx --bun vitest run src/test/portfolio-xlsx.test.ts -t 'literal .*placeholder|optional placeholders|counts required placeholders'`
  — **PASS**, 5 tests passed, 9 skipped. This covers each required field,
  optional `-` → `null`, blank/total/section structural rows, exactly 1,000
  candidates with one invalid placeholder, and rejection above the bound.
  The bound test asserts `structural: 0`, `candidate: 1,000`, `invalid: 1`
  at the limit and a `1,000 candidate` error above it.
- Relevant action/UI/configuration/migration regression command:
  `bun run test:run -- src/test/portfolio-import-actions.test.ts src/test/portfolio-import-ui.test.tsx src/test/portfolio-import-configuration.test.ts src/test/migration-chain.test.ts`
  — **PASS**, 4 files and 12 tests passed.

## Findings

- **TOOLING / NEW SCOPE concern (not an R002 defect):** `bun run test:run`
  had 1 failure, 29 passing files, and 4 skipped files (145 passed, 27
  skipped tests). The failure is the pre-existing dirty tracked fixture
  `data/mock-grant-data.xlsx`: the current workbook sheet is `Main Tracker`,
  while the test expects the HEAD fixture's `Main Tracker - FOR BOARD`. The
  initial worktree status already showed this fixture modified; it was left
  untouched.
- No **PRODUCT / DEFECT**, **REGRESSION / DEFECT**, or additional **NEW SCOPE**
  finding was identified in the R002 implementation. The separate minor
  Award Timeframe UI gap remains outside this remediation as required by
  R002 BUILD.md.

## Checks

- `bunx --bun tsc --noEmit` — **PASS** on the serial rerun after the webpack
  build completed.
- `bun run lint` — **PASS**.
- `bunx --bun prisma validate` — **PASS**.
- `bunx --bun next build --webpack` — **PASS**; `/import` emitted as a
  dynamic route.
- `git diff --check` — **PASS**.
- `bun run test:run -- src/test/postgres-portfolio-import.integration.test.ts`
  — **SKIPPED** because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset.
- `bun run build` — **BLOCKED** by the environment's Turbopack failure to
  spawn the missing `node` executable while processing `src/app/globals.css`.
- `bun run verify:prisma` — **BLOCKED** by the Bun/tsx
  `Cannot find module './cjs/index.cjs'` runtime error.
- Vitest emitted the existing `configLoader: 'native'` CommonJS/ESM warning;
  it did not affect the focused or relevant subset results.

## Diff and limitations

- R002 BUILD.md and the current parser/test source were inspected. The
  remediation implementation and focused tests are untracked as part of the
  in-progress feature, so Git cannot provide an isolated R002 diff; current
  status remained on `solo/portfolio-import` with the expected workstream
  changes and the pre-existing fixture changes.
- No authenticated browser check was repeated: R002 changes only parser
  classification/tests, and the prior authenticated Local Host limitation
  remains applicable.

## Terminal status

**DONE WITH CONCERNS** — R002 validation complete; only this assigned validation
artifact was written.
