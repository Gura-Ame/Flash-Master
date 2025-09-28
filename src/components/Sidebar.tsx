import { useState } from 'react';
import { 
  Home, 
  BookOpen, 
  Settings, 
  BarChart3, 
  Download, 
  Upload, 
  Menu, 
  X,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Clock
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ currentView, onViewChange, isOpen, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const { theme, setTheme, actualTheme } = useTheme();
  const { exportData, importData } = useDatabase();
  const { logout } = useAuth();
  const [showImport, setShowImport] = useState(false);

  const menuItems = [
    { id: 'home', label: t('Home'), icon: Home },
    { id: 'study', label: t('Study'), icon: BookOpen },
    { id: 'review', label: t('Review'), icon: Clock },
    { id: 'progress', label: t('Progress'), icon: BarChart3 },
    { id: 'settings', label: t('Settings'), icon: Settings },
  ];

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

  const cycleTheme = () => {
    const themes = [
      'light', 'dark', 'system'
    ];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex] as any);
  };

  // 主題名稱多語言
  const themeName = (theme: string) => {
    switch (theme) {
      case 'light': return t('Light');
      case 'dark': return t('Dark');
      case 'system': return t('System');
      default: return theme;
    }
  };

  const getThemeIcon = () => {
    if (theme === 'system') return Monitor;
    return actualTheme === 'dark' ? Moon : Sun;
  };

  const ThemeIcon = getThemeIcon();

  return (
    <>
      {/* 移動端遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* 側邊欄 */}
      <aside
        className={`
          bg-base-100 border-r border-base-300 flex-shrink-0 fixed top-0 left-0 z-50 sidebar-left
          h-screen min-h-screen
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-0'}
          ${isOpen ? 'block' : 'hidden'}
          lg:block
        `}
        style={{ overflow: isOpen ? 'visible' : 'hidden' }}
        role="complementary"
        aria-label={t('Sidebar')}
      >
        <div
          className={`
            flex flex-col h-full bg-base-100
            transition-opacity duration-200
            absolute top-0 left-0 w-64
            ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
          style={{ minHeight: '100vh' }}
        >
          {/* 標題和關閉按鈕 */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h1 className="text-xl font-bold text-base-content">
              Flash Master
            </h1>
            {/* X 按鈕在所有螢幕尺寸下都顯示 */}
            <button
              onClick={onToggle}
              className="btn btn-ghost btn-sm"
              aria-label={t('Close sidebar')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 導航菜單 */}
          <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label={t('Sidebar')}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 text-left transition-colors
                    ${isActive 
                      ? 'btn btn-primary' 
                      : 'btn btn-ghost justify-start'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 底部操作 */}
          <div className="p-4 border-t border-base-300 space-y-2 mt-auto">
            {/* 主題切換 */}
            <button
              onClick={cycleTheme}
              className="w-full btn btn-ghost justify-start"
              aria-label={t('Change theme')}
            >
              <ThemeIcon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">
                {themeName(theme)}
              </span>
            </button>

            {/* 匯出按鈕 */}
            <button
              onClick={handleExport}
              className="w-full btn btn-ghost justify-start"
            >
              <Download className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">{t('Export Data')}</span>
            </button>

            {/* 匯入按鈕 */}
            <div className="relative">
              <button
                onClick={() => setShowImport(!showImport)}
                className="w-full btn btn-ghost justify-start"
              >
                <Upload className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium truncate">{t('Import Data')}</span>
              </button>
              {showImport && (
                <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-base-100 border border-base-300 rounded-md shadow-lg z-10">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="w-full file-input file-input-bordered file-input-sm"
                    aria-label={t('Choose file')}
                  />
                </div>
              )}
            </div>

            {/* 登出按鈕 */}
            <button
              onClick={logout}
              className="w-full btn btn-ghost justify-start"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">{t('Log out')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 桌面端收起狀態的圖標按鈕 */}
      {/* 在所有非展開狀態下顯示浮動按鈕 */}
      {!isOpen && (
        <div className="fixed top-4 left-4 z-40 rtl:right-4 rtl:left-auto">
          <button
            onClick={onToggle}
            className="btn btn-ghost btn-circle shadow-lg"
            aria-label={t('Open sidebar')}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}