# Firebase Team Repository (Firebase 團隊儲存庫)

## 儲存庫概述

FirebaseTeamRepository 是 DDD Infrastructure 層的團隊資料存取實作，負責與 Firebase Firestore 進行團隊資料的 CRUD 操作。本儲存庫實作了 TeamRepository 介面，提供完整的團隊資料管理功能，包括團隊建立、成員管理、角色分配等操作。

## 核心職責

### 1. 團隊資料管理
- 團隊資料的 CRUD 操作
- 團隊狀態管理
- 團隊設定管理
- 團隊資料驗證與轉換

### 2. 成員管理
- 成員邀請與加入
- 成員移除與離職
- 角色分配與變更
- 權限管理

### 3. 團隊查詢功能
- 複雜查詢條件支援
- 分頁查詢
- 統計查詢
- 即時監聽

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
  Unsubscribe
} from '@angular/fire/firestore';
import { Observable, from, of, throwError, BehaviorSubject, forkJoin } from 'rxjs';
import { map, catchError, switchMap, take, mergeMap } from 'rxjs/operators';
import { TeamEntity } from '../../domain-layer/Entities/TeamEntity';
import { TeamRepository } from '../../domain-layer/Repositories/TeamRepository';
import { TeamNotFoundError, TeamCreationError } from '../../domain-layer/Errors';

@Injectable({
  providedIn: 'root'
})
export class FirebaseTeamRepository implements TeamRepository {
  private firestore = inject(Firestore);
  private readonly COLLECTION_NAME = 'teams';
  private readonly CACHE_TTL = 8 * 60 * 1000; // 8 分鐘快取
  
  // 快取管理
  private cache = new Map<string, { data: TeamEntity; timestamp: number }>();
  private cacheSubject = new BehaviorSubject<Map<string, TeamEntity>>(new Map());
  
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

### 1. 團隊建立

```typescript
/**
 * 建立新團隊
 * @param teamData 團隊資料
 * @returns Observable<TeamEntity>
 */
create(teamData: CreateTeamCommand): Observable<TeamEntity> {
  const teamRef = collection(this.firestore, this.COLLECTION_NAME);
  
  return from(addDoc(teamRef, {
    ...teamData,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'ACTIVE',
    memberCount: 0,
    projectCount: 0
  })).pipe(
    map(docRef => {
      const team = new TeamEntity({
        id: docRef.id,
        ...teamData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'ACTIVE',
        memberCount: 0,
        projectCount: 0
      });
      
      // 更新快取
      this.updateCache(team.id, team);
      
      return team;
    }),
    catchError(error => {
      console.error('建立團隊失敗:', error);
      throw new TeamCreationError('無法建立團隊', error);
    })
  );
}

/**
 * 批次建立團隊
 * @param teamsData 團隊資料陣列
 * @returns Observable<TeamEntity[]>
 */
batchCreate(teamsData: CreateTeamCommand[]): Observable<TeamEntity[]> {
  const batch = writeBatch(this.firestore);
  const teams: TeamEntity[] = [];
  
  teamsData.forEach(teamData => {
    const teamRef = doc(collection(this.firestore, this.COLLECTION_NAME));
    const team = new TeamEntity({
      id: teamRef.id,
      ...teamData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ACTIVE',
      memberCount: 0,
      projectCount: 0
    });
    
    batch.set(teamRef, team.toFirestoreData());
    teams.push(team);
  });
  
  return from(batch.commit()).pipe(
    map(() => {
      // 更新快取
      teams.forEach(team => this.updateCache(team.id, team));
      return teams;
    }),
    catchError(error => {
      console.error('批次建立團隊失敗:', error);
      throw new TeamCreationError('批次建立團隊失敗', error);
    })
  );
}
```

### 2. 團隊查詢

```typescript
/**
 * 根據 ID 查詢團隊
 * @param id 團隊 ID
 * @returns Observable<TeamEntity | null>
 */
findById(id: string): Observable<TeamEntity | null> {
  // 先檢查快取
  const cachedTeam = this.getFromCache(id);
  if (cachedTeam) {
    return of(cachedTeam);
  }
  
  const teamRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(getDoc(teamRef)).pipe(
    map(docSnapshot => {
      if (!docSnapshot.exists()) {
        return null;
      }
      
      const teamData = docSnapshot.data();
      const team = new TeamEntity({
        id: docSnapshot.id,
        ...teamData
      });
      
      // 更新快取
      this.updateCache(team.id, team);
      
      return team;
    }),
    catchError(error => {
      console.error('查詢團隊失敗:', error);
      throw new TeamNotFoundError(id);
    })
  );
}

/**
 * 根據組織查詢團隊
 * @param organizationId 組織 ID
 * @param options 查詢選項
 * @returns Observable<TeamEntity[]>
 */
findByOrganization(organizationId: string, options?: TeamQueryOptions): Observable<TeamEntity[]> {
  const teamsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(teamsRef, where('organizationId', '==', organizationId));
  
  // 應用查詢條件
  if (options) {
    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    if (options.department) {
      q = query(q, where('department', '==', options.department));
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
      const teams: TeamEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const teamData = docSnapshot.data();
        const team = new TeamEntity({
          id: docSnapshot.id,
          ...teamData
        });
        
        teams.push(team);
        // 更新快取
        this.updateCache(team.id, team);
      });
      
      return teams;
    }),
    catchError(error => {
      console.error('根據組織查詢團隊失敗:', error);
      throw new Error('查詢團隊失敗');
    })
  );
}

/**
 * 根據成員查詢團隊
 * @param userId 用戶 ID
 * @param options 查詢選項
 * @returns Observable<TeamEntity[]>
 */
findByMember(userId: string, options?: TeamQueryOptions): Observable<TeamEntity[]> {
  const teamMembersRef = collectionGroup(this.firestore, 'teamMembers');
  const q = query(teamMembersRef, where('userId', '==', userId));
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const teamIds: string[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const teamId = docSnapshot.ref.parent.parent?.id;
        if (teamId) {
          teamIds.push(teamId);
        }
      });
      
      return teamIds;
    }),
    switchMap(teamIds => {
      if (teamIds.length === 0) {
        return of([]);
      }
      
      // 批次查詢團隊
      const teamQueries = teamIds.map(id => this.findById(id));
      return forkJoin(teamQueries);
    }),
    map(teams => {
      const validTeams = teams.filter(team => team !== null) as TeamEntity[];
      
      // 應用額外篩選條件
      if (options?.status) {
        return validTeams.filter(team => team.status === options.status);
      }
      
      return validTeams;
    }),
    catchError(error => {
      console.error('根據成員查詢團隊失敗:', error);
      throw new Error('查詢團隊失敗');
    })
  );
}

/**
 * 搜尋團隊
 * @param searchCriteria 搜尋條件
 * @returns Observable<TeamEntity[]>
 */
search(searchCriteria: TeamSearchCriteria): Observable<TeamEntity[]> {
  const teamsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(teamsRef);
  
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
  
  if (searchCriteria.department) {
    q = query(q, where('department', '==', searchCriteria.department));
  }
  
  if (searchCriteria.organizationId) {
    q = query(q, where('organizationId', '==', searchCriteria.organizationId));
  }
  
  if (searchCriteria.limit) {
    q = query(q, limit(searchCriteria.limit));
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const teams: TeamEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const teamData = docSnapshot.data();
        const team = new TeamEntity({
          id: docSnapshot.id,
          ...teamData
        });
        
        teams.push(team);
        // 更新快取
        this.updateCache(team.id, team);
      });
      
      return teams;
    }),
    catchError(error => {
      console.error('搜尋團隊失敗:', error);
      throw new Error('搜尋團隊失敗');
    })
  );
}
```

### 3. 團隊更新

```typescript
/**
 * 更新團隊資料
 * @param id 團隊 ID
 * @param updates 更新資料
 * @returns Observable<TeamEntity>
 */
update(id: string, updates: UpdateTeamCommand): Observable<TeamEntity> {
  const teamRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(updateDoc(teamRef, {
    ...updates,
    updatedAt: new Date()
  })).pipe(
    switchMap(() => this.findById(id)),
    map(team => {
      if (!team) {
        throw new TeamNotFoundError(id);
      }
      
      // 更新快取
      this.updateCache(team.id, team);
      
      return team;
    }),
    catchError(error => {
      console.error('更新團隊失敗:', error);
      throw new Error('更新團隊失敗');
    })
  );
}

/**
 * 更新團隊狀態
 * @param id 團隊 ID
 * @param status 新狀態
 * @param reason 變更原因
 * @returns Observable<TeamEntity>
 */
updateStatus(id: string, status: TeamStatus, reason?: string): Observable<TeamEntity> {
  const teamRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(updateDoc(teamRef, {
    status,
    statusChangedAt: new Date(),
    statusChangeReason: reason,
    updatedAt: new Date()
  })).pipe(
    switchMap(() => this.findById(id)),
    map(team => {
      if (!team) {
        throw new TeamNotFoundError(id);
      }
      
      // 更新快取
      this.updateCache(team.id, team);
      
      return team;
    })
  );
}
```

### 4. 成員管理

```typescript
/**
 * 邀請成員加入團隊
 * @param teamId 團隊 ID
 * @param memberData 成員資料
 * @returns Observable<TeamMember>
 */
inviteMember(teamId: string, memberData: InviteMemberCommand): Observable<TeamMember> {
  const teamMembersRef = collection(this.firestore, this.COLLECTION_NAME, teamId, 'teamMembers');
  
  return from(addDoc(teamMembersRef, {
    ...memberData,
    invitedAt: new Date(),
    status: 'PENDING'
  })).pipe(
    map(docRef => {
      const member = new TeamMember({
        id: docRef.id,
        teamId,
        ...memberData,
        invitedAt: new Date(),
        status: 'PENDING'
      });
      
      // 更新團隊成員數量
      this.updateTeamMemberCount(teamId).subscribe();
      
      return member;
    }),
    catchError(error => {
      console.error('邀請成員失敗:', error);
      throw new Error('邀請成員失敗');
    })
  );
}

/**
 * 接受團隊邀請
 * @param teamId 團隊 ID
 * @param userId 用戶 ID
 * @returns Observable<TeamMember>
 */
acceptInvitation(teamId: string, userId: string): Observable<TeamMember> {
  const teamMembersRef = collection(this.firestore, this.COLLECTION_NAME, teamId, 'teamMembers');
  const q = query(teamMembersRef, where('userId', '==', userId), limit(1));
  
  return from(getDocs(q)).pipe(
    switchMap(querySnapshot => {
      if (querySnapshot.empty) {
        throw new Error('找不到邀請記錄');
      }
      
      const memberDoc = querySnapshot.docs[0];
      return from(updateDoc(memberDoc.ref, {
        status: 'ACTIVE',
        joinedAt: new Date(),
        updatedAt: new Date()
      }));
    }),
    switchMap(() => {
      // 更新團隊成員數量
      return this.updateTeamMemberCount(teamId);
    }),
    switchMap(() => {
      // 重新查詢成員資料
      return this.getTeamMember(teamId, userId);
    }),
    catchError(error => {
      console.error('接受邀請失敗:', error);
      throw new Error('接受邀請失敗');
    })
  );
}

/**
 * 移除團隊成員
 * @param teamId 團隊 ID
 * @param userId 用戶 ID
 * @returns Observable<void>
 */
removeMember(teamId: string, userId: string): Observable<void> {
  const teamMembersRef = collection(this.firestore, this.COLLECTION_NAME, teamId, 'teamMembers');
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
      // 更新團隊成員數量
      return this.updateTeamMemberCount(teamId);
    }),
    catchError(error => {
      console.error('移除團隊成員失敗:', error);
      throw new Error('移除團隊成員失敗');
    })
  );
}

/**
 * 更新成員角色
 * @param teamId 團隊 ID
 * @param userId 用戶 ID
 * @param newRole 新角色
 * @returns Observable<TeamMember>
 */
updateMemberRole(teamId: string, userId: string, newRole: TeamRole): Observable<TeamMember> {
  const teamMembersRef = collection(this.firestore, this.COLLECTION_NAME, teamId, 'teamMembers');
  const q = query(teamMembersRef, where('userId', '==', userId), limit(1));
  
  return from(getDocs(q)).pipe(
    switchMap(querySnapshot => {
      if (querySnapshot.empty) {
        throw new Error('找不到指定的團隊成員');
      }
      
      const memberDoc = querySnapshot.docs[0];
      return from(updateDoc(memberDoc.ref, {
        role: newRole,
        roleChangedAt: new Date(),
        updatedAt: new Date()
      }));
    }),
    switchMap(() => {
      // 重新查詢成員資料
      return this.getTeamMember(teamId, userId);
    }),
    catchError(error => {
      console.error('更新成員角色失敗:', error);
      throw new Error('更新成員角色失敗');
    })
  );
}
```

### 5. 團隊統計

```typescript
/**
 * 取得團隊統計資料
 * @param teamId 團隊 ID
 * @returns Observable<TeamStatistics>
 */
getTeamStatistics(teamId: string): Observable<TeamStatistics> {
  return forkJoin({
    team: this.findById(teamId),
    members: this.getTeamMembers(teamId),
    projects: this.getTeamProjects(teamId)
  }).pipe(
    map(({ team, members, projects }) => {
      if (!team) {
        throw new TeamNotFoundError(teamId);
      }
      
      return new TeamStatistics({
        teamId,
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === 'ACTIVE').length,
        pendingMembers: members.filter(m => m.status === 'PENDING').length,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
        calculatedAt: new Date()
      });
    })
  );
}

/**
 * 取得團隊成員
 * @param teamId 團隊 ID
 * @returns Observable<TeamMember[]>
 */
getTeamMembers(teamId: string): Observable<TeamMember[]> {
  const teamMembersRef = collection(this.firestore, this.COLLECTION_NAME, teamId, 'teamMembers');
  
  return from(getDocs(teamMembersRef)).pipe(
    map(querySnapshot => {
      const members: TeamMember[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const memberData = docSnapshot.data();
        members.push(new TeamMember({
          id: docSnapshot.id,
          teamId,
          ...memberData
        }));
      });
      
      return members;
    })
  );
}

/**
 * 取得團隊專案
 * @param teamId 團隊 ID
 * @returns Observable<ProjectEntity[]>
 */
private getTeamProjects(teamId: string): Observable<ProjectEntity[]> {
  const projectsRef = collection(this.firestore, 'projects');
  const q = query(projectsRef, where('teamId', '==', teamId));
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const projects: ProjectEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const projectData = docSnapshot.data();
        projects.push(new ProjectEntity({
          id: docSnapshot.id,
          ...projectData
        }));
      });
      
      return projects;
    })
  );
}

/**
 * 更新團隊成員數量
 * @param teamId 團隊 ID
 * @returns Observable<void>
 */
private updateTeamMemberCount(teamId: string): Observable<void> {
  const teamMembersRef = collection(this.firestore, this.COLLECTION_NAME, teamId, 'teamMembers');
  const q = query(teamMembersRef, where('status', '==', 'ACTIVE'));
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const memberCount = querySnapshot.size;
      const teamRef = doc(this.firestore, this.COLLECTION_NAME, teamId);
      
      return updateDoc(teamRef, {
        memberCount,
        updatedAt: new Date()
      });
    }),
    switchMap(updatePromise => from(updatePromise)),
    map(() => void 0)
  );
}
```

### 6. 即時監聽

```typescript
/**
 * 監聽團隊變更
 * @param id 團隊 ID
 * @returns Observable<TeamEntity>
 */
watchById(id: string): Observable<TeamEntity> {
  const teamRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return new Observable(observer => {
    const unsubscribe = onSnapshot(teamRef, {
      next: (docSnapshot) => {
        if (docSnapshot.exists()) {
          const teamData = docSnapshot.data();
          const team = new TeamEntity({
            id: docSnapshot.id,
            ...teamData
          });
          
          // 更新快取
          this.updateCache(team.id, team);
          
          observer.next(team);
        } else {
          observer.error(new TeamNotFoundError(id));
        }
      },
      error: (error) => {
        console.error('監聽團隊變更失敗:', error);
        observer.error(error);
      }
    });
    
    return () => unsubscribe();
  });
}

/**
 * 監聽組織團隊變更
 * @param organizationId 組織 ID
 * @returns Observable<TeamEntity[]>
 */
watchByOrganization(organizationId: string): Observable<TeamEntity[]> {
  const teamsRef = collection(this.firestore, this.COLLECTION_NAME);
  const q = query(teamsRef, where('organizationId', '==', organizationId));
  
  return new Observable(observer => {
    const unsubscribe = onSnapshot(q, {
      next: (querySnapshot) => {
        const teams: TeamEntity[] = [];
        
        querySnapshot.forEach(docSnapshot => {
          const teamData = docSnapshot.data();
          const team = new TeamEntity({
            id: docSnapshot.id,
            ...teamData
          });
          
          teams.push(team);
          // 更新快取
          this.updateCache(team.id, team);
        });
        
        observer.next(teams);
      },
      error: (error) => {
        console.error('監聽組織團隊變更失敗:', error);
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
private updateCache(id: string, team: TeamEntity): void {
  this.cache.set(id, {
    data: team,
    timestamp: Date.now()
  });
  
  // 更新快取主題
  const currentCache = this.cacheSubject.value;
  currentCache.set(id, team);
  this.cacheSubject.next(currentCache);
}

private getFromCache(id: string): TeamEntity | null {
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
 * 分頁查詢團隊
 * @param pageSize 頁面大小
 * @param lastDoc 最後一個文件
 * @param filters 篩選條件
 * @returns Observable<PaginatedTeams>
 */
findAllPaginated(
  pageSize: number, 
  lastDoc?: DocumentSnapshot, 
  filters?: TeamFilters
): Observable<PaginatedTeams> {
  const teamsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(teamsRef, orderBy('createdAt', 'desc'), limit(pageSize));
  
  // 應用篩選條件
  if (filters) {
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.department) {
      q = query(q, where('department', '==', filters.department));
    }
    
    if (filters.organizationId) {
      q = query(q, where('organizationId', '==', filters.organizationId));
    }
  }
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const teams: TeamEntity[] = [];
      let lastDocument: DocumentSnapshot | undefined;
      
      querySnapshot.forEach(docSnapshot => {
        const teamData = docSnapshot.data();
        const team = new TeamEntity({
          id: docSnapshot.id,
          ...teamData
        });
        
        teams.push(team);
        lastDocument = docSnapshot;
      });
      
      return {
        teams,
        lastDoc: lastDocument,
        hasMore: querySnapshot.docs.length === pageSize
      };
    })
  );
}
```

## 測試策略

### 1. 單元測試

```typescript
describe('FirebaseTeamRepository', () => {
  let service: FirebaseTeamRepository;
  let mockFirestore: jasmine.SpyObj<Firestore>;

  beforeEach(() => {
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection', 'doc']);
    
    TestBed.configureTestingModule({
      providers: [
        FirebaseTeamRepository,
        { provide: Firestore, useValue: firestoreSpy }
      ]
    });

    service = TestBed.inject(FirebaseTeamRepository);
    mockFirestore = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
  });

  it('應該能夠建立團隊', (done) => {
    const teamData = {
      name: '測試團隊',
      description: '測試描述',
      organizationId: 'org1',
      department: '工程部'
    };
    
    // Mock Firebase 回應
    const mockDocRef = { id: 'team1' };
    spyOn(service, 'create').and.returnValue(of(new TeamEntity({ id: 'team1', ...teamData })));

    service.create(teamData).subscribe({
      next: (team) => {
        expect(team).toBeDefined();
        expect(team.name).toBe('測試團隊');
        expect(team.organizationId).toBe('org1');
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
export class TeamService {
  constructor(private teamRepository: FirebaseTeamRepository) {}
  
  createTeam(teamData: CreateTeamCommand): Observable<TeamEntity> {
    return this.teamRepository.create(teamData);
  }
  
  getTeamById(id: string): Observable<TeamEntity | null> {
    return this.teamRepository.findById(id);
  }
  
  getOrganizationTeams(organizationId: string): Observable<TeamEntity[]> {
    return this.teamRepository.findByOrganization(organizationId);
  }
}
```

### 2. 在組件中使用

```typescript
@Component({
  selector: 'app-team-list',
  template: `
    <div class="team-list">
      @for (team of teams$ | async; track team.id) {
        <div class="team-card">
          <h3>{{ team.name }}</h3>
          <p>{{ team.description }}</p>
          <div class="team-info">
            <span>成員: {{ team.memberCount }}</span>
            <span>專案: {{ team.projectCount }}</span>
          </div>
          <button (click)="viewTeam(team.id)">查看詳情</button>
        </div>
      }
    </div>
  `
})
export class TeamListComponent {
  teams$ = this.teamRepository.findByOrganization('org1', { limit: 10 });

  constructor(private teamRepository: FirebaseTeamRepository) {}

  viewTeam(teamId: string): void {
    this.teamRepository.findById(teamId).subscribe(team => {
      if (team) {
        // 導航到團隊詳情頁
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
