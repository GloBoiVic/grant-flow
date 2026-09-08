# R001 - Malformed Grant ID Not-Found Behavior

Remediation ID: R001
Status: DONE
Role: BUILD
Workstream: grant-workspace
Branch: solo/grant-workspace

## Origin finding and source artifact

- Origin: `F-001` in `dispatch/workstreams/grant-workspace/VALIDATION.md`
- Finding: malformed route `grantId` input reaches the PostgreSQL UUID filter, throws a Prisma UUID error, and renders a load error instead of the normal not-found behavior required for unavailable Grant IDs.

## Finding severity and classification

- Severity: IMPORTANT
- Category: PRODUCT
- Classification: approved-scope DEFECT

## Related original tasks

- T001 - Workspace route, existing data seams, and isolation coverage
- T002 - Workspace presentation, editing controls, revalidation, Sheet link, and UI coverage

## Approved requirement or invariant violated

- The route must use one indistinguishable normal `notFound()` behavior for nonexistent/unavailable Grant IDs, without exposing a tenant-specific or query-error state.
- The route must not expose data or a partial workspace for an unavailable record.

## Exact remediation outcome

Make malformed `grantId` requests resolve through the same normal not-found behavior as valid nonexistent UUIDs, without changing valid Grant loading, authorization scope, serialization, or other Grant query behavior. Add a focused regression assertion for the malformed-ID path and any directly affected query/route seam.

## Affected implementation seams

- `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx`
- `src/lib/queries/grants.ts` only if required by the smallest safe fix
- Focused route/query tests, and browser evidence if available

## Explicitly out of scope

- No changes to schema, migrations, persistence models, authorization model, workspace UI, mutations, cache policy, unrelated Grant query callers, or error handling outside malformed workspace route IDs.
- No new compatibility abstraction or generalized identifier validation framework.

## Regression evidence required

- Malformed `/grants/[grantId]` request reaches the normal not-found behavior and does not render a load error.
- Existing valid nonexistent UUID behavior remains normal not-found.
- Valid authorized workspace behavior and route option-read short-circuit remain intact.
- Focused tests, relevant type/lint/build/diff checks, and targeted browser verification where available.

## Worker Evidence

- Added a route-local UUID-shape guard so malformed `grantId` values call the same `notFound()` path before `getGrant` or option reads; valid UUIDs retain the existing query and authorization seam.
- Added focused route regression coverage for malformed IDs, while retaining coverage for valid nonexistent UUID short-circuiting and valid DTO loading.
- Focused `npx vitest run src/test/grant-workspace-route.test.ts`: PASS, 1 file, 3 tests.
- `npm run lint`: PASS.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS; production build included `/grants/[grantId]`.
- `git diff --check`: PASS.
- Safari Technology Preview: malformed and valid nonexistent UUID routes both rendered the normal `404` page; no Prisma UUID error appeared.

## Receipt

ROLE: BUILD
STATUS: DONE
ARTIFACT: dispatch/workstreams/grant-workspace/remediations/R001-grant-workspace/BUILD.md
FILES CHANGED: src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx; src/test/grant-workspace-route.test.ts; this receipt
CHECKS / EVIDENCE: Focused route test 3/3; lint, TypeScript, build, diff check, and targeted Safari 404 checks passed.
FINDINGS / CONCERNS: None for R001; root workstream visual approval remains pending and is not claimed.
