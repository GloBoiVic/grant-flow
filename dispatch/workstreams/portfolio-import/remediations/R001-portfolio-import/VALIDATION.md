# R001 — Formula-only recognized values validation

ROLE: VALIDATE
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R001
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R001-portfolio-import/VALIDATION.md

## Result

**PASS** — the approved remediation fixes the original formula-only structural-classification defect without changing independently structural-row behavior.

## Scope and evidence

- The original `PRODUCT / DEFECT` finding in the parent `VALIDATION.md` is addressed in `src/lib/import/portfolio-xlsx.ts:695-703`: a formula in a recognized field is candidate evidence unless the row is independently identifiable as a section heading or total row.
- `mapCandidateRow` keeps the existing no-evaluation policy and records recognized-field formula errors; the row state becomes `invalid` when those errors are present (`src/lib/import/portfolio-xlsx.ts:499-570`). `parsePortfolioWorkbook` exposes those mapped rows and counts them as candidates/invalid (`:778-789`).
- Formula-only `Funder` coverage passes with `structural: 0, candidate: 1, invalid: 1`, source row `2`, and `Formula values are not accepted in "Funder".`.
- Formula-only `Current Status` coverage passes with `structural: 0, candidate: 1, invalid: 1`, source row `2`, and `Formula values are not accepted in "Current Status".`.
- The candidate-bound regression passes: 1,000 ordinary candidates plus one formula-only recognized-field row throws `The worksheet contains more than 1,000 candidate rows.`.
- The existing mixed formula/date regression still passes, including formula rejection and no formula evaluation.
- Independently structural rows still behave correctly: the existing blank-row and isolated section-heading coverage passes with `structural: 2`, while two real rows remain candidates (`valid: 1`, `collapsed: 1`); the reference-workbook bound test also passes.

No `REGRESSION` or `NEW SCOPE` finding was identified. No additional `PRODUCT` or `TOOLING` defect was identified.

## Checks

- `bun run test:run -- src/test/portfolio-xlsx.test.ts` — PASS (1 file, 9 tests).
- `bun run test:run -- src/test/portfolio-xlsx.test.ts src/test/portfolio-import-actions.test.ts src/test/portfolio-import-ui.test.tsx src/test/portfolio-import-configuration.test.ts src/test/migration-chain.test.ts` — PASS (5 files, 21 tests).
- `bun run test:run` — PASS (30 files, 141 tests; 4 files and 27 tests skipped).
- `bunx --bun tsc --noEmit` — PASS.
- `bun run lint` — PASS.
- `git diff --check` — PASS.

Vitest emitted the existing `configLoader: 'native'` CommonJS/ESM warning; it did not affect the passing checks.

## Limitations

- The opt-in PostgreSQL isolation suite remains skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset; this R001 parser remediation does not change persistence seams.
- Authenticated browser upload/preview/confirmation remains unexecuted because no local authenticated test session/credentials were available, as documented by the original validation.
- The feature implementation files are currently untracked as part of the in-progress workstream, so Git has no isolated baseline diff for the remediation. I inspected the current remediation source/test changes and the R001 BUILD receipt; no unrelated file was edited by this validation.

## Terminal status

**DONE** — only this assigned validation artifact was written.
