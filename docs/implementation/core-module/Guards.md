# Route Guards - 核心模組

## 概述

Route Guards 是 Angular 的路由守衛機制，用於控制路由的訪問權限。在 ng-alain 專案中，我們使用 Guards 來實現認證檢查、角色權限驗證、資料預載入等功能。

## 設計原則

### 1. 安全性優先
- 所有受保護的路由都必須通過適當的 Guard 檢查
- 實現多層次的權限驗證
- 防止未授權的訪問

### 2. 使用者體驗
- 提供清晰的錯誤訊息
- 實現平滑的重定向流程
- 避免無限重定向循環

### 3. 可維護性
- 使用 Functional Guards (Angular 17+)
- 實現可重用的 Guard 邏輯
- 提供清晰的錯誤處理

## Guard 類型

### 1. CanActivate - 路由激活守衛
控制是否可以激活某個路由。

### 2. CanActivateChild - 子路由激活守衛
控制是否可以激活子路由。

### 3. CanDeactivate - 路由離開守衛
控制是否可以離開當前路由。

### 4. Resolve - 資料解析守衛
在路由激活前預載入資料。

### 5. CanLoad - 模組載入守衛
控制是否可以載入延遲載入的模組。

## 實作範例

### AuthGuard - 認證守衛

```typescript
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // 記錄嘗試訪問的 URL
  authService.setRedirectUrl(state.url);
  
  // 重定向到登入頁面
  router.navigate(['/login']);
  return false;
};
```

### RoleGuard - 角色權限守衛

```typescript
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const roleGuard = (requiredRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const notificationService = inject(NotificationService);

    if (!authService.isAuthenticated()) {
      return false;
    }

    const userRoles = authService.getUserRoles();
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      notificationService.showError('權限不足，無法訪問此頁面');
      return false;
    }

    return true;
  };
};

// 使用範例
export const adminGuard = roleGuard(['admin']);
export const managerGuard = roleGuard(['admin', 'manager']);
export const engineerGuard = roleGuard(['admin', 'manager', 'engineer']);
```

### ACLGuard - 存取控制清單守衛

```typescript
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ACLService } from '../services/acl.service';

export const aclGuard = (permission: string): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const aclService = inject(ACLService);

    if (!authService.isAuthenticated()) {
      return false;
    }

    return aclService.can(permission);
  };
};

// 使用範例
export const projectCreateGuard = aclGuard('project.create');
export const projectEditGuard = aclGuard('project.edit');
export const projectDeleteGuard = aclGuard('project.delete');
```

### CanDeactivateGuard - 離開守衛

```typescript
import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { ConfirmService } from '../services/confirm.service';

export interface CanComponentDeactivate {
  canDeactivate(): boolean | Promise<boolean>;
}

export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component: CanComponentDeactivate,
  currentRoute,
  currentState,
  nextState
) => {
  const confirmService = inject(ConfirmService);

  if (!component.canDeactivate()) {
    return confirmService.confirm(
      '您有未儲存的變更，確定要離開嗎？',
      '確認離開'
    );
  }

  return true;
};
```

### DataResolver - 資料解析守衛

```typescript
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ProjectService } from '../services/project.service';
import { UserService } from '../services/user.service';

export const projectResolver: ResolveFn<any> = (route, state) => {
  const projectService = inject(ProjectService);
  const projectId = route.paramMap.get('id');
  
  if (!projectId) {
    throw new Error('Project ID is required');
  }

  return projectService.getProject(projectId);
};

export const userProfileResolver: ResolveFn<any> = (route, state) => {
  const userService = inject(UserService);
  const userId = route.paramMap.get('userId');
  
  if (!userId) {
    throw new Error('User ID is required');
  }

  return userService.getUserProfile(userId);
};
```

### CanLoadGuard - 模組載入守衛

```typescript
import { CanLoadFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const canLoadGuard: CanLoadFn = (route, segments) => {
  const authService = inject(AuthService);

  // 檢查使用者是否已認證
  if (!authService.isAuthenticated()) {
    return false;
  }

  // 檢查使用者角色
  const userRoles = authService.getUserRoles();
  const requiredRoles = route.data?.['roles'] || [];
  
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role: string) => 
      userRoles.includes(role)
    );
    
    if (!hasRequiredRole) {
      return false;
    }
  }

  return true;
};
```

## 路由配置範例

### 基本路由配置

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { aclGuard } from './guards/acl.guard';
import { projectResolver } from './guards/resolvers/project.resolver';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects.component').then(m => m.ProjectsComponent),
    canActivate: [authGuard, aclGuard('project.read')]
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./pages/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
    canActivate: [authGuard],
    resolve: { project: projectResolver }
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard(['admin'])],
    canLoad: [canLoadGuard]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
```

### 延遲載入模組配置

```typescript
// admin.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth.guard';
import { roleGuard } from '../guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  {
    path: 'users',
    loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  {
    path: 'organizations',
    loadComponent: () => import('./organization-management/organization-management.component').then(m => m.OrganizationManagementComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
  }
];
```

## 最佳實踐

### 1. 使用 Functional Guards
- Angular 17+ 推薦使用 Functional Guards
- 更簡潔、可測試性更好
- 支援依賴注入

### 2. 錯誤處理
- 提供清晰的錯誤訊息
- 實現適當的重定向邏輯
- 避免無限重定向循環

### 3. 效能考量
- 使用 `canLoad` 來控制模組載入
- 實現適當的快取機制
- 避免不必要的重複檢查

### 4. 測試
- 為每個 Guard 編寫單元測試
- 測試各種權限情況
- 使用 `RouterTestingModule` 進行測試

## 常見問題

### Q: Guard 的執行順序是什麼？
A: Guards 按陣列順序執行，如果任何一個返回 false，後續的 Guards 不會執行。

### Q: 如何在 Guard 中處理異步操作？
A: 返回 `Observable<boolean>` 或 `Promise<boolean>` 來處理異步操作。

### Q: 如何實現條件性 Guard？
A: 使用工廠函數來創建條件性 Guard，根據不同的參數返回不同的 Guard。

### Q: 如何測試 Guard？
A: 使用 `TestBed` 和 `RouterTestingModule` 來模擬路由並驗證 Guard 的行為。

## 相關服務

- `AuthService` - 認證服務
- `ACLService` - 存取控制清單服務
- `ConfirmService` - 確認對話框服務
- `NotificationService` - 通知服務

## 參考資料

- [Angular Route Guards 官方文件](https://angular.dev/guide/router/router-guards)
- [Angular 路由指南](https://angular.dev/guide/router)
- [Angular 測試指南](https://angular.dev/guide/testing)