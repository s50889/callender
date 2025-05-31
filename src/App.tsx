import { useEffect } from 'react';
import { useCalendarStore } from './store/calendarStore';
import { LoginPage } from './components/LoginPage';
import { CalendarHeader } from './components/CalendarHeader';
import { MonthView } from './components/views/MonthView';
import { WeekView } from './components/views/WeekView';
import { DayView } from './components/views/DayView';
import { AlertCircle } from 'lucide-react';
import { EventModal } from './components/EventModal';
import { UserModal } from './components/UserModal';

function App() {
  const { 
    currentUser, 
    viewMode,
    isLoading, 
    error,
    isEventModalOpen, 
    isUserModalOpen,
    initializeAuth
  } = useCalendarStore();

  useEffect(() => {
    // Firebase認証の初期化
    initializeAuth();
  }, [initializeAuth]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合はログイン画面を表示
  if (!currentUser) {
    return <LoginPage />;
  }

  // エラー表示コンポーネント
  const ErrorBanner = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button
            onClick={() => useCalendarStore.setState({ error: null })}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* エラーバナー */}
      <ErrorBanner />
      
      {/* ヘッダー */}
      <CalendarHeader />

      {/* メインコンテンツエリア */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0">
        {viewMode === 'month' && <MonthView />}
        {viewMode === 'week' && <WeekView />}
        {viewMode === 'day' && <DayView />}
      </main>
      
      {/* モーダル */}
      {isEventModalOpen && <EventModal />}
      {isUserModalOpen && <UserModal />}
    </div>
  );
}

export default App; 