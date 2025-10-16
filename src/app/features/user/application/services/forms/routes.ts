import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'basic-form',
    loadComponent: () => import('./basic-form/basic-form.component').then(m => m.BasicFormComponent)
  },
  {
    path: 'step-form',
    loadComponent: () => import('./step-form/step-form.component').then(m => m.StepFormComponent)
  },
  {
    path: 'advanced-form',
    loadComponent: () => import('./advanced-form/advanced-form.component').then(m => m.AdvancedFormComponent)
  },
  { path: '', redirectTo: 'basic-form', pathMatch: 'full' }
];
