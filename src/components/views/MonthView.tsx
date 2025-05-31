import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { 
  getMonthDays, 
  isDateInCurrentMonth, 
  isDateToday, 
  isDateSame,
  getEventTimeString 
} from '../../utils/dateUtils';
import { format } from 'date-fns';

export const MonthView: React.FC = () => {
  const { 
    currentDate, 
    events, 
    users, 
    filters, 
    openEventModal,
    setCurrentDate,
    currentUser,
    isPrivacyModeEnabled,
    getCurrentUserId
  } = useCalendarStore();

  const monthDays = getMonthDays(currentDate);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  // フィルターされたイベントを取得
  const filteredEvents = events.filter(event => {
    const userVisible = filters.users.length === 0 || !filters.users.includes(event.userId);
    const categoryVisible = filters.categories.length === 0 || !filters.categories.includes(event.category);

    if (isPrivacyModeEnabled) {
      const firestoreUserId = getCurrentUserId(); // This is the Firestore document ID from the store
      const authUid = currentUser?.uid; // This is the Firebase Auth UID
      
      console.log(
        '[Debug] MonthView Filter:',
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
        console.log('[Debug] MonthView Filter: Both firestoreUserId and authUid are null. Hiding event.');
        return false;
      }
    }
    
    return userVisible && categoryVisible;
  });

  // 特定の日のイベントを取得
  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // 日付の範囲をチェック
      return (
        isDateSame(eventStart, day) || 
        isDateSame(eventEnd, day) || 
        (eventStart <= day && eventEnd >= day)
      );
    });
  };

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    openEventModal();
  };

  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* 週の曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekdays.map((day, index) => (
          <div 
            key={day} 
            className={`p-2 lg:p-4 text-center font-semibold text-xs lg:text-sm ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr min-h-0">
        {monthDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isDateInCurrentMonth(day, currentDate);
          const isToday = isDateToday(day);
          
          return (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`relative border-r border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors p-1 lg:p-2 flex flex-col min-h-0 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'bg-blue-50' : ''}`}
            >
              {/* 日付 */}
              <div className="flex items-center justify-between mb-1 lg:mb-2 flex-shrink-0">
                <span 
                  className={`text-xs lg:text-sm font-medium ${
                    isToday 
                      ? 'bg-primary-500 text-white w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-xs'
                      : isCurrentMonth 
                        ? 'text-gray-900' 
                        : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* イベント一覧 */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {dayEvents.slice(0, window.innerWidth < 768 ? 2 : 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className="event-item text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                    style={{ backgroundColor: getEventColor(event) }}
                    title={`${event.title} - ${getEventTimeString(event.startDate, event.endDate, event.allDay)} - ${users.find(u => u.id === event.userId)?.name || ''}`}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center space-x-1 flex-1 min-w-0">
                        <span className="text-[8px] lg:text-[10px] font-bold bg-white bg-opacity-30 px-0.5 lg:px-1 rounded flex-shrink-0">
                          {users.find(u => u.id === event.userId)?.name.charAt(0) || ''}
                        </span>
                        <span className="font-medium truncate text-white text-[10px] lg:text-xs">
                          {event.title}
                        </span>
                      </div>
                      {!event.allDay && (
                        <span className="text-[8px] lg:text-[10px] opacity-90 text-white ml-1 flex-shrink-0 hidden sm:inline">
                          {format(event.startDate, 'HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* 追加のイベント数を表示 */}
                {dayEvents.length > (window.innerWidth < 768 ? 2 : 3) && (
                  <div 
                    className="text-[10px] lg:text-xs text-gray-500 font-medium px-1 cursor-pointer hover:text-gray-700 truncate"
                    title={`他 ${dayEvents.length - (window.innerWidth < 768 ? 2 : 3)} 件のイベント`}
                  >
                    +{dayEvents.length - (window.innerWidth < 768 ? 2 : 3)} 件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 