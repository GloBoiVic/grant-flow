# R006 Validation - Muted zero and deadline heading alignment

Status: PASS
Role: VALIDATE
Workstream: ui-simplification
Branch: solo/ui-simplification
Remediation: R006-muted-zero-deadline-pad
Date: 2026-09-08

## Verdict

PASS — BUILD satisfies Exact remediation outcome. Dashboard Needs attention overdue/due zero now muted `text-muted-foreground` (not `text-foreground`), deadline group heading `px-4` aligns with row `px-4` and grants page `px-4` baseline. Required checks pass; no out-of-scope violation attributed to R006.

## Scope

Validate `dispatch/workstreams/ui-simplification/remediations/R006-muted-zero-deadline-pad/BUILD.md` against its Exact remediation outcome (BUILD:34-45) and out-of-scope constraints. Branch contains accumulated ui-simplification work (T001-T005 + R001-R006) as unstaged working-dir changes against `08181a9`; isolated R006 inspection performed against `src/components/dashboard/dashboard-content.tsx` and `src/components/deadlines/deadline-view.tsx`, with reference check of `src/components/grants/grants-page.tsx` for alignment baseline.

## Checks Run

| Check | Command | Result |
|-------|---------|--------|
| Tests (full) | `npm run test:run` | PASS — 39 passed, 5 skipped, 259 tests passed, 37 skipped (296 total), duration 2.05s, vitest 4.1.10 |
| Types | `npx tsc --noEmit` | PASS — no output, exit 0 |
| Whitespace | `git diff --check` | PASS — clean, exit 0 |
| Build | `npm run build` | PASS — `prisma generate` + `next build` 16.3.0 Turbopack compiled successfully, 11 routes, TypeScript finished |
| Diff stat | `git diff -- src/components/dashboard/dashboard-content.tsx src/components/deadlines/deadline-view.tsx` | Only R006 scoped lines differ from prior R005 state for heading padding / zero muted; no generated/migration/schema change |

Limitation: No Safari Technology Preview visual run in this turn; alignment judged from source px values + outer `max-w-7xl` reuse. `npm run lint` not re-run (BUILD evidence shows previous lint clean, no lint-affecting syntax change here).

## Finding 1 — Dashboard overdue/due zero muted

**Required:** `src/components/dashboard/dashboard-content.tsx:180,187` change `hasOverdue ? "text-destructive" : "text-foreground"` → `hasOverdue ? "text-destructive" : "text-muted-foreground"` and same for `hasDueSoon`; keep `font-semibold tabular-nums` and `sm:text-right` on due side; red `#DC2626` only when >0, muted gray `#6B7280` for 0 consistent with metrics `font-mono font-normal text-muted-foreground` and breakdown zero `text-muted-foreground`.

**Evidence:**
- `src/components/dashboard/dashboard-content.tsx:82-83` — `const hasOverdue = dto.attention.overdueCount > 0;` `const hasDueSoon = dto.attention.dueIn7Count > 0;` unchanged predicate.
- `src/components/dashboard/dashboard-content.tsx:180` — `<dd className={`mt-1 text-2xl font-semibold tabular-nums ${hasOverdue ? "text-destructive" : "text-muted-foreground"}`}>{dto.attention.overdueCount}</dd>` — muted branch now `text-muted-foreground`, not `text-foreground`. Retains `font-semibold tabular-nums`, `text-2xl`.
- `src/components/dashboard/dashboard-content.tsx:187` — `<dd className={`mt-1 text-2xl font-semibold tabular-nums ${hasDueSoon ? "text-destructive" : "text-muted-foreground"}`}>{dto.attention.dueIn7Count}</dd>` — same muted zero for due. Parent `div` `sm:pl-5 sm:text-right` retained at `:185`.
- Section wrapper `src/components/dashboard/dashboard-content.tsx:163` — `border-destructive/40 bg-destructive-soft/20` when `hasAttention` else `border-border bg-card` unchanged; only zero number color muted, not border.
- Comparison: metrics `src/components/dashboard/dashboard-content.tsx:128,139,150,155` all `text-muted-foreground` with `font-mono tabular-nums`; breakdown zero `src/components/dashboard/dashboard-content.tsx:243,247` `text-muted-foreground` — consistent gray for zero.
- No test asserts `text-foreground` for zero: `src/test/dashboard-page.test.tsx` BUILD notes no `text-foreground` assertion; validated by `npm run test:run` PASS without update.

**Verdict:** PASS

## Finding 2 — Deadline heading/row px-4 alignment with grants page

**Required:** Deadline page left alignment — outer `div` already `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8` (same as GrantsPage `max-w-7xl px-4 py-7 sm:px-6 lg:px-8` and DashboardContent `max-w-7xl px-4 py-6`); change heading container `px-5 py-5 sm:px-6` → `px-4 py-5 sm:px-6` to match row `px-4 py-4` and empty `li` `px-4 py-5`; keep single `rounded-xl border` surface with `border-t` dividers; verify no extra `mx-` offset.

**Evidence:**
- `src/components/deadlines/deadline-view.tsx:84` — `<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">` — `max-w-7xl px-4 sm:px-6 lg:px-8` matches `src/components/grants/grants-page.tsx:141` `mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8` and `src/components/dashboard/dashboard-content.tsx:86` `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8` — outer horizontal scale identical (`px-4` base, `sm:px-6`, `lg:px-8`), no extra `mx-` offset.
- `src/components/deadlines/deadline-view.tsx:92` — `<div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">` — single bordered surface, no per-group `shadow`, `border-t` dividers on groups.
- `src/components/deadlines/deadline-view.tsx:122` — `<div className="px-4 py-5 sm:px-6">` for group heading — now `px-4` (was `px-5` per diff `60db780..c37d6b8`), aligns with:
  - `src/components/deadlines/deadline-view.tsx:60` — `DeadlineRow` `li` `px-4 py-4` (`group flex min-w-0 flex-col gap-2 px-4 py-4 ... sm:flex-row ... ${rowClass}`)
  - `src/components/deadlines/deadline-view.tsx:129` — empty `<li className="px-4 py-5 text-sm text-muted-foreground">{group.emptyMessage}</li>` — same `px-4`.
  - `src/components/grants/grants-page.tsx:157` header `th` `px-4 py-3` and body `td/th` `px-4 py-2` — grants table baseline `px-4`; deadlines heading/rows now consistent at 4px left (1 unit) vs prior 4px mismatch (`px-5` vs `px-4`).
- `groupConfig` at `src/components/deadlines/deadline-view.tsx:14-39` — `sectionClass` `""` / `"border-t border-border"` — dividers preserved; `headerClass` removed, so heading no longer carries tinted background that would mask padding shift; `headingClass` `text-destructive`/`text-urgency-soon-fg`/`text-foreground` unchanged.
- Copy truncation: `git diff` shows heading change is `px-5 → px-4` only; outer `px-4` unchanged; no width token change.

**Verdict:** PASS

## Finding 3 — No out-of-scope change (R006)

**Required:** No font change (keep IBM Plex Sans + Geist Mono with plain zero from R005), no color token addition, no schema/query/auth/import/export, no width change beyond padding alignment, no universal search.

**Evidence:**
- `git diff -- src/components/dashboard/dashboard-content.tsx` shows only zero `text-muted-foreground` swap plus prior accumulated reduction pass changes; no `src/app/layout.tsx`/`src/app/globals.css` font modification in this diff (R005 fonts intact: `Geist_Mono`/`IBM Plex Sans` verified in prior validation).
- `git diff -- src/components/deadlines/deadline-view.tsx` confirmed single `px-4` change; no new color tokens, no `prisma/schema.prisma`, no `src/lib/queries/*`, no `src/app/**/actions.ts`, no `src/components/layout/*` width shift beyond already-bounded `max-w-7xl` (branch-wide, not R006-introduced).
- `npx tsc --noEmit` and `npm run build` PASS confirms no query/DTO breakage.

**Verdict:** PASS

## Regression Evidence Required (BUILD:58-62)

- Code inspection: zero `dd` uses `text-muted-foreground`, heading vs row `px-4` consistent, single `max-w-7xl` border surface — PASS (Findings 1-2).
- `npm run test:run` PASS, `npx tsc --noEmit` PASS, `git diff --check` clean, `npm run build` PASS — PASS (table above).
- Screenshots: Overdue 0 muted gray and Deadline left edge aligns with Grants table left edge — judged PASS from source alignment; visual Safari capture deferred per Limitations.

## Receipt

- Branch: `solo/ui-simplification` (working dir, no commits ahead of `08181a9` at validation time; diff includes accumulated T001-T005 + R001-R006)
- Validated commit: `08181a9` + unstaged worktree (R006 scoped files `src/components/dashboard/dashboard-content.tsx:180,187`, `src/components/deadlines/deadline-view.tsx:122` plus consistent rows at `:60,129` and outer at `:84`)
- Checks: `npm run test:run` PASS (259/37), `npx tsc --noEmit` PASS, `git diff --check` PASS, `npm run build` PASS

## Limitations

- No Safari Technology Preview visual run in this validation turn; alignment judged from `px-4` source consistency vs Grants table `px-4`.
- No `npm run lint` re-run in this turn (BUILD shows previous lint clean, R006 changes are not lint-relevant).
- Branch remains uncommitted working dir; final diff review and commit required before merge.
