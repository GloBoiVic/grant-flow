# GF-GRANT-003 — Grant Detail and Contextual Review

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-GRANT-003 |
| **Phase** | Phase 1 — Core Grant Tracker |
| **Status** | Planned |
| **Product Goal** | Provide two-tier grant detail access: quick contextual review via slide-over drawer and full-depth editing via dedicated page |
| **MVP Classification** | MVP Core |
| **Roadmap Link** | [Phase 1 — Core Grant Tracker](../../roadmap.md#6-phase-1-core-grant-tracker) |

---

## 1. Feature

Two complementary grant detail experiences. The **slide-over drawer** (480px right-side panel) opens from any grant list or dashboard view for quick contextual review — identity, status, deadline, amounts, owner, next steps, and primary actions. The **full grant detail page** provides the complete grant view with all fields, activity history, documents, tags, and editing capabilities.

## 2. Purpose

Grant professionals constantly switch between scanning their portfolio and diving into individual grant details. The slide-over preserves list context for quick triage; the full page supports sustained work. This dual pattern, visible in `screenshots/`, replaces the spreadsheet practice of scrolling horizontally through endless columns.

## 3. User Outcome

Users can review a grant's key information without leaving their current view (list, dashboard, deadlines). When deeper work is needed — editing multiple fields, reviewing history, managing documents — they open the full detail page with the same information architecture and visual vocabulary.

## 4. Scope

- Slide-over drawer (480px) with grant summary: title, status badge, funder, deadline, amounts, owner, next steps, tags
- Slide-over actions: edit (opens full page), advance status, add activity/note, navigate to full detail
- Full grant detail page: all grant fields, editable form, activity timeline, document list, tag management
- Progressive disclosure within both views: summary first, then supporting details
- Consistent information ordering across drawer and full page
- Drawer close: close button, Escape, scrim click, browser back

## 5. Out of Scope

- Intercepted route implementation for the drawer (open decision — may use `(.)` intercepting routes or client-managed state)
- Inline editing within the drawer (drawer is review-focused; edits open the full page)
- Grant comparison or side-by-side view
- Print or export of grant detail
- Document management within grant detail (GF-DOCUMENT-001 — but document list is shown as a reference)
- Activity history within grant detail (GF-ACTIVITY-001 — but activity timeline is shown as a reference)

## 6. User Stories

- As a **grant professional**, I want to click a grant from the list so that I can quickly review its key information without losing my place.
- As a **grant professional**, I want to advance a grant's stage from the drawer so that I can triage quickly.
- As a **grant professional**, I want to open the full grant page so that I can edit all fields and review history.
- As a **grant professional**, I want to see activity history on the grant page so that I understand what has happened.
- As a **grant professional**, I want to see associated documents on the grant page so that I can find related files.

## 7. Functional Requirements

1. **Slide-over drawer** opens from any grant list, dashboard card, or deadline view row click.
2. **Drawer content** (disclosure order): title + status badge, funder name, deadline date with urgency treatment, financial summary (requested/awarded), owner name, next steps, tags, quick actions.
3. **Drawer actions:** "Open full detail" (primary action), "Advance status" (dropdown or button), "Add note" (opens inline or drawer expansion).
4. **Full detail page** at `/grants/[id]` with editable form showing all grant fields.
5. **Full page sections:** identity and status → deadline and financial → owner and tags → next steps → notes → activity timeline → documents.
6. **Drawer does not include editing** beyond stage change and quick notes. For full editing, navigate to the full page.
7. **Drawer close** via: close button (X), Escape key, scrim click, browser back (if drawer was opened as a route).
8. **Drawer does not resize the underlying content** — it overlays with a scrim.

## 8. Business Rules

1. Drawer and full page share the same information ordering per `context/design.md` §4.
2. Unsaved changes in the full detail page trigger a warning before navigation away.
3. Stage advancement from the drawer uses the same validation and activity logging as the full page.
4. Drawer width is fixed at 480px on desktop. Smaller viewports: near-full-width sheet.

## 9. User Experience

- Drawer slides in from the right with scrim overlay (220ms animation per `globals.css` motion tokens).
- Drawer header shows grant title and close button. Body scrolls if content exceeds viewport.
- Status badge in drawer header uses the status color mapping from `context/design.md` §7.
- Deadline shows days remaining or overdue treatment.
- Full detail page matches `screenshots/grant-detail.png`.
- Full page form uses grouped fields, inline validation, save action.
- Information disclosure follows the order: identity and lifecycle status → deadline/urgency and financial summary → owner, tags, and next steps → documents → activity/history → notes and metadata.

## 10. Data Requirements

Drawer query fields: grant id, title, status, funder name, deadline, amountRequested, amountAwarded, currency, owner name, nextSteps, tags (array). Full page: all Grant entity fields plus related Activity, Document, and Tag data.

## 11. Permissions

- All roles can view grant detail (drawer and full page)
- Edit capability on full page is role-dependent (ADMIN, MEMBER can edit; VIEWER is read-only)

## 12. States

| State | Behavior |
|---|---|
| **Drawer loading** | Skeleton matching drawer content geometry |
| **Drawer open** | Slides in from right, scrim behind, underlying content visible behind scrim |
| **Drawer error** | Error state in drawer with retry |
| **Full page loading** | Skeleton for full page sections |
| **Full page error** | Error state with retry |
| **Grant not found** | 404 "Grant not found" with link back to grant list |
| **Editing (full page)** | Inline validation, server validation, save in progress, success toast |

## 13. Acceptance Criteria

- [ ] Clicking a grant row opens the slide-over drawer
- [ ] Drawer displays all key grant information (title, status, funder, deadline, amounts, owner, next steps, tags)
- [ ] Drawer actions work: advance status, add note, open full detail
- [ ] Drawer closes via close button, Escape, scrim click
- [ ] Full grant detail page renders at `/grants/[id]`
- [ ] Full page shows all grant fields, editable
- [ ] Full page sections are organized per disclosure order
- [ ] Both drawer and full page show correct information ordering
- [ ] Drawer matches `screenshots/grant-detail.png` (slide-over and full page screenshots)

## 14. Dependencies

- GF-DATA-001 (Grant table, related tables)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell, navigation)
- GF-GRANT-001 (grant records to display)
- GF-GRANT-002 (grant list as entry point to drawer)
- GF-TAG-001 (tag display within grant detail)
- GF-ACTIVITY-001 (activity timeline on full page)
- GF-DOCUMENT-001 (document list on full page — reference only)

**Resolved decisions:**
- **Grant semantics** — One Grant = one specific opportunity/application cycle. Repeated annual submissions are distinct Grant records for the same Funder.

**Remaining unresolved decisions (do not block GF-GRANT-003):**
- Drawer route mechanism: intercepting route (`(.)[id]`) vs. client-managed drawer state. Resolve during implementation.

## 15. Completion Criteria

- All acceptance criteria pass
- Drawer and full page match screenshot designs
- Information ordering is consistent between drawer and full page
- Drawer preserves list context (underlying page is visible behind scrim)
- Full page supports all grant editing operations

---

*Spec references: `context/design.md` §§4, 9, `context/architecture.md` §10 (drawer routing), `screenshots/grant-detail.png`*
