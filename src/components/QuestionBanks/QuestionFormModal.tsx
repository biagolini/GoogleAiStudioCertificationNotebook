import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Question, QuestionBank, QuestionType, QuestionOption } from '../../types';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Code,
  Layers,
  HelpCircle,
  FileCode,
  Sparkles,
  Terminal,
} from 'lucide-react';

interface QuestionFormModalProps {
  bank: QuestionBank;
  questionToEdit?: Question | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuestionFormModal({
  bank,
  questionToEdit,
  isOpen,
  onClose,
}: QuestionFormModalProps) {
  const { addQuestion, updateQuestion, activeCert } = useApp();
  const { t } = useTranslation();

  const [type, setType] = useState<QuestionType>(questionToEdit?.type || 'multiple-choice');
  const [prompt, setPrompt] = useState(questionToEdit?.prompt || '');
  const [domainTag, setDomainTag] = useState(questionToEdit?.domainTag || bank.domainTags[0] || '');
  const [explanation, setExplanation] = useState(questionToEdit?.explanation || '');

  // Multiple Choice / Scenario choices options
  const [options, setOptions] = useState<QuestionOption[]>(
    questionToEdit?.options && questionToEdit.options.length > 0
      ? questionToEdit.options
      : [
          { id: 'opt-1', text: '', isCorrect: true },
          { id: 'opt-2', text: '', isCorrect: false },
          { id: 'opt-3', text: '', isCorrect: false },
          { id: 'opt-4', text: '', isCorrect: false },
        ]
  );

  // Scenario specific fields
  const [scenarioContext, setScenarioContext] = useState(
    questionToEdit?.scenarioDetails?.context || ''
  );
  const [scenarioCode, setScenarioCode] = useState(
    questionToEdit?.scenarioDetails?.codeSnippet || ''
  );
  const [scenarioType, setScenarioType] = useState<'yaml' | 'command' | 'symptom'>(
    questionToEdit?.scenarioDetails?.scenarioType || 'yaml'
  );
  const [expectedFreeText, setExpectedFreeText] = useState(
    questionToEdit?.expectedFreeText || ''
  );

  // Flashcard specific fields
  const [flashcardFront, setFlashcardFront] = useState(
    questionToEdit?.flashcard?.frontPrompt || ''
  );
  const [flashcardBack, setFlashcardBack] = useState(
    questionToEdit?.flashcard?.backAnswer || ''
  );
  const [flashcardCommand, setFlashcardCommand] = useState(
    questionToEdit?.flashcard?.commandSnippet || ''
  );

  if (!isOpen || !activeCert) return null;

  const handleAddOption = () => {
    setOptions([
      ...options,
      { id: `opt-${Date.now()}-${options.length + 1}`, text: '', isCorrect: false },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const handleToggleCorrectOption = (id: string) => {
    setOptions(
      options.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && type !== 'flashcard') return;
    if (type === 'flashcard' && !flashcardFront.trim()) return;

    const baseQuestionData = {
      certId: activeCert.id,
      bankId: bank.id,
      type,
      prompt: type === 'flashcard' ? flashcardFront.trim() : prompt.trim(),
      domainTag: domainTag.trim() || 'General',
      explanation: explanation.trim(),
    };

    let fullData: any = { ...baseQuestionData };

    if (type === 'multiple-choice') {
      fullData.options = options.map((o) => ({ ...o, text: o.text.trim() }));
      fullData.allowMultipleAnswers = options.filter((o) => o.isCorrect).length > 1;
    } else if (type === 'scenario') {
      fullData.scenarioDetails = {
        context: scenarioContext.trim(),
        codeSnippet: scenarioCode.trim(),
        scenarioType,
      };
      // Scenarios can use multiple choice options or free text
      fullData.options = options.map((o) => ({ ...o, text: o.text.trim() }));
      fullData.expectedFreeText = expectedFreeText.trim();
    } else if (type === 'flashcard') {
      fullData.flashcard = {
        frontPrompt: flashcardFront.trim(),
        backAnswer: flashcardBack.trim(),
        commandSnippet: flashcardCommand.trim(),
      };
    }

    if (questionToEdit) {
      updateQuestion(questionToEdit.id, fullData);
    } else {
      addQuestion(fullData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-6"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              {questionToEdit ? t('question.editTitle') : t('question.createTitle')}
            </h3>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Bank: <span className="font-semibold text-stone-700 dark:text-stone-300">{bank.name}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Question Type Tabs (Adapts Form per Section 4) */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              {t('question.typeLabel')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                id="qtype-mc-btn"
                onClick={() => setType('multiple-choice')}
                className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all ${
                  type === 'multiple-choice'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-left leading-tight">{t('question.typeMultipleChoice')}</span>
              </button>

              <button
                type="button"
                id="qtype-scenario-btn"
                onClick={() => setType('scenario')}
                className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all ${
                  type === 'scenario'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <FileCode className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-left leading-tight">{t('question.typeScenario')}</span>
              </button>

              <button
                type="button"
                id="qtype-flashcard-btn"
                onClick={() => setType('flashcard')}
                className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all ${
                  type === 'flashcard'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Terminal className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-left leading-tight">{t('question.typeFlashcard')}</span>
              </button>
            </div>
          </div>

          {/* Domain / Topic Tag */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              {t('question.domainLabel')} *
            </label>
            <input
              id="question-domain-input"
              type="text"
              required
              value={domainTag}
              onChange={(e) => setDomainTag(e.target.value)}
              placeholder={t('question.domainPlaceholder')}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white"
            />
          </div>

          {/* Multiple Choice & Scenario Common Prompt */}
          {type !== 'flashcard' && (
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                {t('question.promptLabel')} *
              </label>
              <textarea
                id="question-prompt-input"
                rows={3}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('question.promptPlaceholder')}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white resize-none"
              />
            </div>
          )}

          {/* Scenario Specific Configuration (YAML / Symptom / Command) */}
          {type === 'scenario' && (
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t('question.scenarioContext')}
                </label>
                <textarea
                  rows={2}
                  value={scenarioContext}
                  onChange={(e) => setScenarioContext(e.target.value)}
                  placeholder="e.g. Pod 'backend-auth' failed to bind to node due to pod anti-affinity..."
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t('question.scenarioCode')}
                </label>
                <textarea
                  rows={4}
                  value={scenarioCode}
                  onChange={(e) => setScenarioCode(e.target.value)}
                  placeholder="Paste YAML specification, CLI snippet, or terminal output..."
                  className="w-full px-3 py-2 bg-stone-900 text-amber-400 font-mono border border-stone-800 rounded-lg text-xs leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

          {/* Flashcard Inputs */}
          {type === 'flashcard' && (
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t('question.flashcardFront')} *
                </label>
                <textarea
                  rows={2}
                  required
                  value={flashcardFront}
                  onChange={(e) => setFlashcardFront(e.target.value)}
                  placeholder={t('question.flashcardFrontPlaceholder')}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {t('question.flashcardBack')} *
                </label>
                <textarea
                  rows={3}
                  required
                  value={flashcardBack}
                  onChange={(e) => setFlashcardBack(e.target.value)}
                  placeholder={t('question.flashcardBackPlaceholder')}
                  className="w-full px-3 py-2 bg-stone-900 text-emerald-400 font-mono border border-stone-800 rounded-lg text-xs leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

          {/* Answer Alternatives (for Multiple Choice or Scenario with choices) */}
          {type !== 'flashcard' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700 dark:text-stone-300">
                  {t('question.optionsLabel')} (Click icon to mark correct)
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('question.addOption')}</span>
                </button>
              </div>

              <div className="space-y-2">
                {options.map((opt, index) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCorrectOption(opt.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        opt.isCorrect
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-600'
                      }`}
                      title={t('question.markCorrect')}
                    >
                      {opt.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                      placeholder={`${t('question.optionPlaceholder')} (${String.fromCharCode(65 + index)})`}
                      className={`flex-1 px-3 py-1.5 bg-stone-50 dark:bg-stone-800/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white ${
                        opt.isCorrect
                          ? 'border-emerald-500/60 dark:border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-stone-200 dark:border-stone-700'
                      }`}
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation / Rationale */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              {t('question.explanationLabel')}
            </label>
            <textarea
              id="question-explanation-input"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder={t('question.explanationPlaceholder')}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl font-medium"
            >
              {t('app.cancel')}
            </button>
            <button
              id="question-submit-btn"
              type="submit"
              className="px-5 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl font-bold transition-colors"
            >
              {questionToEdit ? t('app.save') : t('app.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
