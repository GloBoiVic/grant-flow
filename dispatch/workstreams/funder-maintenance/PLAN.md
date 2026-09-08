# SoloFlow Plan - Funder Maintenance

Status: READY_FOR_USER
Classification: Feature
Workstream: funder-maintenance
Base branch: main
Base SHA: 74a12957fea62d345384770cca909dbe0156a673
Execution branch: solo/funder-maintenance
Approval: Original PLAN and Website shorthand revision explicitly approved
Phase: READY_FOR_USER
Task state: T001 DONE; T002 DONE; T003 DONE
Validation state: Original validation findings remediated; R001 validation PASS; R001 review PASS; T003 validation PASS; T003 review PASS; one non-blocking Minor deferred
Architecture status: Not required; this is a bounded extension of the existing authenticated Funder list, shared form/schema, organization-scoped action/query, Activity, DTO, Sheet, and Grant display seams. No new service, route family, persistence model, cache abstraction, or generalized relationship-management infrastructure is expected.
Next action: Human Safari Technology Preview visual/browser approval. Do not merge or perform GIT END before explicit approval.

## Outcome

Complete the Work-Ready v0 Funder record-maintenance surface so a grant professional can select an existing Funder from `/funders`, inspect every maintained persisted Funder field, correct those fields safely, and see the corrected Funder information anywhere the existing product displays it without recreating the record or maintaining a parallel spreadsheet.

This remains a bounded Funder maintenance surface. It is not a Funder Workspace, CRM, relationship-management system, or second durable Grant Workspace.

## Inspection Findings

- `main` is at `74a12957fea62d345384770cca909dbe0156a673` (`74a1295`). Solo inspection recorded it as matching `origin/main` and clean at planning start. No execution branch was created.
- `dispatch/ACTIVE.md` remains clear during this planning gate and currently records `No active workstream.` The `funder-maintenance` workstream does not become active until explicit developer approval and GIT START.
- `PRODUCT.md` defines GrantFlow as grant portfolio and grant-work management for nonprofit grant professionals and explicitly excludes donor CRM and general nonprofit-management behavior. Funder maintenance must remain within that boundary.
- The Prisma `Funder` model already persists `name`, `type`, `website`, `notes`, `countyServed`, `createdAt`, `updatedAt`, and nullable `deletedAt`. The existing migration chain already creates `notes` and `countyServed` as nullable text columns. No schema or migration change is indicated.
- `listFunders()` derives organization scope from `requireAuthorization()`, filters `organizationId` to the authenticated local User organization and `deletedAt: null`, and returns stable name/id order. It currently selects and serializes only `id`, `name`, `type`, `website`, and timestamps.
- `FunderDto` is the shared Funder contract and currently contains only `id`, `name`, `type`, `website`, and timestamps. It is also embedded in `GrantDetailDto` and used by Grant create/edit controls, so adding the two existing persisted Funder fields requires a small coherent DTO/select/fixture propagation rather than a second maintenance DTO.
- `createFunderSchema` currently validates only `name`, `type`, and optional `website`. `name` is trimmed and bounded to 200 characters, `type` is the four-value Funder enum, and `website` is a trimmed URL up to 2048 characters.
- Existing Grant validation already establishes analogous product limits of 200 characters for `countyServed` and 10,000 characters for `notes`. Funder maintenance should reuse those established limits instead of inventing new ones.
- `createFunder()` lives in the existing authenticated Grant domain action module. It validates before authorization, obtains `organizationId` and `userId` only from `authorizeAction()`, creates the Funder and existing `funder_created` Activity atomically, and currently revalidates `/grants`.
- There is no current Funder edit action, Funder-specific detail query, Funder detail route, or Funder detail Sheet. The existing `/funders` route calls `listFunders()` and passes server-produced items to a client `FunderPage`.
- `FunderPage` currently owns only the Add funder open state. `FunderList` renders a simple Name/Type/Website table. Funder names are not interactive.
- The current Add funder form is an inline client form, preserves server validation errors, calls `router.refresh()` after successful creation, and uses existing Button/focus conventions.
- The current Sheet primitive is the existing Radix-backed GrantFlow Sheet with full-width mobile behavior, bounded desktop slideover presentation, labeled close behavior, and reduced-motion support. It is suitable for a bounded Funder detail/edit interaction.
- Portfolio Import recognizes source `Notes` and `County Served`, but they belong to `ImportGrantData` and ultimately `Grant.notes` / `Grant.countyServed`. `ImportFunderDraft` contains only Funder name, normalized name, and type. Confirmation creates imported Funders without Funder notes/county values. No importer change is needed.
- The fact that import currently leaves Funder `notes` and `countyServed` null does not make those persisted Funder fields obsolete. They are ordinary Funder record fields and should be maintainable after import.
- Grant Workspace currently renders the related active same-organization Funder's name, human-readable type, and website. It does not display Funder notes or Funder county, and this workstream must not turn it into a second Funder detail surface.
- `getGrant()` already rejects missing, cross-organization, soft-deleted, or mismatched-organization Grant/Funder records and scopes active tags and Activity. Funder maintenance should use the analogous direct Funder mutation predicate: requested Funder ID, authorized local organization, and `deletedAt: null`.
- Activity is an append-only business-event model. Funder creation already writes `funder_created`; Grant edits write `grant_updated`. The smallest consistent update behavior is one transactional `funder_updated` Activity with the authorized local actor and organization. No Funder Activity timeline, revision system, or audit infrastructure is required.
- Existing Grant edit/status mutations revalidate `/grants` and the exact affected Grant Workspace path. A Funder can relate to multiple Grants, so a successful Funder edit cannot identify one workspace path without an additional relation query. Current Next.js supports invalidating a dynamic page pattern with `revalidatePath("/grants/[grantId]", "page")`; this is an appropriate bounded way to make all Grant Workspace Funder summaries fresh without introducing relation traversal or a cache abstraction.
- Current Next.js documentation requires the `type` argument when `revalidatePath` receives a dynamic segment pattern and explicitly permits a pattern such as `/product/[slug]` with `"page"`.
- Existing authorization is local-user based: Clerk identifies the authenticated person, local authorization resolves the User, and `organizationId` / `userId` come from that local row. No client-provided organization scope is authoritative.
- The current post-Grant-Workspace baseline is 251 tests passed and 0 skipped with PostgreSQL integration enabled.
- Planning does not rerun the test suite, lint, TypeScript, Prisma checks, or production build.
- Relevant specialist guidance loaded for this plan: `solo-flow`, `frontend-design`, `web-design-guidelines`, and `vercel-react-best-practices`. Existing GrantFlow tokens and `screenshots/funders.png` remain the local visual authorities.

## Scope

### In Scope

- Keep the existing authenticated `/funders` route and list as the primary Funder surface.
- Make each active Funder selectable through a semantic button in its Name cell. Do not make the whole table row clickable because the row can also contain an independent Website link.
- Add one bounded Funder detail Sheet opened from `/funders`. Do not add `/funders/[id]`.
- Show all five maintained persisted Funder fields in the detail surface:
  - Name
  - Type
  - Website
  - County served
  - Notes
- Reuse one Funder field/form contract for Add funder and Edit funder. The existing inline Add presentation may remain while edit is hosted in the detail Sheet, but field rendering rules, normalization, labels, limits, and server error behavior must not diverge.
- Add `editFunder` or an equivalently clear Funder update action in the existing domain action module with strict input validation, authenticated local organization scope, active same-organization Funder lookup, atomic update, and existing-style `funder_updated` Activity.
- Persist and return all five maintained Funder fields for both create and edit. Existing create behavior and `funder_created` Activity remain intact.
- Extend `FunderDto`, `listFunders()`, the related Funder select/serialization used by `getGrant()`, and existing Grant action nested Funder select/serialization only as required to keep the shared contract complete and serializable.
- Preserve the current Grant Workspace Funder summary of name, human-readable type, and website. Do not display Funder notes or Funder county there.
- Ensure successful Funder updates invalidate the Funder list, Grant list/Sheet data, and dynamic Grant Workspace page pattern so future renders use current Funder data.
- Revalidate `/funders` after successful Funder create/edit.
- Preserve `/grants` revalidation for Funder creation and add it to Funder edit because current Funder name/type information is consumed by Grant surfaces.
- Revalidate the dynamic `/grants/[grantId]` page pattern after successful Funder edits.
- On successful edit, replace the open detail state with the complete returned Funder DTO, exit edit mode, show clear success feedback, and call `router.refresh()` so the server-owned `/funders` list is refreshed.
- The visible table continues to show its bounded Name/Type/Website columns. County served and Notes are maintained and visible in the detail Sheet rather than becoming new list columns.
- Use honest empty treatment for null/empty Website, County served, and Notes.
- Preserve useful Notes line breaks and wrap long names, URLs, county values, and notes safely.
- Preserve existing human-readable type labels:
  - `FOUNDATION` → `Foundation`
  - `FAMILY_FUND` → `Family Fund`
  - `CORPORATION` → `Corporation`
  - `OTHER` → `Other`
- Preserve the current visual language: soft-gray canvas, white bordered surfaces, restrained shadows, compact GrantFlow type scale, indigo primary actions, semantic links/buttons, visible focus, and mobile-safe Sheet behavior.
- Add focused unit/component, action/query, and PostgreSQL integration coverage for authorization, validation, all maintained fields, update behavior, list refresh, related Grant display freshness, Activity semantics, accessibility, sparse data, narrow layout, and absence of CRM/contact controls.
- Stop after BUILD → VALIDATE → REVIEW at `READY_FOR_USER` for explicit Safari Technology Preview human visual/browser approval.
- Do not merge or perform GIT END before approval.

### Explicitly Out of Scope

- Funder contacts, contact CRUD, contact import, or contact display.
- CRM pipelines, relationship stages, interaction logging, donor/fundraising features, owner assignment, reminders, notifications, or follow-up workflows.
- Funder documents, uploads, exports, custom fields, merge/deduplication, soft-delete/restore UI, or deletion behavior.
- A `/funders/[id]` route, URL-backed Funder detail state, or a durable Funder Workspace.
- Funder grant lists, grant counts, total awarded metrics, relationship analytics, reporting, or dashboard changes.
- New Funder fields, schema changes, migrations, indexes, persistence models, audit infrastructure, revision history, or a generalized Activity framework.
- Changes to Grant fields, Grant status semantics, Grant form behavior, Grant Workspace hierarchy, tags, or Grant mutations except the minimum nested Funder DTO/select and cache/display correctness changes required here.
- Displaying Funder Notes or County served inside Grant Workspace.
- Portfolio Import mapping changes. Its `Notes` and `County Served` headers remain Grant fields; imported Funder notes/county are not invented.
- A second Funder query, REST endpoint, client data store, cache library, or generalized detail/edit abstraction.
- A Funder Activity timeline. The existing business-event write for successful edits is in scope; displaying relationship history is not.
- Additional list columns for County served or Notes.
- Any client-provided organization ID, organization scope, role, ownership, or authorization decision.

## Frozen Funder Contract

### Maintained Fields

The detail view and shared Add/Edit field contract use the following rules.

Blank form values normalize to `null` for nullable persisted fields so an existing value can be cleared safely.

| Field          | Validation and persistence                                                        | Display                                                                                      |
| -------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `name`         | Required trimmed text, 1–200 characters; persisted as validated trimmed text      | Clear Name value; long names wrap safely                                                     |
| `type`         | Required existing `FunderType` enum                                               | Existing human-readable label, never the raw enum token                                      |
| `website`      | Optional nullable trimmed URL, maximum 2048 characters; blank clears to `null`; scheme-less values such as `example.com` normalize to `https://example.com`, and only `http:`/`https:` remain valid | External link when present, restrained em dash when absent |
| `countyServed` | Optional nullable trimmed text, maximum 200 characters; blank clears to `null`    | Labeled County served value or restrained em dash                                            |
| `notes`        | Optional nullable trimmed text, maximum 10,000 characters; blank clears to `null` | Labeled Notes value with `whitespace-pre-wrap` and safe wrapping, or a concise empty message |

The County served and Notes bounds deliberately reuse the existing Grant text limits for analogous fields.

`createdAt` and `updatedAt` remain DTO metadata and are not editable form fields.

`id`, `organizationId`, and `deletedAt` are never client-editable.

### DTO and Query Contract

- Extend `FunderDto` to include:
  - `notes: string | null`
  - `countyServed: string | null`
- Retain:
  - `id`
  - `name`
  - `type`
  - `website`
  - `createdAt`
  - `updatedAt`
- Extend the existing `funderSelect`, `FunderRecord`, and `toFunderDto()` in `src/lib/queries/funders.ts` to select and serialize the two existing nullable fields.
- Keep `listFunders()` as the only read needed by `/funders`.
- The `/funders` page receives active same-organization Funders from the server and passes a selected server-produced DTO into the detail Sheet.
- Do not create `getFunder()` or a second detail query for this bounded surface.
- The selected client-side list DTO is display/edit-initialization state only. The edit action must always re-read the Funder under server authorization before persistence.
- Extend the nested Funder select and DTO serializer used by `getGrant()` and existing Grant actions so the shared `FunderDto` remains structurally complete and serializable.
- Grant list items may continue using their existing summary `Pick<FunderDto, "id" | "name" | "type">`.
- Grant Workspace continues rendering only the existing Funder summary fields it needs.
- Preserve timestamps as ISO strings and nullable text as `string | null`.
- No Prisma objects, Date instances, or Decimal instances cross a server/client boundary.
- Every read remains organization-scoped by the authenticated local User.
- `listFunders()` continues returning only:
  - authorized `organizationId`
  - `deletedAt: null`
- Client-selected Funder data is never authority for scope or persistence.

### Validation Contract

- Keep the existing Name, Type, and Website validation behavior and error vocabulary where possible; accept scheme-less Website values by normalizing them to `https://` before the existing safe-scheme and length checks.
- Introduce one shared Funder field schema for:
  - name
  - type
  - website
  - countyServed
  - notes
- Create and edit wrappers may differ only by the edit-only `funderId`; they must not define divergent field limits or normalization.
- Reuse the existing analogous text bounds:
  - County served: 200
  - Notes: 10,000
- The edit schema is strict and rejects:
  - organization IDs
  - deleted flags
  - timestamps
  - actor fields
  - Activity input
  - arbitrary metadata
  - unknown keys
- The edit contract contains all five maintained field values so nullable fields can intentionally be cleared.
- Invalid input returns the existing `ActionResult` style with a general Funder validation error and associated field errors.
- Validation occurs before authorization and persistence, preserving the current `createFunder()` action convention.
- Invalid URLs, unsafe URL schemes after normalization, unsupported types, missing/oversized names, oversized County served, and oversized Notes must not write a Funder or Activity.
- Blank Website, County served, and Notes values are accepted and normalized to `null`.

### Authorization and Mutation Contract

- The edit action accepts only:
  - Funder ID
  - the five maintained field values
- It does not accept or derive scope from client organization input.
- Call `authorizeAction()` after input validation.
- Use the returned `organizationId` and `userId` for every lookup, write, and Activity record.
- Within one Prisma transaction, find the Funder by:
  - requested `id`
  - authorized `organizationId`
  - `deletedAt: null`
- Return the same generic `Funder not found.` failure for nonexistent, cross-organization, and soft-deleted records.
- Update only:
  - name
  - type
  - website
  - countyServed
  - notes
- Never update:
  - `organizationId`
  - `id`
  - `deletedAt`
  - timestamps directly
  - contact/relationship data
- Create the Activity row in the same transaction with:
  - `organizationId` from authorization
  - `funderId` from the authorized record
  - action `funder_updated`
  - description `Updated funder <final name>.`
  - `actorId` from the authenticated local User
- No Activity is written for validation, authorization, nonexistent-record, cross-tenant, or soft-deleted failure.
- Return a complete serializable `FunderDto` from successful create/edit actions.
- Do not return a partial object that causes the detail Sheet to lose Notes, County served, or another maintained value.
- Successful Funder creation:
  - preserves existing `funder_created` Activity behavior;
  - revalidates `/grants`;
  - additionally revalidates `/funders`.
- Successful Funder edit:
  - revalidates `/funders`;
  - revalidates `/grants`;
  - calls `revalidatePath("/grants/[grantId]", "page")`.
- The dynamic page-pattern invalidation is intentionally broad across Grant Workspace pages because a Funder may be related to more than one Grant and the edit action should not add a separate related-Grant query merely for cache invalidation.
- Same-value edits follow the existing Grant edit convention and remain successful business updates with one `funder_updated` Activity. No field-diff or revision infrastructure is introduced.

### Funder Detail and Edit UX

- The existing Funder table remains the primary list.
- Only the Funder Name cell becomes the bounded detail trigger.
- Render the Funder name as a semantic button with a clear accessible name and visible focus state.
- Do not make the entire `<tr>` clickable because Website remains an independent link/action target.
- Selecting the Name button opens a right-side Sheet on desktop and the existing full-width Sheet treatment on narrow screens.
- The Sheet has:
  - meaningful title
  - concise description
  - labeled close control
  - bounded scrollable content
  - no new route
  - no URL-backed state
- Detail mode shows:
  - Name
  - human-readable Type
  - Website
  - County served
  - Notes
- Use a readable definition/list structure rather than CRM cards or metrics.
- Notes preserve line breaks.
- Missing values use restrained absence treatment and do not produce oversized empty surfaces.
- Detail mode exposes only:
  - `Edit funder`
  - ordinary close behavior
- It must not expose:
  - contacts
  - CRM controls
  - grant relationship panels
  - Activity timeline
  - delete/restore
  - reminders
  - owner assignment
- Edit mode reuses the shared Funder field contract and edit action.
- It includes labeled controls for all five maintained fields, an accessible `Save changes` button, Cancel/close behavior, inline field errors, a form-level alert, and success behavior consistent with current GrantFlow forms.
- Preserve entered values after server validation failure.
- Name uses organization autocomplete semantics.
- Website uses `type="url"` and URL input behavior.
- County served is a labeled text input.
- Notes is a labeled textarea with an intentional size and line-break treatment.
- All controls have meaningful `name` values and visible focus states.
- Add funder continues to work from the existing `/funders` page and uses the same five-field contract.
- Its existing inline presentation may remain.
- The implementation may extract the smallest reusable Funder field/form internals needed to prevent Add/Edit divergence, but must not introduce a generalized form framework or generic entity editor.
- After an edit succeeds:
  - replace the selected/open Funder detail with the complete returned DTO;
  - exit edit mode;
  - show success feedback;
  - call `router.refresh()` to refresh the server-owned list.
- Name, Type, and Website changes must become immediately visible in the current table after refresh.
- County served and Notes remain detail-only fields; after refresh/reselection, the detail Sheet must contain their updated values.
- The table remains the current bounded Name/Type/Website table.
- Do not add County served or Notes columns.
- On narrow screens, preserve the existing table's horizontal-overflow behavior where needed.
- The Sheet/detail/edit surface itself must not cause page-wide horizontal scrolling.

### Related Grant Display Freshness

- Grant Workspace continues to display only the existing Funder summary:
  - current name
  - human-readable type
  - website when present
- It does not become a Funder detail surface.
- `getGrant()` and existing Grant action DTOs receive the newly complete nested Funder DTO through the same organization/active relation contract.
- Funder edits do not mutate any Grant.
- Updated Funder name/type/website becomes visible through ordinary future Grant reads.
- Successful Funder edit invalidates:
  - `/grants`
  - `/grants/[grantId]` using the dynamic `"page"` pattern
- This is bounded route-level cache correctness, not a generalized cache layer.
- Focused tests prove updated nested Funder values are available to the existing Grant Workspace summary and unrelated Grant:
  - fields
  - tags
  - Activity
    remain unchanged.

## Proposed Task Breakdown After Approval

Tasks are intentionally small and sequential.

They must not be created until explicit developer approval and GIT START.

### T001 - Funder Contract, Query, Mutation, and Isolation

- Extend the shared Funder validation contract, DTO, query select/serialization, and existing create action to cover all five maintained fields.
- Reuse existing Grant field limits for County served and Notes.
- Add the organization-scoped edit action in the existing domain action module with:
  - strict input
  - active same-organization lookup
  - generic not-found behavior
  - atomic Funder update
  - `funder_updated` Activity
  - complete DTO return
  - required route revalidation
- Propagate the complete nested Funder DTO through `getGrant()` and existing Grant action selects/serializers without changing Grant behavior or adding a second Grant/Funder query.
- Add/update focused domain contract/query/action tests for:
  - all field validation
  - nullable clearing
  - strict server-owned/unknown field rejection
  - authorized update
  - generic cross-org/deleted denial
  - no-write failure paths
  - complete DTO serialization
  - Activity semantics
  - exact `/funders`, `/grants`, and dynamic Grant Workspace revalidation
- Extend the existing disposable PostgreSQL domain-isolation fixture with populated Funder Notes/County values and assert:
  - active local reads
  - cross-organization exclusion
  - soft-deleted exclusion
  - complete field updates
  - nullable clearing
  - authorization-derived organization/actor
  - atomic `funder_updated` Activity
  - no mutation/activity on denied or invalid updates
- Preserve and cover Portfolio Import behavior proving source `Notes` and `County Served` remain Grant fields and do not become Funder import fields.

### T002 - Funder List, Detail Sheet, Shared Form, and Dependent UI Coverage

- Make Funder Names selectable through semantic accessible buttons.
- Add the bounded Funder detail Sheet.
- Refactor the existing Funder form only as much as needed to share:
  - all five controls
  - initialization
  - normalization
  - validation display
  - submission state
  - success/error behavior
    between Add and Edit while preserving the existing Add funder interaction.
- Add detail/edit state transitions, safe empty/null rendering, Website link behavior, Notes line-break preservation, long-text wrapping, responsive/narrow structure, visible focus, and no-contacts/no-CRM assertions.
- Ensure successful edits update the open detail from the returned complete DTO and refresh the current server-owned Funder list.
- Verify Name/Type/Website changes appear in the table after refresh.
- Verify County served/Notes changes remain available in the refreshed/reselected detail data without adding table columns.
- Verify current Grant Workspace Funder summary freshness after a Funder change while preserving existing Grant/Workspace interactions.
- Extend/update Funder and Grant UI tests with:
  - complete Funder fixture
  - sparse Funder fixture
  - all approved field labels/values
  - human-readable Type
  - clearable nullable fields
  - validation preservation
  - successful update
  - list refresh
  - Grant Workspace display
  - accessible Sheet/form controls
  - long text
  - narrow-safe structure
  - out-of-scope control absence
- Use `frontend-design`, `web-design-guidelines`, and `vercel-react-best-practices` guidance during implementation and browser review.
- Do not add a new visual language or generalized UI abstraction.

### T003 - Website Shorthand Normalization

- Accept scheme-less Website values such as `example.com` through the shared Funder field contract and normalize them to `https://example.com` before safe-scheme and length validation/persistence.
- Preserve explicit `http://` and `https://` values, blank-to-null normalization, unsafe-scheme rejection, and existing URL limits/error behavior.
- Keep the existing `type="url"` field and custom validation path usable for shorthand input; update the field hint only as needed to make the accepted format clear.
- Add focused contract/action/UI regression coverage for shorthand normalization, explicit schemes, invalid schemes, no-write behavior, and displayed/persisted normalized values.
- Do not add a new URL abstraction, route, field, persistence change, or unrelated behavior.

No product decision is deferred to BUILD.

A discovered need for a new field, migration, Funder detail query/route, broad Grant Workspace change, new authorization seam, cache abstraction, relationship model, or Activity/revision infrastructure must stop BUILD and return to PLAN rather than expanding silently.

## Acceptance

1. An authenticated grant professional can see active same-organization Funders on `/funders` through the existing list surface.
2. Each listed Funder can be selected through a semantic keyboard-accessible button in the Name cell without making the whole row a non-semantic click target.
3. Selecting a Funder opens a bounded detail Sheet; no `/funders/[id]` route is added.
4. The detail Sheet clearly shows Name, human-readable Type, Website, County served, and Notes.
5. `FOUNDATION`, `FAMILY_FUND`, `CORPORATION`, and `OTHER` display as `Foundation`, `Family Fund`, `Corporation`, and `Other` respectively; raw enum tokens are not exposed in the user-facing detail surface.
6. Existing populated Website values render as safe external links; scheme-less input such as `example.com` is persisted/displayed as `https://example.com`; absent Website values use restrained empty treatment.
7. Populated Notes preserve useful line breaks and long values wrap safely; absent Notes and County served use honest concise empty treatment.
8. The shared Funder field/form contract supports creating and editing all five maintained persisted fields without divergent field rules.
9. Website, Notes, and County served can be cleared to nullable values through the edit form.
10. Name, Type, Website, Notes, and County served validation errors are clear, field-associated, and preserve entered values after failure.
11. Funder County served uses the established 200-character analogous Grant limit and Funder Notes uses the established 10,000-character analogous Grant limit.
12. Invalid input, unknown keys, client organization scope, timestamps, deleted flags, or Activity fields are rejected before persistence.
13. Every Funder read derives organization scope from the authenticated local User and excludes `deletedAt IS NOT NULL` records.
14. Every Funder write derives organization and actor scope from the authenticated local User and never trusts client-provided organization scope.
15. A nonexistent, cross-organization, or soft-deleted Funder cannot be edited and produces the same generic not-found result without tenant-existence leakage.
16. A successful authorized edit persists all approved field values and returns a complete serializable Funder DTO.
17. A successful edit appends exactly one existing-style organization-scoped `funder_updated` business event with the local actor in the same transaction; failed edits append no Activity.
18. Successful Funder create/edit revalidates `/funders`.
19. Funder creation retains `/grants` revalidation.
20. Funder edit revalidates `/grants` and the `/grants/[grantId]` dynamic page pattern using the required `"page"` type.
21. The current `/funders` table refreshes after a successful create/edit and immediately reflects current Name, Type, and Website values.
22. Updated County served and Notes values are available in the current/refreshed Funder detail data without adding new table columns.
23. Related Grant list/Sheet and Grant Workspace Funder summaries use current Funder name/type/website after Funder maintenance without changing unrelated Grant fields, tags, or Activity.
24. `FunderDto`, `getGrant()`, and existing Grant action DTOs remain serializable and maintain their existing Grant status, date, amount, tag, and Activity contracts.
25. Grant Workspace remains a Grant surface. No Funder Notes, Funder County served, contacts, CRM controls, grant relationship panels, Funder Activity timeline, delete/restore, reminders, owner assignment, or other out-of-scope controls appear there.
26. Existing Portfolio Import continues mapping source `Notes` and `County Served` to Grants only; no Funder import fields are silently invented or repurposed.
27. Existing Add funder behavior continues to work with current success/error semantics and the shared five-field contract.
28. Detail and edit controls have hierarchical headings, labeled form controls, semantic buttons/links, visible focus states, polite success feedback, alert errors, and accessible Sheet close behavior.
29. The Website link remains an independent semantic target and is not nested inside or conflicted with the Funder Name detail trigger.
30. Long Funder names, URLs, County served values, and Notes do not force page-wide horizontal scrolling.
31. The list, detail Sheet, and edit form work on desktop and narrow/mobile widths using existing GrantFlow layout tokens and reduced-motion behavior.
32. The Funder list remains bounded to its current Name, Type, and Website columns rather than becoming a CRM-style record grid.
33. No schema, migration, index, new Funder field, route family, cache abstraction, contact/CRM infrastructure, revision/audit infrastructure, or unrelated Grant behavior is added.
34. Focused tests prove authorized load/edit, cross-organization denial, soft-deleted denial, validation, all five maintained fields, successful update, list/detail refresh, related Grant Workspace display freshness, Activity behavior, sparse/null data, accessible interaction, narrow layout, and out-of-scope control absence.
35. PostgreSQL integration tests run with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` exported into the test process without printing or persisting its value.
36. Normal Node 26 repository validation passes, including tests, lint, TypeScript, Prisma verification, production build, and diff checks.
37. Safari Technology Preview human visual/browser approval is explicit before merge or GIT END.

## Validation Expectations

### Focused Domain and UI Tests

Add only the smallest extensions/new focused test coverage needed.

Expected seams include:

- `src/test/domain-contracts.test.ts`
  - shared create/edit Funder field rules
  - trimming
  - URL validation
  - Type validation
  - established County served/Notes max lengths
  - blank-to-null behavior
  - strict server-owned/unknown field rejection

- `src/test/domain-queries.test.ts`
  - active organization-scoped Funder list
  - stable ordering
  - selected `notes` and `countyServed`
  - DTO serialization
  - live-list behavior

- `src/test/domain-actions.test.ts`
  - validation-before-authorization
  - successful all-field edit
  - generic cross-org/deleted failure behavior
  - no-write failure paths
  - `funder_updated` Activity data
  - complete return DTO
  - existing create regression
  - exact `/funders`
  - exact `/grants`
  - dynamic Grant Workspace page-pattern revalidation

- `src/test/postgres-domain-isolation.integration.test.ts`
  - local active Funder load
  - other-organization exclusion
  - soft-delete exclusion
  - all-field update
  - clearable nullable fields
  - actor/organization Activity scope
  - unchanged denied records

- `src/test/funder-ui.test.tsx`
  - Name-button selection
  - Website remains independent link
  - detail Sheet
  - human-readable Type
  - Website link/empty state
  - County served
  - Notes line breaks
  - sparse record treatment
  - shared Add/Edit fields
  - server-validation value preservation
  - successful edit/detail update
  - list refresh
  - accessible controls
  - long text
  - bounded existing table columns
  - no contacts/CRM controls

- `src/test/grant-ui.test.tsx`
  - current Grant Workspace Funder summary remains human-readable
  - receives updated nested Funder name/type/website values
  - does not add Funder Notes/County
  - existing Grant edit/status/tag/Sheet behavior remains intact

- `src/test/portfolio-xlsx.test.ts` and/or `src/test/postgres-portfolio-import.integration.test.ts`
  - source Notes/County Served remain attached to Grant data
  - imported Funders remain unaffected by this maintenance contract

Use semantic queries for headings, buttons, links, labels, form controls, alerts, status messages, and Sheet content.

Tests must not substitute client-side state or mocked organization scope for the server action/query authorization contract.

### PostgreSQL Integration

Use the existing disposable PostgreSQL integration pattern and current migration chain.

Before running the test process, export the ignored local `GRANTFLOW_TEST_DATABASE_ADMIN_URL`.

Never:

- print the value;
- use shell tracing that exposes it;
- write it to tracked files;
- include it in receipts.

The PostgreSQL coverage must run rather than silently count as skipped when the variable is available.

Seed at least:

- two organizations;
- an active local Funder with populated Notes/County;
- an other-organization Funder;
- a soft-deleted local Funder;
- a related local Grant where needed to prove nested Funder display freshness.

Assert:

- local active Funder list contains all five maintained field values and excludes other-organization/deleted records;
- authorized local edit changes Name, Type, Website, Notes, and County served atomically;
- blank Website/Notes/County served clears to `NULL` where requested;
- cross-organization and soft-deleted IDs return the same safe failure and leave data/Activity unchanged;
- update Activity has:
  - authorized organization
  - Funder ID
  - local actor
  - `funder_updated`
  - final-name description;
- no Activity is written for validation or authorization failure;
- related Grants remain unchanged while the existing Grant query returns current active Funder summary data;
- returned DTOs contain no Prisma, Date, or Decimal instances after serialization;
- existing create, Portfolio Import, Grant, and Activity isolation behavior remains intact.

### Repository Gates

After implementation, run and report exactly what ran under Node 26:

- focused Funder domain/query/action/UI and dependent Grant/import tests;
- full normal suite: `npm run test:run`;
- PostgreSQL integration suites with `GRANTFLOW_TEST_DATABASE_ADMIN_URL` exported into the process and its value never printed;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run verify:prisma`;
- `npm run build`;
- `git diff --check`;
- final `git status` and diff inspection confirming only approved paths changed.

Current pre-workstream baseline:

- 251 tests passed
- 0 skipped

Counts may increase.

Planning does not run the implementation validation matrix or production build.

BUILD and VALIDATE own those checks after approval and GIT START.

## Human Browser Gate

Safari Technology Preview is the human visual/browser acceptance environment.

Automated tests do not replace this gate.

After BUILD, VALIDATE, and REVIEW, stop at `READY_FOR_USER` and wait for explicit approval.

Do not merge or perform GIT END before that approval.

The concise human checklist is:

- Open `/funders` and confirm the existing GrantFlow list remains calm, dense, and recognizable.
- Activate a Funder by keyboard and pointer from its Name control.
- Confirm the Website link remains independently usable and is not swallowed by row/detail interaction.
- Confirm the Sheet has a meaningful title, description, close control, and visible focus.
- Confirm detail view shows Name, Type, Website, County served, and Notes with human-readable labels and honest empty states.
- Confirm the list itself remains Name/Type/Website only.
- Confirm Website opens as an external link only when populated and long URLs do not break the Sheet/page layout.
- Open Edit funder and confirm all five maintained fields are labeled, editable, clearable where nullable, and usable on desktop and narrow/mobile widths.
- Submit invalid inputs as applicable and confirm inline errors, form alert, and preserved values.
- Save a changed Funder and confirm:
  - edit mode closes;
  - current detail values are retained;
  - success feedback appears;
  - the `/funders` list refreshes;
  - Name/Type/Website updates are visible in the table;
  - County served/Notes remain correct in detail;
  - no fields disappear.
- Open a related Grant list/Sheet or Grant Workspace after changing Funder name/type/website and confirm the current Funder summary is fresh without Grant data changing.
- Confirm Grant Workspace does not start showing Funder Notes/County or other Funder-maintenance UI.
- Confirm there are no Funder contacts, CRM stages, interaction logs, grant relationship panels, delete/restore, reminders, notifications, owner controls, or Funder Activity timeline controls.
- Confirm long names, Notes, and County served values wrap safely.
- Confirm narrow screens do not acquire page-wide horizontal scrolling from the detail/edit surface.
- Confirm keyboard focus is visible for Funder selection, Edit funder, Save changes, Cancel, close, Website link, and every form control.
- Confirm browser Back behavior remains ordinary and no new Funder URL state or route was introduced.

## Concerns and Decisions for Developer Review

- **Planning state:** `dispatch/ACTIVE.md` remains clear during PLAN. The workstream becomes active only after explicit approval and GIT START.
- **All persisted ordinary-maintenance fields:** `notes` and `countyServed` are already real nullable Funder columns, but current code does not select, serialize, create, or edit them for Funders. This workstream surfaces both rather than leaving persisted record fields unmaintainable.
- **Validation limits:** County served `200` and Notes `10,000` are not new arbitrary product limits; they deliberately reuse the existing Grant limits for analogous fields.
- **Import boundary:** source `Notes` and `County Served` currently belong to imported Grants. This plan does not reinterpret those columns as Funder fields or alter Portfolio Import. Imported Funders can remain null for those fields and be maintained afterward from `/funders`.
- **Shared DTO propagation:** extending existing `FunderDto` is smaller and more coherent than adding a Funder-detail contract solely for two existing persisted fields. Nested Grant selects/action serializers and affected fixtures must be updated only enough to keep the shared DTO complete.
- **No separate Funder read:** the server-authorized `listFunders()` data already contains the records needed by the `/funders` surface. A selected list DTO is sufficient for bounded display/edit initialization; the update action independently re-reads and authorizes the ID before writing.
- **Name-button selection:** only the Name cell becomes the detail trigger. The entire row must not become clickable because Website is already an independent interactive target.
- **Sheet rather than route:** the existing Sheet convention is materially better for short record maintenance and avoids creating a durable Funder Workspace, URL contract, and duplicate navigation model.
- **Activity semantics:** `funder_updated` is an existing-model business event consistent with `funder_created` and `grant_updated`. The UI does not add a Funder Activity timeline and no revision/audit infrastructure is invented.
- **Freshness:** `router.refresh()` refreshes the current `/funders` render; `/funders` and `/grants` revalidation covers current list/Grant surfaces; and `revalidatePath("/grants/[grantId]", "page")` invalidates matching Grant Workspace pages. Current Next.js requires the `"page"` type for dynamic segment patterns.
- **Broad dynamic revalidation:** invalidating all matching Grant Workspace pages is accepted here because a Funder can relate to multiple Grants and querying every related Grant ID solely to issue literal `revalidatePath` calls would add unnecessary complexity. Do not turn this into a generalized cache layer.
- **Grant Workspace scope:** Workspace retains its current Funder summary of name/type/website. New Funder Notes/County values are viewable from `/funders` only and do not expand Grant Workspace.
- **List scope:** County served and Notes are detail fields, not new table columns. The existing list remains deliberately compact.
- **Nullable normalization:** blank Website, Notes, and County served normalize to `null`, enabling correction/clearing and honest sparse display.
- **Approved Website shorthand revision:** scheme-less values such as `example.com` are accepted and normalized to `https://example.com` before safe-scheme and length validation, preserving explicit `http://`/`https://` values and blank-to-null normalization. T003 implements and validates this bounded follow-up.
- **Deferred Minor edge:** T003 review noted that a port-bearing scheme-less value such as `example.com:8080` is rejected rather than normalized. This is non-blocking and outside the requested `example.com` case; no remediation was opened.
- **Same-value edit:** like the existing Grant edit action, a valid same-value Funder edit may still be treated as a successful business update and append `funder_updated`; no diff engine is introduced.
- **No schema:** Prisma already contains all required fields and indexes. A discovered persistence defect or migration need blocks BUILD and returns to PLAN.
- **Approval gate:** this plan creates no execution branch, task assignment, implementation, production build, or merge activity until explicit developer approval.

## References

- `PRODUCT.md`
- `AGENTS.md`
- `dispatch/ACTIVE.md`
- `dispatch/COMPLETED.md`
- `prisma/schema.prisma`
- `prisma/migrations/20260904000000_local_tenancy_baseline/migration.sql`
- `src/app/(authenticated)/(org-required)/funders/page.tsx`
- `src/app/(authenticated)/(org-required)/grants/actions.ts`
- `src/app/(authenticated)/(org-required)/grants/page.tsx`
- `src/app/(authenticated)/(org-required)/grants/[grantId]/page.tsx`
- `src/app/(authenticated)/(org-required)/import/actions.ts`
- `src/components/funders/funder-page.tsx`
- `src/components/funders/funder-list.tsx`
- `src/components/funders/funder-form.tsx`
- `src/components/grants/grant-workspace.tsx`
- `src/components/grants/grant-detail-sheet.tsx`
- `src/components/ui/sheet.tsx`
- `src/lib/clerk/authorization.ts`
- `src/lib/import/portfolio-xlsx.ts`
- `src/lib/queries/funders.ts`
- `src/lib/queries/grants.ts`
- `src/lib/queries/activities.ts`
- `src/lib/queries/serializers.ts`
- `src/lib/validations/funder.ts`
- `src/lib/validations/grant.ts`
- `src/types/funder.ts`
- `src/types/grant.ts`
- `src/app/globals.css`
- `screenshots/funders.png`
- `src/test/funder-ui.test.tsx`
- `src/test/domain-contracts.test.ts`
- `src/test/domain-queries.test.ts`
- `src/test/domain-actions.test.ts`
- `src/test/postgres-domain-isolation.integration.test.ts`
- `src/test/postgres-portfolio-import.integration.test.ts`
- `src/test/portfolio-xlsx.test.ts`
- `src/test/grant-ui.test.tsx`
- `src/test/grant-workspace-route.test.ts`
- Current Next.js App Router `revalidatePath` documentation for literal and dynamic Page paths
- Relevant SoloFlow skills loaded: `solo-flow`, `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`.
