# GrantFlow — Implementation Roadmap

> **Status:** Planning document. Defines the phased implementation plan, feature inventory, dependency model, MVP boundary, and unresolved decisions.
> **Created:** 2026-08-09
> **Authority:** Product-level roadmap. Implementation details are delegated to feature specs in `context/features/` and technical reference documents in `context/`.

---

## Table of Contents

1. [Current Repository State](#1-current-repository-state)
2. [Product Boundary](#2-product-boundary)
3. [Phase Overview](#3-phase-overview)
4. [Dependency Model](#4-dependency-model)
5. [Phase 0: Platform Foundation](#5-phase-0-platform-foundation)
6. [Phase 1: Core Grant Tracker](#6-phase-1-core-grant-tracker)
7. [Phase 2: Spreadsheet Replacement MVP](#7-phase-2-spreadsheet-replacement-mvp)
8. [Phase 3: Post-MVP Portfolio Insights and Operational Enhancements](#8-phase-3-post-mvp-portfolio-insights-and-operational-enhancements)
9. [Phase 4: Future Consideration](#9-phase-4-future-consideration)
10. [MVP Boundary](#10-mvp-boundary)
11. [Dependency Graph](#11-dependency-graph)
12. [Status Legend and Maintenance Rules](#12-status-legend-and-maintenance-rules)
13. [Pre-Build Decisions](#13-pre-build-decisions)
14. [Unresolved Decisions](#14-unresolved-decisions)
15. [Appendix: Feature Index](#15-appendix-feature-index)

---

## 1. Current Repository State

### What Exists

- **Next.js 16.3.0 scaffold** with React 19.2.8, TypeScript (strict mode), Tailwind CSS v4, ESLint flat config
- **Root layout** (`src/app/layout.tsx`) — Inter font via `next/font`, `h-full` structure, `"GrantFlow"` metadata
- **Design tokens** (`src/app/globals.css`) — Complete light-mode token system: colors, type scale (11px–28px), layout metrics, shadows, motion, badge palettes, sidebar tokens, avatar palette. Mapped through `@theme inline`.
- **Zod** — Installed (^4.4.3) but not wired into any runtime boundary
- **Design references** — 9 PNG screenshots in `screenshots/` (dashboard, grants list, grant detail, funder list, deadlines, login, slide-over panel, landing, index/empty state)
- **Sample data** — `data/mock-grant-data.xlsx` with 66 grant records, 15 columns, 6 status values
- **Project documentation** — `context/` directory (project-brief, architecture, tech-stack, database, coding-standards, design, index) and `dispatch/` workflow files

### What Does Not Exist

- **shadcn/ui** — Not initialized (globals.css is pre-configured)
- **Database / Prisma** — No `prisma/` directory, schema, migrations, or client
- **Clerk authentication** — Not installed or configured
- **Supabase Storage** — Not configured
- **API / Server Actions** — No route handlers or server actions
- **Functional GrantFlow screens** — No routes, components, or layouts beyond the root page and layout
- **Tests** — No test framework, files, or scripts
- **Environment configuration** — No `.env` files or variable validation

---

## 2. Product Boundary

GrantFlow is a **grant portfolio management platform** for nonprofit grant professionals. It manages grant opportunities, funders, documents, activity history, and reporting insights.

### In Scope

- Grant tracking (create, edit, view, lifecycle stage transitions)
- Funder directory and historical relationship tracking
- Portfolio visibility (dashboard with key metrics, deadline views)
- Document organization (upload, categorize, retrieve)
- Activity history and institutional knowledge preservation
- Tag-based grant categorization
- CSV/Spreadsheet data migration from existing spreadsheets
- Multi-tenant organization isolation

### Out of MVP Scope / Deferred to Post-MVP Phases

- Donor CRM capabilities
- Accounting or financial management software
- AI grant writing or AI features
- Generic nonprofit ERP or CRM
- General project management
- Generic file storage platform
- Communications, email marketing, or notifications infrastructure (deferred — see GF-NOTIFY-001, Phase 3)
- Multi-tenant billing or subscription management (deferred — see GF-BILL-001, Phase 4)

---

## 3. Phase Overview

| Phase | Name | Classification | Features | Value Delivery |
|---|---|---|---|---|
| **Phase 0** | Platform Foundation | Prerequisite | GF-AUTH-001, GF-SHELL-001, GF-DATA-001 | Foundation — no user-facing value alone |
| **Phase 1** | Core Grant Tracker | MVP Core | GF-FUNDER-001, GF-GRANT-001, GF-GRANT-002, GF-GRANT-003, GF-ACTIVITY-001, GF-TAG-001 | Centralized grant and funder tracking |
| **Phase 2** | Spreadsheet Replacement MVP | MVP Complete | GF-IMPORT-001, GF-DOCUMENT-001, GF-DEADLINE-001, GF-DASH-001, GF-FUNDER-002 | Replace the spreadsheet |
| **Phase 3** | Post-MVP Insights | Post-MVP | GF-REPORT-001, GF-EXPORT-001, GF-NOTIFY-001, GF-COLLAB-001, GF-DATA-002 | Deeper insights and team workflows |
| **Phase 4** | Future Consideration | Future | GF-INTEGRATE-001, GF-INTEGRATE-002, GF-BILL-001, GF-ANALYTICS-001 | Ecosystem expansion |

---

## 4. Dependency Model

### Phase Prerequisites

Each phase requires that its **Phase 0 prerequisites** be complete. Phase 1 requires Phase 0. Phase 2 requires Phase 0 (and GF-GRANT-001, GF-FUNDER-001 for feature-level dependencies). However, **Phase 2 does not require every Phase 1 feature** — only the feature-level dependencies listed below. Phase 3 requires Phase 0 + Phase 1 features listed below. Phase 4 depends only on Phase 0 foundations for data access and auth.

### Feature-Level Dependencies

Features list their specific dependencies in their individual specs (§14). The following is a consolidated map of cross-feature dependencies:

```
Foundation (Phase 0):
  GF-DATA-001 ──► (none — foundation)
  GF-AUTH-001 ──► GF-DATA-001 (local User/Organization/Membership tables)
  GF-SHELL-001 ──► GF-AUTH-001, GF-DATA-001

Core Tracker (Phase 1):
  GF-FUNDER-001 ──► GF-DATA-001, GF-AUTH-001, GF-SHELL-001
  GF-GRANT-001 ──► GF-DATA-001, GF-AUTH-001, GF-SHELL-001, GF-FUNDER-001
  GF-GRANT-002 ──► GF-GRANT-001, GF-TAG-001, GF-FUNDER-001, GF-SHELL-001
  GF-GRANT-003 ──► GF-GRANT-001, GF-SHELL-001
  GF-TAG-001 ──► GF-DATA-001, GF-AUTH-001, GF-SHELL-001
  GF-ACTIVITY-001 ──► GF-DATA-001, GF-AUTH-001, GF-SHELL-001
  Note: GF-ACTIVITY-001 is a capability contract (Activity table + write pattern). 
  Features that log activity (GF-GRANT-001, GF-DOCUMENT-001, etc.) depend on this contract.
  Activity is not a blanket prerequisite for Phase 2 — it is referenced by features that need it.

Spreadsheet Replacement MVP (Phase 2):
  GF-IMPORT-001 ──► GF-FUNDER-001, GF-GRANT-001, GF-DATA-001
  GF-DOCUMENT-001 ──► GF-GRANT-001, GF-DATA-001
  GF-DEADLINE-001 ──► GF-GRANT-001, GF-DATA-001
  GF-DASH-001 ──► GF-GRANT-001, GF-DATA-001
  GF-FUNDER-002 ──► GF-FUNDER-001, GF-GRANT-001, GF-GRANT-003, GF-DATA-001
  Note: GF-DOCUMENT-001 and GF-DASH-001 optionally use GF-ACTIVITY-001 for logging/feed.
  None of the above depend on GF-TAG-001, GF-GRANT-002, or GF-GRANT-003 
  except GF-FUNDER-002 (drawer integration). Deadlines import reads only deadline field on grants.

Post-MVP (Phase 3):
  GF-REPORT-001 ──► GF-GRANT-001, GF-FUNDER-001, GF-TAG-001, GF-DATA-001
  GF-EXPORT-001 ──► GF-GRANT-002, GF-REPORT-001, GF-SHELL-001
  GF-NOTIFY-001 ──► GF-DEADLINE-001, GF-GRANT-001, GF-AUTH-001
  GF-COLLAB-001 ──► GF-GRANT-001, GF-GRANT-003, GF-NOTIFY-001
  GF-DATA-002 ──► GF-GRANT-001, GF-GRANT-002, GF-ACTIVITY-001, GF-DATA-001

Future (Phase 4):
  GF-INTEGRATE-001 ──► GF-DEADLINE-001, GF-GRANT-001
  GF-INTEGRATE-002 ──► GF-FUNDER-001, GF-GRANT-001
  GF-BILL-001 ──► GF-AUTH-001, GF-SHELL-001, GF-DATA-001
  GF-ANALYTICS-001 ──► GF-DASH-001, GF-REPORT-001, GF-DATA-001

### Soft Dependencies (Recommended Order but Not Required)

Features within the same phase can generally be built in any order respecting the hard dependencies above.

---

## 5. Phase 0: Platform Foundation

**Classification:** Prerequisite — no standalone user-facing value.
**Objective:** Establish the technical foundation that all feature phases depend on: authentication, application shell, database, and deployment infrastructure.

### Features

| ID | Feature | Status |
|---|---|---|
| GF-DATA-001 | Core Persistence Foundation | Complete |
| GF-AUTH-001 | Authentication and Organization Access | In Progress |
| GF-SHELL-001 | Authenticated Application Shell | In Progress |

### User Outcome

No direct user outcome — invisible to end users. Enables all subsequent phases.

### Scope

- Prisma schema definition and PostgreSQL provisioning
- Clerk integration (middleware, sub-layout, sign-in/sign-up pages, webhooks)
- Authenticated app shell (sidebar, topnav, layout shell with organization context)
- Environment configuration and deployment pipeline

### Dependencies

None external. This phase is the foundation.

### Exit Criteria

- Database is provisioned, Prisma client works, schema deployed via migration
- User can sign up, sign in, and access zero or one organization; a first-org creator is `ADMIN`, while invitations are deferred
- Authenticated shell renders with sidebar, topnav, and working navigation
- All Phase 0 features are stable before Phase 1 begins

---

## 6. Phase 1: Core Grant Tracker

**Classification:** MVP Core.
**Objective:** Build the central domain — grants, funders, categorization, and activity history. Users can create, view, and manage grant records and funder information.

### Features

| ID | Feature | Status |
|---|---|---|
| GF-FUNDER-001 | Funder Directory and History | Planned |
| GF-GRANT-001 | Grant Records and Lifecycle | Planned |
| GF-GRANT-002 | Grant List and Portfolio Navigation | Planned |
| GF-GRANT-003 | Grant Detail and Contextual Review | Planned |
| GF-ACTIVITY-001 | Activity History | Planned |
| GF-TAG-001 | Grant Categorization | Planned |

### User Outcome

Grant professionals can create and manage funder records, create and track grant opportunities through lifecycle stages, browse and search their grant portfolio, and view grant details with activity history. Tags enable basic categorization.

### Scope

- Funder CRUD with contact management
- Grant CRUD with lifecycle stage management
- Grant list with search, filter, and sort
- Grant detail via slide-over drawer and full-page route
- Activity timeline attached to grants
- Tag creation, assignment, and filtering

### Dependencies

Phase 0 (GF-DATA-001, GF-AUTH-001, GF-SHELL-001)

### Exit Criteria

- Users can create, edit, view, and delete grant records
- Users can manage funder directory and contacts
- Grant lifecycle stages are fully functional with transitions
- Grant list supports search, filter by status/tag, and sort
- Grant detail is accessible via drawer and full page
- Activity history is recorded and displayed for each grant
- Tags can be created, assigned to grants, and used for filtering

---

## 7. Phase 2: Spreadsheet Replacement MVP

**Classification:** MVP Complete.
**Objective:** Deliver the full spreadsheet replacement — CSV import, document organization, deadline visibility, portfolio dashboard, and funder portfolio view. This phase completes the MVP.

### Features

| ID | Feature | Status |
|---|---|---|
| GF-IMPORT-001 | CSV Migration Workflow | Planned |
| GF-DOCUMENT-001 | Grant Document Organization | Planned |
| GF-DEADLINE-001 | Deadline-Focused Portfolio View | Planned |
| GF-DASH-001 | Portfolio Dashboard | Planned |
| GF-FUNDER-002 | Funder Portfolio and History | Planned |

### User Outcome

Grant professionals can migrate from spreadsheets via CSV import, upload and organize grant documents, view all deadlines in a dedicated view, see portfolio health at a glance on the dashboard, and review funder-specific portfolios. The spreadsheet is fully replaced.

### Scope

- Multi-step CSV import wizard with column mapping and validation
- Document upload, categorization, and retrieval per grant
- Deadline-focused list view sorted by urgency
- Dashboard with portfolio metrics (requested, awarded, pending, success rate, active grants, upcoming deadlines)
- Funder detail page with grant history

### Dependencies

Phase 0 + GF-FUNDER-001, GF-GRANT-001, GF-GRANT-003 (for drawer), GF-DATA-001. See §4 for full feature-level dependency map.

### Exit Criteria

- CSV import processes grants from spreadsheet data successfully
- Documents can be uploaded, categorized, and downloaded per grant
- Deadline view shows all upcoming/overdue deadlines sorted by date
- Dashboard displays all required portfolio metrics
- Funder detail shows complete grant history
- All MVP scope features are implemented and working

---

## 8. Phase 3: Post-MVP Portfolio Insights and Operational Enhancements

**Classification:** Post-MVP.
**Objective:** Enhance portfolio insights, enable data export, add notifications and collaboration, and implement data lifecycle controls.

### Features

| ID | Feature | Status |
|---|---|---|
| GF-REPORT-001 | Extended Portfolio Reporting | Future |
| GF-EXPORT-001 | Data and Report Export | Future |
| GF-NOTIFY-001 | Notifications and Reminders | Future |
| GF-COLLAB-001 | Collaboration Workflows | Future |
| GF-DATA-002 | Data Lifecycle Controls | Future |

### User Outcome

Grant professionals and leadership can generate portfolio reports, export data for external use, receive deadline and activity notifications, collaborate with team members on grants, and manage data retention and archival.

### Scope

- Extended reporting views (funder performance, award trends, status distribution, program area analysis)
- CSV/PDF export for reports and data
- In-app notifications and email reminders for deadlines, stage changes
- Comments, @mentions, shared views, and activity feeds
- Data archival, permanent deletion, and data export/backup workflows

### Dependencies

Phase 0 + feature-level dependencies listed in §4. Individual features may reference Phase 2 features where required.

### Exit Criteria

- Reports are viewable with filtering and date ranges
- Data can be exported to CSV and PDF
- Notifications are delivered for configured events
- Team members can comment on and share grant views
- Data lifecycle controls enable archival and permanent deletion

---

## 9. Phase 4: Future Consideration

**Classification:** Future — no commitment to implement.
**Objective:** Explore ecosystem expansion through calendar integrations, external grant system connections, SaaS billing, and scaled analytics. These features have explicit product decisions pending and are not part of any committed roadmap.

### Features

| ID | Feature | Status |
|---|---|---|
| GF-INTEGRATE-001 | Calendar Integrations | Future |
| GF-INTEGRATE-002 | External Grant-System Integrations | Future |
| GF-BILL-001 | SaaS Billing and Organization Management | Future |
| GF-ANALYTICS-001 | Scaled Analytics Architecture | Future |

### User Outcome

Dependent on feature — not defined as no commitment exists.

### Scope

- Two-way calendar synchronization (Google Calendar, Outlook)
- Integration with grant search databases and government portals
- Multi-tier SaaS pricing, subscription management, billing
- Advanced analytics with materialized views, cached aggregations

### Dependencies

Phase 0 + feature-level dependencies listed in §4. Phase 4 features do not require all Phase 1–3 features.

### Exit Criteria

No exit criteria defined — these are exploration candidates, not committed deliverables.

---

## 10. MVP Boundary

### MVP Definition

Replace the spreadsheet-based grant tracker with a faster, cleaner, more reliable application.

### MVP Scope (Phase 0 + Phase 1 + Phase 2)

| Capability | Included |
|---|---|
| Authentication and organization access | ✅ GF-AUTH-001 |
| Application shell with navigation | ✅ GF-SHELL-001 |
| Database foundation | ✅ GF-DATA-001 |
| Funder directory with contacts | ✅ GF-FUNDER-001 |
| Grant records with lifecycle stages | ✅ GF-GRANT-001 |
| Grant list with search/filter/sort | ✅ GF-GRANT-002 |
| Grant detail (drawer + full page) | ✅ GF-GRANT-003 |
| Activity history | ✅ GF-ACTIVITY-001 |
| Tag-based grant categorization | ✅ GF-TAG-001 |
| CSV import from spreadsheets | ✅ GF-IMPORT-001 |
| Document upload and organization | ✅ GF-DOCUMENT-001 |
| Deadline-focused portfolio view | ✅ GF-DEADLINE-001 |
| Portfolio dashboard with metrics | ✅ GF-DASH-001 |
| Funder portfolio and history (internal view only) | ✅ GF-FUNDER-002 |

### Explicitly Out of MVP Scope

- Extended reporting (GF-REPORT-001)
- Data/report export (GF-EXPORT-001)
- Notifications and reminders (GF-NOTIFY-001)
- Collaboration workflows (GF-COLLAB-001)
- Data lifecycle controls beyond soft delete (GF-DATA-002)
- Calendar integrations (GF-INTEGRATE-001)
- External grant system integrations (GF-INTEGRATE-002)
- SaaS billing (GF-BILL-001)
- Scaled analytics (GF-ANALYTICS-001)
- **External funder accounts, portals, submissions, or funder-facing workflows** — GF-FUNDER-002 (Funder Portfolio and History) is an internal GrantFlow view only. Funders do not log in, manage accounts, or submit applications through GrantFlow.

Additionally, GF-FUNDER-002 (Funder Portfolio and History) is explicitly an **internal GrantFlow view only**. It does not include:
- External funder accounts, portals, or login
- Funder submission workflows
- Funder-facing dashboards or reporting
- Any workflow where a funder interacts with GrantFlow

---

## 11. Dependency Graph

```
                        ┌─────────────────┐
                        │  Phase 0         │
                        │  Foundation      │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │  Phase 1          │
                        │  Core Tracker     │
                        └────────┬─────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
         ┌────────▼─────────┐   │   ┌──────────▼──────────┐
         │  Phase 2         │   │   │  Phase 3            │
         │  MVP Complete    │   │   │  Post-MVP Insights  │
         └────────┬─────────┘   │   └──────────┬──────────┘
                  │             │              │
                  │     ┌───────▼────────┐     │
                  │     │  Phase 4       │     │
                  │     │  Future        │     │
                  │     └────────────────┘     │
                  └─────────────────────────────┘
                         (Phase 3 depends on Phase 2 features
                          per feature-level dependency map in §4;
                          Phase 4 is independent exploration)
```

---

## 12. Status Legend and Maintenance Rules

### Status Values

| Status | Meaning |
|---|---|
| **Planned** | Spec exists, implementation has not started |
| **In Progress** | Implementation is active |
| **Complete** | Feature is implemented, tested, and functional |
| **Deferred** | Deliberately postponed to a later phase |
| **Future** | Under consideration, no commitment to implement |

### Maintenance Rules

1. **Feature status** is updated in the feature spec's metadata header and in this roadmap's feature index.
2. **Feature-level dependencies** (per §4) must be satisfied before a dependent feature begins implementation, rather than requiring all features in a prior phase to be complete.
3. **New features** are added via a documented process: spec → review → approval → inclusion in roadmap.
4. **Feature spec changes** are reflected in `dispatch/DECISIONS.md`.
5. **Roadmap updates** are synchronized with `dispatch/COMPLETED.md` for completed work.
6. **This is a living document** — update as phases progress, decisions are made, or scope changes.

---

## 13. Pre-Build Decisions

The following decisions must be resolved before the corresponding build phase can begin. They are organized by timing category.

### ✅ Resolved — Decisions Locked in This Session

| Gate | Decision | Status |
|---|---|---|
| **Grant semantics** | One Grant = one specific opportunity/application cycle. Repeated annual applications are distinct Grant records associated with the same Funder. No separate Opportunity entity. Year is implicit in deadline/decision dates. | ✅ Resolved |
| **Role model** | Exactly three local roles: `ADMIN`, `MEMBER`, `VIEWER`. Clerk roles map as `org:admin` → `ADMIN`, `org:member` → `MEMBER`, unassigned/default → `VIEWER`. | ✅ Resolved |
| **Identity reconciliation** | Database-backed, idempotent, retry-safe. Webhook upserts by Clerk ID; handles out-of-order events via Clerk retry; duplicate deliveries safe. Local tables are a read-optimized projection behind `src/lib/clerk/` adapter boundary. | ✅ Resolved |
| **Testing framework** | Vitest + React Testing Library for unit/integration; Playwright for E2E. **Not installed.** | ✅ Resolved |
| **Tag taxonomy/cardinality** | Flat, organization-scoped, user-created, reusable, many-to-many with grants. Free-form (no bounded list). No global taxonomy. Colors deferred. | ✅ Resolved |
| **Project brief reconciliation** | All ambiguous grant/tag language resolved in `context/project-brief.md`. | ✅ Resolved |

### Readiness Gates — Must Resolve Before Foundation

| Gate | Decision | Affected Features | Required By |
|---|---|---|---|
| **Lifecycle semantics** | Forward progression is default; regression is allowed but logged. `Closed` is terminal but reopenable. `Declined` may be reopened for re-submission. All transitions log activity. Stage-skip is allowed. | GF-GRANT-001, GF-ACTIVITY-001 | Before GF-GRANT-001 |

### Readiness Gates — Resolve Before Related Feature

| Gate | Decision | Affected Features | Required By |
|---|---|---|---|
| **Drawer route mechanism** | Intercepting routes vs. client-managed drawer state. | GF-GRANT-003 | GF-GRANT-003 implementation |
| **Dashboard metric definitions** | "All time" vs. configurable periods for metric computation. | GF-DASH-001 | GF-DASH-001 implementation |
| **Document storage compensation** | Orphan file handling when storage succeeds but DB write fails. | GF-DOCUMENT-001 | GF-DOCUMENT-001 implementation |
| **Import failure semantics** | Batch rollback vs. row-level error handling. | GF-IMPORT-001 | GF-IMPORT-001 implementation |
| **Responsive breakpoints** | Exact breakpoint values and responsive behavior. | GF-SHELL-001, GF-DASH-001, GF-GRANT-002 | GF-SHELL-001 implementation |
| **Collapsed sidebar width** | 80px (current token) vs. 60px. | GF-SHELL-001 | GF-SHELL-001 implementation |
| **shadcn/ui initialization** | Reconciliation with Tailwind v4, hex tokens, light-only policy. | GF-SHELL-001 | GF-SHELL-001 implementation |
| **Icon convention** | lucide-react finalization alongside shadcn. | GF-SHELL-001 | GF-SHELL-001 implementation |
| **Chart library** | Library (if any) for dashboard charts. Text/table fallback required. | GF-DASH-001 | GF-DASH-001 implementation |

### Production Hardening / Later (No Blocking Required for MVP Development)

| Gate | Decision | Affected Features | Required By |
|---|---|---|---|
| **Logging framework** | Console logging acceptable early; structured logging before production launch. | All features | Before production launch |
| **Lifecycle regression UI** | Exactly which regression transitions should require user confirmation vs. proceed silently. MVP defaults: forward proceeds silently, regression shows brief confirmation. Polish deferred. | GF-GRANT-001, GF-ACTIVITY-001 | GF-GRANT-001 polish |

### First Implementation Target

| Priority | Feature | Rationale |
|---|---|---|
| **1** | **GF-DATA-001 — Core Persistence Foundation** | Every feature depends on the database schema. GF-DATA-001 must be implemented first. All resolved decisions above are reflected in the target data model. See `context/database.md` for the authoritative schema. |

---

## 14. Remaining Open Decisions

The following decisions remain open and should be resolved before or during implementation of the related features. **None of these block GF-DATA-001** — implementation can begin.

| # | Decision | Affected Features | Source | Timing Category |
|---|---|---|---|---|
| 1 | **Lifecycle regression UI.** Exactly which regression transitions should require user confirmation vs. proceed silently. MVP defaults: forward silently, regression with brief confirmation. Polish deferred. | GF-GRANT-001, GF-ACTIVITY-001 | `context/database.md`, `context/project-brief.md` | Production Hardening / Later |
| 2 | **Import failure semantics — batch vs. row-level.** MVP defaults to batch rollback; row-level handling deferred for files >500 rows. | GF-IMPORT-001 | `context/architecture.md` | Resolve Before Related Feature |
| 3 | **Drawer route mechanism.** Intercepting routes vs. client-managed drawer state for grant detail slide-over. | GF-GRANT-003 | `context/architecture.md` | Resolve Before Related Feature |
| 4 | **Dashboard metric definitions.** What period do "Total Requested" and "Total Awarded" cover? MVP defaults to "All time." Configurable date ranges deferred. | GF-DASH-001 | `context/project-brief.md` | Resolve Before Related Feature |
| 5 | **Document storage compensation.** Orphan file handling when Supabase Storage succeeds but DB write fails. MVP may leave orphan files as known gap. | GF-DOCUMENT-001 | `context/architecture.md` | Resolve Before Related Feature |
| 6 | **Responsive breakpoints.** Exact breakpoint values and responsive behavior for sidebar, tables, and layouts. | GF-SHELL-001, GF-DASH-001, GF-GRANT-002 | `context/design.md` | Resolve Before Related Feature |
| 7 | **Collapsed sidebar width.** 80px (current token) vs. 60px (older spec language). | GF-SHELL-001 | `context/design.md` | Resolve Before Related Feature |
| 8 | **Chart library.** What library (if any) for dashboard charts? Must have text/table alternative. | GF-DASH-001 | `context/design.md` | Resolve Before Related Feature |
| 9 | **shadcn/ui initialization.** Reconciliation of generated files with Tailwind v4, hex tokens, light-only policy, and GrantFlow density. | GF-SHELL-001 | `context/design.md` | Resolve Before Related Feature |
| 10 | **Icon convention.** lucide-react is planned but not installed. Finalize alongside shadcn initialization. | GF-SHELL-001 | `context/design.md` | Resolve Before Related Feature |
| 11 | **Logging framework.** Console logging acceptable early; structured logging before production. | All features | `context/architecture.md` | Production Hardening / Later |

---

## 15. Appendix: Feature Index

| ID | Feature | Phase | Status | Roadmap Section |
|---|---|---|---|---|
| GF-AUTH-001 | Authentication and Organization Access | Phase 0 | In Progress | §5 |
| GF-SHELL-001 | Authenticated Application Shell | Phase 0 | In Progress | §5 |
| GF-DATA-001 | Core Persistence Foundation | Phase 0 | Complete | §5 |
| GF-FUNDER-001 | Funder Directory and History | Phase 1 | Planned | §6 |
| GF-GRANT-001 | Grant Records and Lifecycle | Phase 1 | Planned | §6 |
| GF-GRANT-002 | Grant List and Portfolio Navigation | Phase 1 | Planned | §6 |
| GF-GRANT-003 | Grant Detail and Contextual Review | Phase 1 | Planned | §6 |
| GF-ACTIVITY-001 | Activity History | Phase 1 | Planned | §6 |
| GF-TAG-001 | Grant Categorization | Phase 1 | Planned | §6 |
| GF-IMPORT-001 | CSV Migration Workflow | Phase 2 | Planned | §7 |
| GF-DOCUMENT-001 | Grant Document Organization | Phase 2 | Planned | §7 |
| GF-DEADLINE-001 | Deadline-Focused Portfolio View | Phase 2 | Planned | §7 |
| GF-DASH-001 | Portfolio Dashboard | Phase 2 | Planned | §7 |
| GF-FUNDER-002 | Funder Portfolio and History | Phase 2 | Planned | §7 |
| GF-REPORT-001 | Extended Portfolio Reporting | Phase 3 | Future | §8 |
| GF-EXPORT-001 | Data and Report Export | Phase 3 | Future | §8 |
| GF-NOTIFY-001 | Notifications and Reminders | Phase 3 | Future | §8 |
| GF-COLLAB-001 | Collaboration Workflows | Phase 3 | Future | §8 |
| GF-DATA-002 | Data Lifecycle Controls | Phase 3 | Future | §8 |
| GF-INTEGRATE-001 | Calendar Integrations | Phase 4 | Future | §9 |
| GF-INTEGRATE-002 | External Grant-System Integrations | Phase 4 | Future | §9 |
| GF-BILL-001 | SaaS Billing and Organization Management | Phase 4 | Future | §9 |
| GF-ANALYTICS-001 | Scaled Analytics Architecture | Phase 4 | Future | §9 |

---

*End of roadmap. Implementation reality is the authority — verify file contents before acting. This document is updated as phases progress or decisions are made.*
