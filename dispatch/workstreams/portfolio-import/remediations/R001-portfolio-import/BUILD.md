# R001 — Formula-only recognized values must be invalid candidates

Remediation ID: R001
Status: DONE
Role: BUILD
Workstream: portfolio-import
Branch: solo/portfolio-import

## Origin finding and source artifact

- Source: `dispatch/workstreams/portfolio-import/VALIDATION.md`, PRODUCT / DEFECT finding.
- Finding: `src/lib/import/portfolio-xlsx.ts:684-699` can classify a non-structural row
  containing only a formula in a recognized field as structural and skip it. The frozen
  contract requires formula-bearing recognized values in candidate rows to be visibly
  invalid, and such a row must count toward the 1,000 candidate-row bound.

## Finding severity

PRODUCT / DEFECT — approved-scope contract violation.

## Related original task(s)

- T001 — XLSX parser and domain contract
- T002 — Scoped atomic preview and commit (confirmation consumes the parser decision)

## Approved requirement or invariant violated

PLAN.md requires candidate rows containing recognized mapped values to be represented as
candidate rows, and formulas in recognized fields of candidate rows to invalidate those
rows rather than trusting cached results. Structural rows may be skipped only when they
are clearly blank, totals, or isolated section headings. Candidate bounds apply to all
candidate rows, including formula-bearing invalid rows.

## Exact remediation outcome

Change structural/candidate classification so a row with a formula in a recognized field,
including a formula-only recognized-field row, is treated as a candidate unless it is an
independently clear structural total/section row under the frozen contract. Mapping then
exposes the formula error as an invalid row, and the row counts toward the 1,000 candidate
limit. Add regression coverage for formula-only `Funder` and `Current Status` rows and for
the candidate bound.

## Affected implementation seams

- `src/lib/import/portfolio-xlsx.ts` structural-row and candidate-row classification.
- Focused parser tests in `src/test/portfolio-xlsx.test.ts`.

## Explicit out-of-scope items

Do not change the XLSX format, header contract, formula policy, structural-row contract,
amount/date/status/type mappings, persistence actions, UI, schema, migration, authorization,
Funder resolution, duplicate rules, upload limits, or any unrelated product behavior. Do
not introduce generic import infrastructure or silently alter the frozen contract.

## Regression evidence required

- Formula-only recognized-field rows are invalid and visible with row-level formula errors.
- Formula-bearing candidate rows still remain invalid and are never evaluated.
- Formula-bearing candidates count toward and enforce the 1,000-candidate bound.
- Existing focused parser/action/UI/migration tests and applicable TypeScript/lint checks
  continue to pass.
- Run `git diff --check` and report exact commands/results.

## Worker Evidence

### Implementation receipt

- Updated `src/lib/import/portfolio-xlsx.ts` so formula-bearing cells in recognized
  fields keep rows as candidates unless the row is independently identified as a
  section heading or total row. Formula values remain un-evaluated and are exposed
  by the existing row-level formula validation errors.
- Added focused coverage for formula-only `Funder`, formula-only `Current Status`,
  and a formula-bearing candidate enforcing the 1,000-row bound.
- Preserved the existing mixed formula/date regression coverage and all unrelated
  parser, mapping, persistence, UI, schema, and configuration seams.

### Checks and evidence

- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — PASS (9 tests).
- `bun run test:run -- src/test/portfolio-xlsx.test.ts src/test/portfolio-import-actions.test.ts src/test/portfolio-import-ui.test.tsx src/test/portfolio-import-configuration.test.ts src/test/migration-chain.test.ts` — PASS (5 files, 21 tests).
- `bunx --bun tsc --noEmit` — PASS.
- `bun run lint` — PASS.
- `git diff --check` — PASS.
- Vitest emitted the existing `configLoader: 'native'` CommonJS/ESM warning; it did
  not affect the passing checks.

### Scope and terminal status

- Files changed by this remediation: `src/lib/import/portfolio-xlsx.ts`,
  `src/test/portfolio-xlsx.test.ts`, and this receipt.
- Existing unrelated tracked and untracked workstream changes were left untouched.
- Terminal status: **DONE**.
