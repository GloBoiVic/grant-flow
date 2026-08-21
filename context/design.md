# GrantFlow Design Blueprint

**Status:** Authoritative design direction for implementation; the shell and initial owned component primitives are implemented, while the broader product component system remains planned.

**Product register:** Product UI. GrantFlow is a dense, familiar work tool where design serves rapid grant-portfolio work. The bar is trustworthy category fluency—not decoration.

## Authority and boundaries

- Use `src/app/globals.css` as the token authority and `screenshots/` (9 PNG files) as the visual authority. The screenshots are 1440px desktop references for dashboard, grants list, grant detail, funders list, deadlines, login, landing page, index/empty state, and the dashboard slide-over panel; they establish the desktop composition but are not evidence that mobile or other viewports are out of scope.
- The existing token system is implemented in `src/app/globals.css`. The authenticated shell, initial reusable components, shadcn configuration, `lucide-react`, responsive navigation, and shell/auth UI tests exist. The chart package and complete domain screens remain absent. The repository contains a customized root layout with Inter font integration and the complete globals.css.
- This document governs visual and interaction decisions only. Use `architecture.md` for route/server boundaries, `context/database.md` for domain and persistence rules, and `context/coding-standards.md` for code conventions. Do not duplicate those documents here.
- Scope is grant portfolio management: grants, funders, deadlines, documents, activities, tags, reporting views, and spreadsheet/CSV migration. Do not introduce donor CRM, accounting, AI grant writing, billing, or unrelated nonprofit-management workflows.

## 1. Design Principles

1. **Five-second comprehension.** The first viewport must expose portfolio health, attention items, active opportunities, and approaching deadlines without requiring navigation or interpretation.
2. **Dense, not cramped.** Favor compact rows and clear grouping for professionals replacing spreadsheets; preserve readable labels, targets, and breathing room around primary actions.
3. **Progressive disclosure.** Show the decision-critical summary first, then reveal supporting fields, history, documents, and secondary actions on demand.
4. **Familiarity over novelty.** Use standard navigation, tables, filters, forms, dialogs, sheets, and keyboard behavior. Do not invent gestures or ornamental interactions.
5. **One visual vocabulary.** The same status, button, field, table, drawer, and feedback patterns must behave consistently across every product surface.
6. **State is explicit.** Every interactive element needs default, hover, focus, active, disabled, loading, and error treatment; meaningful state must never depend on color alone.
7. **Light-only restraint.** Indigo is an action/selection accent, not a decorative wash. Keep surfaces quiet so deadlines and status changes carry attention.

## 2. Visual Identity

GrantFlow preserves the existing Linear-inspired identity: light-only, professional, compact, and operational. The canvas is soft gray (`#F4F6F6`), working surfaces are white, primary emphasis is restrained indigo (`#4F46E5`), lines are subtle gray (`#E5E7EB`), and foreground text is dark gray (`#1F2937`).

- **Typography:** Inter is loaded in `src/app/layout.tsx` via `next/font/google` with CSS variable `--font-sans`, making it available throughout the application without separate font files or imports. Use the dense scale already defined in `globals.css`: 11px labels (`text-label`, weight 600, 0.06em tracking), 12px captions (`text-caption`), 13px compact UI (`text-sm`), 14px body (`text-base`), 18px section headings (`text-h2`, weight 600), 20px titles (`text-title`, weight 700, -0.01em tracking), and 28px metrics (`text-metric`, weight 700, -0.02em tracking). Use weight and hierarchy, not display fonts or oversized hero typography.
- **Surfaces:** white content/sidebar surfaces on the soft-gray canvas; use borders and the existing subtle shadows to establish hierarchy. Avoid decorative gradients, glass effects, saturated inactive states, and nested-card clutter.
- **Shape:** use the existing 6px, 8px, and 12px radius vocabulary. Controls and compact panels should not become pill-shaped unless they are genuinely tags or compact status chips.
- **Motion:** use the existing 120ms fast and 220ms slide-over durations with the existing easing. Motion communicates selection, state change, loading, reveal, or dismissal only; honor `prefers-reduced-motion`.
- **No dark mode:** do not add `.dark` variants, theme toggles, or dark-only components.

## 3. Layout System

The application shell is desktop-first but structurally responsive. The target desktop composition is a 220px sidebar, 52px top navigation, and a content canvas that uses the remaining width. The collapsed sidebar token is currently 80px; an older 60px wording is an explicit open decision, not a second active standard.

- Keep page titles, primary actions, filters, and summary context in a predictable top region. Use a consistent content inset and vertical rhythm derived from the existing utilities/tokens rather than ad hoc pixel values.
- Tables use the existing 44px row target on desktop, clear column alignment, compact headers, and visible sorting/filter affordances.
- The 480px right-side slide-over shown in `dashboard-slideover.png` is the standard desktop detail drawer. It overlays the content with a scrim, traps focus, and does not resize the main table while open.
- Responsive behavior is structural: collapse or replace the sidebar, stack metric/detail regions, adapt toolbars, and provide a deliberate horizontal-table strategy. Do not solve responsiveness with fluid type or by hiding critical information.
- Preserve a clear content reading order when columns collapse. Primary record identity and next action precede secondary metadata.
- Establish exact z-index layers when implementation begins: popovers/dropdowns below sheets/dialogs, scrims below the active surface, and toasts above transient surfaces. Avoid arbitrary high z-index values.

## 4. Grant Detail Experience

Grant detail is a progressive-disclosure experience, not a form dump.

- **Drawer first for contextual review:** Selecting a grant from dashboard, deadline, or list opens the right-side 480px slide-over matching the screenshot. It keeps the user's list context, supports quick triage, and exposes identity, status, funder, deadline, amount, owner, next steps, and the most relevant actions first.
- **Full page for sustained work:** A full grant-detail route is appropriate for editing many fields, reviewing the complete activity history, managing documents, and working through related information. It should retain the same information order and visual vocabulary as the drawer.
- **Disclosure order:** identity and lifecycle status → deadline/urgency and financial summary → owner, tags, and next steps → documents → activity/history → lower-frequency notes and metadata.
- Drawer actions must make the next safe step obvious: edit, advance status, add document, add activity/note, or open full detail. Destructive actions are secondary and require confirmation.
- Drawer close behavior: close button, Escape, scrim click where safe, and browser back/deep-link restoration when routed as an intercepted detail view. Unsaved changes require an explicit guard.

## 5. Dashboard

The dashboard is the five-second portfolio readout, not a generic analytics page.

- Lead with a compact set of portfolio metrics from the brief: requested, awarded, pending, upcoming deadlines, success rate, and active grants. Metrics must have plain-language labels and a visible period/scope when relevant.
- Place attention items and approaching deadlines where they can be scanned immediately; urgency should be expressed by date proximity, label, and status treatment, not only red color.
- Show active opportunities, high-priority items, and recent activity as actionable lists. Clicking a row should preserve context and open the grant drawer when appropriate.
- Charts are a presentation layer for existing grant data, not a new reporting engine. Any chart must answer a specific portfolio question and have a text/table alternative.
- Empty and partial-data dashboards should explain what is missing and point to the next useful action (import, create grant, or complete a record) without pretending that zero is healthy data.

## 6. Tables and Lists

Tables are the primary spreadsheet replacement.

- Use stable column order with grant/funder identity first, lifecycle/status and deadline next, then owner, money, and secondary metadata. Keep actions discoverable but quiet.
- Provide search, filter chips, sorting, pagination or incremental loading, and a clear active-filter summary where the data set requires them. Persist filter state in the URL when architecture permits.
- Make rows selectable and keyboard reachable. A row click opens detail; inline controls must not accidentally trigger row navigation.
- Use alignment deliberately: names left, dates and numbers aligned for scanability, status/tags as compact badges, and monetary values consistently formatted.
- On smaller widths, prefer a horizontal scroll region with a visible affordance for data-dense tables, or a deliberate priority-column transformation. Never squeeze columns until values become ambiguous, and never silently remove deadline/status/identity.
- Lists such as activity and documents may use compact rows when table semantics are not useful, but must keep the same spacing, focus, and loading conventions.

## 7. Status System

The domain has eleven lifecycle states: **Research, Qualified, Planning, Writing, Internal Review, Submitted, Pending, Awarded, Declined, Reporting, Closed**. These are the authoritative labels from the product and database documents; they are not a strict state machine. Forward movement is common, but regression and skipping are allowed.

The existing five-color badge palette cannot provide one unique color per state. The following is a deliberate presentation mapping, not a change to the domain model:

| Lifecycle states | Existing presentation family | Additional meaning required |
|---|---|---|
| Research, Qualified | neutral / “to apply” treatment | Exact text label; distinguish the stage in filters and accessible name |
| Planning, Writing, Internal Review | indigo / “in progress” treatment | Exact text label and, when useful, a stage-specific non-color marker |
| Submitted, Pending | amber / “submitted” treatment | Exact text label; do not imply that Pending is identical to Submitted |
| Awarded, Reporting | green / “approved” treatment | Exact text label; awarded and reporting remain distinct lifecycle states |
| Declined | red / “declined” treatment | Exact text label and terminal/decision context |
| Closed | neutral treatment, with a clear closed label | Do not reuse “to apply” copy; terminal state is conveyed by text and placement |

Badges must always include visible text. Status filters, table cells, drawer summaries, and announcements must expose the label and, where needed, a text explanation. Color, weight, iconography, position, and copy may reinforce meaning but none may be the sole signal. The existing CSS variables are the source for these colors; do not add new status hues without a recorded decision.

## 8. Forms

Forms should feel like a safe, faster version of the spreadsheet—not an intake questionnaire.

- Group fields by task: identity/funder, lifecycle and ownership, deadline and decision dates, amounts, tags, next steps, notes, and optional metadata.
- Mark required fields clearly; use plain labels, concise help text, examples only where ambiguity is likely, and inline errors adjacent to the field. Preserve entered values after validation failures.
- Use familiar controls with adequate targets: text input, date input, amount input with currency context, select/combobox for controlled values, tag picker, textarea, and file drop/upload control.
- Client validation improves feedback; server validation remains authoritative. Follow `context/coding-standards.md` and `context/database.md` rather than duplicating implementation rules here.
- Save actions state what will happen. Disable only when necessary, show submitting state without losing the form, prevent duplicate submits, and report success in the local context.
- For long edits, prefer a full page; use a drawer/sheet for focused edits that preserve list context. Warn before closing with unsaved changes.

## 9. Modals and Slide-Overs

Use progressive alternatives before a modal. Inline confirmation, an expanded section, or a dedicated route is preferable when it preserves context.

- **Slide-over/sheet:** contextual grant review, focused edit, document upload, or other short task where the underlying list remains useful. Desktop width is the existing 480px right-side drawer; smaller viewports should become a near-full-width sheet with safe insets.
- **Dialog/modal:** blocking decisions only—delete/restore, discard unsaved work, resolve an import conflict, or confirm an irreversible operation. The title must state the decision and the actions must be explicit.
- Scrims, focus trap, Escape handling, focus restoration, scroll locking, and labeled close controls are required. Do not nest dialogs casually.
- Use the eventual shadcn `Sheet`/`Dialog` primitives as a customized foundation once initialized; do not build an unmodified generic component-library page.

## 10. Feedback and States

Every feature must design the complete state set before implementation:

- **Loading:** skeleton rows/regions that match the final geometry; avoid central spinners replacing useful context. Buttons may show compact progress while submitting.
- **Empty:** explain why the space is empty, what the user can do next, and provide one primary action. Distinguish truly empty portfolio data from no search/filter matches.
- **Error:** state what failed, preserve context and entered data where possible, give a recovery action, and avoid exposing technical details. Route-level failures use the architecture's error boundaries.
- **Success:** confirm the completed action near its source and update the affected list/detail state. Use toasts only for lightweight, non-blocking confirmation.
- **Confirmation:** ask only when consequences or ambiguity justify interruption; state the object and consequence.
- **Destructive:** use explicit destructive copy, require confirmation for deletion/removal, and separate destructive action styling from primary actions. Explain recovery/soft-delete behavior when applicable.
- **Optimistic:** only use for low-risk, reversible state changes where rollback is reliable (for example, a tag or status update). Show the pending state and reconcile failures visibly; do not optimistically claim uploads, imports, or irreversible deletion succeeded.
- **Offline/network ambiguity:** do not silently discard edits. Surface retry and preserve local form state where feasible.

## 11. Documents

Documents are grant context, not a separate file-management product.

- Surface documents within grant detail, organized by the product's types: RFP, Narrative, Budget, Award Letter, Report, Supporting Doc.
- Each document row exposes name, type, size/date, uploader where useful, and safe actions such as download/open and delete. Use recognizable text labels and metadata, not color-only file categories.
- Upload UI should explain accepted file types and the size limit, show progress and failure recovery, and never imply completion before server confirmation. The planned storage/security rules belong to `context/database.md` and `AGENTS.md`.
- Empty document sections should explain the value of adding an RFP, narrative, budget, award letter, report, or supporting document and offer upload without overwhelming the grant summary.
- Deletion is destructive/soft-delete aware and must update activity history according to the data model.

## 12. Accessibility

- Use semantic landmarks, headings in order, real buttons/links, labels associated with controls, table semantics, and descriptive names for every interactive element.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text; verify muted text and status combinations against their surfaces. Do not rely on status color alone.
- Every keyboard focusable element has a visible focus ring using the existing ring token. Keyboard users can navigate sidebar, top navigation, filters, tables, drawer/dialog controls, forms, and uploads.
- Sheets/dialogs have accessible titles/descriptions, focus trapping/restoration, Escape behavior, and screen-reader announcements for validation, loading completion, errors, and successful mutations.
- Respect reduced motion and ensure all content remains available without animation. Touch targets must remain usable at smaller widths even when the visual density is high.
- Tables need clear headers and a sensible reading order; responsive transformations must preserve relationships between a grant and its status/deadline/amount.

## 13. Responsive Design

Responsive behavior is required and structural; exact breakpoint values remain an open decision.

- **Desktop:** use the screenshot composition as the reference: expanded sidebar, top nav, dense tables, dashboard regions, and 480px drawer.
- **Intermediate widths:** collapse or replace the sidebar, compress secondary toolbar content, stack dashboard metric/detail regions, and preserve primary filters/actions.
- **Small widths:** use a compact navigation trigger or replacement navigation, stack form fields and detail sections, make the drawer near-full width, and keep actions reachable without horizontal page overflow.
- **Tables:** use a contained horizontal scroll strategy for data-dense views with sticky/priority identity columns only if it remains accessible; otherwise transform rows into labeled records. Do not hide critical status, deadline, or identity information.
- **Forms and dialogs:** use one-column layouts, full-width controls, safe viewport insets, and clear primary/destructive action ordering. Long labels and error messages must wrap without clipping.
- Proposed breakpoints may be evaluated during implementation, but must be recorded as proposed until explicitly decided. Do not encode “mobile out of scope.”

## 14. Component System

The component system is partially implemented. Use the initialized shadcn configuration and owned primitives as a customized foundation rather than a visual destination.

- Planned primitives include button, badge, card/surface, table, input, select/combobox, form, tabs, dropdown, command/search, avatar, skeleton, toast, dialog, and sheet. Add only primitives justified by product surfaces.
- Put copied primitives in `src/components/ui/`; compose domain components in feature folders such as grants, funders, dashboard, layout, and shared. Follow `context/coding-standards.md` for file and component boundaries.
- Customize variants, spacing, focus, light-only theming, and density to match `globals.css` and screenshots. Do not leave defaults that conflict with the product register, and do not create duplicate primitives.
- The shell uses `lucide-react` as the shadcn-aligned icon convention. Icons are supporting affordances with accessible labels, never the only meaning for a status or action.
- Build components around states and composition, not page-specific one-offs. A grant row, status badge, deadline treatment, drawer shell, and form field should be reusable across dashboard, grants, deadlines, and detail surfaces.

## 15. Design Tokens

`src/app/globals.css` already implements the token system through Tailwind v4's CSS-first `@import "tailwindcss"` and `@theme` blocks. There is no `tailwind.config` and implementation should not introduce one merely to restate these values.

Use the existing semantic tokens for:

- canvas, surface, popover, foreground, muted text, accent, border, input, focus ring, primary/hover, success, warning, error, status badges, urgency badges, sidebar, avatars, radii, shadows, and motion;
- the layout metrics: 220px expanded sidebar, current 80px collapsed sidebar token, 52px top nav, 44px table row, and 480px slide-over;
- Inter and the dense label/caption/body/title/metric scale.

Do not copy or fork the full CSS token file into feature code. Do not use inline colors, invented spacing/dimensions, dark-mode overrides, or arbitrary values when an existing semantic token applies. A token change is a design decision and must be recorded in `dispatch/DECISIONS.md` per repository rules. The token system is implemented; the component system and all GrantFlow screens are not.

## 16. Design Anti-Patterns

- Dark mode, theme toggles, or dark-only variants.
- Generic shadcn/demo pages copied without GrantFlow-specific hierarchy and density.
- Decorative gradients, glassmorphism, gradient text, colored side stripes, giant rounded cards, or repeated identical card grids.
- Oversized hero metrics or marketing-style display typography inside the product.
- Status communicated by color alone, ambiguous “approved” copy for multiple lifecycle states, or red used for ordinary attention.
- Modals for routine browsing/editing, nested dialogs, or drawers that hide the user's list context without a clear reason.
- Tables that clip, silently remove critical columns, or become unreadable on narrow screens.
- Spinners replacing content, blank empty states, generic “Something went wrong,” or success feedback disconnected from the changed record.
- Inputs without labels, errors only at the top, disabled save with no explanation, lost form data, or optimistic treatment for uploads/imports/destructive actions.
- Unbounded dashboard charts, reporting complexity beyond the MVP, donor/accounting concepts, AI writing affordances, or invented product areas.
- Custom icons or icon libraries treated as installed when they are not; inaccessible glyph-only actions.

## Explicit assumptions and open decisions

- **Collapsed sidebar width — open:** `globals.css` currently defines `--layout-sidebar-w-collapsed: 80px` with a comment noting older spec language said 60px. Treat 80px as the current token and screenshot-aligned candidate; reconcile before implementation and record the decision in `dispatch/DECISIONS.md`.
- **Chart implementation — open:** no chart library exists. Decide whether MVP charts use a permitted library or accessible CSS/HTML/SVG primitives; every chart needs a text/table fallback. Do not add a dependency by implication.
- **Responsive breakpoints — open:** the screenshots establish desktop composition only. Choose and document exact breakpoint values after testing actual shell/table/form behavior; the structural requirements above are settled. Tailwind v4 default breakpoints (sm 640px, md 768px, lg 1024px, xl 1280px) are a candidate starting point but not confirmed.
- **shadcn coverage — open:** shadcn is initialized and the shell primitives are present. Reconcile additional primitives and their dependency set with Tailwind v4, the existing tokens, light-only policy, and GrantFlow-specific density as product surfaces are implemented.
- **Icon convention — resolved for the shell:** `lucide-react` is installed and used. Continue the existing accessible-labeling pattern for future product surfaces.
- **Status mapping — presentation choice:** the five existing badge families are reused across eleven domain stages for visual restraint. The domain labels remain distinct and the mapping must not be mistaken for a database change.

## Acceptance Criteria

- [ ] All sixteen sections above are treated as the design contract for GrantFlow UI work.
- [ ] Implementations point to `src/app/globals.css` and the relevant screenshots, use existing tokens, and do not claim absent product components, pages, or charts exist; implemented shell/auth UI is documented accurately.
- [ ] Desktop output matches the 1440px screenshot references in hierarchy, density, light-only identity, sidebar/top-nav proportions, table rows, and 480px right-side detail drawer.
- [ ] Responsive behavior is implemented structurally: navigation adapts, dashboard/detail regions stack, forms remain usable, and tables preserve critical information through scroll or an accessible transformation.
- [ ] Grant detail uses progressive disclosure, with contextual right-side drawer review and full-page sustained work clearly separated.
- [ ] All eleven lifecycle states have explicit text labels, documented presentation mapping, and non-color meaning; no state is conveyed by color alone.
- [ ] Forms, documents, dialogs/sheets, loading, empty, error, success, confirmation, destructive, and optimistic states are designed before their implementation.
- [ ] Keyboard navigation, focus visibility, semantics, contrast, reduced motion, focus management, and screen-reader feedback meet the accessibility requirements in this blueprint.
- [ ] shadcn is customized as an owned foundation; no generic unmodified component-library page is shipped, and remaining planned dependencies are not represented as installed.
- [ ] Open decisions (collapsed sidebar, chart library, responsive breakpoints, shadcn reconciliation, icon convention, status presentation) are resolved or explicitly recorded in `dispatch/DECISIONS.md` before they become implementation assumptions.
