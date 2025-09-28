import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { app } from './firebase';
import type { Subject, Question, LearningRecord, StudySession, AppSettings, ExportData } from '../types';

const firestore = getFirestore(app);

class DatabaseManager {
  private userId: string | null = null;

  async init(): Promise<void> {
    // Firestore does not need explicit init beyond Firebase app
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private userDocRef() {
    if (!this.userId) throw new Error('No user. Please login.');
    return doc(firestore, 'users', this.userId);
  }

  // 科目管理
  async createSubject(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subject> {
    const newSubject: Subject = {
      ...subject,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ref = doc(collection(this.userDocRef(), 'subjects'), newSubject.id);
    await setDoc(ref, newSubject as any);
    return newSubject;
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const ref = doc(this.userDocRef(), 'subjects', id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as Subject) : undefined;
  }

  async getAllSubjects(): Promise<Subject[]> {
    const ref = collection(this.userDocRef(), 'subjects');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as Subject);
  }

  async updateSubject(id: string, updates: Partial<Subject>): Promise<void> {
    const ref = doc(this.userDocRef(), 'subjects', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data() as Subject;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() } as Subject;
    await setDoc(ref, updated as any);
  }

  async deleteSubject(id: string): Promise<void> {
    await deleteDoc(doc(this.userDocRef(), 'subjects', id));
    await this.deleteQuestionsBySubject(id);
    await this.deleteLearningRecordsBySubject(id);
  }

  // 題目管理
  async createQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
    const newQuestion: Question = {
      ...question,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Question;
    const ref = doc(collection(this.userDocRef(), 'questions'), newQuestion.id);
    await setDoc(ref, newQuestion as any);
    return newQuestion;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const ref = doc(this.userDocRef(), 'questions', id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as Question) : undefined;
  }

  async getQuestionsBySubject(subjectId: string): Promise<Question[]> {
    const ref = collection(this.userDocRef(), 'questions');
    const q = query(ref, where('subjectId', '==', subjectId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Question);
  }

  async getAllQuestions(): Promise<Question[]> {
    const ref = collection(this.userDocRef(), 'questions');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as Question);
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    const ref = doc(this.userDocRef(), 'questions', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data() as Question;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() } as Question;
    await setDoc(ref, updated as any);
  }

  async deleteQuestion(id: string): Promise<void> {
    await deleteDoc(doc(this.userDocRef(), 'questions', id));
  }

  private async deleteQuestionsBySubject(subjectId: string): Promise<void> {
    const list = await this.getQuestionsBySubject(subjectId);
    for (const qItem of list) {
      await deleteDoc(doc(this.userDocRef(), 'questions', qItem.id));
    }
  }

  // 學習記錄管理
  async createLearningRecord(record: Omit<LearningRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningRecord> {
    const now = new Date().toISOString();
    const newRecord: LearningRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const ref = doc(collection(this.userDocRef(), 'learningRecords'), newRecord.id);
    await setDoc(ref, newRecord as any);
    return newRecord;
  }

  async getLearningRecord(questionId: string): Promise<LearningRecord | undefined> {
    const ref = collection(this.userDocRef(), 'learningRecords');
    const qy = query(ref, where('questionId', '==', questionId));
    const snap = await getDocs(qy);
    const recs = snap.docs.map(d => d.data() as LearningRecord);
    return recs[0];
  }

  async getAllLearningRecords(): Promise<LearningRecord[]> {
    const ref = collection(this.userDocRef(), 'learningRecords');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as LearningRecord);
  }

  async getLearningRecordsBySubject(subjectId: string): Promise<LearningRecord[]> {
    const ref = collection(this.userDocRef(), 'learningRecords');
    const qy = query(ref, where('subjectId', '==', subjectId));
    const snap = await getDocs(qy);
    return snap.docs.map(d => d.data() as LearningRecord);
  }

  async updateLearningRecord(id: string, updates: Partial<LearningRecord>): Promise<void> {
    const ref = doc(this.userDocRef(), 'learningRecords', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data() as LearningRecord;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() } as LearningRecord;
    await setDoc(ref, updated as any);
  }

  async deleteLearningRecord(id: string): Promise<void> {
    await deleteDoc(doc(this.userDocRef(), 'learningRecords', id));
  }

  private async deleteLearningRecordsBySubject(subjectId: string): Promise<void> {
    const recs = await this.getLearningRecordsBySubject(subjectId);
    for (const r of recs) {
      await deleteDoc(doc(this.userDocRef(), 'learningRecords', r.id));
    }
  }

  // 學習會話管理
  async createStudySession(session: Omit<StudySession, 'id'>): Promise<StudySession> {
    const newSession: StudySession = {
      ...session,
      id: crypto.randomUUID(),
    };
    const ref = doc(collection(this.userDocRef(), 'studySessions'), newSession.id);
    await setDoc(ref, newSession as any);
    return newSession;
  }

  async getStudySession(id: string): Promise<StudySession | undefined> {
    const ref = doc(this.userDocRef(), 'studySessions', id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as StudySession) : undefined;
  }

  async getAllStudySessions(): Promise<StudySession[]> {
    const ref = collection(this.userDocRef(), 'studySessions');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as StudySession);
  }

  async getStudySessionsBySubject(subjectId: string): Promise<StudySession[]> {
    const ref = collection(this.userDocRef(), 'studySessions');
    const qy = query(ref, where('subjectId', '==', subjectId));
    const snap = await getDocs(qy);
    return snap.docs.map(d => d.data() as StudySession);
  }

  async updateStudySession(id: string, updates: Partial<StudySession>): Promise<void> {
    const ref = doc(this.userDocRef(), 'studySessions', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data() as StudySession;
    const updated = { ...current, ...updates } as StudySession;
    await setDoc(ref, updated as any);
  }

  // 設置管理
  async getSettings(): Promise<AppSettings> {
    const ref = doc(this.userDocRef(), 'settings', 'app');
    const snap = await getDoc(ref);
    const settings = snap.exists() ? (snap.data() as AppSettings) : undefined;
    return settings || {
      theme: 'system',
      showHints: true,
      autoAdvance: false,
      soundEnabled: true,
      keyboardShortcuts: true,
      reviewInterval: 1,
      newQuestionsPerSession: 20,
    };
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings } as AppSettings;
    const ref = doc(this.userDocRef(), 'settings', 'app');
    await setDoc(ref, updatedSettings as any);
  }

  // 數據匯出
  async exportData(): Promise<ExportData> {
    const [subjects, questions, learningRecords, studySessions, settings] = await Promise.all([
      this.getAllSubjects(),
      this.getAllQuestions(),
      this.getAllLearningRecords(),
      this.getAllStudySessions(),
      this.getSettings(),
    ]);

    return {
      version: '1.0.0',
      exportedAt: new Date(),
      subjects,
      questions,
      learningRecords,
      studySessions,
      settings,
    };
  }

  // 數據匯入
  async importData(data: ExportData): Promise<void> {
    // Clear existing
    await this.clearAllData();
    // Import
    for (const s of data.subjects) {
      await setDoc(doc(this.userDocRef(), 'subjects', s.id), s as any);
    }
    for (const qItem of data.questions) {
      await setDoc(doc(this.userDocRef(), 'questions', qItem.id), qItem as any);
    }
    for (const r of data.learningRecords) {
      await setDoc(doc(this.userDocRef(), 'learningRecords', r.id), r as any);
    }
    for (const sess of data.studySessions) {
      await setDoc(doc(this.userDocRef(), 'studySessions', sess.id), sess as any);
    }
    await setDoc(doc(this.userDocRef(), 'settings', 'app'), data.settings as any);
  }

  // 清空所有數據
  async clearAllData(): Promise<void> {
    const deleteAll = async (sub: string) => {
      const snap = await getDocs(collection(this.userDocRef(), sub));
      const promises: Promise<any>[] = [];
      snap.forEach(dref => promises.push(deleteDoc(dref.ref)));
      await Promise.all(promises);
    };
    await Promise.all([
      deleteAll('subjects'),
      deleteAll('questions'),
      deleteAll('learningRecords'),
      deleteAll('studySessions'),
    ]);
    await deleteDoc(doc(this.userDocRef(), 'settings', 'app')).catch(() => {});
  }
}

// 單例模式
export const dbManager = new DatabaseManager();
