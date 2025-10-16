# Projects Module - Testing Strategy

## 概述

Projects Module 的測試策略採用多層次測試方法，包括單元測試、整合測試、E2E 測試和效能測試。本策略整合 Angular Testing Utilities、Jest、Cypress 等現代測試工具，確保專案管理系統的品質和穩定性。

## 測試架構

### 1. 測試層級結構

```typescript
// 測試層級架構
export interface TestingArchitecture {
  // 單元測試 (Unit Tests)
  unit: {
    components: ComponentTest[];
    services: ServiceTest[];
    pipes: PipeTest[];
    directives: DirectiveTest[];
    guards: GuardTest[];
    resolvers: ResolverTest[];
  };
  
  // 整合測試 (Integration Tests)
  integration: {
    modules: ModuleTest[];
    services: ServiceIntegrationTest[];
    api: ApiIntegrationTest[];
    firebase: FirebaseIntegrationTest[];
  };
  
  // E2E 測試 (End-to-End Tests)
  e2e: {
    userFlows: UserFlowTest[];
    apiFlows: ApiFlowTest[];
    crossBrowser: CrossBrowserTest[];
    mobile: MobileTest[];
  };
  
  // 效能測試 (Performance Tests)
  performance: {
    loadTesting: LoadTest[];
    stressTesting: StressTest[];
    memoryTesting: MemoryTest[];
    bundleSize: BundleSizeTest[];
  };
  
  // 安全測試 (Security Tests)
  security: {
    authentication: AuthTest[];
    authorization: AuthorizationTest[];
    dataValidation: DataValidationTest[];
    xss: XSSTest[];
    csrf: CSRFTest[];
  };
}
```

### 2. 測試工具配置

```typescript
// 測試工具配置
export const TESTING_CONFIG = {
  // 單元測試工具
  unit: {
    framework: 'Jest',
    testEnvironment: 'jsdom',
    coverage: {
      threshold: 80,
      reporters: ['text', 'lcov', 'html']
    }
  },
  
  // E2E 測試工具
  e2e: {
    framework: 'Cypress',
    browser: ['chrome', 'firefox', 'edge'],
    viewport: {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 }
    }
  },
  
  // 效能測試工具
  performance: {
    framework: 'Lighthouse',
    metrics: ['FCP', 'LCP', 'FID', 'CLS', 'TTI'],
    thresholds: {
      performance: 90,
      accessibility: 90,
      bestPractices: 90,
      seo: 90
    }
  },
  
  // 測試資料
  testData: {
    mockData: true,
    fixtures: true,
    factories: true,
    seeders: true
  }
} as const;
```

## 單元測試

### 1. 組件測試

```typescript
// 專案列表組件測試
describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let projectStateService: jasmine.SpyObj<ProjectStateService>;
  
  beforeEach(async () => {
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', [
      'getProjects',
      'createProject',
      'updateProject',
      'deleteProject'
    ]);
    
    const projectStateServiceSpy = jasmine.createSpyObj('ProjectStateService', [
      'loadProjects',
      'updateProjectStatus',
      'setProjectListFilter'
    ]);
    
    await TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: ProjectStateService, useValue: projectStateServiceSpy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    projectStateService = TestBed.inject(ProjectStateService) as jasmine.SpyObj<ProjectStateService>;
  });
  
  it('應該建立組件', () => {
    expect(component).toBeTruthy();
  });
  
  it('應該載入專案列表', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1', status: ProjectStatus.IN_PROGRESS },
      { id: '2', name: 'Project 2', status: ProjectStatus.COMPLETED }
    ];
    
    projectStateService.projects.and.returnValue(signal(mockProjects));
    projectStateService.loading.and.returnValue(signal(false));
    
    fixture.detectChanges();
    
    expect(component.projects()).toEqual(mockProjects);
    expect(component.loading()).toBe(false);
  });
  
  it('應該顯示專案統計', () => {
    const mockStats = {
      total: 10,
      active: 5,
      completed: 3,
      onHold: 2
    };
    
    projectStateService.projectStats.and.returnValue(signal(mockStats));
    
    fixture.detectChanges();
    
    const statsElement = fixture.debugElement.query(By.css('.project-stats'));
    expect(statsElement).toBeTruthy();
    expect(statsElement.nativeElement.textContent).toContain('總計: 10');
  });
  
  it('應該處理專案篩選', () => {
    const filter = { status: ProjectStatus.IN_PROGRESS };
    
    component.onFilterChange(filter);
    
    expect(projectStateService.setProjectListFilter).toHaveBeenCalledWith(filter);
  });
  
  it('應該處理專案排序', () => {
    const sort = { field: 'name', direction: 'asc' };
    
    component.onSortChange(sort);
    
    expect(projectStateService.setProjectListSort).toHaveBeenCalledWith(sort);
  });
  
  it('應該處理專案分頁', () => {
    const pagination = { page: 2, size: 20 };
    
    component.onPageChange(pagination);
    
    expect(projectStateService.setProjectListPagination).toHaveBeenCalledWith(pagination);
  });
  
  it('應該處理專案建立', async () => {
    const projectData = {
      name: 'New Project',
      type: ProjectType.RESIDENTIAL,
      location: { address: 'Test Address' },
      schedule: { startDate: new Date(), endDate: new Date() },
      budget: { total: 1000000, currency: 'TWD' }
    };
    
    const mockProject = { id: '3', ...projectData };
    projectService.createProject.and.returnValue(Promise.resolve(mockProject));
    
    await component.onCreateProject(projectData);
    
    expect(projectService.createProject).toHaveBeenCalledWith(projectData);
    expect(projectStateService.loadProjects).toHaveBeenCalled();
  });
  
  it('應該處理錯誤情況', () => {
    const error = new Error('載入專案失敗');
    projectStateService.error.and.returnValue(signal(error.message));
    
    fixture.detectChanges();
    
    const errorElement = fixture.debugElement.query(By.css('.error-message'));
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent).toContain('載入專案失敗');
  });
});
```

### 2. 服務測試

```typescript
// 專案服務測試
describe('ProjectService', () => {
  let service: ProjectService;
  let httpClient: jasmine.SpyObj<HttpClient>;
  let projectRepository: jasmine.SpyObj<ProjectRepository>;
  let eventBus: jasmine.SpyObj<EventBus>;
  
  beforeEach(() => {
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);
    const projectRepositorySpy = jasmine.createSpyObj('ProjectRepository', [
      'findAll',
      'findById',
      'create',
      'update',
      'delete'
    ]);
    const eventBusSpy = jasmine.createSpyObj('EventBus', ['publish']);
    
    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: ProjectRepository, useValue: projectRepositorySpy },
        { provide: EventBus, useValue: eventBusSpy }
      ]
    });
    
    service = TestBed.inject(ProjectService);
    httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    projectRepository = TestBed.inject(ProjectRepository) as jasmine.SpyObj<ProjectRepository>;
    eventBus = TestBed.inject(EventBus) as jasmine.SpyObj<EventBus>;
  });
  
  it('應該建立服務', () => {
    expect(service).toBeTruthy();
  });
  
  it('應該獲取專案列表', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1', status: ProjectStatus.IN_PROGRESS },
      { id: '2', name: 'Project 2', status: ProjectStatus.COMPLETED }
    ];
    
    projectRepository.findAll.and.returnValue(Promise.resolve(mockProjects));
    
    const result = await service.getProjects();
    
    expect(result).toEqual(mockProjects);
    expect(projectRepository.findAll).toHaveBeenCalled();
  });
  
  it('應該獲取專案詳情', async () => {
    const mockProject = { id: '1', name: 'Project 1', status: ProjectStatus.IN_PROGRESS };
    
    projectRepository.findById.and.returnValue(Promise.resolve(mockProject));
    
    const result = await service.getProject('1');
    
    expect(result).toEqual(mockProject);
    expect(projectRepository.findById).toHaveBeenCalledWith('1');
  });
  
  it('應該建立專案', async () => {
    const projectData = {
      name: 'New Project',
      type: ProjectType.RESIDENTIAL,
      location: { address: 'Test Address' },
      schedule: { startDate: new Date(), endDate: new Date() },
      budget: { total: 1000000, currency: 'TWD' }
    };
    
    const mockProject = { id: '3', ...projectData };
    projectRepository.create.and.returnValue(Promise.resolve(mockProject));
    
    const result = await service.createProject(projectData);
    
    expect(result).toEqual(mockProject);
    expect(projectRepository.create).toHaveBeenCalledWith(projectData);
    expect(eventBus.publish).toHaveBeenCalledWith(jasmine.any(ProjectCreatedEvent));
  });
  
  it('應該更新專案', async () => {
    const projectId = '1';
    const updateData = { name: 'Updated Project' };
    const mockProject = { id: projectId, name: 'Updated Project' };
    
    projectRepository.update.and.returnValue(Promise.resolve(mockProject));
    
    const result = await service.updateProject(projectId, updateData);
    
    expect(result).toEqual(mockProject);
    expect(projectRepository.update).toHaveBeenCalledWith(projectId, updateData);
    expect(eventBus.publish).toHaveBeenCalledWith(jasmine.any(ProjectUpdatedEvent));
  });
  
  it('應該刪除專案', async () => {
    const projectId = '1';
    
    projectRepository.delete.and.returnValue(Promise.resolve());
    
    await service.deleteProject(projectId);
    
    expect(projectRepository.delete).toHaveBeenCalledWith(projectId);
    expect(eventBus.publish).toHaveBeenCalledWith(jasmine.any(ProjectDeletedEvent));
  });
  
  it('應該處理錯誤', async () => {
    const error = new Error('資料庫錯誤');
    projectRepository.findAll.and.returnValue(Promise.reject(error));
    
    await expectAsync(service.getProjects()).toBeRejectedWith(error);
  });
});
```

### 3. 守衛測試

```typescript
// 專案權限守衛測試
describe('ProjectPermissionGuard', () => {
  let guard: ProjectPermissionGuard;
  let aclService: jasmine.SpyObj<ACLService>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let router: jasmine.SpyObj<Router>;
  
  beforeEach(() => {
    const aclServiceSpy = jasmine.createSpyObj('ACLService', ['can']);
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['checkProjectAccess']);
    const routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);
    
    TestBed.configureTestingModule({
      providers: [
        ProjectPermissionGuard,
        { provide: ACLService, useValue: aclServiceSpy },
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    guard = TestBed.inject(ProjectPermissionGuard);
    aclService = TestBed.inject(ACLService) as jasmine.SpyObj<ACLService>;
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });
  
  it('應該允許有權限的用戶存取', () => {
    aclService.can.and.returnValue(true);
    
    const result = guard.canActivate({
      paramMap: new Map([['id', '1']]),
      data: { permissions: ['project:read'] }
    } as any);
    
    expect(result).toBe(true);
  });
  
  it('應該拒絕沒有權限的用戶存取', () => {
    aclService.can.and.returnValue(false);
    router.parseUrl.and.returnValue('/403' as any);
    
    const result = guard.canActivate({
      paramMap: new Map([['id', '1']]),
      data: { permissions: ['project:read'] }
    } as any);
    
    expect(result).toBe('/403');
    expect(router.parseUrl).toHaveBeenCalledWith('/403');
  });
  
  it('應該檢查專案存取權限', async () => {
    aclService.can.and.returnValue(true);
    projectService.checkProjectAccess.and.returnValue(Promise.resolve(true));
    
    const result = await guard.canActivate({
      paramMap: new Map([['id', '1']]),
      data: { permissions: ['project:read'] }
    } as any);
    
    expect(result).toBe(true);
    expect(projectService.checkProjectAccess).toHaveBeenCalledWith('1', jasmine.any(String));
  });
});
```

### 4. 管道測試

```typescript
// 專案狀態管道測試
describe('ProjectStatusPipe', () => {
  let pipe: ProjectStatusPipe;
  
  beforeEach(() => {
    pipe = new ProjectStatusPipe();
  });
  
  it('應該建立管道', () => {
    expect(pipe).toBeTruthy();
  });
  
  it('應該轉換專案狀態', () => {
    expect(pipe.transform(ProjectStatus.IN_PROGRESS)).toBe('進行中');
    expect(pipe.transform(ProjectStatus.COMPLETED)).toBe('已完成');
    expect(pipe.transform(ProjectStatus.ON_HOLD)).toBe('暫停');
    expect(pipe.transform(ProjectStatus.CANCELLED)).toBe('已取消');
  });
  
  it('應該處理未知狀態', () => {
    expect(pipe.transform('unknown' as ProjectStatus)).toBe('未知');
  });
});
```

## 整合測試

### 1. 模組整合測試

```typescript
// 專案模組整合測試
describe('ProjectsModule Integration', () => {
  let fixture: ComponentFixture<ProjectListComponent>;
  let component: ProjectListComponent;
  let projectService: ProjectService;
  let projectStateService: ProjectStateService;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProjectsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        ProjectService,
        ProjectStateService,
        ProjectRepository,
        EventBus
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService);
    projectStateService = TestBed.inject(ProjectStateService);
  });
  
  it('應該載入專案模組', () => {
    expect(component).toBeTruthy();
  });
  
  it('應該整合專案服務和狀態服務', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1', status: ProjectStatus.IN_PROGRESS }
    ];
    
    spyOn(projectService, 'getProjects').and.returnValue(Promise.resolve(mockProjects));
    
    await projectStateService.loadProjects();
    
    expect(component.projects()).toEqual(mockProjects);
  });
  
  it('應該處理專案建立流程', async () => {
    const projectData = {
      name: 'New Project',
      type: ProjectType.RESIDENTIAL,
      location: { address: 'Test Address' },
      schedule: { startDate: new Date(), endDate: new Date() },
      budget: { total: 1000000, currency: 'TWD' }
    };
    
    const mockProject = { id: '3', ...projectData };
    spyOn(projectService, 'createProject').and.returnValue(Promise.resolve(mockProject));
    
    const result = await projectService.createProject(projectData);
    
    expect(result).toEqual(mockProject);
  });
});
```

### 2. API 整合測試

```typescript
// API 整合測試
describe('Project API Integration', () => {
  let httpMock: HttpTestingController;
  let projectService: ProjectService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
    });
    
    httpMock = TestBed.inject(HttpTestingController);
    projectService = TestBed.inject(ProjectService);
  });
  
  afterEach(() => {
    httpMock.verify();
  });
  
  it('應該獲取專案列表', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1', status: ProjectStatus.IN_PROGRESS }
    ];
    
    projectService.getProjects().then(projects => {
      expect(projects).toEqual(mockProjects);
    });
    
    const req = httpMock.expectOne('/api/v1/projects');
    expect(req.request.method).toBe('GET');
    req.flush(mockProjects);
  });
  
  it('應該建立專案', async () => {
    const projectData = {
      name: 'New Project',
      type: ProjectType.RESIDENTIAL,
      location: { address: 'Test Address' },
      schedule: { startDate: new Date(), endDate: new Date() },
      budget: { total: 1000000, currency: 'TWD' }
    };
    
    const mockProject = { id: '3', ...projectData };
    
    projectService.createProject(projectData).then(project => {
      expect(project).toEqual(mockProject);
    });
    
    const req = httpMock.expectOne('/api/v1/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(projectData);
    req.flush(mockProject);
  });
  
  it('應該處理 API 錯誤', async () => {
    const errorMessage = '伺服器錯誤';
    
    projectService.getProjects().catch(error => {
      expect(error.message).toContain(errorMessage);
    });
    
    const req = httpMock.expectOne('/api/v1/projects');
    req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
  });
});
```

### 3. Firebase 整合測試

```typescript
// Firebase 整合測試
describe('Firebase Integration', () => {
  let projectRepository: ProjectRepository;
  let firestore: Firestore;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(environment.firebase),
        AngularFirestoreModule
      ],
      providers: [ProjectRepository]
    });
    
    projectRepository = TestBed.inject(ProjectRepository);
    firestore = TestBed.inject(Firestore);
  });
  
  it('應該連接到 Firestore', () => {
    expect(firestore).toBeTruthy();
  });
  
  it('應該儲存專案到 Firestore', async () => {
    const projectData = {
      name: 'Test Project',
      type: ProjectType.RESIDENTIAL,
      status: ProjectStatus.IN_PROGRESS,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await projectRepository.create(projectData);
    
    expect(result).toBeDefined();
    expect(result.name).toBe(projectData.name);
  });
  
  it('應該從 Firestore 讀取專案', async () => {
    const projects = await projectRepository.findAll();
    
    expect(Array.isArray(projects)).toBe(true);
  });
});
```

## E2E 測試

### 1. 用戶流程測試

```typescript
// 專案管理 E2E 測試
describe('Project Management E2E', () => {
  beforeEach(() => {
    cy.visit('/projects');
    cy.login('test@example.com', 'password');
  });
  
  it('應該顯示專案列表', () => {
    cy.get('[data-cy=project-list]').should('be.visible');
    cy.get('[data-cy=project-item]').should('have.length.greaterThan', 0);
  });
  
  it('應該建立新專案', () => {
    cy.get('[data-cy=create-project-btn]').click();
    
    cy.get('[data-cy=project-name-input]').type('E2E Test Project');
    cy.get('[data-cy=project-type-select]').select('residential');
    cy.get('[data-cy=project-address-input]').type('Test Address');
    cy.get('[data-cy=project-budget-input]').type('1000000');
    
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=project-item]').should('contain', 'E2E Test Project');
  });
  
  it('應該編輯專案', () => {
    cy.get('[data-cy=project-item]').first().click();
    cy.get('[data-cy=edit-project-btn]').click();
    
    cy.get('[data-cy=project-name-input]').clear().type('Updated Project Name');
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=project-name]').should('contain', 'Updated Project Name');
  });
  
  it('應該刪除專案', () => {
    cy.get('[data-cy=project-item]').first().click();
    cy.get('[data-cy=delete-project-btn]').click();
    
    cy.get('[data-cy=confirm-delete-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.url().should('include', '/projects');
  });
  
  it('應該篩選專案', () => {
    cy.get('[data-cy=status-filter]').select('in_progress');
    cy.get('[data-cy=project-item]').should('have.length.greaterThan', 0);
    
    cy.get('[data-cy=type-filter]').select('residential');
    cy.get('[data-cy=project-item]').should('have.length.greaterThan', 0);
  });
  
  it('應該搜尋專案', () => {
    cy.get('[data-cy=search-input]').type('Test Project');
    cy.get('[data-cy=search-btn]').click();
    
    cy.get('[data-cy=project-item]').should('contain', 'Test Project');
  });
});
```

### 2. 里程碑管理 E2E 測試

```typescript
// 里程碑管理 E2E 測試
describe('Milestone Management E2E', () => {
  beforeEach(() => {
    cy.visit('/projects/1/milestones');
    cy.login('test@example.com', 'password');
  });
  
  it('應該顯示里程碑列表', () => {
    cy.get('[data-cy=milestone-list]').should('be.visible');
    cy.get('[data-cy=milestone-item]').should('have.length.greaterThan', 0);
  });
  
  it('應該建立新里程碑', () => {
    cy.get('[data-cy=create-milestone-btn]').click();
    
    cy.get('[data-cy=milestone-name-input]').type('Foundation Complete');
    cy.get('[data-cy=milestone-type-select]').select('phase');
    cy.get('[data-cy=milestone-start-date]').type('2024-01-01');
    cy.get('[data-cy=milestone-end-date]').type('2024-01-31');
    
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=milestone-item]').should('contain', 'Foundation Complete');
  });
  
  it('應該更新里程碑進度', () => {
    cy.get('[data-cy=milestone-item]').first().click();
    cy.get('[data-cy=update-progress-btn]').click();
    
    cy.get('[data-cy=progress-slider]').invoke('val', 75).trigger('change');
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=milestone-progress]').should('contain', '75%');
  });
});
```

### 3. 任務管理 E2E 測試

```typescript
// 任務管理 E2E 測試
describe('Task Management E2E', () => {
  beforeEach(() => {
    cy.visit('/projects/1/tasks');
    cy.login('test@example.com', 'password');
  });
  
  it('應該顯示任務列表', () => {
    cy.get('[data-cy=task-list]').should('be.visible');
    cy.get('[data-cy=task-item]').should('have.length.greaterThan', 0);
  });
  
  it('應該建立新任務', () => {
    cy.get('[data-cy=create-task-btn]').click();
    
    cy.get('[data-cy=task-title-input]').type('Install Windows');
    cy.get('[data-cy=task-description-input]').type('Install all windows in the building');
    cy.get('[data-cy=task-priority-select]').select('high');
    cy.get('[data-cy=task-assignee-select]').select('john.doe');
    
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=task-item]').should('contain', 'Install Windows');
  });
  
  it('應該分配任務', () => {
    cy.get('[data-cy=task-item]').first().click();
    cy.get('[data-cy=assign-task-btn]').click();
    
    cy.get('[data-cy=assignee-select]').select('jane.smith');
    cy.get('[data-cy=due-date-input]').type('2024-02-15');
    
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=task-assignee]').should('contain', 'jane.smith');
  });
});
```

## 效能測試

### 1. 載入測試

```typescript
// 載入測試
describe('Load Testing', () => {
  it('應該在 2 秒內載入專案列表', () => {
    const startTime = performance.now();
    
    cy.visit('/projects');
    cy.get('[data-cy=project-list]').should('be.visible');
    
    cy.then(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      expect(loadTime).to.be.lessThan(2000);
    });
  });
  
  it('應該在 3 秒內載入專案詳情', () => {
    const startTime = performance.now();
    
    cy.visit('/projects/1');
    cy.get('[data-cy=project-detail]').should('be.visible');
    
    cy.then(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      expect(loadTime).to.be.lessThan(3000);
    });
  });
  
  it('應該處理大量專案資料', () => {
    cy.intercept('GET', '/api/v1/projects', { fixture: 'large-project-list.json' });
    
    cy.visit('/projects');
    cy.get('[data-cy=project-list]').should('be.visible');
    cy.get('[data-cy=project-item]').should('have.length', 1000);
  });
});
```

### 2. 記憶體測試

```typescript
// 記憶體測試
describe('Memory Testing', () => {
  it('應該沒有記憶體洩漏', () => {
    cy.visit('/projects');
    
    // 執行多次操作
    for (let i = 0; i < 10; i++) {
      cy.get('[data-cy=project-item]').first().click();
      cy.go('back');
    }
    
    // 檢查記憶體使用情況
    cy.window().then((win) => {
      const memory = (win.performance as any).memory;
      expect(memory.usedJSHeapSize).to.be.lessThan(50 * 1024 * 1024); // 50MB
    });
  });
});
```

### 3. 包大小測試

```typescript
// 包大小測試
describe('Bundle Size Testing', () => {
  it('應該在合理範圍內', () => {
    cy.task('getBundleSize').then((bundleSize) => {
      expect(bundleSize.main).to.be.lessThan(500 * 1024); // 500KB
      expect(bundleSize.vendor).to.be.lessThan(1000 * 1024); // 1MB
    });
  });
});
```

## 安全測試

### 1. 認證測試

```typescript
// 認證測試
describe('Authentication Testing', () => {
  it('應該拒絕未認證用戶存取', () => {
    cy.visit('/projects');
    cy.url().should('include', '/login');
  });
  
  it('應該驗證令牌有效性', () => {
    cy.login('test@example.com', 'password');
    cy.visit('/projects');
    cy.get('[data-cy=project-list]').should('be.visible');
  });
  
  it('應該處理令牌過期', () => {
    cy.login('test@example.com', 'password');
    cy.visit('/projects');
    
    // 模擬令牌過期
    cy.window().then((win) => {
      win.localStorage.removeItem('token');
    });
    
    cy.get('[data-cy=create-project-btn]').click();
    cy.url().should('include', '/login');
  });
});
```

### 2. 授權測試

```typescript
// 授權測試
describe('Authorization Testing', () => {
  it('應該檢查專案存取權限', () => {
    cy.login('user@example.com', 'password');
    cy.visit('/projects/999'); // 不存在的專案
    
    cy.get('[data-cy=error-message]').should('contain', '無權限存取');
  });
  
  it('應該檢查操作權限', () => {
    cy.login('viewer@example.com', 'password');
    cy.visit('/projects/1');
    
    cy.get('[data-cy=edit-project-btn]').should('not.exist');
    cy.get('[data-cy=delete-project-btn]').should('not.exist');
  });
});
```

### 3. 資料驗證測試

```typescript
// 資料驗證測試
describe('Data Validation Testing', () => {
  it('應該驗證專案名稱', () => {
    cy.login('test@example.com', 'password');
    cy.visit('/projects');
    cy.get('[data-cy=create-project-btn]').click();
    
    cy.get('[data-cy=project-name-input]').type('AB'); // 太短
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=validation-error]').should('contain', '專案名稱至少需要 3 個字元');
  });
  
  it('應該驗證預算金額', () => {
    cy.login('test@example.com', 'password');
    cy.visit('/projects');
    cy.get('[data-cy=create-project-btn]').click();
    
    cy.get('[data-cy=project-budget-input]').type('-1000'); // 負數
    cy.get('[data-cy=submit-btn]').click();
    
    cy.get('[data-cy=validation-error]').should('contain', '預算金額必須大於 0');
  });
});
```

## 測試資料管理

### 1. 測試資料工廠

```typescript
// 測試資料工廠
export class TestDataFactory {
  static createProject(overrides: Partial<Project> = {}): Project {
    return {
      id: 'test-project-1',
      name: 'Test Project',
      description: 'Test project description',
      type: ProjectType.RESIDENTIAL,
      status: ProjectStatus.IN_PROGRESS,
      location: {
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country'
      },
      schedule: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        estimatedDuration: 365
      },
      budget: {
        total: 1000000,
        currency: 'TWD',
        categories: {
          materials: { allocated: 500000, spent: 0, remaining: 500000 },
          labor: { allocated: 300000, spent: 0, remaining: 300000 },
          equipment: { allocated: 200000, spent: 0, remaining: 200000 }
        },
        contingency: 100000,
        contingencyUsed: 0
      },
      owner: {
        id: 'test-user-1',
        type: 'user',
        name: 'Test User'
      },
      settings: {
        timezone: 'Asia/Taipei',
        language: 'zh-TW',
        currency: 'TWD',
        units: {
          length: 'metric',
          weight: 'metric',
          temperature: 'celsius'
        },
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      stats: {
        totalMilestones: 0,
        completedMilestones: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalDocuments: 0,
        totalPhotos: 0,
        totalReports: 0,
        totalInspections: 0,
        totalMaterials: 0,
        totalEquipment: 0,
        totalSafetyRecords: 0,
        totalWeatherLogs: 0,
        totalComments: 0
      },
      progress: {
        overall: 0,
        milestones: 0,
        tasks: 0,
        budget: 0,
        schedule: 0
      },
      tags: [],
      categories: [],
      files: {
        documents: 0,
        photos: 0,
        videos: 0,
        totalSize: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-1',
      updatedBy: 'test-user-1',
      isDeleted: false,
      ...overrides
    };
  }
  
  static createMilestone(overrides: Partial<Milestone> = {}): Milestone {
    return {
      id: 'test-milestone-1',
      projectId: 'test-project-1',
      name: 'Test Milestone',
      description: 'Test milestone description',
      type: MilestoneType.PHASE,
      schedule: {
        plannedStartDate: new Date('2024-01-01'),
        plannedEndDate: new Date('2024-01-31'),
        estimatedDuration: 30
      },
      progress: {
        percentage: 0,
        status: 'not_started'
      },
      dependencies: [],
      budget: {
        allocated: 100000,
        spent: 0,
        remaining: 100000
      },
      tags: [],
      priority: 'medium',
      attachments: {
        documents: [],
        photos: [],
        videos: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-1',
      updatedBy: 'test-user-1',
      ...overrides
    };
  }
  
  static createTask(overrides: Partial<Task> = {}): Task {
    return {
      id: 'test-task-1',
      projectId: 'test-project-1',
      title: 'Test Task',
      description: 'Test task description',
      type: TaskType.CONSTRUCTION,
      status: 'todo',
      priority: 'medium',
      schedule: {
        estimatedHours: 8
      },
      creator: {
        id: 'test-user-1',
        name: 'Test User'
      },
      dependencies: [],
      subtasks: [],
      tags: [],
      categories: [],
      progress: {
        percentage: 0
      },
      attachments: {
        documents: [],
        photos: [],
        videos: []
      },
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-1',
      updatedBy: 'test-user-1',
      ...overrides
    };
  }
}
```

### 2. 測試資料種子

```typescript
// 測試資料種子
export class TestDataSeeder {
  static async seedProjects(count: number = 10): Promise<Project[]> {
    const projects: Project[] = [];
    
    for (let i = 0; i < count; i++) {
      const project = TestDataFactory.createProject({
        id: `test-project-${i + 1}`,
        name: `Test Project ${i + 1}`,
        status: i % 2 === 0 ? ProjectStatus.IN_PROGRESS : ProjectStatus.COMPLETED
      });
      
      projects.push(project);
    }
    
    return projects;
  }
  
  static async seedMilestones(projectId: string, count: number = 5): Promise<Milestone[]> {
    const milestones: Milestone[] = [];
    
    for (let i = 0; i < count; i++) {
      const milestone = TestDataFactory.createMilestone({
        id: `test-milestone-${i + 1}`,
        projectId,
        name: `Test Milestone ${i + 1}`,
        progress: {
          percentage: i * 20,
          status: i === count - 1 ? 'completed' : 'in_progress'
        }
      });
      
      milestones.push(milestone);
    }
    
    return milestones;
  }
  
  static async seedTasks(projectId: string, count: number = 20): Promise<Task[]> {
    const tasks: Task[] = [];
    
    for (let i = 0; i < count; i++) {
      const task = TestDataFactory.createTask({
        id: `test-task-${i + 1}`,
        projectId,
        title: `Test Task ${i + 1}`,
        status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in_progress' : 'todo',
        priority: i % 4 === 0 ? 'critical' : i % 4 === 1 ? 'high' : i % 4 === 2 ? 'medium' : 'low'
      });
      
      tasks.push(task);
    }
    
    return tasks;
  }
}
```

## 測試最佳實踐

### 1. 測試組織

```typescript
// 測試組織最佳實踐
export const TESTING_BEST_PRACTICES = {
  // 測試命名
  naming: {
    describe: '應該描述被測試的功能',
    it: '應該描述預期的行為',
    beforeEach: '應該設定測試環境',
    afterEach: '應該清理測試環境'
  },
  
  // 測試結構
  structure: {
    arrange: '準備測試資料',
    act: '執行被測試的功能',
    assert: '驗證結果'
  },
  
  // 測試覆蓋率
  coverage: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80
  },
  
  // 測試資料
  testData: {
    useFactories: true,
    useFixtures: true,
    avoidHardcoded: true,
    cleanupAfterTest: true
  }
} as const;
```

### 2. 測試維護

```typescript
// 測試維護策略
export class TestMaintenanceStrategy {
  // 測試重構
  static refactorTests(): void {
    // 提取重複的測試邏輯
    // 使用測試工具函數
    // 統一測試資料管理
  }
  
  // 測試更新
  static updateTests(): void {
    // 更新過時的測試
    // 修復破碎的測試
    // 優化測試效能
  }
  
  // 測試監控
  static monitorTests(): void {
    // 監控測試執行時間
    // 追蹤測試失敗率
    // 分析測試覆蓋率
  }
}
```

## 相關文件

- [Angular Testing 官方文件](https://angular.dev/guide/testing)
- [Jest 官方文件](https://jestjs.io/)
- [Cypress 官方文件](https://docs.cypress.io/)
- [Firebase Testing 文件](https://firebase.google.com/docs/testing)
- [Projects Module 架構文件](./Architecture/Projects%20Module.md)
