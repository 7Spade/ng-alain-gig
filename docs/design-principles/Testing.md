# Testing.md - 測試策略與最佳實踐

> **AI Agent 友好指南**：本文件提供營建專案管理系統的完整測試策略，包含單元測試、整合測試、E2E 測試、測試工具配置和測試最佳實踐。

## 🧪 測試架構概覽

### 測試金字塔策略
```typescript
// 測試金字塔配置
export const TESTING_PYRAMID = {
  // 單元測試 (70%) - 基礎層
  unit: {
    coverage: 70,
    focus: ['組件邏輯', '服務方法', '工具函數', '管道', '指令'],
    tools: ['Jest', 'Angular Testing Utilities'],
    speed: 'fast',
    isolation: 'high'
  },
  
  // 整合測試 (20%) - 中間層
  integration: {
    coverage: 20,
    focus: ['組件交互', '服務整合', 'API 調用', '狀態管理'],
    tools: ['Angular Testing Utilities', 'Firebase Emulator'],
    speed: 'medium',
    isolation: 'medium'
  },
  
  // E2E 測試 (10%) - 頂層
  e2e: {
    coverage: 10,
    focus: ['用戶流程', '關鍵業務路徑', '跨瀏覽器兼容性'],
    tools: ['Cypress', 'Playwright'],
    speed: 'slow',
    isolation: 'low'
  }
} as const;

// 測試環境配置
export const TEST_ENVIRONMENTS = {
  // 本地開發環境
  local: {
    database: 'Firebase Emulator',
    api: 'Mock Services',
    storage: 'Local Storage',
    auth: 'Mock Auth'
  },
  
  // CI/CD 環境
  ci: {
    database: 'Firebase Test Project',
    api: 'Test API Endpoints',
    storage: 'Test Storage',
    auth: 'Test Auth Service'
  },
  
  // 預生產環境
  staging: {
    database: 'Staging Database',
    api: 'Staging API',
    storage: 'Staging Storage',
    auth: 'Staging Auth'
  }
} as const;
```

### 測試工具配置
```typescript
// Jest 配置
export const JEST_CONFIG = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/polyfills.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1'
  }
};

// Cypress 配置
export const CYPRESS_CONFIG = {
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true
  },
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack'
    },
    specPattern: 'src/**/*.cy.ts'
  }
};
```

## 🔬 單元測試策略

### 1. 組件測試
```typescript
// 專案卡片組件測試
describe('ProjectCardComponent', () => {
  let component: ProjectCardComponent;
  let fixture: ComponentFixture<ProjectCardComponent>;
  let mockProject: Project;
  
  beforeEach(async () => {
    // 創建模擬專案資料
    mockProject = {
      id: 'project-001',
      name: '測試專案',
      description: '這是一個測試專案',
      status: 'active',
      progress: 75,
      manager: '張三',
      startDate: new Date('2024-01-01'),
      budget: {
        totalBudget: 1000000,
        spent: 750000,
        remaining: 250000,
        currency: 'TWD'
      },
      team: {
        projectManager: 'user-001',
        members: ['user-001', 'user-002']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-001'
    };
    
    await TestBed.configureTestingModule({
      imports: [
        ProjectCardComponent,
        NzCardModule,
        NzTagModule,
        NzProgressModule,
        NzButtonModule,
        NzIconModule
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProjectCardComponent);
    component = fixture.componentInstance;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should display project information correctly', () => {
    component.project = mockProject;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('.project-name').textContent).toContain('測試專案');
    expect(compiled.querySelector('.project-manager').textContent).toContain('張三');
    expect(compiled.querySelector('.project-progress').textContent).toContain('75%');
  });
  
  it('should emit edit event when edit button is clicked', () => {
    component.project = mockProject;
    fixture.detectChanges();
    
    spyOn(component.edit, 'emit');
    
    const editButton = compiled.querySelector('.edit-button');
    editButton.click();
    
    expect(component.edit.emit).toHaveBeenCalledWith(mockProject);
  });
  
  it('should emit delete event when delete button is clicked', () => {
    component.project = mockProject;
    fixture.detectChanges();
    
    spyOn(component.delete, 'emit');
    
    const deleteButton = compiled.querySelector('.delete-button');
    deleteButton.click();
    
    expect(component.delete.emit).toHaveBeenCalledWith(mockProject);
  });
  
  it('should show correct status tag color', () => {
    component.project = mockProject;
    fixture.detectChanges();
    
    const statusTag = compiled.querySelector('.status-tag');
    expect(statusTag.classList).toContain('ant-tag-green');
  });
  
  it('should handle missing project data gracefully', () => {
    component.project = null;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.project-name')).toBeNull();
  });
  
  it('should be accessible', () => {
    component.project = mockProject;
    fixture.detectChanges();
    
    const card = compiled.querySelector('.project-card');
    expect(card.getAttribute('role')).toBe('article');
    expect(card.getAttribute('aria-label')).toContain('測試專案');
  });
});
```

### 2. 服務測試
```typescript
// 專案服務測試
describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  let mockProjects: Project[];
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
    });
    
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
    
    mockProjects = [
      {
        id: 'project-001',
        name: '專案 A',
        status: 'active',
        progress: 50,
        manager: '張三',
        startDate: new Date('2024-01-01'),
        budget: { totalBudget: 1000000, spent: 500000, remaining: 500000, currency: 'TWD' },
        team: { projectManager: 'user-001', members: ['user-001'] },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-001'
      },
      {
        id: 'project-002',
        name: '專案 B',
        status: 'completed',
        progress: 100,
        manager: '李四',
        startDate: new Date('2024-02-01'),
        budget: { totalBudget: 2000000, spent: 2000000, remaining: 0, currency: 'TWD' },
        team: { projectManager: 'user-002', members: ['user-002'] },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-002'
      }
    ];
  });
  
  afterEach(() => {
    httpMock.verify();
  });
  
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  it('should get projects successfully', () => {
    service.getProjects().subscribe(projects => {
      expect(projects).toEqual(mockProjects);
      expect(projects.length).toBe(2);
    });
    
    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('GET');
    req.flush(mockProjects);
  });
  
  it('should get project by id successfully', () => {
    const projectId = 'project-001';
    const expectedProject = mockProjects[0];
    
    service.getProject(projectId).subscribe(project => {
      expect(project).toEqual(expectedProject);
    });
    
    const req = httpMock.expectOne(`/api/projects/${projectId}`);
    expect(req.request.method).toBe('GET');
    req.flush(expectedProject);
  });
  
  it('should create project successfully', () => {
    const newProject: CreateProjectRequest = {
      name: '新專案',
      description: '新專案描述',
      basicInfo: {
        type: 'residential',
        category: 'new_construction',
        location: { address: '台北市', city: '台北', state: '台北', zipCode: '100', country: '台灣' },
        size: { area: 1000 }
      },
      timeline: {
        startDate: new Date('2024-03-01'),
        plannedEndDate: new Date('2024-12-31'),
        phases: []
      },
      budget: {
        totalBudget: 5000000,
        currency: 'TWD',
        breakdown: {
          materials: 2000000,
          labor: 2000000,
          equipment: 500000,
          permits: 200000,
          contingency: 300000
        }
      },
      team: {
        projectManager: 'user-001',
        stakeholders: []
      },
      createdBy: 'user-001'
    };
    
    service.createProject(newProject).subscribe(project => {
      expect(project.name).toBe('新專案');
      expect(project.id).toBeDefined();
    });
    
    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProject);
    req.flush({ ...newProject, id: 'project-003' });
  });
  
  it('should handle API errors gracefully', () => {
    service.getProjects().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.message).toContain('伺服器錯誤');
      }
    });
    
    const req = httpMock.expectOne('/api/projects');
    req.flush('伺服器錯誤', { status: 500, statusText: 'Internal Server Error' });
  });
  
  it('should update project successfully', () => {
    const projectId = 'project-001';
    const updates = { progress: 75 };
    
    service.updateProject(projectId, updates).subscribe(project => {
      expect(project.progress).toBe(75);
    });
    
    const req = httpMock.expectOne(`/api/projects/${projectId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updates);
    req.flush({ ...mockProjects[0], ...updates });
  });
  
  it('should delete project successfully', () => {
    const projectId = 'project-001';
    
    service.deleteProject(projectId).subscribe(response => {
      expect(response).toBeTruthy();
    });
    
    const req = httpMock.expectOne(`/api/projects/${projectId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });
});
```

### 3. 管道測試
```typescript
// 日期管道測試
describe('DatePipe', () => {
  let pipe: DatePipe;
  
  beforeEach(() => {
    pipe = new DatePipe();
  });
  
  it('should create', () => {
    expect(pipe).toBeTruthy();
  });
  
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = pipe.transform(date, 'yyyy-MM-dd');
    expect(result).toBe('2024-01-15');
  });
  
  it('should handle null input', () => {
    const result = pipe.transform(null, 'yyyy-MM-dd');
    expect(result).toBe('');
  });
  
  it('should handle undefined input', () => {
    const result = pipe.transform(undefined, 'yyyy-MM-dd');
    expect(result).toBe('');
  });
  
  it('should format relative time', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const result = pipe.transform(oneHourAgo, 'relative');
    expect(result).toContain('小時前');
  });
  
  it('should format different date formats', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    
    expect(pipe.transform(date, 'short')).toContain('2024/1/15');
    expect(pipe.transform(date, 'medium')).toContain('2024年1月15日');
    expect(pipe.transform(date, 'long')).toContain('2024年1月15日');
  });
});
```

## 🔗 整合測試策略

### 1. 組件整合測試
```typescript
// 專案列表組件整合測試
describe('ProjectListComponent Integration', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let userService: jasmine.SpyObj<UserService>;
  
  beforeEach(async () => {
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', [
      'getProjects', 'getProject', 'createProject', 'updateProject', 'deleteProject'
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers']);
    
    await TestBed.configureTestingModule({
      imports: [
        ProjectListComponent,
        STModule,
        NzTableModule,
        NzTagModule,
        NzProgressModule,
        NzButtonModule,
        NzModalModule,
        FormsModule
      ],
      providers: [
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });
  
  it('should load and display project list', fakeAsync(() => {
    const mockProjects = [
      {
        id: 'project-001',
        name: '專案 A',
        status: 'active',
        progress: 50,
        manager: '張三',
        startDate: new Date('2024-01-01'),
        budget: { totalBudget: 1000000, spent: 500000, remaining: 500000, currency: 'TWD' },
        team: { projectManager: 'user-001', members: ['user-001'] },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-001'
      }
    ];
    
    projectService.getProjects.and.returnValue(of(mockProjects));
    
    fixture.detectChanges();
    tick();
    
    const tableRows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(1);
    expect(tableRows[0].textContent).toContain('專案 A');
    expect(tableRows[0].textContent).toContain('張三');
  }));
  
  it('should handle project creation', fakeAsync(() => {
    const newProject = {
      name: '新專案',
      description: '新專案描述',
      basicInfo: {
        type: 'residential',
        category: 'new_construction',
        location: { address: '台北市', city: '台北', state: '台北', zipCode: '100', country: '台灣' },
        size: { area: 1000 }
      },
      timeline: {
        startDate: new Date('2024-03-01'),
        plannedEndDate: new Date('2024-12-31'),
        phases: []
      },
      budget: {
        totalBudget: 5000000,
        currency: 'TWD',
        breakdown: {
          materials: 2000000,
          labor: 2000000,
          equipment: 500000,
          permits: 200000,
          contingency: 300000
        }
      },
      team: {
        projectManager: 'user-001',
        stakeholders: []
      },
      createdBy: 'user-001'
    };
    
    projectService.createProject.and.returnValue(of({ ...newProject, id: 'project-002' }));
    
    component.createProject(newProject);
    tick();
    
    expect(projectService.createProject).toHaveBeenCalledWith(newProject);
  }));
  
  it('should handle project deletion with confirmation', fakeAsync(() => {
    const projectId = 'project-001';
    const mockProject = {
      id: projectId,
      name: '專案 A',
      status: 'active',
      progress: 50,
      manager: '張三',
      startDate: new Date('2024-01-01'),
      budget: { totalBudget: 1000000, spent: 500000, remaining: 500000, currency: 'TWD' },
      team: { projectManager: 'user-001', members: ['user-001'] },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-001'
    };
    
    projectService.deleteProject.and.returnValue(of({ success: true }));
    
    // 模擬確認對話框
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.deleteProject(mockProject);
    tick();
    
    expect(projectService.deleteProject).toHaveBeenCalledWith(projectId);
  }));
  
  it('should handle table sorting', fakeAsync(() => {
    const mockProjects = [
      { id: '1', name: '專案 B', status: 'active', progress: 30 },
      { id: '2', name: '專案 A', status: 'completed', progress: 100 }
    ];
    
    projectService.getProjects.and.returnValue(of(mockProjects));
    
    fixture.detectChanges();
    tick();
    
    // 模擬點擊排序
    const sortButton = fixture.nativeElement.querySelector('th[data-sort="name"]');
    sortButton.click();
    tick();
    
    expect(component.st.req.sort).toBeDefined();
  }));
  
  it('should handle table filtering', fakeAsync(() => {
    const mockProjects = [
      { id: '1', name: '專案 A', status: 'active', progress: 50 },
      { id: '2', name: '專案 B', status: 'completed', progress: 100 }
    ];
    
    projectService.getProjects.and.returnValue(of(mockProjects));
    
    fixture.detectChanges();
    tick();
    
    // 模擬篩選
    component.filterProjects({ status: 'active' });
    tick();
    
    expect(component.st.req.where).toBeDefined();
  }));
});
```

### 2. 服務整合測試
```typescript
// 認證服務整合測試
describe('AuthService Integration', () => {
  let service: AuthService;
  let firebaseAuth: jasmine.SpyObj<Auth>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;
  
  beforeEach(() => {
    const firebaseAuthSpy = jasmine.createSpyObj('Auth', [
      'signInWithEmailAndPassword',
      'signOut',
      'onAuthStateChanged'
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: firebaseAuthSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    service = TestBed.inject(AuthService);
    firebaseAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });
  
  it('should login successfully', async () => {
    const mockUser = {
      uid: 'user-001',
      email: 'test@example.com',
      displayName: '測試用戶'
    };
    
    const mockUserCredential = {
      user: mockUser
    };
    
    firebaseAuth.signInWithEmailAndPassword.and.returnValue(Promise.resolve(mockUserCredential));
    userService.getUser.and.returnValue(of({
      id: 'user-001',
      email: 'test@example.com',
      displayName: '測試用戶',
      role: 'engineer',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await service.login('test@example.com', 'password123');
    
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
  });
  
  it('should handle login failure', async () => {
    firebaseAuth.signInWithEmailAndPassword.and.returnValue(Promise.reject({
      code: 'auth/user-not-found',
      message: '用戶不存在'
    }));
    
    const result = await service.login('test@example.com', 'wrongpassword');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('用戶不存在');
  });
  
  it('should logout successfully', async () => {
    firebaseAuth.signOut.and.returnValue(Promise.resolve());
    
    await service.logout();
    
    expect(firebaseAuth.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
  
  it('should check authentication state', (done) => {
    const mockUser = {
      uid: 'user-001',
      email: 'test@example.com',
      displayName: '測試用戶'
    };
    
    firebaseAuth.onAuthStateChanged.and.callFake((callback) => {
      callback(mockUser);
      return () => {}; // unsubscribe function
    });
    
    service.getCurrentUser().subscribe(user => {
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      done();
    });
  });
});
```

## 🌐 E2E 測試策略

### 1. Cypress E2E 測試
```typescript
// 專案管理 E2E 測試
describe('Project Management E2E', () => {
  beforeEach(() => {
    // 登入系統
    cy.login('test@example.com', 'password123');
    cy.visit('/projects');
  });
  
  it('should display project list', () => {
    cy.get('[data-cy=project-list]').should('be.visible');
    cy.get('[data-cy=project-card]').should('have.length.at.least', 1);
  });
  
  it('should create new project', () => {
    cy.get('[data-cy=create-project-btn]').click();
    
    // 填寫專案表單
    cy.get('[data-cy=project-name]').type('E2E 測試專案');
    cy.get('[data-cy=project-description]').type('這是一個 E2E 測試專案');
    cy.get('[data-cy=project-type]').select('residential');
    cy.get('[data-cy=project-budget]').type('1000000');
    
    // 提交表單
    cy.get('[data-cy=submit-btn]').click();
    
    // 驗證專案創建成功
    cy.get('[data-cy=success-message]').should('contain', '專案創建成功');
    cy.get('[data-cy=project-list]').should('contain', 'E2E 測試專案');
  });
  
  it('should edit project', () => {
    cy.get('[data-cy=project-card]').first().click();
    cy.get('[data-cy=edit-project-btn]').click();
    
    // 修改專案名稱
    cy.get('[data-cy=project-name]').clear().type('修改後的專案名稱');
    cy.get('[data-cy=save-btn]').click();
    
    // 驗證修改成功
    cy.get('[data-cy=success-message]').should('contain', '專案更新成功');
    cy.get('[data-cy=project-name]').should('contain', '修改後的專案名稱');
  });
  
  it('should delete project with confirmation', () => {
    cy.get('[data-cy=project-card]').first().click();
    cy.get('[data-cy=delete-project-btn]').click();
    
    // 確認刪除
    cy.get('[data-cy=confirm-delete-btn]').click();
    
    // 驗證刪除成功
    cy.get('[data-cy=success-message]').should('contain', '專案刪除成功');
  });
  
  it('should filter projects by status', () => {
    cy.get('[data-cy=status-filter]').select('active');
    cy.get('[data-cy=apply-filter-btn]').click();
    
    // 驗證篩選結果
    cy.get('[data-cy=project-card]').each(($card) => {
      cy.wrap($card).should('contain', '進行中');
    });
  });
  
  it('should search projects', () => {
    cy.get('[data-cy=search-input]').type('測試');
    cy.get('[data-cy=search-btn]').click();
    
    // 驗證搜尋結果
    cy.get('[data-cy=project-card]').should('contain', '測試');
  });
  
  it('should handle project permissions', () => {
    // 以不同權限用戶登入
    cy.login('viewer@example.com', 'password123');
    cy.visit('/projects');
    
    // 驗證權限限制
    cy.get('[data-cy=create-project-btn]').should('not.exist');
    cy.get('[data-cy=edit-project-btn]').should('not.exist');
    cy.get('[data-cy=delete-project-btn]').should('not.exist');
  });
});

// 任務管理 E2E 測試
describe('Task Management E2E', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/projects/project-001/tasks');
  });
  
  it('should create new task', () => {
    cy.get('[data-cy=create-task-btn]').click();
    
    // 填寫任務表單
    cy.get('[data-cy=task-name]').type('E2E 測試任務');
    cy.get('[data-cy=task-description]').type('這是一個 E2E 測試任務');
    cy.get('[data-cy=task-priority]').select('high');
    cy.get('[data-cy=task-assignee]').select('user-001');
    cy.get('[data-cy=task-due-date]').type('2024-12-31');
    
    // 提交表單
    cy.get('[data-cy=submit-btn]').click();
    
    // 驗證任務創建成功
    cy.get('[data-cy=success-message]').should('contain', '任務創建成功');
    cy.get('[data-cy=task-list]').should('contain', 'E2E 測試任務');
  });
  
  it('should update task status', () => {
    cy.get('[data-cy=task-item]').first().click();
    cy.get('[data-cy=task-status]').select('in_progress');
    cy.get('[data-cy=update-status-btn]').click();
    
    // 驗證狀態更新
    cy.get('[data-cy=task-status]').should('contain', '進行中');
  });
  
  it('should add task comment', () => {
    cy.get('[data-cy=task-item]').first().click();
    cy.get('[data-cy=comment-input]').type('這是一個測試評論');
    cy.get('[data-cy=add-comment-btn]').click();
    
    // 驗證評論添加成功
    cy.get('[data-cy=comment-list]').should('contain', '這是一個測試評論');
  });
});
```

### 2. 跨瀏覽器測試
```typescript
// 跨瀏覽器兼容性測試
describe('Cross Browser Compatibility', () => {
  const browsers = ['chrome', 'firefox', 'edge', 'safari'];
  
  browsers.forEach(browser => {
    describe(`${browser} browser`, () => {
      beforeEach(() => {
        cy.visit('/', {
          onBeforeLoad: (win) => {
            // 模擬不同瀏覽器環境
            Object.defineProperty(win.navigator, 'userAgent', {
              value: getBrowserUserAgent(browser)
            });
          }
        });
      });
      
      it('should load application correctly', () => {
        cy.get('[data-cy=app-container]').should('be.visible');
        cy.get('[data-cy=main-navigation]').should('be.visible');
      });
      
      it('should handle responsive design', () => {
        // 測試不同螢幕尺寸
        cy.viewport(1920, 1080); // 桌面
        cy.get('[data-cy=desktop-layout]').should('be.visible');
        
        cy.viewport(768, 1024); // 平板
        cy.get('[data-cy=tablet-layout]').should('be.visible');
        
        cy.viewport(375, 667); // 手機
        cy.get('[data-cy=mobile-layout]').should('be.visible');
      });
      
      it('should handle form interactions', () => {
        cy.get('[data-cy=login-form]').should('be.visible');
        cy.get('[data-cy=email-input]').type('test@example.com');
        cy.get('[data-cy=password-input]').type('password123');
        cy.get('[data-cy=login-btn]').click();
        
        cy.url().should('include', '/dashboard');
      });
    });
  });
  
  function getBrowserUserAgent(browser: string): string {
    const userAgents = {
      chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
      safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    };
    
    return userAgents[browser];
  }
});
```

## 🔧 測試工具配置

### 1. 測試環境設置
```typescript
// 測試環境設置
export const TEST_SETUP = {
  // Jest 設置
  jest: {
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'html', 'js', 'json'],
    transform: {
      '^.+\\.(ts|js|html)$': 'ts-jest'
    },
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.spec.json'
      }
    }
  },
  
  // Angular 測試設置
  angular: {
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
    testEnvironment: 'jsdom',
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1'
    }
  },
  
  // Firebase 模擬器設置
  firebase: {
    projectId: 'test-project',
    auth: {
      host: 'localhost',
      port: 9099
    },
    firestore: {
      host: 'localhost',
      port: 8080
    },
    storage: {
      host: 'localhost',
      port: 9199
    }
  }
};

// 測試設置文件
// src/test-setup.ts
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// 初始化 Angular 測試環境
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// 載入所有測試文件
const context = require.context('./', true, /\.spec\.ts$/);
context.keys().forEach(context);
```

### 2. 模擬服務設置
```typescript
// 模擬服務設置
export class MockServices {
  // 模擬 Firebase Auth
  static createMockAuth(): jasmine.SpyObj<Auth> {
    return jasmine.createSpyObj('Auth', [
      'signInWithEmailAndPassword',
      'signOut',
      'onAuthStateChanged',
      'currentUser'
    ]);
  }
  
  // 模擬 Firestore
  static createMockFirestore(): jasmine.SpyObj<Firestore> {
    return jasmine.createSpyObj('Firestore', [
      'collection',
      'doc',
      'getDoc',
      'setDoc',
      'updateDoc',
      'deleteDoc'
    ]);
  }
  
  // 模擬 Storage
  static createMockStorage(): jasmine.SpyObj<Storage> {
    return jasmine.createSpyObj('Storage', [
      'ref',
      'uploadBytes',
      'getDownloadURL',
      'deleteObject'
    ]);
  }
  
  // 模擬 Router
  static createMockRouter(): jasmine.SpyObj<Router> {
    return jasmine.createSpyObj('Router', [
      'navigate',
      'navigateByUrl',
      'parseUrl'
    ]);
  }
  
  // 模擬 ActivatedRoute
  static createMockActivatedRoute(): jasmine.SpyObj<ActivatedRoute> {
    return jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({}),
      queryParams: of({}),
      data: of({}),
      snapshot: {
        params: {},
        queryParams: {},
        data: {}
      }
    });
  }
}

// 測試工具函數
export class TestUtils {
  // 創建測試組件
  static createTestComponent<T>(component: Type<T>, providers: any[] = []): ComponentFixture<T> {
    TestBed.configureTestingModule({
      declarations: [component],
      providers: providers
    });
    
    return TestBed.createComponent(component);
  }
  
  // 模擬異步操作
  static async waitForAsync(fn: () => void): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
    fn();
  }
  
  // 模擬用戶輸入
  static simulateUserInput(element: HTMLInputElement, value: string): void {
    element.value = value;
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('blur'));
  }
  
  // 模擬文件上傳
  static createMockFile(name: string, type: string, size: number): File {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  }
}
```

## 📊 測試覆蓋率與報告

### 1. 覆蓋率配置
```typescript
// 覆蓋率配置
export const COVERAGE_CONFIG = {
  // 覆蓋率閾值
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // 特定文件覆蓋率
    specific: {
      'src/app/core/**/*.ts': {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90
      },
      'src/app/shared/**/*.ts': {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85
      }
    }
  },
  
  // 排除文件
  exclude: [
    'src/**/*.spec.ts',
    'src/**/*.test.ts',
    'src/**/*.module.ts',
    'src/main.ts',
    'src/polyfills.ts',
    'src/environments/**/*.ts'
  ],
  
  // 報告格式
  reporters: ['text', 'html', 'lcov', 'json'],
  
  // 報告目錄
  outputDirectory: 'coverage'
};
```

### 2. 測試報告生成
```typescript
// 測試報告服務
@Injectable({ providedIn: 'root' })
export class TestReportService {
  // 生成測試報告
  generateTestReport(): TestReport {
    return {
      summary: this.getTestSummary(),
      coverage: this.getCoverageReport(),
      performance: this.getPerformanceMetrics(),
      quality: this.getQualityMetrics(),
      recommendations: this.getRecommendations()
    };
  }
  
  private getTestSummary(): TestSummary {
    return {
      totalTests: 150,
      passedTests: 145,
      failedTests: 5,
      skippedTests: 0,
      successRate: 96.7,
      executionTime: '2m 30s'
    };
  }
  
  private getCoverageReport(): CoverageReport {
    return {
      global: {
        branches: 85.2,
        functions: 88.7,
        lines: 87.3,
        statements: 86.9
      },
      byFile: [
        {
          file: 'src/app/core/auth.service.ts',
          branches: 92.1,
          functions: 95.3,
          lines: 94.7,
          statements: 94.2
        },
        {
          file: 'src/app/shared/project-card.component.ts',
          branches: 78.9,
          functions: 82.1,
          lines: 81.5,
          statements: 80.8
        }
      ]
    };
  }
  
  private getPerformanceMetrics(): PerformanceMetrics {
    return {
      averageTestTime: '1.2s',
      slowestTests: [
        { name: 'ProjectService Integration Test', time: '5.3s' },
        { name: 'AuthService E2E Test', time: '4.8s' }
      ],
      memoryUsage: '45MB',
      cpuUsage: '23%'
    };
  }
  
  private getQualityMetrics(): QualityMetrics {
    return {
      codeQuality: 'A',
      maintainability: 'B+',
      reliability: 'A-',
      security: 'A',
      performance: 'B+'
    };
  }
  
  private getRecommendations(): string[] {
    return [
      '增加專案卡片組件的測試覆蓋率',
      '優化慢速測試的執行時間',
      '添加更多邊界條件測試',
      '實施視覺回歸測試',
      '增加無障礙測試覆蓋'
    ];
  }
}

// 測試報告介面
export interface TestReport {
  summary: TestSummary;
  coverage: CoverageReport;
  performance: PerformanceMetrics;
  quality: QualityMetrics;
  recommendations: string[];
}

export interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  successRate: number;
  executionTime: string;
}

export interface CoverageReport {
  global: {
    branches: number;
    functions: number;
    lines: number;
    statements: number;
  };
  byFile: Array<{
    file: string;
    branches: number;
    functions: number;
    lines: number;
    statements: number;
  }>;
}

export interface PerformanceMetrics {
  averageTestTime: string;
  slowestTests: Array<{
    name: string;
    time: string;
  }>;
  memoryUsage: string;
  cpuUsage: string;
}

export interface QualityMetrics {
  codeQuality: string;
  maintainability: string;
  reliability: string;
  security: string;
  performance: string;
}
```

## ✅ AI Agent 實作檢查清單

### 測試策略檢查清單
- [ ] **測試金字塔**：70% 單元測試、20% 整合測試、10% E2E 測試
- [ ] **測試覆蓋率**：代碼覆蓋率達到 80% 以上
- [ ] **測試環境**：完整的測試環境配置
- [ ] **模擬服務**：適當的模擬和存根
- [ ] **測試資料**：一致的測試資料管理

### 單元測試檢查清單
- [ ] **組件測試**：所有組件都有完整的測試
- [ ] **服務測試**：所有服務都有完整的測試
- [ ] **管道測試**：所有管道都有完整的測試
- [ ] **指令測試**：所有指令都有完整的測試
- [ ] **工具函數測試**：所有工具函數都有完整的測試

### 整合測試檢查清單
- [ ] **組件交互**：組件間的交互測試
- [ ] **服務整合**：服務間的整合測試
- [ ] **API 調用**：API 調用的整合測試
- [ ] **狀態管理**：狀態管理的整合測試
- [ ] **路由測試**：路由的整合測試

### E2E 測試檢查清單
- [ ] **關鍵流程**：主要業務流程的 E2E 測試
- [ ] **跨瀏覽器**：跨瀏覽器兼容性測試
- [ ] **響應式設計**：不同設備的響應式測試
- [ ] **無障礙測試**：無障礙功能的 E2E 測試
- [ ] **性能測試**：關鍵頁面的性能測試

### 測試工具檢查清單
- [ ] **Jest 配置**：Jest 測試框架配置
- [ ] **Cypress 配置**：E2E 測試工具配置
- [ ] **Firebase 模擬器**：Firebase 服務模擬
- [ ] **測試報告**：測試覆蓋率報告
- [ ] **CI/CD 整合**：持續整合測試

## 📚 參考資源

### 官方文件
- [Angular 測試指南](https://angular.dev/guide/testing)
- [Jest 測試框架](https://jestjs.io/docs/getting-started)
- [Cypress E2E 測試](https://docs.cypress.io/)

### 最佳實踐
- [Angular 測試最佳實踐](https://angular.io/guide/testing)
- [Firebase 測試指南](https://firebase.google.com/docs/emulator-suite)
- [測試驅動開發](https://en.wikipedia.org/wiki/Test-driven_development)

### 工具與資源
- [Angular Testing Utilities](https://angular.dev/guide/testing)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Cypress Dashboard](https://www.cypress.io/dashboard)

---

> **AI Agent 提示**：實作測試時，請遵循本指南的測試策略和檢查清單，確保代碼品質和系統穩定性。優先編寫單元測試，然後是整合測試，最後是 E2E 測試。
