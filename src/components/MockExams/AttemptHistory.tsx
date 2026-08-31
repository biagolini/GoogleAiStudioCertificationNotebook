import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { ExamAttempt } from '../../types';
import {
  History,
  Award,
  Clock,
  ChevronRight,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';

interface AttemptHistoryProps {
  onSelectAttempt: (attempt: ExamAttempt) => void;
}

export default function AttemptHistory({ onSelectAttempt }: AttemptHistoryProps) {
  const { getAttemptsForActiveCert, deleteExamAttempt } = useApp();
  const { t } = useTranslation();

  const attempts = getAttemptsForActiveCert();

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center space-x-1.5">
          <History className="w-3.5 h-3.5 text-stone-400" />
          <span>{t('exam.historyTitle', { n: attempts.length })}</span>
        </h3>
      </div>

      {attempts.length === 0 ? (
        <div className="p-6 text-center text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
          {t('exam.noAttempts')}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {attempts.map((att) => {
            const isPassed = att.scorePercent >= 70;

            return (
              <div
                key={att.id}
                id={`attempt-item-${att.id}`}
                onClick={() => onSelectAttempt(att)}
                className="group p-3 rounded-xl border border-stone-200/90 dark:border-stone-800 hover:border-amber-500/60 dark:hover:border-amber-400/50 bg-stone-50/50 dark:bg-stone-800/30 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-extrabold font-mono ${
                        isPassed
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {att.scorePercent}%
                    </span>
                    <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
                      ({att.correctCount}/{att.totalQuestions})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this attempt record?')) {
                        deleteExamAttempt(att.id);
                      }
                    }}
                    className="p-1 text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400">
                  <span className="truncate">{formatDate(att.date)}</span>
                  <span className="font-mono">{formatDuration(att.totalTimeSpentSeconds)}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 pt-1 border-t border-stone-100 dark:border-stone-800">
                  <span className="capitalize">
                    {att.mode === 'instant-feedback' ? 'Instant' : 'Final Review'}
                    {att.useAccommodation ? ' (+extra)' : ''}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                    <span>Review</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
