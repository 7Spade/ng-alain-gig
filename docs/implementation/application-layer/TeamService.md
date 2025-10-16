# Team Service (團隊服務)

## 服務概述

TeamService 是團隊協作模組的核心應用服務，負責管理組織內的團隊建立、成員管理、角色分配等業務流程。本服務採用 DDD 架構設計，作為團隊聚合根與外部世界之間的介面，處理團隊生命週期和協作相關的所有業務邏輯。

## 核心職責

### 1. 團隊生命週期管理
- 團隊建立與初始化
- 團隊解散與歸檔
- 團隊設定管理
- 團隊狀態追蹤

### 2. 成員管理
- 成員邀請與加入
- 成員移除與離職
- 角色分配與變更
- 權限管理

### 3. 協作協調
- 團隊溝通協調
- 專案分配管理
- 工作流程協調
- 績效追蹤

## 服務架構

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, switchMap, catchError, forkJoin } from 'rxjs';
import { TeamAggregate } from '../../domain-layer/Aggregates/TeamAggregate';
import { TeamRepository } from '../../infrastructure-layer/FirebaseTeamRepository';
import { UserService } from './UserService';
import { ProjectService } from './ProjectService';
import { NotificationService } from './NotificationService';
import { TeamCreatedEvent, TeamMemberAddedEvent } from '../../domain-layer/Events';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private teamRepository = inject(TeamRepository);
  private userService = inject(UserService);
  private projectService = inject(ProjectService);
  private notificationService = inject(NotificationService);
  
  // 狀態管理
  private teamsSubject = new BehaviorSubject<TeamAggregate[]>([]);
  private currentTeamSubject = new BehaviorSubject<TeamAggregate | null>(null);
  private teamMembersSubject = new BehaviorSubject<TeamMember[]>([]);
  
  // 公開的 Observable
  public readonly teams$ = this.teamsSubject.asObservable();
  public readonly currentTeam$ = this.currentTeamSubject.asObservable();
  public readonly teamMembers$ = this.teamMembersSubject.asObservable();
  
  constructor() {
    this.initializeService();
  }
  
  private initializeService(): void {
    // 監聽用戶變更，重新載入團隊
    this.userService.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.loadUserTeams(user.id);
        }
        return [];
      })
    ).subscribe();
  }
}
```

## 核心方法

### 1. 團隊建立

```typescript
/**
 * 建立新團隊
 * @param teamData 團隊基本資料
 * @param organizationId 組織 ID
 * @param creatorId 建立者 ID
 * @returns Observable<TeamAggregate>
 */
createTeam(
  teamData: CreateTeamCommand, 
  organizationId: string, 
  creatorId: string
): Observable<TeamAggregate> {
  return this.teamRepository.create({
    ...teamData,
    organizationId,
    creatorId,
    status: TeamStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  }).pipe(
    map(teamData => {
      // 建立團隊聚合根
      const team = new TeamAggregate(teamData);
      
      // 自動將建立者設為團隊負責人
      this.addTeamMember(team.id, creatorId, TeamRole.LEADER).subscribe();
      
      // 更新本地狀態
      this.addTeamToState(team);
      
      // 發布事件
      this.publishEvent(new TeamCreatedEvent({
        teamId: team.id,
        teamName: team.name,
        organizationId: team.organizationId,
        creatorId: team.creatorId,
        createdAt: team.createdAt
      }));
      
      // 發送通知
      this.notificationService.notifyTeamCreated(team);
      
      return team;
    }),
    catchError(error => {
      console.error('建立團隊失敗:', error);
      throw new TeamCreationError('無法建立團隊', error);
    })
  );
}
```

### 2. 成員管理

```typescript
/**
 * 邀請成員加入團隊
 * @param teamId 團隊 ID
 * @param userId 用戶 ID
 * @param role 角色
 * @param invitedBy 邀請者 ID
 * @returns Observable<TeamMember>
 */
inviteTeamMember(
  teamId: string, 
  userId: string, 
  role: TeamRole, 
  invitedBy: string
): Observable<TeamMember> {
  return this.teamRepository.inviteMember(teamId, {
    userId,
    role,
    invitedBy,
    invitedAt: new Date(),
    status: TeamMemberStatus.PENDING
  }).pipe(
    map(memberData => {
      const member = new TeamMember(memberData);
      
      // 更新團隊成員狀態
      this.updateTeamMembersState(teamId);
      
      // 發布事件
      this.publishEvent(new TeamMemberInvitedEvent({
        teamId,
        userId,
        role,
        invitedBy,
        invitedAt: member.invitedAt
      }));
      
      // 發送邀請通知
      this.notificationService.notifyTeamInvitation(teamId, userId, role);
      
      return member;
    }),
    catchError(error => {
      console.error('邀請成員失敗:', error);
      throw new TeamMemberInviteError('無法邀請成員', error);
    })
  );
}

/**
 * 接受團隊邀請
 * @param teamId 團隊 ID
 * @param userId 用戶 ID
 * @returns Observable<TeamMember>
 */
acceptTeamInvitation(teamId: string, userId: string): Observable<TeamMember> {
  return this.teamRepository.acceptInvitation(teamId, userId).pipe(
    map(memberData => {
      const member = new TeamMember(memberData);
      
      // 更新團隊成員狀態
      this.updateTeamMembersState(teamId);
      
      // 發布事件
      this.publishEvent(new TeamMemberJoinedEvent({
        teamId,
        userId,
        role: member.role,
        joinedAt: member.joinedAt
      }));
      
      // 發送歡迎通知
      this.notificationService.notifyTeamMemberJoined(teamId, userId);
      
      return member;
    })
  );
}

/**
 * 移除團隊成員
 * @param teamId 團隊 ID
 * @param userId 用戶 ID
 * @param removedBy 移除者 ID
 * @param reason 移除原因
 * @returns Observable<void>
 */
removeTeamMember(
  teamId: string, 
  userId: string, 
  removedBy: string, 
  reason?: string
): Observable<void> {
  return this.teamRepository.removeMember(teamId, userId).pipe(
    map(() => {
      // 更新團隊成員狀態
      this.updateTeamMembersState(teamId);
      
      // 發布事件
      this.publishEvent(new TeamMemberRemovedEvent({
        teamId,
        userId,
        removedBy,
        reason,
        removedAt: new Date()
      }));
      
      // 發送移除通知
      this.notificationService.notifyTeamMemberRemoved(teamId, userId, reason);
    })
  );
}
```

### 3. 角色管理

```typescript
/**
 * 變更團隊成員角色
 * @param teamId 團隊 ID
 * @param userId 用戶 ID
 * @param newRole 新角色
 * @param changedBy 變更者 ID
 * @returns Observable<TeamMember>
 */
changeMemberRole(
  teamId: string, 
  userId: string, 
  newRole: TeamRole, 
  changedBy: string
): Observable<TeamMember> {
  return this.teamRepository.updateMemberRole(teamId, userId, newRole).pipe(
    map(memberData => {
      const member = new TeamMember(memberData);
      
      // 更新團隊成員狀態
      this.updateTeamMembersState(teamId);
      
      // 發布事件
      this.publishEvent(new TeamMemberRoleChangedEvent({
        teamId,
        userId,
        oldRole: member.previousRole,
        newRole: member.role,
        changedBy,
        changedAt: new Date()
      }));
      
      // 發送角色變更通知
      this.notificationService.notifyTeamMemberRoleChanged(teamId, userId, newRole);
      
      return member;
    })
  );
}

/**
 * 檢查用戶在團隊中的權限
 * @param teamId 團隊 ID
 * @param userId 用戶 ID
 * @param permission 權限
 * @returns Observable<boolean>
 */
checkTeamPermission(
  teamId: string, 
  userId: string, 
  permission: TeamPermission
): Observable<boolean> {
  return this.getTeamMember(teamId, userId).pipe(
    map(member => {
      if (!member) return false;
      
      const rolePermissions = this.getRolePermissions(member.role);
      return rolePermissions.includes(permission);
    }),
    catchError(() => of(false))
  );
}
```

### 4. 團隊查詢

```typescript
/**
 * 取得用戶的所有團隊
 * @param userId 用戶 ID
 * @returns Observable<TeamAggregate[]>
 */
getUserTeams(userId: string): Observable<TeamAggregate[]> {
  return this.teamRepository.findByUserId(userId).pipe(
    map(teamsData => 
      teamsData.map(data => new TeamAggregate(data))
    ),
    map(teams => {
      // 更新本地狀態
      this.teamsSubject.next(teams);
      return teams;
    })
  );
}

/**
 * 取得組織的所有團隊
 * @param organizationId 組織 ID
 * @returns Observable<TeamAggregate[]>
 */
getOrganizationTeams(organizationId: string): Observable<TeamAggregate[]> {
  return this.teamRepository.findByOrganizationId(organizationId).pipe(
    map(teamsData => 
      teamsData.map(data => new TeamAggregate(data))
    )
  );
}

/**
 * 取得團隊詳情
 * @param teamId 團隊 ID
 * @returns Observable<TeamAggregate>
 */
getTeamById(teamId: string): Observable<TeamAggregate> {
  return this.teamRepository.findById(teamId).pipe(
    map(teamData => new TeamAggregate(teamData)),
    map(team => {
      // 更新當前團隊狀態
      this.currentTeamSubject.next(team);
      return team;
    })
  );
}

/**
 * 取得團隊成員列表
 * @param teamId 團隊 ID
 * @returns Observable<TeamMember[]>
 */
getTeamMembers(teamId: string): Observable<TeamMember[]> {
  return this.teamRepository.getTeamMembers(teamId).pipe(
    map(membersData => 
      membersData.map(data => new TeamMember(data))
    ),
    map(members => {
      // 更新團隊成員狀態
      this.teamMembersSubject.next(members);
      return members;
    })
  );
}
```

### 5. 專案分配

```typescript
/**
 * 分配專案給團隊
 * @param teamId 團隊 ID
 * @param projectId 專案 ID
 * @param assignedBy 分配者 ID
 * @returns Observable<void>
 */
assignProjectToTeam(
  teamId: string, 
  projectId: string, 
  assignedBy: string
): Observable<void> {
  return this.teamRepository.assignProject(teamId, projectId).pipe(
    map(() => {
      // 發布事件
      this.publishEvent(new ProjectAssignedToTeamEvent({
        teamId,
        projectId,
        assignedBy,
        assignedAt: new Date()
      }));
      
      // 發送專案分配通知
      this.notificationService.notifyProjectAssignedToTeam(teamId, projectId);
    })
  );
}

/**
 * 取消團隊專案分配
 * @param teamId 團隊 ID
 * @param projectId 專案 ID
 * @param unassignedBy 取消分配者 ID
 * @returns Observable<void>
 */
unassignProjectFromTeam(
  teamId: string, 
  projectId: string, 
  unassignedBy: string
): Observable<void> {
  return this.teamRepository.unassignProject(teamId, projectId).pipe(
    map(() => {
      // 發布事件
      this.publishEvent(new ProjectUnassignedFromTeamEvent({
        teamId,
        projectId,
        unassignedBy,
        unassignedAt: new Date()
      }));
    })
  );
}
```

## 狀態管理

### 1. 本地狀態更新

```typescript
private addTeamToState(team: TeamAggregate): void {
  const currentTeams = this.teamsSubject.value;
  this.teamsSubject.next([...currentTeams, team]);
}

private updateTeamInState(updatedTeam: TeamAggregate): void {
  const currentTeams = this.teamsSubject.value;
  const updatedTeams = currentTeams.map(team => 
    team.id === updatedTeam.id ? updatedTeam : team
  );
  this.teamsSubject.next(updatedTeams);
  
  // 如果當前團隊被更新，也要更新當前團隊狀態
  const currentTeam = this.currentTeamSubject.value;
  if (currentTeam && currentTeam.id === updatedTeam.id) {
    this.currentTeamSubject.next(updatedTeam);
  }
}

private updateTeamMembersState(teamId: string): void {
  this.getTeamMembers(teamId).subscribe();
}

private removeTeamFromState(teamId: string): void {
  const currentTeams = this.teamsSubject.value;
  const filteredTeams = currentTeams.filter(team => team.id !== teamId);
  this.teamsSubject.next(filteredTeams);
  
  // 如果當前團隊被刪除，清除當前團隊狀態
  const currentTeam = this.currentTeamSubject.value;
  if (currentTeam && currentTeam.id === teamId) {
    this.currentTeamSubject.next(null);
  }
}
```

### 2. 權限檢查

```typescript
private getRolePermissions(role: TeamRole): TeamPermission[] {
  const rolePermissions: Record<TeamRole, TeamPermission[]> = {
    [TeamRole.LEADER]: [
      TeamPermission.MANAGE_MEMBERS,
      TeamPermission.MANAGE_PROJECTS,
      TeamPermission.MANAGE_SETTINGS,
      TeamPermission.VIEW_ANALYTICS,
      TeamPermission.SEND_MESSAGES
    ],
    [TeamRole.MANAGER]: [
      TeamPermission.MANAGE_MEMBERS,
      TeamPermission.MANAGE_PROJECTS,
      TeamPermission.VIEW_ANALYTICS,
      TeamPermission.SEND_MESSAGES
    ],
    [TeamRole.MEMBER]: [
      TeamPermission.VIEW_PROJECTS,
      TeamPermission.SEND_MESSAGES
    ],
    [TeamRole.OBSERVER]: [
      TeamPermission.VIEW_PROJECTS
    ]
  };
  
  return rolePermissions[role] || [];
}
```

## 錯誤處理

### 1. 自定義錯誤類別

```typescript
export class TeamServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'TeamServiceError';
  }
}

export class TeamCreationError extends TeamServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'TEAM_CREATION_FAILED', originalError);
  }
}

export class TeamMemberInviteError extends TeamServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'TEAM_MEMBER_INVITE_FAILED', originalError);
  }
}

export class TeamNotFoundError extends TeamServiceError {
  constructor(teamId: string) {
    super(`團隊 ${teamId} 不存在`, 'TEAM_NOT_FOUND');
  }
}

export class TeamPermissionError extends TeamServiceError {
  constructor(action: string) {
    super(`沒有權限執行 ${action} 操作`, 'PERMISSION_DENIED');
  }
}
```

## 效能優化

### 1. 資料預載入

```typescript
/**
 * 預載入團隊相關資料
 * @param teamId 團隊 ID
 */
preloadTeamData(teamId: string): Observable<void> {
  return forkJoin({
    team: this.getTeamById(teamId),
    members: this.getTeamMembers(teamId),
    projects: this.getTeamProjects(teamId)
  }).pipe(
    map(() => void 0),
    catchError(error => {
      console.error('預載入失敗:', error);
      return of(void 0);
    })
  );
}
```

### 2. 快取策略

```typescript
private cacheTeam(team: TeamAggregate): void {
  const cacheKey = `team_${team.id}`;
  localStorage.setItem(cacheKey, JSON.stringify(team.toJSON()));
}

private getCachedTeam(teamId: string): TeamAggregate | null {
  const cacheKey = `team_${teamId}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      const teamData = JSON.parse(cachedData);
      return new TeamAggregate(teamData);
    } catch (error) {
      console.error('快取資料解析失敗:', error);
      localStorage.removeItem(cacheKey);
    }
  }
  
  return null;
}
```

## 測試策略

### 1. 單元測試

```typescript
describe('TeamService', () => {
  let service: TeamService;
  let mockRepository: jasmine.SpyObj<TeamRepository>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const repositorySpy = jasmine.createSpyObj('TeamRepository', [
      'create', 'inviteMember', 'acceptInvitation', 'removeMember'
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getCurrentUserId']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'notifyTeamCreated', 'notifyTeamInvitation'
    ]);

    TestBed.configureTestingModule({
      providers: [
        TeamService,
        { provide: TeamRepository, useValue: repositorySpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    });

    service = TestBed.inject(TeamService);
    mockRepository = TestBed.inject(TeamRepository) as jasmine.SpyObj<TeamRepository>;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  it('應該能夠建立新團隊', (done) => {
    const teamData = {
      name: '測試團隊',
      description: '測試描述',
      department: '工程部'
    };
    
    const mockTeam = { id: '1', ...teamData };
    mockRepository.create.and.returnValue(of(mockTeam));
    mockUserService.getCurrentUserId.and.returnValue('user1');

    service.createTeam(teamData, 'org1', 'user1').subscribe({
      next: (team) => {
        expect(team).toBeDefined();
        expect(team.name).toBe('測試團隊');
        expect(mockRepository.create).toHaveBeenCalled();
        expect(mockNotificationService.notifyTeamCreated).toHaveBeenCalled();
        done();
      },
      error: done.fail
    });
  });
});
```

## 使用範例

### 1. 在組件中使用

```typescript
@Component({
  selector: 'app-team-list',
  template: `
    <div class="team-list">
      @for (team of teams$ | async; track team.id) {
        <div class="team-card">
          <h3>{{ team.name }}</h3>
          <p>{{ team.description }}</p>
          <div class="team-members">
            <span>成員: {{ team.memberCount }}</span>
          </div>
          <button (click)="selectTeam(team.id)">查看詳情</button>
        </div>
      }
    </div>
  `
})
export class TeamListComponent {
  teams$ = this.teamService.teams$;

  constructor(private teamService: TeamService) {}

  selectTeam(teamId: string): void {
    this.teamService.getTeamById(teamId).subscribe();
  }
}
```

### 2. 在路由守衛中使用

```typescript
@Injectable()
export class TeamAccessGuard implements CanActivate {
  constructor(
    private teamService: TeamService,
    private userService: UserService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const teamId = route.params['id'];
    
    return this.teamService.getTeamById(teamId).pipe(
      map(team => {
        const currentUser = this.userService.getCurrentUser();
        return team.hasMember(currentUser.id);
      }),
      catchError(() => of(false))
    );
  }
}
```

## 最佳實踐

### 1. 服務設計原則
- **單一職責**: 專注於團隊相關的業務邏輯
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