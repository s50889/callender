export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  position: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  userId: string;
  attendees: string[];
  location?: string;
  color: string;
  category: EventCategory;
  recurring?: RecurringRule;
  reminders: Reminder[];
}

export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  count?: number;
  daysOfWeek?: number[];
}

export interface Reminder {
  id: string;
  minutes: number;
  method: 'popup' | 'email';
}

export type EventCategory = 
  | 'meeting'
  | 'personal'
  | 'project'
  | 'holiday'
  | 'deadline'
  | 'training'
  | 'other';

export type ViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarState {
  currentDate: Date;
  viewMode: ViewMode;
  events: CalendarEvent[];
  users: User[];
  selectedEvent?: CalendarEvent;
  isEventModalOpen: boolean;
  isUserModalOpen: boolean;
  filters: {
    users: string[];
    categories: EventCategory[];
  };
}

export interface DragEvent {
  eventId: string;
  newStartDate: Date;
  newEndDate: Date;
} 