# 測試策略 (Testing Strategy)

## 🎯 測試策略概述

ng-alain-gig 採用全面的測試策略，確保程式碼品質、功能正確性和系統穩定性。

## 🏗️ 測試金字塔

```
        /\
       /  \
      / E2E \     <- 少量，關鍵流程
     /______\
    /        \
   /Integration\ <- 中等數量，模組整合
  /__________\
 /            \
/  Unit Tests  \   <- 大量，業務邏輯
/______________\
```

### 測試比例分配
- **單元測試**: 70% - 快速、獨立、細粒度
- **整合測試**: 20% - 模組間互動、API 整合
- **E2E 測試**: 10% - 完整用戶流程、關鍵業務場景

## 🧪 單元測試策略

### 測試框架
- **Jasmine** - 測試框架
- **Karma** - 測試執行器
- **Angular Testing Utilities** - Angular 專用測試工具

### 測試範圍
```typescript
// 服務測試
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  describe('getUser', () => {
    it('should return user data when API call succeeds', async () => {
      const mockUser = { id: '1', name: 'Test User' };
      
      const promise = service.getUser('1');
      
      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
      
      const result = await promise;
      expect(result).toEqual(mockUser);
    });
    
    it('should handle API errors gracefully', async () => {
      const promise = service.getUser('1');
      
      const req = httpMock.expectOne('/api/users/1');
      req.flush('User not found', { status: 404, statusText: 'Not Found' });
      
      await expectAsync(promise).toBeRejectedWithError('User not found');
    });
  });
});
```

### 組件測試
```typescript
// Standalone 組件測試
describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;
  
  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers']);
    
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
  
  it('should display users when data is loaded', () => {
    const mockUsers = [
      { id: '1', name: 'User 1' },
      { id: '2', name: 'User 2' }
    ];
    
    userService.getUsers.and.returnValue(Promise.resolve(mockUsers));
    
    fixture.detectChanges();
    
    const userElements = fixture.debugElement.queryAll(By.css('.user-item'));
    expect(userElements.length).toBe(2);
  });
  
  it('should handle loading state', () => {
    component.loading.set(true);
    fixture.detectChanges();
    
    const loadingElement = fixture.debugElement.query(By.css('.loading'));
    expect(loadingElement).toBeTruthy();
  });
});
```

### Signal 測試
```typescript
describe('ProjectState', () => {
  let state: ProjectState;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectState]
    });
    
    state = TestBed.inject(ProjectState);
  });
  
  it('should update projects signal', () => {
    const projects = [{ id: '1', name: 'Project 1' }];
    
    state.setProjects(projects);
    
    expect(state.projects()).toEqual(projects);
  });
  
  it('should compute filtered projects correctly', () => {
    const projects = [
      { id: '1', name: 'Active Project', status: 'active' },
      { id: '2', name: 'Draft Project', status: 'draft' }
    ];
    
    state.setProjects(projects);
    state.updateFilters({ status: 'active' });
    
    const filtered = state.filteredProjects();
    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('active');
  });
});
```

## 🔗 整合測試策略

### Firebase 整合測試
```typescript
describe('Firebase Integration', () => {
  let app: FirebaseApp;
  let db: Firestore;
  let auth: Auth;
  
  beforeAll(async () => {
    // 使用 Firebase Emulator
    app = initializeApp({
      projectId: 'test-project'
    });
    
    db = getFirestore(app);
    auth = getAuth(app);
    
    // 連接到 Emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
  });
  
  afterAll(async () => {
    await deleteApp(app);
  });
  
  beforeEach(async () => {
    // 清理測試資料
    await clearFirestoreData({ projectId: 'test-project' });
  });
  
  it('should create and retrieve user document', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      createdAt: serverTimestamp()
    };
    
    // 創建文件
    const docRef = await addDoc(collection(db, 'users'), userData);
    
    // 檢索文件
    const docSnap = await getDoc(docRef);
    
    expect(docSnap.exists()).toBe(true);
    expect(docSnap.data()?.name).toBe('Test User');
  });
  
  it('should enforce security rules', async () => {
    // 測試未認證用戶無法寫入
    await expectAsync(
      addDoc(collection(db, 'users'), { name: 'Unauthorized' })
    ).toBeRejectedWithError(/permission-denied/);
  });
});
```

### HTTP 整合測試
```typescript
describe('API Integration', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  afterEach(() => {
    httpMock.verify();
  });
  
  it('should handle authentication flow', () => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const expectedResponse = { token: 'jwt-token', user: { id: '1' } };
    
    httpClient.post('/api/auth/login', credentials).subscribe(response => {
      expect(response).toEqual(expectedResponse);
    });
    
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(expectedResponse);
  });
});
```

## 🎭 E2E 測試策略

### Playwright 設置
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI
  }
});
```

### E2E 測試範例
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 填寫登入表單
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // 驗證登入成功
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
  
  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('登入失敗');
  });
});

// e2e/project-management.spec.ts
test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登入測試用戶
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should create new project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="create-project-button"]');
    
    // 填寫專案表單
    await page.fill('[data-testid="project-name"]', 'Test Project');
    await page.fill('[data-testid="project-description"]', 'This is a test project');
    await page.click('[data-testid="submit-button"]');
    
    // 驗證專案創建成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-list"]')).toContainText('Test Project');
  });
});
```

## 📊 測試覆蓋率

### 覆蓋率目標
- **整體覆蓋率**: > 80%
- **業務邏輯**: > 90%
- **UI 組件**: > 70%
- **服務層**: > 85%

### 覆蓋率配置
```json
// karma.conf.js
module.exports = function (config) {
  config.set({
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' }
      ],
      check: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        }
      }
    }
  });
};
```

## 🔄 持續整合測試

### GitHub Actions 配置
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'yarn'
    
    - name: Install dependencies
      run: yarn install --frozen-lockfile
    
    - name: Run unit tests
      run: yarn test:ci
    
    - name: Run E2E tests
      run: yarn e2e:ci
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## 🧪 測試資料管理

### 測試資料工廠
```typescript
// test/factories/user.factory.ts
export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      role: 'user',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...overrides
    };
  }
  
  static createMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

// test/factories/project.factory.ts
export class ProjectFactory {
  static create(overrides: Partial<Project> = {}): Project {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      status: 'active',
      ownerId: faker.string.uuid(),
      teamMembers: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...overrides
    };
  }
}
```

### Mock 服務
```typescript
// test/mocks/firebase.mock.ts
export class MockFirebaseService {
  private data = new Map<string, any>();
  
  async get(path: string): Promise<any> {
    return this.data.get(path);
  }
  
  async set(path: string, data: any): Promise<void> {
    this.data.set(path, data);
  }
  
  async delete(path: string): Promise<void> {
    this.data.delete(path);
  }
  
  clear(): void {
    this.data.clear();
  }
}
```

## 🚨 測試最佳實踐

### AAA 模式 (Arrange, Act, Assert)
```typescript
it('should calculate project completion percentage', () => {
  // Arrange
  const project = ProjectFactory.create();
  const completedTasks = TaskFactory.createMany(3, { status: 'completed' });
  const totalTasks = [...completedTasks, ...TaskFactory.createMany(2, { status: 'todo' })];
  
  // Act
  const percentage = calculateCompletionPercentage(project, totalTasks);
  
  // Assert
  expect(percentage).toBe(60); // 3/5 = 60%
});
```

### 測試隔離
```typescript
describe('UserService', () => {
  let service: UserService;
  
  beforeEach(() => {
    // 每個測試都有乾淨的服務實例
    service = new UserService();
  });
  
  afterEach(() => {
    // 清理副作用
    service.clearCache();
  });
});
```

### 測試命名規範
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should throw error when email is invalid', () => {});
    it('should throw error when email already exists', () => {});
  });
  
  describe('updateUser', () => {
    it('should update user successfully', () => {});
    it('should throw error when user not found', () => {});
    it('should throw error when user has no permission', () => {});
  });
});
```

## 📋 測試檢查清單

### ✅ 單元測試
- [ ] 所有服務方法都有測試
- [ ] 組件輸入輸出都有測試
- [ ] 錯誤情況都有覆蓋
- [ ] Mock 依賴正確設置

### ✅ 整合測試
- [ ] Firebase 整合測試
- [ ] HTTP API 整合測試
- [ ] 模組間互動測試
- [ ] 安全規則測試

### ✅ E2E 測試
- [ ] 關鍵用戶流程覆蓋
- [ ] 跨瀏覽器相容性
- [ ] 響應式設計測試
- [ ] 錯誤處理測試

### ✅ 測試品質
- [ ] 測試覆蓋率達標
- [ ] 測試執行速度合理
- [ ] 測試結果穩定
- [ ] 測試文件完整

## 🔗 相關資源

- [Angular 測試指南](https://angular.io/guide/testing)
- [Jasmine 文件](https://jasmine.github.io/)
- [Playwright 文件](https://playwright.dev/)
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)
