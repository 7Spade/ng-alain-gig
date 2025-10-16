# Routing.md - 路由設定與導航策略

> **AI Agent 友好指南**：本文件提供營建專案管理系統的路由配置策略，包含懶加載、路由守衛、權限控制和導航最佳實踐。

## 🗺️ 路由架構概覽

### 路由層級結構
```typescript
// 主要路由配置
export const APP_ROUTES: Routes = [
  // 認證路由
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
    canActivate: [guestGuard]
  },
  
  // 主應用路由
  {
    path: '',
    loadChildren: () => import('./layout/layout.routes').then(m => m.LAYOUT_ROUTES),
    canActivate: [authGuard],
    canActivateChild: [aclGuard]
  },
  
  // 錯誤頁面
  {
    path: 'error',
    loadChildren: () => import('./error/error.routes').then(m => m.ERROR_ROUTES)
  },
  
  // 404 頁面
  {
    path: '**',
    redirectTo: '/error/404'
  }
];
```

### 模組路由配置
```typescript
// 帳戶模組路由
export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    component: AccountLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        data: { title: '個人資料', icon: 'user' }
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        data: { title: '通知中心', icon: 'bell' }
      },
      {
        path: 'teams',
        component: TeamsComponent,
        data: { title: '團隊管理', icon: 'team' }
      },
      {
        path: 'achievements',
        component: AchievementsComponent,
        data: { title: '成就徽章', icon: 'trophy' }
      }
    ]
  }
];

// 專案模組路由
export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    component: ProjectsLayoutComponent,
    children: [
      {
        path: '',
        component: ProjectListComponent,
        data: { title: '專案列表', icon: 'project' }
      },
      {
        path: 'create',
        component: ProjectCreateComponent,
        data: { title: '建立專案', icon: 'plus' },
        canActivate: [projectCreateGuard]
      },
      {
        path: ':id',
        component: ProjectDetailComponent,
        resolve: { project: projectResolver },
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            component: ProjectOverviewComponent,
            data: { title: '專案概覽' }
          },
          {
            path: 'tasks',
            component: ProjectTasksComponent,
            data: { title: '任務管理' }
          },
          {
            path: 'documents',
            component: ProjectDocumentsComponent,
            data: { title: '文件管理' }
          },
          {
            path: 'cost-control',
            component: ProjectCostControlComponent,
            data: { title: '成本控制' },
            canActivate: [costControlGuard]
          }
        ]
      }
    ]
  }
];
```

## 🛡️ 路由守衛系統

### 1. 認證守衛 (Auth Guard)
```typescript
// 認證守衛
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // 記錄未授權訪問
  console.warn('Unauthorized access attempt to:', state.url);
  
  // 顯示通知
  notificationService.error('請先登入系統');
  
  // 重定向到登入頁面
  return router.parseUrl('/auth/login');
};

// 訪客守衛 (已登入用戶不能訪問)
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) {
    return true;
  }
  
  // 已登入用戶重定向到主頁
  return router.parseUrl('/');
};
```

### 2. 權限守衛 (ACL Guard)
```typescript
// ACL 權限守衛
export const aclGuard: CanActivateChildFn = (route, state) => {
  const aclService = inject(AclService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);
  
  // 獲取路由所需的權限
  const requiredRoles = route.data?.['roles'] as string[];
  const requiredPermissions = route.data?.['permissions'] as string[];
  
  if (!requiredRoles && !requiredPermissions) {
    return true; // 無權限要求
  }
  
  // 檢查角色權限
  if (requiredRoles && !aclService.canAccessByRoles(requiredRoles)) {
    notificationService.error('您沒有權限訪問此頁面');
    return router.parseUrl('/error/403');
  }
  
  // 檢查功能權限
  if (requiredPermissions && !aclService.canAccessByPermissions(requiredPermissions)) {
    notificationService.error('您沒有權限執行此操作');
    return router.parseUrl('/error/403');
  }
  
  return true;
};

// 專案創建守衛
export const projectCreateGuard: CanActivateFn = (route, state) => {
  const aclService = inject(AclService);
  const router = inject(Router);
  
  // 檢查是否有創建專案的權限
  if (!aclService.canAccessByPermissions(['project:create'])) {
    return router.parseUrl('/projects');
  }
  
  return true;
};

// 成本控制守衛
export const costControlGuard: CanActivateFn = (route, state) => {
  const aclService = inject(AclService);
  const projectService = inject(ProjectService);
  const router = inject(Router);
  
  const projectId = route.parent?.params['id'];
  
  // 檢查專案成本控制權限
  return projectService.getProjectPermissions(projectId).pipe(
    map(permissions => {
      if (permissions.includes('cost:view') || permissions.includes('cost:manage')) {
        return true;
      }
      return router.parseUrl(`/projects/${projectId}`);
    })
  );
};
```

### 3. 資料解析器 (Resolvers)
```typescript
// 專案資料解析器
export const projectResolver: ResolveFn<Project> = (route, state) => {
  const projectService = inject(ProjectService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);
  
  const projectId = route.paramMap.get('id');
  
  if (!projectId) {
    notificationService.error('專案 ID 無效');
    return router.parseUrl('/projects');
  }
  
  return projectService.getProject(projectId).pipe(
    catchError(error => {
      console.error('Failed to load project:', error);
      notificationService.error('載入專案失敗');
      return router.parseUrl('/projects');
    })
  );
};

// 用戶資料解析器
export const userResolver: ResolveFn<User> = (route, state) => {
  const userService = inject(UserService);
  const authService = inject(AuthService);
  
  const userId = route.paramMap.get('id') || authService.getCurrentUserId();
  
  return userService.getUser(userId).pipe(
    catchError(error => {
      console.error('Failed to load user:', error);
      return of(null);
    })
  );
};

// 團隊資料解析器
export const teamResolver: ResolveFn<Team[]> = (route, state) => {
  const teamService = inject(TeamService);
  const authService = inject(AuthService);
  
  return teamService.getUserTeams(authService.getCurrentUserId()).pipe(
    catchError(error => {
      console.error('Failed to load teams:', error);
      return of([]);
    })
  );
};
```

## 🚀 懶加載策略

### 1. 模組懶加載
```typescript
// 主應用路由配置
export const LAYOUT_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { title: '儀表板', icon: 'dashboard' }
      },
      {
        path: 'account',
        loadChildren: () => import('./account/account.routes').then(m => m.ACCOUNT_ROUTES)
      },
      {
        path: 'projects',
        loadChildren: () => import('./projects/projects.routes').then(m => m.PROJECTS_ROUTES)
      },
      {
        path: 'organization',
        loadChildren: () => import('./organization/organization.routes').then(m => m.ORGANIZATION_ROUTES)
      }
    ]
  }
];
```

### 2. 組件懶加載
```typescript
// 使用 @defer 進行組件懶加載
@Component({
  template: `
    <div class="project-detail">
      <h2>{{ project?.name }}</h2>
      
      <!-- 基本資訊立即載入 -->
      <div class="project-info">
        <p>狀態: {{ project?.status }}</p>
        <p>負責人: {{ project?.manager }}</p>
      </div>
      
      <!-- 成本控制組件懶加載 -->
      @defer (on viewport; prefetch on hover) {
        <app-cost-control [projectId]="project?.id"></app-cost-control>
      } @placeholder {
        <div class="loading-placeholder">載入成本控制...</div>
      } @error {
        <div class="error-message">載入失敗</div>
      }
      
      <!-- 文件管理組件懶加載 -->
      @defer (on interaction(showDocuments); prefetch on idle) {
        <app-document-manager [projectId]="project?.id"></app-document-manager>
      } @placeholder {
        <button #showDocuments>顯示文件管理</button>
      }
    </div>
  `
})
export class ProjectDetailComponent {
  @Input() project: Project | null = null;
}
```

### 3. 預加載策略
```typescript
// 自定義預加載策略
@Injectable()
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, fn: () => Observable<any>): Observable<any> {
    // 根據路由資料決定是否預加載
    const shouldPreload = route.data?.['preload'] === true;
    
    if (shouldPreload) {
      console.log('Preloading route:', route.path);
      return fn();
    }
    
    return of(null);
  }
}

// 路由配置中使用預加載
export const routes: Routes = [
  {
    path: 'projects',
    loadChildren: () => import('./projects/projects.module').then(m => m.ProjectsModule),
    data: { preload: true } // 預加載此模組
  },
  {
    path: 'account',
    loadChildren: () => import('./account/account.module').then(m => m.AccountModule),
    data: { preload: false } // 不預加載
  }
];

// 應用配置
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, {
      preloadingStrategy: CustomPreloadingStrategy
    })
  ]
});
```

## 🎯 路由動畫

### 1. 路由動畫配置
```typescript
// 路由動畫定義
export const routeAnimations = [
  {
    path: 'projects',
    component: ProjectsComponent,
    data: { animation: 'slideLeft' }
  },
  {
    path: 'projects/:id',
    component: ProjectDetailComponent,
    data: { animation: 'slideRight' }
  }
];

// 動畫觸發器
export const slideAnimation = trigger('slideAnimation', [
  transition('slideLeft => slideRight', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ]),
    query(':enter', [
      style({ left: '100%' })
    ]),
    query(':leave', animateChild()),
    group([
      query(':leave', [
        animate('300ms ease-out', style({ left: '-100%' }))
      ]),
      query(':enter', [
        animate('300ms ease-out', style({ left: '0%' }))
      ])
    ]),
    query(':enter', animateChild())
  ]),
  transition('slideRight => slideLeft', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ]),
    query(':enter', [
      style({ left: '-100%' })
    ]),
    query(':leave', animateChild()),
    group([
      query(':leave', [
        animate('300ms ease-out', style({ left: '100%' }))
      ]),
      query(':enter', [
        animate('300ms ease-out', style({ left: '0%' }))
      ])
    ]),
    query(':enter', animateChild())
  ])
]);
```

### 2. 組件中使用動畫
```typescript
@Component({
  selector: 'app-layout',
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <div [@slideAnimation]="getAnimationState()">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  animations: [slideAnimation]
})
export class LayoutComponent {
  private router = inject(Router);
  
  getAnimationState() {
    const url = this.router.url;
    if (url.includes('/projects/')) {
      return 'slideRight';
    }
    return 'slideLeft';
  }
}
```

## 🔧 路由工具服務

### 1. 路由服務
```typescript
@Injectable()
export class RouteService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private location = inject(Location);
  
  // 導航到指定路由
  navigateTo(route: string, params?: any, queryParams?: any) {
    this.router.navigate([route], {
      queryParams,
      relativeTo: this.activatedRoute
    });
  }
  
  // 獲取當前路由參數
  getRouteParams(): Observable<Params> {
    return this.activatedRoute.params;
  }
  
  // 獲取當前查詢參數
  getQueryParams(): Observable<Params> {
    return this.activatedRoute.queryParams;
  }
  
  // 更新查詢參數
  updateQueryParams(params: Params) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }
  
  // 返回上一頁
  goBack() {
    this.location.back();
  }
  
  // 獲取當前路由資料
  getRouteData(): Observable<any> {
    return this.activatedRoute.data;
  }
  
  // 檢查是否在指定路由
  isCurrentRoute(route: string): boolean {
    return this.router.url.includes(route);
  }
}
```

### 2. 麵包屑服務
```typescript
@Injectable()
export class BreadcrumbService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  
  // 生成麵包屑
  generateBreadcrumbs(): Observable<Breadcrumb[]> {
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.buildBreadcrumbs())
    );
  }
  
  private buildBreadcrumbs(): Breadcrumb[] {
    const breadcrumbs: Breadcrumb[] = [];
    let currentRoute = this.activatedRoute.root;
    
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
      
      if (currentRoute.snapshot.data['title']) {
        breadcrumbs.push({
          label: currentRoute.snapshot.data['title'],
          url: this.getUrlFromRoute(currentRoute),
          icon: currentRoute.snapshot.data['icon']
        });
      }
    }
    
    return breadcrumbs;
  }
  
  private getUrlFromRoute(route: ActivatedRoute): string {
    const urlSegments: string[] = [];
    let currentRoute = route;
    
    while (currentRoute) {
      if (currentRoute.snapshot.url.length > 0) {
        urlSegments.unshift(...currentRoute.snapshot.url.map(segment => segment.path));
      }
      currentRoute = currentRoute.parent!;
    }
    
    return '/' + urlSegments.join('/');
  }
}
```

## 📱 響應式路由

### 1. 移動端路由適配
```typescript
// 響應式路由配置
export const RESPONSIVE_ROUTES: Routes = [
  {
    path: 'projects',
    component: ProjectsComponent,
    children: [
      {
        path: '',
        component: ProjectListComponent,
        data: { 
          title: '專案列表',
          mobileTitle: '專案',
          showInMobile: true
        }
      },
      {
        path: ':id',
        component: ProjectDetailComponent,
        data: { 
          title: '專案詳情',
          mobileTitle: '專案',
          showInMobile: true
        },
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            component: ProjectOverviewComponent,
            data: { 
              title: '概覽',
              mobileTitle: '概覽',
              showInMobile: true
            }
          },
          {
            path: 'tasks',
            component: ProjectTasksComponent,
            data: { 
              title: '任務管理',
              mobileTitle: '任務',
              showInMobile: true
            }
          },
          {
            path: 'cost-control',
            component: ProjectCostControlComponent,
            data: { 
              title: '成本控制',
              mobileTitle: '成本',
              showInMobile: false // 移動端隱藏
            }
          }
        ]
      }
    ]
  }
];
```

### 2. 移動端導航服務
```typescript
@Injectable()
export class MobileNavigationService {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  
  isMobile$ = this.breakpointObserver.observe(['(max-width: 768px)'])
    .pipe(map(result => result.matches));
  
  // 移動端導航
  navigateOnMobile(route: string, params?: any) {
    this.isMobile$.pipe(take(1)).subscribe(isMobile => {
      if (isMobile) {
        // 移動端使用底部導航
        this.router.navigate([route], { queryParams: { mobile: true } });
      } else {
        // 桌面端正常導航
        this.router.navigate([route], { queryParams: params });
      }
    });
  }
  
  // 獲取移動端友好的路由
  getMobileFriendlyRoute(route: string): string {
    const mobileRoutes: { [key: string]: string } = {
      '/projects': '/mobile/projects',
      '/account': '/mobile/account',
      '/dashboard': '/mobile/dashboard'
    };
    
    return mobileRoutes[route] || route;
  }
}
```

## ✅ AI Agent 實作檢查清單

### 路由配置檢查清單
- [ ] **路由結構**：清晰的層級結構和模組分離
- [ ] **懶加載**：所有模組和組件使用懶加載
- [ ] **路由守衛**：認證、權限、資料解析器配置完整
- [ ] **錯誤處理**：404 和錯誤頁面路由配置
- [ ] **路由動畫**：適當的頁面切換動畫
- [ ] **響應式路由**：移動端和桌面端路由適配
- [ ] **麵包屑導航**：自動生成麵包屑導航
- [ ] **深度連結**：支援直接 URL 訪問

### 權限控制檢查清單
- [ ] **認證守衛**：未登入用戶重定向到登入頁
- [ ] **權限守衛**：基於角色和權限的訪問控制
- [ ] **資源權限**：專案、團隊等資源的細粒度權限
- [ ] **動態權限**：根據用戶角色動態調整路由
- [ ] **權限提示**：無權限訪問時的友善提示
- [ ] **權限快取**：權限檢查結果快取機制

### 性能優化檢查清單
- [ ] **預加載策略**：重要模組的預加載配置
- [ ] **組件懶加載**：使用 @defer 進行組件懶加載
- [ ] **路由快取**：已訪問路由的狀態快取
- [ ] **動畫優化**：路由動畫的性能優化
- [ ] **資源預載**：關鍵資源的預載入

## 📚 參考資源

### 官方文件
- [Angular Router 指南](https://angular.dev/guide/routing)
- [Angular 路由守衛](https://angular.dev/guide/router#guards)
- [Angular 懶加載](https://angular.dev/guide/lazy-loading-ngmodules)

### 最佳實踐
- [Angular 路由最佳實踐](https://angular.io/guide/router#best-practices)
- [ng-alain 路由配置](https://ng-alain.com/theme/route)
- [Angular 路由動畫](https://angular.io/guide/route-animations)

### 工具與測試
- [Angular Router Testing](https://angular.io/guide/testing#testing-routing-components)
- [Angular Router DevTools](https://angular.io/guide/router#router-events)

---

> **AI Agent 提示**：實作路由時，請遵循本指南的配置策略和檢查清單，確保路由的安全性、性能和用戶體驗。優先使用懶加載和適當的權限控制。
