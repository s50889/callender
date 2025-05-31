import React, { useMemo } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  calculateDayEventLayout
} from '../../utils/dateUtils';
import { 
  isDateSame,
  getEventTimeString
} from '../../utils/dateUtils';

export const DayView: React.FC = () => {
  const {
    currentDate, 
    events, 
    users, 
    filters, 
    openEventModal,
    currentUser,
    isPrivacyModeEnabled,
    getCurrentUserId
  } = useCalendarStore();

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // フィルターされたイベントを取得
  const filteredEvents = events.filter(event => {
    const userVisible = filters.users.length === 0 || !filters.users.includes(event.userId);
    const categoryVisible = filters.categories.length === 0 || !filters.categories.includes(event.category);
    
    if (isPrivacyModeEnabled) {
      const firestoreUserId = getCurrentUserId(); // This is the Firestore document ID from the store
      const authUid = currentUser?.uid; // This is the Firebase Auth UID
      
      console.log(
        '[Debug] DayView Filter:',
        {
          eventTitle: event.title,
          eventUserId: event.userId,
          firestoreUserId: firestoreUserId, 
          authUid: authUid,
          isPrivacyModeEnabled: isPrivacyModeEnabled,
          matchesFirestoreId: firestoreUserId && event.userId === firestoreUserId,
          matchesAuthUid: authUid && event.userId === authUid, // Check if event.userId might be an authUID
        }
      );

      // If firestoreUserId is available, use it for strict matching.
      if (firestoreUserId) {
        if (event.userId !== firestoreUserId) {
          return false; 
        }
      } 
      // If firestoreUserId is NOT available, BUT authUid is, try matching with authUid.
      // This can happen if the users store isn't populated yet, or if an event was created with authUid.
      else if (authUid) {
        if (event.userId !== authUid) {
          return false;
        }
      } 
      // If neither ID is available, we can't determine ownership, so hide in privacy mode.
      else {
        console.log('[Debug] DayView Filter: Both firestoreUserId and authUid are null. Hiding event.');
        return false;
      }
    }
    
    return userVisible && categoryVisible;
  });

  // 今日のイベントを取得
  const dayEvents = filteredEvents.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    return (
      isDateSame(eventStart, currentDate) || 
      isDateSame(eventEnd, currentDate) || 
      (eventStart <= currentDate && eventEnd >= currentDate)
    );
  });

  // イベントレイアウトを計算 (useMemoでキャッシュ)
  const eventLayouts = useMemo(() => {
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);
    return calculateDayEventLayout(dayEvents, dayStart, dayEnd);
  }, [dayEvents, currentDate]);

  const handleTimeSlotClick = (hour: number) => {
    const newDate = new Date(currentDate);
    newDate.setHours(hour, 0, 0, 0);
    openEventModal(undefined, newDate);
  };

  const handleEventClick = (event: any) => {
    openEventModal(event);
  };

  const getUserColor = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.color || '#6b7280';
  };

  // イベントカラー取得: イベント自体の color を優先し、なければユーザーカラー
  const getEventColor = (event: any) => {
    return event.color || getUserColor(event.userId);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  // 曜日名を取得
  const getWeekdayName = (date: Date) => {
    const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    return weekdays[date.getDay()];
  };

  // 24時間制の時間表示
  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // 時間帯による背景色の変更
  const getHourStyle = (hour: number) => {
    // 営業時間外（18時以降、9時前）を薄く表示
    if (hour < 9 || hour >= 18) {
      return 'bg-gray-25';
    }
    return 'bg-white';
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* 日付ヘッダー */}
      <div className="bg-white border-b border-gray-200 z-10 p-3 lg:p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg lg:text-2xl font-bold text-gray-900">
              {format(currentDate, 'yyyy年M月d日', { locale: ja })}
            </h2>
            <p className="text-xs lg:text-sm text-gray-600">
              {getWeekdayName(currentDate)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="text-xs lg:text-sm text-gray-600">
              {dayEvents.length} 件のイベント
            </div>
            <button
              onClick={() => openEventModal()}
              className="btn-primary text-xs lg:text-sm px-3 py-1 lg:px-4 lg:py-2"
            >
              <span className="hidden sm:inline">新規イベント</span>
              <span className="sm:hidden">新規</span>
            </button>
          </div>
        </div>
      </div>

      {/* スクロール可能なコンテンツエリア */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex min-h-full">
          {/* 時間軸 */}
          <div className="w-12 lg:w-20 border-r border-gray-200 bg-gray-50 flex-shrink-0">
            {hours.map((hour) => (
              <div key={hour} className="h-16 lg:h-20 border-b border-gray-100 flex items-start justify-end p-1 lg:p-2">
                <span className={`text-[10px] lg:text-xs font-medium ${
                  hour >= 9 && hour < 18 ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* イベント表示エリア */}
          <div className="flex-1 relative">
            {/* 時間グリッド */}
            {hours.map((hour) => (
              <div
                key={hour}
                onClick={() => handleTimeSlotClick(hour)}
                className={`h-16 lg:h-20 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors relative ${getHourStyle(hour)}`}
              >
                {/* 30分区切り線 */}
                <div className="absolute top-8 lg:top-10 left-0 right-0 border-t border-gray-50"></div>
              </div>
            ))}

            {/* イベント表示 */}
            {dayEvents.map((event) => {
              const layout = eventLayouts.get(event.id);
              if (!layout || event.allDay) return null; // 終日イベントやレイアウト情報がないものはスキップ

              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="absolute rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 overflow-hidden"
                  style={{
                    backgroundColor: `${getEventColor(event)}20`, // 背景を少し薄く
                    borderLeftColor: getEventColor(event),
                    top: `${layout.top}%`,
                    height: `${layout.height}%`,
                    left: `${layout.left}%`,
                    width: `${layout.width}%`,
                    zIndex: layout.zIndex,
                  }}
                >
                  <div className="p-1 lg:p-2 h-full flex flex-col text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="font-semibold text-gray-900 truncate flex-1">
                        {event.title}
                      </div>
                      <span className="text-[8px] font-bold text-white bg-gray-600 px-1 rounded flex-shrink-0 ml-1">
                        {getUserName(event.userId).charAt(0)}
                      </span>
                    </div>
                    <div className="text-gray-600 mb-0.5">
                      {getEventTimeString(event.startDate, event.endDate, event.allDay)}
                    </div>
                    {event.description && (
                      <div className="text-gray-600 text-[10px] flex-1 overflow-hidden hidden lg:block mt-1">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 終日イベント */}
      {dayEvents.filter(event => event.allDay).length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-2 lg:p-4 flex-shrink-0">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-700 mb-2 lg:mb-3">終日イベント</h3>
          <div className="space-y-1 lg:space-y-2">
            {dayEvents.filter(event => event.allDay).map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="bg-white rounded-lg p-2 lg:p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: getEventColor(event) }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 lg:space-x-2 min-w-0 flex-1">
                    <span className="text-[10px] lg:text-xs font-bold text-white bg-gray-600 px-1 rounded flex-shrink-0">
                      {getUserName(event.userId).charAt(0)}
                    </span>
                    <div className="font-medium text-gray-900 text-xs lg:text-base truncate">{event.title}</div>
                    <div className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                      👤 {getUserName(event.userId)}
                    </div>
                  </div>
                  {event.location && (
                    <div className="text-xs lg:text-sm text-gray-500 hidden lg:block">
                      📍 {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 