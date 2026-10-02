import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';
import { geminiService } from '../../services/geminiService';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  Key,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import GeminiApiKeyModal from './GeminiApiKeyModal';

interface GeminiQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  certName?: string;
  userSelectedOptionIds?: string[];
}

export default function GeminiQuestionModal({
  isOpen,
  onClose,
  question,
  certName,
  userSelectedOptionIds = [],
}: GeminiQuestionModalProps) {
  const { t, language } = useTranslation();
  const [hasKey, setHasKey] = useState(() => geminiService.hasApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [inputDoubt, setInputDoubt] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Check key on open
  useEffect(() => {
    if (isOpen) {
      const active = geminiService.hasApiKey();
      setHasKey(active);
      setMessages([]);
      setErrorMsg(null);
      setInputDoubt('');
    }
  }, [isOpen]);

  // Initial explanation trigger when opened and has key
  useEffect(() => {
    if (isOpen && question && hasKey && messages.length === 0 && !isLoading) {
      handleInitialExplanation();
    }
  }, [isOpen, question, hasKey]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen || !question) return null;

  const getUserSelectedTexts = (): string[] => {
    if (!question.options || userSelectedOptionIds.length === 0) return [];
    return question.options
      .filter((opt) => userSelectedOptionIds.includes(opt.id))
      .map((opt) => opt.text);
  };

  const handleInitialExplanation = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const selectedTexts = getUserSelectedTexts();
      const response = await geminiService.explainQuestion({
        question,
        userSelectedOptionTexts: selectedTexts,
        certName,
        language,
        conversationHistory: [],
      });
      setMessages([{ role: 'model', text: response }]);
    } catch (err: any) {
      if (err?.message === 'MISSING_API_KEY') {
        setHasKey(false);
      } else {
        setErrorMsg(err?.message || 'Erro ao conectar com Gemini');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputDoubt.trim() || isLoading) return;

    const doubtText = inputDoubt.trim();
    setInputDoubt('');
    const newMessages = [...messages, { role: 'user' as const, text: doubtText }];
    setMessages(newMessages);

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const selectedTexts = getUserSelectedTexts();
      const response = await geminiService.explainQuestion({
        question,
        userSelectedOptionTexts: selectedTexts,
        userDoubt: doubtText,
        certName,
        language,
        conversationHistory: newMessages,
      });
      setMessages([...newMessages, { role: 'model', text: response }]);
    } catch (err: any) {
      if (err?.message === 'MISSING_API_KEY') {
        setHasKey(false);
      } else {
        setErrorMsg(err?.message || 'Erro ao consultar Gemini');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div
          className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          role="dialog"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-950/40">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                    {t('gemini.questionTutorTitle')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                    gemini-3.8-flash
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {certName || 'CertStudy Tutor'} • {question.domainTag || 'Domínio do Exame'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="p-2 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-xs font-semibold flex items-center space-x-1"
                title={t('gemini.changeKey')}
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">{t('gemini.key')}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Question Summary Pill Card */}
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
              <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('gemini.questionStem')}</span>
              </div>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                {question.prompt}
              </p>

              {question.options && question.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {question.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = userSelectedOptionIds.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-start space-x-1.5 ${
                          opt.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                            : isSelected
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                            : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <span className="font-mono font-bold shrink-0">{letter}.</span>
                        <span className="flex-1">{opt.text}</span>
                        {opt.isCorrect && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        {isSelected && !opt.isCorrect && (
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* If no API key configured */}
            {!hasKey ? (
              <div className="p-6 text-center rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                  {t('gemini.keyRequiredTitle')}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                  {t('gemini.keyRequiredDesc')}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-900 text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center space-x-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{t('gemini.configureKeyBtn')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Chat Conversation Flow */
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start space-x-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-stone-900 font-semibold rounded-br-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-xs border border-stone-200 dark:border-stone-700 whitespace-pre-wrap'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-stone-100/60 dark:bg-stone-800/40 w-fit">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      {t('gemini.analyzing')}...
                    </span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button
                      type="button"
                      onClick={handleInitialExplanation}
                      className="p-1 hover:bg-rose-100 rounded text-rose-700 flex items-center space-x-1 font-bold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{t('common.retry')}</span>
                    </button>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>
            )}
          </div>

          {/* Footer Input for Follow-up Doubts */}
          {hasKey && (
            <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
              <form onSubmit={handleSendFollowUp} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputDoubt}
                  onChange={(e) => setInputDoubt(e.target.value)}
                  placeholder={t('gemini.askDoubtPlaceholder')}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white text-xs disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputDoubt.trim() || isLoading}
                  className="px-4 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center space-x-1.5 shrink-0"
                >
                  <span>{t('gemini.send')}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* API Key Modal if requested */}
      <GeminiApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaved={() => {
          setHasKey(geminiService.hasApiKey());
          if (messages.length === 0) {
            handleInitialExplanation();
          }
        }}
      />
    </>
  );
}
