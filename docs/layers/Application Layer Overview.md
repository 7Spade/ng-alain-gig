# Application Layer - 應用層設計概覽

## 概述
應用層負責協調領域對象和外部服務，處理應用用例，提供統一的應用服務介面。

## 應用服務設計

### 1. 用戶應用服務
```typescript
@Injectable()
export class UserApplicationService {
  constructor(
    private userDomainService: UserDomainService,
    private userRepository: UserRepository,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  // 用戶註冊用例
  async registerUser(registrationData: UserRegistrationData): Promise<UserProfile> {
    // 1. 驗證註冊資料
    this.validateRegistrationData(registrationData);
    
    // 2. 檢查電子郵件唯一性
    const existingUser = await this.userRepository.findByEmail(registrationData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    // 3. 建立用戶聚合
    const userAggregate = this.userDomainService.registerUser(registrationData);
    
    // 4. 儲存用戶資料
    await this.userRepository.save(userAggregate);
    
    // 5. 發送歡迎通知
    await this.notificationService.sendWelcomeNotification(userAggregate.id);
    
    // 6. 返回用戶資料
    return userAggregate.toProfile();
  }

  // 用戶登入用例
  async loginUser(credentials: LoginCredentials): Promise<AuthResult> {
    // 1. Firebase 認證
    const firebaseUser = await this.authService.signInWithEmail(credentials);
    
    // 2. 載入用戶資料
    const userProfile = await this.userRepository.findByEmail(firebaseUser.email);
    if (!userProfile) {
      throw new Error('User not found');
    }
    
    // 3. 建立認證會話
    const authResult = await this.authService.createSession(userProfile, firebaseUser.idToken);
    
    // 4. 記錄登入事件
    await this.userRepository.recordLoginEvent(userProfile.id, new Date());
    
    return authResult;
  }

  // 更新用戶資料用例
  async updateUserProfile(userId: string, profileData: UserProfileData): Promise<void> {
    // 1. 載入用戶聚合
    const userAggregate = await this.userRepository.findById(userId);
    if (!userAggregate) {
      throw new Error('User not found');
    }
    
    // 2. 更新用戶資料
    userAggregate.updateProfile(profileData);
    
    // 3. 儲存變更
    await this.userRepository.save(userAggregate);
    
    // 4. 發送更新通知
    await this.notificationService.sendProfileUpdateNotification(userId);
  }
}
```

### 2. 專案應用服務
```typescript
@Injectable()
export class ProjectApplicationService {
  constructor(
    private projectDomainService: ProjectDomainService,
    private projectRepository: ProjectRepository,
    private userRepository: UserRepository,
    private organizationRepository: OrganizationRepository,
    private notificationService: NotificationService
  ) {}

  // 建立專案用例
  async createProject(projectData: ProjectCreationData, userId: string): Promise<ProjectProfile> {
    // 1. 驗證用戶權限
    const user = await this.userRepository.findById(userId);
    if (!user || !user.canCreateProject()) {
      throw new Error('Insufficient permissions');
    }
    
    // 2. 驗證組織權限
    const organization = await this.organizationRepository.findById(projectData.organizationId);
    if (!organization || !organization.hasMember(userId)) {
      throw new Error('Organization access denied');
    }
    
    // 3. 建立專案聚合
    const projectAggregate = this.projectDomainService.createProject(projectData, userId);
    
    // 4. 儲存專案資料
    await this.projectRepository.save(projectAggregate);
    
    // 5. 發送專案建立通知
    await this.notificationService.sendProjectCreatedNotification(projectAggregate.id, userId);
    
    // 6. 返回專案資料
    return projectAggregate.toProfile();
  }

  // 分配任務用例
  async assignTask(taskId: string, assigneeId: string, assignerId: string): Promise<void> {
    // 1. 載入專案聚合
    const projectAggregate = await this.projectRepository.findByTaskId(taskId);
    if (!projectAggregate) {
      throw new Error('Project not found');
    }
    
    // 2. 驗證分配者權限
    const assigner = await this.userRepository.findById(assignerId);
    if (!assigner || !projectAggregate.canManageTasks(assignerId)) {
      throw new Error('Insufficient permissions to assign tasks');
    }
    
    // 3. 驗證被分配者權限
    const assignee = await this.userRepository.findById(assigneeId);
    if (!assignee || !projectAggregate.hasMember(assigneeId)) {
      throw new Error('Assignee is not a project member');
    }
    
    // 4. 分配任務
    this.projectDomainService.assignTask(taskId, assigneeId, assignerId);
    
    // 5. 儲存變更
    await this.projectRepository.save(projectAggregate);
    
    // 6. 發送任務分配通知
    await this.notificationService.sendTaskAssignedNotification(taskId, assigneeId);
  }

  // 更新專案狀態用例
  async updateProjectStatus(projectId: string, status: ProjectStatus, userId: string): Promise<void> {
    // 1. 載入專案聚合
    const projectAggregate = await this.projectRepository.findById(projectId);
    if (!projectAggregate) {
      throw new Error('Project not found');
    }
    
    // 2. 驗證用戶權限
    const user = await this.userRepository.findById(userId);
    if (!user || !projectAggregate.canModifyStatus(userId)) {
      throw new Error('Insufficient permissions');
    }
    
    // 3. 更新專案狀態
    projectAggregate.updateStatus(status);
    
    // 4. 儲存變更
    await this.projectRepository.save(projectAggregate);
    
    // 5. 發送狀態變更通知
    await this.notificationService.sendProjectStatusChangedNotification(projectId, status);
  }
}
```

### 3. 組織應用服務
```typescript
@Injectable()
export class OrganizationApplicationService {
  constructor(
    private organizationDomainService: OrganizationDomainService,
    private organizationRepository: OrganizationRepository,
    private userRepository: UserRepository,
    private notificationService: NotificationService
  ) {}

  // 建立組織用例
  async createOrganization(orgData: OrganizationCreationData, userId: string): Promise<OrganizationProfile> {
    // 1. 驗證用戶權限
    const user = await this.userRepository.findById(userId);
    if (!user || !user.canCreateOrganization()) {
      throw new Error('Insufficient permissions');
    }
    
    // 2. 建立組織聚合
    const organizationAggregate = this.organizationDomainService.createOrganization(orgData, userId);
    
    // 3. 儲存組織資料
    await this.organizationRepository.save(organizationAggregate);
    
    // 4. 發送組織建立通知
    await this.notificationService.sendOrganizationCreatedNotification(organizationAggregate.id, userId);
    
    // 5. 返回組織資料
    return organizationAggregate.toProfile();
  }

  // 邀請成員用例
  async inviteMember(organizationId: string, email: string, role: OrganizationRole, inviterId: string): Promise<void> {
    // 1. 載入組織聚合
    const organizationAggregate = await this.organizationRepository.findById(organizationId);
    if (!organizationAggregate) {
      throw new Error('Organization not found');
    }
    
    // 2. 驗證邀請者權限
    const inviter = await this.userRepository.findById(inviterId);
    if (!inviter || !organizationAggregate.canInviteMembers(inviterId)) {
      throw new Error('Insufficient permissions');
    }
    
    // 3. 檢查用戶是否存在
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // 4. 邀請成員
    organizationAggregate.inviteMember(user.id, role);
    
    // 5. 儲存變更
    await this.organizationRepository.save(organizationAggregate);
    
    // 6. 發送邀請通知
    await this.notificationService.sendMemberInvitationNotification(email, organizationId, role);
  }
}
```

## 應用服務設計原則

### 1. 單一職責
- 每個應用服務專注於特定的業務領域
- 服務方法對應具體的業務用例
- 避免跨領域的業務邏輯混合

### 2. 事務邊界
- 每個應用服務方法代表一個事務邊界
- 使用 Unit of Work 模式管理事務
- 確保資料一致性

### 3. 錯誤處理
- 統一的錯誤處理策略
- 業務異常與技術異常分離
- 適當的錯誤訊息和日誌記錄

### 4. 效能考量
- 適當的資料載入策略
- 避免 N+1 查詢問題
- 使用快取提升效能

## 相關文件
- [用戶應用服務](./UserService.md)
- [專案應用服務](./ProjectService.md)
- [組織應用服務](./OrganizationService.md)
- [成本控制應用服務](./CostControlService.md)
- [團隊應用服務](./TeamService.md)
