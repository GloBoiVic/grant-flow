# GF-COLLAB-001 — Collaboration Workflows

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-COLLAB-001 |
| **Phase** | Phase 3 — Post-MVP Portfolio Insights and Operational Enhancements |
| **Status** | Future |
| **Product Goal** | Enable team collaboration on grants through comments, @mentions, and shared views |
| **MVP Classification** | Post-MVP |
| **Roadmap Link** | [Phase 3 — Post-MVP Portfolio Insights](../../roadmap.md#8-phase-3-post-mvp-portfolio-insights-and-operational-enhancements) |

---

## 1. Feature

Collaboration features that enable team members to communicate within GrantFlow: comments on grants, @mentions to notify specific users, shared view capabilities, and activity feeds that surface team member actions.

## 2. Purpose

Grant professionals work in teams of 1–10. Current collaboration relies on email, chat, and meetings. GF-COLLAB-001 brings collaboration into the grant context, reducing context-switching and ensuring discussions are tied to the relevant grant record.

## 3. User Outcome

Team members can leave comments on grants, @mention colleagues to draw attention, see activity from other team members, and share filtered views of the grant portfolio.

## 4. Scope

- Comments on grants (text, with author and timestamp)
- @mention support (notifies mentioned user via in-app notification)
- Comment editing and deletion (author only)
- Activity feed showing team member actions
- Shared/copied view URLs (share a filtered grant list view)
- Comment visibility on grant detail (slide-over and full page)

## 5. Out of Scope

- Real-time collaboration (live cursors, concurrent editing)
- Document comments or annotations
- Approval workflows or stage-gate reviews
- Team workspaces or project management
- Chat or direct messaging
- Version control or change requests
- Grant assignment workflows

## 6. User Stories

- As a **grant professional**, I want to comment on a grant so that I can share my thoughts with the team.
- As a **grant professional**, I want to @mention a colleague so that they know to review a grant.
- As a **grant professional**, I want to see recent team activity so that I know what my colleagues are working on.
- As a **grant professional**, I want to share a filtered grant view so that my colleague sees the same data I see.

## 7. Functional Requirements

1. **Comments** — user can add a text comment to a grant. Comment includes author name, timestamp, and content.
2. **@mentions** — typing @ in a comment triggers a user picker filtered to org members. Selected user receives a notification.
3. **Comment editing** — author can edit their own comment within a time window (e.g., 15 minutes).
4. **Comment deletion** — author can delete their own comment. Comments are hard-deleted (or soft-deleted with a "deleted by author" placeholder).
5. **Activity feed** — shows team member actions on grants (stage changes, document uploads, comments).
6. **Share view** — grant list URL with current filter/sort state is copyable. Anyone with access can open the same view.
7. **Comment list** displayed on grant detail page, integrated with the activity timeline or as a separate section.

## 8. Business Rules

1. Comments are visible to all org members (not private).
2. @mentioned users receive an in-app notification (per GF-NOTIFY-001).
3. Comment edits retain original author and timestamp. A secondary "edited" timestamp may be shown.
4. Deleted comments show "[deleted by author]" placeholder to preserve conversation context.
5. Comments are scoped to a single grant. No cross-grant comments.

## 9. User Experience

- Comment section on grant detail page below activity timeline.
- Comment input: textarea with @mention autocomplete.
- Comment display: compact list with avatar, name, timestamp, content.
- @mention highlights in blue; hovering shows the mentioned user's name.
- Edit/delete actions visible on own comments via dropdown or inline actions.
- Share view: copyable URL near filter controls with "Copy view link" button.

## 10. Data Requirements

**Comment entity (new table):**
- `id` (UUID), `organizationId` (FK → Organization), `grantId` (FK → Grant), `authorId` (FK → User), `content` (text), `editedAt` (timestamptz?), `deletedAt` (timestamptz?), `createdAt` (timestamptz)

## 11. Permissions

| Role | Comment Access |
|---|---|
| **ADMIN** | Read all comments; edit/delete own; delete any |
| **MEMBER** | Read all comments; add, edit, delete own |
| **VIEWER** | Read only |

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton comments |
| **Empty (no comments)** | "No comments yet. Start the conversation." |
| **Normal** | Comment list with input area |
| **@mention** | User picker dropdown; mentioned user receives notification |
| **Editing** | Inline edit replaces comment text |
| **Deleted** | "[deleted by author]" placeholder |
| **Share view** | URL copied confirmation toast |

## 13. Acceptance Criteria

- [ ] Comments can be added to grants
- [ ] @mention works and sends notification
- [ ] Comments can be edited (own comments, time window)
- [ ] Comments can be deleted (own; admin can delete any)
- [ ] Comment list displays on grant detail page
- [ ] Share view copies URL with current filters
- [ ] Activity feed shows team member actions

## 14. Dependencies

- GF-AUTH-001 (user session, org members)
- GF-SHELL-001 (application shell)
- GF-GRANT-001 (grants as comment parent)
- GF-GRANT-003 (comment section on grant detail)
- GF-NOTIFY-001 (@mention notifications)

## 15. Completion Criteria

- All acceptance criteria pass
- Comment system is integrated into grant detail
- @mention notifications reach the mentioned user
- Team activity feed is accurate and up-to-date

---

*Spec references: `context/project-brief.md` §17 (Future Direction - Collaboration)*
