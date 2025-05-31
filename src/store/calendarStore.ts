import { create } from 'zustand';
import { addMonths, addWeeks, addDays } from 'date-fns';
import { CalendarState, CalendarEvent, User, ViewMode, EventCategory } from '../types';
import { AuthService, AuthUser } from '../services/authService';
import { FirestoreService } from '../services/firestoreService';

interface CalendarActions {
  // Authentication
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => void;
  
  // Date navigation
  nextPeriod: () => void;
  prevPeriod: () => void;
  goToToday: () => void;
  setCurrentDate: (date: Date) => void;
  
  // View mode
  setViewMode: (mode: ViewMode) => void;
  
  // Events
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedEvent: (event?: CalendarEvent) => void;
  loadEvents: () => Promise<void>;
  
  // Modals
  openEventModal: (event?: CalendarEvent) => void;
  closeEventModal: () => void;
  openUserModal: () => void;
  closeUserModal: () => void;
  
  // Users
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  
  // Filters
  toggleUserFilter: (userId: string) => void;
  toggleCategoryFilter: (category: EventCategory) => void;
  clearFilters: () => void;
  
  // Privacy
  togglePrivacyMode: () => void;
  getCurrentUserId: () => string | null;
  
  // Drag and drop
  moveEvent: (eventId: string, newStartDate: Date, newEndDate: Date) => Promise<void>;
}

interface ExtendedCalendarState extends CalendarState {
  // Authentication state
  currentUser: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  organizationId: string | null;
  
  // Privacy settings
  isPrivacyModeEnabled: boolean;
  
  // Subscriptions
  unsubscribeEvents?: () => void;
  unsubscribeUsers?: () => void;
}

export const useCalendarStore = create<ExtendedCalendarState & CalendarActions>((set, get) => ({
  // Initial state
  currentDate: new Date(),
  viewMode: 'month',
  events: [],
  users: [],
  selectedEvent: undefined,
  isEventModalOpen: false,
  isUserModalOpen: false,
  filters: {
    users: [],
    categories: []
  },
  
  // Firebase state
  currentUser: null,
  isLoading: false,
  error: null,
  organizationId: null,
  
  // Privacy state
  isPrivacyModeEnabled: false,
  
  // Authentication
  initializeAuth: () => {
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      set({ currentUser: user, isLoading: false });
      
      if (user) {
        try {
          // デモ組織ID（全ユーザーが同じ組織でチーム予定を共有）
          const orgId = 'demo-organization';
          set({ organizationId: orgId });
          
          // データの初期読み込み
          await get().loadUsers();
          await get().loadEvents();
          
          // 現在のユーザーがFirestoreに存在するか確認
          const existingUser = await FirestoreService.getUserByAuthId(user.uid);
          if (!existingUser) {
            // ユーザーが存在しない場合は自動作成
            console.log('ユーザーが存在しないため、自動作成します');
            await FirestoreService.createUser({
              name: user.displayName || user.email?.split('@')[0] || 'ユーザー',
              email: user.email || '',
              department: '未設定',
              position: '未設定',
              color: '#3b82f6'
            }, orgId, user.uid);
            
            // ユーザーリストを再読み込み
            await get().loadUsers();
          }
          
          // リアルタイム監視開始
          const unsubEvents = FirestoreService.subscribeToEvents(orgId, (events) => {
            set({ events });
          });
          
          const unsubUsers = FirestoreService.subscribeToUsers(orgId, (users) => {
            set({ users });
          });
          
          set({ 
            unsubscribeEvents: unsubEvents,
            unsubscribeUsers: unsubUsers 
          });
          
        } catch (error) {
          console.error('初期化エラー:', error);
          set({ error: 'データの読み込みに失敗しました' });
        }
      } else {
        // ログアウト時の cleanup
        const { unsubscribeEvents, unsubscribeUsers } = get();
        unsubscribeEvents?.();
        unsubscribeUsers?.();
        
        set({ 
          events: [],
          users: [],
          organizationId: null,
          unsubscribeEvents: undefined,
          unsubscribeUsers: undefined 
        });
      }
    });
    
    // Component unmount時の cleanup用（実際はApp.tsxで管理）
    return unsubscribe;
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await AuthService.signIn(email, password);
    } catch (error: any) {
      set({ error: error.message || 'ログインに失敗しました' });
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.signUp(email, password, displayName);
      
      // デモ組織を使用（チーム予定共有のため）
      const orgId = 'demo-organization';
      
      // 組織が存在しない場合は作成
      try {
        await FirestoreService.createOrganization('デモ組織', user.uid);
      } catch (error) {
        // 組織が既に存在する場合は無視
        console.log('組織は既に存在します');
      }
      
      // ユーザープロフィールを作成
      await FirestoreService.createUser({
        name: displayName,
        email: email,
        department: '未設定',
        position: '未設定',
        color: '#3b82f6'
      }, orgId, user.uid);
      
    } catch (error: any) {
      set({ error: error.message || 'アカウント作成に失敗しました' });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await AuthService.signOut();
    } catch (error: any) {
      set({ error: error.message || 'ログアウトに失敗しました' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Data loading
  loadEvents: async () => {
    const { organizationId } = get();
    if (!organizationId) return;
    
    try {
      const events = await FirestoreService.getEvents(organizationId);
      set({ events });
    } catch (error) {
      console.error('イベント読み込みエラー:', error);
    }
  },

  loadUsers: async () => {
    const { organizationId } = get();
    if (!organizationId) return;
    
    try {
      const users = await FirestoreService.getUsers(organizationId);
      set({ users });
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error);
    }
  },

  // Date navigation
  nextPeriod: () => {
    const { currentDate, viewMode } = get();
    let newDate: Date;
    
    switch (viewMode) {
      case 'month':
        newDate = addMonths(currentDate, 1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      default:
        newDate = addMonths(currentDate, 1);
    }
    
    set({ currentDate: newDate });
  },

  prevPeriod: () => {
    const { currentDate, viewMode } = get();
    let newDate: Date;
    
    switch (viewMode) {
      case 'month':
        newDate = addMonths(currentDate, -1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, -1);
        break;
      case 'day':
        newDate = addDays(currentDate, -1);
        break;
      default:
        newDate = addMonths(currentDate, -1);
    }
    
    set({ currentDate: newDate });
  },

  goToToday: () => {
    set({ currentDate: new Date() });
  },

  setCurrentDate: (date: Date) => {
    set({ currentDate: date });
  },

  // View mode
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  // Events
  addEvent: async (eventData) => {
    const { organizationId } = get();
    if (!organizationId) return;
    
    try {
      await FirestoreService.createEvent(eventData, organizationId);
      // リアルタイム監視により自動更新される
    } catch (error) {
      console.error('イベント作成エラー:', error);
      set({ error: 'イベントの作成に失敗しました' });
    }
  },

  updateEvent: async (id: string, eventData: Partial<CalendarEvent>) => {
    try {
      await FirestoreService.updateEvent(id, eventData);
      // リアルタイム監視により自動更新される
    } catch (error) {
      console.error('イベント更新エラー:', error);
      set({ error: 'イベントの更新に失敗しました' });
    }
  },

  deleteEvent: async (id: string) => {
    try {
      await FirestoreService.deleteEvent(id);
      // リアルタイム監視により自動更新される
    } catch (error) {
      console.error('イベント削除エラー:', error);
      set({ error: 'イベントの削除に失敗しました' });
    }
  },

  setSelectedEvent: (event?: CalendarEvent) => {
    set({ selectedEvent: event });
  },

  // Modals
  openEventModal: (event?: CalendarEvent) => {
    set({ 
      isEventModalOpen: true, 
      selectedEvent: event 
    });
  },

  closeEventModal: () => {
    set({ 
      isEventModalOpen: false, 
      selectedEvent: undefined 
    });
  },

  openUserModal: () => {
    set({ isUserModalOpen: true });
  },

  closeUserModal: () => {
    set({ isUserModalOpen: false });
  },

  // Users
  addUser: async (userData) => {
    const { organizationId, currentUser } = get();
    if (!organizationId || !currentUser) return;
    
    try {
      await FirestoreService.createUser(userData, organizationId, currentUser.uid);
      // リアルタイム監視により自動更新される
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      set({ error: 'ユーザーの作成に失敗しました' });
    }
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    try {
      await FirestoreService.updateUser(id, userData);
      // リアルタイム監視により自動更新される
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      set({ error: 'ユーザーの更新に失敗しました' });
    }
  },

  deleteUser: async (id: string) => {
    try {
      await FirestoreService.deleteUser(id);
      // リアルタイム監視により自動更新される
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      set({ error: 'ユーザーの削除に失敗しました' });
    }
  },

  // Filters
  toggleUserFilter: (userId: string) => {
    set((state) => ({
      filters: {
        ...state.filters,
        users: state.filters.users.includes(userId)
          ? state.filters.users.filter(id => id !== userId)
          : [...state.filters.users, userId]
      }
    }));
  },

  toggleCategoryFilter: (category: EventCategory) => {
    set((state) => ({
      filters: {
        ...state.filters,
        categories: state.filters.categories.includes(category)
          ? state.filters.categories.filter(cat => cat !== category)
          : [...state.filters.categories, category]
      }
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        users: [],
        categories: []
      }
    });
  },

  // Drag and drop
  moveEvent: async (eventId: string, newStartDate: Date, newEndDate: Date) => {
    try {
      await FirestoreService.updateEvent(eventId, {
        startDate: newStartDate,
        endDate: newEndDate
      });
      // リアルタイム監視により自動更新される
    } catch (error) {
      console.error('イベント移動エラー:', error);
      set({ error: 'イベントの移動に失敗しました' });
    }
  },

  // Privacy
  togglePrivacyMode: () => {
    set((state) => ({
      isPrivacyModeEnabled: !state.isPrivacyModeEnabled
    }));
  },

  getCurrentUserId: () => {
    const { currentUser, users } = get();
    if (!currentUser) {
      console.log('[Debug] getCurrentUserId: currentUser is null');
      return null;
    }
    console.log(`[Debug] getCurrentUserId: currentUser.email = ${currentUser.email}`);
    
    const user = users.find(u => u.email === currentUser.email);
    if (!user) {
      console.log(`[Debug] getCurrentUserId: User not found in store for email: ${currentUser.email}`);
      console.log('[Debug] getCurrentUserId: All users in store:', users.map(u => ({id: u.id, email: u.email, name: u.name })));
      return null;
    }
    
    console.log(`[Debug] getCurrentUserId: Found user ID: ${user.id} for email: ${user.email}`);
    return user.id; // Firestore Document ID
  },
})); 