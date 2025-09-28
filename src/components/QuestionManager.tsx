import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import type { Question, QuestionType } from '../types';
import { useTranslation } from 'react-i18next';

interface QuestionManagerProps {
  subjectId: string;
  onClose: () => void;
}

export function QuestionManager({ subjectId, onClose }: QuestionManagerProps) {
  const { t } = useTranslation();
  const { questions, createQuestion, updateQuestion, deleteQuestion } = useDatabase();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>('multiple-choice');
  const [formData, setFormData] = useState({
    question: '',
    explanation: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    // 選擇題
    options: [{ id: '', text: '', isCorrect: false }],
    allowMultiple: false,
    // 是非題
    correctAnswer: true,
    // 填空題
    correctAnswers: [''],
    caseSensitive: false,
    // 排序題
    items: [{ id: '', text: '', correctOrder: 0 }],
    // 注音題
    character: '',
    bopomofo: '',
  });

  const subjectQuestions = questions.filter(q => q.subjectId === subjectId);

  const resetForm = () => {
    setFormData({
      question: '',
      explanation: '',
      difficulty: 'medium',
      options: [{ id: '', text: '', isCorrect: false }],
      allowMultiple: false,
      correctAnswer: true,
      correctAnswers: [''],
      caseSensitive: false,
      items: [{ id: '', text: '', correctOrder: 0 }],
      character: '',
      bopomofo: '',
    });
  };

  const handleCreateQuestion = () => {
    resetForm();
    setEditingQuestion(null);
    setShowCreateForm(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionType(question.type);
    
    // 根據題型設置表單數據
    const baseData = {
      question: question.question,
      explanation: question.explanation || '',
      difficulty: question.difficulty,
    };

    switch (question.type) {
      case 'multiple-choice':
        setFormData({
          ...baseData,
          options: question.options.map(opt => ({ ...opt, id: opt.id || '' })),
          allowMultiple: question.allowMultiple,
          correctAnswer: true,
          correctAnswers: [''],
          caseSensitive: false,
          items: [{ id: '', text: '', correctOrder: 0 }],
          character: '',
          bopomofo: '',
        });
        break;
      case 'true-false':
        setFormData({
          ...baseData,
          correctAnswer: question.correctAnswer,
          options: [{ id: '', text: '', isCorrect: false }],
          allowMultiple: false,
          correctAnswers: [''],
          caseSensitive: false,
          items: [{ id: '', text: '', correctOrder: 0 }],
          character: '',
          bopomofo: '',
        });
        break;
      case 'fill-blank':
        setFormData({
          ...baseData,
          correctAnswers: question.correctAnswers,
          caseSensitive: question.caseSensitive,
          options: [{ id: '', text: '', isCorrect: false }],
          allowMultiple: false,
          correctAnswer: true,
          items: [{ id: '', text: '', correctOrder: 0 }],
          character: '',
          bopomofo: '',
        });
        break;
      case 'sort':
        setFormData({
          ...baseData,
          items: question.items.map(item => ({ ...item, id: item.id || '' })),
          options: [{ id: '', text: '', isCorrect: false }],
          allowMultiple: false,
          correctAnswer: true,
          correctAnswers: [''],
          caseSensitive: false,
          character: '',
          bopomofo: '',
        });
        break;
      case 'bopomofo-to-char':
        setFormData({
          ...baseData,
          bopomofo: question.bopomofo,
          character: question.correctChar,
          options: [{ id: '', text: '', isCorrect: false }],
          allowMultiple: false,
          correctAnswer: true,
          correctAnswers: [''],
          caseSensitive: false,
          items: [{ id: '', text: '', correctOrder: 0 }],
        });
        break;
      case 'char-to-bopomofo':
        setFormData({
          ...baseData,
          character: question.character,
          bopomofo: question.correctBopomofo,
          options: [{ id: '', text: '', isCorrect: false }],
          allowMultiple: false,
          correctAnswer: true,
          correctAnswers: [''],
          caseSensitive: false,
          items: [{ id: '', text: '', correctOrder: 0 }],
        });
        break;
    }
    
    setShowCreateForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!formData.question.trim()) return;

    const baseQuestion = {
      subjectId,
      question: formData.question.trim(),
      explanation: formData.explanation.trim() || undefined,
      difficulty: formData.difficulty,
    };

    let questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>;

    switch (questionType) {
      case 'multiple-choice':
        questionData = {
          ...baseQuestion,
          type: 'multiple-choice',
          options: formData.options.filter(opt => opt.text.trim()),
          allowMultiple: formData.allowMultiple,
        } as any;
        break;
      case 'true-false':
        questionData = {
          ...baseQuestion,
          type: 'true-false',
          correctAnswer: formData.correctAnswer,
        } as any;
        break;
      case 'fill-blank':
        questionData = {
          ...baseQuestion,
          type: 'fill-blank',
          correctAnswers: formData.correctAnswers.filter(ans => ans.trim()),
          caseSensitive: formData.caseSensitive,
        } as any;
        break;
      case 'sort':
        questionData = {
          ...baseQuestion,
          type: 'sort',
          items: formData.items
            .filter(item => item.text.trim())
            .map((item, index) => ({ ...item, correctOrder: index })),
        } as any;
        break;
      case 'bopomofo-to-char':
        questionData = {
          ...baseQuestion,
          type: 'bopomofo-to-char',
          bopomofo: formData.bopomofo.trim(),
          correctChar: formData.character.trim(),
        } as any;
        break;
      case 'char-to-bopomofo':
        questionData = {
          ...baseQuestion,
          type: 'char-to-bopomofo',
          character: formData.character.trim(),
          correctBopomofo: formData.bopomofo.trim(),
        } as any;
        break;
      default:
        return;
    }

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionData);
      } else {
        await createQuestion(questionData);
      }
      setShowCreateForm(false);
      setEditingQuestion(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm('確定要刪除這道題目嗎？')) {
      try {
        await deleteQuestion(questionId);
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: '', text: '', isCorrect: false }]
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addCorrectAnswer = () => {
    setFormData(prev => ({
      ...prev,
      correctAnswers: [...prev.correctAnswers, '']
    }));
  };

  const removeCorrectAnswer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers.filter((_, i) => i !== index)
    }));
  };

  const addSortItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: '', text: '', correctOrder: prev.items.length }]
    }));
  };

  const removeSortItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getQuestionTypeText = (type: QuestionType) => {
    switch (type) {
      case 'multiple-choice': return t('Multiple Choice');
      case 'true-false': return t('True/False');
      case 'fill-blank': return t('Fill in the Blank');
      case 'sort': return t('Sort');
      case 'bopomofo-to-char': return t('Bopomofo to Character');
      case 'char-to-bopomofo': return t('Character to Bopomofo');
      default: return type;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onClose}
          className="btn btn-ghost mb-4"
        >
          <X className="w-4 h-4 mr-2" />
          {t('Close')}
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-base-content dark:text-white">{t('Question Manager')}</h1>
          <button
            onClick={handleCreateQuestion}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('Add Question')}
          </button>
        </div>
      </div>

      {/* 題目列表 */}
      <div className="space-y-4">
        {subjectQuestions.map((question) => (
          <div key={question.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    {getQuestionTypeText(question.type)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    question.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {question.difficulty === 'easy' ? t('Easy') : question.difficulty === 'medium' ? t('Medium') : t('Hard')}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-base-content mb-2">
                  {question.question}
                </h3>
                {question.explanation && (
                  <p className="text-sm text-base-content/70">
                    {question.explanation}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleEditQuestion(question)}
                  className="btn btn-ghost btn-sm"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {subjectQuestions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-base-content/70 mb-4">{t('No questions yet')}</p>
            <button
              onClick={handleCreateQuestion}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('Add your first question')}
            </button>
          </div>
        )}
      </div>

      {/* 創建/編輯題目表單 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-base-content">{t('Edit Question')}</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn btn-ghost btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 題型選擇 */}
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  {t('Question Type')}
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                  className="select select-bordered w-full"
                >
                  <option value="multiple-choice">{t('Multiple Choice')}</option>
                  <option value="true-false">{t('True/False')}</option>
                  <option value="fill-blank">{t('Fill in the Blank')}</option>
                  <option value="sort">{t('Sort')}</option>
                  <option value="bopomofo-to-char">{t('Bopomofo to Character')}</option>
                  <option value="char-to-bopomofo">{t('Character to Bopomofo')}</option>
                </select>
              </div>

              {/* 題目內容 */}
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  {t('Question')} *
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  className="textarea textarea-bordered w-full h-20 resize-none"
                  placeholder={t('Enter question content')}
                  required
                />
              </div>

              {/* 解釋 */}
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  {t('Explanation (Optional)')}
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  className="textarea textarea-bordered w-full h-20 resize-none"
                  placeholder={t('Enter question explanation')}
                />
              </div>

              {/* 難度 */}
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  {t('Difficulty')}
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="select select-bordered w-full"
                >
                  <option value="easy">{t('Easy')}</option>
                  <option value="medium">{t('Medium')}</option>
                  <option value="hard">{t('Hard')}</option>
                </select>
              </div>

              {/* 選擇題選項 */}
              {questionType === 'multiple-choice' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-base-content/70">
                      {t('Options')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.allowMultiple}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowMultiple: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-base-content/70">{t('Allow Multiple Selection')}</span>
                      </label>
                      <button
                        onClick={addOption}
                        className="btn btn-sm btn-secondary"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index].isCorrect = e.target.checked;
                            setFormData(prev => ({ ...prev, options: newOptions }));
                          }}
                          className="w-4 h-4"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index].text = e.target.value;
                            setFormData(prev => ({ ...prev, options: newOptions }));
                          }}
                          className="input flex-1"
                          placeholder={t('Option content')}
                        />
                        <button
                          onClick={() => removeOption(index)}
                          className="btn btn-ghost btn-sm text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 是非題 */}
              {questionType === 'true-false' && (
                <div>
                  <label className="block text-sm font-medium text-base-content/70 mb-2">
                    {t('Correct Answer')}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswer === true}
                        onChange={() => setFormData(prev => ({ ...prev, correctAnswer: true }))}
                        className="w-4 h-4"
                      />
                      <span className="text-base-content/70">{t('Correct')}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswer === false}
                        onChange={() => setFormData(prev => ({ ...prev, correctAnswer: false }))}
                        className="w-4 h-4"
                      />
                      <span className="text-base-content/70">{t('Incorrect')}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 填空題 */}
              {questionType === 'fill-blank' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-base-content/70">
                      {t('Correct Answer')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.caseSensitive}
                          onChange={(e) => setFormData(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-base-content/70">{t('Case Sensitive')}</span>
                      </label>
                      <button
                        onClick={addCorrectAnswer}
                        className="btn btn-sm btn-secondary"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {formData.correctAnswers.map((answer, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) => {
                            const newAnswers = [...formData.correctAnswers];
                            newAnswers[index] = e.target.value;
                            setFormData(prev => ({ ...prev, correctAnswers: newAnswers }));
                          }}
                          className="input flex-1"
                          placeholder={t('Correct Answer')}
                        />
                        <button
                          onClick={() => removeCorrectAnswer(index)}
                          className="btn btn-ghost btn-sm text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 排序題 */}
              {questionType === 'sort' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-base-content/70">
                      {t('Sort Items (in correct order)')}
                    </label>
                    <button
                      onClick={addSortItem}
                      className="btn btn-sm btn-secondary"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-base-content/50 w-8">
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index].text = e.target.value;
                            setFormData(prev => ({ ...prev, items: newItems }));
                          }}
                          className="input flex-1"
                          placeholder={t('Item content')}
                        />
                        <button
                          onClick={() => removeSortItem(index)}
                          className="btn btn-ghost btn-sm text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 注音轉國字題 */}
              {questionType === 'bopomofo-to-char' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">
                      {t('Bopomofo')} *
                    </label>
                    <input
                      type="text"
                      value={formData.bopomofo}
                      onChange={(e) => setFormData(prev => ({ ...prev, bopomofo: e.target.value }))}
                      className="input w-full"
                      placeholder={t('e.g., ㄇㄥˊ')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">
                      {t('Correct Character')} *
                    </label>
                    <input
                      type="text"
                      value={formData.character}
                      onChange={(e) => setFormData(prev => ({ ...prev, character: e.target.value }))}
                      className="input w-full"
                      placeholder={t('e.g., 萌')}
                      required
                    />
                  </div>
                </div>
              )}

              {/* 國字轉注音題 */}
              {questionType === 'char-to-bopomofo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">
                      {t('Character')} *
                    </label>
                    <input
                      type="text"
                      value={formData.character}
                      onChange={(e) => setFormData(prev => ({ ...prev, character: e.target.value }))}
                      className="input w-full"
                      placeholder={t('e.g., 萌')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">
                      {t('Correct Bopomofo')} *
                    </label>
                    <input
                      type="text"
                      value={formData.bopomofo}
                      onChange={(e) => setFormData(prev => ({ ...prev, bopomofo: e.target.value }))}
                      className="input w-full"
                      placeholder={t('e.g., ㄇㄥˊ')}
                      required
                    />
                  </div>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-ghost"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleSaveQuestion}
                  className="btn btn-primary"
                  disabled={!formData.question.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingQuestion ? t('Update') : t('Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
