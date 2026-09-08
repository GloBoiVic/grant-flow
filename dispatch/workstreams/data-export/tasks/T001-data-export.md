# T001 - Scoped CSV Contract, Query, and Download Route

Status: DONE
Role: BUILD
Workstream: data-export
Branch: solo/data-export
Dependency: None

## Outcome

Implement the approved authenticated portfolio export query, pure CSV serializer, Route Handler, and focused server-side coverage without changing persistence or import contracts.

## Scope

- Add the self-authorizing server-only export query with one organization-scoped Prisma read.
- Include every non-deleted Grant with a non-deleted same-organization Funder across all lifecycle statuses, and active same-organization Tags only.
- Preserve the exact approved 18-column order, stable Grant/Tag ordering, human-readable status/type values, exact two-decimal amounts, UTC-safe dates, nullable cells, line breaks, JSON Tag arrays, formula safety, BOM, CRLF, quoting, and failure semantics.
- Add the extensionless authenticated `GET /export/portfolio` Route Handler with the exact success, authorization failure, and unexpected failure headers/bodies.
- Ensure authorization is resolved exactly once through the export query and query parameters do not affect scope or output.
- Add focused serializer, query, route, and PostgreSQL isolation coverage for the frozen contract.

## Constraints

- Do not add schema, migrations, indexes, DTO changes, import changes, public APIs, report/export abstractions, streaming infrastructure, client Blob/download code, or document export.
- Do not trust client-provided organization IDs, filters, sort values, record IDs, or authorization metadata.
- Keep Prisma Decimal and Date conversion inside the server-only query; the pure serializer receives only plain export rows.
- If implementation reveals a material requirement outside the approved PLAN, stop and report it for developer review instead of expanding scope.

## Required Evidence

- Focused serializer, query, Route Handler, and PostgreSQL integration checks pass with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` exported without exposing its value.
- Coverage demonstrates tenant isolation, all-status/non-deleted inclusion, active local Tag ordering, exact serialization/safety, empty output, and generic error behavior.
- Existing Grant, Funder, import, and authorization behavior remains covered by the relevant focused checks.

## Worker Evidence

ROLE: BUILD
STATUS: DONE
ARTIFACT: dispatch/workstreams/data-export/tasks/T001-data-export.md
FILES CHANGED: src/lib/export/portfolio-csv.ts; src/lib/queries/portfolio-export.ts; src/app/(authenticated)/(org-required)/export/portfolio/route.ts; src/test/portfolio-export.test.ts; src/test/portfolio-export-route.test.ts; src/test/domain-queries.test.ts; src/test/postgres-domain-isolation.integration.test.ts
CHECKS / EVIDENCE: Node v26.8.1. Focused serializer/query/Route Handler checks passed (32/32). PostgreSQL domain isolation passed with the configured disposable database (25/25), with the admin URL passed to the test process without exposure. Full suite passed with PostgreSQL enabled (289/289 across 44 files). `npm run lint`, `npx tsc --noEmit`, `npm run verify:prisma`, `npm run build`, and `git diff --check` passed. Build recognized dynamic `/export/portfolio`.
FINDINGS / CONCERNS: None. T002 Grants UI/browser surface was not implemented.
