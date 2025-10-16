# Project Service (專案服務)

## 服務概述

ProjectService 是專案模組的核心應用服務，負責協調專案相關的所有業務流程。本服務採用 DDD 架構設計，作為專案聚合根與外部世界之間的介面，處理專案建立、更新、狀態變更等核心業務邏輯。

## 核心職責

### 1. 專案生命週期管理
- 專案建立與初始化
- 專案狀態變更
- 專案歸檔與刪除
- 專案權限管理

### 2. 專案協作管理
- 團隊成員管理
- 角色分配
- 權限控制
- 協作流程協調

### 3. 專案資料管理
- 專案基本資料維護
- 里程碑管理
- 任務協調
- 文件管理

## 服務架構

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, switchMap, catchError } from 'rxjs';
import { ProjectAggregate } from '../../domain-layer/Aggregates/ProjectAggregate';
import { ProjectRepository } from '../../infrastructure-layer/FirebaseProjectRepository';
import { UserService } from './UserService';
import { NotificationService } from './NotificationService';
import { ProjectCreatedEvent, ProjectUpdatedEvent } from '../../domain-layer/Events';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projectRepository = inject(ProjectRepository);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  
  // 狀態管理
  private projectsSubject = new BehaviorSubject<ProjectAggregate[]>([]);
  private currentProjectSubject = new BehaviorSubject<ProjectAggregate | null>(null);
  
  // 公開的 Observable
  public readonly projects$ = this.projectsSubject.asObservable();
  public readonly currentProject$ = this.currentProjectSubject.asObservable();
  
  constructor() {
    this.initializeService();
  }
  
  private initializeService(): void {
    // 監聽用戶變更，重新載入專案
    this.userService.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.loadUserProjects(user.id);
        }
        return [];
      })
    ).subscribe();
  }
}
```

## 核心方法

### 1. 專案建立

```typescript
/**
 * 建立新專案
 * @param projectData 專案基本資料
 * @param ownerId 擁有者 ID
 * @returns Observable<ProjectAggregate>
 */
createProject(projectData: CreateProjectCommand, ownerId: string): Observable<ProjectAggregate> {
  return this.projectRepository.create({
    ...projectData,
    ownerId,
    status: ProjectStatus.DRAFT,
    createdAt: new Date(),
    updatedAt: new Date()
  }).pipe(
    map(projectData => {
      // 建立專案聚合根
      const project = new ProjectAggregate(projectData);
      
      // 更新本地狀態
      this.addProjectToState(project);
      
      // 發布事件
      this.publishEvent(new ProjectCreatedEvent({
        projectId: project.id,
        ownerId: project.ownerId,
        projectName: project.name,
        createdAt: project.createdAt
      }));
      
      // 發送通知
      this.notificationService.notifyProjectCreated(project);
      
      return project;
    }),
    catchError(error => {
      console.error('建立專案失敗:', error);
      throw new ProjectCreationError('無法建立專案', error);
    })
  );
}
```

### 2. 專案更新

```typescript
/**
 * 更新專案資料
 * @param projectId 專案 ID
 * @param updates 更新資料
 * @returns Observable<ProjectAggregate>
 */
updateProject(projectId: string, updates: UpdateProjectCommand): Observable<ProjectAggregate> {
  return this.projectRepository.update(projectId, {
    ...updates,
    updatedAt: new Date()
  }).pipe(
    map(projectData => {
      const project = new ProjectAggregate(projectData);
      
      // 更新本地狀態
      this.updateProjectInState(project);
      
      // 發布事件
      this.publishEvent(new ProjectUpdatedEvent({
        projectId: project.id,
        updatedFields: Object.keys(updates),
        updatedBy: this.userService.getCurrentUserId(),
        updatedAt: project.updatedAt
      }));
      
      return project;
    }),
    catchError(error => {
      console.error('更新專案失敗:', error);
      throw new ProjectUpdateError('無法更新專案', error);
    })
  );
}
```

### 3. 專案狀態管理

```typescript
/**
 * 變更專案狀態
 * @param projectId 專案 ID
 * @param newStatus 新狀態
 * @param reason 變更原因
 * @returns Observable<ProjectAggregate>
 */
changeProjectStatus(
  projectId: string, 
  newStatus: ProjectStatus, 
  reason?: string
): Observable<ProjectAggregate> {
  return this.projectRepository.update(projectId, {
    status: newStatus,
    statusChangedAt: new Date(),
    statusChangeReason: reason,
    updatedAt: new Date()
  }).pipe(
    map(projectData => {
      const project = new ProjectAggregate(projectData);
      
      // 更新本地狀態
      this.updateProjectInState(project);
      
      // 發布狀態變更事件
      this.publishEvent(new ProjectStatusChangedEvent({
        projectId: project.id,
        oldStatus: project.previousStatus,
        newStatus: project.status,
        changedBy: this.userService.getCurrentUserId(),
        reason: reason,
        changedAt: project.statusChangedAt
      }));
      
      // 發送狀態變更通知
      this.notificationService.notifyProjectStatusChanged(project, reason);
      
      return project;
    })
  );
}
```

### 4. 團隊成員管理

```typescript
/**
 * 新增團隊成員
 * @param projectId 專案 ID
 * @param userId 用戶 ID
 * @param role 角色
 * @returns Observable<ProjectAggregate>
 */
addTeamMember(projectId: string, userId: string, role: ProjectRole): Observable<ProjectAggregate> {
  return this.projectRepository.addTeamMember(projectId, {
    userId,
    role,
    joinedAt: new Date(),
    addedBy: this.userService.getCurrentUserId()
  }).pipe(
    map(projectData => {
      const project = new ProjectAggregate(projectData);
      
      // 更新本地狀態
      this.updateProjectInState(project);
      
      // 發布團隊成員新增事件
      this.publishEvent(new TeamMemberAddedEvent({
        projectId: project.id,
        userId,
        role,
        addedBy: this.userService.getCurrentUserId(),
        addedAt: new Date()
      }));
      
      // 發送邀請通知
      this.notificationService.notifyTeamMemberAdded(project, userId, role);
      
      return project;
    })
  );
}

/**
 * 移除團隊成員
 * @param projectId 專案 ID
 * @param userId 用戶 ID
 * @param reason 移除原因
 * @returns Observable<ProjectAggregate>
 */
removeTeamMember(projectId: string, userId: string, reason?: string): Observable<ProjectAggregate> {
  return this.projectRepository.removeTeamMember(projectId, userId).pipe(
    map(projectData => {
      const project = new ProjectAggregate(projectData);
      
      // 更新本地狀態
      this.updateProjectInState(project);
      
      // 發布團隊成員移除事件
      this.publishEvent(new TeamMemberRemovedEvent({
        projectId: project.id,
        userId,
        removedBy: this.userService.getCurrentUserId(),
        reason,
        removedAt: new Date()
      }));
      
      return project;
    })
  );
}
```

### 5. 專案查詢

```typescript
/**
 * 取得用戶的所有專案
 * @param userId 用戶 ID
 * @returns Observable<ProjectAggregate[]>
 */
getUserProjects(userId: string): Observable<ProjectAggregate[]> {
  return this.projectRepository.findByUserId(userId).pipe(
    map(projectsData => 
      projectsData.map(data => new ProjectAggregate(data))
    ),
    map(projects => {
      // 更新本地狀態
      this.projectsSubject.next(projects);
      return projects;
    })
  );
}

/**
 * 取得專案詳情
 * @param projectId 專案 ID
 * @returns Observable<ProjectAggregate>
 */
getProjectById(projectId: string): Observable<ProjectAggregate> {
  return this.projectRepository.findById(projectId).pipe(
    map(projectData => new ProjectAggregate(projectData)),
    map(project => {
      // 更新當前專案狀態
      this.currentProjectSubject.next(project);
      return project;
    })
  );
}

/**
 * 搜尋專案
 * @param searchCriteria 搜尋條件
 * @returns Observable<ProjectAggregate[]>
 */
searchProjects(searchCriteria: ProjectSearchCriteria): Observable<ProjectAggregate[]> {
  return this.projectRepository.search(searchCriteria).pipe(
    map(projectsData => 
      projectsData.map(data => new ProjectAggregate(data))
    )
  );
}
```

## 狀態管理

### 1. 本地狀態更新

```typescript
private addProjectToState(project: ProjectAggregate): void {
  const currentProjects = this.projectsSubject.value;
  this.projectsSubject.next([...currentProjects, project]);
}

private updateProjectInState(updatedProject: ProjectAggregate): void {
  const currentProjects = this.projectsSubject.value;
  const updatedProjects = currentProjects.map(project => 
    project.id === updatedProject.id ? updatedProject : project
  );
  this.projectsSubject.next(updatedProjects);
  
  // 如果當前專案被更新，也要更新當前專案狀態
  const currentProject = this.currentProjectSubject.value;
  if (currentProject && currentProject.id === updatedProject.id) {
    this.currentProjectSubject.next(updatedProject);
  }
}

private removeProjectFromState(projectId: string): void {
  const currentProjects = this.projectsSubject.value;
  const filteredProjects = currentProjects.filter(project => project.id !== projectId);
  this.projectsSubject.next(filteredProjects);
  
  // 如果當前專案被刪除，清除當前專案狀態
  const currentProject = this.currentProjectSubject.value;
  if (currentProject && currentProject.id === projectId) {
    this.currentProjectSubject.next(null);
  }
}
```

### 2. 快取管理

```typescript
private cacheProject(project: ProjectAggregate): void {
  // 使用 localStorage 快取專案資料
  const cacheKey = `project_${project.id}`;
  localStorage.setItem(cacheKey, JSON.stringify(project.toJSON()));
}

private getCachedProject(projectId: string): ProjectAggregate | null {
  const cacheKey = `project_${projectId}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      const projectData = JSON.parse(cachedData);
      return new ProjectAggregate(projectData);
    } catch (error) {
      console.error('快取資料解析失敗:', error);
      localStorage.removeItem(cacheKey);
    }
  }
  
  return null;
}
```

## 錯誤處理

### 1. 自定義錯誤類別

```typescript
export class ProjectServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'ProjectServiceError';
  }
}

export class ProjectCreationError extends ProjectServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'PROJECT_CREATION_FAILED', originalError);
  }
}

export class ProjectUpdateError extends ProjectServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'PROJECT_UPDATE_FAILED', originalError);
  }
}

export class ProjectNotFoundError extends ProjectServiceError {
  constructor(projectId: string) {
    super(`專案 ${projectId} 不存在`, 'PROJECT_NOT_FOUND');
  }
}

export class ProjectPermissionError extends ProjectServiceError {
  constructor(action: string) {
    super(`沒有權限執行 ${action} 操作`, 'PERMISSION_DENIED');
  }
}
```

### 2. 錯誤處理策略

```typescript
private handleError(error: any, context: string): Observable<never> {
  console.error(`ProjectService ${context} 錯誤:`, error);
  
  // 根據錯誤類型進行不同處理
  if (error.code === 'permission-denied') {
    throw new ProjectPermissionError(context);
  } else if (error.code === 'not-found') {
    throw new ProjectNotFoundError(error.projectId);
  } else if (error.code === 'network-error') {
    // 網路錯誤，可以重試
    throw new ProjectServiceError('網路連線錯誤，請稍後重試', 'NETWORK_ERROR', error);
  } else {
    throw new ProjectServiceError(`操作失敗: ${context}`, 'UNKNOWN_ERROR', error);
  }
}
```

## 事件發布

### 1. 事件發布機制

```typescript
private publishEvent(event: DomainEvent): void {
  // 發布到事件匯流排
  this.eventBus.publish(event);
  
  // 記錄事件日誌
  this.logger.logEvent(event);
}

private eventBus = {
  publish: (event: DomainEvent) => {
    // 實際的事件發布邏輯
    console.log('發布事件:', event);
  }
};

private logger = {
  logEvent: (event: DomainEvent) => {
    // 事件日誌記錄
    console.log('事件日誌:', {
      timestamp: new Date(),
      eventType: event.constructor.name,
      eventData: event
    });
  }
};
```

## 效能優化

### 1. 資料預載入

```typescript
/**
 * 預載入專案相關資料
 * @param projectId 專案 ID
 */
preloadProjectData(projectId: string): Observable<void> {
  return forkJoin({
    project: this.getProjectById(projectId),
    teamMembers: this.getProjectTeamMembers(projectId),
    milestones: this.getProjectMilestones(projectId)
  }).pipe(
    map(() => void 0),
    catchError(error => {
      console.error('預載入失敗:', error);
      return of(void 0);
    })
  );
}
```

### 2. 批次操作

```typescript
/**
 * 批次更新專案
 * @param updates 批次更新資料
 */
batchUpdateProjects(updates: BatchProjectUpdate[]): Observable<ProjectAggregate[]> {
  return this.projectRepository.batchUpdate(updates).pipe(
    map(projectsData => 
      projectsData.map(data => new ProjectAggregate(data))
    ),
    map(projects => {
      // 批次更新本地狀態
      projects.forEach(project => {
        this.updateProjectInState(project);
      });
      return projects;
    })
  );
}
```

## 測試策略

### 1. 單元測試

```typescript
describe('ProjectService', () => {
  let service: ProjectService;
  let mockRepository: jasmine.SpyObj<ProjectRepository>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const repositorySpy = jasmine.createSpyObj('ProjectRepository', [
      'create', 'update', 'findById', 'findByUserId'
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getCurrentUserId']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'notifyProjectCreated'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        { provide: ProjectRepository, useValue: repositorySpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    });

    service = TestBed.inject(ProjectService);
    mockRepository = TestBed.inject(ProjectRepository) as jasmine.SpyObj<ProjectRepository>;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  it('應該能夠建立新專案', (done) => {
    const projectData = {
      name: '測試專案',
      description: '測試描述',
      startDate: new Date(),
      endDate: new Date()
    };
    
    const mockProject = { id: '1', ...projectData };
    mockRepository.create.and.returnValue(of(mockProject));
    mockUserService.getCurrentUserId.and.returnValue('user1');

    service.createProject(projectData, 'user1').subscribe({
      next: (project) => {
        expect(project).toBeDefined();
        expect(project.name).toBe('測試專案');
        expect(mockRepository.create).toHaveBeenCalled();
        expect(mockNotificationService.notifyProjectCreated).toHaveBeenCalled();
        done();
      },
      error: done.fail
    });
  });
});
```

### 2. 整合測試

```typescript
describe('ProjectService Integration', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('應該能夠與後端 API 整合', () => {
    const projectData = { name: '整合測試專案' };
    
    service.createProject(projectData, 'user1').subscribe();

    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(projectData);
    
    req.flush({ id: '1', ...projectData });
  });
});
```

## 使用範例

### 1. 在組件中使用

```typescript
@Component({
  selector: 'app-project-list',
  template: `
    <div class="project-list">
      @for (project of projects$ | async; track project.id) {
        <div class="project-card">
          <h3>{{ project.name }}</h3>
          <p>{{ project.description }}</p>
          <button (click)="selectProject(project.id)">查看詳情</button>
        </div>
      }
    </div>
  `
})
export class ProjectListComponent {
  projects$ = this.projectService.projects$;

  constructor(private projectService: ProjectService) {}

  selectProject(projectId: string): void {
    this.projectService.getProjectById(projectId).subscribe();
  }
}
```

### 2. 在路由守衛中使用

```typescript
@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private projectService: ProjectService,
    private userService: UserService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const projectId = route.params['id'];
    
    return this.projectService.getProjectById(projectId).pipe(
      map(project => {
        const currentUser = this.userService.getCurrentUser();
        return project.hasAccess(currentUser.id);
      }),
      catchError(() => of(false))
    );
  }
}
```

## 最佳實踐

### 1. 服務設計原則
- **單一職責**: 專注於專案相關的業務邏輯
- **依賴注入**: 使用 Angular 的 DI 系統
- **響應式設計**: 使用 RxJS Observable 進行非同步操作
- **錯誤處理**: 提供完整的錯誤處理機制

### 2. 效能考量
- **狀態快取**: 適當使用本地狀態快取
- **批次操作**: 支援批次更新減少網路請求
- **預載入**: 預載入相關資料提升用戶體驗
- **記憶體管理**: 適當清理不需要的訂閱

### 3. 可維護性
- **型別安全**: 使用 TypeScript 提供型別安全
- **測試覆蓋**: 提供完整的單元測試和整合測試
- **文件完整**: 提供詳細的 API 文件和使用範例
- **錯誤日誌**: 完整的錯誤記錄和追蹤機制