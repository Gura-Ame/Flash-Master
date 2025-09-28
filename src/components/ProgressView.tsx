import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Calendar, Target, Clock } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays } from 'date-fns';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ProgressViewProps {
  onViewChange: (view: string) => void;
}

interface DailyProgress {
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
}

interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  masteredQuestions: number;
  familiarQuestions: number;
  somewhatFamiliarQuestions: number;
  unfamiliarQuestions: number;
  unansweredQuestions: number;
  accuracy: number;
  totalTimeSpent: number;
}

// 通用 DaisyUI 風格 Tooltip 元件
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelFormatter?: (label: string) => React.ReactNode;
  valueFormatter?: (entry: any) => React.ReactNode;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, labelFormatter, valueFormatter }) => {
  const { t } = useTranslation();
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="card bg-base-200 shadow-md p-2">
      <div className="font-bold">
        {labelFormatter ? labelFormatter(label ?? '') : label}
      </div>
      {payload.map((entry, i) => (
        <div key={i}>
          {t ? t(entry.name) : entry.name}: {valueFormatter ? valueFormatter(entry) : entry.value}
        </div>
      ))}
    </div>
  );
};

export function ProgressView({ onViewChange }: ProgressViewProps) {
  const { t } = useTranslation();
  const { subjects, questions, learningRecords, studySessions } = useDatabase();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);

  // 計算每日進度
  useEffect(() => {
    const calculateDailyProgress = () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const progress: DailyProgress[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');

        // 計算當天的學習會話
        const daySessions = studySessions.filter(session => {
          const sessionDate = format(new Date(session.startedAt), 'yyyy-MM-dd');
          return sessionDate === dateStr;
        });

        const questionsAnswered = daySessions.reduce((sum, session) => sum + session.answers.length, 0);
        const correctAnswers = daySessions.reduce((sum, session) =>
          sum + session.answers.filter(answer => answer.isCorrect).length, 0
        );
        const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;

        progress.push({
          date: dateStr,
          questionsAnswered,
          correctAnswers,
          accuracy: Math.round(accuracy * 100) / 100,
        });
      }

      setDailyProgress(progress);
    };

    calculateDailyProgress();
  }, [studySessions, timeRange]);

  // 計算科目進度
  useEffect(() => {
    const calculateSubjectProgress = () => {
      const progress: SubjectProgress[] = subjects.map(subject => {
        const subjectQuestions = questions.filter(q => q.subjectId === subject.id);
        const subjectRecords = learningRecords.filter(r => r.subjectId === subject.id);

        const masteredQuestions = subjectRecords.filter(r => r.familiarity === 'mastered').length;
        const familiarQuestions = subjectRecords.filter(r => r.familiarity === 'familiar').length;
        const somewhatFamiliarQuestions = subjectRecords.filter(r => r.familiarity === 'somewhat-familiar').length;
        const unfamiliarQuestions = subjectRecords.filter(r => r.familiarity === 'unfamiliar').length;
        const unansweredQuestions = subjectQuestions.length - subjectRecords.length;

        const totalAttempts = subjectRecords.reduce((sum, r) => sum + r.correctCount + r.incorrectCount, 0);
        const correctAttempts = subjectRecords.reduce((sum, r) => sum + r.correctCount, 0);
        const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

        const totalTimeSpent = subjectRecords.reduce((sum, r) => sum + r.totalTimeSpent, 0);

        return {
          subjectId: subject.id,
          subjectName: subject.name,
          totalQuestions: subjectQuestions.length,
          masteredQuestions,
          familiarQuestions,
          somewhatFamiliarQuestions,
          unfamiliarQuestions,
          unansweredQuestions,
          accuracy: Math.round(accuracy * 100) / 100,
          totalTimeSpent,
        };
      });

      setSubjectProgress(progress);
    };

    calculateSubjectProgress();
  }, [subjects, questions, learningRecords]);

  const filteredSubjectProgress = selectedSubject === 'all'
    ? subjectProgress
    : subjectProgress.filter(p => p.subjectId === selectedSubject);

  const familiarityData = filteredSubjectProgress.length > 0 ? [
    { name: '精通', value: filteredSubjectProgress.reduce((sum, p) => sum + p.masteredQuestions, 0), color: '#10b981' },
    { name: '熟練', value: filteredSubjectProgress.reduce((sum, p) => sum + p.familiarQuestions, 0), color: '#3b82f6' },
    { name: '稍微不熟', value: filteredSubjectProgress.reduce((sum, p) => sum + p.somewhatFamiliarQuestions, 0), color: '#f59e0b' },
    { name: '生疏', value: filteredSubjectProgress.reduce((sum, p) => sum + p.unfamiliarQuestions, 0), color: '#ef4444' },
    { name: '未答', value: filteredSubjectProgress.reduce((sum, p) => sum + p.unansweredQuestions, 0), color: '#6b7280' },
  ] : [];

  const accuracyData = filteredSubjectProgress.map(subject => ({
    name: subject.subjectName,
    accuracy: subject.accuracy,
  }));

  const totalStats = {
    totalQuestions: questions.length,
    totalAnswered: learningRecords.length,
    totalCorrect: learningRecords.reduce((sum, r) => sum + r.correctCount, 0),
    totalIncorrect: learningRecords.reduce((sum, r) => sum + r.incorrectCount, 0),
    totalTimeSpent: learningRecords.reduce((sum, r) => sum + r.totalTimeSpent, 0),
    averageAccuracy: learningRecords.length > 0
      ? Math.round((learningRecords.reduce((sum, r) => sum + r.correctCount, 0) /
        learningRecords.reduce((sum, r) => sum + r.correctCount + r.incorrectCount, 0)) * 10000) / 100
      : 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => onViewChange('home')}
          className="btn btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('Back to Home')}
        </button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Progress')}</h1>

          <div className="flex items-center space-x-4">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="select select-bordered w-48"
            >
              <option value="all">{t('All Subjects')}</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="select select-bordered w-32"
            >
              <option value="7d">{t('7 days')}</option>
              <option value="30d">{t('30 days')}</option>
              <option value="90d">{t('90 days')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 總體統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('Total Questions')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('Accuracy')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.averageAccuracy}%</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('Answered Questions')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.totalAnswered}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('Study Time')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(totalStats.totalTimeSpent / 60)} {t('minutes')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 每日進度曲線圖 */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('Daily Learning Progress')}
          </h3>
          <div className="h-[22rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyProgress} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <CustomTooltip active={active} payload={payload} label={label} />
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="questionsAnswered"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={t('Answered Questions')}
                />
                <Line
                  type="monotone"
                  dataKey="correctAnswers"
                  stroke="#10b981"
                  strokeWidth={2}
                  name={t('Correct')}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name={t('Accuracy')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 熟悉度分布圓餅圖 */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('Familiarity Distribution')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={familiarityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                  className="outline-none focus:outline-none active:outline-none"
                >
                  {familiarityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload, label }) => (
                    <CustomTooltip active={active} payload={payload} label={label} />
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {familiarityData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 科目準確率柱狀圖 */}
      {accuracyData.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('Subject Accuracy')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <CustomTooltip active={active} payload={payload} label={label} />
                  )}
                />
                <Bar dataKey="accuracy" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 科目詳細進度表 */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('Subject Detailed Progress')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{t('Subject')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{t('Total Questions')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{t('Mastered')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{t('Familiar')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{t('Somewhat Familiar')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{t('Unfamiliar')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{t('Unanswered')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{t('Accuracy')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{t('Study Time')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjectProgress.map((subject) => (
                <tr key={subject.subjectId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {subject.subjectName}
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {subject.totalQuestions}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {subject.masteredQuestions}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {subject.familiarQuestions}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      {subject.somewhatFamiliarQuestions}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {subject.unfamiliarQuestions}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {subject.unansweredQuestions}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {subject.accuracy}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {Math.round(subject.totalTimeSpent / 60)} {t('minutes')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
