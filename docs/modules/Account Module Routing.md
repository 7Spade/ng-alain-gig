# Account Module Routing (帳戶模組路由)

## 路由概述

Account Module Routing 定義了帳戶模組的路由架構，包括認證、用戶管理、個人檔案、社交功能、成就系統、通知管理等所有帳戶相關的路由配置。本路由系統採用 Angular 現代路由最佳實踐，支援懶加載、路由守衛、參數驗證等功能。

## 路由架構

### 1. 路由層級結構

```typescript
// 路由層級結構
const ROUTE_HIERARCHY = {
  ROOT: '/',
  AUTH: '/auth',
  ACCOUNT: '/account',
  PROFILE: '/account/profile',
  PREFERENCES: '/account/preferences',
  LICENSES: '/account/licenses',
  SOCIAL: '/account/social',
  NOTIFICATIONS: '/account/notifications',
  ACHIEVEMENTS: '/account/achievements',
  ACTIVITY: '/account/activity'
} as const;
```

### 2. 路由模組結構

```typescript
// 主要路由模組
const ROUTE_MODULES = {
  APP_ROUTING: 'app-routing.module.ts',
  AUTH_ROUTING: 'auth-routing.module.ts',
  ACCOUNT_ROUTING: 'account-routing.module.ts',
  PROFILE_ROUTING: 'profile-routing.module.ts',
  SOCIAL_ROUTING: 'social-routing.module.ts'
} as const;
```

## 認證路由

### 1. 認證路由配置

```typescript
// auth-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: '登入 - Ng-Alain',
    data: {
      breadcrumb: '登入',
      requiresAuth: false
    }
  },
  {
    path: 'register',
    component: RegisterComponent,
    title: '註冊 - Ng-Alain',
    data: {
      breadcrumb: '註冊',
      requiresAuth: false
    }
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    title: '忘記密碼 - Ng-Alain',
    data: {
      breadcrumb: '忘記密碼',
      requiresAuth: false
    }
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: '重設密碼 - Ng-Alain',
    data: {
      breadcrumb: '重設密碼',
      requiresAuth: false
    }
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./components/verify-email/verify-email.component')
      .then(m => m.VerifyEmailComponent),
    title: '驗證電子郵件 - Ng-Alain',
    data: {
      breadcrumb: '驗證電子郵件',
      requiresAuth: false
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
```

### 2. 認證路由守衛

```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../services/auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private authStateService: AuthStateService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(route, state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(route, state);
  }

  private checkAuth(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiresAuth = route.data['requiresAuth'] !== false;
    
    if (!requiresAuth) {
      return of(true);
    }

    return this.authService.isAuthenticated().pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        } else {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      })
    );
  }
}

// guest.guard.ts
@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isAuthenticated().pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/dashboard']);
          return false;
        }
        return true;
      }),
      catchError(() => of(true))
    );
  }
}
```

## 帳戶路由

### 1. 帳戶路由配置

```typescript
// account-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountLayoutComponent } from './components/account-layout/account-layout.component';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AccountResolver } from './resolvers/account.resolver';

const routes: Routes = [
  {
    path: '',
    component: AccountLayoutComponent,
    canActivate: [AuthGuard],
    resolve: { account: AccountResolver },
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/profile/profile.component')
          .then(m => m.ProfileComponent),
        title: '個人檔案 - Ng-Alain',
        data: {
          breadcrumb: '個人檔案',
          requiresAuth: true
        }
      },
      {
        path: 'preferences',
        loadComponent: () => import('./components/preferences/preferences.component')
          .then(m => m.PreferencesComponent),
        title: '偏好設定 - Ng-Alain',
        data: {
          breadcrumb: '偏好設定',
          requiresAuth: true
        }
      },
      {
        path: 'licenses',
        loadComponent: () => import('./components/licenses/licenses.component')
          .then(m => m.LicensesComponent),
        title: '專業證照 - Ng-Alain',
        data: {
          breadcrumb: '專業證照',
          requiresAuth: true
        }
      },
      {
        path: 'social',
        loadChildren: () => import('./social/social-routing.module')
          .then(m => m.SocialRoutingModule)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./components/notifications/notifications.component')
          .then(m => m.NotificationsComponent),
        title: '通知中心 - Ng-Alain',
        data: {
          breadcrumb: '通知中心',
          requiresAuth: true
        }
      },
      {
        path: 'achievements',
        loadComponent: () => import('./components/achievements/achievements.component')
          .then(m => m.AchievementsComponent),
        title: '成就系統 - Ng-Alain',
        data: {
          breadcrumb: '成就系統',
          requiresAuth: true
        }
      },
      {
        path: 'activity',
        loadComponent: () => import('./components/activity/activity.component')
          .then(m => m.ActivityComponent),
        title: '活動記錄 - Ng-Alain',
        data: {
          breadcrumb: '活動記錄',
          requiresAuth: true
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
```

### 2. 帳戶路由解析器

```typescript
// account.resolver.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { UserProfile } from '../models/user-profile.model';
import { UserPreferences } from '../models/user-preferences.model';

@Injectable({
  providedIn: 'root'
})
export class AccountResolver implements Resolve<AccountData> {
  constructor(private userService: UserService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<AccountData> | Promise<AccountData> | AccountData {
    return forkJoin({
      profile: this.userService.getUserProfile(),
      preferences: this.userService.getUserPreferences()
    }).pipe(
      map(data => ({
        profile: data.profile,
        preferences: data.preferences,
        loadedAt: new Date()
      })),
      catchError(error => {
        console.error('載入帳戶資料失敗:', error);
        return of({
          profile: null,
          preferences: null,
          loadedAt: new Date(),
          error: error.message
        });
      })
    );
  }
}

interface AccountData {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  loadedAt: Date;
  error?: string;
}
```

## 個人檔案路由

### 1. 個人檔案路由配置

```typescript
// profile-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './components/profile/profile.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { ProfileViewComponent } from './components/profile-view/profile-view.component';
import { ProfileSettingsComponent } from './components/profile-settings/profile-settings.component';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ProfileResolver } from './resolvers/profile.resolver';

const routes: Routes = [
  {
    path: '',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    resolve: { profile: ProfileResolver },
    children: [
      {
        path: '',
        redirectTo: 'view',
        pathMatch: 'full'
      },
      {
        path: 'view',
        component: ProfileViewComponent,
        title: '檢視個人檔案 - Ng-Alain',
        data: {
          breadcrumb: '檢視個人檔案',
          requiresAuth: true
        }
      },
      {
        path: 'edit',
        component: ProfileEditComponent,
        title: '編輯個人檔案 - Ng-Alain',
        data: {
          breadcrumb: '編輯個人檔案',
          requiresAuth: true
        }
      },
      {
        path: 'settings',
        component: ProfileSettingsComponent,
        title: '個人檔案設定 - Ng-Alain',
        data: {
          breadcrumb: '個人檔案設定',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: ':userId',
    loadComponent: () => import('./components/public-profile/public-profile.component')
      .then(m => m.PublicProfileComponent),
    title: '公開個人檔案 - Ng-Alain',
    data: {
      breadcrumb: '公開個人檔案',
      requiresAuth: false
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
```

### 2. 個人檔案路由解析器

```typescript
// profile.resolver.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { UserProfile } from '../models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileResolver implements Resolve<UserProfile | null> {
  constructor(private userService: UserService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<UserProfile | null> | Promise<UserProfile | null> | UserProfile | null {
    const userId = route.paramMap.get('userId');
    
    if (userId) {
      return this.userService.getUserProfileById(userId).pipe(
        map(profile => profile),
        catchError(error => {
          console.error('載入個人檔案失敗:', error);
          return of(null);
        })
      );
    } else {
      return this.userService.getUserProfile().pipe(
        map(profile => profile),
        catchError(error => {
          console.error('載入個人檔案失敗:', error);
          return of(null);
        })
      );
    }
  }
}
```

## 社交路由

### 1. 社交路由配置

```typescript
// social-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SocialComponent } from './components/social/social.component';
import { FollowingComponent } from './components/following/following.component';
import { FollowersComponent } from './components/followers/followers.component';
import { StarredProjectsComponent } from './components/starred-projects/starred-projects.component';
import { AuthGuard } from '../auth/guards/auth.guard';
import { SocialResolver } from './resolvers/social.resolver';

const routes: Routes = [
  {
    path: '',
    component: SocialComponent,
    canActivate: [AuthGuard],
    resolve: { social: SocialResolver },
    children: [
      {
        path: '',
        redirectTo: 'following',
        pathMatch: 'full'
      },
      {
        path: 'following',
        component: FollowingComponent,
        title: '關注中 - Ng-Alain',
        data: {
          breadcrumb: '關注中',
          requiresAuth: true
        }
      },
      {
        path: 'followers',
        component: FollowersComponent,
        title: '關注者 - Ng-Alain',
        data: {
          breadcrumb: '關注者',
          requiresAuth: true
        }
      },
      {
        path: 'starred-projects',
        component: StarredProjectsComponent,
        title: '收藏的專案 - Ng-Alain',
        data: {
          breadcrumb: '收藏的專案',
          requiresAuth: true
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SocialRoutingModule { }
```

## 通知路由

### 1. 通知路由配置

```typescript
// notifications-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { NotificationDetailComponent } from './components/notification-detail/notification-detail.component';
import { NotificationSettingsComponent } from './components/notification-settings/notification-settings.component';
import { AuthGuard } from '../auth/guards/auth.guard';
import { NotificationsResolver } from './resolvers/notifications.resolver';

const routes: Routes = [
  {
    path: '',
    component: NotificationsComponent,
    canActivate: [AuthGuard],
    resolve: { notifications: NotificationsResolver },
    children: [
      {
        path: '',
        redirectTo: 'all',
        pathMatch: 'full'
      },
      {
        path: 'all',
        loadComponent: () => import('./components/notification-list/notification-list.component')
          .then(m => m.NotificationListComponent),
        title: '所有通知 - Ng-Alain',
        data: {
          breadcrumb: '所有通知',
          requiresAuth: true
        }
      },
      {
        path: 'unread',
        loadComponent: () => import('./components/notification-list/notification-list.component')
          .then(m => m.NotificationListComponent),
        title: '未讀通知 - Ng-Alain',
        data: {
          breadcrumb: '未讀通知',
          requiresAuth: true,
          filter: 'unread'
        }
      },
      {
        path: 'settings',
        component: NotificationSettingsComponent,
        title: '通知設定 - Ng-Alain',
        data: {
          breadcrumb: '通知設定',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: ':id',
    component: NotificationDetailComponent,
    canActivate: [AuthGuard],
    title: '通知詳情 - Ng-Alain',
    data: {
      breadcrumb: '通知詳情',
      requiresAuth: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificationsRoutingModule { }
```

## 成就路由

### 1. 成就路由配置

```typescript
// achievements-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AchievementsComponent } from './components/achievements/achievements.component';
import { AchievementDetailComponent } from './components/achievement-detail/achievement-detail.component';
import { AchievementProgressComponent } from './components/achievement-progress/achievement-progress.component';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AchievementsResolver } from './resolvers/achievements.resolver';

const routes: Routes = [
  {
    path: '',
    component: AchievementsComponent,
    canActivate: [AuthGuard],
    resolve: { achievements: AchievementsResolver },
    children: [
      {
        path: '',
        redirectTo: 'all',
        pathMatch: 'full'
      },
      {
        path: 'all',
        loadComponent: () => import('./components/achievement-list/achievement-list.component')
          .then(m => m.AchievementListComponent),
        title: '所有成就 - Ng-Alain',
        data: {
          breadcrumb: '所有成就',
          requiresAuth: true
        }
      },
      {
        path: 'unlocked',
        loadComponent: () => import('./components/achievement-list/achievement-list.component')
          .then(m => m.AchievementListComponent),
        title: '已解鎖成就 - Ng-Alain',
        data: {
          breadcrumb: '已解鎖成就',
          requiresAuth: true,
          filter: 'unlocked'
        }
      },
      {
        path: 'in-progress',
        loadComponent: () => import('./components/achievement-list/achievement-list.component')
          .then(m => m.AchievementListComponent),
        title: '進行中成就 - Ng-Alain',
        data: {
          breadcrumb: '進行中成就',
          requiresAuth: true,
          filter: 'in-progress'
        }
      },
      {
        path: 'progress',
        component: AchievementProgressComponent,
        title: '成就進度 - Ng-Alain',
        data: {
          breadcrumb: '成就進度',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: ':id',
    component: AchievementDetailComponent,
    canActivate: [AuthGuard],
    title: '成就詳情 - Ng-Alain',
    data: {
      breadcrumb: '成就詳情',
      requiresAuth: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AchievementsRoutingModule { }
```

## 路由守衛

### 1. 角色守衛

```typescript
// role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return this.userService.getCurrentUser().pipe(
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        const userRoles = user.roles || [];
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      }),
      catchError(() => {
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }
}
```

### 2. 權限守衛

```typescript
// permission.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredPermissions = route.data['permissions'] as string[];
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    return this.userService.getCurrentUser().pipe(
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        const userPermissions = user.permissions || [];
        const hasRequiredPermission = requiredPermissions.every(permission => 
          userPermissions.includes(permission)
        );

        if (!hasRequiredPermission) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      }),
      catchError(() => {
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }
}
```

### 3. 功能開關守衛

```typescript
// feature-toggle.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FeatureToggleService } from '../services/feature-toggle.service';

@Injectable({
  providedIn: 'root'
})
export class FeatureToggleGuard implements CanActivate {
  constructor(
    private featureToggleService: FeatureToggleService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredFeatures = route.data['features'] as string[];
    
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    return this.featureToggleService.checkFeatures(requiredFeatures).pipe(
      map(enabled => {
        if (!enabled) {
          this.router.navigate(['/feature-unavailable']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/feature-unavailable']);
        return of(false);
      })
    );
  }
}
```

## 路由解析器

### 1. 用戶解析器

```typescript
// user.resolver.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { UserEntity } from '../models/user.entity';

@Injectable({
  providedIn: 'root'
})
export class UserResolver implements Resolve<UserEntity | null> {
  constructor(private userService: UserService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<UserEntity | null> | Promise<UserEntity | null> | UserEntity | null {
    const userId = route.paramMap.get('userId');
    
    if (!userId) {
      return of(null);
    }

    return this.userService.getUserById(userId).pipe(
      map(user => user),
      catchError(error => {
        console.error('載入用戶失敗:', error);
        return of(null);
      })
    );
  }
}
```

### 2. 通知解析器

```typescript
// notifications.resolver.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { NotificationEntity } from '../models/notification.entity';

@Injectable({
  providedIn: 'root'
})
export class NotificationsResolver implements Resolve<NotificationEntity[]> {
  constructor(private notificationService: NotificationService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<NotificationEntity[]> | Promise<NotificationEntity[]> | NotificationEntity[] {
    const filter = route.data['filter'] as string;
    
    return this.notificationService.getUserNotifications(filter).pipe(
      map(notifications => notifications),
      catchError(error => {
        console.error('載入通知失敗:', error);
        return of([]);
      })
    );
  }
}
```

## 路由配置整合

### 1. 主路由配置

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { GuestGuard } from './auth/guards/guest.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-routing.module')
      .then(m => m.AuthRoutingModule),
    canActivate: [GuestGuard]
  },
  {
    path: 'account',
    loadChildren: () => import('./account/account-routing.module')
      .then(m => m.AccountRoutingModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    title: '儀表板 - Ng-Alain'
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component')
      .then(m => m.UnauthorizedComponent),
    title: '未授權 - Ng-Alain'
  },
  {
    path: 'feature-unavailable',
    loadComponent: () => import('./shared/components/feature-unavailable/feature-unavailable.component')
      .then(m => m.FeatureUnavailableComponent),
    title: '功能不可用 - Ng-Alain'
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
      .then(m => m.NotFoundComponent),
    title: '頁面不存在 - Ng-Alain'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled',
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### 2. 路由配置服務

```typescript
// route-config.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RouteConfigService {
  private currentRoute$ = new Observable<ActivatedRoute>();

  constructor(private router: Router) {
    this.currentRoute$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.routerState.root)
    );
  }

  getCurrentRoute(): Observable<ActivatedRoute> {
    return this.currentRoute$;
  }

  getBreadcrumbs(): Observable<Breadcrumb[]> {
    return this.currentRoute$.pipe(
      map(route => this.buildBreadcrumbs(route))
    );
  }

  private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const breadcrumb = child.snapshot.data['breadcrumb'];
      if (breadcrumb) {
        breadcrumbs.push({
          label: breadcrumb,
          url: url
        });
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}

interface Breadcrumb {
  label: string;
  url: string;
}
```

## 路由測試

### 1. 路由守衛測試

```typescript
describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('應該允許已認證用戶訪問', () => {
    authService.isAuthenticated.and.returnValue(of(true));
    
    const result = guard.canActivate(
      { data: { requiresAuth: true } } as ActivatedRouteSnapshot,
      { url: '/account/profile' } as RouterStateSnapshot
    );

    expect(result).toBe(true);
  });

  it('應該重定向未認證用戶到登入頁面', () => {
    authService.isAuthenticated.and.returnValue(of(false));
    
    guard.canActivate(
      { data: { requiresAuth: true } } as ActivatedRouteSnapshot,
      { url: '/account/profile' } as RouterStateSnapshot
    );

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/account/profile' }
    });
  });
});
```

### 2. 路由解析器測試

```typescript
describe('AccountResolver', () => {
  let resolver: AccountResolver;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUserProfile', 'getUserPreferences']);

    TestBed.configureTestingModule({
      providers: [
        AccountResolver,
        { provide: UserService, useValue: userServiceSpy }
      ]
    });

    resolver = TestBed.inject(AccountResolver);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('應該解析帳戶資料', (done) => {
    const mockProfile = { userId: '1', firstName: 'John', lastName: 'Doe' };
    const mockPreferences = { theme: 'LIGHT', language: 'zh-TW' };

    userService.getUserProfile.and.returnValue(of(mockProfile));
    userService.getUserPreferences.and.returnValue(of(mockPreferences));

    resolver.resolve(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot
    ).subscribe({
      next: (data) => {
        expect(data.profile).toEqual(mockProfile);
        expect(data.preferences).toEqual(mockPreferences);
        expect(data.loadedAt).toBeInstanceOf(Date);
        done();
      },
      error: done.fail
    });
  });
});
```

## 最佳實踐

### 1. 路由設計原則
- **懶加載**: 使用懶加載減少初始載入時間
- **守衛保護**: 使用路由守衛保護敏感路由
- **解析器**: 使用解析器預載入資料
- **參數驗證**: 驗證路由參數的有效性

### 2. 效能優化
- **預載入**: 適當使用預載入策略
- **快取**: 快取解析器結果
- **批次載入**: 批次載入相關資料
- **錯誤處理**: 提供適當的錯誤處理

### 3. 可維護性
- **模組化**: 將路由配置模組化
- **命名規範**: 使用一致的命名規範
- **文件完整**: 提供完整的路由文件
- **測試覆蓋**: 提供完整的路由測試