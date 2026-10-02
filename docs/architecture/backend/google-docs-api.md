# Backend — Google Docs API v1 & Note Synchronization

> **Primary Source File**: `src/services/googleWorkspaceService.ts` (`syncNoteToDocs`)

---

## 1. Architectural Purpose

The Google Docs integration transforms local study notes into collaborative, permanent Google Docs stored in the student's Google Drive. This enables printing, offline mobile editing in Google Docs, and sharing study guides with study groups without leaving CertStudy.

---

## 2. API Communication Protocol

All operations use authenticated HTTP requests with the OAuth 2.0 Bearer token (`Authorization: Bearer {token}`):

- **Target Endpoint**: `https://docs.googleapis.com/v1/documents`
- **Scope**: `https://www.googleapis.com/auth/documents`

---

## 3. Note Synchronization Flow

```text
[ User clicks "Sync to Docs" in NoteEditor ]
                     │
                     ▼
         [ Check note.googleDocId ]
        /                          \
  (Exists)                    (Does Not Exist)
      │                               │
      ▼                               ▼
[ Verify & Clear Existing ]     [ Create New Blank Doc ]
      │                               │
      │                         [ Move Doc into /CertStudy Folder ]
      │                               │
      └──────────────┬────────────────┘
                     │
                     ▼
      [ Construct batchUpdate Payload ]
                     │
                     ▼
      [ Apply insertText & paragraphStyles ]
                     │
                     ▼
      [ Update Note with googleDocId & googleDocUrl ]
```

### 3.1 Document Creation & Drive Folder Placement
1. `POST https://docs.googleapis.com/v1/documents` creates a new document with `title: note.title`.
2. By default, newly created Docs reside in the root of Google Drive. The service calls Drive API v3 to relocate the file into the `/CertStudy` container folder:
   `PATCH https://www.googleapis.com/drive/v3/files/{docId}?addParents={certStudyFolderId}&removeParents=root`

### 3.2 Content Injection via `batchUpdate`
The Google Docs API v1 requires atomic transactional updates via the `:batchUpdate` endpoint:
- **Text Insertion (`insertText`)**:
  - Injects note title, metadata header (tags, certification name, synchronization timestamp), and the full note body.
- **Structural Styling (`updateParagraphStyle`)**:
  - Identifies Markdown headings (`# `, `## `, `### `) and assigns native Google Docs paragraph styles (`HEADING_1`, `HEADING_2`, `HEADING_3`, `NORMAL_TEXT`).
  - Sets bold and bullet point ranges where appropriate.

### 3.3 State Reconciliation
Upon successful execution, the service returns:
- `docId`: The Google Doc file ID.
- `docUrl`: `https://docs.google.com/document/d/{docId}/edit`.
These are stored on the `Note` entity, rendering a direct **"Google Docs"** external link button in `NoteEditor.tsx`.
