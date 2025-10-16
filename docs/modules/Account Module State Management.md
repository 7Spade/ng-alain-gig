# Account Module State Management (帳戶模組狀態管理)

## 狀態管理概述

Account Module State Management 定義了帳戶模組的狀態管理架構，採用 Angular Signals 和 RxJS 的混合模式，提供響應式的狀態管理解決方案。本狀態管理系統涵蓋用戶認證、個人檔案、社交功能、成就系統、通知管理等所有帳戶相關的狀態。

## 狀態管理架構

```typescript
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, distinctUntilChanged } from 'rxjs';
import { UserService } from '../services/user.service';
import { NotificationService } from '../services/notification.service';
import { AchievementService } from '../services/achievement.service';

@Injectable({
  providedIn: 'root'
})
export class AccountStateService {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private achievementService = inject(AchievementService);
  
  // Signals for reactive state
  private _currentUser = signal<UserEntity | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  private _userProfile = signal<UserProfile | null>(null);
  private _notifications = signal<NotificationEntity[]>([]);
  private _achievements = signal<AchievementEntity[]>([]);
  private _socialConnections = signal<SocialConnection[]>([]);
  
  // Computed signals
  public readonly currentUser = computed(() => this._currentUser());
  public readonly isAuthenticated = computed(() => this._isAuthenticated());
  public readonly userProfile = computed(() => this._userProfile());
  public readonly notifications = computed(() => this._notifications());
  public readonly achievements = computed(() => this._achievements());
  public readonly socialConnections = computed(() => this._socialConnections());
  
  // Computed derived state
  public readonly unreadNotificationCount = computed(() => 
    this.notifications().filter(n => !n.readAt).length
  );
  
  public readonly achievementProgress = computed(() => {
    const achievements = this.achievements();
    const total = achievements.length;
    const completed = achievements.filter(a => a.status === 'COMPLETED').length;
    return total > 0 ? (completed / total) * 100 : 0;
  });
  
  public readonly socialStats = computed(() => {
    const connections = this.socialConnections();
    return {
      following: connections.filter(c => c.type === 'FOLLOWING').length,
      followers: connections.filter(c => c.type === 'FOLLOWER').length,
      starredProjects: connections.filter(c => c.type === 'STARRED_PROJECT').length
    };
  });
  
  constructor() {
    this.initializeState();
    this.setupEffects();
  }
  
  private initializeState(): void {
    // 初始化狀態
    this.loadInitialState();
  }
  
  private setupEffects(): void {
    // 設置副作用
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.loadUserRelatedData(user.id);
      }
    });
  }
}
```

## 認證狀態管理

### 1. 認證狀態

```typescript
export interface AuthState {
  isAuthenticated: boolean;
  currentUser: UserEntity | null;
  token: string | null;
  refreshToken: string | null;
  loginTime: Date | null;
  lastActivity: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private _authState = signal<AuthState>({
    isAuthenticated: false,
    currentUser: null,
    token: null,
    refreshToken: null,
    loginTime: null,
    lastActivity: null
  });
  
  // 公開的 computed signals
  public readonly authState = computed(() => this._authState());
  public readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  public readonly currentUser = computed(() => this.authState().currentUser);
  public readonly token = computed(() => this.authState().token);
  
  // 認證操作
  login(credentials: LoginCredentials): Observable<AuthState> {
    return this.authService.login(credentials).pipe(
      map(authResult => {
        const newState: AuthState = {
          isAuthenticated: true,
          currentUser: authResult.user,
          token: authResult.token,
          refreshToken: authResult.refreshToken,
          loginTime: new Date(),
          lastActivity: new Date()
        };
        
        this._authState.set(newState);
        this.saveAuthStateToStorage(newState);
        
        return newState;
      })
    );
  }
  
  logout(): void {
    const newState: AuthState = {
      isAuthenticated: false,
      currentUser: null,
      token: null,
      refreshToken: null,
      loginTime: null,
      lastActivity: null
    };
    
    this._authState.set(newState);
    this.clearAuthStateFromStorage();
  }
  
  refreshToken(): Observable<AuthState> {
    return this.authService.refreshToken(this.authState().refreshToken!).pipe(
      map(authResult => {
        const newState: AuthState = {
          ...this.authState(),
          token: authResult.token,
          refreshToken: authResult.refreshToken,
          lastActivity: new Date()
        };
        
        this._authState.set(newState);
        this.saveAuthStateToStorage(newState);
        
        return newState;
      })
    );
  }
  
  updateLastActivity(): void {
    const newState: AuthState = {
      ...this.authState(),
      lastActivity: new Date()
    };
    
    this._authState.set(newState);
  }
  
  private saveAuthStateToStorage(state: AuthState): void {
    localStorage.setItem('auth_state', JSON.stringify(state));
  }
  
  private clearAuthStateFromStorage(): void {
    localStorage.removeItem('auth_state');
  }
  
  private loadAuthStateFromStorage(): AuthState | null {
    const stored = localStorage.getItem('auth_state');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('載入認證狀態失敗:', error);
        return null;
      }
    }
    return null;
  }
}
```

### 2. 用戶狀態管理

```typescript
export interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  professionalInfo: ProfessionalInfo | null;
  licenses: ProfessionalLicense[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private _userState = signal<UserState>({
    profile: null,
    preferences: null,
    professionalInfo: null,
    licenses: [],
    isLoading: false,
    error: null
  });
  
  // 公開的 computed signals
  public readonly userState = computed(() => this._userState());
  public readonly profile = computed(() => this.userState().profile);
  public readonly preferences = computed(() => this.userState().preferences);
  public readonly professionalInfo = computed(() => this.userState().professionalInfo);
  public readonly licenses = computed(() => this.userState().licenses);
  public readonly isLoading = computed(() => this.userState().isLoading);
  public readonly error = computed(() => this.userState().error);
  
  // 用戶操作
  loadUserProfile(userId: string): Observable<UserProfile> {
    this.setLoading(true);
    
    return this.userService.getUserProfile(userId).pipe(
      map(profile => {
        this.updateUserState({ profile });
        this.setLoading(false);
        return profile;
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        throw error;
      })
    );
  }
  
  updateUserProfile(updates: Partial<UserProfile>): Observable<UserProfile> {
    this.setLoading(true);
    
    return this.userService.updateUserProfile(updates).pipe(
      map(updatedProfile => {
        this.updateUserState({ profile: updatedProfile });
        this.setLoading(false);
        return updatedProfile;
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        throw error;
      })
    );
  }
  
  updatePreferences(preferences: UserPreferences): Observable<UserPreferences> {
    this.setLoading(true);
    
    return this.userService.updatePreferences(preferences).pipe(
      map(updatedPreferences => {
        this.updateUserState({ preferences: updatedPreferences });
        this.setLoading(false);
        return updatedPreferences;
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        throw error;
      })
    );
  }
  
  addLicense(license: ProfessionalLicense): Observable<ProfessionalLicense[]> {
    this.setLoading(true);
    
    return this.userService.addLicense(license).pipe(
      map(updatedLicenses => {
        this.updateUserState({ licenses: updatedLicenses });
        this.setLoading(false);
        return updatedLicenses;
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        throw error;
      })
    );
  }
  
  private updateUserState(updates: Partial<UserState>): void {
    this._userState.update(current => ({ ...current, ...updates }));
  }
  
  private setLoading(loading: boolean): void {
    this.updateUserState({ isLoading: loading });
  }
  
  private setError(error: string | null): void {
    this.updateUserState({ error });
  }
}
```

## 通知狀態管理

### 1. 通知狀態

```typescript
export interface NotificationState {
  notifications: NotificationEntity[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationStateService {
  private _notificationState = signal<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    lastFetchTime: null
  });
  
  // 公開的 computed signals
  public readonly notificationState = computed(() => this._notificationState());
  public readonly notifications = computed(() => this.notificationState().notifications);
  public readonly unreadCount = computed(() => this.notificationState().unreadCount);
  public readonly isLoading = computed(() => this.notificationState().isLoading);
  public readonly error = computed(() => this.notificationState().error);
  
  // 通知操作
  loadNotifications(): Observable<NotificationEntity[]> {
    this.setLoading(true);
    
    return this.notificationService.getUserNotifications().pipe(
      map(notifications => {
        this.updateNotificationState({
          notifications,
          unreadCount: notifications.filter(n => !n.readAt).length,
          lastFetchTime: new Date()
        });
        this.setLoading(false);
        return notifications;
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        throw error;
      })
    );
  }
  
  markAsRead(notificationId: string): Observable<NotificationEntity> {
    return this.notificationService.markAsRead(notificationId).pipe(
      map(updatedNotification => {
        this.updateNotifications(notifications => 
          notifications.map(n => 
            n.id === notificationId ? updatedNotification : n
          )
        );
        this.updateUnreadCount();
        return updatedNotification;
      })
    );
  }
  
  markAllAsRead(): Observable<void> {
    const unreadIds = this.notifications()
      .filter(n => !n.readAt)
      .map(n => n.id);
    
    return this.notificationService.batchMarkAsRead(unreadIds).pipe(
      map(() => {
        this.updateNotifications(notifications => 
          notifications.map(n => ({
            ...n,
            readAt: n.readAt || new Date(),
            status: 'READ'
          }))
        );
        this.updateUnreadCount();
      })
    );
  }
  
  addNotification(notification: NotificationEntity): void {
    this.updateNotifications(notifications => [notification, ...notifications]);
    this.updateUnreadCount();
  }
  
  removeNotification(notificationId: string): void {
    this.updateNotifications(notifications => 
      notifications.filter(n => n.id !== notificationId)
    );
    this.updateUnreadCount();
  }
  
  private updateNotificationState(updates: Partial<NotificationState>): void {
    this._notificationState.update(current => ({ ...current, ...updates }));
  }
  
  private updateNotifications(updater: (notifications: NotificationEntity[]) => NotificationEntity[]): void {
    this.updateNotificationState({
      notifications: updater(this.notifications())
    });
  }
  
  private updateUnreadCount(): void {
    const unreadCount = this.notifications().filter(n => !n.readAt).length;
    this.updateNotificationState({ unreadCount });
  }
  
  private setLoading(loading: boolean): void {
    this.updateNotificationState({ isLoading: loading });
  }
  
  private setError(error: string | null): void {
    this.updateNotificationState({ error });
  }
}
```

## 成就狀態管理

### 1. 成就狀態

```typescript
export interface AchievementState {
  achievements: AchievementEntity[];
  unlockedAchievements: AchievementEntity[];
  inProgressAchievements: AchievementEntity[];
  totalPoints: number;
  currentLevel: number;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementStateService {
  private _achievementState = signal<AchievementState>({
    achievements: [],
    unlockedAchievements: [],
    inProgressAchievements: [],
    totalPoints: 0,
    currentLevel: 1,
    isLoading: false,
    error: null
  });
  
  // 公開的 computed signals
  public readonly achievementState = computed(() => this._achievementState());
  public readonly achievements = computed(() => this.achievementState().achievements);
  public readonly unlockedAchievements = computed(() => this.achievementState().unlockedAchievements);
  public readonly inProgressAchievements = computed(() => this.achievementState().inProgressAchievements);
  public readonly totalPoints = computed(() => this.achievementState().totalPoints);
  public readonly currentLevel = computed(() => this.achievementState().currentLevel);
  public readonly isLoading = computed(() => this.achievementState().isLoading);
  public readonly error = computed(() => this.achievementState().error);
  
  // 成就操作
  loadAchievements(): Observable<AchievementEntity[]> {
    this.setLoading(true);
    
    return this.achievementService.getUserAchievements().pipe(
      map(achievements => {
        const unlockedAchievements = achievements.filter(a => a.status === 'UNLOCKED');
        const inProgressAchievements = achievements.filter(a => a.status === 'IN_PROGRESS');
        const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
        const currentLevel = this.calculateLevel(totalPoints);
        
        this.updateAchievementState({
          achievements,
          unlockedAchievements,
          inProgressAchievements,
          totalPoints,
          currentLevel,
          lastFetchTime: new Date()
        });
        this.setLoading(false);
        return achievements;
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        throw error;
      })
    );
  }
  
  unlockAchievement(achievementId: string): Observable<AchievementEntity> {
    return this.achievementService.unlockAchievement(achievementId).pipe(
      map(unlockedAchievement => {
        this.updateAchievements(achievements => 
          achievements.map(a => 
            a.id === achievementId ? unlockedAchievement : a
          )
        );
        this.updateUnlockedAchievements();
        this.updateTotalPoints();
        return unlockedAchievement;
      })
    );
  }
  
  updateAchievementProgress(achievementId: string, progress: number): void {
    this.updateAchievements(achievements => 
      achievements.map(a => 
        a.id === achievementId ? { ...a, progress } : a
      )
    );
    this.updateInProgressAchievements();
  }
  
  private updateAchievementState(updates: Partial<AchievementState>): void {
    this._achievementState.update(current => ({ ...current, ...updates }));
  }
  
  private updateAchievements(updater: (achievements: AchievementEntity[]) => AchievementEntity[]): void {
    this.updateAchievementState({
      achievements: updater(this.achievements())
    });
  }
  
  private updateUnlockedAchievements(): void {
    const unlockedAchievements = this.achievements().filter(a => a.status === 'UNLOCKED');
    this.updateAchievementState({ unlockedAchievements });
  }
  
  private updateInProgressAchievements(): void {
    const inProgressAchievements = this.achievements().filter(a => a.status === 'IN_PROGRESS');
    this.updateAchievementState({ inProgressAchievements });
  }
  
  private updateTotalPoints(): void {
    const totalPoints = this.unlockedAchievements().reduce((sum, a) => sum + a.points, 0);
    const currentLevel = this.calculateLevel(totalPoints);
    this.updateAchievementState({ totalPoints, currentLevel });
  }
  
  private calculateLevel(points: number): number {
    // 每 1000 點升一級
    return Math.floor(points / 1000) + 1;
  }
  
  private setLoading(loading: boolean): void {
    this.updateAchievementState({ isLoading: loading });
  }
  
  private setError(error: string | null): void {
    this.updateAchievementState({ error });
  }
}
```

## 社交狀態管理

### 1. 社交狀態

```typescript
export interface SocialState {
  following: UserEntity[];
  followers: UserEntity[];
  starredProjects: ProjectEntity[];
  socialConnections: SocialConnection[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SocialStateService {
  private _socialState = signal<SocialState>({
    following: [],
    followers: [],
    starredProjects: [],
    socialConnections: [],
    isLoading: false,
    error: null
  });
  
  // 公開的 computed signals
  public readonly socialState = computed(() => this._socialState());
  public readonly following = computed(() => this.socialState().following);
  public readonly followers = computed(() => this.socialState().followers);
  public readonly starredProjects = computed(() => this.socialState().starredProjects);
  public readonly socialConnections = computed(() => this.socialState().socialConnections);
  public readonly isLoading = computed(() => this.socialState().isLoading);
  public readonly error = computed(() => this.socialState().error);
  
  // 社交操作
  loadSocialConnections(): Observable<SocialConnection[]> {
    this.setLoading(true);
    
    return this.socialService.getSocialConnections().pipe(
      map(connections => {
        this.updateSocialState({ socialConnections: connections });
        this.setLoading(false);
        return connections;
      }),
      catchError(error => {
        this.setError(error.message);
        this.setLoading(false);
        throw error;
      })
    );
  }
  
  followUser(userId: string): Observable<SocialConnection> {
    return this.socialService.followUser(userId).pipe(
      map(connection => {
        this.updateSocialConnections(connections => [connection, ...connections]);
        return connection;
      })
    );
  }
  
  unfollowUser(userId: string): Observable<void> {
    return this.socialService.unfollowUser(userId).pipe(
      map(() => {
        this.updateSocialConnections(connections => 
          connections.filter(c => c.targetUserId !== userId)
        );
      })
    );
  }
  
  starProject(projectId: string): Observable<SocialConnection> {
    return this.socialService.starProject(projectId).pipe(
      map(connection => {
        this.updateSocialConnections(connections => [connection, ...connections]);
        return connection;
      })
    );
  }
  
  unstarProject(projectId: string): Observable<void> {
    return this.socialService.unstarProject(projectId).pipe(
      map(() => {
        this.updateSocialConnections(connections => 
          connections.filter(c => c.targetProjectId !== projectId)
        );
      })
    );
  }
  
  private updateSocialState(updates: Partial<SocialState>): void {
    this._socialState.update(current => ({ ...current, ...updates }));
  }
  
  private updateSocialConnections(updater: (connections: SocialConnection[]) => SocialConnection[]): void {
    this.updateSocialState({
      socialConnections: updater(this.socialConnections())
    });
  }
  
  private setLoading(loading: boolean): void {
    this.updateSocialState({ isLoading: loading });
  }
  
  private setError(error: string | null): void {
    this.updateSocialState({ error });
  }
}
```

## 狀態持久化

### 1. 狀態持久化服務

```typescript
@Injectable({
  providedIn: 'root'
})
export class StatePersistenceService {
  private readonly STORAGE_KEY = 'account_state';
  
  saveState(state: any): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('保存狀態失敗:', error);
    }
  }
  
  loadState(): any | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('載入狀態失敗:', error);
      return null;
    }
  }
  
  clearState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('清除狀態失敗:', error);
    }
  }
}
```

### 2. 狀態同步

```typescript
@Injectable({
  providedIn: 'root'
})
export class StateSyncService {
  private persistenceService = inject(StatePersistenceService);
  
  constructor() {
    this.setupStateSync();
  }
  
  private setupStateSync(): void {
    // 監聽狀態變更並同步到本地儲存
    effect(() => {
      const authState = this.authStateService.authState();
      const userState = this.userStateService.userState();
      const notificationState = this.notificationStateService.notificationState();
      
      const state = {
        auth: authState,
        user: userState,
        notifications: notificationState,
        timestamp: new Date()
      };
      
      this.persistenceService.saveState(state);
    });
  }
  
  restoreState(): void {
    const savedState = this.persistenceService.loadState();
    
    if (savedState) {
      // 恢復認證狀態
      if (savedState.auth) {
        this.authStateService.restoreState(savedState.auth);
      }
      
      // 恢復用戶狀態
      if (savedState.user) {
        this.userStateService.restoreState(savedState.user);
      }
      
      // 恢復通知狀態
      if (savedState.notifications) {
        this.notificationStateService.restoreState(savedState.notifications);
      }
    }
  }
}
```

## 狀態管理整合

### 1. 主狀態服務

```typescript
@Injectable({
  providedIn: 'root'
})
export class AccountStateManager {
  private authStateService = inject(AuthStateService);
  private userStateService = inject(UserStateService);
  private notificationStateService = inject(NotificationStateService);
  private achievementStateService = inject(AchievementStateService);
  private socialStateService = inject(SocialStateService);
  private stateSyncService = inject(StateSyncService);
  
  constructor() {
    this.initializeStateManager();
  }
  
  private initializeStateManager(): void {
    // 恢復保存的狀態
    this.stateSyncService.restoreState();
    
    // 監聽認證狀態變更
    effect(() => {
      const isAuthenticated = this.authStateService.isAuthenticated();
      const currentUser = this.authStateService.currentUser();
      
      if (isAuthenticated && currentUser) {
        // 載入用戶相關資料
        this.loadUserData(currentUser.id);
      } else {
        // 清除用戶資料
        this.clearUserData();
      }
    });
  }
  
  private loadUserData(userId: string): void {
    // 並行載入所有用戶資料
    forkJoin({
      profile: this.userStateService.loadUserProfile(userId),
      notifications: this.notificationStateService.loadNotifications(),
      achievements: this.achievementStateService.loadAchievements(),
      socialConnections: this.socialStateService.loadSocialConnections()
    }).subscribe({
      next: (data) => {
        console.log('用戶資料載入完成:', data);
      },
      error: (error) => {
        console.error('載入用戶資料失敗:', error);
      }
    });
  }
  
  private clearUserData(): void {
    // 清除所有用戶相關狀態
    this.userStateService.clearState();
    this.notificationStateService.clearState();
    this.achievementStateService.clearState();
    this.socialStateService.clearState();
  }
}
```

## 測試策略

### 1. 狀態服務測試

```typescript
describe('AuthStateService', () => {
  let service: AuthStateService;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'refreshToken']);

    TestBed.configureTestingModule({
      providers: [
        AuthStateService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(AuthStateService);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('應該能夠登入並更新狀態', (done) => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const authResult = {
      user: { id: '1', email: 'test@example.com' },
      token: 'token123',
      refreshToken: 'refreshToken123'
    };
    
    mockAuthService.login.and.returnValue(of(authResult));

    service.login(credentials).subscribe({
      next: (state) => {
        expect(state.isAuthenticated).toBe(true);
        expect(state.currentUser).toEqual(authResult.user);
        expect(state.token).toBe(authResult.token);
        done();
      },
      error: done.fail
    });
  });

  it('應該能夠登出並清除狀態', () => {
    service.logout();
    
    const state = service.authState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentUser).toBeNull();
    expect(state.token).toBeNull();
  });
});
```

## 使用範例

### 1. 在組件中使用

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    <div class="user-profile">
      @if (userProfile(); as profile) {
        <h1>{{ profile.name }}</h1>
        <p>{{ profile.email }}</p>
        <div class="stats">
          <span>未讀通知: {{ unreadNotificationCount() }}</span>
          <span>成就進度: {{ achievementProgress() }}%</span>
        </div>
      }
    </div>
  `
})
export class UserProfileComponent {
  userProfile = this.userStateService.profile;
  unreadNotificationCount = this.notificationStateService.unreadCount;
  achievementProgress = this.achievementStateService.achievementProgress;

  constructor(
    private userStateService: UserStateService,
    private notificationStateService: NotificationStateService,
    private achievementStateService: AchievementStateService
  ) {}
}
```

## 最佳實踐

### 1. 狀態設計原則
- **單一職責**: 每個狀態服務專注於特定的業務領域
- **不可變性**: 使用 Signals 確保狀態的不可變性
- **響應式**: 使用 computed signals 提供衍生狀態
- **副作用管理**: 使用 effect 管理副作用

### 2. 效能考量
- **懶加載**: 按需載入狀態資料
- **快取**: 適當使用快取減少重複請求
- **批次更新**: 批次更新狀態提升效能
- **記憶體管理**: 適當清理不需要的狀態

### 3. 可維護性
- **型別安全**: 使用 TypeScript 提供型別安全
- **測試覆蓋**: 提供完整的狀態測試
- **錯誤處理**: 提供完整的錯誤處理機制
- **文件完整**: 提供詳細的狀態管理文件