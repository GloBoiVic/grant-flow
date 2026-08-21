# GrantFlow — Architecture

> **Status:** Architecture blueprint; the Clerk-first authentication/projection foundation is implemented, while domain features remain planned.
> **Created:** 2026-08-09
> **Authority:** Defines where future GrantFlow code belongs, how the Next.js modular monolith boundaries work, and the structural decisions that govern implementation. Technology details are delegated to `context/tech-stack.md`. Code conventions are delegated to `context/coding-standards.md`. Data model details are delegated to `context/database.md`. Visual/UX details are delegated to `context/design.md`. Product requirements are delegated to `context/project-brief.md`.
>
> **Implementation reality is the authority.** This document describes the target architecture. Verify actual file contents before acting.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Architectural Principles](#2-architectural-principles)
3. [Application Layers](#3-application-layers)
4. [Server Actions vs Route Handlers](#4-server-actions-vs-route-handlers)
5. [Server vs Client Components](#5-server-vs-client-components)
6. [Domain Model](#6-domain-model)
7. [Multi-Tenant Architecture](#7-multi-tenant-architecture)
8. [Authentication and Authorization Flow](#8-authentication-and-authorization-flow)
9. [Data Flow](#9-data-flow)
10. [Feature Architecture](#10-feature-architecture)
11. [Cross-Cutting Concerns](#11-cross-cutting-concerns)
12. [Reporting Architecture](#12-reporting-architecture)
13. [CSV Import Architecture](#13-csv-import-architecture)
14. [Error Boundaries](#14-error-boundaries)
15. [Scalability Philosophy](#15-scalability-philosophy)
16. [Architectural Decision Rules](#16-architectural-decision-rules)
17. [Architecture Anti-Patterns](#17-architecture-anti-patterns)

---

## 1. Architecture Overview

### Current Repository Reality

The repository contains the Next.js 16.3.0 App Router scaffold, Prisma persistence foundation, Clerk authentication/organization boundary, design tokens, default boilerplate, and project documentation. Domain features, file storage, and domain actions/queries remain unimplemented. See `AGENTS.md` for the full current-state inventory.

### Target Architecture Summary

GrantFlow is a **Next.js modular monolith** — a single Next.js application deployed on Vercel that serves both frontend and backend responsibilities using the App Router's server capabilities. There is no separate backend service, microservice decomposition, API gateway, or message queue.

### Confirmed Clerk-first organization access boundary

Clerk is the authentication, active-organization, and role authority. Protected requests use the signed Clerk session `userId`, active `orgId`, and recognized `orgRole`; normal requests do not perform a Clerk Backend lookup. Local `User` and `Organization` rows are webhook-maintained projections and domain references, not authorization state. Exactly four projection webhooks are supported: `user.created`, `user.updated`, `organization.created`, and `organization.updated`. Unsupported membership/deletion events no-op. The simplified persistence path has two clean migrations, including the onboarding claim create lease. Final R2 review remains open; terminal GF-AUTH-001 completion is not claimed.

**Key structural choices:**

- **Vertically-sliced features** — Each domain capability (grants, funders, documents, dashboard, reporting, import) is a self-contained vertical slice with its own route, Server Actions, Zod schemas, and components. Shared logic lives in `src/lib/`.
- **Server-first by default** — Database queries execute in Server Components; all mutations use Server Actions; Route Handlers reserved for webhooks and external API integrations.
- **Thin adapter layer** — Clerk and Supabase are accessed through narrow adapters, not scattered throughout the codebase.
- **Prisma as the single data access layer** — No raw SQL, no second ORM, no direct database drivers.

---

## 2. Architectural Principles

### Principle 1: Replace the Spreadsheet

Every architectural decision must answer: "Does this directly help a grant professional spend less time in spreadsheets?" If not, defer or exclude it.

### Principle 2: Server-First by Default

- Components default to Server Components. `"use client"` is an explicit, justified addition.
- Data fetching happens on the server. No client `useEffect` for initial data loading.
- Mutations are Server Actions. No custom API endpoints for CRUD operations.

### Principle 3: Thin Boundaries

- The application has four layers: UI/presentation, application/use-case orchestration, persistence (Prisma), and infrastructure adapters (Clerk, Supabase).
- Layers are thin — no abstraction for the sake of abstraction. A Server Action that calls Prisma directly is preferred over a service layer wrapper until extracted logic is shared across multiple actions.
- Co-location over centralization — feature-specific Server Actions, schemas, and components live with the feature route.

### Principle 4: Organization Isolation at Every Layer

- Every database query filters by `organizationId` derived from the Clerk session.
- No client-supplied organization ID is trusted for authorization.
- This applies to reads, writes, searches, filters, imports, file access, and reporting.

### Principle 5: Validate Before Persist

- Zod schemas gate every Server Action and Route Handler before any database operation.
- Database constraints are a second line of defense.
- Client-side validation is UX-only — never a substitute for server validation.

### Principle 6: Explicit State Design

- Every feature designs loading, empty, error, success, and edge-case states before implementation.
- No feature ships with a blank empty state, a generic error message, or a spinner replacing content.

### Principle 7: MVP Simplicity

- No microservices, queues, event sourcing, distributed caching, WebSockets, analytics warehouses, or complex orchestration unless measured requirements justify them.
- Scaling philosophy is documented in [Section 15](#15-scalability-philosophy).

---

## 3. Application Layers

GrantFlow follows a **thin, layered architecture** within a single Next.js process. Layers are conceptual boundaries enforced by imports and directory structure, not by service boundaries or separate processes.

```
┌─────────────────────────────────────────────────────────────┐
│                   UI / Presentation                          │
│  src/app/ (routes, layouts, pages)                           │
│  src/components/ (feature + shared + shadcn/ui)              │
│  src/hooks/ (client hooks, minimal)                          │
├─────────────────────────────────────────────────────────────┤
│               Application / Use-Case                         │
│  src/app/<feature>/actions.ts    (Server Actions)            │
│  src/lib/validations/            (Zod schemas)               │
│  src/lib/queries/                (Server Component read fns) │
│  src/lib/services/               (extracted shared logic)    │
├─────────────────────────────────────────────────────────────┤
│                   Persistence                                │
│  src/lib/prisma.ts               (Prisma singleton)          │
│  prisma/schema.prisma            (data model)                │
│  prisma/migrations/              (versioned)                 │
├─────────────────────────────────────────────────────────────┤
│            Infrastructure Adapters                            │
│  src/lib/clerk/                  (Clerk helpers)             │
│  src/lib/storage/                (Supabase helpers)          │
│  src/app/api/webhooks/           (external hooks)            │
├─────────────────────────────────────────────────────────────┤
│              Cross-Cutting                                   │
│  src/lib/utils.ts                (cn(), helpers)             │
│  src/types/                      (shared types)              │
│  src/app/error.tsx               (global error UI)           │
│  src/app/loading.tsx             (global loading UI)         │
└─────────────────────────────────────────────────────────────┘
```

### Layer Boundaries

| Layer | Responsibilities | Dependencies |
|---|---|---|
| **UI/Presentation** | Render data, handle user input, define layout, loading/error UI | Components, hooks, types only |
| **Application/Use-Case** | Validate input, authorize, orchestrate business logic, return results | Prisma, Clerk, Zod, types |
| **Persistence** | Type-safe database access, queries, transactions | Prisma client |
| **Infrastructure Adapters** | Auth session helpers, file storage operations, webhook processing | Clerk SDK, Supabase SDK |
| **Cross-Cutting** | Shared utilities, type definitions, error/loading boundaries | — |

### Rules

1. **UI never imports from Persistence directly.** Server Components invoke server-side query functions (`src/lib/queries/`) or Server Actions — they do not import Prisma or the Prisma client. A small direct read is acceptable only if it lives in a server-owned query module, not in a UI component file. Application/use-case layer handles orchestration and may import Prisma.
2. **Application layer never imports UI.** Server Actions return plain data objects, not components.
3. **Adapters are narrow.** Clerk and Supabase SDKs are used only within adapter modules. The rest of the application references these adapters, not the SDKs directly.
4. **No circular imports.** Feature vertical slices should not import from each other. Shared types and utilities live in `src/lib/` or `src/types/`.

---

## 4. Server Actions vs Route Handlers

### Decision Framework

| Criterion | Server Action | Route Handler |
|---|---|---|
| Trigger | User interaction (form submit, button click) | External system (webhook, API call) |
| Return type | Typed response object (`ActionResult<T>`) | `NextResponse.json()` |
| Validation | Zod `.safeParse()` | Zod `.parse()` or `.safeParse()` |
| Cache invalidation | `revalidatePath` / `revalidateTag` | Manual or caller-managed |
| Auth mechanism | `auth()` from `@clerk/nextjs/server` | `auth()` or webhook secret verification |
| File upload support | Direct (file in FormData) | Standard multipart/form-data |
| Third-party integration | Not ideal | Natural endpoint |

### Default: Server Actions

Server Actions are the default for all UI-triggered mutations: create, update, delete grants, funders, contacts, documents, tags; status changes, bulk operations; file uploads; CSV import steps.

### Reserve Route Handlers For

- **Clerk webhooks** — `src/app/api/webhooks/clerk/route.ts` — for the four supported user/org projection upserts
- **External API integrations** — If GrantFlow exposes data to external tools
- **Health checks** — `GET /api/health` — deployment monitoring
- **Any operation triggered by an external system** that cannot use Server Action semantics

### Example Flow: Grant Creation

```
User fills form → Client Component calls Server Action →
  Server Action:
    1. Zod validate input
    2. Auth: get userId, orgId from Clerk session
    3. Authorize: verify role (ADMIN/MEMBER can create)
    4. Prisma: create Grant + Activity entry (in transaction)
    5. Revalidate: revalidatePath('/grants')
    6. Return: { success: true, data: newGrant }
```

---

## 5. Server vs Client Components

### Default: Server Components

All components are Server Components by default. A file gets `"use client"` only when it needs: state and effects (`useState`, `useEffect`, `useRef`), event handlers (`onClick`, `onSubmit`, `onChange`), browser-only APIs, React Context consumers, custom client hooks, or `error.tsx` (must be Client Component).

### Rules

1. **Keep client boundaries small.** Extract only the interactive shell into client components; pass Server Component children via `children` prop.
2. **Prefer URL state over React state.** Filters, search, pagination, and sort order should be encoded in URL search params where possible.
3. **No client-side data fetching for initial page loads.** All initial data is fetched in Server Components. Client components may re-fetch for real-time updates (post-MVP consideration).
4. **No direct database access from Client Components.** Every mutation goes through a Server Action; every initial read happens in a Server Component or server-owned query module. Client Components never import Prisma.

---

## 6. Domain Model

### Core Entities

GrantFlow manages six domain entities, detailed fully in `context/database.md`:

| Entity | Purpose | Tenancy |
|---|---|---|
| **Organization** | Tenant — maps to a Clerk Organization | Root |
| **User** | Person — maps to a Clerk User | Cross-org domain reference |
| **Funder** | Grant-making entity (foundation, corporation, etc.) | Org-scoped |
| **Grant** | One funding opportunity/cycle | Org-scoped |
| **Document** | File metadata pointing to Supabase Storage | Org-scoped |
| **Tag** | Organization-scoped, reusable label | Org-scoped |

### Key Relationships

```
Organization ──1:N──► Funder ──1:N──► Grant ──1:N──► Document
                                          │
                                          └──1:N──► Activity
                                          │
                                          M:N──► Tag
```

Detailed entity schemas, field types, the 11-value `GrantStatus` enum, soft delete policy (`deletedAt` on authoritative records), and relationship ownership rules are in `context/database.md` §§2–9.

### Activity History

A simple append-only chronological log written in the same transaction as the originating mutation. Not event sourcing — no event replay, no state reconstruction. Detailed in `context/database.md` §11.

### Tag System

Flat, organization-scoped labels with many-to-many relationship to grants via `GrantTag`. No hierarchy for MVP. Detailed in `context/database.md` §12.

---

## 7. Multi-Tenant Architecture

### Tenant Model

GrantFlow is multi-tenant SaaS. Each **Organization** is a tenant managed through Clerk Organizations. The active organization and role are read from the signed Clerk session; local identity rows are projections only.

### Data Isolation Strategy

**Every tenant-owned database table has a required `organizationId` column** (`NOT NULL`, foreign key to `Organization`). This applies to Funder, FunderContact, Grant, Document, Activity, Tag, GrantTag (isolated through related entities), and ImportStaging. Join tables do not carry their own `organizationId` — isolation is inherited through their related entities. Queries through join tables must still include an org filter on the related entity side.

### Organization ID Source

The `organizationId` for all queries and mutations is derived from `auth().orgId` (Clerk session). **Never** from client-provided form data, URL parameters, request bodies, or hidden form fields.

### Cross-Org Prohibition

Cross-org access is prohibited at every layer:

| Layer | Enforcement |
|---|---|
| **Database queries** | `WHERE organizationId = ?` on every tenant query |
| **Server Actions** | Org ID from session, not request; role check before mutation |
| **File storage** | Path includes organization ID (`/org_{orgId}/...`) |
| **Reporting** | Reports are scoped to the authenticated org |
| **CSV import** | Staged data is org-scoped |
| **Search/filter** | All filters include org scope |

**Resolved:** The recognized Clerk `orgRole` in the signed session is the authorization input. The Clerk adapter validates the role and enforces it at each protected server boundary; no persisted local role is authoritative.

---

## 8. Authentication and Authorization Flow

### Authentication Provider

**Clerk** is the project's authentication provider. No custom auth. See `context/tech-stack.md` §5 and `.agents/skills/clerk-auth/SKILL.md` for setup details.

### Target Flow

```
1. User visits app → `src/proxy.ts` (`clerkMiddleware`) runs
2. Unauthenticated → redirect to /login (public route group)
3. Authenticated → route continues to protected sub-layout
4. Sub-layout wraps ClerkProvider (not root layout)
5. Server Component uses auth() from @clerk/nextjs/server
6. Server Action calls auth() again at invocation time
```

### Authorization Model

- **Active organization** in the signed Clerk session determines data access. Users see only that organization's data.
- **Role-based access** uses the recognized Clerk `orgRole` from the signed session. Local projections do not grant access and member-management UI is outside this MVP.
- **Server-side authorization in every Server Action** — never rely on client-side checks.

### Webhook-Driven Identity Sync (Resolved)

The webhook handler supports exactly four signed, Zod-validated, idempotent projection upserts: `user.created`, `user.updated`, `organization.created`, and `organization.updated`. Unsupported membership/deletion events no-op. Clerk remains the identity authority; local `User` and `Organization` rows are maintained behind `src/lib/clerk/` for domain references and display data. No application code creates or updates these projections outside the webhook handler.

---

## 9. Data Flow

Data flows follow a server-first pattern. See `context/tech-stack.md` §8 for the request lifecycle diagram. Key principles:

- **Reads:** Server Component → query function (`src/lib/queries/`) → Prisma (filtered by `orgId`, `deletedAt: null`)
- **Mutations:** Client Component → Server Action → Zod validation → auth → Prisma transaction → revalidation
- **File uploads:** Server Action validates file type/size (see `context/coding-standards.md`), uploads to Supabase Storage at `/org_{orgId}/grant_{grantId}/{documentId}_{sanitized-filename}`, creates Document record + Activity entry in a Prisma transaction. **Open decision:** orphan file handling if storage succeeds but DB write fails.
- **Webhooks:** Route Handler (`src/app/api/webhooks/clerk/route.ts`) verifies the signature, validates payloads with Zod, and upserts local User/Organization projections for the four supported events.

---

## 10. Feature Architecture

### Vertical Slice Structure

Each feature is a self-contained vertical slice under `src/app/(authenticated)/`:

| Route | Features |
|---|---|
| `dashboard/` | Portfolio metrics, recent activity, attention items |
| `grants/` | Grant list with search/filter, grant detail page, Server Actions |
| `funders/` | Funder list, funder detail page |
| `deadlines/` | Deadline-focused view |
| `import/` | Multi-step CSV import wizard |
| `settings/` | Org settings |

Each feature directory contains: `page.tsx` (Server Component), `actions.ts` (Server Actions), `components/` (feature-specific UI), `loading.tsx`, `error.tsx`.

### Shared Support Files

```
src/
├── components/
│   ├── ui/             # shadcn/ui primitives (once initialized)
│   ├── layout/         # Sidebar, topnav, app shell
│   └── shared/         # StatusBadge, DeadlineChip, MetricCard, etc.
├── hooks/              # use-media-query, etc.
├── lib/
│   ├── prisma.ts       # Prisma client singleton
│   ├── utils.ts        # cn() and general utilities
│   ├── validations/    # Zod schemas (grant, funder, document, import)
│   ├── queries/        # Server-owned read functions for Server Components
│   ├── services/       # Extracted business logic (grant, funder, document, import)
│   ├── clerk/          # Clerk adapter (auth helpers)
│   └── storage/        # Supabase Storage adapter
└── types/              # Shared types (ActionResult, GrantId, etc.)
```

### File Organization Rules

1. **Co-locate by feature.** Server Actions, validation schemas, and components for a feature live with that feature's route.
2. **Shared logic goes to `src/lib/services/`** only when extracted for reuse across features.
3. **`src/lib/queries/`** holds server-owned read functions imported by Server Components — this is where Prisma imports live for reads, not in page components directly.
4. **`src/types/`** is for types that cross feature boundaries. Feature-specific types stay co-located.
5. **`src/components/shared/`** is for domain components reused across features.
6. **No barrel files** (index.ts re-exports) unless the directory exports more than 5 files and has a clear external API.

### Route Layout / Intercepted Drawers

**Open decision:** The grant detail slide-over (480px) can be implemented as an intercepting route (`src/app/grants/(.)[id]/`) or client-managed drawer state. Resolve during UI implementation and record in `dispatch/DECISIONS.md`.

---

## 11. Cross-Cutting Concerns

### Validation (Zod)

Every Server Action and Route Handler validates input with Zod using `.safeParse()`. Schemas live in `src/lib/validations/` and are co-located with features. See `context/coding-standards.md` §§5–6 for patterns.

### Authorization

`auth()` from Clerk in every Server Component read and Server Action. `organizationId` derived from session, never client-supplied. Role checks at the Server Action level. See `context/coding-standards.md` §8.

### Cache Invalidation

`revalidatePath` for route-based invalidation; `revalidateTag` for tag-based invalidation when data appears on multiple routes. No distributed cache — Next.js built-in caching within a single Vercel deployment.

### Activity Logging

Append-only `Activity` entries for every meaningful mutation, written in the same Prisma transaction. Not event sourcing. See `context/database.md` §11 for action types and query patterns.

### Soft Deletes

Grants, Funders, FunderContacts, Documents, Tags: soft-deleted via `deletedAt`. Activity entries: never deleted. GrantTag (join table): hard-deleted. Standard queries filter `deletedAt: null`. See `context/database.md` §9.

### Audit Trail

The `Activity` table serves as the audit trail (who did what to which entity and when). Post-MVP, a dedicated audit log with before/after snapshots can be added.

### Logging

**Open decision:** No logging framework chosen. Console logging is acceptable during early development. Structured logging (pino, winston) should be selected before production.

### Testing (Implemented Foundation)

The testing stack is **Vitest + React Testing Library** for unit and integration tests; focused authentication, projection, onboarding, migration, shell, and tenant-isolation coverage is installed. **Playwright** remains the planned end-to-end tool for future user flows. This decision is recorded in `dispatch/DECISIONS.md`. Implementation follows the coverage guidelines in `context/coding-standards.md` §12.

---

## 12. Reporting Architecture

### MVP Scope

GrantFlow's MVP reporting is **in-app portfolio visibility**, not a full reporting engine:

- **Dashboard-level aggregates** — Computed in Server Components from existing database queries. Simple `COUNT`, `SUM`, and arithmetic on scoped queries.
- **Portfolio metric cards** — Total requested, total awarded, pending requests, success rate, active grants.
- **Grant list views with filtering** — Search, status filter, tag filter, deadline sort via URL search params.
- **No chart library chosen** — Charts are a presentation concern. If added, they must use accessible HTML/CSS/SVG or a permitted library, with text/table alternatives.

### Reporting Boundaries

| Capability | MVP | Post-MVP |
|---|---|---|
| Portfolio metrics (summaries) | ✅ Server-side queries | Materialized views or caching |
| Filterable grant list | ✅ URL-param-driven | Saved filters, advanced search |
| Status distribution | ✅ Server-side GROUP BY | Interactive charts |
| Funder performance | Basic (award rate per funder) | Full funder analytics |
| Time-series trends | Manual comparison | Automated period-over-period |
| Custom report builder | ❌ Not in MVP | Deferred |
| Export (PDF, CSV) | ❌ Not in MVP | Deferred |

### Technical Approach

All reporting queries are **live queries against PostgreSQL** via Prisma in Server Components. No separate reporting database, ETL pipeline, or analytics service. Aggregate queries use Prisma's `aggregate` and `groupBy`. Indexes on `(organizationId, status)`, `(organizationId, deadline)`, and `(organizationId, createdAt)` support primary queries (see `context/database.md` §13). If performance becomes a concern at scale, consider materialized views — only after measurement proves the need.

---

## 13. CSV Import Architecture

### Overview

CSV import replaces the manual data-entry barrier for organizations migrating from spreadsheets. The full import flow is defined in `context/database.md` §15. This section covers the architectural structure.

### Import Stages

```
Upload CSV → Parse and Validate Structure → Column Mapping (user-guided)
→ Data Review (row preview, validation errors) → Confirm and Commit
→ Summary and Cleanup
```

### Technical Architecture

- **Server Component** (`import/page.tsx`): Multi-step import wizard
- **Server Actions** (`import/actions.ts`): `uploadCSV` (validate, parse, store in ImportStaging), `mapColumns`, `validateImport`, `commitImport` (transactional write: Funder → Grant → Activity)
- **ImportStaging table**: Raw row data as JSONB for error recovery; per-row status through pipeline
- **Duplicate detection**: At validation time, not write time. Query existing grants by org + funder name + title + year. User chooses: skip, update, or import as new.

### Error Handling Strategy

| Failure | Behavior |
|---|---|
| Malformed CSV | File rejected in stage 1 |
| Invalid cell values | Row-level error in stage 4 with original row number |
| Ambiguous status | Flagged for manual selection |
| Database write failure | Transaction rolls back entire batch |
| Partial batch failure | MVP: fail the entire batch. Post-MVP: retry failed rows. |
| Duplicate detection | User decides per match |

**Open decision — import failure semantics:** MVP behavior is batch rollback. May need row-level handling for files >500 rows.

---

## 14. Error Boundaries

### Architecture

Next.js provides built-in error boundary support through `error.tsx` files (Client Components) that catch errors thrown during rendering of Server Components, Client Components, and Server Actions within their route segment.

### Hierarchy

```
src/app/error.tsx                          # Global (entire app)
  └── src/app/(authenticated)/error.tsx    # Auth app shell
        ├── dashboard/error.tsx
        ├── grants/error.tsx
        │     └── grants/[id]/error.tsx
        ├── funders/error.tsx
        ├── deadlines/error.tsx
        ├── import/error.tsx
        └── settings/error.tsx
```

### Handling by Category

- **Validation errors** — Server Action returns `{ success: false, error, errors }`. No error boundary involved.
- **Authorization errors** — Server Action returns `{ success: false, error: "Unauthorized" }`. Route-level `error.tsx` shows "Access denied".
- **Not found** — `notFound()` → `not-found.tsx` or Route Handler 404.
- **Database/storage errors** — Propagates to nearest `error.tsx`. Shows "Something went wrong" with retry.
- **Unexpected errors** — `error.tsx` catches, displays generic message, logs for debugging.

Each `error.tsx` should show a human-readable message, preserve the app shell (sidebar, topnav), provide a recovery action, and not expose technical details.

### Server Action Error Handling

Server Actions use a typed `ActionResult<T>` return type for expected failures:

```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> };
```

Validation, authorization, and not-found failures return typed errors. Throw only for unexpected errors (bugs, DB connection failure) — these propagate to `error.tsx`.

---

## 15. Scalability Philosophy

### MVP Scale

GrantFlow MVP targets organizations with **1–10 grant professionals**. At this scale: single PostgreSQL instance, single Supabase Storage bucket, tens of requests per second, thousands of grant records per org.

| Dimension | MVP Capacity | Bottleneck Before Action |
|---|---|---|
| Organizations | Hundreds | Connection pooling, Vercel plan |
| Users per org | Up to 10 | Clerk free tier limits |
| Grants per org | 10,000+ | Query performance (add indexes) |
| Documents per org | 10,000+ | Supabase Storage pricing |
| Concurrent users | 10–50 per org | Vercel serverless scaling (automatic) |
| Request latency | <200ms P95 | Query optimization, N+1 elimination |

### Excluded Patterns

The following are not part of MVP: microservices, message queues, event sourcing, distributed cache, WebSockets, analytics warehouse, complex orchestration, read replicas, Docker/Kubernetes. These are deferred until measured requirements justify them.

### Growth Path (Post-MVP)

1. **Query performance** — Materialized views for dashboard aggregates, pagination tuning
2. **Caching** — Tag-based Next.js data cache or lightweight Redis for expensive queries
3. **Background jobs** — In-process job queue for import and document operations
4. **Read replicas** — For reporting queries if live queries impact write performance
5. **Decomposition** — Extract reporting or import into a dedicated service only if team size or deployment velocity demands it

---

## 16. Architectural Decision Rules

### Rule 1: Decisions Are Documented

Every architectural decision (technology choice, pattern adoption, deviation) is recorded in `dispatch/DECISIONS.md` with what was decided, why (rationale, alternatives), impact, and trade-offs.

### Rule 2: Server Actions Are the Default for UI Mutations

All UI-triggered mutations use Server Actions. Route Handlers only for webhooks, external integrations, and health checks.

### Rule 3: No Direct Database Access from Client Components

Client Components never import Prisma, execute database queries, or handle database connections. All data access happens in Server Components (via query modules) or Server Actions.

### Rule 4: Organization ID Is Never Client-Supplied

The `organizationId` for all database operations comes from `auth().orgId`. Client-provided IDs are never trusted.

### Rule 5: Validate Before Persist

Every Server Action and Route Handler validates input with Zod before any database operation.

### Rule 6: Co-locate by Feature

Server Actions, validation schemas, and components for a feature live with that feature's route. Only truly shared logic is extracted to `src/lib/`.

### Rule 7: Prisma Is the Single Data Access Layer

All database access uses Prisma's typed client. No raw SQL unless explicitly approved and documented.

### Rule 8: Soft-Deleted Records Are Excluded by Default

Standard queries include `deletedAt: null`. Explicit admin/reporting queries may include soft-deleted records.

### Rule 9: No New Patterns Without Measurement

Complex patterns (distributed caching, message queues, event sourcing, microservices) are excluded until measured requirements prove necessity. Performance budgets in `context/tech-stack.md` §13 (Rule 6).

### Rule 10: Architecture Boundary Diagrams

If the architecture evolves beyond a modular monolith, create a diagram in the relevant decision record and update this document.

### Rule 11: Implementation Reality Is the Authority

If code disagrees with this document, the code wins and this document must be updated.

---

## 17. Architecture Anti-Patterns

The following are **discouraged** unless a measured, documented requirement justifies a deviation.

### 1. Client-Side Data Fetching for Initial Page Loads
❌ `useEffect` + `fetch` in a Client Component for initial data.
✅ Fetch data in Server Components via query modules; pass as props.

### 2. Client-Supplied Organization IDs
❌ Accepting `organizationId` from form data, URL params, or request bodies.
✅ Deriving `orgId` from `auth()` at every read and write boundary.

### 3. Barrel Files and Index Re-exports
❌ `index.ts` re-exports creating circular dependency risk.
✅ Direct imports from source modules. Limited barrels only when >5 exports with a clear API.

### 4. Business Logic in Components
❌ Validating, querying, or orchestrating inside a component file.
✅ Server Actions for mutations, query modules for reads, services for shared logic.

### 5. Over-Abstraction
❌ Service/repository layers, factories, DI containers, hexagonal ports/adapters for an MVP.
✅ Thin Server Actions calling Prisma directly. Extract only when logic is shared.

### 6. Global State for Server Data
❌ `useContext` or state management (zustand, Redux) to cache server data on the client.
✅ Server Components + URL search params + Next.js cache. Client state for UI-only concerns.

### 7. N+1 Queries
❌ Fetching a list, then iterating to fetch related records individually.
✅ Prisma `include` or `select` with nested relations in a single query.

### 8. Throw for Expected Failures
❌ Throwing exceptions for validation, authorization, or not-found conditions.
✅ Returning typed `ActionResult` from Server Actions. `notFound()` for route-level 404s.

### 9. Microservice Decomposition
❌ Splitting into separate services with inter-service HTTP communication.
✅ Single Next.js modular monolith until deployment velocity or team size requires decomposition.

### 10. Over-Engineering Imports
❌ Import with workflow engines, retry queues, or multi-step sagas.
✅ State machine managed in `ImportStaging` table with transactional batch writes.

### 11. Custom Auth
❌ Building password hashing, session management, MFA, or OAuth.
✅ Using Clerk for all authentication. No custom auth code.

### 12. Premature Caching
❌ Adding Redis or cache layers before measuring slow queries.
✅ Starting with live Prisma queries. Adding Next.js data cache when specific pages show measurable latency.

---

## Open Decisions

| Decision | Section | Trigger |
|---|---|---|---|
| Route layout for intercepted drawers | §10 | Grant detail UI implementation |
| Logging framework | §11 | Before production deployment |
| Import failure semantics (batch vs. row-level) | §13 | CSV import implementation |
| Storage/database compensation (orphan files) | §9 | Document upload implementation |
| Collapsed sidebar width | `context/design.md` | Sidebar implementation |
| Chart library | `context/design.md` | Dashboard chart implementation |
| Responsive breakpoints | `context/design.md` | Responsive shell implementation |
| shadcn/ui initialization reconciliation | `context/design.md` | First UI component implementation |
| Icon convention (lucide-react) | `context/design.md` | shadcn initialization |

---

*End of document. Implementation reality is the authority — verify file contents before acting. This document is updated as architectural decisions are made or the repository state changes.*
