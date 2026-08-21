# GF-NOTIFY-001 — Notifications and Reminders

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-NOTIFY-001 |
| **Phase** | Phase 3 — Post-MVP Portfolio Insights and Operational Enhancements |
| **Status** | Future |
| **Product Goal** | Provide in-app notifications and email reminders for deadlines, stage changes, and portfolio events |
| **MVP Classification** | Post-MVP |
| **Roadmap Link** | [Phase 3 — Post-MVP Portfolio Insights](../../roadmap.md#8-phase-3-post-mvp-portfolio-insights-and-operational-enhancements) |

---

## 1. Feature

In-app notification system and optional email reminders that alert users to upcoming deadlines, stage changes, activity mentions, and portfolio events. Users can configure which notifications they receive.

## 2. Purpose

Grant professionals juggle multiple deadlines and grants. Notifications reduce the risk of missed deadlines and keep teams informed about changes without manual checking.

## 3. User Outcome

Grant professionals receive timely reminders about upcoming deadlines, notifications when grant stages change, and updates about activity on grants they follow or own.

## 4. Scope

- In-app notification center (bell icon in topnav, notification list, unread count badge)
- Deadline reminders (N days before deadline: 7, 3, 1, day of)
- Stage change notifications (when a grant transitions to a new stage)
- Activity notifications (document upload, note added on owned grants)
- Notification preferences per user (which notification types to receive)
- Email notification delivery (configurable)
- Notification read/unread state
- Notification dismissal

## 5. Out of Scope

- Push notifications (mobile or browser)
- SMS or other non-email out-of-app delivery
- Real-time notification delivery (polling or server-sent events — post-MVP)
- Notification grouping or digest
- Notification archival
- Custom notification rules or triggers
- Notifications for other users' actions beyond owned/followed grants

## 6. User Stories

- As a **grant professional**, I want to receive a notification before a deadline so that I don't miss submission dates.
- As a **grant professional**, I want to know when a grant stage changes so that I can track progress.
- As a **grant professional**, I want to see unread notifications in the app so that I know what's new.
- As a **grant professional**, I want to configure which notifications I receive so that I'm not overwhelmed.

## 7. Functional Requirements

1. **In-app notification center** accessible from a bell icon in the top navigation bar.
2. **Notification types:** deadline reminder, stage change, document uploaded, note added on owned grant.
3. **Unread count badge** on the bell icon showing number of unread notifications.
4. **Notification list** shows reverse chronological list with type, description, timestamp, read/unread indicator.
5. **Notification read state** — clicking a notification marks it as read.
6. **Notification preferences** — per-user toggle for each notification type, and email on/off.
7. **Email reminders** — configurable deadline reminder timing (7/3/1 days before, day of).
8. **Deadline reminders** are generated daily for grants with approaching deadlines.
9. **Notification data** is stored in a local notifications table.

## 8. Business Rules

1. Notifications are user-scoped (not org-scoped). Each user sees their own notifications.
2. Deadline reminders are based on the grant's deadline date and the user's notification preferences.
3. Stage change notifications go to the grant owner and optionally to users who follow the grant.
4. Email delivery requires configured email provider (not in MVP scope for infrastructure).
5. Notifications older than 90 days may be automatically archived.

## 9. User Experience

- Bell icon in topnav with unread count badge.
- Notification panel (dropdown or slide-out) shows recent notifications.
- Each notification row: icon (by type), description text, relative timestamp.
- Clicking a notification marks it as read and navigates to the relevant grant.
- Notification preferences accessible from user settings.

## 10. Data Requirements

**Notification entity (new table):**
- `id` (UUID), `userId` (FK → User), `type` (text), `title` (text), `description` (text), `link` (text?, route to relevant entity), `read` (boolean, default false), `createdAt` (timestamptz)

## 11. Permissions

- Users see only their own notifications
- Notification preferences are per-user

## 12. States

| State | Behavior |
|---|---|
| **No notifications** | Bell icon with no badge; notification panel shows "No notifications yet" |
| **Unread notifications** | Bell icon with count badge |
| **Notification panel open** | List of notifications, scrollable |
| **Notification preferences** | Toggle switches for each notification type |
| **Email not configured** | Email notification option shows "Email not configured" |

## 13. Acceptance Criteria

- [ ] Bell icon appears in topnav with unread count
- [ ] Notification panel displays recent notifications
- [ ] Notifications are generated for deadline reminders
- [ ] Notifications are generated for stage changes
- [ ] Clicking a notification marks it as read and navigates to the grant
- [ ] Users can configure notification preferences
- [ ] Notifications are user-scoped

## 14. Dependencies

- GF-AUTH-001 (user session, user preferences)
- GF-SHELL-001 (topnav bell icon integration)
- GF-GRANT-001 (stage change events)
- GF-DEADLINE-001 (deadline data)
- GF-DOCUMENT-001 (document upload events)

## 15. Completion Criteria

- All acceptance criteria pass
- In-app notification center is functional
- Deadline reminders generate correctly
- Users can manage notification preferences

---

*Spec references: `context/project-brief.md` §17 (Future Direction - Notifications)*
