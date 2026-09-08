# T002 - `/deadlines` page, grouped UI, navigation, and accessibility coverage

Status: DONE_WITH_CONCERNS
Role: BUILD
Workstream: deadline-view
Branch: solo/deadline-view
Dependency: T001 DONE

## Assignment

Replace the authenticated `/deadlines` placeholder with the frozen Deadline View, using T001's query and DTO and preserving the existing AppShell, navigation, tokens, Grant Sheet, and URL contracts.

## Required outcome

- Replace the placeholder route with a server-owned query call and route-local server-compatible presentational component.
- Render one H1 and fixed H2 groups in order: Overdue, Due in the next 7 days, Later in the next 30 days.
- Render all rows as semantic lists with title links to `/grants?grant=<encoded id>`, Funder, UTC-safe date-only `<time>`, and existing display status styling.
- Present UTC-derived `asOf` as a user-locale long date with a safe noon anchor, matching the refined Dashboard.
- Distinguish overdue, due-soon, and later urgency using existing tokens only; preserve responsive narrow-screen wrapping, visible focus, accessible names, and no horizontal scrolling.
- Render honest no-Grants, no-eligible-deadlines, and per-group empty states without implying excluded-status deadlines are absent.
- Replace the deadline placeholder assertions with focused UI/accessibility/navigation coverage while retaining generic `FeaturePlaceholder` coverage for remaining placeholders.
- Cover headings, group/row order, deep-links, status labels, semantic lists/times, empty states, long text handling, and absence of fabricated controls or unsupported filters.
- Stop at `READY_FOR_USER` for the human Safari Technology Preview visual/browser gate.

## Constraints

- Do not create `/grants/[id]`, deadline filters, new URL parameters, schema changes, new dependencies, reminders, calendar/task infrastructure, or unrelated refactors.
- Keep the existing `/deadlines` route and authenticated shell; do not make non-semantic containers clickable or invent row actions.
- Do not change branches or Git history or edit Solo-owned planning state or another role's evidence artifact.
- If BUILD reveals a material contract or architecture need, mark BLOCKED and return for review rather than expanding scope.

## Relevant contract

Read `dispatch/workstreams/deadline-view/PLAN.md`, T001's completed receipt and implementation, the existing Dashboard/Grants components and tokens, the `/deadlines` route, and relevant UI tests before implementation. The PLAN is the frozen contract.

## Checks and receipt

Run focused deadline UI/accessibility/navigation tests plus the applicable type, lint, build, Prisma, browser, and diff checks. Record exact commands, results, files changed, and concerns below. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

---

## Receipt

Status: DONE_WITH_CONCERNS

### Implementation

- Replaced the authenticated `/deadlines` placeholder with a server-owned `getDeadlineView()` call and the server-compatible `DeadlineView` component.
- Rendered one H1, the fixed Overdue / Due in the next 7 days / Later in the next 30 days H2 order, three semantic lists, UTC-safe deadline `<time>` values, display statuses with existing badge classes, and encoded Grant Sheet links.
- Added safe-noon locale `As of` formatting, no-Grants and no-eligible messages, per-group empty messages, visible link focus, long-text wrapping, and responsive no-overflow layout using existing tokens only.
- Retained generic `FeaturePlaceholder` coverage and replaced the deadline route assertions with focused Deadline View and server-route tests.
- No filters, unsupported URL parameters, new routes, actions, dependencies, schema changes, deadline types, or unrelated refactors were added.

### Commands and Results

- `npx vitest run src/test/deadline-view.test.tsx src/test/deadlines-route.test.ts src/test/feature-placeholder.test.tsx` - PASS; 3 files, 7 tests.
- `npx vitest run src/test/deadline-queries.test.ts src/test/deadline-view.test.tsx src/test/deadlines-route.test.ts src/test/dashboard-dates.test.ts src/test/feature-placeholder.test.tsx` - PASS; 5 files, 24 tests.
- `npm run test:run` - PASS; 36 files passed, 5 skipped; 202 tests passed, 32 skipped.
- `npm run lint` - PASS.
- `npx tsc --noEmit` - PASS.
- `npm run verify:prisma` - PASS; Prisma connection verified.
- `npm run build` - PASS; Prisma Client generated and Next production build completed with `/deadlines` listed as dynamic.
- `git diff --check` - PASS.
- Browser attempt: `npm run dev -- --hostname 127.0.0.1`, then Safari Technology Preview MCP opened `http://127.0.0.1:3000/deadlines`; route redirected to Clerk login because no authenticated browser session was available.

### Files Changed

- `src/app/(authenticated)/(org-required)/deadlines/page.tsx` - replaced placeholder with query and view wiring.
- `src/components/deadlines/deadline-view.tsx` - added grouped Deadline View presentation.
- `src/test/deadline-view.test.tsx` - added grouped UI, accessibility, navigation, empty-state, and long-text coverage.
- `src/test/deadlines-route.test.ts` - added server-owned route query wiring coverage.
- `src/test/feature-placeholder.test.tsx` - retained generic placeholder tests and removed obsolete deadline-route assertions.
- `dispatch/workstreams/deadline-view/tasks/T002-deadline-view.md` - recorded this immutable BUILD receipt.

### Concerns

- Human Safari Technology Preview visual acceptance, responsive inspection, keyboard focus inspection, and authenticated Grant Sheet activation remain pending because the available browser had no authenticated session.
- T001's existing unexecuted disposable PostgreSQL integration coverage and its environment concern remain documented in `T001-deadline-view.md`; T002's Prisma verification connected successfully.
- Pre-existing `dispatch/ACTIVE.md` and T001 worktree changes were left untouched; no planning, branch, or Git history changes were made.
