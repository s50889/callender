import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Plus,
  Users,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCalendarStore } from '../store/calendarStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export const CalendarHeader: React.FC = () => {
  const { 
    currentDate, 
    viewMode, 
    setViewMode, 
    nextPeriod, 
    prevPeriod, 
    goToToday,
    openEventModal,
    openUserModal,
    signOut,
    currentUser,
    isPrivacyModeEnabled,
    togglePrivacyMode
  } = useCalendarStore();

  const formatHeaderDate = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'yyyy年M月', { locale: ja });
      case 'week':
        return format(currentDate, 'yyyy年M月d日 週', { locale: ja });
      case 'day':
        return format(currentDate, 'yyyy年M月d日 (E)', { locale: ja });
      default:
        return format(currentDate, 'yyyy年M月', { locale: ja });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-center justify-between">
        {/* 左側: ロゴとナビゲーション */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="flex items-center">
            <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
            {/* <h1 className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl">
              <span className="hidden sm:inline">チーム</span>カレンダー
            </h1> */}
          </div>

          {/* 日付ナビゲーション */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 lg:space-x-2">
            <button
              onClick={prevPeriod}
              className="p-1 sm:p-1.5 lg:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            
            <div className="min-w-0 text-center">
              <h2 className="text-xs sm:text-sm lg:text-lg font-semibold text-gray-900 truncate px-1 sm:px-2">
                {formatHeaderDate()}
              </h2>
            </div>
            
            <button
              onClick={nextPeriod}
              className="p-1 sm:p-1.5 lg:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-2 py-1 sm:px-3 lg:px-4 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
          >
            今日
          </button>
        </div>

        {/* 右側: ユーザー情報、ビュー切り替えとアクション */}
        <div className="flex items-center space-x-1 lg:space-x-3">
          {/* ユーザー情報 */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-medium text-gray-900">
                {currentUser?.displayName || 'ユーザー'}
              </p>
              <p className="text-xs text-gray-500">{currentUser?.email}</p>
            </div>
          </div>

          {/* ビュー切り替え */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'month' ? '月' : mode === 'week' ? '週' : '日'}
              </button>
            ))}
          </div>

          {/* アクションボタン */}
          <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0 overflow-x-auto py-1">
            <button
              onClick={togglePrivacyMode}
              className={`p-2 rounded-lg transition-colors ${
                isPrivacyModeEnabled
                  ? 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={isPrivacyModeEnabled ? '他人の予定を表示' : '他人の予定を非表示'}
            >
              {isPrivacyModeEnabled ? (
                <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" />
              ) : (
                <Eye className="w-4 h-4 lg:w-5 lg:h-5" />
              )}
            </button>

            <button
              onClick={openUserModal}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="ユーザー管理"
            >
              <Users className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            
            <button
              onClick={() => openEventModal()}
              className="btn-primary flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm px-2 py-1 lg:px-4 lg:py-2"
            >
              <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">新規イベント</span>
            </button>

            <button
              onClick={signOut}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="ログアウト"
            >
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}; 