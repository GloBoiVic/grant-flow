Feature

Task: GF-AUTH-001
Phase: Phase 0 — Platform Foundation
Feature: Authentication and Organization Access
Status: IN_PROGRESS
Goal: Establish secure Clerk authentication, active-organization access, and webhook-driven local identity synchronization for all protected GrantFlow features.

Read

- AGENTS.md
- context/roadmap.md
- context/features/phase-00-platform-foundation/GF-AUTH-001-authentication-and-organization-access.md
- context/architecture.md
- context/database.md
- context/tech-stack.md
- context/coding-standards.md
- src/app/globals.css
- screenshots/login.png
- prisma/schema.prisma

Scope

Build

- Install and configure Clerk using the approved environment-variable placeholders; do not commit or surface credentials.
- Add Clerk middleware and public/authenticated route boundaries so unauthenticated users are redirected to `/login`.
- Add the authenticated sub-layout with `ClerkProvider`, plus sign-in, sign-up, organization create/join, active-organization, and sign-out flows.
- Build the `/login` experience to match `screenshots/login.png` using existing design tokens only.
- Add a narrow `src/lib/clerk/` adapter for server-side session, organization-scope, and local-role helpers.
- Add the Clerk webhook route with Svix signature verification, Zod validation, retry-safe idempotent upserts for User, Organization, and Membership, and the approved Clerk-to-local role mapping.
- Establish reusable Server Component and Server Action authorization patterns that derive organization identity only from `auth().orgId`.
- Verify protected-route behavior, identity synchronization, role mapping, and the sign-up → organization → authenticated access path.

Do Not Build

- Custom passwords, MFA, session management, OAuth, or any authentication system outside Clerk.
- Social-provider configuration, billing, permission-management UI, API-key authentication, or custom invitation workflows.
- Application shell navigation, sidebar, topnav, dashboard functionality, grants, funders, documents, imports, notifications, or other future-phase work.
- Client-provided organization IDs, direct client database access, raw SQL, or local identity records created outside Clerk webhooks.

Acceptance

- Users can sign up, sign in, sign out, and create or join an organization through Clerk.
- Middleware redirects unauthenticated users from authenticated routes to `/login`; authenticated users with an active organization can proceed.
- Login UI matches `screenshots/login.png` and uses only existing `globals.css` design tokens.
- Webhook processing verifies Svix signatures, validates payloads with Zod, safely handles duplicate delivery and Clerk retry behavior, and synchronizes all required user, organization, and membership events.
- Local role mapping is `org:admin` → `ADMIN`, `org:member` → `MEMBER`, and unassigned/default → `VIEWER`.
- Server-side guard patterns derive organization scope from `auth().orgId`, never client input, and enforce authorization at action invocation.
- Required environment variables are documented with placeholders only; no credentials are committed or displayed.
- Tests pass
- No unrelated scope added

Progress

Completed: Feature scope, constraints, acceptance criteria, architecture blueprint, and implementation approval are recorded.
In Progress: Implementation of tasks 1–5 is complete with R1/R2 reviews passed; task 6 (documentation reconciliation) is now complete for this session. Automated gates verified: Vitest 7 files / 60 tests passing, `eslint` clean, `tsc --noEmit` clean, `next build` succeeds, `prisma validate` passes. Membership incarnation fencing applied via expand-only migration (nullable unique `clerkMembershipId`); local Membership records hard-delete on Clerk membership deletion while User/Organization projections remain.
Remaining: Manual Clerk configuration verification (sign-up → organization → dashboard access, sign-in/out, protected redirects, organization switching, all webhook events, role enforcement) and final review sign-off before terminal closure. Intentional deferrals recorded: Clerk-backed backfill of `clerkMembershipId` for existing memberships and NOT NULL contraction — neither is required for the webhook path to function.

Blockers

Manual gates block terminal closure (feature remains IN_PROGRESS, not COMPLETE): manual Clerk configuration verification in a live Clerk workspace and final review sign-off. These require human action and cannot be completed by automation alone.

Completion Rule

When acceptance criteria pass:

1. Set Status to COMPLETE.
2. Record completed work.
3. Record intentional deferrals.
4. Stop. Do not begin the next feature.

When starting the next feature, replace this file’s feature-specific contents and reset Status to PLANNED.
