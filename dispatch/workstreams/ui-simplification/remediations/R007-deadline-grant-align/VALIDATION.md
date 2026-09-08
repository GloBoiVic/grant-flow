# R007 Validation — Deadline grant-align px-4

Status: PASS
Role: VALIDATE
Workstream: ui-simplification
Branch: solo/ui-simplification
Remediation: R007-deadline-grant-align
Date: 2026-09-08

## Verdict

PASS — BUILD satisfies Exact remediation outcome. Deadline inner card now `px-4` at all breakpoints: heading `px-4 py-5` (no `sm:px-6`), no-grants states `px-4 py-4` (was `px-5 sm:px-6`), rows `px-4 py-4` and empty group `px-4 py-5`, all aligning left with Grants table `th/td px-4` beneath shared `max-w-7xl px-4 sm:px-6 lg:px-8` outer. Required checks pass; no out-of-scope violation attributed to R007.

## Scope

Validate `dispatch/workstreams/ui-simplification/remediations/R007-deadline-grant-align/BUILD.md` against its Exact remediation outcome (BUILD:27-34) and out-of-scope constraints. Branch remains accumulated ui-simplification work (T001-T005 + R001-R007) as unstaged working-dir changes against `08181a9`; isolated R007 inspection performed against `src/components/deadlines/deadline-view.tsx` with reference check of `src/components/grants/grants-page.tsx` for `px-4` alignment baseline.

## Checks Run

| Check | Command | Result |
|-------|---------|--------|
| Tests (full) | `npm run test:run` | PASS — 39 passed, 5 skipped (44), 259 tests passed, 37 skipped (296 total), duration 2.38s, vitest 4.1.10 |
| Types | `npx tsc --noEmit` | PASS — no output, exit 0 |
| Whitespace | `git diff --check` | PASS — clean, exit 0 |
| Build | `npm run build` | PASS — `prisma generate` + `next build` 16.3.0 Turbopack compiled successfully in 833ms, TypeScript 826ms, 11 routes |
| Grep px- | `grep -n "px-" src/components/deadlines/deadline-view.tsx` | PASS — only inner `px-4` + outer `px-4 sm:px-6 lg:px-8`; no inner `sm:px-6` or `px-5` remains |

Limitation: No Safari Technology Preview visual run in this turn; alignment judged from source `px-4` consistency + shared `max-w-7xl` outer. No `npm run lint` re-run (R007 change is padding-only, BUILD shows prior lint clean).

## Finding 1 — Heading px-4 sm:px-6 removed

**Required:** `src/components/deadlines/deadline-view.tsx:122` change `px-4 py-5 sm:px-6` → `px-4 py-5` (remove `sm:px-6`). Outer `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8` at `:84` stays matching Grants `max-w-7xl px-4 py-7 sm:px-6 lg:px-8`. Inner card `mt-6 overflow-hidden rounded-xl border border-border bg-card` at `:92` stays single surface. Keep `py-5` breathing on heading.

**Evidence:**
- `src/components/deadlines/deadline-view.tsx:84` — `<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">` — outer `max-w-7xl px-4 sm:px-6 lg:px-8` matches `src/components/grants/grants-page.tsx:141` `mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8` — shared horizontal scale.
- `src/components/deadlines/deadline-view.tsx:92` — `<div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">` — single bordered surface, no per-group shadow.
- `src/components/deadlines/deadline-view.tsx:122` — `<div className="px-4 py-5">` — heading container now `px-4 py-5` with no `sm:px-6`; verified via `Read` post-edit and `grep -n px-` shows no `sm:px-6` at `:122`.
- `grep -n px- src/components/deadlines/deadline-view.tsx` — `:60 px-4 py-4`, `:84 px-4 sm:px-6 lg:px-8`, `:94 px-4 py-4`, `:108 px-4 py-4`, `:122 px-4 py-5`, `:129 px-4 py-5` — only outer retains `sm:px-6`; all inner are `px-4`.
- No `sm:px-6` remains in inner card; prior R006 state had `px-4 py-5 sm:px-6` at heading, now removed.

**Verdict:** PASS

## Finding 2 — No-grants / no-eligible px-4 aligns with rows and Grants table

**Required:** No-grants tracked `:94` and no-eligible `:108` change `px-5 py-4 sm:px-6` → `px-4 py-4` to match heading/rows. Rows `:60` stay `px-4 py-4`; empty group `:129` `px-4 py-5` stays. Result: at all breakpoints heading, rows, empty states all `px-4` left, aligning with Grants `th/td px-4` (no `sm:` bump).

**Evidence:**
- `src/components/deadlines/deadline-view.tsx:94` — `<div className="border-b border-border px-4 py-4">` — no-grants tracked now `px-4 py-4` (was `px-5 py-4 sm:px-6` per BUILD worker evidence).
- `src/components/deadlines/deadline-view.tsx:108` — `<div className="border-b border-border px-4 py-4">` — no-eligible now `px-4 py-4` (was `px-5 py-4 sm:px-6`).
- `src/components/deadlines/deadline-view.tsx:60` — `DeadlineRow` `li` `px-4 py-4` (`group flex min-w-0 flex-col gap-2 px-4 py-4 transition-colors sm:flex-row ... ${rowClass}`) — unchanged.
- `src/components/deadlines/deadline-view.tsx:129` — `<li className="px-4 py-5 text-sm text-muted-foreground">{group.emptyMessage}</li>` — empty group `px-4 py-5` unchanged.
- `src/components/grants/grants-page.tsx:157` — table header `th` `px-4 py-3` and body `th/td` `px-4 py-2` — Grants baseline is `px-4` with no `sm:` bump; Deadlines heading/rows/empty now all `px-4` at every breakpoint, so left edge aligns at mobile and `≥640px` (previously `sm:px-6` shifted heading 8px right at `≥640px`, `px-5` shifted no-grants 4px).
- `src/test/deadline-view.test.tsx:39` — `expect(screen.getByRole("heading", { name: "Overdue" }).parentElement).toHaveClass("py-5");` asserts `py-5` on heading parent (still passes since `py-5` retained); row `py-4` asserted at `:40` `toHaveClass("py-4")` — both hold after R007; no `sm:px-6` assertion exists so no test update required — verified by `npm run test:run` PASS.

**Verdict:** PASS

## Finding 3 — No out-of-scope change (R007)

**Required:** No font/mono/color change, no width change beyond inner px, no schema/query.

**Evidence:**
- `git diff --check` clean; `npx tsc --noEmit` exit 0 and `npm run build` PASS confirm no DTO/query/type breakage.
- `grep -n px-` shows only padding token change inner `px-5 → px-4` and removal of `sm:px-6` on heading/no-grants; outer `max-w-7xl` unchanged; no `src/app/globals.css`/`src/app/layout.tsx` font modification, no `statusClass`/`groupConfig` color change beyond already-bounded R003-R005 tokens, no `prisma/schema.prisma`, no `src/lib/queries/*` change attributed to R007.
- Full branch diff vs `08181a9` includes accumulated T001-T005 + R001-R007 (24 files, `src/components/deadlines/deadline-view.tsx` central); R007 isolated delta is only `src/components/deadlines/deadline-view.tsx:94,108,122` inner `px-4` alignment.

**Verdict:** PASS

## Regression Evidence Required (BUILD:45-48)

- Code inspection: heading `px-4 py-5` no `sm:px-6`, no-grants `px-4 py-4`, rows `px-4 py-4`, outer `max-w-7xl px-4 sm:px-6 lg:px-8` — PASS (Findings 1-2).
- `npm run test:run` PASS, `npx tsc --noEmit` PASS, `git diff --check` clean, `npm run build` PASS — PASS (table above).
- Visual: headings/rows left edge aligns with Grants table left edge at mobile and `≥1024px` — judged PASS from source `px-4` consistency; Safari DB-running capture deferred per Limitations.

## Receipt

- Branch: `solo/ui-simplification` (working dir, no commits ahead of `08181a9` at validation time; diff includes accumulated T001-T005 + R001-R007)
- Validated worktree files: `src/components/deadlines/deadline-view.tsx:60,84,92,94,108,122,129` and reference `src/components/grants/grants-page.tsx:141,157` (`px-4` baseline)
- Checks: `npm run test:run` PASS (259/37), `npx tsc --noEmit` PASS, `git diff --check` PASS, `npm run build` PASS (Next 16.3.0, 11 routes)

## Limitations

- No Safari Technology Preview visual run in this validation turn; alignment judged from `px-4` source consistency vs Grants table `px-4` and shared outer `max-w-7xl`.
- No `npm run lint` re-run in this turn (R007 is padding-only, prior lint clean per BUILD worker evidence).
- Branch remains uncommitted working dir; final diff review and commit required before merge.
