# R004 - Typography and brand accent validation

Role: VALIDATE
Workstream: ui-simplification
Branch: solo/ui-simplification
Task: R004
Owned artifact: dispatch/workstreams/ui-simplification/remediations/R004-typography-brand/VALIDATION.md

## Scope

Validate R004 remediation against `dispatch/workstreams/ui-simplification/remediations/R004-typography-brand/BUILD.md` and `dispatch/workstreams/ui-simplification/PLAN.md`.

Approved R004 outcome:

1. Org name visibility bump to `text-sm font-medium text-foreground` with `truncate` + `title` and `sr-only` when collapsed in `src/components/layout/desktop-sidebar.tsx:56`.
2. App name color changed to `text-primary` indigo `#4F46E5` in `desktop-sidebar.tsx:50` retaining `text-brand`.
3. Fonts switched to IBM Plex Sans (words) and IBM Plex Mono (numbers) via `next/font` in `src/app/layout.tsx` and `src/app/globals.css` fallbacks, mono applied to metrics (`dashboard-content`) and money cells with `tabular-nums`, no overflow, build passes.

Inspected: `src/components/layout/desktop-sidebar.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/dashboard/dashboard-content.tsx`, `src/components/grants/grants-page.tsx`, `src/components/grants/grant-detail-sheet.tsx`, `src/components/grants/grant-workspace.tsx`, `src/components/layout/app-shell.tsx`, `src/components/layout/mobile-navigation.tsx`. No application code or BUILD.md was edited by VALIDATE.

## Checks Run

### Source inspection (R004 seams)

- `src/components/layout/desktop-sidebar.tsx:50` span `className={cn("truncate text-brand text-primary", collapsed && "sr-only")}` — confirms app name changed from `text-sidebar-foreground` to `text-primary` while retaining `text-brand` and `truncate` and `sr-only` when `collapsed`. `collapsed && <span className="sr-only">GrantFlow</span>` fallback preserved at :53.
- `src/components/layout/desktop-sidebar.tsx:56-60` org name `className={cn("truncate text-sm font-medium text-foreground", collapsed && "sr-only")} title={organizationName}` — confirms bump from `text-caption text-muted-foreground` to `text-sm font-medium text-foreground` with `truncate` + `title={organizationName}` and `sr-only` when `collapsed`. `gap-6` container layout intact at :55. `git diff -- src/components/layout/desktop-sidebar.tsx` shows exactly these two hunks only.
- `src/app/globals.css:43-44` `--primary: #4F46E5` / `--sidebar-primary: #4F46E5` — maps `text-primary` to indigo #4F46E5 as required. No new token introduced.
- `src/app/layout.tsx:2,5-17,28` `import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"` with `ibmPlexSans` `variable: "--font-sans" subsets: ["latin"] weight: ["400","500","600","700"] display: "swap"` and `ibmPlexMono` `variable: "--font-mono" subsets: ["latin"] weight: ["400","500","600","700"] display: "swap"` applied as `` `${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased` `` — confirms next/font pairing C loaded via variables. Superset weight `700` on Mono vs BUILD spec `400/500/600` is benign (build-accepted superset, no regression).
- `src/app/globals.css:9,13,25-27,119-120` comment updated to `IBM Plex Sans/Mono are loaded via next/font with variables: "--font-sans" / "--font-mono"` and `Fonts: IBM Plex Sans ... + IBM Plex Mono ... via next/font/google`, fallback vars `--font-sans: "IBM Plex Sans", -apple-system, ...` and `--font-mono: "IBM Plex Mono", ui-monospace, ...`, `@theme inline` mapping `--font-sans: var(--font-sans)` / `--font-mono: var(--font-mono)` preserved — confirms fallbacks switched from `Inter`/`ui-monospace` to IBM Plex pairing.
- `src/components/dashboard/dashboard-content.tsx:128,139,150,155` all four metrics `font-mono text-metric font-normal text-muted-foreground tabular-nums tracking-metric` (Tracked grants, Open pipeline, Requested, Awarded) — confirms mono + tabular-nums on metrics while retaining `text-metric 28/700/-0.02` scale with `font-normal` override and muted color. Previous `mt-2 text-metric tabular-nums` replaced with `mt-1 font-mono ...` per diff.
- `src/components/grants/grants-page.tsx` money cells `className="px-4 py-2 text-right font-mono text-muted-foreground tabular-nums"` at both Requested and Awarded columns — confirms `font-mono tabular-nums` on table monetaries (diff shows added `font-mono text-muted-foreground tabular-nums` vs prior bare `text-right tabular-nums`).
- `src/components/grants/grant-detail-sheet.tsx:62` amount `font-mono text-sm font-normal text-muted-foreground tabular-nums` with `formatAmount` `currencyDisplay: "code"` — confirms mono + tabular-nums on sheet amount, no horizontal overflow class.
- `src/components/grants/grant-workspace.tsx:107-108` amounts `font-mono font-normal text-muted-foreground tabular-nums` with `currencyDisplay: "code"` — confirms mono + tabular-nums on workspace amounts, gray preserved.
- `src/components/layout/app-shell.tsx:23` `className="min-h-screen overflow-x-hidden bg-background"` — confirms no page-level horizontal overflow mechanism. `src/components/dashboard/dashboard-content.tsx` grid uses `min-w-0` cells, `max-w-7xl`, internal table `min-w-[980px] overflow-x-auto` preserved in `grants-page.tsx` — intentional internal table overflow, not page overflow.
- `src/components/layout/mobile-navigation.tsx:45` `SheetTitle className="text-brand"` — confirms mobile SheetTitle left as `text-brand` (not promoted to `text-primary`), matching BUILD out-of-scope note that sheet context remains correct.
- `src/app/globals.css:208-240` type scale `text-label 11/600`, `text-caption 12`, `text-sm 13`, `text-base 14`, `text-title 20/700`, `text-h2 18/600`, `text-metric 28/700/-0.02`, `text-brand 15/600` — confirms dense scale unchanged except font-family variable.

### Strict-scope / out-of-scope audit

- `src/components/layout/desktop-sidebar.tsx` diff is exactly 2 hunks (brand color + org typography); no `gap-6` or collapse logic altered.
- `src/app/layout.tsx` diff replaces `Inter` import with `IBM_Plex_Sans` + `IBM_Plex_Mono` and `${inter.variable}` with `${ibmPlexSans.variable} ${ibmPlexMono.variable}` — no metadata or body change.
- `src/app/globals.css` diff limited to header comment and `:root --font-sans/--font-mono` fallbacks — no radius, surface, status/urgency, or layout token change. `@theme` scale intact.
- `src/components/dashboard/dashboard-content.tsx` metric lines are the only R004-typography change within that file; the broader file diff (469 lines) reflects pre-approved T001-T005 + R001-R003 reductions (consolidated metrics strip, attention, upcoming/status composition) already validated as PASS — R004 does not introduce schema, query, DTO, action, auth, deadline, or import/export changes within this seam.
- No schema, migration, query, DTO, action, auth/tenancy, status/deadline, or import/export file appears in R004-scoped diff (`git diff -- src/app/layout.tsx src/app/globals.css src/components/layout/desktop-sidebar.tsx src/components/dashboard/dashboard-content.tsx:128,139,150,155 src/components/grants/grants-page.tsx src/components/grants/grant-detail-sheet.tsx src/components/grants/grant-workspace.tsx` shows only typography tokens).
- Verified no width change (`max-w-7xl` Dashboard/Grants/Deadlines preserved in dashboard-content/grants-page, `max-w-6xl` Workspace in grant-workspace) and no generic Button/Skeleton/Sheet primitive redesign.

### Test relevance audit

- No R004-specific assertions for `text-sm`/`text-primary`/`font-mono` exist in `src/test/desktop-sidebar.test.tsx` — existing tests assert presence of org name and brand text, not class tokens; they continue to pass without churn.
- `src/test/dashboard-page.test.tsx` metrics assertions still expect `font-normal text-muted-foreground` numbers; R004 adds `font-mono` alongside those tokens, preserving prior expectations.
- `src/test/app-shell.test.tsx`, `src/test/desktop-sidebar.test.tsx`, `src/test/mobile-navigation.test.tsx` remain relevant to shell identity duplication rule (PLAN T004) and are exercised via full suite.

### Validation matrix — exact commands and outputs

- `npm run test:run` -> `Test Files  39 passed | 5 skipped (44)` / `Tests  259 passed | 37 skipped (296)` / Duration 2.52s (2026-09-08 11:37 UTC). Vitest emitted `configLoader: 'native'` CommonJS/ESM warning (benign, same as baseline 292+ observed 296 with R003).
- `npx tsc --noEmit` -> no output, `EXIT:0`.
- `git diff --check` -> no output, `EXIT:0`.
- `npm run lint` (eslint) -> no output, `EXIT:0`.
- `npm run build` -> `Prisma generate` OK, `Next.js 16.3.0` `Compiled successfully in 589ms`, `Generating static pages using 11 workers (11/11) in 132ms`, 11 routes listed (`/dashboard`, `/deadlines`, `/grants`, `/grants/[grantId]`, etc.), `Finished TypeScript in 838ms` — fonts loaded via `next/font` with no error.

Full suite matches BUILD baseline `39 passed | 5 skipped` / `259 passed | 37 skipped` (296 total). `tsc`, `lint`, `build`, and whitespace clean.

## Findings

No `CRITICAL` or `IMPORTANT` PRODUCT or REGRESSION defects were identified.

### CRITICAL

- 0.

### IMPORTANT

- 0.

### MINOR

- 0 PRODUCT defects.
- 0 REGRESSION defects.

Classification detail: R004 correctly applies `text-sm font-medium text-foreground truncate title sr-only(collapsed)` to org name and `text-brand text-primary` to app name, and `IBM_Plex_Sans`/`IBM_Plex_Mono` via `next/font` with `display: swap` and fallbacks. `font-mono tabular-nums` on all four dashboard metrics and on `grants-page` / `grant-detail-sheet` / `grant-workspace` money cells satisfies BUILD requirement for tabular numbers without overflow (`overflow-x-hidden` in `app-shell.tsx:23`, `min-w-0` grid cells, internal `overflow-x-auto` only on grants table). Mono weight includes `700` (superset of spec `400/500/600`) — intentionally broader coverage, no visual or build regression. `MobileNavigation` SheetTitle correctly left `text-brand` per BUILD out-of-scope allowance. Remaining pre-existing `MINOR | TOOLING` Safari Technology Preview snapshot limitation is inherited from prior remediations (no authenticated screenshot claimed by VALIDATE) and is not an R004 product defect.

- Approved-scope `DEFECT`: none.
- `NEW SCOPE`: one inherited tooling limitation (no Safari MCP browser snapshot), not a defect.

## Verdict

**PASS** — R004 satisfies the BUILD packet and frozen PLAN contracts for typography and brand accent. Org name visibility bump, app name indigo `#4F46E5` via `text-primary`, and IBM Plex Sans/Mono via `next/font` with `font-mono tabular-nums` on metrics and money cells are verified in source at cited lines, with `truncate`+`title` and `sr-only` collapse preserved, no page overflow, and all required checks passing (`test:run` 39/259 pass, `tsc --noEmit` 0, `git diff --check` clean, `lint` 0, `build` compiled successfully with fonts loaded). No `CRITICAL` or `IMPORTANT` findings remain. The sole `MINOR | TOOLING` browser-evidence limitation is `NEW SCOPE` and does not block R004.

## Required Follow-up

- None required for R004 application scope. Renewed human Safari Technology Preview visual confirmation of org name legibility, brand indigo accent, and Plex Sans/Mono rendering at next ready-for-user gate, consistent with prior workstream `MINOR | TOOLING` practice.
- No `CRITICAL` or `IMPORTANT` remediation needed before merge (pending human approval per `dispatch/workstreams/ui-simplification/PLAN.md:14`).

## Receipt

ROLE: VALIDATE
STATUS: PASS
ARTIFACT: dispatch/workstreams/ui-simplification/remediations/R004-typography-brand/VALIDATION.md
FILES CHANGED: dispatch/workstreams/ui-simplification/remediations/R004-typography-brand/VALIDATION.md
CHECKS / EVIDENCE: npm run test:run -> 39 passed | 5 skipped (44 files), 259 passed | 37 skipped (296 tests) Duration 2.52s; npx tsc --noEmit -> EXIT 0 no output; git diff --check -> EXIT 0 clean; npm run lint -> EXIT 0; npm run build -> Prisma generate OK, Next 16.3.0 Compiled successfully 589ms, 11 static pages, fonts via next/font; source audits verified desktop-sidebar.tsx:50 text-brand text-primary + sr-only, :56-60 text-sm font-medium text-foreground truncate title sr-only, layout.tsx:2-17 IBM_Plex_Sans/Mono variable --font-sans/--font-mono display swap, globals.css:25-27 IBM Plex Sans/Mono fallbacks + @theme inline, dashboard-content.tsx:128,139,150,155 font-mono text-metric tabular-nums, grants-page.tsx money font-mono tabular-nums, grant-detail-sheet.tsx:62 + grant-workspace.tsx:107-108 font-mono tabular-nums currencyDisplay code, app-shell.tsx:23 overflow-x-hidden no page overflow
FINDINGS / CONCERNS: No CRITICAL/IMPORTANT PRODUCT or REGRESSION findings. Zero MINOR product defects. One MINOR | TOOLING | NEW SCOPE browser-evidence limitation inherited (no Safari MCP snapshot claimed).
