import { Routes } from '@angular/router';
import { startPageGuard } from '@core';
import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { LayoutBasicComponent, LayoutBlankComponent } from './layout';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [startPageGuard, authSimpleCanActivate],
    canActivateChild: [authSimpleCanActivateChild],
    data: {},
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // 核心業務模組路由
      {
        path: 'account',
        loadChildren: () => import('./features/account/account.routes').then(m => m.accountRoutes)
      },
      {
        path: 'user',
        loadChildren: () => import('./features/user/user.routes').then(m => m.userRoutes)
      },
      {
        path: 'organization',
        loadChildren: () => import('./features/organization/organization.routes').then(m => m.organizationRoutes)
      },
      {
        path: 'project',
        loadChildren: () => import('./features/project/project.routes').then(m => m.projectRoutes)
      },
      {
        path: 'social',
        loadChildren: () => import('./features/social/social.routes').then(m => m.socialRoutes)
      },
      {
        path: 'achievement',
        loadChildren: () => import('./features/achievement/achievement.routes').then(m => m.achievementRoutes)
      },
      {
        path: 'notification',
        loadChildren: () => import('./features/notification/notification.routes').then(m => m.notificationRoutes)
      },
      // 現有功能模組（按照 DDD 架構重新組織）
      {
        path: 'dashboard',
        loadChildren: () => import('./features/user/presentation/pages/dashboard/routes').then(m => m.routes)
      },
      {
        path: 'widgets',
        loadChildren: () => import('./features/user/presentation/components/widgets/routes').then(m => m.routes)
      },
      {
        path: 'style',
        loadChildren: () => import('./features/user/presentation/pages/design-system/routes').then(m => m.routes)
      },
      {
        path: 'delon',
        loadChildren: () => import('./core/infrastructure/components/routes').then(m => m.routes)
      },
      {
        path: 'extras',
        loadChildren: () => import('./core/infrastructure/extras/routes').then(m => m.routes)
      },
      // Pro 模組路由分散到對應功能模組
      {
        path: 'forms',
        loadChildren: () => import('./features/user/application/services/forms/routes').then(m => m.routes)
      },
      {
        path: 'lists',
        loadChildren: () => import('./features/user/application/services/lists/routes').then(m => m.routes)
      },
      {
        path: 'profiles',
        loadChildren: () => import('./features/user/application/services/profiles/routes').then(m => m.routes)
      },
      {
        path: 'results',
        loadChildren: () => import('./features/user/application/services/results/routes').then(m => m.routes)
      }
    ]
  },
  // Blak Layout 空白布局
  {
    path: 'data-v',
    component: LayoutBlankComponent,
    children: [{ path: '', loadChildren: () => import('./features/user/presentation/pages/data-visualization/routes').then(m => m.routes) }]
  },
  // passport
  { path: '', loadChildren: () => import('./features/user/presentation/auth/routes').then(m => m.routes) },
  { path: 'exception', loadChildren: () => import('./core/infrastructure/exceptions/routes').then(m => m.routes) },
  { path: '**', redirectTo: 'exception/404' }
];
