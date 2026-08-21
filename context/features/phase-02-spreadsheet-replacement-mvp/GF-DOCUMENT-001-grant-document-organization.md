# GF-DOCUMENT-001 — Grant Document Organization

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-DOCUMENT-001 |
| **Phase** | Phase 2 — Spreadsheet Replacement MVP |
| **Status** | Planned |
| **Product Goal** | Enable grant professionals to upload, categorize, and retrieve grant-related documents |
| **MVP Classification** | MVP Complete |
| **Roadmap Link** | [Phase 2 — Spreadsheet Replacement MVP](../../roadmap.md#7-phase-2-spreadsheet-replacement-mvp) |

---

## 1. Feature

Document management within the grant context. Users upload files associated with a grant, categorize them by type (RFP, Narrative, Budget, Award Letter, Report, Supporting Doc), and download or delete them. Files are stored in Supabase Storage; metadata is in the Document database table.

## 2. Purpose

Spreadsheets don't store documents — users scatter RFPs, narratives, budgets, and reports across shared drives and email inboxes. GF-DOCUMENT-001 keeps grant documents organized alongside the grant record, accessible from the grant detail page.

## 3. User Outcome

Grant professionals can upload grant-related documents, categorize them by type, and retrieve them from the grant detail page. All documents for a grant are in one place, replacing the shared-drive scavenger hunt.

## 4. Scope

- File upload (client selection → Server Action validation → Supabase Storage → Document record)
- Document categorization by type (RFP, Narrative, Budget, Award Letter, Report, Supporting Doc)
- Document list on grant detail page (name, type, size, upload date, uploader)
- Document download (direct link or server-proxied)
- Document soft-delete (removes file from storage, soft-deletes DB record, writes activity entry)
- File type allowlist (common document formats: PDF, DOCX, XLSX, images)
- File size limit (~20MB)
- Activity logging for upload and delete

## 5. Out of Scope

- Document preview (in-browser viewing of PDFs, images — post-MVP)
- Document version tracking or version history
- Multiple file upload (batch upload — post-MVP)
- Document search across all grants (post-MVP)
- Document sharing or external access links
- Drag-and-drop file organization within a grant
- Document templates
- Virus scanning (deferred — not in MVP)
- Document upload during CSV import
- Organization-wide document storage or file manager

## 6. User Stories

- As a **grant professional**, I want to upload an RFP to a grant so that I can find it later.
- As a **grant professional**, I want to categorize documents by type so that I can quickly find the right file.
- As a **grant professional**, I want to see all documents for a grant so that I know what files exist.
- As a **grant professional**, I want to download a document so that I can work with it.
- As a **grant professional**, I want to delete a document so that outdated files don't clutter the list.

## 7. Functional Requirements

1. **File upload** triggered by user selecting a file and (optionally) selecting a document type.
2. **Server Action** validates: file type (allowlist), file size (≤20MB), user authorization, org scope.
3. **Storage path:** `/org_{organizationId}/grant_{grantId}/{documentId}_{sanitized-filename}`.
4. **Document record** created in DB with: name, type, fileKey (Supabase key), fileSize, mimeType, uploadedById.
5. **Activity entry** created: `"document_uploaded"` with metadata including document name.
6. **Document list** on grant detail page shows: icon/type indicator, name, type label, size (human-readable), upload date, uploader name, download action, delete action.
7. **Document download** serves the file from Supabase Storage (direct URL with signed token or server proxy).
8. **Document delete** soft-deletes the Document record AND deletes the Supabase Storage object. Creates activity entry `"document_deleted"`.
9. **File type allowlist:** PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, JPEG, GIF, TXT, RTF. Extensible but must be server-enforced.

## 8. Business Rules

1. Files are scoped to exactly one grant. No cross-grant document sharing for MVP.
2. Document types are canonical: RFP, Narrative, Budget, Award Letter, Report, Supporting Doc. User selects one type per document.
3. Filenames are sanitized on upload (remove special characters, limit length).
4. If database write succeeds but storage write fails, the entire operation fails (no orphan documents).
5. If storage write succeeds but database write fails, the uploaded file is an orphan. This is an open decision — MVP may leave orphan files requiring manual cleanup.

## 9. User Experience

- Document section on grant detail page shows a compact list of uploaded documents.
- Upload button/area at top of document section: "Upload Document" opens file picker and type selector.
- Document rows show: type icon/indicator, name, size, upload date, download icon, delete icon.
- Upload progress indicator during file transfer.
- Empty state: "No documents yet. Upload an RFP, narrative, budget, or other grant-related file."
- Upload validation errors shown inline (invalid type, file too large).
- Delete requires confirmation (explaining soft-delete and activity preservation).

## 10. Data Requirements

**Document entity** (per `context/database.md` §3):
- `id` (UUID), `organizationId` (FK → Organization), `grantId` (FK → Grant), `name` (text), `type` (text: RFP/Narrative/Budget/Award Letter/Report/Supporting Doc), `fileKey` (text), `fileSize` (integer), `mimeType` (text), `uploadedById` (UUID, FK → User), `createdAt`

**Activity entries** for document upload and delete (see GF-ACTIVITY-001).

## 11. Permissions

| Role | Document Access |
|---|---|
| **ADMIN** | Upload, download, delete any document |
| **MEMBER** | Upload, download, delete own documents; download any |
| **VIEWER** | Download only |

## 12. States

| State | Behavior |
|---|---|
| **Loading** | Skeleton document rows |
| **Empty** | "No documents yet. Upload..." with upload action |
| **Normal** | Document list with rows |
| **Uploading** | Progress indicator (per-file) |
| **Upload error** | Inline error (invalid type, too large, server error) |
| **Download** | Initiates file download or opens in new tab |
| **Delete confirmation** | Dialog explaining action; confirms deletion |
| **Delete success** | Document removed from list; activity entry created |

## 13. Acceptance Criteria

- [ ] File upload works for all allowed types
- [ ] File type validation rejects disallowed types
- [ ] File size validation rejects files over limit
- [ ] Document is stored in Supabase Storage at correct path
- [ ] Document record is created in database
- [ ] Activity entry is created for upload
- [ ] Document list displays on grant detail page
- [ ] Document download works
- [ ] Document delete works (soft-deletes DB record and removes storage object)
- [ ] Activity entry is created for deletion
- [ ] File type allowlist is server-enforced

## 14. Dependencies

- GF-DATA-001 (Document table, storage configuration)
- GF-AUTH-001 (user session, org context)
- GF-SHELL-001 (application shell)
- GF-GRANT-001 (grants as parent entity)
- GF-GRANT-003 (grant detail page as document section host)
- GF-ACTIVITY-001 (activity logging for document operations)

**Unresolved decisions:**
- Storage/database compensation: what happens if storage upload succeeds but database write fails? Orphan file handling.
- Document type taxonomy: is the canonical list (RFP, Narrative, Budget, Award Letter, Report, Supporting Doc) sufficient, or should users create custom types?
- Member document deletion vs. authoritative record preservation: MEMBERs can delete documents they uploaded. The deletion creates an activity entry (`document_deleted`) preserving the record of what existed. A permanent (hard-delete) path for document removal is not part of MVP — soft-delete is sufficient. Activity entries for deleted documents are never removed, preserving the authoritative history even when the file is gone.

## 15. Completion Criteria

- All acceptance criteria pass
- Documents upload, display, and download correctly
- Document section is integrated into grant detail page
- File type and size enforcement works server-side
- Activity is logged for document operations
- Delete confirmation works and preserves activity history

---

*Spec references: `context/database.md` §10, `context/design.md` §11, `context/tech-stack.md` §6 (Supabase Storage)*
