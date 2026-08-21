# Completed

## GF-AUTH-001 — Simplified MVP documentation reconciliation and terminal closure

- Reconciled dispatch authority to simplified Clerk session authentication: session `userId`, active `orgId`, and recognized `orgRole` are authoritative; local User and Organization rows are projections only.
- Removed superseded membership binding, membership-incarnation/fencing, revocation, tenant-lock, persisted-role, reconciliation, audit, compensation, backfill, and contraction claims from current dispatch authority.
- Recorded exactly four supported projection webhooks: user created/updated and organization created/updated. Unsupported membership/deletion events no-op.
- Recorded two migrations and clean fresh PostgreSQL migration evidence.
- Recorded verification: 99 tests passing, 1 PostgreSQL-dependent test skipped, clean lint/TypeScript/build/Prisma validation, and manual Clerk checks for sign-up/first organization, sign-in, protected redirects, projection webhook flow, and sign-out.
- Preserved deferrals for production hardening, standalone audit, and tenant-domain CRUD tests before the first domain slice.
- Final R2 review: **PASS**. GF-AUTH-001 is complete.
- Prisma state recorded without identifiers or secrets: the linked/current verifier configuration is active through ignored environment state; the two approved migrations are present; `npm run verify:prisma` and Prisma validate/status gates are clean.
- Completion receipt: memory save was verified successful (`memory.md` updated); this documentation-only terminal closure is recorded without resetting or deleting dispatch files, per explicit instruction. No code, schema, migration, config, dependency, environment, commit, push, or deploy changes were made.

## Rewrite context/project-brief.md

- Reorganized the canonical product brief into exactly 20 retrieval-friendly sections.
- Preserved product intent, MVP scope, target customers, workflows, lifecycle, historical knowledge, migration, reporting, boundaries, and future direction.
- Added explicit Product Requirements, Current Implementation, Future/Out-of-Scope, unresolved decisions, terminology, and implementation status distinctions.
- Corrected current repository claims: scaffold/design tokens/direct Zod dependency only; no functional product workflows or backend integrations.
- Corrected the specialized-context status to identify existing planning documents rather than calling them uncreated.

## Context consolidation (documenter pass)

- Created `context/index.md` — manifest with default-load policy, task-to-doc map, design authorities, do-not-duplicate rule.
- Created `dispatch/DECISIONS.md` — structured decision log with 5 active records and unresolved-decision links.
- Updated `AGENTS.md` — corrected source-of-truth table (all context docs exist), added selective loading policy, trimmed duplicated token/security/state inventories, updated repository state.
- Updated `context/project-brief.md` — added `context/index.md` and `dispatch/DECISIONS.md` to specialized docs list, cleaned pre-existing user files section.
- Updated `context/architecture.md` — replaced verbose implementation-reality table with brief reference to AGENTS.md, condensed §9 data flow diagrams into a concise summary with cross-references.
- Updated `context/tech-stack.md` — replaced full request-lifecycle diagram with brief cross-reference to architecture.md §9.
- Updated `context/database.md` — replaced current-status table with reference to tech-stack.md and AGENTS.md.
- Updated `context/coding-standards.md` — fixed stale "planned, not yet created" references, removed Prisma singleton code (delegate to database.md), removed duplicated design token tables (reference globals.css), removed duplicated dependencies table (reference tech-stack.md).
- `context/design.md` — reviewed; no changes needed (already well-scoped with proper cross-references).

Final review corrections:
- `AGENTS.md` now treats specialized context files as authoritative and selectively loaded rather than unmanaged.
- `context/coding-standards.md` now aligns Server Component reads with server-owned `src/lib/queries/` modules and uses a neutral planned-status heading.
- `.agents/skills/` was verified present and preserved.

## GF-DATA-001 — Core Persistence Foundation

- Established Prisma 7.9.1 persistence foundation with exact pinned dependencies (`prisma`, `@prisma/client`, `@prisma/adapter-pg` at `7.9.1`), `prisma.config.ts`, `prisma/schema.prisma` (11 models: Organization, User, Membership, Funder, FunderContact, Grant, Document, Activity, Tag, GrantTag, ImportStaging; 3 enums: GrantStatus, MembershipRole, FunderType), `src/lib/prisma.ts` server-only singleton with `PrismaPg` adapter, `.env.example` with placeholder only, and generated client at `src/generated/prisma/`.
- Applied initial migration (`20260810055726_init`) — 306 lines of DDL covering all 11 tables, 3 enums, UUID PKs, native PostgreSQL types (`uuid`, `decimal(12,2)`, `date`, `timestamptz`, `jsonb`), 7 unique constraints, 19 indexes, 20 FKs all with `ON DELETE RESTRICT ON UPDATE NO ACTION`.
- Tier 3 security-critical review completed: **0 critical issues** after fixing C1 (`server-only` dependency installed at `0.0.1`); 2 important process gates remain open (I1: commit all files; I2: document `FunderContact`/`Activity`/`Document` cross-entity org integrity gap in `DECISIONS.md`); 3 minor findings (benign); 2 informational items.
- Committed at revision `0402ada` — atomic commit of all schema, migration, config, singleton, and `.env.example` files.
- Prisma Compute deployed to project `proj_cmsmocbqt146x1adx4q0g77lq`, app `grant-flow`, region `us-east-1`, branch `main`, primary database, production environment — live URL: `https://o1bvekcp5ukh8dg9pnbwd0by.ewr.prisma.build`.
- No credentials or `DATABASE_URL` were persisted in any tracked file. Secrets remain in local `.env` (gitignored).
- Process gate I2 (document the cross-entity org integrity gap in `DECISIONS.md`) is now closed via the `2026-08-13` decision in `dispatch/DECISIONS.md`. Gate I1 (commit all files) is satisfied by the `0402ada` commit. See that decision record for details.
