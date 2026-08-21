# Memory — GF-GRANT-002 Completion
Last updated: 2026-08-21

## What was built

- Simplified Clerk session authentication and organization access are the current authority; local User and Organization rows are webhook-maintained projections.
- The supported projection webhook set is four events: user created/updated and organization created/updated.
- The simplified persistence path has two migrations, with clean fresh PostgreSQL migration evidence. Prisma uses the generated client with the PostgreSQL adapter and a server-only singleton.
- Clerk middleware/provider, sign-in/sign-up pages, the authenticated shell, and the verified projection webhook are implemented.
- GF-TAG-001 organization-scoped grant categorization is complete after independent R1 review PASS, including normalized-name uniqueness, active tag creation/listing, idempotent assignment/removal, and safe scoped display.
- GF-GRANT-002 is complete: `/grants` supports organization-scoped title/funder search, multi-status and multi-tag filtering, sortable columns, 50-row offset pagination, URL-backed state, filter-aware empty states, and preserved create/detail Sheet behavior.

## Decisions made

- Session `userId`, active `orgId`, and recognized `orgRole` are authoritative; no per-request Clerk Backend lookup.
- GF-GRANT-002 uses the architect-approved fixed-size offset-pagination live view: concurrent changes may shift rows between page requests; no snapshot, totals, configurable page size, or page-number jumping was added.
- The later screenshot-aligned UX correction places scoped search in the `/grants` top navigation and exposes status/tag choices through progressive `Add filter` controls with removable chips and `Clear all`.
- Superseded membership binding, membership IDs/fencing, revocation, tenant locks, persisted local roles, reconciliation, audit, compensation, backfill, and contraction claims are not MVP behavior.
- Unsupported membership/deletion webhook events no-op. The simplified two-migration baseline and approved flat, organization-scoped tag model are retained.

## Problems solved

- Final GF-AUTH R2 review and GF-TAG-001 R1 review passed with no Critical or Important findings; remaining findings are Minor and non-blocking.
- GF-GRANT-002 R3 and UX R1 review outcomes are PASS with no Critical or Important findings.
- GF-GRANT-002 validation: full Vitest 157 passed / 28 skipped; disposable PostgreSQL 20 passed; static checks, TypeScript, production build, lint, and diff checks passed.
- Minor non-blocking caveats remain the accepted live-view page shifting under concurrent changes, existing owner-display limitations, and deferred totals/snapshot/configurable pagination and adjacent feature scope.

## Current state

- The current checkout is `feature/gf-grant-002-portfolio-navigation` and retains the completed GF-GRANT-002 implementation and prior completed work as uncommitted work.
- Sensitive connection details remain only in ignored environment state; no IDs, URLs, tokens, credentials, or connection strings are recorded here.
- No deployment, commit, merge, push, or Git-state change was performed during this documentation closure.

## Next session starts with

- Start the next authorized feature from the reset dispatch templates; retain the GF-GRANT-002 implementation, simplified auth baseline, and tag migration.

## Open questions

- Production hardening, standalone audit, and deferred adjacent domain capabilities remain future work.
