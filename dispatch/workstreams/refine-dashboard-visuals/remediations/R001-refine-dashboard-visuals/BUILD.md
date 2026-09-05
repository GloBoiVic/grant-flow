# R001 — Human visual feedback: red urgency + less generic

Date: 2026-09-04
Workstream: refine-dashboard-visuals (Small)
Branch: main
Base SHA: 95a7d95
Trigger: Human visual review 2026-09-04 — screenshot feedback:
- "It looks a little too generic, can we make it stand out?"
- "For example the deadline is using orange, why? Red often symbolizes danger and urgency" (orange Due within 7 days + Needs attention top bar)

## Changes

`src/components/dashboard/dashboard-content.tsx` only (preserve query/DTO/behavior):

1. **Urgency color fix — red for deadlines**
   - Needs attention top accent now `bg-destructive` (red) for *any* attention, not orange when only due-soon. Section border `border-destructive/20` when any attention.
   - Due within 7 days cell changed from warning/amber (`bg-warning`, `bg-urgency-soon`, `text-warning`) to red family (`border-destructive/25`, `bg-urgency-due` #FEE2E2, `text-destructive` #DC2626, `bg-destructive` icon). Overdue remains `bg-destructive-soft` #FEF2F2 / `text-destructive`. Both counts now render with `text-destructive` when >0, matching user expectation that red = urgency/danger. Section background `bg-destructive-soft/40` when hasAttention for stronger urgency without alarmist full-red.
   - Overdue icon/text and due-soon icon/text both now use destructive red when active, making overdue vs due-soon distinguished by position/label rather than hue, but both convey urgency as requested.

2. **Less generic — distinctive visual identity**
   - Portfolio totals: added_heading icon (`bg-primary text-primary-foreground`) and `h-1` top accent per card (`bg-primary/20`, `bg-accent-foreground/20`, `bg-warning/30`, `bg-success/30`) + icon backgrounds switched from muted gray to brand/money semantics (`bg-primary/10 text-primary` for Tracked, `bg-warning/10 text-warning` for Requested). Cards now have `overflow-hidden` with top stripe and `tracking-metric`.
   - Section headers: Upcoming + Status breakdown `bg-muted/20` header with `bg-card border shadow-sm` icon pill (`CalendarDays`, `Layers`) to echo Grants page but more authored.
   - Needs attention: header icon now `bg-destructive text-destructive-foreground shadow-sm` when attention, plus soft red section wash.

All exact test strings/links preserved (`Overdue: n`, `Due within 7 days: n`, `Review pre-submission deadlines →`, etc.). No query/DTO/schema/nav changes. Zero new deps.

## Validation

- `bun x tsc --noEmit` — PASS
- `bun run lint` — PASS
- `bun x vitest run src/test/dashboard-page.test.tsx` — 15 passed
- Full `bun x vitest run` — 195 passed / 31 skipped — PASS
- `git diff --check` — PASS

## Review

Self-review: urgency now honest red, metric cards and headers more authored and less flat while staying calm/professional and within existing tokens. See updated REVIEW.md.

## Next

Return to human visual gate — await explicit approval before GIT END.
