import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CalendarEvent, User } from '../types';

// Firestore用の型定義
export interface FirestoreEvent extends Omit<CalendarEvent, 'id' | 'startDate' | 'endDate'> {
  startDate: Timestamp;
  endDate: Timestamp;
  organizationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreUser extends Omit<User, 'id'> {
  organizationId: string;
  authId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class FirestoreService {
  // ========================
  // イベント関連
  // ========================

  // イベント一覧取得
  static async getEvents(organizationId: string): Promise<CalendarEvent[]> {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('organizationId', '==', organizationId)
      );
      
      const querySnapshot = await getDocs(q);
      const events: CalendarEvent[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreEvent;
        events.push({
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate()
        });
      });
      
      events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      
      return events;
    } catch (error) {
      console.error('イベント取得エラー:', error);
      throw error;
    }
  }

  // イベント作成
  static async createEvent(eventData: Omit<CalendarEvent, 'id'>, organizationId: string): Promise<string> {
    try {
      const eventsRef = collection(db, 'events');
      const firestoreEvent: Omit<FirestoreEvent, keyof any> = {
        ...eventData,
        startDate: Timestamp.fromDate(eventData.startDate),
        endDate: Timestamp.fromDate(eventData.endDate),
        organizationId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      const docRef = await addDoc(eventsRef, firestoreEvent);
      return docRef.id;
    } catch (error) {
      console.error('イベント作成エラー:', error);
      throw error;
    }
  }

  // イベント更新
  static async updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<void> {
    try {
      const eventRef = doc(db, 'events', eventId);
      const updateData: any = {
        ...eventData,
        updatedAt: serverTimestamp()
      };
      
      if (eventData.startDate) {
        updateData.startDate = Timestamp.fromDate(eventData.startDate);
      }
      if (eventData.endDate) {
        updateData.endDate = Timestamp.fromDate(eventData.endDate);
      }
      
      await updateDoc(eventRef, updateData);
    } catch (error) {
      console.error('イベント更新エラー:', error);
      throw error;
    }
  }

  // イベント削除
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error('イベント削除エラー:', error);
      throw error;
    }
  }

  // イベントのリアルタイム監視
  static subscribeToEvents(
    organizationId: string,
    callback: (events: CalendarEvent[]) => void
  ): () => void {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('organizationId', '==', organizationId)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const events: CalendarEvent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreEvent;
        events.push({
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate()
        });
      });
      
      events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      
      callback(events);
    });
  }

  // ========================
  // ユーザー関連
  // ========================

  // ユーザー一覧取得
  static async getUsers(organizationId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('organizationId', '==', organizationId));
      
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreUser;
        users.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          department: data.department,
          position: data.position,
          color: data.color
        });
      });
      
      return users;
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      throw error;
    }
  }

  // ユーザー作成
  static async createUser(userData: Omit<User, 'id'>, organizationId: string, authId: string): Promise<string> {
    try {
      const usersRef = collection(db, 'users');
      const firestoreUser: Omit<FirestoreUser, keyof any> = {
        ...userData,
        organizationId,
        authId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      const docRef = await addDoc(usersRef, firestoreUser);
      return docRef.id;
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      throw error;
    }
  }

  // ユーザー更新
  static async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      throw error;
    }
  }

  // ユーザー削除
  static async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      throw error;
    }
  }

  // 認証IDからユーザー取得
  static async getUserByAuthId(authId: string): Promise<User | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('authId', '==', authId));
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data() as FirestoreUser;
      
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        department: data.department,
        position: data.position,
        color: data.color
      };
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      throw error;
    }
  }

  // ユーザーのリアルタイム監視
  static subscribeToUsers(
    organizationId: string,
    callback: (users: User[]) => void
  ): () => void {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('organizationId', '==', organizationId));
    
    return onSnapshot(q, (querySnapshot) => {
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreUser;
        users.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          department: data.department,
          position: data.position,
          color: data.color
        });
      });
      callback(users);
    });
  }

  // ========================
  // 組織関連
  // ========================

  // 組織作成（簡易版）
  static async createOrganization(name: string, ownerAuthId: string): Promise<string> {
    try {
      const orgsRef = collection(db, 'organizations');
      const orgData = {
        name,
        ownerAuthId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(orgsRef, orgData);
      return docRef.id;
    } catch (error) {
      console.error('組織作成エラー:', error);
      throw error;
    }
  }
} 