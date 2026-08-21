# GF-SHELL-001 — Authenticated Application Shell

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-SHELL-001 |
| **Phase** | Phase 0 — Platform Foundation |
| **Status** | In Progress |
| **Product Goal** | Provide the authenticated application shell that wraps all feature routes with navigation, layout, and shared UI infrastructure |
| **MVP Classification** | Prerequisite — required by all feature screens |
| **Roadmap Link** | [Phase 0 — Platform Foundation](../../roadmap.md#5-phase-0-platform-foundation) |

---

## 1. Feature

Build the authenticated application shell consisting of a sidebar navigation, top navigation bar, and layout structure that wraps all feature routes under `(authenticated)/`. This includes the route group, layout components, shared navigation logic, and foundational shadcn/ui initialization.

## 2. Purpose

GrantFlow's features need a consistent navigation shell, layout structure, and shared UI primitives. GF-SHELL-001 establishes the authenticated route group, sidebar with navigation links, topnav with user/org context, and initializes shadcn/ui for use by all features.

## 3. User Outcome

After signing in, users see a consistent application shell with sidebar navigation (grants, funders, deadlines, dashboard, import), a topnav with organization name and user menu, and the ability to navigate between all feature areas.

## 4. Scope

- `(authenticated)/` route group with layout wrapping all feature routes
- Sidebar component: 220px expanded / 80px collapsed, navigation links with icons
- Top navigation bar: 52px height, organization name, user avatar/menu
- shadcn/ui initialization (`npx shadcn@latest init`) with GrantFlow-specific customization
- Initial shadcn primitives: Button, Badge, Avatar, Sheet, Skeleton, DropdownMenu
- `src/lib/utils.ts` with `cn()` utility
- lucide-react installation and icon convention
- Responsive sidebar behavior (collapsible, mobile navigation trigger)
- Basic loading and error boundaries at the shell level

## 5. Out of Scope

- Feature-specific UI components (grant tables, funder cards, dashboard metrics)
- Grant detail slide-over panel (GF-GRANT-003)
- Feature-specific layouts or secondary navigation
- Keyboard shortcut system
- Breadcrumb navigation
- Notification badge or alert indicators
- Theme customization or dark mode
- Responsive breakpoints beyond sidebar collapse behavior

## 6. User Stories

- As a **user**, I want a sidebar with navigation links so that I can quickly move between portfolio views.
- As a **user**, I want to see my organization name and my user avatar so that I know which account I am using.
- As a **user**, I want to collapse the sidebar so that I have more content space.
- As a **user**, I want to sign out from the user menu so that I can end my session.

## 7. Functional Requirements

1. **Sidebar** displays navigation links: Dashboard, Grants, Funders, Deadlines, Import (MVP features).
2. **Sidebar expanded width:** 220px. **Collapsed width:** 80px (current token; decision pending).
3. **Sidebar** is collapsible via a toggle button. State persists across navigation.
4. **Topnav** displays at 52px height with organization name (left) and user avatar with dropdown menu (right).
5. **User dropdown** includes: profile, organization settings, sign out.
6. **Active navigation** item is visually indicated in the sidebar.
7. **Layout** renders sidebar + topnav + content area. Content area fills remaining viewport.
8. **shadcn/ui init** configures the project for component installation. Components go in `src/components/ui/`.
9. **Loading state** uses `loading.tsx` at the `(authenticated)/` level with skeleton placeholder.
10. **Error boundary** uses `error.tsx` at the `(authenticated)/` level preserving the shell.

## 8. Business Rules

1. Navigation links are limited to MVP features. Post-MVP features are added when implemented.
2. Sidebar collapse state is stored in local storage, not URL params.
3. The shell is Server Component by default. Client-side interactivity (sidebar toggle, dropdown) is extracted into client islands.
4. Sidebar and topnav use only design tokens from `globals.css` — no inline colors or ad-hoc spacing.

## 9. User Experience

- Sidebar matches `screenshots/` composition: dark neutral surface, white text, indigo active indicators.
- Navigation items use lucide-react icons with text labels. Collapsed state shows only icons.
- Topnav is minimal: org name on the left (truncated if long), user avatar on the right.
- The shell uses the soft gray canvas (`#F4F6F6`) with white content surface.
- Collapse animation is fast (120ms) and respects `prefers-reduced-motion`.

## 10. Data Requirements

- **Organization name** from local Organization record (synced via Clerk webhook)
- **User name/avatar** from local User record (synced via Clerk webhook)
- No database queries for navigation state — sidebar config is static

## 11. Permissions

- Shell is available to all authenticated users regardless of role
- Navigation items are the same for all roles (individual page access is enforced by Server Actions and page-level checks)

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton sidebar and topnav, content area shows loading indicator |
| **Normal** | Full shell with navigation, user menu, content area |
| **Sidebar collapsed** | Icons-only sidebar, more content width |
| **Error** | Error boundary preserves shell, shows error in content area with retry |
| **Mobile viewport** | Sidebar hidden by default, hamburger menu toggles overlay sidebar |
| **Long org name** | Truncated with ellipsis in topnav |

## 13. Acceptance Criteria

- [ ] `(authenticated)/` route group exists with layout
- [ ] Sidebar renders with all MVP navigation links
- [ ] Topnav renders with org name and user avatar
- [ ] Sidebar collapses and expands via toggle
- [ ] Active navigation item is visually indicated
- [ ] User dropdown includes sign out action
- [ ] shadcn/ui is initialized and primitives can be installed
- [ ] `cn()` utility exists in `src/lib/utils.ts`
- [ ] `loading.tsx` shows skeleton at shell level
- [ ] `error.tsx` preserves shell and shows recovery action
- [ ] All tokens reference `globals.css` — no inline colors
- [ ] Shell matches screenshot composition (sidebar, topnav proportions)

## 14. Dependencies

- GF-AUTH-001 (requires authentication flow to be functional)
- GF-DATA-001 (requires local User/Organization tables)

**Unresolved decisions:**
- Collapsed sidebar width: 80px (current token) vs. 60px (older spec) — must reconcile during implementation
- Responsive breakpoints for mobile sidebar behavior
- shadcn/ui initialization reconciliation with Tailwind v4, hex tokens, light-only policy
- Icon convention — lucide-react convention to be finalized during shadcn init

## 15. Completion Criteria

- All acceptance criteria pass
- Shell matches screenshot composition
- shadcn/ui is initialized and documented in `dispatch/DECISIONS.md`
- Navigation works end-to-end (links navigate to routes that will be built in later phases)
- Responsive sidebar behavior works at target viewports

---

*Spec references: `context/architecture.md`, `context/design.md` §§2–3, `context/coding-standards.md` §§4, 9, 11*
