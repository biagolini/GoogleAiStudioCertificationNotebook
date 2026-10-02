import React, { useState } from 'react';
import { Question, QuestionAttemptRecord } from '../../types';
import {
  X,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ArrowRight,
  ListFilter,
  Check,
  Circle,
  HelpCircle,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

interface ItemNavigatorProps {
  questions: Question[];
  records: Record<string, QuestionAttemptRecord>;
  currentIndex: number;
  perQuestionBudgetSeconds: number;
  feedbackMode: 'instant-feedback' | 'final-review';
  onSelectIndex: (index: number) => void;
  onFinishExam: () => void;
  isOpen: boolean;
  onClose: () => void;
  isDocked?: boolean;
  onToggleDock?: () => void;
}

export default function ItemNavigator({
  questions,
  records,
  currentIndex,
  perQuestionBudgetSeconds,
  feedbackMode,
  onSelectIndex,
  onFinishExam,
  isOpen,
  onClose,
  isDocked = false,
  onToggleDock,
}: ItemNavigatorProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'flagged' | 'answered'>('all');

  const totalQuestions = questions.length;

  // Calculate status counts
  const allRecords = Object.values(records);
  const answeredCount = questions.filter((q) => {
    const rec = records[q.id];
    if (!rec) return false;
    return rec.selectedOptionIds.length > 0 || rec.flashcardSelfRating !== 'unrated' || Boolean(rec.userTextAnswer);
  }).length;

  const flaggedCount = questions.filter((q) => records[q.id]?.flagged).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Filter questions list
  const filteredQuestionIndices = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => {
      const rec = records[q.id];
      const isAnswered =
        rec &&
        (rec.selectedOptionIds.length > 0 ||
          rec.flashcardSelfRating !== 'unrated' ||
          Boolean(rec.userTextAnswer));

      if (filter === 'unanswered') return !isAnswered;
      if (filter === 'answered') return isAnswered;
      if (filter === 'flagged') return rec?.flagged;
      return true;
    });

  // Find next unanswered index
  const nextUnansweredIndex = questions.findIndex((q, idx) => {
    if (idx <= currentIndex) return false;
    const rec = records[q.id];
    return !rec || (rec.selectedOptionIds.length === 0 && rec.flashcardSelfRating === 'unrated' && !rec.userTextAnswer);
  });

  const fallbackUnansweredIndex =
    nextUnansweredIndex !== -1
      ? nextUnansweredIndex
      : questions.findIndex((q) => {
          const rec = records[q.id];
          return !rec || (rec.selectedOptionIds.length === 0 && rec.flashcardSelfRating === 'unrated' && !rec.userTextAnswer);
        });

  if (!isOpen) return null;

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-xl w-80 max-w-full">
      {/* Navigator Header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-850/50">
        <div className="flex items-center space-x-2">
          <ListFilter className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
            Item Navigator
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 font-bold text-stone-600 dark:text-stone-400">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {onToggleDock && (
            <button
              onClick={onToggleDock}
              className="text-[10px] font-bold px-2 py-1 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors hidden lg:inline-block"
              title={isDocked ? 'Undock Navigator' : 'Dock Navigator'}
            >
              {isDocked ? 'Undock' : 'Dock'}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            title="Close Navigator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-1.5 p-3 border-b border-stone-100 dark:border-stone-800 text-center bg-stone-50/40 dark:bg-stone-900">
        <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
          <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 block">
            {answeredCount}
          </span>
          <span className="text-[9px] uppercase font-bold text-emerald-600/80 dark:text-emerald-400/80">
            Respondidas
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
          <span className="text-xs font-black text-stone-700 dark:text-stone-300 block">
            {unansweredCount}
          </span>
          <span className="text-[9px] uppercase font-bold text-stone-500">
            Pendentes
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
          <span className="text-xs font-black text-amber-700 dark:text-amber-300 block">
            {flaggedCount}
          </span>
          <span className="text-[9px] uppercase font-bold text-amber-600/80 dark:text-amber-400/80">
            Marcadas
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center px-3 pt-2.5 pb-1 space-x-1 overflow-x-auto text-[11px] font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
              : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Todas ({totalQuestions})
        </button>
        <button
          onClick={() => setFilter('unanswered')}
          className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
            filter === 'unanswered'
              ? 'bg-amber-500 text-white'
              : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Pendentes ({unansweredCount})
        </button>
        <button
          onClick={() => setFilter('flagged')}
          className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
            filter === 'flagged'
              ? 'bg-amber-600 text-white'
              : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Marcadas ({flaggedCount})
        </button>
      </div>

      {/* Questions Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {filteredQuestionIndices.map(({ q, idx }) => {
            const rec = records[q.id];
            const isCurrent = idx === currentIndex;
            const isAnswered =
              rec &&
              (rec.selectedOptionIds.length > 0 ||
                rec.flashcardSelfRating !== 'unrated' ||
                Boolean(rec.userTextAnswer));
            const isFlagged = rec?.flagged;
            const isOvertime = rec?.isOvertime;

            // In instant feedback mode, show correctness
            const showInstantResult = feedbackMode === 'instant-feedback' && isAnswered;
            const isCorrect = rec?.isCorrect;

            let buttonStyle = 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700/60';

            if (isCurrent) {
              buttonStyle = 'bg-amber-500 text-white font-black shadow-sm ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-stone-900 border-amber-500';
            } else if (showInstantResult) {
              if (isCorrect) {
                buttonStyle = 'bg-emerald-500 text-white font-bold border-emerald-600';
              } else {
                buttonStyle = 'bg-rose-500 text-white font-bold border-rose-600';
              }
            } else if (isAnswered) {
              buttonStyle = 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-bold border-transparent';
            }

            return (
              <button
                key={q.id}
                id={`item-nav-btn-${idx + 1}`}
                onClick={() => {
                  onSelectIndex(idx);
                  if (!isDocked) onClose();
                }}
                className={`relative h-11 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition-all ${buttonStyle}`}
                title={`Questão ${idx + 1} ${isAnswered ? '(Respondida)' : '(Pendente)'}${isFlagged ? ' - Marcada com bandeira' : ''}`}
              >
                <span>{idx + 1}</span>

                {/* Overtime indicator */}
                {isOvertime && (
                  <span
                    className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-stone-900"
                    title="Tempo excedido nesta questão"
                  />
                )}

                {/* Flag indicator */}
                {isFlagged && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-xs"
                    title="Marcada para revisão"
                  >
                    <Flag className="w-2 h-2 fill-stone-950" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {filteredQuestionIndices.length === 0 && (
          <div className="py-8 text-center text-xs text-stone-400">
            Nenhuma questão encontrada neste filtro.
          </div>
        )}
      </div>

      {/* Legend & Quick Actions */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/50 space-y-2.5">
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-stone-800 dark:bg-stone-200 inline-block" />
            <span>Respondida</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-stone-200 dark:bg-stone-800 inline-block border border-stone-300 dark:border-stone-700" />
            <span>Pendente</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-amber-500 inline-block" />
            <span>Atual</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Marcada (Flag)</span>
          </div>
        </div>

        <div className="pt-1 space-y-1.5">
          {fallbackUnansweredIndex !== -1 && (
            <button
              onClick={() => {
                onSelectIndex(fallbackUnansweredIndex);
                if (!isDocked) onClose();
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Ir para próxima pendente (#{fallbackUnansweredIndex + 1})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              if (!isDocked) onClose();
              onFinishExam();
            }}
            className="w-full py-2 px-3 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finalizar Prova</span>
          </button>
        </div>
      </div>
    </div>
  );

  // If docked, render inline container
  if (isDocked) {
    return <div className="h-full shrink-0 hidden lg:block">{content}</div>;
  }

  // Slide-over drawer modal
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="h-full flex max-w-full pl-10" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
