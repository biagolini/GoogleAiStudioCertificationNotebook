# Resolving the "Google hasn’t verified this app" Screen & Demo Video Guide

This guide explains why Google displays the **"Google hasn’t verified this app"** warning screen, how you can proceed immediately, and how to complete the official Google Verification process (including the required Demo Video) if you want to remove the warning permanently for all users.

---

## 1. Why Google Shows This Screen

When you connect your Google Account to CertStudy, the application requests two OAuth 2.0 scopes:

1. `https://www.googleapis.com/auth/drive.file` — **Non-sensitive scope** (grants access *only* to files and folders created by CertStudy itself).
2. `https://www.googleapis.com/auth/documents` — **Sensitive scope** (allows the application to create and format study notes in Google Docs).

Because the Google Docs scope (`documents`) is classified as **Sensitive** by Google Trust & Safety, Google automatically presents a warning banner on any application that has not yet completed the formal Google Cloud App Verification review.

---

## 2. Immediate Solution: Bypass the Warning in 5 Seconds

If this is your personal study tool or you are testing the application, **you do NOT need to wait for Google verification**:

1. On the **"Google hasn’t verified this app"** screen:
2. Look at the bottom-left corner and click the small link: **Advanced** (or **Avançado** in Portuguese).
3. A collapsible section opens below. Click: **Go to study.yourdomain.com (unsafe)** (or **Acessar study.yourdomain.com (não seguro)**).
4. Review the requested permissions (Google Drive and Google Docs) and check the confirmation boxes.
5. Click **Continue** (or **Continuar**).

The popup will close and CertStudy will be fully connected to your Google Drive and Docs.

---

## 3. Alternative: Using "Testing" Mode with Test Users

If your project in Google Cloud Console is in **Testing** status rather than **In Production**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **OAuth consent screen**.
2. Scroll down to the **Test users** section.
3. Click **+ Add Users**.
4. Enter your email address (`your-email@example.com`) and click **Save**.
5. When signing in from a whitelisted test account, Google displays an informational "testing" dialog instead of the unverified app warning block.

---

## 4. Official Google App Verification (To Remove the Warning for All Users)

If you want the app to be publicly accessible to anyone without any warning screen, you must submit your app for verification in Google Cloud Console.

### 4.1 Prerequisites Checklist
Before submitting, ensure all of the following are complete:
- [x] **Verified Home Page Domain**: Domain ownership verified in Google Search Console via DNS TXT record (see `docs/oauth-homepage-domain-verification.md`).
- [x] **Public Privacy Policy**: Reachable at `https://study.yourdomain.com/privacy.html` and compliant with the Google API Services User Data Policy.
- [x] **Public Terms of Service**: Reachable at `https://study.yourdomain.com/terms.html`.
- [x] **Authorized JavaScript Origins**: Correctly configured without trailing slashes in your OAuth Client ID credentials.

---

## 5. Scope Justifications for Google Reviewers

When submitting the verification request in the Google Cloud Console, Google will ask you to explain why your application requires each requested scope. You can adapt the following clear justifications:

### Justification for `https://www.googleapis.com/auth/drive.file`
```text
CertStudy is a client-side certification study and exam preparation companion operating on a Bring Your Own Storage (BYOS) architecture with zero centralized databases. We use the drive.file scope strictly to allow the user to back up and restore their personal study data (exam questions, question banks, study notes, and mock exam progress) to a dedicated folder (/CertStudy) on their own Google Drive. We only access files created by the application itself.
```

### Justification for `https://www.googleapis.com/auth/documents`
```text
CertStudy provides a rich markdown note-taking editor for certification preparation. Users requested the ability to export their personal study notes directly into formatted Google Docs documents for offline reading, annotation, and printing. The documents scope is used solely to generate these individual documents in the user's Google Docs account upon their explicit user-initiated request ("Sync to Google Docs"). We do not read, alter, or access any other existing documents in the user's account.
```

---

## 6. The Demo Video: Exact Google Requirements

Google requires a short screen recording video demonstrating how the requested sensitive scope is used in the app.

### 6.1 Recording Guidelines
- **Format**: Video uploaded to YouTube (set privacy to **Unlisted** / **Não listado** so only people with the link can view it).
- **Duration**: 1 to 2 minutes.
- **Audio/Subtitles**: Optional. You can either speak in English or add brief on-screen captions explaining the steps.
- **Crucial Rule**: The video **must show the browser address bar** showing the full OAuth consent URL containing the `client_id` parameter.
- **Crucial Rule**: The video **must show the "Google hasn’t verified this app" screen** and the tester clicking *Advanced* -> *Go to ... (unsafe)* to proceed. (Google expects this in test recordings!).

### 6.2 Step-by-Step Recording Script (1 to 2 minutes)

1. **Step 1: Show the Home Page & Settings** (0:00 - 0:20)
   - Open your browser to `https://study.yourdomain.com`.
   - Briefly show the main interface.
   - Click the **Settings (gear icon)** or the **Connect Google** button in the header.

2. **Step 2: Trigger OAuth & Show Client ID** (0:20 - 0:45)
   - Click **Connect Google**.
   - When the Google OAuth popup window opens, **zoom in or clearly display the URL bar** of the popup so the reviewer can read:
     `client_id=123456789012-...apps.googleusercontent.com`
   - Show the **"Google hasn’t verified this app"** screen.
   - Click **Advanced** > **Go to study.yourdomain.com (unsafe)**.
   - Check the requested permissions and click **Continue**.

3. **Step 3: Demonstrate Google Drive Backup** (0:45 - 1:15)
   - Show the app now indicating **"Connected"** with your user email.
   - In Settings, click **Save to Google Drive**.
   - Switch to a new browser tab, open [Google Drive](https://drive.google.com), and show the newly created `/CertStudy` folder containing `certstudy_cloud_backup.json`.

4. **Step 4: Demonstrate Google Docs Sync (`documents` scope)** (1:15 - 1:45)
   - Return to CertStudy.
   - Navigate to any certification workspace > **Notes** tab.
   - Create or open a note (e.g., "AWS Networking Summary").
   - Click the button **Sync to Google Docs**.
   - Show the confirmation notification with the generated Google Doc link.
   - Click the link to open the formatted document in Google Docs in a new tab.

5. **Step 5: Finish & Upload**
   - Stop recording.
   - Upload the video to YouTube.
   - Set visibility to **Unlisted**.
   - Copy the YouTube video URL (e.g., `https://youtu.be/xxxxxxxxxxx`).
   - Paste the link into the **Demo Video** field in Google Cloud Console OAuth consent screen verification form.

---

## 7. What Happens After Submitting

1. Google Trust & Safety sends an automated confirmation email to your developer email address.
2. If Google needs domain re-confirmation, reply directly to the email acknowledging ownership.
3. Review typically takes between **24 to 72 hours**.
4. Once approved, the "Google hasn't verified this app" warning screen disappears for all users.
