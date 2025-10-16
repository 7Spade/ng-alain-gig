/**
 * Achievement 模組路由配置
 * 成就系統、規則引擎
 */

import { Routes } from '@angular/router';

export const achievementRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    // TODO: 建立 AchievementDashboardPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'leaderboard',
    // TODO: 建立 LeaderboardPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'management',
    // TODO: 建立 AchievementManagementPage 元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'display',
    // TODO: 建立成就顯示元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'leaderboard',
    // TODO: 建立排行榜元件
    loadComponent: () => import('../../routes/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  }
];
