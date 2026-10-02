import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  ExamFeedbackMode,
  MockExamConfigOptions,
  ExamAttempt,
  QuestionBank,
  InProgressExamSession,
} from '../../types';
import {
  PlayCircle,
  Clock,
  UserCheck,
  CheckCircle2,
  Sliders,
  Layers,
  HelpCircle,
  History,
  Award,
  AlertCircle,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import AttemptHistory from './AttemptHistory';
import InProgressExamsList from './InProgressExamsList';

interface MockExamConfigProps {
  onStartExam: (config: MockExamConfigOptions) => void;
  onResumeSession?: (session: InProgressExamSession) => void;
  onReviewAttempt: (attempt: ExamAttempt) => void;
}

export default function MockExamConfig({
  onStartExam,
  onResumeSession,
  onReviewAttempt,
}: MockExamConfigProps) {
  const {
    activeCert,
    getBanksForActiveCert,
    getQuestionsForActiveCert,
    getAttemptsForActiveCert,
    getInProgressSessionsForActiveCert,
    getAllInProgressSessions,
    settings,
  } = useApp();
  const { t } = useTranslation();

  const [activeSubTab, setActiveSubTab] = useState<'config' | 'in-progress' | 'history'>('config');

  const banks = getBanksForActiveCert();
  const allQuestions = getQuestionsForActiveCert();
  const pastAttempts = getAttemptsForActiveCert();
  const inProgressSessions = getInProgressSessionsForActiveCert();
  const allInProgressSessions = getAllInProgressSessions();

  // Configuration state
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [examDurationMinutes, setExamDurationMinutes] = useState<number>(
    activeCert?.examDurationMinutes || 120
  );
  const [feedbackMode, setFeedbackMode] = useState<ExamFeedbackMode>('instant-feedback');
  const [useTimer, setUseTimer] = useState<boolean>(settings.defaultUseTimer);
  const [useAccommodation, setUseAccommodation] = useState<boolean>(
    settings.defaultUseAccommodation && (activeCert?.accommodationMinutes || 0) > 0
  );

  // Group banks by author/instructor
  const groupedBanks = useMemo<Record<string, QuestionBank[]>>(() => {
    const groups: Record<string, QuestionBank[]> = {};
    banks.forEach((b) => {
      const author = b.authorOrVendor || 'Outros / Simulado Geral';
      if (!groups[author]) groups[author] = [];
      groups[author].push(b);
    });
    return groups;
  }, [banks]);

  // Initialize selected banks to all available
  useEffect(() => {
    if (banks.length > 0 && selectedBankIds.length === 0) {
      setSelectedBankIds(banks.map((b) => b.id));
    }
  }, [banks, selectedBankIds.length]);

  // Adjust questionCount taking into account selected banks and domainFilter
  const availableQuestionsCount = allQuestions.filter((q) => {
    const inBank = selectedBankIds.includes(q.bankId);
    const inDomain = selectedDomainFilter ? q.domainTag === selectedDomainFilter : true;
    return inBank && inDomain;
  }).length;

  useEffect(() => {
    if (availableQuestionsCount > 0 && questionCount > availableQuestionsCount) {
      setQuestionCount(availableQuestionsCount);
    } else if (availableQuestionsCount > 0 && questionCount === 0) {
      setQuestionCount(Math.min(10, availableQuestionsCount));
    }
  }, [availableQuestionsCount, questionCount]);

  if (!activeCert) return null;

  const handleToggleBank = (bankId: string) => {
    if (selectedBankIds.includes(bankId)) {
      if (selectedBankIds.length === 1) return; // keep at least one
      setSelectedBankIds(selectedBankIds.filter((id) => id !== bankId));
    } else {
      setSelectedBankIds([...selectedBankIds, bankId]);
    }
  };

  const handleSelectAllBanks = () => {
    setSelectedBankIds(banks.map((b) => b.id));
  };

  const handleSelectAuthorBanks = (author: string) => {
    const authorBankIds = (groupedBanks[author] || []).map((b) => b.id);
    const allSelected = authorBankIds.every((id) => selectedBankIds.includes(id));
    if (allSelected) {
      const remaining = selectedBankIds.filter((id) => !authorBankIds.includes(id));
      if (remaining.length > 0) {
        setSelectedBankIds(remaining);
      }
    } else {
      setSelectedBankIds(Array.from(new Set([...selectedBankIds, ...authorBankIds])));
    }
  };

  const handleLaunch = () => {
    if (availableQuestionsCount === 0) return;

    onStartExam({
      bankIds: selectedBankIds,
      questionCount: Math.min(questionCount, availableQuestionsCount),
      examDurationMinutes: Number(examDurationMinutes) || 120,
      feedbackMode,
      useTimer,
      useAccommodation: useAccommodation && (activeCert.accommodationMinutes > 0),
      domainFilter: selectedDomainFilter || undefined,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Title & Navigation Tabs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">
            {t('exam.title')}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {t('exam.subtitle')}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('config')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'config'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Configurar Simulado</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('in-progress')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'in-progress'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Simulados em Andamento</span>
            {allInProgressSessions.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSubTab === 'in-progress' ? 'bg-stone-900 text-amber-400' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
              }`}>
                {allInProgressSessions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <History className="w-3.5 h-3.5 text-stone-400" />
            <span>Histórico de Simulados</span>
            {pastAttempts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                {pastAttempts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SubTab 2: In-Progress Sessions View */}
      {activeSubTab === 'in-progress' && (
        <InProgressExamsList
          onResumeSession={(session) => {
            if (onResumeSession) onResumeSession(session);
          }}
        />
      )}

      {/* SubTab 3: Full History View */}
      {activeSubTab === 'history' && (
        <AttemptHistory onSelectAttempt={onReviewAttempt} isFullPage={true} />
      )}

      {/* SubTab 1: Config view */}
      {activeSubTab === 'config' && (
        <>
          {/* Notice if in-progress sessions exist */}
          {inProgressSessions.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-white block">
                    Você possui {inProgressSessions.length} simulado{inProgressSessions.length > 1 ? 's' : ''} pausado{inProgressSessions.length > 1 ? 's' : ''} nesta certificação
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Você pode retomar exatamente de onde parou a qualquer momento.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('in-progress')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Ver Simulados Pausados ({inProgressSessions.length})
              </button>
            </div>
          )}

          {allQuestions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  No questions available
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Create question banks and questions first before taking a mock exam.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Main Configuration Card (8 cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-6">
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>{t('exam.configTitle')}</span>
                </h3>

                {/* 1. Question Banks Selection Grouped by Instructor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                        {t('exam.selectBanks')}
                      </label>
                      <span className="text-[11px] text-stone-400 dark:text-stone-500">
                        Selecione um ou mais simulados de professores para compor o exame
                      </span>
                    </div>

                    {banks.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSelectAllBanks}
                        className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                      >
                        {selectedBankIds.length === banks.length ? 'Todos Selecionados' : 'Selecionar Todos'}
                      </button>
                    )}
                  </div>

                  {banks.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
                      Nenhum simulado cadastrado. Crie um simulado na aba "Simulados & Questões".
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(Object.entries(groupedBanks) as [string, QuestionBank[]][]).map(([author, authorBanks]) => {
                        const authorBankIds = authorBanks.map((b) => b.id);
                        const allAuthorSelected = authorBankIds.every((id) => selectedBankIds.includes(id));
                        const someAuthorSelected = authorBankIds.some((id) => selectedBankIds.includes(id));

                        return (
                          <div
                            key={author}
                            className="p-3.5 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                                {author} ({authorBanks.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSelectAuthorBanks(author)}
                                className="text-[11px] text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 font-medium"
                              >
                                {allAuthorSelected ? 'Desmarcar Instrutor' : 'Selecionar Todos'}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {authorBanks.map((bank) => {
                                const isSelected = selectedBankIds.includes(bank.id);
                                const countInBank = allQuestions.filter((q) => q.bankId === bank.id).length;

                                return (
                                  <div
                                    key={bank.id}
                                    id={`bank-select-${bank.id}`}
                                    onClick={() => handleToggleBank(bank.id)}
                                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between space-x-2 ${
                                      isSelected
                                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-600 dark:text-stone-400'
                                    }`}
                                  >
                                    <div className="space-y-0.5 truncate">
                                      <span className="block truncate">{bank.name}</span>
                                      <span className="text-[10px] text-stone-400 block">
                                        {countInBank} questões disponíveis
                                      </span>
                                    </div>
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                        isSelected
                                          ? 'bg-amber-500 border-amber-500 text-stone-950'
                                          : 'border-stone-300 dark:border-stone-700'
                                      }`}
                                    >
                                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Target Domain Filter (Optional) */}
                {activeCert.domains && activeCert.domains.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                      Filtro de Domínio Específico (Opcional)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDomainFilter(null)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          selectedDomainFilter === null
                            ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                        }`}
                      >
                        Todos os Domínios ({availableQuestionsCount})
                      </button>
                      {activeCert.domains.map((dom) => {
                        const inDomCount = allQuestions.filter(
                          (q) => selectedBankIds.includes(q.bankId) && q.domainTag === dom.name
                        ).length;

                        return (
                          <button
                            key={dom.name}
                            type="button"
                            onClick={() => setSelectedDomainFilter(dom.name)}
                            disabled={inDomCount === 0}
                            className={`px-3 py-1.5 rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                              selectedDomainFilter === dom.name
                                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                            }`}
                          >
                            {dom.name} ({inDomCount})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Number of Questions & Exam Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                      <span>{t('exam.questionCount')}</span>
                      <span className="text-stone-400 font-normal">
                        Máx: {availableQuestionsCount}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, availableQuestionsCount)}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      {t('exam.durationLabel')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={1}
                        max={360}
                        value={examDurationMinutes}
                        onChange={(e) => setExamDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                      />
                      <span className="text-xs text-stone-400 font-mono shrink-0">min</span>
                    </div>
                  </div>
                </div>

                {/* Feedback Mode Choice */}
                <div className="space-y-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {t('exam.feedbackMode')}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      id="mode-instant-btn"
                      onClick={() => setFeedbackMode('instant-feedback')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                        feedbackMode === 'instant-feedback'
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-white shadow-xs ring-1 ring-amber-500'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs flex items-center space-x-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('exam.modeInstant')}</span>
                        </span>
                        {feedbackMode === 'instant-feedback' && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                        {t('exam.modeInstantDesc')}
                      </p>
                    </div>

                    <div
                      id="mode-final-btn"
                      onClick={() => setFeedbackMode('final-review')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                        feedbackMode === 'final-review'
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-white shadow-xs ring-1 ring-amber-500'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs flex items-center space-x-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('exam.modeFinal')}</span>
                        </span>
                        {feedbackMode === 'final-review' && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                        {t('exam.modeFinalDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timer Settings & Accommodation */}
                <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {t('exam.timerSettings')}
                  </label>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800">
                    <div className="space-y-0.5 pr-3">
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                        {t('exam.useTimer')}
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                        {t('exam.useTimerDesc')}
                      </span>
                    </div>

                    <button
                      id="exam-timer-toggle"
                      type="button"
                      onClick={() => setUseTimer(!useTimer)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        useTimer ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                      }`}
                      role="switch"
                      aria-checked={useTimer}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          useTimer ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {activeCert.accommodationMinutes > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800">
                      <div className="space-y-0.5 pr-3">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                          <span>{t('exam.useAccommodation')}</span>
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                          {t('exam.accommodationDesc', { n: activeCert.accommodationMinutes })}
                        </span>
                      </div>

                      <button
                        id="exam-accommodation-toggle"
                        type="button"
                        onClick={() => setUseAccommodation(!useAccommodation)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          useAccommodation ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                        role="switch"
                        aria-checked={useAccommodation}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                            useAccommodation ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Launch Button */}
                <div className="pt-2">
                  <button
                    id="exam-launch-btn"
                    onClick={handleLaunch}
                    disabled={availableQuestionsCount === 0}
                    className="w-full py-3.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <PlayCircle className="w-5 h-5 text-amber-400 dark:text-amber-600" />
                    <span>
                      {t('exam.startExamBtn')} ({questionCount} Questões · {feedbackMode === 'instant-feedback' ? 'Instantâneo' : 'Revisão Final'})
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Column: Past Attempts List & Quick Summary (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <AttemptHistory onSelectAttempt={onReviewAttempt} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
