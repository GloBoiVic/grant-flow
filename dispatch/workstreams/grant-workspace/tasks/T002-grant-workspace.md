# T002 - Workspace presentation, editing controls, revalidation, Sheet link, and UI coverage

Status: DONE
Role: BUILD
Workstream: grant-workspace
Branch: solo/grant-workspace
Dependency: T001 DONE

## Assignment

Implement the frozen PLAN's server-compatible stacked Grant Workspace, reuse the existing edit/status/tag controls, add exact workspace revalidation, add the portfolio Sheet deep-link, and add focused UI/action/accessibility coverage.

## Required outcome

- Add the route-local server-compatible `GrantWorkspace` presentation with one H1, visible `Back to Grants`, header actions/context, and stacked Overview, Notes, and Activity sections.
- Render every required structured field, explicit persisted currency, human-readable Funder type, optional Funder website, Tags inside Overview through the existing `TagManager`, current Notes with line breaks, and newest-first business-event Activity with semantic timestamps.
- Keep nullable and sparse values honest, long content safely wrapped, mobile layout stacked without horizontal scrolling, and existing tokens/status/date/currency/accessibility conventions intact.
- Add only the smallest client interaction seam for existing `GrantForm` edit behavior and `changeGrantStatus` behavior with `router.refresh()` after successful real mutations. Do not replace the full workspace with partial action DTOs.
- Preserve existing validation, dirty-form protection, status separation, same-status no-op behavior, Activity semantics, tag behavior, and `/grants` revalidation.
- Add exact `/grants/${grantId}` revalidation for successful edit/status/tag assignment/removal mutations; do not add a Grant ID to `createTag` solely for revalidation.
- Add accessible `Open full grant` to the existing Sheet targeting `/grants/<encoded grantId>` and retain the Sheet's quick portfolio role.
- Add focused UI/action tests for complete and sparse records, fields, Award Timeframe, Notes, Activity order, tags, Funder display/website, `Internal Review`, refresh-after-save, status/tag behavior, Sheet link, semantics, long text, and narrow-layout-safe structure.

## Constraints

- The PLAN is the frozen contract. If implementation requires tabs/history/documents, a broad client workspace state model, new persistence/schema, a new API/query layer, or other material scope, mark this task `BLOCKED` and return for developer review rather than expanding scope.
- Do not add Funder editing, a Funder detail route, Draft/History/Documents, workflow infrastructure, custom return state, unrelated navigation rewrites, or generalized workspace abstractions.
- Do not change branches or Git history or edit Solo-owned planning state or another role's evidence artifact.

## Relevant contract

Read `dispatch/workstreams/grant-workspace/PLAN.md`, T001's completed receipt and implementation, existing Grant form/status/tag/Sheet components, design tokens, and focused UI/action tests before implementation. Use the PLAN's frontend, accessibility, mutation, nullable, and browser-gate contracts exactly.

## Checks and receipt

Run focused workspace route/query/action/UI tests plus the applicable full suite, PostgreSQL integration, type, lint, Prisma, build, browser, and diff checks. Record exact commands, results, files changed, and concerns below. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

---

## Receipt

Status: DONE

### Implementation

- Replaced the T001 `GrantWorkspace` null seam with a server-compatible stacked record page containing the Back to Grants link, Grant header/status, human-readable Funder details and website link, Overview definition list, nested Tags, Notes, and newest-first Activity timeline.
- Added the smallest client-only `GrantWorkspaceActions` seam for existing `GrantForm`/`editGrant` and `changeGrantStatus` behavior. Successful edits close the form and refresh; real status changes update the visible selection and refresh; same-status submissions retain the existing no-op behavior without refresh.
- Preserved complete server-owned workspace data instead of adopting partial mutation DTOs. Updated the existing Sheet edit/status callbacks and portfolio Sheet key so refreshed server data replaces the complete record there as well.
- Added exact `/grants/${grantId}` revalidation after successful edit, real status, tag assignment, and tag removal while preserving `/grants`; `createTag` remains organization-wide only.
- Added the accessible encoded `Open full grant` Sheet Link and focused complete/sparse, field, formatting, activity-order, refresh/no-op, partial-DTO, action, tag, Sheet-link, and accessibility coverage.
- Preserved existing tokens, status/date/currency conventions, TagManager behavior, dirty-form protection, status separation, tenant boundaries, and no schema/API/persistence changes.

### Commands and Results

- `npx vitest run src/test/grant-ui.test.tsx src/test/domain-actions.test.ts src/test/tag-actions.test.ts src/test/grant-workspace-route.test.ts` - PASS; 4 files, 32 tests.
- `set -a; source .env; source .env.local; npm run test:run` - PASS with PostgreSQL enabled; 42 files, 251 tests, 0 skipped.
- `npm run lint` - PASS.
- `npx tsc --noEmit` - PASS.
- `npm run verify:prisma` - PASS; connected.
- `npm run build` - PASS; production build completed and included `/grants/[grantId]`.
- `git diff --check` - PASS.
- Safari Technology Preview: PASS for Sheet to encoded workspace navigation, desktop stacked hierarchy, 390px mobile layout with no horizontal overflow, existing edit form opening/canceling, and same-status success feedback without navigation. Console had no product errors; only existing Clerk development-key and suspended HMR WebSocket messages.
- Final `git status --short --branch` and diff inspection completed; pre-existing T001 implementation/coverage and `dispatch/ACTIVE.md` changes were preserved. T002 changed only its receipt plus the assigned workspace/action/UI/test paths.

### Files Changed

- `src/components/grants/grant-workspace.tsx`
- `src/components/grants/grant-workspace-actions.tsx`
- `src/components/grants/grant-detail-sheet.tsx`
- `src/components/grants/grants-page.tsx`
- `src/app/(authenticated)/(org-required)/grants/actions.ts`
- `src/app/(authenticated)/(org-required)/grants/tag-actions.ts`
- `src/test/grant-ui.test.tsx`
- `src/test/domain-actions.test.ts`
- `src/test/tag-actions.test.ts`
- `dispatch/workstreams/grant-workspace/tasks/T002-grant-workspace.md`

### Concerns

- None for T002. Human visual approval remains the PLAN-level gate before merge or GIT END.
