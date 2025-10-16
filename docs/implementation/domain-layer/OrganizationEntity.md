# OrganizationEntity (組織聚合根)

## 概述
OrganizationEntity 是組織領域的聚合根，代表營造公司、建設公司等組織實體。使用 DDD (Domain-Driven Design) 模式設計，包含組織的基本資訊、成員管理、團隊管理等核心業務邏輯。

## 實體定義

### 1. 基本結構
```typescript
import { Entity, ValueObject } from '@domain/base';
import { OrganizationId } from '@domain/value-objects/organization-id.value-object';
import { OrganizationProfile } from '@domain/value-objects/organization-profile.value-object';
import { OrganizationMember } from '@domain/value-objects/organization-member.value-object';
import { Team } from '@domain/value-objects/team.value-object';
import { License } from '@domain/value-objects/license.value-object';

export class OrganizationEntity extends Entity<OrganizationId> {
  private _profile: OrganizationProfile;
  private _members: Map<string, OrganizationMember>;
  private _teams: Map<string, Team>;
  private _licenses: License[];
  private _status: OrganizationStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: OrganizationId,
    profile: OrganizationProfile,
    licenses: License[] = []
  ) {
    super(id);
    this._profile = profile;
    this._members = new Map();
    this._teams = new Map();
    this._licenses = licenses;
    this._status = OrganizationStatus.ACTIVE;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }
}
```

### 2. 組織狀態列舉
```typescript
export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}
```

## 核心業務方法

### 1. 組織資訊管理
```typescript
export class OrganizationEntity extends Entity<OrganizationId> {
  /**
   * 更新組織基本資訊
   * @param profile 新的組織資訊
   */
  updateProfile(profile: OrganizationProfile): void {
    this.validateProfileUpdate(profile);
    this._profile = profile;
    this._updatedAt = new Date();
    this.addDomainEvent(new OrganizationProfileUpdatedEvent(this.id, profile));
  }

  /**
   * 驗證組織資訊更新
   * @param profile 組織資訊
   */
  private validateProfileUpdate(profile: OrganizationProfile): void {
    if (!profile.name || profile.name.trim().length === 0) {
      throw new DomainError('組織名稱不能為空');
    }
    
    if (profile.name.length > 100) {
      throw new DomainError('組織名稱長度不能超過 100 個字元');
    }
    
    if (profile.taxId && !this.isValidTaxId(profile.taxId)) {
      throw new DomainError('統一編號格式不正確');
    }
  }

  /**
   * 取得組織資訊
   */
  get profile(): OrganizationProfile {
    return this._profile;
  }

  /**
   * 取得組織狀態
   */
  get status(): OrganizationStatus {
    return this._status;
  }
}
```

### 2. 成員管理
```typescript
export class OrganizationEntity extends Entity<OrganizationId> {
  /**
   * 新增組織成員
   * @param member 成員資訊
   */
  addMember(member: OrganizationMember): void {
    this.validateMemberAddition(member);
    
    if (this._members.has(member.userId.value)) {
      throw new DomainError('成員已存在');
    }
    
    this._members.set(member.userId.value, member);
    this._updatedAt = new Date();
    this.addDomainEvent(new MemberAddedEvent(this.id, member));
  }

  /**
   * 移除組織成員
   * @param userId 使用者 ID
   */
  removeMember(userId: string): void {
    if (!this._members.has(userId)) {
      throw new DomainError('成員不存在');
    }
    
    const member = this._members.get(userId)!;
    this.validateMemberRemoval(member);
    
    this._members.delete(userId);
    this._updatedAt = new Date();
    this.addDomainEvent(new MemberRemovedEvent(this.id, userId));
  }

  /**
   * 更新成員角色
   * @param userId 使用者 ID
   * @param newRole 新角色
   */
  updateMemberRole(userId: string, newRole: OrganizationRole): void {
    const member = this._members.get(userId);
    if (!member) {
      throw new DomainError('成員不存在');
    }
    
    this.validateRoleUpdate(member, newRole);
    
    const updatedMember = member.updateRole(newRole);
    this._members.set(userId, updatedMember);
    this._updatedAt = new Date();
    this.addDomainEvent(new MemberRoleUpdatedEvent(this.id, userId, newRole));
  }

  /**
   * 驗證成員新增
   * @param member 成員資訊
   */
  private validateMemberAddition(member: OrganizationMember): void {
    if (this._status !== OrganizationStatus.ACTIVE) {
      throw new DomainError('組織狀態不允許新增成員');
    }
    
    if (this._members.size >= 1000) {
      throw new DomainError('組織成員數量已達上限');
    }
  }

  /**
   * 驗證成員移除
   * @param member 成員資訊
   */
  private validateMemberRemoval(member: OrganizationMember): void {
    if (member.role === OrganizationRole.OWNER) {
      throw new DomainError('無法移除組織擁有者');
    }
    
    // 檢查是否為最後一個管理員
    const adminCount = Array.from(this._members.values())
      .filter(m => m.role === OrganizationRole.ADMIN).length;
    
    if (member.role === OrganizationRole.ADMIN && adminCount === 1) {
      throw new DomainError('組織至少需要一個管理員');
    }
  }

  /**
   * 驗證角色更新
   * @param member 成員資訊
   * @param newRole 新角色
   */
  private validateRoleUpdate(member: OrganizationMember, newRole: OrganizationRole): void {
    if (member.role === OrganizationRole.OWNER) {
      throw new DomainError('無法變更組織擁有者角色');
    }
    
    if (newRole === OrganizationRole.OWNER) {
      throw new DomainError('無法直接設定為組織擁有者');
    }
  }

  /**
   * 取得所有成員
   */
  get members(): OrganizationMember[] {
    return Array.from(this._members.values());
  }

  /**
   * 根據角色取得成員
   * @param role 角色
   */
  getMembersByRole(role: OrganizationRole): OrganizationMember[] {
    return this.members.filter(member => member.role === role);
  }

  /**
   * 檢查使用者是否為成員
   * @param userId 使用者 ID
   */
  isMember(userId: string): boolean {
    return this._members.has(userId);
  }

  /**
   * 取得成員角色
   * @param userId 使用者 ID
   */
  getMemberRole(userId: string): OrganizationRole | null {
    const member = this._members.get(userId);
    return member ? member.role : null;
  }
}
```

### 3. 團隊管理
```typescript
export class OrganizationEntity extends Entity<OrganizationId> {
  /**
   * 建立團隊
   * @param team 團隊資訊
   */
  createTeam(team: Team): void {
    this.validateTeamCreation(team);
    
    if (this._teams.has(team.id.value)) {
      throw new DomainError('團隊已存在');
    }
    
    this._teams.set(team.id.value, team);
    this._updatedAt = new Date();
    this.addDomainEvent(new TeamCreatedEvent(this.id, team));
  }

  /**
   * 解散團隊
   * @param teamId 團隊 ID
   */
  dissolveTeam(teamId: string): void {
    const team = this._teams.get(teamId);
    if (!team) {
      throw new DomainError('團隊不存在');
    }
    
    this.validateTeamDissolution(team);
    
    this._teams.delete(teamId);
    this._updatedAt = new Date();
    this.addDomainEvent(new TeamDissolvedEvent(this.id, teamId));
  }

  /**
   * 將成員加入團隊
   * @param teamId 團隊 ID
   * @param userId 使用者 ID
   * @param role 團隊角色
   */
  addMemberToTeam(teamId: string, userId: string, role: TeamRole): void {
    const team = this._teams.get(teamId);
    if (!team) {
      throw new DomainError('團隊不存在');
    }
    
    const member = this._members.get(userId);
    if (!member) {
      throw new DomainError('成員不存在');
    }
    
    this.validateMemberTeamAssignment(member, team, role);
    
    const updatedTeam = team.addMember(userId, role);
    this._teams.set(teamId, updatedTeam);
    this._updatedAt = new Date();
    this.addDomainEvent(new MemberAddedToTeamEvent(this.id, teamId, userId, role));
  }

  /**
   * 從團隊移除成員
   * @param teamId 團隊 ID
   * @param userId 使用者 ID
   */
  removeMemberFromTeam(teamId: string, userId: string): void {
    const team = this._teams.get(teamId);
    if (!team) {
      throw new DomainError('團隊不存在');
    }
    
    const updatedTeam = team.removeMember(userId);
    this._teams.set(teamId, updatedTeam);
    this._updatedAt = new Date();
    this.addDomainEvent(new MemberRemovedFromTeamEvent(this.id, teamId, userId));
  }

  /**
   * 驗證團隊建立
   * @param team 團隊資訊
   */
  private validateTeamCreation(team: Team): void {
    if (this._status !== OrganizationStatus.ACTIVE) {
      throw new DomainError('組織狀態不允許建立團隊');
    }
    
    if (this._teams.size >= 50) {
      throw new DomainError('組織團隊數量已達上限');
    }
  }

  /**
   * 驗證團隊解散
   * @param team 團隊資訊
   */
  private validateTeamDissolution(team: Team): void {
    if (team.hasActiveProjects()) {
      throw new DomainError('團隊有進行中的專案，無法解散');
    }
  }

  /**
   * 驗證成員團隊分配
   * @param member 成員資訊
   * @param team 團隊資訊
   * @param role 團隊角色
   */
  private validateMemberTeamAssignment(
    member: OrganizationMember, 
    team: Team, 
    role: TeamRole
  ): void {
    if (member.role === OrganizationRole.GUEST) {
      throw new DomainError('訪客無法加入團隊');
    }
    
    if (team.isMember(userId)) {
      throw new DomainError('成員已在團隊中');
    }
  }

  /**
   * 取得所有團隊
   */
  get teams(): Team[] {
    return Array.from(this._teams.values());
  }

  /**
   * 取得團隊
   * @param teamId 團隊 ID
   */
  getTeam(teamId: string): Team | null {
    return this._teams.get(teamId) || null;
  }
}
```

### 4. 證照管理
```typescript
export class OrganizationEntity extends Entity<OrganizationId> {
  /**
   * 新增證照
   * @param license 證照資訊
   */
  addLicense(license: License): void {
    this.validateLicenseAddition(license);
    
    if (this._licenses.some(l => l.type === license.type && l.number === license.number)) {
      throw new DomainError('證照已存在');
    }
    
    this._licenses.push(license);
    this._updatedAt = new Date();
    this.addDomainEvent(new LicenseAddedEvent(this.id, license));
  }

  /**
   * 移除證照
   * @param licenseId 證照 ID
   */
  removeLicense(licenseId: string): void {
    const index = this._licenses.findIndex(l => l.id === licenseId);
    if (index === -1) {
      throw new DomainError('證照不存在');
    }
    
    this._licenses.splice(index, 1);
    this._updatedAt = new Date();
    this.addDomainEvent(new LicenseRemovedEvent(this.id, licenseId));
  }

  /**
   * 更新證照
   * @param licenseId 證照 ID
   * @param license 新的證照資訊
   */
  updateLicense(licenseId: string, license: License): void {
    const index = this._licenses.findIndex(l => l.id === licenseId);
    if (index === -1) {
      throw new DomainError('證照不存在');
    }
    
    this.validateLicenseUpdate(license);
    
    this._licenses[index] = license;
    this._updatedAt = new Date();
    this.addDomainEvent(new LicenseUpdatedEvent(this.id, licenseId, license));
  }

  /**
   * 驗證證照新增
   * @param license 證照資訊
   */
  private validateLicenseAddition(license: License): void {
    if (this._status !== OrganizationStatus.ACTIVE) {
      throw new DomainError('組織狀態不允許新增證照');
    }
    
    if (license.expiryDate < new Date()) {
      throw new DomainError('證照已過期');
    }
  }

  /**
   * 驗證證照更新
   * @param license 證照資訊
   */
  private validateLicenseUpdate(license: License): void {
    if (license.expiryDate < new Date()) {
      throw new DomainError('證照已過期');
    }
  }

  /**
   * 取得所有證照
   */
  get licenses(): License[] {
    return [...this._licenses];
  }

  /**
   * 取得有效證照
   */
  getValidLicenses(): License[] {
    const now = new Date();
    return this._licenses.filter(license => license.expiryDate > now);
  }

  /**
   * 取得即將過期的證照
   * @param days 天數
   */
  getExpiringLicenses(days: number = 30): License[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this._licenses.filter(license => 
      license.expiryDate <= futureDate && license.expiryDate > new Date()
    );
  }
}
```

### 5. 狀態管理
```typescript
export class OrganizationEntity extends Entity<OrganizationId> {
  /**
   * 啟用組織
   */
  activate(): void {
    if (this._status === OrganizationStatus.ACTIVE) {
      throw new DomainError('組織已啟用');
    }
    
    this._status = OrganizationStatus.ACTIVE;
    this._updatedAt = new Date();
    this.addDomainEvent(new OrganizationActivatedEvent(this.id));
  }

  /**
   * 停用組織
   */
  deactivate(): void {
    if (this._status === OrganizationStatus.INACTIVE) {
      throw new DomainError('組織已停用');
    }
    
    this.validateDeactivation();
    
    this._status = OrganizationStatus.INACTIVE;
    this._updatedAt = new Date();
    this.addDomainEvent(new OrganizationDeactivatedEvent(this.id));
  }

  /**
   * 暫停組織
   * @param reason 暫停原因
   */
  suspend(reason: string): void {
    if (this._status === OrganizationStatus.SUSPENDED) {
      throw new DomainError('組織已暫停');
    }
    
    this._status = OrganizationStatus.SUSPENDED;
    this._updatedAt = new Date();
    this.addDomainEvent(new OrganizationSuspendedEvent(this.id, reason));
  }

  /**
   * 驗證停用
   */
  private validateDeactivation(): void {
    const activeProjects = this.getActiveProjects();
    if (activeProjects.length > 0) {
      throw new DomainError('組織有進行中的專案，無法停用');
    }
  }

  /**
   * 取得進行中的專案
   */
  private getActiveProjects(): string[] {
    // 這裡應該從專案聚合根取得
    // 暫時返回空陣列
    return [];
  }
}
```

## 領域事件

### 1. 組織事件
```typescript
export class OrganizationProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly profile: OrganizationProfile
  ) {
    super();
  }
}

export class MemberAddedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly member: OrganizationMember
  ) {
    super();
  }
}

export class MemberRemovedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: string
  ) {
    super();
  }
}

export class TeamCreatedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly team: Team
  ) {
    super();
  }
}

export class LicenseAddedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly license: License
  ) {
    super();
  }
}
```

## 工廠方法

### 1. 建立組織
```typescript
export class OrganizationFactory {
  /**
   * 建立新組織
   * @param profile 組織資訊
   * @param ownerId 擁有者 ID
   * @param licenses 證照清單
   */
  static create(
    profile: OrganizationProfile,
    ownerId: string,
    licenses: License[] = []
  ): OrganizationEntity {
    const organizationId = OrganizationId.generate();
    const organization = new OrganizationEntity(organizationId, profile, licenses);
    
    // 新增擁有者
    const owner = OrganizationMember.create(
      UserId.fromString(ownerId),
      OrganizationRole.OWNER,
      new Date()
    );
    organization.addMember(owner);
    
    return organization;
  }

  /**
   * 重建組織（用於持久化）
   * @param data 組織資料
   */
  static reconstitute(data: OrganizationData): OrganizationEntity {
    const organizationId = OrganizationId.fromString(data.id);
    const profile = OrganizationProfile.fromData(data.profile);
    const licenses = data.licenses.map(licenseData => License.fromData(licenseData));
    
    const organization = new OrganizationEntity(organizationId, profile, licenses);
    
    // 重建成員
    data.members.forEach(memberData => {
      const member = OrganizationMember.fromData(memberData);
      organization._members.set(member.userId.value, member);
    });
    
    // 重建團隊
    data.teams.forEach(teamData => {
      const team = Team.fromData(teamData);
      organization._teams.set(team.id.value, team);
    });
    
    organization._status = data.status;
    organization._createdAt = data.createdAt;
    organization._updatedAt = data.updatedAt;
    
    return organization;
  }
}
```

## 使用範例

### 1. 建立組織
```typescript
const profile = new OrganizationProfile(
  'ABC 建設公司',
  '12345678',
  '台北市信義區信義路五段7號',
  '02-2345-6789',
  'contact@abc-construction.com'
);

const licenses = [
  new License(
    'construction-license',
    '營造業登記證',
    'A123456789',
    new Date('2025-12-31')
  )
];

const organization = OrganizationFactory.create(
  profile,
  'user-123',
  licenses
);
```

### 2. 管理成員
```typescript
// 新增成員
const member = OrganizationMember.create(
  UserId.fromString('user-456'),
  OrganizationRole.ENGINEER,
  new Date()
);
organization.addMember(member);

// 更新成員角色
organization.updateMemberRole('user-456', OrganizationRole.MANAGER);

// 移除成員
organization.removeMember('user-456');
```

### 3. 管理團隊
```typescript
// 建立團隊
const team = new Team(
  TeamId.generate(),
  '工程部',
  '負責工程規劃與執行',
  []
);
organization.createTeam(team);

// 將成員加入團隊
organization.addMemberToTeam(team.id.value, 'user-456', TeamRole.MEMBER);
```

## 相關資源
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Aggregate Pattern](https://martinfowler.com/bliki/DDD_Aggregate.html)
- [Domain Events](https://martinfowler.com/eaaDev/DomainEvent.html)