# User Domain Service (用戶領域服務)

## 概述

User Domain Service 是營建管理系統中用戶領域的領域服務，負責處理跨聚合的業務邏輯和複雜的領域規則。採用 Domain-Driven Design 原則，封裝不屬於單一聚合根的業務邏輯。

## 領域服務設計

### 1. 核心概念
- **無狀態服務**: 領域服務不維護狀態，只處理業務邏輯
- **跨聚合邏輯**: 處理涉及多個聚合根的業務規則
- **領域規則**: 封裝複雜的領域業務規則
- **純業務邏輯**: 不涉及基礎設施關注點

### 2. 職責範圍
- 用戶身份驗證和授權
- 用戶權限檢查
- 用戶關係管理
- 用戶統計和分析
- 用戶推薦算法

## 實作範例

### User Domain Service
```typescript
export class UserDomainService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly achievementRepository: AchievementRepository
  ) {}
  
  // 用戶身份驗證
  async authenticateUser(email: string, password: string): Promise<UserAuthenticationResult> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      return UserAuthenticationResult.failure('用戶不存在');
    }
    
    if (!user.isActive()) {
      return UserAuthenticationResult.failure('用戶帳戶已停用');
    }
    
    if (!user.verifyPassword(password)) {
      return UserAuthenticationResult.failure('密碼不正確');
    }
    
    // 記錄登入
    user.recordLogin();
    await this.userRepository.save(user);
    
    return UserAuthenticationResult.success(user);
  }
  
  // 檢查用戶權限
  async checkUserPermission(
    userId: UserId, 
    resource: string, 
    action: string
  ): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      return false;
    }
    
    // 檢查組織層級權限
    const organizationMemberships = user.getOrganizationMemberships();
    for (const membership of organizationMemberships) {
      if (membership.role.hasPermission(`${resource}:${action}`)) {
        return true;
      }
    }
    
    // 檢查團隊層級權限
    const teamMemberships = user.getTeamMemberships();
    for (const membership of teamMemberships) {
      if (membership.role.hasPermission(`${resource}:${action}`)) {
        return true;
      }
    }
    
    return false;
  }
  
  // 檢查用戶是否可以訪問專案
  async canUserAccessProject(userId: UserId, projectId: ProjectId): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    const project = await this.projectRepository.findById(projectId);
    
    if (!user || !project) {
      return false;
    }
    
    // 檢查是否為專案擁有者
    if (project.isOwner(userId)) {
      return true;
    }
    
    // 檢查是否為專案團隊成員
    if (project.isTeamMember(userId)) {
      return true;
    }
    
    // 檢查是否為組織成員
    if (project.isOrganizationMember(userId)) {
      return true;
    }
    
    return false;
  }
  
  // 檢查用戶是否可以管理專案
  async canUserManageProject(userId: UserId, projectId: ProjectId): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    const project = await this.projectRepository.findById(projectId);
    
    if (!user || !project) {
      return false;
    }
    
    // 檢查是否為專案擁有者
    if (project.isOwner(userId)) {
      return true;
    }
    
    // 檢查是否為專案管理員
    if (project.isProjectManager(userId)) {
      return true;
    }
    
    // 檢查組織管理員權限
    const organizationMemberships = user.getOrganizationMemberships();
    for (const membership of organizationMemberships) {
      if (membership.organizationId.equals(project.getOrganizationId()) &&
          membership.role.hasPermission('PROJECT:MANAGE')) {
        return true;
      }
    }
    
    return false;
  }
  
  // 用戶推薦算法
  async recommendUsersForProject(
    projectId: ProjectId, 
    criteria: UserRecommendationCriteria
  ): Promise<UserRecommendation[]> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      return [];
    }
    
    const recommendations: UserRecommendation[] = [];
    
    // 基於技能匹配推薦
    const skillBasedUsers = await this.findUsersBySkills(project.getRequiredSkills());
    for (const user of skillBasedUsers) {
      const score = this.calculateSkillMatchScore(user, project);
      recommendations.push(new UserRecommendation(user, score, 'skill_match'));
    }
    
    // 基於經驗推薦
    const experienceBasedUsers = await this.findUsersByExperience(project.getProjectType());
    for (const user of experienceBasedUsers) {
      const score = this.calculateExperienceScore(user, project);
      recommendations.push(new UserRecommendation(user, score, 'experience_match'));
    }
    
    // 基於地理位置推薦
    if (criteria.considerLocation) {
      const locationBasedUsers = await this.findUsersByLocation(project.getLocation());
      for (const user of locationBasedUsers) {
        const score = this.calculateLocationScore(user, project);
        recommendations.push(new UserRecommendation(user, score, 'location_match'));
      }
    }
    
    // 基於可用性推薦
    const availableUsers = await this.findAvailableUsers(project.getTimeline());
    for (const user of availableUsers) {
      const score = this.calculateAvailabilityScore(user, project);
      recommendations.push(new UserRecommendation(user, score, 'availability_match'));
    }
    
    // 排序並返回前 N 個推薦
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, criteria.maxRecommendations || 10);
  }
  
  // 檢查用戶是否可以加入團隊
  async canUserJoinTeam(userId: UserId, teamId: TeamId): Promise<TeamJoinResult> {
    const user = await this.userRepository.findById(userId);
    const team = await this.organizationRepository.findTeamById(teamId);
    
    if (!user) {
      return TeamJoinResult.failure('用戶不存在');
    }
    
    if (!team) {
      return TeamJoinResult.failure('團隊不存在');
    }
    
    // 檢查用戶是否已經是團隊成員
    if (team.hasMember(userId)) {
      return TeamJoinResult.failure('用戶已經是團隊成員');
    }
    
    // 檢查用戶是否為組織成員
    if (!team.getOrganization().hasMember(userId)) {
      return TeamJoinResult.failure('用戶不是組織成員');
    }
    
    // 檢查團隊是否還有名額
    if (team.isFull()) {
      return TeamJoinResult.failure('團隊已滿');
    }
    
    // 檢查用戶技能是否符合團隊需求
    const requiredSkills = team.getRequiredSkills();
    const userSkills = user.getProfessionalInfo().getSkills();
    const skillMatch = this.calculateSkillMatch(userSkills, requiredSkills);
    
    if (skillMatch < 0.5) {
      return TeamJoinResult.failure('技能不符合團隊需求');
    }
    
    return TeamJoinResult.success();
  }
  
  // 計算用戶活躍度
  async calculateUserActivity(userId: UserId, period: DateRange): Promise<UserActivity> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new DomainException('用戶不存在');
    }
    
    const activities: UserActivityMetric[] = [];
    
    // 計算專案參與度
    const projectParticipation = await this.calculateProjectParticipation(userId, period);
    activities.push(new UserActivityMetric('project_participation', projectParticipation));
    
    // 計算任務完成率
    const taskCompletion = await this.calculateTaskCompletion(userId, period);
    activities.push(new UserActivityMetric('task_completion', taskCompletion));
    
    // 計算協作次數
    const collaborationCount = await this.calculateCollaborationCount(userId, period);
    activities.push(new UserActivityMetric('collaboration', collaborationCount));
    
    // 計算文檔貢獻
    const documentContribution = await this.calculateDocumentContribution(userId, period);
    activities.push(new UserActivityMetric('document_contribution', documentContribution));
    
    return new UserActivity(userId, period, activities);
  }
  
  // 檢查用戶成就資格
  async checkAchievementEligibility(
    userId: UserId, 
    achievementId: AchievementId
  ): Promise<AchievementEligibilityResult> {
    const user = await this.userRepository.findById(userId);
    const achievement = await this.achievementRepository.findById(achievementId);
    
    if (!user || !achievement) {
      return AchievementEligibilityResult.failure('用戶或成就不存在');
    }
    
    // 檢查是否已擁有此成就
    if (user.hasAchievement(achievementId)) {
      return AchievementEligibilityResult.failure('已擁有此成就');
    }
    
    // 檢查成就條件
    const eligibility = await this.evaluateAchievementConditions(user, achievement);
    
    if (eligibility.isEligible) {
      return AchievementEligibilityResult.success(eligibility.progress);
    } else {
      return AchievementEligibilityResult.failure(eligibility.reason);
    }
  }
  
  // 計算用戶統計
  async calculateUserStatistics(userId: UserId): Promise<UserStatistics> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new DomainException('用戶不存在');
    }
    
    const stats = new UserStatistics(userId);
    
    // 專案統計
    const projectStats = await this.calculateProjectStatistics(userId);
    stats.addMetric('projects_completed', projectStats.completed);
    stats.addMetric('projects_active', projectStats.active);
    stats.addMetric('projects_total', projectStats.total);
    
    // 任務統計
    const taskStats = await this.calculateTaskStatistics(userId);
    stats.addMetric('tasks_completed', taskStats.completed);
    stats.addMetric('tasks_pending', taskStats.pending);
    stats.addMetric('tasks_overdue', taskStats.overdue);
    
    // 成就統計
    const achievementStats = await this.calculateAchievementStatistics(userId);
    stats.addMetric('achievements_unlocked', achievementStats.unlocked);
    stats.addMetric('achievements_total', achievementStats.total);
    stats.addMetric('achievement_points', achievementStats.points);
    
    // 社交統計
    const socialStats = await this.calculateSocialStatistics(userId);
    stats.addMetric('followers_count', socialStats.followers);
    stats.addMetric('following_count', socialStats.following);
    stats.addMetric('starred_projects', socialStats.starredProjects);
    
    return stats;
  }
  
  // 私有方法
  private async findUsersBySkills(requiredSkills: string[]): Promise<User[]> {
    // 實作基於技能查找用戶的邏輯
    return [];
  }
  
  private async findUsersByExperience(projectType: string): Promise<User[]> {
    // 實作基於經驗查找用戶的邏輯
    return [];
  }
  
  private async findUsersByLocation(location: string): Promise<User[]> {
    // 實作基於地理位置查找用戶的邏輯
    return [];
  }
  
  private async findAvailableUsers(timeline: ProjectTimeline): Promise<User[]> {
    // 實作基於可用性查找用戶的邏輯
    return [];
  }
  
  private calculateSkillMatchScore(user: User, project: Project): number {
    // 實作技能匹配分數計算
    return 0;
  }
  
  private calculateExperienceScore(user: User, project: Project): number {
    // 實作經驗分數計算
    return 0;
  }
  
  private calculateLocationScore(user: User, project: Project): number {
    // 實作地理位置分數計算
    return 0;
  }
  
  private calculateAvailabilityScore(user: User, project: Project): number {
    // 實作可用性分數計算
    return 0;
  }
  
  private calculateSkillMatch(userSkills: string[], requiredSkills: string[]): number {
    const matchedSkills = userSkills.filter(skill => requiredSkills.includes(skill));
    return matchedSkills.length / requiredSkills.length;
  }
  
  private async calculateProjectParticipation(userId: UserId, period: DateRange): Promise<number> {
    // 實作專案參與度計算
    return 0;
  }
  
  private async calculateTaskCompletion(userId: UserId, period: DateRange): Promise<number> {
    // 實作任務完成率計算
    return 0;
  }
  
  private async calculateCollaborationCount(userId: UserId, period: DateRange): Promise<number> {
    // 實作協作次數計算
    return 0;
  }
  
  private async calculateDocumentContribution(userId: UserId, period: DateRange): Promise<number> {
    // 實作文檔貢獻計算
    return 0;
  }
  
  private async evaluateAchievementConditions(
    user: User, 
    achievement: Achievement
  ): Promise<AchievementEligibility> {
    // 實作成就條件評估
    return { isEligible: false, progress: 0, reason: '條件未滿足' };
  }
  
  private async calculateProjectStatistics(userId: UserId): Promise<ProjectStatistics> {
    // 實作專案統計計算
    return { completed: 0, active: 0, total: 0 };
  }
  
  private async calculateTaskStatistics(userId: UserId): Promise<TaskStatistics> {
    // 實作任務統計計算
    return { completed: 0, pending: 0, overdue: 0 };
  }
  
  private async calculateAchievementStatistics(userId: UserId): Promise<AchievementStatistics> {
    // 實作成就統計計算
    return { unlocked: 0, total: 0, points: 0 };
  }
  
  private async calculateSocialStatistics(userId: UserId): Promise<SocialStatistics> {
    // 實作社交統計計算
    return { followers: 0, following: 0, starredProjects: 0 };
  }
}
```

### 值物件定義
```typescript
// 用戶認證結果
export class UserAuthenticationResult {
  private constructor(
    private readonly success: boolean,
    private readonly user?: User,
    private readonly error?: string
  ) {}
  
  static success(user: User): UserAuthenticationResult {
    return new UserAuthenticationResult(true, user);
  }
  
  static failure(error: string): UserAuthenticationResult {
    return new UserAuthenticationResult(false, undefined, error);
  }
  
  get isSuccess(): boolean {
    return this.success;
  }
  
  get getUser(): User | undefined {
    return this.user;
  }
  
  get getError(): string | undefined {
    return this.error;
  }
}

// 用戶推薦
export class UserRecommendation {
  constructor(
    public readonly user: User,
    public readonly score: number,
    public readonly reason: string
  ) {}
}

// 用戶推薦條件
export class UserRecommendationCriteria {
  constructor(
    public readonly maxRecommendations?: number,
    public readonly considerLocation?: boolean,
    public readonly requiredSkills?: string[],
    public readonly experienceLevel?: string
  ) {}
}

// 團隊加入結果
export class TeamJoinResult {
  private constructor(
    private readonly success: boolean,
    private readonly error?: string
  ) {}
  
  static success(): TeamJoinResult {
    return new TeamJoinResult(true);
  }
  
  static failure(error: string): TeamJoinResult {
    return new TeamJoinResult(false, error);
  }
  
  get isSuccess(): boolean {
    return this.success;
  }
  
  get getError(): string | undefined {
    return this.error;
  }
}

// 用戶活躍度
export class UserActivity {
  constructor(
    public readonly userId: UserId,
    public readonly period: DateRange,
    public readonly metrics: UserActivityMetric[]
  ) {}
  
  get overallScore(): number {
    if (this.metrics.length === 0) return 0;
    
    const totalScore = this.metrics.reduce((sum, metric) => sum + metric.value, 0);
    return totalScore / this.metrics.length;
  }
}

// 用戶活躍度指標
export class UserActivityMetric {
  constructor(
    public readonly type: string,
    public readonly value: number
  ) {}
}

// 成就資格結果
export class AchievementEligibilityResult {
  private constructor(
    private readonly eligible: boolean,
    private readonly progress?: number,
    private readonly reason?: string
  ) {}
  
  static success(progress: number): AchievementEligibilityResult {
    return new AchievementEligibilityResult(true, progress);
  }
  
  static failure(reason: string): AchievementEligibilityResult {
    return new AchievementEligibilityResult(false, undefined, reason);
  }
  
  get isEligible(): boolean {
    return this.eligible;
  }
  
  get getProgress(): number | undefined {
    return this.progress;
  }
  
  get getReason(): string | undefined {
    return this.reason;
  }
}

// 用戶統計
export class UserStatistics {
  private readonly metrics: Map<string, number> = new Map();
  
  constructor(public readonly userId: UserId) {}
  
  addMetric(key: string, value: number): void {
    this.metrics.set(key, value);
  }
  
  getMetric(key: string): number {
    return this.metrics.get(key) || 0;
  }
  
  getAllMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }
}

// 日期範圍
export class DateRange {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {}
  
  get duration(): number {
    return this.endDate.getTime() - this.startDate.getTime();
  }
  
  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }
}

// 成就資格
export class AchievementEligibility {
  constructor(
    public readonly isEligible: boolean,
    public readonly progress: number,
    public readonly reason: string
  ) {}
}

// 統計資料類型
export class ProjectStatistics {
  constructor(
    public readonly completed: number,
    public readonly active: number,
    public readonly total: number
  ) {}
}

export class TaskStatistics {
  constructor(
    public readonly completed: number,
    public readonly pending: number,
    public readonly overdue: number
  ) {}
}

export class AchievementStatistics {
  constructor(
    public readonly unlocked: number,
    public readonly total: number,
    public readonly points: number
  ) {}
}

export class SocialStatistics {
  constructor(
    public readonly followers: number,
    public readonly following: number,
    public readonly starredProjects: number
  ) {}
}
```

## 業務規則

### 1. 身份驗證規則
- 用戶必須存在且處於啟用狀態
- 密碼必須正確
- 登入後必須記錄登入時間

### 2. 權限檢查規則
- 權限檢查必須考慮組織和團隊層級
- 資源訪問權限必須明確驗證
- 管理權限必須有明確的業務規則

### 3. 推薦算法規則
- 推薦必須基於多個維度
- 推薦分數必須客觀計算
- 推薦結果必須排序

### 4. 統計計算規則
- 統計資料必須準確
- 統計計算必須考慮時間範圍
- 統計結果必須可重現

## 最佳實踐

### 使用建議
1. **無狀態設計**: 保持領域服務的無狀態特性
2. **單一職責**: 每個方法只處理一個業務邏輯
3. **錯誤處理**: 明確處理各種錯誤情況
4. **效能考量**: 考慮查詢效能和快取策略

### 避免事項
1. 不要在領域服務中處理基礎設施關注點
2. 不要讓領域服務過於複雜
3. 不要忽略錯誤處理
4. 不要違反領域服務的無狀態原則
