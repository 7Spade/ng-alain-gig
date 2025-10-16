/**
 * Organization 模組路由配置
 * 組織管理、成員管理、團隊管理（繼承 Account）
 */

import { Routes } from '@angular/router';

export const organizationRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    // TODO: 建立 OrganizationListPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'detail/:id',
    // TODO: 建立 OrganizationDetailPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'settings',
    // TODO: 建立 OrganizationSettingsPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'teams',
    // TODO: 建立團隊管理元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'members',
    // TODO: 建立成員管理元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  }
];
