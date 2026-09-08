# Funder Maintenance Validation

Status: FAIL
Role: VALIDATE
Workstream: funder-maintenance
Branch: solo/funder-maintenance

## Validation Scope

Independent validation against `PLAN.md`, the frozen Funder contract, and the completed T001/T002 receipts. Only this validation artifact was edited by the validator.

## Runtime

- `node --version`: `v26.8.1`
- `npm --version`: `11.19.0`

## Gate Evidence

- Focused `npm run test:run -- src/test/domain-contracts.test.ts src/test/domain-queries.test.ts src/test/domain-actions.test.ts src/test/funder-ui.test.tsx src/test/grant-ui.test.tsx src/test/grant-workspace-route.test.ts src/test/portfolio-xlsx.test.ts`: 7 files passed, 93 tests passed.
- PostgreSQL integration command covering all five `src/test/postgres-*.integration.test.ts` files: 5 files passed, 36 tests passed.
- `GRANTFLOW_TEST_DATABASE_ADMIN_URL` was loaded only in an ephemeral Node runner from the local env files and passed to the test child process. Its value was not printed, traced, persisted, or included here.
- Normal `npm run test:run` without the database variable: 37 files passed, 5 skipped; 231 tests passed, 36 skipped. The skipped tests were the opt-in PostgreSQL suites.
- Normal `npm run test:run` with the database variable loaded in the ephemeral runner: 42 files passed, 267 tests passed, 0 skipped.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run verify:prisma`: passed and connected.
- `npm run build`: passed. Prisma client generated and the route output contained the existing `/funders` and `/grants/[grantId]` routes with no `/funders/[id]` route.
- `git diff --check`: passed.

## Browser Evidence

- Safari Technology Preview MCP loaded authenticated `http://localhost:3000/funders` through the local development server.
- Page discovery confirmed the existing Funder list, Name/Type/Website columns, semantic Name buttons, and no new Funder route.
- Pointer activation opened the detail Sheet. Keyboard activation of a focused Name button also opened it.
- Detail discovery confirmed the meaningful title, description, labeled Name, Type, Website, County served, and Notes fields, human-readable type labels, concise null treatment, independent close control, and absence of contacts, CRM, relationship, Activity timeline, delete/restore, reminder, and owner controls.
- At a narrow viewport, the Sheet and edit form rendered without document-wide horizontal overflow. The existing table retained its bounded horizontal scroller. A narrow edit screenshot was captured for visual inspection.
- Invalid Website submission produced the form alert `Invalid funder details.` and the inline `Invalid URL` error while preserving the entered value.
- Browser console contained no application error. Safari emitted only the Clerk development-key warning.
- A dirty edit was entered and dismissed through the Sheet Close control; no discard confirmation appeared. This reproduces Finding 2 below.

## Changed Paths And Scope

- The tracked implementation diff is limited to the approved existing action, Funder form/list/page, Funder and Grant queries, Funder validation/type, and the approved dependent Funder, Grant, route, and import tests.
- `src/components/funders/funder-detail-sheet.tsx` is the approved T002 bounded Sheet addition.
- No Prisma schema, migration, index, persistence model, route family, cache abstraction, contact/CRM infrastructure, revision/audit infrastructure, or unrelated Grant behavior was added.
- `dispatch/ACTIVE.md` was already modified in the initial worktree inspection and was not touched by validation.
- The untracked workstream directory, `PLAN.md`, both completed task receipts, and the prepared `VALIDATION.md` were present in the initial worktree inspection. No task receipt, plan, workflow, or application/test file was edited by validation.

## Findings

### High

- `src/lib/validations/funder.ts:14-17` accepts unsafe URL schemes because `.url()` accepts values such as `javascript:alert(1)` and `data:text/html,hi`. The accepted value is persisted by the existing create/edit actions and rendered directly as `href` in `src/components/funders/funder-list.tsx:38` and `src/components/funders/funder-detail-sheet.tsx:73-74`. This violates the frozen Website display contract and Acceptance Criterion 6, `Existing populated Website values render as safe external links`; it also violates Acceptance Criterion 12's requirement that invalid URLs be rejected before persistence. This is an approved-scope security defect, not new scope.

### Medium

- `src/components/funders/funder-detail-sheet.tsx:38-43` closes the Sheet and resets edit mode without consulting the dirty state. `FunderForm.closeForm()` at `src/components/funders/funder-form.tsx:76-79` confirms only the form's Cancel button, so the Sheet X control, overlay, or Escape can silently discard entered edits. This violates the Funder Detail and Edit UX contract's required Cancel/close behavior and Acceptance Criterion 28's accessible Sheet close behavior. Safari reproduced the issue. This is an approved-scope UX defect, not new scope.

## Limitations

- Safari automated checks used the authenticated local development data, which had sparse Funders with null Website, County served, and Notes values. Populated values, long text, and successful persistence were validated through the focused component/domain/PostgreSQL tests; a real browser save was not performed to avoid mutating local user data.
- Human visual/browser approval remains outstanding and is still required after REVIEW. The validation result is FAIL and advancement is blocked until the approved-scope findings are resolved and the matrix is rerun.
