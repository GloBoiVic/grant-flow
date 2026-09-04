# GrantFlow — Operating Notes

## Product boundary

GrantFlow is a grant portfolio and grant-work management platform for nonprofit grant professionals. It manages grant opportunities, funders, deadlines, working notes, grant-specific drafting, documents, activity and revision history, exports, and portfolio insight. It is not a donor CRM, accounting system, general-purpose word processor, AI grant writer, or general nonprofit management platform. Durable product identity and boundaries live in `PRODUCT.md`.

## Source of truth

- Code is implementation truth; tests are behavior truth.
- `PRODUCT.md` is durable product truth for product identity, users, problem, MVP goal, and boundaries.
- `dispatch/ACTIVE.md` and the active workstream are current intent; the workstream's `dispatch/workstreams/<name>/PLAN.md` is its canonical plan, and task assignments and receipts live under that workstream.
- Inspect relevant source and tests before changing them; inspect on-disk configuration and Git status before acting. Do not infer current state from old notes or bulk-read repository history or unrelated files.
- Existing design tokens in `src/app/globals.css` and visual references in `screenshots/` govern UI work.

## Scope and inspection rules

- Read the active plan and assigned task before work. Complete one task at a time and make only approved, task-relevant changes.
- Preserve unrelated application/runtime assets, tests, configuration, user changes, and the user-deleted `CLAUDE.md`.
- Do not dispatch work, change branches, alter Git history, or edit another role's artifact. Do not mark incomplete work complete.
- Prefer the smallest solution. Do not introduce abstractions, infrastructure, documents, or data models for hypothetical future needs. Avoid speculative features and technologies; keep GrantFlow focused on replacing fragmented grant-tracking and grant-work workflows with one grant-specific source of truth.

## SoloFlow workflow

Use the active SoloFlow workflow recorded in `dispatch/ACTIVE.md` and follow the linked canonical workstream plan. Keep mutable state there and put task-specific evidence in the assigned workstream artifact.

## Validation and diff discipline

- Run the checks required by the assigned task and report exactly what ran, including limitations.
- Before handoff, inspect `git status` and the final diff; verify only approved paths changed and pre-existing user changes remain untouched.
- Run `git diff --check` when the task changes tracked or staged content. Never claim a check or implementation that was not performed.
