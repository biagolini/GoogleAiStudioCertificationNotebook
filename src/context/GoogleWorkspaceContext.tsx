import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleWorkspaceService, GoogleWorkspaceState } from '../services/googleWorkspaceService';
import { useApp } from './AppContext';
import { Note } from '../types';

interface GoogleWorkspaceContextType {
  state: GoogleWorkspaceState;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => void;
  syncNoteToDocs: (note: Note) => Promise<{ docId: string; docUrl: string } | null>;
  backupFullWorkspaceToDrive: () => Promise<boolean>;
  restoreFullWorkspaceFromDrive: () => Promise<boolean>;
}

const GoogleWorkspaceContext = createContext<GoogleWorkspaceContextType | undefined>(undefined);

export const GoogleWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notes, updateNote, exportDataJSON, importDataJSON, activeCert } = useApp();

  const [state, setState] = useState<GoogleWorkspaceState>(() => {
    const token = googleWorkspaceService.getSavedToken();
    const email = googleWorkspaceService.getSavedEmail();
    const folderId = googleWorkspaceService.getSavedFolderId();
    return {
      isConnected: !!token,
      accessToken: token,
      userEmail: email,
      lastSyncedAt: null,
      isSyncing: false,
      error: null,
      certStudyFolderId: folderId,
    };
  });

  // Preload GSI
  useEffect(() => {
    googleWorkspaceService.loadGsiScript().catch((err) => {
      console.warn('GSI script initialization error:', err);
    });
  }, []);

  const connectGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      const token = await googleWorkspaceService.requestAccessToken();
      const email = googleWorkspaceService.getSavedEmail();
      const folderId = await googleWorkspaceService.ensureCertStudyFolder(token);

      setState({
        isConnected: true,
        accessToken: token,
        userEmail: email,
        lastSyncedAt: Date.now(),
        isSyncing: false,
        error: null,
        certStudyFolderId: folderId,
      });
    } catch (err: any) {
      console.error('Google Workspace connect failed:', err);
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Failed to connect Google Workspace',
      }));
    }
  }, []);

  const disconnectGoogle = useCallback(() => {
    googleWorkspaceService.clearAuth();
    setState({
      isConnected: false,
      accessToken: null,
      userEmail: null,
      lastSyncedAt: null,
      isSyncing: false,
      error: null,
      certStudyFolderId: null,
    });
  }, []);

  const syncNoteToDocs = useCallback(
    async (note: Note): Promise<{ docId: string; docUrl: string } | null> => {
      if (!state.accessToken) {
        // Attempt to connect if not yet authorized
        try {
          await connectGoogle();
        } catch (e) {
          return null;
        }
      }

      const token = state.accessToken || googleWorkspaceService.getSavedToken();
      if (!token) return null;

      setState((prev) => ({ ...prev, isSyncing: true, error: null }));
      try {
        const result = await googleWorkspaceService.syncNoteToGoogleDoc(
          token,
          {
            id: note.id,
            title: note.title,
            content: note.content,
            tags: note.tags,
            certCode: activeCert?.code || activeCert?.name,
          },
          note.googleDocId
        );

        // Update local note record with Google Doc link
        updateNote(note.id, {
          googleDocId: result.docId,
          googleDocUrl: result.docUrl,
          lastSyncedToDocsAt: Date.now(),
        });

        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: Date.now(),
        }));

        return result;
      } catch (err: any) {
        console.error('Failed to sync note to Google Docs:', err);
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          error: err?.message || 'Error syncing note to Google Docs',
        }));
        return null;
      }
    },
    [state.accessToken, connectGoogle, activeCert, updateNote]
  );

  const backupFullWorkspaceToDrive = useCallback(async (): Promise<boolean> => {
    let token = state.accessToken || googleWorkspaceService.getSavedToken();
    if (!token) {
      try {
        await connectGoogle();
        token = googleWorkspaceService.getSavedToken();
      } catch (e) {
        return false;
      }
    }
    if (!token) return false;

    setState((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      const dataStr = exportDataJSON();
      await googleWorkspaceService.syncBackupToDrive(token, dataStr);
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: Date.now(),
      }));
      return true;
    } catch (err: any) {
      console.error('Backup to Google Drive failed:', err);
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Backup failed',
      }));
      return false;
    }
  }, [state.accessToken, connectGoogle, exportDataJSON]);

  const restoreFullWorkspaceFromDrive = useCallback(async (): Promise<boolean> => {
    let token = state.accessToken || googleWorkspaceService.getSavedToken();
    if (!token) {
      try {
        await connectGoogle();
        token = googleWorkspaceService.getSavedToken();
      } catch (e) {
        return false;
      }
    }
    if (!token) return false;

    setState((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      const backupJson = await googleWorkspaceService.fetchBackupFromDrive(token);
      if (!backupJson) {
        throw new Error('No existing CertStudy backup found in Google Drive');
      }
      const success = importDataJSON(backupJson);
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: Date.now(),
      }));
      return success;
    } catch (err: any) {
      console.error('Restore from Google Drive failed:', err);
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Restore from Drive failed',
      }));
      return false;
    }
  }, [state.accessToken, connectGoogle, importDataJSON]);

  return (
    <GoogleWorkspaceContext.Provider
      value={{
        state,
        connectGoogle,
        disconnectGoogle,
        syncNoteToDocs,
        backupFullWorkspaceToDrive,
        restoreFullWorkspaceFromDrive,
      }}
    >
      {children}
    </GoogleWorkspaceContext.Provider>
  );
};

export function useGoogleWorkspace() {
  const context = useContext(GoogleWorkspaceContext);
  if (!context) {
    throw new Error('useGoogleWorkspace must be used within a GoogleWorkspaceProvider');
  }
  return context;
}
