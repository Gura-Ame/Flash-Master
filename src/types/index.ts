// 題目類型
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'sort' | 'bopomofo-to-char' | 'char-to-bopomofo';

// 熟悉度狀態
export type FamiliarityLevel = 'unfamiliar' | 'unanswered' | 'somewhat-familiar' | 'familiar' | 'mastered';

// 科目
export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// 題目選項
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// 排序題項目
export interface SortItem {
  id: string;
  text: string;
  correctOrder: number;
}

// 基礎題目接口
export interface BaseQuestion {
  id: string;
  subjectId: string;
  type: QuestionType;
  question: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// 選擇題
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: QuestionOption[];
  allowMultiple: boolean;
}

// 是非題
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

// 填空題
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill-blank';
  correctAnswers: string[];
  caseSensitive: boolean;
}

// 排序題
export interface SortQuestion extends BaseQuestion {
  type: 'sort';
  items: SortItem[];
}

// 注音轉國字題
export interface BopomofoToCharQuestion extends BaseQuestion {
  type: 'bopomofo-to-char';
  bopomofo: string;
  correctChar: string;
  verifiedBopomofo?: string; // API驗證後的注音
}

// 國字轉注音題
export interface CharToBopomofoQuestion extends BaseQuestion {
  type: 'char-to-bopomofo';
  character: string;
  correctBopomofo: string;
  verifiedBopomofo?: string; // API驗證後的注音
}

// 聯合題目類型
export type Question = 
  | MultipleChoiceQuestion 
  | TrueFalseQuestion 
  | FillBlankQuestion 
  | SortQuestion 
  | BopomofoToCharQuestion 
  | CharToBopomofoQuestion;

// 用戶答案
export interface UserAnswer {
  questionId: string;
  answer: string | string[] | boolean | number[]; // 根據題型不同
  isCorrect: boolean;
  answeredAt: Date;
  timeSpent: number; // 秒數
}

// 學習記錄
export interface LearningRecord {
  id: string;
  questionId: string;
  subjectId: string;
  familiarity: FamiliarityLevel;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string; // ISO string
  nextReview: string; // ISO string
  streak: number;
  totalTimeSpent: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// 學習會話
export interface StudySession {
  id: string;
  subjectId: string;
  mode: 'review' | 'practice' | 'test';
  questions: string[]; // question IDs
  answers: UserAnswer[];
  startedAt: string; // ISO string
  completedAt?: string; // ISO string
  totalTime: number;
  score?: number;
}

// 學習統計
export interface LearningStats {
  subjectId: string;
  totalQuestions: number;
  masteredQuestions: number;
  familiarQuestions: number;
  somewhatFamiliarQuestions: number;
  unfamiliarQuestions: number;
  unansweredQuestions: number;
  averageAccuracy: number;
  totalStudyTime: number;
  streak: number;
  lastStudied?: Date;
}

// 應用設置
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  showHints: boolean;
  autoAdvance: boolean;
  soundEnabled: boolean;
  keyboardShortcuts: boolean;
  reviewInterval: number; // 天數
  newQuestionsPerSession: number;
}

// 數據庫結構
export interface DatabaseSchema {
  subjects: Subject[];
  questions: Question[];
  learningRecords: LearningRecord[];
  studySessions: StudySession[];
  settings: AppSettings;
}

// SRS算法相關
export interface SRSAlgorithm {
  calculateNextReview: (
    currentFamiliarity: FamiliarityLevel,
    correctCount: number,
    incorrectCount: number,
    streak: number,
    lastReviewed: Date
  ) => Date;
}

// 萌典API響應
export interface MoedictResponse {
  t: string; // 字
  h: Array<{
    b: string; // 注音
    p: string; // 拼音
    d: Array<{
      f: string; // 定義
      type: string; // 詞性
    }>;
  }>;
}

// 匯出數據格式
export interface ExportData {
  version: string;
  exportedAt: Date;
  subjects: Subject[];
  questions: Question[];
  learningRecords: LearningRecord[];
  studySessions: StudySession[];
  settings: AppSettings;
}
