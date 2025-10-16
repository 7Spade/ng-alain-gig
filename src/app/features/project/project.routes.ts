/**
 * Project 模組路由配置
 * 專案管理、任務管理、文件管理
 */

import { Routes } from '@angular/router';

export const projectRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    // TODO: 建立 ProjectListPage 元件
    loadComponent: () =>
      import('../user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'detail/:id',
    // TODO: 建立 ProjectDetailPage 元件
    loadComponent: () =>
      import('../user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'dashboard/:id',
    // TODO: 建立 ProjectDashboardPage 元件
    loadComponent: () =>
      import('../user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'reports/:id',
    // TODO: 建立 ProjectReportsPage 元件
    loadComponent: () =>
      import('../user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'tasks',
    // TODO: 建立任務管理元件
    loadComponent: () =>
      import('../user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'documents',
    // TODO: 建立文件管理元件
    loadComponent: () =>
      import('../user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'cost',
    // TODO: 建立成本管理元件
    loadComponent: () =>
      import('../user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  }
];
