import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbManager } from '../utils/database';
import type { Subject, Question, LearningRecord, StudySession, AppSettings } from '../types';
import { useAuth } from './AuthContext';

interface DatabaseContextType {
  // 狀態
  subjects: Subject[];
  questions: Question[];
  learningRecords: LearningRecord[];
  studySessions: StudySession[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  // 科目操作
  createSubject: (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Subject>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  // 題目操作
  createQuestion: (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Question>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  getQuestionsBySubject: (subjectId: string) => Question[];

  // 學習記錄操作
  createLearningRecord: (record: Omit<LearningRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LearningRecord>;
  updateLearningRecord: (id: string, updates: Partial<LearningRecord>) => Promise<void>;
  getLearningRecord: (questionId: string) => LearningRecord | undefined;

  // 學習會話操作
  createStudySession: (session: Omit<StudySession, 'id'>) => Promise<StudySession>;
  updateStudySession: (id: string, updates: Partial<StudySession>) => Promise<void>;

  // 設置操作
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // 數據操作
  exportData: () => Promise<any>;
  importData: (data: any) => Promise<void>;
  clearAllData: () => Promise<void>;

  // 刷新數據
  refreshData: () => Promise<void>;

  // 取得所有到期待複習的學習記錄（不限於當天，並依 nextReview 時間排序）
  getDueLearningRecords: () => LearningRecord[];
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    showHints: true,
    autoAdvance: false,
    soundEnabled: true,
    keyboardShortcuts: true,
    reviewInterval: 1,
    newQuestionsPerSession: 20,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化/切換使用者時載入數據
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        dbManager.setUserId(user ? user.uid : null);
        if (user) {
          await dbManager.init();
          await refreshData();
        } else {
          // 清空本地狀態
          setSubjects([]);
          setQuestions([]);
          setLearningRecords([]);
          setStudySessions([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
        console.error('Database initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // 刷新所有數據
  const refreshData = async () => {
    try {
      const [subjectsData, questionsData, recordsData, sessionsData, settingsData] = await Promise.all([
        dbManager.getAllSubjects(),
        dbManager.getAllQuestions(),
        dbManager.getAllLearningRecords(),
        dbManager.getAllStudySessions(),
        dbManager.getSettings(),
      ]);

      setSubjects(subjectsData);
      setQuestions(questionsData);
      setLearningRecords(recordsData);
      setStudySessions(sessionsData);
      setSettings(settingsData);

      // 如果沒有數據，創建示例數據
      if (subjectsData.length === 0) {
        await createSampleData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      console.error('Data refresh error:', err);
    }
  };

  // 創建示例數據
  const createSampleData = async () => {
    try {
      // 創建示例科目
      const sampleSubject = await createSubject({
        name: '國文學習',
        description: '國字注音練習',
        color: '#3b82f6',
      });

      // 創建示例題目
      await createQuestion({
        subjectId: sampleSubject.id,
        type: 'char-to-bopomofo',
        question: '請輸入「萌」的注音',
        character: '萌',
        correctBopomofo: 'ㄇㄥˊ',
        difficulty: 'easy',
      } as any);

      await createQuestion({
        subjectId: sampleSubject.id,
        type: 'bopomofo-to-char',
        question: '請輸入注音「ㄇㄥˊ」對應的國字',
        bopomofo: 'ㄇㄥˊ',
        correctChar: '萌',
        difficulty: 'easy',
      } as any);

      await createQuestion({
        subjectId: sampleSubject.id,
        type: 'multiple-choice',
        question: '下列哪個是「萌」的正確注音？',
        options: [
          { id: '1', text: 'ㄇㄥˊ', isCorrect: true },
          { id: '2', text: 'ㄇㄥˋ', isCorrect: false },
          { id: '3', text: 'ㄇㄥ', isCorrect: false },
          { id: '4', text: 'ㄇㄥˇ', isCorrect: false },
        ],
        allowMultiple: false,
        difficulty: 'medium',
      } as any);

      await createQuestion({
        subjectId: sampleSubject.id,
        type: 'true-false',
        question: '「萌」的注音是「ㄇㄥˊ」',
        correctAnswer: true,
        difficulty: 'easy',
      } as any);

      await createQuestion({
        subjectId: sampleSubject.id,
        type: 'fill-blank',
        question: '請填入正確的注音：萌___',
        correctAnswers: ['ㄇㄥˊ'],
        caseSensitive: false,
        difficulty: 'medium',
      } as any);

      // 刷新數據
      await refreshData();
    } catch (err) {
      console.error('Failed to create sample data:', err);
    }
  };

  // 科目操作
  const createSubject = async (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newSubject = await dbManager.createSubject(subject);
      setSubjects(prev => [...prev, newSubject]);
      return newSubject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
      throw err;
    }
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    try {
      await dbManager.updateSubject(id, updates);
      setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subject');
      throw err;
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      await dbManager.deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      setQuestions(prev => prev.filter(q => q.subjectId !== id));
      setLearningRecords(prev => prev.filter(r => r.subjectId !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
      throw err;
    }
  };

  // 題目操作
  const createQuestion = async (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newQuestion = await dbManager.createQuestion(question);
      setQuestions(prev => [...prev, newQuestion]);
      return newQuestion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
      throw err;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<Question>) => {
    try {
      await dbManager.updateQuestion(id, updates);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } as Question : q));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
      throw err;
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await dbManager.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      setLearningRecords(prev => prev.filter(r => r.questionId !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
      throw err;
    }
  };

  const getQuestionsBySubject = (subjectId: string) => {
    return questions.filter(q => q.subjectId === subjectId);
  };

  // 學習記錄操作
  const createLearningRecord = async (record: Omit<LearningRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRecord = await dbManager.createLearningRecord(record);
      setLearningRecords(prev => [...prev, newRecord]);
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create learning record');
      throw err;
    }
  };

  const updateLearningRecord = async (id: string, updates: Partial<LearningRecord>) => {
    try {
      await dbManager.updateLearningRecord(id, updates);
      setLearningRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update learning record');
      throw err;
    }
  };

  const getLearningRecord = (questionId: string) => {
    return learningRecords.find(r => r.questionId === questionId);
  };

  // 學習會話操作
  const createStudySession = async (session: Omit<StudySession, 'id'>) => {
    try {
      const newSession = await dbManager.createStudySession(session);
      setStudySessions(prev => [...prev, newSession]);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create study session');
      throw err;
    }
  };

  const updateStudySession = async (id: string, updates: Partial<StudySession>) => {
    try {
      await dbManager.updateStudySession(id, updates);
      setStudySessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update study session');
      throw err;
    }
  };

  // 設置操作
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      await dbManager.updateSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };

  // 數據操作
  const exportData = async () => {
    try {
      return await dbManager.exportData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      throw err;
    }
  };

  const importData = async (data: any) => {
    try {
      await dbManager.importData(data);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
      throw err;
    }
  };

  const clearAllData = async () => {
    try {
      await dbManager.clearAllData();
      setSubjects([]);
      setQuestions([]);
      setLearningRecords([]);
      setStudySessions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
      throw err;
    }
  };

  // 取得所有到期待複習的學習記錄（不限於當天，並依 nextReview 時間排序）
  const getDueLearningRecords = () => {
    const now = new Date();
    return learningRecords
      .filter(r => new Date(r.nextReview) <= now)
      .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
  };

  const value: DatabaseContextType = {
    subjects,
    questions,
    learningRecords,
    studySessions,
    settings,
    isLoading,
    error,
    createSubject,
    updateSubject,
    deleteSubject,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionsBySubject,
    createLearningRecord,
    updateLearningRecord,
    getLearningRecord,
    createStudySession,
    updateStudySession,
    updateSettings,
    exportData,
    importData,
    clearAllData,
    refreshData,
    getDueLearningRecords,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
