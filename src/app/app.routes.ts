import { Routes } from '@angular/router';
import { startPageGuard } from '@core';
import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { LayoutBasicComponent, LayoutBlankComponent } from './layout';
import { featuresRoutes } from './features';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [startPageGuard, authSimpleCanActivate],
    canActivateChild: [authSimpleCanActivateChild],
    data: {},
    children: [{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }, ...featuresRoutes]
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
