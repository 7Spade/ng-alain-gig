# User 聚合根 (User Aggregate)

## 概述

User 聚合根是營建管理系統中用戶領域的核心聚合，負責管理用戶的完整生命週期、業務規則和領域事件。採用 Domain-Driven Design 原則，封裝用戶相關的所有業務邏輯。

## 聚合根設計

### 1. 核心概念
- **聚合邊界**: 用戶身份、個人資料、專業資訊、社交關係、成就系統
- **不變性**: 確保用戶資料的業務規則一致性
- **領域事件**: 發布用戶相關的領域事件
- **封裝性**: 封裝用戶的內部狀態和行為

### 2. 聚合邊界
- **用戶身份**: ID、電子郵件、密碼、狀態
- **個人資料**: 姓名、頭像、聯絡資訊、偏好設定
- **專業資訊**: 證照、技能、經驗、教育背景
- **社交功能**: 追蹤關係、星標專案、成就
- **團隊參與**: 組織成員資格、團隊角色

## 實作範例

### User 聚合根
```typescript
export class UserAggregate {
  private readonly _id: UserId;
  private _email: Email;
  private _password: Password;
  private _profile: UserProfile;
  private _professionalInfo: ProfessionalInfo;
  private _socialInfo: SocialInfo;
  private _achievements: UserAchievements;
  private _teamMemberships: TeamMemberships;
  private _status: UserStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt?: Date;
  
  private readonly _domainEvents: DomainEvent[] = [];
  
  constructor(
    id: UserId,
    email: Email,
    password: Password,
    profile: UserProfile
  ) {
    this._id = id;
    this._email = email;
    this._password = password;
    this._profile = profile;
    this._professionalInfo = ProfessionalInfo.createEmpty();
    this._socialInfo = SocialInfo.createEmpty();
    this._achievements = UserAchievements.createEmpty();
    this._teamMemberships = TeamMemberships.createEmpty();
    this._status = UserStatus.ACTIVE;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    
    // 發布用戶建立事件
    this.addDomainEvent(new UserRegisteredEvent(
      this._id.value,
      this._email.value,
      this._createdAt
    ));
  }
  
  // 身份識別
  get id(): UserId {
    return this._id;
  }
  
  get email(): Email {
    return this._email;
  }
  
  get status(): UserStatus {
    return this._status;
  }
  
  // 用戶管理
  updateProfile(profileData: Partial<UserProfileData>): void {
    this._profile.update(profileData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new UserProfileUpdatedEvent(
      this._id.value,
      Object.keys(profileData),
      this._updatedAt
    ));
  }
  
  changePassword(currentPassword: string, newPassword: string): void {
    if (!this._password.verify(currentPassword)) {
      throw new DomainException('當前密碼不正確');
    }
    
    this._password = Password.create(newPassword);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new PasswordChangedEvent(
      this._id.value,
      this._updatedAt
    ));
  }
  
  // 專業資訊管理
  addProfessionalLicense(licenseData: ProfessionalLicenseData): void {
    this._professionalInfo.addLicense(licenseData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProfessionalLicenseAddedEvent(
      this._id.value,
      licenseData.type,
      licenseData.number,
      this._updatedAt
    ));
  }
  
  updateProfessionalInfo(infoData: Partial<ProfessionalInfoData>): void {
    this._professionalInfo.update(infoData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProfessionalInfoUpdatedEvent(
      this._id.value,
      Object.keys(infoData),
      this._updatedAt
    ));
  }
  
  // 社交功能
  followUser(targetUserId: UserId): void {
    if (this._id.equals(targetUserId)) {
      throw new DomainException('不能追蹤自己');
    }
    
    this._socialInfo.followUser(targetUserId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new UserFollowedEvent(
      this._id.value,
      targetUserId.value,
      this._updatedAt
    ));
  }
  
  unfollowUser(targetUserId: UserId): void {
    if (!this._socialInfo.isFollowing(targetUserId)) {
      throw new DomainException('未追蹤此用戶');
    }
    
    this._socialInfo.unfollowUser(targetUserId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new UserUnfollowedEvent(
      this._id.value,
      targetUserId.value,
      this._updatedAt
    ));
  }
  
  starProject(projectId: ProjectId): void {
    this._socialInfo.starProject(projectId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectStarredEvent(
      this._id.value,
      projectId.value,
      this._updatedAt
    ));
  }
  
  unstarProject(projectId: ProjectId): void {
    if (!this._socialInfo.hasStarredProject(projectId)) {
      throw new DomainException('未星標此專案');
    }
    
    this._socialInfo.unstarProject(projectId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectUnstarredEvent(
      this._id.value,
      projectId.value,
      this._updatedAt
    ));
  }
  
  // 成就管理
  unlockAchievement(achievementId: AchievementId): void {
    if (this._achievements.hasAchievement(achievementId)) {
      throw new DomainException('已擁有此成就');
    }
    
    this._achievements.unlockAchievement(achievementId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new AchievementUnlockedEvent(
      this._id.value,
      achievementId.value,
      this._updatedAt
    ));
  }
  
  // 團隊參與
  joinTeam(teamId: TeamId, organizationId: OrganizationId, role: TeamRole): void {
    if (this._teamMemberships.isMemberOfTeam(teamId)) {
      throw new DomainException('已是此團隊成員');
    }
    
    this._teamMemberships.joinTeam(teamId, organizationId, role);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new TeamJoinedEvent(
      this._id.value,
      teamId.value,
      organizationId.value,
      role.value,
      this._updatedAt
    ));
  }
  
  leaveTeam(teamId: TeamId): void {
    if (!this._teamMemberships.isMemberOfTeam(teamId)) {
      throw new DomainException('不是此團隊成員');
    }
    
    // 檢查是否有未完成的任務
    if (this.hasActiveTasksInTeam(teamId)) {
      throw new DomainException('還有未完成的任務，無法離開團隊');
    }
    
    this._teamMemberships.leaveTeam(teamId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new TeamLeftEvent(
      this._id.value,
      teamId.value,
      this._updatedAt
    ));
  }
  
  // 用戶狀態管理
  activate(): void {
    if (this._status === UserStatus.ACTIVE) {
      throw new DomainException('用戶已經是啟用狀態');
    }
    
    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new UserActivatedEvent(
      this._id.value,
      this._updatedAt
    ));
  }
  
  suspend(reason: string): void {
    if (this._status === UserStatus.SUSPENDED) {
      throw new DomainException('用戶已經被停用');
    }
    
    this._status = UserStatus.SUSPENDED;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new UserSuspendedEvent(
      this._id.value,
      reason,
      this._updatedAt
    ));
  }
  
  deactivate(): void {
    if (this._status === UserStatus.DEACTIVATED) {
      throw new DomainException('用戶已經被停用');
    }
    
    // 檢查是否有未完成的專案或任務
    if (this.hasActiveProjectsOrTasks()) {
      throw new DomainException('還有未完成的專案或任務，無法停用帳戶');
    }
    
    this._status = UserStatus.DEACTIVATED;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new UserDeactivatedEvent(
      this._id.value,
      this._updatedAt
    ));
  }
  
  // 登入管理
  recordLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
    
    this.addDomainEvent(new UserLoggedInEvent(
      this._id.value,
      this._lastLoginAt
    ));
  }
  
  // 業務規則檢查
  private hasActiveTasksInTeam(teamId: TeamId): boolean {
    // 這裡應該查詢任務服務，檢查用戶在該團隊中是否有未完成的任務
    // 由於這是聚合根，我們不應該直接依賴外部服務
    // 應該通過領域事件或應用服務來處理
    return false; // 簡化實作
  }
  
  private hasActiveProjectsOrTasks(): boolean {
    // 檢查用戶是否有未完成的專案或任務
    return false; // 簡化實作
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
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): UserAggregate {
    const userId = UserId.generate();
    const emailVO = Email.create(email);
    const passwordVO = Password.create(password);
    const profile = UserProfile.create(firstName, lastName);
    
    return new UserAggregate(userId, emailVO, passwordVO, profile);
  }
  
  // 重建方法
  static reconstitute(
    id: string,
    email: string,
    password: string,
    profile: UserProfileData,
    professionalInfo: ProfessionalInfoData,
    socialInfo: SocialInfoData,
    achievements: UserAchievementsData,
    teamMemberships: TeamMembershipsData,
    status: string,
    createdAt: Date,
    updatedAt: Date,
    lastLoginAt?: Date
  ): UserAggregate {
    const user = new UserAggregate(
      UserId.fromString(id),
      Email.create(email),
      Password.fromHash(password),
      UserProfile.reconstitute(profile)
    );
    
    user._professionalInfo = ProfessionalInfo.reconstitute(professionalInfo);
    user._socialInfo = SocialInfo.reconstitute(socialInfo);
    user._achievements = UserAchievements.reconstitute(achievements);
    user._teamMemberships = TeamMemberships.reconstitute(teamMemberships);
    user._status = UserStatus.fromString(status);
    user._createdAt = createdAt;
    user._updatedAt = updatedAt;
    user._lastLoginAt = lastLoginAt;
    
    return user;
  }
}
```

### 值物件定義
```typescript
// 用戶 ID 值物件
export class UserId {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static generate(): UserId {
    return new UserId(uuidv4());
  }
  
  static fromString(value: string): UserId {
    if (!value || value.trim().length === 0) {
      throw new DomainException('用戶 ID 不能為空');
    }
    return new UserId(value);
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: UserId): boolean {
    return this._value === other._value;
  }
}

// 電子郵件值物件
export class Email {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static create(value: string): Email {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!value || value.trim().length === 0) {
      throw new DomainException('電子郵件不能為空');
    }
    
    if (!emailRegex.test(value)) {
      throw new DomainException('電子郵件格式不正確');
    }
    
    return new Email(value.toLowerCase().trim());
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: Email): boolean {
    return this._value === other._value;
  }
}

// 密碼值物件
export class Password {
  private readonly _hash: string;
  
  private constructor(hash: string) {
    this._hash = hash;
  }
  
  static create(password: string): Password {
    if (!password || password.length < 8) {
      throw new DomainException('密碼至少需要 8 個字符');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new DomainException('密碼必須包含大小寫字母和數字');
    }
    
    const hash = bcrypt.hashSync(password, 10);
    return new Password(hash);
  }
  
  static fromHash(hash: string): Password {
    return new Password(hash);
  }
  
  verify(password: string): boolean {
    return bcrypt.compareSync(password, this._hash);
  }
  
  get hash(): string {
    return this._hash;
  }
}

// 用戶狀態值物件
export class UserStatus {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static readonly ACTIVE = new UserStatus('active');
  static readonly INACTIVE = new UserStatus('inactive');
  static readonly SUSPENDED = new UserStatus('suspended');
  static readonly DEACTIVATED = new UserStatus('deactivated');
  
  static fromString(value: string): UserStatus {
    const validStatuses = ['active', 'inactive', 'suspended', 'deactivated'];
    
    if (!validStatuses.includes(value)) {
      throw new DomainException(`無效的用戶狀態: ${value}`);
    }
    
    return new UserStatus(value);
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: UserStatus): boolean {
    return this._value === other._value;
  }
}
```

### 領域事件定義
```typescript
// 用戶註冊事件
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly registeredAt: Date
  ) {
    super('UserRegistered', new Date());
  }
}

// 用戶登入事件
export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly loggedInAt: Date
  ) {
    super('UserLoggedIn', new Date());
  }
}

// 密碼變更事件
export class PasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly changedAt: Date
  ) {
    super('PasswordChanged', new Date());
  }
}

// 用戶追蹤事件
export class UserFollowedEvent extends DomainEvent {
  constructor(
    public readonly followerId: string,
    public readonly followeeId: string,
    public readonly followedAt: Date
  ) {
    super('UserFollowed', new Date());
  }
}

// 專案星標事件
export class ProjectStarredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly projectId: string,
    public readonly starredAt: Date
  ) {
    super('ProjectStarred', new Date());
  }
}

// 成就解鎖事件
export class AchievementUnlockedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly achievementId: string,
    public readonly unlockedAt: Date
  ) {
    super('AchievementUnlocked', new Date());
  }
}

// 團隊加入事件
export class TeamJoinedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly teamId: string,
    public readonly organizationId: string,
    public readonly role: string,
    public readonly joinedAt: Date
  ) {
    super('TeamJoined', new Date());
  }
}
```

## 業務規則

### 1. 不變性規則
- 用戶 ID 一旦建立就不能變更
- 電子郵件必須是有效格式且唯一
- 密碼必須符合安全要求
- 用戶狀態轉換必須遵循業務規則

### 2. 業務規則
- 用戶不能追蹤自己
- 離開團隊前必須完成所有任務
- 停用帳戶前必須完成所有專案和任務
- 密碼變更必須驗證當前密碼

### 3. 一致性規則
- 所有業務操作必須更新時間戳
- 狀態變更必須發布領域事件
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
