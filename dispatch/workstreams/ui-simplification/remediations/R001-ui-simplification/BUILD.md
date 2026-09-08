# R001 - Dashboard deadline destination

Remediation ID: R001
Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification

## Origin finding and source artifact

- Source: `dispatch/workstreams/ui-simplification/VALIDATION.md`
- Finding: `IMPORTANT | PRODUCT | approved-scope DEFECT`
- Root issue: The Dashboard has one `View deadlines` link, but it targets the pre-submission `/grants?...` filter instead of the frozen `/deadlines` destination.

## Related original task(s)

- T001 - Dashboard composition

## Approved requirement or invariant violated

- Frozen PLAN decision: the Dashboard’s one `View deadlines` continuation goes to `/deadlines`.
- Acceptance criteria 5 and 18: retain one clear `View deadlines` path to Deadline View.
- Acceptance criterion 39: no query/domain/auth/persistence behavior changes; this remediation is limited to the presentation link and its focused assertions.

## Exact remediation outcome

- Change only the Dashboard’s single `View deadlines` href to exactly `/deadlines`.
- Update focused Dashboard assertions to require `/deadlines` and remove assertions that encode the incorrect pre-submission Grant filter for that link.
- Keep the separate Tracked grants/Open pipeline/status Grant links and all Dashboard DTO/query behavior unchanged.

## Affected implementation seams

- `src/components/dashboard/dashboard-content.tsx`
- `src/test/dashboard-page.test.tsx`

## Explicitly out of scope

- No Dashboard layout/copy redesign beyond the link destination assertion.
- No query/domain, DTO, persistence, schema, auth, navigation configuration, Deadline View, Grant list, or shared primitive changes.
- No changes to other continuation links or status/filter URLs.

## Regression evidence required

- Focused Dashboard UI/accessibility tests pass and assert exactly one `View deadlines` link with href `/deadlines`.
- Existing Grant drill-down/status links and no unsupported query parameter assertions remain covered.
- Run scoped lint, TypeScript, and `git diff --check`; record exact results.

## Worker Evidence

Status: DONE

Files changed:

- `src/components/dashboard/dashboard-content.tsx`
- `src/test/dashboard-page.test.tsx`
- `dispatch/workstreams/ui-simplification/remediations/R001-ui-simplification/BUILD.md`

Implementation:

- Changed the Dashboard's single `View deadlines` link destination to exactly `/deadlines`.
- Updated only the focused Dashboard assertions for that destination. Existing Grant drill-down/status links, DTO/query behavior, layout, copy, and unsupported-parameter checks were preserved.

Checks / evidence:

- `npm run test:run -- src/test/dashboard-page.test.tsx` -> passed: 1 file, 17 tests.
- `npm run lint -- src/components/dashboard/dashboard-content.tsx src/test/dashboard-page.test.tsx` -> passed.
- `npx tsc --noEmit` -> passed.
- `git diff --check` -> passed.

Findings / concerns:

- None. The remediation remained within the approved R001 packet.
