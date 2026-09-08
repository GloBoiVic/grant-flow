# R004 - Typography and brand accent

Remediation ID: R004
Status: DONE
Role: BUILD
Workstream: ui-simplification
Branch: solo/ui-simplification

## Origin finding and source artifact

Developer request 2026-09-08 (post-R003 READY_FOR_USER): Approved to bump Org name visibility, change App name to accent color (purple/indigo), and switch to font pairing C (IBM Plex Sans for words + IBM Plex Mono for numbers) suited for nonprofit professionals. Every other prior fix stays approved (R001-003).

Source: user message 2026-09-08: "C for font. This is a non-profit app for non profit professionalks. Everything else approved"

## Finding severity

MINOR (bounded token refinement within approved PLAN, no data loss; sharpens readability and brand accent).

## Related original task(s)

- T004 - Funder surfaces and bounded shell de-duplication (sidebar organization context)
- Plan Reduction Principles: prefer typography/spacing over chrome; keep existing visual language soft-gray canvas, indigo primary, semantic tokens.

## Approved requirement or invariant violated

- PLAN Composition baseline: typography and spacing establish hierarchy — org name currently `text-caption text-muted-foreground` at `src/components/layout/desktop-sidebar.tsx:56` is too quiet.
- App name currently `text-brand text-sidebar-foreground` at `desktop-sidebar.tsx:50`; request to use accent primary `--primary #4F46E5` indigo-purple.
- Fonts currently `Inter` via `next/font` at `src/app/layout.tsx:2-8` and `--font-sans/--font-mono` at `globals.css:24-26,119-120`; request to switch to IBM Plex pairing for more professional nonprofit reading and better tabular numbers.

## Exact remediation outcome

1. **Org name visibility** — `src/components/layout/desktop-sidebar.tsx:56`:
   - Change from `text-caption text-muted-foreground` to `text-sm font-medium text-foreground` (or `text-sidebar-foreground`) with `truncate` + `title={organizationName}` for long names. Keep `sr-only` when `collapsed`. Keep mobile sheet header `MobileNavigation:45` as is (sheet context correct). Do not add duplicate dashboard header org line.

2. **App name accent** — `src/components/layout/desktop-sidebar.tsx:50-51`:
   - Change `GrantFlow` from `text-sidebar-foreground` to `text-primary` (maps to `--primary #4F46E5` via `globals.css:43-44` / `--sidebar-primary`). Keep `text-brand` scale; optionally `font-bold` remains `font-semibold` per token (do not invent gradient/logo). Keep collapsed `sr-only` fallback. Same for `MobileNavigation:45` SheetTitle if desired — but keep it `text-brand` as before unless needed for consistency.

3. **Fonts — pairing C (IBM Plex Sans + IBM Plex Mono)** — `src/app/layout.tsx:2-8`, `globals.css:24-26,119-120,232-244`:
   - Replace `Inter` import with `IBM_Plex_Sans` and `IBM_Plex_Mono` via `next/font/google` with `variable: "--font-sans"` and `variable: "--font-mono"`, `subsets: ["latin"]`, weights covering 400/500/600/700 for Sans and 400/500/600 for Mono, `display: "swap"`.
   - Update `globals.css` fallback `--font-sans: "IBM Plex Sans", Inter fallback?` and `--font-mono: "IBM Plex Mono"` appropriately, keep `@theme inline` mapping.
   - Apply mono to numbers: set `text-metric` (28px) to use `font-mono` or keep `font-sans` but ensure `tabular-nums` stays; preferred: `src/components/dashboard/dashboard-content.tsx:128,139,150,155` metrics and `src/components/grants/grants-page.tsx` money cells, `grant-detail-sheet`/`grant-workspace` amount displays already have `tabular-nums` — ensure they render with `font-mono` for perfect alignment. Keep body copy on `font-sans` (IBM Plex Sans).
   - Keep dense type scale (`text-title 20/700`, `text-h2 18/600`, `text-label 11/600`, `text-caption 12`, `text-sm 13`, `text-base 14`, `text-brand 15`, `text-metric 28/700/-0.02`) unchanged except font-family variable. Verify no page-level horizontal overflow (`overflow-x-hidden` in `app-shell.tsx:23`).

## Affected implementation seams

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/desktop-sidebar.tsx`
- `src/components/layout/mobile-navigation.tsx` (only if SheetTitle color needs accent; otherwise unchanged)
- `src/components/dashboard/dashboard-content.tsx` (ensure metrics keep `font-normal text-muted-foreground tabular-nums`; optionally add `font-mono` to `text-metric`)
- `src/components/grants/grants-page.tsx`, `grant-detail-sheet.tsx`, `grant-workspace.tsx` (verify monetaries still `tabular-nums` with mono)

## Explicit out-of-scope items

- No schema, migration, query, DTO, action, auth/tenancy, status/deadline, import/export, or persisted-data change.
- No width change (`max-w-7xl` Dashboard/Grants/Deadlines, `max-w-6xl` Workspace/Funders/Import) and no universal search promotion.
- No generic Button/Skeleton/Sheet primitive redesign, animation, dark mode, or logo redesign beyond color token.
- No new design tokens beyond IBM Plex font variables.

## Regression evidence required

- Visual code inspection: org name `text-sm font-medium text-foreground`, app name `text-primary`, font variables `IBM Plex Sans`/`Mono` loaded.
- Tests: `npm run test:run` (full baseline 292+; observed 296 with R003) passes; focused `src/test/app-shell.test.tsx`, `desktop-sidebar.test.tsx`, `mobile-navigation.test.tsx`, `dashboard-page.test.tsx` pass if they assert brand/org classes.
- `npx tsc --noEmit` passes; `git diff --check` clean; `npm run build` passes for font loading.
- No page-level horizontal overflow; sidebar collapse `sr-only` preserved.

## Worker Evidence

### Code inspection
- `src/app/layout.tsx:2-17` imports `IBM_Plex_Sans` + `IBM_Plex_Mono` from `next/font/google` with `variable: "--font-sans"/"--font-mono"`, `subsets: ["latin"]`, `weight: ["400","500","600","700"]`, `display: "swap"` applied to `<html className>` via `${ibmPlexSans.variable} ${ibmPlexMono.variable}`.
- `src/app/globals.css:9,13,25-27,119-120` fallback vars updated to `"IBM Plex Sans"` / `"IBM Plex Mono"`, `@theme inline` mapping preserved (`--font-sans: var(--font-sans)`, `--font-mono: var(--font-mono)`).
- `src/components/layout/desktop-sidebar.tsx:50` GrantFlow span changed `text-sidebar-foreground` -> `text-primary` with `text-brand` retained, `sr-only` when collapsed preserved; `:56-60` org name changed `text-caption text-muted-foreground` -> `text-sm font-medium text-foreground` with `truncate` + `title={organizationName}`, `sr-only` when collapsed preserved, `gap-6` layout intact.
- `src/components/dashboard/dashboard-content.tsx:128,139,150,155` metrics now `font-mono text-metric font-normal text-muted-foreground tabular-nums` for Tracked/Open/Requested/Awarded.
- `src/components/grants/grants-page.tsx` money cells verified `font-mono tabular-nums text-muted-foreground` (right-aligned); `grant-detail-sheet.tsx:62` amount `font-mono tabular-nums`; `grant-workspace.tsx:107-108` amounts `font-mono tabular-nums` with gray preserved. No horizontal overflow change.

### Checks (2026-09-08)
- `npm run test:run`: 39 passed | 5 skipped (44), 259 passed | 37 skipped (296) — PASS
- `npx tsc --noEmit`: no output — PASS
- `git diff --check`: exit 0, clean — PASS
- `npm run lint`: eslint no errors — PASS
- `npm run build`: Prisma generate + Next build `Compiled successfully` with 11 static pages, fonts loaded via next/font — PASS

### Scope compliance
- Only typography/brand tokens changed; no schema/migration/query/DTO/auth/status/import/export changes. `MobileNavigation` SheetTitle left `text-brand` (sheet context correct per remediation). Sidebar `sr-only` collapse preserved; `overflow-x-hidden` unchanged.

