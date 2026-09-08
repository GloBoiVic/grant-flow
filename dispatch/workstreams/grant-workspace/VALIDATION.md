# Grant Workspace Validation

Status: FAIL
Role: VALIDATE
Workstream: grant-workspace
Branch: solo/grant-workspace

## Scope

Independently validated the frozen PLAN acceptance criteria, completed T001/T002 receipts, implementation and test diff, focused and full tests, PostgreSQL isolation, repository gates, and Safari Technology Preview evidence. No application, test, fixture, selector, harness, workflow, or non-owned artifact was edited.

## Evidence

- Node `v26.8.1`.
- Focused `npx vitest run src/test/grant-workspace-route.test.ts src/test/grant-ui.test.tsx src/test/domain-queries.test.ts src/test/domain-actions.test.ts src/test/tag-actions.test.ts`: PASS, 5 files, 54 tests.
- PostgreSQL-enabled `npx vitest run src/test/postgres-domain-isolation.integration.test.ts` with the ignored local database URL loaded into the process without printing its value: PASS, 1 file, 22 tests.
- PostgreSQL-enabled `set -a; source .env; source .env.local; npm run test:run` without printing the database URL: PASS, 42 files, 251 tests, 0 skipped.
- `npm run lint`: PASS.
- `npx tsc --noEmit`: PASS.
- `npm run verify:prisma`: PASS, connected.
- `npm run build`: PASS; production build included `/grants/[grantId]`.
- `git diff --check`: PASS before this receipt update; final check also passed after the update.
- Full diff, status, route, server/client boundary, DTO serialization, mutation revalidation/no-op behavior, scope boundaries, and relevant source/tests inspected. No schema, migration, persistence model, unrelated route, or out-of-scope workspace surface was introduced.

## Browser Evidence

- Safari Technology Preview authenticated discovery at `/grants` on desktop, followed by a portfolio row click to the existing `?grant=<id>` Sheet.
- Sheet snapshot confirmed the accessible `Open full grant` link; interaction followed it to `/grants/<grantId>` and verified the workspace route.
- Desktop snapshot and screenshot confirmed one Grant H1, Back to Grants, header Funder/status/actions, stacked Overview, nested Tags, Notes, and Activity. Edit opened the existing form and Cancel returned to the workspace.
- Same-status interaction showed `Status updated successfully.` with the workspace URL unchanged; no real status-changing or tag-mutating browser action was performed against the shared seeded record.
- At 390px viewport, snapshot confirmed the required content and controls remained present. DOM metrics reported viewport client width 373px, document/body scroll width 373px, and no overflowing elements.
- Valid nonexistent UUID `/grants/00000000-0000-0000-0000-000000000099` produced the normal 404 page.
- Browser console on the valid workspace contained only the existing Clerk development-key warning and suspended HMR WebSocket message. The malformed-ID check produced the Prisma UUID error recorded below.

## Findings

- **F-001 | IMPORTANT | PRODUCT | approved-scope DEFECT** — A malformed route `grantId` does not collapse to the frozen not-found behavior. `src/lib/queries/grants.ts:139-159` passes the raw route string into the PostgreSQL UUID Grant filter, and `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx:13-18` only handles a `null` result. Safari navigation to `/grants/not-a-real-grant` produced Prisma `invalid input syntax for type uuid` and the user-facing `Grants could not load` error state instead of the normal 404 used for a valid nonexistent UUID. The route contract requires unavailable/nonexistent Grant IDs to be indistinguishable through normal not-found behavior. Normalize/validate the route ID or otherwise make this query return `null` for malformed IDs before `notFound()` handling.

## Limitations

- Cross-organization, soft-deleted Grant, deleted-Funder, and mismatched-Funder browser sessions were not exercised interactively; the PostgreSQL-enabled isolation suite passed the corresponding query cases.
- Human visual approval cannot be supplied by automated Safari evidence. The required explicit developer Safari Technology Preview visual approval remains outstanding; no approval is claimed.

## Receipt

ROLE: VALIDATE
STATUS: FAIL
ARTIFACT: dispatch/workstreams/grant-workspace/VALIDATION.md
FILES CHANGED: dispatch/workstreams/grant-workspace/VALIDATION.md
CHECKS / EVIDENCE: Focused 54/54; PostgreSQL isolation 22/22; full PostgreSQL-enabled suite 251/251 with 0 skipped; lint, TypeScript, Prisma verification, build, diff check, and Safari desktop/mobile/Sheet/control checks passed.
FINDINGS / CONCERNS: F-001 IMPORTANT PRODUCT approved-scope defect: malformed `grantId` produces a load error instead of normal not-found; human visual approval remains pending.
