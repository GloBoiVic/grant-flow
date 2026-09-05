# T001 — XLSX parser and domain contract

Status: DONE_WITH_CONCERNS
Role: BUILD
Workstream: portfolio-import
Branch: solo/portfolio-import

## Assignment

Implement the frozen PLAN's parser and domain-contract layer for Portfolio Import. Keep
the implementation bounded to the approved `.xlsx` workflow; do not add generic import
infrastructure or any out-of-scope product surface.

## Required outcome

- Add one maintained XLSX parser dependency and use it only from a server-side import seam.
- Configure upload transport/body capacity if the chosen Server Action transport needs it,
  while retaining the 5 MiB application limit.
- Implement deterministic worksheet selection using the required `Funder`, `Type`, and
  `Current Status` headers, allowing unrelated auxiliary sheets and rejecting zero or
  multiple matching sheets.
- Enforce the 5 MiB workbook and 1,000 candidate-row bounds, without formula evaluation.
- Implement structural-row skipping, explicit source-to-domain mappings, normalization,
  date/amount validation, derived titles, source-value note preservation, row states,
  deterministic duplicate collapsing, and serializable preview DTOs exactly as specified
  in PLAN.md.
- Keep domain validation aligned with the existing Grant and Funder validation semantics.
- Remove unused `ImportStaging` from the Prisma schema and Organization relation through a
  forward migration; preserve existing migration history.
- Add focused parser/mapping/configuration/migration tests for the contract and boundaries.

## Constraints

- Do not implement persistence actions, confirmation, portfolio UI, dashboard, deadlines,
  grant workspace, drafting, notes history, exports, deployment, collaboration, generic
  import infrastructure, fuzzy matching, durable staging, queues, or background processing
  in this task.
- Do not silently redesign persistence, parsing, upload, or data-mapping contracts. If the
  frozen contract cannot be implemented without a material change, mark this task BLOCKED
  and report the blocker instead of changing the contract.
- Do not change branches or Git history. Do not edit Solo-owned planning state or another
  role's evidence artifact.

## Relevant contract

The complete source-to-domain, validation, row-state, duplicate, and persistence boundary
is in `dispatch/workstreams/portfolio-import/PLAN.md`; read it before implementation.

## Checks and receipt

Run focused tests plus applicable type/lint checks. Record exact commands, results, files
changed, and any concerns in this task file. Finish with `Status: DONE` only when the
implementation and task-level checks are complete; otherwise use `BLOCKED` or
`DONE_WITH_CONCERNS` with a precise explanation.

## Worker Evidence

- Implemented the server-only bounded XLSX parser/mapping seam in `src/lib/import/portfolio-xlsx.ts` using the maintained SheetJS 0.20.3 distribution. It covers deterministic worksheet/header selection, `.xlsx` signature and 5 MiB/1,000-candidate bounds, structural rows, formula rejection, explicit status/Funder mappings, amount/date conversion, source-value note preservation, derived titles, domain validation, Funder reuse/create/ambiguity decisions, duplicate collapsing, and serializable preview DTOs.
- Configured the Server Action body limit to `6mb` while retaining the parser's 5 MiB application limit. Added focused parser, reference-workbook, configuration, and migration coverage.
- Removed `ImportStaging` from the Prisma schema and Organization relation with forward migration `20260904010000_remove_import_staging`; the baseline migration remains unchanged.

### Checks

- `bun run test:run` — PASS (28 files passed, 3 skipped; 130 tests passed, 26 skipped).
- `bun run test:run -- src/test/portfolio-xlsx.test.ts src/test/portfolio-import-configuration.test.ts src/test/migration-chain.test.ts` — PASS (3 files, 8 tests).
- `bunx --bun tsc --noEmit` — PASS.
- `bun run lint` — PASS.
- `bunx --bun prisma validate` — PASS.
- `git diff --check` — PASS.
- `bun run build` — attempted; blocked by the environment's missing `node` executable when Turbopack tried to spawn a pooled Node process while processing CSS.
- `bun run verify:prisma` — attempted; blocked by the Bun/tsx runtime with `Cannot find module './cjs/index.cjs'`; Prisma schema validation and migration tests passed separately.

### Concerns

- The production build and `verify:prisma` checks need to be rerun in an environment with the repository's expected Node runtime. No product or parser contract was changed to accommodate these environment limitations.

Status: DONE_WITH_CONCERNS
