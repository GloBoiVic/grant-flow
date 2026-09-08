# T003 Validation - Website Shorthand Normalization

Status: PASS
Role: VALIDATE
Workstream: funder-maintenance
Branch: solo/funder-maintenance

## Validation Scope

Independent validation of the approved T003 Website shorthand revision against the reconciled `PLAN.md`, immutable T003 BUILD receipt, and immutable root/R001 validation and review artifacts. Validation covered only the shared Website contract, directly affected Funder action/form/UI behavior, regressions, browser behavior, and approved-scope boundaries.

## Runtime

- `node --version`: `v26.8.1`
- `npm --version`: `11.19.0`

## Gate Evidence

- `npm run test:run -- src/test/domain-contracts.test.ts src/test/domain-actions.test.ts src/test/funder-ui.test.tsx`: 3 files passed, 38 tests passed.
- Focused contract coverage proved `example.com` normalizes to `https://example.com`, explicit `http://` and `https://` remain unchanged, blank nullable fields normalize to `null`, and unsafe `javascript:` and `data:` schemes are rejected.
- Focused action coverage proved normalized Website input is passed to Funder persistence and the complete returned DTO; unsafe Website inputs fail before authorization, Funder writes, or Activity creation.
- Focused UI coverage proved the Website control remains `type="url"`, the form uses `noValidate` for the custom validation path, scheme-less input reaches the action, and the normalized returned value is displayed as an HTTPS link.
- `npm run test:run`: 37 files passed, 5 skipped; 243 tests passed, 36 skipped. The skipped files are the opt-in PostgreSQL integration suites when the database variable is absent.
- Ephemeral PostgreSQL runner sourced `.env.local` and `.env` without tracing, checked `GRANTFLOW_TEST_DATABASE_ADMIN_URL` without printing it, and ran `npm run test:run -- src/test/postgres-*.integration.test.ts`: 5 files passed, 36 tests passed. The variable value was not printed, traced, persisted, or included here.
- The same non-tracing ephemeral environment followed by `npm run test:run`: 42 files passed, 279 tests passed, 0 skipped.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run verify:prisma`: passed and connected.
- `npm run build`: passed. The generated route output retained `/funders` and `/grants/[grantId]` and added no `/funders/[id]` route.
- `git diff --check`: passed before and after the final worktree inspection.

## Safari Technology Preview Evidence

- Discovered and read authenticated `http://localhost:3000/funders` through Safari Technology Preview MCP.
- The Add funder Website control was an accessible labeled `type="url"` input with the accepted shorthand hint and a custom `noValidate` form path.
- Entered `example.com` and submitted a temporary browser record. The list displayed `https://example.com`; the detail Sheet displayed the same normalized value, and DOM inspection returned the safe canonical link `https://example.com/`.
- The normalized temporary record was removed afterward from the local application database together with its one creation Activity row. A fresh browser load returned to 18 funders and contained no temporary record.
- Entered `javascript:alert(1)` in the Add form. The browser returned `Invalid funder details.` with inline `Invalid URL`, preserved the entered value, and left the list at 19 funders during the check, proving no browser-side create occurred for the unsafe input.
- The existing populated Website link for Racine Community Foundation remained independent and DOM inspection returned `https://racinecommunityfoundation.com/`.
- Safari captured no application errors. Known non-application warnings were the Clerk development-key warning and the Vite/Turbopack HMR preload warning.
- Human visual/browser approval remains a separate downstream gate.

## Changed Paths And Scope

- The T003 BUILD receipt declares exactly these affected application/test paths: `src/lib/validations/funder.ts`, `src/components/funders/funder-form.tsx`, `src/test/domain-contracts.test.ts`, `src/test/domain-actions.test.ts`, and `src/test/funder-ui.test.tsx`.
- The broader worktree also contains the previously approved T001/T002/R001 implementation, dependent-test, and dispatch paths. They remain within the reconciled PLAN seams.
- `dispatch/ACTIVE.md` was already modified in the initial inspection and was not edited by validation.
- No Prisma schema, migration, index, persistence field, route family, cache abstraction, CRM/contact or relationship infrastructure, revision/audit infrastructure, or unrelated Grant behavior was added for T003.
- Final status remained on `solo/funder-maintenance`; the only file written by this validation pass was this prepared T003 follow-up artifact.

## Findings

None. No unresolved Critical, High, Medium, or Low findings were found for the approved T003 Website shorthand contract or its directly affected behavior. No new scope was identified.

## Limitations

- Browser verification used the authenticated local development data. A temporary normalized create was performed to verify live persistence/display and was cleaned up immediately; explicit HTTP(S) preservation and blank-to-null behavior were not saved through the live browser to avoid modifying existing user records, and are covered by focused contract/action tests and PostgreSQL integration coverage.
- Safari browser checks did not constitute human visual approval. Merge and GIT END remain blocked until the separate explicit Safari visual/browser approval after review.
- Vitest emitted the repository's known Vite `configLoader: 'native'` warning during test runs. This did not affect test results.
