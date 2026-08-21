# GrantFlow — Project Brief

> Authoritative product context. Maintained alongside `dispatch/` workflow files. Questions about architecture, schema, tech stack, coding conventions, or visual design belong in their respective specialized documents.

---

## 1. Product Identity

- **Product Name:** GrantFlow
- **Product Category:** Grant portfolio management platform
- **One-sentence description:** A centralized platform for nonprofit grant professionals to manage grant opportunities, funders, documents, activity history, and reporting insights — replacing the fragmented spreadsheets, email inboxes, shared drives, calendars, sticky notes, and personal memory that currently make up most organizations' grant tracking workflow.
- **Mission:** Help grant professionals spend less time managing spreadsheets and more time winning funding.
- **Vision:** The single place where a grant professional understands what grants exist, what stage each is in, what needs attention, what funding is expected, what has historically worked, and what opportunities come next.
- **Core Value Proposition:** Centralized grant tracking, portfolio visibility, document organization, and historical insight — delivered in a fast, purpose-built platform that replaces disconnected spreadsheets.

---

## 2. Problem

Nonprofit grant professionals manage their portfolios with disconnected tools:

- Excel spreadsheets
- Email inboxes
- Shared drives
- Calendars
- Sticky notes
- Personal memory

This fragmentation creates operational problems:

- Missed deadlines
- Duplicate work
- Limited visibility into the grant pipeline
- Difficult leadership reporting
- Lost institutional knowledge when staff leave
- No historical insight into grant performance

---

## 3. Target Customers

**Small-to-medium nonprofit organizations** with the following characteristics:

- Approximately 1–10 grant professionals
- Manage multiple grant opportunities annually
- Currently use Excel or spreadsheets as their primary tracker
- Lack dedicated grant management software
- Find existing nonprofit platforms overly complex and misaligned to grant-tracking needs

---

## 4. Users and Their Jobs

**Grant professionals** (primary daily users). They need to track grant opportunities, manage deadlines, store documents, maintain funder history, monitor progress, and prepare reports.

**Fund development directors** (leadership users). They need to understand pipeline health, monitor active opportunities, review funding projections, identify risks, and support strategic decisions.

**Organizational leadership** (future scope). High-level visibility into funding trends, grant performance, portfolio summaries, and reporting insights.

---

## 5. Product Positioning

GrantFlow is a **grant portfolio management platform**. It manages grant opportunities, funders, documents, activity history, and reporting insights.

GrantFlow is **not**:

- A donor CRM
- Accounting software
- An AI grant writer
- A generic nonprofit ERP or CRM
- General project management
- A generic file storage platform
- Unrelated communications or operations tools

---

## 6. Core Product Promise

> Help grant professionals spend less time managing spreadsheets and more time winning funding.

When a grant professional thinks about their organization's grants, GrantFlow should be the single place where they understand: what grants exist, what stage each grant is in, what needs attention, what funding is expected, what has historically worked, and what opportunities exist next.

---

## 7. Core User Experience

Within **five seconds** of opening GrantFlow, a user should understand:

- The health of their grant portfolio
- What requires attention
- What opportunities are active
- What deadlines are approaching

Every screen should feel obvious, fast, clean, organized, and purposeful.

**Product requirements:** Dashboard with portfolio overview (total funding requested/awarded, pending requests, upcoming deadlines, success rate, active grants, recent activity, high-priority items).

**Design references:** Screenshots in `screenshots/` directory serve as the visual authority for all screens (dashboard, grants list, grant detail, funder list, deadlines, login, slide-over panel, landing, index). Visual design is light-mode only, Linear-inspired, dense, and professional. The authoritative token system is `src/app/globals.css`.

**Current implementation:** No functional screens exist. The root layout (`src/app/layout.tsx`) integrates Inter via `next/font` and sets metadata to "GrantFlow". The default page (`src/app/page.tsx`) is create-next-app boilerplate. Design tokens are defined in `globals.css` but no screens reference them.

---

## 8. Core Product Areas

### Dashboard
Central portfolio overview. Required metrics: total funding requested, total funding awarded, pending requests, upcoming deadlines, success rate, active grants, recent activity, high-priority items.

**Current implementation:** Not built.

### Grant Management
The heart of GrantFlow. Users manage grant opportunities with funder information, categorization, ownership, documents, notes, and activity history. Each Grant record represents one specific opportunity or application cycle. Repeated applications to the same funder across years are distinct Grant records linked to that funder.

**Current implementation:** Not built.

### Categorization (Tags)
Grants organized using customizable tags (e.g., Housing, Healthcare, Youth Services, Behavioral Health, Rural Development). Tags are flat, organization-scoped, user-created, and reusable. Tags have a many-to-many relationship with grants. No global taxonomy is imposed; the system does not seed or prescribe tags. Tag colors are a later addition.

**Current implementation:** Not built.

### Funder Management
Institutional knowledge about funders. Tracks funder name, website, contacts, notes, and historical grant activity.

**Unresolved:** Contact data scope — name/email/phone only, or CRM-level relationship history? Multiple contacts per funder?

**Current implementation:** Not built.

### Document Management
Stores grant-related documents: RFPs, grant narratives, budgets, award letters, reports, supporting documentation. Documents categorized by type.

**Unresolved:** Document taxonomy — what are the canonical categories? Single or multiple categories per document? Version tracking? File type restrictions?

**Current implementation:** Not built.

### Reporting & Insights
Transforms grant data into organizational insights. Users analyze funding history, award rates, grant activity, program performance, and funder performance. Reports generated from existing grant data rather than manually recreated in spreadsheets.

**Unresolved:** Reporting depth — summary metrics only, or exportable reports? Scheduled/generated on demand? What date ranges and filters?

**Current implementation:** Not built.

---

## 9. Core Grant Concept

A **grant** in GrantFlow represents a single funding opportunity or application cycle an organization is pursuing or has pursued. Each grant is associated with one funder, moves through lifecycle stages, carries financial amounts (requested/awarded), has assigned owners, and accumulates documents, notes, and activity history. Repeated applications to the same funder across years are distinct Grant records linked to that funder — there is no separate Opportunity or ApplicationCycle entity. The year is implicit in the grant's deadline and decision dates.

**Current implementation:** Not built.

---

## 10. Grant Lifecycle Philosophy

GrantFlow tracks opportunities through eleven lifecycle stages:

```
Research → Qualified → Planning → Writing → Internal Review → Submitted → Pending → Awarded / Declined → Reporting → Closed
```

These stages represent the canonical grant workflow. The product should make stage transitions explicit and visible.

**Unresolved:** Is there a meaningful distinction between Research and Qualified in practice, or do these collapse into a single stage? Should organizations customize the stage list? What happens when a grant moves backward (e.g., awarded grant requires re-submission)?

**Current implementation:** Not built.

---

## 11. Historical Knowledge

GrantFlow preserves institutional knowledge that is currently lost when staff leave. Historical grant data, funder relationships, notes, and outcomes should accumulate and remain searchable. This is a core differentiator from spreadsheet-based tracking.

---

## 12. Data Migration

GrantFlow includes CSV import for organizations with years of grant history in spreadsheets. The import workflow: upload CSV → review data → map columns → remove unnecessary fields → validate → import.

**Unresolved:** How are ambiguous spreadsheet statuses mapped to the canonical lifecycle? What validation rules apply? What happens to unrecognized columns?

**Current implementation:** Not built. Sample spreadsheet data exists at `data/mock-grant-data.xlsx` as a reference.

---

## 13. Reporting Philosophy

Reports should derive from existing grant data, not require manual re-entry. Users should be able to answer questions about funding history, award rates, activity trends, and funder performance without exporting to spreadsheets.

**Unresolved:** Reporting depth and delivery mechanism (in-app dashboards, exports, scheduled emails, PDF generation).

**Current implementation:** Not built.

---

## 14. MVP Definition

Replace the spreadsheet-based grant tracker with a faster, cleaner, more reliable application. MVP scope:

- Grant tracking (create, edit, view, stage transitions)
- Portfolio visibility (dashboard with key metrics)
- Document organization (upload, categorize, retrieve)
- Historical tracking (activity log, search)
- Data migration (CSV import)

**Explicitly out of MVP scope:** Advanced reporting, notifications, calendar integrations, collaboration workflows, external APIs, billing, multi-tenant org management beyond basic auth isolation, AI features, donor CRM capabilities, accounting integrations.

### Confirmed MVP organization access policy

Clerk is the authentication, active-organization, and role authority. Protected requests use the signed Clerk session `userId`, active `orgId`, and recognized `orgRole`; local `User` and `Organization` rows are webhook-maintained projections and domain references, not authorization state. The supported projection webhooks are exactly `user.created`, `user.updated`, `organization.created`, and `organization.updated`; unsupported membership/deletion events no-op. The MVP supports first-organization onboarding and does not expose organization switching or member-management UI.

**Current implementation:** The simplified Clerk-first foundation is complete. Automated verification records 99 passing tests and 1 skipped PostgreSQL-dependent test; fresh disposable PostgreSQL migration integration passed for the two-migration chain and onboarding claim lease. Manual sign-up/first organization creation, sign-in, protected redirects, projection webhook flow, sign-out, and authenticated shell checks passed. GF-AUTH-001, GF-SHELL-001, and GF-DATA-001 are complete.

---

## 15. Product Principles

1. **One thing well.** GrantFlow manages grant portfolios. It does not expand into adjacent problem spaces without explicit decision.
2. **Spreadsheet replacement first.** Every feature must directly help a grant professional spend less time in spreadsheets.
3. **Five-second comprehension.** Portfolio health, attention items, active opportunities, and approaching deadlines must be immediately visible.
4. **Fast and dense.** Information-dense UI with minimal clutter. Linear-inspired design. No unnecessary motion, chrome, or confirmation dialogs.
5. **Data in, data out.** Import existing data. Surface insights derived from that data. Never require manual re-entry.
6. **Institutional memory.** GrantFlow accumulates knowledge. Data persists, is searchable, and survives staff turnover.
7. **Opinionated defaults.** The grant lifecycle, document categories, and tag conventions provide sensible defaults shaped by real usage patterns and data.

---

## 16. Product Boundaries

**GrantFlow manages:** Grant opportunities, funders, documents, activity history, and reporting insights.

**GrantFlow does not manage:** Donor relationships and fundraising campaigns (donor CRM). Budgets, expenses, and financial reporting (accounting). AI-generated grant writing. General nonprofit operations (HR, volunteers, programs, events). General project management. Generic file storage. Communications or email marketing.

Organizations that need a full nonprofit ERP, a donor CRM, or accounting software should use separate, specialized tools alongside GrantFlow.

---

## 17. Future Direction

The following areas are recognized as potential future expansions, not current commitments. Each requires explicit product decisions before implementation.

- **Notifications:** Deadline reminders, stage-change alerts, activity summaries.
- **Calendar integrations:** Two-way sync with Google Calendar, Outlook.
- **Collaboration:** Comments, @mentions, shared views, approval workflows.
- **External APIs:** Integrations with grant search databases, government portals.
- **Billing:** Multi-tier SaaS pricing, org management.
- **Data retention/deletion:** Archival policies, data export, org deletion workflows.
- **Reporting depth:** Scheduled reports, PDF exports, trend analysis.

---

## 18. Product Decision Framework

When faced with ambiguous product requirements, use these questions to guide decisions. Every feature should satisfy — or at minimum not contradict — the core purpose. Defer features that do not clearly support it.

- **Does this directly improve grant portfolio management?** Does it make tracking, organizing, or understanding grants better? If the feature serves a general business need but not grant-specific portfolio management, it is out of scope.
- **Does it reduce spreadsheet/manual work?** Does this directly help a grant professional spend less time in spreadsheets, email, or manual data entry? If not, defer.
- **Does it improve visibility or decision-making?** Does this preserve or enhance five-second portfolio comprehension? If it adds cognitive load without proportional benefit, reconsider.
- **Does it preserve or strengthen institutional knowledge?** Does this accumulate data that survives staff turnover? If it discards data or requires re-entry, redesign.
- **Does it serve the target customer?** Does this solve a real problem for nonprofit grant professionals (primary) or fund development directors (leadership)? Features aimed at tangential audiences (finance, HR, IT) are out of scope.
- **Does it fit the MVP?** Does this belong in the initial spreadsheet-replacement release, or is it a future enhancement? Explicitly out-of-scope items should be deferred without further analysis.
- **Does it introduce unnecessary complexity?** Is this opinionated and default-driven? Avoid configuration-heavy, customizable, or open-ended approaches in the MVP. Prefer sensible defaults shaped by real usage patterns.
- **Does it violate an explicit product boundary?** Does this require a CRM, accounting, AI system, general project management, or other out-of-scope capability? If so, it is out of scope.

---

## 19. Terminology

| Term | Definition |
|---|---|
| **Grant** | A single funding opportunity or application cycle the organization is pursuing or has pursued. Associated with one funder. Repeated applications to the same funder across years are distinct Grant records — the year is implicit in the grant's deadline and decision dates. There is no separate Opportunity or ApplicationCycle entity. |
| **Opportunity** | A grant funding opportunity, whether active (being pursued), won (awarded), or past (closed). Used interchangeably with "grant" in casual usage. In the lifecycle model, an opportunity enters at Research and exits at Closed. |
| **Grant lifecycle** | The full sequence of stages a grant passes through from identification to closure: Research → Qualified → Planning → Writing → Internal Review → Submitted → Pending → Awarded / Declined → Reporting → Closed. The lifecycle is canonical and opinionated within GrantFlow. |
| **Lifecycle stage** | One of the eleven positions in the grant lifecycle (Research through Closed). Stage transitions are explicit and visible. |
| **Award** | A lifecycle stage indicating the funder has approved funding. Carries financial amounts (awarded value) and may begin the Reporting stage. Does not imply final closure of the grant record. |
| **Pending** | A lifecycle stage between submission and decision. The grant has been submitted and the organization is awaiting the funder's response. |
| **Reporting** | A lifecycle stage after Award (or after the reporting period for Declined grants with obligations). The organization is fulfilling funder reporting requirements. |
| **Closed** | The final lifecycle stage. All activity — submission, award/decline, reporting — is complete. The grant record remains in the portfolio for historical reference. |
| **Funder** | An organization that provides grant funding. Tracked with name, website, contacts, notes, and historical grant activity. |
| **Grant professional** | The primary daily user of GrantFlow. Responsible for tracking grant opportunities, managing deadlines, storing documents, maintaining funder history, monitoring progress, and preparing reports. Nonprofit staff with 1–10 peers in their organization. |
| **Grant portfolio** | The complete set of grants an organization manages, past and present. The portfolio encompasses all lifecycle stages, all funders, and all associated documents and activity. |
| **Tag** | A customizable label for categorizing grants (e.g., program area, department). Tags are flat, organization-scoped, user-created, reusable, and have a many-to-many relationship with grants. No global taxonomy is imposed. Supports filtering, search, and reporting. |
| **Activity** | A recorded event on a grant record — stage change, document upload, note added, amount updated, owner assigned. Forms the activity history that accumulates institutional knowledge. |
| **Dashboard** | The home screen providing at-a-glance portfolio health. Required metrics: total funding requested/awarded, pending requests, upcoming deadlines, success rate, active grants, recent activity, high-priority items. |
| **Slide-over panel** | A 480px detail panel that opens from the right side of the screen for viewing/editing records without navigating away. |

---

## 20. Implementation Status

### Implemented

- **Next.js 16.3.0 scaffold** with React 19.2.8, TypeScript, Tailwind CSS v4
- **Root layout** (`src/app/layout.tsx`) — Inter font via `next/font`, `h-full` structure, metadata set to "GrantFlow"
- **Design tokens** (`src/app/globals.css`) — Complete light-mode token system: colors, type scale (11px–28px), layout metrics, shadows, motion, badge palettes, sidebar tokens, avatar palette. Mapped through `@theme inline` for Tailwind utility use
- **Zod** — Used to validate Clerk webhook payloads and onboarding inputs at their server boundaries
- **Design references** — Screenshots in `screenshots/` directory (dashboard, grants, funders, deadlines, login, grant detail, slide-over panel, landing, index)
- **Sample data** — `data/mock-grant-data.xlsx` with example grant records
- **Dispatch workflow files** — `dispatch/PLAN.md`, `dispatch/TASKS.md`, etc.

### Not Implemented

- **shadcn/ui** — Initialized as owned generated components via `components.json`, with Button, Badge, Sheet, DropdownMenu, Avatar, and Skeleton under `src/components/ui/`. This is not a runtime product feature requiring a package.
- **Database / Prisma** — Prisma schema, client, and two migrations are implemented; fresh disposable PostgreSQL migration checks pass.
- **Clerk authentication** — Simplified Clerk authentication and organization access are complete for the MVP foundation; the authenticated application shell and Prisma persistence foundation are also complete.
- **Supabase Storage** — Not configured. No file upload infrastructure.
- **API / Server Actions** — Clerk webhook route handling and the onboarding organization Server Action are implemented; domain query/action modules remain unimplemented. Functional GrantFlow screens are still absent.
- **Functional GrantFlow screens** — No dashboard, grants list, grant detail, funder list, deadlines, search, filter chips, empty states, or slide-over panels exist. `page.tsx` is create-next-app boilerplate.
- **Tests** — Vitest and React Testing Library are installed with focused authentication, projection, onboarding, migration, shell, and tenant-isolation coverage; broader domain coverage remains unimplemented.
- **Environment configuration** — `.env.example` documents the required secret-safe placeholders; runtime environment validation remains unimplemented.
- **Reporting or data export** — No reporting views or export functionality.
- **Collaboration workflows** — No comments, assignments, or shared views.

### Specialized Context Documents (Existing Planning Documents)

The following files exist in `context/` as planning and standards references. They document architectural, technical, and design decisions — they are **not** implemented product functionality. Direct technical questions to the appropriate document:

- `context/index.md` — Context manifest; maps task types to specialized docs
- `context/architecture.md` — System architecture
- `context/tech-stack.md` — Technology decisions
- `context/database.md` — Schema and data model
- `context/coding-standards.md` — Code conventions
- `context/design.md` — Design system details
- `dispatch/DECISIONS.md` — Architecture decision log

### Pre-Existing User Files (Preserved, Not Modified)

- `AGENTS.md` — Agent operating manual
- `CLAUDE.md` — Previously deleted by user; do not recreate
