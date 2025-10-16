# 實作指南 (Implementation Guide)

## 🎯 實作總覽

本指南提供 ng-alain-gig 專案的完整實作路線圖，基於 DDD 四層架構和 Angular 20 現代化最佳實踐。

## 🏗️ 架構實作策略

### Phase 1: 基礎設施層 (Infrastructure Layer)
**目標**: 建立穩固的技術基礎

#### 1.1 Firebase 整合
```typescript
// src/app/core/services/firebase.service.ts
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private storage = inject(Storage);
}
```

#### 1.2 認證系統
```typescript
// src/app/core/auth/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
}
```

#### 1.3 HTTP 攔截器
```typescript
// src/app/core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  
  return next(req);
};
```

### Phase 2: 領域層 (Domain Layer)
**目標**: 實作核心業務邏輯

#### 2.1 實體設計
```typescript
// src/app/domain/entities/user.entity.ts
export class UserEntity {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    public readonly profile: UserProfile,
    private permissions: Permission[]
  ) {}
  
  hasPermission(permission: string): boolean {
    return this.permissions.some(p => p.matches(permission));
  }
}
```

#### 2.2 值物件
```typescript
// src/app/domain/value-objects/email.vo.ts
export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email format');
    }
  }
  
  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

#### 2.3 聚合根
```typescript
// src/app/domain/aggregates/project.aggregate.ts
export class ProjectAggregate {
  private constructor(
    public readonly id: ProjectId,
    private name: ProjectName,
    private status: ProjectStatus,
    private team: TeamMembers
  ) {}
  
  static create(data: CreateProjectData): ProjectAggregate {
    // 業務規則驗證
    return new ProjectAggregate(/* ... */);
  }
  
  addTeamMember(member: TeamMember): void {
    // 業務邏輯
    this.team.add(member);
    this.publishEvent(new TeamMemberAddedEvent(/* ... */));
  }
}
```

### Phase 3: 應用層 (Application Layer)
**目標**: 協調業務流程

#### 3.1 應用服務
```typescript
// src/app/application/services/user.service.ts
@Injectable({ providedIn: 'root' })
export class UserService {
  private userRepository = inject(UserRepository);
  private eventBus = inject(EventBus);
  
  async createUser(command: CreateUserCommand): Promise<UserDto> {
    // 1. 驗證指令
    this.validateCommand(command);
    
    // 2. 建立領域物件
    const user = UserAggregate.create(command);
    
    // 3. 儲存
    await this.userRepository.save(user);
    
    // 4. 發布事件
    this.eventBus.publish(new UserCreatedEvent(user));
    
    return this.mapToDto(user);
  }
}
```

#### 3.2 指令處理器
```typescript
// src/app/application/handlers/create-project.handler.ts
@Injectable()
export class CreateProjectHandler {
  constructor(
    private projectService: ProjectService,
    private notificationService: NotificationService
  ) {}
  
  async handle(command: CreateProjectCommand): Promise<ProjectDto> {
    const project = await this.projectService.create(command);
    await this.notificationService.notifyProjectCreated(project);
    return project;
  }
}
```

### Phase 4: 展示層 (Presentation Layer)
**目標**: 實作用戶介面

#### 4.1 Standalone 組件
```typescript
// src/app/features/projects/project-list.component.ts
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzButtonModule],
  template: `
    <nz-table [nzData]="projects()" [nzLoading]="loading()">
      @for (project of projects(); track project.id) {
        <tr>
          <td>{{ project.name }}</td>
          <td>{{ project.status }}</td>
          <td>
            <button nz-button (click)="selectProject(project.id)">
              查看詳情
            </button>
          </td>
        </tr>
      }
    </nz-table>
  `
})
export class ProjectListComponent {
  private projectService = inject(ProjectService);
  
  projects = signal<Project[]>([]);
  loading = signal(false);
  
  ngOnInit() {
    this.loadProjects();
  }
  
  private async loadProjects() {
    this.loading.set(true);
    try {
      const projects = await this.projectService.getAll();
      this.projects.set(projects);
    } finally {
      this.loading.set(false);
    }
  }
}
```

#### 4.2 響應式表單
```typescript
// src/app/features/users/user-form.component.ts
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="onSubmit()">
      <nz-form-item>
        <nz-form-control nzErrorTip="請輸入姓名">
          <input nz-input formControlName="name" placeholder="姓名" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-control nzErrorTip="請輸入有效的電子郵件">
          <input nz-input formControlName="email" placeholder="電子郵件" />
        </nz-form-control>
      </nz-form-item>
      
      <button nz-button nzType="primary" [disabled]="form.invalid">
        提交
      </button>
    </form>
  `
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });
  
  async onSubmit() {
    if (this.form.valid) {
      const userData = this.form.getRawValue();
      await this.userService.create(userData);
    }
  }
}
```

## 🔄 狀態管理實作

### Signal-based 狀態
```typescript
// src/app/shared/state/app.state.ts
@Injectable({ providedIn: 'root' })
export class AppState {
  // 用戶狀態
  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  
  // 專案狀態
  private _projects = signal<Project[]>([]);
  readonly projects = this._projects.asReadonly();
  
  // 計算屬性
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly projectCount = computed(() => this._projects().length);
  
  // 狀態更新方法
  setCurrentUser(user: User | null) {
    this._currentUser.set(user);
  }
  
  addProject(project: Project) {
    this._projects.update(projects => [...projects, project]);
  }
}
```

### NgRx Store (全域狀態)
```typescript
// src/app/store/auth/auth.state.ts
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// src/app/store/auth/auth.actions.ts
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login': props<{ credentials: LoginCredentials }>(),
    'Login Success': props<{ user: User }>(),
    'Login Failure': props<{ error: string }>(),
    'Logout': emptyProps()
  }
});
```

## 🛡️ 安全實作

### 路由守衛
```typescript
// src/app/core/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};
```

### 權限控制
```typescript
// src/app/core/guards/permission.guard.ts
export const permissionGuard = (permission: string): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const user = authService.getCurrentUser();
    
    return user?.hasPermission(permission) ?? false;
  };
};
```

## 🧪 測試實作

### 單元測試
```typescript
// src/app/features/users/user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jasmine.SpyObj<UserRepository>;
  
  beforeEach(() => {
    const spy = jasmine.createSpyObj('UserRepository', ['save', 'findById']);
    
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: spy }
      ]
    });
    
    service = TestBed.inject(UserService);
    mockRepository = TestBed.inject(UserRepository) as jasmine.SpyObj<UserRepository>;
  });
  
  it('should create user successfully', async () => {
    const userData = { name: 'Test User', email: 'test@example.com' };
    const expectedUser = new UserEntity(/* ... */);
    
    mockRepository.save.and.returnValue(Promise.resolve(expectedUser));
    
    const result = await service.create(userData);
    
    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### 整合測試
```typescript
// src/app/features/projects/project-list.component.spec.ts
describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let mockProjectService: jasmine.SpyObj<ProjectService>;
  
  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ProjectService', ['getAll']);
    
    await TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [
        { provide: ProjectService, useValue: spy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    mockProjectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
  });
  
  it('should load projects on init', async () => {
    const mockProjects = [{ id: '1', name: 'Test Project' }];
    mockProjectService.getAll.and.returnValue(Promise.resolve(mockProjects));
    
    component.ngOnInit();
    await fixture.whenStable();
    
    expect(component.projects()).toEqual(mockProjects);
  });
});
```

## 📊 效能優化實作

### 懶載入路由
```typescript
// src/app/routes/routes.ts
export const routes: Routes = [
  {
    path: 'projects',
    loadChildren: () => import('./features/projects/projects.routes')
      .then(m => m.projectRoutes)
  },
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes')
      .then(m => m.userRoutes)
  }
];
```

### OnPush 變更檢測
```typescript
@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="project-card">
      <h3>{{ project().name }}</h3>
      <p>{{ project().description }}</p>
    </div>
  `
})
export class ProjectCardComponent {
  project = input.required<Project>();
}
```

## 🚀 部署實作

### 建置配置
```typescript
// angular.json
{
  "projects": {
    "ng-alain": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                }
              ],
              "outputHashing": "all"
            }
          }
        }
      }
    }
  }
}
```

### Firebase 部署
```bash
# 建置專案
ng build --configuration production

# 部署到 Firebase
firebase deploy
```

## 📚 實作檢查清單

### ✅ 基礎設施層
- [ ] Firebase 服務整合
- [ ] 認證系統實作
- [ ] HTTP 攔截器設置
- [ ] 錯誤處理機制

### ✅ 領域層
- [ ] 實體類別定義
- [ ] 值物件實作
- [ ] 聚合根設計
- [ ] 領域事件系統

### ✅ 應用層
- [ ] 應用服務實作
- [ ] 指令處理器
- [ ] 查詢處理器
- [ ] DTO 轉換器

### ✅ 展示層
- [ ] Standalone 組件
- [ ] 響應式表單
- [ ] 路由配置
- [ ] 狀態管理

### ✅ 測試
- [ ] 單元測試覆蓋率 > 80%
- [ ] 整合測試
- [ ] E2E 測試關鍵流程

### ✅ 效能
- [ ] 懶載入實作
- [ ] OnPush 變更檢測
- [ ] Bundle 大小優化
- [ ] 快取策略

## 🔗 相關資源

- [程式碼標準](./CODE_STANDARDS.md)
- [組件模式](./COMPONENT_PATTERNS.md)
- [測試策略](../testing/TESTING_STRATEGY.md)
- [API 文件](../api/API_OVERVIEW.md)
