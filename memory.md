# Memory — GrantFlow Authentication Foundation

Last updated: 2026-08-13

## What was built

- GF-DATA-001: Prisma 7 PostgreSQL schema, migrations, generated client, and server-only Prisma singleton.
- GF-AUTH-001 implementation: Clerk sign-in/sign-up, protected routes, organization selection, server-only authorization, signed Zod-validated webhooks, and Vitest coverage.
- Projection-pending `/access` boundary: authenticated users wait safely for webhook-synced local projections without receiving organization data.
- Vercel build support: Prisma client generation occurs before the Next.js build.

## Decisions made

- Clerk is the identity authority; local User, Organization, and Membership records are webhook-only projections.
- Organization scope derives only from `auth().orgId`; authorization fails closed on missing/mismatched projections.
- Clerk roles map to ADMIN, MEMBER, and VIEWER; unknown roles are least-privilege VIEWER.
- Membership webhook fencing uses nullable unique `clerkMembershipId`; Clerk-backed backfill and later NOT NULL contraction are deferred.

## Problems solved

- Prisma CLI required explicit dotenv loading through `prisma.config.ts`; database migrations are now applied.
- Generated Prisma client is ignored by design; Vercel builds must run `prisma generate` before `next build`.
- Clerk webhook endpoint configuration was the live signup blocker. With the correct public endpoint, signing secret, required events, and migrated database, signup → org creation → dashboard works.
- Persistent `/access` means local webhook projections are missing or delayed; inspect Clerk webhook deliveries and database connectivity rather than creating rows manually.

## Eureka moments

- Local development webhook delivery requires a public endpoint or tunnel; deployed Vercel endpoint is the stable option.
- A webhook endpoint accepts POST only; browser GET requests returning 405 are expected.

## Current state

- Current application changes are pushed to GitHub. Vercel deployment and Clerk webhook flow were manually verified after correcting endpoint configuration.
- Automated checks previously passed: 60 tests, lint, TypeScript, production build, and Prisma validation.
- `skills-lock.json` remains untracked and intentionally excluded from commits.

## Next session starts with

- Reconcile GF-AUTH-001 terminal documentation/manual verification status, then begin GF-SHELL-001 only after closure is confirmed.

## Open questions

- Complete the deferred Clerk membership-ID backfill and NOT NULL migration when safely runnable against live Clerk data.
- Resolve remaining shell decisions: shadcn initialization, icon convention, responsive breakpoints, and sidebar dimensions.
