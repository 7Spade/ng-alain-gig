# 程式碼生成模式

## 概述

本文件定義了 AI Agent 在開發 ng-alain 企業級建築工程管理平台時使用的程式碼生成模式，確保生成的程式碼符合最佳實踐和專案規範。

## Angular 20 現代化模式

### 1. Standalone Components 模式

#### 基本結構
```typescript
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ng-zorro-antd 組件導入
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-feature-name',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    // ng-zorro-antd 組件
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzTableModule,
    NzModalModule
  ],
  template: `
    <nz-card nzTitle="功能標題">
      <!-- 組件內容 -->
    </nz-card>
  `,
  styles: [`
    /* 組件樣式 */
  `]
})
export class FeatureNameComponent {
  // 組件邏輯
}
```

#### 進階模式 - 帶有 Signals
```typescript
import { Component, signal, computed, effect } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NzTableModule, NzButtonModule, NzModalModule],
  template: `
    <nz-table 
      [nzData]="data()" 
      [nzLoading]="loading()"
      [nzPageSize]="pageSize()"
      [nzTotal]="total()"
      (nzPageIndexChange)="onPageChange($event)"
    >
      <thead>
        <tr>
          <th nzColumnKey="name" nzSort>名稱</th>
          <th nzColumnKey="status" nzSort>狀態</th>
          <th nzColumnKey="action">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of data()">
          <td>{{ item.name }}</td>
          <td>
            <nz-tag [nzColor]="getStatusColor(item.status)">
              {{ item.status }}
            </nz-tag>
          </td>
          <td>
            <button nz-button nzType="primary" nzSize="small" (click)="edit(item)">
              編輯
            </button>
            <button nz-button nzType="default" nzSize="small" nzDanger (click)="delete(item)">
              刪除
            </button>
          </td>
        </tr>
      </tbody>
    </nz-table>
  `
})
export class DataTableComponent {
  // Signals
  data = signal<any[]>([]);
  loading = signal(false);
  pageSize = signal(10);
  total = signal(0);
  
  // Computed
  filteredData = computed(() => {
    return this.data().filter(item => item.status === 'active');
  });
  
  // Effects
  constructor() {
    effect(() => {
      console.log('Data changed:', this.data());
    });
  }
  
  onPageChange(page: number): void {
    // 分頁邏輯
  }
  
  edit(item: any): void {
    // 編輯邏輯
  }
  
  delete(item: any): void {
    // 刪除邏輯
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

### 2. 服務模式

#### 基礎服務模式
```typescript
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ng-zorro-antd 服務
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

@Injectable({
  providedIn: 'root'
})
export class BaseService<T> {
  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<T[]>([]);
  
  // Computed
  hasData = computed(() => this.data().length > 0);
  isLoading = computed(() => this.loading());
  
  constructor(
    protected http: HttpClient,
    protected message: NzMessageService,
    protected modal: NzModalService,
    protected apiUrl: string
  ) {}
  
  // 通用 CRUD 方法
  getAll(): Observable<T[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.http.get<T[]>(this.apiUrl).pipe(
      map(data => {
        this.data.set(data);
        this.loading.set(false);
        return data;
      }),
      catchError(error => {
        this.error.set(error.message);
        this.loading.set(false);
        this.message.error('獲取數據失敗');
        throw error;
      })
    );
  }
  
  getById(id: string): Observable<T> {
    this.loading.set(true);
    return this.http.get<T>(`${this.apiUrl}/${id}`).pipe(
      map(data => {
        this.loading.set(false);
        return data;
      }),
      catchError(error => {
        this.loading.set(false);
        this.message.error('獲取數據失敗');
        throw error;
      })
    );
  }
  
  create(item: Partial<T>): Observable<T> {
    this.loading.set(true);
    return this.http.post<T>(this.apiUrl, item).pipe(
      map(data => {
        this.data.update(items => [...items, data]);
        this.loading.set(false);
        this.message.success('創建成功');
        return data;
      }),
      catchError(error => {
        this.loading.set(false);
        this.message.error('創建失敗');
        throw error;
      })
    );
  }
  
  update(id: string, item: Partial<T>): Observable<T> {
    this.loading.set(true);
    return this.http.put<T>(`${this.apiUrl}/${id}`, item).pipe(
      map(data => {
        this.data.update(items => 
          items.map(i => (i as any).id === id ? data : i)
        );
        this.loading.set(false);
        this.message.success('更新成功');
        return data;
      }),
      catchError(error => {
        this.loading.set(false);
        this.message.error('更新失敗');
        throw error;
      })
    );
  }
  
  delete(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        this.data.update(items => items.filter(i => (i as any).id !== id));
        this.loading.set(false);
        this.message.success('刪除成功');
      }),
      catchError(error => {
        this.loading.set(false);
        this.message.error('刪除失敗');
        throw error;
      })
    );
  }
}
```

#### 專用服務模式
```typescript
import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService<User> {
  constructor(
    http: HttpClient,
    message: NzMessageService,
    modal: NzModalService
  ) {
    super(http, message, modal, '/api/users');
  }
  
  // 用戶專用方法
  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?role=${role}`);
  }
  
  updateProfile(userId: string, profile: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/profile`, profile);
  }
  
  changePassword(userId: string, passwordData: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/change-password`, passwordData);
  }
}
```

### 3. 表單模式

#### 響應式表單模式
```typescript
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzDatePickerModule
  ],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="onSubmit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>姓名</nz-form-label>
        <nz-form-control [nzSpan]="18" nzErrorTip="請輸入姓名">
          <input nz-input formControlName="name" placeholder="請輸入姓名" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>郵箱</nz-form-label>
        <nz-form-control [nzSpan]="18" nzErrorTip="請輸入有效的郵箱地址">
          <input nz-input formControlName="email" placeholder="請輸入郵箱" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6">角色</nz-form-label>
        <nz-form-control [nzSpan]="18">
          <nz-select formControlName="role" placeholder="請選擇角色">
            <nz-option nzValue="admin" nzLabel="管理員"></nz-option>
            <nz-option nzValue="user" nzLabel="用戶"></nz-option>
            <nz-option nzValue="guest" nzLabel="訪客"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6">生日</nz-form-label>
        <nz-form-control [nzSpan]="18">
          <nz-date-picker formControlName="birthday" placeholder="請選擇生日"></nz-date-picker>
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="18">
          <button nz-button nzType="primary" [nzLoading]="loading()" [disabled]="form.invalid">
            提交
          </button>
          <button nz-button nzType="default" (click)="onReset()">
            重置
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class UserFormComponent {
  form: FormGroup;
  loading = signal(false);
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user'],
      birthday: [null]
    });
  }
  
  onSubmit(): void {
    if (this.form.valid) {
      this.loading.set(true);
      // 提交邏輯
      console.log('Form data:', this.form.value);
      this.loading.set(false);
    }
  }
  
  onReset(): void {
    this.form.reset();
  }
}
```

### 4. 路由模式

#### 路由配置模式
```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AclGuard } from './guards/acl.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [AuthGuard, AclGuard],
    data: { roles: ['admin', 'manager'] }
  },
  {
    path: 'projects',
    loadChildren: () => import('./projects/projects.routes').then(m => m.projectRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
```

#### 守衛模式
```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      map(isAuth => {
        if (!isAuth) {
          this.router.navigate(['/auth/login']);
          return false;
        }
        return true;
      })
    );
  }
}
```

### 5. 狀態管理模式

#### Signal-based 狀態管理
```typescript
import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  // Signals
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _user = signal<User | null>(null);
  
  // Computed
  loading = computed(() => this._loading());
  error = computed(() => this._error());
  user = computed(() => this._user());
  isAuthenticated = computed(() => !!this._user());
  
  // BehaviorSubjects for RxJS compatibility
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<User | null>(null);
  
  // Observables
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  user$ = this.userSubject.asObservable();
  
  setLoading(loading: boolean): void {
    this._loading.set(loading);
    this.loadingSubject.next(loading);
  }
  
  setError(error: string | null): void {
    this._error.set(error);
    this.errorSubject.next(error);
  }
  
  setUser(user: User | null): void {
    this._user.set(user);
    this.userSubject.next(user);
  }
  
  clearError(): void {
    this.setError(null);
  }
}
```

## ng-zorro-antd 組件使用模式

### 1. 表格模式
```typescript
// 表格組件模板
template: `
  <nz-card nzTitle="數據表格">
    <nz-table
      #basicTable
      [nzData]="data()"
      [nzLoading]="loading()"
      [nzPageSize]="pageSize()"
      [nzTotal]="total()"
      [nzShowPagination]="true"
      [nzShowSizeChanger]="true"
      [nzShowQuickJumper]="true"
      [nzShowTotal]="totalTemplate"
      (nzPageIndexChange)="onPageChange($event)"
      (nzPageSizeChange)="onPageSizeChange($event)"
    >
      <thead>
        <tr>
          <th nzColumnKey="name" nzSort [(nzSortOrder)]="sortMap.name" (nzSortOrderChange)="onSort($event, 'name')">
            姓名
          </th>
          <th nzColumnKey="age" nzSort [(nzSortOrder)]="sortMap.age" (nzSortOrderChange)="onSort($event, 'age')">
            年齡
          </th>
          <th nzColumnKey="address" nzSort [(nzSortOrder)]="sortMap.address" (nzSortOrderChange)="onSort($event, 'address')">
            地址
          </th>
          <th nzColumnKey="action">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of basicTable.data">
          <td>{{ data.name }}</td>
          <td>{{ data.age }}</td>
          <td>{{ data.address }}</td>
          <td>
            <a (click)="edit(data)">編輯</a>
            <nz-divider nzType="vertical"></nz-divider>
            <a nz-popconfirm nzTitle="確定要刪除嗎？" (nzOnConfirm)="delete(data)">刪除</a>
          </td>
        </tr>
      </tbody>
    </nz-table>
  </nz-card>
  
  <ng-template #totalTemplate let-total let-range="range">
    顯示 {{ range[0] }}-{{ range[1] }} 共 {{ total }} 條記錄
  </ng-template>
`
```

### 2. 表單模式
```typescript
// 表單組件模板
template: `
  <nz-card nzTitle="用戶表單">
    <form nz-form [formGroup]="form" (ngSubmit)="onSubmit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>姓名</nz-form-label>
        <nz-form-control [nzSpan]="18" nzErrorTip="請輸入姓名">
          <input nz-input formControlName="name" placeholder="請輸入姓名" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>郵箱</nz-form-label>
        <nz-form-control [nzSpan]="18" nzErrorTip="請輸入有效的郵箱地址">
          <input nz-input formControlName="email" placeholder="請輸入郵箱" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="18">
          <button nz-button nzType="primary" [nzLoading]="loading()" [disabled]="form.invalid">
            提交
          </button>
          <button nz-button nzType="default" (click)="onReset()">
            重置
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  </nz-card>
`
```

### 3. 模態框模式
```typescript
// 模態框組件模板
template: `
  <nz-modal
    [(nzVisible)]="visible()"
    nzTitle="編輯用戶"
    [nzWidth]="600"
    [nzOkLoading]="loading()"
    (nzOnOk)="onOk()"
    (nzOnCancel)="onCancel()"
  >
    <form nz-form [formGroup]="form">
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
    </form>
  </nz-modal>
`
```

## 最佳實踐

### 1. 組件設計原則
- 單一職責：每個組件只負責一個功能
- 可重用性：設計可重用的組件
- 可測試性：組件應該易於測試
- 可維護性：程式碼應該清晰易懂

### 2. 效能優化
- 使用 OnPush 變更檢測策略
- 實作 TrackBy 函數
- 使用 Lazy Loading
- 優化 Bundle 大小

### 3. 程式碼品質
- 遵循 TypeScript 嚴格模式
- 使用 ESLint 和 Prettier
- 編寫清晰的註釋
- 保持程式碼一致性

### 4. 測試策略
- 單元測試覆蓋率 > 80%
- 整合測試覆蓋關鍵流程
- 端對端測試覆蓋主要用戶場景

---

*本文件為程式碼生成模式指南，旨在提供標準化的程式碼生成模板和最佳實踐。*