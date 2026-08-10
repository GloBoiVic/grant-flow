# Memory — GrantFlow AGENTS.md & Repository Documentation

Last updated: 2026-08-10

## What was built

### Context consolidation (prior session — 2026-08-09)
- `context/index.md` — context manifest with default-load policy, task-to-doc map, design authorities, do-not-duplicate rule
- `dispatch/DECISIONS.md` — structured decision log (D-001 through D-005 initially)
- All context docs deduplicated, cross-referenced, aligned to single-owner boundaries
- `AGENTS.md` corrected with accurate source-of-truth paths and selective-loading policy
- `.agents/skills/` verified present with 6 skill guides

### Roadmap + feature specs (prior session — 2026-08-09)
- `context/roadmap.md` — complete implementation roadmap at the authoritative product-level; 551 lines covering current state, product boundary, 5 phases, dependency model, pre-build decisions, unresolved decisions, and feature index
- **23 feature specification files** across `context/features/` (five directories, one per phase), each with 15 numbered headings plus metadata
- **Phase 0 — Platform Foundation** (3 specs): GF-AUTH-001, GF-SHELL-001, GF-DATA-001
- **Phase 1 — Core Grant Tracker** (6 specs): GF-FUNDER-001, GF-GRANT-001, GF-GRANT-002, GF-GRANT-003, GF-ACTIVITY-001, GF-TAG-001
- **Phase 2 — Spreadsheet Replacement MVP** (5 specs): GF-IMPORT-001, GF-DOCUMENT-001, GF-DEADLINE-001, GF-DASH-001, GF-FUNDER-002
- **Phase 3 — Post-MVP Insights** (5 specs): GF-REPORT-001, GF-EXPORT-001, GF-NOTIFY-001, GF-COLLAB-001, GF-DATA-002
- **Phase 4 — Future Consideration** (4 specs): GF-INTEGRATE-001, GF-INTEGRATE-002, GF-BILL-001, GF-ANALYTICS-001

### Decision log expanded (prior session)
- **D-006** — Grant Semantics: one Grant = one opportunity/application cycle
- **D-007** — Local Role Model: exactly ADMIN, MEMBER, VIEWER
- **D-008** — Identity Reconciliation: Clerk as authority, local tables as idempotent projection
- **D-009** — Testing Stack: Vitest + RTL for unit/integration, Playwright for E2E
- **D-010** — Tag Semantics: flat, org-scoped, user-created, many-to-many via GrantTag

### GF-DATA-001 — Core Persistence Foundation (this session — 2026-08-10)
- **Prisma 7.9.1 persistence foundation** with exact pinned dependencies (`prisma`, `@prisma/client`, `@prisma/adapter-pg` all at `7.9.1`), `prisma.config.ts` with `defineConfig`, `prisma/schema.prisma` (11 models: Organization, User, Membership, Funder, FunderContact, Grant, Document, Activity, Tag, GrantTag, ImportStaging; 3 enums: GrantStatus, MembershipRole, FunderType), `src/lib/prisma.ts` server-only singleton with `PrismaPg` adapter, `.env.example` with placeholder only
- **Initial migration** (`20260810055726_init`) — 306 lines DDL covering all 11 tables, 3 enums, UUID PKs, native PostgreSQL types (`uuid`, `decimal(12,2)`, `date`, `timestamptz`, `jsonb`), 7 unique constraints, 19 indexes, 20 FKs all with `ON DELETE RESTRICT ON UPDATE NO ACTION`
- **Generated client** at `src/generated/prisma/` (importable as `@/generated/prisma/client`)
- **`server-only` package** installed at `0.0.1` to fix C1 (import guard in prisma singleton)
- **Tier 3 security-critical review** completed: 0 critical issues after C1 fix; 2 important process gates remain (I1: ensure all files committed — resolved at `0402ada`; I2: document FunderContact/Acitivity/Document cross-entity org integrity gap in DECISIONS.md — resolved in D-013); 3 minor findings (benign); 2 informational
- **Atomic commit** at `0402ada` — schema, migration, config, singleton, `.env.example`
- **Human follow-up commit** `1835fb0` — added `.prisma/` to `.gitignore`
- **Prisma Compute deployed** — project `proj_cmsmocbqt146x1adx4q0g77lq`, app `grant-flow`, region `us-east-1`, branch `main`, primary database, production environment. Live URL not redacted but connection string kept in local `.env` (gitignored)
- **No credentials or DATABASE_URL persisted** in any tracked file

## Decisions made

### Foundation decisions — locked (see `dispatch/DECISIONS.md`)
- **Grant per application cycle (D-006):** One Grant record = one specific opportunity or cycle. Repeated annual applications are distinct Grant records per funder. No Opportunity/ApplicationCycle entity.
- **Exactly ADMIN/MEMBER/VIEWER (D-007):** Prisma enum on Membership table. Clerk `org:admin` → ADMIN, `org:member` → MEMBER, unassigned → VIEWER.
- **Clerk authority, local projection (D-008):** Clerk is identity provider. Local User/Organization/Membership tables are idempotent projections synced via Svix-verified webhook.
- **Vitest + RTL + Playwright (D-009):** Testing stack decided but not installed.
- **Flat org-scoped user-created tags (D-010):** Free-form, unique per org, many-to-many via GrantTag. Soft-deleted.
- **Prisma Compute as PostgreSQL provider (D-011):** Project `proj_cmsmocbqt146x1adx4q0g77lq` provisioned. Supabase Storage remains a separate later decision.
- **Local Prisma tooling — npm-managed, pinned (D-012):** All Prisma packages pinned to exact `7.9.1`. No global install. Platform/repo CLI boundary documented.
- **FunderContact.organizationId denormalization — application-enforced (D-013):** Denormalized `organizationId` on FunderContact, Activity, and Document. Equality with parent entity's org is enforced at every validated mutation boundary (Zod + application logic), not by database-level constraints.

### Earlier decisions — still active (see `dispatch/DECISIONS.md`)
- **Server-owned query modules (D-004):** UI never imports Prisma. `src/lib/queries/` for reads, co-located actions for mutations.
- **Organization isolation:** Every query filtered by `organizationId` from `auth().orgId`. No client-supplied org identity trusted.
- **No raw SQL by default:** All database access through Prisma ORM. Analytics materialized views are an accepted exception.
- **Design authority:** `src/app/globals.css` (tokens) + `screenshots/` (visual mockups).
- **Document Responsibility Boundaries (D-001):** Each context doc owns one domain; no duplication.
- **Default Load Policy (D-002):** AGENTS.md + project-brief.md only at session start.
- **Repository Reality Overrides Stale Docs (D-005):** Code is ground truth.

### Decisions remaining open (tracked in `dispatch/DECISIONS.md` open-decision links)
- **Drawer route mechanism** — intercepted route vs client-managed drawer state (resolve during grant detail UI)
- **Dashboard period definitions** — metric time windows for summary cards (resolve before GF-DASH-001)
- **Import failure semantics** — batch rollback vs row-level handling (resolve before GF-IMPORT-001)
- **Document orphan handling** — storage/database compensation for orphan files on partial failure (resolve before GF-DOCUMENT-001)
- **Responsive breakpoints** — values not defined yet (resolve before responsive CSS work)
- **Collapsed sidebar width** — 80px (screenshots) vs older 60px (globals.css) (resolve before sidebar component)
- **Chart library** — no library chosen (resolve before dashboard charts)
- **shadcn/ui initialization** — token reconciliation between globals.css @theme inline and shadcn's CSS variables (resolve before first component build)
- **Icon convention** — Lucide expected but not confirmed (resolve before first icon use)
- **Lifecycle regression UI** — display approach for past/terminal grants (resolve during GF-GRANT-001)
- **Logging framework** — not selected (production hardening gate)

## Problems solved

### This session
- **PostgreSQL provider chosen and provisioned:** Prisma Compute selected (D-011), deployed, and verified live.
- **Prisma 7 adapter pattern resolved:** `PrismaPg` adapter from `@prisma/adapter-pg` works with `pg` driver v8.16.3. `prisma.config.ts` uses `defineConfig` with `env("DATABASE_URL")`. Client generated to `src/generated/prisma/`.
- **`server-only` dependency added:** Critical blocker C1 resolved — `import "server-only"` guard in `src/lib/prisma.ts` now has a real dependency backing it.
- **Schema aligned with `context/database.md`:** All 11 models, 3 enums, 7 unique constraints, 19 indexes — verified in review.
- **Cross-entity org integrity gap documented:** D-013 captures the accepted trade-off for denormalized `organizationId` on FunderContact/Activity/Document with mandatory application-level Zod enforcement.
- **Tenant isolation verified:** All 11 tenant-owned tables carry `organizationId` FK with `ON DELETE RESTRICT`. GrantTag inherits through FK parents.

### Prior sessions (still relevant)
- Grant semantics ambiguity resolved: one Grant = one opportunity/cycle.
- Phase dependency model corrected: feature-level dependency maps with explicit contracts.
- Contradictions found and fixed: tag import scope, member deletion behavior, deadline/no-deadline treatment, calendar sync direction, data lifecycle vs append-only history, analytics raw SQL exception.
- Stale roadmap links (26 occurrences) corrected.
- Clerk ID separation: local UUIDs distinct from Clerk provider IDs.
- Server Component Prisma access boundary: UI never imports Prisma.
- Zod installed but not integrated.
- Context docs deduplicated.

## Eureka moments

- **Prisma 7's `prisma.config.ts` decoupling:** The `defineConfig` pattern separates datasource URL config from schema, enabling different configs for dev vs compute without editing the schema. The generator must be `prisma-client` (not `prisma-client-js`).
- **Denormalized `organizationId` as accepted trade-off:** For FunderContact, Activity, and Document, denormalization enables efficient org-scoped queries without joins. Application-level Zod enforcement (not DB triggers) is the compensating control — keeps schema portable and avoids raw SQL.

## Current state

**Persistence foundation complete. Application implementation beginning:**
- `prisma/schema.prisma` — 11 models, 3 enums, fully indexed, with initial migration applied
- `prisma.config.ts` — Prisma 7 config with `defineConfig`
- `src/lib/prisma.ts` — server-only singleton with `PrismaPg` adapter, importable as `@/lib/prisma`
- `.env.example` — template for required env vars (placeholders only)
- `prisma/migrations/20260810055726_init/` — initial migration (306 lines DDL)
- `src/generated/prisma/` — generated client
- Prisma Compute deployed and live (project `proj_cmsmocbqt146x1adx4q0g77lq`)

**Remaining scaffold:**
- Next.js 16.3.0 with React 19.2.8, TypeScript, Tailwind CSS v4 — unchanged from initial scaffold
- Design token system in `globals.css` — light-only, Linear-inspired
- Root layout with Inter font, `h-full` structure
- Default create-next-app `page.tsx` — no GrantFlow screens

**Not yet implemented:**
- No Clerk — not installed or configured
- No Supabase Storage — not configured
- No Server Actions or Route Handlers
- No query modules (`src/lib/queries/`)
- No Zod validation schemas wired to API boundaries
- No test infrastructure (Vitest/RTL/Playwright decided but not installed)
- No shadcn/ui — not initialized
- No icons, charts, Sonner, responsive code, or environment configuration beyond `.env.example`
- No functional GrantFlow screen — dashboard, grants, funders, deadlines, login, detail, etc. all absent

## Next session starts with

**Persistence foundation is built. The next implementation target is GF-AUTH-001 (Clerk Authentication & Identity Sync):**

1. Install and configure Clerk (`@clerk/nextjs`)
2. Set up middleware for route protection
3. Create sign-in and sign-up pages matching the login screenshot
4. Implement webhook handler at `src/app/api/webhooks/clerk/route.ts` for idempotent User/Organization/Membership sync
5. Create Clerk adapter in `src/lib/clerk/`
6. Wire `auth().orgId` into query scope pattern

**Dependencies from GF-DATA-001 that are ready:**
- Organization, User, Membership tables exist in schema and on Prisma Compute
- Prisma client singleton is ready for webhook upserts
- `.env.example` needs `NEXT_PUBLIC_CLERK_*` variables added

**Context docs to load for GF-AUTH-001:**
- `context/architecture.md` (identity reconciliation, data flow)
- `context/database.md` (User/Organization/Membership schema details)
- `dispatch/DECISIONS.md` (D-007 role model, D-008 identity sync rules)
- `.agents/skills/clerk-auth/SKILL.md`

**Pre-build gates already satisfied:** Grant semantics (D-006), role model (D-007), identity reconciliation (D-008), testing stack (D-009), tag semantics (D-010), Prisma Compute provider (D-011), Prisma tooling (D-012), cross-entity org integrity (D-013).

## Open questions

- **shadcn/ui initialization timing** — before or after first screen? (GF-AUTH-001 may not need it, but GF-SHELL-001 will)
- **Sonner toast integration** — needed for mutation feedback, not yet decided
- **Environment variable convention** — `.env.local` vs `.env` for Clerk keys (`.env*` is gitignored, so either works)
- All remaining open decisions from DECISIONS.md (drawer route, dashboard periods, import semantics, etc.) — deferred until their corresponding features begin

## References

- `AGENTS.md` — root operating manual
- `context/project-brief.md` — product authority
- `context/index.md` — context manifest
- `context/roadmap.md` — implementation roadmap with feature index
- `context/features/` — 23 feature specification files across 5 phases
- `context/database.md` — data model and schema blueprint
- `context/architecture.md` — architecture, layers, data flow, scalability
- `context/design.md` — UI/UX design contract
- `context/tech-stack.md` — technology stack documentation
- `context/coding-standards.md` — coding conventions
- `dispatch/DECISIONS.md` — decision log (D-001 through D-013)
- `dispatch/COMPLETED.md` — completed work log
- `src/app/globals.css` — design token authority
- `screenshots/` — visual mockups for all screens
- `.agents/skills/` — six authoritative skill guides
- `prisma/schema.prisma` — database schema (11 models, 3 enums)
- `src/lib/prisma.ts` — Prisma client singleton
