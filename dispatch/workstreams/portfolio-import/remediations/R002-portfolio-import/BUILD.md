# R002 — Required placeholders must remain visible invalid candidates

Remediation ID: R002
Status: DONE
Role: BUILD
Workstream: portfolio-import
Branch: solo/portfolio-import

## Origin finding and source artifact

- Source: `dispatch/workstreams/portfolio-import/remediations/R001-portfolio-import/REVIEW.md`,
  PRODUCT / DEFECT — IMPORTANT finding.
- Finding: literal `-` is treated as blank during structural classification, so required
  placeholder-only rows can be counted as structural and omitted from invalid preview
  evidence, candidate counts, and excluded counts.

## Finding severity

PRODUCT / DEFECT — IMPORTANT approved-contract violation.

## Related original task(s)

- T001 — XLSX parser and domain contract
- T002 — Scoped atomic preview and commit (confirmation consumes parser decisions)

## Approved requirement or invariant violated

PLAN.md requires blank optional cells and literal `-` placeholders to become null, but
required cells containing blank/`-` to be invalid. Structural rows are only fully blank rows,
totals rows with no Funder, or clearly isolated section labels. A row whose recognized
required field contains `-` is not a fully blank structural row and must be represented as a
candidate with visible row-level validation errors.

## Exact remediation outcome

Adjust structural/candidate classification so recognized required placeholder values are
candidate evidence rather than structural emptiness. Preserve the existing optional
placeholder-to-null mapping and structural blank/total/section behavior. Rows with
`Funder: "-"`, `Type: "-"`, or `Current Status: "-"` must reach mapping, be invalid with
the appropriate required-field error, and contribute to the 1,000-candidate bound.

## Affected implementation seams

- `src/lib/import/portfolio-xlsx.ts` blank/placeholder and structural-row classification.
- Focused parser tests in `src/test/portfolio-xlsx.test.ts`.

## Explicit out-of-scope items

Do not change the `.xlsx` format, header contract, formula policy, amount/date/status/type
mapping semantics, persistence actions, UI, schema, migration, authorization, Funder
resolution, duplicate rules, upload limits, or any unrelated product behavior. Do not fix
the separate minor Award Timeframe display gap in this packet. Do not introduce generic
import infrastructure or silently alter the frozen contract.

## Regression evidence required

- Required `-` placeholders are visible invalid candidates with required-field errors.
- Optional `-` placeholders remain null and fully blank, totals, and section rows remain
  structural/skipped as before.
- Placeholder candidates count toward and enforce the 1,000-candidate bound.
- Existing formula, parser, action, UI, migration, TypeScript, and lint checks continue to
  pass.
- Run `git diff --check` and report exact commands/results.

## Worker Evidence

### Implementation receipt

- Updated `src/lib/import/portfolio-xlsx.ts` so a literal `-` in any recognized
  required field is candidate evidence during row classification. These rows now
  bypass structural blank/section detection, count against the candidate bound,
  and reach the existing mapper, which emits the existing required-field errors
  for `Funder`, `Type`, or `Current Status`.
- Preserved the existing optional `-` → `null` conversion and structural handling
  for fully blank, total, and section rows. No mapping, formula, amount/date,
  persistence, UI, schema, migration, authorization, or Funder-resolution
  behavior was changed.
- Added focused parser regressions covering literal `-` placeholders in each of
  `Funder`, `Type`, and `Current Status`, plus an exact-at-limit and over-limit
  candidate-bound case using a required placeholder.

### Checks

- `bunx --bun vitest run src/test/portfolio-xlsx.test.ts` — PASS (14 tests).
- `bun run test:run` — PASS (30 files passed, 4 skipped; 146 tests passed, 27 skipped).
- `bunx --bun tsc --noEmit` — PASS.
- `bun run lint` — PASS.
- `bunx --bun prisma validate` — PASS.
- `bunx --bun next build --webpack` — PASS; `/import` emitted as a dynamic route.
- `git diff --check` — PASS.

### Limitations and concerns

- The opt-in PostgreSQL isolation/rollback coverage remains skipped because
  `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset; no new test failure was observed.
- Authenticated browser upload/preview/confirmation was not exercised because no
  authenticated local test session is available. This remediation does not touch
  the UI.
- The separate minor `Award Timeframe` UI review gap remains intentionally out of
  scope.

## Terminal status

**DONE — BUILD**
