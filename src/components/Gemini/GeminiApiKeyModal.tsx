import React, { useState } from 'react';
import { geminiService, GeminiTestConnectionResult } from '../../services/geminiService';
import { useTranslation } from '../../i18n/LanguageContext';
import { Key, Sparkles, ExternalLink, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function GeminiApiKeyModal({ isOpen, onClose, onSaved }: GeminiApiKeyModalProps) {
  const { t, language } = useTranslation();
  const [apiKeyInput, setApiKeyInput] = useState(() => geminiService.getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<GeminiTestConnectionResult | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      geminiService.setApiKey('');
      setTestResult(null);
      if (onSaved) onSaved();
      onClose();
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    const res = await geminiService.testConnection(apiKeyInput.trim(), language);
    setIsTesting(false);
    setTestResult(res);

    if (res.success || res.diagnostics?.isKeyValidAndSaved) {
      geminiService.setApiKey(apiKeyInput.trim());
      if (onSaved) onSaved();
      if (res.success) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    }
  };

  const handleSaveWithoutTest = () => {
    geminiService.setApiKey(apiKeyInput.trim());
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {t('gemini.setupTitle')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t('gemini.setupSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('gemini.apiKeyLabel')}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 flex items-center space-x-1"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showKey ? t('common.hide') : t('common.show')}</span>
              </button>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
              {t('gemini.apiKeyNotice')}
            </p>
          </div>

          {/* AI Studio Link Callout */}
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="text-stone-800 dark:text-stone-200 font-semibold">
                {t('gemini.getKeyHelp')}
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-amber-700 dark:text-amber-300 font-bold hover:underline text-[11px]"
              >
                <span>Google AI Studio (aistudio.google.com)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div className="space-y-2">
              {testResult.success ? (
                <div className="p-3 rounded-xl border text-xs flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('gemini.connectionSuccess')}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{t('gemini.connectionFailed')}</span>
                    </div>
                    <pre className="font-mono text-[10px] bg-stone-900 text-stone-200 dark:bg-black p-2 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-24 border border-stone-800">
                      {testResult.message}
                    </pre>
                  </div>

                  {testResult.diagnostics && (
                    <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/90 dark:bg-amber-950/40 text-xs space-y-1.5 text-amber-950 dark:text-amber-200">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold flex items-center space-x-1.5 text-amber-900 dark:text-amber-300 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{testResult.diagnostics.headline}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 shrink-0">
                          {testResult.diagnostics.badge}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-stone-700 dark:text-stone-300">
                        {testResult.diagnostics.explanation}
                      </p>
                      <div className="pt-1 border-t border-amber-200/80 dark:border-amber-800/60 text-[10px] text-amber-900 dark:text-amber-300">
                        <span className="font-bold">{language.startsWith('pt') ? 'Ação recomendada:' : 'Recommended action:'}</span>{' '}
                        {testResult.diagnostics.actionableTip}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-xs font-semibold"
            >
              {t('common.cancel')}
            </button>

            <button
              type="button"
              onClick={handleSaveWithoutTest}
              className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all"
            >
              {t('gemini.saveOnly')}
            </button>

            <button
              type="submit"
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isTesting ? (
                <span>{t('gemini.testing')}...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('gemini.testAndSave')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
