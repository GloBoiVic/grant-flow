Feature

Task: GF-SHELL-001
Phase: Phase 0 — Platform Foundation
Feature: Authenticated Application Shell
Status: IN_PROGRESS
Goal: Build the organization-required authenticated application shell on the existing Clerk and local projection foundation.

Read

- AGENTS.md
- context/roadmap.md
- context/features/phase-00-platform-foundation/GF-SHELL-001-authenticated-application-shell.md
- context/architecture.md
- context/database.md
- context/tech-stack.md
- context/coding-standards.md
- src/app/globals.css
- screenshots/login.png
- prisma/schema.prisma

Scope

Build

- Build the organization-required shell with navigation, projected display identity, account controls, responsive sidebar behavior, loading/error states, and honest placeholders.
- Initialize only the approved shadcn primitives and Lucide convention without changing existing GrantFlow tokens.

Do Not Build

- Custom passwords, MFA, session management, OAuth, or any authentication system outside Clerk.
- Social-provider configuration, billing, permission-management UI, API-key authentication, or custom invitation workflows.
- Domain functionality, fabricated records, metrics, schema/migrations, webhook/auth-model changes, profile/settings routes, and Phase 1 work.
- Client-provided organization IDs, direct client database access, raw SQL, or local identity records created outside Clerk webhooks.

Acceptance

- The shell mounts only under `(authenticated)/(org-required)` around authorized children.
- Navigation, projected display identity, account controls, responsive sidebar behavior, loading/error states, and honest placeholders follow `dispatch/ARCHITECTURE.md`.
- `/access`, `/organization`, public auth routes, and webhook behavior remain unchanged.
- New UI uses existing `globals.css` tokens and the approved light-only shadcn/Lucide configuration.
- Tests pass
- No unrelated scope added

Progress

Completed: Phase 0 status truth was reconciled; GF-DATA-001 is complete and the simplified GF-AUTH-001 implementation has passed its automated and manual checks. Clerk session `userId`, active `orgId`, and recognized `orgRole` are authoritative; local `User` and `Organization` rows are projections. The approved GF-SHELL-001 sequence is recorded in `dispatch/TASKS.md`.
In Progress: GF-SHELL-001 documentation reconciliation is complete; implementation has not yet begun. The shell will build against the Clerk-first authorization and projection foundation.
Remaining: Final R2 review remains open; GF-AUTH-001 terminal completion is not claimed. GF-SHELL-001 implementation, automated verification, manual shell checks, and review remain.

Blockers

GF-AUTH-001 final R2 review blocks Phase 0/auth terminal closure. GF-SHELL-001 is in progress; no Phase 0 closure is claimed.

Completion Rule

When acceptance criteria pass:

1. Set Status to COMPLETE.
2. Record completed work.
3. Record intentional deferrals.
4. Stop. Do not begin the next feature.

When starting the next feature, replace this file’s feature-specific contents and reset Status to PLANNED.
