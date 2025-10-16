# 用戶聚合根 (User Aggregate Root)

## 概述

用戶聚合根是帳戶模組的核心領域實體，負責管理用戶的完整生命週期和業務規則。

## 聚合邊界定義

### 聚合根
- **Entity**: User
- **ID**: userId (string)

### 聚合內成員
```typescript
UserAggregate
├── User (Root Entity) ✅
│   ├── userId: string
│   ├── email: Email (VO)
│   ├── displayName: string
│   ├── phoneNumber?: PhoneNumber (VO)
│   └── profile: UserProfile (VO)
│
├── Achievements (Entity Collection) ✅
│   └── Achievement[]
│
├── Notifications (Entity Collection) ✅
│   └── Notification[]
│
├── Following (Reference) ⚠️ 只存 ID
│   └── userId[]
│
├── StarredProjects (Reference) ⚠️ 只存 ID
│   └── projectId[]
│
├── OrganizationMemberships (VO Collection) ✅
│   └── { organizationId, role, joinedAt }[]
│
└── Teams (VO Collection) ✅
    └── { teamId, role, joinedAt }[]
```

**聚合邊界規則**:
- ✅ **可以包含**: Profile, Achievements, Notifications (完整實體)
- ⚠️ **只能引用**: Organization, Team, Project (只存 ID)
- ❌ **不可包含**: 其他用戶的完整資料、組織的完整資料

---

## 不變條件 (Invariants)

```typescript
// domain-layer/Account-Context/Invariants-Rules.md 節錄

class UserInvariants {
  static validate(user: User): void {
    // 1. Email 必須存在且格式正確
    if (!user.email || !Email.isValid(user.email.value)) {
      throw new DomainException('User must have a valid email');
    }
    
    // 2. 顯示名稱必填
    if (!user.displayName?.trim()) {
      throw new DomainException('Display name is required');
    }
    
    // 3. 顯示名稱長度限制
    if (user.displayName.length < 2 || user.displayName.length > 50) {
      throw new DomainException('Display name must be between 2-50 characters');
    }
    
    // 4. 不能追蹤自己
    if (user.following.includes(user.userId)) {
      throw new DomainException('User cannot follow themselves');
    }
    
    // 5. 組織成員不可重複
    const orgIds = user.organizationMemberships.map(m => m.organizationId);
    if (orgIds.length !== new Set(orgIds).size) {
      throw new DomainException('Duplicate organization memberships');
    }
    
    // 6. 團隊成員不可重複
    const teamIds = user.teams.map(t => t.teamId);
    if (teamIds.length !== new Set(teamIds).size) {
      throw new DomainException('Duplicate team memberships');
    }
  }
}
```

---

## TypeScript 定義

```typescript
// domain-layer/Account-Context/Entities/User-Entity.md

import { Email } from '../Value-Objects/Email';
import { PhoneNumber } from '../Value-Objects/PhoneNumber';
import { UserProfile } from '../Value-Objects/UserProfile';
import { Role } from '../Value-Objects/Role';

export interface User {
  // === 識別 ===
  userId: string;
  email: Email;
  
  // === 基本資料 ===
  displayName: string;
  phoneNumber?: PhoneNumber;
  
  // === 個人檔案 ===
  profile: UserProfile;
  
  // === 成就系統 ===
  achievements: Achievement[];
  
  // === 社交功能 ===
  following: string[];              // User IDs (Reference)
  starredProjects: string[];        // Project IDs (Reference)
  
  // === 組織與團隊 ===
  organizationMemberships: OrganizationMembership[];
  teams: TeamMembership[];
  
  // === 通知 ===
  notifications: Notification[];
  
  // === 時間戳 ===
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMembership {
  organizationId: string;           // Reference
  role: Role;
  joinedAt: Date;
}

export interface TeamMembership {
  teamId: string;                   // Reference
  role: Role;
  joinedAt: Date;
}

export interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
}

export interface Notification {
  notificationId: string;
  type: 'follow' | 'achievement' | 'project' | 'team' | 'task';
  title: string;
  message: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: Date;
}
```

---

## 聚合類別實作

```typescript
// domain-layer/Account-Context/Aggregates/User-Aggregate.ts (程式碼實作參考)

import { DomainEvent } from '../../shared/DomainEvent';
import { 
  UserCreatedEvent,
  UserFollowedEvent,
  UserJoinedOrganizationEvent,
  AchievementEarnedEvent,
  ProjectStarredEvent
} from '../Domain-Events/User-Events';

export class UserAggregate {
  private user: User;
  private domainEvents: DomainEvent[] = [];

  private constructor(user: User) {
    UserInvariants.validate(user);
    this.user = user;
  }

  // ========== 工廠方法 ==========
  static create(command: {
    email: string;
    displayName: string;
    phoneNumber?: string;
  }): UserAggregate {
    const user: User = {
      userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: new Email(command.email),
      displayName: command.displayName,
      phoneNumber: command.phoneNumber ? new PhoneNumber(command.phoneNumber) : undefined,
      profile: {
        certifications: [],
        skills: []
      },
      achievements: [],
      following: [],
      starredProjects: [],
      organizationMemberships: [],
      teams: [],
      notifications: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const aggregate = new UserAggregate(user);
    
    aggregate.addDomainEvent(new UserCreatedEvent(
      user.userId,
      command.email,
      command.displayName
    ));

    return aggregate;
  }

  static reconstitute(user: User): UserAggregate {
    return new UserAggregate(user);
  }

  // ========== 領域方法 ==========

  /**
   * 追蹤用戶
   */
  followUser(targetUserId: string): void {
    // 業務規則驗證
    if (this.user.userId === targetUserId) {
      throw new DomainException('Cannot follow yourself');
    }

    if (this.user.following.includes(targetUserId)) {
      throw new DomainException('Already following this user');
    }

    // 執行操作
    this.user.following.push(targetUserId);
    this.user.updatedAt = new Date();

    // 發布領域事件
    this.addDomainEvent(new UserFollowedEvent(
      this.user.userId,
      targetUserId
    ));
  }

  /**
   * 取消追蹤
   */
  unfollowUser(targetUserId: string): void {
    const index = this.user.following.indexOf(targetUserId);
    
    if (index === -1) {
      throw new DomainException('Not following this user');
    }

    this.user.following.splice(index, 1);
    this.user.updatedAt = new Date();

    this.addDomainEvent(new UserUnfollowedEvent(
      this.user.userId,
      targetUserId
    ));
  }

  /**
   * 加入組織
   */
  joinOrganization(organizationId: string, role: Role): void {
    // 檢查是否已經是成員
    const existing = this.user.organizationMemberships.find(
      m => m.organizationId === organizationId
    );

    if (existing) {
      throw new DomainException('Already a member of this organization');
    }

    // 新增成員資格
    const membership: OrganizationMembership = {
      organizationId,
      role,
      joinedAt: new Date()
    };

    this.user.organizationMemberships.push(membership);
    this.user.updatedAt = new Date();

    this.addDomainEvent(new UserJoinedOrganizationEvent(
      this.user.userId,
      organizationId,
      role
    ));
  }

  /**
   * 離開組織
   */
  leaveOrganization(organizationId: string): void {
    const index = this.user.organizationMemberships.findIndex(
      m => m.organizationId === organizationId
    );

    if (index === -1) {
      throw new DomainException('Not a member of this organization');
    }

    this.user.organizationMemberships.splice(index, 1);
    this.user.updatedAt = new Date();

    this.addDomainEvent(new UserLeftOrganizationEvent(
      this.user.userId,
      organizationId
    ));
  }

  /**
   * 加入團隊
   */
  joinTeam(teamId: string, role: Role): void {
    const existing = this.user.teams.find(t => t.teamId === teamId);

    if (existing) {
      throw new DomainException('Already a member of this team');
    }

    const membership: TeamMembership = {
      teamId,
      role,
      joinedAt: new Date()
    };

    this.user.teams.push(membership);
    this.user.updatedAt = new Date();

    this.addDomainEvent(new UserJoinedTeamEvent(
      this.user.userId,
      teamId,
      role
    ));
  }

  /**
   * 獲得成就
   */
  earnAchievement(achievement: Achievement): void {
    const existing = this.user.achievements.find(
      a => a.achievementId === achievement.achievementId
    );

    if (existing) {
      throw new DomainException('Achievement already earned');
    }

    this.user.achievements.push(achievement);
    this.user.updatedAt = new Date();

    this.addDomainEvent(new AchievementEarnedEvent(
      this.user.userId,
      achievement.achievementId,
      achievement.name
    ));
  }

  /**
   * 星標專案
   */
  starProject(projectId: string): void {
    if (this.user.starredProjects.includes(projectId)) {
      throw new DomainException('Project already starred');
    }

    this.user.starredProjects.push(projectId);
    this.user.updatedAt = new Date();

    this.addDomainEvent(new ProjectStarredEvent(
      this.user.userId,
      projectId
    ));
  }

  /**
   * 取消星標
   */
  unstarProject(projectId: string): void {
    const index = this.user.starredProjects.indexOf(projectId);

    if (index === -1) {
      throw new DomainException('Project not starred');
    }

    this.user.starredProjects.splice(index, 1);
    this.user.updatedAt = new Date();

    this.addDomainEvent(new ProjectUnstarredEvent(
      this.user.userId,
      projectId
    ));
  }

  /**
   * 更新個人檔案
   */
  updateProfile(profile: Partial<UserProfile>): void {
    this.user.profile = {
      ...this.user.profile,
      ...profile
    };
    this.user.updatedAt = new Date();

    this.addDomainEvent(new ProfileUpdatedEvent(this.user.userId));
  }

  /**
   * 新增通知
   */
  addNotification(notification: Notification): void {
    this.user.notifications.push(notification);
    this.user.updatedAt = new Date();
  }

  /**
   * 標記通知已讀
   */
  markNotificationAsRead(notificationId: string): void {
    const notification = this.user.notifications.find(
      n => n.notificationId === notificationId
    );

    if (!notification) {
      throw new DomainException('Notification not found');
    }

    notification.isRead = true;
    this.user.updatedAt = new Date();
  }

  // ========== 領域事件管理 ==========
  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // ========== Getters ==========
  get id(): string {
    return this.user.userId;
  }

  get data(): User {
    return { ...this.user };
  }
}

// 領域異常
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}
```

---

## 領域事件定義

```typescript
// domain-layer/Account-Context/Domain-Events/User-Events.md

export interface DomainEvent {
  eventId: string;
  occurredOn: Date;
  aggregateId: string;
}

export class UserCreatedEvent implements DomainEvent {
  eventId: string;
  occurredOn: Date;
  aggregateId: string;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly displayName: string
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.occurredOn = new Date();
    this.aggregateId = userId;
  }
}

export class UserFollowedEvent implements DomainEvent {
  eventId: string;
  occurredOn: Date;
  aggregateId: string;

  constructor(
    public readonly followerId: string,
    public readonly followeeId: string
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.occurredOn = new Date();
    this.aggregateId = followerId;
  }
}

export class UserJoinedOrganizationEvent implements DomainEvent {
  eventId: string;
  occurredOn: Date;
  aggregateId: string;

  constructor(
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly role: Role
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.occurredOn = new Date();
    this.aggregateId = userId;
  }
}

export class AchievementEarnedEvent implements DomainEvent {
  eventId: string;
  occurredOn: Date;
  aggregateId: string;

  constructor(
    public readonly userId: string,
    public readonly achievementId: string,
    public readonly achievementName: string
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.occurredOn = new Date();
    this.aggregateId = userId;
  }
}

// ... 其他事件定義
```

---

## Repository 介面

```typescript
// domain-layer/Account-Context/Repository-Interfaces/IUserRepository.md

export interface IUserRepository {
  // 查詢
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByIds(userIds: string[]): Promise<User[]>;
  
  // 儲存
  save(user: User): Promise<void>;
  
  // 刪除
  delete(userId: string): Promise<void>;
  
  // 搜尋
  search(criteria: UserSearchCriteria): Promise<PagedResult<User>>;
}

export interface UserSearchCriteria {
  keyword?: string;
  skills?: string[];
  organizationIds?: string[];
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

## 業務規則

### 1. 不變性規則
- 用戶 ID 一旦建立就不能變更
- 郵箱格式必須符合標準
- 用戶名稱長度限制
- 密碼強度要求

### 2. 業務規則
- 用戶不能追蹤自己
- 停用的用戶不能執行操作
- 成就解鎖必須符合條件
- 社交關係必須是雙向的

### 3. 一致性規則
- 用戶狀態變更必須發布事件
- 所有業務操作必須更新時間戳
- 領域事件必須按順序處理

## 最佳實踐

### 使用建議
1. **封裝性**: 保持聚合根的內部狀態私有
2. **不變性**: 確保業務規則的不變性
3. **事件驅動**: 使用領域事件進行解耦
4. **工廠模式**: 使用工廠方法建立聚合根

### 避免事項
1. 不要直接暴露內部狀態
2. 不要在聚合根中處理基礎設施關注點
3. 不要忽略業務規則驗證
4. 不要讓聚合根過於複雜
