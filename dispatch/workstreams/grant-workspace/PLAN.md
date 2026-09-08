# SoloFlow Plan - Grant Workspace

Status: READY_FOR_USER
Classification: Feature
Workstream: grant-workspace
Base branch: main
Base SHA: 88e6a4aeb1fc1ead109b71ba2b82afe15a16580f
Execution branch: solo/grant-workspace (created 2026-09-07 via GIT START)
Approval: Approved 2026-09-07 - explicit developer approval to proceed using this reconciled plan as the frozen contract
Phase: READY_FOR_USER
Task state: T001 DONE; T002 DONE; R001 BUILD DONE, VALIDATE PASS, REVIEW PASS
Validation state: Root F-001 IMPORTANT defect resolved through the immutable R001 BUILD -> VALIDATE -> REVIEW chain; no unresolved CRITICAL or IMPORTANT findings
Architecture status: Not required; this is a bounded authenticated detail route and route-local record presentation over existing Grant, Funder, Tag, Activity, query, action, form, and UI seams. No schema change, generalized workspace framework, new persistence model, or cross-cutting contract is expected.
Next action: Await explicit human Safari Technology Preview visual/browser approval; do not merge or perform GIT END.

## Outcome

Create the first real Grant Workspace at `/grants/[grantId]` so a grant professional can open a Grant from the portfolio and understand and maintain the complete existing working record without a parallel spreadsheet.

Work-Ready v0 answers this user need:

> From the portfolio, I can open a grant and see the complete working record in one clear page, edit the existing structured record, review my working notes, tags, and activity, and return to the portfolio without maintaining a parallel spreadsheet.

The workspace is the durable Grant-specific working page. The existing `/grants?grant=<id>` Sheet remains the fast portfolio inspection and editing surface.

## Inspection findings

- `main` currently points to `88e6a4a` (`chore: close deadline view workstream`). The full base SHA is recorded above. Solo inspection recorded the local worktree as clean. No execution branch is created during planning.
- `dispatch/ACTIVE.md` is clear during this planning gate and still records `No active workstream.` The `grant-workspace` workstream does not become active until explicit developer approval and GIT START.
- `PRODUCT.md` defines each Grant as a durable workspace for both its structured record and Grant-specific work. This feature is bounded to the existing structured record, scalar Notes, tags, and business-event Activity.
- The authenticated organization-required layout already supplies local-user authorization, organization redirect behavior, `AppShell`, primary navigation, skip link, and the existing content offset. The new route belongs under `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx`.
- There is no current `/grants/[grantId]` route and no custom `not-found.tsx`. The normal Next `notFound()` path should be used so unavailable records share the normal not-found behavior.
- Current Next App Router behavior uses a `Promise` for dynamic page `params`; the route should await the params object and read `grantId` from it.
- `getGrant(grantId)` already reads the complete required Grant record from `src/lib/queries/grants.ts`: title, funderId, status, currency, both amounts, deadline, decision date, award timeframe, designation, county served, next steps, notes, owner/creator IDs, timestamps, active same-organization Funder, active organization-scoped tags, and organization-scoped Activity.
- `getGrant` derives organization scope from `requireAuthorization()`, requires `Grant.organizationId` to match that local organization, requires `Grant.deletedAt: null`, and requires the related Funder to have the same organization and `deletedAt: null`. It returns `null` for a missing, cross-organization, soft-deleted, or invalid/deleted-Funder record.
- `getGrant` filters assigned tags through active Tags belonging to the authorized organization and orders Activity by `createdAt DESC`, then `id DESC`. The workspace must preserve that current newest-first business-event ordering.
- `GrantDetailDto`, `FunderDto`, `TagDto`, and `ActivityDto` are already serializable client/server-boundary DTOs. `GrantDetailDto` already includes every field needed by both the workspace and the existing edit form; no parallel `WorkspaceGrantDto` is needed.
- `InternalReview` is normalized to the display value `Internal Review` by the existing query/action serialization seam. The workspace must render the display value and must not expose the Prisma enum spelling.
- `GrantForm` already edits every structured field required here, including `awardTimeframe` and `notes`, uses `editGrant`, preserves the existing Zod validation and field-error behavior, and deliberately keeps status under the separate status action for edits.
- `changeGrantStatus` already preserves the current status vocabulary, maps display `Internal Review` back to database `InternalReview`, authorizes the Grant and active same-organization Funder, avoids a write for a same-status submission, and appends `status_changed` Activity only for a real change.
- `TagManager` already assigns, creates, and removes active organization tags through the existing tag actions without Activity writes. It is suitable for direct reuse in the workspace rather than creating a second tag implementation.
- The existing Grant Sheet already renders status, tags, and Activity and reuses `GrantForm` and `TagManager`. It currently has no full-workspace link. The Sheet must remain in place and receive one clear `Open full grant` Link to `/grants/<encoded grantId>`.
- The existing portfolio row and Dashboard/Deadline View links may continue to open the Sheet. No unrelated navigation rewrite is required.
- `editGrant`, `changeGrantStatus`, and tag assignment/removal currently revalidate `/grants`. The new workspace should retain that behavior and minimally add exact `/grants/${grantId}` revalidation for successful Grant-specific mutations where the known Grant ID permits it. Current Next behavior permits a literal dynamic-page URL such as `/grants/<id>` to be passed to `revalidatePath` without a route type argument.
- `createTag` has no Grant ID and therefore should retain its existing `/grants` revalidation only; the immediately following assignment action knows the Grant ID and can perform workspace-specific revalidation.
- The action DTO returned by `editGrant` or `changeGrantStatus` is not a complete workspace snapshot: it contains `tags: []` and either only the newly created Activity or no Activity for a same-status change. The workspace must not replace its full record with those mutation DTOs. Successful edit/status interactions should refresh the server-owned workspace data.
- `listFunders()` already returns active Funders from the authorized organization in stable name/id order. `listTags()` already returns active Tags from the authorized organization in stable name/id order. They are sufficient for the existing Grant edit and TagManager controls.
- Existing Funder UI maps persisted Funder types to human-readable labels: `FOUNDATION` → `Foundation`, `FAMILY_FUND` → `Family Fund`, `CORPORATION` → `Corporation`, and `OTHER` → `Other`. The workspace should use the same display vocabulary rather than exposing raw enum values.
- Current visual references and implementation language use the soft-gray canvas, white bordered `rounded-xl` surfaces, restrained shadows, compact dense type scale, indigo primary, existing status treatments, semantic links, and visible focus states. Dashboard uses labeled sections and urgency accents; Deadline View uses grouped bordered surfaces, `min-w-0`, safe wrapping, and UTC-safe date-only display.
- `screenshots/grant-detail.png` is a broad product reference but includes future-style tabs and document areas that are explicitly not part of this workstream. The implementation should not reserve those areas with fake tabs or placeholders.
- Prisma already persists all required fields. Existing indexes cover organization, funder, status, deadline, owner, and soft-delete access paths. No schema, migration, or index change is expected.
- Test configuration runs Node tests by default, with component tests opting into jsdom. Existing domain query/action tests, PostgreSQL isolation fixtures, and Grant UI tests provide the nearest focused seams.
- The current fully enabled local test baseline is 41 test files, 238 tests passed, and 0 skipped when `GRANTFLOW_TEST_DATABASE_ADMIN_URL` is exported into the test process.
- Relevant specialist guidance loaded for implementation and review: `solo-flow`, `frontend-design`, `web-design-guidelines`, and `vercel-react-best-practices`.

## Scope

### In scope

- Add the authenticated organization-required route `/grants/[grantId]`.
- Load the Grant through the existing `getGrant(grantId)` authorization/query seam.
- Use `notFound()` for a missing Grant, another organization's Grant, a soft-deleted Grant, a Grant whose Funder is soft-deleted, and a Grant whose Funder belongs to another organization.
- Load active same-organization Funders and Tags only after the Grant is found, using `listFunders()` and `listTags()` for the existing edit and tag seams.
- Render a complete structured Overview containing Grant title, Funder, status, amount requested, amount awarded, currency, application deadline, decision date, award timeframe, designation, county served, next steps, and tags.
- Display related Funder information using the existing Funder DTO: name, human-readable type, and website when present. Do not add Funder editing, contacts, or a Funder detail route.
- Render existing scalar `Grant.notes` as current internal working Notes. An empty Notes value gets an honest empty treatment; no Notes model, versions, comments, or revision history is added.
- Render existing Grant Activity as a clear reverse-chronological business-event timeline in the current `getGrant` order. Do not reinterpret it as content revision history.
- Reuse `GrantForm` and `editGrant` for the Edit grant action, with existing validation, organization isolation, dirty-form confirmation, and status separation preserved.
- Reuse `changeGrantStatus` and the current status vocabulary/behavior in a small workspace interaction control without creating a workflow engine or confirmation infrastructure.
- Reuse `TagManager` and the existing tag actions for assignment, creation, and removal.
- Keep the static workspace record server-rendered/server-compatible. Limit client state to the existing interactive controls: Grant editing, status interaction, and the already-client `TagManager`.
- Add route-specific cache revalidation for successful Grant edit/status/tag assignment/removal mutations while preserving existing `/grants` revalidation and action contracts.
- Add a clear Sheet Link labeled `Open full grant` targeting `/grants/<grantId>` with URL encoding.
- Keep an obvious `Back to Grants` Link to `/grants`; rely on ordinary browser Back behavior and do not preserve arbitrary search/filter state with custom return state.
- Use a stacked, always-visible page architecture: Workspace header, Overview, Notes, and Activity. Keep Tags within the Overview surface so all Work-Ready v0 content is visible without hidden tab state.
- Preserve existing AppShell, navigation, design tokens, status mappings, date/currency behavior, authentication, and tenant boundaries.
- Add focused server route/query, action/cache, UI, accessibility, responsive, and integration coverage.
- Stop at `READY_FOR_USER` after BUILD, VALIDATE, and REVIEW for explicit Safari Technology Preview visual/browser approval. Do not merge or perform GIT END without that approval.

### Explicitly out of scope

- Draft model or editor.
- Notes version history, content revision history, comments, or collaborative review workflows.
- Documents, file storage, upload, DOCX export, or PDF export.
- Funder editing, funder contacts, generalized CRM functionality, or `/funders/[id]`.
- Reminders, notifications, calendar integrations, task management, or workflow/transition engines.
- Custom fields, owner reassignment, soft-delete/restore UI, currency selection expansion, reporting, analytics, or deployment.
- New Grant, Notes, Activity, Tag, Workspace, or collaboration persistence models.
- Schema, migration, or index changes unless BUILD finds a genuine required data defect and returns to PLAN first.
- Disabled fake tabs, placeholder editors, future History areas, or generalized workspace infrastructure.
- Rewriting Dashboard, Deadline View, navigation, portfolio filtering, Sheet URL state, or unrelated visual surfaces.
- Custom portfolio return-state preservation beyond normal browser history.
- AI or grant-writing generation.
- Any client-provided organization scope or client-side authorization decision.
- Moving the entire workspace into a Client Component solely to support a few interactive controls.

## Frozen route and authorization contract

### Route

The route is `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx`.

The page receives the current Next App Router params contract:

```text
params: Promise<{ grantId: string }>
```

It awaits the params object, obtains `grantId`, and calls `getGrant(grantId)`.

If the result is `null`, it calls `notFound()` immediately. It does not render a partial workspace, tenant-specific error, alternate missing-record state, or other distinction.

After a valid Grant is found, the page obtains `listFunders()` and `listTags()` for the existing edit and tag controls. These two independent reads should be performed in parallel after the Grant existence check.

No organization ID is accepted in route params, search params, form input, browser-originated component state, or mutation input.

The following cases must all be indistinguishable to the route and user through the same normal not-found behavior:

- nonexistent Grant ID;
- existing Grant owned by another organization;
- soft-deleted Grant;
- Grant in the local organization attached to a soft-deleted Funder;
- Grant in the local organization attached to a Funder from another organization.

The route must not fetch or expose Funder, Tag, or other Grant data after `getGrant` has returned `null`.

Authentication and organization membership remain the responsibility of the existing organization-required layout and query seam.

### Required query scope

Reuse `getGrant` without creating a second workspace query. If a minimal correction is required, preserve this exact read contract:

```text
Grant.id = requested grantId
Grant.organizationId = authorized local organizationId
Grant.deletedAt = null
Grant.funder.organizationId = authorized local organizationId
Grant.funder.deletedAt = null
Grant.grantTags.tag.organizationId = authorized local organizationId
Grant.grantTags.tag.deletedAt = null
Grant.activities.organizationId = authorized local organizationId
Grant.activities ordered by createdAt DESC, id DESC
```

The selected and serialized DTO must continue to contain only serializable values.

- Decimal amounts remain strings.
- Date-only fields remain `YYYY-MM-DD` or `null`.
- Timestamps remain ISO strings.
- JSON metadata remains a serializable object or `null` through the existing serializers.
- Status remains the display contract, including `Internal Review`.

No separate Funder query is added for workspace display. The related Funder already comes from `GrantDetailDto`.

`listFunders()` is used only because the existing edit form needs active organization Funder options.

`listTags()` is used only because `TagManager` needs active organization Tag options.

## View and visual direction

### Architecture decision

Use simple stacked sections, not tabs or a local navigation strip.

Work-Ready v0 is about making the whole current Grant understandable in one page. Stacking keeps Overview, Notes, Tags, and Activity discoverable, avoids hidden state and URL contracts, works naturally on narrow screens, and leaves future Draft/History evolution to ordinary route/component changes without reserving fake UI now.

Keep the route and static workspace presentation server-compatible.

A route-local presentation component such as:

`src/components/grants/grant-workspace.tsx`

should render the static record from the server-provided `GrantDetailDto`.

Do not add `"use client"` to the whole workspace merely because editing/status/tag controls are interactive.

If needed, add one small client interaction component such as:

`src/components/grants/grant-workspace-actions.tsx`

for:

- Edit grant;
- status selection/action;
- `router.refresh()` after successful mutations.

The existing `TagManager` remains its own Client Component and can be embedded directly inside the server-compatible workspace.

This keeps authorization, query execution, and the majority of record rendering server-owned without creating a generic workspace framework or a broad client-side data layer.

### Header

- Use the established authenticated shell and the same `mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8` content rhythm used by Dashboard and Deadline View.
- Start with a visible `Back to Grants` Link to `/grants`, not a custom breadcrumb system.
- Present the Grant title as the single H1. Use `min-w-0`, `break-words`, and balanced wrapping so long imported titles remain readable.
- Show the related Funder name beneath or beside the title.
- Show Funder type using the existing human-readable labels rather than raw enum values.
- Show the Funder website as a restrained external Link when present, using the existing safe external-link behavior.
- Show the existing status using its status Badge treatment, including `Internal Review` as the display label.
- Keep common actions visible: `Edit grant` and the existing status interaction. Do not fabricate document, delete, reminder, or other actions.
- If useful without clutter, the header may show a compact context line for deadline and funding. These are record facts, not dashboard metrics. The Overview remains the authoritative full field display.
- Keep the header calm and record-oriented. A bordered white surface is allowed, but avoid a collection of identical KPI-style summary cards.

### Main workspace

Use three primary sections in this order:

1. `Overview`
   - A bordered white record surface with a restrained responsive definition-list grid.
   - Include every required structured field.
   - Use clear labels and whitespace, not a giant editable form.
   - Render amount requested, amount awarded, and currency clearly enough that the persisted currency remains visible rather than merely inferred from a symbol.
   - Put long `Next steps` content in a full-width row and preserve useful line breaks.
   - Include the existing `TagManager` under a correctly nested `Tags` heading within this surface so assigned tags and tag actions are part of the record Overview.

2. `Notes`
   - A separate readable surface showing `Grant.notes`.
   - Use `whitespace-pre-wrap` and safe word wrapping.
   - Preserve useful line breaks.
   - Treat this as current internal working Notes, not Activity or revision history.
   - Editing remains through `GrantForm`.

3. `Activity`
   - A separate semantic timeline/list showing each existing Activity description and its existing timestamp/date presentation.
   - Preserve the current newest-first order.
   - Keep current Activity meaning and do not add revision labels, content versions, or generated content events.

Use the established `rounded-xl border border-border bg-card shadow-sm` treatment where a surface helps hierarchy.

Keep optional fields in a compact definition grid rather than rendering a visually heavy empty card for each value.

Use existing spacing, text, border, status, warning, destructive, success, and focus tokens only.

### Responsive and content handling

- The layout must stack cleanly on narrow/mobile widths with no horizontal page or section scrolling.
- Definition fields may use one column on narrow screens and two or more columns at larger widths.
- Long titles, Funder names, Notes, and Next steps use `min-w-0`, `break-words`, or equivalent safe wrapping.
- Date-only Grant fields use the existing UTC-safe `Intl.DateTimeFormat` convention.
- Amounts use `Intl.NumberFormat` with the persisted Grant currency. Do not infer or expand supported currency choices.
- The persisted currency remains visibly represented in Overview.
- Preserve Notes and Next steps line breaks where displayed.
- Do not truncate working content needed to understand the record.
- Use semantic `header`, the `main` landmark already supplied by AppShell, `section`, `dl`, `dt`/`dd`, `ol`/`li`, `time`, `Link`, `a`, and `button` elements appropriately.
- Do not use clickable non-semantic containers.
- All icon-only controls need accessible names.
- Decorative icons are `aria-hidden="true"`.
- Action success and error messages use appropriate `status`/live or `alert` semantics consistent with existing components.
- All Links and buttons have visible `focus-visible` treatment.
- Form controls retain labels and the existing dirty-form protection.
- Avoid new motion. Existing Sheet motion remains subject to the current reduced-motion behavior.

## Editing and mutation contract

- A small workspace client interaction component owns Edit grant and status interaction. It receives only the server-provided Grant DTO and active Funder options it needs.
- The workspace `Edit grant` action opens the existing `GrantForm` with the server-provided `GrantDetailDto` and active same-organization Funder list.
- Do not create a second Grant schema, form, field mapper, Notes action, or edit-specific status field.
- The existing edit form continues to omit status from its mutation payload because lifecycle status is maintained separately.
- On a successful edit:
  - do not replace the full workspace record with `result.data`;
  - close the existing form;
  - invoke `router.refresh()`;
  - let the server route rerun `getGrant()` and return the complete refreshed Grant, assigned tags, and full Activity timeline.
- Preserve existing edit validation, server error display, unsaved-change confirmation, Funder isolation, and `grant_updated` Activity behavior.
- The edit mutation retains `revalidatePath("/grants")` and adds exact `revalidatePath("/grants/${grantId}")` after a successful authorized mutation.
- No client cache, REST endpoint, query library, or new API layer is introduced.

For status:

- Use the existing `GrantStatus` display values and `changeGrantStatus`.
- Preserve `Internal Review` ↔ `InternalReview` mapping through the existing action seam.
- Keep status UI small and record-oriented; do not build a status workflow component or transition engine.
- On a successful real status change:
  - show the existing style of confirmation;
  - keep the visible status selection consistent with the successful result;
  - invoke `router.refresh()` so the server-owned workspace reloads the complete Activity timeline and record.
- Do not replace the workspace record with the partial status action DTO.
- Preserve same-status behavior: no database mutation and no Activity write.
- A same-status submission must not gain a new workspace revalidation side effect merely because this page exists.
- A real status mutation retains `/grants` revalidation and adds exact `/grants/${grantId}` revalidation.
- Do not add confirmation infrastructure, transition rules, or status history beyond existing Activity.

For tags:

- Render the existing `TagManager` against the server-provided assigned tags and active organization tags.
- Its existing local assignment/create/remove behavior remains the interaction source of truth.
- Tag assignment and removal retain `/grants` revalidation and add exact workspace revalidation for the known `grantId`.
- `createTag` retains its existing organization-wide `/grants` revalidation because it does not receive a Grant ID.
- The immediately following assignment flow performs the Grant-specific workspace revalidation.
- Do not add Activity writes for tag operations.
- Do not add a second tag state manager or Funder actions.

## Nullable and empty-field contract

The workspace must remain useful for partially populated imported Grants and must not fabricate values.

- Nullable single-value fields use the repository's restrained absence treatment, preferably the existing em dash `—` where a label already makes the meaning clear.
- Empty amount requested, amount awarded, deadline, decision date, award timeframe, designation, county served, and next steps values do not create placeholder prose or oversized empty cards.
- Empty Notes renders an intentional `No notes recorded yet.` message.
- Empty Tags uses the existing `TagManager` message `No tags assigned yet.` and keeps tag creation available through the existing control.
- Empty Activity renders `No activity recorded.` while retaining the Activity section heading.
- Missing Funder website renders a restrained absence treatment rather than a fabricated link.
- A sparse Grant still has a clear H1, Funder, status, Overview heading, Notes heading, Activity heading, and visible navigation/actions.

## Proposed post-approval task breakdown

Tasks were created after explicit developer approval and GIT START. Execute them sequentially.

### T001 - Workspace route, existing data seams, and isolation coverage

- Add the authenticated `/grants/[grantId]` server route using the current Promise-based params contract, `getGrant`, `notFound()`, and existing `listFunders`/`listTags` only for a valid Grant.
- Await the dynamic route params and extract `grantId`.
- After the Grant is confirmed valid, load `listFunders()` and `listTags()` in parallel.
- Verify whether any minimal `getGrant` adjustment is actually needed; preserve its existing complete `GrantDetailDto` contract if it already satisfies the workspace.
- Add route tests proving the server-owned query call, valid DTO handoff, `notFound()` on a missing result, and no follow-on Funder/Tag reads after not-found.
- Extend focused query assertions for same-organization active Funder scope, active organization-scoped tags, Activity scope/order, complete field serialization, and `InternalReview` to `Internal Review` display mapping.
- Extend the existing disposable PostgreSQL domain-isolation fixture or add the smallest focused equivalent to prove current same-organization reads, another-organization denial, soft-deleted Grant denial, soft-deleted Funder denial, and mismatched-organization Funder denial all return no workspace record.
- Add integration data only as needed for complete populated fields, tags, and multiple Activity rows; do not add a schema or a second broad fixture unnecessarily.

### T002 - Workspace presentation, editing controls, revalidation, Sheet link, and UI coverage

- Add a server-compatible stacked `GrantWorkspace` UI with header, Back to Grants Link, Overview definition list, human-readable Funder information, Notes, Activity, and reused `TagManager`.
- Add only the smallest client interaction component needed for Edit grant, status interaction, and complete server refresh behavior.
- Do not convert the whole workspace into a Client Component.
- Surface Award Timeframe, Notes, tags, all nullable structured fields, explicit currency, and existing Activity in the planned hierarchy and order.
- Reuse `GrantForm` for Edit grant and the existing status action vocabulary/behavior without introducing a second edit implementation or workflow abstraction.
- Ensure successful edit/status interactions refresh the complete server-owned workspace rather than adopting partial mutation DTOs.
- Extend successful Grant-specific edit/status/tag assignment/removal actions with exact workspace-route revalidation while preserving existing `/grants` behavior and same-status no-op semantics.
- Add the `Open full grant` Link to the existing `GrantDetailSheet` without removing or changing its quick portfolio role.
- Add or update focused UI tests for complete and sparse records, field labels/values, Award Timeframe, Notes, Activity order, tags, human-readable Funder display, external Funder website behavior, `Internal Review`, edit payload/validation flow, refresh after save, status behavior, tag behavior, Sheet Link, accessible headings/landmarks/links/buttons, long text, and narrow-layout-safe structure.
- Preserve existing Grant Sheet tests and update them only for the new explicit full-workspace link and any required revalidation assertions.
- Use the loaded frontend/design/accessibility specialist guidance during implementation.
- Stop for Safari Technology Preview acceptance after validation and review.

No additional product decision is deferred to BUILD.

A missing required field, a need for a new DTO/query, a persistence/schema requirement, a different authorization seam, a need for tabs/history infrastructure, a broad client-side workspace state model, or a mutation/cache contract that cannot be satisfied by the existing actions must stop BUILD and return to PLAN rather than expand silently.

## Acceptance

1. Authenticated `/grants/[grantId]` renders the workspace for an authorized active same-organization Grant with an active same-organization Funder.
2. The route uses the current Promise-based dynamic params contract and obtains the requested `grantId` from the awaited params object.
3. The route calls `notFound()` for a missing Grant.
4. Another organization's Grant is indistinguishable from not found.
5. A soft-deleted Grant is indistinguishable from not found.
6. A Grant with a deleted Funder is indistinguishable from not found.
7. A Grant with a Funder from another organization is indistinguishable from not found.
8. The route never accepts organization scope from the client and uses the existing authorized local organization seam.
9. No Funder or Tag option data is fetched or exposed after the Grant query returns no record.
10. The workspace uses the existing `getGrant` contract rather than creating a parallel workspace query when no data gap exists.
11. Every required structured field is visible with a clear label: Grant title, Funder, status, amount requested, amount awarded, currency, application deadline, decision date, award timeframe, designation, county served, next steps, and tags.
12. Award Timeframe is visibly rendered when populated.
13. Funder name, human-readable Funder type, and existing website information are clear; raw Funder enum values, Funder editing, contacts, `/funders/[id]`, and CRM behavior are not added.
14. `InternalReview` is displayed as `Internal Review` everywhere the workspace renders status.
15. Existing `Grant.notes` is visible as current internal working Notes and preserves useful line breaks.
16. Notes are not versioned and are not treated as Activity or revision history.
17. Existing Grant Activity is visible in the current repository order, newest first by `createdAt` and `id`, with clear descriptions and semantic timestamps/dates.
18. Activity remains a business-event timeline; no content revision history or new Activity event type is added.
19. Assigned tags are visible, and existing assign/create/remove behavior remains functional through `TagManager`.
20. Empty tags, Notes, Activity, Funder website, and nullable fields use honest restrained absence treatment without fabricated values or a wall of empty cards.
21. Sparse imported Grants still render an intentional useful page with the required headings, navigation, and actions.
22. The workspace has one clear H1 for the Grant and visible sections for Overview, Notes, and Activity.
23. The page uses stacked visible sections rather than tabs, disabled future controls, fake History/Draft areas, or a generalized workspace framework.
24. Static workspace data and record rendering remain server-compatible; client state is limited to the existing interactive edit/status/tag controls.
25. `Edit grant` reuses the existing `GrantForm` and `editGrant` mutation, including existing Zod validation, organization isolation, dirty-form confirmation, and status separation.
26. A successful edit refreshes the server-owned workspace and shows updated structured fields, Notes, assigned tags, and complete Activity without replacing the page with the action's partial DTO.
27. The workspace status control reuses the current status vocabulary and `changeGrantStatus` behavior, including same-status no-op behavior and existing Activity semantics.
28. A successful real status change refreshes the server-owned workspace and shows the current status and complete Activity timeline.
29. Tag assignment/removal remains organization-scoped, idempotent, and free of new Activity writes.
30. Successful Grant-specific mutations retain existing `/grants` revalidation and also revalidate the exact workspace route where the known Grant ID permits it; same-status status submissions remain no-op.
31. The existing `/grants?grant=<id>` Sheet remains available and continues to serve quick portfolio interaction.
32. The Sheet contains an accessible `Open full grant` Link to `/grants/<encoded grantId>`.
33. The workspace contains an obvious Link back to `/grants`; normal browser Back behavior is preserved without custom portfolio state restoration.
34. Long Grant titles, Funder names, Notes, and Next steps wrap safely and do not force horizontal scrolling.
35. The layout works on desktop and narrow/mobile widths using existing tokens and responsive primitives.
36. Dates use existing date-only formatting behavior, amounts use `Intl.NumberFormat` with the persisted currency, the currency remains explicitly visible, and no timezone or currency infrastructure is introduced.
37. Headings are hierarchical, landmarks and definition lists/timelines are semantic, Links/anchors are used for navigation, actions are buttons, controls are labeled, decorative icons are hidden from assistive technology, and focus states are visible.
38. Save/status/tag feedback uses appropriate existing alert/status semantics and does not silently fail.
39. Query and PostgreSQL tests prove authorized loading, tenant isolation, soft-delete exclusion, invalid/deleted Funder exclusion, complete field serialization, tag scope, Activity scope/order, and JSON-serializable DTOs.
40. UI tests prove complete field rendering, nullable/empty rendering, Award Timeframe, Notes, Activity, tags, human-readable Funder information, `Internal Review`, Sheet deep-link, edit validation/mutation handoff, complete refresh after save, status/tag behavior, heading/landmark/link/button accessibility, and narrow/long-text-safe rendering.
41. No schema, migration, persistence model, Draft, History, document, Funder-edit, CRM, reminder, notification, calendar, task, export, reporting, AI, broad client-side workspace state, or unrelated Dashboard/Deadline behavior changes are made.
42. Normal Node 26 repository validation passes.
43. The human Safari Technology Preview visual/browser gate is explicitly approved before merge or GIT END.

## Validation expectations

### Focused query, route, action, and UI tests

Add only the smallest focused test files or extensions needed.

Expected coverage includes:

- Route awaits the dynamic route params, calls `getGrant` with the route Grant ID, passes valid serializable data to the workspace, and calls `notFound()` for `null` without fetching edit/tag options.
- Valid route flow loads `listFunders()` and `listTags()` only after the Grant exists and may run those independent reads in parallel.
- Query assertions retain the authorized organization, active Grant, active same-organization Funder, active organization-scoped tags, Activity organization, selected fields, and `createdAt DESC` / `id DESC` order.
- Query serialization keeps amounts as strings, date-only values as `YYYY-MM-DD`, timestamps as ISO strings, metadata serializable, and `InternalReview` displayed as `Internal Review`.
- Query/UI Activity assertions prove the expected newest-first order is preserved and multiple records do not collapse into one.
- Complete UI fixtures render every required field, including populated Award Timeframe, Notes, tags, human-readable Funder type, Funder website, explicit currency, and Activity.
- Sparse UI fixtures render no fabricated data and show restrained empty treatment for nullable fields, missing Funder website, empty Notes, empty tags, and empty Activity.
- Static record content remains in a server-compatible workspace component; tests do not require client-side fetching or a client-side workspace data store.
- `Edit grant` opens the existing Grant Form, submits the existing field contract without a separately managed edit-form status field, surfaces existing validation errors, and invokes complete server refresh after a successful save.
- Tests prove a successful edit does not replace the full visible workspace with the mutation DTO's empty tags/single Activity shape.
- The workspace status control invokes the existing status action using display values, refreshes the complete server-owned record after a real success, and preserves current same-status no-op behavior.
- Existing `TagManager` assignment, creation, and removal controls remain covered without introducing a second tag action path.
- Action tests prove exact workspace revalidation occurs only where the successful known-Grant mutation permits it and existing `/grants` revalidation remains.
- `createTag` does not gain a fabricated Grant ID input solely for cache revalidation; the assignment action performs Grant-specific revalidation.
- Sheet tests prove `Open full grant` targets the encoded `/grants/<grantId>` route while existing Sheet controls remain available.
- Tests use semantic heading, landmark, link, button, form-control, list, definition-list, and time queries where possible.
- Long text assertions verify safe wrapping/min-width structure and absence of fabricated navigation controls.

### PostgreSQL integration tests

Use the existing disposable PostgreSQL integration pattern and fixed data.

Export the ignored local `GRANTFLOW_TEST_DATABASE_ADMIN_URL` into the test process before running the PostgreSQL suites.

Do not:

- print the value;
- use shell tracing that exposes it;
- write it into tracked files;
- include it in receipts.

The full PostgreSQL suite must run rather than being silently accepted as skipped when the local variable is available.

Extend the existing domain-isolation fixture or add the smallest focused fixture to verify:

- an authorized local Grant with an active local Funder loads;
- another organization's Grant does not load;
- a soft-deleted Grant does not load;
- a local Grant attached to a soft-deleted Funder does not load;
- a local Grant attached to a Funder from another organization does not load;
- all populated structured fields, active tags, and multiple Activity rows are returned only for the authorized Grant;
- Activity is ordered by `createdAt DESC`, then `id DESC`;
- `InternalReview` serializes to `Internal Review`;
- returned DTOs contain no Prisma, Date, or Decimal instances after serialization;
- edit/status mutations remain organization-isolated and append their existing Activity semantics;
- same-status status mutation remains a no-op;
- tag assignment/removal remains organization-isolated, idempotent, and does not create Activity.

### Repository gates

After implementation, run and report exactly what ran under Node 26:

- focused Grant Workspace route/query/action/UI tests;
- the full normal repository suite: `npm run test:run`;
- the PostgreSQL integration suites with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` exported into the process and its value never printed;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run verify:prisma`;
- production build through the repository-supported command, `npm run build`;
- `git diff --check`;
- final `git status` and diff inspection confirming only approved paths changed.

The supplied current baseline is:

- 41 test files;
- 238 tests passed;
- 0 skipped;

with PostgreSQL enabled.

Counts may increase for this workstream.

Planning does not run the implementation validation matrix or production build; BUILD and VALIDATE own those checks after approval and GIT START.

## Human visual gate

Safari Technology Preview is the GrantFlow human browser/visual acceptance environment.

Automated tests do not replace this gate.

After BUILD, VALIDATE, and REVIEW, stop at `READY_FOR_USER` and wait for explicit human approval.

Do not merge or perform GIT END before approval.

The concise human checklist is:

- Open `/grants` and activate a Grant from the portfolio.
- Use `Open full grant` from the existing Sheet and confirm it opens `/grants/<grantId>`.
- Confirm the workspace desktop hierarchy: Back to Grants, Grant title/Funder/status/actions, then Overview, Notes, and Activity with Tags inside Overview.
- Confirm the page feels like a professional Grant working record, not a generic CRM detail page or dashboard of record attributes.
- Confirm populated records show every required field, including Award Timeframe, Notes, Activity, tags, human-readable Funder information, status, currency, amounts, dates, and Next steps.
- Confirm Funder website behavior is clear when populated and restrained when absent.
- Confirm sparse/partially imported records use restrained absence treatment and intentional empty Notes, Tags, and Activity states.
- Confirm long Grant and Funder names wrap safely, and long Notes/Next steps remain readable.
- Confirm narrow/mobile layout stacks cleanly without horizontal scrolling or hidden required content.
- Confirm Edit grant opens the existing form, keeps all current fields/validation behavior, saves changes, closes cleanly, and the complete workspace reflects refreshed data.
- Confirm editing does not make existing tags or historical Activity disappear.
- Confirm status behavior, including visible `Internal Review` wording, same-status stability, successful real changes, and complete Activity refresh.
- Confirm existing tag assignment/removal/create behavior remains usable and visible.
- Confirm keyboard focus is visible for Back to Grants, Open full grant, Edit grant, status controls, form controls, tag controls, external Funder website, and close/cancel actions.
- Confirm normal browser Back returns to the portfolio as expected; no custom return-state behavior is required.
- Confirm no Draft, History, Documents, Funder edit, delete, reminder, notification, or other out-of-scope controls appear.

## Concerns and decisions for developer review

- **Existing query reuse:** `getGrant` already provides the complete required DTO and all required organization/soft-delete relations. A new workspace query would duplicate authorization and serialization and is not planned.
- **Planning state:** `dispatch/ACTIVE.md` remains clear during PLAN. The workstream becomes active only after explicit approval and GIT START.
- **Next route contract:** current App Router dynamic page params are asynchronous. The route should await `params` and use the resulting `grantId`; do not introduce a compatibility workaround for older synchronous param behavior.
- **Not-found authority:** all invalid/unavailable Grant and Funder relation cases collapse to `getGrant() === null` and the route calls the same `notFound()` behavior. The route must not distinguish tenant existence.
- **Funder options:** `listFunders()` is fetched only after a valid Grant is found because the existing edit form needs active organization options. It does not create a Funder detail or edit surface.
- **Funder display:** use the existing human-readable Funder type vocabulary rather than raw database enum labels. Do not create a generalized enum-label system solely for this page.
- **Activity meaning:** Activity remains an append-only business-event timeline, displayed in the existing newest-first order. Edit/status actions may add their current Activity events; no revision-history semantics are introduced.
- **Partial action DTOs:** edit/status action responses are not complete workspace snapshots. They currently contain empty assigned tags and only the newly created Activity or no Activity. The planned close/confirm-and-refresh behavior prevents the workspace from dropping existing tags or history.
- **Server/client boundary:** static workspace record rendering stays server-compatible. Only Edit/status controls and the already-client TagManager need client state. A whole-page Client Component would add client surface without solving a product requirement.
- **Route revalidation:** exact literal workspace revalidation is a minimal cache-correctness extension to successful Grant-specific mutations. Existing `/grants` revalidation remains unchanged; no cache abstraction is introduced. `createTag` remains organization-scoped and does not gain a Grant ID input solely for this purpose.
- **Tags placement:** Tags live inside Overview through the existing `TagManager`, keeping the three requested primary areas stable without adding a fourth navigation model or hidden state.
- **Stacked layout:** stacked sections are deliberately chosen over tabs because the Work-Ready v0 outcome requires the complete current record to be understandable in one page and future Draft/History are explicitly out of scope.
- **Nullable display:** restrained absence treatment is preferred over fabricated defaults or a grid of visually loud empty cards. Exact punctuation may follow existing component conventions during BUILD without changing the contract.
- **Status control:** the workspace surfaces a small status interaction using the existing action and vocabulary. If this cannot be implemented cleanly without broadening workflow semantics, stop and return to PLAN rather than inventing a workflow system.
- **No schema:** all required data already exists in `Grant`, `Funder`, `Tag`, `GrantTag`, and `Activity`. A discovered schema requirement blocks BUILD and returns to planning.
- **Browser gate:** Safari Technology Preview is the human visual/browser environment. The developer must explicitly approve the rendered workspace before merge/GIT END.
- **Approval gate:** this plan intentionally creates no execution branch, `tasks/` files, BUILD assignment, implementation, production build, or merge activity until explicit approval.

## References

- `PRODUCT.md`
- `AGENTS.md`
- `dispatch/ACTIVE.md`
- `dispatch/COMPLETED.md`
- `dispatch/workstreams/deadline-view/PLAN.md`
- `prisma/schema.prisma`
- `src/app/(authenticated)/(org-required)/layout.tsx`
- `src/app/(authenticated)/(org-required)/grants/page.tsx`
- `src/app/(authenticated)/(org-required)/grants/actions.ts`
- `src/app/(authenticated)/(org-required)/grants/tag-actions.ts`
- `src/lib/clerk/authorization.ts`
- `src/lib/queries/grants.ts`
- `src/lib/queries/funders.ts`
- `src/lib/queries/tags.ts`
- `src/lib/queries/activities.ts`
- `src/lib/queries/serializers.ts`
- `src/lib/validations/grant.ts`
- `src/types/grant.ts`
- `src/types/funder.ts`
- `src/components/grants/grants-page.tsx`
- `src/components/grants/grant-detail-sheet.tsx`
- `src/components/grants/grant-form.tsx`
- `src/components/grants/tag-manager.tsx`
- `src/components/funders/funder-list.tsx`
- `src/components/dashboard/dashboard-content.tsx`
- `src/components/deadlines/deadline-view.tsx`
- `src/components/layout/app-shell.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/sheet.tsx`
- `src/app/globals.css`
- `src/test/domain-queries.test.ts`
- `src/test/domain-actions.test.ts`
- `src/test/grant-ui.test.tsx`
- `src/test/grants-route.test.ts`
- `src/test/postgres-domain-isolation.integration.test.ts`
- `src/test/postgres-tag.integration.test.ts`
- `src/test/postgres-dashboard.integration.test.ts`
- `screenshots/dashboard.png`
- `screenshots/deadlines.png`
- `screenshots/grants.png`
- `screenshots/grant-detail.png` (visual reference only; future tabs/content remain out of scope)
- Current Next.js App Router dynamic-segment and `revalidatePath` primary documentation
- Relevant SoloFlow skills loaded: `solo-flow`, `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`.
