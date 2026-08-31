import React, { useState } from 'react';
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
  Code,
  FileCode,
  Terminal,
  Tag,
  CheckCircle2,
  FolderOpen,
  Filter,
} from 'lucide-react';
import QuestionFormModal from './QuestionFormModal';

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

  // Modals state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankDesc, setBankDesc] = useState('');
  const [bankDomainTags, setBankDomainTags] = useState('');

  // Question modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string | null>(null);

  if (!activeCert) return null;

  const currentBank = banks.find((b) => b.id === selectedBankId) || (banks.length > 0 ? banks[0] : null);
  const currentBankQuestions = currentBank
    ? allQuestions.filter((q) => q.bankId === currentBank.id)
    : [];

  const openCreateBankModal = () => {
    setEditingBank(null);
    setBankName('');
    setBankDesc('');
    setBankDomainTags('');
    setIsBankModalOpen(true);
  };

  const openEditBankModal = (bank: QuestionBank) => {
    setEditingBank(bank);
    setBankName(bank.name);
    setBankDesc(bank.description || '');
    setBankDomainTags(bank.domainTags.join(', '));
    setIsBankModalOpen(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;

    const tags = bankDomainTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingBank) {
      updateQuestionBank(editingBank.id, {
        name: bankName.trim(),
        description: bankDesc.trim(),
        domainTags: tags,
      });
    } else {
      const created = addQuestionBank({
        certId: activeCert.id,
        name: bankName.trim(),
        description: bankDesc.trim(),
        domainTags: tags,
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

  // Filter questions
  const filteredQuestions = currentBankQuestions.filter((q) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      q.prompt.toLowerCase().includes(term) ||
      (q.domainTag && q.domainTag.toLowerCase().includes(term)) ||
      (q.explanation && q.explanation.toLowerCase().includes(term));

    const matchesDomain = selectedDomainFilter ? q.domainTag === selectedDomainFilter : true;
    return matchesSearch && matchesDomain;
  });

  // Extract unique domains in current bank
  const uniqueDomains = Array.from(new Set(currentBankQuestions.map((q) => q.domainTag))).filter(Boolean);

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">
            {t('banks.title')}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {t('banks.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="banks-create-bank-btn"
            onClick={openCreateBankModal}
            className="flex items-center space-x-2 px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('banks.addBank')}</span>
          </button>

          {currentBank && (
            <button
              id="banks-create-question-btn"
              onClick={openCreateQuestionModal}
              className="flex items-center space-x-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>{t('banks.addQuestion')}</span>
            </button>
          )}
        </div>
      </div>

      {banks.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl space-y-4 max-w-md mx-auto mt-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              {t('banks.emptyTitle')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {t('banks.emptyDesc')}
            </p>
          </div>
          <button
            id="banks-empty-add-btn"
            onClick={openCreateBankModal}
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <span className="flex items-center space-x-1.5">
              <Plus className="w-4 h-4" />
              <span>{t('banks.addBank')}</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Bank Selection List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-1">
              Banks ({banks.length})
            </div>

            <div className="space-y-2">
              {banks.map((bank) => {
                const count = allQuestions.filter((q) => q.bankId === bank.id).length;
                const isSelected = currentBank?.id === bank.id;

                return (
                  <div
                    key={bank.id}
                    id={`bank-tab-${bank.id}`}
                    onClick={() => setSelectedBankId(bank.id)}
                    className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-stone-900 dark:text-white leading-snug line-clamp-1">
                          {bank.name}
                        </h4>
                        {bank.description && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                            {bank.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditBankModal(bank);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete bank "${bank.name}" and its questions?`)) {
                              deleteQuestionBank(bank.id);
                            }
                          }}
                          className="p-1 text-stone-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-100 dark:border-stone-800/80 text-[11px]">
                      <span className="font-semibold text-stone-600 dark:text-stone-400">
                        {count} questions
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

          {/* Right Column: Questions inside Selected Bank (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {currentBank ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4">
                {/* Bank Header Details */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                      {currentBank.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {currentBank.description || 'Collection of practice questions'}
                    </p>
                  </div>

                  <button
                    id="bank-add-q-btn"
                    onClick={openCreateQuestionModal}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold shadow-xs hover:opacity-90 transition-opacity self-start"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('banks.addQuestion')}</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative max-w-sm w-full">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="questions-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search questions or answers..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white placeholder:text-stone-400"
                    />
                  </div>

                  {uniqueDomains.length > 0 && (
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
                      <button
                        onClick={() => setSelectedDomainFilter(null)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 ${
                          selectedDomainFilter === null
                            ? 'bg-amber-500 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {t('banks.allDomains')}
                      </button>
                      {uniqueDomains.map((domain) => (
                        <button
                          key={domain}
                          onClick={() =>
                            setSelectedDomainFilter(
                              selectedDomainFilter === domain ? null : domain
                            )
                          }
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 ${
                            selectedDomainFilter === domain
                              ? 'bg-amber-500 text-white'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Questions List */}
                {currentBankQuestions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-xl space-y-2">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      No questions in this bank yet.
                    </p>
                    <button
                      onClick={openCreateQuestionModal}
                      className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                    >
                      + Add the first question
                    </button>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400">
                    No questions match the current filter.
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
                            <span className="text-[11px] font-mono font-bold text-stone-400">
                              #{idx + 1}
                            </span>
                            {getQuestionTypeBadge(q.type)}
                            {q.domainTag && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                                {q.domainTag}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              id={`q-edit-btn-${q.id}`}
                              onClick={() => openEditQuestionModal(q)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded-lg transition-colors"
                              title="Edit Question"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`q-delete-btn-${q.id}`}
                              onClick={() => {
                                if (confirm('Delete this question?')) {
                                  deleteQuestion(q.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                              title="Delete Question"
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
                            <span className="font-bold">Answer: </span>
                            {q.flashcard.backAnswer}
                          </div>
                        )}

                        {/* Options summary if multiple choice */}
                        {q.type === 'multiple-choice' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1.5 ${
                                  opt.isCorrect
                                    ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                }`}
                              >
                                {opt.isCorrect ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0 ml-1" />
                                )}
                                <span className="truncate">{opt.text}</span>
                              </div>
                            ))}
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
            className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {editingBank ? 'Edit Question Bank' : t('banks.addBank')}
              </h3>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3.5 text-xs">
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
                  {t('banks.domainTags')}
                </label>
                <input
                  id="bank-form-domains"
                  type="text"
                  value={bankDomainTags}
                  onChange={(e) => setBankDomainTags(e.target.value)}
                  placeholder="e.g. Networking, Storage, Security, Compute"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  {t('banks.domainTagsHelp')}
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t('banks.bankDesc')}
                </label>
                <textarea
                  id="bank-form-desc"
                  rows={2}
                  value={bankDesc}
                  onChange={(e) => setBankDesc(e.target.value)}
                  placeholder="Optional description of this domain or topic..."
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
    </div>
  );
}
