# State Management.md - 狀態管理策略

> **AI Agent 友好指南**：本文件提供營建專案管理系統的狀態管理策略，包含 Angular Signals、RxJS、狀態持久化和同步最佳實踐。

## 🏗️ 狀態管理架構

### 狀態層級結構
```typescript
// 狀態管理層級
export interface StateArchitecture {
  // 全域狀態 (Global State)
  global: {
    user: UserState;           // 用戶狀態
    auth: AuthState;           // 認證狀態
    theme: ThemeState;         // 主題狀態
    notifications: NotificationState; // 通知狀態
  };
  
  // 功能狀態 (Feature State)
  features: {
    projects: ProjectState;    // 專案狀態
    teams: TeamState;          // 團隊狀態
    organization: OrganizationState; // 組織狀態
    costControl: CostControlState;   // 成本控制狀態
  };
  
  // 組件狀態 (Component State)
  components: {
    forms: FormState;          // 表單狀態
    ui: UIState;              // UI 狀態
    cache: CacheState;        // 快取狀態
  };
}
```

### 狀態管理策略選擇
```typescript
// 狀態管理策略配置
export const STATE_MANAGEMENT_STRATEGY = {
  // Angular Signals - 現代響應式狀態
  signals: {
    useFor: ['user', 'auth', 'theme', 'ui'],
    benefits: ['性能優化', '簡化語法', '自動變更檢測'],
    implementation: 'Angular Signals + computed() + effect()'
  },
  
  // RxJS Observables - 異步數據流
  observables: {
    useFor: ['api', 'websocket', 'real-time', 'async-operations'],
    benefits: ['異步處理', '數據流控制', '錯誤處理'],
    implementation: 'BehaviorSubject + Observable + operators'
  },
  
  // NgRx Store - 複雜狀態管理
  ngrx: {
    useFor: ['complex-business-logic', 'undo-redo', 'time-travel'],
    benefits: ['可預測性', '調試工具', '狀態持久化'],
    implementation: 'Store + Actions + Reducers + Effects'
  },
  
  // 本地狀態 - 組件內部狀態
  local: {
    useFor: ['form-state', 'ui-state', 'temporary-data'],
    benefits: ['簡單直接', '性能最佳', '易於測試'],
    implementation: 'Component properties + signals'
  }
} as const;
```

## 🔄 Angular Signals 狀態管理

### 1. 全域狀態服務
```typescript
// 用戶狀態服務
@Injectable({ providedIn: 'root' })
export class UserStateService {
  // 基礎狀態
  private _currentUser = signal<User | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  
  // 計算狀態
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // 計算屬性
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRole = computed(() => this._currentUser()?.role || 'guest');
  readonly userName = computed(() => this._currentUser()?.name || '未知用戶');
  
  constructor(private userService: UserService) {
    // 初始化時載入用戶資料
    this.loadCurrentUser();
  }
  
  // 載入當前用戶
  async loadCurrentUser() {
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      const user = await this.userService.getCurrentUser().toPromise();
      this._currentUser.set(user);
    } catch (error) {
      this._error.set('載入用戶資料失敗');
      console.error('Failed to load user:', error);
    } finally {
      this._isLoading.set(false);
    }
  }
  
  // 更新用戶資料
  updateUser(updates: Partial<User>) {
    const currentUser = this._currentUser();
    if (currentUser) {
      this._currentUser.set({ ...currentUser, ...updates });
    }
  }
  
  // 清除用戶狀態
  clearUser() {
    this._currentUser.set(null);
    this._error.set(null);
  }
}
```

### 2. 專案狀態服務
```typescript
// 專案狀態服務
@Injectable({ providedIn: 'root' })
export class ProjectStateService {
  // 專案列表狀態
  private _projects = signal<Project[]>([]);
  private _selectedProject = signal<Project | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  
  // 篩選和排序狀態
  private _filters = signal<ProjectFilters>({});
  private _sortBy = signal<ProjectSortField>('name');
  private _sortOrder = signal<'asc' | 'desc'>('asc');
  
  // 只讀狀態
  readonly projects = this._projects.asReadonly();
  readonly selectedProject = this._selectedProject.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly sortOrder = this._sortOrder.asReadonly();
  
  // 計算狀態
  readonly filteredProjects = computed(() => {
    const projects = this._projects();
    const filters = this._filters();
    const sortBy = this._sortBy();
    const sortOrder = this._sortOrder();
    
    let filtered = projects.filter(project => {
      if (filters.status && project.status !== filters.status) return false;
      if (filters.manager && project.manager !== filters.manager) return false;
      if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
    
    // 排序
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  });
  
  readonly projectCount = computed(() => this._projects().length);
  readonly activeProjectCount = computed(() => 
    this._projects().filter(p => p.status === 'active').length
  );
  
  constructor(private projectService: ProjectService) {
    // 監聽專案變更
    effect(() => {
      const selectedProject = this._selectedProject();
      if (selectedProject) {
        console.log('Selected project changed:', selectedProject.name);
      }
    });
  }
  
  // 載入專案列表
  async loadProjects() {
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      const projects = await this.projectService.getProjects().toPromise();
      this._projects.set(projects);
    } catch (error) {
      this._error.set('載入專案列表失敗');
      console.error('Failed to load projects:', error);
    } finally {
      this._isLoading.set(false);
    }
  }
  
  // 選擇專案
  selectProject(project: Project | null) {
    this._selectedProject.set(project);
  }
  
  // 更新專案
  updateProject(projectId: string, updates: Partial<Project>) {
    this._projects.update(projects => 
      projects.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      )
    );
    
    // 如果更新的是當前選中的專案，同步更新
    const selectedProject = this._selectedProject();
    if (selectedProject?.id === projectId) {
      this._selectedProject.set({ ...selectedProject, ...updates });
    }
  }
  
  // 新增專案
  addProject(project: Project) {
    this._projects.update(projects => [...projects, project]);
  }
  
  // 刪除專案
  removeProject(projectId: string) {
    this._projects.update(projects => 
      projects.filter(project => project.id !== projectId)
    );
    
    // 如果刪除的是當前選中的專案，清除選擇
    const selectedProject = this._selectedProject();
    if (selectedProject?.id === projectId) {
      this._selectedProject.set(null);
    }
  }
  
  // 設定篩選條件
  setFilters(filters: Partial<ProjectFilters>) {
    this._filters.update(current => ({ ...current, ...filters }));
  }
  
  // 設定排序
  setSorting(sortBy: ProjectSortField, sortOrder: 'asc' | 'desc') {
    this._sortBy.set(sortBy);
    this._sortOrder.set(sortOrder);
  }
}
```

### 3. 表單狀態管理
```typescript
// 表單狀態服務
@Injectable({ providedIn: 'root' })
export class FormStateService {
  private _forms = signal<Map<string, FormState>>(new Map());
  
  readonly forms = this._forms.asReadonly();
  
  // 獲取表單狀態
  getFormState(formId: string): FormState | undefined {
    return this._forms().get(formId);
  }
  
  // 初始化表單狀態
  initForm(formId: string, initialData: any = {}) {
    const formState: FormState = {
      data: initialData,
      errors: {},
      isDirty: false,
      isValid: true,
      isSubmitting: false
    };
    
    this._forms.update(forms => {
      const newForms = new Map(forms);
      newForms.set(formId, formState);
      return newForms;
    });
  }
  
  // 更新表單資料
  updateFormData(formId: string, data: any) {
    this._forms.update(forms => {
      const newForms = new Map(forms);
      const currentState = newForms.get(formId);
      if (currentState) {
        newForms.set(formId, {
          ...currentState,
          data: { ...currentState.data, ...data },
          isDirty: true
        });
      }
      return newForms;
    });
  }
  
  // 設定表單錯誤
  setFormErrors(formId: string, errors: { [key: string]: string }) {
    this._forms.update(forms => {
      const newForms = new Map(forms);
      const currentState = newForms.get(formId);
      if (currentState) {
        newForms.set(formId, {
          ...currentState,
          errors,
          isValid: Object.keys(errors).length === 0
        });
      }
      return newForms;
    });
  }
  
  // 設定提交狀態
  setSubmitting(formId: string, isSubmitting: boolean) {
    this._forms.update(forms => {
      const newForms = new Map(forms);
      const currentState = newForms.get(formId);
      if (currentState) {
        newForms.set(formId, {
          ...currentState,
          isSubmitting
        });
      }
      return newForms;
    });
  }
  
  // 重置表單
  resetForm(formId: string) {
    this._forms.update(forms => {
      const newForms = new Map(forms);
      const currentState = newForms.get(formId);
      if (currentState) {
        newForms.set(formId, {
          ...currentState,
          data: {},
          errors: {},
          isDirty: false,
          isValid: true,
          isSubmitting: false
        });
      }
      return newForms;
    });
  }
  
  // 清除表單狀態
  clearForm(formId: string) {
    this._forms.update(forms => {
      const newForms = new Map(forms);
      newForms.delete(formId);
      return newForms;
    });
  }
}
```

## 📡 RxJS 異步狀態管理

### 1. API 狀態管理
```typescript
// API 狀態管理服務
@Injectable({ providedIn: 'root' })
export class ApiStateService {
  private apiCallSubject = new BehaviorSubject<ApiCallState>({
    isLoading: false,
    error: null,
    lastCall: null
  });
  
  readonly apiCall$ = this.apiCallSubject.asObservable();
  
  // 執行 API 調用
  executeApiCall<T>(
    apiCall: () => Observable<T>,
    callId: string
  ): Observable<T> {
    this.setLoading(true, callId);
    this.clearError(callId);
    
    return apiCall().pipe(
      tap(() => {
        this.setLoading(false, callId);
        this.setLastCall(callId);
      }),
      catchError(error => {
        this.setLoading(false, callId);
        this.setError(error.message, callId);
        return throwError(() => error);
      })
    );
  }
  
  private setLoading(isLoading: boolean, callId: string) {
    this.apiCallSubject.next({
      ...this.apiCallSubject.value,
      isLoading,
      lastCall: callId
    });
  }
  
  private setError(error: string, callId: string) {
    this.apiCallSubject.next({
      ...this.apiCallSubject.value,
      error,
      lastCall: callId
    });
  }
  
  private clearError(callId: string) {
    this.apiCallSubject.next({
      ...this.apiCallSubject.value,
      error: null,
      lastCall: callId
    });
  }
  
  private setLastCall(callId: string) {
    this.apiCallSubject.next({
      ...this.apiCallSubject.value,
      lastCall: callId
    });
  }
}
```

### 2. 實時數據同步
```typescript
// 實時數據同步服務
@Injectable({ providedIn: 'root' })
export class RealtimeSyncService {
  private syncSubjects = new Map<string, BehaviorSubject<any>>();
  private subscriptions = new Map<string, Subscription>();
  
  // 開始同步
  startSync<T>(
    key: string,
    dataSource: Observable<T>,
    initialValue: T
  ): Observable<T> {
    // 創建或獲取 BehaviorSubject
    if (!this.syncSubjects.has(key)) {
      this.syncSubjects.set(key, new BehaviorSubject(initialValue));
    }
    
    const subject = this.syncSubjects.get(key)!;
    
    // 訂閱數據源
    const subscription = dataSource.subscribe({
      next: (data) => subject.next(data),
      error: (error) => {
        console.error(`Sync error for ${key}:`, error);
        subject.error(error);
      }
    });
    
    this.subscriptions.set(key, subscription);
    
    return subject.asObservable();
  }
  
  // 停止同步
  stopSync(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
    
    const subject = this.syncSubjects.get(key);
    if (subject) {
      subject.complete();
      this.syncSubjects.delete(key);
    }
  }
  
  // 獲取同步狀態
  getSyncState(key: string): Observable<any> {
    const subject = this.syncSubjects.get(key);
    return subject ? subject.asObservable() : of(null);
  }
  
  // 手動更新數據
  updateData(key: string, data: any) {
    const subject = this.syncSubjects.get(key);
    if (subject) {
      subject.next(data);
    }
  }
  
  // 清理所有同步
  cleanup() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.syncSubjects.forEach(subject => subject.complete());
    this.subscriptions.clear();
    this.syncSubjects.clear();
  }
}
```

## 💾 狀態持久化

### 1. 本地儲存服務
```typescript
// 狀態持久化服務
@Injectable({ providedIn: 'root' })
export class StatePersistenceService {
  private readonly STORAGE_KEY_PREFIX = 'ng-alain-state-';
  
  // 儲存狀態
  saveState<T>(key: string, state: T): void {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(this.STORAGE_KEY_PREFIX + key, serializedState);
    } catch (error) {
      console.error(`Failed to save state for key ${key}:`, error);
    }
  }
  
  // 載入狀態
  loadState<T>(key: string, defaultValue: T): T {
    try {
      const serializedState = localStorage.getItem(this.STORAGE_KEY_PREFIX + key);
      if (serializedState) {
        return JSON.parse(serializedState);
      }
    } catch (error) {
      console.error(`Failed to load state for key ${key}:`, error);
    }
    return defaultValue;
  }
  
  // 清除狀態
  clearState(key: string): void {
    localStorage.removeItem(this.STORAGE_KEY_PREFIX + key);
  }
  
  // 清除所有狀態
  clearAllStates(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
  
  // 檢查狀態是否存在
  hasState(key: string): boolean {
    return localStorage.getItem(this.STORAGE_KEY_PREFIX + key) !== null;
  }
}
```

### 2. 狀態持久化裝飾器
```typescript
// 狀態持久化裝飾器
export function PersistState(key: string) {
  return function (target: any, propertyKey: string) {
    const persistenceService = inject(StatePersistenceService);
    
    // 載入初始狀態
    const initialValue = persistenceService.loadState(key, target[propertyKey]);
    target[propertyKey] = initialValue;
    
    // 監聽狀態變更並自動儲存
    const originalDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    if (originalDescriptor) {
      Object.defineProperty(target, propertyKey, {
        get: originalDescriptor.get,
        set: function (value) {
          originalDescriptor.set?.call(this, value);
          persistenceService.saveState(key, value);
        },
        enumerable: true,
        configurable: true
      });
    }
  };
}

// 使用範例
@Injectable({ providedIn: 'root' })
export class ThemeStateService {
  @PersistState('theme')
  currentTheme: 'light' | 'dark' = 'light';
  
  @PersistState('theme-settings')
  themeSettings: ThemeSettings = {
    primaryColor: '#1890ff',
    borderRadius: 6,
    fontSize: 14
  };
}
```

## 🔄 狀態同步策略

### 1. 跨標籤頁同步
```typescript
// 跨標籤頁狀態同步服務
@Injectable({ providedIn: 'root' })
export class CrossTabSyncService {
  private syncChannel = new BroadcastChannel('ng-alain-state-sync');
  private stateSubjects = new Map<string, BehaviorSubject<any>>();
  
  constructor() {
    // 監聽其他標籤頁的狀態變更
    this.syncChannel.addEventListener('message', (event) => {
      const { key, data, action } = event.data;
      this.handleSyncMessage(key, data, action);
    });
  }
  
  // 註冊狀態同步
  registerStateSync<T>(key: string, initialState: T): Observable<T> {
    if (!this.stateSubjects.has(key)) {
      this.stateSubjects.set(key, new BehaviorSubject(initialState));
    }
    
    const subject = this.stateSubjects.get(key)!;
    
    // 監聽狀態變更並廣播
    subject.subscribe(data => {
      this.broadcastStateChange(key, data, 'update');
    });
    
    return subject.asObservable();
  }
  
  // 廣播狀態變更
  private broadcastStateChange(key: string, data: any, action: string) {
    this.syncChannel.postMessage({
      key,
      data,
      action,
      timestamp: Date.now()
    });
  }
  
  // 處理同步訊息
  private handleSyncMessage(key: string, data: any, action: string) {
    const subject = this.stateSubjects.get(key);
    if (subject && action === 'update') {
      subject.next(data);
    }
  }
  
  // 手動同步狀態
  syncState(key: string, data: any) {
    const subject = this.stateSubjects.get(key);
    if (subject) {
      subject.next(data);
    }
  }
  
  // 清理
  ngOnDestroy() {
    this.syncChannel.close();
    this.stateSubjects.forEach(subject => subject.complete());
    this.stateSubjects.clear();
  }
}
```

### 2. 離線狀態管理
```typescript
// 離線狀態管理服務
@Injectable({ providedIn: 'root' })
export class OfflineStateService {
  private offlineQueue: OfflineAction[] = [];
  private isOnline$ = new BehaviorSubject(navigator.onLine);
  
  constructor() {
    // 監聽網路狀態
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      this.processOfflineQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
    });
  }
  
  // 執行離線安全的操作
  executeOfflineSafe<T>(
    action: () => Observable<T>,
    offlineAction: OfflineAction
  ): Observable<T> {
    if (this.isOnline$.value) {
      return action().pipe(
        catchError(error => {
          if (!navigator.onLine) {
            this.queueOfflineAction(offlineAction);
            return throwError(() => new Error('操作已加入離線隊列'));
          }
          return throwError(() => error);
        })
      );
    } else {
      this.queueOfflineAction(offlineAction);
      return throwError(() => new Error('網路離線，操作已加入隊列'));
    }
  }
  
  // 加入離線隊列
  private queueOfflineAction(action: OfflineAction) {
    this.offlineQueue.push({
      ...action,
      timestamp: Date.now()
    });
    
    // 儲存到本地儲存
    this.saveOfflineQueue();
  }
  
  // 處理離線隊列
  private async processOfflineQueue() {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const action of queue) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.error('Failed to execute offline action:', error);
        // 重新加入隊列
        this.offlineQueue.push(action);
      }
    }
    
    this.saveOfflineQueue();
  }
  
  private async executeAction(action: OfflineAction) {
    // 根據動作類型執行相應操作
    switch (action.type) {
      case 'create-project':
        // 執行創建專案操作
        break;
      case 'update-project':
        // 執行更新專案操作
        break;
      case 'delete-project':
        // 執行刪除專案操作
        break;
    }
  }
  
  private saveOfflineQueue() {
    localStorage.setItem('offline-queue', JSON.stringify(this.offlineQueue));
  }
  
  private loadOfflineQueue() {
    const saved = localStorage.getItem('offline-queue');
    if (saved) {
      this.offlineQueue = JSON.parse(saved);
    }
  }
}
```

## 🧪 狀態測試策略

### 1. 狀態服務測試
```typescript
// 用戶狀態服務測試
describe('UserStateService', () => {
  let service: UserStateService;
  let userService: jasmine.SpyObj<UserService>;
  
  beforeEach(() => {
    const spy = jasmine.createSpyObj('UserService', ['getCurrentUser']);
    
    TestBed.configureTestingModule({
      providers: [
        UserStateService,
        { provide: UserService, useValue: spy }
      ]
    });
    
    service = TestBed.inject(UserStateService);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });
  
  it('should initialize with null user', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
  
  it('should load user successfully', fakeAsync(() => {
    const mockUser: User = { id: '1', name: 'Test User', role: 'admin' };
    userService.getCurrentUser.and.returnValue(of(mockUser));
    
    service.loadCurrentUser();
    tick();
    
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.userRole()).toBe('admin');
  }));
  
  it('should handle loading error', fakeAsync(() => {
    userService.getCurrentUser.and.returnValue(throwError(() => new Error('Network error')));
    
    service.loadCurrentUser();
    tick();
    
    expect(service.currentUser()).toBeNull();
    expect(service.error()).toBe('載入用戶資料失敗');
  }));
  
  it('should update user data', () => {
    const mockUser: User = { id: '1', name: 'Test User', role: 'admin' };
    service['_currentUser'].set(mockUser);
    
    service.updateUser({ name: 'Updated User' });
    
    expect(service.currentUser()?.name).toBe('Updated User');
  });
});
```

### 2. 狀態整合測試
```typescript
// 狀態整合測試
describe('State Integration', () => {
  let userStateService: UserStateService;
  let projectStateService: ProjectStateService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserStateService,
        ProjectStateService,
        { provide: UserService, useValue: jasmine.createSpyObj('UserService', ['getCurrentUser']) },
        { provide: ProjectService, useValue: jasmine.createSpyObj('ProjectService', ['getProjects']) }
      ]
    });
    
    userStateService = TestBed.inject(UserStateService);
    projectStateService = TestBed.inject(ProjectStateService);
  });
  
  it('should sync user and project states', fakeAsync(() => {
    const mockUser: User = { id: '1', name: 'Test User', role: 'admin' };
    const mockProjects: Project[] = [
      { id: '1', name: 'Project 1', manager: 'Test User', status: 'active' }
    ];
    
    // 載入用戶
    userStateService['_currentUser'].set(mockUser);
    
    // 載入專案
    projectStateService['_projects'].set(mockProjects);
    
    tick();
    
    expect(userStateService.isAuthenticated()).toBeTrue();
    expect(projectStateService.projectCount()).toBe(1);
  }));
});
```

## ✅ AI Agent 實作檢查清單

### 狀態管理架構檢查清單
- [ ] **狀態分層**：全域、功能、組件狀態清晰分離
- [ ] **策略選擇**：根據使用場景選擇適當的狀態管理策略
- [ ] **狀態設計**：狀態結構清晰，易於理解和維護
- [ ] **性能優化**：使用 Signals 和 computed 優化性能
- [ ] **類型安全**：所有狀態都有明確的 TypeScript 類型

### 狀態持久化檢查清單
- [ ] **本地儲存**：重要狀態自動持久化到本地儲存
- [ ] **狀態恢復**：應用重啟時正確恢復狀態
- [ ] **跨標籤頁同步**：多標籤頁間狀態同步
- [ ] **離線支援**：離線狀態管理和隊列處理
- [ ] **狀態清理**：適當的狀態清理和記憶體管理

### 狀態同步檢查清單
- [ ] **實時同步**：Firebase 實時數據同步
- [ ] **衝突解決**：數據衝突的解決策略
- [ ] **錯誤處理**：狀態同步錯誤的處理機制
- [ ] **重試機制**：失敗操作的自動重試
- [ ] **狀態驗證**：狀態數據的驗證和校驗

### 測試覆蓋檢查清單
- [ ] **單元測試**：狀態服務的單元測試
- [ ] **整合測試**：狀態間交互的整合測試
- [ ] **狀態快照**：狀態變更的快照測試
- [ ] **異步測試**：異步狀態操作的測試
- [ ] **錯誤測試**：狀態錯誤情況的測試

## 📚 參考資源

### 官方文件
- [Angular Signals 指南](https://angular.dev/guide/signals)
- [Angular 狀態管理](https://angular.dev/guide/state-management)
- [RxJS 操作符指南](https://rxjs.dev/guide/operators)

### 最佳實踐
- [Angular 狀態管理最佳實踐](https://angular.io/guide/state-management)
- [NgRx 狀態管理](https://ngrx.io/guide/store)
- [RxJS 最佳實踐](https://rxjs.dev/guide/overview)

### 工具與測試
- [Angular 測試工具](https://angular.dev/guide/testing)
- [RxJS 測試工具](https://rxjs.dev/guide/testing)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

---

> **AI Agent 提示**：實作狀態管理時，請遵循本指南的架構策略和檢查清單，確保狀態的一致性、性能和可維護性。優先使用 Angular Signals 進行現代化的狀態管理。
