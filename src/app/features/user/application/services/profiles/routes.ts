import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'basic',
    loadComponent: () => import('./basic/basic.component').then(m => m.ProProfileBaseComponent)
  },
  {
    path: 'advanced',
    loadComponent: () => import('./advanced/advanced.component').then(m => m.ProProfileAdvancedComponent)
  },
  { path: '', redirectTo: 'basic', pathMatch: 'full' }
];
