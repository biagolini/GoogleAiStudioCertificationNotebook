import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Certification, CertificationDomain } from '../../types';
import {
  CERTIFICATION_PRESETS,
  CertificationPreset,
} from '../../data/certificationPresets';
import {
  Plus,
  Search,
  BookOpen,
  HelpCircle,
  Clock,
  Award,
  MoreVertical,
  Edit2,
  Trash2,
  Sparkles,
  Cloud,
  Terminal,
  Server,
  Shield,
  Layers,
  Zap,
  CheckCircle2,
  Calendar,
  FileJson,
  Upload,
  ChevronRight,
  ChevronDown,
  Check,
  Flame,
} from 'lucide-react';

const COLOR_OPTIONS = [
  { label: 'Amber / Gold', value: '#fdcb6e' },
  { label: 'Red / Crimson', value: '#d63031' },
  { label: 'Warm Orange', value: '#f59e0b' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Sky Blue', value: '#0ea5e9' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Rose', value: '#f43f5e' },
];

const ICON_OPTIONS = [
  { name: 'Award', icon: Award },
  { name: 'Server', icon: Server },
  { name: 'Terminal', icon: Terminal },
  { name: 'Cloud', icon: Cloud },
  { name: 'Shield', icon: Shield },
  { name: 'Layers', icon: Layers },
  { name: 'Zap', icon: Zap },
];

export default function CertificationsList() {
  const {
    certifications,
    addCertification,
    updateCertification,
    deleteCertification,
    setActiveCertId,
    notes,
    questionBanks,
    questions,
    examAttempts,
    loadSampleStarterKit,
  } = useApp();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [activeMenuCertId, setActiveMenuCertId] = useState<string | null>(null);

  // Modal form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [version, setVersion] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [icon, setIcon] = useState('Award');
  const [description, setDescription] = useState('');
  const [examDurationMinutes, setExamDurationMinutes] = useState(130);
  const [accommodationMinutes, setAccommodationMinutes] = useState(0);

  // Suggestions / Preset Selection State
  const [selectedPreset, setSelectedPreset] = useState<CertificationPreset | null>(null);
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<'all' | 'aws' | 'cloud' | 'security'>('all');
  const [autoCreateDomainBanks, setAutoCreateDomainBanks] = useState(true);
  const [showDomainsPreview, setShowDomainsPreview] = useState(true);

  // Custom JSON Import Drawer inside modal
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [jsonImportError, setJsonImportError] = useState<string | null>(null);

  // Additional markdown templates if imported or preset
  const [exportIntroQuestions, setExportIntroQuestions] = useState<string | undefined>();
  const [exportIntroTranscripts, setExportIntroTranscripts] = useState<string | undefined>();
  const [exportIntroChat, setExportIntroChat] = useState<string | undefined>();
  const [domains, setDomains] = useState<CertificationDomain[]>([]);

  const openCreateModal = (presetToPreload?: CertificationPreset) => {
    setEditingCert(null);
    setShowJsonImport(false);
    setJsonImportError(null);
    setJsonInputText('');

    if (presetToPreload) {
      applyPreset(presetToPreload);
    } else {
      setSelectedPreset(null);
      setName('');
      setCode('');
      setVersion('');
      setColor(COLOR_OPTIONS[0].value);
      setIcon('Award');
      setDescription('');
      setExamDurationMinutes(130);
      setAccommodationMinutes(0);
      setExportIntroQuestions(undefined);
      setExportIntroTranscripts(undefined);
      setExportIntroChat(undefined);
      setDomains([]);
      setAutoCreateDomainBanks(true);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (cert: Certification) => {
    setEditingCert(cert);
    setSelectedPreset(null);
    setShowJsonImport(false);
    setJsonImportError(null);
    setName(cert.name);
    setCode(cert.code || '');
    setVersion(cert.version || '');
    setColor(cert.color || COLOR_OPTIONS[0].value);
    setIcon(cert.icon || 'Award');
    setDescription(cert.description || '');
    setExamDurationMinutes(cert.examDurationMinutes || 130);
    setAccommodationMinutes(cert.accommodationMinutes || 0);
    setExportIntroQuestions(cert.exportIntroQuestions);
    setExportIntroTranscripts(cert.exportIntroTranscripts);
    setExportIntroChat(cert.exportIntroChat);
    setDomains(cert.domains || []);
    setIsModalOpen(true);
    setActiveMenuCertId(null);
  };

  const applyPreset = (preset: CertificationPreset) => {
    setSelectedPreset(preset);
    setName(preset.name);
    setCode(preset.code || '');
    setVersion(preset.version || '');
    setColor(preset.color || COLOR_OPTIONS[0].value);
    setIcon(preset.icon || 'Award');
    setDescription(preset.description || '');
    setExamDurationMinutes(preset.examDurationMinutes || 130);
    setAccommodationMinutes(preset.accommodationMinutes || 0);
    setExportIntroQuestions(preset.exportIntroQuestions);
    setExportIntroTranscripts(preset.exportIntroTranscripts);
    setExportIntroChat(preset.exportIntroChat);
    setDomains(preset.domains || []);
    setAutoCreateDomainBanks(true);
  };

  const handleQuickAdd = (preset: CertificationPreset) => {
    const created = addCertification(
      {
        name: preset.name,
        code: preset.code || '',
        version: preset.version || '',
        color: preset.color || '#fdcb6e',
        icon: preset.icon || 'Award',
        description: preset.description || '',
        examDurationMinutes: preset.examDurationMinutes || 130,
        accommodationMinutes: preset.accommodationMinutes || 0,
        exportIntroQuestions: preset.exportIntroQuestions,
        exportIntroTranscripts: preset.exportIntroTranscripts,
        exportIntroChat: preset.exportIntroChat,
        domains: preset.domains || [],
      },
      { autoCreateDomainBanks: true }
    );
    setActiveCertId(created.id);
  };

  const handleSaveCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCert) {
      updateCertification(editingCert.id, {
        name: name.trim(),
        code: code.trim(),
        version: version.trim(),
        color,
        icon,
        description: description.trim(),
        examDurationMinutes: Number(examDurationMinutes) || 120,
        accommodationMinutes: Number(accommodationMinutes) || 0,
        domains: domains.length > 0 ? domains : editingCert.domains,
        exportIntroQuestions: exportIntroQuestions || editingCert.exportIntroQuestions,
        exportIntroTranscripts: exportIntroTranscripts || editingCert.exportIntroTranscripts,
        exportIntroChat: exportIntroChat || editingCert.exportIntroChat,
      });
    } else {
      const created = addCertification(
        {
          name: name.trim(),
          code: code.trim(),
          version: version.trim(),
          color,
          icon,
          description: description.trim(),
          examDurationMinutes: Number(examDurationMinutes) || 120,
          accommodationMinutes: Number(accommodationMinutes) || 0,
          domains: domains.length > 0 ? domains : undefined,
          exportIntroQuestions,
          exportIntroTranscripts,
          exportIntroChat,
        },
        { autoCreateDomainBanks }
      );
      // automatically open newly created cert workspace
      setActiveCertId(created.id);
    }
    setIsModalOpen(false);
  };

  const handleImportJson = () => {
    if (!jsonInputText.trim()) return;
    try {
      const parsed = JSON.parse(jsonInputText.trim());
      if (!parsed.name) {
        setJsonImportError('JSON must contain at least a "name" property.');
        return;
      }

      // Extract duration from description if not given as explicit number
      let duration = parsed.examDurationMinutes;
      if (!duration && parsed.description) {
        const match = parsed.description.match(/(\d+)\s*minutes/i);
        if (match) duration = parseInt(match[1], 10);
      }

      const extractedCode =
        parsed.code || (parsed.name.match(/\(([^)]+)\)/)?.[1] || '');

      setName(parsed.name || '');
      setCode(extractedCode);
      setVersion(parsed.version || '');
      setColor(parsed.color || COLOR_OPTIONS[0].value);
      setDescription(parsed.description || '');
      setExamDurationMinutes(Number(duration) || 130);
      setAccommodationMinutes(Number(parsed.accommodationMinutes) || 0);
      setExportIntroQuestions(parsed.exportIntroQuestions);
      setExportIntroTranscripts(parsed.exportIntroTranscripts);
      setExportIntroChat(parsed.exportIntroChat);
      setDomains(parsed.domains || []);

      setSelectedPreset({
        id: `custom-imported-${Date.now()}`,
        name: parsed.name,
        code: extractedCode,
        version: parsed.version || '',
        color: parsed.color || '#fdcb6e',
        icon: 'Server',
        examDurationMinutes: Number(duration) || 130,
        accommodationMinutes: Number(parsed.accommodationMinutes) || 0,
        description: parsed.description || '',
        domains: parsed.domains || [],
        exportIntroQuestions: parsed.exportIntroQuestions,
        exportIntroTranscripts: parsed.exportIntroTranscripts,
        exportIntroChat: parsed.exportIntroChat,
      });

      setShowJsonImport(false);
      setJsonInputText('');
      setJsonImportError(null);
      setAutoCreateDomainBanks(true);
    } catch (err: any) {
      setJsonImportError(`Invalid JSON format: ${err.message}`);
    }
  };

  const filteredCerts = certifications.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q));
  });

  const filteredPresets = CERTIFICATION_PRESETS.filter((p) => {
    if (presetCategoryFilter === 'aws') return p.name.includes('AWS') || p.code?.includes('DEA') || p.code?.includes('DOP') || p.code?.includes('SAA');
    if (presetCategoryFilter === 'cloud') return p.name.includes('Kubernetes') || p.name.includes('Google') || p.name.includes('Azure') || p.code?.includes('CKA');
    if (presetCategoryFilter === 'security') return p.name.includes('Security') || p.name.includes('Terraform');
    return true;
  });

  const formatLastStudied = (timestamp: number) => {
    if (!timestamp) return t('app.never');
    const diffMs = Date.now() - timestamp;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('app.today');
    if (diffDays === 1) return t('app.yesterday');
    return t('app.daysAgo', { n: diffDays });
  };

  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    const found = ICON_OPTIONS.find((i) => i.name === iconName);
    const IconComponent = found ? found.icon : Award;
    return <IconComponent className={className} />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Home Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            {t('home.title')}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {t('home.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="home-add-cert-btn"
            onClick={() => openCreateModal()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{t('home.addCert')}</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Presets Ribbon */}
      <div className="bg-gradient-to-br from-amber-50/70 via-stone-50 to-orange-50/40 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-900 text-stone-900 dark:text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200/70 dark:border-stone-800 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white tracking-tight">
                {t('home.suggestionsTitle')}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                {t('home.suggestionsSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => openCreateModal()}
            className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-semibold flex items-center space-x-1 self-start md:self-auto transition-colors"
          >
            <span>{t('home.browsePresets')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Preset Cards Scroll / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CERTIFICATION_PRESETS.slice(0, 4).map((preset) => {
            const isAlreadyAdded = certifications.some(
              (c) => c.code === preset.code || c.name === preset.name
            );

            return (
              <div
                key={preset.id}
                className="bg-white/90 hover:bg-white dark:bg-stone-800/80 dark:hover:bg-stone-800 border border-stone-200/90 dark:border-stone-700/80 hover:border-amber-400/60 dark:hover:border-amber-400/50 rounded-xl p-3.5 flex flex-col justify-between transition-all group shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider text-stone-900 shadow-2xs"
                      style={{ backgroundColor: preset.color }}
                    >
                      {preset.code}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{preset.examDurationMinutes}m</span>
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {preset.name}
                  </h3>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-tight">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-stone-100 dark:border-stone-700/50 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-stone-400 dark:text-stone-400 font-medium">
                    {preset.domains.length} domains
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openCreateModal(preset)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 border border-stone-200/70 dark:border-transparent rounded-lg transition-colors"
                      title="Pre-fill registration form"
                    >
                      {t('home.prefillForm')}
                    </button>
                    {!isAlreadyAdded && (
                      <button
                        onClick={() => handleQuickAdd(preset)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors flex items-center space-x-1 shadow-2xs"
                        title="1-Click quick register"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Bar when items exist */}
      {certifications.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="home-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('app.search')}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-amber-400/30 text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
            />
          </div>
          <span className="text-xs text-stone-400 dark:text-stone-500 font-medium hidden sm:inline">
            {filteredCerts.length} / {certifications.length} active
          </span>
        </div>
      )}

      {/* Zero Content Empty State */}
      {certifications.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl space-y-6 shadow-xs max-w-3xl mx-auto mt-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              {t('home.emptyTitle')}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              {t('home.emptyDesc')}
            </p>
          </div>

          {/* Quick Starter Suggestion Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto pt-2">
            {CERTIFICATION_PRESETS.slice(0, 2).map((preset) => (
              <div
                key={preset.id}
                onClick={() => openCreateModal(preset)}
                className="cursor-pointer p-4 bg-stone-50 dark:bg-stone-800/60 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border border-stone-200 dark:border-stone-700 hover:border-amber-500/50 rounded-2xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span
                    className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md text-stone-900"
                    style={{ backgroundColor: preset.color }}
                  >
                    {preset.code}
                  </span>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white leading-tight">
                    {preset.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                    {preset.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <span>{preset.examDurationMinutes} min • {preset.domains.length} domains</span>
                  <span className="flex items-center space-x-1">
                    <span>Start</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="home-empty-add-btn"
              onClick={() => openCreateModal()}
              className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span className="flex items-center justify-center space-x-1.5">
                <Plus className="w-4 h-4" />
                <span>{t('home.addCert')}</span>
              </span>
            </button>

            <button
              id="home-empty-sample-btn"
              onClick={loadSampleStarterKit}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
            >
              <span className="flex items-center justify-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t('app.loadSampleData')}</span>
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Certification Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCerts.map((cert) => {
            const certNotesCount = notes.filter((n) => n.certId === cert.id).length;
            const certBanksCount = questionBanks.filter((b) => b.certId === cert.id).length;
            const certQuestionsCount = questions.filter((q) => q.certId === cert.id).length;
            const certAttemptsCount = examAttempts.filter((a) => a.certId === cert.id).length;

            return (
              <div
                key={cert.id}
                id={`cert-card-${cert.id}`}
                className="group relative bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800/90 rounded-2xl p-5 hover:border-amber-500/50 dark:hover:border-amber-400/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon + Code/Title + Menu */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold"
                        style={{ backgroundColor: cert.color || '#f59e0b' }}
                      >
                        {renderIcon(cert.icon || 'Award', 'w-5 h-5')}
                      </div>
                      <div>
                        {cert.code && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-md">
                            {cert.code}
                          </span>
                        )}
                        <h2 className="text-sm font-bold text-stone-900 dark:text-white mt-1 leading-snug line-clamp-2">
                          {cert.name}
                        </h2>
                      </div>
                    </div>

                    {/* Context Menu Action */}
                    <div className="relative">
                      <button
                        id={`cert-menu-btn-${cert.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuCertId(activeMenuCertId === cert.id ? null : cert.id);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuCertId === cert.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActiveMenuCertId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button
                              id={`cert-edit-btn-${cert.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(cert);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center space-x-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{t('app.edit')}</span>
                            </button>
                            <button
                              id={`cert-delete-btn-${cert.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this certification and its notes?')) {
                                  deleteCertification(cert.id);
                                }
                                setActiveMenuCertId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t('app.delete')}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {cert.description && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-4 leading-relaxed">
                      {cert.description}
                    </p>
                  )}

                  {/* Stat pills */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-stone-100 dark:border-stone-800/80 mb-4 text-center">
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold text-stone-800 dark:text-stone-200 block">
                        {certNotesCount}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                        Notes
                      </span>
                    </div>
                    <div className="space-y-0.5 border-l border-r border-stone-100 dark:border-stone-800/80">
                      <span className="text-xs font-extrabold text-stone-800 dark:text-stone-200 block">
                        {certQuestionsCount}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                        Questions
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold text-stone-800 dark:text-stone-200 block">
                        {certAttemptsCount}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                        Exams
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer: Timing stats & Open Action */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{cert.examDurationMinutes || 120} min</span>
                      {cert.accommodationMinutes > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          (+{cert.accommodationMinutes}m extra)
                        </span>
                      )}
                    </span>

                    <span className="flex items-center space-x-1 font-medium">
                      <span>{t('app.lastStudied')}:</span>
                      <span className="text-stone-600 dark:text-stone-400">
                        {formatLastStudied(cert.lastStudiedAt)}
                      </span>
                    </span>
                  </div>

                  <button
                    id={`open-cert-btn-${cert.id}`}
                    onClick={() => setActiveCertId(cert.id)}
                    className="w-full py-2 bg-stone-100 hover:bg-amber-500 hover:text-white dark:bg-stone-800 dark:hover:bg-amber-500 dark:hover:text-white text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Open Workspace</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Certification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            role="dialog"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  {editingCert ? t('home.editCertModalTitle') : t('home.newCertModalTitle')}
                </h3>
                {!editingCert && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Select a suggested preset to auto-fill or enter details manually
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* If Creating New Cert: Showcase Suggestions Catalog */}
            {!editingCert && (
              <div className="space-y-3 bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      {t('home.suggestionsTitle')}
                    </span>
                  </div>

                  {/* JSON Import button toggle */}
                  <button
                    type="button"
                    onClick={() => setShowJsonImport(!showJsonImport)}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>{showJsonImport ? 'Close JSON Import' : t('home.importJson')}</span>
                  </button>
                </div>

                {/* JSON Import input box if open */}
                {showJsonImport && (
                  <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300">
                      Paste Certification JSON Record
                    </label>
                    <textarea
                      rows={4}
                      value={jsonInputText}
                      onChange={(e) => setJsonInputText(e.target.value)}
                      placeholder='{ "name": "AWS Certified Data Engineer – Associate (DEA-C01)", "color": "#fdcb6e", "domains": [...] }'
                      className="w-full p-2 text-xs font-mono bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white resize-none"
                    />
                    {jsonImportError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        {jsonImportError}
                      </p>
                    )}
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowJsonImport(false)}
                        className="px-3 py-1 text-xs text-stone-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleImportJson}
                        className="px-3 py-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold rounded-lg"
                      >
                        Parse & Pre-fill
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Filters */}
                <div className="flex items-center space-x-1 overflow-x-auto pb-1">
                  {(['all', 'aws', 'cloud', 'security'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPresetCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        presetCategoryFilter === cat
                          ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                          : 'bg-stone-200/70 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                      }`}
                    >
                      {cat === 'all' && t('home.presetFilterAll')}
                      {cat === 'aws' && t('home.presetFilterAws')}
                      {cat === 'cloud' && t('home.presetFilterK8s')}
                      {cat === 'security' && t('home.presetFilterSecurity')}
                    </button>
                  ))}
                </div>

                {/* Presets List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredPresets.map((preset) => {
                    const isSelected = selectedPreset?.id === preset.id || code === preset.code;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-1 ring-amber-500'
                            : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: preset.color }}
                            />
                            <span className="text-[10px] font-bold text-stone-500 uppercase">
                              {preset.code}
                            </span>
                            {preset.examDurationMinutes && (
                              <span className="text-[10px] text-stone-400">
                                • {preset.examDurationMinutes}m
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1">
                            {preset.name}
                          </p>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-1">
                            {preset.domains.length} domains • {preset.description}
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="p-1 text-amber-600 dark:text-amber-400">
                            <Check className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 mt-1">
                            Use
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedPreset && (
                  <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="font-semibold">
                      ✓ Pre-filled: {selectedPreset.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPreset(null)}
                      className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline text-[10px]"
                    >
                      Clear preset
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Main Form Fields */}
            <form onSubmit={handleSaveCert} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t('home.certNameLabel')} *
                </label>
                <input
                  id="cert-form-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('home.certNamePlaceholder')}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t('home.certCodeLabel')}
                  </label>
                  <input
                    id="cert-form-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t('home.certCodePlaceholder')}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t('home.certIconLabel')}
                  </label>
                  <div className="flex items-center space-x-1.5">
                    {ICON_OPTIONS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setIcon(item.name)}
                        className={`p-2 rounded-lg border transition-all ${
                          icon === item.name
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                            : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Tag Selector */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {t('home.certColorLabel')}
                </label>
                <div className="flex items-center space-x-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c.value
                          ? 'ring-2 ring-stone-900 dark:ring-white scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Exam Duration & Accommodation inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
                <div>
                  <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t('home.certDurationLabel')}
                  </label>
                  <input
                    id="cert-form-duration"
                    type="number"
                    min="10"
                    max="360"
                    value={examDurationMinutes}
                    onChange={(e) => setExamDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white text-xs font-semibold"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    {t('home.certDurationHelp')}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                    {t('home.certAccommodationLabel')}
                  </label>
                  <input
                    id="cert-form-accommodation"
                    type="number"
                    min="0"
                    max="180"
                    value={accommodationMinutes}
                    onChange={(e) => setAccommodationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white text-xs font-semibold"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    {t('home.certAccommodationHelp')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Description / Focus
                </label>
                <textarea
                  id="cert-form-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. AWS Associate level certification focusing on data pipelines and storage..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white resize-none"
                />
              </div>

              {/* Domains Breakdown & Auto-create question banks */}
              {domains && domains.length > 0 && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('home.domainsBreakdown', { n: domains.length })}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDomainsPreview(!showDomainsPreview)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      {showDomainsPreview ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {showDomainsPreview && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {domains.map((dom) => (
                        <div
                          key={dom.name}
                          className="p-2 bg-white dark:bg-stone-800 rounded-lg text-[11px] border border-stone-200/60 dark:border-stone-700/60"
                        >
                          <span className="font-bold text-stone-900 dark:text-white">
                            Domain {dom.order}: {dom.name}
                          </span>
                          <p className="text-stone-500 dark:text-stone-400 text-[10px] mt-0.5 leading-tight">
                            {dom.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!editingCert && (
                    <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCreateDomainBanks}
                        onChange={(e) => setAutoCreateDomainBanks(e.target.checked)}
                        className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                        {t('home.autoCreateDomains', { n: domains.length })}
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl font-medium"
                >
                  {t('app.cancel')}
                </button>
                <button
                  id="cert-form-submit-btn"
                  type="submit"
                  className="px-5 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl font-bold transition-colors shadow-xs"
                >
                  {editingCert ? t('app.save') : t('app.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
