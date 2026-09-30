/**
 * Google Workspace Drive & Docs Client Service
 * Uses Google Identity Services (GSI) Token Client with incremental consent.
 * 
 * Provides:
 * - OAuth 2.0 Access Token acquisition & caching
 * - Drive file discovery & folder organization (/CertStudy/)
 * - Google Docs creation & updating for study notes
 * - Full JSON study backup syncing (local-first BYOS)
 */

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export interface GoogleUserProfile {
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleWorkspaceState {
  isConnected: boolean;
  accessToken: string | null;
  userEmail: string | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  error: string | null;
  certStudyFolderId: string | null;
}

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
].join(' ');

const STORAGE_KEYS = {
  TOKEN: 'certstudy_gworkspace_token',
  EXPIRES_AT: 'certstudy_gworkspace_expires_at',
  USER_EMAIL: 'certstudy_gworkspace_user_email',
  FOLDER_ID: 'certstudy_gworkspace_folder_id',
  LAST_SYNC: 'certstudy_gworkspace_last_sync',
  CUSTOM_CLIENT_ID: 'certstudy_custom_google_client_id',
};

class GoogleWorkspaceService {
  private tokenClient: any = null;
  private clientId: string = '';

  constructor() {
    // Look up client ID from env if provided at build time
    try {
      this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    } catch {
      this.clientId = '';
    }
  }

  public getCustomClientId(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.CUSTOM_CLIENT_ID) || '';
    } catch {
      return '';
    }
  }

  public setCustomClientId(clientId: string): void {
    try {
      if (clientId && clientId.trim()) {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_CLIENT_ID, clientId.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_CLIENT_ID);
      }
    } catch {}
  }

  public getEffectiveClientId(): string {
    const fromCustom = this.getCustomClientId();
    let fromEnv = '';
    try {
      fromEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    } catch {}
    return (fromCustom || fromEnv || this.clientId || '').trim();
  }

  /**
   * Loads Google Identity Services (GSI) script dynamically
   */
  public async loadGsiScript(): Promise<void> {
    if (window.google?.accounts?.oauth2) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      // Poll if script is already present in DOM
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts > 50) {
          clearInterval(checkInterval);
          reject(new Error('Timed out waiting for Google Identity Services SDK to load.'));
        }
      }, 60);

      const existing = document.getElementById('google-gsi-client');
      if (existing) {
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onerror = (err) => {
        clearInterval(checkInterval);
        reject(new Error('Failed to load Google Identity Services SDK: ' + err));
      };
      document.head.appendChild(script);
    });
  }

  public getSavedToken(): string | null {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || '0');
      if (token && expiresAt > Date.now()) {
        return token;
      }
      // Clean expired
      if (token && expiresAt <= Date.now()) {
        this.clearAuth();
      }
    } catch (e) {}
    return null;
  }

  public getSavedEmail(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    } catch (e) {
      return null;
    }
  }

  public getSavedFolderId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.FOLDER_ID);
    } catch (e) {
      return null;
    }
  }

  public clearAuth(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.FOLDER_ID);
    } catch (e) {}
  }

  /**
   * Requests user authorization via standard Google popup
   */
  public async requestAccessToken(clientIdOverride?: string): Promise<string> {
    await this.loadGsiScript();

    const effectiveClientId = (clientIdOverride || this.getEffectiveClientId()).trim();

    if (!effectiveClientId || !effectiveClientId.includes('.apps.googleusercontent.com') || effectiveClientId.length < 25) {
      throw new Error(
        'Google OAuth Client ID is missing or invalid. Please configure VITE_GOOGLE_CLIENT_ID in your GitHub Secrets or enter it under Settings > Google Workspace.'
      );
    }

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services SDK is not loaded.'));
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: SCOPES,
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              return reject(new Error(tokenResponse.error_description || tokenResponse.error));
            }
            if (tokenResponse.access_token) {
              const expiresIn = Number(tokenResponse.expires_in || 3600) * 1000;
              const expiresAt = Date.now() + expiresIn - 60000; // 1 min buffer
              localStorage.setItem(STORAGE_KEYS.TOKEN, tokenResponse.access_token);
              localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));

              // Fetch basic user profile info to display
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (userRes.ok) {
                  const userData = await userRes.json();
                  if (userData.email) {
                    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, userData.email);
                  }
                }
              } catch (err) {
                console.warn('Could not fetch user profile details:', err);
              }

              resolve(tokenResponse.access_token);
            } else {
              reject(new Error('No access token returned from Google'));
            }
          },
        });

        client.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * Ensures the root `CertStudy` directory exists in the user's Drive
   */
  public async ensureCertStudyFolder(accessToken: string): Promise<string> {
    const cachedId = this.getSavedFolderId();
    if (cachedId) {
      // Validate folder still exists
      try {
        const checkRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${cachedId}?fields=id,trashed`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (checkRes.ok) {
          const data = await checkRes.json();
          if (!data.trashed) return cachedId;
        }
      } catch (e) {}
    }

    // Search for existing CertStudy folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='CertStudy' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const folderId = searchData.files[0].id;
      localStorage.setItem(STORAGE_KEYS.FOLDER_ID, folderId);
      return folderId;
    }

    // Create new folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'CertStudy',
        mimeType: 'application/vnd.google-apps.folder',
        description: 'CertStudy application study workspace and backups',
      }),
    });
    const createData = await createRes.json();
    if (createData.id) {
      localStorage.setItem(STORAGE_KEYS.FOLDER_ID, createData.id);
      return createData.id;
    }
    throw new Error('Failed to create CertStudy folder in Google Drive');
  }

  /**
   * Creates or updates a study note as a native Google Doc in Google Drive
   */
  public async syncNoteToGoogleDoc(
    accessToken: string,
    note: { id: string; title: string; content: string; tags: string[]; certCode?: string },
    existingDocId?: string
  ): Promise<{ docId: string; docUrl: string }> {
    const parentFolderId = await this.ensureCertStudyFolder(accessToken);

    if (existingDocId) {
      // 1. Update existing Doc
      // First read existing doc to get end index
      const docRes = await fetch(`https://www.googleapis.com/v1/documents/${existingDocId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (docRes.ok) {
        const docObj = await docRes.json();
        const docLength = docObj.body?.content?.slice(-1)[0]?.endIndex || 1;

        // Replace content: delete existing text (if > 1) and insert new formatted markdown/text
        const requests = [];
        if (docLength > 2) {
          requests.push({
            deleteContentRange: {
              range: {
                startIndex: 1,
                endIndex: docLength - 1,
              },
            },
          });
        }

        const formattedBody = `CertStudy Note: ${note.title}\nTags: ${note.tags.join(', ')}\nLast Synced: ${new Date().toLocaleString()}\n\n---\n\n${note.content}`;

        requests.push({
          insertText: {
            location: { index: 1 },
            text: formattedBody,
          },
        });

        await fetch(`https://www.googleapis.com/v1/documents/${existingDocId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        });

        return {
          docId: existingDocId,
          docUrl: `https://docs.google.com/document/d/${existingDocId}/edit`,
        };
      }
    }

    // 2. Create new Google Doc via Docs API
    const docTitle = `[${note.certCode || 'CertStudy'}] ${note.title}`;
    const createDocRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: docTitle,
      }),
    });

    if (!createDocRes.ok) {
      const err = await createDocRes.text();
      throw new Error(`Docs API error: ${err}`);
    }

    const createdDoc = await createDocRes.json();
    const docId = createdDoc.documentId;

    // Move file into the CertStudy folder in Drive
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}?addParents=${parentFolderId}&fields=id,parents`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Insert note content
    const formattedBody = `CertStudy Note: ${note.title}\nTags: ${note.tags.join(', ')}\nCreated: ${new Date().toLocaleString()}\n\n---\n\n${note.content}`;

    await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: formattedBody,
            },
          },
        ],
      }),
    });

    return {
      docId,
      docUrl: `https://docs.google.com/document/d/${docId}/edit`,
    };
  }

  /**
   * Syncs full application state to Google Drive as `certstudy_cloud_backup.json`
   */
  public async syncBackupToDrive(accessToken: string, appDataJson: string): Promise<string> {
    const parentFolderId = await this.ensureCertStudyFolder(accessToken);
    const fileName = 'certstudy_cloud_backup.json';

    // Check if backup file already exists in CertStudy folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${parentFolderId}' in parents and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();
    const existingFile = searchData.files?.[0];

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      ...(existingFile ? {} : { parents: [parentFolderId] }),
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      appDataJson +
      closeDelimiter;

    let res: Response;
    if (existingFile) {
      // Update existing file
      res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );
    } else {
      // Create new file in folder
      res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to upload backup to Google Drive: ${err}`);
    }

    const data = await res.json();
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(Date.now()));
    return data.id;
  }

  /**
   * Fetches latest cloud backup from Google Drive
   */
  public async fetchBackupFromDrive(accessToken: string): Promise<string | null> {
    const parentFolderId = await this.ensureCertStudyFolder(accessToken);
    const fileName = 'certstudy_cloud_backup.json';

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${parentFolderId}' in parents and trashed=false&fields=files(id,name,modifiedTime)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();
    const existingFile = searchData.files?.[0];

    if (!existingFile) return null;

    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!fileRes.ok) {
      throw new Error('Failed to download backup content from Google Drive');
    }

    return await fileRes.text();
  }
}

export const googleWorkspaceService = new GoogleWorkspaceService();
