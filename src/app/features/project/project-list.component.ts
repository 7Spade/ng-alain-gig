import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';

type ProjectListItem = {
  id: string;
  name: string;
  status: string;
};

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzButtonModule, NzSpinModule],
  template: `
    <section>
      <h3 class="mb-sm">Projects</h3>
      <nz-table [nzData]="projects()" [nzLoading]="loading()" [nzFrontPagination]="false">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          @for (p of projects(); track p.id) {
            <tr>
              <td>{{ p.name }}</td>
              <td>{{ p.status }}</td>
              <td>
                <button nz-button nzType="link" (click)="view(p.id)">View</button>
              </td>
            </tr>
          }
        </tbody>
      </nz-table>
    </section>
  `
})
export class ProjectListComponent {
  readonly loading = signal(false);
  readonly projects = signal<ProjectListItem[]>([]);

  constructor() {
    // 模擬資料，後續會改為串接 FirebaseRepository
    this.loading.set(true);
    queueMicrotask(() => {
      this.projects.set([
        { id: 'p1', name: 'Site A', status: 'Active' },
        { id: 'p2', name: 'Site B', status: 'Planning' }
      ]);
      this.loading.set(false);
    });
  }

  view(id: string): void {
    // TODO: 導航至 detail（預留）
    // 之後會接 routing: /project/:id
    console.log('view', id);
  }
}
