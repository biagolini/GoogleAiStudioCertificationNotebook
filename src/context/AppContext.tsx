import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Certification,
  Note,
  QuestionBank,
  Question,
  ExamAttempt,
  UserSettings,
  MockExamConfigOptions,
  StudentProfile,
  CertificationStatus,
} from '../types';
import {
  SAMPLE_CERTIFICATIONS,
  SAMPLE_QUESTION_BANKS,
  SAMPLE_QUESTIONS,
  SAMPLE_NOTES,
} from '../data/sampleStarterData';
import {
  generateStephaneMaarekMockSet,
  generateGenericMockSet,
} from '../data/mockQuestionBankGenerator';

interface AppContextType {
  // Navigation & Active Scope
  currentView: 'home' | 'profile';
  setCurrentView: (view: 'home' | 'profile') => void;
  activeCertId: string | null;
  setActiveCertId: (id: string | null) => void;
  activeCert: Certification | null;
  activeTab: 'notes' | 'questionBanks' | 'mockExams';
  setActiveTab: (tab: 'notes' | 'questionBanks' | 'mockExams') => void;

  // Student Profile & Career Tracker
  studentProfile: StudentProfile;
  updateStudentProfile: (updates: Partial<StudentProfile>) => void;
  setCertStatus: (
    certId: string,
    status: CertificationStatus,
    metadata?: { earnedDate?: string; credentialUrl?: string; targetDate?: string; notes?: string }
  ) => void;

  // Active taking exam state
  activeExamAttempt: ExamAttempt | null;
  setActiveExamAttempt: (attempt: ExamAttempt | null) => void;
  activeExamReviewAttempt: ExamAttempt | null;
  setActiveExamReviewAttempt: (attempt: ExamAttempt | null) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  toggleTheme: () => void;

  // Sync state (Google Drive indicator)
  isSyncing: boolean;
  lastSyncedTimestamp: number;

  // Certifications CRUD
  certifications: Certification[];
  addCertification: (
    cert: Omit<Certification, 'id' | 'createdAt' | 'lastStudiedAt'>,
    options?: { autoCreateDomainBanks?: boolean }
  ) => Certification;
  updateCertification: (id: string, updates: Partial<Certification>) => void;
  deleteCertification: (id: string) => void;
  touchCertificationStudyTime: (id: string) => void;

  // Notes CRUD
  notes: Note[];
  getNotesForActiveCert: () => Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Question Banks CRUD
  questionBanks: QuestionBank[];
  getBanksForActiveCert: () => QuestionBank[];
  addQuestionBank: (bank: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>) => QuestionBank;
  updateQuestionBank: (id: string, updates: Partial<QuestionBank>) => void;
  deleteQuestionBank: (id: string) => void;

  // Questions CRUD
  questions: Question[];
  getQuestionsForActiveCert: () => Question[];
  getQuestionsForBank: (bankId: string) => Question[];
  addQuestion: (q: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => Question;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;

  // Exam Attempts CRUD
  examAttempts: ExamAttempt[];
  getAttemptsForActiveCert: () => ExamAttempt[];
  saveExamAttempt: (attempt: ExamAttempt) => void;
  deleteExamAttempt: (attemptId: string) => void;

  // Data helpers
  loadSampleStarterKit: () => void;
  loadMockBanksForActiveCert: (authorName?: string) => void;
  resetAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const STORAGE_KEYS = {
  CERTS: 'certstudy_certifications_v1',
  NOTES: 'certstudy_notes_v1',
  BANKS: 'certstudy_banks_v1',
  QUESTIONS: 'certstudy_questions_v1',
  ATTEMPTS: 'certstudy_attempts_v1',
  SETTINGS: 'certstudy_settings_v1',
  ACTIVE_CERT: 'certstudy_active_cert_v1',
  PROFILE: 'certstudy_student_profile_v1',
  VIEW: 'certstudy_current_view_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  language: 'en',
  defaultUseTimer: true,
  defaultUseAccommodation: false, // Per Section 5.1 & 10: accommodation defaults to OFF for new students
};

const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  name: '',
  title: '',
  bio: '',
  experienceLevel: 'intermediate',
  primaryFocus: ['cloud', 'devops'],
  targetProviderInterests: ['aws', 'kubernetes', 'terraform'],
  certStatuses: {},
  updatedAt: Date.now(),
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings state
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Apply theme class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  }, [settings.theme, updateSettings]);

  // 2. Sync state simulation
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTimestamp, setLastSyncedTimestamp] = useState<number>(Date.now());

  const triggerSyncIndicator = useCallback(() => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncedTimestamp(Date.now());
    }, 600);
  }, []);

  // 3. Core collections (Zero pre-loaded content by default)
  const [certifications, setCertifications] = useState<Certification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CERTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BANKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Active navigation state
  const [currentView, setCurrentViewState] = useState<'home' | 'profile'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIEW);
      if (saved === 'profile') return 'profile';
    } catch (e) {}
    return 'home';
  });

  const setCurrentView = useCallback((view: 'home' | 'profile') => {
    setCurrentViewState(view);
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW, view);
    } catch (e) {}
    if (view === 'profile') {
      setActiveCertIdState(null);
      try {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CERT);
      } catch (e) {}
    }
  }, []);

  const [activeCertId, setActiveCertIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CERT) || null;
    } catch (e) {
      return null;
    }
  });

  const setActiveCertId = useCallback((id: string | null) => {
    setActiveCertIdState(id);
    if (id) {
      setCurrentViewState('home');
      try {
        localStorage.setItem(STORAGE_KEYS.VIEW, 'home');
      } catch (e) {}
    }
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CERT, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CERT);
      }
    } catch (e) {}
  }, []);

  // Student Profile state
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        return { ...DEFAULT_STUDENT_PROFILE, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_STUDENT_PROFILE;
  });

  const persistStudentProfile = useCallback(
    (profile: StudentProfile) => {
      setStudentProfile(profile);
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      } catch (e) {}
      triggerSyncIndicator();
    },
    [triggerSyncIndicator]
  );

  const updateStudentProfile = useCallback(
    (updates: Partial<StudentProfile>) => {
      setStudentProfile((prev) => {
        const updated: StudentProfile = { ...prev, ...updates, updatedAt: Date.now() };
        try {
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
        } catch (e) {}
        triggerSyncIndicator();
        return updated;
      });
    },
    [triggerSyncIndicator]
  );

  const setCertStatus = useCallback(
    (
      certId: string,
      status: CertificationStatus,
      metadata?: { earnedDate?: string; credentialUrl?: string; targetDate?: string; notes?: string }
    ) => {
      setStudentProfile((prev) => {
        const current = prev.certStatuses[certId] || { status: 'not-started' };
        const updatedStatuses = {
          ...prev.certStatuses,
          [certId]: {
            ...current,
            status,
            ...metadata,
            updatedAt: Date.now(),
          },
        };
        const updated: StudentProfile = {
          ...prev,
          certStatuses: updatedStatuses,
          updatedAt: Date.now(),
        };
        try {
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
        } catch (e) {}
        triggerSyncIndicator();
        return updated;
      });
    },
    [triggerSyncIndicator]
  );

  const [activeTab, setActiveTab] = useState<'notes' | 'questionBanks' | 'mockExams'>('notes');
  const [activeExamAttempt, setActiveExamAttempt] = useState<ExamAttempt | null>(null);
  const [activeExamReviewAttempt, setActiveExamReviewAttempt] = useState<ExamAttempt | null>(null);

  // Derive active certification object
  const activeCert = certifications.find((c) => c.id === activeCertId) || null;

  // Persist certifications
  const persistCertifications = (list: Certification[]) => {
    setCertifications(list);
    try {
      localStorage.setItem(STORAGE_KEYS.CERTS, JSON.stringify(list));
    } catch (e) {}
    triggerSyncIndicator();
  };

  // Persist notes
  const persistNotes = (list: Note[]) => {
    setNotes(list);
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(list));
    } catch (e) {}
    triggerSyncIndicator();
  };

  // Persist question banks
  const persistQuestionBanks = (list: QuestionBank[]) => {
    setQuestionBanks(list);
    try {
      localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(list));
    } catch (e) {}
    triggerSyncIndicator();
  };

  // Persist questions
  const persistQuestions = (list: Question[]) => {
    setQuestions(list);
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(list));
    } catch (e) {}
    triggerSyncIndicator();
  };

  // Persist exam attempts
  const persistExamAttempts = (list: ExamAttempt[]) => {
    setExamAttempts(list);
    try {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(list));
    } catch (e) {}
    triggerSyncIndicator();
  };

  // Certifications CRUD
  const addCertification = useCallback(
    (
      certData: Omit<Certification, 'id' | 'createdAt' | 'lastStudiedAt'>,
      options?: { autoCreateDomainBanks?: boolean }
    ): Certification => {
      const newCertId = `cert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newCert: Certification = {
        ...certData,
        id: newCertId,
        createdAt: Date.now(),
        lastStudiedAt: Date.now(),
      };
      persistCertifications([newCert, ...certifications]);

      // Automatically create starter practice exam bank if requested (default: true if domains present)
      const shouldCreateBanks = options?.autoCreateDomainBanks !== false && certData.domains && certData.domains.length > 0;
      if (shouldCreateBanks && certData.domains) {
        const initialBank: QuestionBank = {
          id: `bank-${newCertId}-sim-1`,
          certId: newCertId,
          name: 'Simulado 1 · Prática Geral (Exame Completo)',
          authorOrVendor: 'Simulado Preparatório',
          description: `Simulado completo cobrindo todos os ${certData.domains.length} domínios oficiais da prova.`,
          domainTags: certData.domains.map((d) => d.name),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        persistQuestionBanks([initialBank, ...questionBanks]);
      }

      return newCert;
    },
    [certifications, questionBanks]
  );

  const updateCertification = useCallback((id: string, updates: Partial<Certification>) => {
    const updated = certifications.map((c) => (c.id === id ? { ...c, ...updates } : c));
    persistCertifications(updated);
  }, [certifications]);

  const deleteCertification = useCallback((id: string) => {
    const remainingCerts = certifications.filter((c) => c.id !== id);
    persistCertifications(remainingCerts);
    // Cleanup cascade
    persistNotes(notes.filter((n) => n.certId !== id));
    persistQuestionBanks(questionBanks.filter((b) => b.certId !== id));
    persistQuestions(questions.filter((q) => q.certId !== id));
    persistExamAttempts(examAttempts.filter((a) => a.certId !== id));

    if (activeCertId === id) {
      setActiveCertId(null);
    }
  }, [certifications, notes, questionBanks, questions, examAttempts, activeCertId, setActiveCertId]);

  const touchCertificationStudyTime = useCallback((id: string) => {
    const updated = certifications.map((c) => (c.id === id ? { ...c, lastStudiedAt: Date.now() } : c));
    persistCertifications(updated);
  }, [certifications]);

  // Notes operations
  const getNotesForActiveCert = useCallback(() => {
    if (!activeCertId) return [];
    return notes.filter((n) => n.certId === activeCertId).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, activeCertId]);

  const addNote = useCallback((noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistNotes([newNote, ...notes]);
    if (noteData.certId) touchCertificationStudyTime(noteData.certId);
    return newNote;
  }, [notes, touchCertificationStudyTime]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
    persistNotes(updated);
    const target = notes.find((n) => n.id === id);
    if (target) touchCertificationStudyTime(target.certId);
  }, [notes, touchCertificationStudyTime]);

  const deleteNote = useCallback((id: string) => {
    persistNotes(notes.filter((n) => n.id !== id));
  }, [notes]);

  // Question Banks operations
  const getBanksForActiveCert = useCallback(() => {
    if (!activeCertId) return [];
    return questionBanks.filter((b) => b.certId === activeCertId);
  }, [questionBanks, activeCertId]);

  const addQuestionBank = useCallback((bankData: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>): QuestionBank => {
    const newBank: QuestionBank = {
      ...bankData,
      id: `bank-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistQuestionBanks([...questionBanks, newBank]);
    if (bankData.certId) touchCertificationStudyTime(bankData.certId);
    return newBank;
  }, [questionBanks, touchCertificationStudyTime]);

  const updateQuestionBank = useCallback((id: string, updates: Partial<QuestionBank>) => {
    const updated = questionBanks.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b));
    persistQuestionBanks(updated);
    const target = questionBanks.find((b) => b.id === id);
    if (target) touchCertificationStudyTime(target.certId);
  }, [questionBanks, touchCertificationStudyTime]);

  const deleteQuestionBank = useCallback((id: string) => {
    persistQuestionBanks(questionBanks.filter((b) => b.id !== id));
    // Cascade delete questions in this bank
    persistQuestions(questions.filter((q) => q.bankId !== id));
  }, [questionBanks, questions]);

  // Questions operations
  const getQuestionsForActiveCert = useCallback(() => {
    if (!activeCertId) return [];
    return questions.filter((q) => q.certId === activeCertId);
  }, [questions, activeCertId]);

  const getQuestionsForBank = useCallback((bankId: string) => {
    return questions.filter((q) => q.bankId === bankId);
  }, [questions]);

  const addQuestion = useCallback((qData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Question => {
    const newQ: Question = {
      ...qData,
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistQuestions([...questions, newQ]);
    if (qData.certId) touchCertificationStudyTime(qData.certId);
    return newQ;
  }, [questions, touchCertificationStudyTime]);

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    const updated = questions.map((q) => (q.id === id ? { ...q, ...updates, updatedAt: Date.now() } : q));
    persistQuestions(updated);
    const target = questions.find((q) => q.id === id);
    if (target) touchCertificationStudyTime(target.certId);
  }, [questions, touchCertificationStudyTime]);

  const deleteQuestion = useCallback((id: string) => {
    persistQuestions(questions.filter((q) => q.id !== id));
  }, [questions]);

  // Exam Attempts operations
  const getAttemptsForActiveCert = useCallback(() => {
    if (!activeCertId) return [];
    return examAttempts.filter((a) => a.certId === activeCertId).sort((a, b) => b.date - a.date);
  }, [examAttempts, activeCertId]);

  const saveExamAttempt = useCallback((attempt: ExamAttempt) => {
    const existingIndex = examAttempts.findIndex((a) => a.id === attempt.id);
    let updated: ExamAttempt[];
    if (existingIndex >= 0) {
      updated = [...examAttempts];
      updated[existingIndex] = attempt;
    } else {
      updated = [attempt, ...examAttempts];
    }
    persistExamAttempts(updated);
    if (attempt.certId) touchCertificationStudyTime(attempt.certId);
  }, [examAttempts, touchCertificationStudyTime]);

  const deleteExamAttempt = useCallback((attemptId: string) => {
    persistExamAttempts(examAttempts.filter((a) => a.id !== attemptId));
  }, [examAttempts]);

  // Loader for starter kit demo
  const loadSampleStarterKit = useCallback(() => {
    persistCertifications(SAMPLE_CERTIFICATIONS);
    persistQuestionBanks(SAMPLE_QUESTION_BANKS);
    persistQuestions(SAMPLE_QUESTIONS);
    persistNotes(SAMPLE_NOTES);
    setActiveCertId(SAMPLE_CERTIFICATIONS[0].id);
  }, [setActiveCertId]);

  // Load realistic mock banks (e.g. Stephane Maarek 4 banks x 75 questions)
  const loadMockBanksForActiveCert = useCallback((authorName?: string) => {
    if (!activeCert) return;

    const isAws = activeCert.id.includes('aws') || (activeCert.code && activeCert.code.includes('SAA'));
    const mockData = isAws
      ? generateStephaneMaarekMockSet(activeCert.id, activeCert.domains)
      : generateGenericMockSet(activeCert, authorName || 'Prof. Especialista', 4, 75);

    const otherBanks = questionBanks.filter((b) => b.certId !== activeCert.id);
    const otherQuestions = questions.filter((q) => q.certId !== activeCert.id);

    persistQuestionBanks([...mockData.banks, ...otherBanks]);
    persistQuestions([...mockData.questions, ...otherQuestions]);
    touchCertificationStudyTime(activeCert.id);
  }, [activeCert, questionBanks, questions, touchCertificationStudyTime]);

  // Reset all
  const resetAllData = useCallback(() => {
    persistCertifications([]);
    persistQuestionBanks([]);
    persistQuestions([]);
    persistNotes([]);
    persistExamAttempts([]);
    setActiveCertId(null);
    setCurrentView('home');
    persistStudentProfile(DEFAULT_STUDENT_PROFILE);
    setActiveExamAttempt(null);
    setActiveExamReviewAttempt(null);
  }, [setActiveCertId, setCurrentView, persistStudentProfile]);

  // JSON Export & Import
  const exportDataJSON = useCallback(() => {
    const bundle = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      certifications,
      questionBanks,
      questions,
      notes,
      examAttempts,
      settings,
      studentProfile,
    };
    return JSON.stringify(bundle, null, 2);
  }, [certifications, questionBanks, questions, notes, examAttempts, settings, studentProfile]);

  const importDataJSON = useCallback(
    (jsonStr: string): boolean => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.certifications && Array.isArray(parsed.certifications)) {
          persistCertifications(parsed.certifications);
        }
        if (parsed.questionBanks && Array.isArray(parsed.questionBanks)) {
          persistQuestionBanks(parsed.questionBanks);
        }
        if (parsed.questions && Array.isArray(parsed.questions)) {
          persistQuestions(parsed.questions);
        }
        if (parsed.notes && Array.isArray(parsed.notes)) {
          persistNotes(parsed.notes);
        }
        if (parsed.examAttempts && Array.isArray(parsed.examAttempts)) {
          persistExamAttempts(parsed.examAttempts);
        }
        if (parsed.studentProfile && typeof parsed.studentProfile === 'object') {
          persistStudentProfile({ ...DEFAULT_STUDENT_PROFILE, ...parsed.studentProfile });
        }
        return true;
      } catch (e) {
        console.error('Failed to import backup JSON', e);
        return false;
      }
    },
    [persistStudentProfile]
  );

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        activeCertId,
        setActiveCertId,
        activeCert,
        activeTab,
        setActiveTab,
        studentProfile,
        updateStudentProfile,
        setCertStatus,
        activeExamAttempt,
        setActiveExamAttempt,
        activeExamReviewAttempt,
        setActiveExamReviewAttempt,
        settings,
        updateSettings,
        toggleTheme,
        isSyncing,
        lastSyncedTimestamp,
        certifications,
        addCertification,
        updateCertification,
        deleteCertification,
        touchCertificationStudyTime,
        notes,
        getNotesForActiveCert,
        addNote,
        updateNote,
        deleteNote,
        questionBanks,
        getBanksForActiveCert,
        addQuestionBank,
        updateQuestionBank,
        deleteQuestionBank,
        questions,
        getQuestionsForActiveCert,
        getQuestionsForBank,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        examAttempts,
        getAttemptsForActiveCert,
        saveExamAttempt,
        deleteExamAttempt,
        loadSampleStarterKit,
        loadMockBanksForActiveCert,
        resetAllData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
