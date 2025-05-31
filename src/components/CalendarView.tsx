import React from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';

export const CalendarView: React.FC = () => {
  const { viewMode } = useCalendarStore();

  const renderView = () => {
    switch (viewMode) {
      case 'month':
        return <MonthView />;
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      default:
        return <MonthView />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {renderView()}
    </div>
  );
}; 