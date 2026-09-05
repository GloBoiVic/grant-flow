# SoloFlow Plan — refine-dashboard-visuals

Status: READY_FOR_USER
Classification: Small
Workstream: refine-dashboard-visuals
Base branch: main
Base SHA: 95a7d95
Execution branch: main
Approval: Small — direct implementation permitted
Phase: READY_FOR_USER
Task state: BUILD DONE — visual refinement implemented, VALIDATION PASS, REVIEW PASS
Next action: HUMAN VISUAL GATE — awaiting explicit human approval before GIT END. Do not merge until approved.

## Outcome

Improve visual hierarchy, polish, and day-to-day usability of already-complete /dashboard without changing product behavior, queries, date semantics, navigation contract, or data model. Dashboard should feel like GrantFlow's useful daily home screen, calm, professional, compact.

## Scope

Refine only existing Dashboard presentation:
- stronger hierarchy between heading, metrics, attention, upcoming, breakdown
- more intentional metric-card composition
- clearer Overdue vs Due within 7 days urgency
- more scannable upcoming rows
- improved use of existing Grant status colors
- more useful status breakdown (status-colored bars, lifecycle shape at glance)
- tighter typography/spacing/borders
- responsive behavior
- polished empty states
- clearer link affordances
- visual consistency with AppShell, Grants page, tokens, screenshots

Use ordinary CSS/Tailwind and existing GrantFlow tokens/components. Zero new dependencies.

## Preserve exactly

- Dashboard query behavior, DTO, org scoping, totals, open-pipeline definition, pre-submission definition, overdue/next-7/next-30 semantics, nearest-five behavior, status counts, /grants filter behavior, /grants?grant=<id> deep-links, UTC helpers, schema, Portfolio Import, Grant/Funder/Tag/Activity behavior.

## Out of scope

No new metrics, charts lib, analytics, filters, customization, navigation, /deadlines functionality, deadline semantics, reminders, notifications, decorative animation, schema/backend changes.

## Design direction

Reading order: 1 portfolio, 2 attention, 3 upcoming, 4 lifecycle.

## Validation

- Focused dashboard/UI tests
- TypeScript, lint, git diff --check
- Human visual acceptance gate (Local Host unavailable: automated tests/jsdom/screenshots not substitute; record limitation honestly)

## Human gate checklist

Overall hierarchy desktop, metric cards, Needs attention prominence, Upcoming scanability, Status breakdown, empty states, narrow/mobile, links/focus states, consistency with GrantFlow.

Do not merge / GIT END until human explicitly approves visual result.
