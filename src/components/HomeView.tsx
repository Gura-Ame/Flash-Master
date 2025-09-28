import React, { useState } from 'react';
import { Plus, BookOpen, BarChart3, Clock, Target, Settings } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { QuestionManager } from './QuestionManager';
import { useTranslation } from 'react-i18next';

interface HomeViewProps {
  onViewChange: (view: string) => void;
}

export function HomeView({ onViewChange }: HomeViewProps) {
  const { t } = useTranslation();
  const { subjects, questions, learningRecords, createSubject, getDueLearningRecords } = useDatabase();
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [selectedSubjectForQuestions, setSelectedSubjectForQuestions] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#3b82f6');

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      await createSubject({
        name: newSubjectName.trim(),
        description: newSubjectDescription.trim() || undefined,
        color: newSubjectColor,
      });
      setNewSubjectName('');
      setNewSubjectDescription('');
      setNewSubjectColor('#3b82f6');
      setShowCreateSubject(false);
    } catch (error) {
      console.error('Failed to create subject:', error);
    }
  };

  const getSubjectStats = (subjectId: string) => {
    const subjectQuestions = questions.filter(q => q.subjectId === subjectId);
    const subjectRecords = learningRecords.filter(r => r.subjectId === subjectId);
    
    const totalQuestions = subjectQuestions.length;
    const masteredQuestions = subjectRecords.filter(r => r.familiarity === 'mastered').length;
    const familiarQuestions = subjectRecords.filter(r => r.familiarity === 'familiar').length;
    const somewhatFamiliarQuestions = subjectRecords.filter(r => r.familiarity === 'somewhat-familiar').length;
    const unfamiliarQuestions = subjectRecords.filter(r => r.familiarity === 'unfamiliar').length;
    const unansweredQuestions = totalQuestions - subjectRecords.length;

    return {
      totalQuestions,
      masteredQuestions,
      familiarQuestions,
      somewhatFamiliarQuestions,
      unfamiliarQuestions,
      unansweredQuestions,
    };
  };

  const getTotalStats = () => {
    const totalQuestions = questions.length;
    const totalRecords = learningRecords.length;
    const masteredQuestions = learningRecords.filter(r => r.familiarity === 'mastered').length;
    const familiarQuestions = learningRecords.filter(r => r.familiarity === 'familiar').length;
    const somewhatFamiliarQuestions = learningRecords.filter(r => r.familiarity === 'somewhat-familiar').length;
    const unfamiliarQuestions = learningRecords.filter(r => r.familiarity === 'unfamiliar').length;
    const unansweredQuestions = totalQuestions - totalRecords;

    return {
      totalQuestions,
      masteredQuestions,
      familiarQuestions,
      somewhatFamiliarQuestions,
      unfamiliarQuestions,
      unansweredQuestions,
    };
  };

  const totalStats = getTotalStats();
  const dueCount = getDueLearningRecords().length;

  const handleManageQuestions = (subjectId: string) => {
    setSelectedSubjectForQuestions(subjectId);
    setShowQuestionManager(true);
  };

  if (showQuestionManager) {
    return (
      <QuestionManager
        subjectId={selectedSubjectForQuestions}
        onClose={() => setShowQuestionManager(false)}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 標題和統計 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('Home')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('Manage your subjects and track your learning progress')}
        </p>
      </div>

      {/* 總體統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-base-content/70 truncate">{t('Total Questions')}</p>
              <p className="text-2xl font-bold text-base-content">{totalStats.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-green-500" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-base-content/70 truncate">{t('Mastered')}</p>
              <p className="text-2xl font-bold text-base-content">{totalStats.masteredQuestions}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-yellow-500" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-base-content/70 truncate">{t('Familiar')}</p>
              <p className="text-2xl font-bold text-base-content">{totalStats.familiarQuestions}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-base-content/70 truncate">{t('Somewhat Unfamiliar')}</p>
              <p className="text-2xl font-bold text-base-content">{totalStats.somewhatFamiliarQuestions}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-base-content/70 truncate">{t('Due for Review')}</p>
              <p className="text-2xl font-bold text-base-content">{dueCount}</p>
            </div>
          </div>
        </div>

        {/* 將 生疏/未答 合併到上一列的統計卡或保留在後方卡片區域，若仍需顯示可在此增加第5張卡片 */}
        {/* <div className="card p-4">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-red-500" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-base-content/70 truncate">{t('Unfamiliar/Unanswered')}</p>
              <p className="text-2xl font-bold text-base-content">{totalStats.unfamiliarQuestions + totalStats.unansweredQuestions}</p>
            </div>
          </div>
        </div> */}
      </div>

      {/* 科目列表 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('Subject')}</h2>
          <button
            onClick={() => setShowCreateSubject(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('Add Subject')}
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-12 card">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-base-content mb-2">{t('No Subjects Yet')}</h3>
            <p className="text-base-content/70 mb-4">{t('Create your first subject to start learning')}</p>
            <button
              onClick={() => setShowCreateSubject(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('Add Subject')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => {
              const stats = getSubjectStats(subject.id);
              const progress = stats.totalQuestions > 0 
                ? ((stats.masteredQuestions + stats.familiarQuestions) / stats.totalQuestions) * 100 
                : 0;

              return (
                <div
                  key={subject.id}
                  className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onViewChange('study')}
                >
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: subject.color }}
                    />
                    <h3 className="text-lg font-semibold text-base-content">
                      {subject.name}
                    </h3>
                  </div>

                  {subject.description && (
                    <p className="text-base-content/70 text-sm mb-4">
                      {subject.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/70">{t('Progress')}</span>
                      <span className="font-medium text-base-content">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: subject.color 
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-base-content">{stats.totalQuestions}</div>
                      <div className="text-base-content/70">{t('Total Questions')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-500">{stats.masteredQuestions}</div>
                      <div className="text-base-content/70">{t('Mastered')}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => onViewChange('study')}
                      className="flex-1 btn btn-primary btn-sm"
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      {t('Start Learning')}
                    </button>
                    <button
                      onClick={() => onViewChange('review')}
                      className="flex-1 btn btn-warning btn-sm"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      {t('Review')}
                    </button>
                    <button
                      onClick={() => handleManageQuestions(subject.id)}
                      className="btn btn-ghost btn-sm"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 創建科目模態框 */}
      {showCreateSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('Add Subject')}
            </h3>
            
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  {t('Subject Name')} *
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="input w-full"
                  placeholder={t('e.g. Chinese, Math')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  {t('Description')}
                </label>
                <textarea
                  value={newSubjectDescription}
                  onChange={(e) => setNewSubjectDescription(e.target.value)}
                  className="input w-full h-20 resize-none"
                  placeholder={t('Describe this subject...')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  {t('Color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewSubjectColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newSubjectColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={t('Select color')}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSubject(false)}
                  className="btn btn-ghost"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newSubjectName.trim()}
                >
                  {t('Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
