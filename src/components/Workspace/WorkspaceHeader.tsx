import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  FileText,
  HelpCircle,
  PlayCircle,
  ArrowLeft,
  ChevronDown,
  Clock,
  UserCheck,
  Award,
  Layers,
} from 'lucide-react';

export default function WorkspaceHeader() {
  const {
    activeCert,
    setActiveCertId,
    certifications,
    activeTab,
    setActiveTab,
    notes,
    questionBanks,
    questions,
    examAttempts,
    setActiveExamAttempt,
    setActiveExamReviewAttempt,
  } = useApp();
  const { t } = useTranslation();

  const [isCertDropdownOpen, setIsCertDropdownOpen] = useState(false);

  if (!activeCert) return null;

  const certNotesCount = notes.filter((n) => n.certId === activeCert.id).length;
  const certBanksCount = questionBanks.filter((b) => b.certId === activeCert.id).length;
  const certQuestionsCount = questions.filter((q) => q.certId === activeCert.id).length;
  const certAttemptsCount = examAttempts.filter((a) => a.certId === activeCert.id).length;

  const handleTabChange = (tab: 'notes' | 'questionBanks' | 'mockExams') => {
    setActiveExamAttempt(null);
    setActiveExamReviewAttempt(null);
    setActiveTab(tab);
  };

  return (
    <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Top Control Bar: Back button, Cert Title & Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              id="workspace-back-home-btn"
              onClick={() => {
                setActiveExamAttempt(null);
                setActiveExamReviewAttempt(null);
                setActiveCertId(null);
              }}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors flex items-center space-x-1.5 text-xs font-semibold"
              title={t('app.backToHome')}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('app.backToHome')}</span>
            </button>

            {/* Certification Title & Quick Switch Dropdown */}
            <div className="relative">
              <button
                id="workspace-cert-switch-btn"
                onClick={() => setIsCertDropdownOpen(!isCertDropdownOpen)}
                className="flex items-center space-x-2 text-left p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: activeCert.color || '#f59e0b' }}
                >
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    {activeCert.code && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        {activeCert.code}
                      </span>
                    )}
                    <span className="font-extrabold text-stone-900 dark:text-white text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {activeCert.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Certification Quick Switcher Dropdown */}
              {isCertDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsCertDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                      {t('app.switchCert')}
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {certifications.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setActiveExamAttempt(null);
                            setActiveExamReviewAttempt(null);
                            setActiveCertId(c.id);
                            setIsCertDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 flex items-center space-x-2.5 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                            c.id === activeCert.id
                              ? 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                              : 'text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: c.color || '#f59e0b' }}
                          />
                          <div className="truncate text-xs">
                            <span className="font-semibold block truncate">
                              {c.code ? `[${c.code}] ${c.name}` : c.name}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {c.examDurationMinutes}m standard exam
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics pills */}
          <div className="flex items-center space-x-3 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800/60 px-2.5 py-1 rounded-lg border border-stone-200/60 dark:border-stone-800 font-mono">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{activeCert.examDurationMinutes} min</span>
              {activeCert.accommodationMinutes > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  +{activeCert.accommodationMinutes}m extra
                </span>
              )}
            </span>
            <span className="hidden md:inline font-mono">
              {certQuestionsCount} Qs across {certBanksCount} banks
            </span>
          </div>
        </div>

        {/* 3 Core Information Architecture Tabs */}
        <div className="flex space-x-2 border-b border-stone-200 dark:border-stone-800 -mb-5">
          <button
            id="tab-notes-btn"
            onClick={() => handleTabChange('notes')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/20 rounded-t-lg'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('workspace.notes')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              {certNotesCount}
            </span>
          </button>

          <button
            id="tab-banks-btn"
            onClick={() => handleTabChange('questionBanks')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'questionBanks'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/20 rounded-t-lg'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t('workspace.questionBanks')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              {certBanksCount} ({certQuestionsCount})
            </span>
          </button>

          <button
            id="tab-exams-btn"
            onClick={() => handleTabChange('mockExams')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'mockExams'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/20 rounded-t-lg'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>{t('workspace.mockExams')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              {certAttemptsCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
