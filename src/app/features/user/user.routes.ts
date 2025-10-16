/**
 * User 模組路由配置
 * 用戶認證、個人檔案、證照管理（繼承 Account）
 */

import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    // TODO: 建立 UserProfilePage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'settings',
    // TODO: 建立 UserSettingsPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'dashboard',
    // TODO: 建立 UserDashboardPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'certificates',
    // TODO: 建立證照管理元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  }
];
