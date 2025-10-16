# Angular 20 遷移指南

## 概述

本指南提供從舊版 Angular 遷移到 Angular 20 的完整步驟，專注於 ng-alain 企業級建築工程管理平台的現代化改造。

## 遷移前準備

### 1. 環境檢查
```bash
# 檢查當前 Angular 版本
ng version

# 檢查 Node.js 版本 (需要 >= 18.0.0)
node --version

# 檢查 TypeScript 版本 (需要 >= 5.0.0)
tsc --version
```

### 2. 備份專案
```bash
# 創建備份分支
git checkout -b angular-20-migration-backup
git add .
git commit -m "Backup before Angular 20 migration"

# 創建遷移分支
git checkout -b angular-20-migration
```

## 核心遷移步驟

### 1. 更新 Angular 核心

#### 1.1 更新 package.json
```json
{
  "dependencies": {
    "@angular/animations": "^20.3.0",
    "@angular/cdk": "^20.3.0",
    "@angular/common": "^20.3.0",
    "@angular/compiler": "^20.3.0",
    "@angular/core": "^20.3.0",
    "@angular/forms": "^20.3.0",
    "@angular/platform-browser": "^20.3.0",
    "@angular/platform-browser-dynamic": "^20.3.0",
    "@angular/router": "^20.3.0",
    "@angular/service-worker": "^20.3.0",
    "ng-zorro-antd": "^20.3.1",
    "ng-alain": "^20.0.2",
    "@delon/abc": "^20.0.2",
    "@delon/theme": "^20.0.2",
    "@delon/util": "^20.0.2",
    "@delon/auth": "^20.0.2",
    "@delon/acl": "^20.0.2",
    "@delon/cache": "^20.0.2",
    "@delon/form": "^20.0.2",
    "@delon/chart": "^20.0.2",
    "rxjs": "^7.8.0",
    "zone.js": "^0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^20.3.0",
    "@angular/cli": "^20.3.0",
    "@angular/compiler-cli": "^20.3.0",
    "typescript": "^5.9.2"
  }
}
```

#### 1.2 更新依賴
```bash
# 清理 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 安裝新依賴
yarn install

# 或使用 npm
npm install
```

### 2. 遷移到 Standalone Components

#### 2.1 更新 main.ts
```typescript
// main.ts - 舊版本
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

// main.ts - Angular 20 版本
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { routes } from './app/routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // ng-alain 提供者
    provideDelonTheme({
      default: 'dark',
      storageKey: 'ng-alain-theme'
    }),
    provideDelonAuth({
      loginUrl: '/auth/login',
      tokenSendKey: 'Authorization',
      tokenSendTemplate: 'Bearer ${token}',
      tokenSendPlace: 'header'
    }),
    provideDelonACL({
      guard_url: '/403'
    })
  ]
}).catch(err => console.error(err));
```

#### 2.2 轉換組件為 Standalone
```typescript
// 舊版本組件
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.less']
})
export class UserListComponent {
  // 組件邏輯
}

// Angular 20 Standalone 組件
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ng-zorro-antd 組件
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NzTableModule,
    NzButtonModule,
    NzCardModule,
    NzModalModule,
    NzFormModule,
    NzInputModule
  ],
  template: `
    <nz-card nzTitle="用戶列表">
      <nz-table [nzData]="users()" [nzLoading]="loading()">
        <thead>
          <tr>
            <th nzColumnKey="name" nzSort>姓名</th>
            <th nzColumnKey="email" nzSort>郵箱</th>
            <th nzColumnKey="role" nzSort>角色</th>
            <th nzColumnKey="action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users()">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>
              <button nz-button nzType="primary" nzSize="small" (click)="edit(user)">
                編輯
              </button>
              <button nz-button nzType="default" nzSize="small" nzDanger (click)="delete(user)">
                刪除
              </button>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`
    /* 組件樣式 */
  `]
})
export class UserListComponent {
  // Signals
  users = signal<User[]>([]);
  loading = signal(false);
  
  // Computed
  filteredUsers = computed(() => {
    return this.users().filter(user => user.status === 'active');
  });
  
  edit(user: User): void {
    // 編輯邏輯
  }
  
  delete(user: User): void {
    // 刪除邏輯
  }
}
```

### 3. 遷移到 Signals

#### 3.1 狀態管理遷移
```typescript
// 舊版本 - RxJS BehaviorSubject
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$: Observable<User[]> = this.usersSubject.asObservable();
  
  getUsers(): Observable<User[]> {
    return this.users$;
  }
  
  addUser(user: User): void {
    const currentUsers = this.usersSubject.value;
    this.usersSubject.next([...currentUsers, user]);
  }
}

// Angular 20 - Signals
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Signals
  private _users = signal<User[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  // Computed
  users = computed(() => this._users());
  loading = computed(() => this._loading());
  error = computed(() => this._error());
  
  // 只讀信號
  readonly activeUsers = computed(() => 
    this._users().filter(user => user.status === 'active')
  );
  
  getUsers(): User[] {
    return this.users();
  }
  
  addUser(user: User): void {
    this._users.update(users => [...users, user]);
  }
  
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }
  
  setError(error: string | null): void {
    this._error.set(error);
  }
}
```

#### 3.2 組件中的 Signals 使用
```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <h2>用戶儀表板</h2>
      
      <!-- 使用 computed 信號 -->
      <div class="stats">
        <nz-statistic 
          nzTitle="總用戶數" 
          [nzValue]="totalUsers()"
          [nzLoading]="loading()">
        </nz-statistic>
        
        <nz-statistic 
          nzTitle="活躍用戶" 
          [nzValue]="activeUsers()"
          [nzLoading]="loading()">
        </nz-statistic>
      </div>
      
      <!-- 使用條件渲染 -->
      @if (loading()) {
        <nz-spin nzSimple [nzSize]="'large'">
          <div style="height: 200px;"></div>
        </nz-spin>
      } @else if (error()) {
        <nz-alert 
          nzType="error" 
          [nzMessage]="error()"
          nzShowIcon>
        </nz-alert>
      } @else {
        <nz-table [nzData]="users()">
          <!-- 表格內容 -->
        </nz-table>
      }
    </div>
  `
})
export class UserDashboardComponent {
  // 輸入信號
  userId = input<string>();
  
  // 狀態信號
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // 計算信號
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => 
    this.users().filter(user => user.status === 'active').length
  );
  
  // 效果
  constructor() {
    effect(() => {
      const id = this.userId();
      if (id) {
        this.loadUser(id);
      }
    });
  }
  
  private loadUser(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    // 模擬 API 調用
    setTimeout(() => {
      this.users.set([{ id, name: 'User ' + id, status: 'active' }]);
      this.loading.set(false);
    }, 1000);
  }
}
```

### 4. 遷移到現代控制流程

#### 4.1 模板語法更新
```typescript
// 舊版本模板語法
template: `
  <div *ngIf="loading; else content">
    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
  </div>
  
  <ng-template #content>
    <div *ngIf="error; else userList">
      <nz-alert nzType="error" [nzMessage]="error" nzShowIcon></nz-alert>
    </div>
    
    <ng-template #userList>
      <div *ngFor="let user of users; trackBy: trackByUserId">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
      </div>
    </ng-template>
  </ng-template>
`

// Angular 20 現代控制流程
template: `
  @if (loading()) {
    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
  } @else if (error()) {
    <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon></nz-alert>
  } @else {
    @for (user of users(); track user.id) {
      <div class="user-card">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
        
        @switch (user.role) {
          @case ('admin') {
            <nz-tag nzColor="red">管理員</nz-tag>
          }
          @case ('user') {
            <nz-tag nzColor="blue">用戶</nz-tag>
          }
          @default {
            <nz-tag nzColor="default">未知</nz-tag>
          }
        }
      </div>
    } @empty {
      <nz-empty nzNotFoundContent="暫無用戶數據"></nz-empty>
    }
  }
`
```

#### 4.2 表單控制流程
```typescript
// 舊版本表單驗證
template: `
  <form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="form-group">
      <label>姓名</label>
      <input formControlName="name" />
      <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched">
        <div *ngIf="form.get('name')?.errors?.['required']">姓名為必填項</div>
        <div *ngIf="form.get('name')?.errors?.['minlength']">姓名至少2個字符</div>
      </div>
    </div>
  </form>
`

// Angular 20 現代表單驗證
template: `
  <form [formGroup]="form" (ngSubmit)="onSubmit()">
    <nz-form-item>
      <nz-form-label nzRequired>姓名</nz-form-label>
      <nz-form-control nzErrorTip="請輸入姓名">
        <input nz-input formControlName="name" placeholder="請輸入姓名" />
      </nz-form-control>
    </nz-form-item>
    
    <nz-form-item>
      <nz-form-label nzRequired>郵箱</nz-form-label>
      <nz-form-control nzErrorTip="請輸入有效的郵箱地址">
        <input nz-input formControlName="email" placeholder="請輸入郵箱" />
      </nz-form-control>
    </nz-form-item>
    
    <nz-form-item>
      <nz-form-control>
        <button 
          nz-button 
          nzType="primary" 
          [nzLoading]="loading()" 
          [disabled]="form.invalid">
          提交
        </button>
      </nz-form-control>
    </nz-form-item>
  </form>
`
```

### 5. 遷移到 Typed Forms

#### 5.1 強型別表單
```typescript
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';

// 定義表單介面
interface UserForm {
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="onSubmit()">
      <nz-form-item>
        <nz-form-label nzRequired>姓名</nz-form-label>
        <nz-form-control nzErrorTip="請輸入姓名">
          <input nz-input formControlName="name" placeholder="請輸入姓名" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label nzRequired>郵箱</nz-form-label>
        <nz-form-control nzErrorTip="請輸入有效的郵箱地址">
          <input nz-input formControlName="email" placeholder="請輸入郵箱" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label nzRequired>年齡</nz-form-label>
        <nz-form-control nzErrorTip="請輸入年齡">
          <input nz-input type="number" formControlName="age" placeholder="請輸入年齡" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-control>
          <button 
            nz-button 
            nzType="primary" 
            [nzLoading]="loading()" 
            [disabled]="form.invalid">
            提交
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class UserFormComponent {
  form: FormGroup<UserForm>;
  loading = signal(false);
  
  constructor(private fb: FormBuilder) {
    // 使用 nonNullable 確保非空值
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      age: [0, [Validators.required, Validators.min(18)]],
      role: ['user' as const, [Validators.required]]
    });
  }
  
  onSubmit(): void {
    if (this.form.valid) {
      this.loading.set(true);
      
      // 獲取強型別的表單值
      const formValue: UserForm = this.form.value;
      console.log('Form data:', formValue);
      
      // 模擬 API 調用
      setTimeout(() => {
        this.loading.set(false);
        this.form.reset();
      }, 1000);
    }
  }
}
```

### 6. 遷移到 Signal Inputs

#### 6.1 輸入信號
```typescript
import { Component, input, output, signal, computed } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [NzCardModule, NzButtonModule, NzTagModule],
  template: `
    <nz-card 
      [nzTitle]="user().name" 
      [nzExtra]="extraTemplate"
      [nzLoading]="loading()">
      
      <nz-card-meta 
        [nzDescription]="user().email">
        <nz-avatar nzIcon="user" [nzSrc]="user().avatar"></nz-avatar>
      </nz-card-meta>
      
      <div class="user-info">
        <p><strong>角色:</strong> 
          <nz-tag [nzColor]="getRoleColor(user().role)">
            {{ user().role }}
          </nz-tag>
        </p>
        <p><strong>狀態:</strong> 
          <nz-tag [nzColor]="getStatusColor(user().status)">
            {{ user().status }}
          </nz-tag>
        </p>
        <p><strong>創建時間:</strong> {{ user().createdAt | date:'short' }}</p>
      </div>
      
      <div class="actions">
        <button 
          nz-button 
          nzType="primary" 
          nzSize="small"
          (click)="onEdit.emit(user())">
          編輯
        </button>
        <button 
          nz-button 
          nzType="default" 
          nzSize="small" 
          nzDanger
          (click)="onDelete.emit(user())">
          刪除
        </button>
      </div>
    </nz-card>
    
    <ng-template #extraTemplate>
      <button nz-button nzType="text" nzSize="small">
        <span nz-icon nzType="more"></span>
      </button>
    </ng-template>
  `,
  styles: [`
    .user-info {
      margin: 16px 0;
    }
    
    .user-info p {
      margin: 8px 0;
    }
    
    .actions {
      margin-top: 16px;
      display: flex;
      gap: 8px;
    }
  `]
})
export class UserCardComponent {
  // 輸入信號
  user = input.required<User>();
  loading = input(false);
  
  // 輸出信號
  onEdit = output<User>();
  onDelete = output<User>();
  
  // 計算信號
  isAdmin = computed(() => this.user().role === 'admin');
  isActive = computed(() => this.user().status === 'active');
  
  getRoleColor(role: string): string {
    const colorMap: Record<string, string> = {
      'admin': 'red',
      'user': 'blue',
      'guest': 'default'
    };
    return colorMap[role] || 'default';
  }
  
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'active': 'green',
      'inactive': 'red',
      'pending': 'orange'
    };
    return colorMap[status] || 'default';
  }
}
```

### 7. 遷移到 Signal Queries

#### 7.1 視圖查詢
```typescript
import { Component, viewChild, viewChildren, signal, computed } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NzTableModule, NzButtonModule],
  template: `
    <nz-table 
      #dataTable
      [nzData]="data()" 
      [nzLoading]="loading()"
      [nzPageSize]="pageSize()"
      [nzTotal]="total()">
      
      <thead>
        <tr>
          <th nzColumnKey="name" nzSort>姓名</th>
          <th nzColumnKey="email" nzSort>郵箱</th>
          <th nzColumnKey="action">操作</th>
        </tr>
      </thead>
      
      <tbody>
        <tr *ngFor="let item of data()">
          <td>{{ item.name }}</td>
          <td>{{ item.email }}</td>
          <td>
            <button nz-button nzType="primary" nzSize="small" (click)="edit(item)">
              編輯
            </button>
          </td>
        </tr>
      </tbody>
    </nz-table>
    
    <div class="table-actions">
      <button nz-button (click)="refresh()">刷新</button>
      <button nz-button (click)="export()">導出</button>
    </div>
  `
})
export class DataTableComponent {
  // 視圖查詢
  dataTable = viewChild('dataTable');
  
  // 狀態信號
  data = signal<any[]>([]);
  loading = signal(false);
  pageSize = signal(10);
  total = signal(0);
  
  // 計算信號
  hasData = computed(() => this.data().length > 0);
  isEmpty = computed(() => !this.loading() && this.data().length === 0);
  
  refresh(): void {
    this.loading.set(true);
    // 模擬 API 調用
    setTimeout(() => {
      this.data.set([
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' }
      ]);
      this.loading.set(false);
    }, 1000);
  }
  
  export(): void {
    // 使用視圖查詢
    const table = this.dataTable();
    if (table) {
      // 導出表格數據
      console.log('Exporting data:', this.data());
    }
  }
  
  edit(item: any): void {
    console.log('Editing item:', item);
  }
}
```

## 遷移檢查清單

### 1. 核心功能檢查
- [ ] Angular 20 核心依賴更新
- [ ] TypeScript 5.9+ 支援
- [ ] Node.js 18+ 環境
- [ ] 所有依賴包版本相容

### 2. 組件遷移檢查
- [ ] 轉換為 Standalone Components
- [ ] 移除 NgModule 依賴
- [ ] 更新組件導入
- [ ] 測試組件功能

### 3. 狀態管理檢查
- [ ] 遷移到 Signals
- [ ] 更新 RxJS 使用
- [ ] 測試狀態更新
- [ ] 驗證計算屬性

### 4. 模板語法檢查
- [ ] 更新控制流程語法
- [ ] 遷移到 @if/@for/@switch
- [ ] 更新條件渲染
- [ ] 測試模板功能

### 5. 表單檢查
- [ ] 遷移到 Typed Forms
- [ ] 更新驗證邏輯
- [ ] 測試表單提交
- [ ] 驗證型別安全

### 6. 路由檢查
- [ ] 更新路由配置
- [ ] 測試路由導航
- [ ] 驗證守衛功能
- [ ] 檢查懶載入

### 7. 測試檢查
- [ ] 更新測試配置
- [ ] 修復測試錯誤
- [ ] 提高測試覆蓋率
- [ ] 驗證端對端測試

## 常見問題與解決方案

### 1. 依賴衝突
```bash
# 清理並重新安裝
rm -rf node_modules package-lock.json
yarn install

# 檢查依賴樹
yarn why @angular/core
```

### 2. 型別錯誤
```typescript
// 更新型別定義
import { Component, signal, computed } from '@angular/core';

// 使用正確的型別
const data = signal<User[]>([]);
const loading = signal<boolean>(false);
```

### 3. 模板語法錯誤
```typescript
// 舊語法
*ngIf="condition"

// 新語法
@if (condition) { ... }
```

### 4. 服務注入問題
```typescript
// 確保服務在 providers 中註冊
bootstrapApplication(AppComponent, {
  providers: [
    UserService,
    // 其他服務
  ]
});
```

## 效能優化建議

### 1. 使用 OnPush 策略
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
  // 組件邏輯
}
```

### 2. 實作 TrackBy 函數
```typescript
trackByUserId(index: number, user: User): string {
  return user.id;
}
```

### 3. 使用 Lazy Loading
```typescript
const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/user-list.component').then(m => m.UserListComponent)
  }
];
```

### 4. 優化 Bundle 大小
```typescript
// 使用 tree-shaking 友好的導入
import { NzButtonModule } from 'ng-zorro-antd/button';
// 而不是
import { NzButtonModule } from 'ng-zorro-antd';
```

## 參考資源

- [Angular 20 官方文件](https://v20.angular.dev/)
- [Angular 遷移指南](https://angular.io/guide/updating)
- [ng-zorro-antd 文件](https://ng.ant.design/)
- [@delon 套件文件](https://github.com/ng-alain/delon)

---

*本文件為 Angular 20 遷移指南，旨在提供完整的遷移步驟和最佳實踐。*