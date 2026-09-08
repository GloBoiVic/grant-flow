# Completed

## GF-AUTH-001 — Simplified MVP documentation reconciliation and terminal closure

- Reconciled dispatch authority to simplified Clerk session authentication: session `userId`, active `orgId`, and recognized `orgRole` are authoritative; local User and Organization rows are projections only.
- Removed superseded membership binding, membership-incarnation/fencing, revocation, tenant-lock, persisted-role, reconciliation, audit, compensation, backfill, and contraction claims from current dispatch authority.
- Recorded exactly four supported projection webhooks: user created/updated and organization created/updated. Unsupported membership/deletion events no-op.
- Recorded two migrations and clean fresh PostgreSQL migration evidence.
- Recorded verification: 99 tests passing, 1 PostgreSQL-dependent test skipped, clean lint/TypeScript/build/Prisma validation, and manual Clerk checks for sign-up/first organization, sign-in, protected redirects, projection webhook flow, and sign-out.
- Preserved deferrals for production hardening, standalone audit, and tenant-domain CRUD tests before the first domain slice.
- Final R2 review: **PASS**. GF-AUTH-001 is complete.
- Prisma state recorded without identifiers or secrets: the linked/current verifier configuration is active through ignored environment state; the two approved migrations are present; `npm run verify:prisma` and Prisma validate/status gates are clean.
- Completion receipt: memory save was verified successful (`memory.md` updated); this documentation-only terminal closure is recorded without resetting or deleting dispatch files, per explicit instruction. No code, schema, migration, config, dependency, environment, commit, push, or deploy changes were made.

## GF-PHASE1-001 — Organization-Scoped Grant Tracking

- R1 review: **PASS** after F1 edit-payload remediation and F2 PostgreSQL evidence verification; remaining F3/F4 findings are minor and non-blocking.
- Implemented and fast-forward merged to `main` at commit `7458a98`.
- Validation evidence: fresh disposable PostgreSQL integration run **20 passed / 0 skipped / 0 failed**, with clean teardown; full validation and review gates are recorded in `dispatch/REVIEW.md` and `dispatch/MODEL-LOG.md`.
- Explicit deferrals: production hardening/auth audit and deletion/restoration.
- Completion receipt: memory save verified successful (`memory.md` updated); dispatch files were preserved and not reset or deleted.

## GF-TAG-001 — Organization-Scoped Grant Categorization

- R1 review: **PASS**. No Critical or Important findings remain; five Minor findings are non-blocking.
- Implemented scope: database-enforced organization-scoped `normalizedName` uniqueness with collision-safe backfill, member/admin tag creation and active listing, idempotent grant assignment/removal, scoped serialized display in the grants list and existing detail Sheet, and no tag Activity writes.
- Validation evidence: **7/7** tag-specific disposable-PostgreSQL tests passed; the full suite reported 131 passed / 27 skipped; lint, TypeScript, Prisma validation, build, and diff checks were clean, with disposable database teardown clean. The independent reviewer disclosed that the tag DB result was recorded evidence rather than re-run in that review because the admin URL was unavailable.
- Explicit deferrals preserved: tag filtering/search, rename, delete/restore, colors, hierarchy/groups, standalone management, bulk operations, import, analytics/reporting, suggestions/automation, funder-detail display, full grant-detail routing, and tag Activity.
- Superseded report inventory and material summary: `dispatch/TEST-VERIFICATION.md` was a one-off 151-line premium verification report whose final verdict was BLOCKED because tag-specific PostgreSQL suites were then absent/unavailable. It recorded clean static checks and 131 normal tests with skipped database suites, and its addenda recorded a 20/20 non-tag disposable gate while explicitly identifying missing tag migration, tenant, mutation, idempotency, role, soft-delete, malformed-join, and no-Activity coverage. Later tag suites and the R1 record superseded those claims; the report was deleted after this summary was recorded. No other dispatch report was deleted.
- Completion receipt: `memory.md` update was durably verified successful before this record was written. GF-TAG-001 documentation closure is complete; active planning files were not reset, `COMPLETED.md` was preserved, and no application, schema, migration, database, dependency, environment, or Git-state changes were made.
- Next target: begin planning GF-GRANT-002, including the deferred tag-filtering/search scope.

## Rewrite context/project-brief.md

- Reorganized the canonical product brief into exactly 20 retrieval-friendly sections.
- Preserved product intent, MVP scope, target customers, workflows, lifecycle, historical knowledge, migration, reporting, boundaries, and future direction.
- Added explicit Product Requirements, Current Implementation, Future/Out-of-Scope, unresolved decisions, terminology, and implementation status distinctions.
- Corrected current repository claims: scaffold/design tokens/direct Zod dependency only; no functional product workflows or backend integrations.
- Corrected the specialized-context status to identify existing planning documents rather than calling them uncreated.

## Context consolidation (documenter pass)

- Created `context/index.md` — manifest with default-load policy, task-to-doc map, design authorities, do-not-duplicate rule.
- Created `dispatch/DECISIONS.md` — structured decision log with 5 active records and unresolved-decision links.
- Updated `AGENTS.md` — corrected source-of-truth table (all context docs exist), added selective loading policy, trimmed duplicated token/security/state inventories, updated repository state.
- Updated `context/project-brief.md` — added `context/index.md` and `dispatch/DECISIONS.md` to specialized docs list, cleaned pre-existing user files section.
- Updated `context/architecture.md` — replaced verbose implementation-reality table with brief reference to AGENTS.md, condensed §9 data flow diagrams into a concise summary with cross-references.
- Updated `context/tech-stack.md` — replaced full request-lifecycle diagram with brief cross-reference to architecture.md §9.
- Updated `context/database.md` — replaced current-status table with reference to tech-stack.md and AGENTS.md.
- Updated `context/coding-standards.md` — fixed stale "planned, not yet created" references, removed Prisma singleton code (delegate to database.md), removed duplicated design token tables (reference globals.css), removed duplicated dependencies table (reference tech-stack.md).
- `context/design.md` — reviewed; no changes needed (already well-scoped with proper cross-references).

Final review corrections:
- `AGENTS.md` now treats specialized context files as authoritative and selectively loaded rather than unmanaged.
- `context/coding-standards.md` now aligns Server Component reads with server-owned `src/lib/queries/` modules and uses a neutral planned-status heading.
- `.agents/skills/` was verified present and preserved.

## GF-DATA-001 — Core Persistence Foundation

- Established Prisma 7.9.1 persistence foundation with exact pinned dependencies (`prisma`, `@prisma/client`, `@prisma/adapter-pg` at `7.9.1`), `prisma.config.ts`, `prisma/schema.prisma` (11 models: Organization, User, Membership, Funder, FunderContact, Grant, Document, Activity, Tag, GrantTag, ImportStaging; 3 enums: GrantStatus, MembershipRole, FunderType), `src/lib/prisma.ts` server-only singleton with `PrismaPg` adapter, `.env.example` with placeholder only, and generated client at `src/generated/prisma/`.
- Applied initial migration (`20260810055726_init`) — 306 lines of DDL covering all 11 tables, 3 enums, UUID PKs, native PostgreSQL types (`uuid`, `decimal(12,2)`, `date`, `timestamptz`, `jsonb`), 7 unique constraints, 19 indexes, 20 FKs all with `ON DELETE RESTRICT ON UPDATE NO ACTION`.
- Tier 3 security-critical review completed: **0 critical issues** after fixing C1 (`server-only` dependency installed at `0.0.1`); 2 important process gates remain open (I1: commit all files; I2: document `FunderContact`/`Activity`/`Document` cross-entity org integrity gap in `DECISIONS.md`); 3 minor findings (benign); 2 informational items.
- Committed at revision `0402ada` — atomic commit of all schema, migration, config, singleton, and `.env.example` files.
- Prisma Compute deployed to project `proj_cmsmocbqt146x1adx4q0g77lq`, app `grant-flow`, region `us-east-1`, branch `main`, primary database, production environment — live URL: `https://o1bvekcp5ukh8dg9pnbwd0by.ewr.prisma.build`.
- No credentials or `DATABASE_URL` were persisted in any tracked file. Secrets remain in local `.env` (gitignored).
- Process gate I2 (document the cross-entity org integrity gap in `DECISIONS.md`) is now closed via the `2026-08-13` decision in `dispatch/DECISIONS.md`. Gate I1 (commit all files) is satisfied by the `0402ada` commit. See that decision record for details.

## GF-GRANT-002 — Grant List and Portfolio Navigation

- Implemented the `/grants` portfolio browser: organization-scoped title/funder search; multi-status and multi-tag filtering; URL-backed state; sortable relevant columns; fixed 50-row offset pagination; active-filter controls; distinct initial-empty and no-match states; and preserved create/detail Sheet behavior.
- Architect-approved pagination decision: use a fixed-size offset live view, accepting that concurrent changes can shift rows between page requests. No snapshot, totals/count query, configurable page size, or page-number jumping was added.
- Later screenshot-aligned UX correction: move scoped search into the `/grants` top-navigation slot and replace exposed controls with progressive inline filtering (`Add filter`, removable active chips, and `Clear all`). Search remains `/grants`-only and the existing URL/query/Sheet contracts remain intact.
- Review outcomes: R3 **PASS** and UX R1 **PASS**, with no Critical or Important findings. Minor non-blocking caveats are the accepted live-view shifts, existing owner-display limitations, and deferred totals/snapshot/configurable pagination and adjacent scope.
- Validation evidence: full Vitest **157 passed / 28 skipped**; disposable PostgreSQL **20 passed**; ESLint, TypeScript, production build, and `git diff --check` passed. No schema, migration, dependency, or application-code changes were made during this documentation closure.
- No one-off reports were deleted; no reports were inventoried for deletion because none required cleanup beyond the flat dispatch files.
- Completion receipt: `memory.md` was saved and the write was verified successfully. No commit, push, merge, deployment, or other Git-state change was performed.

## soloflow-operating-model — Adopt SoloFlow operating model

- Implemented and fast-forward merged to `main` at commit `f13dd02`.
- Replaced `AGENTS.md` with concise GrantFlow-specific operating guidance and added `PRODUCT.md` with only durable product identity, users, core problem, MVP goal, and product boundaries.
- Adopted `dispatch/ACTIVE.md`, `dispatch/COMPLETED.md`, and the `dispatch/workstreams/soloflow-operating-model/` workstream structure with canonical plan, task, validation, and review receipts.
- Removed `CURRENT.md`, `memory.md`, the 31-file `context/` hierarchy, and the seven superseded flat dispatch artifacts.
- Validation: **PASS** — 157 tests passed / 28 skipped; lint, TypeScript, production build, and `git diff --check` passed.
- Review: **PASS** with no Critical or Important findings.
- Preserved all application/runtime assets, tests, Prisma code, screenshots, mock data, configuration, Git history, `dispatch/COMPLETED.md` history, and the pre-existing `next.config.ts` and `.codegraph/.gitignore` changes. No runtime behavior was modified.

## replace-clerk-organization-tenancy — Replace Clerk Organization Tenancy

- Critical workstream implemented and fast-forward merged to `main` at commit `51965e3`.
- Replaced Clerk Organization tenancy with local `User.clerkUserId` → `User.organizationId`
  authority, a clean Prisma baseline, strict atomic first-user onboarding, and preserved
  organization-scoped domain behavior.
- Removed Clerk Organization, role, membership, projection, claim, lease, activation, and
  webhook machinery, including the webhook route and signing-secret example. Clerk remains
  responsible for authentication and current-user profile display only.
- Added `/.codegraph/` to `.gitignore`. The explicitly requested `next.config.ts` change is
  tracked in the merge.
- Validation evidence: focused onboarding tests **9 passed**; disposable PostgreSQL onboarding,
  domain-isolation, and tag suites **26 passed**; TypeScript, ESLint, and `git diff --check`
  passed. Remediation chains R001 and R002 both completed with BUILD → VALIDATE → REVIEW PASS.
- Browser acceptance: after the R002 Server Action export fix, the user confirmed successful
  Clerk authentication, local organization onboarding, and arrival at `/dashboard`.
- Known non-blocking limitations: Clerk/Cloudflare authentication can be browser-dependent;
  independent webpack reruns encountered the documented Next compiled-webpack `null.hash`
  tooling failure, while the recorded post-fix webpack build passed.
- No push or deployment was performed. `dispatch/ACTIVE.md` is cleared; the user-deleted
  `CLAUDE.md` remains absent and pre-existing unrelated changes were preserved.

## portfolio-import — Bounded Excel Portfolio Import

- Classification: Feature, Branch: solo/portfolio-import → main at 2b750ff, Base: 7bbae64
- Implemented scope: Bounded .xlsx import at /import with ephemeral client state, server-side parsing via sheetjs, deterministic worksheet selection (required Funder/Type/Current Status), 5 MiB/1,000-row bounds, structural skipping, explicit source-to-domain mapping (amounts, dates, award timeframe, designation, county, notes), placeholder-aware title derivation (Funder — Designation fallback), and organization-scoped atomic creation of Funders/Grants/Activity with revalidation of /grants and /funders. No durable staging, queues, or generic mapping.
- Remediations: R001 formula-only candidate rows invalid (structural vs candidate), R002 required "-" placeholders invalid, R003 optional Grant Title, R004 Grant Name primary with Grant Title alias (both map to Grant.title, placeholder-aware, Grant Name wins), R005 empty-column preview overflow (ColumnN filter + HeaderList truncation after 12 with Show more, fixes A1:XFD 16k header sheet).
- Validation & Review: T001-T003 DONE_WITH_CONCERNS, R001 VALIDATE PASS REVIEW FAIL → R002-005 VALIDATE PASS REVIEW PASS, final state READY_FOR_USER. Focused parser/mapping/configuration/migration/action/UI tests plus opt-in PostgreSQL integration (GRANTFLOW_TEST_DATABASE_ADMIN_URL) all passed; lint, TypeScript, Prisma validate, next build --webpack, git diff --check passed; browser checks limited by Clerk auth (human verified).
- Migrations: 20260904000000_local_tenancy_baseline (already on main) + 20260904010000_remove_import_staging (drops ImportStaging) — applied to local grantflow (postgresql://vike@127.0.0.1:5432/grantflow) via migrate deploy; 18 grants / 17 funders imported from data/mock-grant-data.xlsx (A1:XFD35, Grant Title: None placeholder → derived titles).
- Closing note: Trackers are funder-centric but headers vary; dual Grant Name/Title support with placeholder fallback is backward-compatible. Preview now compact. Human upload verified post-merge. No unresolved Critical/Important findings; only deferred MINOR Award Timeframe UI omission (persisted/DTO present).
- Merge: Added 40 files (+4714/-30), data/mock-grant-data.xlsx 18KB→237KB (with ColumnN formatting and Grant Title), solo/portfolio-import merged via --no-ff to main.

## portfolio-dashboard — Portfolio Dashboard

- Classification: Feature, Branch: solo/portfolio-dashboard → main at 95a7d95, Base: 2073400
- Implemented scope: Replaced /dashboard FeaturePlaceholder with four bounded sections (Portfolio totals, Needs attention, Upcoming deadlines, Status breakdown) using small UTC date-only seam (toUtcDateOnly/addUtcDays/formatUtcDate/utcToday) and serializable DashboardDto (asOf, totals, attention, upcoming, breakdown). Org-scoped aggregation via Prisma 7.9.1 (groupBy zero-fill 11 statuses, aggregate sums null→zero, overdue lt today, dueIn7 gte/lte today+7, upcoming take 5 deadline asc id asc, pre-submission filter Research/Qualified/Planning/Writing/Internal Review only). No schema change, no /deadlines continuation, no new deadline filters, no charting/timezone/analytics infra, honest navigation via grantListSearchParams and ?grant= Sheet deep-links, empty states preserved.
- Remediations: None — T001/T002 DONE, VALIDATION PASS, REVIEW PASS with zero unresolved Critical/Important (see dispatch/workstreams/portfolio-dashboard/VALIDATION.md and REVIEW.md). Acceptance 1–34 all PASS.
- Validation & Review: dashboard-dates 8, dashboard-queries 12, dashboard-page 15 (41 total) plus full suite 195 passed/31 skipped (5 PG suites skipped without GRANTFLOW_TEST_DATABASE_ADMIN_URL); lint, TypeScript, Prisma validate, git diff --check passed; next build Turbopack globals.css pooled-process spawn is pre-existing env limitation, honestly disclosed and not code regression (tsc/prisma gates pass). Browser validation not run locally (Clerk/DB unavailable; jsdom accessibility/href covers).
- Closing note: UTC-vs-local-midnight limitation remains explicit per PLAN; Deadline View and /deadlines remain deferred.
- Merge: Added 16 files (+2779/-14) on solo/portfolio-dashboard (8dd313a) merged via --no-ff to main at 95a7d95.

## refine-dashboard-visuals — Bounded Dashboard Visual Refinement

- Classification: Small, Branch: main (direct), Base: 95a7d95 → HEAD at 4fb0271
- Implemented scope: Visual-only refinement of already-complete /dashboard via `src/components/dashboard/dashboard-content.tsx` preserving all query/DTO/org/totals/pipeline/pre-submission/overdue/dueIn7/next30/nearest5/status/links/UTC helpers. No schema/deps/analytics.
- Visual refinements:
  - Portfolio totals: `h-1` top accents (`primary/20`, `accent-foreground/20`, `warning/30`, `success/30`), brand/money icon tints (`primary/10`, `warning/10`), hierarchy icon on heading, `text-label`/`text-metric`/`tracking-metric` with existing tokens.
  - Needs attention: urgency now honest red — top `h-1 bg-destructive` + `border-destructive/20` + `destructive-soft/40` wash when attention; Overdue retains `destructive-soft` when overdue; Due within 7 days background changed per feedback from `urgency-due` light red to neutral `bg-card` (R002) while keeping red icon/count foreground (`destructive`) — red = urgency without overwhelming fill.
  - Upcoming/Status headers: `bg-muted/20` wash + `bg-card border shadow-sm` icon pills (`CalendarDays`/`Layers`), scannable rows (`Funder · Sep 11, 2026` + `Badge` status colors, `hover:bg-muted/40`).
  - As of: `As of 2026-09-05 · UTC` (ISO + UTC) → `As of September 5, 2026` (user-local `Intl.DateTimeFormat(undefined, long)` with noon anchor, no UTC) per feedback (R003).
  - Two-column `lg:grid-cols-5` for Upcoming 3/5 + Status 2/5 density, `rounded-xl border bg-card shadow-sm`, `focus-visible` rings, responsive/bars hidden <sm preserved.
- Remediations: R001 generic flat + amber→red + distinctive cards/headers, R002 Due within 7 days red background removed (arrow feedback), R003 As of UTC→local date (long month to avoid duplicate Sep regex).
- Validation: lint PASS, `tsc --noEmit` PASS, `git diff --check` PASS, focused dashboard-page 15 passed, full 195 passed /31 skipped (5 PG suites skipped), honest Local Host unavailable disclosure throughout.
- Review: R001/R002/R003 each PASS, zero unresolved Critical/Important.
- Closing note: Dashboard still honors "Preserve exactly" list (totals, pipeline, pre-submission, overdue/next7/next30/nearest5/status, /grants links, UTC helpers, schema). Visual identity is calm, professional, information-dense via tokens only.
- Commit: 4fb0271 on main — 7 files +543/-120.

## deadline-view — Deadline View

- Classification: Feature, branch: solo/deadline-view, base: dd9ca12.
- Implemented the authenticated `/deadlines` work view with organization-scoped eligible pre-submission deadline query, exact UTC date-only overdue/due-soon/later windows, stable ordering, semantic responsive lists, existing Grant Sheet deep-links, status styling, safe-noon As of presentation, and honest empty states.
- Added the approved Dashboard follow-up: `Oldest overdue: 1 day` / `N days` derived from the earliest eligible overdue deadline, with no new color level or duplicated row detail.
- T001/T002/T003 BUILD, validation, and review receipts completed. Validation and review passed with zero Critical or Important findings.
- Validation: Node 26 tests passed (206 passed / 32 skipped), focused deadline/Dashboard tests passed (55), lint, TypeScript, Prisma, build, and `git diff --check` passed. PostgreSQL integration was skipped because `GRANTFLOW_TEST_DATABASE_ADMIN_URL` was unavailable.
- Authenticated Safari Technology Preview validation passed for Dashboard desktop/mobile, Deadline View responsive behavior, focus visibility, and `/grants?grant=<id>` Grant Sheet activation.
- No schema, migration, dependency, unsupported URL, reminder, calendar, task, or unrelated application changes were made.
- Feature commit: `1802fec`; merge commit: `5ed44f1`; `main` was pushed to `origin`.
- GIT END completed; `dispatch/ACTIVE.md` is cleared and the merged local execution branch is safe to remove.

## grant-workspace — Grant Workspace

- Classification: Feature, branch: solo/grant-workspace, base: `88e6a4a`.
- Implemented the authenticated `/grants/[grantId]` Grant Workspace with complete scoped record presentation, Overview/Notes/Activity sections, Funder details, tags, edit/status controls, Sheet deep-link, responsive accessibility behavior, and exact workspace mutation revalidation.
- T001/T002 BUILD receipts completed. Root validation found malformed Grant IDs rendering a load error; bounded R001 remediation added normal 404 behavior, then BUILD, validation, and review all passed with no unresolved Critical or Important findings.
- PostgreSQL-enabled full suite passed 251/251 with 0 skipped; focused tests, lint, TypeScript, Prisma verification, production build, and `git diff --check` passed. Safari Technology Preview automated desktop/mobile, Sheet navigation, and malformed/valid-nonexistent 404 checks passed.
- Human Safari Technology Preview gate and explicit merge/GIT END approval were provided before finalization.
- Feature commit: `32c1d69`; fast-forward merged to `main`; GIT END closure commit: `9351a72`; `main` was pushed to `origin`.

## funder-maintenance — Funder Maintenance

- Classification: Feature; execution branch `solo/funder-maintenance`; base `74a1295`.
- Implemented organization-scoped Funder maintenance from `/funders`: complete five-field DTO/query/action support, atomic edits with `funder_updated` Activity, bounded detail Sheet, shared Add/Edit form contract, safe external links, and dependent Grant summary freshness.
- Approved follow-up T003 accepts scheme-less Website values such as `example.com` and normalizes them to `https://example.com`; explicit HTTP(S), blank-to-null, and unsafe-scheme rejection remain intact.
- Validation remediation R001 resolved unsafe URL schemes and dirty edit dismissal. T001/T002/T003 BUILD receipts, original validation, R001 chain, and T003 follow-up validation/review are complete; no unresolved Critical or Important findings remain.
- Validation evidence: full PostgreSQL-enabled suite **279 passed / 0 skipped**; focused T003 suite **38 passed**; lint, TypeScript, Prisma verification, production build, and `git diff --check` passed. Safari Technology Preview automated checks passed; the user provided final visual/browser and merge approval.
- Deferred non-blocking Minor: `example.com:8080` is rejected rather than normalized.
- Feature commit: `1c6baf2`; fast-forward merged to `main`; `main` and the feature branch were pushed to `origin`.
- GIT END completed; `dispatch/ACTIVE.md` is cleared. The local execution branch is safe to remove.

## data-export — Data Export

- Classification: Feature; execution branch `solo/data-export`; base `da091e5`.
- Implemented the authenticated `/export/portfolio` CSV escape hatch with one self-authorizing organization-scoped portfolio query, complete non-deleted all-status Grant rows, active local Tags, related Funder fields, deterministic ordering, exact decimal/date serialization, formula safety, quoted UTF-8 BOM/CRLF output, and generic failure responses.
- Added the single semantic `Export portfolio` action to the existing `/grants` header without propagating list filters, pagination, or client download state.
- T001/T002 BUILD receipts completed; validation and review passed with no unresolved Critical or Important findings.
- Validation evidence: focused checks **78 passed**, PostgreSQL integration **37 passed**, full Node 26 suite **292 passed / 0 skipped**, lint, TypeScript, Prisma verification, production build, and `git diff --check` passed.
- Safari Technology Preview browser diagnosis confirmed no export request on `/grants` load and one successful CSV attachment request after activating the link. The user confirmed the authenticated export worked.
- Feature commit: `9486a81`; merge commit: `d907b7f`; `main` was pushed to `origin`.
- GIT END completed; `dispatch/ACTIVE.md` is cleared. The local execution branch is safe to remove.

## ui-simplification — Reduction-first UI and copy cleanup

- Classification: Feature; execution branch `solo/ui-simplification`; base `08181a9` → merge `0f4da3e`.
- Performed bounded composition/copy pass across Dashboard (`max-w-7xl` metrics strip gray `font-mono tabular-nums`, Needs attention muted zero `text-muted-foreground` + `sm:text-right`, `Oldest overdue` removed, upcoming `py-4`), Grant list (`max-w-7xl` dense table, header/empty copy), Grant detail Sheet (quick inspection only, tags/activity relocated to Workspace), Grant Workspace (`max-w-6xl` single surface, Funder/Status dedupe, code-aware currency `currencyDisplay: code`), Deadline View (`max-w-7xl` single `rounded-xl border` with `border-t` groups, left-border removed, heading/row `px-4` aligned, status via `Badge px-2 py-0.5 font-sans`), Funder list (`max-w-6xl` no footer/shadow) + detail Sheet + slideover `Sheet` for Add funder, Import (`max-w-6xl` container/copy reduction), Shell (desktop org dedupe, avatar `Open account menu` trigger, mobile `lg:hidden` org fallback).
- Typography/brand: `IBM Plex Sans` words + `Geist Mono` plain-zero numbers (`layout.tsx` `IBM_Plex_Sans`/`Geist_Mono` `variable --font-sans/--font-mono`, `globals.css` fallbacks), `DesktopSidebar` org `text-sm font-medium text-foreground` with `title`, app `GrantFlow` `text-primary #4F46E5`, metrics `font-mono`.
- Tasks: T001-T005 DONE; remediations R001 (amount decimals/weight/spacing), R002 (amount formatting), R003 (mobile `pl-0` Requested + funder slideover), R004 (org visibility + indigo + IBM Plex pairing), R005 (Geist Mono plain zero + deadlines/badge alignment), R006 (muted zero + heading `px-4`), R007 (deadline `sm:px-6` removal). All BUILD → VALIDATE → REVIEW PASS; only MINOR Safari MCP tooling limitation remains.
- Validation evidence: full suite **296 tests (259 passed | 37 skipped)** across 44 files, `npx tsc --noEmit` PASS, `npm run lint` PASS, `npm run build` 11 routes compiled (Next 16.3.0 + Prisma generate), `git diff --check` clean. No schema/migration/query/auth/import/export change.
- Merge: feature `37c1115` → `main` via `0f4da3e` (`--no-ff`); `main` pushed to `origin`.
- GIT END completed; `dispatch/ACTIVE.md` cleared.
