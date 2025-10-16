# Organization Module - Testing Strategy

## 概述

Organization Module 的測試策略，基於 Angular v20 現代化測試架構，整合 Angular Testing Library、Jest 和 Firebase 測試工具，提供完整的測試覆蓋和品質保證。

## 測試架構

### 1. 測試工具配置

#### Jest 配置

```typescript
// jest.config.js
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/app/features/organization/**/*.ts',
    'src/app/application-layer/**/*.ts',
    'src/app/infrastructure-layer/**/*.ts',
    '!src/app/features/organization/**/*.spec.ts',
    '!src/app/features/organization/**/*.interface.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/app/features/organization/**/*.spec.ts',
    '<rootDir>/src/app/application-layer/**/*.spec.ts',
    '<rootDir>/src/app/infrastructure-layer/**/*.spec.ts'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

#### 測試環境設定

```typescript
// src/test-setup.ts
import 'jest-preset-angular/setup-jest';
import { TestBed } from '@angular/core/testing';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { environment } from '../environments/environment.test';

// Firebase 測試環境配置
const firebaseConfig = {
  projectId: 'test-project',
  authDomain: 'test-project.firebaseapp.com',
  storageBucket: 'test-project.appspot.com'
};

// 全域測試設定
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [
      provideFirebaseApp(() => initializeApp(firebaseConfig)),
      provideFirestore(() => {
        const firestore = getFirestore();
        if (!firestore._delegate._settings?.host?.includes('localhost')) {
          connectFirestoreEmulator(firestore, 'localhost', 8080);
        }
        return firestore;
      }),
      provideAuth(() => {
        const auth = getAuth();
        if (!auth._delegate._config?.emulator) {
          connectAuthEmulator(auth, 'http://localhost:9099');
        }
        return auth;
      })
    ]
  });
});

// 全域測試工具
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithFirestoreData(expected: any): R;
      toHaveBeenCalledWithFirestoreQuery(expected: any): R;
    }
  }
}

// 自定義匹配器
expect.extend({
  toHaveBeenCalledWithFirestoreData(received: any, expected: any) {
    const pass = JSON.stringify(received) === JSON.stringify(expected);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to equal ${expected}`,
      pass
    };
  }
});
```

### 2. 單元測試

#### 服務測試

```typescript
// organization.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { OrganizationService } from './organization.service';
import { OrganizationErrorHandlerService } from './organization-error-handler.service';
import { OrganizationValidationService } from './organization-validation.service';
import { OrganizationCacheService } from './organization-cache.service';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let errorHandler: jasmine.SpyObj<OrganizationErrorHandlerService>;
  let validator: jasmine.SpyObj<OrganizationValidationService>;
  let cache: jasmine.SpyObj<OrganizationCacheService>;

  beforeEach(() => {
    const errorHandlerSpy = jasmine.createSpyObj('OrganizationErrorHandlerService', ['handleError']);
    const validatorSpy = jasmine.createSpyObj('OrganizationValidationService', ['validateOrganization']);
    const cacheSpy = jasmine.createSpyObj('OrganizationCacheService', ['get', 'set', 'delete']);

    TestBed.configureTestingModule({
      imports: [
        provideFirebaseApp(() => initializeApp({})),
        provideFirestore(() => getFirestore())
      ],
      providers: [
        OrganizationService,
        { provide: OrganizationErrorHandlerService, useValue: errorHandlerSpy },
        { provide: OrganizationValidationService, useValue: validatorSpy },
        { provide: OrganizationCacheService, useValue: cacheSpy }
      ]
    });

    service = TestBed.inject(OrganizationService);
    errorHandler = TestBed.inject(OrganizationErrorHandlerService) as jasmine.SpyObj<OrganizationErrorHandlerService>;
    validator = TestBed.inject(OrganizationValidationService) as jasmine.SpyObj<OrganizationValidationService>;
    cache = TestBed.inject(OrganizationCacheService) as jasmine.SpyObj<OrganizationCacheService>;
  });

  describe('getAllOrganizations', () => {
    it('should return organizations from cache when available', (done) => {
      const mockOrganizations = [
        { id: '1', name: 'Test Org 1', status: 'active' },
        { id: '2', name: 'Test Org 2', status: 'active' }
      ];

      cache.get.and.returnValue(of(mockOrganizations));

      service.getAllOrganizations().subscribe({
        next: (organizations) => {
          expect(organizations).toEqual(mockOrganizations);
          expect(cache.get).toHaveBeenCalledWith('organizations:all');
          done();
        }
      });
    });

    it('should fetch organizations from Firestore when not in cache', (done) => {
      const mockOrganizations = [
        { id: '1', name: 'Test Org 1', status: 'active' },
        { id: '2', name: 'Test Org 2', status: 'active' }
      ];

      cache.get.and.returnValue(of(null));
      cache.set.and.returnValue(of(undefined));

      // Mock Firestore collectionData
      spyOn(service as any, 'fetchOrganizationsFromFirestore').and.returnValue(of(mockOrganizations));

      service.getAllOrganizations().subscribe({
        next: (organizations) => {
          expect(organizations).toEqual(mockOrganizations);
          expect(cache.set).toHaveBeenCalledWith('organizations:all', mockOrganizations);
          done();
        }
      });
    });

    it('should handle errors properly', (done) => {
      const mockError = new Error('Firestore error');
      const mockApiError = { code: 'NETWORK_ERROR', message: 'Network error' };

      cache.get.and.returnValue(of(null));
      errorHandler.handleError.and.returnValue(throwError(() => mockApiError));
      spyOn(service as any, 'fetchOrganizationsFromFirestore').and.returnValue(throwError(() => mockError));

      service.getAllOrganizations().subscribe({
        error: (error) => {
          expect(error).toEqual(mockApiError);
          expect(errorHandler.handleError).toHaveBeenCalledWith(mockError);
          done();
        }
      });
    });
  });

  describe('createOrganization', () => {
    it('should create organization with valid data', (done) => {
      const organizationData = {
        name: 'Test Organization',
        description: 'Test Description',
        email: 'test@example.com',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345'
        },
        settings: {
          timezone: 'UTC',
          language: 'en',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY'
        }
      };

      const validationResult = { isValid: true, errors: [] };
      validator.validateOrganization.and.returnValue(validationResult);

      spyOn(service as any, 'addDocumentToFirestore').and.returnValue(of('new-org-id'));

      service.createOrganization(organizationData).subscribe({
        next: (organization) => {
          expect(organization.id).toBe('new-org-id');
          expect(organization.name).toBe(organizationData.name);
          expect(validator.validateOrganization).toHaveBeenCalledWith(organizationData);
          done();
        }
      });
    });

    it('should reject invalid data', (done) => {
      const invalidData = { name: '', email: 'invalid-email' };
      const validationResult = {
        isValid: false,
        errors: [
          { field: 'name', message: '組織名稱為必填欄位', code: 'REQUIRED' },
          { field: 'email', message: '請輸入有效的電子信箱', code: 'INVALID_EMAIL' }
        ]
      };

      validator.validateOrganization.and.returnValue(validationResult);

      service.createOrganization(invalidData).subscribe({
        error: (error) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.details).toEqual(validationResult.errors);
          done();
        }
      });
    });
  });
});
```

#### 組件測試

```typescript
// organization-list.component.spec.ts
import { render, screen, fireEvent } from '@testing-library/angular';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { of, throwError } from 'rxjs';
import { OrganizationListComponent } from './organization-list.component';
import { OrganizationService } from './organization.service';

describe('OrganizationListComponent', () => {
  let mockOrganizationService: jasmine.SpyObj<OrganizationService>;

  beforeEach(() => {
    mockOrganizationService = jasmine.createSpyObj('OrganizationService', [
      'getAllOrganizations',
      'deleteOrganization'
    ]);
  });

  it('should render organization list', async () => {
    const mockOrganizations = [
      { id: '1', name: 'Test Org 1', description: 'Description 1', status: 'active' },
      { id: '2', name: 'Test Org 2', description: 'Description 2', status: 'active' }
    ];

    mockOrganizationService.getAllOrganizations.and.returnValue(of(mockOrganizations));

    await render(OrganizationListComponent, {
      imports: [
        provideFirebaseApp(() => initializeApp({})),
        provideFirestore(() => getFirestore())
      ],
      providers: [
        { provide: OrganizationService, useValue: mockOrganizationService }
      ]
    });

    expect(screen.getByText('Test Org 1')).toBeInTheDocument();
    expect(screen.getByText('Test Org 2')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('should display loading state', async () => {
    mockOrganizationService.getAllOrganizations.and.returnValue(of([]));

    await render(OrganizationListComponent, {
      imports: [
        provideFirebaseApp(() => initializeApp({})),
        provideFirestore(() => getFirestore())
      ],
      providers: [
        { provide: OrganizationService, useValue: mockOrganizationService }
      ]
    });

    // 組件應該顯示載入狀態
    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  it('should display error message when loading fails', async () => {
    const mockError = { code: 'NETWORK_ERROR', message: '網路連線錯誤' };
    mockOrganizationService.getAllOrganizations.and.returnValue(throwError(() => mockError));

    await render(OrganizationListComponent, {
      imports: [
        provideFirebaseApp(() => initializeApp({})),
        provideFirestore(() => getFirestore())
      ],
      providers: [
        { provide: OrganizationService, useValue: mockOrganizationService }
      ]
    });

    expect(screen.getByText('網路連線錯誤')).toBeInTheDocument();
  });

  it('should delete organization when delete button is clicked', async () => {
    const mockOrganizations = [
      { id: '1', name: 'Test Org 1', description: 'Description 1', status: 'active' }
    ];

    mockOrganizationService.getAllOrganizations.and.returnValue(of(mockOrganizations));
    mockOrganizationService.deleteOrganization.and.returnValue(of(undefined));

    await render(OrganizationListComponent, {
      imports: [
        provideFirebaseApp(() => initializeApp({})),
        provideFirestore(() => getFirestore())
      ],
      providers: [
        { provide: OrganizationService, useValue: mockOrganizationService }
      ]
    });

    const deleteButton = screen.getByRole('button', { name: /刪除/i });
    fireEvent.click(deleteButton);

    expect(mockOrganizationService.deleteOrganization).toHaveBeenCalledWith('1');
  });

  it('should filter organizations by search term', async () => {
    const mockOrganizations = [
      { id: '1', name: 'Alpha Organization', description: 'Description 1', status: 'active' },
      { id: '2', name: 'Beta Organization', description: 'Description 2', status: 'active' }
    ];

    mockOrganizationService.getAllOrganizations.and.returnValue(of(mockOrganizations));

    await render(OrganizationListComponent, {
      imports: [
        provideFirebaseApp(() => initializeApp({})),
        provideFirestore(() => getFirestore())
      ],
      providers: [
        { provide: OrganizationService, useValue: mockOrganizationService }
      ]
    });

    const searchInput = screen.getByPlaceholderText('搜尋組織...');
    fireEvent.input(searchInput, { target: { value: 'Alpha' } });

    expect(screen.getByText('Alpha Organization')).toBeInTheDocument();
    expect(screen.queryByText('Beta Organization')).not.toBeInTheDocument();
  });
});
```

### 3. 整合測試

#### Firebase 整合測試

```typescript
// organization-firestore-integration.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { OrganizationFirestoreService } from './organization-firestore.service';

describe('OrganizationFirestoreService Integration', () => {
  let service: OrganizationFirestoreService;
  let firestore: Firestore;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        provideFirebaseApp(() => initializeApp({
          projectId: 'test-project',
          authDomain: 'test-project.firebaseapp.com'
        })),
        provideFirestore(() => {
          const firestore = getFirestore();
          connectFirestoreEmulator(firestore, 'localhost', 8080);
          return firestore;
        })
      ],
      providers: [OrganizationFirestoreService]
    });

    service = TestBed.inject(OrganizationFirestoreService);
    firestore = TestBed.inject(Firestore);
  });

  it('should create and retrieve organization', async () => {
    const organizationData = {
      name: 'Test Organization',
      description: 'Test Description',
      email: 'test@example.com',
      status: 'active',
      metadata: {
        memberCount: 0,
        teamCount: 0,
        projectCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user'
      }
    };

    // 建立組織
    const docId = await service.addDocument('organizations', organizationData);
    expect(docId).toBeDefined();

    // 檢索組織
    const retrievedOrg = await service.getDocument(`organizations/${docId}`);
    expect(retrievedOrg).toBeDefined();
    expect(retrievedOrg?.name).toBe(organizationData.name);
    expect(retrievedOrg?.email).toBe(organizationData.email);

    // 清理
    await service.deleteDocument(`organizations/${docId}`);
  });

  it('should query organizations by status', async () => {
    const organizations = [
      { name: 'Active Org 1', status: 'active', email: 'org1@example.com' },
      { name: 'Active Org 2', status: 'active', email: 'org2@example.com' },
      { name: 'Inactive Org', status: 'inactive', email: 'org3@example.com' }
    ];

    // 建立測試資料
    const docIds = [];
    for (const org of organizations) {
      const docId = await service.addDocument('organizations', org);
      docIds.push(docId);
    }

    // 查詢活躍組織
    const activeOrgs = await service.queryDocuments('organizations', (ref) => 
      query(ref, where('status', '==', 'active'))
    );

    expect(activeOrgs).toHaveLength(2);
    expect(activeOrgs.every(org => org.status === 'active')).toBe(true);

    // 清理
    for (const docId of docIds) {
      await service.deleteDocument(`organizations/${docId}`);
    }
  });
});
```

### 4. E2E 測試

#### Playwright E2E 測試

```typescript
// organization.e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Organization Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 登入測試用戶
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should create new organization', async ({ page }) => {
    await page.goto('/organizations');
    
    // 點擊建立組織按鈕
    await page.click('[data-testid="create-organization-button"]');
    
    // 填寫組織表單
    await page.fill('[data-testid="organization-name"]', 'Test Organization');
    await page.fill('[data-testid="organization-description"]', 'Test Description');
    await page.fill('[data-testid="organization-email"]', 'test@example.com');
    
    // 填寫地址
    await page.fill('[data-testid="address-street"]', '123 Test Street');
    await page.fill('[data-testid="address-city"]', 'Test City');
    await page.fill('[data-testid="address-state"]', 'Test State');
    await page.fill('[data-testid="address-country"]', 'Test Country');
    await page.fill('[data-testid="address-postal-code"]', '12345');
    
    // 提交表單
    await page.click('[data-testid="submit-button"]');
    
    // 驗證成功訊息
    await expect(page.locator('[data-testid="success-message"]')).toContainText('組織建立成功');
    
    // 驗證組織出現在列表中
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Test Organization');
  });

  test('should search organizations', async ({ page }) => {
    await page.goto('/organizations');
    
    // 搜尋組織
    await page.fill('[data-testid="search-input"]', 'Test Organization');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // 驗證搜尋結果
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Test Organization');
  });

  test('should edit organization', async ({ page }) => {
    await page.goto('/organizations');
    
    // 點擊編輯按鈕
    await page.click('[data-testid="edit-organization-button"]');
    
    // 修改組織名稱
    await page.fill('[data-testid="organization-name"]', 'Updated Organization Name');
    
    // 提交變更
    await page.click('[data-testid="submit-button"]');
    
    // 驗證更新成功
    await expect(page.locator('[data-testid="success-message"]')).toContainText('組織更新成功');
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Updated Organization Name');
  });

  test('should delete organization', async ({ page }) => {
    await page.goto('/organizations');
    
    // 點擊刪除按鈕
    await page.click('[data-testid="delete-organization-button"]');
    
    // 確認刪除
    await page.click('[data-testid="confirm-delete-button"]');
    
    // 驗證刪除成功
    await expect(page.locator('[data-testid="success-message"]')).toContainText('組織刪除成功');
    await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('Test Organization');
  });

  test('should manage organization members', async ({ page }) => {
    await page.goto('/organizations/123/members');
    
    // 新增成員
    await page.click('[data-testid="add-member-button"]');
    await page.fill('[data-testid="member-email"]', 'member@example.com');
    await page.selectOption('[data-testid="member-role"]', 'member');
    await page.click('[data-testid="invite-member-button"]');
    
    // 驗證成員新增成功
    await expect(page.locator('[data-testid="success-message"]')).toContainText('成員邀請成功');
    await expect(page.locator('[data-testid="member-list"]')).toContainText('member@example.com');
    
    // 更新成員角色
    await page.click('[data-testid="edit-member-button"]');
    await page.selectOption('[data-testid="member-role"]', 'admin');
    await page.click('[data-testid="update-member-button"]');
    
    // 驗證角色更新成功
    await expect(page.locator('[data-testid="success-message"]')).toContainText('成員角色更新成功');
  });
});
```

### 5. 效能測試

#### 載入效能測試

```typescript
// organization-performance.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { OrganizationService } from './organization.service';

describe('Organization Performance Tests', () => {
  let service: OrganizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        provideFirebaseApp(() => initializeApp({})),
        provideFirestore(() => getFirestore())
      ],
      providers: [OrganizationService]
    });

    service = TestBed.inject(OrganizationService);
  });

  it('should load organizations within acceptable time', async () => {
    const startTime = performance.now();
    
    const organizations$ = service.getAllOrganizations();
    
    await new Promise<void>((resolve) => {
      organizations$.subscribe({
        next: () => {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          // 載入時間應該在 2 秒內
          expect(loadTime).toBeLessThan(2000);
          resolve();
        }
      });
    });
  });

  it('should handle large datasets efficiently', async () => {
    // 模擬大量資料
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `org-${i}`,
      name: `Organization ${i}`,
      status: 'active'
    }));

    spyOn(service as any, 'fetchOrganizationsFromFirestore').and.returnValue(of(largeDataset));

    const startTime = performance.now();
    
    const organizations$ = service.getAllOrganizations();
    
    await new Promise<void>((resolve) => {
      organizations$.subscribe({
        next: (organizations) => {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          expect(organizations).toHaveLength(1000);
          // 即使是大資料集，載入時間也應該在合理範圍內
          expect(loadTime).toBeLessThan(5000);
          resolve();
        }
      });
    });
  });
});
```

### 6. 可訪問性測試

#### A11y 測試

```typescript
// organization-a11y.spec.ts
import { render, screen } from '@testing-library/angular';
import { axe, toHaveNoViolations } from 'jest-axe';
import { OrganizationListComponent } from './organization-list.component';

expect.extend(toHaveNoViolations);

describe('Organization Module Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = await render(OrganizationListComponent);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels', async () => {
    await render(OrganizationListComponent);
    
    // 檢查搜尋輸入框的 ARIA 標籤
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAttribute('aria-label', '搜尋組織');
    
    // 檢查按鈕的 ARIA 標籤
    const createButton = screen.getByRole('button', { name: /建立組織/i });
    expect(createButton).toHaveAttribute('aria-label');
    
    // 檢查表格的 ARIA 標籤
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', '組織列表');
  });

  it('should support keyboard navigation', async () => {
    await render(OrganizationListComponent);
    
    // 檢查所有互動元素都可以透過鍵盤存取
    const interactiveElements = screen.getAllByRole('button');
    interactiveElements.forEach(element => {
      expect(element).toHaveAttribute('tabindex', '0');
    });
  });
});
```

### 7. 測試工具和輔助函數

#### 測試輔助函數

```typescript
// test-helpers.ts
import { TestBed } from '@angular/core/testing';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

export function createMockOrganization(overrides: Partial<any> = {}): any {
  return {
    id: 'test-org-id',
    name: 'Test Organization',
    description: 'Test Description',
    email: 'test@example.com',
    status: 'active',
    metadata: {
      memberCount: 0,
      teamCount: 0,
      projectCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user',
      updatedBy: 'test-user'
    },
    ...overrides
  };
}

export function createMockOrganizationMember(overrides: Partial<any> = {}): any {
  return {
    id: 'test-member-id',
    organizationId: 'test-org-id',
    userId: 'test-user-id',
    role: 'member',
    permissions: ['read'],
    status: 'active',
    joinedAt: new Date(),
    invitedBy: 'test-user',
    metadata: {
      lastActiveAt: new Date(),
      profile: {
        displayName: 'Test User',
        email: 'test@example.com',
        avatar: null,
        department: 'Engineering',
        position: 'Developer'
      }
    },
    ...overrides
  };
}

export function setupFirebaseTestBed(): void {
  TestBed.configureTestingModule({
    imports: [
      provideFirebaseApp(() => initializeApp({
        projectId: 'test-project',
        authDomain: 'test-project.firebaseapp.com'
      })),
      provideFirestore(() => getFirestore())
    ]
  });
}

export function createMockFirestoreService(): jasmine.SpyObj<any> {
  return jasmine.createSpyObj('FirestoreService', [
    'getCollection',
    'getDocument',
    'addDocument',
    'updateDocument',
    'deleteDocument',
    'queryDocuments',
    'listenToCollection',
    'listenToDocument',
    'batchWrite',
    'runTransaction'
  ]);
}
```

### 8. 測試配置和腳本

#### Package.json 測試腳本

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit",
    "test:a11y": "jest --testPathPattern=a11y"
  }
}
```

#### CI/CD 測試配置

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Run unit tests
        run: yarn test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Install Playwright
        run: yarn playwright install --with-deps
      
      - name: Run E2E tests
        run: yarn test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 測試最佳實踐

### 1. 測試金字塔
- **單元測試 (70%)**: 測試個別函數和組件
- **整合測試 (20%)**: 測試服務間互動
- **E2E 測試 (10%)**: 測試完整用戶流程

### 2. 測試命名規範
```typescript
// 好的測試命名
describe('OrganizationService', () => {
  describe('getAllOrganizations', () => {
    it('should return organizations from cache when available', () => {});
    it('should fetch from Firestore when cache is empty', () => {});
    it('should handle errors gracefully', () => {});
  });
});
```

### 3. 測試資料管理
- 使用工廠函數創建測試資料
- 避免硬編碼測試資料
- 使用適當的測試資料隔離

### 4. 模擬和存根
- 模擬外部依賴
- 使用適當的存根策略
- 避免過度模擬

### 5. 測試覆蓋率
- 目標覆蓋率: 80% 以上
- 重點關注業務邏輯
- 避免為了覆蓋率而測試

## 相關文件

- [Angular Testing 官方文件](https://angular.dev/guide/testing)
- [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/)
- [Jest 官方文件](https://jestjs.io/docs/getting-started)
- [Playwright 官方文件](https://playwright.dev/)
- [Organization Module 架構文件](./Architecture/Organization%20Module.md)
- [Organization Module API 接口](./Api%20Contracts.md)