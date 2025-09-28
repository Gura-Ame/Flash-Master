import { useState } from 'react';
import { ArrowLeft, Download, Upload, Trash2 } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface SettingsViewProps {
  onViewChange: (view: string) => void;
}

export function SettingsView({ onViewChange }: SettingsViewProps) {
  const { t } = useTranslation();
  const { settings, updateSettings, exportData, importData, clearAllData, isLoading } = useDatabase();
  const { theme, setTheme } = useTheme();
  const [showImport, setShowImport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 將 handleSettingChange 改為同步 setSettings，並 await updateSettings
  const handleSettingChange = async (key: string, value: any) => {
    try {
      await updateSettings({ [key]: value });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flash-master-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('匯出失敗，請重試');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        await importData(data);
        alert('匯入成功！');
        setShowImport(false);
      } catch (error) {
        console.error('Import failed:', error);
        alert('匯入失敗，請檢查檔案格式');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    try {
      await clearAllData();
      alert('所有數據已清除');
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Clear data failed:', error);
      alert('清除數據失敗，請重試');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => onViewChange('home')}
          className="btn btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('Back to Home')}
        </button>
        <h1 className="text-3xl font-bold text-base-content">{t('Settings')}</h1>
      </div>

      <div className="space-y-6">
        {/* 外觀設定 */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-base-content mb-4">{t('Appearance Settings')}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('Theme')}
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="select select-bordered w-48"
                disabled={isLoading}
              >
                <option value="light">{t('Light')}</option>
                <option value="dark">{t('Dark')}</option>
                <option value="system">{t('System')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('Language')}
              </label>
              <select
                onChange={(e) => import('i18next').then(({ default: i18next }) => i18next.changeLanguage(e.target.value))}
                className="select select-bordered w-48"
                defaultValue="zh"
                disabled={isLoading}
              >
                <option value="zh">{t('Chinese')}</option>
                <option value="en">{t('English')}</option>
                <option value="ja">{t('Japanese')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 學習設定 */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-base-content mb-4">{t('Learning Settings')}</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('Show Hints')}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('Show hints when answering questions')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showHints}
                  onChange={(e) => handleSettingChange('showHints', e.target.checked)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('Auto Advance')}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('Automatically advance to the next question after answering')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoAdvance}
                  onChange={(e) => handleSettingChange('autoAdvance', e.target.checked)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('Sound')}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('Play sound feedback when answering')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('Keyboard Shortcuts')}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('Enable keyboard shortcuts (1-4 to select answers, Enter to submit)')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.keyboardShortcuts}
                  onChange={(e) => handleSettingChange('keyboardShortcuts', e.target.checked)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 學習參數 */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-base-content mb-4">{t('Learning Parameters')}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('Review Interval (Days)')}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.reviewInterval}
                onChange={(e) => handleSettingChange('reviewInterval', parseInt(e.target.value))}
                className="input w-32"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('Controls the basic review interval for the SRS algorithm')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('New Questions Per Session')}
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={settings.newQuestionsPerSession}
                onChange={(e) => handleSettingChange('newQuestionsPerSession', parseInt(e.target.value))}
                className="input w-32"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('The number of new questions added in each learning session')}
              </p>
            </div>
          </div>
        </div>

        {/* 數據管理 */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-base-content mb-4">{t('Data Management')}</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExport}
                className="btn btn-primary"
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('Export Data')}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowImport(!showImport)}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t('Import Data')}
                </button>
                
                {showImport && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 border border-base-300 dark:border-gray-700 rounded-md shadow-lg">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('Clear All Data')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('This action will permanently delete all subjects, questions, and learning records')}
                  </p>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="btn btn-ghost text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('Clear Data')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 快捷鍵說明 */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-base-content mb-4">{t('Keyboard Shortcuts')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{t('Answer Shortcuts')}</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>1-4</span>
                  <span>{t('Select answer options')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Enter</span>
                  <span>{t('Submit answer')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Enter + Enter</span>
                  <span>{t('Show answer and advance to next question')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Space</span>
                  <span>{t('Retry current question')}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{t('Navigation Shortcuts')}</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Esc</span>
                  <span>{t('Go back to previous page')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ctrl + S</span>
                  <span>{t('Save settings')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ctrl + E</span>
                  <span>{t('Export data')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ctrl + I</span>
                  <span>{t('Import Data')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 清除數據確認模態框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-base-content mb-4">
              {t('Confirm Clear Data')}
            </h3>
            <p className="text-base-content/70 mb-6">
              {t('This action will permanently delete all data, including subjects, questions, and learning records. This action cannot be undone.')}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-ghost"
                disabled={isLoading}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleClearAllData}
                className="btn btn-primary bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('Confirm Clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
