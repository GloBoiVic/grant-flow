# T005 - Import copy and container reduction

Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification
Dependency: T004 DONE

## Assignment

Perform the approved Portfolio Import copy and container reduction from the frozen PLAN. Preserve every safe-import, provenance, audit, acknowledgement, server re-check, confirmation, persistence, and completion contract while reducing unnecessary visual nesting.

## Required outcome

- Keep file selection and size constraints, explicit analyze step, preview, counts, headers, mapping decisions, row provenance, invalid/warning/duplicate states, acknowledgement, server re-check, confirmation, completion counts, and completion actions intact.
- Remove implementation/marketing header copy and the `Server-produced preview` badge; retain safety semantics and user-relevant explanations where they prevent unsafe decisions.
- Rewrite phase headings/copy in direct language such as `Import portfolio`, `Choose your workbook`, `Review import`, and `Row decisions`; make acknowledgement and completion copy concise without weakening safety meaning.
- Consolidate preview/completion count tiles into quiet grouped summaries rather than independent mini-cards.
- Reduce nested shadow/background treatment around preview metadata and import rows, preserving individual source-row boundaries and every mapped field, source value, warning, error, duplicate message, and provenance decision.
- Keep Import at `max-w-6xl`, preserve narrow readability, and do not introduce page-level horizontal overflow.
- Update `src/test/portfolio-import-ui.test.tsx` only for changed hierarchy/copy while preserving all safety-semantic assertions.

## Relevant files

- `src/components/import/portfolio-import-page.tsx`
- `src/test/portfolio-import-ui.test.tsx`
- Existing import actions/parser/types and design tokens as needed for verification only.

## Constraints

- Follow `dispatch/workstreams/ui-simplification/PLAN.md` exactly.
- Do not change parser/action/server behavior, import contracts, persistence, schema, auth/tenancy, routes, navigation, or shared primitives.
- Do not remove safety/audit information, source-row boundaries, invalid/warning/duplicate states, acknowledgement, server re-check, confirmation, completion facts, or actions.
- Do not add generic layout abstractions, new import features, upload behavior, file formats, animation, or unrelated cleanup.
- If implementation reveals a material requirement outside the approved PLAN, stop and report it for developer review instead of expanding scope.
- Do not change branches or Git history or edit Solo-owned planning state or another role's evidence artifact.

## Required evidence

- Focused Import UI tests cover file selection/analyze separation, preview, acknowledgement/confirmation, safety-critical counts and row decisions, invalid/warning/duplicate content, no-valid-row blocking, completion actions, labels/live regions/focus, and no import-contract change.
- Record exact checks, changed files, and any concerns in this task receipt. Finish with `Status: DONE` only when implementation and task-level checks are complete; otherwise use `BLOCKED` or `DONE_WITH_CONCERNS`.

## Worker Evidence

Status: DONE

Files changed:

- `src/components/import/portfolio-import-page.tsx`
- `src/test/portfolio-import-ui.test.tsx`

Checks:

- `npx vitest run src/test/portfolio-import-ui.test.tsx`: 1 file passed, 3 tests passed.
- `npx eslint src/components/import/portfolio-import-page.tsx src/test/portfolio-import-ui.test.tsx`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

Findings: No concerns. Import parser, actions, server re-check, confirmation payload, and persistence behavior were not changed.
