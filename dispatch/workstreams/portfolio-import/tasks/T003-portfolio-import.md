# T003 — Preview and confirmation UI

Status: DONE_WITH_CONCERNS
Role: BUILD
Workstream: portfolio-import
Branch: solo/portfolio-import
Dependency: T001 DONE_WITH_CONCERNS and T002 DONE_WITH_CONCERNS

## Assignment

Replace the authenticated `/import` placeholder with the bounded Portfolio Import preview
and confirmation experience, consuming T002's server actions and T001's serializable DTO
contract. Do not begin until T001 and T002 are complete.

## Required outcome

- Provide `.xlsx` file selection, bounded analysis, and no mutation on selection or preview.
- Show file/sheet/header recognition, unsupported headers, mapping decisions, amount/date
  handling, preserved source values, derived titles, row source numbers, structural,
  candidate, valid, invalid, and collapsed states, and Funder reuse/create/type warnings.
- Exclude invalid rows visibly, disable confirmation when no valid rows remain, require the
  exact deliberate acknowledgement before enabling confirmation, and warn that intentionally
  importing the same workbook later can create additional Grants.
- Submit the selected workbook again for server-authoritative confirmation; clear state and
  prevent repeat confirmation after success; show created/reused/collapsed/excluded counts
  and links to `/grants` and `/funders`.
- Preserve accessibility and existing GrantFlow design tokens, and add focused route/UI
  coverage.

## Constraints

- Keep the selected File ephemeral and client-only for the interaction. Do not persist the
  workbook or preview, add import history, or introduce generic mapping infrastructure.
- Do not expand into dashboard, deadlines, grant workspace, drafting, notes history,
  exports, deployment, collaboration, generic import infrastructure, fuzzy matching,
  durable staging, queues, or background processing.
- Do not change branches or Git history. Do not edit Solo-owned planning state or another
  role's evidence artifact.
- If implementation requires a material change to the frozen persistence, parsing, upload,
  or data-mapping contract, mark BLOCKED and escalate rather than silently redesigning it.

## Relevant contract

Read `dispatch/workstreams/portfolio-import/PLAN.md` and the completed T001/T002 receipts
before working. The PLAN is the frozen source of truth for the UI's server-produced report
and confirmation semantics.

## Checks and receipt

Run focused UI/route tests plus applicable type/lint checks and browser checks when Local
Host is available. Record exact commands, results, files changed, and limitations in this
task file. Finish with `Status: DONE` only when implementation and task-level checks are
complete.

## BUILD Receipt

- Replaced the authenticated `/import` placeholder with a client-only ephemeral workbook interaction in `src/components/import/portfolio-import-page.tsx` and wired the route to it.
- Added accessible `.xlsx` selection and explicit Analyze action with no mutation on selection; the server-produced preview shows workbook/sheet metadata, recognized and unsupported headers, source warnings, mapping and date/amount decisions, aggregate structural/candidate/valid/invalid/collapsed counts, and row-level source numbers, derived values, funder create/reuse/type decisions, preserved values, warnings, and excluded errors.
- Added exact acknowledgement gating, no-valid-row handling, repeated-import warning, and confirmation that submits the selected workbook again to T002's server-authoritative action. Successful confirmation clears the ephemeral file/preview state, prevents accidental repeat confirmation, shows completion counts, and links to `/grants` and `/funders`.
- Added focused UI/route coverage for placeholder replacement, no analysis on file selection, server preview rendering, exact acknowledgement, second-upload `FormData` contents, completion links/counts, and all-invalid confirmation blocking. Updated the old placeholder route matrix to leave `/import` to the new focused coverage.

### Checks

- `bun run test:run -- src/test/portfolio-import-ui.test.tsx src/test/feature-placeholder.test.tsx` — PASS (2 files, 7 tests).
- `bun run test:run` — PASS (30 files passed, 4 skipped; 138 tests passed, 27 skipped).
- `bunx --bun tsc --noEmit` — PASS.
- `bun run lint -- src/components/import/portfolio-import-page.tsx src/app/'(authenticated)'/'(org-required)'/import/page.tsx src/test/portfolio-import-ui.test.tsx src/test/feature-placeholder.test.tsx` — PASS.
- `bun run lint` — PASS.
- `bunx --bun next build --webpack` — PASS; `/import` compiled and was emitted as a dynamic App Router route.
- `git diff --check` — PASS.
- Browser check: Local Host `/import` correctly redirected to the authenticated login route; console diagnosis reported no errors. Upload/preview interaction could not be exercised in-browser because no authenticated test credentials/session were available; focused jsdom coverage exercised the full interaction contract.

### Files changed

- `src/components/import/portfolio-import-page.tsx`
- `src/app/(authenticated)/(org-required)/import/page.tsx`
- `src/test/portfolio-import-ui.test.tsx`
- `src/test/feature-placeholder.test.tsx`

### Concerns

- Authenticated browser interaction remains unverified in this environment because the available Local Host session redirected `/import` to sign-in. The route boundary, no-console-error result, server-action wiring, upload lifecycle, acknowledgement gate, confirmation re-upload, and completion state are covered by focused UI tests and the successful webpack build.

Status: DONE_WITH_CONCERNS
