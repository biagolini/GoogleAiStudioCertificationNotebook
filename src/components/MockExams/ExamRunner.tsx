import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Question,
  MockExamConfigOptions,
  ExamAttempt,
  QuestionAttemptRecord,
  TextAnnotation,
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
  Send,
  Eye,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Code,
  FileCode,
  Terminal,
  Grid,
  X,
} from 'lucide-react';
import AnnotatedText from './AnnotatedText';

interface ExamRunnerProps {
  config: MockExamConfigOptions;
  onFinishExam: (attempt: ExamAttempt) => void;
  onExitExam: () => void;
}

export default function ExamRunner({ config, onFinishExam, onExitExam }: ExamRunnerProps) {
  const { activeCert, getQuestionsForActiveCert } = useApp();
  const { t } = useTranslation();

  // 1. Prepare questions for this exam
  const [examQuestions] = useState<Question[]>(() => {
    const all = getQuestionsForActiveCert().filter((q) => {
      const matchBank = config.bankIds.includes(q.bankId);
      const matchDomain = config.domainFilter ? q.domainTag === config.domainFilter : true;
      return matchBank && matchDomain;
    });
    // Shuffle and pick requested count
    const shuffled = [...all].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(config.questionCount, shuffled.length));
  });

  const totalQuestions = examQuestions.length;

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = examQuestions[currentIndex];

  // 2. Exam State Tracking (Records per question)
  const [records, setRecords] = useState<Record<string, QuestionAttemptRecord>>(() => {
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

  const totalExamDurationSeconds = totalDurationMinutes * 60;
  const perQuestionBudgetSeconds = Math.max(15, Math.floor(totalExamDurationSeconds / Math.max(1, totalQuestions)));

  // Instant Feedback mode state for current question
  const [instantChecked, setInstantChecked] = useState<boolean>(false);
  const [showQuestionNoteDrawer, setShowQuestionNoteDrawer] = useState(false);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);

  // Time's Up Modal state (Final Review mode)
  const [showTimesUpModal, setShowTimesUpModal] = useState(false);
  const [hasDismissedTimesUp, setHasDismissedTimesUp] = useState(false);
  const [isExamOvertimeOverall, setIsExamOvertimeOverall] = useState(false);
  const [timeExpiredAtSeconds, setTimeExpiredAtSeconds] = useState<number | null>(null);

  // Overall time tracking
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);

  // Per-question timer tracking
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState(0);

  // Text selection state for top annotation toolbar
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

  // When switching questions, reset question timer & instant feedback view
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      // Save elapsed time for previous question
      const prevQ = examQuestions[prevIndexRef.current];
      if (prevQ) {
        setRecords((prev) => {
          const currentRec = prev[prevQ.id];
          const isOver =
            config.feedbackMode === 'instant-feedback'
              ? questionTimeElapsed > perQuestionBudgetSeconds
              : false;
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
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex, examQuestions, config.feedbackMode, perQuestionBudgetSeconds, questionTimeElapsed]);

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

  // 4. Section 6: Text Annotation Engine (Highlight & Strikethrough)
  const handleApplyAnnotation = (type: 'highlight' | 'strikethrough') => {
    if (!activeSelection) return;

    const { field, start, end, text } = activeSelection;
    const currentAnnotations = currentRecord.annotations || [];

    // Overlap & Toggle rule (Section 6.1):
    // Check if current selection overlaps with existing annotations of this type
    const overlapping = currentAnnotations.filter(
      (a) => a.targetField === field && a.type === type && !(end <= a.startOffset || start >= a.endOffset)
    );

    // Exact match toggle removal: if selection is an exact match for an existing annotation, remove it
    const exactMatch = overlapping.find((a) => a.startOffset === start && a.endOffset === end);

    let updatedAnnotations: TextAnnotation[];

    if (exactMatch) {
      // Remove annotation
      updatedAnnotations = currentAnnotations.filter((a) => a.id !== exactMatch.id);
    } else {
      // Overlap expansion rule: expand to cover the union of all overlapping ranges + new selection
      let unionStart = start;
      let unionEnd = end;

      overlapping.forEach((a) => {
        unionStart = Math.min(unionStart, a.startOffset);
        unionEnd = Math.max(unionEnd, a.endOffset);
      });

      // Remove overlapping and insert single merged annotation
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

    // Clear selection state
    setActiveSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  // 5. Timer Formatting (Minutes remaining : Seconds format per Section 5.2)
  const renderTimer = () => {
    if (!config.useTimer) return null;

    if (config.feedbackMode === 'instant-feedback') {
      // Per-question budget countdown
      const remaining = perQuestionBudgetSeconds - questionTimeElapsed;
      const isOvertime = remaining < 0;

      if (isOvertime) {
        const overSeconds = Math.abs(remaining);
        const overMins = Math.floor(overSeconds / 60);
        const overSecs = overSeconds % 60;
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-600 dark:text-rose-400 font-mono font-extrabold text-xs animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>
              +{overMins}:{overSecs < 10 ? '0' : ''}
              {overSecs}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-tight">OVERTIME</span>
          </div>
        );
      }

      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return (
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-mono font-extrabold text-xs">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span>
            {mins}:{secs < 10 ? '0' : ''}
            {secs}
          </span>
          <span className="text-[10px] text-stone-400 font-normal">/ Q</span>
        </div>
      );
    }

    // Final review overall countdown: e.g. 180:00 counting down
    const remainingOverall = totalExamDurationSeconds - totalElapsedSeconds;
    const isOver = remainingOverall <= 0;

    if (isOver) {
      return (
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-600 dark:text-rose-400 font-mono font-extrabold text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>00:00</span>
          <span className="text-[10px] uppercase font-bold tracking-tight">OVERTIME</span>
        </div>
      );
    }

    const mins = Math.floor(remainingOverall / 60);
    const secs = remainingOverall % 60;

    return (
      <div className="flex items-center space-x-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-mono font-extrabold text-xs">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        <span>
          {mins}:{secs < 10 ? '0' : ''}
          {secs}
        </span>
      </div>
    );
  };

  // 6. Submit & Finish Exam
  const handleFinalizeExam = () => {
    // Record current question time
    const updatedRecords = { ...records };
    const currQ = currentQuestion;
    if (currQ) {
      const rec = updatedRecords[currQ.id];
      updatedRecords[currQ.id] = {
        ...rec,
        timeSpentSeconds: (rec?.timeSpentSeconds || 0) + questionTimeElapsed,
      };
    }

    const questionRecordsArray: QuestionAttemptRecord[] = Object.values(updatedRecords) as QuestionAttemptRecord[];
    const correctCount = questionRecordsArray.filter((r) => r.isCorrect).length;
    const scorePercent = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);

    // Calculate score if stopped on time (Section 5.4)
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
    };

    onFinishExam(attempt);
  };

  const allRecords: QuestionAttemptRecord[] = Object.values(records) as QuestionAttemptRecord[];
  const answeredCount = allRecords.filter(
    (r) => r.selectedOptionIds.length > 0 || r.flashcardSelfRating !== 'unrated' || r.userTextAnswer
  ).length;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between pb-12 transition-colors">
      {/* 1. TOP ANNOTATION TOOLBAR (Section 6.1) - Always visible at top of page */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-extrabold text-stone-800 dark:text-stone-200">
              {t('runner.questionProgress', { current: currentIndex + 1, total: totalQuestions })}
            </span>

            {currentQuestion.domainTag && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {currentQuestion.domainTag}
              </span>
            )}
          </div>

          {/* Text Annotation Controls (Active when text is selected) */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              id="toolbar-highlight-btn"
              type="button"
              onClick={() => handleApplyAnnotation('highlight')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeSelection
                  ? 'bg-amber-400 text-amber-950 shadow-xs hover:bg-amber-300 cursor-pointer animate-pulse'
                  : 'text-stone-400 dark:text-stone-500 opacity-60 cursor-not-allowed'
              }`}
              title="Highlight selected text (yellow marker)"
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
              title="Strikethrough selected text (rule out option)"
            >
              <StrikethroughIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('runner.strikethrough')}</span>
            </button>
          </div>

          {/* Right: Clock & Question Grid trigger */}
          <div className="flex items-center space-x-2">
            {renderTimer()}

            <button
              id="exam-grid-toggle-btn"
              onClick={() => setShowQuestionGrid(!showQuestionGrid)}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="View all questions"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN EXAM QUESTION CANVAS */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full space-y-6">
        {/* Question Header: Flag + Note Trigger */}
        <div className="flex items-center justify-between pb-2">
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
            <span>{currentRecord.flagged ? t('runner.flagged') : t('runner.flagQuestion')}</span>
          </button>

          {/* Question Note Button */}
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
            <span>
              {currentRecord.noteText.trim() ? 'Edit Note' : t('runner.questionNote')}
            </span>
          </button>
        </div>

        {/* Question Note Drawer / Popover if open */}
        {showQuestionNoteDrawer && (
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>Note for Question #{currentIndex + 1}</span>
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

        {/* 3. Question Prompt Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Prompt with Annotation overlay */}
          <AnnotatedText
            idPrefix={`q-${currentQuestion.id}`}
            field="prompt"
            text={currentQuestion.prompt}
            annotations={currentRecord.annotations}
            onSelectionChange={(field, sel) => setActiveSelection(sel ? { ...sel, field } : null)}
            className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100 leading-relaxed font-sans"
          />

          {/* Scenario Code Snippet if present */}
          {currentQuestion.type === 'scenario' && currentQuestion.scenarioDetails && (
            <div className="space-y-2 pt-2">
              {currentQuestion.scenarioDetails.context && (
                <AnnotatedText
                  idPrefix={`q-${currentQuestion.id}`}
                  field="scenarioContext"
                  text={currentQuestion.scenarioDetails.context}
                  annotations={currentRecord.annotations}
                  onSelectionChange={(field, sel) => setActiveSelection(sel ? { ...sel, field } : null)}
                  className="text-xs text-stone-600 dark:text-stone-400 font-mono"
                />
              )}
              {currentQuestion.scenarioDetails.codeSnippet && (
                <div className="p-4 bg-stone-950 rounded-xl font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed border border-stone-800">
                  <pre>{currentQuestion.scenarioDetails.codeSnippet}</pre>
                </div>
              )}
            </div>
          )}

          {/* 4. Options List (Multiple Choice / Scenario with Alternatives) */}
          {currentQuestion.type !== 'flashcard' && currentQuestion.options && (
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = currentRecord.selectedOptionIds.includes(option.id);
                const letter = String.fromCharCode(65 + optIdx);

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
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500';
                  } else if (isSelected && !option.isCorrect) {
                    optCardStyle =
                      'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500';
                  }
                }

                return (
                  <div
                    key={option.id}
                    id={`opt-choice-${option.id}`}
                    onClick={() => handleSelectOption(option.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3.5 ${optCardStyle}`}
                  >
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
                        text={option.text}
                        annotations={currentRecord.annotations}
                        onSelectionChange={(field, sel) =>
                          setActiveSelection(sel ? { ...sel, field } : null)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. Flashcard Answering Mode (Section 4) */}
          {currentQuestion.type === 'flashcard' && currentQuestion.flashcard && (
            <div className="space-y-4 pt-2">
              {!showFlashcardBack ? (
                <button
                  id="flashcard-reveal-btn"
                  type="button"
                  onClick={() => setShowFlashcardBack(true)}
                  className="w-full py-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <Eye className="w-4 h-4 text-amber-500" />
                  <span>{t('runner.flashcardShow')}</span>
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                      Solution / Command:
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
                      Hard / Missed
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
                      Good
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
                      Easy / Mastered
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. Instant Feedback Reveal Banner (Instant Feedback Mode) */}
          {config.feedbackMode === 'instant-feedback' && instantChecked && (
            <div
              className={`p-4 rounded-xl border space-y-2 animate-in fade-in duration-150 ${
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

              {currentQuestion.explanation && (
                <p className="text-xs leading-relaxed opacity-90">
                  <span className="font-bold">Explanation: </span>
                  {currentQuestion.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 7. BOTTOM NAVIGATION BAR */}
      <footer className="sticky bottom-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 py-3 mt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
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

          {/* Center: Check Answer button for Instant Feedback Mode */}
          {config.feedbackMode === 'instant-feedback' && !instantChecked ? (
            <button
              id="exam-instant-check-btn"
              type="button"
              onClick={() => setInstantChecked(true)}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-98"
            >
              {t('runner.checkAnswer')}
            </button>
          ) : null}

          <div className="flex items-center space-x-2">
            {currentIndex < totalQuestions - 1 ? (
              <button
                id="exam-next-btn"
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center space-x-1.5 px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98"
              >
                <span>{t('runner.nextQuestion')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="exam-finish-btn"
                type="button"
                onClick={() => setShowFinishConfirmModal(true)}
                className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('runner.submitExam')}</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* 8. QUESTION GRID DRAWER (Quick jumping between questions) */}
      {showQuestionGrid && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                Exam Question Navigator
              </h4>
              <button
                onClick={() => setShowQuestionGrid(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-1">
              {examQuestions.map((q, idx) => {
                const rec = records[q.id];
                const isAnswered =
                  rec.selectedOptionIds.length > 0 ||
                  rec.flashcardSelfRating !== 'unrated' ||
                  rec.userTextAnswer;
                const isCurr = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    id={`grid-jump-btn-${idx + 1}`}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowQuestionGrid(false);
                    }}
                    className={`relative p-2.5 rounded-xl text-xs font-bold font-mono transition-all ${
                      isCurr
                        ? 'ring-2 ring-amber-500 bg-amber-500 text-stone-950 font-black shadow-xs'
                        : isAnswered
                        ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                        : 'bg-stone-100 dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 text-stone-400'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {rec.flagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-800">
              <span>Answered: {answeredCount} / {totalQuestions}</span>
              <button
                onClick={() => {
                  setShowQuestionGrid(false);
                  setShowFinishConfirmModal(true);
                }}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                Finish Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. TIME'S UP NOTIFICATION MODAL (Section 5.4) */}
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

      {/* 10. SUBMIT CONFIRMATION MODAL */}
      {showFinishConfirmModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                {t('runner.confirmSubmit')}
              </h3>
              {unansweredCount > 0 && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {t('runner.unansweredWarning', { n: unansweredCount })}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowFinishConfirmModal(false)}
                className="py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {t('app.cancel')}
              </button>

              <button
                id="exam-confirm-submit-btn"
                type="button"
                onClick={() => {
                  setShowFinishConfirmModal(false);
                  handleFinalizeExam();
                }}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors shadow-xs"
              >
                {t('runner.submitExam')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
