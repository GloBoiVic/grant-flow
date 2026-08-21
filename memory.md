# Memory — GF-TAG-001 Completion

Last updated: 2026-08-21

## What was built

- Simplified Clerk session authentication and organization access are the current authority.
- Local User and Organization rows are webhook-maintained projections only.
- The supported projection webhook set is four events: user created/updated and organization created/updated.
- The simplified persistence path has two migrations, with clean fresh PostgreSQL migration evidence.
- Prisma uses the generated client with the PostgreSQL adapter and a server-only singleton.
- Clerk middleware/provider, sign-in/sign-up pages, the authenticated shell, and the verified projection webhook are implemented.
- A Prisma verification script was added and verified against the linked database configuration; sensitive connection details are not retained here.
- GF-TAG-001 organization-scoped grant categorization is complete after independent R1 review PASS.
- The normalizedName migration is implemented: existing tag names are backfilled, normalized collisions fail safely, and organization-scoped uniqueness is database-enforced.
- Members and admins can create/list active tags and idempotently assign/remove them on active grants; assigned tags appear in the grants list and existing grant-detail Sheet. Scope is Clerk-derived, reads hide cross-org/soft-deleted/malformed associations, and tag operations create no Activity entries.
- Phase 0 documentation is reconciled: DATA, AUTH, and SHELL are complete, and the owned shadcn components are documented.
- Post-closure login fallback sends Clerk SignIn to `/`.
- Grant rows open the existing Sheet by pointer, Enter, or Space while isolating child controls from row activation.

## Decisions made

- Session `userId`, active `orgId`, and recognized `orgRole` are authoritative; no per-request Clerk Backend lookup.
- Superseded membership binding, membership IDs/fencing, revocation, tenant locks, persisted local roles, reconciliation, audit, compensation, backfill, and contraction claims are not MVP behavior.
- Unsupported membership/deletion webhook events no-op.
- The simplified two-migration baseline is retained; the destructive baseline is suitable only for disposable databases.
- GF-TAG-001 retains the approved flat, organization-scoped tag model, soft-deleted-name reservation, and no tag Activity behavior.

## Problems solved

- Final GF-AUTH R2 review passed.
- Final GF-TAG-001 R1 review passed with no Critical or Important findings; remaining findings are Minor and non-blocking.
- Full final gates are clean: the latest validation reported 133 tests passed and 27 skipped, with TypeScript and ESLint clean.
- GF-TAG-001 evidence includes 7/7 tag-specific disposable-PostgreSQL tests passed, clean lint/TypeScript/Prisma validation/build/diff checks, and clean disposable database teardown. The tag DB result is recorded evidence; the independent reviewer did not re-run it because the admin URL was unavailable. The latest full validation is 133 passed / 27 skipped.
- Manual Clerk checks passed for sign-up/first organization, sign-in, protected redirects, projection webhook flow, and sign-out.

## Current state

- The current checkout is the active `feature/gf-tag-001` feature branch and retains GF-TAG-001 plus the Phase 0 documentation reconciliation and post-closure UI/auth fixes as uncommitted work.
- The linked Prisma Postgres configuration is stored only through ignored environment state; no IDs, URLs, tokens, or connection strings are recorded in this memory.
- No deployment, commit, merge, or push was performed; the active checkout contains uncommitted work.
- GF-TAG-001 terminal documentation closure is recorded; no application, schema, migration, Git, database, dependency, or environment changes were made during closure.
- Production hardening, standalone audit, and role-specific domain CRUD UI/actions and tests are deferred until before the first domain slice.
- Explicit GF-TAG-001 deferrals remain tag filtering/search, rename, delete/restore, colors, hierarchy/groups, standalone management, bulk operations, import, analytics/reporting, suggestions/automation, funder-detail display, full grant-detail routing, and tag Activity.

## Next session starts with

- Begin planning GF-GRANT-002, including the deferred tag-filtering/search scope; retain the implemented tag migration and simplified auth baseline.

## Open questions

- When the first domain slice is authorized, complete the deferred production hardening, standalone audit, and tenant/domain CRUD verification.
