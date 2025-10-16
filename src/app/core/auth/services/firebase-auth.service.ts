/**
 * Firebase 認證服務
 * 整合 Firebase Auth 與 @delon/auth
 */

import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onIdTokenChanged,
  User
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
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

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: any;
  updatedAt: any;
  lastLoginAt?: any;
  organizations: Record<string, { role: string; joinedAt: any }>;
  projects: Record<string, { role: string; assignedAt: any }>;
  preferences: {
    language: string;
    timezone: string;
    notifications: { email: boolean; push: boolean };
  };
  status: 'active' | 'suspended' | 'pending';
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
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
      // 寄送驗證信（非必要可移除）
      try {
        await sendEmailVerification(userCredential.user);
      } catch {}
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

      // 確保 Firestore 用戶檔案存在並更新
      await this.ensureUserProfile(user);

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
      await this.setUserACLFromProfile(user);
    } catch (error) {
      console.error('Sync with Delon Auth error:', error);
    }
  }

  /**
   * 確保 Firestore 用戶檔案存在，不存在則建立
   */
  private async ensureUserProfile(user: User): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // 建立新用戶檔案
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        organizations: {},
        projects: {},
        preferences: {
          language: 'zh-TW',
          timezone: 'Asia/Taipei',
          notifications: { email: true, push: true }
        },
        status: 'active'
      };
      await setDoc(userDocRef, newProfile);
    } else {
      // 更新最後登入時間
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  /**
   * 從 Firestore 用戶檔案設定 ACL 權限
   */
  private async setUserACLFromProfile(user: User): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;

        // 根據組織角色設定權限
        const roles: string[] = [];
        const abilities: string[] = [];

        // 基本權限
        if (user.emailVerified) {
          roles.push('verified-user');
          abilities.push('read', 'write');
        } else {
          roles.push('unverified-user');
          abilities.push('read');
        }

        // 組織權限
        Object.values(profile.organizations || {}).forEach(org => {
          roles.push(`org-${org.role}`);
          if (org.role === 'owner' || org.role === 'admin') {
            abilities.push('admin', 'manage-users');
          }
        });

        // 專案權限
        Object.values(profile.projects || {}).forEach(project => {
          roles.push(`project-${project.role}`);
          if (project.role === 'manager') {
            abilities.push('manage-projects');
          }
        });

        this.aclService.setRole(roles);
        this.aclService.setAbility(abilities);
      } else {
        // 預設權限
        this.setUserACL(user);
      }
    } catch (error) {
      console.error('Set ACL from profile error:', error);
      // 回退到基本權限
      this.setUserACL(user);
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
