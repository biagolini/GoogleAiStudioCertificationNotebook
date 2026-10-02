# Backend — Google Drive API v3 & BYOS Storage Synchronization

> **Primary Source File**: `src/services/googleWorkspaceService.ts`

---

## 1. Architectural Role

The Google Drive integration provides persistent cloud backup and cross-device synchronization without introducing an intermediate server or centralized database. Files are saved directly to the student's personal Google Drive storage account under an application-scoped folder (`/CertStudy`).

---

## 2. Authentication Protocol & OAuth Scope Boundaries

- **Authentication Flow**: Client-side OAuth 2.0 Implicit Grant using Google Identity Services (GSI) via `google.accounts.oauth2.initTokenClient`.
- **Target Scopes**:
  - `https://www.googleapis.com/auth/drive.file`: Grants read/write permissions **only** to files and folders created or opened by CertStudy. CertStudy cannot see or access any other files in the user's Drive.
  - `https://www.googleapis.com/auth/documents`: Grants permission to create and format Google Docs.

---

## 3. Storage Hierarchy in Google Drive

```text
User's Personal Google Drive Root
│
└── 📁 /CertStudy (Application Container Folder)
    ├── 📄 certstudy_cloud_backup.json (Complete Workspace State)
    ├── 📝 Note — AWS S3 Storage Tiers (Google Doc)
    ├── 📝 Note — Kubernetes Pod Lifecycle (Google Doc)
    └── ...
```

### 3.1 Folder Discovery & Lazy Creation
When executing cloud operations, the service calls `getOrCreateCertStudyFolder()`:
1. Queries Drive API v3:
   `mimeType = 'application/vnd.google-apps.folder' and name = 'CertStudy' and trashed = false`
2. If found, caches the folder ID.
3. If not found, issues `POST https://www.googleapis.com/drive/v3/files` with `mimeType: application/vnd.google-apps.folder` and `name: CertStudy`.

---

## 4. Backup Serialization & Multipart Upload

### 4.1 Backup Payload Schema (`CertStudyBackupData`)
The backup payload bundles all local storage entities into a single versioned object:
- `version`: Backup format version (`"1.0"`).
- `exportedAt`: ISO 8601 timestamp.
- `certifications`: Array of `Certification`.
- `notes`: Array of `Note`.
- `questionBanks`: Array of `QuestionBank`.
- `questions`: Array of `Question`.
- `examAttempts`: Array of `ExamAttempt`.
- `profile`: `StudentProfile`.
- `settings`: `AppSettings`.

### 4.2 Multipart Upload Protocol
- Checks if `certstudy_cloud_backup.json` already exists in `/CertStudy`.
- If existing, executes an in-place `PATCH` update:
  `PATCH https://www.googleapis.com/upload/drive/v3/files/{fileId}?uploadType=multipart`
- If new, executes `POST`:
  `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`
- Payload uses `multipart/related` format containing file metadata (name and parent folder ID) and the raw JSON payload.

---

## 5. Restore Protocol

1. Queries Drive API for `certstudy_cloud_backup.json` within the `/CertStudy` folder.
2. Fetches content via `GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media`.
3. Validates that the payload contains required top-level arrays (`certifications`, `questions`, etc.).
4. Writes the restored records to their respective `localStorage` table keys.
5. Re-hydrates React Context state, rendering the restored workspace immediately.
