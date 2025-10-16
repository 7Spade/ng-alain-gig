/**
 * Account 模組路由配置
 * 統一帳戶抽象層，定義所有帳戶共同行為
 */

import { Routes } from '@angular/router';

export const accountRoutes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    // TODO: 建立 AccountProfilePage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'settings',
    // TODO: 建立 AccountSettingsPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  }
];
