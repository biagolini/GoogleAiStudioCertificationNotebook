import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';
import {
  GraduationCap,
  Cloud,
  CloudUpload,
  Settings as SettingsIcon,
  Sun,
  Moon,
  ChevronRight,
  Globe,
  FolderOpen,
  User,
} from 'lucide-react';
import SettingsModal from './SettingsModal';

export default function Header() {
  const {
    activeCert,
    setActiveCertId,
    currentView,
    setCurrentView,
    studentProfile,
    isSyncing,
    lastSyncedTimestamp,
    settings,
    toggleTheme,
  } = useApp();
  const { state: gState, connectGoogle } = useGoogleWorkspace();
  const { t, language, setLanguage, supportedLanguages } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: App Logo & Breadcrumb Navigation */}
          <div className="flex items-center space-x-3">
            <button
              id="header-home-btn"
              onClick={() => {
                setActiveCertId(null);
                setCurrentView('home');
              }}
              className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-extrabold text-base tracking-tight text-stone-900 dark:white">
                  {t('app.title')}
                </span>
                <span className="text-xs block text-stone-500 dark:text-stone-400 font-medium">
                  {t('app.subtitle')}
                </span>
              </div>
            </button>

            {currentView === 'profile' && !activeCert && (
              <div className="flex items-center space-x-2 pl-2 border-l border-stone-200 dark:border-stone-800">
                <ChevronRight className="w-4 h-4 text-stone-400" />
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                  {t('profile.nav')}
                </span>
              </div>
            )}

            {activeCert && (
              <div className="flex items-center space-x-2 pl-2 border-l border-stone-200 dark:border-stone-800">
                <ChevronRight className="w-4 h-4 text-stone-400" />
                <button
                  id="header-cert-badge-btn"
                  onClick={() => {
                    setActiveCertId(null);
                    setCurrentView('home');
                  }}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors border border-stone-200 dark:border-stone-800 max-w-[200px] sm:max-w-xs truncate"
                  title={activeCert.name}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: activeCert.color || '#f59e0b' }}
                  />
                  <span className="truncate">{activeCert.code ? `${activeCert.code} · ${activeCert.name}` : activeCert.name}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Profile, Drive Sync Status, Language, Theme, Settings */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Student Profile Navigation Button */}
            <button
              id="header-profile-btn"
              onClick={() => {
                setActiveCertId(null);
                setCurrentView(currentView === 'profile' ? 'home' : 'profile');
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'profile'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800'
              }`}
              title={t('profile.nav')}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline max-w-[100px] truncate">
                {studentProfile.name ? studentProfile.name.split(' ')[0] : t('profile.nav')}
              </span>
            </button>
            {/* Google Drive Status Indicator */}
            {gState.isConnected ? (
              <button
                id="header-drive-status-btn"
                onClick={() => setIsSettingsOpen(true)}
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:opacity-90 transition-opacity"
                title={`Google Drive Synced (/CertStudy) · ${gState.userEmail || 'Connected'}`}
              >
                {gState.isSyncing || isSyncing ? (
                  <CloudUpload className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                )}
                <span className="truncate">
                  {gState.isSyncing || isSyncing ? t('app.driveSyncing') : 'Drive Synced'}
                </span>
              </button>
            ) : (
              <button
                id="header-connect-drive-btn"
                onClick={async () => {
                  try {
                    await connectGoogle();
                  } catch {
                    setIsSettingsOpen(true);
                  }
                }}
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-600 dark:text-stone-400 text-xs font-medium hover:text-stone-900 dark:hover:text-white hover:border-amber-500/50 transition-colors"
                title="Connect Google Drive for cross-device sync and Google Docs notes"
              >
                <Cloud className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('app.connectGoogle')}</span>
              </button>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                id="header-lang-btn"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900 border border-transparent hover:border-stone-200 dark:hover:border-stone-800 transition-colors flex items-center space-x-1 text-xs font-semibold"
                aria-label={t('app.language')}
              >
                <Globe className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                <span className="hidden sm:inline uppercase">{language}</span>
              </button>

              {isLangMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      {t('app.language')}
                    </div>
                    {supportedLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        id={`lang-select-${lang.code}`}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                          language === lang.code
                            ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {language === lang.code && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              id="header-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900 border border-transparent hover:border-stone-200 dark:hover:border-stone-800 transition-colors"
              title={settings.theme === 'light' ? t('app.dark') : t('app.light')}
              aria-label="Toggle visual theme"
            >
              {settings.theme === 'light' ? (
                <Moon className="w-4 h-4 text-stone-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Settings Modal Trigger */}
            <button
              id="header-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900 border border-transparent hover:border-stone-200 dark:hover:border-stone-800 transition-colors"
              title={t('app.settings')}
              aria-label={t('app.settings')}
            >
              <SettingsIcon className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Preferences Modal */}
      {isSettingsOpen && (
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
}
