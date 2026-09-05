# R002 — Portfolio Import Review

ROLE: REVIEW
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: R002
OWNED_ARTIFACT: dispatch/workstreams/portfolio-import/remediations/R002-portfolio-import/REVIEW.md

## Result

**PASS** — R002 resolves the originating IMPORTANT `PRODUCT / DEFECT` without scope or
contract drift. The full Portfolio Import workstream has no unresolved CRITICAL or
IMPORTANT findings.

## Findings

### PRODUCT / DEFECT — IMPORTANT — resolved

Required literal `-` values in `Funder`, `Type`, and `Current Status` now provide candidate
evidence in `src/lib/import/portfolio-xlsx.ts`. They reach the existing mapper, produce
the corresponding required-field errors, appear as visible excluded rows, and count
toward the 1,000-candidate limit. Optional placeholders and independently structural
blank, total, and section rows remain unchanged.

The R002 change is limited to structural/candidate classification and parser regressions.
It does not alter the frozen format, mappings, formula policy, persistence, UI, schema,
migration, authorization, funder resolution, duplicate behavior, or upload bounds.

### PRODUCT / DEFECT — MINOR — deferred, non-blocking

The previously identified `Award Timeframe` preview omission remains in the UI. R002
explicitly defers it, and the field is still mapped and persisted correctly. Under
SoloFlow, a deferred MINOR finding does not block closure; it is not an unresolved
CRITICAL or IMPORTANT finding.

### TOOLING / NEW SCOPE — concerns, not product defects

- The full suite remains unable to pass because the pre-existing dirty tracked fixture
  `data/mock-grant-data.xlsx` currently exposes `Main Tracker`, while its test expects
  `Main Tracker - FOR BOARD`. The unrelated fixture change and untracked lock file
  `data/.~mock-grant-data.xlsx` were preserved untouched.
- PostgreSQL isolation/rollback coverage was skipped because
  `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset. Authenticated browser upload/preview/
  confirmation was unavailable because Local Host `/import` redirects to login without
  an authenticated test session; the login page had no console errors.
- `bun run build` is blocked by Turbopack failing to spawn the unavailable `node`
  executable; `bun run verify:prisma` is blocked by the Bun/tsx `./cjs/index.cjs`
  resolution error; migration diff is blocked because `prisma.config.ts` lacks
  `datasource.shadowDatabaseUrl`. The webpack build and Prisma schema validation pass.

No `REGRESSION / DEFECT` or additional `NEW SCOPE` finding was identified.

## Evidence and checks

- Frozen `PLAN.md`, PRODUCT.md, original T001/T002/T003 receipts, original
  `VALIDATION.md`, R001 BUILD/VALIDATION/REVIEW, and R002 BUILD/VALIDATION were inspected.
- Current parser, actions, UI, schema, forward migration, configuration, focused tests,
  current status, and diff constraints were inspected. Authorization-first analysis,
  server-authoritative confirmation, organization-scoped Funder resolution, atomic
  persistence, Activity attribution, and revalidation align with the frozen plan.
- `bunx --bun vitest run src/test/portfolio-xlsx.test.ts -t 'literal .*placeholder|optional placeholders|counts required placeholders'` — PASS (5 tests).
- Relevant action/UI/configuration/migration tests — PASS (4 files, 12 tests).
- `bun run test:run` — FAIL only on the unrelated dirty-fixture worksheet-name assertion (29 files passed, 4 skipped; 145 tests passed, 27 skipped).
- `bunx --bun tsc --noEmit` — PASS on the serial rerun; `bun run lint` — PASS;
  `bunx --bun prisma validate` — PASS; `bunx --bun next build --webpack` — PASS;
  `git diff --check` — PASS.

The reviewer wrote only this assigned artifact; application, tests, fixtures, config,
planning state, and completed evidence artifacts were not edited.

## Terminal status

**DONE — REVIEW PASS**
