# FirebaseAuthService (Firebase 認證服務整合)

## 概述
`FirebaseAuthService` 是一個封裝 Firebase Authentication 的 Angular 服務，提供完整的身份驗證功能，包括登入、登出、註冊、密碼重設、社交登入等。它整合了 Angular 的依賴注入和響應式程式設計模式，並提供 TypeScript 型別安全。

## 技術規格

### 依賴套件
```json
{
  "@angular/fire": "^18.0.0",
  "firebase": "^10.0.0"
}
```

### 環境配置
```typescript
// environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
  }
};
```

### 型別定義
```typescript
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  phoneNumber: string;
  customClaims: { [key: string]: any };
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
}

export interface SocialLoginProvider {
  provider: 'google' | 'facebook' | 'twitter' | 'github';
  scopes?: string[];
}
```

## Angular 實作

### FirebaseAuthService 服務
```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
         signOut, sendPasswordResetEmail, updateProfile, GoogleAuthProvider, 
         FacebookAuthProvider, TwitterAuthProvider, GithubAuthProvider,
         signInWithPopup, signInWithRedirect, getRedirectResult,
         onAuthStateChanged, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // 使用 Angular Signals 管理狀態
  private _user = signal<UserProfile | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // 公開的只讀 signals
  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 計算屬性
  readonly isAuthenticated = computed(() => !!this._user());
  readonly isEmailVerified = computed(() => this._user()?.emailVerified ?? false);

  // RxJS Observable 支援（向後相容）
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    loading: true,
    error: null
  });
  
  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.initializeAuthState();
  }

  // 初始化認證狀態監聽
  private initializeAuthState(): void {
    onAuthStateChanged(this.auth, async (user: User | null) => {
      this._loading.set(true);
      
      if (user) {
        try {
          const userProfile = await this.getUserProfile(user);
          this._user.set(userProfile);
          this.authStateSubject.next({
            user: userProfile,
            loading: false,
            error: null
          });
        } catch (error) {
          this._error.set('Failed to load user profile');
          this.authStateSubject.next({
            user: null,
            loading: false,
            error: 'Failed to load user profile'
          });
        }
      } else {
        this._user.set(null);
        this.authStateSubject.next({
          user: null,
          loading: false,
          error: null
        });
      }
      
      this._loading.set(false);
    });
  }

  // 電子郵件密碼登入
  async loginWithEmail(credentials: LoginCredentials): Promise<UserProfile> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      const userProfile = await this.getUserProfile(userCredential.user);
      await this.updateLastSignIn(userProfile.uid);
      
      return userProfile;
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 電子郵件密碼註冊
  async registerWithEmail(credentials: RegisterCredentials): Promise<UserProfile> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      // 更新用戶顯示名稱
      if (credentials.displayName) {
        await updateProfile(userCredential.user, {
          displayName: credentials.displayName
        });
      }

      // 創建用戶資料庫記錄
      const userProfile = await this.createUserProfile(userCredential.user, credentials);
      
      return userProfile;
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 社交登入
  async loginWithSocial(provider: SocialLoginProvider): Promise<UserProfile> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const authProvider = this.getAuthProvider(provider.provider, provider.scopes);
      const userCredential = await signInWithPopup(this.auth, authProvider);
      
      const userProfile = await this.getUserProfile(userCredential.user);
      await this.updateLastSignIn(userProfile.uid);
      
      return userProfile;
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 社交登入重定向
  async loginWithSocialRedirect(provider: SocialLoginProvider): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const authProvider = this.getAuthProvider(provider.provider, provider.scopes);
      await signInWithRedirect(this.auth, authProvider);
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // 處理重定向結果
  async handleRedirectResult(): Promise<UserProfile | null> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        const userProfile = await this.getUserProfile(result.user);
        await this.updateLastSignIn(userProfile.uid);
        return userProfile;
      }
      return null;
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // 登出
  async logout(): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      await signOut(this.auth);
      this._user.set(null);
      
      // 重定向到登入頁面
      this.router.navigate(['/auth/login']);
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 發送密碼重設郵件
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 更新用戶資料
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // 更新 Firebase Auth 資料
      if (updates.displayName || updates.photoURL) {
        await updateProfile(currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }

      // 更新 Firestore 用戶資料
      const userDocRef = doc(this.firestore, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date()
      });

      // 更新本地狀態
      const updatedProfile = await this.getUserProfile(currentUser);
      this._user.set(updatedProfile);
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 發送郵件驗證
  async sendEmailVerification(): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      await currentUser.sendEmailVerification();
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 重新載入用戶資料
  async reloadUser(): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      await currentUser.reload();
      const userProfile = await this.getUserProfile(currentUser);
      this._user.set(userProfile);
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // 獲取用戶資料
  private async getUserProfile(user: User): Promise<UserProfile> {
    const userDocRef = doc(this.firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || userData?.displayName || '',
        photoURL: user.photoURL || userData?.photoURL || '',
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber || '',
        customClaims: userData?.customClaims || {},
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime
        }
      };
    } else {
      // 如果 Firestore 中沒有用戶資料，創建一個
      return await this.createUserProfile(user);
    }
  }

  // 創建用戶資料
  private async createUserProfile(user: User, additionalData?: any): Promise<UserProfile> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || additionalData?.displayName || '',
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber || '',
      customClaims: {},
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }
    };

    const userDocRef = doc(this.firestore, 'users', user.uid);
    await setDoc(userDocRef, {
      ...userProfile,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return userProfile;
  }

  // 更新最後登入時間
  private async updateLastSignIn(uid: string): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', uid);
    await updateDoc(userDocRef, {
      lastSignInAt: new Date(),
      updatedAt: new Date()
    });
  }

  // 獲取認證提供者
  private getAuthProvider(provider: string, scopes?: string[]): any {
    switch (provider) {
      case 'google':
        const googleProvider = new GoogleAuthProvider();
        if (scopes) {
          scopes.forEach(scope => googleProvider.addScope(scope));
        }
        return googleProvider;
      
      case 'facebook':
        const facebookProvider = new FacebookAuthProvider();
        if (scopes) {
          scopes.forEach(scope => facebookProvider.addScope(scope));
        }
        return facebookProvider;
      
      case 'twitter':
        return new TwitterAuthProvider();
      
      case 'github':
        const githubProvider = new GithubAuthProvider();
        if (scopes) {
          scopes.forEach(scope => githubProvider.addScope(scope));
        }
        return githubProvider;
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // 獲取認證錯誤訊息
  private getAuthErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': '找不到此電子郵件對應的帳戶',
      'auth/wrong-password': '密碼錯誤',
      'auth/email-already-in-use': '此電子郵件已被使用',
      'auth/weak-password': '密碼強度不足',
      'auth/invalid-email': '電子郵件格式無效',
      'auth/user-disabled': '此帳戶已被停用',
      'auth/too-many-requests': '嘗試次數過多，請稍後再試',
      'auth/network-request-failed': '網路連線失敗',
      'auth/invalid-credential': '認證資訊無效',
      'auth/popup-closed-by-user': '登入視窗被用戶關閉',
      'auth/cancelled-popup-request': '登入請求被取消',
      'auth/popup-blocked': '登入視窗被瀏覽器阻擋',
      'auth/account-exists-with-different-credential': '此電子郵件已使用其他方式註冊',
      'auth/requires-recent-login': '需要重新登入以執行此操作'
    };

    return errorMessages[errorCode] || '認證失敗，請稍後再試';
  }

  // 清除錯誤訊息
  clearError(): void {
    this._error.set(null);
  }

  // RxJS 相容方法
  loginWithEmail$(credentials: LoginCredentials): Observable<UserProfile> {
    return from(this.loginWithEmail(credentials));
  }

  registerWithEmail$(credentials: RegisterCredentials): Observable<UserProfile> {
    return from(this.registerWithEmail(credentials));
  }

  logout$(): Observable<void> {
    return from(this.logout());
  }
}
```

### 認證守衛
```typescript
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { FirebaseAuthService } from '@shared/services/FirebaseAuthService';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        if (authState.user) {
          return true;
        } else {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      })
    );
  }
}
```

### 認證元件範例
```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseAuthService, LoginCredentials, RegisterCredentials } from '@shared/services/FirebaseAuthService';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>{{ isLoginMode() ? '登入' : '註冊' }}</h2>
        
        <form (ngSubmit)="onSubmit()" #authForm="ngForm">
          <div class="form-group">
            <label for="email">電子郵件</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="credentials.email"
              required
              email
              #emailInput="ngModel"
              class="form-control"
              [class.is-invalid]="emailInput.invalid && emailInput.touched"
            />
            <div *ngIf="emailInput.invalid && emailInput.touched" class="invalid-feedback">
              <div *ngIf="emailInput.errors?.['required']">電子郵件為必填項目</div>
              <div *ngIf="emailInput.errors?.['email']">請輸入有效的電子郵件</div>
            </div>
          </div>

          <div class="form-group">
            <label for="password">密碼</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="credentials.password"
              required
              minlength="6"
              #passwordInput="ngModel"
              class="form-control"
              [class.is-invalid]="passwordInput.invalid && passwordInput.touched"
            />
            <div *ngIf="passwordInput.invalid && passwordInput.touched" class="invalid-feedback">
              <div *ngIf="passwordInput.errors?.['required']">密碼為必填項目</div>
              <div *ngIf="passwordInput.errors?.['minlength']">密碼至少需要 6 個字元</div>
            </div>
          </div>

          <div *ngIf="!isLoginMode()" class="form-group">
            <label for="displayName">顯示名稱</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              [(ngModel)]="credentials.displayName"
              class="form-control"
            />
          </div>

          <div *ngIf="authService.error()" class="alert alert-danger">
            {{ authService.error() }}
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="authForm.invalid || authService.loading()"
          >
            <span *ngIf="authService.loading()" class="spinner-border spinner-border-sm me-2"></span>
            {{ isLoginMode() ? '登入' : '註冊' }}
          </button>
        </form>

        <div class="auth-actions">
          <button
            type="button"
            class="btn btn-link"
            (click)="toggleMode()"
          >
            {{ isLoginMode() ? '還沒有帳戶？立即註冊' : '已有帳戶？立即登入' }}
          </button>
          
          <button
            *ngIf="isLoginMode()"
            type="button"
            class="btn btn-link"
            (click)="resetPassword()"
          >
            忘記密碼？
          </button>
        </div>

        <div class="social-login">
          <h3>或使用以下方式登入</h3>
          <div class="social-buttons">
            <button
              type="button"
              class="btn btn-outline-primary"
              (click)="loginWithGoogle()"
              [disabled]="authService.loading()"
            >
              <i class="fab fa-google"></i> Google
            </button>
            <button
              type="button"
              class="btn btn-outline-primary"
              (click)="loginWithFacebook()"
              [disabled]="authService.loading()"
            >
              <i class="fab fa-facebook"></i> Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .auth-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .form-control.is-invalid {
      border-color: #dc3545;
    }
    
    .invalid-feedback {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
    
    .btn-link {
      background: none;
      color: #007bff;
      text-decoration: underline;
    }
    
    .btn-outline-primary {
      background: none;
      color: #007bff;
      border: 1px solid #007bff;
    }
    
    .auth-actions {
      margin-top: 1rem;
      text-align: center;
    }
    
    .social-login {
      margin-top: 2rem;
      text-align: center;
    }
    
    .social-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 1rem;
    }
    
    .alert {
      padding: 0.75rem;
      margin-bottom: 1rem;
      border: 1px solid transparent;
      border-radius: 4px;
    }
    
    .alert-danger {
      color: #721c24;
      background-color: #f8d7da;
      border-color: #f5c6cb;
    }
    
    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }
  `]
})
export class AuthComponent {
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);

  isLoginMode = signal(true);
  credentials = signal<LoginCredentials | RegisterCredentials>({
    email: '',
    password: '',
    displayName: ''
  });

  toggleMode(): void {
    this.isLoginMode.set(!this.isLoginMode());
    this.credentials.set({
      email: '',
      password: '',
      displayName: ''
    });
    this.authService.clearError();
  }

  async onSubmit(): Promise<void> {
    if (this.isLoginMode()) {
      try {
        await this.authService.loginWithEmail(this.credentials() as LoginCredentials);
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Login failed:', error);
      }
    } else {
      try {
        await this.authService.registerWithEmail(this.credentials() as RegisterCredentials);
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Registration failed:', error);
      }
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      await this.authService.loginWithSocial({ provider: 'google' });
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }

  async loginWithFacebook(): Promise<void> {
    try {
      await this.authService.loginWithSocial({ provider: 'facebook' });
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Facebook login failed:', error);
    }
  }

  async resetPassword(): Promise<void> {
    const email = this.credentials().email;
    if (!email) {
      alert('請先輸入電子郵件');
      return;
    }

    try {
      await this.authService.sendPasswordResetEmail(email);
      alert('密碼重設郵件已發送');
    } catch (error) {
      console.error('Password reset failed:', error);
    }
  }
}
```

## AI Agent 友好特性

### 1. 完整的型別安全
- 所有方法都有完整的 TypeScript 型別定義
- 提供介面和型別別名
- 編譯時錯誤檢查

### 2. 響應式狀態管理
- 使用 Angular Signals 提供響應式狀態
- 支援 RxJS Observable 向後相容
- 自動狀態同步

### 3. 錯誤處理
- 完整的錯誤訊息本地化
- 統一的錯誤處理機制
- 用戶友好的錯誤提示

### 4. 安全性
- 整合 Firebase Security Rules
- 支援自定義 Claims
- 自動會話管理

## 相關檔案
- `FirebaseFirestoreService.md` - Firestore 資料庫服務
- `FirebaseStorageService.md` - Firebase 儲存服務
- `FirebaseMessagingService.md` - Firebase 推播服務
- `Security Strategy.md` - 安全策略
