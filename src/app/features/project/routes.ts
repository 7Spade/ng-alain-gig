import { Routes } from '@angular/router';

import { ProjectListComponent } from './project-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: ProjectListComponent }
];


