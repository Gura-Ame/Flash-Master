import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './contexts/ThemeContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { StudyView } from './components/StudyView';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { ReviewView } from './components/ReviewView';

function AppContent() {
  const [currentView, setCurrentView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { i18n } = useTranslation();
  const { user, loading } = useAuth();

  // 在移動端自動關閉側邊欄
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // 桌面端默認打開側邊欄
      } else {
        setSidebarOpen(false); // 移動端默認關閉側邊欄
      }
    };

    // 初始化時設置正確的狀態
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onViewChange={setCurrentView} />;
      case 'study':
        return <StudyView onViewChange={setCurrentView} />;
      case 'progress':
        return <ProgressView onViewChange={setCurrentView} />;
      case 'settings':
        return <SettingsView onViewChange={setCurrentView} />;
      case 'review':
        return <ReviewView onViewChange={setCurrentView} />;
      default:
        return <HomeView onViewChange={setCurrentView} />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex" dir={i18n.dir()}>
        <main className="flex-1">
          <LoginView />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex" dir={i18n.dir()}>
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64 rtl:lg:mr-64 rtl:lg:ml-0' : 'lg:ml-0'}`}
      >
        {renderCurrentView()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DatabaseProvider>
          <AppContent />
        </DatabaseProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;