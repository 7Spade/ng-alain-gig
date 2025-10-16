import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'success',
    loadComponent: () => import('./success/success.component').then(m => m.ProResultSuccessComponent)
  },
  {
    path: 'fail',
    loadComponent: () => import('./fail/fail.component').then(m => m.ProResultFailComponent)
  },
  { path: '', redirectTo: 'success', pathMatch: 'full' }
];
