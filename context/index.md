# GrantFlow — Context Index

> Manifest for the `context/` directory. Referenced by `AGENTS.md`.

## Default Load

Start every session with:
1. **`AGENTS.md`** — agent behavior, workflow, current repository state, source-of-truth map
2. **`context/project-brief.md`** — product intent, users, requirements, MVP scope, terminology

## Task-Type to Specialized Document Map

| Task Type | Load These Documents |
|---|---|
| System architecture, layers, data flow, scalability | `context/architecture.md` |
| Technology stack, versions, dependency rules | `context/tech-stack.md` |
| Data model, entities, fields, indexes, migration rules | `context/database.md` |
| TypeScript/React/Next conventions, validation, naming | `context/coding-standards.md` |
| UI/UX, visual identity, layout, states, component system | `context/design.md` + `src/app/globals.css` + `screenshots/` |
| Architecture decisions, deviations | `dispatch/DECISIONS.md` |

## Design Authorities

- **Token system:** `src/app/globals.css` — single source of truth for colors, type scale, spacing, shadows, motion. Do not introduce new tokens without a `DECISIONS.md` entry.
- **Visual mockups:** `screenshots/` — 9 PNG files (dashboard, grants list, grant detail, funder list, deadlines, login, slide-over panel, landing, index/empty state). Match pixel-for-pixel.

## Workflow Files

All under `dispatch/`:
- `PLAN.md` — active instruction set
- `TASKS.md` — task tracker
- `COMPLETED.md` — completed work log
- `DECISIONS.md` — architecture/technology/design decision log
- `MODEL-LOG.md` — agent model usage records

## Do-Not-Duplicate Rule

Each specialized document owns its domain. Do not repeat database entity schemas in `architecture.md`, do not copy token tables into `coding-standards.md`, do not import package version tables into `database.md`. Reference the owning document by path.
