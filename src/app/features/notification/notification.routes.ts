/**
 * Notification 模組路由配置
 * 通知系統、推送服務
 */

import { Routes } from '@angular/router';

export const notificationRoutes: Routes = [
  {
    path: '',
    redirectTo: 'center',
    pathMatch: 'full'
  },
  {
    path: 'center',
    // TODO: 建立 NotificationCenterPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'settings',
    // TODO: 建立 NotificationSettingsPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'history',
    // TODO: 建立 NotificationHistoryPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'display',
    // TODO: 建立通知顯示元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'settings',
    // TODO: 建立通知設定元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  }
];
