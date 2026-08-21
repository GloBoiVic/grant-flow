# GF-INTEGRATE-001 — Calendar Integrations

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-INTEGRATE-001 |
| **Phase** | Phase 4 — Future Consideration |
| **Status** | Future |
| **Product Goal** | Enable calendar synchronization from GrantFlow to external calendar services |
| **MVP Classification** | Future |
| **Roadmap Link** | [Phase 4 — Future Consideration](../../roadmap.md#9-phase-4-future-consideration) |

---

## 1. Feature

Calendar integration that pushes GrantFlow deadlines to users' Google Calendar or Outlook calendars. Sync is one-way (GrantFlow → external calendar) for the initial implementation. Reverse sync (external events creating GrantFlow deadlines) is not planned. **(Clarification:** The earlier product spec used "two-way" language loosely; the implementation scope is one-way push from GrantFlow to external calendars.)

## 2. Purpose

Grant professionals live in their calendars. GF-INTEGRATE-001 syncs GrantFlow deadlines to external calendars so users don't need to manually enter submission dates in multiple systems.

## 3. User Outcome

Grant professionals' submission deadlines automatically appear in their external calendar. Changes to deadlines in either system are reflected in both.

## 4. Scope

- Google Calendar integration (OAuth)
- Outlook Calendar integration (OAuth)
- One-way sync: GrantFlow deadlines → external calendar (initial implementation)
- Deadline updates propagated to external calendar
- Calendar event metadata: grant title, funder name, deadline type, link back to GrantFlow

## 5. Out of Scope

- **Two-way sync** — external calendar events do not create GrantFlow deadlines. This is a product decision, not a deferral. GrantFlow is the system of record for grant data; calendars are a consumption surface.
- Calendar event reminders configuration
- Syncing non-deadline events (stage dates, decision dates)
- Multiple calendar account support per user
- Calendar availability or scheduling features
- Public calendar sharing

## 6. User Stories

- As a **grant professional**, I want my GrantFlow deadlines to appear in my Google Calendar so that I don't have to maintain two calendars.
- As a **grant professional**, I want deadline changes in GrantFlow to update my calendar automatically.

## 7. Functional Requirements

1. **OAuth integration** with Google Calendar and Outlook Calendar.
2. **One-way sync** — GrantFlow deadlines create events in the user's external calendar.
3. **Event creation** — when a grant with a deadline is created or its deadline is set, a calendar event is created.
4. **Event updates** — when a deadline changes, the corresponding calendar event is updated.
5. **Event deletion** — when a grant is soft-deleted or its deadline is removed, the calendar event is removed.
6. **Calendar event includes:** title (grant name + "Deadline"), date (all-day), description (funder, amount, link to GrantFlow).
7. **Sync settings** — user can enable/disable calendar sync per service.

## 8. Business Rules

1. Sync is per-user, not per-organization. Each user authorizes their own calendar.
2. Failed sync operations are retried with exponential backoff.
3. Rate limits of external calendar APIs are respected.
4. OAuth tokens are stored securely (encrypted in database or via Clerk's token management).

## 9. User Experience

- Calendar integration settings in user preferences.
- "Connect Google Calendar" / "Connect Outlook" buttons with OAuth flow.
- After connection, deadlines appear in the external calendar within minutes.
- Disconnect option to revoke access.
- Status indicator showing sync health.

## 10. Data Requirements

- OAuth token storage (refresh tokens, access tokens, expiry)
- Calendar event ID mapping (GrantFlow deadline → external calendar event ID)

## 11. Permissions

- Per-user authorization. Users control their own calendar connection.

## 12. States

| State | Behavior |
|---|---|
| **Not connected** | "Connect your calendar" prompt |
| **Connected** | Sync active; status indicator |
| **Sync error** | "Sync failed — reconnect or check permissions" |
| **Disconnected** | Calendar no longer updated; existing events remain |

## 13. Acceptance Criteria

- [ ] User can connect Google Calendar via OAuth
- [ ] User can connect Outlook Calendar via OAuth
- [ ] GrantFlow deadlines create events in external calendar
- [ ] Deadline changes propagate to external calendar
- [ ] Deadline removal removes external calendar event
- [ ] User can disconnect calendar integration
- [ ] Sync failures are handled gracefully

## 14. Dependencies

- GF-AUTH-001 (user session, OAuth state)
- GF-GRANT-001 (deadline field on grants)
- GF-DEADLINE-001 (deadline management)

## 15. Completion Criteria

- All acceptance criteria pass
- Calendar sync works for both Google and Outlook
- Sync is reliable with proper error handling

---

*Spec references: `context/project-brief.md` §17 (Future Direction - Calendar integrations)*
