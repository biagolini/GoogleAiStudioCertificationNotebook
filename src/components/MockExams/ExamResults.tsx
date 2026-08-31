import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { ExamAttempt, Question, QuestionAttemptRecord } from '../../types';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  RotateCcw,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Sliders,
  MessageSquare,
  Highlighter,
  Strikethrough as StrikethroughIcon,
  AlertTriangle,
  HelpCircle,
  FileCode,
  Terminal,
} from 'lucide-react';
import AnnotatedText from './AnnotatedText';

interface ExamResultsProps {
  attempt: ExamAttempt;
  onBackToWorkspace: () => void;
  onRetake: () => void;
}

export default function ExamResults({
  attempt,
  onBackToWorkspace,
  onRetake,
}: ExamResultsProps) {
  const { activeCert, getQuestionsForActiveCert } = useApp();
  const { t } = useTranslation();

  const allQuestions = getQuestionsForActiveCert();

  // Review filter: 'all' | 'incorrect' | 'flagged' | 'overtime'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'flagged' | 'overtime'>('all');

  // Overtime comparison toggle (Section 5.4)
  const [showStoppedOnTimeScore, setShowStoppedOnTimeScore] = useState<boolean>(false);

  if (!activeCert) return null;

  const isPassed = attempt.scorePercent >= 70;
  const avgTimePerQuestionSeconds = Math.round(
    attempt.totalTimeSpentSeconds / Math.max(1, attempt.totalQuestions)
  );

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Domain / Topic Breakdown calculation
  const domainStats = React.useMemo(() => {
    const map: Record<string, { total: number; correct: number; totalTime: number }> = {};

    attempt.questionRecords.forEach((rec) => {
      const q = allQuestions.find((item) => item.id === rec.questionId);
      const tag = q?.domainTag || 'General';
      if (!map[tag]) {
        map[tag] = { total: 0, correct: 0, totalTime: 0 };
      }
      map[tag].total += 1;
      if (rec.isCorrect) map[tag].correct += 1;
      map[tag].totalTime += rec.timeSpentSeconds || 0;
    });

    return Object.entries(map).map(([tag, stat]) => ({
      tag,
      total: stat.total,
      correct: stat.correct,
      percent: Math.round((stat.correct / stat.total) * 100),
      avgTime: Math.round(stat.totalTime / stat.total),
    }));
  }, [attempt.questionRecords, allQuestions]);

  // Filtered review questions
  const filteredRecords = attempt.questionRecords.filter((rec) => {
    if (reviewFilter === 'incorrect') return !rec.isCorrect;
    if (reviewFilter === 'flagged') return rec.flagged;
    if (reviewFilter === 'overtime') return rec.isOvertime;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
        <button
          id="results-back-btn"
          onClick={onBackToWorkspace}
          className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors flex items-center space-x-1.5 text-xs font-semibold self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('results.backToWorkspace')}</span>
        </button>

        <button
          id="results-retake-btn"
          onClick={onRetake}
          className="flex items-center space-x-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('results.retakeExam')}</span>
        </button>
      </div>

      {/* 1. Score Summary Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Exam Summary · {activeCert.name}
            </span>
            <div className="flex items-baseline space-x-3">
              <h2 className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-white font-mono">
                {showStoppedOnTimeScore && attempt.stoppedOnTimeScore
                  ? `${attempt.stoppedOnTimeScore.scorePercent}%`
                  : `${attempt.scorePercent}%`}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide ${
                  (showStoppedOnTimeScore && attempt.stoppedOnTimeScore
                    ? attempt.stoppedOnTimeScore.scorePercent
                    : attempt.scorePercent) >= 70
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                }`}
              >
                {(showStoppedOnTimeScore && attempt.stoppedOnTimeScore
                  ? attempt.stoppedOnTimeScore.scorePercent
                  : attempt.scorePercent) >= 70
                  ? t('results.passed')
                  : t('results.needsReview')}
              </span>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              {showStoppedOnTimeScore && attempt.stoppedOnTimeScore
                ? `${attempt.stoppedOnTimeScore.correctCount} of ${attempt.totalQuestions} questions correct (before time limit)`
                : `${attempt.correctCount} of ${attempt.totalQuestions} questions correct`}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 font-mono text-xs">
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-1">
              <span className="text-stone-400 text-[11px] block">{t('results.totalTime')}</span>
              <span className="font-bold text-stone-900 dark:text-white text-sm">
                {formatSeconds(attempt.totalTimeSpentSeconds)}
              </span>
            </div>

            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-1">
              <span className="text-stone-400 text-[11px] block">{t('results.avgTimePerQuestion')}</span>
              <span className="font-bold text-stone-900 dark:text-white text-sm">
                {formatSeconds(avgTimePerQuestionSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Overtime Comparison Toggle (Section 5.4) */}
        {attempt.stoppedOnTimeScore && (
          <div className="p-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Overtime Occurred During Exam</span>
              </span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                You continued answering questions after the exam timer expired. Compare your real-time paced performance.
              </p>
            </div>

            <button
              id="results-stopped-on-time-toggle"
              type="button"
              onClick={() => setShowStoppedOnTimeScore(!showStoppedOnTimeScore)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all shrink-0 ${
                showStoppedOnTimeScore
                  ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                  : 'bg-white dark:bg-stone-900 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-stone-800'
              }`}
            >
              {t('results.stoppedOnTimeScore')}
            </button>
          </div>
        )}
      </div>

      {/* 2. Domain / Topic Breakdown (Section 3.5 & Section 10) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-stone-900 dark:text-white flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <span>{t('results.domainBreakdown')}</span>
        </h3>

        <div className="space-y-3">
          {domainStats.map((dom) => (
            <div key={dom.tag} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-800 dark:text-stone-200">{dom.tag}</span>
                <div className="flex items-center space-x-3 text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                  <span>Avg: {formatSeconds(dom.avgTime)}/Q</span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    {dom.correct}/{dom.total} ({dom.percent}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    dom.percent >= 70
                      ? 'bg-emerald-500'
                      : dom.percent >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(4, dom.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Full Question Review (Section 3.5 & Section 6.3) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
            {t('results.fullReview')}
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                reviewFilter === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              {t('results.filterAll')} ({attempt.questionRecords.length})
            </button>
            <button
              onClick={() => setReviewFilter('incorrect')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                reviewFilter === 'incorrect'
                  ? 'bg-rose-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              {t('results.filterIncorrect')} (
              {attempt.questionRecords.filter((r) => !r.isCorrect).length})
            </button>
            <button
              onClick={() => setReviewFilter('flagged')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                reviewFilter === 'flagged'
                  ? 'bg-amber-500 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              {t('results.filterFlagged')} (
              {attempt.questionRecords.filter((r) => r.flagged).length})
            </button>
          </div>
        </div>

        {/* Questions Detailed Cards */}
        <div className="space-y-4">
          {filteredRecords.map((rec, index) => {
            const q = allQuestions.find((item) => item.id === rec.questionId);
            if (!q) return null;

            return (
              <div
                key={rec.questionId}
                id={`review-q-${rec.questionId}`}
                className={`p-6 rounded-2xl border bg-white dark:bg-stone-900 space-y-4 transition-colors ${
                  rec.isCorrect
                    ? 'border-emerald-200/80 dark:border-emerald-950/60'
                    : 'border-rose-200/80 dark:border-rose-950/60'
                }`}
              >
                {/* Review Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-extrabold flex items-center space-x-1 ${
                        rec.isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {rec.isCorrect ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Question #{index + 1}</span>
                    </span>

                    {q.domainTag && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {q.domainTag}
                      </span>
                    )}

                    {rec.flagged && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center space-x-1">
                        <Flag className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Flagged</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-stone-400">
                    Spent: {formatSeconds(rec.timeSpentSeconds || 0)}
                  </span>
                </div>

                {/* Prompt with preserved annotations */}
                <AnnotatedText
                  idPrefix={`review-${rec.questionId}`}
                  field="prompt"
                  text={q.prompt}
                  annotations={rec.annotations}
                  isReviewOnly={true}
                  className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-relaxed font-sans"
                />

                {/* Scenario details if any */}
                {q.type === 'scenario' && q.scenarioDetails?.codeSnippet && (
                  <div className="p-3 bg-stone-950 rounded-xl font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed border border-stone-800">
                    <pre>{q.scenarioDetails.codeSnippet}</pre>
                  </div>
                )}

                {/* Options Review with Student Answer vs Correct Answer */}
                {q.type !== 'flashcard' && q.options && (
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isUserSelected = rec.selectedOptionIds.includes(opt.id);
                      const isOptCorrect = opt.isCorrect;
                      const letter = String.fromCharCode(65 + optIdx);

                      let style =
                        'border-stone-100 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-800/20 text-stone-600 dark:text-stone-400';

                      if (isOptCorrect && isUserSelected) {
                        style =
                          'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold';
                      } else if (isOptCorrect && !isUserSelected) {
                        style =
                          'border-emerald-400/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 border-dashed';
                      } else if (!isOptCorrect && isUserSelected) {
                        style =
                          'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 font-semibold';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-start space-x-3 text-xs leading-relaxed ${style}`}
                        >
                          <span className="font-mono font-bold shrink-0">{letter}.</span>
                          <div className="flex-1">
                            <AnnotatedText
                              idPrefix={`review-${rec.questionId}`}
                              field={`option-${opt.id}`}
                              text={opt.text}
                              annotations={rec.annotations}
                              isReviewOnly={true}
                            />
                          </div>
                          {isUserSelected && (
                            <span className="text-[10px] font-bold uppercase tracking-tight shrink-0 px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-700">
                              Your Answer
                            </span>
                          )}
                          {isOptCorrect && (
                            <span className="text-[10px] font-bold uppercase tracking-tight shrink-0 px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                              Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Flashcard Solution */}
                {q.type === 'flashcard' && q.flashcard && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                      Target Solution / Command:
                    </span>
                    <p className="font-mono text-emerald-950 dark:text-emerald-100 font-semibold">
                      {q.flashcard.backAnswer}
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl text-xs text-stone-700 dark:text-stone-300 space-y-1 border border-stone-100 dark:border-stone-800">
                    <span className="font-bold block text-stone-900 dark:text-stone-100">
                      Explanation & Rationale:
                    </span>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                )}

                {/* Preserved Question Note (Section 6.2 & 6.3) */}
                {rec.noteText && (
                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                    <span className="font-bold flex items-center space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Your Exam Note:</span>
                    </span>
                    <p className="leading-relaxed">{rec.noteText}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
