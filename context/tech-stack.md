# GrantFlow — Technology Stack

> **Status:** Active source-of-truth document for the GrantFlow technology stack.
> **Created:** 2026-08-09
> **Authority:** Documents the implemented, planned, absent, and undecided technology decisions for GrantFlow. Product requirements are sourced from `context/project-brief.md`. Code conventions are sourced from `context/coding-standards.md`. Database architecture is sourced from `context/database.md`. Design tokens are sourced from `src/app/globals.css`. Do not duplicate details from those documents — reference them.

---

## 1. Stack Overview

### Status Legend

| Status | Meaning |
|---|---|---|
| ✅ **Implemented** | Installed, configured, and operational in the repository |
| ✅ **Installed** | Installed as a dependency, not yet integrated into runtime validation or API boundaries |
| 🔜 **Planned** | Decision made, not yet installed or implemented |
| ❌ **Absent** | Not planned for MVP |
| ❓ **Undecided** | No decision made yet |

### Summary

| Layer | Technology | Version (resolved) | Status |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.3.0 | ✅ Implemented |
| **UI Library** | React | 19.2.8 | ✅ Implemented |
| **Language** | TypeScript | ~5.9.3 (5.9.3) | ✅ Implemented |
| **Styling** | Tailwind CSS v4 (CSS-first) | ^4.3.3 (4.3.3) | ✅ Implemented |
| **PostCSS Plugin** | @tailwindcss/postcss | ^4.3.3 (4.3.3) | ✅ Implemented |
| **Font** | Inter (via `next/font/google`) | — | ✅ Implemented |
| **Linting** | ESLint (flat config) + eslint-config-next | ^9.39.5 / 16.3.0 | ✅ Implemented |
| **Validation** | Zod | ^4.4.3 (4.4.3) | ✅ Installed |
| **UI Components** | shadcn/ui primitives | — | ✅ Implemented (shell primitives) |
| **Database** | PostgreSQL (Prisma Postgres) | — | ✅ Implemented (linked and migrated) |
| **ORM** | Prisma 7 + @prisma/client + PrismaPg adapter | 7.9.1 | ✅ Implemented |
| **Auth** | Clerk (@clerk/nextjs) | 7.7.4 | ✅ Implemented |
| **File Storage** | Supabase Storage | — | 🔜 Planned (not configured) |
| **Deployment** | Vercel | — | 🔜 Planned (not configured) |
| **Icons** | lucide-react | 1.31.0 | ✅ Installed (shell) |
| **Testing** | Vitest / React Testing Library | — | ✅ Implemented (Playwright remains planned) |
| **State Management** | — | — | ❌ Absent (Server Components + Server Actions + URL params cover MVP) |

---

## 2. Frontend

### Implemented Stack

| Component | Technology | Version | Details |
|---|---|---|---|
| Framework | Next.js (App Router) | `16.3.0` | App Router only (no `pages/` directory). Server Components by default. |
| React | react + react-dom | `19.2.8` | Server Components, concurrent features. |
| TypeScript | typescript | `^5` (resolved `5.9.3`) | Strict mode (`strict: true`). Path alias `@/*` → `./src/*`. |
| CSS / Styling | Tailwind CSS v4 (CSS-first) | `^4` (resolved `4.3.3`) | `@import "tailwindcss"` in `globals.css`. No `tailwind.config.ts`. Tokens in `@theme inline` / `@theme` blocks. |
| PostCSS | @tailwindcss/postcss | `^4` (resolved `4.3.3`) | Tailwind v4 PostCSS plugin. Config in `postcss.config.mjs`. |
| Font | Inter | — | Loaded via `next/font/google` with CSS variable `--font-sans`. |
| Linting | ESLint + eslint-config-next | `^9` (resolved `9.39.5`) / `16.3.0` | Flat config (`eslint.config.mjs`). `core-web-vitals` + `typescript` presets. |
| Validation | Zod | `^4.4.3` (resolved `4.4.3`) | Direct dependency. Used at the organization Server Action and Clerk webhook boundary. See `context/coding-standards.md` §5 and §6. |

### Remaining UI Dependencies / Decisions

| Component | Technology | Notes |
|---|---|---|
| UI Component Library | shadcn/ui | Initialized with owned primitives in `src/components/ui/`; broader product coverage remains planned. |
| Icons | lucide-react | Installed and used by the application shell. |
| Variant Management | class-variance-authority | Installed for owned UI primitives. |
| Class Merging | clsx + tailwind-merge | Installed; `cn()` utility is available in `src/lib/utils.ts`. |
| Animation | tw-animate-css | Installed. |
| Accessible Primitives | @radix-ui/* | Installed primitives currently used by the shell UI. |
| Responsive Breakpoints | — | Open decision. Tailwind v4 defaults (640/768/1024/1280px) are a candidate starting point. See `context/design.md` open decisions. |

### Absent / Deferred

| Technology | Rationale |
|---|---|
| Dark mode | GrantFlow is light-only. No `.dark` blocks in `globals.css`. See `context/design.md` §2. |
| CSS-in-JS / CSS Modules | Tailwind utility classes in JSX + standard CSS for custom styles. |
| State management library (zustand, etc.) | Not needed for MVP. Server Components + Server Actions + URL search params cover state management needs. |

### Architecture References

See `context/coding-standards.md` for:
- Server Component vs Client Component rules (§3)
- Routing patterns, intercepting routes, parallel routes (§4)
- Layout conventions and file organization (§9)
- Naming conventions (§10)
- UI implementation and design tokens (§11)

See `context/design.md` for:
- Visual identity, typography, surfaces, motion (§2)
- Layout system, sidebar, tables, slide-over (§3)
- Component system and shadcn customization (§14)
- Design tokens and anti-patterns (§15–16)

---

## 3. Backend

### Architecture

GrantFlow has **no separate backend server**. All backend logic runs within Next.js:

- **Server Actions** (`"use server"`) — Mutations (create, update, delete). Preferred for UI-triggered operations.
- **Route Handlers** (`src/app/api/**/route.ts`) — Webhooks, external API integrations.
- **Business logic** — Server Actions and shared modules under `src/lib/`.

### Status

| Component | Status | Notes |
|---|---|---|
| Server Actions | ✅ Implemented (foundation) | Organization onboarding action exists; domain actions remain planned. See `context/coding-standards.md` §4. |
| Route Handlers | ✅ Implemented (Clerk webhook) | `src/app/api/webhooks/clerk/route.ts` verifies and processes supported Clerk projection events; domain routes remain planned. |
| Validation (Zod) | ✅ Implemented (foundation) | Zod gates the organization Server Action and Clerk webhook parsing. Future boundaries follow the same `.safeParse()` pattern. See `context/coding-standards.md` §5 and §6. |
| Logging | 🔜 Planned | Not implemented. Console logging acceptable during early development. |
| Error Boundaries | 🔜 Planned | Not implemented. Target: `error.tsx` per route segment as Client Components. |

### Boundaries

- **No direct database access from client components.** All mutations go through Server Actions; reads through Server Components.
- **Server-side authorization in every Server Action.** `orgId` derived from Clerk session (`auth().orgId`), never from client-provided data.
- **Validation on every API boundary.** Zod schemas gate all Server Actions and Route Handlers.

---

## 4. Database

### Technology Decisions

| Decision | Value | Status |
|---|---|---|
| Database System | PostgreSQL (Prisma Postgres) | ✅ Implemented — linked and migrated |
| ORM | Prisma 7 + `@prisma/client` + `@prisma/adapter-pg` | ✅ Implemented — PrismaPg adapter |
| Client Singleton | `src/lib/prisma.ts` (globalThis pattern) | ✅ Implemented |
| Migration Tool | Prisma Migrate (`prisma migrate dev` / `prisma migrate deploy`) | ✅ Implemented |
| ID Strategy | UUID v4 everywhere | Decided (see `context/database.md` §6) |
| Money Storage | `decimal(12,2)` in PostgreSQL | Decided (see `context/database.md` §7) |
| Soft Deletes | `deletedAt` timestamptz (grants, funders, contacts, documents, tags) | Decided (see `context/database.md` §9) |
| Multi-Tenancy | Organization-scoped via `organizationId` on every tenant table | Decided (see `context/database.md` §2) |

### Status Summary

| Component | Status |
|---|---|
| PostgreSQL database | ✅ Linked Prisma Postgres database |
| `prisma/schema.prisma` | ✅ Exists; Prisma 7 client generator |
| `@prisma/client` | ✅ Installed (7.9.1) |
| `prisma/` migrations directory | ✅ Exists; approved migrations present |
| Prisma singleton (`src/lib/prisma.ts`) | ✅ Exists; PrismaPg adapter and `server-only` boundary |
| Database utilities / services | ✅ Persistence and Clerk projection modules exist; domain query/action modules remain planned |

### Database Design Reference

See `context/database.md` for the complete data model and conventions:

- Core domain entities (Organization, User, OnboardingClaim, Funder, FunderContact, Grant, Document, Activity, Tag, GrantTag, ImportStaging) — §2–3
- Grant lifecycle stages (11-value `GrantStatus` enum) — §4, §8
- Relationships and ownership rules — §5
- Multi-tenant organization isolation — §2
- Spending constraints and money precision — §7
- Soft delete policy and rationale — §9
- Document storage and path conventions — §10
- Activity history design — §11
- Tag system design — §12
- Indexes and constraints — §13
- Prisma conventions (naming, field order, required attributes) — §14
- CSV import / data migration design — §15
- Database change rules — §16

---

## 5. Authentication

### Decision

**Clerk** is the project's authentication provider. No custom auth.

### Status

| Component | Status | Notes |
|---|---|---|
| @clerk/nextjs | ✅ Implemented | Installed and used for session auth, organizations, and webhook verification. |
| ClerkProvider | ✅ Implemented | Wraps the authenticated sub-layout, not the root layout. |
| `src/proxy.ts` (`clerkMiddleware`) | ✅ Implemented | Protects routes except public auth and the Clerk webhook endpoint. |
| Sign-in / Sign-up pages | ✅ Implemented | Clerk-native pages exist under `src/app/(public)/`. |
| Webhook handlers | ✅ Implemented | `src/app/api/webhooks/clerk/route.ts` verifies and processes supported user/org projection events. |
| User + Organization sync | ✅ Implemented (projection) | Local `User` and `Organization` rows are maintained by Clerk webhooks; the signed session remains authoritative. |

### Target Architecture

- **Server Components:** `auth()` from `@clerk/nextjs/server` to get `userId`, `orgId`, claims.
- **Organization-scoped data:** All queries filter by `orgId`. Cross-org access prohibited at the query level.
- **Authorization:** Role-based within an organization. Clerk Organizations with custom roles. Server-side authorization in every Server Action.

### Reference

- `context/coding-standards.md` §8 — Authentication and authorization target patterns.
- `.agents/skills/clerk-auth/SKILL.md` — Clerk setup, middleware, organization patterns, sharp edges.

---

## 6. File Storage

### Decision

**Supabase Storage** is the project's file storage provider.

### Status

| Component | Status | Notes |
|---|---|---|
| Supabase Storage bucket | 🔜 Not configured | No bucket created. |
| Upload Server Action | 🔜 Not implemented | Target: validates file type/size, uploads to bucket, creates Document record. |
| supabase-js client (server-side) | 🔜 Not configured | Service-role credentials in server environment variables only. |
| File type / size restrictions | 🔜 Not implemented | Target: allowlist for document types, ~20 MB limit. |
| Virus scanning | 🔜 Deferred | Not in MVP scope. |

### Reference

`context/database.md` §10 — Documents and File Storage (storage path conventions, upload flow, deletion flow).

---

## 7. Deployment

### Decision

**Vercel** is the deployment target.

### Status

| Component | Status | Notes |
|---|---|---|
| Vercel project | 🔜 Not configured | No Vercel project created. |
| vercel.json | 🔜 Not created | Target: config for build settings, rewrites, headers. |
| Environment variables | 🔜 Not configured | `.env.example` contains secret-safe placeholders; runtime values are external/ignored and general env validation is not yet configured. |
| CI/CD pipeline | 🔜 Not configured | Deferred. |
| Production domain | 🔜 Not configured | Deferred. |

### Target Settings (Not Applied)

- Framework preset: Next.js
- Build command: `next build` (default)
- Install command: `npm install` (default)
- Node.js version: 20.x (LTS)
- Environment variables: All secrets managed through Vercel dashboard or Vercel CLI.

---

## 8. Data Flow

The data flow is server-first: Server Components fetch data via Prisma (reads), Server Actions handle mutations, and Route Handlers manage webhooks. The current foundation includes Clerk middleware/provider, the PrismaPg-backed client singleton, organization onboarding, and the Clerk projection webhook. See `context/architecture.md` §9 for the canonical description; domain query and mutation slices remain planned.

---

## 9. Technology Boundaries

### What GrantFlow Builds

- Grant portfolio management UI (dashboard, grants list, grant detail, funder management)
- Document organization and storage (Supabase-backed)
- CSV/Spreadsheet import tooling
- Activity history and timeline
- Tag-based categorization
- Organizational multi-tenancy (Clerk-based)
- Portfolio reporting views (MVP-level)

### What GrantFlow Does Not Build

| Technology | Rationale |
|---|---|
| Donor CRM | Out of scope per product brief. Use dedicated donor management systems. |
| Accounting / billing | GrantFlow tracks grant finances, not organizational accounting. Multi-currency conversion post-MVP. |
| AI grant writing | Deferred. Not in MVP. |
| Event sourcing / CQRS | Deferred. Activity is append-only log, not event sourcing. |
| Custom authentication | Clerk provides all auth. No custom password hashing, session management, or MFA. |
| Custom email / notifications | Deferred. MVP is an in-app experience. |
| Real-time / WebSocket | Not needed for MVP. Polling or stale-while-revalidate covers needs. |
| Mobile native apps | Web-only (responsive). No React Native or Swift/Kotlin apps. |
| Self-hosted / on-premise | SaaS-only via Vercel. |

---

## 10. Dependency Rules

### Installation Policy

1. **No package is installed outside the planned set** without an explicit decision in `dispatch/DECISIONS.md`.
2. **shadcn/ui conventions** are preferred over alternative UI libraries (no Headless UI, no MUI, no Ant Design).
3. **No utility libraries beyond what shadcn/ui provides.** No `lodash`, `ramda`, `date-fns` unless explicitly justified.
4. **No AI/ML packages.** GrantFlow MVP does not include AI features.
5. **No experimental or pre-1.0 packages** unless explicitly decided and justified.
6. **`@types/*` packages** are added as needed for third-party dependencies.

### Currently Installed Dependencies

| Package | Version (spec) | Version (resolved) | Purpose |
|---|---|---|---|
| `next` | `16.3.0` | `16.3.0` | Framework (App Router) |
| `react` | `19.2.8` | `19.2.8` | UI library |
| `react-dom` | `19.2.8` | `19.2.8` | DOM rendering |
| `zod` | `^4.4.3` | `4.4.3` | Runtime validation |
| `@clerk/nextjs` | `^7.7.4` | `7.7.4` | Authentication, organizations, and webhook verification |
| `@prisma/client` | `^7.9.1` | `7.9.1` | Generated Prisma 7 client |
| `@prisma/adapter-pg` | `^7.9.1` | `7.9.1` | PrismaPg PostgreSQL driver adapter |
| `prisma` | `^7.9.1` | `7.9.1` | Schema, generation, and migrations |
| `@tailwindcss/postcss` | `^4` | `4.3.3` | Tailwind CSS v4 PostCSS plugin |
| `tailwindcss` | `^4` | `4.3.3` | Tailwind CSS |
| `typescript` | `^5` | `5.9.3` | TypeScript compiler |
| `eslint` | `^9` | `9.39.5` | Linter |
| `eslint-config-next` | `16.3.0` | `16.3.0` | Next.js ESLint config |
| `lucide-react` | `^1.31.0` | `1.31.0` | Shell icons |
| `class-variance-authority` | `^0.7.1` | `0.7.1` | UI variants |
| `clsx` | `^2.1.1` | `2.1.1` | Class composition |
| `tailwind-merge` | `^3.6.0` | `3.6.0` | Tailwind class merging |
| `tw-animate-css` | `^1.4.0` | `1.4.0` | UI animation utilities |
| `@types/node` | `^20` | — | Node.js types |
| `@types/react` | `^19` | — | React types |
| `@types/react-dom` | `^19` | — | React DOM types |

### Remaining / Planned Dependencies

| Package | Purpose | Installed By |
|---|---|---|
| `@playwright/test` | E2E testing | Planned; Vitest and React Testing Library are installed |

---

## 11. Version and Documentation Discipline

### Version Tracking

- **Framework and runtime versions** are recorded in this document and `context/coding-standards.md` §1.
- **package.json** is the canonical source for version specifiers (`"next": "16.3.0"`).
- **`npm ls`** is the canonical source for resolved versions.
- This document records resolved versions where available for critical infrastructure.

### Documentation Responsibility

| Document | Authority | Maintained By |
|---|---|---|
| `context/tech-stack.md` (this file) | Technology stack decisions | Agent / human |
| `context/coding-standards.md` | Code conventions, patterns, dependency tables | Agent / human |
| `context/database.md` | Data model, schema, persistence rules | Agent / human |
| `context/design.md` | Visual design, tokens, component system | Agent / human |
| `context/project-brief.md` | Product scope, users, MVP goals | Human (untracked) |
| `AGENTS.md` | Agent operating manual, repository state | Agent / human |
| `dispatch/DECISIONS.md` | Architecture decisions, deviations from plan | Agent |
| `src/app/globals.css` | Design tokens (implementation authority) | Agent / human |

### Update Triggers

This file is updated when:
- A new technology layer is implemented (package installed, service provisioned).
- A technology decision changes status (planned → implemented, decided → reconsidered).
- A resolved version changes due to upgrade.
- A dependency is added to or removed from the approved set.

---

## 12. Upgrade Philosophy

### General Approach

- **Prefer LTS and stable channels.** No canary, nightly, or experimental releases for production infrastructure.
- **Stay within Next.js major version.** Minor and patch upgrades are applied as they become available, after verifying compatibility.
- **React upgrades** follow Next.js recommended version. Do not upgrade React independently of Next.js.
- **Tailwind CSS** follows the v4 track. Major version upgrades require explicit evaluation.
- **TypeScript** follows `^5`. Upgrade minor versions after testing strict-mode compatibility.

### Dependency-Specific Policies

| Dependency | Upgrade Policy | Notes |
|---|---|---|
| Next.js | Minor/patch auto-upgrade; major requires explicit decision | Changelog review required for minor bumps |
| React | Follows Next.js required version | Do not upgrade independently |
| TypeScript | Minor versions within `^5` | Strict-mode compatibility check |
| Tailwind CSS | v4 track only | v5 evaluation deferred |
| Zod | Minor/patch auto-upgrade within `^4` | Breaking changes require schema audit |
| Prisma | Minor/patch auto-upgrade; major requires migration plan | Migration compatibility check |
| Clerk | Minor/patch auto-upgrade | Breaking changes require auth flow test |
| shadcn/ui components | Re-install on demand | Components are owned code; upgrade individually |

### Graceful Degradation

- Package upgrades are tested locally before committing.
- Breaking changes in any dependency are documented in `dispatch/DECISIONS.md`.
- Rollback plan: `git revert` + `npm install` with previous version specifier.

---

## 13. Technology Decision Rules

### Rule 1: Decisions Require Written Justification

Every technology choice (addition, replacement, removal) must be documented in `dispatch/DECISIONS.md` with:
- What was decided
- Why (rationale, alternatives considered)
- Impact on existing stack
- Any trade-offs or risks

### Rule 2: Status Is Explicit

Every technology in the stack must have an explicit status in this document:
- ✅ **Implemented** — Code exists in the repository.
- 🔜 **Planned** — Decision made, not yet built.
- ❌ **Absent** — Deliberately excluded.
- ❓ **Undecided** — No decision made.

### Rule 3: Dependencies Must Be Justified

No package enters the `dependencies` or `devDependencies` in `package.json` without:
1. A clear purpose mapping to a product or infrastructure need.
2. An entry in this document's dependency tables.
3. A decision record if it falls outside the planned set.

### Rule 4: Documented Stack Is the Canonical Reference

This document, together with `context/coding-standards.md`, `context/database.md`, and `AGENTS.md`, forms the canonical technology reference. Implementation reality is the authority — if code disagrees with this document, the code wins and this document must be updated.

### Rule 5: No Vendor Lock-In Without Evaluation

Cloud services (Clerk, Supabase, Vercel) are chosen decisions. If any service becomes unsuitable, the migration path and alternatives should be evaluated before commitment. The data model (PostgreSQL + Prisma) is portable as a design principle.

### Rule 6: Performance Budget

- No dependency is added that would meaningfully increase Next.js bundle size without explicit measurement.
- Client bundles must remain lean — Server Components and minimal client boundaries by design.
- Database queries must use `select` (not `include` without restriction) to avoid over-fetching.

### Rule 7: Security Constraints

- Auth is never custom — always Clerk.
- Database credentials are never in client code.
- File uploads are restricted by type and size on the server.
- Environment variable validation is required before production deployment.

---

*End of document. Implementation reality is the authority — verify file contents before acting. This document is updated as technology decisions are implemented or changed.*
