import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  ExamFeedbackMode,
  MockExamConfigOptions,
  ExamAttempt,
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

interface MockExamConfigProps {
  onStartExam: (config: MockExamConfigOptions) => void;
  onReviewAttempt: (attempt: ExamAttempt) => void;
}

export default function MockExamConfig({ onStartExam, onReviewAttempt }: MockExamConfigProps) {
  const {
    activeCert,
    getBanksForActiveCert,
    getQuestionsForActiveCert,
    getAttemptsForActiveCert,
    settings,
  } = useApp();
  const { t } = useTranslation();

  const banks = getBanksForActiveCert();
  const allQuestions = getQuestionsForActiveCert();
  const pastAttempts = getAttemptsForActiveCert();

  // Configuration state
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [examDurationMinutes, setExamDurationMinutes] = useState<number>(
    activeCert?.examDurationMinutes || 120
  );
  const [feedbackMode, setFeedbackMode] = useState<ExamFeedbackMode>('instant-feedback');
  const [useTimer, setUseTimer] = useState<boolean>(settings.defaultUseTimer);
  const [useAccommodation, setUseAccommodation] = useState<boolean>(
    settings.defaultUseAccommodation && (activeCert?.accommodationMinutes || 0) > 0
  );

  // Initialize selected banks to all available
  useEffect(() => {
    if (banks.length > 0 && selectedBankIds.length === 0) {
      setSelectedBankIds(banks.map((b) => b.id));
    }
  }, [banks, selectedBankIds.length]);

  // Adjust questionCount if available questions change
  const availableQuestionsCount = allQuestions.filter((q) =>
    selectedBankIds.includes(q.bankId)
  ).length;

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

  const handleLaunch = () => {
    if (availableQuestionsCount === 0) return;

    onStartExam({
      bankIds: selectedBankIds,
      questionCount: Math.min(questionCount, availableQuestionsCount),
      examDurationMinutes: Number(examDurationMinutes) || 120,
      feedbackMode,
      useTimer,
      useAccommodation: useAccommodation && (activeCert.accommodationMinutes > 0),
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-in fade-in duration-150">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">
          {t('exam.title')}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          {t('exam.subtitle')}
        </p>
      </div>

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

            {/* 1. Question Banks Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {t('exam.selectBanks')}
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllBanks}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {t('exam.selectAllBanks')}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {banks.map((bank) => {
                  const count = allQuestions.filter((q) => q.bankId === bank.id).length;
                  const isChecked = selectedBankIds.includes(bank.id);

                  return (
                    <div
                      key={bank.id}
                      onClick={() => handleToggleBank(bank.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-stone-900 dark:text-white shadow-xs'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate pr-2">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-white ${
                            isChecked ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-700'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-xs font-semibold truncate">{bank.name}</span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 shrink-0">
                        {count} Qs
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                {t('exam.totalAvailable', { n: availableQuestionsCount })}
              </div>
            </div>

            {/* 2. Questions Count & Exam Duration (Editable per exam) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  {t('exam.questionCount')}
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    id="exam-qcount-slider"
                    type="range"
                    min="1"
                    max={Math.max(1, availableQuestionsCount)}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <input
                    id="exam-qcount-input"
                    type="number"
                    min="1"
                    max={Math.max(1, availableQuestionsCount)}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.min(availableQuestionsCount, Math.max(1, Number(e.target.value))))}
                    className="w-16 px-2.5 py-1 text-center font-mono font-bold text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  {t('exam.durationMinutes')}
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="exam-duration-input"
                    type="number"
                    min="5"
                    max="360"
                    value={examDurationMinutes}
                    onChange={(e) => setExamDurationMinutes(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-mono font-bold text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. Feedback Mode Choice (Section 3.2) */}
            <div className="space-y-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('exam.feedbackMode')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Instant Feedback Mode */}
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

                {/* Final Review Mode */}
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

            {/* 4. Timer Settings & Accommodation (Section 3.3 & Section 5.1) */}
            <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('exam.timerSettings')}
              </label>

              {/* Use Timer Toggle */}
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

              {/* Accommodation Toggle (Shown only if certification profile has extra time configured > 0) */}
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
                className="w-full py-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <PlayCircle className="w-5 h-5 text-amber-400 dark:text-amber-600" />
                <span>
                  {t('exam.startExamBtn')} ({questionCount} Qs · {feedbackMode === 'instant-feedback' ? 'Instant' : 'Final Review'})
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
    </div>
  );
}
