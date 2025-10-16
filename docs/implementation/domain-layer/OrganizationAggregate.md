# Organization 聚合根 (Organization Aggregate)

## 概述

Organization 聚合根是營建管理系統中組織領域的核心聚合，負責管理組織的完整生命週期、成員管理、團隊結構和業務規則。採用 Domain-Driven Design 原則，封裝組織相關的所有業務邏輯。

## 聚合根設計

### 1. 核心概念
- **聚合邊界**: 組織身份、基本資料、營業資訊、成員管理、團隊結構
- **不變性**: 確保組織資料的業務規則一致性
- **領域事件**: 發布組織相關的領域事件
- **封裝性**: 封裝組織的內部狀態和行為

### 2. 聚合邊界
- **組織身份**: ID、名稱、類型、狀態
- **基本資料**: 聯絡資訊、地址、描述
- **營業資訊**: 營業執照、稅務登記、資本額
- **成員管理**: 成員列表、角色分配、權限管理
- **團隊結構**: 團隊建立、成員分配、專案分配

## 實作範例

### Organization 聚合根
```typescript
export class OrganizationAggregate {
  private readonly _id: OrganizationId;
  private _name: OrganizationName;
  private _type: OrganizationType;
  private _profile: OrganizationProfile;
  private _businessInfo: BusinessInfo;
  private _members: OrganizationMembers;
  private _teams: OrganizationTeams;
  private _projects: OrganizationProjects;
  private _status: OrganizationStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  
  private readonly _domainEvents: DomainEvent[] = [];
  
  constructor(
    id: OrganizationId,
    name: OrganizationName,
    type: OrganizationType,
    profile: OrganizationProfile,
    businessInfo: BusinessInfo
  ) {
    this._id = id;
    this._name = name;
    this._type = type;
    this._profile = profile;
    this._businessInfo = businessInfo;
    this._members = new OrganizationMembers();
    this._teams = new OrganizationTeams();
    this._projects = new OrganizationProjects();
    this._status = OrganizationStatus.ACTIVE;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    
    // 發布組織建立事件
    this.addDomainEvent(new OrganizationCreatedEvent(
      this._id.value,
      this._name.value,
      this._type.value,
      this._createdAt
    ));
  }
  
  // 身份識別
  get id(): OrganizationId {
    return this._id;
  }
  
  get name(): OrganizationName {
    return this._name;
  }
  
  get type(): OrganizationType {
    return this._type;
  }
  
  get status(): OrganizationStatus {
    return this._status;
  }
  
  // 組織管理
  updateProfile(profileData: Partial<OrganizationProfileData>): void {
    this._profile.update(profileData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new OrganizationProfileUpdatedEvent(
      this._id.value,
      Object.keys(profileData),
      this._updatedAt
    ));
  }
  
  updateBusinessInfo(businessData: Partial<BusinessInfoData>): void {
    this._businessInfo.update(businessData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new BusinessInfoUpdatedEvent(
      this._id.value,
      Object.keys(businessData),
      this._updatedAt
    ));
  }
  
  // 成員管理
  addMember(userId: UserId, role: OrganizationRole, department?: string): void {
    if (this._members.hasMember(userId)) {
      throw new DomainException('用戶已經是組織成員');
    }
    
    this._members.addMember(userId, role, department);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new MemberAddedEvent(
      this._id.value,
      userId.value,
      role.value,
      this._updatedAt
    ));
  }
  
  removeMember(userId: UserId): void {
    if (!this._members.hasMember(userId)) {
      throw new DomainException('用戶不是組織成員');
    }
    
    // 檢查是否還有未完成的專案
    if (this._projects.hasActiveProjectsByUser(userId)) {
      throw new DomainException('用戶還有未完成的專案，無法移除');
    }
    
    this._members.removeMember(userId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new MemberRemovedEvent(
      this._id.value,
      userId.value,
      this._updatedAt
    ));
  }
  
  changeMemberRole(userId: UserId, newRole: OrganizationRole): void {
    if (!this._members.hasMember(userId)) {
      throw new DomainException('用戶不是組織成員');
    }
    
    const oldRole = this._members.getMemberRole(userId);
    this._members.changeRole(userId, newRole);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new MemberRoleChangedEvent(
      this._id.value,
      userId.value,
      oldRole.value,
      newRole.value,
      this._updatedAt
    ));
  }
  
  // 團隊管理
  createTeam(teamData: CreateTeamData): Team {
    const team = this._teams.createTeam(teamData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new TeamCreatedEvent(
      this._id.value,
      team.id.value,
      team.name.value,
      this._updatedAt
    ));
    
    return team;
  }
  
  assignMemberToTeam(userId: UserId, teamId: TeamId, role: TeamRole): void {
    if (!this._members.hasMember(userId)) {
      throw new DomainException('用戶不是組織成員');
    }
    
    if (!this._teams.hasTeam(teamId)) {
      throw new DomainException('團隊不存在');
    }
    
    this._teams.assignMemberToTeam(userId, teamId, role);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new MemberAssignedToTeamEvent(
      this._id.value,
      userId.value,
      teamId.value,
      role.value,
      this._updatedAt
    ));
  }
  
  removeMemberFromTeam(userId: UserId, teamId: TeamId): void {
    if (!this._teams.hasTeam(teamId)) {
      throw new DomainException('團隊不存在');
    }
    
    if (!this._teams.isMemberOfTeam(userId, teamId)) {
      throw new DomainException('用戶不是此團隊成員');
    }
    
    this._teams.removeMemberFromTeam(userId, teamId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new MemberRemovedFromTeamEvent(
      this._id.value,
      userId.value,
      teamId.value,
      this._updatedAt
    ));
  }
  
  // 專案管理
  assignProjectToTeam(projectId: ProjectId, teamId: TeamId): void {
    if (!this._teams.hasTeam(teamId)) {
      throw new DomainException('團隊不存在');
    }
    
    this._projects.assignToTeam(projectId, teamId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectAssignedToTeamEvent(
      this._id.value,
      projectId.value,
      teamId.value,
      this._updatedAt
    ));
  }
  
  // 組織狀態管理
  suspend(reason: string): void {
    if (this._status === OrganizationStatus.SUSPENDED) {
      throw new DomainException('組織已經被停用');
    }
    
    this._status = OrganizationStatus.SUSPENDED;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new OrganizationSuspendedEvent(
      this._id.value,
      reason,
      this._updatedAt
    ));
  }
  
  reactivate(): void {
    if (this._status !== OrganizationStatus.SUSPENDED) {
      throw new DomainException('只有停用的組織才能重新啟用');
    }
    
    this._status = OrganizationStatus.ACTIVE;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new OrganizationReactivatedEvent(
      this._id.value,
      this._updatedAt
    ));
  }
  
  deactivate(): void {
    if (this._status === OrganizationStatus.DEACTIVATED) {
      throw new DomainException('組織已經被停用');
    }
    
    // 檢查是否有未完成的專案
    if (this._projects.hasActiveProjects()) {
      throw new DomainException('還有未完成的專案，無法停用組織');
    }
    
    this._status = OrganizationStatus.DEACTIVATED;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new OrganizationDeactivatedEvent(
      this._id.value,
      this._updatedAt
    ));
  }
  
  // 權限檢查
  canUserManageMembers(userId: UserId): boolean {
    const member = this._members.getMember(userId);
    if (!member) {
      return false;
    }
    
    return member.role.hasPermission('MANAGE_MEMBERS');
  }
  
  canUserCreateTeams(userId: UserId): boolean {
    const member = this._members.getMember(userId);
    if (!member) {
      return false;
    }
    
    return member.role.hasPermission('CREATE_TEAMS');
  }
  
  canUserAssignProjects(userId: UserId): boolean {
    const member = this._members.getMember(userId);
    if (!member) {
      return false;
    }
    
    return member.role.hasPermission('ASSIGN_PROJECTS');
  }
  
  // 統計資訊
  getMemberCount(): number {
    return this._members.getCount();
  }
  
  getTeamCount(): number {
    return this._teams.getCount();
  }
  
  getProjectCount(): number {
    return this._projects.getCount();
  }
  
  getActiveProjectCount(): number {
    return this._projects.getActiveCount();
  }
  
  // 領域事件管理
  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }
  
  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }
  
  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }
  
  // 工廠方法
  static create(
    name: string,
    type: string,
    businessLicense: string,
    taxId: string
  ): OrganizationAggregate {
    const orgId = OrganizationId.generate();
    const nameVO = OrganizationName.create(name);
    const typeVO = OrganizationType.create(type);
    const profile = OrganizationProfile.createEmpty();
    const businessInfo = BusinessInfo.create(businessLicense, taxId);
    
    return new OrganizationAggregate(orgId, nameVO, typeVO, profile, businessInfo);
  }
  
  // 重建方法
  static reconstitute(
    id: string,
    name: string,
    type: string,
    profile: OrganizationProfileData,
    businessInfo: BusinessInfoData,
    members: OrganizationMembersData,
    teams: OrganizationTeamsData,
    projects: OrganizationProjectsData,
    status: string,
    createdAt: Date,
    updatedAt: Date
  ): OrganizationAggregate {
    const organization = new OrganizationAggregate(
      OrganizationId.fromString(id),
      OrganizationName.create(name),
      OrganizationType.create(type),
      OrganizationProfile.reconstitute(profile),
      BusinessInfo.reconstitute(businessInfo)
    );
    
    organization._members = OrganizationMembers.reconstitute(members);
    organization._teams = OrganizationTeams.reconstitute(teams);
    organization._projects = OrganizationProjects.reconstitute(projects);
    organization._status = OrganizationStatus.fromString(status);
    organization._createdAt = createdAt;
    organization._updatedAt = updatedAt;
    
    return organization;
  }
}
```

### 值物件定義
```typescript
// 組織 ID 值物件
export class OrganizationId {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static generate(): OrganizationId {
    return new OrganizationId(uuidv4());
  }
  
  static fromString(value: string): OrganizationId {
    if (!value || value.trim().length === 0) {
      throw new DomainException('組織 ID 不能為空');
    }
    return new OrganizationId(value);
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: OrganizationId): boolean {
    return this._value === other._value;
  }
}

// 組織名稱值物件
export class OrganizationName {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static create(value: string): OrganizationName {
    if (!value || value.trim().length < 2) {
      throw new DomainException('組織名稱至少需要 2 個字符');
    }
    
    if (value.trim().length > 100) {
      throw new DomainException('組織名稱不能超過 100 個字符');
    }
    
    return new OrganizationName(value.trim());
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: OrganizationName): boolean {
    return this._value === other._value;
  }
}

// 組織類型值物件
export class OrganizationType {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static create(value: string): OrganizationType {
    const validTypes = ['construction', 'engineering', 'consulting', 'supplier'];
    
    if (!validTypes.includes(value)) {
      throw new DomainException(`無效的組織類型: ${value}`);
    }
    
    return new OrganizationType(value);
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: OrganizationType): boolean {
    return this._value === other._value;
  }
}

// 組織角色值物件
export class OrganizationRole {
  private readonly _value: string;
  private readonly _permissions: string[];
  
  private constructor(value: string, permissions: string[]) {
    this._value = value;
    this._permissions = permissions;
  }
  
  static readonly ADMIN = new OrganizationRole('admin', [
    'MANAGE_MEMBERS', 'CREATE_TEAMS', 'ASSIGN_PROJECTS', 'MANAGE_ORGANIZATION'
  ]);
  
  static readonly MANAGER = new OrganizationRole('manager', [
    'MANAGE_MEMBERS', 'CREATE_TEAMS', 'ASSIGN_PROJECTS'
  ]);
  
  static readonly ENGINEER = new OrganizationRole('engineer', [
    'VIEW_PROJECTS', 'MANAGE_TASKS'
  ]);
  
  static readonly SUPERVISOR = new OrganizationRole('supervisor', [
    'VIEW_PROJECTS', 'MANAGE_TASKS', 'MANAGE_TEAM'
  ]);
  
  static readonly CONTRACTOR = new OrganizationRole('contractor', [
    'VIEW_PROJECTS', 'MANAGE_TASKS'
  ]);
  
  static fromString(value: string): OrganizationRole {
    const validRoles = ['admin', 'manager', 'engineer', 'supervisor', 'contractor'];
    
    if (!validRoles.includes(value)) {
      throw new DomainException(`無效的組織角色: ${value}`);
    }
    
    switch (value) {
      case 'admin': return OrganizationRole.ADMIN;
      case 'manager': return OrganizationRole.MANAGER;
      case 'engineer': return OrganizationRole.ENGINEER;
      case 'supervisor': return OrganizationRole.SUPERVISOR;
      case 'contractor': return OrganizationRole.CONTRACTOR;
      default: throw new DomainException(`無效的組織角色: ${value}`);
    }
  }
  
  get value(): string {
    return this._value;
  }
  
  hasPermission(permission: string): boolean {
    return this._permissions.includes(permission);
  }
  
  equals(other: OrganizationRole): boolean {
    return this._value === other._value;
  }
}

// 組織狀態值物件
export class OrganizationStatus {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static readonly ACTIVE = new OrganizationStatus('active');
  static readonly SUSPENDED = new OrganizationStatus('suspended');
  static readonly DEACTIVATED = new OrganizationStatus('deactivated');
  
  static fromString(value: string): OrganizationStatus {
    const validStatuses = ['active', 'suspended', 'deactivated'];
    
    if (!validStatuses.includes(value)) {
      throw new DomainException(`無效的組織狀態: ${value}`);
    }
    
    return new OrganizationStatus(value);
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: OrganizationStatus): boolean {
    return this._value === other._value;
  }
}
```

### 領域事件定義
```typescript
// 組織建立事件
export class OrganizationCreatedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly organizationName: string,
    public readonly organizationType: string,
    public readonly createdAt: Date
  ) {
    super('OrganizationCreated', new Date());
  }
}

// 成員加入事件
export class MemberAddedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly role: string,
    public readonly addedAt: Date
  ) {
    super('MemberAdded', new Date());
  }
}

// 成員移除事件
export class MemberRemovedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly removedAt: Date
  ) {
    super('MemberRemoved', new Date());
  }
}

// 成員角色變更事件
export class MemberRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly oldRole: string,
    public readonly newRole: string,
    public readonly changedAt: Date
  ) {
    super('MemberRoleChanged', new Date());
  }
}

// 團隊建立事件
export class TeamCreatedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly teamId: string,
    public readonly teamName: string,
    public readonly createdAt: Date
  ) {
    super('TeamCreated', new Date());
  }
}

// 成員分配給團隊事件
export class MemberAssignedToTeamEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly teamId: string,
    public readonly role: string,
    public readonly assignedAt: Date
  ) {
    super('MemberAssignedToTeam', new Date());
  }
}

// 專案分配給團隊事件
export class ProjectAssignedToTeamEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly projectId: string,
    public readonly teamId: string,
    public readonly assignedAt: Date
  ) {
    super('ProjectAssignedToTeam', new Date());
  }
}

// 組織停用事件
export class OrganizationSuspendedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly reason: string,
    public readonly suspendedAt: Date
  ) {
    super('OrganizationSuspended', new Date());
  }
}
```

## 業務規則

### 1. 不變性規則
- 組織 ID 一旦建立就不能變更
- 組織名稱必須符合長度要求
- 組織類型必須是有效值
- 營業執照號碼必須唯一

### 2. 業務規則
- 組織成員不能重複加入
- 移除成員前必須檢查是否有未完成的專案
- 只有管理員可以變更成員角色
- 停用的組織不能建立新專案

### 3. 一致性規則
- 組織狀態變更必須發布事件
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
