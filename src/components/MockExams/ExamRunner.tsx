import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Question,
  MockExamConfigOptions,
  ExamAttempt,
  QuestionAttemptRecord,
  TextAnnotation,
  InProgressExamSession,
} from '../../types';
import {
  Clock,
  Flag,
  MessageSquare,
  Highlighter,
  Strikethrough as StrikethroughIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Code,
  FileCode,
  Terminal,
  Grid,
  X,
  Globe,
  ZoomIn,
  ListFilter,
  Check,
  ImageIcon,
  Pause,
} from 'lucide-react';
import AnnotatedText from './AnnotatedText';
import ItemNavigator from './ItemNavigator';
import ImageModal from './ImageModal';
import {
  translationService,
  SUPPORTED_LANGUAGES,
  TranslatedQuestionData,
} from '../../services/translationService';

interface ExamRunnerProps {
  config: MockExamConfigOptions;
  initialSession?: InProgressExamSession | null;
  onFinishExam: (attempt: ExamAttempt) => void;
  onPauseExam?: (session: InProgressExamSession) => void;
  onExitExam: () => void;
}

export default function ExamRunner({
  config,
  initialSession,
  onFinishExam,
  onPauseExam,
  onExitExam,
}: ExamRunnerProps) {
  const { activeCert, getQuestionsForActiveCert, studentProfile } = useApp();
  const { t } = useTranslation();

  // 1. Prepare questions for this exam
  const [examQuestions] = useState<Question[]>(() => {
    const all = getQuestionsForActiveCert();
    if (initialSession && initialSession.questionIds && initialSession.questionIds.length > 0) {
      const idMap = new Map(all.map((q) => [q.id, q]));
      const ordered = initialSession.questionIds
        .map((id) => idMap.get(id))
        .filter((q): q is Question => Boolean(q));
      if (ordered.length > 0) return ordered;
    }

    const filtered = all.filter((q) => {
      const matchBank = config.bankIds.includes(q.bankId);
      const matchDomain = config.domainFilter ? q.domainTag === config.domainFilter : true;
      return matchBank && matchDomain;
    });
    // Shuffle and pick requested count
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(config.questionCount, shuffled.length));
  });

  const totalQuestions = examQuestions.length;

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(() => {
    return initialSession ? Math.min(initialSession.currentIndex, Math.max(0, examQuestions.length - 1)) : 0;
  });
  const currentQuestion = examQuestions[currentIndex];

  // 2. Exam State Tracking (Records per question)
  const [records, setRecords] = useState<Record<string, QuestionAttemptRecord>>(() => {
    if (initialSession && initialSession.records) {
      return initialSession.records;
    }
    const initial: Record<string, QuestionAttemptRecord> = {};
    examQuestions.forEach((q) => {
      initial[q.id] = {
        questionId: q.id,
        selectedOptionIds: [],
        userTextAnswer: '',
        flashcardSelfRating: 'unrated',
        isCorrect: false,
        timeSpentSeconds: 0,
        isOvertime: false,
        flagged: false,
        noteText: '',
        annotations: [],
      };
    });
    return initial;
  });

  // Total duration in minutes (including accommodation if enabled)
  const totalDurationMinutes =
    config.examDurationMinutes +
    (config.useAccommodation && activeCert?.accommodationMinutes ? activeCert.accommodationMinutes : 0);

  const totalExamDurationSeconds = Math.max(60, totalDurationMinutes * 60);

  // Per-question budgeted time: calculated as total exam duration / total questions
  const perQuestionBudgetSeconds = Math.max(
    15,
    Math.floor(totalExamDurationSeconds / Math.max(1, totalQuestions))
  );

  // Instant Feedback mode state for current question
  const [instantChecked, setInstantChecked] = useState<boolean>(false);
  const [showQuestionNoteDrawer, setShowQuestionNoteDrawer] = useState(false);
  const [showItemNavigator, setShowItemNavigator] = useState(false);
  const [isNavigatorDocked, setIsNavigatorDocked] = useState(false);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);

  // Lightbox / Image Zoom Modal
  const [activeModalImage, setActiveModalImage] = useState<{
    url: string;
    altText?: string;
    caption?: string;
  } | null>(null);

  // Translation states (Google Translate)
  const [targetLang, setTargetLang] = useState(studentProfile.nativeLanguage || 'pt');
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState<TranslatedQuestionData | null>(null);

  // Time's Up Modal state (Final Review mode)
  const [showTimesUpModal, setShowTimesUpModal] = useState(false);
  const [hasDismissedTimesUp, setHasDismissedTimesUp] = useState(false);
  const [isExamOvertimeOverall, setIsExamOvertimeOverall] = useState(false);
  const [timeExpiredAtSeconds, setTimeExpiredAtSeconds] = useState<number | null>(null);

  // Overall time tracking
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(() => {
    return initialSession ? initialSession.totalElapsedSeconds : 0;
  });

  // Per-question timer tracking
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState(() => {
    return initialSession ? initialSession.questionTimeElapsed : 0;
  });

  // Text selection state for top annotation toolbar & floating tooltip
  const [activeSelection, setActiveSelection] = useState<{
    field: string;
    start: number;
    end: number;
    text: string;
  } | null>(null);

  // Confirm finish modal
  const [showFinishConfirmModal, setShowFinishConfirmModal] = useState(false);

  // 3. Timers Engine
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalElapsedSeconds((prev) => {
        const next = prev + 1;

        // Check if overall time expired in Final Review mode
        if (
          config.useTimer &&
          config.feedbackMode === 'final-review' &&
          next >= totalExamDurationSeconds &&
          !hasDismissedTimesUp &&
          !showTimesUpModal
        ) {
          setShowTimesUpModal(true);
          setIsExamOvertimeOverall(true);
          if (timeExpiredAtSeconds === null) {
            setTimeExpiredAtSeconds(next);
          }
        }
        return next;
      });

      // Update question time if not already answered in instant mode
      if (!(config.feedbackMode === 'instant-feedback' && instantChecked)) {
        setQuestionTimeElapsed((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    config.useTimer,
    config.feedbackMode,
    totalExamDurationSeconds,
    hasDismissedTimesUp,
    showTimesUpModal,
    instantChecked,
    timeExpiredAtSeconds,
  ]);

  // When switching questions, save elapsed time & update question record
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      // Save elapsed time for previous question
      const prevQ = examQuestions[prevIndexRef.current];
      if (prevQ) {
        setRecords((prev) => {
          const currentRec = prev[prevQ.id];
          const isOver = questionTimeElapsed > perQuestionBudgetSeconds;
          return {
            ...prev,
            [prevQ.id]: {
              ...currentRec,
              timeSpentSeconds: (currentRec?.timeSpentSeconds || 0) + questionTimeElapsed,
              isOvertime: currentRec?.isOvertime || isOver,
            },
          };
        });
      }

      setQuestionTimeElapsed(0);
      setInstantChecked(false);
      setShowFlashcardBack(false);
      setActiveSelection(null);

      // Handle translation state for new question
      if (isTranslated && currentQuestion) {
        const cached = translationService.getCached(currentQuestion.id, targetLang);
        if (cached) {
          setTranslatedData(cached);
        } else {
          setIsTranslating(true);
          translationService
            .translateQuestion(currentQuestion, targetLang)
            .then((data) => setTranslatedData(data))
            .catch((err) => console.warn('Translation error:', err))
            .finally(() => setIsTranslating(false));
        }
      } else {
        setTranslatedData(null);
      }

      prevIndexRef.current = currentIndex;
    }
  }, [
    currentIndex,
    examQuestions,
    perQuestionBudgetSeconds,
    questionTimeElapsed,
    isTranslated,
    currentQuestion,
    targetLang,
  ]);

  if (!currentQuestion) return null;

  const currentRecord = records[currentQuestion.id] || {
    questionId: currentQuestion.id,
    selectedOptionIds: [],
    userTextAnswer: '',
    flashcardSelfRating: 'unrated',
    isCorrect: false,
    timeSpentSeconds: 0,
    isOvertime: false,
    flagged: false,
    noteText: '',
    annotations: [],
  };

  // Option selection logic
  const handleSelectOption = (optionId: string) => {
    if (config.feedbackMode === 'instant-feedback' && instantChecked) return;

    let newSelected: string[];
    if (currentQuestion.allowMultipleAnswers) {
      if (currentRecord.selectedOptionIds.includes(optionId)) {
        newSelected = currentRecord.selectedOptionIds.filter((id) => id !== optionId);
      } else {
        newSelected = [...currentRecord.selectedOptionIds, optionId];
      }
    } else {
      newSelected = [optionId];
    }

    // Evaluate correctness
    const correctIds = currentQuestion.options?.filter((o) => o.isCorrect).map((o) => o.id) || [];
    const isCorrect =
      correctIds.length === newSelected.length &&
      correctIds.every((id) => newSelected.includes(id));

    setRecords((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOptionIds: newSelected,
        isCorrect,
        answeredAtTimestamp: totalElapsedSeconds,
      },
    }));
  };

  // Flag toggle
  const handleToggleFlag = () => {
    setRecords((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        flagged: !prev[currentQuestion.id]?.flagged,
      },
    }));
  };

  // Question note change
  const handleNoteChange = (text: string) => {
    setRecords((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        noteText: text,
      },
    }));
  };

  // Flashcard self-evaluation
  const handleFlashcardRating = (rating: 'easy' | 'good' | 'hard') => {
    const isCorrect = rating === 'easy' || rating === 'good';
    setRecords((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        flashcardSelfRating: rating,
        isCorrect,
        answeredAtTimestamp: totalElapsedSeconds,
      },
    }));
  };

  // 4. Translation Toggle Handler (Google Translate)
  const handleToggleTranslation = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      setTranslatedData(null);
      return;
    }

    setIsTranslating(true);
    try {
      const data = await translationService.translateQuestion(currentQuestion, targetLang);
      setTranslatedData(data);
      setIsTranslated(true);
    } catch (err) {
      console.warn('Translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // 5. Text Annotation Engine (Highlight & Strikethrough)
  const handleApplyAnnotation = (type: 'highlight' | 'strikethrough') => {
    if (!activeSelection) return;

    const { field, start, end, text } = activeSelection;
    const currentAnnotations = currentRecord.annotations || [];

    // Overlap & Toggle rule:
    const overlapping = currentAnnotations.filter(
      (a) => a.targetField === field && a.type === type && !(end <= a.startOffset || start >= a.endOffset)
    );

    // Exact match toggle removal: if selection is an exact match for an existing annotation, remove it
    const exactMatch = overlapping.find((a) => a.startOffset === start && a.endOffset === end);

    let updatedAnnotations: TextAnnotation[];

    if (exactMatch) {
      updatedAnnotations = currentAnnotations.filter((a) => a.id !== exactMatch.id);
    } else {
      let unionStart = start;
      let unionEnd = end;

      overlapping.forEach((a) => {
        unionStart = Math.min(unionStart, a.startOffset);
        unionEnd = Math.max(unionEnd, a.endOffset);
      });

      const nonOverlapping = currentAnnotations.filter(
        (a) => !(a.targetField === field && a.type === type && overlapping.some((o) => o.id === a.id))
      );

      const newAnnotation: TextAnnotation = {
        id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        targetField: field,
        startOffset: unionStart,
        endOffset: unionEnd,
        selectedText: text,
        type,
        createdAt: Date.now(),
      };

      updatedAnnotations = [...nonOverlapping, newAnnotation];
    }

    setRecords((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        annotations: updatedAnnotations,
      },
    }));

    setActiveSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  // Pause and Exit Session
  const handlePauseAndExit = () => {
    const updatedRecords = { ...records };
    const currQ = currentQuestion;
    if (currQ) {
      const rec = updatedRecords[currQ.id];
      const isOver = questionTimeElapsed > perQuestionBudgetSeconds;
      updatedRecords[currQ.id] = {
        ...rec,
        timeSpentSeconds: (rec?.timeSpentSeconds || 0) + questionTimeElapsed,
        isOvertime: rec?.isOvertime || isOver,
      };
    }

    const session: InProgressExamSession = {
      id: initialSession?.id || `session-${Date.now()}`,
      certId: activeCert.id,
      certName: activeCert.name,
      config,
      questionIds: examQuestions.map((q) => q.id),
      currentIndex,
      records: updatedRecords,
      totalElapsedSeconds,
      questionTimeElapsed: 0,
      lastPausedAt: Date.now(),
      createdAt: initialSession?.createdAt || Date.now(),
    };

    if (onPauseExam) {
      onPauseExam(session);
    } else {
      onExitExam();
    }
  };

  // Submit & Finish Exam
  const handleFinalizeExam = () => {
    // Record current question time
    const updatedRecords = { ...records };
    const currQ = currentQuestion;
    if (currQ) {
      const rec = updatedRecords[currQ.id];
      const isOver = questionTimeElapsed > perQuestionBudgetSeconds;
      updatedRecords[currQ.id] = {
        ...rec,
        timeSpentSeconds: (rec?.timeSpentSeconds || 0) + questionTimeElapsed,
        isOvertime: rec?.isOvertime || isOver,
      };
    }

    const questionRecordsArray: QuestionAttemptRecord[] = Object.values(updatedRecords) as QuestionAttemptRecord[];
    const correctCount = questionRecordsArray.filter((r) => r.isCorrect).length;
    const scorePercent = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);

    let stoppedOnTimeScore: ExamAttempt['stoppedOnTimeScore'] = undefined;
    if (timeExpiredAtSeconds !== null && totalElapsedSeconds > totalExamDurationSeconds) {
      const onTimeRecords = questionRecordsArray.filter(
        (r) => r.answeredAtTimestamp !== undefined && r.answeredAtTimestamp <= totalExamDurationSeconds
      );
      const onTimeCorrect = onTimeRecords.filter((r) => r.isCorrect).length;
      stoppedOnTimeScore = {
        answeredCount: onTimeRecords.length,
        correctCount: onTimeCorrect,
        scorePercent: Math.round((onTimeCorrect / Math.max(1, totalQuestions)) * 100),
      };
    }

    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      certId: activeCert.id,
      date: Date.now(),
      mode: config.feedbackMode,
      useTimer: config.useTimer,
      useAccommodation: config.useAccommodation,
      durationMinutesConfigured: totalDurationMinutes,
      totalTimeSpentSeconds: totalElapsedSeconds,
      totalQuestions,
      correctCount,
      scorePercent,
      isOvertimeOverall: isExamOvertimeOverall || totalElapsedSeconds > totalExamDurationSeconds,
      stoppedOnTimeScore,
      questionRecords: questionRecordsArray,
      bankIds: config.bankIds,
      domainFilter: config.domainFilter,
    };

    onFinishExam(attempt);
  };

  const allRecords: QuestionAttemptRecord[] = Object.values(records) as QuestionAttemptRecord[];
  const answeredCount = allRecords.filter(
    (r) => r.selectedOptionIds.length > 0 || r.flashcardSelfRating !== 'unrated' || r.userTextAnswer
  ).length;

  const unansweredCount = totalQuestions - answeredCount;

  // Question Per-Clock calculation
  const isQuestionOvertime = questionTimeElapsed > perQuestionBudgetSeconds;
  const questionRemainingSeconds = Math.max(0, perQuestionBudgetSeconds - questionTimeElapsed);
  const questionOvertimeSeconds = Math.max(0, questionTimeElapsed - perQuestionBudgetSeconds);

  const qRemMins = Math.floor(questionRemainingSeconds / 60);
  const qRemSecs = questionRemainingSeconds % 60;
  const qOverMins = Math.floor(questionOvertimeSeconds / 60);
  const qOverSecs = questionOvertimeSeconds % 60;

  const qTotalMins = Math.floor(questionTimeElapsed / 60);
  const qTotalSecs = questionTimeElapsed % 60;

  // Selected language object
  const currentTargetLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  // Display texts (original vs translated)
  const displayPrompt =
    (isTranslated && translatedData?.prompt) || currentQuestion.prompt;
  const displayScenarioContext =
    (isTranslated && translatedData?.scenarioContext) ||
    currentQuestion.scenarioDetails?.context;
  const displayExplanation =
    (isTranslated && translatedData?.explanation) || currentQuestion.explanation;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between pb-12 transition-colors">
      {/* 1. TOP ANNOTATION & EXAM TOOLBAR */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-extrabold text-stone-800 dark:text-stone-200 font-mono">
              Q{currentIndex + 1} / {totalQuestions}
            </span>

            {currentQuestion.domainTag && (
              <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {currentQuestion.domainTag}
              </span>
            )}
          </div>

          {/* Text Annotation Controls (Active when text is selected) */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              id="toolbar-highlight-btn"
              type="button"
              onClick={() => handleApplyAnnotation('highlight')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeSelection
                  ? 'bg-amber-400 text-amber-950 shadow-xs hover:bg-amber-300 cursor-pointer animate-pulse'
                  : 'text-stone-400 dark:text-stone-500 opacity-60 cursor-not-allowed'
              }`}
              title="Grifar texto selecionado (marca-texto amarelo)"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('runner.highlight')}</span>
            </button>

            <button
              id="toolbar-strikethrough-btn"
              type="button"
              onClick={() => handleApplyAnnotation('strikethrough')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeSelection
                  ? 'bg-rose-500 text-white shadow-xs hover:bg-rose-600 cursor-pointer animate-pulse'
                  : 'text-stone-400 dark:text-stone-500 opacity-60 cursor-not-allowed'
              }`}
              title="Riscar texto selecionado (eliminar distrator)"
            >
              <StrikethroughIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('runner.strikethrough')}</span>
            </button>
          </div>

          {/* Right: Overall Clock & Item Navigator trigger */}
          <div className="flex items-center space-x-2">
            {/* Overall Exam Countdown */}
            {config.useTimer && (
              <div
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl border font-mono font-bold text-xs ${
                  totalExamDurationSeconds - totalElapsedSeconds <= 0
                    ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
                title="Tempo total restante do exame"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {Math.floor(Math.max(0, totalExamDurationSeconds - totalElapsedSeconds) / 60)}:
                  {String(Math.max(0, totalExamDurationSeconds - totalElapsedSeconds) % 60).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-stone-400 uppercase hidden sm:inline">Exame</span>
              </div>
            )}

            {/* PAUSE & SAVE EXAM BUTTON */}
            <button
              id="exam-pause-top-btn"
              type="button"
              onClick={handlePauseAndExit}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 font-bold text-xs transition-colors cursor-pointer"
              title="Pausar simulado para continuar em outro momento"
            >
              <Pause className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Pausar</span>
            </button>

            {/* FINISH EXAM BUTTON (Anytime) */}
            <button
              id="exam-finish-top-btn"
              type="button"
              onClick={() => setShowFinishConfirmModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              title="Encerrar simulado agora e ver resultados"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Encerrar</span>
            </button>

            {/* ITEM NAVIGATOR BUTTON */}
            <button
              id="exam-item-navigator-btn"
              type="button"
              onClick={() => setShowItemNavigator(!showItemNavigator)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                showItemNavigator
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
              }`}
              title="Abrir o Item Navigator com todas as questões"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Item Navigator</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 font-mono">
                {answeredCount}/{totalQuestions}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Container with optional docked Item Navigator */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 gap-6">
        {/* 2. MAIN EXAM QUESTION CANVAS */}
        <main className="flex-1 space-y-5 min-w-0">
          {/* FLOATING ACTION TOOLTIP ON TEXT SELECTION */}
          {activeSelection && (
            <div className="sticky top-16 z-30 flex items-center justify-between p-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-2xl shadow-xl border border-stone-700 dark:border-stone-300 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center space-x-2 truncate pr-2">
                <span className="text-[11px] font-bold text-amber-400 dark:text-amber-600">Texto Selecionado:</span>
                <span className="text-xs font-mono truncate max-w-xs opacity-90">
                  "{activeSelection.text}"
                </span>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleApplyAnnotation('highlight')}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <Highlighter className="w-3 h-3" />
                  <span>Grifar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAnnotation('strikethrough')}
                  className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <StrikethroughIcon className="w-3 h-3" />
                  <span>Riscar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSelection(null)}
                  className="p-1 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 text-stone-400"
                  title="Cancelar seleção"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* DEDICATED QUESTION CLOCK & ACTION BAR */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* DEDICATED PER-QUESTION CLOCK */}
            <div className="flex items-center space-x-3">
              {isQuestionOvertime ? (
                <div
                  id="question-timer-overtime"
                  className="flex items-center space-x-2 px-3.5 py-1.5 bg-rose-500/15 border-2 border-rose-500/80 rounded-xl text-rose-600 dark:text-rose-400 font-mono font-black text-xs sm:text-sm animate-pulse"
                  title="O tempo médio estipulado para esta questão estourou! Contando tempo extra."
                >
                  <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>
                    +{qOverMins}:{qOverSecs < 10 ? '0' : ''}
                    {qOverSecs}
                  </span>
                  <span className="text-[10px] uppercase font-black bg-rose-600 text-white px-1.5 py-0.5 rounded tracking-wide">
                    TEMPO ESGOTADO
                  </span>
                </div>
              ) : (
                <div
                  id="question-timer-countdown"
                  className="flex items-center space-x-2 px-3.5 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-mono font-bold text-xs sm:text-sm"
                  title="Contagem regressiva da meta de tempo para esta questão"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>
                    {qRemMins}:{qRemSecs < 10 ? '0' : ''}
                    {qRemSecs}
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">nesta questão</span>
                </div>
              )}

              <span className="text-xs text-stone-400 dark:text-stone-500 hidden sm:inline">
                Total nesta Q: <strong className="font-mono text-stone-700 dark:text-stone-300">{qTotalMins}:{qTotalSecs < 10 ? '0' : ''}{qTotalSecs}</strong>
              </span>
            </div>

            {/* TRANSLATION (GOOGLE TRANSLATE) & QUICK QUESTION ACTIONS */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Google Translate Toggle Button */}
              <button
                id="exam-translate-toggle-btn"
                type="button"
                onClick={handleToggleTranslation}
                disabled={isTranslating}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isTranslated
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                }`}
                title={isTranslated ? 'Voltar para o texto original' : 'Traduzir questão via Google Translate'}
              >
                <Globe className="w-3.5 h-3.5 text-blue-500 dark:text-blue-300" />
                {isTranslating ? (
                  <span>Traduzindo...</span>
                ) : isTranslated ? (
                  <span>Ver Original</span>
                ) : (
                  <span>Traduzir ({currentTargetLangObj.flag} {currentTargetLangObj.nativeName})</span>
                )}
              </button>

              {/* Target Language Selector if not translating */}
              {!isTranslated && (
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="px-2 py-1 text-[11px] font-bold bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-300 focus:outline-none"
                  title="Escolher idioma nativo para tradução"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.nativeName}
                    </option>
                  ))}
                </select>
              )}

              {/* Flag Question */}
              <button
                id="exam-flag-btn"
                type="button"
                onClick={handleToggleFlag}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  currentRecord.flagged
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Flag
                  className={`w-3.5 h-3.5 ${
                    currentRecord.flagged ? 'fill-amber-500 text-amber-500' : ''
                  }`}
                />
                <span className="hidden sm:inline">
                  {currentRecord.flagged ? t('runner.flagged') : t('runner.flagQuestion')}
                </span>
              </button>

              {/* Note Drawer */}
              <button
                id="exam-note-btn"
                type="button"
                onClick={() => setShowQuestionNoteDrawer(!showQuestionNoteDrawer)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  currentRecord.noteText.trim()
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {currentRecord.noteText.trim() ? 'Nota' : t('runner.questionNote')}
                </span>
              </button>
            </div>
          </div>

          {/* Question Note Drawer / Popover if open */}
          {showQuestionNoteDrawer && (
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2 animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Anotação para a Questão #{currentIndex + 1}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuestionNoteDrawer(false)}
                  className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 text-xs"
                >
                  ✕
                </button>
              </div>
              <textarea
                id="question-note-input"
                rows={2}
                value={currentRecord.noteText}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder={t('runner.notePlaceholder')}
                className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>
          )}

          {/* TRANSLATION ACTIVE BANNER */}
          {isTranslated && (
            <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  Tradução em <strong>{currentTargetLangObj.nativeName}</strong> via Google Translate
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTranslated(false);
                  setTranslatedData(null);
                }}
                className="font-bold underline hover:opacity-80 text-[11px]"
              >
                Ver texto original
              </button>
            </div>
          )}

          {/* 3. QUESTION PROMPT CARD */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-5">
            {/* Prompt with Annotation overlay */}
            <AnnotatedText
              idPrefix={`q-${currentQuestion.id}`}
              field="prompt"
              text={displayPrompt}
              annotations={currentRecord.annotations}
              onSelectionChange={(field, sel) => setActiveSelection(sel ? { ...sel, field } : null)}
              className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100 leading-relaxed font-sans"
            />

            {/* QUESTION PROMPT IMAGE (Visible before and after answering) */}
            {currentQuestion.imageUrl && (
              <div className="pt-2">
                <div
                  onClick={() =>
                    setActiveModalImage({
                      url: currentQuestion.imageUrl!,
                      altText: `Diagrama da Questão #${currentIndex + 1}`,
                      caption: 'Imagem do enunciado da questão',
                    })
                  }
                  className="group relative cursor-pointer rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 p-2 hover:border-amber-500 transition-colors inline-block max-w-full"
                >
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Diagrama da Questão"
                    className="max-h-72 w-auto object-contain rounded-xl select-none"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1.5 rounded-xl">
                    <ZoomIn className="w-4 h-4" />
                    <span>Clique para ampliar imagem</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scenario Code Snippet / Context if present */}
            {currentQuestion.type === 'scenario' && currentQuestion.scenarioDetails && (
              <div className="space-y-3 pt-2">
                {displayScenarioContext && (
                  <AnnotatedText
                    idPrefix={`q-${currentQuestion.id}`}
                    field="scenarioContext"
                    text={displayScenarioContext}
                    annotations={currentRecord.annotations}
                    onSelectionChange={(field, sel) =>
                      setActiveSelection(sel ? { ...sel, field } : null)
                    }
                    className="text-xs text-stone-600 dark:text-stone-400 font-mono"
                  />
                )}

                {/* Scenario Diagram Image if present */}
                {currentQuestion.scenarioDetails.imageUrl && (
                  <div
                    onClick={() =>
                      setActiveModalImage({
                        url: currentQuestion.scenarioDetails!.imageUrl!,
                        altText: `Diagrama do Cenário #${currentIndex + 1}`,
                        caption: 'Arquitetura / Topologia do cenário',
                      })
                    }
                    className="group relative cursor-pointer rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-950/50 p-2 hover:border-amber-500 transition-colors inline-block"
                  >
                    <img
                      src={currentQuestion.scenarioDetails.imageUrl}
                      alt="Cenário Diagrama"
                      className="max-h-60 w-auto object-contain rounded-lg"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1.5 rounded-xl">
                      <ZoomIn className="w-4 h-4" />
                      <span>Ampliar diagrama do cenário</span>
                    </div>
                  </div>
                )}

                {currentQuestion.scenarioDetails.codeSnippet && (
                  <div className="p-4 bg-stone-950 rounded-xl font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed border border-stone-800">
                    <pre>{currentQuestion.scenarioDetails.codeSnippet}</pre>
                  </div>
                )}
              </div>
            )}

            {/* 4. OPTIONS LIST WITH IMAGES AND PER-OPTION COMMENTS */}
            {currentQuestion.type !== 'flashcard' && currentQuestion.options && (
              <div className="space-y-3.5 pt-2">
                {currentQuestion.options.map((option, optIdx) => {
                  const isSelected = currentRecord.selectedOptionIds.includes(option.id);
                  const letter = String.fromCharCode(65 + optIdx);

                  // Translated option text & comments
                  const transOpt =
                    isTranslated && translatedData?.options?.find((o) => o.id === option.id);
                  const optText = transOpt?.text || option.text;
                  const optComment =
                    transOpt?.comment || transOpt?.explanation || option.comment || option.explanation;

                  let optCardStyle =
                    'border-stone-200 dark:border-stone-800 hover:border-amber-500/60 dark:hover:border-amber-400/50 bg-stone-50/40 dark:bg-stone-800/30';

                  if (isSelected) {
                    optCardStyle =
                      'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-500';
                  }

                  // If instant feedback is checked
                  if (config.feedbackMode === 'instant-feedback' && instantChecked) {
                    if (option.isCorrect) {
                      optCardStyle =
                        'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500';
                    } else if (isSelected && !option.isCorrect) {
                      optCardStyle =
                        'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500';
                    }
                  }

                  return (
                    <div
                      key={option.id}
                      id={`opt-choice-${option.id}`}
                      onClick={() => handleSelectOption(option.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${optCardStyle}`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-amber-500 text-white'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {letter}
                        </span>

                        <div className="flex-1 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
                          <AnnotatedText
                            idPrefix={`q-${currentQuestion.id}`}
                            field={`option-${option.id}`}
                            text={optText}
                            annotations={currentRecord.annotations}
                            onSelectionChange={(field, sel) =>
                              setActiveSelection(sel ? { ...sel, field } : null)
                            }
                          />
                        </div>
                      </div>

                      {/* OPTION IMAGE (Visible before and after answering) */}
                      {option.imageUrl && (
                        <div className="pl-9.5">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModalImage({
                                url: option.imageUrl!,
                                altText: `Imagem da Alternativa ${letter}`,
                                caption: `Alternativa ${letter}: ${option.text.slice(0, 80)}...`,
                              });
                            }}
                            className="group relative cursor-pointer rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 inline-block bg-white dark:bg-stone-900 p-1"
                          >
                            <img
                              src={option.imageUrl}
                              alt={`Opção ${letter}`}
                              className="max-h-40 w-auto object-contain rounded-lg"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold space-x-1 rounded-lg">
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Ampliar</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OPTION COMMENT / EXPLANATION (Visible in instant-feedback mode after answering) */}
                      {config.feedbackMode === 'instant-feedback' && instantChecked && (
                        <div className="pl-9.5 space-y-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 animate-in fade-in duration-100">
                          {optComment && (
                            <div
                              className={`p-3 rounded-xl text-xs leading-relaxed ${
                                option.isCorrect
                                  ? 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 border-l-4 border-emerald-500'
                                  : 'bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-l-4 border-stone-400 dark:border-stone-600'
                              }`}
                            >
                              <div className="flex items-center space-x-1.5 font-bold mb-1 text-[11px]">
                                {option.isCorrect ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Comentário da Alternativa Correta ({letter}):</span>
                                  </span>
                                ) : (
                                  <span className="text-stone-500 dark:text-stone-400 flex items-center space-x-1">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    <span>Comentário da Alternativa ({letter}):</span>
                                  </span>
                                )}
                              </div>
                              <p>{optComment}</p>
                            </div>
                          )}

                          {/* OPTION COMMENT IMAGE (Visible after answering) */}
                          {option.commentImageUrl && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveModalImage({
                                  url: option.commentImageUrl!,
                                  altText: `Comentário Explicativo da Alternativa ${letter}`,
                                  caption: `Diagrama explicativo da alternativa ${letter}`,
                                });
                              }}
                              className="group relative cursor-pointer rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 inline-block bg-white dark:bg-stone-900 p-1"
                            >
                              <img
                                src={option.commentImageUrl}
                                alt={`Comentário Opção ${letter}`}
                                className="max-h-44 w-auto object-contain rounded-lg"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold space-x-1 rounded-lg">
                                <ZoomIn className="w-3.5 h-3.5" />
                                <span>Ampliar imagem do comentário</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 5. FLASHCARD ANSWERING MODE */}
            {currentQuestion.type === 'flashcard' && currentQuestion.flashcard && (
              <div className="space-y-4 pt-2">
                {!showFlashcardBack ? (
                  <button
                    id="flashcard-reveal-btn"
                    type="button"
                    onClick={() => setShowFlashcardBack(true)}
                    className="w-full py-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-amber-500" />
                    <span>{t('runner.flashcardShow')}</span>
                  </button>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                        Solução / Comando:
                      </span>
                      <p className="text-sm font-mono text-emerald-900 dark:text-emerald-100 leading-relaxed font-semibold">
                        {currentQuestion.flashcard.backAnswer}
                      </p>
                    </div>

                    {/* Self assessment ratings */}
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        id="flashcard-rate-hard"
                        onClick={() => handleFlashcardRating('hard')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          currentRecord.flashcardSelfRating === 'hard'
                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600'
                        }`}
                      >
                        Difícil / Errei
                      </button>
                      <button
                        id="flashcard-rate-good"
                        onClick={() => handleFlashcardRating('good')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          currentRecord.flashcardSelfRating === 'good'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600'
                        }`}
                      >
                        Bom / Lembrei
                      </button>
                      <button
                        id="flashcard-rate-easy"
                        onClick={() => handleFlashcardRating('easy')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          currentRecord.flashcardSelfRating === 'easy'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600'
                        }`}
                      >
                        Fácil / Dominei
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. GENERAL QUESTION EXPLANATION & IMAGE (Instant Feedback Mode) */}
            {config.feedbackMode === 'instant-feedback' && instantChecked && (
              <div
                className={`p-4 rounded-xl border space-y-3 animate-in fade-in duration-150 ${
                  currentRecord.isCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs">
                  {currentRecord.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{currentRecord.isCorrect ? t('runner.correct') : t('runner.incorrect')}</span>
                </div>

                {displayExplanation && (
                  <div className="text-xs leading-relaxed opacity-95 space-y-1">
                    <span className="font-bold block uppercase tracking-wider text-[10px]">
                      Justificativa Geral da Questão:
                    </span>
                    <p className="whitespace-pre-line">{displayExplanation}</p>
                  </div>
                )}

                {/* QUESTION EXPLANATION IMAGE (Visible after answering) */}
                {currentQuestion.explanationImageUrl && (
                  <div className="pt-2">
                    <div
                      onClick={() =>
                        setActiveModalImage({
                          url: currentQuestion.explanationImageUrl!,
                          altText: `Diagrama Explicativo da Questão #${currentIndex + 1}`,
                          caption: 'Diagrama da justificativa e resolução da questão',
                        })
                      }
                      className="group relative cursor-pointer rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-900 p-2 inline-block max-w-full"
                    >
                      <img
                        src={currentQuestion.explanationImageUrl}
                        alt="Diagrama Explicativo"
                        className="max-h-64 w-auto object-contain rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1.5 rounded-lg">
                        <ZoomIn className="w-4 h-4" />
                        <span>Ampliar diagrama explicativo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* DOCKED ITEM NAVIGATOR (Visible on large screens if toggled) */}
        {isNavigatorDocked && (
          <ItemNavigator
            questions={examQuestions}
            records={records}
            currentIndex={currentIndex}
            perQuestionBudgetSeconds={perQuestionBudgetSeconds}
            feedbackMode={config.feedbackMode}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
            onFinishExam={() => setShowFinishConfirmModal(true)}
            isOpen={true}
            onClose={() => setIsNavigatorDocked(false)}
            isDocked={true}
            onToggleDock={() => setIsNavigatorDocked(false)}
          />
        )}
      </div>

      {/* 7. BOTTOM NAVIGATION BAR */}
      <footer className="sticky bottom-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 py-3 mt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <button
            id="exam-prev-btn"
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('runner.prevQuestion')}</span>
          </button>

          {/* Center: Check Answer button for Instant Feedback Mode + Universal Submit midway */}
          <div className="flex items-center space-x-2">
            {config.feedbackMode === 'instant-feedback' && !instantChecked ? (
              <button
                id="exam-instant-check-btn"
                type="button"
                onClick={() => setInstantChecked(true)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                {t('runner.checkAnswer')}
              </button>
            ) : null}

            {/* Always visible button to finalize early midway */}
            <button
              id="exam-finish-midway-btn"
              type="button"
              onClick={() => setShowFinishConfirmModal(true)}
              className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition-colors cursor-pointer"
              title="Encerrar simulado agora e gerar relatório de desempenho"
            >
              Encerrar Simulado ({answeredCount}/{totalQuestions})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {currentIndex < totalQuestions - 1 ? (
              <button
                id="exam-next-btn"
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center space-x-1.5 px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <span>{t('runner.nextQuestion')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="exam-finish-btn"
                type="button"
                onClick={() => setShowFinishConfirmModal(true)}
                className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('runner.submitExam')}</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* 8. SLIDE-OVER DRAWER ITEM NAVIGATOR (When not docked) */}
      {!isNavigatorDocked && (
        <ItemNavigator
          questions={examQuestions}
          records={records}
          currentIndex={currentIndex}
          perQuestionBudgetSeconds={perQuestionBudgetSeconds}
          feedbackMode={config.feedbackMode}
          onSelectIndex={(idx) => setCurrentIndex(idx)}
          onFinishExam={() => setShowFinishConfirmModal(true)}
          isOpen={showItemNavigator}
          onClose={() => setShowItemNavigator(false)}
          isDocked={false}
          onToggleDock={() => {
            setIsNavigatorDocked(true);
            setShowItemNavigator(false);
          }}
        />
      )}

      {/* 9. IMAGE LIGHTBOX MODAL */}
      <ImageModal
        imageUrl={activeModalImage?.url || null}
        altText={activeModalImage?.altText}
        caption={activeModalImage?.caption}
        isOpen={Boolean(activeModalImage)}
        onClose={() => setActiveModalImage(null)}
      />

      {/* 10. TIME'S UP NOTIFICATION MODAL */}
      {showTimesUpModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">
                {t('runner.timesUpTitle')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {t('runner.timesUpDesc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="times-up-continue-btn"
                type="button"
                onClick={() => {
                  setHasDismissedTimesUp(true);
                  setShowTimesUpModal(false);
                }}
                className="py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {t('runner.timesUpContinue')}
              </button>

              <button
                id="times-up-end-btn"
                type="button"
                onClick={() => {
                  setShowTimesUpModal(false);
                  handleFinalizeExam();
                }}
                className="py-2.5 px-3 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs transition-colors shadow-xs"
              >
                {t('runner.timesUpEnd')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. SUBMIT / PAUSE CONFIRMATION MODAL */}
      {showFinishConfirmModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                Encerrar Simulado de Prova?
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Você respondeu <strong>{answeredCount}</strong> de <strong>{totalQuestions}</strong> questões
                {unansweredCount > 0 ? ` (${unansweredCount} pendentes)` : ' (Todas respondidas!)'}.
              </p>
              <p className="text-[11px] text-stone-400">
                Você pode finalizar agora para ver o gabarito e relatório de desempenho, ou pausar para continuar mais tarde.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="exam-confirm-submit-btn"
                type="button"
                onClick={() => {
                  setShowFinishConfirmModal(false);
                  handleFinalizeExam();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar e Ver Resultados</span>
              </button>

              <button
                id="exam-confirm-pause-btn"
                type="button"
                onClick={() => {
                  setShowFinishConfirmModal(false);
                  handlePauseAndExit();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Pause className="w-4 h-4 text-amber-500" />
                <span>Pausar e Continuar Depois</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFinishConfirmModal(false)}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Continuar Respondendo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
