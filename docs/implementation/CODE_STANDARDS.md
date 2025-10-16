# 程式碼標準 (Code Standards)

## 🎯 程式碼標準概述

本文件定義 ng-alain-gig 專案的程式碼標準，確保程式碼品質、一致性和可維護性。

## 📝 命名規範

### TypeScript 命名
```typescript
// 類別 - PascalCase
export class UserService { }
export class ProjectAggregate { }

// 介面 - PascalCase + Interface 後綴
export interface UserInterface { }
export interface ProjectData { }

// 型別 - PascalCase + Type 後綴
export type UserRole = 'admin' | 'user' | 'guest';
export type ProjectStatus = 'draft' | 'active' | 'completed';

// 常數 - UPPER_SNAKE_CASE
export const API_ENDPOINTS = {
  USERS: '/api/users',
  PROJECTS: '/api/projects'
};

// 變數和函數 - camelCase
const currentUser = getCurrentUser();
function calculateTotal(items: Item[]): number { }

// 私有成員 - 前綴 _
private _internalState = signal(null);
private _calculateScore(): number { }
```

### 檔案命名
```bash
# 組件檔案 - kebab-case
user-profile.component.ts
project-list.component.ts

# 服務檔案 - kebab-case + .service
user.service.ts
project.service.ts

# 模型檔案 - kebab-case + .model
user.model.ts
project.model.ts

# 守衛檔案 - kebab-case + .guard
auth.guard.ts
permission.guard.ts

# 攔截器檔案 - kebab-case + .interceptor
auth.interceptor.ts
error.interceptor.ts
```

### 目錄命名
```bash
# 功能目錄 - kebab-case
user-management/
project-dashboard/
cost-control/

# 共享目錄 - kebab-case
shared-components/
common-services/
utility-functions/
```

## 🏗️ Angular 組件標準

### Standalone 組件結構
```typescript
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule
  ],
  template: `
    <div class="user-profile">
      <!-- 模板內容 -->
    </div>
  `,
  styleUrls: ['./user-profile.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent implements OnInit, OnDestroy {
  // Signal 狀態
  private readonly userService = inject(UserService);
  readonly user = signal<User | null>(null);
  readonly loading = signal(false);
  
  // 計算屬性
  readonly displayName = computed(() => {
    const user = this.user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });
  
  // 生命週期
  ngOnInit(): void {
    this.loadUser();
  }
  
  ngOnDestroy(): void {
    // 清理邏輯
  }
  
  // 私有方法
  private async loadUser(): Promise<void> {
    this.loading.set(true);
    try {
      const user = await this.userService.getCurrentUser();
      this.user.set(user);
    } catch (error) {
      console.error('載入用戶失敗:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### 組件模板標準
```html
<!-- 使用現代控制流程 -->
@if (loading()) {
  <nz-spin nzTip="載入中..."></nz-spin>
} @else if (user()) {
  <div class="user-info">
    <h2>{{ displayName() }}</h2>
    <p>{{ user()?.email }}</p>
  </div>
} @else {
  <nz-empty nzNotFoundContent="找不到用戶資料"></nz-empty>
}

<!-- 列表渲染 -->
@for (project of projects(); track project.id) {
  <div class="project-item">
    <h3>{{ project.name }}</h3>
    <p>{{ project.description }}</p>
  </div>
}

<!-- 條件渲染 -->
@switch (user()?.role) {
  @case ('admin') {
    <app-admin-panel></app-admin-panel>
  }
  @case ('user') {
    <app-user-panel></app-user-panel>
  }
  @default {
    <app-guest-panel></app-guest-panel>
  }
}
```

## 🔧 服務標準

### 服務結構
```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  // 依賴注入
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  
  // 私有狀態
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal(false);
  
  // 公開狀態
  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  
  // 公開方法
  async getUsers(): Promise<User[]> {
    this._loading.set(true);
    try {
      const users = await this.fetchUsers();
      this._users.set(users);
      return users;
    } catch (error) {
      this.handleError('獲取用戶列表失敗', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }
  
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const user = await this.http.post<User>('/api/users', userData).toPromise();
      this._users.update(users => [...users, user]);
      this.notificationService.success('用戶創建成功');
      return user;
    } catch (error) {
      this.handleError('創建用戶失敗', error);
      throw error;
    }
  }
  
  // 私有方法
  private async fetchUsers(): Promise<User[]> {
    return this.http.get<User[]>('/api/users').toPromise();
  }
  
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.notificationService.error(message);
  }
}
```

## 📊 狀態管理標準

### Signal 狀態管理
```typescript
// 簡單狀態 - 使用 Signal
@Injectable({ providedIn: 'root' })
export class ProjectState {
  private readonly _projects = signal<Project[]>([]);
  private readonly _selectedProject = signal<Project | null>(null);
  private readonly _filters = signal<ProjectFilters>({});
  
  // 只讀狀態
  readonly projects = this._projects.asReadonly();
  readonly selectedProject = this._selectedProject.asReadonly();
  readonly filters = this._filters.asReadonly();
  
  // 計算屬性
  readonly filteredProjects = computed(() => {
    const projects = this._projects();
    const filters = this._filters();
    return this.applyFilters(projects, filters);
  });
  
  readonly projectCount = computed(() => this._projects().length);
  
  // 狀態更新
  setProjects(projects: Project[]): void {
    this._projects.set(projects);
  }
  
  selectProject(project: Project): void {
    this._selectedProject.set(project);
  }
  
  updateFilters(filters: Partial<ProjectFilters>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }
  
  private applyFilters(projects: Project[], filters: ProjectFilters): Project[] {
    // 過濾邏輯
    return projects.filter(project => {
      // 實作過濾條件
      return true;
    });
  }
}
```

### NgRx Store (複雜狀態)
```typescript
// State 定義
export interface AppState {
  auth: AuthState;
  projects: ProjectState;
  notifications: NotificationState;
}

// Actions
export const ProjectActions = createActionGroup({
  source: 'Project',
  events: {
    'Load Projects': emptyProps(),
    'Load Projects Success': props<{ projects: Project[] }>(),
    'Load Projects Failure': props<{ error: string }>(),
    'Create Project': props<{ project: CreateProjectData }>(),
    'Update Project': props<{ id: string; updates: Partial<Project> }>(),
    'Delete Project': props<{ id: string }>()
  }
});

// Reducer
export const projectReducer = createReducer(
  initialProjectState,
  on(ProjectActions.loadProjects, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ProjectActions.loadProjectsSuccess, (state, { projects }) => ({
    ...state,
    projects,
    loading: false,
    error: null
  })),
  on(ProjectActions.loadProjectsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);

// Effects
@Injectable()
export class ProjectEffects {
  private readonly actions$ = inject(Actions);
  private readonly projectService = inject(ProjectService);
  
  loadProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.loadProjects),
      switchMap(() =>
        this.projectService.getAll().pipe(
          map(projects => ProjectActions.loadProjectsSuccess({ projects })),
          catchError(error => of(ProjectActions.loadProjectsFailure({ error: error.message })))
        )
      )
    )
  );
}
```

## 🧪 測試標準

### 單元測試結構
```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let notificationService: jasmine.SpyObj<NotificationService>;
  
  beforeEach(() => {
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });
    
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });
  
  afterEach(() => {
    httpMock.verify();
  });
  
  describe('getUsers', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@example.com' },
        { id: '2', name: 'User 2', email: 'user2@example.com' }
      ];
      
      const promise = service.getUsers();
      
      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
      
      const result = await promise;
      expect(result).toEqual(mockUsers);
      expect(service.users()).toEqual(mockUsers);
    });
    
    it('should handle error when fetching users fails', async () => {
      const promise = service.getUsers();
      
      const req = httpMock.expectOne('/api/users');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      
      await expectAsync(promise).toBeRejected();
      expect(notificationService.error).toHaveBeenCalledWith('獲取用戶列表失敗');
    });
  });
});
```

### 組件測試結構
```typescript
describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;
  
  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers'], {
      users: signal([]),
      loading: signal(false)
    });
    
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should display users when loaded', () => {
    const mockUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com' }
    ];
    
    userService.users.set(mockUsers);
    fixture.detectChanges();
    
    const userElements = fixture.debugElement.queryAll(By.css('.user-item'));
    expect(userElements.length).toBe(1);
    expect(userElements[0].nativeElement.textContent).toContain('User 1');
  });
});
```

## 🎨 樣式標準

### Less 樣式結構
```less
// user-profile.component.less
.user-profile {
  padding: 24px;
  background: @component-background;
  border-radius: @border-radius-base;
  
  &__header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    
    .avatar {
      width: 64px;
      height: 64px;
      margin-right: 16px;
    }
    
    .info {
      flex: 1;
      
      .name {
        font-size: @font-size-lg;
        font-weight: @font-weight-medium;
        color: @text-color;
        margin-bottom: 4px;
      }
      
      .email {
        font-size: @font-size-base;
        color: @text-color-secondary;
      }
    }
  }
  
  &__content {
    .form-section {
      margin-bottom: 24px;
      
      .section-title {
        font-size: @font-size-base;
        font-weight: @font-weight-medium;
        color: @text-color;
        margin-bottom: 12px;
      }
    }
  }
  
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;
  }
}

// 響應式設計
@media (max-width: @screen-md) {
  .user-profile {
    padding: 16px;
    
    &__header {
      flex-direction: column;
      text-align: center;
      
      .avatar {
        margin-right: 0;
        margin-bottom: 12px;
      }
    }
  }
}
```

## 🔒 安全標準

### 輸入驗證
```typescript
// 表單驗證
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);
  
  form = this.fb.nonNullable.group({
    name: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      this.noSpecialCharacters()
    ]],
    email: ['', [
      Validators.required,
      Validators.email,
      this.emailDomainValidator()
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      this.strongPasswordValidator()
    ]]
  });
  
  // 自定義驗證器
  private noSpecialCharacters(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const hasSpecialChar = /[<>\"'&]/.test(value);
      return hasSpecialChar ? { specialCharacters: true } : null;
    };
  }
  
  private strongPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const hasNumber = /[0-9]/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      const valid = hasNumber && hasUpper && hasLower && hasSpecial;
      return valid ? null : { weakPassword: true };
    };
  }
}
```

### XSS 防護
```typescript
// 安全的 HTML 處理
@Component({
  template: `
    <!-- 安全：自動轉義 -->
    <div>{{ userInput }}</div>
    
    <!-- 危險：避免使用 innerHTML -->
    <!-- <div [innerHTML]="userInput"></div> -->
    
    <!-- 安全：使用 DomSanitizer -->
    <div [innerHTML]="sanitizedHtml"></div>
  `
})
export class SafeContentComponent {
  private readonly sanitizer = inject(DomSanitizer);
  
  userInput = '<script>alert("XSS")</script>Hello';
  
  get sanitizedHtml() {
    return this.sanitizer.sanitize(SecurityContext.HTML, this.userInput);
  }
}
```

## 📊 效能標準

### 變更檢測優化
```typescript
@Component({
  selector: 'app-project-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (project of projects(); track project.id) {
      <app-project-item 
        [project]="project"
        (projectClick)="onProjectClick($event)">
      </app-project-item>
    }
  `
})
export class ProjectListComponent {
  projects = input.required<Project[]>();
  projectClick = output<Project>();
  
  onProjectClick(project: Project): void {
    this.projectClick.emit(project);
  }
}
```

### 記憶體管理
```typescript
@Component({
  selector: 'app-data-subscription',
  template: `<div>{{ data() }}</div>`
})
export class DataSubscriptionComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);
  
  readonly data = signal<any>(null);
  
  ngOnInit(): void {
    // 使用 takeUntilDestroyed 自動清理訂閱
    this.dataService.getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.data.set(data));
  }
}
```

## 📋 程式碼檢查清單

### ✅ 命名規範
- [ ] 類別使用 PascalCase
- [ ] 變數和函數使用 camelCase
- [ ] 常數使用 UPPER_SNAKE_CASE
- [ ] 檔案使用 kebab-case

### ✅ 組件標準
- [ ] 使用 Standalone 組件
- [ ] 實作 OnPush 變更檢測
- [ ] 使用現代控制流程語法
- [ ] 正確的生命週期管理

### ✅ 服務標準
- [ ] 使用 providedIn: 'root'
- [ ] 正確的依賴注入
- [ ] 錯誤處理機制
- [ ] 狀態管理模式

### ✅ 測試覆蓋
- [ ] 單元測試覆蓋率 > 80%
- [ ] 組件測試包含 UI 互動
- [ ] 服務測試包含錯誤情況
- [ ] Mock 依賴正確設置

### ✅ 安全性
- [ ] 輸入驗證完整
- [ ] XSS 防護措施
- [ ] 權限檢查機制
- [ ] 敏感資料處理

### ✅ 效能
- [ ] 使用 OnPush 變更檢測
- [ ] 正確的 trackBy 函數
- [ ] 記憶體洩漏防護
- [ ] 懶載入實作

## 🔗 相關資源

- [Angular 20 風格指南](https://v20.angular.dev/guide/styleguide)
- [TypeScript 編碼規範](https://typescript-eslint.io/rules/)
- [組件模式](./COMPONENT_PATTERNS.md)
- [測試策略](../testing/TESTING_STRATEGY.md)
