# R003 — As of: remove UTC, show user-local date

Date: 2026-09-05
Workstream: refine-dashboard-visuals (Small)
Branch: main
Base SHA: 95a7d95
Trigger: Human feedback 2026-09-05 (screenshot "As of 2026-09-05 · UTC"): "not sure why we are displaying UTC. I think we should display the user date and time or device date and time"

## Changes

`src/components/dashboard/dashboard-content.tsx` only:

- Header "As of" line changed from `As of {dto.asOf} · UTC` (raw ISO + UTC label, UTC timezone) to user-local formatted date:
  ```tsx
  As of {new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${dto.asOf}T12:00:00`))}
  ```
  - Uses `Intl.DateTimeFormat(undefined, ...)` → user's device locale/timezone, not `timeZone: "UTC"`.
  - `T12:00:00` noon anchor avoids timezone date-shift for date-only DTO while still rendering in local locale.
  - Long month ("September 5, 2026") avoids collision with upcoming deadline short-month regex `/Sep 4, 2026/` — tests previously failed with short-month due to duplicate `Sep 4, 2026` (As of vs upcoming). Long month keeps display local but distinct.
  - Removed "· UTC" suffix per feedback.
- No query/DTO/UTC helpers changed; only presentation. R002 red-background removal retained (Due within 7 days `bg-card` neutral).

## Validation

- `bun x tsc --noEmit` — PASS
- `bun run lint` — PASS
- `bun x vitest run src/test/dashboard-page.test.tsx` — 15 passed (after fixing short-month collision to long-month)
- Full `bun x vitest run` — 195 passed / 31 skipped — PASS
- `git diff --check` — PASS

## Next

Return to human visual gate — await explicit approval before GIT END. If user wants live device clock time (e.g., "Sept 5, 2026, 10:30 AM"), can add as R004 client-hydrated time — kept date-only for now to preserve DTO asOf semantics.
