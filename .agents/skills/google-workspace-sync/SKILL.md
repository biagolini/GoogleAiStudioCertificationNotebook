---
name: google-workspace-sync
description: Workflows for Google Workspace OAuth 2.0 integration, Google Drive backup/restore, and Google Docs note generation in CertStudy. Use when diagnosing sync errors, modifying googleWorkspaceService.ts, or updating OAuth configurations.
---

# Google Workspace Sync Skill

This skill provides operational and troubleshooting procedures for the Google Workspace integration within **CertStudy**.

## 1. Authentication Flow

CertStudy uses the modern **Google Identity Services (GSI)** JavaScript SDK (`https://accounts.google.com/gsi/client`) via an OAuth 2.0 token client:

```typescript
const client = window.google.accounts.oauth2.initTokenClient({
  client_id: effectiveClientId,
  scope: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/documents'
  ].join(' '),
  callback: (response) => { ... }
});
```

### Critical Rules
- **No Client Secrets**: CertStudy is a single-page browser application. Client secrets must NEVER be baked into code, committed to Git, or requested from users.
- **Minimal Scopes**: Use only `drive.file` (accesses only files created by CertStudy) and `documents` (creates note documents). Never request broad `drive` or `drive.readonly` scopes which require extensive Google verification.
- **Token Storage**: The access token is held in browser memory during the session. Refreshing triggers a renewal prompt if expired.

## 2. Google Drive Backup Standard

- **Dedicated Directory**: All application backups are saved inside a folder named `CertStudy` at the root of the user's Google Drive.
- **Query Strategy**: Always query `mimeType='application/vnd.google-apps.folder' and name='CertStudy' and trashed=false` using the Google Drive REST API v3.
- **Backup File**: `certstudy-backup.json` contains full export data (`certifications`, `questionBanks`, `questions`, `notes`, `examSessions`).

## 3. Google Docs Export Standard

- When exporting study notes, use the Google Docs API v1 (`documents.create` and `documents.batchUpdate`).
- Format note headers, key takeaways, and tags into structured paragraphs with bold headings.
- Save the resulting document URL in the `Note` object (`googleDocUrl`, `lastSyncedToDocsAt`) for one-click access.

## 4. Diagnostics & Error Handling

- **Error 401 (`invalid_client`)**:
  - The OAuth Client ID is either missing, has invalid format, or was deleted from the Google Cloud Console.
  - Check `localStorage.getItem('certstudy_custom_google_client_id')` or `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
- **Error 400 (`origin_mismatch`)**:
  - The current browser URL (`window.location.origin`) is not present in the Google Cloud Console's **Authorized JavaScript origins**.
  - Must add exact protocol and host (e.g., `https://study.biagolini.click` or `http://localhost:3000`). No trailing slashes.
- **Offline Fallback**:
  - If Google Workspace API requests fail due to network drops or quota issues, the app must gracefully fall back to local browser storage without throwing uncaught exceptions to the UI.
