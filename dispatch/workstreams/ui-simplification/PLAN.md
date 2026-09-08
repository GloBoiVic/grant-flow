# SoloFlow Plan - ui-simplification

Status: READY_FOR_USER  
Classification: Feature  
Workstream: ui-simplification  
Base branch: main  
Base SHA: 08181a9fc5bca51364ac275fe345c87aa3f70d67  
Execution branch: solo/ui-simplification (created 2026-09-08 via GIT START)  
Approval: Approved 2026-09-08 - explicit developer approval to proceed using the reconciled ui-simplification PLAN as the frozen contract  
Phase: READY_FOR_USER  
Task state: T001 DONE; T002 DONE; T003 DONE; T004 DONE; T005 DONE  
Validation state: Root VALIDATION FAIL resolved through R001 BUILD DONE, VALIDATION PASS, REVIEW PASS; R002 BUILD DONE, VALIDATION PASS, REVIEW PASS; R003 BUILD DONE, VALIDATION PASS, REVIEW PASS; R004 BUILD DONE, VALIDATION PASS, REVIEW PASS; R005 BUILD DONE, VALIDATION PASS, REVIEW PASS; R006 BUILD DONE, VALIDATION PASS, REVIEW PASS; R007 BUILD DONE, VALIDATION PASS, REVIEW PASS; one documented MINOR Safari MCP tooling limitation remains; no unresolved CRITICAL or IMPORTANT findings  
Architecture status: Not required. This is a bounded frontend composition and copy pass over existing routes, DTOs, actions, UI primitives, and tests. No new persistence, domain model, route, navigation, or cross-cutting architecture is expected.  
Next action: Await renewed explicit human Safari Technology Preview visual approval. Do not merge or perform GIT END before approval.  
Concerns: The current main branch already contains the earlier dashboard refinement, Deadline View, Grant Workspace, funder maintenance, and data export work. This plan deliberately supersedes their older visual directions only where this reduction pass requires it; their data, action, route, authorization, and accessibility contracts remain preserved.

## Outcome

Perform a reduction-first UI and copy cleanup across the authenticated GrantFlow application before private production deployment.

GrantFlow should feel quieter, clearer, more professional, and more deliberate because unnecessary interface has been removed. It should contain fewer visible containers, repeated facts, repeated labels, decorative treatments, explanatory subtitles, and competing actions without losing useful information, functionality, accessibility, or existing workflows.

The screen jobs remain distinct:

- Dashboard: orient me.
- Grant list: help me scan, filter, and choose a Grant.
- Grant detail Sheet: quick inspection and quick actions.
- Grant Workspace: complete Grant record.
- Deadline View: show deadline risk and what is coming next.
- Funder list: help me find a Funder.
- Funder detail Sheet: inspect and maintain that Funder.
- Import: get portfolio data into GrantFlow safely.

This is a composition pass across those surfaces, not an independent redesign of each screen.

The governing product rule is:

> One fact should have one primary presentation per viewport unless repetition materially helps the user make a decision.

## Inspection Basis

- `main` is at `08181a9fc5bca51364ac275fe345c87aa3f70d67` (`08181a9`), the post-data-export closure state. Solo inspection recorded the local worktree as clean and matching `origin/main` at planning start. No execution branch has been created.
- `dispatch/ACTIVE.md` remains clear during this planning gate and currently records `No active workstream.` The `ui-simplification` workstream does not become active until explicit developer approval and GIT START.
- `PRODUCT.md` defines GrantFlow as the grant portfolio and grant-work source of truth for nonprofit grant professionals. It explicitly supports portfolio import, Grant and Funder management, deadlines, notes, activity, and portfolio insight, and excludes donor CRM, accounting, generic word processing, AI grant writing, and general nonprofit management.
- The authenticated organization-required layout supplies the AppShell, skip link, desktop sidebar, mobile navigation Sheet, authentication, and organization authorization. Those contracts remain intact. Shell changes in this workstream are limited to actual same-viewport identity duplication rather than general navigation redesign.
- `DashboardContent` currently uses a restating page subtitle, an `As of` icon line, a titled icon/divider section, four independently bordered metric cards with accent strips, icon boxes, captions, and links, a multi-treatment attention card with repeated counts, a decorated Upcoming card with another Deadline link, and a status card with relative bars and explanatory footer copy.
- `GrantsPage` currently preserves a useful dense table and URL-backed search/filter/sort/pagination behavior, but its heading has a restating subtitle, the table surface carries unnecessary shadow chrome, and its true-empty copy still refers to replacing a spreadsheet row.
- Current `GrantsPage` also contains the bounded `Export portfolio` secondary action from the completed Data Export workstream. That route and accessible description must remain behaviorally intact.
- `GrantDetailSheet` currently combines header context, Edit, full-Workspace navigation, status controls, four mini summary cards, the full TagManager, and the full Activity timeline. Status is also repeated as one of the mini summary cards. Tags and Activity are already complete Workspace concerns.
- The current quick Sheet therefore behaves too much like a second Grant Workspace rather than a temporary glance/action surface.
- `GrantWorkspace` currently has a bordered/shadowed header card followed by separate bordered/shadowed Overview, Notes, and Activity cards. Funder and Status appear in the header and again in Overview.
- Current Workspace amount formatting manually prefixes the currency code to an `Intl.NumberFormat` currency result. This can produce awkward duplicate-code/symbol output for non-USD stored values. The UI pass should use one explicit currency-aware amount representation rather than code-plus-symbol duplication.
- `GrantForm` is reused by create, Sheet edit, and Workspace edit. Its complete field set, Zod/server validation, create/edit payload distinction, dirty-form confirmation, success/error semantics, and separate status behavior are functional contracts.
- `GrantForm` contains visible implementation-oriented copy such as `Update the grant record without leaving your portfolio.` and `Use Change status for lifecycle updates.` Those should be simplified without changing the form's ownership of status.
- This workstream does not use UI cleanup as a reason to add unrelated form metadata, autocomplete policy, validation behavior, or generic form infrastructure.
- `TagManager` is the existing Grant tag assignment/create/remove interaction. It remains complete and accessible in the canonical Workspace. Removing it from the quick Sheet does not remove tag capability from GrantFlow.
- `DeadlineView` already has the correct server query, UTC date contract, and fixed three-bucket presentation. It currently uses three separate shadowed cards with tinted headers plus a longer page subtitle.
- `FunderPage` and `FunderList` are compact in data shape but retain a restating page subtitle, a shadowed table surface, and a redundant `Showing N funders` footer.
- `FunderDetailSheet` repeats the title as a `Name` definition row and uses implementation-language descriptions such as `Funder record details and maintenance fields.` and `Update the funder record without leaving your portfolio.`
- `PortfolioImportPage` is intentionally detail-heavy because preview, provenance, invalid rows, warnings, duplicate handling, acknowledgement, and server re-checks prevent unsafe import. Most of that information must remain. The reduction opportunity is copy and container hierarchy, not information removal.
- `TopNavigation` currently displays the organization name on non-Grants routes. On desktop that duplicates organization identity already visible in the persistent sidebar. On mobile, however, the desktop sidebar is absent and organization context should not be removed merely for visual symmetry.
- `AccountMenu` currently renders user name/email in both the closed trigger and the opened menu. That is a real same-viewport identity duplication and can be simplified while preserving an accessible trigger and complete identity inside the opened menu.
- `Button`, `Sheet`, `Skeleton`, and other shared primitives already satisfy the current product workflows. This workstream does not broaden into generic motion, component-library, or primitive cleanup unless a changed surface directly requires a bounded fix.
- `src/app/globals.css` establishes the soft-gray canvas, white surfaces, indigo primary, semantic urgency/status tokens, dense type scale, radius scale, focus ring, Sheet width, and layout widths. Reuse those tokens.
- Existing visual references include `screenshots/dashboard.png`, `screenshots/grants.png`, `screenshots/dashboard-slideover.png`, `screenshots/grant-detail.png`, `screenshots/deadlines.png`, and `screenshots/funders.png`. They are density/composition references only and must not reintroduce prototype-only fields or features.
- Relevant regression files include `src/test/dashboard-page.test.tsx`, `src/test/grant-ui.test.tsx`, `src/test/grant-workspace-route.test.ts`, `src/test/deadline-view.test.tsx`, `src/test/deadlines-route.test.ts`, `src/test/funder-ui.test.tsx`, `src/test/portfolio-import-ui.test.tsx`, `src/test/app-shell.test.tsx`, `src/test/account-menu.test.tsx`, `src/test/desktop-sidebar.test.tsx`, `src/test/mobile-navigation.test.tsx`, and `src/test/navigation-list.test.tsx`.
- The current supplied baseline after Data Export is 292 tests passed and 0 skipped.
- Planning does not rerun the implementation validation matrix or production build.
- Relevant specialist guidance loaded for this workstream: `solo-flow`, `frontend-design`, `web-design-guidelines`, and `vercel-react-best-practices`.

## Reduction Principles

- Remove redundancy before changing styling.
- Give each fact one primary presentation per viewport unless repetition materially improves a decision.
- Prefer typography, spacing, alignment, and grouping over borders and cards.
- Prefer one coherent surface over several decorative cards when the information belongs together.
- Use whitespace between conceptual groups rather than trapping whitespace inside many independent cards.
- Reserve shadows primarily for overlays or surfaces that genuinely need elevation.
- Reduce colored accent bars, icon boxes, decorative icons, uppercase micro-labels, and explanatory subtitles.
- Use normal user language rather than implementation or product-marketing language.
- Keep copy when it prevents ambiguity, errors, unsafe import behavior, or inaccessible interaction.
- Keep accessible descriptions even when visible explanatory copy is removed; visually hidden copy is appropriate where the semantics remain useful.
- Do not add gradients, animations, decorative charts, navigation, filters, routes, product features, themes, or design-system infrastructure.
- Do not use this workstream for unrelated frontend hygiene such as generic transition refactors, Skeleton redesign, form metadata additions, or component-library changes.
- Keep the existing visual language: soft-gray canvas, white surfaces where grouping is useful, indigo actions, semantic status/urgency tokens, visible focus, and dense working tables.
- The resulting application must visibly contain less interface chrome than the current application.

## Mandatory Audit

The following inventory is the source of the implementation contracts below.

`REMOVE` means the information or treatment is redundant or decorative.

If a function is involved, its retained location is stated explicitly.

`RELOCATE` means the function/information remains in GrantFlow but lives on the surface with the clearer job.

### Dashboard

| Classification | Current element                                                                                                                                                                                                                    | Decision and reason                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| KEEP           | Tracked grants, Open pipeline, Requested, Awarded, `As of`, upcoming five rows, status counts, useful drill-down links                                                                                                             | These orient the user or lead to existing Grant workflows. Dashboard DTO/query semantics stay unchanged.                                                                 |
| REMOVE         | Restating Dashboard subtitle                                                                                                                                                                                                       | The screen immediately communicates its own contents. Keep `Dashboard` and `As of <date>`.                                                                               |
| REMOVE         | Visible `Portfolio totals` heading, icon, and decorative divider                                                                                                                                                                   | The four labeled metrics are self-explanatory. Use a semantic/sr-only grouping label if needed for accessibility rather than another visible heading.                    |
| SIMPLIFY       | Four metric cards                                                                                                                                                                                                                  | Consolidate into one shared metrics strip with four columns on desktop and clean stacking on narrow screens.                                                             |
| REMOVE         | Per-metric accent strips, icon boxes, independent shadows, hover-border treatment, and captions such as `Active records in this workspace`, `Research → Pending`, `Total ask across tracked grants`, and `Recorded awards to date` | Labels and values already communicate the facts.                                                                                                                         |
| KEEP           | Useful Tracked grants and Open pipeline continuation links                                                                                                                                                                         | Preserve their current filtered Grant destinations, but keep the links visually quiet. Requested/Awarded do not need invented destinations.                              |
| SIMPLIFY       | Needs attention                                                                                                                                                                                                                    | Use one restrained urgency surface containing one Overdue value, oldest overdue age when applicable, one Due within 7 days value, and one `View deadlines` link.         |
| REMOVE         | Repeated visible strings such as `Overdue: N` alongside another large `N`, duplicate due-soon values, urgency icon boxes, top red strip, multiple simultaneous red treatments                                                      | One label and one number are sufficient.                                                                                                                                 |
| KEEP           | No-attention state                                                                                                                                                                                                                 | Use concise neutral-success text such as `No deadlines need attention.` without a decorative success pill. Keep `View deadlines` available as the one continuation path. |
| SIMPLIFY       | Upcoming deadlines                                                                                                                                                                                                                 | Keep the five-row title/Funder/date/status list. Use a quiet section heading and optional short `Next 30 days` context.                                                  |
| REMOVE         | Upcoming icon container, tinted header, verbose subtitle, empty-state icon, and footer Deadline link                                                                                                                               | The Dashboard already has one `View deadlines` path. Row links remain available.                                                                                         |
| SIMPLIFY       | Status breakdown                                                                                                                                                                                                                   | Keep all 11 status counts as links in lifecycle order.                                                                                                                   |
| REMOVE         | Relative bars, status icon container, lifecycle subtitle/total, and explanatory footer                                                                                                                                             | Counts/links are sufficient for the current portfolio and are easier to scan. No chart replaces them.                                                                    |
| REWRITE        | Empty/no-amount copy                                                                                                                                                                                                               | Use concise user language such as `No grants tracked yet`, `Import a spreadsheet or add a grant to get started.`, and `No amounts recorded yet.`                         |

### Grant List

| Classification | Current element                                                                                                                                                      | Decision and reason                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| KEEP           | Dense table, six current columns, status display, tag summary, sort buttons, row click/keyboard activation, search, filters, pagination, Add grant, Export portfolio | This remains the scan/filter/choose surface.                                                                                              |
| REMOVE         | Restating page subtitle                                                                                                                                              | `Grants` plus the working controls/table is enough.                                                                                       |
| SIMPLIFY       | Header actions                                                                                                                                                       | Keep `Add grant` visually primary and `Export portfolio` secondary. Decorative Plus icon on a clearly labeled text button may be removed. |
| KEEP           | Export accessible description                                                                                                                                        | Rewrite only for concise user language if needed; keep the exact `/export/portfolio` behavior.                                            |
| KEEP           | No-funder prerequisite notice and disabled Add grant behavior                                                                                                        | Rewrite to concise language: `Add a funder before creating a grant.`                                                                      |
| SIMPLIFY       | Filter options surface                                                                                                                                               | Preserve every filter, focus behavior, chip, URL behavior, and Clear all action. Reduce only unnecessary shadow/padding.                  |
| REMOVE         | Grant list surface shadow                                                                                                                                            | Border/table structure is enough; preserve dense row spacing.                                                                             |
| REWRITE        | True-empty state                                                                                                                                                     | `No grants yet` with `Add your first grant.` Remove spreadsheet-replacement language.                                                     |
| REWRITE        | Filter-empty state                                                                                                                                                   | `No grants match these filters.` with `Clear filters`. Do not add explanatory prose unless needed.                                        |
| KEEP           | Intentional internal table overflow on narrow screens                                                                                                                | Preserve dense table utility and prevent page-level overflow.                                                                             |

### Grant Detail Sheet

| Classification | Current element                                                                                                                | Decision and reason                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| KEEP           | Sheet, Grant title, Funder, Edit grant, status mutation, Open full grant, error/status feedback, dirty-form protection         | These are the quick inspection/action contract.                                                                                                     |
| SIMPLIFY       | Header                                                                                                                         | Show Grant title and Funder context. Do not add a separate Status badge if the visible Status control already represents current status.            |
| KEEP           | One visible current Status representation                                                                                      | The status select/action itself may serve as the single current Status presentation. Do not duplicate it in a summary card/badge in the same Sheet. |
| SIMPLIFY       | Quick context                                                                                                                  | Keep only Deadline, Amount requested with explicit currency, and Next steps in a simple definition/list layout.                                     |
| REMOVE         | Four mini summary cards                                                                                                        | Replace them with typography/alignment rather than card-per-field treatment.                                                                        |
| REMOVE         | Separate Status summary field/card                                                                                             | Status remains visible and actionable in the status control.                                                                                        |
| REMOVE         | Full Activity timeline                                                                                                         | Activity remains complete in Grant Workspace.                                                                                                       |
| RELOCATE       | Full TagManager                                                                                                                | Tag maintenance remains complete in Grant Workspace only. `Open full grant` is the explicit discoverability path.                                   |
| SIMPLIFY       | Action hierarchy                                                                                                               | Keep `Edit grant`, Status control/action, and `Open full grant`. Avoid three equal-weight boxed actions.                                            |
| REWRITE        | Description copy                                                                                                               | Use concise Funder context without `Grant details` implementation language.                                                                         |
| KEEP           | Existing Sheet width, focus trap, close behavior, mobile full-width behavior, internal scrolling, and status refresh semantics | No overlay/accessibility regression is allowed.                                                                                                     |

### Grant Workspace

| Classification | Current element                                                                                                                                   | Decision and reason                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KEEP           | Complete Grant record, Back to Grants, title, Funder context, Status, Edit/status actions, Overview, Notes, Tags, Activity, all structured fields | Workspace remains canonical and complete.                                                                                                                                                                                                                                                                                                                                                               |
| SIMPLIFY       | Header                                                                                                                                            | Use page spacing/typography for identity rather than a separate shadowed header card. Keep title, Funder name, human-readable Funder type, Website when present, Status, and record actions.                                                                                                                                                                                                            |
| REMOVE         | Funder and Status rows from Overview                                                                                                              | Both remain clearly represented in the header.                                                                                                                                                                                                                                                                                                                                                          |
| SIMPLIFY       | Main record composition                                                                                                                           | Use one coherent primary record surface with restrained dividers/sections instead of separate shadowed cards for every conceptual block.                                                                                                                                                                                                                                                                |
| KEEP           | Overview structured fields except duplicated Funder/Status                                                                                        | Amounts, dates, Award timeframe, Designation, County served, Next steps, and all other maintained fields remain available.                                                                                                                                                                                                                                                                              |
| KEEP           | Tags                                                                                                                                              | Tags remain complete in Workspace.                                                                                                                                                                                                                                                                                                                                                                      |
| KEEP           | Notes                                                                                                                                             | Notes remain complete in Workspace. Use `No notes yet` when empty.                                                                                                                                                                                                                                                                                                                                      |
| KEEP           | Activity                                                                                                                                          | Activity remains complete and newest-first in Workspace. Use `No activity yet` when empty.                                                                                                                                                                                                                                                                                                              |
| SIMPLIFY       | Currency presentation                                                                                                                             | For populated amounts, use one explicit code-aware currency format such as the equivalent of `Intl.NumberFormat(..., { style: "currency", currency, currencyDisplay: "code" })`, producing a single currency representation rather than manually prefixing code to a symbol-based result. Remove the standalone Currency row when at least one amount displays that explicit code-aware representation. |
| KEEP           | Persisted currency visibility when both amounts are null                                                                                          | When neither amount can carry the currency context, retain one compact `Currency` field so the complete stored record is still visible.                                                                                                                                                                                                                                                                 |
| REMOVE         | `Funder website: —` presentation                                                                                                                  | If no Funder website exists, omit the empty website line rather than narrating its absence in the header.                                                                                                                                                                                                                                                                                               |
| KEEP           | `GrantWorkspaceActions` client boundary and existing mutations                                                                                    | No broadened client state or behavior changes.                                                                                                                                                                                                                                                                                                                                                          |
| KEEP           | `max-w-6xl` constrained reading width                                                                                                             | Workspace is not a portfolio scanning surface.                                                                                                                                                                                                                                                                                                                                                          |

### Grant Form and Tag Manager

| Classification | Current element                                                                                                                                                          | Decision and reason                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KEEP           | All Grant fields, labels, validation, server errors, success/error live regions, create/edit payload distinction, separate status behavior, dirty dismissal confirmation | These are editing contracts and are untouched.                                                                                                                        |
| REMOVE         | Visible implementation-oriented edit description                                                                                                                         | `Edit grant` is self-explanatory. Keep an sr-only Sheet description if the underlying dialog semantics benefit from one.                                              |
| SIMPLIFY       | Create description                                                                                                                                                       | `Add grant` is largely self-explanatory. Keep only concise visible copy if actual Safari review shows it prevents ambiguity; otherwise prefer an sr-only description. |
| REWRITE        | Disabled Status helper during edit                                                                                                                                       | Keep a short ambiguity-preventing message such as `Change status with the status control.`                                                                            |
| KEEP           | Existing field semantics                                                                                                                                                 | Do not add unrelated `name`, autocomplete, validation, or payload work merely because this file is touched.                                                           |
| KEEP           | TagManager in Workspace                                                                                                                                                  | Preserve assigned tags, creation, removal, idempotency, feedback, and authorization.                                                                                  |
| REMOVE         | TagManager from quick Sheet                                                                                                                                              | Capability remains in Workspace.                                                                                                                                      |

### Deadline View

| Classification | Current element                                                                                                                              | Decision and reason                                                                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KEEP           | H1, `As of`, all three fixed H2 groups, title/Funder/date/status rows, Grant Sheet links, group empty messages, semantic lists/time elements | Exact Deadline behavior remains.                                                                                                                                                                                        |
| REMOVE         | Restating page subtitle                                                                                                                      | `Deadlines`, `As of`, and the three bucket headings communicate the screen.                                                                                                                                             |
| CONSOLIDATE    | Three independent shadowed cards                                                                                                             | Use one coherent bordered Deadline surface containing the three existing groups separated by clear dividers. Do not leave this composition decision open to BUILD.                                                      |
| KEEP           | Three semantic H2 group headings                                                                                                             | Overdue, Due in the next 7 days, Later in the next 30 days remain distinct and accessible.                                                                                                                              |
| SIMPLIFY       | Urgency styling                                                                                                                              | Overdue receives the strongest restrained destructive treatment; Due soon is clearly urgent but quieter; Later remains neutral. Use text/divider/accent treatment rather than separate tinted card headers and shadows. |
| KEEP           | Per-group empty rows                                                                                                                         | These preserve the exact fixed bucket structure and should remain visible.                                                                                                                                              |
| REWRITE        | No-grants/no-eligible copy                                                                                                                   | Use concise user language while retaining the one explanation necessary to avoid implying that excluded-status Grants have no deadlines.                                                                                |
| KEEP           | Exact server query and bucket contract                                                                                                       | No deadline behavior changes.                                                                                                                                                                                           |

### Funder List

| Classification | Current element                                                                            | Decision and reason                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KEEP           | Name, Type, Website columns; human-readable types; external Website links; selectable Name | The list remains compact and scan-oriented.                                                                                                               |
| REMOVE         | Restating page subtitle                                                                    | `Funders` plus the table/action is enough.                                                                                                                |
| REMOVE         | `Showing N funder(s)` footer                                                               | It does not support a decision and there is no pagination.                                                                                                |
| REMOVE         | Table shadow                                                                               | Border/table hierarchy is sufficient.                                                                                                                     |
| REWRITE        | Empty state                                                                                | Keep `No funders yet` with concise next-step language. Existing `Add funder` remains the action.                                                          |
| KEEP           | `max-w-6xl`                                                                                | A three-column list does not need to be stretched merely because denser portfolio surfaces widen. Do not widen Funders to `max-w-7xl` in this workstream. |

### Funder Detail Sheet and Form

| Classification | Current element                                                                                 | Decision and reason                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| KEEP           | Funder title, Type, Website, County served, Notes, Edit funder, feedback, dirty-form protection | These remain the complete maintenance contract.                                                       |
| REMOVE         | Duplicate `Name` definition row                                                                 | Sheet title already supplies identity.                                                                |
| REMOVE         | `Funder record details and maintenance fields.`                                                 | Implementation language.                                                                              |
| SIMPLIFY       | Header                                                                                          | Funder name as title and human-readable type as restrained secondary context.                         |
| SIMPLIFY       | Body                                                                                            | Website, County served, Notes.                                                                        |
| REWRITE        | Empty Notes copy                                                                                | `No notes yet`.                                                                                       |
| REMOVE         | Visible `Update the funder record without leaving your portfolio.` edit description             | `Edit funder` is self-explanatory. Preserve an sr-only description if needed for Sheet semantics.     |
| KEEP           | FunderForm fields/actions                                                                       | URL normalization, validation, create/edit, dirty protection, feedback, and refresh remain unchanged. |

### Portfolio Import

| Classification | Current element                                                                                                                                                                                                               | Decision and reason                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KEEP           | File selection, file/size constraints, analyze step, preview, counts, headers, mapping decisions, row provenance, invalid/warning/duplicate states, acknowledgement, server re-check, confirmation, completion counts/actions | These establish safe import and auditability.                                                                                                                           |
| REMOVE         | Marketing/implementation-language header copy                                                                                                                                                                                 | Prefer direct import language.                                                                                                                                          |
| REMOVE         | `Server-produced preview` badge                                                                                                                                                                                               | Preview origin is an implementation detail rather than a user decision. Server re-check/safety semantics remain where they matter.                                      |
| SIMPLIFY       | Count tiles                                                                                                                                                                                                                   | Consolidate each count group into one quiet summary strip or definition list rather than independent bordered mini-cards.                                               |
| SIMPLIFY       | Preview detail surfaces                                                                                                                                                                                                       | Related workbook recognition/mapping information may share one coherent preview surface when scanability remains clear.                                                 |
| KEEP           | Individual import-row boundaries                                                                                                                                                                                              | Each source row is an auditable decision unit and may remain a bordered row/card.                                                                                       |
| SIMPLIFY       | Import-row chrome                                                                                                                                                                                                             | Remove unnecessary shadow/nested decorative backgrounds while preserving every mapped field, preserved source value, warning, error, duplicate message, and source row. |
| REWRITE        | Header/phase copy                                                                                                                                                                                                             | Prefer `Import portfolio`, `Choose your workbook`, `Review import`, `Row decisions`, and similarly direct language.                                                     |
| REWRITE        | Acknowledgement                                                                                                                                                                                                               | Keep the safety meaning in concise user language.                                                                                                                       |
| REWRITE        | Completion copy                                                                                                                                                                                                               | Use `Import complete` and direct completion facts rather than marketing language.                                                                                       |
| KEEP           | `max-w-6xl`                                                                                                                                                                                                                   | Import remains a review/confirmation workflow.                                                                                                                          |

### Authenticated Shell and Navigation

| Classification | Current element                                                                                                                                                                       | Decision and reason                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KEEP           | AppShell, skip link, main landmark, desktop sidebar, collapse persistence, mobile navigation Sheet, current navigation routes, active-link behavior, Grants search, Profile, Sign out | Foundational access/workflows remain unchanged.                                                                                                                                                                                                                   |
| KEEP           | Organization name in desktop sidebar                                                                                                                                                  | This is the persistent desktop tenant identity.                                                                                                                                                                                                                   |
| SIMPLIFY       | Non-Grants top-navigation organization fallback                                                                                                                                       | Hide the duplicate organization name on desktop where the sidebar already shows it. Retain organization context on mobile; do not remove it universally.                                                                                                          |
| SIMPLIFY       | Account menu trigger                                                                                                                                                                  | Use the Avatar as the compact visible trigger with an accessible `Open account menu` name. Keep user name/email in the opened menu.                                                                                                                               |
| KEEP           | Account menu content                                                                                                                                                                  | User identity, Profile, Sign out, pending state, and failure feedback remain.                                                                                                                                                                                     |
| KEEP           | Navigation icons and existing navigation treatment                                                                                                                                    | Do not turn this workstream into a sidebar redesign.                                                                                                                                                                                                              |
| KEEP           | Existing shared UI primitives                                                                                                                                                         | Do not modify global Button transitions, Skeleton animation, Sheet elevation, or other generic primitives unless a changed surface proves a bounded correction is necessary for that surface and the correction returns to developer review if it broadens scope. |

## Width and Composition Contract

The width decisions are frozen enough to keep BUILD implementation-focused.

### Use `max-w-7xl`

- Dashboard
- Grant list
- Deadline View

These are dense portfolio/scanning surfaces and benefit from additional working width.

Safari Technology Preview validates the result, but BUILD does not defer whether to try these widths.

If a rendered result is materially worse, the task may revert that specific screen to `max-w-6xl` and record the visual reason in its receipt; it must not invent a different layout system.

### Keep `max-w-6xl`

- Grant Workspace
- Funder list
- Import

Rationale:

- Workspace is a record-reading surface.
- Funder list has only three columns and does not benefit from unnecessary horizontal stretch.
- Import is a review/confirmation surface with long content.

The composition baseline is:

- Page canvas carries the screen.
- Related information shares a coherent surface.
- Borders separate meaningful groups rather than every fact.
- Shadows are not default page-section styling.
- Typography and spacing establish hierarchy.
- A primary action is visually clear.
- Secondary actions do not compete.
- Narrow layouts stack naturally.
- Page-level horizontal overflow is prohibited.

## Functional Invariants

The UI pass must not alter:

- Dashboard query semantics, DTO fields, totals, stored currency behavior, Open pipeline status set, pre-submission status set, overdue count/oldest-age calculation, due-in-7 semantics, nearest-five behavior, status breakdown, or existing Grant filter URLs.
- Deadline query semantics, UTC date-only classification, exact five eligible statuses, disjoint overdue/due-soon/later buckets, unbounded eligible overdue rows, row ordering, `asOf` behavior, or `/grants?grant=<id>` navigation.
- Grant status vocabulary, including `Internal Review`, status-action authorization, same-status no-op behavior, Activity event semantics, or status display mapping.
- Grant list search, filter, sort, pagination, row click/keyboard activation, tag summary, Sheet URL state, create flow, and export route/contract.
- Grant Workspace complete record fields, amounts, stored currency, Award timeframe, Notes, Tags, Activity ordering/meaning, edit/status/tag behavior, server/client boundary, and route/not-found behavior.
- Funder list columns, human-readable type labels, external Website links, Add/Edit behavior, validation, URL normalization, dirty-form protection, and organization isolation.
- Import parsing, preview, acknowledgement, duplicate handling, row state/provenance, server authorization re-check, confirmation action, file limits, persistence, and completion result.
- Authentication, tenant isolation, organization authorization, AppShell landmarks, navigation destinations, sidebar persistence, mobile navigation, skip link, Sheet focus behavior, and account Profile/Sign out behavior.
- Database schema, migrations, indexes, query/domain contracts, action input contracts, import/export contracts, and persisted data.

Formatting Grant amounts with one explicit code-aware currency representation is a presentation change only; it must not change stored values, DTO values, amount precision, or supported currency behavior.

## Scope

### In scope

- Dashboard composition, copy, metrics-strip simplification, attention/upcoming/status reduction, and `max-w-7xl`.
- Grant list header/empty-state copy, table surface simplification, `max-w-7xl`, and preservation of dense scan/filter behavior.
- Grant detail Sheet simplification into quick inspection/actions, including relocation of complete Tags/Activity work to Workspace only.
- Grant Form visible-copy reduction directly required by changed Sheet/Workspace surfaces.
- Grant Workspace same-viewport redundancy cleanup, section composition simplification, and currency display cleanup while preserving the complete record.
- Deadline View consolidation into one coherent three-group surface and `max-w-7xl`.
- Funder list/detail Sheet copy/container cleanup.
- Import copy/container cleanup that preserves every safety and audit decision.
- Small authenticated shell identity de-duplication: desktop-only top-nav organization duplication and account-trigger identity duplication.
- Focused UI/accessibility tests needed to preserve behavior.
- Screenshot comparison and Safari Technology Preview gate.

### Explicitly out of scope

Do not add:

- new product features;
- new Dashboard metrics;
- new Grant/Funder fields;
- analytics;
- charts;
- new filters;
- new routes;
- new navigation;
- new document functionality;
- Draft/history;
- notifications;
- reminders;
- custom themes;
- dark mode work;
- animation work;
- branding redesign;
- logo work;
- new design system;
- large component-library replacement.

Do not change:

- schema;
- migrations;
- indexes;
- query/domain behavior;
- auth/tenancy;
- Grant status semantics;
- Deadline bucket semantics;
- import/export contracts;
- persisted data.

Also out of scope:

- generic Button transition refactoring;
- generic Sheet shadow/elevation changes;
- Skeleton/reduced-motion cleanup unrelated to a changed surface;
- adding form `name`/autocomplete metadata solely because forms are touched;
- generalized accessibility refactors beyond preserving/fixing semantics of the changed UI;
- new generic layout abstractions;
- converting the Grant list into cards;
- adding columns to Grant/Funder tables;
- making the quick Grant Sheet a second Workspace;
- widening Grant Workspace, Funders, or Import merely for visual consistency;
- changing existing generic placeholder behavior that is not rendered by the current authenticated product.

## Proposed Post-Approval Task Breakdown

Tasks are not created before explicit developer approval and GIT START.

Execute sequentially on `solo/ui-simplification` after the branch is created and verified.

### T001 - Dashboard composition

- Simplify `DashboardContent` to:
  - H1 + restrained As-of context;
  - one four-value metrics strip;
  - one restrained Needs attention surface;
  - compact Upcoming deadlines list;
  - count-only Status breakdown.
- Remove visible Portfolio totals heading/chrome, per-metric cards, accent strips, icon boxes, repeated captions, duplicate urgency values, relative status bars, explanatory footer copy, duplicate Deadline links, and decorative empty-state icons.
- Keep useful Tracked grants/Open pipeline links and one `View deadlines` path.
- Rewrite Dashboard empty/no-amount/no-attention/no-upcoming copy.
- Implement `max-w-7xl`.
- Preserve all existing dashboard query/DTO behavior.
- Update `src/test/dashboard-page.test.tsx` for:
  - one H1;
  - As-of context;
  - one metric grouping;
  - four metric values;
  - useful drill-down links;
  - one Deadline View link;
  - no repeated attention counts;
  - oldest-overdue singular/plural;
  - status count/link lifecycle order;
  - upcoming rows/empty state;
  - no unsupported query parameters;
  - narrow-safe structure.

### T002 - Grant list, quick Sheet, and form copy

- Simplify `GrantsPage` header/empty/list chrome and copy.
- Implement `max-w-7xl`.
- Preserve all six columns, dense table behavior, URL-backed search/filter/sort/pagination, row keyboard behavior, tags, Add grant, Sheet state, and Export portfolio.
- Keep Add grant primary and Export portfolio secondary.
- Reduce `GrantDetailSheet` to:
  - Grant title;
  - Funder context;
  - one visible current Status representation through the status control;
  - Deadline;
  - Amount requested with explicit currency;
  - Next steps;
  - Edit grant;
  - status action;
  - Open full grant;
  - existing feedback.
- Replace mini summary cards with a restrained definition/list layout.
- Remove Sheet Activity and TagManager.
- Preserve the full Workspace path as the discoverability path to Tags/Activity.
- Remove/rewrite visible GrantForm explanatory copy directly involved in create/edit Sheet composition.
- Keep the short edit-status helper because the form intentionally does not own status changes.
- Do not change field contracts or add unrelated form metadata.
- Update `src/test/grant-ui.test.tsx` for:
  - exact quick-Sheet contract;
  - absence of duplicate Status/Activity/Tags;
  - Workspace link;
  - status action;
  - list behavior;
  - empty copy;
  - export;
  - filters;
  - pagination;
  - create/edit validation/payload;
  - refresh;
  - dirty protection;
  - semantic controls/focus.

### T003 - Grant Workspace and Deadline View

- Simplify Grant Workspace header by removing independent card elevation/chrome.
- Remove Funder and Status from Overview because they remain present in the header.
- Preserve every other maintained structured field.
- Use one coherent primary Workspace surface with restrained internal section boundaries rather than independent shadowed Overview/Notes/Activity cards.
- Keep Notes, Tags, and Activity complete.
- Use code-aware explicit currency formatting for populated amounts without manual code-plus-symbol duplication.
- Remove standalone Currency when at least one amount visibly carries explicit currency code.
- Keep one Currency field when both amounts are null.
- Omit an empty Funder Website line from header context.
- Keep Workspace at `max-w-6xl`.
- Consolidate Deadline View into one bordered surface containing all three existing semantic groups separated by dividers.
- Implement Deadline View at `max-w-7xl`.
- Remove page subtitle, card-per-group shadows, tinted card headers, and redundant chrome.
- Preserve exact urgency order and bucket/query semantics.
- Update `src/test/grant-ui.test.tsx` and `src/test/deadline-view.test.tsx` for:
  - no same-viewport duplicate Funder/Status;
  - complete Workspace fields;
  - explicit currency in populated/empty-amount cases;
  - Notes/Tags/Activity continuity;
  - long text;
  - exact Deadline group headings/order;
  - row data/links/time values/status;
  - per-group empty states;
  - semantic/focus behavior.

### T004 - Funder surfaces and bounded shell de-duplication

- Remove Funder page subtitle, count footer, and list shadow.
- Keep exactly Name/Type/Website columns.
- Keep Funder list at `max-w-6xl`.
- Simplify Funder detail Sheet to:
  - title = Funder name;
  - human-readable type as secondary header context;
  - Website;
  - County served;
  - Notes;
  - Edit funder.
- Remove duplicate Name row and implementation-language visible descriptions.
- Keep sr-only Sheet descriptions where dialog semantics need them.
- Preserve all Funder form/edit behavior and dirty protection.
- In TopNavigation, remove/hide the non-Grants organization fallback on desktop only; retain organization context on mobile.
- Simplify AccountMenu closed trigger to the Avatar with an accessible `Open account menu` name.
- Keep user name/email inside the opened menu along with Profile, Sign out, pending state, and failure feedback.
- Do not redesign sidebar/mobile navigation or shared primitives.
- Update Funder and shell tests only for these bounded changed contracts.

### T005 - Import copy and container reduction

- Keep the safe Import workflow intact.
- Remove implementation/marketing copy such as `Server-produced preview` and product-pitch phrasing.
- Rewrite phase headings/copy in direct user language.
- Consolidate preview/completion count tiles into quiet grouped summaries rather than independent mini-cards.
- Reduce nested shadow/background treatment around preview metadata.
- Preserve individual row boundaries because each source row is an auditable decision unit.
- Reduce row shadows/nested decorative backgrounds only.
- Preserve every:
  - mapped field;
  - source row;
  - Funder decision;
  - preserved source value;
  - warning;
  - error;
  - duplicate message;
  - acknowledgement;
  - server re-check;
  - confirmation;
  - completion count/action.
- Keep Import at `max-w-6xl`.
- Keep all parser/action/server behavior unchanged.
- Update `src/test/portfolio-import-ui.test.tsx` only for changed hierarchy/copy while preserving all safety semantics.

No task may change query/domain behavior, persistence, schema, auth/tenancy, import/export contracts, or unsupported navigation.

A discovered need for any such change, a new design system, or generalized shared-primitive work must stop BUILD and return to PLAN rather than expanding silently.

## Acceptance

1. `dispatch/ACTIVE.md` remains clear during PLAN; no BUILD task, execution branch, application implementation, or production build exists before explicit approval and GIT START.
2. Dashboard has one clear H1 and restrained As-of context without a restating subtitle.
3. Dashboard has no visible `Portfolio totals` heading required merely to introduce the metric values; the four metrics form one coherent accessible summary strip.
4. Dashboard metrics retain Tracked grants, Open pipeline, Requested, and Awarded values and useful existing drill-down links without per-metric cards, icon boxes, accent strips, repeated captions, or individual shadows.
5. Dashboard Needs attention presents Overdue and Due within 7 days exactly once each, retains oldest-overdue age when applicable, uses restrained urgency styling, and exposes one clear `View deadlines` path.
6. Dashboard Upcoming deadlines retains its useful five-row title/Funder/date/status content without another Deadline footer link, decorative heading icon, tinted header, or verbose subtitle.
7. Dashboard Status breakdown retains all current status counts and Grant-filter links in lifecycle order without relative bars or explanatory visualization copy.
8. Dashboard empty, no-amount, no-attention, and no-upcoming states are concise and contain no spreadsheet-replacement/product-pitch copy.
9. Dashboard uses `max-w-7xl` and remains usable on narrow/mobile widths without page-level overflow.
10. Grant list uses `max-w-7xl`, retains dense table behavior, all six columns, status/tag display, search, filters, sorting, pagination, row click/keyboard activation, create, export, Sheet opening, and URL state.
11. Grant list no longer shows a restating page subtitle, spreadsheet-replacement empty copy, unnecessary table shadow, or redundant instructional language.
12. Grant list empty states retain Add grant/Clear filters discoverability and the no-funder prerequisite remains clear.
13. Grant detail Sheet is a quick-inspection/action surface containing Grant title, Funder, one current Status representation, Deadline, Amount requested with explicit currency, Next steps, Edit grant, status action, and Open full grant.
14. Grant detail Sheet has no duplicate Status summary, Activity timeline, or TagManager.
15. Activity and Tag maintenance remain complete in Grant Workspace and are reachable through the visible Open full grant action.
16. Grant detail Sheet preserves status mutation, feedback live regions, dirty Grant edit protection, URL-encoded Workspace navigation, Sheet close/focus behavior, and mobile width.
17. Grant Workspace remains the complete canonical Grant record with every maintained structured field, Award timeframe, Notes, Tags, Activity, amounts, dates, Next steps, and stored currency visibility.
18. Grant Workspace no longer repeats Funder or Status in Overview when both remain clear in the header.
19. Populated Workspace amounts use one explicit code-aware currency representation without manual duplicate code+symbol output.
20. Workspace has no standalone Currency row when at least one amount carries explicit currency code; when both amount values are null, Currency remains visibly represented once.
21. Grant Workspace retains Notes, Tags, and Activity as complete sections but no longer relies on separate shadowed card-per-section composition.
22. Grant Workspace remains `max-w-6xl`.
23. Deadline View uses one coherent bordered three-group surface at `max-w-7xl`.
24. Deadline View preserves the exact three group headings, rows, deep links, time semantics, per-group empty states, and existing bucket/query behavior.
25. Deadline View removes the restating subtitle, three-card shadow composition, and tinted card-header chrome while keeping Overdue visually strongest, Due soon clearly urgent, and Later neutral.
26. Funder list retains exactly Name, Type, Website, current selection behavior, and external links.
27. Funder list removes its restating subtitle, count footer, and unnecessary table shadow and remains `max-w-6xl`.
28. Funder detail Sheet uses Funder name + human-readable Type as header identity and Website/County served/Notes as body content; duplicate Name row and implementation-language descriptions are absent.
29. Funder add/edit behavior preserves all fields, validation, URL normalization, dirty confirmation, feedback, refresh, and organization isolation.
30. Import preserves all safety/audit information and behavior while reducing count-tile/card chrome and implementation/marketing copy.
31. Import retains individual source-row boundaries and every mapped/provenance/warning/error/duplicate decision.
32. Desktop non-Grants top navigation no longer repeats organization identity already visible in the desktop sidebar.
33. Mobile organization context remains available and is not removed by the desktop de-duplication.
34. Account-menu trigger no longer duplicates visible user name/email that are already shown inside the opened menu; it retains an accessible trigger name and all account actions/states.
35. Sidebar, navigation routes, mobile navigation, collapse persistence, skip link, Profile, Sign out, and Grants search remain unchanged.
36. This workstream introduces no generic Button/Skeleton/Sheet primitive redesign, unrelated form metadata work, animation work, new design tokens, or new design system.
37. All changed headings remain hierarchical; links are links; actions are buttons; form controls remain labeled; accessible descriptions remain where needed; feedback keeps status/alert semantics; focus remains visible.
38. Narrow/mobile layouts do not create page-level horizontal overflow. Grant table internal horizontal scrolling remains allowed.
39. No schema, migration, query/domain, auth/tenancy, status, deadline, import/export, or persisted-data behavior changes are made.
40. Focused UI/accessibility tests cover every changed surface and preserve the supplied behavior baseline apart from intentional copy/structure assertions.
41. Normal Node 26 validation passes after BUILD, including full tests, PostgreSQL integration, lint, TypeScript, Prisma verification, production build, and `git diff --check`.
42. Safari Technology Preview confirms the qualitative result across all required desktop/narrow surfaces and explicit human approval is received before merge or GIT END.

## Validation Expectations

### Focused UI and accessibility coverage

Update or add only the smallest focused assertions needed for the changed surfaces.

- Dashboard:
  - one H1;
  - As-of context;
  - one metric grouping;
  - four metric labels/values;
  - tracked/open-pipeline links;
  - one Deadline View link;
  - no repeated Overdue/Due-within-7 values;
  - oldest-overdue singular/plural;
  - status count/link order;
  - Upcoming rows/empty state;
  - no unsupported query parameters;
  - no decorative icon dependency;
  - narrow-safe layout.

- Grant list:
  - heading/copy;
  - Add grant and Export portfolio;
  - no-funder prerequisite;
  - filter chips/options/Clear all;
  - all six sortable columns;
  - row semantics and keyboard activation;
  - Tags;
  - pagination;
  - true-empty/filter-empty states;
  - export accessible description;
  - internal table overflow only.

- Grant Sheet:
  - title/Funder;
  - one visible current Status representation;
  - Deadline/Amount requested/Next steps only as quick context;
  - no separate Status summary;
  - no Activity;
  - no TagManager;
  - Edit/status/Open full grant;
  - encoded Workspace href;
  - feedback roles;
  - mutation/refresh behavior;
  - dirty protection;
  - Sheet close/focus.

- Grant Workspace:
  - H1/section hierarchy;
  - header identity;
  - absence of duplicate Funder/Status in Overview;
  - all remaining structured fields;
  - code-aware populated amount currency representation;
  - Currency field when both amounts are absent;
  - Notes/Tags/Activity;
  - Activity ordering;
  - edit/status/tag behavior;
  - long-text wrapping;
  - focus/link semantics.

- Deadline View:
  - fixed three headings/group order;
  - row fields/deep-links/time values/status labels;
  - group empty rows;
  - no invented controls/filters;
  - long title/Funder wrapping;
  - semantic list/section/focus behavior;
  - no query/bucket regression.

- Funder list/Sheet:
  - exact three columns;
  - human-readable types;
  - external Website link;
  - no count footer;
  - empty state;
  - title/type/body Sheet contract;
  - absent duplicate Name row;
  - Edit action;
  - feedback;
  - dirty close behavior;
  - long values/focus.

- Import:
  - file selection does not analyze automatically;
  - preview/acknowledgement/confirmation;
  - all safety-critical counts and row decisions;
  - invalid/warning/duplicate content;
  - no-valid-row blocking;
  - completion actions;
  - labels/live regions/focus;
  - no import-contract change.

- Shell:
  - skip link/landmarks;
  - nav routes/current state;
  - desktop collapse persistence;
  - mobile navigation behavior;
  - mobile organization context;
  - desktop non-Grants organization de-duplication;
  - Grants search;
  - Avatar account trigger accessible name;
  - menu user identity;
  - Profile/Sign out/pending/error.

Tests must assert behavior and semantics rather than brittle implementation class lists except where a width/overflow contract is explicitly part of this workstream.

### Browser visual gate

After BUILD, VALIDATE, and REVIEW, stop at `READY_FOR_USER`.

Safari Technology Preview is the required human visual/browser environment.

Automated tests do not substitute for it.

Human comparison must inspect the rendered application:

- Dashboard desktop and narrow:
  - wider working canvas;
  - metric strip;
  - useful whitespace;
  - restrained urgency;
  - one Deadline path;
  - upcoming scanability;
  - status counts;
  - no lost information.

- Grant list desktop and narrow:
  - `max-w-7xl`;
  - dense table;
  - filters/actions;
  - empty states;
  - internal table overflow only;
  - row focus/Sheet opening.

- Grant Sheet:
  - title/Funder/status;
  - quick context;
  - clear action hierarchy;
  - absence of Activity/Tag duplication;
  - Workspace discoverability;
  - mobile Sheet behavior;
  - focus/close behavior.

- Grant Workspace:
  - complete record hierarchy;
  - no repeated Funder/Status;
  - cleaner amount/currency display;
  - Notes/Tags/Activity continuity;
  - long content;
  - constrained reading width;
  - action hierarchy.

- Deadline View:
  - one coherent three-group surface;
  - restrained urgency;
  - row readability;
  - empty groups;
  - links/focus;
  - wider scan surface without sprawl.

- Funder list and Sheet:
  - compact list;
  - no count footer;
  - title/type/body clarity;
  - long values;
  - edit entry;
  - dirty protection.

- Import:
  - preview/confirmation hierarchy;
  - safety warnings;
  - row audit detail;
  - reduced mini-card nesting;
  - narrow readability;
  - no hidden safety content.

- Shell:
  - desktop organization de-duplication;
  - mobile organization context;
  - compact account trigger;
  - menu identity/actions.

Also inspect:

- true/filter empty states;
- loading/error states;
- keyboard focus;
- Sheet focus trap;
- long content;
- sufficient contrast;
- absence of page-level horizontal overflow.

Success means:

- fewer visible containers;
- fewer repeated words;
- fewer repeated facts;
- fewer decorative elements;
- clearer primary actions;
- more useful whitespace;
- calmer information hierarchy.

The result must not feel emptier because information or functionality was lost.

It should feel clearer because unnecessary interface was removed.

## Repository Gates After BUILD

Run and report exactly what ran under Node 26:

- Focused changed-surface UI/accessibility tests first.
- `npm run test:run`.
- PostgreSQL integration suites with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` available; never print the value, trace it, or write it to tracked files.
- PostgreSQL integration must not be silently accepted as skipped when the variable is available.
- `npm run lint`.
- `npx tsc --noEmit`.
- `npm run verify:prisma`.
- `npm run build`.
- `git diff --check`.
- Final `git status` and diff inspection confirming only approved UI, test, and planning paths changed.

Current pre-workstream baseline:

- 292 tests passed
- 0 skipped

Counts may increase.

No validation or production build is run during this planning gate.

No database/schema change is expected or permitted.

## Human Approval Gate

This Feature workstream must stop at `READY_FOR_USER` after implementation validation and review.

Do not merge or perform GIT END until the developer explicitly approves the Safari Technology Preview result.

The explicit approval must cover the qualitative outcome:

- The UI is visibly quieter rather than merely restyled.
- Useful data remains findable.
- No complete Grant/Funder/import workflow was lost.
- Dashboard/Grants/Deadlines have useful breathing room without sprawl.
- Workspace reading width remains appropriate.
- Sheet and Workspace have clearly different jobs.
- Urgency is clear without a wall of red.
- Copy reads as normal daily-work language rather than implementation or marketing prose.
- Desktop, narrow/mobile, empty, long-content, keyboard-focus, and overlay states are acceptable.
- Shell de-duplication does not remove mobile context.

## Concerns and Decisions for Developer Review

- **Approval state:** `dispatch/ACTIVE.md` remains clear during PLAN. The workstream becomes active only after explicit approval and GIT START.
- **Base:** This plan is based on current post-Data-Export `main` at `08181a9`, not on older visual workstream snapshots.
- **Width:** Dashboard, Grant list, and Deadline View move to `max-w-7xl` as the leading implementation contract. Workspace, Funders, and Import remain `max-w-6xl`.
- **Dashboard composition:** Metrics become one strip; Needs attention becomes one restrained section; Upcoming remains a compact list; Status becomes count-only. This is the largest visual reduction in the workstream.
- **Dashboard Deadline destination:** One `View deadlines` continuation goes to `/deadlines`. Existing Grant row/status drill-down links remain where they still serve distinct decisions.
- **Sheet Status:** The visible status control is the one current Status presentation. Do not add a second header badge or summary Status field merely for decoration.
- **Sheet Tags/Activity:** Tags and Activity are deliberately removed from the Sheet because the full Workspace already owns them. No capability is removed from GrantFlow.
- **Workspace currency:** Populated amounts use one explicit code-aware currency format instead of manually combining code plus a symbol-based currency string. A standalone Currency field remains only when both amounts are absent and cannot otherwise communicate the stored currency.
- **Deadline composition:** Use one coherent bordered surface with three semantic sections, not three independent cards.
- **Funder width:** Funders remain `max-w-6xl`; widening a sparse three-column table would create empty stretch rather than useful workspace.
- **Import density:** Import remains detail-heavy by design. Reduce chrome and copy, not safety/audit information.
- **Shell identity:** Desktop top-nav organization identity is redundant with the persistent sidebar; mobile context is not. De-duplicate desktop only.
- **Account trigger:** Avatar-only visible trigger is accepted because full user identity remains in the opened menu and the trigger retains an accessible name.
- **Shared UI:** Generic Button transition, Sheet elevation, Skeleton motion, form metadata, and unrelated primitive cleanup are not part of this workstream.
- **Accessibility:** Visible copy may be removed only when semantics remain clear. Accessible descriptions, labels, feedback regions, focus handling, and hidden text remain when needed.
- **No architecture artifact:** `ARCHITECTURE.md` is not required unless BUILD discovers a genuinely cross-cutting structural requirement. Such discovery returns to planning rather than expanding silently.
- **Validation timing:** The supplied 292 passed / 0 skipped baseline is recorded for reconciliation. Planning does not claim fresh validation results.
- **Final state:** After VALIDATE and REVIEW, stop at `READY_FOR_USER`; human Safari approval is required before merge/GIT END.

## References

- `PRODUCT.md`
- `AGENTS.md`
- `dispatch/ACTIVE.md`
- `dispatch/COMPLETED.md`
- `src/components/dashboard/dashboard-content.tsx`
- `src/components/grants/grants-page.tsx`
- `src/components/grants/grant-detail-sheet.tsx`
- `src/components/grants/grant-workspace.tsx`
- `src/components/grants/grant-workspace-actions.tsx`
- `src/components/grants/grant-form.tsx`
- `src/components/grants/tag-manager.tsx`
- `src/components/grants/grants-search.tsx`
- `src/components/deadlines/deadline-view.tsx`
- `src/components/funders/funder-page.tsx`
- `src/components/funders/funder-list.tsx`
- `src/components/funders/funder-detail-sheet.tsx`
- `src/components/funders/funder-form.tsx`
- `src/components/import/portfolio-import-page.tsx`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/desktop-sidebar.tsx`
- `src/components/layout/navigation-list.tsx`
- `src/components/layout/mobile-navigation.tsx`
- `src/components/layout/top-navigation.tsx`
- `src/components/layout/account-menu.tsx`
- `src/components/layout/navigation-config.ts`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/avatar.tsx`
- `src/app/globals.css`
- `src/app/(authenticated)/(org-required)/layout.tsx`
- `src/app/(authenticated)/(org-required)/dashboard/page.tsx`
- `src/app/(authenticated)/(org-required)/grants/page.tsx`
- `src/app/(authenticated)/(org-required)/funders/page.tsx`
- `src/app/(authenticated)/(org-required)/deadlines/page.tsx`
- `src/app/(authenticated)/(org-required)/import/page.tsx`
- `src/app/(authenticated)/(org-required)/loading.tsx`
- `src/app/(authenticated)/(org-required)/grants/loading.tsx`
- `src/app/(authenticated)/(org-required)/funders/loading.tsx`
- `src/app/(authenticated)/(org-required)/error.tsx`
- `src/app/(authenticated)/(org-required)/grants/error.tsx`
- `src/app/(authenticated)/(org-required)/funders/error.tsx`
- `src/lib/queries/dashboard.ts`
- `src/lib/queries/deadlines.ts`
- `src/lib/queries/grants.ts`
- `src/lib/queries/funders.ts`
- `src/lib/queries/tags.ts`
- `src/lib/clerk/authorization.ts`
- `src/types/dashboard.ts`
- `src/types/deadline.ts`
- `src/types/grant.ts`
- `src/types/funder.ts`
- `src/test/dashboard-page.test.tsx`
- `src/test/grant-ui.test.tsx`
- `src/test/grant-workspace-route.test.ts`
- `src/test/deadline-view.test.tsx`
- `src/test/deadlines-route.test.ts`
- `src/test/funder-ui.test.tsx`
- `src/test/portfolio-import-ui.test.tsx`
- `src/test/app-shell.test.tsx`
- `src/test/account-menu.test.tsx`
- `src/test/desktop-sidebar.test.tsx`
- `src/test/mobile-navigation.test.tsx`
- `src/test/navigation-list.test.tsx`
- `package.json`
- `vitest.config.ts`
- `screenshots/dashboard.png`
- `screenshots/grants.png`
- `screenshots/dashboard-slideover.png`
- `screenshots/grant-detail.png`
- `screenshots/deadlines.png`
- `screenshots/funders.png`
- Relevant guidance: `solo-flow`, `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`
