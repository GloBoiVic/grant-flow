# T002 - Grants Action and Browser Download Surface

Status: DONE
Role: BUILD
Workstream: data-export
Branch: solo/data-export
Dependency: T001 DONE

## Outcome

Add the single semantic `Export portfolio` action to the existing `/grants` header and focused UI coverage while preserving all current Grant list behavior.

## Scope

- Add one native anchor using the existing `Button asChild` and `outline` seam beside `Add grant`.
- Use the exact visible text `Export portfolio`, accessible current-portfolio CSV description, and exact `/export/portfolio` target.
- Do not propagate search, status, Tag, sort, direction, page, selected Grant, or create-state query parameters.
- Keep the action available in populated, true-empty, and filtered-empty list states.
- Preserve the existing Grant list, filters, search, sort, pagination, create flow, detail Sheet, and empty states.
- Add focused UI coverage for semantic link behavior, accessibility, focus-compatible styling, exact target, no query propagation, and out-of-scope control absence.
- Perform Safari Technology Preview download validation after BUILD, VALIDATE, and REVIEW; human approval remains the final gate after those stages.

## Constraints

- Do not add a new navigation item, settings/reporting surface, export menu, client fetch/Blob pipeline, client-side CSV generation, or persistent export state.
- Preserve the established GrantFlow visual language and responsive behavior.
- If implementation reveals a material requirement outside the approved PLAN, stop and report it for developer review instead of expanding scope.

## Required Evidence

- Focused Grants UI checks pass and existing Grant controls remain covered.
- The action is a keyboard-accessible semantic link with visible focus and no filter/query propagation.
- Safari Technology Preview browser evidence is recorded by VALIDATE; human download/file inspection remains required before merge/GIT END.

## Worker Evidence

ROLE: BUILD
STATUS: DONE
ARTIFACT: dispatch/workstreams/data-export/tasks/T002-data-export.md
FILES CHANGED: src/components/grants/grants-page.tsx; src/test/grant-ui.test.tsx
CHECKS / EVIDENCE: Node v26.8.1. Focused Grants UI checks passed (21/21); focused Grants UI, route, list-contract, and workspace checks passed (29/29). Focused ESLint, TypeScript, and git diff --check passed. Safari Technology Preview reached the existing Clerk sign-in redirect at /login, so authenticated download/file inspection remains for VALIDATE and human approval.
FINDINGS / CONCERNS: None in the approved implementation scope. Browser download inspection was unavailable in BUILD because no authenticated Safari session was available.
