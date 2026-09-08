# T002 - Grant list, quick Sheet, and form copy

Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification
Dependency: T001 DONE

## Assignment

Perform the approved Grant list, quick Grant Detail Sheet, and directly involved Grant Form copy reduction from the frozen PLAN. Preserve the dense portfolio scan/filter workflow and all Grant mutation, status, export, URL, focus, and dirty-form contracts.

## Required outcome

- Simplify `GrantsPage` header, empty states, filter surface chrome, table surface, and copy; use `max-w-7xl`.
- Preserve all six columns, dense table behavior, URL-backed search/filter/sort/pagination, row click and keyboard activation, status/tag display, Add grant, Sheet state, and Export portfolio.
- Keep Add grant visually primary and Export portfolio secondary, with concise no-funder prerequisite and true-empty/filter-empty copy.
- Reduce `GrantDetailSheet` to title, Funder context, one current Status representation through the status control, Deadline, Amount requested with explicit currency, Next steps, Edit grant, status action, Open full grant, and existing feedback.
- Replace mini summary cards with a restrained definition/list layout; remove Sheet Activity and TagManager while keeping Workspace discoverability through the visible Open full grant action.
- Preserve Sheet width, focus trap, close behavior, mobile full-width behavior, internal scrolling, status refresh semantics, and dirty-form protection.
- Remove or rewrite only the visible implementation-oriented GrantForm copy directly involved in this composition. Keep the concise edit-status helper and all field/validation/payload contracts.
- Update `src/test/grant-ui.test.tsx` with the focused changed-surface assertions listed in the frozen PLAN.

## Relevant files

- `src/components/grants/grants-page.tsx`
- `src/components/grants/grant-detail-sheet.tsx`
- `src/components/grants/grant-form.tsx`
- `src/test/grant-ui.test.tsx`
- Existing Grant list contract, export route, Workspace route/link, UI primitives, and design tokens as needed for verification only.

## Constraints

- Follow `dispatch/workstreams/ui-simplification/PLAN.md` exactly.
- Do not change query/domain behavior, persistence, schema, auth/tenancy, export contract, routes, navigation, or shared primitives.
- Do not convert the table to cards, add filters/columns/features, make the Sheet a second Workspace, add form metadata, or perform generic component-library cleanup.
- Preserve supported query parameters and existing `/export/portfolio` behavior exactly.
- If implementation reveals a material requirement outside the approved PLAN, stop and report it for developer review instead of expanding scope.
- Do not change branches or Git history or edit Solo-owned planning state or another role's evidence artifact.

## Required evidence

- Focused Grant UI tests cover the exact quick-Sheet contract, absence of duplicate Status/Activity/Tags, Workspace link, status action, list behavior, empty copy, export, filters, pagination, create/edit validation and payload, refresh, dirty protection, and semantic controls/focus.
- Record exact checks, changed files, and any concerns in this task receipt. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

## Worker Evidence

- Files changed: `src/components/grants/grants-page.tsx`, `src/components/grants/grant-detail-sheet.tsx`, `src/components/grants/grant-form.tsx`, `src/test/grant-ui.test.tsx`.
- Grant UI focused tests: `npm run test:run -- src/test/grant-ui.test.tsx` -> 1 file passed, 22 tests passed.
- Related Grant contract tests: `npm run test:run -- src/test/grant-ui.test.tsx src/test/grant-list-contract.test.ts src/test/grants-route.test.ts` -> 3 files passed, 26 tests passed.
- Full suite: `npm run test:run` -> 39 files passed, 5 skipped; 257 tests passed, 37 skipped.
- Static checks: `npx tsc --noEmit` passed; focused `npx eslint src/components/grants/grants-page.tsx src/components/grants/grant-detail-sheet.tsx src/components/grants/grant-form.tsx src/test/grant-ui.test.tsx` passed; `git diff --check` passed.
- Concerns: none. Vitest emitted the existing `configLoader: 'native'` warning.
