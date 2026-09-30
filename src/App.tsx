import React from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { AppProvider, useApp } from './context/AppContext';
import { GoogleWorkspaceProvider } from './context/GoogleWorkspaceContext';
import Header from './components/Header';
import CertificationsList from './components/Home/CertificationsList';
import CertificationWorkspace from './components/Workspace/CertificationWorkspace';
import StudentProfileView from './components/Profile/StudentProfileView';

function AppContent() {
  const { activeCertId, currentView } = useApp();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors">
      <Header />
      <main className="flex-1">
        {activeCertId ? (
          <CertificationWorkspace />
        ) : currentView === 'profile' ? (
          <StudentProfileView />
        ) : (
          <CertificationsList />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <GoogleWorkspaceProvider>
          <AppContent />
        </GoogleWorkspaceProvider>
      </AppProvider>
    </LanguageProvider>
  );
}

