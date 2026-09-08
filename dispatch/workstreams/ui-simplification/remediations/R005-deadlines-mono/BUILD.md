# R005 - Deadlines alignment, status padding, and mono dotted zero

Remediation ID: R005
Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification

## Origin finding and source artifact

Developer visual observations 2026-09-08 post-R004 (IBM Plex pairing):

- Image 1 (Deadlines): font change messed up alignment in the deadlines section.
- Image 2 (Grants table): status padding does not match the grants page (Deadlines badge vs Grants badge).
- Number font has a weird dot inside zeros (IBM Plex Mono dotted zero). Prefer plain zero without dot.

Source: user message with deadlines/grants screenshots 2026-09-08.

## Finding severity

IMPORTANT (visual regression within approved typography pass; dotted-zero preference blocks acceptance).

## Related original task(s)

- T003 - Grant Workspace and Deadline View
- T004/R004 - Typography and brand accent (IBM Plex Sans + Mono)

## Approved requirement or invariant violated

- PLAN Composition baseline: typography/spacing establish hierarchy; Deadline View is one coherent bordered three-group surface with restrained urgency (`PLAN:178-189`). Must not lose alignment after font swap.
- Reduction principles: keep accessible semantics; do not introduce unrelated chrome.
- Previous R004 introduced IBM Plex Mono with dotted zero (distinctive center dot) — user prefers plain zero, so mono must be swapped while keeping IBM Plex Sans for words.

## Exact remediation outcome

1. **Mono dotted zero** — keep words on IBM Plex Sans (approved C for nonprofit professionals). Replace mono `IBM_Plex_Mono` (dotted zero) with a plain-zero mono suited to tabular financials, while preserving `--font-mono` variable:
   - Choice: `Geist_Mono` (Vercel, plain oval zero, tabular) via `next/font/google` (`Geist_Mono`) with same `variable: "--font-mono"`, `subsets latin`, `weight 400/500/600/700`, `display swap`. Fallback update in `globals.css:27` to `"Geist Mono"` (keep UI-monospace fallback). Alternative allowed if Geist Mono not available: `Source_Code_Pro`, `Fira_Mono`, or `JetBrains_Mono` with `zero` disabled — but prefer Geist Mono for zero plainness and metric weight match. Do not change `--font-sans` (stays IBM Plex Sans).
   - Keep `tabular-nums` on metrics/money/dates; ensure `font-mono` only on numbers (dashboard metrics `font-mono text-metric`, grant table money `font-mono tabular-nums`, detail/workspace amounts) not on prose.

2. **Deadlines alignment** — `src/components/deadlines/deadline-view.tsx:58-78`:
   - Inspect and restore row alignment after font swap: `DeadlineRow` `li` keeps `flex min-w-0 flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4`. Ensure right cluster `div` `flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:shrink-0` vertically centers with left title/funder; ensure `time` stays `text-sm tabular-nums text-muted-foreground` (sans, not mono) and `Badge` stays `shrink-0` with same baseline as grants page. Adjust `py-4` vs grants table `h-(--layout-table-row-h) 44px` if needed to keep scan density — but do not switch to card-per-group.
   - Keep group headings `Overdue / Due in next 7 days / Later` and `As of`, `border-t` dividers, single `rounded-xl border` surface.

3. **Status padding match** — `src/components/ui/badge.tsx:8` and `deadline-view.tsx:74`, `grants-page.tsx` badges:
   - Both surfaces use same `Badge` component (`badgeVariants` `px-2 py-0.5 text-xs font-medium rounded-full`). Verify Deadline `Badge` `className={`shrink-0 ${statusClass[item.status] ?? ""}`}` produces identical padding/height as Grants table `Badge` (which renders status with same `badgeVariants`). If mismatch due to mono font metrics, ensure Deadline badge uses `font-sans` (not `font-mono`) and same `text-xs font-medium` so height matches. Do not change status color mapping.

## Affected implementation seams

- `src/app/layout.tsx` (swap `IBM_Plex_Mono` → `Geist_Mono` while keeping `IBM_Plex_Sans`)
- `src/app/globals.css` (update `--font-mono` fallback to Geist Mono, keep `--font-sans` IBM Plex Sans)
- `src/components/deadlines/deadline-view.tsx` (alignment/padding verification, ensure Badge font-sans)
- `src/components/ui/badge.tsx` (only if padding normalization needed; otherwise reuse)
- `src/components/dashboard/dashboard-content.tsx`, `grants-page.tsx`, `grant-detail-sheet.tsx`, `grant-workspace.tsx` (keep `font-mono tabular-nums` on numbers; verify plain zero)
- Tests: `src/test/dashboard-page.test.tsx`, `grant-ui.test.tsx`, `deadline-view.test.tsx` (mono font assertions if any)

## Explicit out-of-scope items

- No change to `IBM Plex Sans` body font (keeps approved C words), no sidebar org/app color change, no width change (`max-w-7xl`/`max-w-6xl`), no universal search, no schema/migration/query/DTO/auth/import/export change, no logo/gradient, no new design tokens beyond mono swap.

## Regression evidence required

- Code inspection: `layout.tsx` shows `Geist_Mono` with `variable --font-mono`, `globals.css` fallback `Geist Mono`, metrics still `font-mono tabular-nums`, zero renders plain (no center dot).
- Screenshots or `npm run test:run` focused `deadline-view.test.tsx` + `grant-ui.test.tsx` pass showing Deadline rows and Grants status badges share same `px-2 py-0.5 text-xs font-medium` and same `bg-status-*` classes.
- `npx tsc --noEmit` PASS, `git diff --check` clean, `npm run build` PASS (fonts via next/font), full `npm run test:run` baseline PASS.

## Worker Evidence

### Code inspection (2026-09-08)
- `src/app/layout.tsx:1-3,12-19,24-28`: `import { Geist_Mono, IBM_Plex_Sans } from "next/font/google"`; `ibmPlexSans` retains `variable --font-sans` weight 400/500/600/700 display swap; `geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400","500","600","700"], display: "swap" })`; `<html className={`${ibmPlexSans.variable} ${geistMono.variable} h-full antialiased`}>` keeps both variables on <html>. IBM Plex Sans unchanged for words.
- `src/app/globals.css:8-14,25-27`: Header comment updated to `Fonts: IBM Plex Sans (--font-sans) + Geist Mono (--font-mono) via next/font/google.`; loader comment `IBM Plex Sans / Geist Mono are loaded via next/font`; `:root --font-sans: "IBM Plex Sans", ...` retained; `--font-mono: "Geist Mono", ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace;` plain oval zero, no dotted zero.
- `src/components/deadlines/deadline-view.tsx:58-76`: `DeadlineRow li` = `group flex min-w-0 flex-col gap-2 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${rowClass}`; right cluster `flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:shrink-0` vertically centered; `time` = `shrink-0 whitespace-nowrap text-sm tabular-nums text-muted-foreground font-sans` (sans, not mono, prevents mono line-height offset); `Badge` = `shrink-0 font-sans ${statusClass[item.status] ?? ""}` uses `badgeVariants` default `px-2 py-0.5 text-xs font-medium rounded-full` with explicit `font-sans` so height matches Grants page. Aligns with `PLAN:178-189` single `rounded-xl border` surface, `border-t` dividers.
- `src/components/grants/grants-page.tsx:157`: Status cell now `<Badge className={`font-sans ${statusClass[grant.status]}`}>{grant.status}</Badge>` — same `Badge`/`badgeVariants` as deadlines (px-2 py-0.5 text-xs font-medium) with `font-sans`, replacing prior `span inline-flex rounded-md px-2 py-0.5 text-caption font-semibold`. Padding/height now identical between Deadlines and Grants.
- `src/components/dashboard/dashboard-content.tsx:128,139,150,155`: Metrics retain `font-mono text-metric font-normal text-muted-foreground tabular-nums tracking-metric`; Upcoming `Badge` updated to `shrink-0 font-sans ${statusClass...}` (sans, not mono).
- `src/components/grants/grants-page.tsx:157-158`: Money cells retain `font-mono text-muted-foreground tabular-nums` (plain Geist Mono zero); `src/components/grants/grant-detail-sheet.tsx:62` and `grant-workspace.tsx:107-108,82` retain `font-mono font-normal text-muted-foreground tabular-nums` on amounts only, prose remains sans.
- `src/components/ui/badge.tsx:8`: No change needed; `badgeVariants` already `inline-flex ... px-2 py-0.5 text-xs font-medium rounded-full` — both surfaces reuse it.

### Checks (2026-09-08)
- `npm run test:run -- src/test/deadline-view.test.tsx src/test/grant-ui.test.tsx` — 2 test files, 27 tests PASS (vitest 4.1.10, duration 1.10s).
- `npm run test:run` (full) — 39 passed, 5 skipped, 259 tests passed, 37 skipped (296 total) PASS.
- `npx tsc --noEmit` — PASS (no output).
- `git diff --check` — PASS (clean, no whitespace errors).
- `npm run build` — PASS (`prisma generate` + `next build` 16.3.0 Turbopack compiled successfully, TypeScript finished, 11 static pages generated, fonts via next/font).
- `npm run lint` — PASS (`eslint` clean).

### Branch state
- Branch `solo/ui-simplification` verified via `git status --short` / `git diff --stat`; R005 edits limited to `src/app/layout.tsx`, `src/app/globals.css`, `src/components/deadlines/deadline-view.tsx`, `src/components/grants/grants-page.tsx`, `src/components/dashboard/dashboard-content.tsx`, `src/components/grants/grant-workspace.tsx` (mono/font-sans normalization). No out-of-scope schema/DTO/auth/import/export or `--font-sans` changes; pre-existing user changes preserved.

