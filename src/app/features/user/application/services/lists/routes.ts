import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/list.component').then(m => m.ProListLayoutComponent),
    children: [
      {
        path: 'articles',
        loadComponent: () => import('./articles/articles.component').then(m => m.ProListArticlesComponent)
      },
      {
        path: 'applications',
        loadComponent: () => import('./applications/applications.component').then(m => m.ProListApplicationsComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./projects/projects.component').then(m => m.ProListProjectsComponent)
      },
      {
        path: 'table-list',
        loadComponent: () => import('./table-list/table-list.component').then(m => m.ProTableListComponent)
      },
      {
        path: 'basic-list',
        loadComponent: () => import('./basic-list/basic-list.component').then(m => m.ProBasicListComponent)
      },
      {
        path: 'card-list',
        loadComponent: () => import('./card-list/card-list.component').then(m => m.ProCardListComponent)
      },
      { path: '', redirectTo: 'articles', pathMatch: 'full' }
    ]
  }
];
