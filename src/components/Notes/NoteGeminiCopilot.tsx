import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../../services/geminiService';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Sparkles,
  Send,
  Loader2,
  Key,
  Copy,
  Check,
  FileEdit,
  PlusCircle,
  Zap,
  BookOpen,
  HelpCircle,
  Layers,
  Flame,
  ArrowRight,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';
import GeminiApiKeyModal from '../Gemini/GeminiApiKeyModal';

interface NoteGeminiCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
  onApplyMarkdown: (newMarkdown: string, mode: 'replace' | 'append') => void;
  certName?: string;
}

interface MessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  proposedMarkdown?: string;
  timestamp: number;
}

export default function NoteGeminiCopilot({
  isOpen,
  onClose,
  noteTitle,
  noteContent,
  onApplyMarkdown,
  certName,
}: NoteGeminiCopilotProps) {
  const { t, language } = useTranslation();
  const [hasKey, setHasKey] = useState(() => geminiService.hasApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedAction, setAppliedAction] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasKey(geminiService.hasApiKey());
  }, [isOpen]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendPrompt = async (
    customPrompt?: string,
    actionType: 'custom' | 'improve' | 'summarize' | 'expand' | 'flashcards' | 'exam_tips' = 'custom'
  ) => {
    const promptToSend = customPrompt || inputPrompt.trim();
    if (!promptToSend && actionType === 'custom') return;
    if (isLoading) return;

    if (!hasKey) {
      setIsKeyModalOpen(true);
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const userDisplay =
      actionType === 'improve'
        ? t('gemini.promptImprove')
        : actionType === 'summarize'
        ? t('gemini.promptSummarize')
        : actionType === 'flashcards'
        ? t('gemini.promptFlashcards')
        : actionType === 'expand'
        ? t('gemini.promptExpand')
        : actionType === 'exam_tips'
        ? t('gemini.promptExamTips')
        : promptToSend;

    const newHistory = [
      ...messages,
      {
        id: userMessageId,
        role: 'user' as const,
        text: userDisplay,
        timestamp: Date.now(),
      },
    ];

    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const result = await geminiService.assistNote({
        noteTitle,
        noteContent,
        userPrompt: promptToSend,
        action: actionType,
        certName,
        language,
        conversationHistory: newHistory.map((m) => ({ role: m.role, text: m.text })),
      });

      const modelMessageId = `model-${Date.now()}`;
      setMessages([
        ...newHistory,
        {
          id: modelMessageId,
          role: 'model',
          text: result.responseText,
          proposedMarkdown: result.proposedMarkdown,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      if (err?.message === 'MISSING_API_KEY') {
        setHasKey(false);
        setIsKeyModalOpen(true);
      } else {
        setMessages([
          ...newHistory,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            text: `Erro ao comunicar com Gemini: ${err?.message || 'Falha na requisição'}`,
            timestamp: Date.now(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleApply = (markdown: string, mode: 'replace' | 'append', msgId: string) => {
    onApplyMarkdown(markdown, mode);
    setAppliedAction(`${mode}-${msgId}`);
    setTimeout(() => setAppliedAction(null), 3000);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-stone-50/95 dark:bg-stone-900/95 border-l border-stone-200 dark:border-stone-800 rounded-2xl shadow-lg overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Copilot Header */}
        <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white/70 dark:bg-stone-900/70 backdrop-blur-xs">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                  {t('gemini.copilotTitle')}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 font-bold rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                {t('gemini.copilotReadingActive')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              className="p-1.5 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-xs"
              title={t('gemini.changeKey')}
            >
              <Key className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-xs"
              title="Fechar painel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Action Quick Pills */}
        <div className="p-2.5 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-100/50 dark:bg-stone-950/20 overflow-x-auto flex items-center space-x-1.5 text-[11px] no-scrollbar">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSendPrompt(undefined, 'improve')}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-500 text-stone-700 dark:text-stone-300 font-semibold shrink-0 flex items-center space-x-1 shadow-2xs transition-all active:scale-95"
          >
            <FileEdit className="w-3 h-3 text-amber-500" />
            <span>{t('gemini.btnImprove')}</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSendPrompt(undefined, 'summarize')}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-500 text-stone-700 dark:text-stone-300 font-semibold shrink-0 flex items-center space-x-1 shadow-2xs transition-all active:scale-95"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{t('gemini.btnSummarize')}</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSendPrompt(undefined, 'flashcards')}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-500 text-stone-700 dark:text-stone-300 font-semibold shrink-0 flex items-center space-x-1 shadow-2xs transition-all active:scale-95"
          >
            <Layers className="w-3 h-3 text-amber-500" />
            <span>{t('gemini.btnFlashcards')}</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSendPrompt(undefined, 'expand')}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-500 text-stone-700 dark:text-stone-300 font-semibold shrink-0 flex items-center space-x-1 shadow-2xs transition-all active:scale-95"
          >
            <BookOpen className="w-3 h-3 text-amber-500" />
            <span>{t('gemini.btnExpand')}</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSendPrompt(undefined, 'exam_tips')}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-500 text-stone-700 dark:text-stone-300 font-semibold shrink-0 flex items-center space-x-1 shadow-2xs transition-all active:scale-95"
          >
            <Flame className="w-3 h-3 text-amber-500" />
            <span>{t('gemini.btnExamTips')}</span>
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
          {!hasKey ? (
            <div className="p-4 text-center rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 mt-4">
              <Sparkles className="w-6 h-6 text-amber-500 mx-auto" />
              <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                {t('gemini.keyRequiredTitle')}
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                {t('gemini.keyRequiredDesc')}
              </p>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-900 text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center space-x-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{t('gemini.configureKeyBtn')}</span>
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2.5 text-stone-400">
              <Sparkles className="w-8 h-8 text-amber-500/60 mx-auto" />
              <p className="font-semibold text-stone-600 dark:text-stone-300 text-xs">
                {t('gemini.copilotEmptyWelcome')}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                {t('gemini.copilotEmptyHelp')}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[92%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-stone-900 font-semibold rounded-br-xs text-xs'
                      : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-xs border border-stone-200 dark:border-stone-700 shadow-2xs whitespace-pre-wrap text-xs'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Proposed Markdown Action Card */}
                {msg.proposedMarkdown && (
                  <div className="mt-2 p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl space-y-2.5 max-w-[96%] shadow-xs">
                    <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/80 pb-1.5">
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{t('gemini.generatedMarkdownBadge')}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMarkdown(msg.proposedMarkdown!, msg.id)}
                        className="text-[10px] font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center space-x-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>{t('common.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{t('common.copy')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto p-2 bg-white/80 dark:bg-stone-900/80 rounded-xl font-mono text-[11px] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800">
                      <pre className="whitespace-pre-wrap">{msg.proposedMarkdown}</pre>
                    </div>

                    {/* Quick Apply Buttons */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApply(msg.proposedMarkdown!, 'replace', msg.id)}
                        className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-all shadow-2xs ${
                          appliedAction === `replace-${msg.id}`
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>
                          {appliedAction === `replace-${msg.id}`
                            ? t('gemini.appliedReplaced')
                            : t('gemini.replaceNoteBtn')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApply(msg.proposedMarkdown!, 'append', msg.id)}
                        className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-all shadow-2xs ${
                          appliedAction === `append-${msg.id}`
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 hover:bg-amber-200 border border-amber-300 dark:border-amber-700'
                        }`}
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>
                          {appliedAction === `append-${msg.id}`
                            ? t('gemini.appliedAppended')
                            : t('gemini.appendNoteBtn')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white dark:bg-stone-800 w-fit border border-stone-200 dark:border-stone-700">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                {t('gemini.copilotThinking')}...
              </span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Footer Prompt Input */}
        {hasKey && (
          <div className="p-2.5 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="flex items-center space-x-1.5"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={t('gemini.copilotInputPlaceholder')}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white text-xs disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 disabled:opacity-40 transition-all font-bold"
                title={t('gemini.send')}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* API Key Modal if requested */}
      <GeminiApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaved={() => {
          setHasKey(geminiService.hasApiKey());
        }}
      />
    </>
  );
}
