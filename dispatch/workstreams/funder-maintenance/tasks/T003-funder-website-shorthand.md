# T003 - Website Shorthand Normalization

Status: DONE
Role: BUILD
Workstream: funder-maintenance
Branch: solo/funder-maintenance
Dependency: T001 DONE; T002 DONE; R001 DONE

## Outcome

Allow a grant professional to enter a Website as `example.com` while retaining safe external-link behavior and the existing shared Funder validation contract.

## Scope

- Normalize scheme-less Website values such as `example.com` to `https://example.com` before safe-scheme and length validation/persistence.
- Preserve explicit `http://` and `https://` values, blank-to-null normalization, unsafe-scheme rejection, URL limits, and existing validation error behavior.
- Keep the existing `type="url"` field and custom `noValidate` submission path usable for shorthand input; update the placeholder/hint only as needed.
- Add focused contract/action/UI regression coverage for shorthand normalization, explicit schemes, invalid schemes, no-write behavior, and normalized display/return values.

## Constraints

- Do not add a URL abstraction, schema/migration/index, route, persistence field, cache layer, CRM/contact behavior, or unrelated Grant behavior.
- Do not weaken safe-scheme validation: only `http:` and `https:` may be persisted/rendered.
- Do not change the existing nullable, organization, Activity, or Sheet behavior.
- If implementation requires a material contract or architecture change beyond this approved revision, stop and report BLOCKED rather than expanding scope.

## Required Evidence

- Focused Funder contract/action/UI tests prove `example.com` becomes `https://example.com`, explicit schemes remain correct, unsafe schemes fail before writes, and blank values remain `null`.
- TypeScript, lint, and `git diff --check` pass.
- The later validation stage repeats affected Safari checks; the human visual/browser gate remains after validation and review.

## Worker Evidence

ROLE: BUILD
STATUS: DONE
ARTIFACT: dispatch/workstreams/funder-maintenance/tasks/T003-funder-website-shorthand.md
FILES CHANGED: src/lib/validations/funder.ts; src/components/funders/funder-form.tsx; src/test/domain-contracts.test.ts; src/test/domain-actions.test.ts; src/test/funder-ui.test.tsx
CHECKS / EVIDENCE: Node v26.8.1; focused Vitest contract/action/UI suites passed (3 files, 38 tests); npx tsc --noEmit passed; npm run lint passed; git diff --check passed before receipt update and rerun after update.
FINDINGS / CONCERNS: None. Existing Vitest runs emit the repository's Vite configLoader native warning only.
