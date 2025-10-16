import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'center',
    loadComponent: () => import('./center/center.component').then(m => m.ProAccountCenterComponent),
    children: [
      {
        path: 'articles',
        loadComponent: () => import('./center/articles/articles.component').then(m => m.ProAccountCenterArticlesComponent)
      },
      {
        path: 'applications',
        loadComponent: () => import('./center/applications/applications.component').then(m => m.ProAccountCenterApplicationsComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./center/projects/projects.component').then(m => m.ProAccountCenterProjectsComponent)
      },
      { path: '', redirectTo: 'articles', pathMatch: 'full' }
    ]
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.ProAccountSettingsComponent),
    children: [
      {
        path: 'base',
        loadComponent: () => import('./settings/base/base.component').then(m => m.ProAccountSettingsBaseComponent)
      },
      {
        path: 'security',
        loadComponent: () => import('./settings/security/security.component').then(m => m.ProAccountSettingsSecurityComponent)
      },
      {
        path: 'binding',
        loadComponent: () => import('./settings/binding/binding.component').then(m => m.ProAccountSettingsBindingComponent)
      },
      {
        path: 'notification',
        loadComponent: () => import('./settings/notification/notification.component').then(m => m.ProAccountSettingsNotificationComponent)
      },
      { path: '', redirectTo: 'base', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'center', pathMatch: 'full' }
];
