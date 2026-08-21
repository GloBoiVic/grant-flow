# Exploration — GF-PHASE1-001 Organization-Scoped Grant Tracking

## Relevant files

- `src/proxy.ts:3-13` — Clerk protects authenticated routes.
- `src/lib/clerk/authorization.ts:30-39` — server authorization resolves local projections and fails closed.
- `src/app/(authenticated)/(org-required)/layout.tsx:14-25` — organization-required application shell.
- `src/app/(authenticated)/(org-required)/grants/page.tsx:1-12` — current grants placeholder.
- `prisma/schema.prisma:73-91` — organization-scoped soft-deletable Funders.
- `prisma/schema.prisma:111-188` — Grant and Activity fields, relations, and indexes already support the slice.
- `context/architecture.md:177-188` — activity must be written transactionally with domain mutations.

## Existing patterns

- Session `userId`, active `orgId`, and recognized `orgRole` are authoritative; local User/Organization records are projections.
- Domain scope must be server-derived, never supplied by clients.
- Existing dependencies include Next.js, Prisma, Clerk, Zod, Vitest, and React Testing Library; no new dependency is required for the proposed slice.

## Context gaps and risks

- `Grant.funderId` is required, requiring a minimal funder prerequisite.
- Prisma foreign keys alone cannot prove a client-selected funder belongs to the current organization; each mutation must verify it.
- Arbitrary ownership is unsafe in the present schema because User has no organization-membership relation; current-user ownership is the safe minimum.
- No real domain CRUD/tenant tests exist yet. Focused domain tenant-isolation/security verification is required for this slice; standalone authentication audit and broader production hardening are deferred and do not gate it.

## Recommendation

Implement only the narrow funder prerequisite plus grant create/list/view/edit/status slice described in `PLAN.md`. Defer documents, tags, imports, dashboard aggregation, full funder management, deletion, owner assignment, and reporting.
