# SoloFlow Plan — Portfolio Dashboard

Status: READY_FOR_USER
Classification: Feature
Workstream: portfolio-dashboard
Base branch: main
Base SHA: 2073400dd710f995f3dd3323fdaf1b274888729b
Execution branch: solo/portfolio-dashboard (created 2026-09-04 via GIT START)
Approval: Approved 2026-09-04 — explicit developer approval to proceed using reconciled portfolio-dashboard PLAN as frozen contract (BUILD → VALIDATE → REVIEW → READY_FOR_USER)
Phase: READY_FOR_USER
Task state: T001 DONE (2026-09-04), T002 DONE (2026-09-04)
Architecture status: Not required; dashboard is a bounded read-only aggregation over the existing authenticated Prisma/PostgreSQL Grant model with no schema change, new service, durable metrics store, or cross-cutting infrastructure. The only reusable seam is small UTC date-only arithmetic for deadline windows.
Next action: Awaiting merge approval — run GIT END (merge to main) upon explicit developer approval

## Outcome

Replace the `/dashboard` placeholder with a useful daily starting point for the single-user Work-Ready v0 deployment.

The authenticated grant professional opens `/dashboard` and immediately understands:

- the size and current funding value of the tracked portfolio;
- how many opportunities remain in the open pipeline;
- whether pre-submission grants have application deadlines requiring attention;
- which pre-submission deadlines are approaching;
- how the portfolio is distributed across the existing grant lifecycle.

The dashboard summarizes the current GrantFlow source of truth. It is not a reporting, forecasting, or analytics platform and must not absorb the separate Deadline View workstream.

Success: the user no longer needs to open the spreadsheet each morning merely to scan these portfolio questions.

## Inspection findings

- `PRODUCT.md` and `AGENTS.md` define GrantFlow as a grant portfolio and grant-work management product. Portfolio insight is in scope; generic analytics infrastructure is not.
- `dispatch/ACTIVE.md` has no active workstream. `portfolio-import` is complete and merged; current `main` base is `2073400`.
- The current local work-ready dataset has imported Grant, Funder, and Activity records suitable for exercising the dashboard.
- `/dashboard` remains a `FeaturePlaceholder`.
- `Grant` already contains all data required for this dashboard:

  - `organizationId`;
  - `funderId`;
  - status;
  - requested and awarded amounts;
  - date-only deadline;
  - soft-delete state.

- `Funder` contains organization ownership and soft-delete state.
- Existing Grant queries consistently scope by the authorized local `organizationId`, exclude deleted Grants, and require an active same-organization Funder.
- Current Grant lifecycle vocabulary contains:

  - Research
  - Qualified
  - Planning
  - Writing
  - Internal Review
  - Submitted
  - Pending
  - Awarded
  - Declined
  - Reporting
  - Closed

- `/grants` already supports URL-backed:

  - search;
  - repeated status filters;
  - repeated tag filters;
  - sorting;
  - direction;
  - pagination.

- `/grants?grant=<id>` is an existing real deep-link contract: the route independently resolves the selected Grant and opens the existing Grant Sheet.
- `/grants` does **not** support an overdue or due-within-N-days filter. Dashboard links must not claim that such a filter exists.
- `/deadlines` remains a placeholder and should not be presented as a completed dashboard destination in this workstream.
- Existing UI already contains Grant status badge styling and UTC date formatting that can be reused or minimally extracted.
- `Grant.deadline` is PostgreSQL `date`, represented by Prisma as a JavaScript `Date`; existing Grant rendering intentionally formats it using UTC.
- Existing Prisma/PostgreSQL capabilities are sufficient for filtered counts, sums, grouped status counts, and bounded ordered result sets. No stored dashboard metrics are required.
- Aggregate sums over an empty set must be normalized to zero for dashboard display.
- Existing indexes on organization, status, deadline, and soft-delete fields are sufficient for the intended Work-Ready portfolio scale.
- No schema change is expected.

## Scope

### In scope

Replace `/dashboard` with four bounded sections:

1. **Portfolio totals**

   - Tracked grants
   - Open pipeline
   - Requested
   - Awarded

2. **Needs attention**

   - overdue pre-submission application deadlines;
   - pre-submission application deadlines due within the next 7 days.

3. **Upcoming deadlines**

   - nearest 5 upcoming pre-submission application deadlines within the next 30 days.

4. **Status breakdown**

   - counts for all existing Grant statuses in lifecycle order.

Also in scope:

- one small dashboard server query/DTO seam;
- one small UTC date-only helper seam reusable by the later Deadline View;
- organization-scoped database aggregation;
- deterministic deadline ordering;
- useful empty states;
- navigation using only existing real GrantFlow routes/query behavior;
- focused query, date-boundary, tenant-isolation, and UI coverage.

### Explicitly out of scope

- dedicated Deadline View;
- deadline-window filtering on `/grants`;
- reminders;
- notifications;
- calendar integration;
- reporting deadline modeling;
- new deadline types;
- task or priority models;
- inferred urgency from `nextSteps`;
- dashboard customization;
- saved views;
- arbitrary date ranges;
- year filters;
- win rates;
- percentages;
- projections;
- forecasts;
- ROI;
- funding-health scores;
- charting libraries;
- analytics warehouses;
- cached/materialized metrics;
- new database tables;
- background aggregation;
- organization timezone settings;
- timezone infrastructure;
- grant drafting;
- Notes/history;
- full Grant Workspace;
- funder editing;
- CSV/export;
- documents;
- collaboration;
- deployment;
- multi-currency conversion or currency-selection work.

`Grant.deadline` remains the only deadline source for this feature.

## Dashboard content

### Portfolio totals

Show four compact metrics using existing design tokens.

| Metric             | Definition                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tracked grants** | Count of current non-deleted Grants belonging to the authorized organization whose Funder is also active and belongs to that organization. |
| **Open pipeline**  | Tracked Grants whose status is Research, Qualified, Planning, Writing, Internal Review, Submitted, or Pending.                             |
| **Requested**      | Sum of `amountRequested` across the tracked portfolio. Empty/null aggregate becomes zero.                                                  |
| **Awarded**        | Sum of `amountAwarded` across the tracked portfolio. Empty/null aggregate becomes zero.                                                    |

Tracked and open-pipeline counts may be derived from the status-group aggregation rather than issuing redundant count queries when that produces a simpler implementation.

Navigation:

- Tracked grants → `/grants`
- Open pipeline → `/grants` with the seven supported repeated `status` values.
- Requested and Awarded are display-only because the current portfolio route has no amount-total semantic worth pretending is a filter.

Do not introduce year semantics. The current Grant model has no grant-year dimension.

### Needs attention

Needs attention is strictly application-deadline attention for **pre-submission** Grants.

Pre-submission statuses:

- Research
- Qualified
- Planning
- Writing
- Internal Review

The following statuses are excluded even if their historical application deadline has passed:

- Submitted
- Pending
- Awarded
- Declined
- Reporting
- Closed

Null deadlines are excluded.

Show two counts:

- **Overdue** — `deadline < today`
- **Due within 7 days** — `today <= deadline <= today + 7 days`

These buckets are disjoint: today is due soon, not overdue.

Keep this section to the two counts plus concise explanatory text. Do not add an optional overdue Grant preview in this workstream.

Because `/grants` does not currently understand overdue or due-within-seven-day URL filters, **do not label links “View overdue” or “View due in 7 days.”**

Instead provide one honest continuation link such as:

**Review pre-submission deadlines →**

That link may open `/grants` with the five pre-submission statuses and `deadline` ascending.

This means the portfolio page shows the relevant working set with oldest deadlines first without pretending that it applies a deadline-window filter it does not support.

Do not introduce a new `/grants` URL parameter in this workstream.

### Upcoming deadlines

Show the nearest **5** pre-submission deadlines within the next 30 days.

Window:

`today <= deadline <= today + 30 days`

Ordering:

1. `deadline ASC`
2. `id ASC`

The stable ID tie-breaker is required when two Grants share a deadline.

Each row shows:

- Grant title;
- Funder name;
- deadline;
- status.

Each row may link directly to:

`/grants?grant=<grantId>`

because that route already resolves and opens the existing Grant Sheet without requiring `/grants/[id]`.

Do not create a new Grant detail route.

Provide an honest section continuation such as:

**Review grant deadlines →**

pointing to the pre-submission status-filtered `/grants` view sorted by deadline ascending.

Do **not** link this completed dashboard to `/deadlines` merely because that route exists; `/deadlines` remains a separate unfinished Work-Ready feature.

### Status breakdown

Show all 11 existing Grant statuses in lifecycle order:

1. Research
2. Qualified
3. Planning
4. Writing
5. Internal Review
6. Submitted
7. Pending
8. Awarded
9. Declined
10. Reporting
11. Closed

Missing groups are zero-filled so the dashboard always communicates the complete lifecycle.

Each row shows at minimum:

- status;
- count.

A small CSS progress/bar treatment is allowed if it materially improves scanning, but the bar is presentation only and must use ordinary existing CSS/tokens.

No charting dependency.

Each status row may link to the existing `/grants?status=<display status>` contract.

Zero-count statuses remain visible.

## Date semantics

`Grant.deadline` is a date-only PostgreSQL column. The dashboard must treat it as a calendar date rather than a timestamp.

Freeze the Work-Ready v0 boundary contract as:

```text
today   = current UTC calendar date at 00:00:00Z

overdue = deadline < today

next7   = today <= deadline <= today + 7 days

next30  = today <= deadline <= today + 30 days
```

Null deadlines belong to none of these sets.

With an injected `today = 2026-09-04`:

- `2026-09-03` is overdue.
- `2026-09-04` is not overdue and is inside next7/next30.
- `2026-09-11` is inside next7.
- `2026-09-12` is outside next7 but inside next30.
- `2026-10-04` is inside next30.
- `2026-10-05` is outside next30.

Create only the small helpers actually required by this feature, for example:

- convert a wall-clock `Date` to UTC date-only midnight;
- add UTC calendar days;
- serialize a date-only `Date` as `YYYY-MM-DD`.

Do not build a generic date utility library.

Dashboard query logic must accept an injected `today` value for tests. Production may derive UTC today from the server clock. Tests must never depend on the real wall clock.

### Known Work-Ready v0 limitation

UTC date-only semantics can differ from a user's local calendar date for several hours around midnight.

This feature does not introduce organization timezone settings, client timezone persistence, a timezone service, or another date library solely to solve that edge.

The limitation is accepted for Work-Ready v0 and must remain explicit.

The later Deadline View should use the same date-only seam unless product experience proves local-calendar alignment needs a dedicated follow-up decision.

## Navigation

Use only navigation contracts that currently exist.

### Valid dashboard destinations

Tracked grants:

`/grants`

Open pipeline:

`/grants?status=Research&status=Qualified&status=Planning&status=Writing&status=Internal%20Review&status=Submitted&status=Pending`

Status breakdown:

`/grants?status=<Status>`

Upcoming deadline row:

`/grants?grant=<grantId>`

Review pre-submission deadlines:

`/grants?status=Research&status=Qualified&status=Planning&status=Writing&status=Internal%20Review&sort=deadline&dir=asc`

Because deadline ascending is already the default sort/direction, BUILD may omit redundant default-valued sort parameters using the existing URL helper.

### Invalid navigation for this workstream

Do not invent:

- `overdue=1`
- `dueWithin=7`
- `deadlineWindow=30`
- other unsupported Grant-list query parameters.

Do not label the generic pre-submission portfolio link as if it filters only overdue or due-soon rows.

Do not use `/deadlines` as a completed continuation target until the Deadline View workstream implements that surface.

## Data/query design

Use the current Prisma/PostgreSQL model. No schema change.

Add one small server-only dashboard query seam following existing `src/lib/queries/` conventions.

Every query uses the current authorization authority:

```text
organizationId = authorized local User organization
```

Every tracked Grant query must enforce:

- Grant `organizationId` equals authorized organization;
- Grant `deletedAt` is null;
- related Funder `organizationId` equals authorized organization;
- related Funder `deletedAt` is null.

No browser/client organization ID establishes scope.

### Expected bounded query shape

Prefer database aggregation and bounded queries.

A small implementation may use:

- one status grouped aggregate for status counts;
- derive Tracked grants from the total of grouped status counts;
- derive Open pipeline by summing the seven relevant status counts;
- one aggregate over the tracked set for both requested and awarded totals;
- one overdue count;
- one due-within-seven count;
- one bounded upcoming-deadline query with `take: 5`.

This avoids loading the whole portfolio and avoids separate count queries when the grouped result already contains the necessary counts.

The exact Prisma call syntax is an implementation detail and must match the installed generated Prisma 7.9 client. Do not copy API syntax from documentation for a different generated-client version without compiling against the repository.

Current Prisma/PostgreSQL aggregate/grouping behavior is sufficient; no raw SQL is expected.

### DTO

A compact serialized contract should be sufficient:

```text
DashboardDto
  asOf
  totals
    trackedGrants
    openPipeline
    requestedTotal
    awardedTotal
    currency
  attention
    overdueCount
    dueIn7Count
  upcoming[]
    id
    title
    funderName
    deadline
    status
  breakdown[]
    status
    count
```

Use display Grant status labels in the DTO/UI. Convert Prisma `InternalReview` to `"Internal Review"` through the existing status contract rather than creating another vocabulary.

No raw Prisma Decimal or Date objects should cross into client rendering when a simple serializable string is sufficient.

## Money

Current Work-Ready data effectively uses USD.

Do not introduce currency conversion, portfolio currency selection, or multi-currency aggregation semantics.

For requested and awarded totals:

- aggregate using database decimal semantics;
- treat empty/null aggregate as zero;
- serialize the aggregate to a decimal string;
- format only for display.

Do not perform storage or aggregate arithmetic through binary floating point.

Using `Number(serializedDecimal)` only at the final `Intl.NumberFormat` display boundary is acceptable for the current `Decimal(12,2)` portfolio range.

Render empty totals as `$0.00` rather than `null` or an em dash.

If Grants exist but no requested/awarded amounts are recorded, retain the cards and add a subtle explanatory caption rather than hiding them.

## Empty states

### No tracked Grants

Still render the dashboard structure with:

- Tracked grants: 0
- Open pipeline: 0
- Requested: $0.00
- Awarded: $0.00
- all lifecycle statuses at 0
- no attention
- no upcoming deadlines

Add a concise next step directing the user to existing real surfaces:

- import an existing spreadsheet at `/import`;
- or go to `/grants` to begin building the portfolio.

Do not add onboarding infrastructure.

### Grants exist but no amounts

Requested/Awarded remain `$0.00` with a muted caption indicating that no corresponding amounts are recorded.

### No deadline attention

Show:

- Overdue: 0
- Due within 7 days: 0

with text such as:

`No pre-submission application deadlines need attention.`

### No upcoming deadlines

Keep the section visible and show:

`No pre-submission deadlines in the next 30 days.`

### Zero-count statuses

Display them as `0`.

The lifecycle breakdown does not hide statuses merely because the current portfolio has no records in them.

## Existing behavior

Preserve:

- Clerk authentication;
- local GrantFlow tenancy;
- `User.clerkUserId → organizationId` authority;
- Portfolio Import;
- Grant/Funder/Tag behavior;
- Activity behavior;
- Grant soft-delete handling;
- Funder soft-delete handling;
- `/grants` URL contract;
- Grant Sheet `?grant=` deep-link behavior;
- existing design tokens;
- existing AppShell and navigation.

Do not change the Prisma schema.

If BUILD unexpectedly concludes that a schema change is necessary, stop and return to PLAN rather than silently introducing one.

## Proposed post-approval task breakdown

Tasks are not created until explicit developer approval and GIT START.

### T001 — Dashboard data contract and date seam

- add the minimal UTC date-only helpers required for dashboard windows;
- add the dashboard DTO;
- implement organization-scoped status aggregation;
- implement requested/awarded aggregation;
- derive tracked/open counts without redundant whole-portfolio reads where straightforward;
- implement overdue and due-within-seven counts;
- implement bounded upcoming-deadline query;
- serialize Decimal/Date/status values;
- add deterministic unit/query coverage;
- add PostgreSQL organization/soft-delete isolation coverage where existing integration patterns support it.

### T002 — Dashboard page and navigation

- replace `/dashboard` placeholder with the four approved sections;
- render totals;
- render Needs attention counts;
- render nearest-five Upcoming deadlines;
- render zero-filled Status breakdown;
- use existing Grant status styling where practical;
- wire only existing real `/grants` filters and `?grant=` deep-links;
- do not link to the unfinished `/deadlines` experience;
- implement approved empty states;
- add focused UI/accessibility/navigation tests.

No additional dashboard product decisions are deferred to BUILD.

## Acceptance

1. `/dashboard` is no longer a placeholder and functions as the Work-Ready portfolio morning overview.
2. Tracked grants includes only active organization Grants whose related Funder is also active and organization-scoped.
3. Open pipeline includes exactly Research, Qualified, Planning, Writing, Internal Review, Submitted, and Pending.
4. Requested is the current tracked-portfolio sum of `amountRequested`.
5. Awarded is the current tracked-portfolio sum of `amountAwarded`.
6. Empty amount aggregates render as zero.
7. Needs attention considers only Research, Qualified, Planning, Writing, and Internal Review.
8. Submitted, Pending, Awarded, Declined, Reporting, and Closed Grants never become application-deadline attention based solely on their original `Grant.deadline`.
9. Overdue is strictly `deadline < today`.
10. Due within 7 days is `today <= deadline <= today+7`.
11. The two attention buckets are disjoint.
12. Upcoming deadlines uses the same five pre-submission statuses.
13. Upcoming deadlines includes `today <= deadline <= today+30`.
14. Upcoming is limited to the nearest 5 Grants.
15. Upcoming ordering is `deadline ASC, id ASC`.
16. Null deadlines appear in no deadline-derived dashboard section.
17. Status breakdown represents all 11 statuses, zero-fills missing groups, and retains lifecycle order.
18. No charting dependency is added.
19. Dashboard date calculations use deterministic UTC date-only helpers and allow fixed dates in tests.
20. The known UTC-vs-local-calendar limitation is not hidden behind speculative timezone architecture.
21. Dashboard queries use the authenticated local organization and never trust a client organization ID.
22. Soft-deleted or cross-organization Grants/Funders cannot affect counts, money, status breakdown, attention, or upcoming results.
23. Upcoming rows can open the existing Grant Sheet using `/grants?grant=<id>`.
24. Status rows use the existing Grant status filter URL contract.
25. Open pipeline uses the existing repeated-status URL contract.
26. Needs-attention continuation navigation is labeled honestly as a broader pre-submission/deadline review because `/grants` does not yet support deadline-window filtering.
27. The dashboard does not introduce unsupported overdue/due-within URL parameters.
28. The dashboard does not present the unfinished `/deadlines` page as its completed continuation experience.
29. No Grant detail route is created.
30. No schema change, stored dashboard metrics, cached metrics, background aggregation, analytics subsystem, task engine, notification system, forecasting, or unrelated Work-Ready feature is introduced.
31. No-grant, no-amount, no-attention, no-upcoming, and zero-status states remain understandable and useful.
32. Existing authentication, tenancy, import, portfolio, tags, funders, activities, Sheet behavior, shell, and URL contracts remain intact.
33. Focused query, integration, date-boundary, empty-state, navigation, and accessibility tests pass.
34. Lint, TypeScript, Prisma validation, build validation, `git diff --check`, and normal SoloFlow browser validation are run and reported.

## Validation expectations (for BUILD)

### Date tests

Inject a fixed `today`, such as `2026-09-04`.

Verify:

- `2026-09-03` → overdue;
- `2026-09-04` → due within 7 and upcoming;
- `2026-09-11` → due within 7;
- `2026-09-12` → not due within 7;
- `2026-10-04` → upcoming;
- `2026-10-05` → outside upcoming;
- null → excluded.

No boundary test may depend on the wall clock.

### Query tests

Verify:

- organization scope;
- active Grant filter;
- active same-organization Funder filter;
- status-group zero filling;
- tracked count;
- open-pipeline semantics;
- requested/awarded sums;
- null→zero;
- pre-submission status filtering;
- Submitted/Pending/etc. exclusion from attention;
- upcoming `take: 5`;
- `deadline ASC, id ASC`.

The exact generated Prisma 7.9 query API must be verified by TypeScript/build rather than assumed from examples for another Prisma client version.

### PostgreSQL integration tests

Use the existing disposable PostgreSQL integration pattern where available.

Seed at least:

- current organization;
- another organization;
- active and soft-deleted Grants;
- active and soft-deleted Funders;
- multiple statuses;
- requested/awarded values;
- past/today/+7/+8/+30/+31 deadlines;
- tied deadlines.

Verify isolation and exact aggregates/windows.

### UI tests

Verify:

- four dashboard sections render;
- totals are formatted correctly;
- attention counts render;
- Upcoming shows at most 5;
- Upcoming row `?grant=` links work;
- status links use supported URL parameters;
- attention continuation does not claim unsupported exact deadline filtering;
- no-grant state;
- no-amount state;
- no-attention state;
- no-upcoming state;
- all-zero breakdown;
- heading hierarchy and accessible link names.

### Static / browser validation

Run and report the repository's normal checks, including:

- lint;
- TypeScript;
- Prisma validation where applicable;
- production build using the repository's currently supported build path;
- focused and relevant full test suites;
- `git diff --check`;
- final Git status/diff inspection;
- browser validation of dashboard rendering and Sheet navigation when local Clerk/database state permits.

Do not claim browser validation that was not actually completed.

## Concerns and decisions for developer review

- **No schema change:** confirmed as the expected solution. Dashboard is derived state.
- **Open pipeline:** deliberately includes Submitted and Pending because those opportunities are unresolved even though they are no longer pre-submission.
- **Deadline attention:** deliberately excludes Submitted and later states so an old application deadline does not create false urgency.
- **Requested/Awarded:** totals span the tracked portfolio because the data model has no grant-year dimension. Do not invent one.
- **USD:** acceptable for current Work-Ready v0 data; multi-currency reporting is deferred.
- **UTC date-only:** chosen to remain deterministic and consistent with current date-only storage/rendering without inventing timezone infrastructure. Known local-midnight limitation is explicit.
- **Next 7 / next 30:** upper boundaries are inclusive; the exact contract is frozen and testable.
- **Upcoming bound:** 5 is intentionally small so Dashboard does not become Deadline View.
- **Needs-attention navigation:** the current Grant list cannot filter exactly to overdue/next-seven windows. The dashboard therefore displays exact counts but links only to an honestly labeled broader pre-submission deadline-sorted portfolio view.
- **Deadline route:** `/deadlines` remains a separate upcoming workstream and is not used as if it were finished.
- **Status visualization:** counts are required; CSS bars are optional presentation inside T002 only if they do not add complexity or a dependency.
- **Prisma aggregation:** use database aggregation/grouping supported by the installed Prisma/PostgreSQL stack, but implement against the repository's generated Prisma 7.9 API rather than assuming syntax from a different current documentation version.
- **Architecture:** no `ARCHITECTURE.md` required. If BUILD discovers a genuinely cross-cutting architecture need, stop and escalate rather than expanding silently.

## References

- `PRODUCT.md`
- `AGENTS.md`
- `dispatch/ACTIVE.md`
- `dispatch/COMPLETED.md`
- completed `portfolio-import` workstream
- `prisma/schema.prisma`
- `src/lib/clerk/authorization.ts`
- `src/lib/queries/grants.ts`
- `src/lib/queries/grant-list-contract.ts`
- `src/lib/queries/funders.ts`
- `src/lib/queries/serializers.ts`
- `src/lib/validations/grant.ts`
- `src/app/(authenticated)/(org-required)/dashboard/page.tsx`
- `src/app/(authenticated)/(org-required)/grants/page.tsx`
- `src/components/grants/grants-page.tsx`
- current AppShell/navigation
- `src/app/globals.css`
- relevant screenshots and tests
