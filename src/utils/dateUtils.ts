import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  startOfDay,
  endOfDay,
  getHours,
  getMinutes
} from 'date-fns';
import { ja } from 'date-fns/locale';

export const formatDate = (date: Date, formatString: string) => {
  return format(date, formatString, { locale: ja });
};

export const getMonthDays = (date: Date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
};

export const getWeekDays = (date: Date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
};

export const getDayHours = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push(i);
  }
  return hours;
};

export const isDateInCurrentMonth = (date: Date, currentDate: Date) => {
  return isSameMonth(date, currentDate);
};

export const isDateToday = (date: Date) => {
  return isToday(date);
};

export const isDateSame = (date1: Date, date2: Date) => {
  return isSameDay(date1, date2);
};

export const getEventTimeString = (startDate: Date, endDate: Date, allDay: boolean) => {
  if (allDay) {
    return '終日';
  }
  
  const startTime = format(startDate, 'HH:mm');
  const endTime = format(endDate, 'HH:mm');
  
  if (isSameDay(startDate, endDate)) {
    return `${startTime} - ${endTime}`;
  }
  
  return `${format(startDate, 'M/d HH:mm')} - ${format(endDate, 'M/d HH:mm')}`;
};

export const getTimeSlots = (interval: number = 30) => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      slots.push(time);
    }
  }
  return slots;
};

export const getEventPosition = (event: { startDate: Date; endDate: Date }, dayStart: Date) => {
  const dayStartTime = startOfDay(dayStart);
  const dayEndTime = endOfDay(dayStart);
  
  const eventStart = event.startDate < dayStartTime ? dayStartTime : event.startDate;
  const eventEnd = event.endDate > dayEndTime ? dayEndTime : event.endDate;
  
  const totalMinutes = 24 * 60;
  const startMinutes = getHours(eventStart) * 60 + getMinutes(eventStart);
  const endMinutes = getHours(eventEnd) * 60 + getMinutes(eventEnd);
  
  const top = (startMinutes / totalMinutes) * 100;
  const height = ((endMinutes - startMinutes) / totalMinutes) * 100;
  
  return { top, height };
};

export const formatEventDuration = (startDate: Date, endDate: Date) => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours === 0) {
    return `${diffMinutes}分`;
  } else if (diffMinutes === 0) {
    return `${diffHours}時間`;
  } else {
    return `${diffHours}時間${diffMinutes}分`;
  }
};

export const isEventInDateRange = (
  event: { startDate: Date; endDate: Date }, 
  rangeStart: Date, 
  rangeEnd: Date
) => {
  return event.startDate <= rangeEnd && event.endDate >= rangeStart;
};

export interface EventLayout {
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

export const calculateDayEventLayout = (
  events: Array<{ id: string, startDate: Date, endDate: Date, allDay?: boolean }>,
  dayStart: Date,
  dayEnd: Date
): Map<string, EventLayout> => {
  const layoutMap = new Map<string, EventLayout>();
  const minuteHeight = 100 / (24 * 60); // 1分の高さを%で表現

  // 終日イベントは除外
  const timedEvents = events
    .filter(event => !event.allDay)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime() || b.endDate.getTime() - a.endDate.getTime());

  if (timedEvents.length === 0) {
    return layoutMap;
  }

  // 各イベントの初期レイアウトと重複グループを計算
  const eventInfos = timedEvents.map(event => {
    const eventTrueStart = event.startDate < dayStart ? dayStart : event.startDate;
    const eventTrueEnd = event.endDate > dayEnd ? dayEnd : event.endDate;

    const startMinutes = getHours(eventTrueStart) * 60 + getMinutes(eventTrueStart);
    const endMinutes = getHours(eventTrueEnd) * 60 + getMinutes(eventTrueEnd);

    return {
      id: event.id,
      startMinutes,
      endMinutes,
      top: startMinutes * minuteHeight,
      height: (endMinutes - startMinutes) * minuteHeight,
      columns: [] as Array<typeof event>[], // このイベントが属するカラムグループ
      maxOverlap: 0, // このイベントの時間帯での最大重複数
      columnIndex: 0, // このイベントが何番目のカラムか
    };
  });

  for (let i = 0; i < eventInfos.length; i++) {
    const currentEvent = eventInfos[i];
    let maxOverlap = 0;
    let columnIndex = 0;

    // Find a column for the current event
    for (let col = 0; ; col++) {
        let fitsInColumn = true;
        for (const otherEventInfo of eventInfos) {
            if (i === eventInfos.indexOf(otherEventInfo)) continue;
            if (otherEventInfo.columnIndex !== col) continue;

            // Check for time overlap
            if (currentEvent.startMinutes < otherEventInfo.endMinutes && 
                currentEvent.endMinutes > otherEventInfo.startMinutes) {
                fitsInColumn = false;
                break;
            }
        }
        if (fitsInColumn) {
            columnIndex = col;
            break;
        }
    }
    currentEvent.columnIndex = columnIndex;

    // Calculate maxOverlap for the current event's time slot
    for (const otherEventInfo of eventInfos) {
        if (i === eventInfos.indexOf(otherEventInfo)) continue;
        if (currentEvent.startMinutes < otherEventInfo.endMinutes && 
            currentEvent.endMinutes > otherEventInfo.startMinutes) {
            maxOverlap++;
        }
    }
    currentEvent.maxOverlap = Math.max(1, maxOverlap + 1); // self inclusive
  }
  
  // Determine the number of columns needed by finding the max columnIndex used
  let totalColumns = 0;
  eventInfos.forEach(ei => {
    if (ei.columnIndex >= totalColumns) {
      totalColumns = ei.columnIndex + 1;
    }
  });
  totalColumns = Math.max(1, totalColumns); // Ensure at least one column

  eventInfos.forEach(ei => {
    const width = 100 / totalColumns;
    const left = ei.columnIndex * width;
    
    layoutMap.set(ei.id, {
      top: ei.top,
      height: Math.max(ei.height, 2), // Ensure a minimum height for visibility
      left: left,
      width: width,
      zIndex: ei.columnIndex + 10, // Basic z-index based on column
    });
  });

  return layoutMap;
}; 