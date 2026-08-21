# GrantFlow — Agent Operating Manual

## Project Identity

GrantFlow is a **grant portfolio management platform** for nonprofit grant professionals who currently rely on disconnected spreadsheets, email inboxes, shared drives, and sticky notes. The MVP goal: **replace the spreadsheet-based grant tracker with a faster, cleaner, more reliable application** — centralized grant tracking, portfolio visibility, document organization, and historical insight.

Nonprofit grant professionals (1–10 per org) are the primary daily users. Fund development directors are leadership users. Users must understand portfolio health, attention items, active opportunities, and approaching deadlines within five seconds of opening the app.

## Product Boundaries

**GrantFlow is a grant portfolio management platform.** It manages grant opportunities, funders, documents, activity history, and reporting insights.

**GrantFlow is not:** a donor CRM, accounting software, an AI grant writer, or a general nonprofit management platform. It does one thing. Full product scope lives in `context/project-brief.md` — that is the authoritative source for product requirements.

## Source-of-Truth Files

| File | Status | Authority |
|---|---|---|
| `AGENTS.md` | ✅ Exists (this file) | Agent operating manual |
| `context/project-brief.md` | ✅ Exists | Product authority |
| `context/architecture.md` | ✅ Exists | System architecture |
| `context/tech-stack.md` | ✅ Exists | Technology decisions |
| `context/database.md` | ✅ Exists | Schema / data model |
| `context/coding-standards.md` | ✅ Exists | Code conventions |
| `context/design.md` | ✅ Exists | Design system details |
| `context/index.md` | ✅ Exists | Context manifest |
| `dispatch/DECISIONS.md` | ✅ Exists | Decision log |
| `src/app/globals.css` | ✅ Exists | Design tokens / theme |

**Repository reality is the implementation authority.** Always verify file contents before acting. Do not assume files exist based on this table.

### Specialized Document Loading Policy

Every session starts with `AGENTS.md` + `context/project-brief.md`. Load additional specialized docs by task type — refer to `context/index.md` for the map. Do not load all context files at once.

## Agent Operating Principles

- **Read first.** Understand what exists before changing anything.
- **Follow the plan.** `dispatch/PLAN.md` is the active instruction set. Do not deviate.
- **One task at a time.** Complete one task before moving to the next.
- **Stay in scope.** Do not modify unrelated files, invent requirements, or add technologies.
- **Report accurately.** Distinguish implemented from planned. Never claim capabilities that are not present.
- **Preserve user changes.** Do not touch deleted or untracked files unless explicitly instructed.
- **Design authority is `globals.css` + screenshots.** Match what exists; do not introduce new design tokens without explicit decision.

## Development Workflow

1. **Understand** — Load AGENTS.md, project brief, PLAN.md, and relevant specialized docs per `context/index.md`.
2. **Inspect** — Verify the actual repository state. Do not assume.
3. **Patterns** — Identify existing conventions in code, naming, and structure.
4. **Affected systems** — Map what files, components, data, or APIs must change.
5. **Plan** — Outline the precise implementation steps. Confirm with human or orchestrator.
6. **Implement** — Write code following existing patterns. One file change at a time.
7. **Test** — No test infrastructure exists yet. Manually verify logic and rendering.
8. **Review diff** — Compare changes against the plan and existing conventions.
9. **Verify regressions** — Check that unrelated functionality still compiles and renders.
10. **Summarize** — Report what was changed, why, and any remaining caveats.

## Context-File Usage

- `context/project-brief.md` — Product scope, users, MVP goals. Read for feature justification.
- All other `context/` files are **authoritative specialized documents**. Load them selectively by task type via `context/index.md`. Do not modify them unless explicitly tasked or required by an approved implementation/documentation change.
- Do not create specialized context files as part of implementation work.
- Do not load all context files at once — refer to `context/index.md` for the selective loading map.

## MVP Discipline

The MVP replaces the spreadsheet-based grant tracker and nothing more. Do not build:

- AI features
- Advanced reporting beyond basic portfolio views
- Donor CRM capabilities
- Accounting integrations
- Multi-tenant billing or org management beyond basic auth isolation

When in doubt, ask: "Does this directly help a grant professional spend less time in spreadsheets?" If not, defer.

## Security & Reliability Expectations

These are **design constraints** for all implementation work. Where noted, foundational pieces are now in place (see Current Repository State); remaining items are not yet built.

- **Auth** — Clerk for authentication. No custom auth.
- **Authorization** — Role-based access within an organization. Users see only their org's data.
- **Organization isolation** — All data scoped by the active organization in the signed Clerk session. Cross-org access prohibited.
- **Validation** — Zod schemas gate every Server Action and Route Handler. Client validation is UX-only.
- **Server/client boundaries** — Server Actions or Route Handlers for mutations. No direct DB access from client.
- **Sensitive data** — No secrets in client code. DB credentials in environment variables only.
- **File uploads** — Supabase Storage. Restrict types and size. Virus scanning deferred.
- **Database access** — Prisma ORM. No raw SQL. Migrations via Prisma Migrate.

## Definition of Done

- Code compiles without TypeScript or ESLint errors.
- Implementation matches the PLAN.md task spec exactly.
- Spec-compliant design (matches `globals.css` tokens and existing screenshots).
- No regressions in existing functionality.
- Diff reviewed and confirmed against plan.
- Changes are scoped — no unintended modifications to unrelated files.

## Documentation Discipline

- Do not create README.md files, design docs, or standalone guides unless explicitly requested.
- Keep `AGENTS.md` updated when project structure changes meaningfully.
- Document architecture decisions in `DECISIONS.md` under `dispatch/`.
- After each session, use `/remember save` to persist state. Reset dispatch working files on successful save.

## Current Repository State

### Implemented
- Next.js 16.3.0 scaffold with React 19.2.8, TypeScript, Tailwind CSS v4
- Inter font via `next/font` with `--font-sans` CSS variable
- Full design token system in `src/app/globals.css` — light-only, Linear-inspired, dense spacing, complete color/badge/typography/shadow variables mapped through `@theme inline`
- Root layout (`layout.tsx`) with Inter integration and basic `h-full` structure
- Default `create-next-app` boilerplate in `page.tsx` (no GrantFlow screens built)
- Design screenshots in `screenshots/` directory (dashboard, grants, funders, deadlines, login, grant detail, slide-over panel, landing, index)
- `data/mock-grant-data.xlsx` — sample spreadsheet data
- Dispatch workflow files under `dispatch/`
- Project documentation files: `context/architecture.md`, `context/tech-stack.md`, `context/database.md`, `context/coding-standards.md`, `context/design.md`, `context/index.md`, `dispatch/DECISIONS.md`
- Prisma 7.9.1 persistence foundation (GF-DATA-001): `prisma/schema.prisma` (11 models, 2 enums), `prisma.config.ts`, two clean migrations including the onboarding claim create lease, server-only singleton `src/lib/prisma.ts` with `PrismaPg` adapter, generated client under `src/generated/prisma/`, `.env.example` placeholder only. Committed at `0402ada`. Prisma Compute deployed.
- Clerk authentication and organization access (GF-AUTH-001, complete): `@clerk/nextjs` installed; `src/proxy.ts` middleware protects all routes except `/login`, `/sign-up`, and `/api/webhooks/clerk`; `ClerkProvider` authenticated sub-layout under `src/app/(authenticated)/`; Clerk-native sign-in/sign-up pages match `screenshots/login.png`; the signed Clerk session's `userId`, active `orgId`, and recognized `orgRole` are authoritative; local `User` and `Organization` rows are webhook-maintained projections. The webhook route is signature-verified and Zod-validated, with exactly four supported idempotent upserts: `user.created`, `user.updated`, `organization.created`, and `organization.updated`. Unsupported membership/deletion events no-op. The authenticated shell (GF-SHELL-001) and simplified persistence foundation (GF-DATA-001) are complete.
- Vitest + React Testing Library test tooling (Phase 0): 99 tests pass and 1 PostgreSQL-dependent test is skipped; lint, TypeScript, build, and Prisma validation are clean, and fresh disposable PostgreSQL migration integration passed.
- `.env.example` — secret-safe placeholders for `DATABASE_URL`, Clerk keys, and webhook signing secret; no credentials committed.

### Not Implemented
- **shadcn/ui** — Initialized as owned generated components via `components.json`: Button, Badge, Sheet, DropdownMenu, Avatar, and Skeleton exist under `src/components/ui/`. This is not a runtime product feature requiring a package.
- **Supabase Storage** — Not configured. File upload infrastructure absent.
- **Server Actions / domain route handlers** — Webhook route handler exists; no domain Server Actions or query modules yet.
- **Functional GrantFlow domain screens** — Dashboard, grants list/detail, funder list, deadlines, search, filter chips, empty states, and domain slide-over panels remain unbuilt; the authenticated shell and auth boundary pages exist.
- **README.md** — Still default `create-next-app` boilerplate. Does not describe GrantFlow.

### Pre-Existing User Changes (Preserved, Not Altered)
- `CLAUDE.md` — Was deleted by user. Do not recreate.

## Design Authority

The visual design is **light mode only, Linear-inspired, dense, and professional**. The authoritative sources are:

1. **`src/app/globals.css`** — Complete design token system (colors, type scale, layout metrics, shadows, motion, badge/avatar/sidebar tokens). All new UI must use these tokens only.
2. **`screenshots/`** — PNG mockups of all screens (dashboard, grants list, grant detail, funder list, deadlines, login, slide-over panel, landing page, index/empty state). Match pixel-for-pixel.

Do not introduce new colors, spacing values, or layout dimensions without an explicit decision captured in `DECISIONS.md`.
Do not duplicate token tables from `globals.css` into other docs — reference the CSS file.
