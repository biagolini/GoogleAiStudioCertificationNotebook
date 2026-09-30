export type QuestionType = 'multiple-choice' | 'scenario' | 'flashcard';

export type ExamFeedbackMode = 'instant-feedback' | 'final-review';

export type CertificationStatus = 'not-started' | 'target-track' | 'earned';

export type ProviderCategory = 'aws' | 'azure' | 'gcp' | 'kubernetes' | 'terraform' | 'linux' | 'mongodb';

export interface CatalogCertification {
  id: string;
  name: string;
  code: string;
  provider: ProviderCategory;
  level: 'foundational' | 'associate' | 'professional' | 'specialty';
  icon: string;
  color: string;
  description: string;
  examDurationMinutes: number;
  accommodationMinutes?: number;
  domains: CertificationDomain[];
  officialUrl?: string;
}

export interface StudentCertStatus {
  status: CertificationStatus;
  earnedDate?: string;
  credentialUrl?: string;
  targetDate?: string;
  notes?: string;
  updatedAt?: number;
}

export interface StudentProfile {
  name: string;
  title: string;
  bio: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'lead';
  primaryFocus: string[]; // e.g. ['cloud', 'devops', 'security', 'data', 'sysadmin']
  targetProviderInterests: ProviderCategory[];
  certStatuses: Record<string, StudentCertStatus>;
  linkedinUrl?: string;
  githubUrl?: string;
  updatedAt: number;
}

export interface CertificationDomain {
  name: string;
  order: number;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  code?: string;
  version?: string;
  icon: string; // lucide icon name or emoji
  color: string; // tailwind color token or hex
  description?: string;
  examDurationMinutes: number; // e.g. 130 for AWS Associate, 120 for CKA
  accommodationMinutes: number; // e.g. 30 extra minutes
  exportIntroQuestions?: string;
  exportIntroTranscripts?: string;
  exportIntroChat?: string;
  domains?: CertificationDomain[];
  createdAt: number;
  lastStudiedAt: number;
}

export interface Note {
  id: string;
  certId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  googleDocId?: string;
  googleDocUrl?: string;
  lastSyncedToDocsAt?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  certId: string;
  bankId: string;
  type: QuestionType;
  prompt: string;
  domainTag: string; // e.g. "Networking", "Security", "Storage", "Compute"
  options?: QuestionOption[]; // for multiple choice or scenario multiple-choice
  allowMultipleAnswers?: boolean;
  scenarioDetails?: {
    context?: string;
    codeSnippet?: string; // YAML, bash command, log output
    language?: string;
    scenarioType?: 'yaml' | 'command' | 'symptom';
  };
  expectedFreeText?: string; // for free-text scenario answers
  flashcard?: {
    frontPrompt: string;
    backAnswer: string;
    commandSnippet?: string;
  };
  explanation?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QuestionBank {
  id: string;
  certId: string;
  name: string;
  description?: string;
  domainTags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TextAnnotation {
  id: string;
  targetField: 'prompt' | string; // 'prompt', 'option-{id}', 'scenarioContext', 'scenarioCode'
  startOffset: number;
  endOffset: number;
  selectedText: string;
  type: 'highlight' | 'strikethrough';
  createdAt: number;
}

export interface QuestionAttemptRecord {
  questionId: string;
  selectedOptionIds: string[];
  userTextAnswer?: string;
  flashcardSelfRating?: 'easy' | 'good' | 'hard' | 'unrated';
  isCorrect: boolean;
  timeSpentSeconds: number;
  isOvertime: boolean;
  flagged: boolean;
  noteText: string;
  annotations: TextAnnotation[];
  answeredAtTimestamp?: number; // timestamp in exam relative to start
}

export interface ExamAttempt {
  id: string;
  certId: string;
  date: number;
  mode: ExamFeedbackMode;
  useTimer: boolean;
  useAccommodation: boolean;
  durationMinutesConfigured: number;
  totalTimeSpentSeconds: number;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  isOvertimeOverall: boolean;
  stoppedOnTimeScore?: {
    answeredCount: number;
    correctCount: number;
    scorePercent: number;
  };
  questionRecords: QuestionAttemptRecord[];
  bankIds: string[];
}

export interface UserSettings {
  theme: 'light' | 'dark';
  language: 'en' | 'pt' | 'es' | 'it';
  defaultUseTimer: boolean;
  defaultUseAccommodation: boolean;
}

export interface MockExamConfigOptions {
  bankIds: string[];
  questionCount: number;
  examDurationMinutes: number;
  feedbackMode: ExamFeedbackMode;
  useTimer: boolean;
  useAccommodation: boolean;
}
