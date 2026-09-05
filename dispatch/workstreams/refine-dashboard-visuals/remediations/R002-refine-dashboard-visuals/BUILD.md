# R002 — Remove red background from Due within 7 days

Date: 2026-09-04
Workstream: refine-dashboard-visuals (Small)
Branch: main
Base SHA: 95a7d95
Trigger: Human feedback 2026-09-04 (screenshot arrow on DUE WITHIN 7 DAYS tile): "On the background of this content, remove the red"

## Changes

`src/components/dashboard/dashboard-content.tsx` only:

- Due within 7 days tile background changed from `bg-urgency-due` (light red #FEE2E2) + `border-destructive/25` to neutral `bg-card` + `border-border` when `hasDueSoon`.
- Preserved urgency signal via red icon (`bg-destructive text-destructive-foreground`) and red count/label (`text-destructive` + `font-semibold` for "Due within 7 days: 1" and large metric) — background removed per request, foreground urgency retained.
- Overdue tile unchanged (`bg-destructive-soft` when overdue). Section top accent and `bg-destructive-soft/40` wash when `hasAttention` retained (user only flagged tile background). No query/DTO/behavior change.

## Validation

- `bun x tsc --noEmit` — PASS
- `bun run lint` — PASS
- `bun x vitest run src/test/dashboard-page.test.tsx` — 15 passed
- Full `bun x vitest run` — 195 passed / 31 skipped — PASS
- `git diff --check` — PASS

## Next

Return to human visual gate — await explicit approval before GIT END.
