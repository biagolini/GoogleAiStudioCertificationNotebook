# Frontend — Settings, Storage & Cloud Synchronization Modal

> **Primary Source File**: `src/components/SettingsModal.tsx`

---

## 1. Functional Purpose

The Settings modal is the administrative center for configuring the BYOS (Bring Your Own Storage) Google Workspace connection, managing the BYOK (Bring Your Own Key) Google Gemini API credentials, adjusting exam accommodation preferences, and exporting or restoring local JSON backups.

---

## 2. Key Interface Subsystems

### 2.1 Study & Exam Preferences
- **Default Accommodation Toggle**:
  - Sets whether newly initialized mock exams start with the extra +30 minutes accommodation enabled by default (for non-native English speakers or accessibility needs).
  - Stored in `settings.defaultAccommodationEnabled` in `AppContext`.

### 2.2 Google Workspace & Drive BYOS Section
- **Connection Status Card**:
  - Indicates connection status (`Connected as user@domain.com` or `Disconnected`).
  - "Connect Google Account" / "Disconnect" button invoking Google Identity Services (GSI) OAuth 2.0 popup.
- **Drive Cloud Backup & Restore Buttons** (active when connected):
  - ☁️ **"Backup to Drive"**: Writes `certstudy_cloud_backup.json` to the `/CertStudy` folder in user's personal Google Drive.
  - 🔄 **"Restore from Drive"**: Pulls and reinstates the remote workspace file.
- **Advanced OAuth Client ID Configuration**:
  - Collapsible drawer allowing the user to provide their own custom Google Cloud Console OAuth 2.0 Web Client ID.
  - Displays the exact Authorized JavaScript Origin required by Google Cloud Console (`window.location.origin`) with a one-click copy button to prevent `origin_mismatch` Error 400.

### 2.3 Google Gemini AI Configuration (BYOK)
- Dedicated configuration card for the Gemini AI Tutor and Study Copilot:
  - **API Key Input**: Password-masked input field with reveal toggle.
  - **Test Connection Button**: Pings `gemini-3.8-flash` in real-time to verify key validity before saving.
  - **Save Key Button**: Stores the key in browser `localStorage` (`certstudy_gemini_api_key_v1`).
  - **Free API Key Helper**: Direct link to [Google AI Studio (aistudio.google.com/apikey)](https://aistudio.google.com/apikey).

### 2.4 Data Management & Disaster Recovery
- Summary counts of active entities: `{n} certs · {n} notes · {n} questions`.
- **Export Backup (JSON)**: Downloads complete `certstudy_backup_YYYY-MM-DD.json` file.
- **Import Backup (JSON)**: File picker restoring workspace state from previous JSON export.
- **Reset All App Data**: Red-alert action wiping local storage and resetting application to clean state with double confirmation.
