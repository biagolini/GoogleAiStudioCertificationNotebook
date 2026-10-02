import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { QuestionBank, Question } from '../../types';
import { geminiService } from '../../services/geminiService';
import {
  Sparkles,
  FileArchive,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  Layers,
  FileText,
  Key,
  X,
  Plus,
  HelpCircle,
} from 'lucide-react';
import GeminiApiKeyModal from '../Gemini/GeminiApiKeyModal';

interface ImportQuestionsAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBankId?: string | null;
  onSuccess?: (bankId: string, count: number) => void;
}

interface ParsedQuestionItem {
  prompt: string;
  type: 'multiple-choice' | 'scenario' | 'flashcard';
  domainTag: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  allowMultipleAnswers?: boolean;
  explanation?: string;
}

export default function ImportQuestionsAiModal({
  isOpen,
  onClose,
  activeBankId,
  onSuccess,
}: ImportQuestionsAiModalProps) {
  const { activeCert, getBanksForActiveCert, addQuestionBank, addQuestionsBulk } = useApp();
  const { t } = useTranslation();

  const banks = getBanksForActiveCert();

  const [selectedBankId, setSelectedBankId] = useState<string>(() => {
    if (activeBankId && banks.some((b) => b.id === activeBankId)) {
      return activeBankId;
    }
    return banks.length > 0 ? banks[0].id : 'new';
  });

  const [newBankName, setNewBankName] = useState('Simulado Importado via IA');
  const [newBankAuthor, setNewBankAuthor] = useState('Documento ZIP / IA');

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [extractedFileName, setExtractedFileName] = useState<string | null>(null);
  const [rawTextContent, setRawTextContent] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Expected questions count
  const [expectedCount, setExpectedCount] = useState<number>(65);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Results
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionItem[]>([]);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !activeCert) return null;

  // HTML cleanup helper
  const cleanHtmlToText = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove script, style, noscript, svg
      const toRemove = doc.querySelectorAll('script, style, noscript, svg, nav, footer, header');
      toRemove.forEach((el) => el.remove());

      return doc.body.innerText || doc.body.textContent || '';
    } catch {
      // Fallback regex strip
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n\s*\n/g, '\n\n');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setFileError(null);
    setExtractedFileName(null);
    setRawTextContent(null);
    setParsedQuestions([]);

    const fileName = selected.name.toLowerCase();

    try {
      if (fileName.endsWith('.zip')) {
        // Read zip with JSZip
        const zip = await JSZip.loadAsync(selected);

        // Find candidate files: .html, .htm, .md, .markdown, .txt
        const candidates: { name: string; file: JSZip.JSZipObject }[] = [];
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir) {
            const lower = relativePath.toLowerCase();
            if (
              lower.endsWith('.html') ||
              lower.endsWith('.htm') ||
              lower.endsWith('.md') ||
              lower.endsWith('.markdown') ||
              lower.endsWith('.txt')
            ) {
              candidates.push({ name: relativePath, file: zipEntry });
            }
          }
        });

        if (candidates.length === 0) {
          setFileError(t('gemini.importNoValidFiles'));
          return;
        }

        // Pick the largest candidate or first candidate
        const chosen = candidates[0];
        setExtractedFileName(chosen.name);
        const text = await chosen.file.async('text');

        if (chosen.name.toLowerCase().endsWith('.html') || chosen.name.toLowerCase().endsWith('.htm')) {
          setRawTextContent(cleanHtmlToText(text));
        } else {
          setRawTextContent(text);
        }
      } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
        const text = await selected.text();
        setExtractedFileName(selected.name);
        setRawTextContent(cleanHtmlToText(text));
      } else if (fileName.endsWith('.md') || fileName.endsWith('.markdown') || fileName.endsWith('.txt')) {
        const text = await selected.text();
        setExtractedFileName(selected.name);
        setRawTextContent(text);
      } else {
        setFileError('Por favor envie um arquivo .zip, .html ou .md.');
      }
    } catch (err: any) {
      setFileError(`Erro ao ler o arquivo: ${err?.message || 'Arquivo corrompido ou formato inválido'}`);
    }
  };

  const handleStartParsing = async () => {
    if (!rawTextContent) {
      setFileError('Nenhum conteúdo de texto carregado para processar.');
      return;
    }

    if (!geminiService.hasApiKey()) {
      setIsKeyModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setFileError(null);
    setProgressStage('Iniciando análise do documento com Gemini...');
    setProgressPercent(5);

    try {
      const domainsList = activeCert.domains?.map((d) => d.name) || [];
      const questions = await geminiService.parseQuestionsFromDocument({
        documentText: rawTextContent,
        expectedCount,
        certName: activeCert.name,
        certDomains: domainsList,
        onProgress: ({ stage, percent }) => {
          setProgressStage(stage);
          setProgressPercent(percent);
        },
      });

      if (questions.length === 0) {
        setFileError('O Gemini não conseguiu identificar questões válidas no formato do documento.');
      } else {
        setParsedQuestions(questions);
      }
    } catch (err: any) {
      if (err?.message === 'MISSING_API_KEY') {
        setIsKeyModalOpen(true);
      } else {
        setFileError(`Erro na API do Gemini: ${err?.message || 'Falha ao processar documento'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToBank = () => {
    if (parsedQuestions.length === 0) return;

    let targetBankId = selectedBankId;

    // Create new bank if chosen
    if (selectedBankId === 'new' || !banks.some((b) => b.id === selectedBankId)) {
      const newBank = addQuestionBank({
        certId: activeCert.id,
        name: newBankName.trim() || 'Simulado Importado via IA',
        authorOrVendor: newBankAuthor.trim() || 'Importação ZIP / IA',
        description: `Importado de ${extractedFileName || file?.name || 'arquivo'} via Gemini AI (${parsedQuestions.length} questões).`,
        domainTags: activeCert.domains?.map((d) => d.name) || [],
      });
      targetBankId = newBank.id;
    }

    // Bulk save questions to AppContext
    const toInsert = parsedQuestions.map((q) => ({
      certId: activeCert.id,
      bankId: targetBankId,
      type: q.type,
      prompt: q.prompt,
      domainTag: q.domainTag,
      options: q.options,
      allowMultipleAnswers: q.allowMultipleAnswers,
      explanation: q.explanation,
    }));

    addQuestionsBulk(toInsert);

    if (onSuccess) {
      onSuccess(targetBankId, parsedQuestions.length);
    }

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div
          className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          role="dialog"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-950/40">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <FileArchive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                    {t('gemini.importZipTitle')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                    Gemini AI Parser
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {activeCert.name} • Extraia questões automaticamente de arquivos .zip (.html ou .md)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-sm"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {parsedQuestions.length === 0 ? (
              <>
                {/* Bank Target Selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    {t('gemini.selectTargetBank')}
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white text-xs font-medium"
                  >
                    <option value="new">+ Criar Novo Banco de Simulado para esta importação</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.authorOrVendor || 'Geral'})
                      </option>
                    ))}
                  </select>

                  {selectedBankId === 'new' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Nome do Novo Banco:
                        </label>
                        <input
                          type="text"
                          value={newBankName}
                          onChange={(e) => setNewBankName(e.target.value)}
                          placeholder="ex: Simulado Oficial 1"
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Professor / Vendor / Fonte:
                        </label>
                        <input
                          type="text"
                          value={newBankAuthor}
                          onChange={(e) => setNewBankAuthor(e.target.value)}
                          placeholder="ex: Stephane Maarek, Neal Davis, etc."
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* File Upload Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    {t('gemini.uploadZipLabel')} (.zip, .html, .md)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      file
                        ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
                        : 'border-stone-300 dark:border-stone-700 hover:border-amber-400 bg-stone-50/50 dark:bg-stone-800/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,.html,.htm,.md,.markdown,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {file ? <FileArchive className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                      </div>
                      <div className="text-xs">
                        {file ? (
                          <div className="space-y-1">
                            <span className="font-bold text-stone-900 dark:text-white block">
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                            {extractedFileName && (
                              <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] block">
                                Documento identificado: {extractedFileName}
                              </span>
                            )}
                            <span className="text-[10px] text-stone-400">Clique para trocar de arquivo</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="font-bold text-stone-800 dark:text-stone-200 block">
                              Clique para anexar arquivo .zip com .html/.md
                            </span>
                            <span className="text-[11px] text-stone-400">
                              Também aceita arquivos .html ou .md diretamente
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expected Count Input */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                      {t('gemini.expectedCountLabel')}
                    </label>
                    <span className="text-[11px] text-stone-400">
                      Ajuda o Gemini a não truncar documentos longos
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {[10, 25, 50, 65, 75, 80].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setExpectedCount(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          expectedCount === preset
                            ? 'bg-amber-500 text-stone-900 shadow-2xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        {preset} {preset === 65 ? '(AWS Assoc)' : preset === 75 ? '(AWS Pro)' : 'Qs'}
                      </button>
                    ))}
                    <div className="flex items-center space-x-1.5 ml-2">
                      <span className="text-xs text-stone-400">Outro:</span>
                      <input
                        type="number"
                        min={1}
                        max={150}
                        value={expectedCount}
                        onChange={(e) => setExpectedCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-bold text-center text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Processing Progress */}
                {isProcessing && (
                  <div className="p-4 bg-stone-100 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-stone-800 dark:text-stone-200 font-bold">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        <span>{progressStage}</span>
                      </div>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {fileError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}
              </>
            ) : (
              /* Review Parsed Questions Before Saving */
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-xs sm:text-sm block">
                        {parsedQuestions.length} questões estruturadas com sucesso pelo Gemini!
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        Revise a lista abaixo e confirme para salvar no banco.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParsedQuestions([])}
                    className="px-3 py-1.5 rounded-xl border border-emerald-300 text-xs text-emerald-800 font-semibold hover:bg-emerald-100/60"
                  >
                    Recomeçar
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {parsedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-stone-400">#{idx + 1}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            {q.domainTag}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400">
                          {q.options.length} alternativas
                        </span>
                      </div>
                      <p className="font-semibold text-stone-900 dark:text-white leading-relaxed">
                        {q.prompt}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg text-[11px] flex items-start space-x-1.5 ${
                              opt.isCorrect
                                ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-700'
                                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-100 dark:border-stone-800'
                            }`}
                          >
                            <span className="font-mono font-bold shrink-0">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {opt.isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="p-2 bg-stone-100 dark:bg-stone-900 rounded-lg text-[11px] text-stone-600 dark:text-stone-400">
                          <span className="font-bold text-stone-700 dark:text-stone-300">
                            Explicação:{' '}
                          </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-xs font-semibold"
            >
              {t('common.cancel')}
            </button>

            {parsedQuestions.length === 0 ? (
              <button
                type="button"
                onClick={handleStartParsing}
                disabled={!rawTextContent || isProcessing}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-900 text-xs font-bold rounded-2xl shadow-xs transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('gemini.importProcessing')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('gemini.importStartParsing')}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveToBank}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('gemini.importSaveQuestions', { n: parsedQuestions.length })}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* API Key Modal if needed */}
      <GeminiApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaved={() => {
          handleStartParsing();
        }}
      />
    </>
  );
}
