# T001 - Dashboard composition

Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification
Dependency: None

## Assignment

Perform the approved reduction-first Dashboard composition pass from the frozen PLAN. Preserve the existing dashboard query, DTO, routes, and behavior while removing redundant copy and decorative chrome.

## Required outcome

- Simplify `DashboardContent` to an H1 with restrained As-of context, one four-value metrics strip, one restrained Needs attention surface, a compact Upcoming deadlines list, and a count-only Status breakdown.
- Remove the visible Portfolio totals heading/chrome, per-metric cards, accent strips, icon boxes, repeated captions, duplicate urgency values, relative status bars, explanatory footer copy, duplicate Deadline links, and decorative empty-state icons.
- Keep useful Tracked grants and Open pipeline links and exactly one `View deadlines` path.
- Rewrite Dashboard empty, no-amount, no-attention, and no-upcoming copy in concise user language.
- Use `max-w-7xl` and preserve narrow-safe layout without page-level horizontal overflow.
- Preserve all dashboard query/DTO semantics, status ordering, UTC/date behavior, existing destinations, and accessibility semantics.
- Update `src/test/dashboard-page.test.tsx` with the focused acceptance assertions listed in the frozen PLAN.

## Relevant files

- `src/components/dashboard/dashboard-content.tsx`
- `src/app/(authenticated)/(org-required)/dashboard/page.tsx`
- `src/test/dashboard-page.test.tsx`
- Existing dashboard DTO/query and design tokens as needed for verification only.

## Constraints

- Follow `dispatch/workstreams/ui-simplification/PLAN.md` exactly.
- Do not change query/domain behavior, persistence, schema, auth/tenancy, routes, navigation, or shared primitives.
- Do not add dashboard metrics, charts, filters, unsupported query parameters, generic layout abstractions, animation, or unrelated form/design-system work.
- If implementation reveals a material requirement outside the approved PLAN, stop and report it for developer review instead of expanding scope.
- Do not change branches or Git history or edit Solo-owned planning state or another role's evidence artifact.

## Required evidence

- Focused Dashboard UI/accessibility tests cover one H1, As-of context, one metrics grouping, four values, useful drill-down links, one Deadline View link, no repeated attention counts, oldest-overdue singular/plural, lifecycle status order, upcoming rows/empty state, no unsupported query parameters, and narrow-safe structure.
- Record exact checks, changed files, and any concerns in this task receipt. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

## Worker Evidence

Implemented the reduction-first Dashboard composition pass without changing the Dashboard DTO/query or existing Grant destinations. The Dashboard now uses `max-w-7xl`, one semantic metrics region, one restrained attention surface with a single `View deadlines` path, a compact upcoming list, and count-only status links. Redundant captions, repeated attention values, decorative icon/card treatments, status bars, and duplicate deadline continuation UI were removed.

Checks completed:

- `npm run test:run -- src/test/dashboard-page.test.tsx`: 1 file passed, 17 tests passed.
- `npm run lint -- src/components/dashboard/dashboard-content.tsx src/test/dashboard-page.test.tsx`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

The pre-existing `dispatch/ACTIVE.md` worktree change was not modified.
