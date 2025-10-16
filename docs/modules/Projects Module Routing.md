# Project Module - Routing

## 概述
Project Module 路由配置，採用 Angular v20 現代化語法，整合 ng-alain 框架和 DDD 架構模式。

## 路由結構

### 主要路由配置
```typescript
export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./features/project-list/project-list.component')
      .then(m => m.ProjectListComponent),
    canActivate: [projectGuard],
    data: {
      title: '專案列表',
      icon: 'project',
      reuse: true
    }
  },
  {
    path: 'create',
    loadComponent: () => import('./features/project-create/project-create.component')
      .then(m => m.ProjectCreateComponent),
    canActivate: [projectCreateGuard],
    data: {
      title: '建立專案',
      icon: 'plus'
    }
  },
  {
    path: ':id',
    loadComponent: () => import('./features/project-detail/project-detail.component')
      .then(m => m.ProjectDetailComponent),
    canActivate: [projectAccessGuard],
    resolve: {
      project: projectResolver
    },
    data: {
      title: '專案詳情',
      reuse: true
    }
  },
  {
    path: ':id/tasks',
    loadComponent: () => import('./features/task-management/task-list.component')
      .then(m => m.TaskListComponent),
    canActivate: [projectAccessGuard],
    resolve: {
      project: projectResolver,
      tasks: tasksResolver
    },
    data: {
      title: '任務管理',
      icon: 'check-square'
    }
  },
  {
    path: ':id/cost',
    loadComponent: () => import('./features/cost-management/cost-dashboard.component')
      .then(m => m.CostDashboardComponent),
    canActivate: [projectAccessGuard],
    resolve: {
      project: projectResolver,
      budget: budgetResolver
    },
    data: {
      title: '成本管理',
      icon: 'dollar'
    }
  }
];
```

### 路由守衛
```typescript
// 專案權限守衛
export const projectGuard: CanActivateFn = () => {
  const acl = inject(ACLService);
  const router = inject(Router);
  
  if (acl.can('project:read')) {
    return true;
  }
  
  return router.parseUrl('/403');
};

// 專案建立權限守衛
export const projectCreateGuard: CanActivateFn = () => {
  const acl = inject(ACLService);
  const router = inject(Router);
  
  if (acl.can('project:create')) {
    return true;
  }
  
  return router.parseUrl('/403');
};

// 專案存取守衛
export const projectAccessGuard: CanActivateFn = (route) => {
  const projectService = inject(ProjectService);
  const router = inject(Router);
  const projectId = route.paramMap.get('id');
  
  if (!projectId) {
    return router.parseUrl('/projects/list');
  }
  
  return projectService.hasAccess(projectId).pipe(
    map(hasAccess => hasAccess ? true : router.parseUrl('/403'))
  );
};
```

### 路由解析器
```typescript
// 專案解析器
export const projectResolver: ResolveFn<Project> = (route) => {
  const projectService = inject(ProjectService);
  const projectId = route.paramMap.get('id');
  
  if (!projectId) {
    throw new Error('Project ID is required');
  }
  
  return projectService.getProject(projectId);
};

// 任務解析器
export const tasksResolver: ResolveFn<Task[]> = (route) => {
  const taskService = inject(TaskService);
  const projectId = route.paramMap.get('id');
  
  if (!projectId) {
    throw new Error('Project ID is required');
  }
  
  return taskService.getProjectTasks(projectId);
};

// 預算解析器
export const budgetResolver: ResolveFn<Budget> = (route) => {
  const costService = inject(CostService);
  const projectId = route.paramMap.get('id');
  
  if (!projectId) {
    throw new Error('Project ID is required');
  }
  
  return costService.getProjectBudget(projectId);
};
```

## 相關文件
- [Project Module 架構](./Architecture/Project%20Module.md)
- [Project Module 狀態管理](./State%20Management.md)