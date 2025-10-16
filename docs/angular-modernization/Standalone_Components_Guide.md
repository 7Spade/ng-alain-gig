# Standalone Components 指南

## 概述

本指南詳細說明如何在 ng-alain 企業級建築工程管理平台中使用 Angular 20 的 Standalone Components，提供完整的實作模式和最佳實踐。

## Standalone Components 基礎

### 1. 基本結構

#### 1.1 最小 Standalone 組件
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-simple',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="simple-component">
      <h2>簡單組件</h2>
      <p>這是一個 Standalone 組件</p>
    </div>
  `,
  styles: [`
    .simple-component {
      padding: 16px;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
    }
  `]
})
export class SimpleComponent {
  // 組件邏輯
}
```

#### 1.2 帶有 ng-zorro-antd 的組件
```typescript
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ng-zorro-antd 組件導入
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageModule } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzInputModule,
    NzTableModule,
    NzModalModule,
    NzFormModule,
    NzMessageModule
  ],
  template: `
    <nz-card nzTitle="用戶管理">
      <div class="search-bar">
        <nz-input-group nzSearch [nzSuffix]="suffixIcon">
          <input 
            type="text" 
            nz-input 
            placeholder="搜尋用戶..." 
            [(ngModel)]="searchKeyword()"
            (ngModelChange)="onSearch($event)" />
        </nz-input-group>
        <button nz-button nzType="primary" (click)="addUser()">
          新增用戶
        </button>
      </div>
      
      <nz-table 
        [nzData]="filteredUsers()" 
        [nzLoading]="loading()"
        [nzPageSize]="pageSize()"
        [nzTotal]="total()"
        (nzPageIndexChange)="onPageChange($event)">
        
        <thead>
          <tr>
            <th nzColumnKey="name" nzSort>姓名</th>
            <th nzColumnKey="email" nzSort>郵箱</th>
            <th nzColumnKey="role" nzSort>角色</th>
            <th nzColumnKey="status" nzSort>狀態</th>
            <th nzColumnKey="action">操作</th>
          </tr>
        </thead>
        
        <tbody>
          <tr *ngFor="let user of filteredUsers()">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <nz-tag [nzColor]="getRoleColor(user.role)">
                {{ user.role }}
              </nz-tag>
            </td>
            <td>
              <nz-tag [nzColor]="getStatusColor(user.status)">
                {{ user.status }}
              </nz-tag>
            </td>
            <td>
              <button nz-button nzType="primary" nzSize="small" (click)="editUser(user)">
                編輯
              </button>
              <button nz-button nzType="default" nzSize="small" nzDanger (click)="deleteUser(user)">
                刪除
              </button>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
    
    <ng-template #suffixIcon>
      <span nz-icon nzType="search"></span>
    </ng-template>
  `,
  styles: [`
    .search-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 16px;
    }
    
    .search-bar nz-input-group {
      flex: 1;
      max-width: 300px;
    }
  `]
})
export class UserManagementComponent {
  // Signals
  users = signal<User[]>([]);
  searchKeyword = signal('');
  loading = signal(false);
  pageSize = signal(10);
  total = signal(0);
  
  // Computed
  filteredUsers = computed(() => {
    const keyword = this.searchKeyword().toLowerCase();
    if (!keyword) return this.users();
    
    return this.users().filter(user => 
      user.name.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    );
  });
  
  onSearch(keyword: string): void {
    this.searchKeyword.set(keyword);
  }
  
  onPageChange(page: number): void {
    // 分頁邏輯
    console.log('Page changed to:', page);
  }
  
  addUser(): void {
    // 新增用戶邏輯
    console.log('Add user');
  }
  
  editUser(user: User): void {
    // 編輯用戶邏輯
    console.log('Edit user:', user);
  }
  
  deleteUser(user: User): void {
    // 刪除用戶邏輯
    console.log('Delete user:', user);
  }
  
  getRoleColor(role: string): string {
    const colorMap: Record<string, string> = {
      'admin': 'red',
      'manager': 'blue',
      'user': 'green'
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

### 2. 表單組件

#### 2.1 響應式表單組件
```typescript
import { Component, signal, input, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// ng-zorro-antd 表單組件
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageModule } from 'ng-zorro-antd/message';

interface UserFormData {
  name: string;
  email: string;
  role: string;
  department: string;
  hireDate: Date;
  phone: string;
  address: string;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzCardModule,
    NzMessageModule
  ],
  template: `
    <nz-card [nzTitle]="isEdit() ? '編輯用戶' : '新增用戶'">
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
          <nz-form-label [nzSpan]="6" nzRequired>角色</nz-form-label>
          <nz-form-control [nzSpan]="18">
            <nz-select formControlName="role" placeholder="請選擇角色">
              <nz-option nzValue="admin" nzLabel="管理員"></nz-option>
              <nz-option nzValue="manager" nzLabel="經理"></nz-option>
              <nz-option nzValue="user" nzLabel="用戶"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        
        <nz-form-item>
          <nz-form-label [nzSpan]="6">部門</nz-form-label>
          <nz-form-control [nzSpan]="18">
            <nz-select formControlName="department" placeholder="請選擇部門">
              <nz-option nzValue="engineering" nzLabel="工程部"></nz-option>
              <nz-option nzValue="management" nzLabel="管理部"></nz-option>
              <nz-option nzValue="finance" nzLabel="財務部"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        
        <nz-form-item>
          <nz-form-label [nzSpan]="6">入職日期</nz-form-label>
          <nz-form-control [nzSpan]="18">
            <nz-date-picker formControlName="hireDate" placeholder="請選擇入職日期"></nz-date-picker>
          </nz-form-control>
        </nz-form-item>
        
        <nz-form-item>
          <nz-form-label [nzSpan]="6">電話</nz-form-label>
          <nz-form-control [nzSpan]="18">
            <input nz-input formControlName="phone" placeholder="請輸入電話號碼" />
          </nz-form-control>
        </nz-form-item>
        
        <nz-form-item>
          <nz-form-label [nzSpan]="6">地址</nz-form-label>
          <nz-form-control [nzSpan]="18">
            <textarea nz-input formControlName="address" placeholder="請輸入地址" rows="3"></textarea>
          </nz-form-control>
        </nz-form-item>
        
        <nz-form-item>
          <nz-form-control [nzOffset]="6" [nzSpan]="18">
            <button 
              nz-button 
              nzType="primary" 
              [nzLoading]="loading()" 
              [disabled]="form.invalid">
              {{ isEdit() ? '更新' : '創建' }}
            </button>
            <button nz-button nzType="default" (click)="onCancel.emit()">
              取消
            </button>
          </nz-form-control>
        </nz-form-item>
      </form>
    </nz-card>
  `,
  styles: [`
    form {
      max-width: 800px;
    }
  `]
})
export class UserFormComponent {
  // 輸入信號
  userData = input<UserFormData | null>(null);
  isEdit = input(false);
  
  // 輸出信號
  onSubmit = output<UserFormData>();
  onCancel = output<void>();
  
  // 狀態信號
  loading = signal(false);
  
  // 表單
  form: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', [Validators.required]],
      department: [''],
      hireDate: [null],
      phone: [''],
      address: ['']
    });
  }
  
  ngOnInit(): void {
    // 如果有用戶數據，填充表單
    const userData = this.userData();
    if (userData) {
      this.form.patchValue(userData);
    }
  }
  
  onSubmit(): void {
    if (this.form.valid) {
      this.loading.set(true);
      
      const formData: UserFormData = this.form.value;
      this.onSubmit.emit(formData);
      
      // 模擬 API 調用
      setTimeout(() => {
        this.loading.set(false);
        this.form.reset();
      }, 1000);
    }
  }
}
```

### 3. 模態框組件

#### 3.1 可重用模態框組件
```typescript
import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, NzModalModule, NzButtonModule],
  template: `
    <nz-modal
      [(nzVisible)]="visible()"
      [nzTitle]="title()"
      [nzContent]="content()"
      [nzOkLoading]="loading()"
      [nzOkText]="okText()"
      [nzCancelText]="cancelText()"
      [nzOkType]="okType()"
      [nzOkDanger]="okDanger()"
      (nzOnOk)="onOk()"
      (nzOnCancel)="onCancel()">
    </nz-modal>
  `
})
export class ConfirmModalComponent {
  // 輸入信號
  visible = input(false);
  title = input('確認');
  content = input('確定要執行此操作嗎？');
  okText = input('確定');
  cancelText = input('取消');
  okType = input('primary');
  okDanger = input(false);
  
  // 輸出信號
  onConfirm = output<void>();
  onCancel = output<void>();
  
  // 狀態信號
  loading = signal(false);
  
  onOk(): void {
    this.loading.set(true);
    this.onConfirm.emit();
    
    // 模擬異步操作
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);
  }
  
  onCancel(): void {
    this.onCancel.emit();
  }
}
```

#### 3.2 使用模態框組件
```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { ConfirmModalComponent } from './confirm-modal.component';

@Component({
  selector: 'app-modal-example',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzCardModule, ConfirmModalComponent],
  template: `
    <nz-card nzTitle="模態框示例">
      <div class="button-group">
        <button nz-button nzType="primary" (click)="showConfirmModal()">
          顯示確認模態框
        </button>
        <button nz-button nzType="default" nzDanger (click)="showDeleteModal()">
          顯示刪除模態框
        </button>
      </div>
      
      <app-confirm-modal
        [visible]="confirmModalVisible()"
        [title]="confirmModalTitle()"
        [content]="confirmModalContent()"
        [okText]="confirmModalOkText()"
        [okType]="confirmModalOkType()"
        [okDanger]="confirmModalOkDanger()"
        (onConfirm)="onConfirm()"
        (onCancel)="onCancel()">
      </app-confirm-modal>
    </nz-card>
  `,
  styles: [`
    .button-group {
      display: flex;
      gap: 16px;
    }
  `]
})
export class ModalExampleComponent {
  // 模態框狀態
  confirmModalVisible = signal(false);
  confirmModalTitle = signal('確認');
  confirmModalContent = signal('確定要執行此操作嗎？');
  confirmModalOkText = signal('確定');
  confirmModalOkType = signal('primary');
  confirmModalOkDanger = signal(false);
  
  showConfirmModal(): void {
    this.confirmModalTitle.set('確認操作');
    this.confirmModalContent.set('確定要執行此操作嗎？');
    this.confirmModalOkText.set('確定');
    this.confirmModalOkType.set('primary');
    this.confirmModalOkDanger.set(false);
    this.confirmModalVisible.set(true);
  }
  
  showDeleteModal(): void {
    this.confirmModalTitle.set('刪除確認');
    this.confirmModalContent.set('確定要刪除此項目嗎？此操作不可撤銷。');
    this.confirmModalOkText.set('刪除');
    this.confirmModalOkType.set('primary');
    this.confirmModalOkDanger.set(true);
    this.confirmModalVisible.set(true);
  }
  
  onConfirm(): void {
    console.log('用戶確認了操作');
    this.confirmModalVisible.set(false);
  }
  
  onCancel(): void {
    console.log('用戶取消了操作');
    this.confirmModalVisible.set(false);
  }
}
```

### 4. 路由組件

#### 4.1 路由配置
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-list/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./users/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  },
  {
    path: 'projects',
    loadChildren: () => import('./projects/projects.routes').then(m => m.projectRoutes)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
```

#### 4.2 路由組件
```typescript
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NzCardModule, NzButtonModule, NzBreadCrumbModule],
  template: `
    <nz-breadcrumb>
      <nz-breadcrumb-item>
        <a routerLink="/users">用戶列表</a>
      </nz-breadcrumb-item>
      <nz-breadcrumb-item>用戶詳情</nz-breadcrumb-item>
    </nz-breadcrumb>
    
    <nz-card [nzTitle]="'用戶詳情 - ' + user()?.name" [nzExtra]="extraTemplate">
      <div class="user-detail" *ngIf="user(); else loadingTemplate">
        <div class="user-info">
          <div class="info-item">
            <label>姓名:</label>
            <span>{{ user()?.name }}</span>
          </div>
          <div class="info-item">
            <label>郵箱:</label>
            <span>{{ user()?.email }}</span>
          </div>
          <div class="info-item">
            <label>角色:</label>
            <nz-tag [nzColor]="getRoleColor(user()?.role)">
              {{ user()?.role }}
            </nz-tag>
          </div>
          <div class="info-item">
            <label>狀態:</label>
            <nz-tag [nzColor]="getStatusColor(user()?.status)">
              {{ user()?.status }}
            </nz-tag>
          </div>
        </div>
      </div>
      
      <ng-template #loadingTemplate>
        <nz-spin nzSimple [nzSize]="'large'">
          <div style="height: 200px;"></div>
        </nz-spin>
      </ng-template>
    </nz-card>
    
    <ng-template #extraTemplate>
      <button nz-button nzType="primary" (click)="editUser()">
        編輯
      </button>
      <button nz-button nzType="default" (click)="goBack()">
        返回
      </button>
    </ng-template>
  `,
  styles: [`
    .user-detail {
      padding: 16px 0;
    }
    
    .user-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .info-item label {
      font-weight: 500;
      min-width: 80px;
    }
  `]
})
export class UserDetailComponent {
  user = signal<User | null>(null);
  loading = signal(false);
  
  constructor(private route: ActivatedRoute) {
    // 監聽路由參數變化
    this.route.params.subscribe(params => {
      const userId = params['id'];
      if (userId) {
        this.loadUser(userId);
      }
    });
  }
  
  private loadUser(id: string): void {
    this.loading.set(true);
    
    // 模擬 API 調用
    setTimeout(() => {
      this.user.set({
        id,
        name: 'User ' + id,
        email: 'user' + id + '@example.com',
        role: 'user',
        status: 'active'
      });
      this.loading.set(false);
    }, 1000);
  }
  
  editUser(): void {
    console.log('編輯用戶:', this.user());
  }
  
  goBack(): void {
    window.history.back();
  }
  
  getRoleColor(role: string): string {
    const colorMap: Record<string, string> = {
      'admin': 'red',
      'manager': 'blue',
      'user': 'green'
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

## 最佳實踐

### 1. 組件設計原則
- **單一職責**: 每個組件只負責一個功能
- **可重用性**: 設計可重用的組件
- **可測試性**: 組件應該易於測試
- **可維護性**: 程式碼應該清晰易懂

### 2. 導入管理
```typescript
// 按功能分組導入
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ng-zorro-antd 組件按功能分組
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';
```

### 3. 型別安全
```typescript
// 定義清晰的介面
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

// 使用強型別
const users = signal<User[]>([]);
const loading = signal<boolean>(false);
```

### 4. 效能優化
```typescript
// 使用 OnPush 變更檢測策略
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// 實作 TrackBy 函數
trackByUserId(index: number, user: User): string {
  return user.id;
}

// 使用 computed 信號
filteredUsers = computed(() => {
  return this.users().filter(user => user.status === 'active');
});
```

### 5. 錯誤處理
```typescript
// 使用 try-catch 處理錯誤
async loadData(): Promise<void> {
  try {
    this.loading.set(true);
    this.error.set(null);
    
    const data = await this.dataService.getData();
    this.data.set(data);
  } catch (error) {
    this.error.set(error.message);
    this.message.error('載入數據失敗');
  } finally {
    this.loading.set(false);
  }
}
```

## 常見問題與解決方案

### 1. 循環依賴
```typescript
// 避免在組件中直接導入其他組件
// 使用動態導入
const OtherComponent = await import('./other.component').then(m => m.OtherComponent);
```

### 2. 記憶體洩漏
```typescript
// 使用 OnDestroy 清理訂閱
import { OnDestroy } from '@angular/core';

export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 3. 型別錯誤
```typescript
// 確保所有屬性都有正確的型別
interface ComponentProps {
  title: string;
  data: any[];
  loading: boolean;
}

// 使用型別斷言
const data = this.data() as User[];
```

## 參考資源

- [Angular Standalone Components 文件](https://angular.io/guide/standalone-components)
- [ng-zorro-antd 組件文件](https://ng.ant.design/)
- [Angular 20 新特性](https://v20.angular.dev/)

---

*本文件為 Standalone Components 指南，旨在提供完整的實作模式和最佳實踐。*