import React from 'react';
import { useApp } from '../../context/AppContext';
import WorkspaceHeader from './WorkspaceHeader';
import NotesList from '../Notes/NotesList';
import QuestionBankManager from '../QuestionBanks/QuestionBankManager';
import MockExamConfig from '../MockExams/MockExamConfig';
import ExamRunner from '../MockExams/ExamRunner';
import ExamResults from '../MockExams/ExamResults';
import { MockExamConfigOptions, ExamAttempt } from '../../types';

export default function CertificationWorkspace() {
  const {
    activeCert,
    activeTab,
    activeExamAttempt,
    setActiveExamAttempt,
    activeExamReviewAttempt,
    setActiveExamReviewAttempt,
    addExamAttempt,
  } = useApp();

  if (!activeCert) return null;

  // 1. If currently taking an exam
  if (activeExamAttempt) {
    return (
      <ExamRunner
        config={activeExamAttempt}
        onFinishExam={(attempt: ExamAttempt) => {
          const saved = addExamAttempt(attempt);
          setActiveExamAttempt(null);
          setActiveExamReviewAttempt(saved);
        }}
        onExitExam={() => {
          if (confirm('Exit exam? Progress on this uncompleted attempt will not be recorded.')) {
            setActiveExamAttempt(null);
          }
        }}
      />
    );
  }

  // 2. If reviewing an exam result
  if (activeExamReviewAttempt) {
    return (
      <div>
        <WorkspaceHeader />
        <ExamResults
          attempt={activeExamReviewAttempt}
          onBackToWorkspace={() => setActiveExamReviewAttempt(null)}
          onRetake={() => {
            const lastConfig: MockExamConfigOptions = {
              bankIds: activeExamReviewAttempt.bankIds,
              questionCount: activeExamReviewAttempt.totalQuestions,
              examDurationMinutes: activeExamReviewAttempt.durationMinutesConfigured,
              feedbackMode: activeExamReviewAttempt.mode,
              useTimer: activeExamReviewAttempt.useTimer,
              useAccommodation: activeExamReviewAttempt.useAccommodation,
            };
            setActiveExamReviewAttempt(null);
            setActiveExamAttempt(lastConfig);
          }}
        />
      </div>
    );
  }

  // 3. Normal Workspace View with Persistent WorkspaceHeader
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors pb-16">
      <WorkspaceHeader />

      <main className="flex-1">
        {activeTab === 'notes' && <NotesList />}
        {activeTab === 'questionBanks' && <QuestionBankManager />}
        {activeTab === 'mockExams' && (
          <MockExamConfig
            onStartExam={(config) => setActiveExamAttempt(config)}
            onReviewAttempt={(attempt) => setActiveExamReviewAttempt(attempt)}
          />
        )}
      </main>
    </div>
  );
}
