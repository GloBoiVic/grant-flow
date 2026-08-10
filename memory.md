# Memory — GrantFlow AGENTS.md & Repository Documentation

Last updated: 2026-08-10

## What was built

### Context consolidation (prior session — 2026-08-09)
- `context/index.md` — context manifest with default-load policy, task-to-doc map, design authorities, do-not-duplicate rule
- `dispatch/DECISIONS.md` — structured decision log (D-001 through D-005 initially)
- All context docs deduplicated, cross-referenced, aligned to single-owner boundaries
- `AGENTS.md` corrected with accurate source-of-truth paths and selective-loading policy
- `.agents/skills/` verified present with 6 skill guides

### Roadmap + feature specs (this session — 2026-08-09)
- `context/roadmap.md` — complete implementation roadmap at the authoritative product-level; 551 lines covering current state, product boundary, 5 phases, dependency model, pre-build decisions, unresolved decisions, and feature index
- **23 feature specification files** across `context/features/` (five directories, one per phase), each with 15 numbered headings plus metadata: summary, problem, target users, requirements, workflows, acceptance criteria, edge cases, data model, permission model, UI specification, error states, performance expectations, dependencies, notes, open questions
- **Phase 0 — Platform Foundation** (3 specs): GF-AUTH-001, GF-SHELL-001, GF-DATA-001
- **Phase 1 — Core Grant Tracker** (6 specs): GF-FUNDER-001, GF-GRANT-001, GF-GRANT-002, GF-GRANT-003, GF-ACTIVITY-001, GF-TAG-001
- **Phase 2 — Spreadsheet Replacement MVP** (5 specs): GF-IMPORT-001, GF-DOCUMENT-001, GF-DEADLINE-001, GF-DASH-001, GF-FUNDER-002
- **Phase 3 — Post-MVP Insights** (5 specs): GF-REPORT-001, GF-EXPORT-001, GF-NOTIFY-001, GF-COLLAB-001, GF-DATA-002
- **Phase 4 — Future Consideration** (4 specs): GF-INTEGRATE-001, GF-INTEGRATE-002, GF-BILL-001, GF-ANALYTICS-001

### Decision log expanded
- **D-006** — Grant Semantics: one Grant = one opportunity/application cycle (no Opportunity entity)
- **D-007** — Local Role Model: exactly ADMIN, MEMBER, VIEWER (Prisma enum, mapped from Clerk)
- **D-008** — Identity Reconciliation: Clerk as authority, local tables as idempotent projection via webhooks
- **D-009** — Testing Stack: Vitest + RTL for unit/integration, Playwright for E2E (decided, not installed)
- **D-010** — Tag Semantics: flat, org-scoped, user-created, many-to-many via GrantTag join table

### Corrections applied to roadmap
- Grant semantics resolved (one Grant per cycle, not multi-cycle entity)
- Phase-wide hard dependencies replaced with feature-level dependency maps
- GF-FUNDER-002 renamed from "Funder-Facing Portfolio View" to "Funder Portfolio and History" (internal-only)
- All 16 decisions categorized into three timing groups (pre-foundation, pre-feature, production-hardening)
- Pre-Build Decisions section added with domain contract, foundation blockers, MVP feature gates, documentation gates
- All 26 stale roadmap links (`../../../` → `../../`; `#13-` → `#14-`) corrected
- 6 contradictions reconciled (tag import scope, member deletion, deadline/no-deadline, calendar sync, data lifecycle vs activity, analytics raw SQL exception)
- MVP scope confirmed and revalidated

### No application code, dependencies, or configuration files were modified

## Decisions made

### Foundation decisions — locked (see `dispatch/DECISIONS.md`)
- **Grant per application cycle (D-006):** One Grant record = one specific opportunity or cycle. Repeated annual applications are distinct Grant records per funder. No Opportunity/ApplicationCycle entity.
- **Exactly ADMIN/MEMBER/VIEWER (D-007):** Prisma enum on Membership table. Clerk `org:admin` → ADMIN, `org:member` → MEMBER, unassigned → VIEWER. Permission matrix in D-007.
- **Clerk authority, local projection (D-008):** Clerk is the identity provider. Local User/Organization/Membership tables are idempotent projections synced via Svix-verified webhook. 7 rules covering verification, upsert, out-of-order events, first-user flow, duplicate delivery.
- **Vitest + RTL + Playwright (D-009):** Testing stack decided but not installed. No test infrastructure exists. Decision locked.
- **Flat org-scoped user-created tags (D-010):** Free-form, unique per org, many-to-many via GrantTag. Colors deferred. Soft-deleted.

### Earlier decisions — still active (see `dispatch/DECISIONS.md`)
- **Server-owned query modules (D-004):** UI never imports Prisma. `src/lib/queries/` for reads, co-located actions for mutations. Documented in `context/architecture.md` and `context/coding-standards.md`.
- **Organization isolation:** Every query filtered by `organizationId` from `auth().orgId`. No client-supplied org identity trusted. (See `context/architecture.md`)
- **No raw SQL by default:** All database access through Prisma ORM. Analytics materialized views are an accepted exception. (See `context/coding-standards.md`)
- **Design authority:** `src/app/globals.css` (tokens) + `screenshots/` (visual mockups). (See `context/design.md`)
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
- Grant semantics ambiguity resolved: one Grant = one opportunity/cycle, not a multi-year entity. All 23 feature specs and roadmap aligned.
- Phase dependency model corrected: no more "Phase N requires all Phase N-1". Feature-level dependency maps with explicit contracts.
- Contradictions found and fixed: tag import scope (excluded from MVP import), member deletion behavior, deadline/no-deadline treatment, calendar sync direction, data lifecycle vs append-only history, analytics raw SQL exception.
- Stale roadmap links (26 occurrences) corrected from wrong relative paths and stale anchor IDs.
- Stale "Funder-Facing Portfolio View" naming corrected to "Funder Portfolio and History" with explicit internal-only scope.
- Pre-build decisions section created: foundation blockers, MVP feature gates, documentation gates ensure no premature implementation.

### Prior sessions (still relevant)
- Clerk ID separation: local UUIDs distinct from Clerk provider IDs.
- Server Component Prisma access boundary: UI never imports Prisma; `src/lib/queries/` module pattern from D-004.
- Zod installed but not integrated — no validation boundaries exist yet.
- Context docs deduplicated: cross-references replaced inline copies of token tables, dependency tables, and implementation-status inventories.

## Eureka moments

(No new eureka moments this session. Prior session insights about Clerk ID separation, server-owned query modules, and document responsibility boundaries remain relevant.)

## Current state

**Documentation complete — all planning artifacts in place:**
- `context/roadmap.md` — implementation roadmap with 5 phases, dependency model, pre-build gates, unresolved decisions
- `context/features/` — 23 feature specs across 5 phase directories
- `dispatch/DECISIONS.md` — 10 active decisions (D-001 through D-010), plus open-decision links
- All `context/` docs consolidated, deduplicated, cross-referenced, single-owner boundaries enforced

**Application implementation: not started.**
- Next.js 16.3.0 scaffold with React 19.2.8, TypeScript, Tailwind CSS v4 — same as initial scaffold
- Design token system in `globals.css` — light-only, Linear-inspired
- Root layout with Inter font, `h-full` structure
- Default create-next-app `page.tsx` — no GrantFlow screens
- **Zod 4.4.3 installed** as direct dependency — not integrated anywhere
- **No Prisma** — no schema, migrations, or client
- **No Clerk** — not installed or configured
- **No Supabase Storage** — not configured
- **No Server Actions or Route Handlers**
- **No test infrastructure** (Vitest/RTL/Playwright decided but not installed)
- **No shadcn/ui** — not initialized
- **No icons, charts, Sonner, responsive code, or environment configuration**
- **No functional GrantFlow screen** — dashboard, grants, funders, deadlines, login, detail, etc. all absent

## Next session starts with

**Documentation-only work is complete. The gate to implementation is open.**

The first implementation target is **GF-DATA-001 (Core Persistence Foundation)**, which requires:

1. **Prisma setup** — `npx prisma init`, schema definition matching `context/database.md`, first migration
2. **PostgreSQL provision** — local or remote database
3. **Environment configuration** — `.env` for `DATABASE_URL`
4. **Prisma Client generation** — `npx prisma generate`

Everything needed to begin is documented:
- Schema: `context/database.md` (entities, fields, relations, indexes, enums)
- Architecture: `context/architecture.md` (layers, boundaries, data flow)
- Decisions: `dispatch/DECISIONS.md` (Grant semantics, roles, identity reconciliation, tags, testing)
- Tech stack: `context/tech-stack.md` (versions, dependency rules)
- Design: `context/design.md` + `globals.css` + `screenshots/` (visual authority)

Pre-build gates already satisfied: Grant semantics (D-006), role model (D-007), identity reconciliation (D-008), testing stack (D-009), tag semantics (D-010). Decisions deferred to later phases (drawer route, dashboard periods, import semantics, etc.) do not block GF-DATA-001.

## Open questions

- PostgreSQL provider choice for development (local install vs Docker vs Prisma Postgres) — resolve before GF-DATA-001
- Prisma schema location convention (single `schema.prisma` vs multi-file) — resolve before GF-DATA-001
- shadcn/ui initialization timing — before or after first screen? (No hard dependency — GF-DATA-001 does not need it)
- All remaining open decisions listed above (drawer route, dashboard periods, import semantics, etc.) — deferred until their corresponding features begin

## References

- `AGENTS.md` — root operating manual
- `context/project-brief.md` — product authority (untracked, pre-existing)
- `context/index.md` — context manifest
- `context/roadmap.md` — implementation roadmap with feature index
- `context/features/` — 23 feature specification files across 5 phases
- `context/database.md` — data model and schema blueprint
- `context/architecture.md` — architecture, layers, data flow, scalability
- `context/design.md` — UI/UX design contract
- `context/tech-stack.md` — technology stack documentation
- `context/coding-standards.md` — coding conventions
- `dispatch/DECISIONS.md` — decision log (D-001 through D-010 + open links)
- `dispatch/COMPLETED.md` — completed work log
- `src/app/globals.css` — design token authority
- `screenshots/` — visual mockups for all screens
- `.agents/skills/` — six authoritative skill guides
