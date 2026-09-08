# Data Export Validation

ROLE: VALIDATE
WORKSTREAM: data-export
BRANCH: solo/data-export
TASK: T002

## Result

PASS

Independent validation against `dispatch/workstreams/data-export/PLAN.md`, the frozen export contract, and the immutable T001/T002 BUILD receipts found no blocking findings.

## Findings

- Approved-scope DEFECT: none.
- NEW SCOPE: none.
- Blocking findings: 0.

## Contract Evidence

- `src/lib/queries/portfolio-export.ts:34-92` performs one self-authorized, unpaginated organization-scoped read, excludes deleted or mismatched Funders, scopes active Tags, includes all statuses, applies the frozen Grant/Tag ordering, and converts Decimal/Date values to plain export rows.
- `src/lib/export/portfolio-csv.ts:1-82` implements the exact 18 headers, quoted cells, null blanks, JSON Tag cells, formula guarding, embedded line breaks, UTF-8 BOM, and CRLF records.
- `src/app/(authenticated)/(org-required)/export/portfolio/route.ts:1-33` ignores request query parameters, composes the query and serializer before constructing the response, emits the frozen current-UTC attachment and cache/security headers, and returns generic non-attachment 401/500 responses.
- `src/proxy.ts:14-17` continues to cover the extensionless export route while excluding `.csv` static-looking paths as required by the plan.
- `src/components/grants/grants-page.tsx:132` adds exactly one native `/export/portfolio` anchor beside `Add grant`, using the existing Button outline seam, accessible current-portfolio CSV description, visible focus styling, and no query-state propagation. The action remains present in populated, true-empty, and filtered-empty states.
- Focused tests cover serializer safety/formatting, query scoping and plain values, Route Handler success/error/query behavior, PostgreSQL isolation, and preserved Grant controls.

## Required Checks

Environment: Node `v26.8.1`.

- Focused Node 26 runner invoking `node_modules/vitest/vitest.mjs run` for `portfolio-export.test.ts`, `portfolio-export-route.test.ts`, `domain-queries.test.ts`, `grant-ui.test.tsx`, and `postgres-domain-isolation.integration.test.ts`: 5 files passed, 78 tests passed.
- PostgreSQL integration runner invoking `node_modules/vitest/vitest.mjs run` for all five `src/test/postgres-*.integration.test.ts` files: 5 files passed, 37 tests passed.
- `GRANTFLOW_TEST_DATABASE_ADMIN_URL` was loaded from ignored local env files only inside ephemeral Node runners and passed to child test processes. Its value was not printed, traced, persisted, or included here.
- `npm run test:run`, executed with the ephemeral database environment: 44 files passed, 292 tests passed, 0 skipped.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run verify:prisma`: passed and connected.
- `npm run build`: passed. Prisma Client generated and Next recognized dynamic `/export/portfolio`.
- `git diff --check`: passed.
- Vitest emitted the repository's existing Vite `configLoader: 'native'` warning; it did not fail a check.

## Safari Technology Preview

- Safari Technology Preview MCP loaded the local development server and opened `/grants`; the unauthenticated request resolved to `/login?redirect_url=.../grants`. The snapshot/read showed the Clerk sign-in surface, not the Grants page.
- A direct query-bearing `/export/portfolio?q=Housing&status=Research&sort=funder&dir=desc&page=2` navigation likewise resolved to the Clerk login redirect with the requested URL preserved in `redirect_url`.
- No authenticated session was available, so the Grants page could not be discovered, the filtered/paginated export control could not be activated, and no browser download evidence was produced. The console showed only the Clerk development-key warning and no application error.
- Automated route/query behavior is covered by the passing Route Handler and UI tests; this does not replace the required authenticated browser gate.

Human Safari download and file-inspection approval: OUTSTANDING. No downloaded file was inspected in this validation session. An authenticated human must verify the filtered/paginated link, ordinary Safari download, filename, complete portfolio contents, and raw/spreadsheet CSV structure before merge or GIT END. This validator does not grant that approval; it remains outstanding until `READY_FOR_USER`.

## Final Scope Inspection

- The implementation scope is limited to the approved export query, pure serializer, extensionless Route Handler, Grants header action, and their focused/domain/PostgreSQL/UI tests.
- No schema, migration, dependency, DTO, import contract, public API, report surface, client Blob pipeline, persistence, or unrelated application behavior was added.
- `dispatch/ACTIVE.md` was already modified before validation and was not touched. `PLAN.md` and both immutable BUILD receipts were read and not touched.
- Final worktree status contained the expected data-export paths plus the pre-existing Active-workstream change; no unexpected tracked path was present.
- Only `dispatch/workstreams/data-export/VALIDATION.md` was written by this VALIDATE task.
