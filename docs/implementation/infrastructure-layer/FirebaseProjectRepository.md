# Firebase Project Repository (Firebase 專案儲存庫)

## 儲存庫概述

FirebaseProjectRepository 是 DDD Infrastructure 層的專案資料存取實作，負責與 Firebase Firestore 進行專案資料的 CRUD 操作。本儲存庫實作了 ProjectRepository 介面，提供完整的專案資料管理功能，包括專案建立、更新、查詢、刪除等操作，以及專案相關的複雜查詢功能。

## 核心職責

### 1. 專案資料管理
- 專案資料的 CRUD 操作
- 專案狀態管理
- 專案權限控制
- 專案資料驗證與轉換

### 2. 專案查詢功能
- 複雜查詢條件支援
- 分頁查詢
- 全文搜尋
- 統計查詢

### 3. 專案關聯管理
- 團隊成員管理
- 專案里程碑管理
- 專案任務關聯
- 專案文件管理

## 儲存庫架構

```typescript
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  DocumentSnapshot,
  QuerySnapshot,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  collectionGroup
} from '@angular/fire/firestore';
import { Observable, from, of, throwError, BehaviorSubject, forkJoin } from 'rxjs';
import { map, catchError, switchMap, take, mergeMap } from 'rxjs/operators';
import { ProjectEntity } from '../../domain-layer/Entities/ProjectEntity';
import { ProjectRepository } from '../../domain-layer/Repositories/ProjectRepository';
import { ProjectNotFoundError, ProjectCreationError } from '../../domain-layer/Errors';

@Injectable({
  providedIn: 'root'
})
export class FirebaseProjectRepository implements ProjectRepository {
  private firestore = inject(Firestore);
  private readonly COLLECTION_NAME = 'projects';
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 分鐘快取
  
  // 快取管理
  private cache = new Map<string, { data: ProjectEntity; timestamp: number }>();
  private cacheSubject = new BehaviorSubject<Map<string, ProjectEntity>>(new Map());
  
  constructor() {
    this.initializeRepository();
  }
  
  private initializeRepository(): void {
    // 初始化快取清理定時器
    setInterval(() => {
      this.cleanExpiredCache();
    }, this.CACHE_TTL);
  }
}
```

## 核心方法

### 1. 專案建立

```typescript
/**
 * 建立新專案
 * @param projectData 專案資料
 * @returns Observable<ProjectEntity>
 */
create(projectData: CreateProjectCommand): Observable<ProjectEntity> {
  const projectRef = collection(this.firestore, this.COLLECTION_NAME);
  
  return from(addDoc(projectRef, {
    ...projectData,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'DRAFT',
    progress: 0,
    memberCount: 0,
    taskCount: 0
  })).pipe(
    map(docRef => {
      const project = new ProjectEntity({
        id: docRef.id,
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'DRAFT',
        progress: 0,
        memberCount: 0,
        taskCount: 0
      });
      
      // 更新快取
      this.updateCache(project.id, project);
      
      return project;
    }),
    catchError(error => {
      console.error('建立專案失敗:', error);
      throw new ProjectCreationError('無法建立專案', error);
    })
  );
}

/**
 * 批次建立專案
 * @param projectsData 專案資料陣列
 * @returns Observable<ProjectEntity[]>
 */
batchCreate(projectsData: CreateProjectCommand[]): Observable<ProjectEntity[]> {
  const batch = writeBatch(this.firestore);
  const projects: ProjectEntity[] = [];
  
  projectsData.forEach(projectData => {
    const projectRef = doc(collection(this.firestore, this.COLLECTION_NAME));
    const project = new ProjectEntity({
      id: projectRef.id,
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'DRAFT',
      progress: 0,
      memberCount: 0,
      taskCount: 0
    });
    
    batch.set(projectRef, project.toFirestoreData());
    projects.push(project);
  });
  
  return from(batch.commit()).pipe(
    map(() => {
      // 更新快取
      projects.forEach(project => this.updateCache(project.id, project));
      return projects;
    }),
    catchError(error => {
      console.error('批次建立專案失敗:', error);
      throw new ProjectCreationError('批次建立專案失敗', error);
    })
  );
}
```

### 2. 專案查詢

```typescript
/**
 * 根據 ID 查詢專案
 * @param id 專案 ID
 * @returns Observable<ProjectEntity | null>
 */
findById(id: string): Observable<ProjectEntity | null> {
  // 先檢查快取
  const cachedProject = this.getFromCache(id);
  if (cachedProject) {
    return of(cachedProject);
  }
  
  const projectRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(getDoc(projectRef)).pipe(
    map(docSnapshot => {
      if (!docSnapshot.exists()) {
        return null;
      }
      
      const projectData = docSnapshot.data();
      const project = new ProjectEntity({
        id: docSnapshot.id,
        ...projectData
      });
      
      // 更新快取
      this.updateCache(project.id, project);
      
      return project;
    }),
    catchError(error => {
      console.error('查詢專案失敗:', error);
      throw new ProjectNotFoundError(id);
    })
  );
}

/**
 * 根據擁有者查詢專案
 * @param ownerId 擁有者 ID
 * @param options 查詢選項
 * @returns Observable<ProjectEntity[]>
 */
findByOwner(ownerId: string, options?: ProjectQueryOptions): Observable<ProjectEntity[]> {
  const projectsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(projectsRef, where('ownerId', '==', ownerId));
  
  // 應用查詢條件
  if (options) {
    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    }
    
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const projects: ProjectEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const projectData = docSnapshot.data();
        const project = new ProjectEntity({
          id: docSnapshot.id,
          ...projectData
        });
        
        projects.push(project);
        // 更新快取
        this.updateCache(project.id, project);
      });
      
      return projects;
    }),
    catchError(error => {
      console.error('根據擁有者查詢專案失敗:', error);
      throw new Error('查詢專案失敗');
    })
  );
}

/**
 * 根據團隊成員查詢專案
 * @param userId 用戶 ID
 * @param options 查詢選項
 * @returns Observable<ProjectEntity[]>
 */
findByTeamMember(userId: string, options?: ProjectQueryOptions): Observable<ProjectEntity[]> {
  // 使用 collectionGroup 查詢所有子集合
  const teamMembersRef = collectionGroup(this.firestore, 'teamMembers');
  const q = query(teamMembersRef, where('userId', '==', userId));
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const projectIds: string[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const projectId = docSnapshot.ref.parent.parent?.id;
        if (projectId) {
          projectIds.push(projectId);
        }
      });
      
      return projectIds;
    }),
    switchMap(projectIds => {
      if (projectIds.length === 0) {
        return of([]);
      }
      
      // 批次查詢專案
      const projectQueries = projectIds.map(id => this.findById(id));
      return forkJoin(projectQueries);
    }),
    map(projects => {
      const validProjects = projects.filter(project => project !== null) as ProjectEntity[];
      
      // 應用額外篩選條件
      if (options?.status) {
        return validProjects.filter(project => project.status === options.status);
      }
      
      return validProjects;
    }),
    catchError(error => {
      console.error('根據團隊成員查詢專案失敗:', error);
      throw new Error('查詢專案失敗');
    })
  );
}

/**
 * 搜尋專案
 * @param searchCriteria 搜尋條件
 * @returns Observable<ProjectEntity[]>
 */
search(searchCriteria: ProjectSearchCriteria): Observable<ProjectEntity[]> {
  const projectsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(projectsRef);
  
  // 應用搜尋條件
  if (searchCriteria.name) {
    q = query(q, where('name', '>=', searchCriteria.name));
    q = query(q, where('name', '<=', searchCriteria.name + '\uf8ff'));
  }
  
  if (searchCriteria.description) {
    q = query(q, where('description', '>=', searchCriteria.description));
    q = query(q, where('description', '<=', searchCriteria.description + '\uf8ff'));
  }
  
  if (searchCriteria.status) {
    q = query(q, where('status', '==', searchCriteria.status));
  }
  
  if (searchCriteria.category) {
    q = query(q, where('category', '==', searchCriteria.category));
  }
  
  if (searchCriteria.startDate) {
    q = query(q, where('startDate', '>=', searchCriteria.startDate));
  }
  
  if (searchCriteria.endDate) {
    q = query(q, where('endDate', '<=', searchCriteria.endDate));
  }
  
  if (searchCriteria.limit) {
    q = query(q, limit(searchCriteria.limit));
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const projects: ProjectEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const projectData = docSnapshot.data();
        const project = new ProjectEntity({
          id: docSnapshot.id,
          ...projectData
        });
        
        projects.push(project);
        // 更新快取
        this.updateCache(project.id, project);
      });
      
      return projects;
    }),
    catchError(error => {
      console.error('搜尋專案失敗:', error);
      throw new Error('搜尋專案失敗');
    })
  );
}
```

### 3. 專案更新

```typescript
/**
 * 更新專案資料
 * @param id 專案 ID
 * @param updates 更新資料
 * @returns Observable<ProjectEntity>
 */
update(id: string, updates: UpdateProjectCommand): Observable<ProjectEntity> {
  const projectRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(updateDoc(projectRef, {
    ...updates,
    updatedAt: new Date()
  })).pipe(
    switchMap(() => this.findById(id)),
    map(project => {
      if (!project) {
        throw new ProjectNotFoundError(id);
      }
      
      // 更新快取
      this.updateCache(project.id, project);
      
      return project;
    }),
    catchError(error => {
      console.error('更新專案失敗:', error);
      throw new Error('更新專案失敗');
    })
  );
}

/**
 * 更新專案狀態
 * @param id 專案 ID
 * @param status 新狀態
 * @param reason 變更原因
 * @returns Observable<ProjectEntity>
 */
updateStatus(id: string, status: ProjectStatus, reason?: string): Observable<ProjectEntity> {
  const projectRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(updateDoc(projectRef, {
    status,
    statusChangedAt: new Date(),
    statusChangeReason: reason,
    updatedAt: new Date()
  })).pipe(
    switchMap(() => this.findById(id)),
    map(project => {
      if (!project) {
        throw new ProjectNotFoundError(id);
      }
      
      // 更新快取
      this.updateCache(project.id, project);
      
      return project;
    })
  );
}

/**
 * 更新專案進度
 * @param id 專案 ID
 * @param progress 進度百分比
 * @returns Observable<ProjectEntity>
 */
updateProgress(id: string, progress: number): Observable<ProjectEntity> {
  const projectRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(updateDoc(projectRef, {
    progress: Math.max(0, Math.min(100, progress)),
    progressUpdatedAt: new Date(),
    updatedAt: new Date()
  })).pipe(
    switchMap(() => this.findById(id)),
    map(project => {
      if (!project) {
        throw new ProjectNotFoundError(id);
      }
      
      // 更新快取
      this.updateCache(project.id, project);
      
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
 * @param memberData 成員資料
 * @returns Observable<TeamMember>
 */
addTeamMember(projectId: string, memberData: AddTeamMemberCommand): Observable<TeamMember> {
  const teamMembersRef = collection(this.firestore, this.COLLECTION_NAME, projectId, 'teamMembers');
  
  return from(addDoc(teamMembersRef, {
    ...memberData,
    joinedAt: new Date(),
    status: 'ACTIVE'
  })).pipe(
    map(docRef => {
      const member = new TeamMember({
        id: docRef.id,
        projectId,
        ...memberData,
        joinedAt: new Date(),
        status: 'ACTIVE'
      });
      
      // 更新專案成員數量
      this.updateProjectMemberCount(projectId).subscribe();
      
      return member;
    }),
    catchError(error => {
      console.error('新增團隊成員失敗:', error);
      throw new Error('新增團隊成員失敗');
    })
  );
}

/**
 * 移除團隊成員
 * @param projectId 專案 ID
 * @param userId 用戶 ID
 * @returns Observable<void>
 */
removeTeamMember(projectId: string, userId: string): Observable<void> {
  const teamMembersRef = collection(this.firestore, this.COLLECTION_NAME, projectId, 'teamMembers');
  const q = query(teamMembersRef, where('userId', '==', userId), limit(1));
  
  return from(getDocs(q)).pipe(
    switchMap(querySnapshot => {
      if (querySnapshot.empty) {
        throw new Error('找不到指定的團隊成員');
      }
      
      const memberDoc = querySnapshot.docs[0];
      return from(deleteDoc(memberDoc.ref));
    }),
    switchMap(() => {
      // 更新專案成員數量
      return this.updateProjectMemberCount(projectId);
    }),
    catchError(error => {
      console.error('移除團隊成員失敗:', error);
      throw new Error('移除團隊成員失敗');
    })
  );
}

/**
 * 更新專案成員數量
 * @param projectId 專案 ID
 * @returns Observable<void>
 */
private updateProjectMemberCount(projectId: string): Observable<void> {
  const teamMembersRef = collection(this.firestore, this.COLLECTION_NAME, projectId, 'teamMembers');
  const q = query(teamMembersRef, where('status', '==', 'ACTIVE'));
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const memberCount = querySnapshot.size;
      const projectRef = doc(this.firestore, this.COLLECTION_NAME, projectId);
      
      return updateDoc(projectRef, {
        memberCount,
        updatedAt: new Date()
      });
    }),
    switchMap(updatePromise => from(updatePromise)),
    map(() => void 0)
  );
}
```

### 5. 專案統計

```typescript
/**
 * 取得專案統計資料
 * @param projectId 專案 ID
 * @returns Observable<ProjectStatistics>
 */
getProjectStatistics(projectId: string): Observable<ProjectStatistics> {
  return forkJoin({
    project: this.findById(projectId),
    teamMembers: this.getTeamMembers(projectId),
    tasks: this.getProjectTasks(projectId),
    milestones: this.getProjectMilestones(projectId)
  }).pipe(
    map(({ project, teamMembers, tasks, milestones }) => {
      if (!project) {
        throw new ProjectNotFoundError(projectId);
      }
      
      return new ProjectStatistics({
        projectId,
        totalMembers: teamMembers.length,
        activeMembers: teamMembers.filter(m => m.status === 'ACTIVE').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
        totalMilestones: milestones.length,
        completedMilestones: milestones.filter(m => m.status === 'COMPLETED').length,
        progress: project.progress,
        calculatedAt: new Date()
      });
    })
  );
}

/**
 * 取得專案任務
 * @param projectId 專案 ID
 * @returns Observable<Task[]>
 */
private getProjectTasks(projectId: string): Observable<Task[]> {
  const tasksRef = collection(this.firestore, this.COLLECTION_NAME, projectId, 'tasks');
  
  return from(getDocs(tasksRef)).pipe(
    map(querySnapshot => {
      const tasks: Task[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const taskData = docSnapshot.data();
        tasks.push(new Task({
          id: docSnapshot.id,
          projectId,
          ...taskData
        }));
      });
      
      return tasks;
    })
  );
}

/**
 * 取得專案里程碑
 * @param projectId 專案 ID
 * @returns Observable<Milestone[]>
 */
private getProjectMilestones(projectId: string): Observable<Milestone[]> {
  const milestonesRef = collection(this.firestore, this.COLLECTION_NAME, projectId, 'milestones');
  
  return from(getDocs(milestonesRef)).pipe(
    map(querySnapshot => {
      const milestones: Milestone[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const milestoneData = docSnapshot.data();
        milestones.push(new Milestone({
          id: docSnapshot.id,
          projectId,
          ...milestoneData
        }));
      });
      
      return milestones;
    })
  );
}
```

### 6. 即時監聽

```typescript
/**
 * 監聽專案變更
 * @param id 專案 ID
 * @returns Observable<ProjectEntity>
 */
watchById(id: string): Observable<ProjectEntity> {
  const projectRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return new Observable(observer => {
    const unsubscribe = onSnapshot(projectRef, {
      next: (docSnapshot) => {
        if (docSnapshot.exists()) {
          const projectData = docSnapshot.data();
          const project = new ProjectEntity({
            id: docSnapshot.id,
            ...projectData
          });
          
          // 更新快取
          this.updateCache(project.id, project);
          
          observer.next(project);
        } else {
          observer.error(new ProjectNotFoundError(id));
        }
      },
      error: (error) => {
        console.error('監聽專案變更失敗:', error);
        observer.error(error);
      }
    });
    
    return () => unsubscribe();
  });
}

/**
 * 監聽用戶專案變更
 * @param userId 用戶 ID
 * @returns Observable<ProjectEntity[]>
 */
watchByUser(userId: string): Observable<ProjectEntity[]> {
  const projectsRef = collection(this.firestore, this.COLLECTION_NAME);
  const q = query(projectsRef, where('ownerId', '==', userId));
  
  return new Observable(observer => {
    const unsubscribe = onSnapshot(q, {
      next: (querySnapshot) => {
        const projects: ProjectEntity[] = [];
        
        querySnapshot.forEach(docSnapshot => {
          const projectData = docSnapshot.data();
          const project = new ProjectEntity({
            id: docSnapshot.id,
            ...projectData
          });
          
          projects.push(project);
          // 更新快取
          this.updateCache(project.id, project);
        });
        
        observer.next(projects);
      },
      error: (error) => {
        console.error('監聽用戶專案變更失敗:', error);
        observer.error(error);
      }
    });
    
    return () => unsubscribe();
  });
}
```

## 快取管理

### 1. 快取操作

```typescript
private updateCache(id: string, project: ProjectEntity): void {
  this.cache.set(id, {
    data: project,
    timestamp: Date.now()
  });
  
  // 更新快取主題
  const currentCache = this.cacheSubject.value;
  currentCache.set(id, project);
  this.cacheSubject.next(currentCache);
}

private getFromCache(id: string): ProjectEntity | null {
  const cached = this.cache.get(id);
  
  if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
    return cached.data;
  }
  
  // 快取過期，移除
  if (cached) {
    this.removeFromCache(id);
  }
  
  return null;
}

private removeFromCache(id: string): void {
  this.cache.delete(id);
  
  // 更新快取主題
  const currentCache = this.cacheSubject.value;
  currentCache.delete(id);
  this.cacheSubject.next(currentCache);
}

private cleanExpiredCache(): void {
  const now = Date.now();
  
  for (const [id, cached] of this.cache.entries()) {
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.removeFromCache(id);
    }
  }
}
```

## 效能優化

### 1. 分頁查詢

```typescript
/**
 * 分頁查詢專案
 * @param pageSize 頁面大小
 * @param lastDoc 最後一個文件
 * @param filters 篩選條件
 * @returns Observable<PaginatedProjects>
 */
findAllPaginated(
  pageSize: number, 
  lastDoc?: DocumentSnapshot, 
  filters?: ProjectFilters
): Observable<PaginatedProjects> {
  const projectsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(projectsRef, orderBy('createdAt', 'desc'), limit(pageSize));
  
  // 應用篩選條件
  if (filters) {
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.ownerId) {
      q = query(q, where('ownerId', '==', filters.ownerId));
    }
  }
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const projects: ProjectEntity[] = [];
      let lastDocument: DocumentSnapshot | undefined;
      
      querySnapshot.forEach(docSnapshot => {
        const projectData = docSnapshot.data();
        const project = new ProjectEntity({
          id: docSnapshot.id,
          ...projectData
        });
        
        projects.push(project);
        lastDocument = docSnapshot;
      });
      
      return {
        projects,
        lastDoc: lastDocument,
        hasMore: querySnapshot.docs.length === pageSize
      };
    })
  );
}
```

### 2. 批次操作

```typescript
/**
 * 批次操作用戶
 * @param operations 操作陣列
 * @returns Observable<void>
 */
batchOperations(operations: ProjectBatchOperation[]): Observable<void> {
  const batch = writeBatch(this.firestore);
  
  operations.forEach(operation => {
    const projectRef = doc(this.firestore, this.COLLECTION_NAME, operation.id);
    
    switch (operation.type) {
      case 'create':
        batch.set(projectRef, operation.data);
        break;
      case 'update':
        batch.update(projectRef, operation.data);
        break;
      case 'delete':
        batch.delete(projectRef);
        break;
    }
  });
  
  return from(batch.commit()).pipe(
    map(() => {
      // 清理相關快取
      operations.forEach(operation => {
        if (operation.type === 'delete') {
          this.removeFromCache(operation.id);
        }
      });
    }),
    catchError(error => {
      console.error('批次操作失敗:', error);
      throw new Error('批次操作失敗');
    })
  );
}
```

## 測試策略

### 1. 單元測試

```typescript
describe('FirebaseProjectRepository', () => {
  let service: FirebaseProjectRepository;
  let mockFirestore: jasmine.SpyObj<Firestore>;

  beforeEach(() => {
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection', 'doc']);
    
    TestBed.configureTestingModule({
      providers: [
        FirebaseProjectRepository,
        { provide: Firestore, useValue: firestoreSpy }
      ]
    });

    service = TestBed.inject(FirebaseProjectRepository);
    mockFirestore = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
  });

  it('應該能夠建立專案', (done) => {
    const projectData = {
      name: '測試專案',
      description: '測試描述',
      ownerId: 'user1',
      startDate: new Date(),
      endDate: new Date()
    };
    
    // Mock Firebase 回應
    const mockDocRef = { id: 'project1' };
    spyOn(service, 'create').and.returnValue(of(new ProjectEntity({ id: 'project1', ...projectData })));

    service.create(projectData).subscribe({
      next: (project) => {
        expect(project).toBeDefined();
        expect(project.name).toBe('測試專案');
        expect(project.ownerId).toBe('user1');
        done();
      },
      error: done.fail
    });
  });
});
```

## 使用範例

### 1. 在服務中使用

```typescript
@Injectable()
export class ProjectService {
  constructor(private projectRepository: FirebaseProjectRepository) {}
  
  createProject(projectData: CreateProjectCommand): Observable<ProjectEntity> {
    return this.projectRepository.create(projectData);
  }
  
  getProjectById(id: string): Observable<ProjectEntity | null> {
    return this.projectRepository.findById(id);
  }
  
  getUserProjects(userId: string): Observable<ProjectEntity[]> {
    return this.projectRepository.findByOwner(userId);
  }
}
```

### 2. 在組件中使用

```typescript
@Component({
  selector: 'app-project-list',
  template: `
    <div class="project-list">
      @for (project of projects$ | async; track project.id) {
        <div class="project-card">
          <h3>{{ project.name }}</h3>
          <p>{{ project.description }}</p>
          <div class="project-info">
            <span>進度: {{ project.progress }}%</span>
            <span>成員: {{ project.memberCount }}</span>
          </div>
          <button (click)="viewProject(project.id)">查看詳情</button>
        </div>
      }
    </div>
  `
})
export class ProjectListComponent {
  projects$ = this.projectRepository.findByOwner('user1', { limit: 10 });

  constructor(private projectRepository: FirebaseProjectRepository) {}

  viewProject(projectId: string): void {
    this.projectRepository.findById(projectId).subscribe(project => {
      if (project) {
        // 導航到專案詳情頁
      }
    });
  }
}
```

## 最佳實踐

### 1. 資料一致性
- 使用批次操作確保資料一致性
- 實作適當的錯誤處理和重試機制
- 使用快取減少不必要的網路請求

### 2. 效能優化
- 使用適當的 Firestore 索引
- 實作分頁查詢避免一次載入過多資料
- 使用快取機制提升查詢效能

### 3. 安全性
- 實作適當的 Firestore 安全規則
- 驗證輸入資料防止注入攻擊
- 使用適當的權限控制

### 4. 可維護性
- 提供完整的型別定義
- 實作詳細的錯誤處理
- 提供完整的測試覆蓋
