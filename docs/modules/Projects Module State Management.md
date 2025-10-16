# Project Module - State Management

## 概述
Project Module 狀態管理採用 Angular v20 Signal-based 架構，結合 NgRx 實現響應式狀態管理。

## 狀態架構

### 1. Signal-based 狀態服務
```typescript
@Injectable()
export class ProjectStateService {
  private readonly state = signalState({
    projects: [] as Project[],
    currentProject: null as Project | null,
    tasks: [] as Task[],
    teamMembers: [] as TeamMember[],
    budget: null as Budget | null,
    loading: false,
    error: null as string | null
  });

  // 狀態信號
  readonly projects = this.state.projects;
  readonly currentProject = this.state.currentProject;
  readonly tasks = this.state.tasks;
  readonly teamMembers = this.state.teamMembers;
  readonly budget = this.state.budget;
  readonly loading = this.state.loading;
  readonly error = this.state.error;

  // 計算屬性
  readonly projectCount = computed(() => this.projects().length);
  readonly completedTasks = computed(() => 
    this.tasks().filter(task => task.status === 'completed').length
  );
  readonly projectProgress = computed(() => {
    const total = this.tasks().length;
    const completed = this.completedTasks();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });
}
```

### 2. 狀態操作方法
```typescript
// 載入專案列表
readonly loadProjects = rxMethod<void>(
  pipe(
    tap(() => patchState(this.state, { loading: true, error: null })),
    exhaustMap(() => this.projectService.getAllProjects()),
    tapResponse({
      next: (projects) => patchState(this.state, { projects }),
      error: (error) => patchState(this.state, { error: error.message }),
      finalize: () => patchState(this.state, { loading: false })
    })
  )
);

// 建立專案
readonly createProject = rxMethod<CreateProjectRequest>(
  pipe(
    tap(() => patchState(this.state, { loading: true, error: null })),
    exhaustMap((data) => this.projectService.createProject(data)),
    tapResponse({
      next: (project) => {
        patchState(this.state, (state) => ({
          projects: [...state.projects, project]
        }));
      },
      error: (error) => patchState(this.state, { error: error.message }),
      finalize: () => patchState(this.state, { loading: false })
    })
  )
);

// 更新專案
readonly updateProject = rxMethod<{ id: string; data: Partial<Project> }>(
  pipe(
    tap(() => patchState(this.state, { loading: true, error: null })),
    exhaustMap(({ id, data }) => this.projectService.updateProject(id, data)),
    tapResponse({
      next: (updatedProject) => {
        patchState(this.state, (state) => ({
          projects: state.projects.map(p => 
            p.id === id ? updatedProject : p
          ),
          currentProject: state.currentProject?.id === id 
            ? updatedProject 
            : state.currentProject
        }));
      },
      error: (error) => patchState(this.state, { error: error.message }),
      finalize: () => patchState(this.state, { loading: false })
    })
  )
);
```

## 組件狀態管理

### 1. 專案列表組件
```typescript
@Component({
  selector: 'app-project-list',
  standalone: true,
  template: `
    <div class="project-list">
      @if (projectState.loading()) {
        <div class="loading">載入中...</div>
      } @else if (projectState.error()) {
        <div class="error">{{ projectState.error() }}</div>
      } @else {
        <div class="projects-grid">
          @for (project of projectState.projects(); track project.id) {
            <div class="project-card" (click)="selectProject(project)">
              <h3>{{ project.name }}</h3>
              <p>{{ project.description }}</p>
              <div class="project-meta">
                <span>進度: {{ getProjectProgress(project.id) }}%</span>
                <span>狀態: {{ project.status }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ProjectListComponent implements OnInit {
  readonly projectState = inject(ProjectStateService);
  
  ngOnInit(): void {
    this.projectState.loadProjects();
  }
  
  selectProject(project: Project): void {
    this.projectState.selectProject(project.id);
  }
  
  getProjectProgress(projectId: string): number {
    const projectTasks = this.projectState.tasks()
      .filter(task => task.projectId === projectId);
    const completed = projectTasks.filter(task => task.status === 'completed').length;
    return projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
  }
}
```

### 2. 專案詳情組件
```typescript
@Component({
  selector: 'app-project-detail',
  standalone: true,
  template: `
    <div class="project-detail">
      @if (projectState.currentProject(); as project) {
        <div class="project-header">
          <h1>{{ project.name }}</h1>
          <p>{{ project.description }}</p>
          <div class="project-stats">
            <span>進度: {{ projectState.projectProgress() }}%</span>
            <span>任務: {{ projectState.tasks().length }}</span>
            <span>成員: {{ projectState.teamMembers().length }}</span>
          </div>
        </div>
        
        <div class="project-content">
          <div class="tasks-section">
            <h2>任務</h2>
            @for (task of projectState.tasks(); track task.id) {
              <div class="task-item">
                <span>{{ task.title }}</span>
                <span class="status">{{ task.status }}</span>
              </div>
            }
          </div>
          
          <div class="team-section">
            <h2>團隊成員</h2>
            @for (member of projectState.teamMembers(); track member.id) {
              <div class="member-item">
                <span>{{ member.name }}</span>
                <span class="role">{{ member.role }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ProjectDetailComponent {
  readonly projectState = inject(ProjectStateService);
}
```

## 相關文件
- [Project Module 架構](./Architecture/Project%20Module.md)
- [Project Module Firebase Schema](./Firebase%20Schema.md)