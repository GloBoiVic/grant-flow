# R001 Validation - Funder Maintenance Validation Defects

Status: PASS
Role: VALIDATE
Workstream: funder-maintenance
Branch: solo/funder-maintenance

## Validation Scope

Independent validation of the two immutable findings in the original workstream validation and the exact remediation outcomes in `BUILD.md`. Validation was limited to unsafe Website scheme handling, nullable Website normalization, and dirty Funder edit dismissal behavior plus directly affected regressions.

## Runtime

- `node --version`: `v26.8.1`
- `npm --version`: `11.19.0`

## Gate Evidence

- `npm run test:run -- src/test/domain-contracts.test.ts src/test/domain-actions.test.ts src/test/funder-ui.test.tsx`: 3 files passed, 35 tests passed.
- Contract coverage rejected both `javascript:alert(1)` and `data:text/html,unsafe`, preserved `http://` and `https://`, and normalized blank Website, County served, and Notes values to `null`.
- Action coverage proved both unsafe Website inputs return `Invalid funder details.` before `authorizeAction()`, Funder create/update, or Activity creation. No write or Activity mock was called.
- UI coverage proved dirty Sheet close-control, overlay, and Escape dismissal each require confirmation; declined discard preserves edit mode and entered values; accepted discard closes. Clean Cancel and clean Sheet close remain usable.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- The full matrix was not rerun; the remediation was limited to the two targeted defects and the required targeted evidence passed.

## Safari Technology Preview Evidence

- Discovered and read authenticated `http://localhost:3000/funders` through the Safari Technology Preview MCP.
- Pointer activation opened the existing detail Sheet from a semantic Funder Name button; the page remained `/funders`.
- Browser submission of `javascript:alert(1)` and `data:text/html,unsafe` produced `Invalid funder details.` and `Invalid URL`, preserved the entered values, and left the list unchanged at 17 Funders.
- Dirty edit dismissal through the Sheet close control opened `Discard unsaved funder changes?`; dismissing the native confirmation preserved the edit form and entered text, and accepting it closed the Sheet.
- Dirty overlay dismissal and dirty Escape dismissal produced the same confirmation; declined dismissal preserved entered text and accepted dismissal closed the Sheet.
- Clean edit Cancel returned to detail without a prompt, and clean Sheet close completed without a prompt.
- The browser console had no application errors or warnings during the check. Safari emitted no captured console entries.

## Changed Paths And Scope

- The R001 BUILD-declared paths match the approved affected seams: `src/lib/validations/funder.ts`, `src/components/funders/funder-detail-sheet.tsx`, `src/components/funders/funder-form.tsx`, `src/test/domain-contracts.test.ts`, `src/test/domain-actions.test.ts`, and `src/test/funder-ui.test.tsx`.
- The broader branch paths remain the frozen T001/T002 implementation and dependent-test paths listed in `PLAN.md`. No schema, migration, index, route family, cache abstraction, CRM/contact, revision/audit, or unrelated Grant behavior was added.
- `dispatch/ACTIVE.md`, the workstream directory, PLAN, the original validation, T001/T002, and R001 BUILD were present in the initial worktree inspection and were not edited by validation.
- Final status remained on `solo/funder-maintenance`; the only validation edit was this prepared R001 artifact.

## Findings

None. No unresolved Critical, Important, or Minor findings were found for the two R001 remediation outcomes or directly affected behavior.

## Limitations

- Safari checks used authenticated local development data with sparse Funders. No real successful edit/save was performed to avoid mutating local user data; safe HTTP(S), blank-to-null, and action-side no-write guarantees were covered by the focused tests.
- Native Safari confirmation dialogs caused the interaction calls that opened them to time out until handled through the Safari dialogs tool; the dialogs, declined preservation, and accepted close behavior were verified afterward.
- Human visual/browser approval remains outstanding and is not replaced by this automated validation. Merge and GIT END remain blocked until explicit approval after REVIEW.
