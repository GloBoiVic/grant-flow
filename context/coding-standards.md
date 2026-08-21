# GrantFlow — Coding Standards

> **Status:** Active
> **Created:** 2026-08-09
> **Authority:** Code conventions for the GrantFlow Next.js application/repository. Deviations must be captured in `dispatch/DECISIONS.md`.

---

## 1. General Principles

### Repository Reality

- **Framework:** Next.js 16.3.0 (App Router)
- **React:** 19.2.8
- **TypeScript:** ^5, strict mode enabled (`strict: true` in tsconfig.json)
- **Path alias:** `@/*` maps to `./src/*`
- **Styling:** Tailwind CSS v4, CSS-first (`@import "tailwindcss"`), light mode only
- **Font:** Inter via `next/font/google` with CSS variable `--font-sans`
- **Linting:** ESLint 9 flat config (`eslint.config.mjs`) combining `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`

### What Exists Today

- Authenticated application shell with Clerk provider/middleware, responsive navigation, organization onboarding, and placeholder domain routes
- Custom root layout (`src/app/layout.tsx`) with Inter font, `h-full`, `antialiased`; authenticated sub-layout owns the Clerk provider
- Prisma 7 schema, migrations, generated client, and `PrismaPg` adapter singleton in `src/lib/prisma.ts`
- Clerk webhook route with signature verification, Zod parsing, and idempotent User/Organization projection upserts
- Vitest and React Testing Library infrastructure with the current auth, onboarding, projection, shell, and migration tests
- Complete design token system in `src/app/globals.css` (surfaces, brand, tones, status/urgency badges, avatar palette, sidebar tokens, dense type scale, shadows, motion)

### Planned or Not Yet Implemented

- **shadcn/ui** — Initialized with owned shell primitives in `src/components/ui/`; broader product coverage remains planned.
- **Supabase Storage** — Not configured. No file upload infrastructure.
- **Server Actions / Route Handlers** — Organization onboarding and the Clerk webhook are implemented; domain mutations and API endpoints remain planned.
- **Tests** — Vitest and React Testing Library are installed and exercised; Playwright E2E infrastructure remains planned.
- **Environment configuration** — `.env.example` documents secret-safe placeholders; runtime environment values are external/ignored and there is no general environment validation yet.
- **Zod** — Installed. Version ^4.4.3 (resolved 4.4.3).
- **Functional GrantFlow screens** — Auth pages and the application shell exist; domain routes currently remain placeholders rather than complete dashboard, grant, funder, deadline, search, filter, or detail experiences.

### Operating Rules

1. **Read first.** Verify repository reality before acting.
2. **Follow the plan.** `dispatch/PLAN.md` is the active instruction set.
3. **One task at a time.** Complete one task before moving to the next.
4. **Stay in scope.** Do not modify unrelated files, invent requirements, or add technologies.
5. **Report accurately.** Distinguish implemented from planned.
6. **Design authority is `globals.css` + screenshots.** Match existing tokens pixel-for-pixel.
7. **Preserve user changes.** Do not touch deleted or untracked files unless explicitly instructed.
8. **MVP discipline.** GrantFlow replaces the spreadsheet-based grant tracker. If a feature does not directly help a grant professional spend less time in spreadsheets, defer it.

---

## 2. TypeScript

### Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Rules

- **Strict mode is non-negotiable.** All code must compile without errors under `strict: true`.
- **No `any`.** Prefer `unknown` when the type is truly not known, then narrow with type guards. Exception: third-party interop where types are unavailable — document each exception with a comment.
- **Prefer `interface` for public API shapes** (props, function parameters, exported types). Use `type` for unions, intersections, and mapped types.
- **Explicit return types on exported functions.** This ensures the public contract is visible and catches unintended changes.
- **Use `satisfies`** for type-checked values without widening (e.g., `const palette = { ... } satisfies Record<string, string>`).
- **Branded types** for IDs that cross domain boundaries (e.g., `GrantId`, `FunderId`) — only when the DB schema settles.
- **Use `as const`** for literal arrays and objects that must not widen.

### Enums

- Prefer `const` objects with `as const` and `satisfies` over TypeScript `enum`. This produces cleaner runtime code and works with Zod schemas seamlessly.

```typescript
const GrantStatus = {
  Research: "Research",
  Qualified: "Qualified",
  Planning: "Planning",
  Writing: "Writing",
  InternalReview: "Internal Review",
  Submitted: "Submitted",
  Pending: "Pending",
  Awarded: "Awarded",
  Declined: "Declined",
  Reporting: "Reporting",
  Closed: "Closed",
} as const satisfies Record<string, string>;

type GrantStatus = (typeof GrantStatus)[keyof typeof GrantStatus];
```

---

## 3. React

### Version

React 19.2.8 — concurrent features, improved SSR, Server Components.

### Component Types

| Type | `"use client"`? | Use Case |
|---|---|---|
| **Server Component** | No (default) | Data fetching, static rendering, no interactivity |
| **Client Component** | Yes | Interactivity, browser APIs, lifecycle hooks, context consumers |
| **Server Action** | `"use server"` | Mutations (create, update, delete) called from forms or client code |

### Server-First Pattern

- **Default to Server Components.** Only add `"use client"` when the component needs:
  - `useState`, `useReducer`, `useEffect`, `useRef`
  - Event handlers (`onClick`, `onSubmit`, etc.)
  - Browser-only APIs
  - Context consumers (theme, auth, etc.)
  - Custom hooks that require client runtime
- **Keep client boundaries small.** Extract interactive islands into small client wrappers; pass Server Component children via `children` prop to minimize client JavaScript.

### Props

- Use `interface` for props, named with `ComponentNameProps`.
- Destructure props at the function signature.
- Use React 19's `use()` for reading promises in Server Components where appropriate.

```typescript
interface GrantCardProps {
  grant: Grant;
  onSelect?: (id: GrantId) => void;
  className?: string;
}

export default function GrantCard({ grant, onSelect, className }: GrantCardProps) {
  // ...
}
```

### Hooks

- Custom hooks in `src/hooks/`, one file per hook.
- Prefix with `use`.
- Return narrow types — avoid returning entire state objects when callers only need a subset.
- Keep hooks composable: do not mix data fetching, mutation, and UI state in a single hook.

### forwardRef

- Use sparingly. Prefer `asChild` patterns from shadcn/ui (Radix Slot) when passing DOM refs through component boundaries.

---

## 4. Next.js

### App Router (current: v16.3.0)

This project uses the App Router exclusively (no `pages/` directory).

### Routing Patterns

- **Route groups `(group)`** — Use for layout segments without affecting URL path (e.g., `(authenticated)/dashboard`, `(public)/login`).
- **Parallel routes `@slot`** — Reserved for complex layouts where multiple independent sections render on the same route.
- **Intercepting routes `(.)`** — Used for slide-over panels, modals, and detail drilldowns while preserving the underlying route.

### Data Fetching

- **Server Components fetch through query modules.** No `useEffect` for initial data. Pages and components import query functions from `src/lib/queries/` — those modules own Prisma reads. Server Actions handle mutations. Use `fetch` for external API calls only.
- **Revalidation** — Use `revalidatePath` and `revalidateTag` from `next/cache`. Tag-based revalidation is preferred (`fetch(url, { next: { tags: [...] } })`).
- **Loading states** — Use `loading.tsx` files at each route segment.
- **Error states** — Use `error.tsx` files at each route segment (must be a Client Component).

### Server Actions

> **Status: Partially implemented.** Organization onboarding exists; domain Server Actions remain planned. The following is the target pattern.

- Define in a dedicated `actions.ts` (or `actions/`) file co-located with the feature.
- Mark with `"use server"`. Can be a top-level directive in a separate file or inline in a Server Component.
- Validate input with Zod before any database operation.
- Authorize inside the action — never trust the client.
- Return typed response objects, not raw `Response`.
- Call `revalidatePath` / `revalidateTag` after successful mutations.

### Route Handlers

> **Status: Partially implemented.** The Clerk webhook Route Handler exists; domain Route Handlers remain planned.

- Place in `src/app/api/**/route.ts`.
- Use for webhooks, external API integrations, and non-mutation API endpoints.
- Server Actions are preferred for mutations triggered by the UI.

### Layout

- Root layout (`src/app/layout.tsx`) loads Inter via `next/font` and sets `--font-sans`.
- Keep the root layout minimal — no auth providers, no sidebar, no global wrappers beyond font + basic `<html>`/`<body>` structure.
- Auth providers, theme providers, and application shell belong in a sub-layout.

### Static Assets

- Place images, SVGs, and other static files in `public/`.
- Use `next/image` for all images (automatic optimization, responsive sizing, lazy loading).

### Reference

See `.agents/skills/nextjs-core/SKILL.md` for detailed Next.js patterns including Server Actions, data fetching, caching, and routing.

---

## 5. Backend and Business Logic

### Architecture

- **No separate backend server.** Next.js (Server Actions + Route Handlers) handles all backend logic.
- **Business logic lives in Server Actions and shared utility modules** under `src/lib/`.
- **No direct database access from client components.** All mutations go through Server Actions; all data reads go through Server Components.

### Current and planned layering

```
src/
  app/
    grants/              # Route-based feature modules
      page.tsx           # Server Component — fetches and renders
      actions.ts         # Server Actions — mutations for this feature
  lib/
    prisma.ts            # Prisma client singleton
    validations/         # Zod schemas
    services/            # Business logic (if extracted from Server Actions)
    utils.ts             # cn() helper and general utilities
```

- **Server Actions are the controller layer.** They validate input, authorize, call services or Prisma, revalidate cache, and return results.
- **Services are optional.** Extract into `src/lib/services/` when business logic is shared across multiple features or too complex for a single action.

### Zod

> **Status: Installed.** Zod ^4.4.3 (resolved 4.4.3) is the project's validation library. Use with every Server Action and Route Handler for runtime validation.

Target usage:

```typescript
import { z } from "zod";

export const createGrantSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  funderId: z.string().cuid(),
  status: z.enum(["Research", "Qualified", "Planning", "Writing"]),
  deadline: z.string().datetime().optional(),
  amountRequested: z.number().positive().optional(),
});

export type CreateGrantInput = z.infer<typeof createGrantSchema>;
```

### Security & Reliability Constraints

These are design constraints, not yet implemented:

- **Server-side validation at all API boundaries.** Zod schemas gate every Server Action and Route Handler.
- **Client-side validation is UX-only** — always re-validate on the server.
- **No secrets in client code.** API keys, DB credentials in environment variables only.
- **Server/client boundaries** — Server Actions or Route Handlers for mutations. No direct DB access from client.
- **Organization isolation** — All data is scoped by organization ID. Cross-org access is prohibited.

---

## 6. Validation and Error Handling

### Validation

- **Zod is the single validation library.** Every Server Action and Route Handler validates input against a Zod schema before processing.
- **Share schemas between client and server** when the same validation rules apply (e.g., form fields). Define schemas in `src/lib/validations/` or co-locate with the feature.
- **Use Zod's `.safeParse()`** in Server Actions to avoid try/catch on expected validation failures. Return structured errors.
- **Do not use Zod for TypeScript type generation alone** — always `.parse()` or `.safeParse()` at runtime boundaries.

### Error Handling

- **Server Actions** return typed response objects:

```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> };
```

- **Route Handlers** return `NextResponse.json()` with appropriate HTTP status codes.
- **Do not throw in expected failure paths** (validation, authorization). Return error responses.
- **Throw only for unexpected errors** (database connection failures, bugs). These propagate to `error.tsx` boundaries.
- **Error boundaries (`error.tsx`)** must be Client Components. Place them at route segments that need granular error recovery.

### Logging

> **Status: Not implemented.** No logging framework is set up. Console logging is acceptable during early development but should be replaced before production.

---

## 7. Database Access

### ORM

- **Prisma is the project's ORM.** It is the single source of truth for the schema and database access.
- **No raw SQL.** Prisma typed queries only. Raw SQL may only be permitted if a future architecture or database decision explicitly carves out an exception.

### Status

- **Implemented foundation.** Prisma 7, the generated client, migrations, and the `PrismaPg`-backed singleton exist. Domain query modules and mutation slices remain planned.

### Database Patterns (Target)

- **Server Components query via `src/lib/queries/` modules** — pages/components do not import Prisma. Server-owned query modules own Prisma reads. See `context/architecture.md` §3 (clarified D-004 in `dispatch/DECISIONS.md`).
- **Server Actions own mutations** — co-located with feature routes.
- **Always validate with Zod before Prisma operations.**
- **Use transactions** (`prisma.$transaction`) for multi-step operations.
- **Use selective `select`** — never fetch entire objects when only specific fields are needed.

> Schema design, deletion strategies, indexes, ID generation, Prisma singleton pattern, and migration workflows are delegated to `context/database.md`. See also `context/tech-stack.md` for technology status and version info.

### References

- `.agents/skills/prisma-orm/SKILL.md` — Schema design, CRUD patterns, migrations, transactions.
- `.agents/skills/prisma-postgres/SKILL.md` — Prisma Postgres provisioning and connection management.
- `context/database.md` — Complete data model, entity schemas, soft-delete policy, index recommendations.
- `context/tech-stack.md` §4 — Database technology decisions and status.

---

## 8. Authentication and Authorization

### Auth Provider

- **Clerk is the project's authentication provider.** No custom auth.

### Status

- **Implemented.** `@clerk/nextjs`, `src/proxy.ts`, Clerk-native sign-in/sign-up pages, the authenticated provider sub-layout, and session handling are present. Local User and Organization rows are webhook-maintained projections; the signed Clerk session is authoritative.

### Target Architecture

- **Single `middleware.ts`** at project root using `clerkMiddleware` to protect routes.
- **`ClerkProvider`** wraps the application shell in a sub-layout (not the root layout).
- **Server Components** use `auth()` from `@clerk/nextjs/server` to get `userId`, `orgId`, and claims.
- **Organization-scoped data** — every database query filters by `orgId`. Cross-org access is prohibited at the query level.

### Authorization Model

- **Role-based access within an organization.** Clerk Organizations with custom roles.
- **Users see only their organization's data.** Org ID is the mandatory filter on every Prisma query.
- **Server-side authorization in every Server Action** — never rely on client-side checks alone.

### Reference

`.agents/skills/clerk-auth/SKILL.md` — Clerk setup, middleware, server component authentication, organization patterns, and sharp edges.

---

## 9. File Organization

### Directory Structure

```
src/
├── app/                          # App Router routes
│   ├── (public)/                 # Public route group (login, etc.)
│   │   └── login/
│   │       └── page.tsx
│   ├── (authenticated)/          # Protected route group
│   │   ├── layout.tsx            # Auth check, sidebar shell
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── grants/
│   │       ├── page.tsx
│   │       ├── actions.ts        # Server Actions for grants
│   │       ├── loading.tsx
│   │       └── error.tsx
│   ├── api/                      # Route Handlers (webhooks, external APIs)
│   │   └── ...
│   ├── globals.css               # Design tokens
│   ├── layout.tsx                # Root layout — font, minimal structure
│   └── page.tsx                  # Root page (landing / redirect)
├── components/
│   ├── ui/                       # owned shadcn/ui primitives
│   ├── grants/                   # Feature-specific components
│   ├── funders/
│   ├── dashboard/
│   ├── layout/                   # Sidebar, topnav, slide-over shell
│   └── shared/                   # Shared domain components
├── hooks/                        # Custom React hooks
│   ├── use-grants.ts
│   └── use-media-query.ts
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── utils.ts                  # cn() and general utilities
│   ├── validations/              # Zod schemas
│   │   ├── grant.ts
│   │   └── funder.ts
│   └── services/                 # Extracted business logic
└── types/                        # Shared TypeScript types
    ├── grant.ts
    ├── funder.ts
    └── common.ts
```

### Conventions

- **Co-locate.** Place Server Actions (`actions.ts`) and validation schemas with the feature route that uses them.
- **One component per file** for reusable components. Utility functions can be grouped by domain.
- **Keep `src/app/` for routing only.** Non-route components belong in `src/components/`.
- **Keep `src/lib/` thin** — only truly shared utilities and configurations.
- **`src/types/` for shared domain types** that cross feature boundaries. Feature-specific types stay co-located.

### Deferred Decisions

- **Route layout/domain boundaries** — See `context/architecture.md`.
- **Schema/migrations** — See `context/database.md`.
- **Detailed visual usage** — See `context/design.md`.

---

## 10. Naming

### Files

| Pattern | Example |
|---|---|
| `kebab-case.ts` / `.tsx` | `grant-card.tsx`, `use-grants.ts` |
| `route.ts` (Route Handler) | `src/app/api/webhooks/clerk/route.ts` |
| `page.tsx` (route page) | `src/app/grants/page.tsx` |
| `layout.tsx` (route layout) | `src/app/(authenticated)/layout.tsx` |
| `loading.tsx` (loading UI) | `src/app/grants/loading.tsx` |
| `error.tsx` (error UI) | `src/app/grants/error.tsx` |
| `actions.ts` (Server Actions) | `src/app/grants/actions.ts` |

### Code

| Construct | Convention | Example |
|---|---|---|
| **Components** | PascalCase | `GrantCard`, `FunderDetail` |
| **Functions** | camelCase | `formatCurrency`, `mapGrantStatus` |
| **Variables** | camelCase | `grantList`, `selectedFunder` |
| **Constants** | UPPER_SNAKE_CASE | `GRANT_LIFECYCLE_STAGES`, `DEBOUNCE_MS` |
| **Types / Interfaces** | PascalCase | `Grant`, `GrantCardProps` |
| **Enums (const objects)** | PascalCase key, PascalCase value | `GrantStatus.Awarded` |
| **Zod schemas** | camelCase + `Schema` suffix | `createGrantSchema` |
| **Server Actions** | camelCase verb | `createGrant`, `updateFunder`, `deleteDocument` |
| **Files** | kebab-case | `grant-card.tsx` |
| **Directories** | kebab-case | `grant-detail/`, `ui/` |

### CSS Class Naming

- Use Tailwind utility classes exclusively. Avoid custom CSS class names.
- When extracting reusable patterns, use shadcn/ui component primitives (CVA variants) rather than custom classes.
- Custom class names in CSS files are reserved for @layer base and @layer utilities — not for components.

### Prefixes

- `is` / `has` for booleans: `isLoading`, `hasDeadlinePassed`, `isSubmitting`
- `on` for event handlers: `onSelectGrant`, `onClose`
- `handle` for handler implementations: `handleSubmit`, `handleDelete`
- `use` for hooks: `useGrants`, `useMediaQuery`

---

## 11. UI Implementation

### Design Authority

The visual design is **light mode only, Linear-inspired, dense, and professional**. Two authoritative sources:

1. **`src/app/globals.css`** — Complete token system. All new UI must use these tokens. Do not introduce new colors, spacing values, or layout dimensions without an explicit decision in `DECISIONS.md`.
2. **`screenshots/`** — PNG mockups of every screen. Match pixel-for-pixel.

### Design Tokens

All design tokens are defined in `src/app/globals.css`. Do not duplicate token values in code — reference the CSS variables directly. See `context/design.md` for the visual design authority and `screenshots/` for pixel reference.

### Tailwind Usage

- **Tailwind v4 CSS-first.** Use `@theme inline` blocks (already defined in `globals.css`) for design tokens. Use `@import "tailwindcss"` (already present).
- **Do not create a `tailwind.config.ts`** unless Tailwind v4 requires it for a specific plugin. Tokens are defined in CSS.
- **Use the `cn()` utility** (tailwind-merge + clsx) for conditional class merging. It is available in `src/lib/utils.ts`.
- **Do not use arbitrary CSS-in-JS or CSS Modules.** Tailwind utility classes in JSX + standard CSS files for rare custom styles.

### shadcn/ui

> **Status: Initialized.** The project uses the shadcn configuration and owned primitives in `src/components/ui/`; broader product component coverage remains planned.

- **Components go in `src/components/ui/`.** They are copied code — you own them. Edit directly.
- **Do not create components that duplicate shadcn/ui primitives.** Use the library: `Button`, `Card`, `Dialog`, `Sheet` (for slide-over), `Table`, `Badge`, `DropdownMenu`, `Command`, `Form`, `Input`, `Select`, `Tabs`, `Avatar`, `Skeleton`, `Toast`, etc.
- **Custom compositions go in `src/components/<feature>/`**, not in `src/components/ui/`.
- **Use CVA for custom variants** on shadcn/ui components.
- **Components are accessible by default** (built on Radix UI). Do not remove ARIA attributes.
- **GrantFlow is light-mode only.** Do not add dark mode variants to components. The `globals.css` header explicitly states there is no `.dark` block.

### References

- `.agents/skills/shadcn-ui/SKILL.md` — Component catalog, installation, theming, composition patterns.
- `.agents/skills/tailwind-css/SKILL.md` — Utility patterns, responsive design, configuration.

---

## 12. Testing

### Testing Stack

The installed test stack is:

- **Vitest** — Unit and integration test runner.
- **React Testing Library (@testing-library/react)** — Component testing with user-centric queries.
- **Playwright** — End-to-end user flow testing (planned; not installed).

Vitest, React Testing Library, test scripts, and test configuration exist in the repository. The current suite covers auth, onboarding, Clerk projections/webhooks, shell behavior, and migration logic. The Playwright decision remains recorded in `dispatch/DECISIONS.md`.

### Installation Scope

When test infrastructure is installed:
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` — dev dependencies for unit/integration.
- `@playwright/test` — dev dependency for E2E.
- A `vitest.config.ts` at project root.
- A `playwright.config.ts` at project root or `e2e/` directory.
- Test utilities in `src/test/` or co-located with features.

### What to Test

- **Server Actions** — Input validation, authorization checks, business logic, return types. Mock Prisma via `vitest.mock`.
- **Server Components** — Data fetching via query modules (integration level with mocked Prisma).
- **Client Components** — Rendering with mocked data, user interactions, state changes, accessibility via Testing Library.
- **Route Handlers** — Request/response cycles with mocked auth and Prisma.
- **E2E flows** — Critical user journeys (sign-up, grant creation, CSV import) via Playwright.

### What Not to Test

- shadcn/ui primitives (they are upstream-tested).
- Trivial passthrough rendering.
- Internal implementation details (test behavior, not implementation).
- Database schema or migrations (tested via Prisma migrate and manual verification).
- Clerk SDK internals (integration tested via E2E).

---

## 13. Dependencies

### Dependency Rules

- **Do not install packages outside the planned set** without an explicit decision in `dispatch/DECISIONS.md`.
- **Prefer shadcn/ui conventions** over alternative UI libraries (no Headless UI, no MUI, no Ant Design).
- **No utility libraries beyond what shadcn/ui provides.** No `lodash`, `ramda`, `date-fns` unless explicitly justified.
- **No AI/ML packages.** GrantFlow MVP does not include AI features.
- **No state management library.** Server Components + Server Actions + URL search params cover MVP state management needs.

> Version specifiers, resolved versions, and technology statuses are in `context/tech-stack.md`. That document is the canonical dependency reference.

---

## 14. Code Review Checklist

Every PR or change set must pass these checks before merging:

### Correctness

- [ ] Code compiles without TypeScript errors under `strict: true`.
- [ ] No ESLint errors (`npm run lint` passes).
- [ ] Server Actions validate input with Zod before processing.
- [ ] Server Actions authorize the user (org check, role check) before mutating.
- [ ] No direct database access from client components.
- [ ] Error boundaries (`error.tsx`) are in place for routes that can fail.

### Design & Consistency

- [ ] UI uses only tokens from `globals.css` — no inline colors, ad-hoc spacing, or pixel values.
- [ ] Components match the screenshots in `screenshots/` pixel-for-pixel.
- [ ] No dark mode classes introduced (GrantFlow is light-only).
- [ ] Existing design tokens are not modified without a `DECISIONS.md` entry.
- [ ] Code follows the naming conventions in Section 10.

### Architecture

- [ ] Server-first pattern respected: no `"use client"` where Server Component suffices.
- [ ] Client boundaries are minimal and well-defined.
- [ ] Business logic is in Server Actions or `src/lib/services/`, not in components.
- [ ] Shared schemas (Zod) are not duplicated across features.
- [ ] Route Handlers are used only when Server Actions are not appropriate (webhooks, external APIs).

### Dependencies & File Organization

- [ ] Only approved dependencies are added.
- [ ] Files are placed in the correct directory per Section 9.
- [ ] shadcn/ui components are in `src/components/ui/`; feature components are in `src/components/<feature>/`.
- [ ] No new context/documentation files created unless explicitly tasked.

### Security

- [ ] No secrets, API keys, or environment variables in client code.
- [ ] Server Actions do not trust client-provided IDs for authorization — always re-derive `orgId` from the session.
- [ ] Input is validated server-side regardless of client-side validation.
- [ ] File uploads (future) are type-checked and size-limited on the server.

### Cleanliness

- [ ] No commented-out code, console.log statements, or TODO/FIXME comments without an owner.
- [ ] No unused imports, variables, or parameters.
- [ ] No files outside `src/` are modified unless explicitly tasked.
- [ ] No unrelated files are modified in the same PR.
- [ ] Diff is reviewed against the task spec and confirms only intended changes.

### Documentation

- [ ] If the change affects architecture or design, note it in `DECISIONS.md`.
- [ ] If a new dependency is added, justify it in the PR description.
- [ ] If the change affects the current repository state table in `AGENTS.md`, update it.

---

*Generated from the project brief (`context/project-brief.md`), the agent operating manual (`AGENTS.md`), and the repository's actual state. Architecture boundaries in `context/architecture.md`, schema design in `context/database.md`, visual detail in `context/design.md`, and technology/version details in `context/tech-stack.md`. Decision log in `dispatch/DECISIONS.md`.*
