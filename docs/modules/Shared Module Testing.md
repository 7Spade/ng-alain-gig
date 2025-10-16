# Shared Module Testing - 共用模組測試策略

## 概述
Shared Module Testing 定義了共用模組的測試策略和最佳實踐。它涵蓋了單元測試、整合測試、端到端測試等不同層級的測試方法，並提供測試工具、mock 資料和測試輔助函數。

## 技術規格

### 測試框架配置
```typescript
// jest.config.js
module.exports = {
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
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@domain/(.*)$': '<rootDir>/src/app/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/app/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/app/infrastructure/$1'
  }
};
```

### 測試工具配置
```typescript
// src/test-setup.ts
import 'jest-preset-angular/setup-jest';
import { TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// 全域測試配置
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [
      BrowserAnimationsModule,
      RouterTestingModule,
      HttpClientTestingModule
    ]
  });
});

// 全域 mock 配置
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
```

## Angular 實作

### 測試輔助函數
```typescript
// src/app/shared/testing/test-helpers.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Component, Input, Output, EventEmitter } from '@angular/core';

// 測試資料生成器
export class TestDataGenerator {
  static createUser(overrides: Partial<any> = {}): any {
    return {
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createProject(overrides: Partial<any> = {}): any {
    return {
      id: 'project123',
      name: 'Test Project',
      description: 'Test Description',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createNotification(overrides: Partial<any> = {}): any {
    return {
      id: 'notif123',
      title: 'Test Notification',
      message: 'Test Message',
      type: 'info',
      isRead: false,
      createdAt: new Date(),
      ...overrides
    };
  }

  static createArray<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator);
  }
}

// 測試元件輔助函數
export class TestComponentHelper {
  static getElementByTestId<T>(fixture: ComponentFixture<T>, testId: string): DebugElement {
    return fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));
  }

  static getAllElementsByTestId<T>(fixture: ComponentFixture<T>, testId: string): DebugElement[] {
    return fixture.debugElement.queryAll(By.css(`[data-testid="${testId}"]`));
  }

  static getElementByClass<T>(fixture: ComponentFixture<T>, className: string): DebugElement {
    return fixture.debugElement.query(By.css(`.${className}`));
  }

  static getAllElementsByClass<T>(fixture: ComponentFixture<T>, className: string): DebugElement[] {
    return fixture.debugElement.queryAll(By.css(`.${className}`));
  }

  static getElementBySelector<T>(fixture: ComponentFixture<T>, selector: string): DebugElement {
    return fixture.debugElement.query(By.css(selector));
  }

  static getAllElementsBySelector<T>(fixture: ComponentFixture<T>, selector: string): DebugElement[] {
    return fixture.debugElement.queryAll(By.css(selector));
  }

  static clickElement<T>(fixture: ComponentFixture<T>, element: DebugElement): void {
    element.triggerEventHandler('click', null);
    fixture.detectChanges();
  }

  static setInputValue<T>(fixture: ComponentFixture<T>, element: DebugElement, value: string): void {
    element.nativeElement.value = value;
    element.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  static selectOption<T>(fixture: ComponentFixture<T>, element: DebugElement, value: string): void {
    element.nativeElement.value = value;
    element.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  static expectElementToExist<T>(fixture: ComponentFixture<T>, testId: string): void {
    const element = this.getElementByTestId(fixture, testId);
    expect(element).toBeTruthy();
  }

  static expectElementNotToExist<T>(fixture: ComponentFixture<T>, testId: string): void {
    const element = this.getElementByTestId(fixture, testId);
    expect(element).toBeFalsy();
  }

  static expectElementToHaveText<T>(fixture: ComponentFixture<T>, testId: string, text: string): void {
    const element = this.getElementByTestId(fixture, testId);
    expect(element.nativeElement.textContent.trim()).toBe(text);
  }

  static expectElementToHaveClass<T>(fixture: ComponentFixture<T>, testId: string, className: string): void {
    const element = this.getElementByTestId(fixture, testId);
    expect(element.nativeElement.classList.contains(className)).toBe(true);
  }

  static expectElementNotToHaveClass<T>(fixture: ComponentFixture<T>, testId: string, className: string): void {
    const element = this.getElementByTestId(fixture, testId);
    expect(element.nativeElement.classList.contains(className)).toBe(false);
  }
}

// 測試服務輔助函數
export class TestServiceHelper {
  static createMockService<T>(methods: (keyof T)[]): jasmine.SpyObj<T> {
    return jasmine.createSpyObj<T>(methods);
  }

  static createMockObservable<T>(data: T): jasmine.SpyObj<Observable<T>> {
    const observable = jasmine.createSpyObj<Observable<T>>(['subscribe', 'pipe']);
    observable.subscribe.and.returnValue({ unsubscribe: () => {} });
    observable.pipe.and.returnValue(observable);
    return observable;
  }

  static createMockPromise<T>(data: T): Promise<T> {
    return Promise.resolve(data);
  }

  static createMockPromiseReject<T>(error: any): Promise<T> {
    return Promise.reject(error);
  }
}

// 測試表單輔助函數
export class TestFormHelper {
  static createFormGroup(controls: { [key: string]: any }): FormGroup {
    return new FormGroup(controls);
  }

  static createFormControl(value: any = null): FormControl {
    return new FormControl(value);
  }

  static setFormValue(form: FormGroup, value: any): void {
    form.patchValue(value);
  }

  static expectFormToBeValid(form: FormGroup): void {
    expect(form.valid).toBe(true);
  }

  static expectFormToBeInvalid(form: FormGroup): void {
    expect(form.invalid).toBe(true);
  }

  static expectFormToHaveError(form: FormGroup, controlName: string, errorType: string): void {
    const control = form.get(controlName);
    expect(control?.hasError(errorType)).toBe(true);
  }

  static expectFormNotToHaveError(form: FormGroup, controlName: string, errorType: string): void {
    const control = form.get(controlName);
    expect(control?.hasError(errorType)).toBe(false);
  }
}

// 測試路由輔助函數
export class TestRouterHelper {
  static createMockRouter(): jasmine.SpyObj<Router> {
    return jasmine.createSpyObj<Router>([
      'navigate',
      'navigateByUrl',
      'isActive',
      'events'
    ]);
  }

  static createMockActivatedRoute(params: any = {}, queryParams: any = {}): any {
    return {
      params: of(params),
      queryParams: of(queryParams),
      snapshot: {
        params,
        queryParams
      }
    };
  }
}

// 測試 HTTP 輔助函數
export class TestHttpHelper {
  static createMockHttpClient(): jasmine.SpyObj<HttpClient> {
    return jasmine.createSpyObj<HttpClient>([
      'get',
      'post',
      'put',
      'delete',
      'patch'
    ]);
  }

  static createMockHttpResponse<T>(data: T, status: number = 200): HttpResponse<T> {
    return new HttpResponse<T>({
      body: data,
      status,
      statusText: 'OK'
    });
  }

  static createMockHttpError(status: number = 500, message: string = 'Internal Server Error'): HttpErrorResponse {
    return new HttpErrorResponse({
      status,
      statusText: message
    });
  }
}
```

### Mock 服務
```typescript
// src/app/shared/testing/mocks/mock-services.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class MockUserService {
  private users = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ];

  getUsers(): Observable<any[]> {
    return of(this.users).pipe(delay(100));
  }

  getUser(id: string): Observable<any> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      return of(user).pipe(delay(100));
    }
    return throwError(() => new Error('User not found'));
  }

  createUser(user: any): Observable<any> {
    const newUser = { ...user, id: Date.now().toString() };
    this.users.push(newUser);
    return of(newUser).pipe(delay(100));
  }

  updateUser(id: string, updates: any): Observable<any> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...updates };
      return of(this.users[userIndex]).pipe(delay(100));
    }
    return throwError(() => new Error('User not found'));
  }

  deleteUser(id: string): Observable<void> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      this.users.splice(userIndex, 1);
      return of(undefined).pipe(delay(100));
    }
    return throwError(() => new Error('User not found'));
  }
}

@Injectable()
export class MockNotificationService {
  private notifications = [
    { id: '1', title: 'Test Notification 1', message: 'Test Message 1', isRead: false },
    { id: '2', title: 'Test Notification 2', message: 'Test Message 2', isRead: true }
  ];

  getNotifications(): Observable<any[]> {
    return of(this.notifications).pipe(delay(100));
  }

  markAsRead(id: string): Observable<void> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      return of(undefined).pipe(delay(100));
    }
    return throwError(() => new Error('Notification not found'));
  }

  markAllAsRead(): Observable<void> {
    this.notifications.forEach(n => n.isRead = true);
    return of(undefined).pipe(delay(100));
  }
}

@Injectable()
export class MockAuthService {
  private isAuthenticated = false;
  private currentUser = null;

  login(credentials: any): Observable<any> {
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      this.isAuthenticated = true;
      this.currentUser = { id: '1', email: credentials.email, name: 'Test User' };
      return of(this.currentUser).pipe(delay(100));
    }
    return throwError(() => new Error('Invalid credentials'));
  }

  logout(): Observable<void> {
    this.isAuthenticated = false;
    this.currentUser = null;
    return of(undefined).pipe(delay(100));
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getCurrentUser(): any {
    return this.currentUser;
  }
}
```

### 測試工具元件
```typescript
// src/app/shared/testing/test-components.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-test-button',
  template: `
    <button 
      [data-testid]="testId"
      [class]="className"
      [disabled]="disabled"
      (click)="onClick.emit($event)">
      {{ text }}
    </button>
  `
})
export class TestButtonComponent {
  @Input() text = 'Test Button';
  @Input() testId = 'test-button';
  @Input() className = '';
  @Input() disabled = false;
  @Output() onClick = new EventEmitter<Event>();
}

@Component({
  selector: 'app-test-input',
  template: `
    <input 
      [data-testid]="testId"
      [class]="className"
      [type]="type"
      [placeholder]="placeholder"
      [value]="value"
      (input)="onInput.emit($event)"
      (change)="onChange.emit($event)">
  `
})
export class TestInputComponent {
  @Input() testId = 'test-input';
  @Input() className = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() value = '';
  @Output() onInput = new EventEmitter<Event>();
  @Output() onChange = new EventEmitter<Event>();
}

@Component({
  selector: 'app-test-modal',
  template: `
    <div 
      *ngIf="visible"
      [data-testid]="testId"
      class="modal-overlay"
      (click)="onOverlayClick.emit($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button 
            data-testid="modal-close"
            (click)="onClose.emit()">
            ×
          </button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 500px;
      width: 90%;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .modal-footer {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class TestModalComponent {
  @Input() testId = 'test-modal';
  @Input() title = 'Test Modal';
  @Input() visible = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onOverlayClick = new EventEmitter<Event>();
}
```

### 測試範例
```typescript
// src/app/shared/components/button/button.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { TestComponentHelper, TestDataGenerator } from '../../testing/test-helpers';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  describe('基本功能', () => {
    it('應該創建元件', () => {
      expect(component).toBeTruthy();
    });

    it('應該顯示正確的文字', () => {
      component.text = '測試按鈕';
      fixture.detectChanges();

      TestComponentHelper.expectElementToHaveText(fixture, 'button', '測試按鈕');
    });

    it('應該在點擊時發出事件', () => {
      spyOn(component.onClick, 'emit');
      
      const button = TestComponentHelper.getElementByTestId(fixture, 'button');
      TestComponentHelper.clickElement(fixture, button);

      expect(component.onClick.emit).toHaveBeenCalled();
    });

    it('應該在禁用時不發出事件', () => {
      component.disabled = true;
      fixture.detectChanges();
      
      spyOn(component.onClick, 'emit');
      
      const button = TestComponentHelper.getElementByTestId(fixture, 'button');
      TestComponentHelper.clickElement(fixture, button);

      expect(component.onClick.emit).not.toHaveBeenCalled();
    });
  });

  describe('樣式測試', () => {
    it('應該應用正確的 CSS 類別', () => {
      component.variant = 'primary';
      component.size = 'large';
      fixture.detectChanges();

      const button = TestComponentHelper.getElementByTestId(fixture, 'button');
      expect(button.nativeElement.classList.contains('btn-primary')).toBe(true);
      expect(button.nativeElement.classList.contains('btn-large')).toBe(true);
    });

    it('應該在禁用時應用禁用樣式', () => {
      component.disabled = true;
      fixture.detectChanges();

      const button = TestComponentHelper.getElementByTestId(fixture, 'button');
      expect(button.nativeElement.classList.contains('btn-disabled')).toBe(true);
    });
  });

  describe('無障礙測試', () => {
    it('應該有正確的 aria-label', () => {
      component.ariaLabel = '測試按鈕';
      fixture.detectChanges();

      const button = TestComponentHelper.getElementByTestId(fixture, 'button');
      expect(button.nativeElement.getAttribute('aria-label')).toBe('測試按鈕');
    });

    it('應該在禁用時有正確的 aria-disabled', () => {
      component.disabled = true;
      fixture.detectChanges();

      const button = TestComponentHelper.getElementByTestId(fixture, 'button');
      expect(button.nativeElement.getAttribute('aria-disabled')).toBe('true');
    });
  });
});
```

### 整合測試範例
```typescript
// src/app/shared/components/smart-table/smart-table.integration.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartTableComponent } from './smart-table.component';
import { TestComponentHelper, TestDataGenerator } from '../../testing/test-helpers';
import { MockUserService } from '../../testing/mocks/mock-services';

describe('SmartTableComponent Integration Tests', () => {
  let component: SmartTableComponent;
  let fixture: ComponentFixture<SmartTableComponent>;
  let mockUserService: MockUserService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartTableComponent],
      providers: [
        { provide: 'UserService', useClass: MockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SmartTableComponent);
    component = fixture.componentInstance;
    mockUserService = TestBed.inject('UserService') as MockUserService;
  });

  describe('資料載入', () => {
    it('應該載入並顯示用戶資料', async () => {
      const users = TestDataGenerator.createArray(() => TestDataGenerator.createUser(), 5);
      component.config = {
        data: users,
        columns: [
          { title: '姓名', key: 'name' },
          { title: '電子郵件', key: 'email' }
        ]
      };

      fixture.detectChanges();
      await fixture.whenStable();

      const rows = TestComponentHelper.getAllElementsBySelector(fixture, 'tbody tr');
      expect(rows.length).toBe(5);
    });

    it('應該處理空資料', () => {
      component.config = {
        data: [],
        columns: [
          { title: '姓名', key: 'name' }
        ]
      };

      fixture.detectChanges();

      const rows = TestComponentHelper.getAllElementsBySelector(fixture, 'tbody tr');
      expect(rows.length).toBe(0);
    });
  });

  describe('排序功能', () => {
    it('應該按姓名排序', () => {
      const users = [
        TestDataGenerator.createUser({ name: 'Charlie' }),
        TestDataGenerator.createUser({ name: 'Alice' }),
        TestDataGenerator.createUser({ name: 'Bob' })
      ];

      component.config = {
        data: users,
        columns: [
          { title: '姓名', key: 'name', sortable: true }
        ]
      };

      fixture.detectChanges();

      const nameColumn = TestComponentHelper.getElementByTestId(fixture, 'column-name');
      TestComponentHelper.clickElement(fixture, nameColumn);

      const firstRow = TestComponentHelper.getElementBySelector(fixture, 'tbody tr:first-child');
      expect(firstRow.nativeElement.textContent).toContain('Alice');
    });
  });

  describe('篩選功能', () => {
    it('應該篩選資料', () => {
      const users = [
        TestDataGenerator.createUser({ name: 'Alice', email: 'alice@example.com' }),
        TestDataGenerator.createUser({ name: 'Bob', email: 'bob@example.com' }),
        TestDataGenerator.createUser({ name: 'Charlie', email: 'charlie@example.com' })
      ];

      component.config = {
        data: users,
        columns: [
          { title: '姓名', key: 'name' },
          { title: '電子郵件', key: 'email' }
        ]
      };

      fixture.detectChanges();

      const searchInput = TestComponentHelper.getElementByTestId(fixture, 'search-input');
      TestComponentHelper.setInputValue(fixture, searchInput, 'Alice');

      const rows = TestComponentHelper.getAllElementsBySelector(fixture, 'tbody tr');
      expect(rows.length).toBe(1);
      expect(rows[0].nativeElement.textContent).toContain('Alice');
    });
  });

  describe('分頁功能', () => {
    it('應該正確分頁', () => {
      const users = TestDataGenerator.createArray(() => TestDataGenerator.createUser(), 25);
      
      component.config = {
        data: users,
        columns: [
          { title: '姓名', key: 'name' }
        ],
        pagination: {
          pageSize: 10
        }
      };

      fixture.detectChanges();

      const rows = TestComponentHelper.getAllElementsBySelector(fixture, 'tbody tr');
      expect(rows.length).toBe(10);

      const nextButton = TestComponentHelper.getElementByTestId(fixture, 'pagination-next');
      TestComponentHelper.clickElement(fixture, nextButton);

      const rowsPage2 = TestComponentHelper.getAllElementsBySelector(fixture, 'tbody tr');
      expect(rowsPage2.length).toBe(10);
    });
  });
});
```

### 端到端測試範例
```typescript
// e2e/shared-components.e2e-spec.ts
import { browser, by, element } from 'protractor';

describe('Shared Components E2E Tests', () => {
  beforeEach(() => {
    browser.get('/test-components');
  });

  describe('Button Component', () => {
    it('應該點擊按鈕並顯示結果', () => {
      const button = element(by.css('[data-testid="test-button"]'));
      const result = element(by.css('[data-testid="click-result"]'));

      button.click();
      expect(result.getText()).toBe('Button clicked!');
    });

    it('應該在禁用時不響應點擊', () => {
      const button = element(by.css('[data-testid="disabled-button"]'));
      const result = element(by.css('[data-testid="click-result"]'));

      button.click();
      expect(result.getText()).toBe('');
    });
  });

  describe('SmartTable Component', () => {
    it('應該載入並顯示表格資料', () => {
      const table = element(by.css('[data-testid="smart-table"]'));
      const rows = element.all(by.css('tbody tr'));

      expect(table.isPresent()).toBe(true);
      expect(rows.count()).toBeGreaterThan(0);
    });

    it('應該排序表格資料', () => {
      const nameColumn = element(by.css('[data-testid="column-name"]'));
      const firstRow = element(by.css('tbody tr:first-child'));

      nameColumn.click();
      expect(firstRow.getText()).toContain('Alice');
    });

    it('應該篩選表格資料', () => {
      const searchInput = element(by.css('[data-testid="search-input"]'));
      const rows = element.all(by.css('tbody tr'));

      searchInput.sendKeys('Alice');
      expect(rows.count()).toBe(1);
    });
  });
});
```

## 測試最佳實踐

### 測試命名規範
```typescript
// 測試檔案命名
// component-name.component.spec.ts
// service-name.service.spec.ts
// pipe-name.pipe.spec.ts

// 測試描述命名
describe('ComponentName', () => {
  describe('基本功能', () => {
    it('應該創建元件', () => {
      // 測試實作
    });
  });

  describe('用戶互動', () => {
    it('應該在點擊時發出事件', () => {
      // 測試實作
    });
  });

  describe('錯誤處理', () => {
    it('應該處理無效輸入', () => {
      // 測試實作
    });
  });
});
```

### 測試覆蓋率目標
```typescript
// 測試覆蓋率配置
const coverageThresholds = {
  global: {
    branches: 80,      // 分支覆蓋率
    functions: 80,     // 函數覆蓋率
    lines: 80,         // 行覆蓋率
    statements: 80     // 語句覆蓋率
  },
  // 特定檔案覆蓋率
  './src/app/shared/components/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
};
```

## AI Agent 友好特性

### 1. 清晰的測試結構
- 每個測試都有明確的目標和範圍
- 測試分類清晰且易於理解
- 提供完整的測試覆蓋

### 2. 完整的測試工具
- 提供豐富的測試輔助函數
- 包含 mock 服務和測試資料生成器
- 支援不同層級的測試

### 3. 可維護性
- 測試程式碼結構清晰
- 提供重複使用的測試工具
- 易於擴展和修改

### 4. 文件完整性
- 每個測試都有詳細的說明
- 提供測試最佳實踐指南
- 包含常見測試場景的範例

## 相關檔案
- `Button.md` - 按鈕元件測試
- `Modal.md` - 彈窗元件測試
- `Table.md` - 表格元件測試
- `SmartTable.md` - 智能表格元件測試