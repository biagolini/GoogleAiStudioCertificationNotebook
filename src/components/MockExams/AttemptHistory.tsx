import React, { useState } from 'react';
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
  HelpCircle,
  Zap,
  Filter,
} from 'lucide-react';

interface AttemptHistoryProps {
  onSelectAttempt: (attempt: ExamAttempt) => void;
  isFullPage?: boolean;
}

export default function AttemptHistory({ onSelectAttempt, isFullPage = false }: AttemptHistoryProps) {
  const { getAttemptsForActiveCert, deleteExamAttempt } = useApp();
  const { t } = useTranslation();

  const attempts = getAttemptsForActiveCert();
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

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

  const filteredAttempts = attempts.filter((att) => {
    if (filter === 'passed') return att.scorePercent >= 70;
    if (filter === 'failed') return att.scorePercent < 70;
    return true;
  });

  return (
    <div className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4 ${isFullPage ? 'max-w-4xl mx-auto' : ''}`}>
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center space-x-1.5">
          <History className="w-3.5 h-3.5 text-stone-400" />
          <span>{t('exam.historyTitle', { n: attempts.length })}</span>
        </h3>

        {attempts.length > 2 && (
          <div className="flex items-center space-x-1 text-[11px]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                filter === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilter('passed')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                filter === 'passed'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-400 hover:text-emerald-600'
              }`}
            >
              Aprovados
            </button>
            <button
              type="button"
              onClick={() => setFilter('failed')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                filter === 'failed'
                  ? 'bg-rose-600 text-white'
                  : 'text-stone-400 hover:text-rose-600'
              }`}
            >
              Revisar
            </button>
          </div>
        )}
      </div>

      {attempts.length === 0 ? (
        <div className="p-8 text-center text-xs text-stone-400 dark:text-stone-500 leading-relaxed space-y-2">
          <History className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
          <p>{t('exam.noAttempts')}</p>
          <p className="text-[11px] text-stone-400">
            Finalize qualquer simulado para gerar gabarito, análise de tempo e estatísticas.
          </p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="p-6 text-center text-xs text-stone-400">
          Nenhum simulado encontrado com o filtro selecionado.
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredAttempts.map((att) => {
            const isPassed = att.scorePercent >= 70;
            const records = att.questionRecords || [];
            const answeredCount = records.filter(
              (r) => r.selectedOptionIds?.length > 0 || r.flashcardSelfRating !== 'unrated' || (r.userTextAnswer && r.userTextAnswer.trim())
            ).length;
            const unansweredCount = Math.max(0, att.totalQuestions - answeredCount);
            const incorrectCount = Math.max(0, answeredCount - att.correctCount);

            return (
              <div
                key={att.id}
                id={`attempt-item-${att.id}`}
                onClick={() => onSelectAttempt(att)}
                className="group p-4 rounded-xl border border-stone-200/90 dark:border-stone-800 hover:border-amber-500/60 dark:hover:border-amber-400/50 bg-stone-50/50 dark:bg-stone-800/30 transition-all cursor-pointer space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono tracking-tight ${
                        isPassed
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {att.scorePercent}%
                    </span>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {isPassed ? 'Aprovado' : 'Não Atingiu a Meta'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-stone-400 dark:text-stone-500">
                      {formatDate(att.date)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Deseja excluir permanentemente este registro de simulado?')) {
                          deleteExamAttempt(att.id);
                        }
                      }}
                      className="p-1 text-stone-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Score & Answer Counts */}
                <div className="grid grid-cols-3 gap-2 text-[11px] py-1 bg-white/70 dark:bg-stone-900/60 p-2 rounded-lg border border-stone-100 dark:border-stone-800 font-mono">
                  <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{att.correctCount} certas</span>
                  </div>
                  <div className="flex items-center space-x-1 text-rose-600 dark:text-rose-400">
                    <XCircle className="w-3 h-3" />
                    <span>{incorrectCount} erradas</span>
                  </div>
                  <div className="flex items-center space-x-1 text-stone-400 dark:text-stone-500">
                    <HelpCircle className="w-3 h-3" />
                    <span>{unansweredCount} em branco</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span className="font-mono">{formatDuration(att.totalTimeSpentSeconds)}</span>
                    <span>·</span>
                    <span className="capitalize">
                      {att.mode === 'instant-feedback' ? 'Instantâneo' : 'Revisão Final'}
                    </span>
                  </div>

                  <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                    <span>Revisar Prova</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
