# R002 - Visual density refinements validation

Role: VALIDATE
Workstream: ui-simplification
Branch: solo/ui-simplification
Task: R002
Owned artifact: dispatch/workstreams/ui-simplification/remediations/R002-ui-simplification/VALIDATION.md

## Conclusion

R002 satisfies the bounded visual-density remediation in the developer observations, frozen PLAN, root validation/review chain, and R002 BUILD packet. No `CRITICAL`, `IMPORTANT`, or `MINOR` PRODUCT or REGRESSION finding was identified.

The visible Dashboard, Grant list, Grant Sheet, and Workspace amount seams use up to two fractional digits without trailing zeroes and retain meaningful cents. Dashboard, Grant list, Grant Sheet, and Workspace amounts are muted/normal-weight; Grant Sheet and Workspace use explicit code-aware output. Workspace keeps the stored Currency field only when both amounts are null. Amount values, DTOs, currency values, and financial behavior are unchanged.

Needs Attention retains two metrics, adds the restrained desktop divider and right-side padding, and keeps a gap-based narrow stack. Dashboard upcoming rows and Deadline View group headers/rows have more vertical breathing room. Deadline View remains one bordered surface with the three existing semantic groups, exact row fields, links, ordering, time values, status hierarchy, and empty states. Focused assertions preserve these contracts and the source has no new page-level overflow mechanism or layout measurement.

The only concern is the required browser evidence: Safari Technology Preview was running with local Dashboard tabs, but the configured Safari MCP returned `MCP error -32000: Connection closed` for both tab discovery and page inspection. No authenticated desktop or narrow rendered inspection, interaction, or screenshot result is claimed. This is `MINOR | TOOLING | NEW SCOPE`, not an R002 product defect.

## Findings

- Approved-scope DEFECT: none.
- PRODUCT findings: none.
- REGRESSION findings: none.
- `CRITICAL`: 0.
- `IMPORTANT`: 0.
- `MINOR`: 1 tooling limitation only: Safari Technology Preview MCP unavailable (`MCP error -32000: Connection closed`). Classified `TOOLING | NEW SCOPE`; no remediation is warranted in R002 application scope.

## Acceptance Evidence

### Amounts

- `src/components/dashboard/dashboard-content.tsx:32-38` uses `Intl.NumberFormat` with `minimumFractionDigits: 0` and `maximumFractionDigits: 2`; `:150-155` applies normal weight and muted text to requested/awarded totals.
- `src/components/grants/grants-page.tsx:44-52,157` applies the same meaningful-fraction formatting to both list amount columns and retains null placeholder output; amount cells are muted.
- `src/components/grants/grant-detail-sheet.tsx:27-34,62` uses explicit `currencyDisplay: "code"`, meaningful-fraction formatting, muted/normal amount styling, and the existing absent-amount placeholder.
- `src/components/grants/grant-workspace.tsx:47-54,66-109` uses explicit code-aware formatting, muted/normal amount styling, `!== null` amount presence, and the compact stored Currency field only when both amounts are null.
- Focused assertions cover `$100` versus `$100.25`, `USD 100` versus `USD 100.25`, CAD code-only output without `CA$`, null Sheet output, zero Dashboard totals, and Workspace sparse-record Currency behavior in `src/test/dashboard-page.test.tsx:100-110,331-340` and `src/test/grant-ui.test.tsx:48-75,88-170`.

### Attention and deadline spacing

- `src/components/dashboard/dashboard-content.tsx:161-198` retains one Needs Attention region with two metric children, desktop `sm:divide-x sm:divide-border` and `sm:pl-5` right-side spacing, mobile `gap-4`, and unchanged urgency/empty-state semantics.
- `src/components/dashboard/dashboard-content.tsx:201-234` uses `py-4` upcoming rows while retaining the five-row DTO order, `/grants?grant=<id>` links, dates, funders, and status badges.
- `src/components/deadlines/deadline-view.tsx:58-76,92-137` uses `py-4` rows and `py-5` headers/empty rows inside one bordered `max-w-7xl` surface; the fixed three-group configuration, semantic sections/lists, `/grants?grant=<id>` links, dates, status styling, and ordering remain intact.
- Focused assertions cover divider/spacing classes, two metrics, narrow-safe structure, five upcoming rows, exact Deadline headings/order/links/data/statuses, one surface, semantic lists, long-text wrapping, and no Deadline View link invention in `src/test/dashboard-page.test.tsx:113-151,324-329` and `src/test/deadline-view.test.tsx:19-97`.

### Guidelines and scope

- Current Web Interface Guidelines were fetched from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` and applied to the affected seams. No R002-introduced accessibility finding was identified: semantic headings/regions/lists/table, labeled controls, `<time>` values, visible focus classes, `Intl.*` formatting, `min-w-0`, and long-text wrapping are retained.
- Vercel React guidance was applied to the changed React seams. R002 adds no data fetching, client request, layout measurement, or large-list rendering pattern.
- The current tracked diff contains the pre-existing T001-T005 UI/test changes and `dispatch/ACTIVE.md`; the R002 BUILD-declared implementation/test seams are limited to the five listed components and three focused test files. No R002 forbidden query/domain, persistence, schema, auth, route, navigation, import/export, shared primitive, or generated-data path appears in the changed-path audit. No application or test file was edited during this validation.

## Checks / Evidence

- `npm run test:run -- src/test/dashboard-page.test.tsx src/test/grant-ui.test.tsx src/test/deadline-view.test.tsx` -> passed: 3 files, 45 tests.
- `npm run lint -- src/components/dashboard/dashboard-content.tsx src/components/grants/grants-page.tsx src/components/grants/grant-detail-sheet.tsx src/components/grants/grant-workspace.tsx src/components/deadlines/deadline-view.tsx src/test/dashboard-page.test.tsx src/test/grant-ui.test.tsx src/test/deadline-view.test.tsx` -> passed.
- `npx tsc --noEmit` -> passed.
- `git diff --check` -> passed before and after validation review; the assigned receipt is untracked in the workstream directory.
- Vitest emitted the existing Vite `configLoader: 'native'` CommonJS/ESM compatibility warning; it did not affect the focused result.
- Safari Technology Preview MCP attempt: `functions.safari_list_tabs` and `functions.safari_page_info` both returned `MCP error -32000: Connection closed`. The STP process was running and AppleScript reported two `http://localhost:3000/dashboard` tabs, but JavaScript inspection was unavailable because `Allow JavaScript from Apple Events` is disabled. The local unauthenticated `curl` check redirected `/dashboard` to `/login`; it is not authenticated browser evidence.

## Final Receipt

ROLE: VALIDATE
STATUS: DONE_WITH_CONCERNS
ARTIFACT: dispatch/workstreams/ui-simplification/remediations/R002-ui-simplification/VALIDATION.md
FILES CHANGED: dispatch/workstreams/ui-simplification/remediations/R002-ui-simplification/VALIDATION.md only
CHECKS / EVIDENCE: Focused changed-surface tests 3 files/45 tests passed; scoped lint, TypeScript, and `git diff --check` passed; source, guideline, and strict-scope audits found no PRODUCT or REGRESSION defect; Safari MCP was unavailable.
FINDINGS / CONCERNS: No CRITICAL or IMPORTANT findings. One `MINOR | TOOLING | NEW SCOPE` concern: Safari Technology Preview MCP returned `Connection closed`, so authenticated desktop/narrow visual evidence remains unavailable and is not claimed.
