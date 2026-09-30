import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';
import { googleWorkspaceService } from '../services/googleWorkspaceService';
import {
  X,
  Sun,
  Moon,
  Globe,
  Clock,
  UserCheck,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  CloudUpload,
  RefreshCw,
  FolderSync,
  LogOut,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LanguageCode } from '../i18n/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    settings,
    updateSettings,
    exportDataJSON,
    importDataJSON,
    resetAllData,
    loadSampleStarterKit,
    certifications,
    notes,
    questions,
    examAttempts,
  } = useApp();
  const { state: gState, connectGoogle, disconnectGoogle, backupFullWorkspaceToDrive, restoreFullWorkspaceFromDrive } = useGoogleWorkspace();
  const { t, language, setLanguage, supportedLanguages } = useTranslation();

  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDriveOperating, setIsDriveOperating] = useState(false);
  const [showOAuthConfig, setShowOAuthConfig] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState(() => googleWorkspaceService.getEffectiveClientId());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveCustomClientId = () => {
    googleWorkspaceService.setCustomClientId(customClientIdInput);
    setImportSuccessMsg('Google Client ID updated! You can now click Connect Google.');
    setTimeout(() => setImportSuccessMsg(null), 4000);
  };

  const handleDriveBackup = async () => {
    setIsDriveOperating(true);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);
    const ok = await backupFullWorkspaceToDrive();
    setIsDriveOperating(false);
    if (ok) {
      setImportSuccessMsg('Full study workspace saved to Google Drive (/CertStudy/certstudy_cloud_backup.json)!');
      setTimeout(() => setImportSuccessMsg(null), 4000);
    } else {
      setImportErrorMsg(gState.error || 'Failed to backup to Google Drive');
    }
  };

  const handleDriveRestore = async () => {
    setIsDriveOperating(true);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);
    const ok = await restoreFullWorkspaceFromDrive();
    setIsDriveOperating(false);
    if (ok) {
      setImportSuccessMsg('Workspace successfully restored from Google Drive!');
      setTimeout(() => setImportSuccessMsg(null), 4000);
    } else {
      setImportErrorMsg(gState.error || 'Could not restore backup from Google Drive');
    }
  };

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certstudy_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setImportSuccessMsg('Backup restored successfully!');
        setImportErrorMsg(null);
        setTimeout(() => setImportSuccessMsg(null), 3000);
      } else {
        setImportErrorMsg('Failed to parse backup file. Please ensure it is valid JSON.');
        setImportSuccessMsg(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center space-x-2">
            <span>{t('settings.title')}</span>
          </h2>
          <button
            id="settings-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success / Error alerts */}
        {importSuccessMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
        )}
        {importErrorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{importErrorMsg}</span>
          </div>
        )}

        <div className="space-y-6 text-sm">
          {/* Theme selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t('settings.themeSection')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="settings-theme-light"
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  settings.theme === 'light'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-900 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{t('app.light')}</span>
              </button>
              <button
                id="settings-theme-dark"
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  settings.theme === 'dark'
                    ? 'border-amber-500 bg-stone-800 text-amber-400 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Moon className="w-4 h-4 text-amber-400" />
                <span>{t('app.dark')}</span>
              </button>
            </div>
          </div>

          {/* Language selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t('settings.languageSection')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  id={`settings-lang-${lang.code}`}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    updateSettings({ language: lang.code });
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                    language === lang.code
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Exam default preferences (Section 10) */}
          <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t('settings.examDefaults')}
            </label>

            {/* Default Timer Toggle */}
            <div className="flex items-start justify-between p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800">
              <div className="space-y-0.5 pr-4">
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>{t('settings.defaultTimer')}</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {t('settings.defaultTimerDesc')}
                </p>
              </div>
              <button
                id="settings-default-timer-toggle"
                type="button"
                onClick={() => updateSettings({ defaultUseTimer: !settings.defaultUseTimer })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.defaultUseTimer ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                role="switch"
                aria-checked={settings.defaultUseTimer}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.defaultUseTimer ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Default Accommodation Toggle */}
            <div className="flex items-start justify-between p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800">
              <div className="space-y-0.5 pr-4">
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>{t('settings.defaultAccommodation')}</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {t('settings.defaultAccommodationDesc')}
                </p>
              </div>
              <button
                id="settings-default-accommodation-toggle"
                type="button"
                onClick={() => updateSettings({ defaultUseAccommodation: !settings.defaultUseAccommodation })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.defaultUseAccommodation ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                role="switch"
                aria-checked={settings.defaultUseAccommodation}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.defaultUseAccommodation ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Google Workspace Cloud Sync (Drive & Docs) */}
          <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center space-x-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-500" />
                <span>Google Drive & Docs Cloud Workspace</span>
              </label>
              {gState.isConnected && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>Connected</span>
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-white">
                    {gState.isConnected ? (
                      <span>Account: <span className="text-blue-600 dark:text-blue-400">{gState.userEmail || 'Google User'}</span></span>
                    ) : (
                      <span>Sync study progress & notes across PC & Phone</span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {gState.isConnected
                      ? 'Study files, question progress, and mock exams sync automatically to your Google Drive in /CertStudy.'
                      : 'Authorize Google Drive to sync your notes to Google Docs and backup exams seamlessly.'}
                  </p>
                </div>

                {!gState.isConnected ? (
                  <button
                    id="settings-connect-google-btn"
                    type="button"
                    onClick={connectGoogle}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center space-x-1.5"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Connect Google</span>
                  </button>
                ) : (
                  <button
                    id="settings-disconnect-google-btn"
                    type="button"
                    onClick={disconnectGoogle}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                    title="Disconnect Google Account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Error diagnostic banner */}
              {gState.error && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Connection Issue</span>
                  </div>
                  <p className="text-amber-700 dark:text-amber-300/90 leading-relaxed font-mono text-[11px] break-words">
                    {gState.error}
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Make sure your OAuth Client ID is registered in Google Cloud Console with your site URL in Authorized JavaScript origins.
                  </p>
                </div>
              )}

              {/* Advanced OAuth Setup Toggle */}
              <div className="pt-1 border-t border-stone-200/50 dark:border-stone-700/50">
                <button
                  type="button"
                  onClick={() => setShowOAuthConfig(!showOAuthConfig)}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 py-1 transition-colors"
                >
                  <span className="flex items-center space-x-1">
                    <Key className="w-3 h-3 text-stone-400" />
                    <span>Google OAuth Client ID Configuration</span>
                  </span>
                  {showOAuthConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showOAuthConfig && (
                  <div className="mt-2 p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                        OAuth 2.0 Web Client ID
                      </label>
                      <input
                        type="text"
                        value={customClientIdInput}
                        onChange={(e) => setCustomClientIdInput(e.target.value)}
                        placeholder="123456789...apps.googleusercontent.com"
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 dark:text-stone-500">
                        Saved in browser storage (BYOS).
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveCustomClientId}
                        className="px-3 py-1 bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Save Client ID
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {gState.isConnected && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                  <button
                    id="settings-drive-backup-btn"
                    type="button"
                    onClick={handleDriveBackup}
                    disabled={isDriveOperating}
                    className="p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <CloudUpload className={`w-3.5 h-3.5 text-blue-500 ${isDriveOperating ? 'animate-bounce' : ''}`} />
                    <span>{isDriveOperating ? 'Syncing...' : 'Backup to Drive'}</span>
                  </button>

                  <button
                    id="settings-drive-restore-btn"
                    type="button"
                    onClick={handleDriveRestore}
                    disabled={isDriveOperating}
                    className="p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isDriveOperating ? 'animate-spin' : ''}`} />
                    <span>Restore from Drive</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Storage & Data Section */}
          <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('settings.dataSection')}
              </label>
              <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
                {certifications.length} certs · {notes.length} notes · {questions.length} questions
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="settings-export-btn"
                type="button"
                onClick={handleExport}
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                <span>{t('settings.exportData')}</span>
              </button>

              <label className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>{t('settings.importData')}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* Starter kit helper button */}
            <button
              id="settings-sample-data-btn"
              type="button"
              onClick={() => {
                loadSampleStarterKit();
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('app.loadSampleData')}</span>
            </button>

            {/* Clear all data */}
            {!showResetConfirm ? (
              <button
                id="settings-reset-trigger-btn"
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full p-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('settings.clearData')}</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
                <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                  {t('settings.clearConfirm')}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    id="settings-confirm-reset-btn"
                    type="button"
                    onClick={() => {
                      resetAllData();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                  >
                    {t('app.confirm')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-medium"
                  >
                    {t('app.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            id="settings-done-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold transition-colors"
          >
            {t('app.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
