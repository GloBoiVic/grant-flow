# R004 - REVIEW

Role: REVIEW
Workstream: ui-simplification
Branch: solo/ui-simplification
Task: R004
Artifact: dispatch/workstreams/ui-simplification/remediations/R004-typography-brand/REVIEW.md
Date: 2026-09-08

## Verdict

**PASS** — R004 correctly implements the approved typography and brand-accent remediation within bounded scope. Org name bump, app name indigo, and IBM Plex Sans/Mono pairing with mono on metrics/money cells are verified in source at cited lines, with collapse/overflow/width contracts preserved, no schema/query/auth/universal-search change, and all required checks passing. No CRITICAL or IMPORTANT findings.

## Scope Verification

Reviewed against:
- `dispatch/workstreams/ui-simplification/PLAN.md` (frozen composition, width, functional invariants, explicit out-of-scope)
- `dispatch/workstreams/ui-simplification/remediations/R004-typography-brand/BUILD.md` (exact outcome, affected seams, out-of-scope, regression evidence)
- `dispatch/workstreams/ui-simplification/remediations/R004-typography-brand/VALIDATION.md` (checks, verdict PASS, zero CRITICAL/IMPORTANT)
- Diff: `src/app/layout.tsx`, `src/app/globals.css`, `src/components/layout/desktop-sidebar.tsx`, `src/components/dashboard/dashboard-content.tsx`, `src/components/grants/grants-page.tsx`, `src/components/grants/grant-detail-sheet.tsx`, `src/components/grants/grant-workspace.tsx` (HEAD diff inspected; full worktree 24-file diff includes T001-T005/R001-R003 — R004 isolated to these 7 seams per BUILD:44-51)

### In scope (DEFECT) — verified fixed

1. **Org name visibility bump** (`src/components/layout/desktop-sidebar.tsx:56-60`)
   - Changed from `text-caption text-muted-foreground` to `truncate text-sm font-medium text-foreground` with `title={organizationName}` at `src/components/layout/desktop-sidebar.tsx:56-60` — exactly as BUILD:32-33 required.
   - `collapsed && "sr-only"` preserved at :57; `gap-6` container at :55 intact; `git diff -- src/components/layout/desktop-sidebar.tsx` shows exactly this hunk.
   - `MobileNavigation` sheet header at `src/components/layout/mobile-navigation.tsx:45-46` retains `SheetTitle className="text-brand"` + `SheetDescription text-caption` — correctly not promoted, matching BUILD out-of-scope allowance.

2. **App name indigo accent** (`src/components/layout/desktop-sidebar.tsx:50`)
   - Changed from `text-sidebar-foreground` to `text-primary` at `src/components/layout/desktop-sidebar.tsx:50` as `className={cn("truncate text-brand text-primary", collapsed && "sr-only")}` — retains `text-brand` scale, `truncate`, and `sr-only` when collapsed.
   - `text-primary` maps to `--primary: #4F46E5` / `--sidebar-primary: #4F46E5` at `src/app/globals.css:43-44,99-102` — indigo accent verified, no new token introduced.
   - Collapsed fallback `<span className="sr-only">GrantFlow</span>` at :53 preserved.

3. **IBM Plex pairing correctly scoped** (`src/app/layout.tsx:2-17,28`, `src/app/globals.css:9,13,25-27,119-120`)
   - `src/app/layout.tsx:2,5-17` imports `IBM_Plex_Sans` + `IBM_Plex_Mono` from `next/font/google` with `variable: "--font-sans"/"--font-mono"`, `subsets: ["latin"]`, `weight: ["400","500","600","700"]`, `display: "swap"` applied as `` `${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased` `` at :28 — confirms pairing C via next/font variables.
   - Mono weight superset `700` vs BUILD spec `400/500/600` is benign (build-accepted superset, no regression; noted in VALIDATION:28 and BUILD worker evidence).
   - `src/app/globals.css:9,13,25-27,119-120` fallbacks updated to `"IBM Plex Sans"` / `"IBM Plex Mono"` with `@theme inline --font-sans: var(--font-sans)` / `--font-mono: var(--font-mono)` preserved — correctly scoped to font variables only, no radius/surface/status token change.
   - Dense type scale at `src/app/globals.css:208-240` (`text-title 20/700`, `text-h2 18/600`, `text-label 11/600`, `text-caption 12`, `text-sm 13`, `text-base 14`, `text-brand 15`, `text-metric 28/700/-0.02`) unchanged except font-family variable, as required by BUILD:42.

4. **Mono on numbers with tabular-nums, no overflow** (`src/components/dashboard/dashboard-content.tsx:128,139,150,155`, `src/components/grants/grants-page.tsx`, `src/components/grants/grant-detail-sheet.tsx:62`, `src/components/grants/grant-workspace.tsx:107-108`, `src/components/layout/app-shell.tsx:23`)
   - Dashboard metrics all four at `dashboard-content.tsx:128,139,150,155` now `font-mono text-metric font-normal text-muted-foreground tabular-nums tracking-metric` — confirms mono + tabular-nums, `text-metric` scale with `font-normal` override, muted color retained.
   - Grants table money cells at `grants-page.tsx` now `px-4 py-2 text-right font-mono text-muted-foreground tabular-nums` for both Requested and Awarded — added `font-mono` vs prior bare `text-right tabular-nums`.
   - `grant-detail-sheet.tsx:62` amount `font-mono text-sm font-normal text-muted-foreground tabular-nums` with `currencyDisplay: "code"`; `grant-workspace.tsx:107-108` amounts `font-mono font-normal text-muted-foreground tabular-nums` with `currencyDisplay: "code"` — gray preserved, code-aware formatting intact.
   - `src/components/layout/app-shell.tsx:23` retains `min-h-screen overflow-x-hidden bg-background`; `dashboard-content.tsx` grid uses `min-w-0` cells, `max-w-7xl` canvas, and `grants-page.tsx` internal `min-w-[980px] overflow-x-auto` only — no page-level horizontal overflow introduced.

### Out-of-scope — verified absent

- No schema, migration, query, DTO, action, auth/tenancy, status/deadline, or import/export change: `git diff HEAD --stat` shows no `src/lib/queries`, `src/lib/validations`, `drizzle`, `prisma`, or `supabase` paths; R004-scoped diff limited to typography tokens as listed in BUILD:54-58 and VALIDATION:40-46. `grants-page.tsx`/`dashboard-content.tsx` broader diffs reflect pre-approved T001-T005/R001-R003, not R004; R004 hunks are mono/metric only.
- No width change: Dashboard `max-w-7xl` at `dashboard-content.tsx:86` preserved; Deadlines `max-w-7xl`, Grants `max-w-7xl` preserved; Workspace `max-w-6xl`, Funders `max-w-6xl`, Import `max-w-6xl` preserved — verified in source and VALIDATION:45.
- No universal search promotion: `src/components/grants/grants-search.tsx` not in R004 diff; `TopNavigation` and `AppShell` unchanged except prior T004 shell de-duplication (already validated). No new routes, filters, or search UI added.
- No generic Button/Skeleton/Sheet primitive redesign, animation, dark mode, or logo gradient — only font variables and two text-color/class changes in sidebar plus `font-mono` additions.

### Test relevance — verified

- `src/test/desktop-sidebar.test.tsx` asserts org name and brand text presence, not class tokens — correctly passes without churn after `text-sm`/`text-primary` change.
- `src/test/dashboard-page.test.tsx` metrics expectations retain `font-normal text-muted-foreground`; R004 adds `font-mono` alongside, preserving prior expectations.
- `src/test/app-shell.test.tsx`, `mobile-navigation.test.tsx`, `dashboard-page.test.tsx` remain relevant to T004 shell identity and dashboard composition; exercised via full suite.

## Checks / Evidence

Re-executed by REVIEW (2026-09-08):

- `npm run test:run` -> `Test Files 39 passed | 5 skipped (44)` / `Tests 259 passed | 37 skipped (296)` Duration 2.01s — PASS, matches BUILD baseline `39/5`, `259/37` and VALIDATION:55
- `npx tsc --noEmit` -> no output, EXIT 0 — PASS
- `git diff --check` -> no output, EXIT 0 — PASS
- `npm run lint` (eslint) -> EXIT 0 — PASS
- `npm run build` -> `Prisma generate` OK, `Next.js 16.3.0` `Compiled successfully`, `Generating static pages 11/11 in 128ms`, 11 routes (`/dashboard`, `/deadlines`, `/grants`, etc.), `Finished TypeScript in 857ms` — fonts loaded via `next/font` with no error — PASS
- Source inspection: confirmed `desktop-sidebar.tsx:50 text-brand text-primary + sr-only`, `:56-60 text-sm font-medium text-foreground truncate title sr-only`, `globals.css:43-44 --primary #4F46E5`, `layout.tsx:2-17 IBM_Plex_Sans/Mono variable --font-sans/--font-mono display swap`, `globals.css:25-27 IBM Plex Sans/Mono fallbacks + @theme inline`, `dashboard-content.tsx:128,139,150,155 font-mono text-metric tabular-nums`, `grants-page.tsx money font-mono tabular-nums`, `grant-detail-sheet.tsx:62 + grant-workspace.tsx:107-108 font-mono tabular-nums currencyDisplay code`, `app-shell.tsx:23 overflow-x-hidden` with no page overflow, `mobile-navigation.tsx:45` left `text-brand` — all present.
- VALIDATION.md checks re-verified and consistent with BUILD.md; no application code edited by VALIDATE or REVIEW.

## Findings

No CRITICAL or IMPORTANT PRODUCT or REGRESSION defects. One inherited MINOR tooling limitation carried forward.

### CRITICAL

- 0

### IMPORTANT

- 0

### MINOR

- **MINOR | TOOLING | NEW SCOPE** — No Safari Technology Preview visual snapshot claimed by VALIDATE (code + type-scale assertions and `overflow-x-hidden` inspection provide evidence; browser rendering confirmation pending). Not a product defect; does not block R004. Recommend renewed human Safari visual confirmation of org name legibility, brand indigo accent, and Plex Sans/Mono rendering at next ready-for-user gate per `PLAN.md:14` and prior `MINOR | TOOLING` practice. (DEFECT: none; NEW SCOPE: 1 tooling limitation)
- 0 PRODUCT defects.
- 0 REGRESSION defects.
- Approved-scope note (not a finding): Mono weight `700` superset vs BUILD spec `400/500/600` and `MobileNavigation` SheetTitle left `text-brand` are explicitly approved in BUILD/VALIDATION and introduce no visual or build regression.

Classification summary:
- `DEFECT`: 0 (all approved typography/brand defects correctly remediated)
- `NEW SCOPE`: 1 (tooling browser-evidence limitation, not a defect)

## Concerns

- None blocking. Full worktree has 24 modified files (T001-T005 + R001-R003 + R004) but R004-scoped diff is limited to 7 seams as required; no scope widening detected in R004. Mono superset weight and sheet-context Brand preservation are benign by design.

## Receipt

ROLE: REVIEW
STATUS: PASS
ARTIFACT: dispatch/workstreams/ui-simplification/remediations/R004-typography-brand/REVIEW.md
FILES CHANGED: dispatch/workstreams/ui-simplification/remediations/R004-typography-brand/REVIEW.md
CHECKS / EVIDENCE: npm run test:run -> 39 passed | 5 skipped (44 files), 259 passed | 37 skipped (296 tests) Duration 2.01s; npx tsc --noEmit -> EXIT 0; git diff --check -> EXIT 0 clean; npm run lint -> EXIT 0; npm run build -> Prisma generate OK, Next 16.3.0 Compiled successfully, 11 static pages, fonts via next/font; source audits verified desktop-sidebar.tsx:50 text-brand text-primary + sr-only, :56-60 text-sm font-medium text-foreground truncate title sr-only, globals.css:43-44 --primary #4F46E5, layout.tsx:2-17 IBM_Plex_Sans/Mono variable --font-sans/--font-mono display swap, globals.css:25-27 IBM Plex Sans/Mono fallbacks + @theme inline, dashboard-content.tsx:128,139,150,155 font-mono text-metric tabular-nums, grants-page.tsx money font-mono tabular-nums, grant-detail-sheet.tsx:62 + grant-workspace.tsx:107-108 font-mono tabular-nums currencyDisplay code, app-shell.tsx:23 overflow-x-hidden no page overflow, mobile-navigation.tsx:45 left text-brand
FINDINGS / CONCERNS: No CRITICAL/IMPORTANT PRODUCT or REGRESSION findings. Zero MINOR product defects. One MINOR | TOOLING | NEW SCOPE browser-evidence limitation (no Safari MCP snapshot) — not blocking. Concerns: none blocking.
