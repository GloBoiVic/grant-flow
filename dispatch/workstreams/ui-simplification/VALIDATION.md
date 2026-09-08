# ui-simplification Validation

Status: FAIL
Role: VALIDATE
Workstream: ui-simplification
Branch: solo/ui-simplification

## Conclusion

T001-T005 are implemented within the approved surface/file scope and the required checks pass, but the frozen Dashboard continuation contract is not met. The Dashboard renders exactly one `View deadlines` link, and it targets `/grants?status=Research&status=Qualified&status=Planning&status=Writing&status=Internal+Review` instead of `/deadlines`.

Finding: `IMPORTANT | PRODUCT | approved-scope DEFECT | not NEW SCOPE`. Evidence is in `src/components/dashboard/dashboard-content.tsx:83,172-176` and the live Safari href; `src/test/dashboard-page.test.tsx:109-120,298-315` currently asserts the incorrect `/grants` contract and explicitly excludes `/deadlines`. No remediation was made.

All other audited acceptance areas passed focused tests, source/diff inspection, and available Safari checks: Dashboard composition and narrow safety apart from the destination; Grants list/Sheet/Form; Workspace complete fields and currency presentation; Deadline View groups/links; Funder list/Sheet/Form; safe Import hierarchy and semantics; and authenticated shell/mobile context/account actions. PostgreSQL/domain/import integration coverage found no data, route, authorization, or persistence regression. The URL-controlled Grant Sheet has no `SheetTrigger`; Safari therefore returned focus to `body` after close, matching the pre-workstream controlled structure at the base SHA and not classified as a T001-T005 regression.

## Checks / Evidence

- Node `v26.8.1`; npm `11.19.0`.
- Focused first: `npm run test:run -- src/test/dashboard-page.test.tsx src/test/grant-ui.test.tsx src/test/deadline-view.test.tsx src/test/funder-ui.test.tsx src/test/portfolio-import-ui.test.tsx src/test/app-shell.test.tsx src/test/account-menu.test.tsx src/test/desktop-sidebar.test.tsx src/test/mobile-navigation.test.tsx src/test/navigation-list.test.tsx src/test/grant-workspace-route.test.ts src/test/deadlines-route.test.ts` -> 12 files, 91 tests passed.
- `npm run test:run` with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` loaded from local env files without exposing its value -> 44 files, 294 tests passed, 0 skipped.
- Explicit PostgreSQL run of the five `src/test/postgres-*.integration.test.ts` suites -> 5 files, 37 tests passed, 0 skipped.
- `npm run lint` -> passed.
- `npx tsc --noEmit` -> passed.
- `npm run verify:prisma` -> `Connected`.
- `npm run build` -> passed; all expected application routes compiled.
- `git diff --check` -> passed.
- Safari Technology Preview MCP: authenticated local session available. Desktop and 390px checks covered Dashboard, Grants list/Sheet/Form, Workspace, Deadline View, Funders/Sheet/Form, Import, mobile navigation, account menu, and desktop shell. No document-level horizontal overflow was observed; intentional dense-table internal scrolling remained contained. The live Dashboard check confirmed one `View deadlines` link with the incorrect `/grants?...` href.
- Final tracked diff scope was limited to T001-T005 source/test paths plus the pre-existing `dispatch/ACTIVE.md` worktree change; no schema, migration, query, action, auth, shared primitive, config, or generated persistence changes were present.

## Non-blocking Tooling Note

`MINOR | TOOLING | NEW SCOPE`: Vitest emitted the existing `configLoader: 'native'` compatibility warning. It did not affect any result. Safari also emitted the expected Clerk development-key warning in the local environment.
