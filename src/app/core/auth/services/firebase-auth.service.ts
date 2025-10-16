/**
 * Firebase 認證服務
 * 整合 Firebase Auth 與 @delon/auth
 */

import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onIdTokenChanged, User } from '@angular/fire/auth';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { ACLService } from '@delon/acl';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private auth = inject(Auth);
  private tokenService = inject(DA_SERVICE_TOKEN);
  private aclService = inject(ACLService);

  private userSubject = new BehaviorSubject<FirebaseUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    // 監聽 Firebase ID Token 變化（包含登入、登出與 token 旋轉）
    onIdTokenChanged(this.auth, user => {
      if (user) {
        const firebaseUser: FirebaseUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        this.userSubject.next(firebaseUser);
        this.syncWithDelonAuth(user);
      } else {
        this.userSubject.next(null);
        this.tokenService.clear();
      }
    });
  }

  /**
   * Firebase 登入
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.syncWithDelonAuth(userCredential.user);
    } catch (error) {
      console.error('Firebase login error:', error);
      throw error;
    }
  }

  /**
   * Firebase 註冊
   */
  async register(email: string, password: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.syncWithDelonAuth(userCredential.user);
    } catch (error) {
      console.error('Firebase register error:', error);
      throw error;
    }
  }

  /**
   * Firebase 登出
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.tokenService.clear();
      this.aclService.setFull(false);
    } catch (error) {
      console.error('Firebase logout error:', error);
      throw error;
    }
  }

  /**
   * 獲取當前用戶
   */
  getCurrentUser(): FirebaseUser | null {
    return this.userSubject.value;
  }

  /**
   * 檢查是否已登入
   */
  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  /**
   * 同步 Firebase 用戶資料到 @delon/auth
   */
  private async syncWithDelonAuth(user: User): Promise<void> {
    try {
      const token = await user.getIdToken();

      // 設定 @delon/auth token
      this.tokenService.set({
        token,
        name: user.displayName || user.email || 'Unknown',
        email: user.email || '',
        id: user.uid,
        avatar: user.photoURL || '',
        time: +new Date()
      });

      // 設定 ACL 權限
      this.setUserACL(user);
    } catch (error) {
      console.error('Sync with Delon Auth error:', error);
    }
  }

  /**
   * 設定用戶 ACL 權限
   */
  private setUserACL(user: User): void {
    // 暫時設為全權限，後續可根據業務需求調整
    this.aclService.setFull(true);

    // 可以根據用戶角色設定特定權限
    // this.aclService.setRole(['user']);
    // this.aclService.setAbility(['read', 'write']);
  }
}
