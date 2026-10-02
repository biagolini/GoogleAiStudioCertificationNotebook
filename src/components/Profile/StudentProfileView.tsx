import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  CERTIFICATION_CATALOG,
  PROVIDERS_LIST,
  catalogCertToPreset,
} from '../../data/certificationCatalog';
import { CertificationStatus, ProviderCategory, StudentCertStatus } from '../../types';
import {
  User,
  Award,
  Target,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight,
  Plus,
  Linkedin,
  Github,
  Globe,
  Filter,
  Calendar,
  Link as LinkIcon,
  Check,
  ChevronRight,
  Shield,
  Layers,
  Terminal,
  Server,
  Cloud,
  Zap,
} from 'lucide-react';

export default function StudentProfileView() {
  const {
    studentProfile,
    updateStudentProfile,
    setCertStatus,
    certifications,
    addCertification,
    setActiveCertId,
    setCurrentView,
  } = useApp();
  const { t } = useTranslation();

  // Local form editing states
  const [name, setName] = useState(studentProfile.name);
  const [title, setTitle] = useState(studentProfile.title);
  const [bio, setBio] = useState(studentProfile.bio);
  const [experienceLevel, setExperienceLevel] = useState(studentProfile.experienceLevel);
  const [nativeLanguage, setNativeLanguage] = useState(studentProfile.nativeLanguage || 'pt');
  const [linkedinUrl, setLinkedinUrl] = useState(studentProfile.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(studentProfile.githubUrl || '');
  const [saveToast, setSaveToast] = useState(false);

  // Catalog filters
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');
  const [expandedCertId, setExpandedCertId] = useState<string | null>(null);

  // Stats calculation
  const statusesList = (Object.values(studentProfile.certStatuses || {}) as StudentCertStatus[]);
  const totalEarned = statusesList.filter((s) => s?.status === 'earned').length;
  const totalTargetTrack = statusesList.filter((s) => s?.status === 'target-track').length;
  const totalActiveWorkspaces = certifications.length;

  // Handle saving profile metadata
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateStudentProfile({
      name: name.trim(),
      title: title.trim(),
      bio: bio.trim(),
      experienceLevel,
      nativeLanguage,
      linkedinUrl: linkedinUrl.trim(),
      githubUrl: githubUrl.trim(),
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Toggle target provider interest
  const toggleProviderInterest = (providerId: ProviderCategory) => {
    const current = studentProfile.targetProviderInterests || [];
    const exists = current.includes(providerId);
    const updated = exists
      ? current.filter((p) => p !== providerId)
      : [...current, providerId];

    updateStudentProfile({ targetProviderInterests: updated });
  };

  // Quick add to workspace
  const handleAddToWorkspace = (catalogCert: typeof CERTIFICATION_CATALOG[0]) => {
    // Check if already in workspace
    const existing = certifications.find(
      (c) => c.code?.toLowerCase() === catalogCert.code.toLowerCase() || c.name === catalogCert.name
    );
    if (existing) {
      setActiveCertId(existing.id);
      setCurrentView('home');
      return;
    }

    const preset = catalogCertToPreset(catalogCert);
    const newCert = addCertification(
      {
        name: preset.name,
        code: preset.code,
        version: preset.version,
        color: preset.color,
        icon: preset.icon,
        description: preset.description,
        examDurationMinutes: preset.examDurationMinutes,
        accommodationMinutes: preset.accommodationMinutes,
        domains: preset.domains,
      },
      { autoCreateDomainBanks: true }
    );

    // If not yet marked as target, mark it
    const currentStatus = studentProfile.certStatuses[catalogCert.id]?.status;
    if (!currentStatus || currentStatus === 'not-started') {
      setCertStatus(catalogCert.id, 'target-track');
    }

    setActiveCertId(newCert.id);
    setCurrentView('home');
  };

  // Filter catalog
  const filteredCatalog = CERTIFICATION_CATALOG.filter((cert) => {
    // Provider filter
    if (selectedProviderFilter !== 'all' && cert.provider !== selectedProviderFilter) {
      return false;
    }

    // Status filter
    const status = studentProfile.certStatuses[cert.id]?.status || 'not-started';
    if (selectedStatusFilter !== 'all' && status !== selectedStatusFilter) {
      return false;
    }

    // Search query
    if (searchCatalogQuery.trim()) {
      const q = searchCatalogQuery.toLowerCase();
      const matchName = cert.name.toLowerCase().includes(q);
      const matchCode = cert.code.toLowerCase().includes(q);
      const matchDesc = cert.description.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
            <User className="w-4 h-4" />
            <span>{t('profile.nav')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            {t('profile.title')}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-3xl">
            {t('profile.subtitle')}
          </p>
        </div>

        {/* Action button to return to home/workspaces */}
        <button
          onClick={() => setCurrentView('home')}
          className="self-start sm:self-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('app.backToHome')}</span>
        </button>
      </div>

      {/* Stats Counter Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center space-x-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-white block leading-tight">
              {totalEarned}
            </span>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {t('profile.statsEarned')}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center space-x-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-white block leading-tight">
              {totalTargetTrack}
            </span>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {t('profile.statsTarget')}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center space-x-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900 dark:text-white block leading-tight">
              {totalActiveWorkspaces}
            </span>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {t('profile.statsActive')}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Student Profile Form) & Right Column (Ecosystems & Tracker) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Student Info Card (5 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="p-5 sm:p-6 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl space-y-5 shadow-xs"
          >
            <div className="flex items-center space-x-3 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-extrabold flex items-center justify-center shadow-xs text-base">
                {name ? name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-white leading-tight">
                  {name || t('profile.personalInfo')}
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {title || 'Certification Candidate'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                {t('profile.nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile.namePlaceholder')}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* Title / Role */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                {t('profile.titleLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('profile.titlePlaceholder')}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* Experience Level */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                {t('profile.expLabel')}
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="beginner">{t('profile.expBeginner')}</option>
                <option value="intermediate">{t('profile.expIntermediate')}</option>
                <option value="advanced">{t('profile.expAdvanced')}</option>
                <option value="lead">{t('profile.expLead')}</option>
              </select>
            </div>

            {/* Native Language for Translation */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>{t('profile.nativeLanguageLabel')}</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Google Translate</span>
              </label>
              <select
                id="student-native-language-select"
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="pt">🇧🇷 Português (Brasil)</option>
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇺🇸 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="it">🇮🇹 Italiano</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="zh-CN">🇨🇳 简体中文</option>
              </select>
              <p className="text-[10px] text-stone-400">
                {t('profile.nativeLanguageHint')}
              </p>
            </div>

            {/* Bio / Study Goals */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                {t('profile.bioLabel')}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('profile.bioPlaceholder')}
                className="w-full p-3 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none leading-relaxed"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
              <span className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                {t('profile.socialLinks')}
              </span>

              <div className="space-y-2">
                <div className="relative flex items-center">
                  <Linkedin className="w-3.5 h-3.5 absolute left-3 text-blue-600 dark:text-blue-400" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder={t('profile.linkedinPlaceholder')}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div className="relative flex items-center">
                  <Github className="w-3.5 h-3.5 absolute left-3 text-stone-700 dark:text-stone-300" />
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder={t('profile.githubPlaceholder')}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{t('profile.saveBtn')}</span>
              </button>

              {saveToast && (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 text-center mt-2 animate-in fade-in">
                  ✓ {t('profile.savedSuccess')}
                </p>
              )}
            </div>
          </form>

          {/* Target Providers Selector Card */}
          <div className="p-5 sm:p-6 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl space-y-4 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                {t('profile.targetProviders')}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                {t('profile.targetProvidersDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {PROVIDERS_LIST.map((provider) => {
                const isSelected = (studentProfile.targetProviderInterests || []).includes(
                  provider.id
                );

                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => toggleProviderInterest(provider.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-stone-900 dark:text-white'
                        : 'border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: provider.color }}
                      />
                      <span className="text-xs font-bold">{provider.name}</span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-200/80 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {isSelected ? '✓ Interesse' : '+ Seguir'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Certification Career Tracker (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header & Description */}
          <div className="bg-gradient-to-br from-amber-50/60 via-stone-50 to-orange-50/40 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-900 border border-amber-200/70 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  {t('profile.trackCatalogTitle')}
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {t('profile.trackCatalogSubtitle')}
                </p>
              </div>
            </div>

            {/* Filter Pills and Search */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Provider filter scroll */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedProviderFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                    selectedProviderFilter === 'all'
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  {t('profile.filterAll')}
                </button>
                {PROVIDERS_LIST.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProviderFilter(p.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                      selectedProviderFilter === p.id
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {p.badge}
                  </button>
                ))}
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center space-x-2 shrink-0">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 font-semibold"
                >
                  <option value="all">Status: Todos</option>
                  <option value="target-track">🎯 {t('profile.statusTarget')}</option>
                  <option value="earned">🏆 {t('profile.statusEarned')}</option>
                  <option value="not-started">⚪ {t('profile.statusNotStarted')}</option>
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={searchCatalogQuery}
                onChange={(e) => setSearchCatalogQuery(e.target.value)}
                placeholder="Filtrar por nome, sigla ou tema (ex: SAA, CKA, Terraform, Security)..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* Catalog Certification Cards List */}
          <div className="space-y-3">
            {filteredCatalog.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl text-stone-500">
                <Award className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                <p className="text-xs font-semibold">{t('profile.emptyCatalogFilter')}</p>
              </div>
            ) : (
              filteredCatalog.map((cert) => {
                const userStatusMeta = studentProfile.certStatuses[cert.id] || {
                  status: 'not-started',
                };
                const currentStatus: CertificationStatus = userStatusMeta.status || 'not-started';

                const isInActiveWorkspace = certifications.some(
                  (c) => c.code?.toLowerCase() === cert.code.toLowerCase() || c.name === cert.name
                );

                const isProviderInterested = (
                  studentProfile.targetProviderInterests || []
                ).includes(cert.provider);

                const isExpanded = expandedCertId === cert.id;

                return (
                  <div
                    key={cert.id}
                    className={`p-4 sm:p-5 bg-white dark:bg-stone-900 rounded-2xl border transition-all shadow-2xs space-y-3.5 ${
                      currentStatus === 'earned'
                        ? 'border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/20 dark:bg-emerald-950/15'
                        : currentStatus === 'target-track'
                        ? 'border-amber-400/80 dark:border-amber-600/70 bg-amber-50/20 dark:bg-amber-950/15'
                        : 'border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    {/* Top Row: Provider badge, Level, Cert title */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs font-bold text-xs"
                          style={{ backgroundColor: cert.color }}
                        >
                          {cert.code.slice(0, 3)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-stone-900 uppercase"
                              style={{ backgroundColor: cert.color }}
                            >
                              {cert.code}
                            </span>

                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 capitalize">
                              {cert.level}
                            </span>

                            {isProviderInterested && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                                ★ {t('profile.badgeTargetProvider')}
                              </span>
                            )}

                            {isInActiveWorkspace && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                                ✓ {t('profile.workspaceExists')}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-stone-900 dark:text-white leading-snug">
                            {cert.name}
                          </h3>

                          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                            {cert.description}
                          </p>
                        </div>
                      </div>

                      {/* 3-State Toggle Segment */}
                      <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl shrink-0 self-start">
                        <button
                          type="button"
                          onClick={() => setCertStatus(cert.id, 'not-started')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            currentStatus === 'not-started'
                              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                          }`}
                        >
                          {t('profile.statusNotStarted')}
                        </button>

                        <button
                          type="button"
                          onClick={() => setCertStatus(cert.id, 'target-track')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 ${
                            currentStatus === 'target-track'
                              ? 'bg-amber-500 text-stone-950 shadow-2xs font-extrabold'
                              : 'text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400'
                          }`}
                        >
                          <span>🎯</span>
                          <span>{t('profile.statusTarget')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCertStatus(cert.id, 'earned');
                            setExpandedCertId(cert.id);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 ${
                            currentStatus === 'earned'
                              ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                              : 'text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                          }`}
                        >
                          <span>🏆</span>
                          <span>{t('profile.statusEarned')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Metadata & Workspace Action */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                      <div className="flex items-center space-x-3 text-[11px] text-stone-500 dark:text-stone-400">
                        <span>{cert.domains.length} domínios oficiais</span>
                        <span>•</span>
                        <span>{cert.examDurationMinutes} min</span>
                        {currentStatus === 'earned' && userStatusMeta.earnedDate && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Conquistada em: {userStatusMeta.earnedDate}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* If earned, toggle credential details editor */}
                        {currentStatus === 'earned' && (
                          <button
                            type="button"
                            onClick={() => setExpandedCertId(isExpanded ? null : cert.id)}
                            className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
                          >
                            {isExpanded ? 'Ocultar Detalhes' : 'Credencial / Data'}
                          </button>
                        )}

                        {/* Add to workspace / Open workspace button */}
                        <button
                          type="button"
                          onClick={() => handleAddToWorkspace(cert)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                            isInActiveWorkspace
                              ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                              : 'bg-stone-900 hover:bg-amber-500 hover:text-white dark:bg-white dark:hover:bg-amber-400 dark:text-stone-900 text-white shadow-2xs'
                          }`}
                        >
                          {isInActiveWorkspace ? (
                            <>
                              <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                              <span>Abrir Workspace</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('profile.addToWorkspace')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Earned Details Drawer (Credly Link & Date) */}
                    {isExpanded && currentStatus === 'earned' && (
                      <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300">
                              {t('profile.earnedDate')}
                            </label>
                            <input
                              type="text"
                              placeholder="ex: 2024-05 ou Maio/2024"
                              value={userStatusMeta.earnedDate || ''}
                              onChange={(e) =>
                                setCertStatus(cert.id, 'earned', { earnedDate: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300">
                              {t('profile.credentialUrl')}
                            </label>
                            <input
                              type="url"
                              placeholder="https://www.credly.com/badges/..."
                              value={userStatusMeta.credentialUrl || ''}
                              onChange={(e) =>
                                setCertStatus(cert.id, 'earned', { credentialUrl: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {userStatusMeta.credentialUrl && (
                          <a
                            href={userStatusMeta.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                          >
                            <span>Ver credencial pública</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
