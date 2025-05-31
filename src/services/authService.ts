import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export class AuthService {
  // ユーザー登録
  static async signUp(email: string, password: string, displayName: string): Promise<AuthUser> {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // プロフィール更新
      await updateProfile(user, { displayName });
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: displayName
      };
    } catch (error) {
      console.error('サインアップエラー:', error);
      throw error;
    }
  }

  // ログイン
  static async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      };
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    }
  }

  // ログアウト
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  }

  // 認証状態監視
  static onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      } else {
        callback(null);
      }
    });
  }

  // 現在のユーザー取得
  static getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      };
    }
    return null;
  }
} 