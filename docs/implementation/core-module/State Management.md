# State Management - 核心模組

## 概述

狀態管理是 Angular 應用程式的核心部分，負責管理應用程式的資料流和狀態變化。在 ng-alain 專案中，我們採用現代化的 Angular Signals 作為主要的狀態管理解決方案，結合 RxJS 和 NgRx 來處理不同複雜度的狀態需求。

## 設計原則

### 1. 響應式優先
- 使用 Angular Signals 實現響應式狀態管理
- 優先使用 `signal()`、`computed()` 和 `effect()`
- 避免手動觸發變更檢測

### 2. 分層架構
- **UI 狀態**: 使用 Signals 管理簡單的 UI 狀態
- **業務狀態**: 使用 Signals 或 RxJS 管理中等複雜度的狀態
- **全域狀態**: 使用 NgRx 管理複雜的應用程式狀態

### 3. 效能優化
- 使用 `OnPush` 變更檢測策略
- 實現適當的狀態快取
- 避免不必要的重新計算

## 狀態管理策略

### 1. Angular Signals (推薦)

Angular Signals 是 Angular 17+ 引入的現代化響應式原語，提供：
- 自動變更檢測
- 細粒度的依賴追蹤
- 更好的效能
- 簡潔的 API

### 2. RxJS Observables

用於處理：
- 異步資料流
- HTTP 請求
- 事件處理
- 複雜的資料轉換

### 3. NgRx Store

用於管理：
- 複雜的應用程式狀態
- 跨模組的狀態共享
- 時間旅行除錯
- 狀態持久化

## 實作範例

### 基本 Signals 使用

```typescript
import { Component, signal, computed, effect } from '@angular/core';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-user-management',
  template: `
    <div class="user-management">
      <h2>使用者管理</h2>
      
      <!-- 使用者列表 -->
      <div class="user-list">
        @for (user of users(); track user.id) {
          <div class="user-item" [class.selected]="selectedUser()?.id === user.id">
            <span>{{ user.name }}</span>
            <span class="role">{{ user.role }}</span>
            <button (click)="selectUser(user)">選擇</button>
          </div>
        }
      </div>
      
      <!-- 統計資訊 -->
      <div class="stats">
        <p>總使用者數: {{ totalUsers() }}</p>
        <p>管理員數: {{ adminCount() }}</p>
        <p>選中的使用者: {{ selectedUser()?.name || '無' }}</p>
      </div>
      
      <!-- 操作按鈕 -->
      <div class="actions">
        <button (click)="addUser()" [disabled]="isLoading()">新增使用者</button>
        <button (click)="deleteSelectedUser()" [disabled]="!selectedUser()">刪除選中</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent {
  // 基本狀態
  users = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  isLoading = signal(false);
  
  // 計算屬性
  totalUsers = computed(() => this.users().length);
  adminCount = computed(() => 
    this.users().filter(user => user.role === 'admin').length
  );
  
  // 副作用
  constructor() {
    // 監聽選中使用者變化
    effect(() => {
      const user = this.selectedUser();
      if (user) {
        console.log(`選中使用者: ${user.name}`);
      }
    });
    
    // 載入初始資料
    this.loadUsers();
  }
  
  selectUser(user: User) {
    this.selectedUser.set(user);
  }
  
  addUser() {
    this.isLoading.set(true);
    
    // 模擬 API 呼叫
    setTimeout(() => {
      const newUser: User = {
        id: Date.now(),
        name: `使用者 ${this.totalUsers() + 1}`,
        email: `user${this.totalUsers() + 1}@example.com`,
        role: 'user'
      };
      
      this.users.update(users => [...users, newUser]);
      this.isLoading.set(false);
    }, 1000);
  }
  
  deleteSelectedUser() {
    const user = this.selectedUser();
    if (user) {
      this.users.update(users => users.filter(u => u.id !== user.id));
      this.selectedUser.set(null);
    }
  }
  
  private loadUsers() {
    // 模擬載入初始資料
    this.users.set([
      { id: 1, name: '管理員', email: 'admin@example.com', role: 'admin' },
      { id: 2, name: '使用者1', email: 'user1@example.com', role: 'user' },
      { id: 3, name: '使用者2', email: 'user2@example.com', role: 'user' }
    ]);
  }
}
```

### 進階 Signals 模式

```typescript
import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Project {
  id: number;
  name: string;
  status: 'active' | 'completed' | 'pending';
  budget: number;
  startDate: Date;
  endDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectStateService {
  private http = inject(HttpClient);
  
  // 狀態
  projects = signal<Project[]>([]);
  selectedProject = signal<Project | null>(null);
  filterStatus = signal<string>('all');
  searchQuery = signal<string>('');
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // 計算屬性
  filteredProjects = computed(() => {
    const projects = this.projects();
    const status = this.filterStatus();
    const query = this.searchQuery().toLowerCase();
    
    return projects.filter(project => {
      const matchesStatus = status === 'all' || project.status === status;
      const matchesQuery = project.name.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  });
  
  totalBudget = computed(() => 
    this.filteredProjects().reduce((sum, project) => sum + project.budget, 0)
  );
  
  projectStats = computed(() => {
    const projects = this.projects();
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      pending: projects.filter(p => p.status === 'pending').length
    };
  });
  
  constructor() {
    // 自動載入資料
    effect(() => {
      this.loadProjects();
    });
  }
  
  // 動作
  setFilterStatus(status: string) {
    this.filterStatus.set(status);
  }
  
  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }
  
  selectProject(project: Project) {
    this.selectedProject.set(project);
  }
  
  createProject(project: Omit<Project, 'id'>) {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.http.post<Project>('/api/projects', project).subscribe({
      next: (newProject) => {
        this.projects.update(projects => [...projects, newProject]);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      }
    });
  }
  
  updateProject(id: number, updates: Partial<Project>) {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.http.put<Project>(`/api/projects/${id}`, updates).subscribe({
      next: (updatedProject) => {
        this.projects.update(projects =>
          projects.map(p => p.id === id ? updatedProject : p)
        );
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      }
    });
  }
  
  deleteProject(id: number) {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.http.delete(`/api/projects/${id}`).subscribe({
      next: () => {
        this.projects.update(projects => projects.filter(p => p.id !== id));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      }
    });
  }
  
  private loadProjects() {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.http.get<Project[]>('/api/projects').subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      }
    });
  }
}
```

### 與 RxJS 整合

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HybridStateService {
  private http = inject(HttpClient);
  
  // Signals 用於 UI 狀態
  selectedUserId = signal<number | null>(null);
  isEditing = signal(false);
  
  // RxJS 用於異步資料流
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();
  
  // 計算屬性結合 Signals 和 RxJS
  selectedUser$ = computed(() => {
    const userId = this.selectedUserId();
    if (!userId) return null;
    
    return this.users$.pipe(
      map(users => users.find(user => user.id === userId))
    );
  });
  
  // 複雜的資料流處理
  userProjects$ = computed(() => {
    const userId = this.selectedUserId();
    if (!userId) return of([]);
    
    return this.http.get<Project[]>(`/api/users/${userId}/projects`);
  });
  
  // 搜尋功能
  searchUsers(query$: Observable<string>): Observable<User[]> {
    return combineLatest([
      this.users$,
      query$.pipe(startWith(''))
    ]).pipe(
      map(([users, query]) => 
        users.filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }
  
  // 更新狀態
  setSelectedUser(userId: number) {
    this.selectedUserId.set(userId);
  }
  
  setEditing(editing: boolean) {
    this.isEditing.set(editing);
  }
  
  loadUsers() {
    this.http.get<User[]>('/api/users').subscribe(users => {
      this.usersSubject.next(users);
    });
  }
}
```

### 與 NgRx 整合

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { select } from '@ngrx/store';
import { Observable } from 'rxjs';

interface AppState {
  auth: AuthState;
  projects: ProjectState;
  users: UserState;
}

@Injectable({
  providedIn: 'root'
})
export class NgRxSignalsService {
  private store = inject(Store<AppState>);
  
  // 從 NgRx Store 選擇資料
  private authState$ = this.store.select(selectAuthState);
  private projectsState$ = this.store.select(selectProjectsState);
  private usersState$ = this.store.select(selectUsersState);
  
  // 轉換為 Signals
  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);
  projects = signal<Project[]>([]);
  
  constructor() {
    // 同步 NgRx 狀態到 Signals
    this.authState$.subscribe(state => {
      this.isAuthenticated.set(state.isAuthenticated);
      this.currentUser.set(state.user);
    });
    
    this.projectsState$.subscribe(state => {
      this.projects.set(state.projects);
    });
  }
  
  // 計算屬性
  userProjects = computed(() => {
    const user = this.currentUser();
    const projects = this.projects();
    
    if (!user) return [];
    
    return projects.filter(project => project.ownerId === user.id);
  });
  
  // 動作
  login(credentials: LoginCredentials) {
    this.store.dispatch(login({ credentials }));
  }
  
  logout() {
    this.store.dispatch(logout());
  }
  
  createProject(project: CreateProjectRequest) {
    this.store.dispatch(createProject({ project }));
  }
}
```

## 最佳實踐

### 1. 狀態分層
- **UI 狀態**: 使用 Signals 管理簡單的 UI 狀態
- **業務狀態**: 使用 Signals 或 RxJS 管理中等複雜度的狀態
- **全域狀態**: 使用 NgRx 管理複雜的應用程式狀態

### 2. 效能優化
- 使用 `OnPush` 變更檢測策略
- 避免在 computed 中進行重計算
- 使用 `trackBy` 函數優化列表渲染

### 3. 錯誤處理
- 為所有異步操作提供錯誤處理
- 使用 Signals 管理錯誤狀態
- 提供適當的使用者回饋

### 4. 測試
- 為 Signals 編寫單元測試
- 測試計算屬性的依賴關係
- 使用 `TestBed` 進行整合測試

## 常見問題

### Q: 何時使用 Signals 而不是 RxJS？
A: 使用 Signals 處理簡單的狀態和 UI 狀態，使用 RxJS 處理複雜的異步資料流。

### Q: 如何處理 Signals 的記憶體洩漏？
A: Signals 會自動清理，但要注意 effect 的清理，使用 `DestroyRef` 來管理生命週期。

### Q: 如何測試 Signals？
A: 使用 `TestBed` 和 `signal()` 來測試 Signals 的行為和計算屬性。

### Q: 如何與現有的 RxJS 程式碼整合？
A: 使用 `computed()` 來將 Observable 轉換為 Signal，或使用 `toSignal()` 函數。

## 相關服務

- `AuthService` - 認證服務
- `ProjectService` - 專案服務
- `UserService` - 使用者服務
- `NotificationService` - 通知服務

## 參考資料

- [Angular Signals 官方文件](https://angular.dev/guide/signals)
- [Angular 變更檢測指南](https://angular.dev/guide/change-detection)
- [RxJS 操作符指南](https://rxjs.dev/guide/operators)
- [NgRx 狀態管理](https://ngrx.io/guide/store)

