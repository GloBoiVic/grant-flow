# T004 - Funder surfaces and bounded shell de-duplication

Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification
Dependency: T003 DONE

## Assignment

Perform the approved Funder list/detail Sheet copy and container cleanup plus the bounded authenticated-shell identity de-duplication from the frozen PLAN. Preserve all Funder maintenance, navigation, authorization, mobile context, and account action contracts.

## Required outcome

- Remove the Funder page subtitle, `Showing N funder(s)` footer, and unnecessary list/table shadow; retain exactly Name, Type, Website, human-readable types, external Website links, selection behavior, Add funder, and `max-w-6xl`.
- Rewrite the Funder empty state with concise next-step language while preserving the existing Add funder action.
- Simplify `FunderDetailSheet` to Funder name as title, human-readable type as restrained header context, Website, County served, Notes, and Edit funder.
- Remove the duplicate Name definition row and implementation-language visible descriptions; preserve sr-only Sheet descriptions where dialog semantics require them.
- Rewrite empty Notes as `No notes yet` and preserve all Funder form fields/actions, URL normalization, validation, create/edit, dirty protection, feedback, refresh, and organization isolation.
- In `TopNavigation`, hide the non-Grants organization fallback on desktop only while retaining organization context on mobile.
- Simplify `AccountMenu` closed trigger to the Avatar with an accessible `Open account menu` name; retain user identity, Profile, Sign out, pending state, and failure feedback in the opened menu.
- Do not redesign sidebar/mobile navigation or shared primitives.
- Update only the focused Funder and shell tests needed for these bounded contracts.

## Relevant files

- `src/components/funders/funder-page.tsx`
- `src/components/funders/funder-list.tsx`
- `src/components/funders/funder-detail-sheet.tsx`
- `src/components/funders/funder-form.tsx`
- `src/components/layout/top-navigation.tsx`
- `src/components/layout/account-menu.tsx`
- `src/test/funder-ui.test.tsx`
- `src/test/app-shell.test.tsx`
- `src/test/account-menu.test.tsx`
- `src/test/desktop-sidebar.test.tsx`
- `src/test/mobile-navigation.test.tsx`
- `src/test/navigation-list.test.tsx`

## Constraints

- Follow `dispatch/workstreams/ui-simplification/PLAN.md` exactly.
- Do not change query/domain behavior, persistence, schema, auth/tenancy, routes, navigation destinations, sidebar/mobile navigation structure, or shared primitives.
- Preserve desktop organization identity in the sidebar and mobile organization context in TopNavigation.
- Preserve all AccountMenu actions/states and accessible semantics; only reduce duplicate closed-trigger identity.
- Do not add generic responsive/layout abstractions, new navigation, branding, animation, form metadata, or unrelated accessibility refactors.
- If implementation reveals a material requirement outside the approved PLAN, stop and report it for developer review instead of expanding scope.
- Do not change branches or Git history or edit Solo-owned planning state or another role's evidence artifact.

## Required evidence

- Focused tests cover exact three-column Funder list, human-readable types, external Website link, no count footer, empty state, Sheet title/type/body contract, absent duplicate Name row, Edit action, feedback, dirty close behavior, long values/focus, shell landmarks/routes/current state, mobile organization context, desktop de-duplication, Avatar trigger accessible name, menu identity/actions/pending/error.
- Record exact checks, changed files, and any concerns in this task receipt. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

## Worker Evidence

- Removed the Funder subtitle, count footer, and table shadow while retaining the exact three-column list, human-readable types, external Website links, selection, Add funder flow, and `max-w-6xl`.
- Simplified `FunderDetailSheet` to title/type/body presentation, removed duplicate Name and implementation-language copy, changed empty Notes to `No notes yet`, and preserved sr-only Sheet descriptions and unchanged FunderForm behavior.
- Hid the non-Grants TopNavigation organization fallback at the desktop breakpoint while retaining mobile context; changed the closed AccountMenu trigger to an Avatar-only button named `Open account menu` while retaining opened-menu identity/actions/pending/error behavior.
- Updated focused Funder, shell, and account assertions in the assigned test files.
- Checks: `npm exec vitest run src/test/funder-ui.test.tsx src/test/app-shell.test.tsx src/test/account-menu.test.tsx src/test/desktop-sidebar.test.tsx src/test/mobile-navigation.test.tsx src/test/navigation-list.test.tsx` passed, 6 files and 41 tests; scoped ESLint passed; `git diff --check` passed.
- Changed files: `src/components/funders/funder-page.tsx`, `src/components/funders/funder-list.tsx`, `src/components/funders/funder-detail-sheet.tsx`, `src/components/layout/top-navigation.tsx`, `src/components/layout/account-menu.tsx`, `src/test/funder-ui.test.tsx`, `src/test/app-shell.test.tsx`, `src/test/account-menu.test.tsx`.
- Concerns: none.

Status: DONE
