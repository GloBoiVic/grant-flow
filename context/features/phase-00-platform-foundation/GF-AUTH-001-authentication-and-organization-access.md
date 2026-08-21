# GF-AUTH-001 — Authentication and Organization Access

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-AUTH-001 |
| **Phase** | Phase 0 — Platform Foundation |
| **Status** | Complete |
| **Product Goal** | Enable secure user authentication, organization membership, and role-based access control |
| **MVP Classification** | Prerequisite — required by all authenticated features |
| **Roadmap Link** | [Phase 0 — Platform Foundation](../../roadmap.md#5-phase-0-platform-foundation) |

---

## 1. Feature

Integrate Clerk as the authentication provider. Implement sign-in/sign-up flows, constrained first-organization access, session management via `src/proxy.ts`, and webhook-driven identity sync to local `User` and `Organization` projection tables. Clerk's signed session is authoritative for active organization and role.

### R2 architecture supersession

The approved simplified Clerk-session architecture in `dispatch/ARCHITECTURE.md` and `dispatch/DECISIONS.md` supersedes the earlier local-membership design in this feature specification. The following historical requirements are retained below for traceability, but are **non-operative and must not be implemented as MVP behavior**:

- the local `Membership` authorization model and persisted local role mapping;
- the seven-event webhook set (`user.created`, `user.updated`, `organization.created`, `organization.updated`, `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`); and
- membership binding, incarnation/fencing, revocation, reconciliation, audit, compensation, backfill, or contraction requirements.

Current authority: the signed Clerk session's `userId`, active `orgId`, and recognized `orgRole`; local `User` and `Organization` rows are webhook-maintained projections only. The supported webhook set is exactly the four user/organization events, and unsupported membership/deletion events no-op.

## 2. Purpose

GrantFlow is a multi-tenant SaaS application. Users must authenticate, belong to an organization, and have role-based access within that organization. GF-AUTH-001 establishes the auth foundation that all protected routes, Server Actions, and data queries depend on.

## 3. User Outcome

Users can sign up, sign in, create a first organization, and access GrantFlow's authenticated features. The active organization in the signed Clerk session determines data visibility.

## 4. Scope

- Clerk integration: `@clerk/nextjs` package installation and configuration
- `src/proxy.ts` using `clerkMiddleware` to protect authenticated routes
- `ClerkProvider` wrapping the authenticated sub-layout (not root layout)
- Sign-in page at `(public)/login/page.tsx`
- Sign-up page or Clerk-hosted UI
- Constrained first-organization creation (invitations deferred)
- Webhook handler at `src/app/api/webhooks/clerk/route.ts` for user/org projection sync
- Local User and Organization rows synced from Clerk webhooks; no local Membership authorization projection
- Role authorization from the recognized Clerk `orgRole` in the signed session
- Route guard patterns for Server Components and Server Actions
- Sign-out flow

## 5. Out of Scope

- Custom authentication (passwords, MFA, OAuth providers beyond Clerk)
- Social sign-in configuration (deferred — Clerk supports it; configure as needed)
- Organization billing or subscription tiers
- Invitation workflows beyond Clerk's built-in mechanisms
- Permission management UI (roles are set via Clerk dashboard initially)
- Session management UI
- API key authentication for external integrations

## 6. User Stories

- As a **new user**, I want to sign up for GrantFlow so that I can access the application.
- As a **returning user**, I want to sign in so that I can continue managing my grants.
- As a **user**, I want to create an organization so that my team can collaborate on grants.
- As a **user**, I want to create my first organization so that I can access shared grant data.
- As a **user**, I want to sign out so that my session is secure.
- As a **user**, I want access to be controlled by my active Clerk organization and role.

## 7. Functional Requirements

1. **Proxy** (`src/proxy.ts`) protects all routes under `(authenticated)/` and redirects unauthenticated users to `/login`.
2. **Sign-in page** at `/login` provides email/password authentication (and any Clerk-enabled social providers).
3. **Sign-up flow** creates a Clerk user; a user without an active organization may create a first organization. Invitations are deferred.
4. **ClerkProvider** wraps the authenticated sub-layout to provide session context to client components.
5. **Server Components** use `auth()` from `@clerk/nextjs/server` to access `userId`, `orgId`, and claims.
6. **Server Actions** call `auth()` at invocation time for every mutation, deriving `organizationId` from the session.
7. **Webhook handler** validates svix signatures, parses supported events with Zod, and idempotently upserts local User/Organization projections.
8. **Webhook events processed:** exactly `user.created`, `user.updated`, `organization.created`, and `organization.updated`. Membership and deletion events no-op.
9. **Role authorization** uses the recognized Clerk `orgRole` from the signed session; no persisted local role is authoritative.
10. **Organization ID** is never accepted from client-provided data. Always derived from `auth().orgId`.

## 8. Business Rules

1. Local User and Organization rows are webhook-maintained projections — Clerk is the identity and authorization authority. Never create or update these projections independently.
2. The active organization and role come from the signed Clerk session. Missing local projections remain pending, and missing or unknown roles deny access.
3. First-organization onboarding is supported; switching, transfer, leave, rejoin, invitations, and member-management UI are outside this MVP.
4. If Clerk webhook delivery fails, identity state may be stale. Retry logic and manual sync capability are future considerations.

## 9. User Experience

- Sign-in page matches `screenshots/login.png` — clean, centered form with Clerk components.
- After sign-in, users land on the dashboard (or are redirected to create/select an organization if none exists).
- No organization switcher, transfer, leave, or membership-management surface in the MVP.
- No auth-related clutter in the main application — auth is handled at the boundary.

## 10. Data Requirements

Local tables synced from Clerk (see `context/database.md` §2):
- **Organization:** `id` (UUID), `clerkOrgId`, `name`, `slug`, `createdAt`, `updatedAt`
- **User:** `id` (UUID), `clerkUserId`, `email`, `name`, `avatarUrl`, `createdAt`, `updatedAt`
- **Membership:** Historical requirement retained below for traceability; superseded and not part of the simplified MVP authorization path.

## 11. Permissions

| Recognized Clerk role | Capabilities |
|---|---|
| **`org:admin`** | Full CRUD on all entities, import/export, delete records |
| **`org:member`** | Create and edit grants, funders, and documents; cannot delete |

Permission enforcement is server-side in every Server Action. Client-side UI hides unavailable actions but never substitutes for server authorization.

## 12. States

| State | Behavior |
|---|---|
| **Unauthenticated** | Redirected to `/login` |
| **Authenticated, no org** | Prompted to create a first organization; invitation join is deferred |
| **Authenticated, with org** | Full access to org-scoped features |
| **Clerk unavailable** | Auth checks fail; error boundary displays auth failure |
| **Webhook failure** | Local projections may be stale; core auth (login/session) still works via Clerk |
| **Role insufficient or unknown** | Server Action returns unauthorized error; UI hides unavailable actions |

## 13. Acceptance Criteria

- [x] User can sign up, sign in, and sign out
- [x] Clerk middleware protects authenticated routes
- [x] Unauthenticated users are redirected to `/login`
- [x] Organization can be created during sign-up
- [x] First-organization onboarding is verified
- [x] Webhook handler processes the four supported events and syncs local projections
- [x] Server Components successfully call `auth()` and derive `orgId`
- [x] Server Actions enforce authorization and reject unauthorized mutations
- [x] Recognized Clerk `orgRole` values authorize the correct server-side capabilities
- [x] Organization ID is never accepted from client-provided data

## 14. Dependencies

- GF-DATA-001 (local User/Organization projection tables must exist)

**Resolved decisions:**
- **Clerk session authority (current)** — The signed session's `userId`, active `orgId`, and recognized `orgRole` are authoritative. No persisted local role or local Membership authorization is used. See `dispatch/ARCHITECTURE.md` and `dispatch/DECISIONS.md`.
- **Projection sync (current)** — The webhook route signature-verifies, Zod-validates, and idempotently upserts User/Organization projections for exactly four events: `user.created`, `user.updated`, `organization.created`, and `organization.updated`. Unsupported membership/deletion events no-op.

**Deferred decisions:**
- Social sign-in provider configuration (Clerk supports it; configure as needed)

## 15. Completion Criteria

- All acceptance criteria pass
- Sign-in page matches `screenshots/login.png`
- Webhook handler is tested with Clerk webhook events
- Auth flow works end-to-end: sign up → create org → access dashboard
- Signed-session role enforcement is verified at protected server boundaries; no local role mapping is claimed

## 16. Historical requirements retained for traceability (superseded)

The following text records the pre-R2 decisions without retaining them as current requirements:

- **Seven-event webhook requirement:** process `user.created`, `user.updated`, `organization.created`, `organization.updated`, `organizationMembership.created`, `organizationMembership.updated`, and `organizationMembership.deleted`.
- **Local Membership and role requirement:** sync a local `Membership` row and map Clerk roles to `ADMIN`, `MEMBER`, or `VIEWER` for authorization.
- **Membership-incarnation fencing requirement:** persist `clerkMembershipId` and fence delayed membership create/update/delete events.
- **Single-active-membership requirement:** enforce zero or one active membership per user, with first-org creator as `ADMIN` and no switching, transfer, or leave.

These requirements, including their related deletion, reconciliation, audit, compensation, backfill, and contraction work, are explicitly superseded by the simplified Clerk-session architecture and are not MVP behavior.

---

*Spec references: `context/architecture.md` §7–8, `context/database.md` §2, `context/tech-stack.md` §5, `.agents/skills/clerk-auth/SKILL.md`*
