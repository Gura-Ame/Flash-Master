import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Clock } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import type { Question, FamiliarityLevel } from '../types';
import { getFamiliarityText, defaultSRSAlgorithm } from '../utils/srs';
import { useTranslation } from 'react-i18next';
import { BopomofoInput } from './BopomofoInput';

export function ReviewView({ onViewChange }: { onViewChange: (view: string) => void }) {
  const { t } = useTranslation();
  const { questions, getDueLearningRecords, updateLearningRecord, getLearningRecord } = useDatabase();
  const dueRecords = getDueLearningRecords();
  const dueQuestions = dueRecords.map(r => questions.find(q => q.id === r.questionId)).filter(Boolean) as Question[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFamiliarityModal, setShowFamiliarityModal] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const enterCountRef = useRef(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showFamiliarityModal) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      // 1-4快捷鍵
      if (!showAnswer && currentQuestion && currentQuestion.type === 'multiple-choice') {
        const idx = ['1','2','3','4'].indexOf(e.key);
        if (idx !== -1 && currentQuestion.options[idx]) {
          if (currentQuestion.allowMultiple) {
            const current = (userAnswer as string[] || []);
            const id = currentQuestion.options[idx].id;
            if (current.includes(id)) {
              handleAnswerChange(current.filter(i => i !== id));
            } else {
              handleAnswerChange([...current, id]);
            }
          } else {
            handleAnswerChange(currentQuestion.options[idx].id);
          }
          e.preventDefault();
        }
      }
      // Enter快捷鍵
      if (e.key === 'Enter') {
        if (!showAnswer) {
          handleSubmitAnswer();
          enterCountRef.current = 1;
        } else {
          if (enterCountRef.current === 1) {
            setShowFamiliarityModal(true);
            enterCountRef.current = 0;
          } else {
            enterCountRef.current++;
          }
        }
        e.preventDefault();
      }
      // Space快捷鍵
      if (e.key === ' ' && showAnswer) {
        handleRetry();
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, showFamiliarityModal, currentIndex, dueQuestions]);

  const currentQuestion = dueQuestions[currentIndex];
  const currentRecord = currentQuestion ? getLearningRecord(currentQuestion.id) : undefined;

  const handleAnswerChange = (answer: any) => setUserAnswer(answer);

  const checkAnswer = (): boolean => {
    if (!currentQuestion || userAnswer === null) return false;
    switch (currentQuestion.type) {
      case 'multiple-choice':
        if (currentQuestion.allowMultiple) {
          const selectedOptions = userAnswer as string[];
          const correctOptions = currentQuestion.options.filter(opt => opt.isCorrect).map(opt => opt.id);
          return selectedOptions.length === correctOptions.length && selectedOptions.every(id => correctOptions.includes(id));
        } else {
          const selectedOption = userAnswer as string;
          const correctOption = currentQuestion.options.find(opt => opt.isCorrect);
          return correctOption ? selectedOption === correctOption.id : false;
        }
      case 'true-false':
        return userAnswer === currentQuestion.correctAnswer;
      case 'fill-blank':
        const answer = (userAnswer as string).trim();
        return currentQuestion.correctAnswers.some(correct => currentQuestion.caseSensitive ? correct === answer : correct.toLowerCase() === answer.toLowerCase());
      case 'sort':
        return false;
      case 'bopomofo-to-char':
        return (userAnswer as string).trim() === currentQuestion.correctChar;
      case 'char-to-bopomofo':
        return (userAnswer as string).trim() === currentQuestion.correctBopomofo;
      default:
        return false;
    }
  };

  const handleSubmitAnswer = () => {
    if (userAnswer === null) return;
    setIsCorrect(checkAnswer());
    setShowAnswer(true);
  };

  const handleFamiliaritySelect = async (familiarity: FamiliarityLevel) => {
    if (!currentQuestion || !currentRecord) return;
    const timeSpent = startTime ? Math.round((new Date().getTime() - startTime.getTime()) / 1000) : 0;
    const newFamiliarity = familiarity; // 直接用用戶自評
    await updateLearningRecord(currentRecord.id, {
      familiarity: newFamiliarity,
      correctCount: currentRecord.correctCount + (isCorrect ? 1 : 0),
      incorrectCount: currentRecord.incorrectCount + (isCorrect ? 0 : 1),
      lastReviewed: new Date().toISOString(),
      streak: isCorrect ? currentRecord.streak + 1 : 0,
      totalTimeSpent: currentRecord.totalTimeSpent + timeSpent,
      nextReview: defaultSRSAlgorithm.calculateNextReview(
        newFamiliarity,
        currentRecord.correctCount + (isCorrect ? 1 : 0),
        currentRecord.incorrectCount + (isCorrect ? 0 : 1),
        isCorrect ? currentRecord.streak + 1 : 0,
        new Date()
      ).toISOString(),
    });
    setShowFamiliarityModal(false);
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentIndex < dueQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer(null);
      setShowAnswer(false);
      setIsCorrect(false);
      setStartTime(new Date());
    } else {
      onViewChange('home');
    }
  };

  const handleRetry = () => {
    setUserAnswer(null);
    setShowAnswer(false);
    setIsCorrect(false);
    setStartTime(new Date());
  };

  if (dueQuestions.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-base-content mb-2">{t('No questions due for review!')}</h2>
          <button onClick={() => onViewChange('home')} className="btn btn-primary mt-4">{t('Back to Home')}</button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-base-content mb-4">{t('Completed all reviews!')}</h1>
          <button onClick={() => onViewChange('home')} className="btn btn-primary">{t('Back to Home')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => onViewChange('home')} className="btn btn-ghost mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('Back to Home')}
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-base-content">
            {t('Review')} {currentIndex + 1} / {dueQuestions.length}
          </h1>
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-base-300 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / dueQuestions.length) * 100}%` }} />
            </div>
            <span className="text-sm text-base-content/70">{Math.round(((currentIndex + 1) / dueQuestions.length) * 100)}%</span>
          </div>
        </div>
      </div>
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold text-base-content mb-4">{currentQuestion.question}</h2>
        {!showAnswer ? (
          <div className="space-y-4">
            {currentQuestion.type === 'multiple-choice' && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => (
                  <label key={option.id} className="flex items-center space-x-3 p-3 border border-base-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <input
                      type={currentQuestion.allowMultiple ? 'checkbox' : 'radio'}
                      name="answer"
                      value={option.id}
                      checked={currentQuestion.allowMultiple ? (userAnswer as string[] || []).includes(option.id) : userAnswer === option.id}
                      onChange={(e) => {
                        if (currentQuestion.allowMultiple) {
                          const current = (userAnswer as string[] || []);
                          if (e.target.checked) {
                            handleAnswerChange([...current, option.id]);
                          } else {
                            handleAnswerChange(current.filter(id => id !== option.id));
                          }
                        } else {
                          handleAnswerChange(option.id);
                        }
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-base-content">{option.text}</span>
                  </label>
                ))}
              </div>
            )}
            {currentQuestion.type === 'true-false' && (
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-base-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="radio" name="answer" checked={userAnswer === true} onChange={() => handleAnswerChange(true)} className="w-4 h-4 text-blue-600" />
                  <span className="text-base-content">{t('True')}</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-base-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="radio" name="answer" checked={userAnswer === false} onChange={() => handleAnswerChange(false)} className="w-4 h-4 text-blue-600" />
                  <span className="text-base-content">{t('False')}</span>
                </label>
              </div>
            )}
            {currentQuestion.type === 'fill-blank' && (
              <input type="text" value={(userAnswer as string) || ''} onChange={(e) => handleAnswerChange(e.target.value)} className="input input-bordered w-full" placeholder={t('Please enter your answer')} />
            )}
            {currentQuestion.type === 'char-to-bopomofo' && (
              <div>
                <BopomofoInput value={(userAnswer as string) || ''} onChange={(val) => handleAnswerChange(val)} placeholder={t('Please enter Bopomofo')} />
              </div>
            )}
            {currentQuestion.type === 'bopomofo-to-char' && (
              <input type="text" value={(userAnswer as string) || ''} onChange={(e) => handleAnswerChange(e.target.value)} className="input input-bordered w-full" placeholder={t('Please enter Chinese character')} />
            )}
            <div className="flex justify-end">
              <button onClick={handleSubmitAnswer} disabled={userAnswer === null} className="btn btn-primary">{t('Submit Answer')}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-md flex items-center space-x-3 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              {isCorrect ? <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" /> : <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
              <span className={`font-medium ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{isCorrect ? t('Correct!') : t('Wrong')}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <h3 className="font-medium text-base-content mb-2">{t('Correct Answer:')}</h3>
              {currentQuestion.type === 'multiple-choice' && (
                <div className="space-y-1">
                  {currentQuestion.options.filter(opt => opt.isCorrect).map(opt => (
                    <p key={opt.id} className="text-base-content">{opt.text}</p>
                  ))}
                </div>
              )}
              {currentQuestion.type === 'true-false' && (
                <p className="text-base-content">{currentQuestion.correctAnswer ? t('True') : t('False')}</p>
              )}
              {(currentQuestion.type === 'fill-blank' || currentQuestion.type === 'bopomofo-to-char' || currentQuestion.type === 'char-to-bopomofo') && (
                <p className="text-base-content">{currentQuestion.type === 'fill-blank' ? currentQuestion.correctAnswers.join(', ') : currentQuestion.type === 'bopomofo-to-char' ? currentQuestion.correctChar : currentQuestion.correctBopomofo}</p>
              )}
            </div>
            {currentQuestion.explanation && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">{t('Explanation:')}</h3>
                <p className="text-blue-800 dark:text-blue-300">{currentQuestion.explanation}</p>
              </div>
            )}
            <div className="flex justify-between">
              <button onClick={handleRetry} className="btn btn-secondary">
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('Retry')}
              </button>
              <button onClick={() => setShowFamiliarityModal(true)} className="btn btn-primary">
                {t('Next Question')}
              </button>
            </div>
          </div>
        )}
      </div>
      {showFamiliarityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-base-content mb-4">{t('Please select your familiarity level for this question')}</h3>
            <div className="space-y-2">
              {(['unfamiliar', 'unanswered', 'somewhat-familiar', 'familiar', 'mastered'] as FamiliarityLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => handleFamiliaritySelect(level)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    level === 'unfamiliar' ? 'border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20' :
                    level === 'unanswered' ? 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800' :
                    level === 'somewhat-familiar' ? 'border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20' :
                    level === 'familiar' ? 'border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20' :
                    'border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      level === 'unfamiliar' ? 'bg-red-500' :
                      level === 'unanswered' ? 'bg-gray-500' :
                      level === 'somewhat-familiar' ? 'bg-yellow-500' :
                      level === 'familiar' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`} />
                    <span className="font-medium text-base-content">{getFamiliarityText(level)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
