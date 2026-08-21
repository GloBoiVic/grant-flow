# Review — GF-PHASE1-001 Organization-Scoped Grant Tracking

Gate: R1
Date: 2026-08-21
Reviewer: independent (R1 formal review)
Reviewed scope: complete change set relative to starting SHA `203b923bc31c7394b0c9fb57d8c29a7778db1483` on branch `feature/gf-phase1-001` (tracked modifications + untracked phase-1 files in the working tree).

---

## Benchmarks consulted

- `AGENTS.md`, `dispatch/PLAN.md`, `dispatch/ARCHITECTURE.md`, `dispatch/EXPLORATION.md`, `dispatch/TASKS.md`, `dispatch/DECISIONS.md`, `dispatch/COMPLETED.md`
- `context/architecture.md`, `context/database.md`, `context/coding-standards.md`, `context/design.md`, `context/tech-stack.md`
- `prisma/schema.prisma`, `src/app/globals.css`
- Inspected every new/modified source file, test, and the full tracked diff from the starting SHA.

## Spec compliance: ISSUES
## Task quality: ISSUES
## Layer 1 (plan alignment): PASS
## Layer 2 (system integrity): ISSUES
## Layer 3 (production readiness): ISSUES

---

## Summary of independent verification (what I actually ran)

I did **not** modify code, docs, Git state, the database, dependencies, or the environment. Gates run in this checkout:

| Gate | Command | Result |
|---|---|---|
| Tests | `npm run test:run` | **113 passed / 20 skipped** (133 total) |
| Lint | `npm run lint` | clean |
| TypeScript | `npx tsc --noEmit` | clean (exit 0) |
| Build | `npm run build` | compiled successfully (exit 0) |

**PostgreSQL-backed execution was NOT verified.** The domain/tenant integration suite
(`src/test/postgres-domain-isolation.integration.test.ts`) is gated behind
`GRANTFLOW_TEST_DATABASE_ADMIN_URL` (`:27`), which is **not set** in this environment, so those
tests — including every cross-org isolation assertion — were skipped (part of the 20 skipped).
I make no claim that the database-backed acceptance criteria passed; I only verified them by
code inspection. Zod strict-mode behavior was confirmed with a standalone runtime check
(no repository mutation).

---

## Findings

### F1 — CRITICAL — Grant **edit** always fails from the UI (strict Zod contract rejects the payload)

- **Location**
  - `src/components/grants/grant-form.tsx:21` (edit submit path)
  - `src/lib/validations/grant.ts:49-64` (`editGrantSchema`, `.strict()`, omits `status`)
- **Evidence**
  - `grant-form.tsx` `submit()` builds `input = { ...values, … }` from form state; `FormValues` includes `status` (`:12`, `fromGrant` `:14`). For edit it calls `editGrant({ grantId: grant.id, ...input })` (`:21`), so `status` is always present in the payload.
  - `editGrantSchema` does **not** declare `status` and is `.strict()`. Zod v4 strict mode emits `unrecognized_keys: ["status"]` — confirmed by a direct runtime check: `safeParse({ grantId:'x', status:'Research' })` → `success:false`.
  - `src/lib/validations/grant.ts:70` `changeGrantStatusSchema` intentionally owns status; the edit contract excludes it by design, and `src/test/domain-contracts.test.ts:20` explicitly asserts `editGrantSchema.safeParse({grantId, status}).success === false`.
- **Impact**
  - The "edit grant" acceptance criterion is broken end-to-end: clicking **Save changes** in the edit Sheet always returns `Invalid grant details.` and never persists an edit or writes `grant_updated` Activity. This is a core deliverable of the slice (create/list/view/**edit**/status).
  - No test exercises the real edit-submit path: `grant-ui.test.tsx` covers only create + status; `domain-actions.test.ts` does not test `editGrant`; the DB integration test calls `editGrant({grantId, title})` **without** `status` (`postgres-domain-isolation.integration.test.ts:347`), so the broken UI path is uncaught by the entire suite.
- **Remedy**
  - Do not send `status` on the edit payload (it is a disabled field in the edit form — strip it before calling `editGrant`), **or** add `status` as an allowed, unchanged field in `editGrantSchema`. Add an edit-submit UI test and a `grant-ui` test that submits the edit form and asserts a successful `editGrant` call with the actual payload shape.

### F2 — IMPORTANT — Database-backed tenant-isolation acceptance evidence is unverified; "133 tests passing" is overstated

- **Location**
  - `src/test/postgres-domain-isolation.integration.test.ts:27,29` (skip gate)
  - `dispatch/TASKS.md:14` (claim)
- **Evidence**
  - The plan/architecture acceptance requires "PostgreSQL-backed tests prove one organization cannot list, read, mutate, status-change, or attach another organization's records." Those tests exist and are well-constructed (cross-org list/read/edit/status/create-attach/soft-delete coverage), but they are skipped unless `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is set. In this review run it was **not** set, so all DB-backed isolation assertions were skipped.
  - Actual suite result is **113 passed / 20 skipped**, not "133 tests … passing". The 20 skipped include the DB-backed domain tests and the DB-backed onboarding tests.
- **Impact**
  - The security-critical cross-org isolation claim is not yet evidenced by a passing run. Code inspection of the scoped queries (`src/lib/queries/grants.ts`, `funders.ts`, `activities.ts`) and in-transaction relation checks (`grants/actions.ts:96,119,122,147`) supports correct isolation, but the stated acceptance evidence must come from an actual disposable-PostgreSQL run.
- **Remedy**
  - Run the DB-backed gate with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` pointed at a disposable server and record the passing count (or the specific skipped set) in `dispatch/TASKS.md` / `dispatch/DECISIONS.md` before claiming completion. Re-verify F1 is fixed first, since the edit integration test currently bypasses the broken payload.

### F3 — MINOR — `editGrant` appends a `grant_updated` Activity even when no field actually changed

- **Location** `src/app/(authenticated)/(org-required)/grants/actions.ts:113-139`
- **Evidence** `editGrant` writes the Activity unconditionally on a valid call (`:133`); there is no change-detection comparing submitted values to the existing row. A no-op save still logs "Updated grant …".
- **Impact** Slightly noisy Activity history; not a plan violation (only same-**status** submissions are required to write nothing). Non-blocking.
- **Remedy** Optionally compare parsed values against `existing` and skip the write (and Activity) when nothing changed — mirroring `changeGrantStatus`'s no-op path.

### F4 — MINOR — No test exercises the dirty/confirm behavior or the Sheet width/route contract for the edit form

- **Location** `src/test/grant-ui.test.tsx`
- **Evidence** Dirty-form protection is tested for create only (`:38-48`); the edit form's dirty close/escape behavior and the 480px Sheet width (`--layout-slideover-w` = 480px in `globals.css:112`, used in `src/components/ui/sheet.tsx:65`) have no coverage.
- **Impact** These acceptance items are implemented and verified by inspection but lack regression coverage. Non-blocking.
- **Remedy** Add edit-mode dirty-dismiss and Sheet width/`sm:w-[var(--layout-slideover-w)]` assertions.

---

## Acceptance-criteria verification (by inspection, except where noted)

- **Scoped funder & grant vertical slice** — PASS. Funder list/create; grant create/list/detail/edit/status.
- **Session-derived org scope** — PASS. `requireAuthorization()`/`authorizeAction()` derive `organizationId` from the Clerk session (`src/lib/clerk/authorization.ts:30-40`); never client-supplied; all reads/mutations scope by it.
- **Cross-org denial / missing behavior** — PASS (code). Reads filter `organizationId` + `deletedAt:null` + funder org; cross-org records return null/empty. DB-backed proof not executed in this environment (see F2).
- **Relation ownership checks** — PASS. `createGrant` verifies funder in-org+active inside the transaction (`actions.ts:96`); `editGrant` verifies the existing grant and, on funder change, the new funder (`actions.ts:119,122`); `changeGrantStatus` verifies the grant's funder (`actions.ts:147`).
- **Atomically append-only Activity** — PASS. All mutations wrap grant/funder + Activity in `prisma.$transaction`; Activity never updated.
- **Status no-op** — PASS. `changeGrantStatus` returns early with no update/Activity/revalidate on same-status (`actions.ts:150,156-158`).
- **Server-owned fields** — PASS. `organizationId`, `ownerId`, `createdById`, `currency`, timestamps, deletion are server-set; schemas are `.strict()` and reject client-supplied `organizationId` (asserted in `domain-contracts.test.ts:8`, `domain-actions.test.ts:37`, and the DB integration test).
- **DTO serialization** — PASS. Decimal→string, dates→`YYYY-MM-DD`, timestamps→ISO before crossing to client (`src/lib/queries/serializers.ts`, `grants/actions.ts:39-57`).
- **Pagination / Sheet routes / UI state** — PASS. Cursor pagination with bounded limit (`queries/grants.ts:42-45,95-112`); Sheet driven by `?grant=`, `?create=1`, `?cursor=` query params (`grants/page.tsx:11-27`); 480px desktop width confirmed.
- **Accessibility / dirty forms** — PASS (by inspection). Labels, `aria-invalid`/`aria-describedby`, `sr-only`, `role=alert/status`, `isDirty` confirm on close/escape.
- **Explicit deferrals** — PASS. No out-of-scope delete, bulk, owner-transfer, document, tag, or contact controls in the UI; no migration, dependency, or commit made.
- **Design authority** — PASS. All classes map to existing `globals.css` tokens (verified via grep); no new tokens introduced; 480px Sheet token reused.

---

## Review — GF-PHASE1-001

- Gate: R1
- Spec compliance: ISSUES
- Task quality: ISSUES
- Layer 1 (plan alignment): PASS
- Layer 2 (system integrity): ISSUES
- Layer 3 (production readiness): ISSUES
- Findings: F1 Critical, F2 Important, F3 Minor, F4 Minor
- Decision: **BLOCKED**

## Rationale

- **F1 (Critical)** blocks the task: the edit grant flow — an explicit acceptance criterion — is broken end-to-end from the UI, and the defect is not exercised by any test. Must be fixed and covered before this slice can be considered complete.
- **F2 (Important)** must be resolved before completion is claimed: the PostgreSQL-backed cross-org isolation acceptance evidence was not produced in this review (tests skipped), and the "133 tests passing" claim overstates the actual 113-passed / 20-skipped result. The DB-backed gate should be run once F1 is fixed and its count accurately recorded.

No code, doc, Git, database, dependency, or environment changes were made during this review.

---

# Re-review — GF-PHASE1-001 (additive; initial findings above are preserved and unchanged)

Gate: R1 (re-review of the previously blocked layers)
Date: 2026-08-21
Scope: verify remediation of F1 (Critical) and F2 (Important) only. No code, docs, Git,
database, dependency, or environment state was modified during this re-review.

## Independent checks run in this re-review

| Gate | Command | Result |
|---|---|---|
| Tests | `npm run test:run` | **114 passed / 20 skipped** (134 total) |
| Lint | `npm run lint` | clean |
| TypeScript | `npx tsc --noEmit` | clean (exit 0) |
| Integration suite composition | grep of `*integration.test.ts` | exactly **20 `it()` tests** across the two suites (19 domain-isolation + 1 onboarding) |

The 20 skipped in the normal run are precisely these 20 opt-in integration tests, gated by
`GRANTFLOW_TEST_DATABASE_ADMIN_URL` (`postgres-domain-isolation.integration.test.ts:27,29`;
`postgres-onboarding.integration.test.ts:24,26`). In this environment the variable is **not set**,
so I could not independently re-execute the database-backed run. The PostgreSQL execution
evidence below is therefore attested in the dispatch records and verified for consistency and
structure, not independently reproduced by me here.

## F1 — CRITICAL (edit Sheet always rejected `status`) — RESOLVED

- **Verified fix in the actual edit Sheet path** — `src/components/grants/grant-form.tsx:21`:
  `submit()` now builds `editableInput` **without** `status` and, for edit, calls
  `editGrant({ grantId: grant.id, ...editableInput })`. `status` is added **only** on the create
  branch (`createGrant({ ...editableInput, status: values.status })`). The edit payload therefore
  satisfies the strict `editGrantSchema` (`src/lib/validations/grant.ts:49-64`), which by design
  owns no `status` field (`changeGrantStatusSchema` owns it). This is the exact path the initial
  review flagged.
- **Verified new UI coverage** — `src/test/grant-ui.test.tsx:50-64` ("submits edits without the
  separately managed status field") renders the edit `GrantForm`, types a new title, clicks
  **Save changes**, and asserts: `editGrant` called once with `{ grantId, title, funderId }` and
  **`payload` does not have property `status`**, plus success feedback. This exercises the real
  edit-submit payload shape that was previously untested.
- **No create regression** — the create branch still sends all `createGrantSchema` fields plus
  `status`; the existing create/dirty test (`grant-ui.test.tsx:38-48`) and the full suite pass.
- **Gate results:** `test:run` 114 passed / 20 skipped; lint clean; `tsc --noEmit` clean.
- **F1 status: FIXED.**

## F2 — IMPORTANT (DB-backed tenant-isolation evidence unverified; count overstated) — RESOLVED (recorded evidence)

- **Exact run claim matches suite composition** — the two integration suites contain exactly
  **20 `it()` tests** (19 in `postgres-domain-isolation.integration.test.ts`, 1 in
  `postgres-onboarding.integration.test.ts`), matching the recorded "20 passing / 0 skipped /
  0 failed".
- **Recorded evidence is accurate and consistent** across dispatch records:
  - `dispatch/TASKS.md:14` — "Fresh disposable PostgreSQL evidence: 20 integration tests passed
    with zero skipped/failed; setup/teardown left no disposable databases or connections."
  - `dispatch/MODEL-LOG.md:18` — "success — reran opt-in disposable PostgreSQL suites with 20
    passing / 0 skipped / 0 failed; verified clean database teardown and no persisted credentials
    or code changes."
- **Clean-teardown evidence (code + record)** — both suites implement `cleanup()` that drops the
  disposable database (`DROP DATABASE IF EXISTS`), disconnects every Prisma client / `pg` Pool,
  ends the admin pool, and registers `afterAll(cleanup, …)` (`postgres-domain-isolation…:107-148,186`;
  `postgres-onboarding…:47-81,112`); setup failure also runs cleanup. This matches the recorded
  "no disposable databases or connections" claim.
- **Limitation disclosed** — I could not personally re-run the PostgreSQL-backed gate here
  (`GRANTFLOW_TEST_DATABASE_ADMIN_URL` unset; environment may not be modified). I verified the
  recorded counts, suite composition, and teardown structure; the execution outcome is attested
  in the dispatch records rather than independently reproduced in this environment.
- **F2 status: RESOLVED on recorded evidence** (no contradictory evidence; records now accurate).

## Remaining findings

- **F3 (MINOR, unchanged)** — `editGrant` appends a `grant_updated` Activity even when no field
  actually changed (`grants/actions.ts:113-139`). Non-blocking.
- **F4 (MINOR, unchanged)** — no coverage for edit-mode dirty-dismiss or the 480px Sheet
  width/route contract. Non-blocking.

No remaining Critical or Important findings.

---

## Review (final) — GF-PHASE1-001

- Gate: R1
- Spec compliance: PASS
- Task quality: PASS
- Layer 1 (plan alignment): PASS
- Layer 2 (system integrity): PASS
- Layer 3 (production readiness): PASS
- Findings: F1 Critical (RESOLVED), F2 Important (RESOLVED), F3 Minor, F4 Minor
- Decision: **PASS**

## Rationale (re-review)

- **F1** is fixed in the actual edit Sheet path (`grant-form.tsx:21`) and covered by the new
  edit-submit UI test (`grant-ui.test.tsx:50-64`); the full suite, lint, and typecheck pass.
- **F2** now has consistent, accurate recorded evidence of a fresh disposable-PostgreSQL run
  (20/0/0) and clean teardown, matching the exact 20-test integration-suite composition, with
  sound teardown code in both suites. The residual caveat — that I did not independently re-run
  the DB gate in this environment — is disclosed above and does not, on the recorded evidence,
  block completion.
- **F3 / F4 remain Minor and non-blocking.**

No code, doc, Git, database, dependency, or environment changes were made during this re-review.
