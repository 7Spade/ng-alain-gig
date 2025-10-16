/**
 * Features 統一路由管理
 * 集中管理所有功能模組的路由配置
 */

import { Routes } from '@angular/router';

export const featuresRoutes: Routes = [
  // 核心業務模組路由
  {
    path: 'account',
    loadChildren: () => import('./user/application/services/account/routes').then(m => m.routes)
  },
  {
    path: 'user',
    loadChildren: () => import('./user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'organization',
    loadChildren: () => import('./user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'project',
    loadChildren: () => import('./project/routes').then(m => m.routes)
  },
  {
    path: 'social',
    loadChildren: () => import('./user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'achievement',
    loadChildren: () => import('./user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  {
    path: 'notification',
    loadChildren: () => import('./user/presentation/pages/dashboard/workplace/workplace.component').then(m => m.DashboardWorkplaceComponent)
  },
  // 現有功能模組（按照 DDD 架構重新組織）
  {
    path: 'dashboard',
    loadChildren: () => import('./user/presentation/pages/dashboard/routes').then(m => m.routes)
  },
  {
    path: 'widgets',
    loadChildren: () => import('./user/presentation/components/widgets/routes').then(m => m.routes)
  },
  {
    path: 'style',
    loadChildren: () => import('./user/presentation/pages/design-system/routes').then(m => m.routes)
  },
  {
    path: 'delon',
    loadChildren: () => import('../core/infrastructure/components/routes').then(m => m.routes)
  },
  {
    path: 'extras',
    loadChildren: () => import('../core/infrastructure/extras/routes').then(m => m.routes)
  },
  // Pro 模組路由分散到對應功能模組
  {
    path: 'forms',
    loadChildren: () => import('./user/application/services/forms/routes').then(m => m.routes)
  },
  {
    path: 'lists',
    loadChildren: () => import('./user/application/services/lists/routes').then(m => m.routes)
  },
  {
    path: 'profiles',
    loadChildren: () => import('./user/application/services/profiles/routes').then(m => m.routes)
  },
  {
    path: 'results',
    loadChildren: () => import('./user/application/services/results/routes').then(m => m.routes)
  }
];
