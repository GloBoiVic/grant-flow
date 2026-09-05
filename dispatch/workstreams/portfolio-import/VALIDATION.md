# Portfolio Import Validation

ROLE: VALIDATE
WORKSTREAM: portfolio-import
BRANCH: solo/portfolio-import
TASK: NONE

## Result

**FAIL** — one frozen-contract product defect was reproduced. The remaining checks passed or were limited by the environment.

## Findings

### PRODUCT / DEFECT

- `src/lib/import/portfolio-xlsx.ts:684-699` can classify a non-structural row containing only a formula in a recognized field as structural. An inline XLSX repro with only a formula-bearing `Funder` (and separately only a formula-bearing `Current Status`) returned `{ structural: 1, candidate: 0, invalid: 0 }`. The frozen contract requires formula-bearing recognized values in candidate rows to be visibly invalid, not skipped; this also lets such rows evade the 1,000-candidate bound. Existing formula coverage passes when another recognized value makes the row a candidate, but does not cover this case.

### TOOLING / LIMITATION

- The opt-in PostgreSQL isolation test was skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is unset; database-backed tenant isolation and rollback remain unexecuted.
- `bun run build` was blocked by Turbopack failing to spawn the missing `node` executable while processing `src/app/globals.css`. The webpack build completed successfully.
- `bun run verify:prisma` was blocked by the Bun/tsx runtime error `Cannot find module './cjs/index.cjs'`.
- `bunx --bun prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script --exit-code` was blocked because `prisma.config.ts` has no `datasource.shadowDatabaseUrl`.
- Local Host `/import` redirected to `/login?redirect_url=...`. The login page rendered with no console errors, but no authenticated test session/credentials were available to exercise upload, preview, or confirmation in-browser. A provider click left the local origin for Google, where Local Host operations were correctly denied; the tab was returned to the local login route.

No regression or new-scope finding was identified. The validator changed only this artifact.

## Review and evidence

- Parser/mapping review: fixed `.xlsx` signature/type and 5 MiB checks, deterministic header/sheet selection, amount/date/status/type mappings, source-value preservation, title derivation, duplicate collapse, funder resolution, and domain validation align with the frozen plan apart from the formula-only structural classification above.
- Tenancy/persistence review: authorization precedes reads/parsing; active funders are organization-scoped; confirmation re-parses and re-resolves inside one Prisma transaction; created funders/grants/activities use the authorized organization and user; client preview/IDs are ignored; portfolio paths revalidate only after commit.
- Configuration/migration review: maintained SheetJS CDN dependency, `6mb` Server Action body limit, removed `ImportStaging` model/relation, and forward drop migration were present. Baseline migration was preserved.
- UI review: route replacement, ephemeral file lifecycle, server-produced preview, visible invalid/collapsed decisions, exact acknowledgement gate, completion counts/links, standard labels/buttons, and focus classes were covered by focused UI tests. Authenticated browser acceptance remains the limitation above.

## Checks

- `bun run test:run -- src/test/portfolio-xlsx.test.ts src/test/portfolio-import-actions.test.ts src/test/portfolio-import-ui.test.tsx src/test/portfolio-import-configuration.test.ts src/test/migration-chain.test.ts` — PASS (5 files, 18 tests).
- `bun run test:run` — PASS (30 files, 138 tests; 4 files and 27 tests skipped, including opt-in PostgreSQL coverage).
- `bun run test:run -- src/test/postgres-portfolio-import.integration.test.ts` — SKIPPED (database admin URL unavailable).
- `bunx --bun tsc --noEmit` — PASS.
- `bun run lint` — PASS.
- `bunx --bun prisma validate` — PASS.
- `bunx --bun next build --webpack` — PASS; `/import` emitted as a dynamic route.
- `bun run build` — BLOCKED by environment/Turbopack `node` spawn failure.
- `bun run verify:prisma` — BLOCKED by Bun/tsx `./cjs/index.cjs` resolution failure.
- `git diff --check` — PASS.
