# R005 Validation - Deadlines alignment, status padding, and mono dotted zero

Status: PASS
Role: VALIDATE
Workstream: ui-simplification
Branch: solo/ui-simplification
Remediation: R005-deadlines-mono
Date: 2026-09-08

## Verdict

PASS — BUILD satisfies PLAN vs BUILD contract. Mono swap to Geist Mono (plain zero), deadlines row alignment, status badge padding match via shared Badge component, and numbers retention verified. Required checks pass; no width/schema/auth violation attributed to R005.

## Scope

Validate `dispatch/workstreams/ui-simplification/remediations/R005-deadlines-mono/BUILD.md` against its Exact remediation outcome and out-of-scope constraints. Branch contains accumulated ui-simplification work (T001-T005 + R001-R005) as unstaged working-dir changes against `08181a9`; isolated R005 code inspection performed against `src/app/layout.tsx`, `src/app/globals.css`, `src/components/deadlines/deadline-view.tsx`, `src/components/ui/badge.tsx`, `src/components/grants/grants-page.tsx`, `src/components/dashboard/dashboard-content.tsx`, `src/components/grants/grant-detail-sheet.tsx`, `src/components/grants/grant-workspace.tsx`.

## Checks Run

| Check | Command | Result |
|-------|---------|--------|
| Tests (full) | `npm run test:run` | PASS — 39 passed, 5 skipped, 259 tests passed, 37 skipped (296 total), duration 1.92s, vitest 4.1.10 |
| Types | `npx tsc --noEmit` | PASS — no output, exit 0 |
| Whitespace | `git diff --check` | PASS — clean, exit 0 |
| Build | `npm run build` | PASS — `prisma generate` + `next build` 16.3.0 Turbopack compiled successfully, 11 static pages, fonts via next/font |
| Diff stat | `git diff --stat HEAD` | 24 files changed; R005-scoped files among them, no generated/migration/schema change |

Limitation: `npm run lint` not re-run in this validation turn (BUILD evidence shows eslint clean 2026-09-08); no Safari Technology Preview visual run in this turn.

## Finding 1 — Mono dotted zero swap to Geist Mono plain zero

**Required:** Keep IBM Plex Sans for words (`--font-sans`), replace `IBM_Plex_Mono` (dotted zero) with plain-zero mono via `Geist_Mono` `variable: "--font-mono"`, `subsets latin`, `weight 400/500/600/700`, `display swap`, fallback `"Geist Mono"` in `globals.css:27`.

**Evidence:**
- `src/app/layout.tsx:1-17,28` — `import { Geist_Mono, IBM_Plex_Sans } from "next/font/google"`; `ibmPlexSans` retains `variable: "--font-sans"` weight 400/500/600/700 display swap; `geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400","500","600","700"], display: "swap" })`; `<html className={`${ibmPlexSans.variable} ${geistMono.variable} h-full antialiased`}>` — both variables on `<html>`, IBM Plex Sans unchanged.
- `src/app/globals.css:8-14,25-27` — header comment `Fonts: IBM Plex Sans (--font-sans) + Geist Mono (--font-mono) via next/font/google`; `--font-sans: "IBM Plex Sans", ...` retained; `--font-mono: "Geist Mono", ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace;` plain oval zero (Geist Mono has no center dot, unlike IBM Plex Mono).
- No change to `--font-sans` body stack beyond vendor swap; `@theme inline --font-sans/--font-mono` mapping preserved (`globals.css:118-121`).

**Verdict:** PASS

## Finding 2 — Deadlines alignment

**Required:** `DeadlineRow` `li` `flex min-w-0 flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4`; right cluster `flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:shrink-0` vertically centered; `time` `text-sm tabular-nums text-muted-foreground font-sans` (sans, not mono); `Badge` `shrink-0 font-sans`; keep single `rounded-xl border` surface with `border-t` dividers, three H2 groups, `As of`.

**Evidence:**
- `src/components/deadlines/deadline-view.tsx:58-76` —
  - `li` = `` `group flex min-w-0 flex-col gap-2 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${rowClass}` `` — `py-4` (was 3.5) restores scan density after font metric change, `sm:items-center` centers baseline across title/funder vs date/badge.
  - Right cluster `div` = `flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:shrink-0` — `items-center` + `shrink-0` prevents badge wrap misalignment.
  - `time` = `shrink-0 whitespace-nowrap text-sm tabular-nums text-muted-foreground font-sans` — explicit `font-sans` prevents mono line-height offset; `tabular-nums` retained for date digits.
  - `Badge` = `shrink-0 font-sans ${statusClass[item.status] ?? ""}` — `font-sans` forces sans metric matching grants page.
  - `groupConfig` `sectionClass` now `""` / `"border-t border-border"` (tinted `headerClass` removed), `headingClass` `text-destructive`/`text-urgency-soon-fg`/`text-foreground`; outer `div` `mt-6 overflow-hidden rounded-xl border border-border bg-card` single surface, `border-t` dividers — no card-per-group, matches `PLAN:178-189`.
  - Outer container `max-w-7xl` aligns with grants/dashboard scanning surfaces; description subtitle removed (`Deadlines` H1 only), `As of` retained in header (line 89).

**Verdict:** PASS

## Finding 3 — Status padding match grants page via same Badge component

**Required:** Both surfaces use same `Badge` component `badgeVariants` `px-2 py-0.5 text-xs font-medium rounded-full`; Deadline badge must produce identical padding/height as Grants table badge; if mismatch due to mono metrics, ensure `font-sans` and `text-xs font-medium`.

**Evidence:**
- `src/components/ui/badge.tsx:7-9` — `badgeVariants` = `inline-flex w-fit shrink-0 items-center justify-center ... px-2 py-0.5 text-xs font-medium ... rounded-full` unchanged; both surfaces reuse it without fork.
- `src/components/deadlines/deadline-view.tsx:74` — `Badge className={`shrink-0 font-sans ${statusClass...}`}` — `font-sans` ensures same ascent as grants.
- `src/components/grants/grants-page.tsx:157` (inspected + diff HEAD) — status cell changed from `<span className="inline-flex rounded-md px-2 py-0.5 text-caption font-semibold ...">` to `<Badge className={`font-sans ${statusClass[grant.status]}`}>{grant.status}</Badge>` — now identical `px-2 py-0.5 text-xs font-medium rounded-full` as deadlines; prior `rounded-md`/`text-caption`/`font-semibold` divergence removed. `grants-page.tsx:72-79` `TagSummary` badges remain `variant="secondary"` distinct path, unaffected.
- `src/components/dashboard/dashboard-content.tsx:225` `Badge className={`shrink-0 font-sans ${statusClass...}`}` — same pattern for upcoming.

**Verdict:** PASS — identical component and padding; heights match because both force `font-sans`.

## Finding 4 — Numbers remain font-mono tabular-nums

**Required:** Keep `tabular-nums` on metrics/money/dates; ensure `font-mono` only on numbers, not prose.

**Evidence:**
- `src/components/dashboard/dashboard-content.tsx:128,139,150,155` — metrics `font-mono text-metric font-normal text-muted-foreground tabular-nums tracking-metric` (Tracked grants, Open pipeline, Requested, Awarded) — unchanged from R004; `formatMoney` uses `currency` with `minimumFractionDigits 0`.
- `src/components/grants/grants-page.tsx:157-158` via diff — money cells `font-mono text-muted-foreground tabular-nums` (right-aligned); date cells `whitespace-nowrap` without mono (correct, prose-adjacent).
- `src/components/grants/grant-detail-sheet.tsx:62` — `font-mono text-sm font-normal text-muted-foreground tabular-nums` on Amount requested.
- `src/components/grants/grant-workspace.tsx:107-108` — `font-mono font-normal text-muted-foreground tabular-nums` on Amount requested/awarded; header/badge/funder prose remain sans (`grant-workspace.tsx:82` Badge `font-sans`).
- `deadline-view.tsx:71` time explicitly `font-sans` (intentional: dates stay sans tabular-nums, numbers that need mono alignment are metrics/money).

**Verdict:** PASS

## Finding 5 — No width / schema / auth change (R005 out-of-scope)

**Required:** No change to `IBM Plex Sans` body font, no sidebar org/app color change, no width change (`max-w-7xl`/`max-w-6xl`), no universal search, no schema/migration/query/DTO/auth/import/export change, no logo/gradient, no new tokens beyond mono swap.

**Evidence:**
- `--font-sans` still `IBM Plex Sans` (`layout.tsx:5-10`, `globals.css:26`); sidebar files not in R005 diff (BUILD lists only `layout`, `globals`, `deadline-view`, `grants-page`, `dashboard-content`, `grant-workspace` mono normalization).
- Widths on branch vs `HEAD` (main `08181a9`): `dashboard-content.tsx:86` `max-w-7xl`, `grants-page.tsx:141` `max-w-7xl`, `deadline-view.tsx:84` `max-w-7xl`, `grant-workspace.tsx:70` `max-w-6xl` — scanning surfaces share `7xl`, constrained reading surface stays `6xl`; this matches workstream-bounded reduction (earlier T002/T003) and R005 BUILD out-of-scope statement; R005 itself only adjusted `deadline-view` `py-4`/`font-sans` and `Badge` normalization, not width token.
- `git diff --stat HEAD` shows no `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/queries/*`, `src/app/**/actions.ts`, `src/lib/auth*`, `supabase/*`, or migration paths; `badge.tsx` untouched.
- `npx tsc --noEmit` and `npm run build` both PASS, confirming no schema/query breakage.

**Verdict:** PASS (with note: branch-wide `max-w-7xl` shift pre-dates R005 and is consistent across scanning surfaces; workspace `6xl` preserved; no R005-introduced schema/auth/DTO change).

## Regression Evidence Required (BUILD:61-64)

- Code inspection: `layout.tsx` shows `Geist_Mono` with `variable --font-mono`, `globals.css` fallback `Geist Mono` — PASS (see Finding 1).
- Focused screenshots/test evidence: `npm run test:run` full 259 passed — PASS (table above); explicit plain-zero visual not runnable here but Geist Mono is documented plain oval zero (no center dot) vs IBM Plex Mono dotted zero.
- `npx tsc --noEmit` PASS, `git diff --check` clean PASS, `npm run build` PASS (fonts via next/font) — PASS.

## Receipt

- Branch: `solo/ui-simplification` (working dir, no commits ahead of `08181a9` at validation time)
- Validated commit: `08181a9` + unstaged worktree (R005 files as listed)
- Checks: `npm run test:run` PASS (259/37), `npx tsc --noEmit` PASS, `git diff --check` PASS, `npm run build` PASS

## Limitations

- No Safari Technology Preview visual run in this validation turn; alignment and badge height equivalence judged from source + `Badge` reuse.
- No `npm run lint` re-run in this turn (BUILD shows clean).
- Branch remains uncommitted working dir; final diff review and commit required before merge.
