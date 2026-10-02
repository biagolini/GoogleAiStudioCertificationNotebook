import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { QuestionBank, Question } from '../../types';
import {
  Plus,
  Search,
  HelpCircle,
  Layers,
  Edit2,
  Trash2,
  ChevronRight,
  FileCode,
  Terminal,
  CheckCircle2,
  UserCheck,
  Award,
  BookOpen,
  PieChart,
  Check,
  Sparkles,
} from 'lucide-react';
import QuestionFormModal from './QuestionFormModal';
import GeminiQuestionModal from '../Gemini/GeminiQuestionModal';
import ImportQuestionsAiModal from './ImportQuestionsAiModal';

export default function QuestionBankManager() {
  const {
    activeCert,
    getBanksForActiveCert,
    getQuestionsForActiveCert,
    addQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    deleteQuestion,
  } = useApp();
  const { t } = useTranslation();

  const banks = getBanksForActiveCert();
  const allQuestions = getQuestionsForActiveCert();

  const [selectedBankId, setSelectedBankId] = useState<string | null>(
    banks.length > 0 ? banks[0].id : null
  );

  // Author filter state
  const [selectedAuthorFilter, setSelectedAuthorFilter] = useState<string | null>(null);

  // Modals state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankAuthor, setBankAuthor] = useState('');
  const [bankDesc, setBankDesc] = useState('');
  const [selectedDomainsForBank, setSelectedDomainsForBank] = useState<string[]>([]);

  // Question modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string | null>(null);

  // Gemini question tutor modal
  const [geminiModalQuestion, setGeminiModalQuestion] = useState<Question | null>(null);

  // Gemini AI ZIP / Document batch import modal
  const [isImportAiModalOpen, setIsImportAiModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!activeCert) return null;

  // Extract unique authors across banks for this certification
  const uniqueAuthors = useMemo(() => {
    const set = new Set<string>();
    banks.forEach((b) => {
      if (b.authorOrVendor && b.authorOrVendor.trim()) {
        set.add(b.authorOrVendor.trim());
      }
    });
    return Array.from(set).sort();
  }, [banks]);

  // Filter banks by author if selected
  const filteredBanks = useMemo(() => {
    if (!selectedAuthorFilter) return banks;
    return banks.filter((b) => b.authorOrVendor === selectedAuthorFilter);
  }, [banks, selectedAuthorFilter]);

  // Current selected bank
  const currentBank =
    filteredBanks.find((b) => b.id === selectedBankId) ||
    banks.find((b) => b.id === selectedBankId) ||
    (filteredBanks.length > 0 ? filteredBanks[0] : banks.length > 0 ? banks[0] : null);

  const currentBankQuestions = currentBank
    ? allQuestions.filter((q) => q.bankId === currentBank.id)
    : [];

  // Active cert official domains (guaranteed list)
  const certDomains = activeCert.domains || [];

  // Domain breakdown for the active bank
  const domainBreakdown = useMemo(() => {
    const total = currentBankQuestions.length;
    if (certDomains.length === 0) {
      // Fallback if cert has no explicit domains
      const map: Record<string, number> = {};
      currentBankQuestions.forEach((q) => {
        const d = q.domainTag || 'General';
        map[d] = (map[d] || 0) + 1;
      });
      return Object.entries(map).map(([name, count], idx) => ({
        name,
        order: idx + 1,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
    }

    return certDomains.map((dom) => {
      const count = currentBankQuestions.filter((q) => q.domainTag === dom.name).length;
      return {
        name: dom.name,
        order: dom.order,
        description: dom.description,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  }, [certDomains, currentBankQuestions]);

  const openCreateBankModal = () => {
    setEditingBank(null);
    setBankName('');
    setBankAuthor(selectedAuthorFilter || 'Stephane Maarek');
    setBankDesc('');
    // By default, cover all official certification domains
    setSelectedDomainsForBank(certDomains.map((d) => d.name));
    setIsBankModalOpen(true);
  };

  const openEditBankModal = (bank: QuestionBank) => {
    setEditingBank(bank);
    setBankName(bank.name);
    setBankAuthor(bank.authorOrVendor || '');
    setBankDesc(bank.description || '');
    setSelectedDomainsForBank(bank.domainTags && bank.domainTags.length > 0 ? bank.domainTags : certDomains.map((d) => d.name));
    setIsBankModalOpen(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;

    const domainsToSave = selectedDomainsForBank.length > 0
      ? selectedDomainsForBank
      : certDomains.map((d) => d.name);

    if (editingBank) {
      updateQuestionBank(editingBank.id, {
        name: bankName.trim(),
        authorOrVendor: bankAuthor.trim() || undefined,
        description: bankDesc.trim(),
        domainTags: domainsToSave,
      });
    } else {
      const created = addQuestionBank({
        certId: activeCert.id,
        name: bankName.trim(),
        authorOrVendor: bankAuthor.trim() || undefined,
        description: bankDesc.trim(),
        domainTags: domainsToSave,
      });
      setSelectedBankId(created.id);
    }
    setIsBankModalOpen(false);
  };

  const openCreateQuestionModal = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (question: Question) => {
    setEditingQuestion(question);
    setIsQuestionModalOpen(true);
  };

  // Filter questions by search and domain
  const filteredQuestions = currentBankQuestions.filter((q) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      q.prompt.toLowerCase().includes(term) ||
      (q.domainTag && q.domainTag.toLowerCase().includes(term)) ||
      (q.explanation && q.explanation.toLowerCase().includes(term));

    const matchesDomain = selectedDomainFilter ? q.domainTag === selectedDomainFilter : true;
    return matchesSearch && matchesDomain;
  });

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'scenario':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center space-x-1">
            <FileCode className="w-3 h-3" />
            <span>Scenario / YAML</span>
          </span>
        );
      case 'flashcard':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center space-x-1">
            <Terminal className="w-3 h-3" />
            <span>Flashcard</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center space-x-1">
            <HelpCircle className="w-3 h-3" />
            <span>Multiple Choice</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/80 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-100 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-emerald-700 dark:text-emerald-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              {t('banks.title')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              {banks.length} {banks.length === 1 ? 'Simulado' : 'Simulados'}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {t('banks.subtitle')}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Import via AI (.zip) Button */}
          <button
            id="banks-import-ai-btn"
            onClick={() => setIsImportAiModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-98"
            title="Importar lote de questões a partir de arquivo .zip (.html ou .md) com Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('gemini.importZipBtn')}</span>
          </button>

          <button
            id="banks-create-bank-btn"
            onClick={openCreateBankModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('banks.addBank')}</span>
          </button>

          {currentBank && (
            <button
              id="banks-create-question-btn"
              onClick={openCreateQuestionModal}
              className="flex items-center space-x-1.5 px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('banks.addQuestion')}</span>
            </button>
          )}
        </div>
      </div>

      {banks.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl space-y-5 max-w-lg mx-auto mt-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              {t('banks.emptyTitle')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {t('banks.emptyDesc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              id="banks-empty-import-ai-btn"
              onClick={() => setIsImportAiModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('gemini.importZipBtn')}</span>
            </button>

            <button
              id="banks-empty-add-btn"
              onClick={openCreateBankModal}
              className="px-4 py-2.5 bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('banks.addBank')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Bank Selection List with Instructor Filter (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            {/* Instructor Filter Tabs */}
            {uniqueAuthors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-1 flex items-center justify-between">
                  <span>{t('banks.filterByAuthor')}</span>
                  <span className="font-mono text-[10px]">{uniqueAuthors.length} professores</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  <button
                    onClick={() => setSelectedAuthorFilter(null)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                      selectedAuthorFilter === null
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {t('banks.allAuthors')} ({banks.length})
                  </button>
                  {uniqueAuthors.map((author) => {
                    const authorBankCount = banks.filter((b) => b.authorOrVendor === author).length;
                    const isSelected = selectedAuthorFilter === author;
                    return (
                      <button
                        key={author}
                        onClick={() => setSelectedAuthorFilter(isSelected ? null : author)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        <UserCheck className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[130px]">{author}</span>
                        <span className="opacity-80 font-mono text-[10px]">({authorBankCount})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of Banks */}
            <div className="space-y-2.5">
              {filteredBanks.map((bank) => {
                const bankQuestions = allQuestions.filter((q) => q.bankId === bank.id);
                const count = bankQuestions.length;
                const isSelected = currentBank?.id === bank.id;

                // Quick counts per official domain
                const domainCounts = certDomains.map((dom) => ({
                  order: dom.order,
                  count: bankQuestions.filter((q) => q.domainTag === dom.name).length,
                }));

                return (
                  <div
                    key={bank.id}
                    id={`bank-tab-${bank.id}`}
                    onClick={() => setSelectedBankId(bank.id)}
                    className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/25 shadow-xs ring-1 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        {bank.authorOrVendor && (
                          <div className="flex items-center space-x-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <UserCheck className="w-3 h-3 shrink-0" />
                            <span className="truncate">{bank.authorOrVendor}</span>
                          </div>
                        )}
                        <h4 className="font-bold text-xs text-stone-900 dark:text-white leading-snug line-clamp-1">
                          {bank.name}
                        </h4>
                        {bank.description && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                            {bank.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditBankModal(bank);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Excluir o banco "${bank.name}" e todas as suas ${count} questões?`)) {
                              deleteQuestionBank(bank.id);
                            }
                          }}
                          className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Domain counts mini-pill */}
                    {domainCounts.length > 0 && count > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap gap-1">
                        {domainCounts.map((d) => (
                          <span
                            key={d.order}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                            title={`Domínio ${d.order}: ${d.count} questões neste simulado`}
                          >
                            D{d.order}: {d.count}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100 dark:border-stone-800/80 text-[11px]">
                      <span className="font-extrabold text-stone-700 dark:text-stone-300 font-mono">
                        {count} {count === 1 ? 'questão' : 'questões'}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isSelected ? 'text-amber-600 dark:text-amber-400 translate-x-0.5' : 'text-stone-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Questions inside Selected Bank & Domain Breakdown (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {currentBank ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 space-y-5">
                {/* Bank Header Details */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div className="space-y-1">
                    {currentBank.authorOrVendor && (
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Professor / Autor: {currentBank.authorOrVendor}</span>
                      </div>
                    )}
                    <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">
                      {currentBank.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      {currentBank.description || 'Simulado prático completo cobrindo os domínios oficiais da prova.'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      id="bank-edit-btn"
                      onClick={() => openEditBankModal(currentBank)}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
                    >
                      {t('app.edit')}
                    </button>
                    <button
                      id="bank-add-q-btn"
                      onClick={openCreateQuestionModal}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold shadow-xs hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('banks.addQuestion')}</span>
                    </button>
                  </div>
                </div>

                {/* Domain Distribution Visualizer for this Bank */}
                {domainBreakdown.length > 0 && currentBankQuestions.length > 0 && (
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <PieChart className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                          {t('banks.domainBreakdown')} ({currentBankQuestions.length} questões no total)
                        </h4>
                      </div>
                      {selectedDomainFilter && (
                        <button
                          onClick={() => setSelectedDomainFilter(null)}
                          className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          Limpar filtro de domínio
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {domainBreakdown.map((dom) => {
                        const isFiltered = selectedDomainFilter === dom.name;
                        return (
                          <div
                            key={dom.name}
                            onClick={() => setSelectedDomainFilter(isFiltered ? null : dom.name)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isFiltered
                                ? 'bg-amber-100/70 dark:bg-amber-950/50 border-amber-500 ring-1 ring-amber-500/30'
                                : 'bg-white dark:bg-stone-900/90 border-stone-200 dark:border-stone-700/80 hover:border-amber-300 dark:hover:border-stone-600'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                  Domínio {dom.order}
                                </span>
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                  {dom.percent}%
                                </span>
                              </div>
                              <p className="font-semibold text-xs text-stone-900 dark:text-white line-clamp-1 mt-0.5">
                                {dom.name.split(':')[1]?.trim() || dom.name}
                              </p>
                            </div>

                            <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                                {dom.count} Qs
                              </span>
                              <span className="text-[10px] text-stone-400">
                                {isFiltered ? 'Filtrado' : 'Clique p/ filtrar'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative max-w-sm w-full">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="questions-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar enunciados, respostas ou serviços..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white placeholder:text-stone-400"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
                    <button
                      onClick={() => setSelectedDomainFilter(null)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                        selectedDomainFilter === null
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {t('banks.allDomains')} ({currentBankQuestions.length})
                    </button>
                    {certDomains.map((dom) => {
                      const domCount = currentBankQuestions.filter((q) => q.domainTag === dom.name).length;
                      const isSelected = selectedDomainFilter === dom.name;
                      return (
                        <button
                          key={dom.name}
                          onClick={() => setSelectedDomainFilter(isSelected ? null : dom.name)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                          }`}
                        >
                          D{dom.order} ({domCount})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Questions List */}
                {currentBankQuestions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl space-y-3">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Nenhuma questão cadastrada neste simulado ainda.
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={openCreateQuestionModal}
                        className="px-3.5 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
                      >
                        + {t('banks.addQuestion')}
                      </button>
                    </div>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400">
                    Nenhuma questão encontrada com os filtros selecionados.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        id={`q-item-${q.id}`}
                        className="p-4 bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 rounded-xl space-y-2.5 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-stone-400 dark:text-stone-500">
                              #{idx + 1}
                            </span>
                            {getQuestionTypeBadge(q.type)}
                            {q.domainTag && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                                {q.domainTag}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setGeminiModalQuestion(q)}
                              className="px-2 py-1 text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors flex items-center space-x-1 text-[11px] font-bold"
                              title={t('gemini.askTutorTooltip')}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span className="hidden sm:inline">{t('gemini.askTutorBtn')}</span>
                            </button>

                            <button
                              id={`q-edit-btn-${q.id}`}
                              onClick={() => openEditQuestionModal(q)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded-lg transition-colors"
                              title="Editar Questão"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`q-delete-btn-${q.id}`}
                              onClick={() => {
                                if (confirm('Excluir esta questão?')) {
                                  deleteQuestion(q.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                              title="Excluir Questão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Prompt */}
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-relaxed">
                          {q.prompt}
                        </p>

                        {/* Snippet preview if scenario */}
                        {q.type === 'scenario' && q.scenarioDetails?.codeSnippet && (
                          <div className="p-2.5 bg-stone-900 rounded-lg font-mono text-[11px] text-amber-300 overflow-x-auto max-h-24">
                            <pre>{q.scenarioDetails.codeSnippet}</pre>
                          </div>
                        )}

                        {/* Flashcard back preview */}
                        {q.type === 'flashcard' && q.flashcard && (
                          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300">
                            <span className="font-bold">Resposta: </span>
                            {q.flashcard.backAnswer}
                          </div>
                        )}

                        {/* Options summary if multiple choice */}
                        {q.type === 'multiple-choice' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-start space-x-1.5 ${
                                  opt.isCorrect
                                    ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                }`}
                              >
                                {opt.isCorrect ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0 ml-1 mt-1.5" />
                                )}
                                <span className="line-clamp-2">{opt.text}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-stone-100 dark:border-stone-800/80">
                            <span className="font-bold text-stone-700 dark:text-stone-300">Explicação: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Create / Edit Bank Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {editingBank ? 'Editar Banco de Simulado' : t('banks.addBank')}
              </h3>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t('banks.bankName')} *
                </label>
                <input
                  id="bank-form-name"
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={t('banks.bankNamePlaceholder')}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t('banks.author')} (Professor / Fonte)
                </label>
                <input
                  id="bank-form-author"
                  type="text"
                  value={bankAuthor}
                  onChange={(e) => setBankAuthor(e.target.value)}
                  placeholder={t('banks.authorPlaceholder')}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white"
                />
                {/* Common Instructor Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Stephane Maarek', 'Tutorials Dojo (Jon Bonso)', 'Neal Davis', 'KodeKloud', 'Whizlabs'].map((author) => (
                    <button
                      key={author}
                      type="button"
                      onClick={() => setBankAuthor(author)}
                      className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-[10px] font-semibold text-stone-600 dark:text-stone-300"
                    >
                      + {author}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Exam Domains Covered Checklist */}
              {certDomains.length > 0 && (
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t('banks.domainCoverage')}
                  </label>
                  <span className="text-[10px] text-stone-400 block mb-2">
                    {t('banks.domainCoverageHelp')}
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {certDomains.map((dom) => {
                      const isChecked = selectedDomainsForBank.includes(dom.name);
                      return (
                        <label
                          key={dom.name}
                          className="flex items-center space-x-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDomainsForBank([...selectedDomainsForBank, dom.name]);
                              } else {
                                setSelectedDomainsForBank(selectedDomainsForBank.filter((d) => d !== dom.name));
                              }
                            }}
                            className="rounded border-stone-300 text-amber-500 focus:ring-amber-500 shrink-0"
                          />
                          <span className="text-[11px] font-medium text-stone-800 dark:text-stone-200 leading-tight">
                            Domínio {dom.order}: {dom.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t('banks.bankDesc')}
                </label>
                <textarea
                  id="bank-form-desc"
                  rows={2}
                  value={bankDesc}
                  onChange={(e) => setBankDesc(e.target.value)}
                  placeholder="Informações adicionais sobre este simulado, foco das questões ou data de compra..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl font-medium"
                >
                  {t('app.cancel')}
                </button>
                <button
                  id="bank-form-submit-btn"
                  type="submit"
                  className="px-5 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl font-bold transition-colors"
                >
                  {editingBank ? t('app.save') : t('app.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Create / Edit Modal */}
      {isQuestionModalOpen && currentBank && (
        <QuestionFormModal
          bank={currentBank}
          questionToEdit={editingQuestion}
          isOpen={isQuestionModalOpen}
          onClose={() => setIsQuestionModalOpen(false)}
        />
      )}

      {/* Gemini Question Tutor Modal */}
      {geminiModalQuestion && (
        <GeminiQuestionModal
          isOpen={Boolean(geminiModalQuestion)}
          onClose={() => setGeminiModalQuestion(null)}
          question={geminiModalQuestion}
          certName={activeCert.name}
        />
      )}

      {/* Gemini AI Batch Import Modal (.zip, .html, .md) */}
      {isImportAiModalOpen && (
        <ImportQuestionsAiModal
          isOpen={isImportAiModalOpen}
          onClose={() => setIsImportAiModalOpen(false)}
          activeBankId={selectedBankId}
          onSuccess={(targetBankId, count) => {
            setSelectedBankId(targetBankId);
            setToastMessage(`Importadas com sucesso ${count} questões no banco!`);
            setTimeout(() => setToastMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
}
