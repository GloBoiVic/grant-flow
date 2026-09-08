# R001 - Dashboard deadline destination validation

Status: PASS
Role: VALIDATE
Workstream: ui-simplification
Branch: solo/ui-simplification

## Assignment

Independently validate the R001 remediation against the origin finding in the root `VALIDATION.md`, the frozen PLAN, and the R001 BUILD packet. Diagnose only; do not edit application code, tests, fixtures, selectors, harnesses, configuration, planning state, or evidence artifacts other than this receipt.

## Required checks

- Verify the Dashboard has exactly one `View deadlines` link and its href is exactly `/deadlines`.
- Verify separate Tracked grants, Open pipeline, status links, upcoming Grant Sheet links, and all Dashboard DTO/query behavior remain unchanged.
- Run the focused Dashboard UI/accessibility test and relevant regression checks, plus scoped lint, TypeScript, and `git diff --check`.
- Inspect the remediation diff for strict scope compliance and confirm no schema, query/domain, auth, persistence, navigation configuration, or unrelated files changed.
- Use Safari Technology Preview MCP for the affected Dashboard desktop/narrow route check when authenticated state permits, and record any limitation.

## Finding protocol

Classify any finding as `CRITICAL`, `IMPORTANT`, or `MINOR`, and as `PRODUCT`, `REGRESSION`, or `TOOLING`. Identify whether it is an approved-scope `DEFECT` or `NEW SCOPE`. Do not remediate findings in this artifact.

## Conclusion

R001 passes the frozen Dashboard continuation contract. The Dashboard renders exactly one `View deadlines` link with href `/deadlines`, and the link navigates to `/deadlines`. Tracked grants, Open pipeline, status breakdown, and upcoming Grant Sheet links remain separate and retain their existing destinations. Dashboard DTO/query behavior remains unchanged.

The remediation is limited to the packet seams `src/components/dashboard/dashboard-content.tsx` and `src/test/dashboard-page.test.tsx`; no Dashboard query, DTO, route, Deadline query/route, grant-list contract, schema, auth, persistence, navigation configuration, or unrelated implementation file changed for R001.

No `CRITICAL`, `IMPORTANT`, or `MINOR` PRODUCT or REGRESSION finding was identified. The PostgreSQL dashboard integration suite could not run because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unavailable and was skipped. Safari emitted the existing local HMR suspension and Clerk development-key warnings; Vitest emitted the existing `configLoader: 'native'` compatibility warning. These are `MINOR | TOOLING | NEW SCOPE` limitations and do not affect the R001 result.

## Checks / Evidence

- `npm run test:run -- src/test/dashboard-page.test.tsx` -> 1 file, 17 tests passed.
- `npm run test:run -- src/test/dashboard-queries.test.ts src/test/dashboard-dates.test.ts` -> 2 files, 29 tests passed.
- `npm run test:run -- src/test/deadline-view.test.tsx src/test/deadlines-route.test.ts` -> 2 files, 5 tests passed.
- `npm run test:run -- src/test/postgres-dashboard.integration.test.ts` -> 1 file, 5 tests skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unavailable.
- `npm run lint -- src/components/dashboard/dashboard-content.tsx src/test/dashboard-page.test.tsx` -> passed.
- `npx tsc --noEmit` -> passed.
- `git diff --check` -> passed.
- Source and diff audit -> exactly one `/deadlines` href; no diff in Dashboard DTO/query, Dashboard route, Deadline query/route, or grant-list contract. R001 target files are limited to the BUILD packet.
- Safari Technology Preview authenticated desktop check at `1360x750` -> one `View deadlines` link with `/deadlines`; click navigated to `/deadlines`; Tracked grants, Open pipeline, upcoming Grant Sheet, and 11 status links retained separate destinations.
- Safari Technology Preview authenticated narrow check at `390x844` -> one `/deadlines` link, separate drill-down links, mobile navigation visible, and no document-level horizontal overflow (`scrollWidth === clientWidth`).
