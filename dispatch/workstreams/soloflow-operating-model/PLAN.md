# SoloFlow Plan — Replace Legacy AI/Context Workflow

Status: READY_FOR_USER
Classification: Feature
Workstream: soloflow-operating-model
Base branch: main
Base SHA: caed7be83423c2240afd8725cea49ab3378a4e49
Execution branch: solo/soloflow-operating-model
Approval: Explicit developer implementation approval received; GIT START completed.
Phase: MERGE_APPROVAL
Task state: T001 DONE.
Architecture status: Not required; this is a documentation and workflow migration with no runtime architecture change.
Next action: Await explicit developer merge approval.

## Outcome

Replace the legacy AI/context operating model with the minimal SoloFlow structure so future work is driven by repository reality, tests, the active workstream, and durable product identity rather than stale documentation.

## Scope

### Keep unchanged

- All application code under `src/`, including generated Prisma client code and existing runtime configuration.
- All tests under `src/test/` and all test tooling/configuration.
- Prisma schema, migrations, generated client, Prisma configuration, and verification script.
- Screenshots under `screenshots/` and `data/mock-grant-data.xlsx`.
- Package manifests/lockfile, Next.js, TypeScript, ESLint, Tailwind/PostCSS, Vitest, shadcn, environment-example, and other repository configuration.
- Git history and the historical `dispatch/COMPLETED.md` record, which is also a required SoloFlow artifact.
- Existing user changes: the `next.config.ts` change adding `127.0.0.1` and untracked `.codegraph/.gitignore`; explicitly authorized for GIT START and excluded from this workstream commit.
- The user-deleted `CLAUDE.md` remains absent.

### Replace or add

- Replace the large root `AGENTS.md` with a concise GrantFlow-specific operating file containing only repository/product boundaries, the source-of-truth policy, inspection/scope rules, SoloFlow workflow expectations, and validation/diff discipline. It will not reference deleted `context/` documents.
- Add `PRODUCT.md` containing only durable product identity, users, core problem, MVP goal, and product boundaries; it will not reproduce architecture, schema, design, roadmap, feature specifications, or implementation status.
- Make `dispatch/ACTIVE.md` the mutable operational state and `dispatch/workstreams/soloflow-operating-model/PLAN.md` the canonical workstream plan. After approval/GIT START, add the required task and immutable validation/review receipts under this workstream.
- Replace the legacy root `dispatch/PLAN.md` with the workstream plan and standard SoloFlow structure.

### Delete

- `CURRENT.md`
- `memory.md`
- The complete `context/` hierarchy: all 31 tracked files, including `project-brief.md`, `index.md`, `roadmap.md`, `architecture.md`, `tech-stack.md`, `database.md`, `coding-standards.md`, `design.md`, and all historical feature specifications under `context/features/`.
- Superseded flat dispatch artifacts: `dispatch/PLAN.md`, `dispatch/ARCHITECTURE.md`, `dispatch/TASKS.md`, `dispatch/EXPLORATION.md`, `dispatch/REVIEW.md`, `dispatch/MODEL-LOG.md`, and `dispatch/DECISIONS.md`.

No equivalent replacement context hierarchy, architecture guide, database guide, design guide, roadmap, coding-standard document, or historical feature-spec collection will be created.

## Acceptance

1. `AGENTS.md` is concise, GrantFlow-specific, and expresses the requested source-of-truth policy.
2. `PRODUCT.md` exists and contains only the five requested durable product topics.
3. `dispatch/ACTIVE.md`, `dispatch/COMPLETED.md`, and `dispatch/workstreams/` are the adopted dispatch structure; the active workstream has its canonical `PLAN.md` and post-approval evidence is kept under that workstream.
4. `CURRENT.md`, `memory.md`, the entire `context/` hierarchy, and the listed superseded flat dispatch artifacts are absent.
5. Application code, tests, Prisma code, screenshots, mock data, configuration, Git history, and the pre-existing dirty changes are untouched.
6. No runtime application behavior, data model, dependency, environment, or test behavior is changed; the final diff is limited to the requested operating/product documentation and dispatch artifacts.
7. Existing repository checks (`npm run test:run`, `npm run lint`, and the TypeScript/build checks available in the repository) remain passing, subject to the pre-existing environment state.

## Concerns

- Before GIT START, the pre-existing `next.config.ts` modification and untracked `.codegraph/.gitignore` must remain preserved and understood; meaningful unrelated dirty state may block branch creation under SoloFlow.
- The requested deletion removes all legacy product and technical context, including historical feature specifications; no content-equivalent documentation will be reintroduced.
