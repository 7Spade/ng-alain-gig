# Domain Layer - 領域層設計概覽

## 概述
基於三個 DDD 領域定義，設計清晰的領域模型，包含實體、值對象、聚合根、領域服務和領域事件。

## 三個核心領域

### 1. Account Domain (帳戶抽象層)

#### 1.1 User 子領域
```typescript
// 用戶聚合根
class UserAggregate {
  private user: UserEntity;
  private profile: UserProfile;
  private achievements: Achievement[];
  private notifications: Notification[];
  private starredProjects: StarredProject[];
  private following: Following[];
  
  // 領域方法
  updateProfile(profileData: UserProfileData): void;
  addAchievement(achievement: Achievement): void;
  starProject(projectId: string): void;
  followUser(userId: string): void;
  followOrganization(orgId: string): void;
}

// 用戶實體
class UserEntity {
  constructor(
    public readonly id: UserId,
    public email: Email,
    public displayName: string,
    public avatar?: string,
    public isActive: boolean = true
  ) {}
  
  // 業務規則
  canAccessProject(projectId: string): boolean;
  hasRole(role: Role): boolean;
  isMemberOf(organizationId: string): boolean;
}

// 用戶資料值對象
class UserProfile {
  constructor(
    public readonly personalInfo: PersonalInfo,
    public readonly professionalInfo: ProfessionalInfo,
    public readonly preferences: UserPreferences
  ) {}
}
```

#### 1.2 Organization 子領域
```typescript
// 組織聚合根
class OrganizationAggregate {
  private organization: OrganizationEntity;
  private members: OrganizationMember[];
  private teams: Team[];
  
  // 領域方法
  addMember(userId: string, role: OrganizationRole): void;
  removeMember(userId: string): void;
  createTeam(teamData: TeamData): Team;
  assignMemberToTeam(userId: string, teamId: string): void;
}

// 組織實體
class OrganizationEntity {
  constructor(
    public readonly id: OrganizationId,
    public name: string,
    public type: OrganizationType,
    public licenseInfo: LicenseInfo,
    public isActive: boolean = true
  ) {}
  
  // 業務規則
  canCreateProject(): boolean;
  hasMember(userId: string): boolean;
  canManageTeam(teamId: string): boolean;
}
```

### 2. Projects Domain (專案管理)

#### 2.1 Project 子領域
```typescript
// 專案聚合根
class ProjectAggregate {
  private project: ProjectEntity;
  private tasks: Task[];
  private documents: ProjectDocument[];
  private costs: ProjectCost[];
  private members: ProjectMember[];
  
  // 領域方法
  createTask(taskData: TaskData): Task;
  assignTask(taskId: string, userId: string): void;
  updateTaskStatus(taskId: string, status: TaskStatus): void;
  addDocument(document: ProjectDocument): void;
  recordCost(cost: ProjectCost): void;
  addMember(userId: string, role: ProjectRole): void;
}

// 專案實體
class ProjectEntity {
  constructor(
    public readonly id: ProjectId,
    public name: string,
    public description: string,
    public status: ProjectStatus,
    public startDate: Date,
    public endDate: Date,
    public budget: Money,
    public organizationId: OrganizationId
  ) {}
  
  // 業務規則
  canBeModified(): boolean;
  isOverBudget(): boolean;
  canAddMember(userId: string): boolean;
  calculateProgress(): number;
}
```

### 3. Shared Domain (共享基礎設施)

#### 3.1 通用值對象
```typescript
// 通用值對象
class Email {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email format');
    }
  }
  
  private isValid(email: string): boolean {
    // 電子郵件驗證邏輯
  }
}

class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }
  
  add(other: Money): Money;
  subtract(other: Money): Money;
  equals(other: Money): boolean;
}

class DateRange {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }
  }
  
  contains(date: Date): boolean;
  overlaps(other: DateRange): boolean;
}
```

## 領域服務設計

### 1. 用戶領域服務
```typescript
@Injectable()
export class UserDomainService {
  // 用戶註冊業務邏輯
  registerUser(userData: UserRegistrationData): UserAggregate {
    // 驗證用戶資料
    // 檢查電子郵件唯一性
    // 建立用戶聚合
  }
  
  // 用戶認證業務邏輯
  authenticateUser(credentials: LoginCredentials): Promise<UserProfile> {
    // 驗證認證資訊
    // 載入用戶資料
    // 建立用戶會話
  }
  
  // 權限檢查業務邏輯
  checkUserPermission(userId: string, resource: string, action: string): boolean {
    // 檢查用戶權限
    // 驗證資源存取權
  }
}
```

### 2. 專案領域服務
```typescript
@Injectable()
export class ProjectDomainService {
  // 專案建立業務邏輯
  createProject(projectData: ProjectCreationData, userId: string): ProjectAggregate {
    // 驗證專案資料
    // 檢查用戶權限
    // 建立專案聚合
  }
  
  // 任務分配業務邏輯
  assignTask(taskId: string, assigneeId: string, assignerId: string): void {
    // 驗證任務狀態
    // 檢查分配者權限
    // 更新任務分配
  }
  
  // 成本控制業務邏輯
  validateCostEntry(cost: ProjectCost, project: ProjectEntity): boolean {
    // 驗證成本資料
    // 檢查預算限制
    // 驗證授權
  }
}
```

## 領域事件設計

### 1. 用戶領域事件
```typescript
// 用戶註冊事件
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly timestamp: Date
  ) {}
}

// 用戶權限變更事件
export class UserPermissionChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly oldPermissions: Permission[],
    public readonly newPermissions: Permission[],
    public readonly timestamp: Date
  ) {}
}
```

### 2. 專案領域事件
```typescript
// 專案建立事件
export class ProjectCreatedEvent {
  constructor(
    public readonly projectId: string,
    public readonly organizationId: string,
    public readonly createdBy: string,
    public readonly timestamp: Date
  ) {}
}

// 任務狀態變更事件
export class TaskStatusChangedEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string,
    public readonly oldStatus: TaskStatus,
    public readonly newStatus: TaskStatus,
    public readonly changedBy: string,
    public readonly timestamp: Date
  ) {}
}
```

## 聚合設計原則

### 1. 聚合邊界
- **UserAggregate**: 包含用戶基本資料、個人資料、成就、通知
- **OrganizationAggregate**: 包含組織資料、成員、團隊
- **ProjectAggregate**: 包含專案資料、任務、文件、成本

### 2. 不變性規則
- 用戶電子郵件必須唯一
- 專案預算不能為負數
- 任務截止日期不能早於開始日期
- 組織成員角色必須有效

### 3. 事務邊界
- 每個聚合根代表一個事務邊界
- 跨聚合的操作通過領域服務協調
- 使用領域事件處理跨聚合的副作用

## 相關文件
- [User 實體設計](./Entities/UserEntity.md)
- [Organization 實體設計](./Entities/OrganizationEntity.md)
- [Project 實體設計](./Entities/ProjectEntity.md)
- [領域服務設計](./DomainServices/)
- [領域事件設計](./DomainEvents/)
