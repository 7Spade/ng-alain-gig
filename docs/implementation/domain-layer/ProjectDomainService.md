# Project Domain Service (專案領域服務)

## 概述

Project Domain Service 是營建管理系統中專案領域的領域服務，負責處理跨聚合的專案業務邏輯和複雜的領域規則。採用 Domain-Driven Design 原則，封裝不屬於單一聚合根的專案相關業務邏輯。

## 領域服務設計

### 1. 核心概念
- **無狀態服務**: 領域服務不維護狀態，只處理業務邏輯
- **跨聚合邏輯**: 處理涉及多個聚合根的專案業務規則
- **領域規則**: 封裝複雜的專案領域業務規則
- **純業務邏輯**: 不涉及基礎設施關注點

### 2. 職責範圍
- 專案資源分配和優化
- 專案進度計算和預測
- 專案風險評估
- 專案成本控制
- 專案品質管理
- 專案團隊協調

## 實作範例

### Project Domain Service
```typescript
export class ProjectDomainService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
    private readonly teamRepository: TeamRepository,
    private readonly resourceRepository: ResourceRepository
  ) {}
  
  // 專案資源分配
  async allocateProjectResources(
    projectId: ProjectId,
    resourceRequirements: ResourceRequirement[]
  ): Promise<ResourceAllocationResult> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      return ResourceAllocationResult.failure('專案不存在');
    }
    
    if (project.getStatus() !== ProjectStatus.IN_PROGRESS) {
      return ResourceAllocationResult.failure('專案必須處於進行中狀態');
    }
    
    const allocationPlan = new ResourceAllocationPlan(projectId);
    
    for (const requirement of resourceRequirements) {
      const availableResources = await this.findAvailableResources(requirement);
      
      if (availableResources.length === 0) {
        return ResourceAllocationResult.failure(
          `沒有可用的 ${requirement.type} 資源`
        );
      }
      
      const selectedResource = this.selectBestResource(availableResources, requirement);
      allocationPlan.addAllocation(selectedResource, requirement);
    }
    
    // 驗證分配計劃
    const validationResult = await this.validateAllocationPlan(allocationPlan);
    if (!validationResult.isValid) {
      return ResourceAllocationResult.failure(validationResult.reason);
    }
    
    return ResourceAllocationResult.success(allocationPlan);
  }
  
  // 專案進度計算
  async calculateProjectProgress(projectId: ProjectId): Promise<ProjectProgressAnalysis> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const milestones = project.getMilestones();
    const tasks = await this.getProjectTasks(projectId);
    const resources = project.getResources();
    
    // 計算里程碑進度
    const milestoneProgress = this.calculateMilestoneProgress(milestones);
    
    // 計算任務進度
    const taskProgress = this.calculateTaskProgress(tasks);
    
    // 計算資源使用進度
    const resourceProgress = this.calculateResourceProgress(resources);
    
    // 計算時間進度
    const timeProgress = project.getTimeline().calculateTimeProgress();
    
    // 計算整體進度
    const overallProgress = this.calculateOverallProgress(
      milestoneProgress,
      taskProgress,
      resourceProgress,
      timeProgress
    );
    
    // 預測完成時間
    const predictedCompletion = this.predictCompletionDate(
      overallProgress,
      project.getTimeline()
    );
    
    return new ProjectProgressAnalysis(
      projectId,
      overallProgress,
      milestoneProgress,
      taskProgress,
      resourceProgress,
      timeProgress,
      predictedCompletion
    );
  }
  
  // 專案風險評估
  async assessProjectRisk(projectId: ProjectId): Promise<ProjectRiskAssessment> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const risks: ProjectRisk[] = [];
    
    // 評估進度風險
    const progressRisk = await this.assessProgressRisk(project);
    if (progressRisk.level !== RiskLevel.LOW) {
      risks.push(progressRisk);
    }
    
    // 評估成本風險
    const costRisk = await this.assessCostRisk(project);
    if (costRisk.level !== RiskLevel.LOW) {
      risks.push(costRisk);
    }
    
    // 評估資源風險
    const resourceRisk = await this.assessResourceRisk(project);
    if (resourceRisk.level !== RiskLevel.LOW) {
      risks.push(resourceRisk);
    }
    
    // 評估品質風險
    const qualityRisk = await this.assessQualityRisk(project);
    if (qualityRisk.level !== RiskLevel.LOW) {
      risks.push(qualityRisk);
    }
    
    // 評估團隊風險
    const teamRisk = await this.assessTeamRisk(project);
    if (teamRisk.level !== RiskLevel.LOW) {
      risks.push(teamRisk);
    }
    
    // 計算整體風險等級
    const overallRiskLevel = this.calculateOverallRiskLevel(risks);
    
    // 生成風險緩解建議
    const mitigationStrategies = this.generateMitigationStrategies(risks);
    
    return new ProjectRiskAssessment(
      projectId,
      overallRiskLevel,
      risks,
      mitigationStrategies
    );
  }
  
  // 專案成本控制
  async controlProjectCosts(projectId: ProjectId): Promise<CostControlAnalysis> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const budget = project.getBudget();
    const actualCosts = await this.getActualCosts(projectId);
    const forecastedCosts = await this.forecastCosts(projectId);
    
    // 計算成本差異
    const costVariance = this.calculateCostVariance(budget, actualCosts);
    
    // 計算成本趨勢
    const costTrend = this.analyzeCostTrend(actualCosts);
    
    // 識別成本超支風險
    const overrunRisk = this.identifyOverrunRisk(forecastedCosts, budget);
    
    // 生成成本控制建議
    const controlRecommendations = this.generateCostControlRecommendations(
      costVariance,
      costTrend,
      overrunRisk
    );
    
    return new CostControlAnalysis(
      projectId,
      budget,
      actualCosts,
      forecastedCosts,
      costVariance,
      costTrend,
      overrunRisk,
      controlRecommendations
    );
  }
  
  // 專案品質管理
  async manageProjectQuality(projectId: ProjectId): Promise<QualityManagementAnalysis> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const qualityStandards = project.getQualityStandards();
    const inspections = await this.getProjectInspections(projectId);
    const defects = await this.getProjectDefects(projectId);
    
    // 計算品質指標
    const qualityMetrics = this.calculateQualityMetrics(
      qualityStandards,
      inspections,
      defects
    );
    
    // 分析品質趨勢
    const qualityTrend = this.analyzeQualityTrend(inspections, defects);
    
    // 識別品質問題
    const qualityIssues = this.identifyQualityIssues(qualityMetrics, qualityStandards);
    
    // 生成品質改進建議
    const improvementRecommendations = this.generateQualityImprovementRecommendations(
      qualityIssues,
      qualityTrend
    );
    
    return new QualityManagementAnalysis(
      projectId,
      qualityStandards,
      qualityMetrics,
      qualityTrend,
      qualityIssues,
      improvementRecommendations
    );
  }
  
  // 專案團隊協調
  async coordinateProjectTeam(projectId: ProjectId): Promise<TeamCoordinationAnalysis> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const teamId = project.getTeamId();
    if (!teamId) {
      throw new DomainException('專案未分配團隊');
    }
    
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new DomainException('團隊不存在');
    }
    
    const teamMembers = team.getMembers();
    const tasks = await this.getProjectTasks(projectId);
    
    // 分析團隊工作負載
    const workloadAnalysis = this.analyzeTeamWorkload(teamMembers, tasks);
    
    // 分析團隊協作效率
    const collaborationAnalysis = this.analyzeTeamCollaboration(teamMembers, tasks);
    
    // 識別團隊瓶頸
    const bottlenecks = this.identifyTeamBottlenecks(workloadAnalysis, collaborationAnalysis);
    
    // 生成團隊優化建議
    const optimizationRecommendations = this.generateTeamOptimizationRecommendations(
      workloadAnalysis,
      collaborationAnalysis,
      bottlenecks
    );
    
    return new TeamCoordinationAnalysis(
      projectId,
      teamId,
      workloadAnalysis,
      collaborationAnalysis,
      bottlenecks,
      optimizationRecommendations
    );
  }
  
  // 專案里程碑規劃
  async planProjectMilestones(
    projectId: ProjectId,
    requirements: MilestoneRequirement[]
  ): Promise<MilestonePlan> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const timeline = project.getTimeline();
    const milestones: PlannedMilestone[] = [];
    
    // 根據專案類型確定里程碑模板
    const milestoneTemplate = this.getMilestoneTemplate(project.getType());
    
    // 規劃里程碑
    for (const requirement of requirements) {
      const plannedMilestone = this.planMilestone(
        requirement,
        milestoneTemplate,
        timeline
      );
      milestones.push(plannedMilestone);
    }
    
    // 驗證里程碑計劃
    const validationResult = this.validateMilestonePlan(milestones, timeline);
    if (!validationResult.isValid) {
      throw new DomainException(validationResult.reason);
    }
    
    return new MilestonePlan(projectId, milestones);
  }
  
  // 專案資源優化
  async optimizeProjectResources(projectId: ProjectId): Promise<ResourceOptimizationResult> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const currentAllocations = project.getResources();
    const requirements = await this.getProjectResourceRequirements(projectId);
    
    // 分析當前資源使用效率
    const efficiencyAnalysis = this.analyzeResourceEfficiency(currentAllocations, requirements);
    
    // 識別優化機會
    const optimizationOpportunities = this.identifyOptimizationOpportunities(efficiencyAnalysis);
    
    // 生成優化建議
    const optimizationSuggestions = this.generateOptimizationSuggestions(
      optimizationOpportunities,
      requirements
    );
    
    // 計算優化潛力
    const optimizationPotential = this.calculateOptimizationPotential(optimizationSuggestions);
    
    return new ResourceOptimizationResult(
      projectId,
      efficiencyAnalysis,
      optimizationOpportunities,
      optimizationSuggestions,
      optimizationPotential
    );
  }
  
  // 私有方法
  private async findAvailableResources(requirement: ResourceRequirement): Promise<Resource[]> {
    // 實作查找可用資源的邏輯
    return [];
  }
  
  private selectBestResource(resources: Resource[], requirement: ResourceRequirement): Resource {
    // 實作選擇最佳資源的邏輯
    return resources[0];
  }
  
  private async validateAllocationPlan(plan: ResourceAllocationPlan): Promise<ValidationResult> {
    // 實作驗證分配計劃的邏輯
    return { isValid: true };
  }
  
  private calculateMilestoneProgress(milestones: Milestone[]): number {
    if (milestones.length === 0) return 0;
    
    const completedMilestones = milestones.filter(m => m.isCompleted()).length;
    return (completedMilestones / milestones.length) * 100;
  }
  
  private calculateTaskProgress(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.isCompleted()).length;
    return (completedTasks / tasks.length) * 100;
  }
  
  private calculateResourceProgress(resources: ProjectResources): number {
    // 實作資源進度計算
    return 0;
  }
  
  private calculateOverallProgress(
    milestoneProgress: number,
    taskProgress: number,
    resourceProgress: number,
    timeProgress: number
  ): number {
    return (milestoneProgress + taskProgress + resourceProgress + timeProgress) / 4;
  }
  
  private predictCompletionDate(progress: number, timeline: ProjectTimeline): Date {
    // 實作完成時間預測
    return new Date();
  }
  
  private async assessProgressRisk(project: Project): Promise<ProjectRisk> {
    // 實作進度風險評估
    return new ProjectRisk(RiskLevel.LOW, '進度正常', 0);
  }
  
  private async assessCostRisk(project: Project): Promise<ProjectRisk> {
    // 實作成本風險評估
    return new ProjectRisk(RiskLevel.LOW, '成本控制良好', 0);
  }
  
  private async assessResourceRisk(project: Project): Promise<ProjectRisk> {
    // 實作資源風險評估
    return new ProjectRisk(RiskLevel.LOW, '資源充足', 0);
  }
  
  private async assessQualityRisk(project: Project): Promise<ProjectRisk> {
    // 實作品質風險評估
    return new ProjectRisk(RiskLevel.LOW, '品質達標', 0);
  }
  
  private async assessTeamRisk(project: Project): Promise<ProjectRisk> {
    // 實作團隊風險評估
    return new ProjectRisk(RiskLevel.LOW, '團隊穩定', 0);
  }
  
  private calculateOverallRiskLevel(risks: ProjectRisk[]): RiskLevel {
    if (risks.length === 0) return RiskLevel.LOW;
    
    const highRisks = risks.filter(r => r.level === RiskLevel.HIGH).length;
    const mediumRisks = risks.filter(r => r.level === RiskLevel.MEDIUM).length;
    
    if (highRisks > 0) return RiskLevel.HIGH;
    if (mediumRisks > 0) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }
  
  private generateMitigationStrategies(risks: ProjectRisk[]): MitigationStrategy[] {
    // 實作風險緩解策略生成
    return [];
  }
  
  private async getActualCosts(projectId: ProjectId): Promise<Cost[]> {
    // 實作獲取實際成本的邏輯
    return [];
  }
  
  private async forecastCosts(projectId: ProjectId): Promise<Cost[]> {
    // 實作成本預測的邏輯
    return [];
  }
  
  private calculateCostVariance(budget: ProjectBudget, actualCosts: Cost[]): CostVariance {
    // 實作成本差異計算
    return new CostVariance(0, 0, 0, 0);
  }
  
  private analyzeCostTrend(costs: Cost[]): CostTrend {
    // 實作成本趨勢分析
    return new CostTrend('stable', 0);
  }
  
  private identifyOverrunRisk(forecastedCosts: Cost[], budget: ProjectBudget): OverrunRisk {
    // 實作超支風險識別
    return new OverrunRisk(RiskLevel.LOW, 0);
  }
  
  private generateCostControlRecommendations(
    variance: CostVariance,
    trend: CostTrend,
    risk: OverrunRisk
  ): CostControlRecommendation[] {
    // 實作成本控制建議生成
    return [];
  }
  
  private async getProjectInspections(projectId: ProjectId): Promise<Inspection[]> {
    // 實作獲取專案檢查的邏輯
    return [];
  }
  
  private async getProjectDefects(projectId: ProjectId): Promise<Defect[]> {
    // 實作獲取專案缺陷的邏輯
    return [];
  }
  
  private calculateQualityMetrics(
    standards: QualityStandards,
    inspections: Inspection[],
    defects: Defect[]
  ): QualityMetrics {
    // 實作品質指標計算
    return new QualityMetrics(0, 0, 0);
  }
  
  private analyzeQualityTrend(inspections: Inspection[], defects: Defect[]): QualityTrend {
    // 實作品質趨勢分析
    return new QualityTrend('improving', 0);
  }
  
  private identifyQualityIssues(metrics: QualityMetrics, standards: QualityStandards): QualityIssue[] {
    // 實作品質問題識別
    return [];
  }
  
  private generateQualityImprovementRecommendations(
    issues: QualityIssue[],
    trend: QualityTrend
  ): QualityImprovementRecommendation[] {
    // 實作品質改進建議生成
    return [];
  }
  
  private analyzeTeamWorkload(members: TeamMember[], tasks: Task[]): WorkloadAnalysis {
    // 實作團隊工作負載分析
    return new WorkloadAnalysis([]);
  }
  
  private analyzeTeamCollaboration(members: TeamMember[], tasks: Task[]): CollaborationAnalysis {
    // 實作團隊協作分析
    return new CollaborationAnalysis(0, 0);
  }
  
  private identifyTeamBottlenecks(
    workload: WorkloadAnalysis,
    collaboration: CollaborationAnalysis
  ): TeamBottleneck[] {
    // 實作團隊瓶頸識別
    return [];
  }
  
  private generateTeamOptimizationRecommendations(
    workload: WorkloadAnalysis,
    collaboration: CollaborationAnalysis,
    bottlenecks: TeamBottleneck[]
  ): TeamOptimizationRecommendation[] {
    // 實作團隊優化建議生成
    return [];
  }
  
  private getMilestoneTemplate(projectType: ProjectType): MilestoneTemplate {
    // 實作獲取里程碑模板的邏輯
    return new MilestoneTemplate([]);
  }
  
  private planMilestone(
    requirement: MilestoneRequirement,
    template: MilestoneTemplate,
    timeline: ProjectTimeline
  ): PlannedMilestone {
    // 實作里程碑規劃
    return new PlannedMilestone('', new Date(), '');
  }
  
  private validateMilestonePlan(milestones: PlannedMilestone[], timeline: ProjectTimeline): ValidationResult {
    // 實作里程碑計劃驗證
    return { isValid: true };
  }
  
  private async getProjectResourceRequirements(projectId: ProjectId): Promise<ResourceRequirement[]> {
    // 實作獲取專案資源需求的邏輯
    return [];
  }
  
  private analyzeResourceEfficiency(
    allocations: ProjectResources,
    requirements: ResourceRequirement[]
  ): ResourceEfficiencyAnalysis {
    // 實作資源效率分析
    return new ResourceEfficiencyAnalysis(0, []);
  }
  
  private identifyOptimizationOpportunities(
    analysis: ResourceEfficiencyAnalysis
  ): OptimizationOpportunity[] {
    // 實作優化機會識別
    return [];
  }
  
  private generateOptimizationSuggestions(
    opportunities: OptimizationOpportunity[],
    requirements: ResourceRequirement[]
  ): OptimizationSuggestion[] {
    // 實作優化建議生成
    return [];
  }
  
  private calculateOptimizationPotential(suggestions: OptimizationSuggestion[]): OptimizationPotential {
    // 實作優化潛力計算
    return new OptimizationPotential(0, 0);
  }
}
```

### 值物件定義
```typescript
// 資源分配結果
export class ResourceAllocationResult {
  private constructor(
    private readonly success: boolean,
    private readonly plan?: ResourceAllocationPlan,
    private readonly error?: string
  ) {}
  
  static success(plan: ResourceAllocationPlan): ResourceAllocationResult {
    return new ResourceAllocationResult(true, plan);
  }
  
  static failure(error: string): ResourceAllocationResult {
    return new ResourceAllocationResult(false, undefined, error);
  }
  
  get isSuccess(): boolean {
    return this.success;
  }
  
  get getPlan(): ResourceAllocationPlan | undefined {
    return this.plan;
  }
  
  get getError(): string | undefined {
    return this.error;
  }
}

// 專案進度分析
export class ProjectProgressAnalysis {
  constructor(
    public readonly projectId: ProjectId,
    public readonly overallProgress: number,
    public readonly milestoneProgress: number,
    public readonly taskProgress: number,
    public readonly resourceProgress: number,
    public readonly timeProgress: number,
    public readonly predictedCompletion: Date
  ) {}
}

// 專案風險評估
export class ProjectRiskAssessment {
  constructor(
    public readonly projectId: ProjectId,
    public readonly overallRiskLevel: RiskLevel,
    public readonly risks: ProjectRisk[],
    public readonly mitigationStrategies: MitigationStrategy[]
  ) {}
}

// 成本控制分析
export class CostControlAnalysis {
  constructor(
    public readonly projectId: ProjectId,
    public readonly budget: ProjectBudget,
    public readonly actualCosts: Cost[],
    public readonly forecastedCosts: Cost[],
    public readonly costVariance: CostVariance,
    public readonly costTrend: CostTrend,
    public readonly overrunRisk: OverrunRisk,
    public readonly controlRecommendations: CostControlRecommendation[]
  ) {}
}

// 品質管理分析
export class QualityManagementAnalysis {
  constructor(
    public readonly projectId: ProjectId,
    public readonly qualityStandards: QualityStandards,
    public readonly qualityMetrics: QualityMetrics,
    public readonly qualityTrend: QualityTrend,
    public readonly qualityIssues: QualityIssue[],
    public readonly improvementRecommendations: QualityImprovementRecommendation[]
  ) {}
}

// 團隊協調分析
export class TeamCoordinationAnalysis {
  constructor(
    public readonly projectId: ProjectId,
    public readonly teamId: TeamId,
    public readonly workloadAnalysis: WorkloadAnalysis,
    public readonly collaborationAnalysis: CollaborationAnalysis,
    public readonly bottlenecks: TeamBottleneck[],
    public readonly optimizationRecommendations: TeamOptimizationRecommendation[]
  ) {}
}

// 里程碑計劃
export class MilestonePlan {
  constructor(
    public readonly projectId: ProjectId,
    public readonly milestones: PlannedMilestone[]
  ) {}
}

// 資源優化結果
export class ResourceOptimizationResult {
  constructor(
    public readonly projectId: ProjectId,
    public readonly efficiencyAnalysis: ResourceEfficiencyAnalysis,
    public readonly optimizationOpportunities: OptimizationOpportunity[],
    public readonly optimizationSuggestions: OptimizationSuggestion[],
    public readonly optimizationPotential: OptimizationPotential
  ) {}
}

// 其他支援類型
export class ResourceRequirement {
  constructor(
    public readonly type: string,
    public readonly quantity: number,
    public readonly duration: number,
    public readonly skills?: string[]
  ) {}
}

export class ResourceAllocationPlan {
  private allocations: Map<Resource, ResourceRequirement> = new Map();
  
  constructor(public readonly projectId: ProjectId) {}
  
  addAllocation(resource: Resource, requirement: ResourceRequirement): void {
    this.allocations.set(resource, requirement);
  }
  
  getAllocations(): Map<Resource, ResourceRequirement> {
    return new Map(this.allocations);
  }
}

export class ValidationResult {
  constructor(
    public readonly isValid: boolean,
    public readonly reason?: string
  ) {}
}

export class ProjectRisk {
  constructor(
    public readonly level: RiskLevel,
    public readonly description: string,
    public readonly impact: number
  ) {}
}

export class MitigationStrategy {
  constructor(
    public readonly riskId: string,
    public readonly strategy: string,
    public readonly priority: number
  ) {}
}

export class CostTrend {
  constructor(
    public readonly direction: string,
    public readonly rate: number
  ) {}
}

export class OverrunRisk {
  constructor(
    public readonly level: RiskLevel,
    public readonly probability: number
  ) {}
}

export class CostControlRecommendation {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly priority: number
  ) {}
}

export class QualityMetrics {
  constructor(
    public readonly defectRate: number,
    public readonly inspectionPassRate: number,
    public readonly customerSatisfaction: number
  ) {}
}

export class QualityTrend {
  constructor(
    public readonly direction: string,
    public readonly rate: number
  ) {}
}

export class QualityIssue {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly severity: number
  ) {}
}

export class QualityImprovementRecommendation {
  constructor(
    public readonly issueId: string,
    public readonly recommendation: string,
    public readonly priority: number
  ) {}
}

export class WorkloadAnalysis {
  constructor(
    public readonly memberWorkloads: MemberWorkload[]
  ) {}
}

export class CollaborationAnalysis {
  constructor(
    public readonly collaborationScore: number,
    public readonly communicationFrequency: number
  ) {}
}

export class TeamBottleneck {
  constructor(
    public readonly memberId: UserId,
    public readonly description: string,
    public readonly impact: number
  ) {}
}

export class TeamOptimizationRecommendation {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly priority: number
  ) {}
}

export class MilestoneTemplate {
  constructor(
    public readonly milestones: MilestoneDefinition[]
  ) {}
}

export class PlannedMilestone {
  constructor(
    public readonly name: string,
    public readonly targetDate: Date,
    public readonly description: string
  ) {}
}

export class MilestoneRequirement {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly priority: number
  ) {}
}

export class ResourceEfficiencyAnalysis {
  constructor(
    public readonly overallEfficiency: number,
    public readonly inefficiencies: ResourceInefficiency[]
  ) {}
}

export class OptimizationOpportunity {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly potential: number
  ) {}
}

export class OptimizationSuggestion {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly expectedBenefit: number
  ) {}
}

export class OptimizationPotential {
  constructor(
    public readonly costSavings: number,
    public readonly efficiencyGain: number
  ) {}
}

export class MemberWorkload {
  constructor(
    public readonly memberId: UserId,
    public readonly workload: number,
    public readonly capacity: number
  ) {}
}

export class ResourceInefficiency {
  constructor(
    public readonly resourceId: ResourceId,
    public readonly inefficiencyType: string,
    public readonly impact: number
  ) {}
}

export class MilestoneDefinition {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly duration: number
  ) {}
}
```

## 業務規則

### 1. 資源分配規則
- 資源必須可用且符合需求
- 分配計劃必須經過驗證
- 資源衝突必須解決

### 2. 進度計算規則
- 進度計算必須考慮多個維度
- 預測必須基於歷史數據
- 進度必須定期更新

### 3. 風險評估規則
- 風險評估必須全面
- 風險等級必須客觀
- 緩解策略必須可行

### 4. 成本控制規則
- 成本監控必須即時
- 預測必須準確
- 控制措施必須有效

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
