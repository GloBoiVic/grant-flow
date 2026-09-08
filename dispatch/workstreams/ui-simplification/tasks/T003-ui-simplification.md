# T003 - Grant Workspace and Deadline View

Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification
Dependency: T002 DONE

## Assignment

Perform the approved Grant Workspace and Deadline View composition pass from the frozen PLAN. Preserve the complete Grant record and exact Deadline query/bucket/navigation semantics while reducing redundant page chrome.

## Required outcome

- Simplify the Grant Workspace header by removing independent card elevation/chrome while retaining Back to Grants, title, Funder context, human-readable Funder type, Website when present, Status, and record actions.
- Remove Funder and Status from Overview because both remain clearly represented in the header; preserve every other maintained structured field, Award timeframe, Notes, Tags, and newest-first Activity.
- Use one coherent primary Workspace surface with restrained internal section boundaries instead of separate shadowed Overview/Notes/Activity cards. Keep Workspace at `max-w-6xl`.
- Format populated Workspace amounts with one explicit code-aware currency representation, remove standalone Currency when at least one amount carries that representation, retain one Currency field when both amounts are null, and omit an empty Funder Website line.
- Preserve `GrantWorkspaceActions` client boundary, existing mutations, server refresh/revalidation, focus, links, long text, and complete record behavior.
- Consolidate Deadline View into one coherent bordered `max-w-7xl` surface containing the three existing semantic groups separated by dividers. Remove its restating subtitle, card-per-group shadows, tinted headers, and redundant chrome.
- Preserve exact Overdue, Due in the next 7 days, and Later in the next 30 days headings/order, row fields/deep links/time values/status labels, fixed bucket/query semantics, per-group empty states, semantic lists, and restrained urgency order.
- Rewrite only the approved concise Workspace/Deadline copy, retaining the necessary explanation that excluded statuses are not represented in Deadline View.
- Update `src/test/grant-ui.test.tsx` and `src/test/deadline-view.test.tsx` for the focused acceptance assertions in the frozen PLAN.

## Relevant files

- `src/components/grants/grant-workspace.tsx`
- `src/components/grants/grant-workspace-actions.tsx`
- `src/components/deadlines/deadline-view.tsx`
- `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx`
- `src/app/(authenticated)/(org-required)/deadlines/page.tsx`
- `src/test/grant-ui.test.tsx`
- `src/test/deadline-view.test.tsx`
- Existing Grant/Deadline DTOs, queries, actions, design tokens, and route tests as needed for verification only.

## Constraints

- Follow `dispatch/workstreams/ui-simplification/PLAN.md` exactly.
- Do not change query/domain behavior, persistence, schema, auth/tenancy, routes, navigation, status semantics, deadline bucket semantics, or shared primitives.
- Do not remove any complete Workspace field, Notes/Tags/Activity capability, Deadline row, group, deep link, time value, or safety explanation.
- Do not widen Workspace, add filters/controls, add charting, introduce a generic layout abstraction, or perform unrelated primitive cleanup.
- If implementation reveals a material requirement outside the approved PLAN, stop and report it for developer review instead of expanding scope.
- Do not change branches or Git history or edit Solo-owned planning state or another role's evidence artifact.

## Required evidence

- Focused tests cover no duplicate Workspace Funder/Status, complete fields, explicit populated/empty currency cases, Notes/Tags/Activity continuity and ordering, long text, exact Deadline headings/order/rows/links/time/status, per-group empty states, semantics, and focus.
- Record exact checks, changed files, and any concerns in this task receipt. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

## Worker Evidence

- Files changed: `src/components/grants/grant-workspace.tsx`, `src/components/deadlines/deadline-view.tsx`, `src/test/grant-ui.test.tsx`, `src/test/deadline-view.test.tsx`.
- `npm run test:run -- src/test/grant-ui.test.tsx src/test/deadline-view.test.tsx`: 2 test files passed, 26 tests passed.
- `npx eslint src/components/grants/grant-workspace.tsx src/components/deadlines/deadline-view.tsx src/test/grant-ui.test.tsx src/test/deadline-view.test.tsx`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- Findings / concerns: None. Focused Vitest output includes the existing Vite `configLoader: 'native'` compatibility warning.
