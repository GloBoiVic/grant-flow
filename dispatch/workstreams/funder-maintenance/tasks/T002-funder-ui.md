# T002 - Funder List, Detail Sheet, Shared Form, and Dependent UI Coverage

Status: DONE
Role: BUILD
Workstream: funder-maintenance
Branch: solo/funder-maintenance
Dependency: T001 DONE

## Outcome

Implement the bounded `/funders` selection/detail/edit experience and its dependent UI coverage using the completed T001 contract.

## Scope

- Make only Funder Name cells semantic accessible buttons and add the bounded detail Sheet; do not add `/funders/[id]` or make rows clickable.
- Share the five-field form contract between Add and Edit with the smallest Funder-specific reuse needed to keep initialization, normalization, validation, and success/error behavior aligned.
- Show all five maintained fields with human-readable type labels, safe links and wrapping, preserved Notes line breaks, concise null treatment, visible focus, accessible Sheet controls, narrow-safe layout, and no CRM/contact controls.
- Implement detail/edit state transitions, edit success handling, list refresh, and current Grant Workspace summary behavior while preserving existing Grant surfaces.
- Extend focused Funder/Grant UI and import coverage for the approved accessibility, sparse-data, long-text, responsive, refresh, and out-of-scope assertions.

## Constraints

- Preserve the existing GrantFlow visual language and Add funder interaction.
- Do not add Funder relationship panels, contacts, Activity timeline, delete/restore, reminders, owner controls, new list columns, a second query, or generalized UI infrastructure.
- If implementation reveals a material requirement outside the approved PLAN, stop and report it for developer review instead of expanding scope.

## Required Evidence

- Focused Funder UI, Grant UI, and import checks pass.
- Semantic interaction, validation preservation, successful update/detail replacement, router refresh, list refresh, narrow-safe structure, and absence of out-of-scope controls are covered.
- Run the full repository validation matrix only at the approved VALIDATE stage; the human Safari Technology Preview gate remains after BUILD, VALIDATE, and REVIEW.

## Worker Evidence

Complete this section with the BUILD receipt. Do not edit a completed receipt.

Status: DONE

Files changed:

- `src/components/funders/funder-form.tsx`
- `src/components/funders/funder-list.tsx`
- `src/components/funders/funder-page.tsx`
- `src/components/funders/funder-detail-sheet.tsx`
- `src/test/funder-ui.test.tsx`
- `dispatch/workstreams/funder-maintenance/tasks/T002-funder-ui.md`

Checks/evidence:

- Focused Funder UI, Grant UI, Grant Workspace route, and portfolio import checks: 4 files, 52 tests passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed.
- `git diff --check` passed.
- Coverage includes semantic Name-button keyboard selection, independent Website links, complete detail fields, sparse and long values, shared Add/Edit controls, preserved validation values, complete edit submission, returned-DTO detail replacement, refresh, reselected list/detail values, narrow-safe Sheet structure, and out-of-scope control absence.

Findings/concerns:

- None. T001-modified domain, Grant, import, and active-state artifacts were left untouched. Full repository validation remains for the approved VALIDATE stage, and Safari Technology Preview human approval remains required after VALIDATE and REVIEW.
