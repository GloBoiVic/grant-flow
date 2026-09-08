# R001 - Funder Maintenance Validation Defects

Remediation ID: R001
Status: DONE
Role: BUILD
Workstream: funder-maintenance
Branch: solo/funder-maintenance

## Origin Finding And Source Artifact

Origin: `dispatch/workstreams/funder-maintenance/VALIDATION.md`

- High finding at lines 51-54: the shared Website validation accepts `javascript:` and `data:` schemes, which can be persisted and rendered as unsafe external links.
- Medium finding at lines 55-57: Sheet close, overlay dismissal, and Escape silently discard dirty Funder edit changes.

## Finding Severity

High and Medium. Both are approved-scope defects and block advancement.

## Related Original Tasks

- T001 - Funder Contract, Query, Mutation, and Isolation
- T002 - Funder List, Detail Sheet, Shared Form, and Dependent UI Coverage

## Approved Requirement Or Invariant Violated

- Frozen Website contract and Acceptance Criteria 6 and 12: populated Website values must be safe external links and invalid URLs must be rejected before persistence.
- Frozen Funder Detail and Edit UX contract and Acceptance Criterion 28: edit Cancel/close behavior must not silently lose entered values; Sheet close behavior must remain accessible and safe.

## Exact Remediation Outcome

- Restrict the shared Website validation to supported safe web URL schemes so unsafe schemes fail before any write, while preserving the existing URL/trim/nullable contract.
- Ensure every edit-mode Sheet dismissal path consults dirty state and requires explicit discard confirmation before closing; ordinary clean close and explicit form Cancel behavior remain usable.
- Add focused regression coverage for unsafe URL rejection/no write and dirty dismissal protection across close behavior.

## Affected Implementation Seams

- `src/lib/validations/funder.ts`
- `src/components/funders/funder-detail-sheet.tsx`
- `src/components/funders/funder-form.tsx` only as directly required to expose the existing dirty guard
- Focused Funder domain/UI tests only

## Explicit Out-Of-Scope Items

- No schema, migration, route, query, cache, persistence model, Activity/revision infrastructure, generalized form abstraction, CRM/contact control, or unrelated Grant behavior.
- No changes to Website display beyond ensuring the already-approved external-link rendering receives safe values.
- No human Safari approval is replaced by automated checks.

## Regression Evidence Required

- Unsafe `javascript:` and `data:` Website inputs fail validation before authorization/persistence and create no Activity.
- Safe HTTP(S) Website values retain current behavior and blank values still normalize to `null`.
- Dirty edit dismissal via Sheet close, overlay, and Escape does not close without explicit discard confirmation; cancel/clean close still works.
- Focused Funder domain/UI tests, TypeScript, lint, and `git diff --check` pass.

## Worker Evidence

Status: DONE

Files changed:

- `src/lib/validations/funder.ts`
- `src/components/funders/funder-detail-sheet.tsx`
- `src/components/funders/funder-form.tsx`
- `src/test/domain-contracts.test.ts`
- `src/test/domain-actions.test.ts`
- `src/test/funder-ui.test.tsx`
- `dispatch/workstreams/funder-maintenance/remediations/R001-funder-maintenance/BUILD.md`

Checks/evidence:

- Focused Funder domain/query/action/UI and dependent Grant/import checks: 7 files, 102 tests passed.
- Unsafe `javascript:` and `data:` Website values fail shared validation before authorization, persistence, and Activity creation; safe HTTP(S), trimming, existing URL limits, and blank-to-null behavior remain covered.
- Dirty edit dismissal through Sheet close, overlay, and Escape now requires explicit discard confirmation; declined discard preserves edit mode and accepted discard closes cleanly. Existing clean close and explicit Cancel behavior remain covered.
- `npx tsc --noEmit` passed under Node 26.8.1.
- `npm run lint` passed.
- `git diff --check` passed.

Findings/concerns:

- None. No schema, route, query, cache, persistence, Activity/revision, CRM/contact, or unrelated Grant behavior was added. Full validation and Safari Technology Preview approval remain downstream gates.
