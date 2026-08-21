# Decisions

## 2026-08-20 — Simplified Clerk session-auth MVP (current authority)

- Clerk session `userId`, active `orgId`, and recognized `orgRole` are authoritative on protected requests. No per-request Clerk Backend lookup is used.
- Local User and Organization records are webhook-maintained projections/domain references, not local authorization state.
- The supported projection webhook set is exactly `user.created`, `user.updated`, `organization.created`, and `organization.updated`. Signed/Zod-validated idempotent upserts are retained; unsupported membership/deletion events no-op.
- All superseded membership binding, membership-incarnation IDs/fencing, permanent revocation, tenant locks, persisted local roles, reconciliation, audit, compensation, backfill, and contraction claims are non-operative and must not be documented as MVP behavior.
- The simplified path has two migrations. Fresh empty-PostgreSQL migration evidence is clean. The destructive baseline is suitable only for disposable databases.
- The Prisma Postgres database is linked through current ignored environment state; the two approved migrations are already present. `npm run verify:prisma` was verified without recording database identifiers, connection strings, API keys, or environment values.

## 2026-08-20 — Verification and closure gates

- Final gate evidence: 99 tests passed and 1 PostgreSQL-dependent test skipped; lint, TypeScript, Prisma validate/status, and build are clean.
- Manual Clerk evidence: sign-up/first organization creation, sign-in, protected redirects, projection webhook flow, and sign-out passed. No organization-switching behavior is claimed.
- Standalone authentication audit and broader production hardening are deferred; focused tenant-domain CRUD/security verification remains required for the first domain slice.

## 2026-08-20 — GF-AUTH-001 final R2 closure

- Final R2 review: **PASS**. GF-AUTH-001 is complete for the simplified MVP scope.
- The current linked Prisma verifier and gates are recorded without IDs or secrets: `npm run verify:prisma`, Prisma validate/status, and the approved two-migration state are clean/present.
- Memory save was verified successful before recording this completion receipt. Explicit deferrals remain: production hardening and standalone audit; tenant-domain CRUD/security verification remains required before completion of the first domain slice.
- No code, schema, migration, config, dependency, environment, commit, push, or deploy changes were authorized or made; dispatch files are preserved and not reset.

## 2026-08-20 — Phase 1 scope correction and approval

- GF-PHASE1-001 is approved with the explicit scope correction: standalone authentication audit and broader production hardening are deferred and do not gate this slice.
- Retain only domain tenant-isolation/security verification as the relevant security requirement for Phase 1.
- Blueprint and workflow approval is complete. Implementation remains pending only on the dedicated feature-branch `READY` receipt and the separately confirmed exact branch-creation command; no repository-changing Git action is authorized by this documentation update.
