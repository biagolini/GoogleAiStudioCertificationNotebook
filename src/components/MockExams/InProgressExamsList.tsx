import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { InProgressExamSession } from '../../types';
import {
  Play,
  Clock,
  Trash2,
  AlertCircle,
  Zap,
  Award,
  Layers,
  Calendar,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface InProgressExamsListProps {
  onResumeSession: (session: InProgressExamSession) => void;
}

export default function InProgressExamsList({ onResumeSession }: InProgressExamsListProps) {
  const {
    activeCert,
    getInProgressSessionsForActiveCert,
    getAllInProgressSessions,
    deleteInProgressSession,
    certifications,
    setActiveCertId,
  } = useApp();
  const { t } = useTranslation();

  const activeCertSessions = getInProgressSessionsForActiveCert();
  const allSessions = getAllInProgressSessions();
  const otherCertSessions = allSessions.filter((s) => s.certId !== activeCert?.id);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSessionCard = (session: InProgressExamSession, isOtherCert = false) => {
    const totalQ = session.questionIds?.length || session.config.questionCount;
    const answeredCount = Object.values(session.records || {}).filter(
      (r) => r.selectedOptionIds.length > 0 || r.flashcardSelfRating !== 'unrated' || (r.userTextAnswer && r.userTextAnswer.trim())
    ).length;
    const percentAnswered = Math.round((answeredCount / Math.max(1, totalQ)) * 100);
    const cert = certifications.find((c) => c.id === session.certId);

    return (
      <div
        key={session.id}
        id={`in-progress-session-${session.id}`}
        className="p-4 sm:p-5 rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-500 transition-all space-y-3.5 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-amber-500 text-stone-950">
                Pausado
              </span>
              <span className="text-xs font-bold text-stone-900 dark:text-white">
                {isOtherCert ? (cert?.name || session.certName || 'Certificação') : 'Simulado em Andamento'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center space-x-2">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>Pausado em {formatDate(session.lastPausedAt || session.createdAt)}</span>
              </span>
              <span>·</span>
              <span className="capitalize">
                {session.config.feedbackMode === 'instant-feedback' ? 'Instant Feedback' : 'Final Review'}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                if (isOtherCert && session.certId) {
                  setActiveCertId(session.certId);
                }
                onResumeSession(session);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Continuar Simulado</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja realmente descartar este simulado pausado? O progresso não salvo será perdido.')) {
                  deleteInProgressSession(session.id);
                }
              }}
              className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Descartar Simulado"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress & Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-700 dark:text-stone-300 font-semibold flex items-center space-x-1.5">
              <span>Progresso:</span>
              <span className="font-mono text-stone-900 dark:text-white font-bold">
                {answeredCount} de {totalQ} questões ({percentAnswered}%)
              </span>
            </span>

            <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px] flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Tempo decorrido: {formatSeconds(session.totalElapsedSeconds)}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, percentAnswered)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1">
            <span>Parou na Questão #{session.currentIndex + 1}</span>
            <span>{totalQ - answeredCount} pendentes</span>
          </div>
        </div>
      </div>
    );
  };

  if (allSessions.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-2">
        <Clock className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
        <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
          Nenhum simulado pausado
        </h4>
        <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto">
          Ao fazer um exame, clique em <strong>Pausar</strong> para salvar seu progresso e continuar a qualquer momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Certification Paused Sessions */}
      {activeCertSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Simulados em Andamento nesta Certificação ({activeCertSessions.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {activeCertSessions.map((session) => renderSessionCard(session, false))}
          </div>
        </div>
      )}

      {/* Other Certifications Paused Sessions */}
      {otherCertSessions.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>Simulados Pausados em Outras Provas ({otherCertSessions.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {otherCertSessions.map((session) => renderSessionCard(session, true))}
          </div>
        </div>
      )}
    </div>
  );
}
