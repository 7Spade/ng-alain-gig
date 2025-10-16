import { Routes } from '@angular/router';
import { startPageGuard } from '@core';
import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { LayoutBasicComponent, LayoutBlankComponent } from '../layout';

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
        loadChildren: () => import('../features/account/account.routes').then(m => m.accountRoutes)
      },
      {
        path: 'user',
        loadChildren: () => import('../features/user/user.routes').then(m => m.userRoutes)
      },
      {
        path: 'organization',
        loadChildren: () => import('../features/organization/organization.routes').then(m => m.organizationRoutes)
      },
      {
        path: 'project',
        loadChildren: () => import('../features/project/project.routes').then(m => m.projectRoutes)
      },
      {
        path: 'social',
        loadChildren: () => import('../features/social/social.routes').then(m => m.socialRoutes)
      },
      {
        path: 'achievement',
        loadChildren: () => import('../features/achievement/achievement.routes').then(m => m.achievementRoutes)
      },
      {
        path: 'notification',
        loadChildren: () => import('../features/notification/notification.routes').then(m => m.notificationRoutes)
      },
      // 現有功能模組（保留用於演示）
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/routes').then(m => m.routes)
      },
      {
        path: 'widgets',
        loadChildren: () => import('./widgets/routes').then(m => m.routes)
      },
      { path: 'style', loadChildren: () => import('./style/routes').then(m => m.routes) },
      { path: 'delon', loadChildren: () => import('./delon/routes').then(m => m.routes) },
      { path: 'extras', loadChildren: () => import('./extras/routes').then(m => m.routes) },
      { path: 'pro', loadChildren: () => import('./pro/routes').then(m => m.routes) }
    ]
  },
  // Blak Layout 空白布局
  {
    path: 'data-v',
    component: LayoutBlankComponent,
    children: [{ path: '', loadChildren: () => import('./data-v/routes').then(m => m.routes) }]
  },
  // passport
  { path: '', loadChildren: () => import('./passport/routes').then(m => m.routes) },
  { path: 'exception', loadChildren: () => import('./exception/routes').then(m => m.routes) },
  { path: '**', redirectTo: 'exception/404' }
];
