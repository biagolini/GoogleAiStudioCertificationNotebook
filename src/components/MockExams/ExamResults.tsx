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
  Sparkles,
  ZoomIn,
  AlertCircle,
  Layers,
} from 'lucide-react';
import AnnotatedText from './AnnotatedText';
import GeminiQuestionModal from '../Gemini/GeminiQuestionModal';
import ImageModal from './ImageModal';

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

  // Review filter: 'all' | 'correct' | 'incorrect' | 'unanswered' | 'flagged' | 'overtime'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered' | 'flagged' | 'overtime'>('all');
  const [activeModalImage, setActiveModalImage] = useState<{
    url: string;
    altText?: string;
    caption?: string;
  } | null>(null);

  // Overtime comparison toggle
  const [showStoppedOnTimeScore, setShowStoppedOnTimeScore] = useState<boolean>(false);

  // Gemini question tutor modal during exam review
  const [geminiReviewModal, setGeminiReviewModal] = useState<{
    question: Question;
    userSelectedIds: string[];
  } | null>(null);

  if (!activeCert) return null;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Helper to determine if student answered a question
  const isRecordAnswered = (rec: QuestionAttemptRecord) => {
    return (
      (rec.selectedOptionIds && rec.selectedOptionIds.length > 0) ||
      Boolean(rec.userTextAnswer && rec.userTextAnswer.trim().length > 0) ||
      (rec.flashcardSelfRating && rec.flashcardSelfRating !== 'unrated')
    );
  };

  const totalQuestions = attempt.totalQuestions;
  const correctRecords = attempt.questionRecords.filter((r) => r.isCorrect);
  const answeredRecords = attempt.questionRecords.filter(isRecordAnswered);
  const unansweredRecords = attempt.questionRecords.filter((r) => !isRecordAnswered(r));
  const incorrectRecords = attempt.questionRecords.filter((r) => !r.isCorrect && isRecordAnswered(r));

  const isPassed = attempt.scorePercent >= 70;
  const avgTimePerQuestionSeconds = Math.round(
    attempt.totalTimeSpentSeconds / Math.max(1, totalQuestions)
  );

  // Domain / Topic Breakdown calculation
  const domainStats = React.useMemo(() => {
    const map: Record<string, { total: number; correct: number; unanswered: number; totalTime: number }> = {};

    attempt.questionRecords.forEach((rec) => {
      const q = allQuestions.find((item) => item.id === rec.questionId);
      const tag = q?.domainTag || 'General';
      if (!map[tag]) {
        map[tag] = { total: 0, correct: 0, unanswered: 0, totalTime: 0 };
      }
      map[tag].total += 1;
      if (rec.isCorrect) map[tag].correct += 1;
      if (!isRecordAnswered(rec)) map[tag].unanswered += 1;
      map[tag].totalTime += rec.timeSpentSeconds || 0;
    });

    return Object.entries(map).map(([tag, stat]) => ({
      tag,
      total: stat.total,
      correct: stat.correct,
      unanswered: stat.unanswered,
      incorrect: Math.max(0, stat.total - stat.correct - stat.unanswered),
      percent: Math.round((stat.correct / Math.max(1, stat.total)) * 100),
      totalTime: stat.totalTime,
      avgTime: Math.round(stat.totalTime / Math.max(1, stat.total)),
    }));
  }, [attempt.questionRecords, allQuestions]);

  // Filtered review questions
  const filteredRecords = attempt.questionRecords.filter((rec) => {
    if (reviewFilter === 'correct') return rec.isCorrect;
    if (reviewFilter === 'incorrect') return !rec.isCorrect && isRecordAnswered(rec);
    if (reviewFilter === 'unanswered') return !isRecordAnswered(rec);
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
          className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors flex items-center space-x-1.5 text-xs font-semibold self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('results.backToWorkspace')}</span>
        </button>

        <div className="flex items-center space-x-2.5">
          <button
            id="results-retake-btn"
            onClick={onRetake}
            className="flex items-center space-x-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('results.retakeExam')}</span>
          </button>
        </div>
      </div>

      {/* 1. Score Summary Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Relatório do Simulado · {activeCert.name}
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
                ? `${attempt.stoppedOnTimeScore.correctCount} de ${totalQuestions} questões corretas (antes do limite de tempo)`
                : `${attempt.correctCount} de ${totalQuestions} questões corretas no exame`}
            </p>
          </div>

          {/* Quick Metrics KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
              <span className="text-emerald-700 dark:text-emerald-300 text-[11px] block font-sans font-semibold">
                Corretas
              </span>
              <span className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">
                {correctRecords.length}
              </span>
            </div>

            <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/40 space-y-1">
              <span className="text-rose-700 dark:text-rose-300 text-[11px] block font-sans font-semibold">
                Incorretas
              </span>
              <span className="font-bold text-rose-800 dark:text-rose-200 text-sm">
                {incorrectRecords.length}
              </span>
            </div>

            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-1">
              <span className="text-amber-800 dark:text-amber-300 text-[11px] block font-sans font-semibold">
                Em Branco
              </span>
              <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                {unansweredRecords.length}
              </span>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-1">
              <span className="text-stone-400 text-[11px] block font-sans font-semibold">
                Tempo Total
              </span>
              <span className="font-bold text-stone-900 dark:text-white text-sm">
                {formatSeconds(attempt.totalTimeSpentSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Overtime comparison banner if applicable */}
        {attempt.stoppedOnTimeScore && (
          <div className="p-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Tempo Excedido Durante a Prova</span>
              </span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Você continuou respondendo questões após o cronômetro oficial do exame zerar. Compare sua nota com o tempo exato de prova.
              </p>
            </div>

            <button
              id="results-stopped-on-time-toggle"
              type="button"
              onClick={() => setShowStoppedOnTimeScore(!showStoppedOnTimeScore)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all shrink-0 cursor-pointer ${
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

      {/* 2. Domain / Topic Breakdown & Average Times */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <h3 className="text-sm font-extrabold text-stone-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>Desempenho e Tempo Médio por Domínio da Prova</span>
          </h3>

          <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
            Média Geral do Exame: <strong>{formatSeconds(avgTimePerQuestionSeconds)}/questão</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {domainStats.map((dom) => (
            <div
              key={dom.tag}
              className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/20 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {dom.tag}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-stone-200/70 dark:bg-stone-700 text-stone-800 dark:text-stone-200">
                  {dom.correct}/{dom.total} ({dom.percent}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
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

              {/* Domain Duration Breakdown */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/60 dark:border-stone-800/80">
                <div className="flex items-center space-x-1.5 text-stone-500 dark:text-stone-400">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tempo Médio:</span>
                  <strong className="text-stone-900 dark:text-white font-mono">
                    {formatSeconds(dom.avgTime)}/questão
                  </strong>
                </div>

                <div className="text-stone-400 font-mono">
                  Total: {formatSeconds(dom.totalTime)}
                </div>
              </div>

              {/* Sub-counts: correct, incorrect, unanswered */}
              <div className="flex items-center space-x-3 text-[10px] font-mono text-stone-500 dark:text-stone-400">
                <span className="text-emerald-600 dark:text-emerald-400">
                  ✓ {dom.correct} certas
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  ✗ {dom.incorrect} erradas
                </span>
                {dom.unanswered > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    ? {dom.unanswered} em branco
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Full Question Review */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
              {t('results.fullReview')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Revise suas respostas, tempo gasto em cada item e justificativas oficiais.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                reviewFilter === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              Todas ({attempt.questionRecords.length})
            </button>

            <button
              onClick={() => setReviewFilter('correct')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                reviewFilter === 'correct'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              Corretas ({correctRecords.length})
            </button>

            <button
              onClick={() => setReviewFilter('incorrect')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                reviewFilter === 'incorrect'
                  ? 'bg-rose-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              Incorretas ({incorrectRecords.length})
            </button>

            <button
              onClick={() => setReviewFilter('unanswered')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                reviewFilter === 'unanswered'
                  ? 'bg-amber-500 text-stone-950 font-black'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              Não Respondidas ({unansweredRecords.length})
            </button>

            <button
              onClick={() => setReviewFilter('flagged')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                reviewFilter === 'flagged'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              Marcadas ({attempt.questionRecords.filter((r) => r.flagged).length})
            </button>
          </div>
        </div>

        {/* Questions Detailed Cards */}
        <div className="space-y-4">
          {filteredRecords.map((rec, index) => {
            const q = allQuestions.find((item) => item.id === rec.questionId);
            if (!q) return null;

            const isAnswered = isRecordAnswered(rec);

            let cardBorder = 'border-stone-200 dark:border-stone-800';
            if (!isAnswered) {
              cardBorder = 'border-amber-300 dark:border-amber-800/80 bg-amber-50/15 dark:bg-amber-950/10';
            } else if (rec.isCorrect) {
              cardBorder = 'border-emerald-200/80 dark:border-emerald-950/60 bg-white dark:bg-stone-900';
            } else {
              cardBorder = 'border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-stone-900';
            }

            return (
              <div
                key={rec.questionId}
                id={`review-q-${rec.questionId}`}
                className={`p-6 rounded-2xl border space-y-4 transition-colors ${cardBorder}`}
              >
                {/* Review Question Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {!isAnswered ? (
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center space-x-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Questão #{index + 1} · Não Respondida (Em branco)</span>
                      </span>
                    ) : rec.isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Questão #{index + 1} · Correta</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Questão #{index + 1} · Incorreta</span>
                      </span>
                    )}

                    {q.domainTag && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {q.domainTag}
                      </span>
                    )}

                    {rec.flagged && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center space-x-1">
                        <Flag className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Marcada (Flag)</span>
                      </span>
                    )}
                  </div>

                  {/* Registered Time on this question */}
                  <div className="flex items-center space-x-2 font-mono text-xs self-start sm:self-auto">
                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        Duração: <strong>{formatSeconds(rec.timeSpentSeconds || 0)}</strong>
                      </span>
                    </div>

                    {rec.isOvertime && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        Tempo Excedido
                      </span>
                    )}
                  </div>
                </div>

                {/* Unanswered Notice Banner */}
                {!isAnswered && (
                  <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      Você finalizou o exame sem selecionar uma resposta para esta questão. Veja abaixo o gabarito oficial com a alternativa correta e a explicação.
                    </span>
                  </div>
                )}

                {/* Prompt with preserved annotations */}
                <AnnotatedText
                  idPrefix={`review-${rec.questionId}`}
                  field="prompt"
                  text={q.prompt}
                  annotations={rec.annotations}
                  isReviewOnly={true}
                  className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-relaxed font-sans"
                />

                {/* Prompt Image if present */}
                {q.imageUrl && (
                  <div className="pt-1">
                    <div
                      onClick={() =>
                        setActiveModalImage({
                          url: q.imageUrl!,
                          altText: `Diagrama da Questão #${index + 1}`,
                          caption: 'Imagem do enunciado',
                        })
                      }
                      className="group relative cursor-pointer rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 p-1.5 hover:border-amber-500 transition-colors inline-block"
                    >
                      <img
                        src={q.imageUrl}
                        alt="Diagrama da Questão"
                        className="max-h-56 w-auto object-contain rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold space-x-1 rounded-lg">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Ampliar</span>
                      </div>
                    </div>
                  </div>
                )}

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
                          className={`p-3.5 rounded-xl border space-y-2 text-xs leading-relaxed ${style}`}
                        >
                          <div className="flex items-start space-x-3">
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
                                Sua Resposta
                              </span>
                            )}
                            {isOptCorrect && (
                              <span className="text-[10px] font-bold uppercase tracking-tight shrink-0 px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                                Correta
                              </span>
                            )}
                          </div>

                          {/* Option Image */}
                          {opt.imageUrl && (
                            <div className="pl-6">
                              <div
                                onClick={() =>
                                  setActiveModalImage({
                                    url: opt.imageUrl!,
                                    altText: `Imagem da Alternativa ${letter}`,
                                  })
                                }
                                className="cursor-pointer inline-block rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-1"
                              >
                                <img
                                  src={opt.imageUrl}
                                  alt={`Alternativa ${letter}`}
                                  className="max-h-36 w-auto object-contain rounded"
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          )}

                          {/* Option Specific Comment / Explanation */}
                          {(opt.comment || opt.explanation) && (
                            <div className="pl-6 pt-1 text-[11px] text-stone-600 dark:text-stone-300 bg-stone-100/60 dark:bg-stone-900/50 p-2.5 rounded-lg border border-stone-200/50 dark:border-stone-800 space-y-1">
                              <div className="flex items-center space-x-1 font-bold text-stone-700 dark:text-stone-200">
                                <MessageSquare className="w-3 h-3 text-amber-500" />
                                <span>Comentário da Alternativa {letter}:</span>
                              </div>
                              <p className="leading-relaxed">{opt.comment || opt.explanation}</p>
                              {opt.commentImageUrl && (
                                <div
                                  onClick={() =>
                                    setActiveModalImage({
                                      url: opt.commentImageUrl!,
                                      caption: `Imagem do comentário da alternativa ${letter}`,
                                    })
                                  }
                                  className="cursor-pointer inline-block rounded overflow-hidden border border-stone-200 dark:border-stone-700 mt-1"
                                >
                                  <img
                                    src={opt.commentImageUrl}
                                    alt="Comentário"
                                    className="max-h-28 w-auto object-contain"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Free Text Scenario Response Review */}
                {q.type === 'scenario' && q.expectedFreeText && (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-stone-500 text-[10px] uppercase block">
                        Sua Resposta:
                      </span>
                      <p className="font-mono text-stone-800 dark:text-stone-200 mt-0.5">
                        {rec.userTextAnswer || '(Nenhuma resposta fornecida)'}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-600 text-[10px] uppercase block">
                        Resposta Esperada:
                      </span>
                      <p className="font-mono text-emerald-800 dark:text-emerald-300 mt-0.5">
                        {q.expectedFreeText}
                      </p>
                    </div>
                  </div>
                )}

                {/* General Question Explanation / Rationale */}
                {q.explanation && (
                  <div className="p-4 bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-2 text-xs">
                    <span className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center space-x-1.5 uppercase text-[11px] tracking-wide">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('results.explanation')}</span>
                    </span>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                      {q.explanation}
                    </p>

                    {/* Explanation Image */}
                    {q.explanationImageUrl && (
                      <div className="pt-2">
                        <div
                          onClick={() =>
                            setActiveModalImage({
                              url: q.explanationImageUrl!,
                              altText: 'Diagrama da Explicação Geral',
                              caption: 'Diagrama explicativo da questão',
                            })
                          }
                          className="cursor-pointer inline-block rounded-xl overflow-hidden border border-amber-300/60 dark:border-amber-800 bg-white dark:bg-stone-900 p-1 hover:border-amber-500 transition-colors"
                        >
                          <img
                            src={q.explanationImageUrl}
                            alt="Explicação"
                            className="max-h-48 w-auto object-contain rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Note taken by student during exam */}
                {rec.noteText && (
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl text-xs space-y-1 border border-stone-200 dark:border-stone-800">
                    <span className="font-bold text-stone-500 text-[10px] uppercase">
                      {t('results.myNote')}
                    </span>
                    <p className="text-stone-700 dark:text-stone-300 italic">{rec.noteText}</p>
                  </div>
                )}

                {/* Ask Gemini Tutor about this question */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setGeminiReviewModal({
                        question: q,
                        userSelectedIds: rec.selectedOptionIds,
                      })
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer border border-amber-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Perguntar ao Gemini sobre esta questão</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Image Modal */}
      <ImageModal
        imageUrl={activeModalImage?.url || null}
        altText={activeModalImage?.altText}
        caption={activeModalImage?.caption}
        isOpen={Boolean(activeModalImage)}
        onClose={() => setActiveModalImage(null)}
      />

      {/* Gemini AI Question Tutor Modal */}
      {geminiReviewModal && (
        <GeminiQuestionModal
          isOpen={Boolean(geminiReviewModal)}
          question={geminiReviewModal.question}
          userSelectedOptionIds={geminiReviewModal.userSelectedIds}
          onClose={() => setGeminiReviewModal(null)}
        />
      )}
    </div>
  );
}
