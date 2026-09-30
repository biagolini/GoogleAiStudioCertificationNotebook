# Google Cloud OAuth 2.0 Setup Guide for CertStudy

This guide provides step-by-step instructions to configure Google Cloud Platform (GCP) for **CertStudy** so that users can seamlessly synchronize their study notes, question banks, and exam progress directly with their own personal Google Drive and Google Docs accounts.

---

## 1. Overview & Architecture

CertStudy operates under a **Bring Your Own Storage (BYOS)** architecture:
- **Zero Server Costs**: The application has no centralized backend database.
- **Client-Side Authorization**: Authentication is performed directly in the user's browser using Google Identity Services (GSI) OAuth 2.0 popup.
- **Data Privacy**: Users retain 100% ownership of their data. CertStudy only requests access to files it creates itself (`drive.file` scope) and Google Docs creation (`documents` scope).

---

## 2. Prerequisites

- A standard Google Account.
- Access to the [Google Cloud Console](https://console.cloud.google.com/).
- (Optional) A custom domain (e.g., `study.yourdomain.com`) or your standard GitHub Pages URL (`https://<your-username>.github.io`).

---

## 3. Step-by-Step Configuration in Google Cloud Console

### Step 3.1: Create or Select a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top navigation bar.
3. Click **New Project**:
   - **Project Name**: `CertStudy`
   - **Location**: Leave default (*No organization*).
4. Click **Create** and wait a few seconds until the project is active.

---

### Step 3.2: Enable Required Google APIs
CertStudy requires access to Google Drive and Google Docs APIs.

1. In the left navigation menu (☰), go to **APIs & Services** > **Library**.
2. In the search box, type **Google Drive API** and click on it.
3. Click **Enable**.
4. Return to **Library**, type **Google Docs API** and click on it.
5. Click **Enable**.

---

### Step 3.3: Configure the OAuth Consent Screen & Branding
The OAuth consent screen informs users what permissions the application is requesting.

1. In the left navigation menu, go to **APIs & Services** > **OAuth consent screen** (or **Branding**).
2. Choose **External** user type and click **Create**.
3. Fill in the **App Information**:
   - **App name**: `CertStudy`
   - **User support email**: `your-email@example.com`
4. Fill in the **App Domain**:
   - **Application home page**: `https://study.yourdomain.com` (or `https://<your-username>.github.io/<repo-name>`)
   - **Application privacy policy link**: `https://study.yourdomain.com/privacy.html`
   - **Application terms of service link**: `https://study.yourdomain.com/terms.html`
5. Fill in **Authorized Domains**:
   > ⚠️ **Important:** Add the root domain first without `https://` or subdomains.
   - Click **+ Add Domain** and enter: `yourdomain.com` (e.g., if using a custom domain).
6. Fill in **Developer Contact Information**:
   - **Email addresses**: `your-email@example.com`
7. Click **Save and Continue**.

#### Scopes Configuration:
1. On the **Scopes** page, click **Add or Remove Scopes**.
2. Select or manually enter:
   - `https://www.googleapis.com/auth/drive.file` *(Create and manage files created by this app)*
   - `https://www.googleapis.com/auth/documents` *(Create and edit Google Docs notes)*
3. Click **Update** and then **Save and Continue**.

---

### Step 3.4: Publish the Application (Make it Public)
By default, new OAuth apps are in **Testing** mode (which blocks any account not explicitly added as a test user).

1. In the left navigation menu, go to **APIs & Services** > **OAuth consent screen**.
2. Under **Publishing status**, look for the **Publish App** button.
3. Click **Publish App** and confirm in the pop-up dialog.
4. The status will update to **In production**.

*(Note: Because CertStudy uses non-sensitive/restricted-by-file scopes like `drive.file`, full complex Google App verification is generally not required for personal or organizational utility).*

---

### Step 3.5: Create the OAuth 2.0 Web Client ID
This step generates the public Client ID string needed by the frontend.

1. In the left navigation menu, go to **APIs & Services** > **Credentials**.
2. At the top of the page, click **+ Create Credentials** > **OAuth client ID**.
3. In **Application type**, select **Web application**.
4. In **Name**, enter: `CertStudy Web Client`.
5. Under **Authorized JavaScript origins**:
   - Click **+ Add URI** and add:
     - `http://localhost:3000` *(for local development)*
     - `http://localhost:5173` *(if using standard Vite dev server)*
     - `https://study.yourdomain.com` *(your production custom domain, if applicable)*
     - `https://<your-username>.github.io` *(your GitHub Pages root URL)*
   > ⚠️ **Rule:** Do not add a trailing slash `/` at the end of the URL.
6. Under **Authorized redirect URIs**:
   - Leave empty (the application uses the modern client-side Google Identity Services popup token flow).
7. Click **Create**.
8. A modal window will display **Your Client ID**. It looks like:
   ```text
   123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   ```
9. Copy this Client ID. *(You do NOT need the Client Secret — client secrets should never be included in frontend single-page applications).*

---

## 4. Configuring the Client ID in CertStudy

### Method A: Automated GitHub Pages Deployment (Recommended)
If your repository is deployed using GitHub Actions:

1. On GitHub, navigate to your repository.
2. Click **Settings** > **Secrets and variables** > **Actions**.
3. Under **Repository secrets**, click **New repository secret**.
4. Enter:
   - **Name**: `VITE_GOOGLE_CLIENT_ID`
   - **Secret**: Paste your copied Client ID:
     `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
5. Click **Add secret**.
6. Trigger a new deployment:
   - Go to the **Actions** tab in your repository.
   - Select the **Deploy to GitHub Pages** workflow.
   - Click **Run workflow** (or simply push a new commit).
   - Vite will inject your Client ID during `bun run build`.

---

### Method B: In-App Settings Fallback (Quick Setup)
CertStudy also allows entering or overriding the Google Client ID directly within the user interface:
1. Open CertStudy in your browser.
2. Click the **Settings (gear icon)** in the header.
3. Scroll to **Google Workspace & Cloud Sync**.
4. If a Client ID was not bundled at build time, click **Advanced OAuth Settings** and paste your Client ID into the field.
5. Click **Save & Connect**. The key is stored locally in your browser (`localStorage`).

---

### Method C: Local Development (`.env` file)
When running the project locally:
1. Create a `.env` file in the project root (copied from `.env.example`).
2. Add:
   ```bash
   VITE_GOOGLE_CLIENT_ID="123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
   ```
3. Restart the dev server (`npm run dev` or `bun dev`).

---

## 5. Troubleshooting & Common Errors

### Error 401: `invalid_client` ("The OAuth client was not found")
- **Cause**: The application tried to initiate authentication with a Client ID that either does not exist in Google Cloud, was typed incorrectly, or was left empty during the build process.
- **Solution**:
  1. Verify in Google Cloud Console > **APIs & Services** > **Credentials** that the OAuth 2.0 Web Client ID exists.
  2. Ensure the GitHub repository secret `VITE_GOOGLE_CLIENT_ID` is set and matches the Client ID exactly without spaces or surrounding quotes.
  3. Re-run the GitHub Actions workflow to rebuild the site with the new secret.

---

### Error 400: `origin_mismatch` ("The given origin is not allowed for the client ID")
- **Cause**: The domain or port in the browser's address bar is not listed under **Authorized JavaScript origins**.
- **Solution**:
  1. Go to Google Cloud Console > **APIs & Services** > **Credentials**.
  2. Click on your OAuth Client ID to edit it.
  3. Add the exact protocol and domain you are currently browsing:
     - Example: `https://study.yourdomain.com`
     - Example: `https://<your-username>.github.io`
  4. Ensure there is no trailing slash (e.g., `https://study.yourdomain.com/` is invalid; use `https://study.yourdomain.com`).
  5. Click **Save**. (Changes in Google Cloud can take up to 5 minutes to propagate globally).

---

### Error 403: `access_denied` ("This app hasn't been verified")
- **Cause**: The app is still in **Testing** publishing status and the current Google Account is not on the test user whitelist.
- **Solution**:
  - In Google Cloud Console > **OAuth consent screen**, click **Publish App** to switch status to **In production**.
  - Alternatively, add your email address under **Test users**.
