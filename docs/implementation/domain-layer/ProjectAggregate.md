# Project 聚合根 (Project Aggregate)

## 概述

Project 聚合根是營建管理系統中專案領域的核心聚合，負責管理專案的完整生命週期、資源分配、進度追蹤和成本控制。採用 Domain-Driven Design 原則，封裝專案相關的所有業務邏輯。

## 聚合根設計

### 1. 核心概念
- **聚合邊界**: 專案身份、基本資料、時間管理、資源分配、成本控制、品質管理
- **不變性**: 確保專案資料的業務規則一致性
- **領域事件**: 發布專案相關的領域事件
- **封裝性**: 封裝專案的內部狀態和行為

### 2. 聚合邊界
- **專案身份**: ID、名稱、類型、狀態
- **基本資料**: 描述、規模、位置、客戶資訊
- **時間管理**: 開始時間、結束時間、里程碑
- **資源分配**: 人力、物料、設備的分配
- **成本管理**: 預算、實際成本、變更管理
- **品質管理**: 品質標準、檢查項目

## 實作範例

### Project 聚合根
```typescript
export class ProjectAggregate {
  private readonly _id: ProjectId;
  private _name: ProjectName;
  private _description: ProjectDescription;
  private _type: ProjectType;
  private _status: ProjectStatus;
  private _timeline: ProjectTimeline;
  private _budget: ProjectBudget;
  private _resources: ProjectResources;
  private _milestones: ProjectMilestones;
  private _qualityStandards: QualityStandards;
  private _organizationId: OrganizationId;
  private _teamId?: TeamId;
  private _createdAt: Date;
  private _updatedAt: Date;
  
  private readonly _domainEvents: DomainEvent[] = [];
  
  constructor(
    id: ProjectId,
    name: ProjectName,
    description: ProjectDescription,
    type: ProjectType,
    organizationId: OrganizationId,
    timeline: ProjectTimeline,
    budget: ProjectBudget
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._type = type;
    this._organizationId = organizationId;
    this._timeline = timeline;
    this._budget = budget;
    this._resources = new ProjectResources();
    this._milestones = new ProjectMilestones();
    this._qualityStandards = new QualityStandards();
    this._status = ProjectStatus.PLANNING;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    
    // 發布專案建立事件
    this.addDomainEvent(new ProjectCreatedEvent(
      this._id.value,
      this._name.value,
      this._type.value,
      this._organizationId.value,
      this._createdAt
    ));
  }
  
  // 身份識別
  get id(): ProjectId {
    return this._id;
  }
  
  get name(): ProjectName {
    return this._name;
  }
  
  get type(): ProjectType {
    return this._type;
  }
  
  get status(): ProjectStatus {
    return this._status;
  }
  
  get organizationId(): OrganizationId {
    return this._organizationId;
  }
  
  get teamId(): TeamId | undefined {
    return this._teamId;
  }
  
  // 專案管理
  updateBasicInfo(name?: string, description?: string): void {
    if (name) {
      this._name = ProjectName.create(name);
    }
    
    if (description) {
      this._description = ProjectDescription.create(description);
    }
    
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectBasicInfoUpdatedEvent(
      this._id.value,
      { name: name ? this._name.value : undefined, description: description ? this._description.value : undefined },
      this._updatedAt
    ));
  }
  
  // 狀態管理
  startProject(): void {
    if (this._status !== ProjectStatus.PLANNING) {
      throw new DomainException('只有規劃中的專案才能開始');
    }
    
    if (!this._teamId) {
      throw new DomainException('專案必須分配團隊才能開始');
    }
    
    this._status = ProjectStatus.IN_PROGRESS;
    this._timeline.start();
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectStartedEvent(
      this._id.value,
      this._teamId.value,
      this._updatedAt
    ));
  }
  
  pauseProject(reason: string): void {
    if (this._status !== ProjectStatus.IN_PROGRESS) {
      throw new DomainException('只有進行中的專案才能暫停');
    }
    
    this._status = ProjectStatus.PAUSED;
    this._timeline.pause();
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectPausedEvent(
      this._id.value,
      reason,
      this._updatedAt
    ));
  }
  
  resumeProject(): void {
    if (this._status !== ProjectStatus.PAUSED) {
      throw new DomainException('只有暫停的專案才能恢復');
    }
    
    this._status = ProjectStatus.IN_PROGRESS;
    this._timeline.resume();
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectResumedEvent(
      this._id.value,
      this._updatedAt
    ));
  }
  
  completeProject(): void {
    if (this._status !== ProjectStatus.IN_PROGRESS) {
      throw new DomainException('只有進行中的專案才能完成');
    }
    
    // 檢查所有里程碑是否完成
    if (!this._milestones.allMilestonesCompleted()) {
      throw new DomainException('所有里程碑必須完成才能結束專案');
    }
    
    this._status = ProjectStatus.COMPLETED;
    this._timeline.complete();
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectCompletedEvent(
      this._id.value,
      this._timeline.getDuration(),
      this._updatedAt
    ));
  }
  
  cancelProject(reason: string): void {
    if (this._status === ProjectStatus.COMPLETED) {
      throw new DomainException('已完成的專案不能取消');
    }
    
    this._status = ProjectStatus.CANCELLED;
    this._timeline.cancel();
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectCancelledEvent(
      this._id.value,
      reason,
      this._updatedAt
    ));
  }
  
  // 團隊分配
  assignTeam(teamId: TeamId): void {
    if (this._status !== ProjectStatus.PLANNING) {
      throw new DomainException('只有規劃中的專案才能分配團隊');
    }
    
    this._teamId = teamId;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ProjectTeamAssignedEvent(
      this._id.value,
      teamId.value,
      this._updatedAt
    ));
  }
  
  // 資源管理
  allocateResource(resourceId: ResourceId, allocation: ResourceAllocation): void {
    if (this._status === ProjectStatus.COMPLETED || this._status === ProjectStatus.CANCELLED) {
      throw new DomainException('已結束的專案不能分配資源');
    }
    
    this._resources.allocateResource(resourceId, allocation);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ResourceAllocatedEvent(
      this._id.value,
      resourceId.value,
      allocation.type,
      allocation.quantity,
      this._updatedAt
    ));
  }
  
  deallocateResource(resourceId: ResourceId): void {
    if (!this._resources.hasResource(resourceId)) {
      throw new DomainException('資源未分配給此專案');
    }
    
    this._resources.deallocateResource(resourceId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new ResourceDeallocatedEvent(
      this._id.value,
      resourceId.value,
      this._updatedAt
    ));
  }
  
  // 里程碑管理
  addMilestone(milestoneData: CreateMilestoneData): Milestone {
    const milestone = this._milestones.addMilestone(milestoneData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new MilestoneAddedEvent(
      this._id.value,
      milestone.id.value,
      milestone.name.value,
      milestone.targetDate,
      this._updatedAt
    ));
    
    return milestone;
  }
  
  completeMilestone(milestoneId: MilestoneId): void {
    if (!this._milestones.hasMilestone(milestoneId)) {
      throw new DomainException('里程碑不存在');
    }
    
    this._milestones.completeMilestone(milestoneId);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new MilestoneCompletedEvent(
      this._id.value,
      milestoneId.value,
      this._updatedAt
    ));
  }
  
  // 預算管理
  updateBudget(budgetData: Partial<BudgetData>): void {
    this._budget.update(budgetData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new BudgetUpdatedEvent(
      this._id.value,
      Object.keys(budgetData),
      this._updatedAt
    ));
  }
  
  addBudgetChange(changeData: BudgetChangeData): void {
    this._budget.addChange(changeData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new BudgetChangeAddedEvent(
      this._id.value,
      changeData.reason,
      changeData.amount,
      this._updatedAt
    ));
  }
  
  // 品質管理
  addQualityStandard(standardData: QualityStandardData): void {
    this._qualityStandards.addStandard(standardData);
    this._updatedAt = new Date();
    
    this.addDomainEvent(new QualityStandardAddedEvent(
      this._id.value,
      standardData.name,
      standardData.description,
      this._updatedAt
    ));
  }
  
  // 進度計算
  calculateProgress(): ProjectProgress {
    const completedMilestones = this._milestones.getCompletedMilestones().length;
    const totalMilestones = this._milestones.getAllMilestones().length;
    const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
    
    const resourceProgress = this._resources.calculateResourceProgress();
    const budgetProgress = this._budget.calculateBudgetProgress();
    
    return new ProjectProgress(
      milestoneProgress,
      resourceProgress,
      budgetProgress,
      this._timeline.calculateTimeProgress()
    );
  }
  
  // 成本控制
  calculateCostVariance(): CostVariance {
    const budgetedCost = this._budget.getTotalBudget();
    const actualCost = this._budget.getActualCost();
    const variance = actualCost - budgetedCost;
    const variancePercentage = budgetedCost > 0 ? (variance / budgetedCost) * 100 : 0;
    
    return new CostVariance(budgetedCost, actualCost, variance, variancePercentage);
  }
  
  // 風險評估
  assessRisk(): ProjectRisk {
    const progress = this.calculateProgress();
    const costVariance = this.calculateCostVariance();
    const timelineVariance = this._timeline.calculateTimelineVariance();
    
    let riskLevel = RiskLevel.LOW;
    
    if (costVariance.variancePercentage > 20 || timelineVariance > 20) {
      riskLevel = RiskLevel.HIGH;
    } else if (costVariance.variancePercentage > 10 || timelineVariance > 10) {
      riskLevel = RiskLevel.MEDIUM;
    }
    
    return new ProjectRisk(riskLevel, costVariance, timelineVariance, progress);
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
    description: string,
    type: string,
    organizationId: string,
    startDate: Date,
    endDate: Date,
    budget: number
  ): ProjectAggregate {
    const projectId = ProjectId.generate();
    const nameVO = ProjectName.create(name);
    const descriptionVO = ProjectDescription.create(description);
    const typeVO = ProjectType.create(type);
    const orgId = OrganizationId.fromString(organizationId);
    const timeline = ProjectTimeline.create(startDate, endDate);
    const budgetVO = ProjectBudget.create(budget);
    
    return new ProjectAggregate(projectId, nameVO, descriptionVO, typeVO, orgId, timeline, budgetVO);
  }
  
  // 重建方法
  static reconstitute(
    id: string,
    name: string,
    description: string,
    type: string,
    status: string,
    timeline: ProjectTimelineData,
    budget: ProjectBudgetData,
    resources: ProjectResourcesData,
    milestones: ProjectMilestonesData,
    qualityStandards: QualityStandardsData,
    organizationId: string,
    teamId?: string,
    createdAt: Date,
    updatedAt: Date
  ): ProjectAggregate {
    const project = new ProjectAggregate(
      ProjectId.fromString(id),
      ProjectName.create(name),
      ProjectDescription.create(description),
      ProjectType.create(type),
      OrganizationId.fromString(organizationId),
      ProjectTimeline.reconstitute(timeline),
      ProjectBudget.reconstitute(budget)
    );
    
    project._status = ProjectStatus.fromString(status);
    project._resources = ProjectResources.reconstitute(resources);
    project._milestones = ProjectMilestones.reconstitute(milestones);
    project._qualityStandards = QualityStandards.reconstitute(qualityStandards);
    project._teamId = teamId ? TeamId.fromString(teamId) : undefined;
    project._createdAt = createdAt;
    project._updatedAt = updatedAt;
    
    return project;
  }
}
```

### 值物件定義
```typescript
// 專案 ID 值物件
export class ProjectId {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static generate(): ProjectId {
    return new ProjectId(uuidv4());
  }
  
  static fromString(value: string): ProjectId {
    if (!value || value.trim().length === 0) {
      throw new DomainException('專案 ID 不能為空');
    }
    return new ProjectId(value);
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: ProjectId): boolean {
    return this._value === other._value;
  }
}

// 專案名稱值物件
export class ProjectName {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static create(value: string): ProjectName {
    if (!value || value.trim().length < 3) {
      throw new DomainException('專案名稱至少需要 3 個字符');
    }
    
    if (value.trim().length > 200) {
      throw new DomainException('專案名稱不能超過 200 個字符');
    }
    
    return new ProjectName(value.trim());
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: ProjectName): boolean {
    return this._value === other._value;
  }
}

// 專案描述值物件
export class ProjectDescription {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static create(value: string): ProjectDescription {
    if (!value || value.trim().length < 10) {
      throw new DomainException('專案描述至少需要 10 個字符');
    }
    
    if (value.trim().length > 2000) {
      throw new DomainException('專案描述不能超過 2000 個字符');
    }
    
    return new ProjectDescription(value.trim());
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: ProjectDescription): boolean {
    return this._value === other._value;
  }
}

// 專案類型值物件
export class ProjectType {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static create(value: string): ProjectType {
    const validTypes = ['residential', 'commercial', 'infrastructure', 'renovation', 'maintenance'];
    
    if (!validTypes.includes(value)) {
      throw new DomainException(`無效的專案類型: ${value}`);
    }
    
    return new ProjectType(value);
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: ProjectType): boolean {
    return this._value === other._value;
  }
}

// 專案狀態值物件
export class ProjectStatus {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static readonly PLANNING = new ProjectStatus('planning');
  static readonly IN_PROGRESS = new ProjectStatus('in_progress');
  static readonly PAUSED = new ProjectStatus('paused');
  static readonly COMPLETED = new ProjectStatus('completed');
  static readonly CANCELLED = new ProjectStatus('cancelled');
  
  static fromString(value: string): ProjectStatus {
    const validStatuses = ['planning', 'in_progress', 'paused', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(value)) {
      throw new DomainException(`無效的專案狀態: ${value}`);
    }
    
    return new ProjectStatus(value);
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: ProjectStatus): boolean {
    return this._value === other._value;
  }
}

// 專案進度值物件
export class ProjectProgress {
  constructor(
    public readonly milestoneProgress: number,
    public readonly resourceProgress: number,
    public readonly budgetProgress: number,
    public readonly timeProgress: number
  ) {}
  
  get overallProgress(): number {
    return (this.milestoneProgress + this.resourceProgress + this.budgetProgress + this.timeProgress) / 4;
  }
}

// 成本差異值物件
export class CostVariance {
  constructor(
    public readonly budgetedCost: number,
    public readonly actualCost: number,
    public readonly variance: number,
    public readonly variancePercentage: number
  ) {}
  
  get isOverBudget(): boolean {
    return this.variance > 0;
  }
  
  get isUnderBudget(): boolean {
    return this.variance < 0;
  }
}

// 專案風險值物件
export class ProjectRisk {
  constructor(
    public readonly riskLevel: RiskLevel,
    public readonly costVariance: CostVariance,
    public readonly timelineVariance: number,
    public readonly progress: ProjectProgress
  ) {}
}

// 風險等級值物件
export class RiskLevel {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static readonly LOW = new RiskLevel('low');
  static readonly MEDIUM = new RiskLevel('medium');
  static readonly HIGH = new RiskLevel('high');
  
  get value(): string {
    return this._value;
  }
  
  equals(other: RiskLevel): boolean {
    return this._value === other._value;
  }
}
```

### 領域事件定義
```typescript
// 專案建立事件
export class ProjectCreatedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly projectName: string,
    public readonly projectType: string,
    public readonly organizationId: string,
    public readonly createdAt: Date
  ) {
    super('ProjectCreated', new Date());
  }
}

// 專案開始事件
export class ProjectStartedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly teamId: string,
    public readonly startedAt: Date
  ) {
    super('ProjectStarted', new Date());
  }
}

// 專案暫停事件
export class ProjectPausedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly reason: string,
    public readonly pausedAt: Date
  ) {
    super('ProjectPaused', new Date());
  }
}

// 專案完成事件
export class ProjectCompletedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly duration: number,
    public readonly completedAt: Date
  ) {
    super('ProjectCompleted', new Date());
  }
}

// 里程碑完成事件
export class MilestoneCompletedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly milestoneId: string,
    public readonly completedAt: Date
  ) {
    super('MilestoneCompleted', new Date());
  }
}

// 資源分配事件
export class ResourceAllocatedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly resourceId: string,
    public readonly resourceType: string,
    public readonly quantity: number,
    public readonly allocatedAt: Date
  ) {
    super('ResourceAllocated', new Date());
  }
}

// 預算變更事件
export class BudgetChangeAddedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly reason: string,
    public readonly amount: number,
    public readonly addedAt: Date
  ) {
    super('BudgetChangeAdded', new Date());
  }
}
```

## 業務規則

### 1. 不變性規則
- 專案 ID 一旦建立就不能變更
- 專案名稱必須符合長度要求
- 專案類型必須是有效值
- 專案必須屬於某個組織

### 2. 狀態轉換規則
- 只有規劃中的專案才能開始
- 只有進行中的專案才能暫停
- 只有暫停的專案才能恢復
- 只有進行中的專案才能完成
- 已完成的專案不能取消

### 3. 業務規則
- 專案開始前必須分配團隊
- 完成專案前所有里程碑必須完成
- 資源分配必須在專案生命週期內
- 預算變更必須有合理原因

### 4. 一致性規則
- 專案狀態變更必須發布事件
- 所有業務操作必須更新時間戳
- 領域事件必須按順序處理

## 最佳實踐

### 使用建議
1. **生命週期管理**: 明確管理專案狀態轉換
2. **資源追蹤**: 詳細追蹤資源分配和使用
3. **進度監控**: 定期計算和更新專案進度
4. **事件驅動**: 使用領域事件進行解耦

### 避免事項
1. 不要跳過狀態轉換驗證
2. 不要在專案結束後分配資源
3. 不要忽略里程碑完成檢查
4. 不要讓專案聚合根過於複雜
