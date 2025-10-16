/**
 * Social 模組路由配置
 * 社交關係、推薦系統
 */

import { Routes } from '@angular/router';

export const socialRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    // TODO: 建立 SocialDashboardPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'discovery',
    // TODO: 建立 UserDiscoveryPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'network',
    // TODO: 建立 SocialNetworkPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'following',
    // TODO: 建立追蹤管理元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'discovery',
    // TODO: 建立用戶發現元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  }
];
