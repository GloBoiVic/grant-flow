# T003 Review - Website Shorthand Normalization

Status: PASS
Role: REVIEW
Workstream: funder-maintenance
Branch: solo/funder-maintenance

## Review Scope

Independently reviewed the reconciled `PLAN.md`, completed T001/T002/T003 receipts, immutable root validation, R001 BUILD/validation/review artifacts, T003 `VALIDATION.md`, the complete branch delta from base SHA `74a12957fea62d345384770cca909dbe0156a673`, and the directly affected implementation and tests.

## Judgment

- `src/lib/validations/funder.ts:14-28` trims Website input, maps blank input to `null`, prefixes the required `https://` scheme for `example.com`, then applies URL, 2048-character, and HTTP(S)-only validation. Explicit `http://` and `https://` values remain unchanged; `javascript:` and `data:` remain invalid.
- `src/app/(authenticated)/(org-required)/grants/actions.ts:150-189` validates before authorization or the transaction and persists `parsed.data.website`, so normalized shorthand reaches create/update persistence and unsafe values produce no authorization, write, or Activity call.
- `src/components/funders/funder-form.tsx:85-120,146-148,169-185` keeps the Website control as `type="url"`, submits through `noValidate`, preserves the custom server validation path, and retains blank-to-null form normalization. The UI regression asserts raw shorthand reaches the action and the returned normalized value renders as the HTTPS link.
- Existing list/detail link boundaries at `src/components/funders/funder-list.tsx:36-38` and `src/components/funders/funder-detail-sheet.tsx:77-81` were not broadened. The shared server contract now supplies only HTTP(S) values to those links; the independent Website target and existing Funder/Grant behavior remain intact.
- The T003 validation evidence is consistent with the source and receipts: focused contract/action/UI tests, full normal and PostgreSQL suites, lint, TypeScript, Prisma verification, build, diff checks, and live Safari shorthand persistence/display all passed. The independent focused suite also passed.
- The full branch delta contains only the approved T001/T002 Funder maintenance seams, T003 validation/form/test changes, expected dispatch artifacts, and the approved bounded detail Sheet. No schema, migration, index, route family, cache abstraction, CRM/contact, relationship, revision/audit, or unrelated Grant expansion was added. Grant changes remain limited to the approved complete nested Funder DTO/select propagation.

## Findings

### Minor

- **Approved-scope DEFECT:** `src/lib/validations/funder.ts:19` treats `example.com:8080` as an explicit scheme because the scheme detector matches `example.com:`; it therefore fails the HTTP(S) protocol refinement instead of normalizing to `https://example.com:8080`. Independent `createFunderSchema.safeParse` probing reproduced this. This does not affect the required `example.com` case, explicit HTTP(S), unsafe-scheme rejection, or blank-to-null behavior, and is non-blocking under the review gate.

No unresolved Critical or Important findings were found. No new scope was identified.

## Checks / Evidence

- `npm run test:run -- src/test/domain-contracts.test.ts src/test/domain-actions.test.ts src/test/funder-ui.test.tsx`: 3 files passed, 38 tests passed.
- `npx eslint src/lib/validations/funder.ts src/components/funders/funder-form.tsx src/test/domain-contracts.test.ts src/test/domain-actions.test.ts src/test/funder-ui.test.tsx`: passed.
- `git diff --check 74a12957fea62d345384770cca909dbe0156a673`: passed.
- Independent URL probe: `example.com` and trimmed shorthand normalized to `https://example.com`; explicit HTTP(S) preserved; blank became `null`; `javascript:`, `data:`, and `ftp:` were rejected.
- Final status/diff inspection remained on `solo/funder-maintenance`; no prohibited implementation path was changed by this review.

## Limitations

- The full repository/PostgreSQL matrix, Prisma verification, production build, and browser persistence checks were not rerun during review; the immutable T003 validation receipt reports those passing gates and was independently checked against the source and diff.
- Automated Safari Technology Preview evidence is not human visual approval. Human Safari Technology Preview visual/browser approval remains a separate pending gate; merge and GIT END remain blocked until explicit approval.
- Vitest emitted the repository's known Vite `configLoader: 'native'` warning. It did not affect results.
