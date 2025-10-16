# Organization Module - Routing Configuration

## 概述

Organization Module 的路由配置採用 Angular v20 現代化語法，整合 ng-alain 框架和 DDD 架構模式，提供完整的組織管理功能路由。

## 路由結構

### 主要路由配置

```typescript
import { Routes, CanActivateFn, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ACLService } from '@delon/acl';
import { OrganizationService } from '../application-layer/OrganizationService';

// 組織權限守衛
export const organizationGuard: CanActivateFn = () => {
  const acl = inject(ACLService);
  const router = inject(Router);
  
  if (acl.can('organization:read')) {
    return true;
  }
  
  return router.parseUrl('/403');
};

// 組織管理員權限守衛
export const organizationAdminGuard: CanActivateFn = () => {
  const acl = inject(ACLService);
  const router = inject(Router);
  
  if (acl.can('organization:admin')) {
    return true;
  }
  
  return router.parseUrl('/403');
};

// 組織資料解析器
export const organizationResolver: ResolveFn<Organization> = (route) => {
  const organizationService = inject(OrganizationService);
  const organizationId = route.paramMap.get('id');
  
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }
  
  return organizationService.getOrganization(organizationId);
};

// 組織成員列表解析器
export const organizationMembersResolver: ResolveFn<OrganizationMember[]> = (route) => {
  const organizationService = inject(OrganizationService);
  const organizationId = route.paramMap.get('id');
  
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }
  
  return organizationService.getOrganizationMembers(organizationId);
};
```

### 路由定義

```typescript
export const ORGANIZATION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./features/organization-list/organization-list.component')
      .then(m => m.OrganizationListComponent),
    canActivate: [organizationGuard],
    data: {
      title: '組織列表',
      icon: 'team',
      reuse: true
    }
  },
  {
    path: 'create',
    loadComponent: () => import('./features/organization-create/organization-create.component')
      .then(m => m.OrganizationCreateComponent),
    canActivate: [organizationAdminGuard],
    data: {
      title: '建立組織',
      icon: 'plus'
    }
  },
  {
    path: ':id',
    loadComponent: () => import('./features/organization-detail/organization-detail.component')
      .then(m => m.OrganizationDetailComponent),
    canActivate: [organizationGuard],
    resolve: {
      organization: organizationResolver
    },
    data: {
      title: '組織詳情',
      reuse: true
    }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./features/organization-edit/organization-edit.component')
      .then(m => m.OrganizationEditComponent),
    canActivate: [organizationAdminGuard],
    resolve: {
      organization: organizationResolver
    },
    data: {
      title: '編輯組織',
      icon: 'edit'
    }
  },
  {
    path: ':id/members',
    loadComponent: () => import('./features/organization-members/organization-members.component')
      .then(m => m.OrganizationMembersComponent),
    canActivate: [organizationGuard],
    resolve: {
      organization: organizationResolver,
      members: organizationMembersResolver
    },
    data: {
      title: '組織成員',
      icon: 'user'
    }
  },
  {
    path: ':id/teams',
    loadComponent: () => import('./features/organization-teams/organization-teams.component')
      .then(m => m.OrganizationTeamsComponent),
    canActivate: [organizationGuard],
    resolve: {
      organization: organizationResolver
    },
    data: {
      title: '團隊管理',
      icon: 'team'
    }
  },
  {
    path: ':id/settings',
    loadComponent: () => import('./features/organization-settings/organization-settings.component')
      .then(m => m.OrganizationSettingsComponent),
    canActivate: [organizationAdminGuard],
    resolve: {
      organization: organizationResolver
    },
    data: {
      title: '組織設定',
      icon: 'setting'
    }
  }
];
```

## 權限控制

### ACL 權限定義

```typescript
// 組織模組權限
export const ORGANIZATION_PERMISSIONS = {
  READ: 'organization:read',
  CREATE: 'organization:create',
  UPDATE: 'organization:update',
  DELETE: 'organization:delete',
  ADMIN: 'organization:admin',
  MEMBER_MANAGE: 'organization:member:manage',
  TEAM_MANAGE: 'organization:team:manage',
  SETTINGS_MANAGE: 'organization:settings:manage'
} as const;
```

### 角色權限對應

```typescript
// 角色權限配置
export const ORGANIZATION_ROLE_PERMISSIONS = {
  'organization:owner': [
    'organization:read',
    'organization:create',
    'organization:update',
    'organization:delete',
    'organization:admin',
    'organization:member:manage',
    'organization:team:manage',
    'organization:settings:manage'
  ],
  'organization:admin': [
    'organization:read',
    'organization:update',
    'organization:member:manage',
    'organization:team:manage',
    'organization:settings:manage'
  ],
  'organization:member': [
    'organization:read'
  ]
} as const;
```

## 懶加載策略

### 組件懶加載

```typescript
// 使用 loadComponent 進行組件懶加載
const lazyLoadComponent = (path: string) => 
  () => import(`./features/${path}`).then(m => m[getComponentName(path)]);

// 組件名稱映射
const getComponentName = (path: string): string => {
  const nameMap: Record<string, string> = {
    'organization-list': 'OrganizationListComponent',
    'organization-create': 'OrganizationCreateComponent',
    'organization-detail': 'OrganizationDetailComponent',
    'organization-edit': 'OrganizationEditComponent',
    'organization-members': 'OrganizationMembersComponent',
    'organization-teams': 'OrganizationTeamsComponent',
    'organization-settings': 'OrganizationSettingsComponent'
  };
  
  return nameMap[path] || 'DefaultComponent';
};
```

### 預載策略

```typescript
// 路由預載配置
export const ORGANIZATION_PRELOADING_STRATEGY = {
  // 預載組織列表相關組件
  preloadOrganizations: () => {
    return import('./features/organization-list/organization-list.component');
  },
  
  // 預載組織詳情相關組件
  preloadOrganizationDetail: () => {
    return Promise.all([
      import('./features/organization-detail/organization-detail.component'),
      import('./features/organization-members/organization-members.component'),
      import('./features/organization-teams/organization-teams.component')
    ]);
  }
};
```

## 路由守衛

### 認證守衛

```typescript
// 組織認證守衛
export const organizationAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) {
    return router.parseUrl('/passport/login');
  }
  
  return true;
};
```

### 權限守衛

```typescript
// 組織權限守衛
export const organizationPermissionGuard: CanActivateFn = (route) => {
  const acl = inject(ACLService);
  const router = inject(Router);
  
  const requiredPermission = route.data?.['permission'];
  
  if (requiredPermission && !acl.can(requiredPermission)) {
    return router.parseUrl('/403');
  }
  
  return true;
};
```

### 資料守衛

```typescript
// 組織資料存在性守衛
export const organizationExistsGuard: CanActivateFn = (route) => {
  const organizationService = inject(OrganizationService);
  const router = inject(Router);
  
  const organizationId = route.paramMap.get('id');
  
  if (!organizationId) {
    return router.parseUrl('/organization/list');
  }
  
  return organizationService.exists(organizationId).pipe(
    map(exists => exists ? true : router.parseUrl('/404'))
  );
};
```

## 路由資料

### 路由元資料

```typescript
// 路由資料配置
export const ORGANIZATION_ROUTE_DATA = {
  list: {
    title: '組織列表',
    icon: 'team',
    breadcrumb: ['組織管理', '組織列表'],
    reuse: true,
    permission: 'organization:read'
  },
  create: {
    title: '建立組織',
    icon: 'plus',
    breadcrumb: ['組織管理', '建立組織'],
    permission: 'organization:create'
  },
  detail: {
    title: '組織詳情',
    icon: 'eye',
    breadcrumb: ['組織管理', '組織詳情'],
    reuse: true,
    permission: 'organization:read'
  },
  edit: {
    title: '編輯組織',
    icon: 'edit',
    breadcrumb: ['組織管理', '編輯組織'],
    permission: 'organization:update'
  },
  members: {
    title: '組織成員',
    icon: 'user',
    breadcrumb: ['組織管理', '組織成員'],
    permission: 'organization:member:manage'
  },
  teams: {
    title: '團隊管理',
    icon: 'team',
    breadcrumb: ['組織管理', '團隊管理'],
    permission: 'organization:team:manage'
  },
  settings: {
    title: '組織設定',
    icon: 'setting',
    breadcrumb: ['組織管理', '組織設定'],
    permission: 'organization:settings:manage'
  }
} as const;
```

## 錯誤處理

### 路由錯誤處理

```typescript
// 路由錯誤處理
export const organizationErrorHandler = {
  handleNotFound: (router: Router) => {
    router.navigate(['/organization/list']);
  },
  
  handleUnauthorized: (router: Router) => {
    router.navigate(['/403']);
  },
  
  handleServerError: (router: Router) => {
    router.navigate(['/500']);
  }
};
```

## 測試配置

### 路由測試

```typescript
// 路由測試配置
export const ORGANIZATION_ROUTE_TEST_CONFIG = {
  testRoutes: [
    { path: '/organization/list', component: 'OrganizationListComponent' },
    { path: '/organization/create', component: 'OrganizationCreateComponent' },
    { path: '/organization/123', component: 'OrganizationDetailComponent' },
    { path: '/organization/123/edit', component: 'OrganizationEditComponent' },
    { path: '/organization/123/members', component: 'OrganizationMembersComponent' },
    { path: '/organization/123/teams', component: 'OrganizationTeamsComponent' },
    { path: '/organization/123/settings', component: 'OrganizationSettingsComponent' }
  ],
  
  testGuards: [
    'organizationGuard',
    'organizationAdminGuard',
    'organizationAuthGuard',
    'organizationPermissionGuard',
    'organizationExistsGuard'
  ],
  
  testResolvers: [
    'organizationResolver',
    'organizationMembersResolver'
  ]
};
```

## 最佳實踐

### 1. 路由命名規範
- 使用 kebab-case 命名路由路徑
- 使用 PascalCase 命名組件
- 使用 camelCase 命名守衛和解析器

### 2. 權限控制
- 在路由層級進行權限驗證
- 使用 ACL 服務進行細粒度權限控制
- 實作多層級權限守衛

### 3. 效能優化
- 使用懶加載減少初始包大小
- 實作路由預載策略
- 使用路由重用減少重複渲染

### 4. 錯誤處理
- 實作全域路由錯誤處理
- 提供友好的錯誤頁面
- 記錄路由錯誤日誌

### 5. 測試策略
- 單元測試路由配置
- 整合測試路由守衛
- E2E 測試路由流程

## 相關文件

- [Angular Router 官方文件](https://angular.dev/guide/routing)
- [ng-alain 路由配置](https://ng-alain.com/docs/routing)
- [ACL 權限控制](https://ng-alain.com/docs/acl)
- [Organization Module 架構文件](./Architecture/Organization%20Module.md)
