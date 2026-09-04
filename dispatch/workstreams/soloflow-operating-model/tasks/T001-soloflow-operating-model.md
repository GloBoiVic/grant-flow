# T001 — Implement SoloFlow Operating Model

Status: DONE
Role: BUILD
Workstream: soloflow-operating-model

## Outcome

Replace the legacy AI/context workflow with the approved minimal SoloFlow operating model while preserving all application behavior and repository assets.

## Required changes

1. Replace `AGENTS.md` with a genuinely concise GrantFlow-specific instruction file. Include the durable product boundary, repository source-of-truth policy, inspection/scope rules, reference to the active SoloFlow workflow, and validation/diff discipline. Do not reproduce the SoloFlow lifecycle. Do not instruct normal work to load or inspect `dispatch/COMPLETED.md`; mention historical investigation only if specifically required. Do not reference deleted `context/` files.
2. Add `PRODUCT.md` containing only: product identity, users, core problem, MVP goal, and product boundaries. Do not add architecture, schema, design, roadmap, feature-spec, or implementation-status content.
3. Delete `CURRENT.md`, `memory.md`, the complete `context/` hierarchy, and these superseded flat dispatch artifacts: `dispatch/PLAN.md`, `dispatch/ARCHITECTURE.md`, `dispatch/TASKS.md`, `dispatch/EXPLORATION.md`, `dispatch/REVIEW.md`, `dispatch/MODEL-LOG.md`, and `dispatch/DECISIONS.md`.
4. Preserve `dispatch/ACTIVE.md`, `dispatch/COMPLETED.md`, and the workstream structure. Keep `dispatch/COMPLETED.md` historical contents unchanged.

## Preservation constraints

- Do not modify any application code, tests, Prisma code, screenshots, mock data, package/dependency files, environment files, or repository configuration.
- Preserve `next.config.ts` exactly as found at task start, including its pre-existing `127.0.0.1` change.
- Preserve untracked `.codegraph/.gitignore` exactly. Do not add or remove other `.codegraph` files.
- Preserve Git history. Do not commit, switch branches, stash, reset, clean, or alter Git state.
- Keep the user-deleted `CLAUDE.md` absent.

## Checks and receipt

- Inspect the final diff and status, confirming only the approved documentation/dispatch paths changed and the two pre-existing user changes remain untouched/uncommitted.
- Run `git diff --check`.
- Record the changed paths, preservation checks, and any test limitation in this task file.
- Do not create validation or review artifacts; those belong to later roles.

## BUILD Receipt

- Corrected the receipt to the canonical `DONE` status and made the source-of-truth and bounded-scope policies explicit in `AGENTS.md`.
- Implemented the approved documentation/workflow migration: replaced `AGENTS.md`, added `PRODUCT.md`, and removed `CURRENT.md`, `memory.md`, the complete 31-file `context/` hierarchy, and the seven superseded flat dispatch artifacts.
- Preserved `dispatch/ACTIVE.md`, `dispatch/COMPLETED.md`, `dispatch/workstreams/soloflow-operating-model/PLAN.md`, all application/runtime assets, tests, configuration, and the user-deleted `CLAUDE.md` state.
- Confirmed the pre-existing `next.config.ts` change adding `127.0.0.1` and untracked `.codegraph/.gitignore` remain untouched, uncommitted, and present.
- Final changed-path inspection: only the approved documentation/dispatch paths are changed, plus this owned task receipt; no validation or review artifacts were created.
- Checks passed: `git diff --check`; final `git status --short --untracked-files=all` and `git diff --name-status` inspected.
- Test limitation: application tests, lint, TypeScript, and build were not run because this task changes documentation/workflow files only; no runtime behavior was modified.
