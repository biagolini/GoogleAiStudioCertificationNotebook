---
inclusion: auto
name: google-workspace-sync
description: OAuth 2.0, Google Drive backup/restore, and Google Docs export workflows for CertStudy. Use when diagnosing sync errors or modifying googleWorkspaceService.ts or OAuth config.
---

# Google Workspace Sync

## Authentication

CertStudy uses Google Identity Services (GSI) with an OAuth 2.0 token client (`window.google.accounts.oauth2.initTokenClient`).

Critical rules:
- No client secrets. This is a browser SPA; secrets must never be in code, committed, or requested from users.
- Minimal scopes only: `https://www.googleapis.com/auth/drive.file` and `https://www.googleapis.com/auth/documents`. Never request broad `drive` or `drive.readonly` scopes.
- The access token is held in browser memory for the session; renewal reprompts when expired.

## Drive Backup

- Store backups inside a folder named `CertStudy` at the root of the user's Drive.
- Locate the folder with a query like `mimeType='application/vnd.google-apps.folder' and name='CertStudy' and trashed=false` via Drive REST API v3.
- The backup file is a single JSON export of all app data (certifications, question banks, questions, notes, exam sessions).

## Docs Export

- Export notes via Google Docs API v1 (`documents.create` then `documents.batchUpdate`).
- Structure headers, key takeaways, and tags into formatted paragraphs.
- Persist the resulting document reference on the `Note` object (`googleDocId`, `googleDocUrl`, `lastSyncedToDocsAt`).

## Troubleshooting

- Error 401 (`invalid_client`): the OAuth Client ID is missing, malformed, or deleted. Check the stored custom client ID in localStorage and `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
- Error 400 (`origin_mismatch`): `window.location.origin` is not in the Google Cloud Console Authorized JavaScript origins. Add the exact protocol and host (for example `https://study.biagolini.click` or `http://localhost:3000`) with no trailing slash.
- Network or quota failures: fall back gracefully to local storage without throwing uncaught exceptions to the UI.

## Documentation Anonymization

When writing setup docs, always use anonymized placeholders: `your-client-id.apps.googleusercontent.com`, `yourdomain.com`, `your-email@example.com`.
