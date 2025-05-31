import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { 
  getWeekDays, 
  isDateToday, 
  isDateSame,
  getEventTimeString,
  getEventPosition 
} from '../../utils/dateUtils';
import { format } from 'date-fns';

export const WeekView: React.FC = () => {
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

  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // フィルターされたイベントを取得
  const filteredEvents = events.filter(event => {
    const userVisible = filters.users.length === 0 || !filters.users.includes(event.userId);
    const categoryVisible = filters.categories.length === 0 || !filters.categories.includes(event.category);
    
    if (isPrivacyModeEnabled) {
      const firestoreUserId = getCurrentUserId(); // This is the Firestore document ID from the store
      const authUid = currentUser?.uid; // This is the Firebase Auth UID
      
      console.log(
        '[Debug] WeekView Filter:',
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
        console.log('[Debug] WeekView Filter: Both firestoreUserId and authUid are null. Hiding event.');
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
      
      return (
        isDateSame(eventStart, day) || 
        isDateSame(eventEnd, day) || 
        (eventStart <= day && eventEnd >= day)
      );
    });
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const newDate = new Date(day);
    newDate.setHours(hour, 0, 0, 0);
    setCurrentDate(newDate);
    openEventModal();
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
      {/* 週の日付ヘッダー */}
      <div className="bg-white border-b border-gray-200 z-10 flex-shrink-0">
        <div className="grid grid-cols-8">
          {/* 時間列のヘッダー */}
          <div className="p-2 lg:p-4 border-r border-gray-200 w-12 lg:w-16"></div>
          
          {/* 各日のヘッダー */}
          {weekDays.map((day, index) => {
            const isToday = isDateToday(day);
            const weekday = ['日', '月', '火', '水', '木', '金', '土'][index];
            
            return (
              <div 
                key={index} 
                className={`p-2 lg:p-4 text-center border-r border-gray-200 ${
                  isToday ? 'bg-primary-50' : ''
                }`}
              >
                <div className={`text-xs lg:text-sm font-medium ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {weekday}
                </div>
                <div className={`text-sm lg:text-lg font-bold mt-1 ${
                  isToday 
                    ? 'bg-primary-500 text-white w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center mx-auto text-xs lg:text-base'
                    : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* スクロール可能なコンテンツエリア */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* 時間グリッド */}
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
              {/* 時間表示 */}
              <div className="p-1 lg:p-2 text-xs text-right border-r border-gray-200 w-12 lg:w-16 bg-gray-50 flex items-start justify-end h-16 lg:h-24">
                <span className={`font-medium text-[10px] lg:text-xs ${
                  hour >= 9 && hour < 18 ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {formatHour(hour)}
                </span>
              </div>
              
              {/* 各日の時間スロット */}
              {weekDays.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  onClick={() => handleTimeSlotClick(day, hour)}
                  className={`h-16 lg:h-24 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors relative ${getHourStyle(hour)}`}
                >
                  {/* この時間帯のイベントを表示 */}
                  {getEventsForDay(day)
                    .filter(event => {
                      const eventHour = new Date(event.startDate).getHours();
                      return eventHour === hour;
                    })
                    .map((event, eventIndex) => {
                      const position = getEventPosition(event, day);
                      
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className="absolute left-0.5 right-0.5 lg:left-1 lg:right-1 rounded text-white text-xs p-0.5 lg:p-1 cursor-pointer hover:opacity-80 transition-opacity z-20"
                          style={{
                            backgroundColor: getEventColor(event),
                            top: `${position.top}%`,
                            height: `${Math.max(position.height, 40)}%`,
                            zIndex: 20 + eventIndex
                          }}
                        >
                          <div className="flex items-center space-x-1 truncate">
                            <span className="text-[8px] lg:text-[10px] font-bold bg-white bg-opacity-30 px-0.5 lg:px-1 rounded flex-shrink-0">
                              {users.find(u => u.id === event.userId)?.name.charAt(0) || ''}
                            </span>
                            <span className="font-medium truncate text-[10px] lg:text-xs">{event.title}</span>
                          </div>
                          {!event.allDay && (
                            <div className="text-[8px] lg:text-xs opacity-90 hidden lg:block">
                              {getEventTimeString(event.startDate, event.endDate, event.allDay)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 終日イベント表示エリア */}
      <div className="bg-gray-50 border-t border-gray-200 flex-shrink-0">
        <div className="grid grid-cols-8">
          <div className="p-1 lg:p-2 text-xs text-gray-500 text-right border-r border-gray-200 w-12 lg:w-16">
            終日
          </div>
          {weekDays.map((day, dayIndex) => {
            const allDayEvents = getEventsForDay(day).filter(event => event.allDay);
            
            return (
              <div key={dayIndex} className="p-1 lg:p-2 border-r border-gray-200 min-h-16 lg:min-h-24">
                <div className="space-y-0.5 lg:space-y-1">
                  {allDayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="text-xs p-1 lg:p-1.5 rounded text-white cursor-pointer hover:opacity-80 transition-opacity truncate"
                      style={{ backgroundColor: getEventColor(event) }}
                    >
                      <div className="flex items-center space-x-1 min-w-0">
                        <span className="text-[8px] lg:text-[10px] font-bold bg-white bg-opacity-30 px-0.5 lg:px-1 rounded flex-shrink-0">
                          {users.find(u => u.id === event.userId)?.name.charAt(0) || ''}
                        </span>
                        <span className="truncate text-[10px] lg:text-xs">{event.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 