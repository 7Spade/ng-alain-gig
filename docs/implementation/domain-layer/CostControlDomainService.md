# Cost Control Domain Service (成本控制領域服務)

## 概述

Cost Control Domain Service 是營建管理系統中成本控制領域的領域服務，負責處理跨聚合的成本控制業務邏輯和複雜的領域規則。採用 Domain-Driven Design 原則，封裝不屬於單一聚合根的成本控制相關業務邏輯。

## 領域服務設計

### 1. 核心概念
- **無狀態服務**: 領域服務不維護狀態，只處理業務邏輯
- **跨聚合邏輯**: 處理涉及多個聚合根的成本控制業務規則
- **領域規則**: 封裝複雜的成本控制領域業務規則
- **純業務邏輯**: 不涉及基礎設施關注點

### 2. 職責範圍
- 成本預算規劃和分配
- 實際成本追蹤和分析
- 成本差異分析和預警
- 成本預測和趨勢分析
- 成本優化建議
- 成本控制策略制定

## 實作範例

### Cost Control Domain Service
```typescript
export class CostControlDomainService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly costRepository: CostRepository,
    private readonly resourceRepository: ResourceRepository,
    private readonly budgetRepository: BudgetRepository
  ) {}
  
  // 成本預算規劃
  async planProjectBudget(
    projectId: ProjectId,
    budgetRequirements: BudgetRequirement[]
  ): Promise<BudgetPlanResult> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      return BudgetPlanResult.failure('專案不存在');
    }
    
    if (project.getStatus() !== ProjectStatus.PLANNING) {
      return BudgetPlanResult.failure('只有規劃中的專案才能制定預算');
    }
    
    const budgetPlan = new ProjectBudgetPlan(projectId);
    
    // 根據專案類型確定預算模板
    const budgetTemplate = this.getBudgetTemplate(project.getType());
    
    // 規劃各類別預算
    for (const requirement of budgetRequirements) {
      const budgetCategory = this.planBudgetCategory(requirement, budgetTemplate);
      budgetPlan.addCategory(budgetCategory);
    }
    
    // 驗證預算計劃
    const validationResult = this.validateBudgetPlan(budgetPlan);
    if (!validationResult.isValid) {
      return BudgetPlanResult.failure(validationResult.reason);
    }
    
    // 計算總預算
    const totalBudget = budgetPlan.calculateTotalBudget();
    
    return BudgetPlanResult.success(budgetPlan, totalBudget);
  }
  
  // 實際成本追蹤
  async trackActualCosts(projectId: ProjectId): Promise<CostTrackingAnalysis> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const budget = project.getBudget();
    const actualCosts = await this.getActualCosts(projectId);
    const costCategories = budget.getCategories();
    
    // 按類別分析實際成本
    const categoryAnalysis: CostCategoryAnalysis[] = [];
    
    for (const category of costCategories) {
      const categoryCosts = actualCosts.filter(cost => cost.category === category.name);
      const analysis = this.analyzeCategoryCosts(category, categoryCosts);
      categoryAnalysis.push(analysis);
    }
    
    // 計算總體成本指標
    const totalActualCost = actualCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const totalBudgetedCost = budget.getTotalBudget();
    const costVariance = totalActualCost - totalBudgetedCost;
    const costVariancePercentage = (costVariance / totalBudgetedCost) * 100;
    
    // 分析成本趨勢
    const costTrend = this.analyzeCostTrend(actualCosts);
    
    // 識別成本異常
    const costAnomalies = this.identifyCostAnomalies(categoryAnalysis);
    
    return new CostTrackingAnalysis(
      projectId,
      totalActualCost,
      totalBudgetedCost,
      costVariance,
      costVariancePercentage,
      categoryAnalysis,
      costTrend,
      costAnomalies
    );
  }
  
  // 成本差異分析
  async analyzeCostVariance(projectId: ProjectId): Promise<CostVarianceAnalysis> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const budget = project.getBudget();
    const actualCosts = await this.getActualCosts(projectId);
    const forecastedCosts = await this.forecastCosts(projectId);
    
    // 計算各類別成本差異
    const categoryVariances: CostCategoryVariance[] = [];
    
    for (const category of budget.getCategories()) {
      const budgetedAmount = category.allocatedAmount;
      const actualAmount = actualCosts
        .filter(cost => cost.category === category.name)
        .reduce((sum, cost) => sum + cost.amount, 0);
      const forecastedAmount = forecastedCosts
        .filter(cost => cost.category === category.name)
        .reduce((sum, cost) => sum + cost.amount, 0);
      
      const variance = actualAmount - budgetedAmount;
      const variancePercentage = (variance / budgetedAmount) * 100;
      const forecastVariance = forecastedAmount - budgetedAmount;
      
      categoryVariances.push(new CostCategoryVariance(
        category.name,
        budgetedAmount,
        actualAmount,
        forecastedAmount,
        variance,
        variancePercentage,
        forecastVariance
      ));
    }
    
    // 計算總體差異
    const totalBudgeted = budget.getTotalBudget();
    const totalActual = actualCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const totalForecasted = forecastedCosts.reduce((sum, cost) => sum + cost.amount, 0);
    
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePercentage = (totalVariance / totalBudgeted) * 100;
    const totalForecastVariance = totalForecasted - totalBudgeted;
    
    // 分析差異原因
    const varianceReasons = this.analyzeVarianceReasons(categoryVariances);
    
    // 生成差異報告
    const varianceReport = this.generateVarianceReport(categoryVariances, varianceReasons);
    
    return new CostVarianceAnalysis(
      projectId,
      totalBudgeted,
      totalActual,
      totalForecasted,
      totalVariance,
      totalVariancePercentage,
      totalForecastVariance,
      categoryVariances,
      varianceReasons,
      varianceReport
    );
  }
  
  // 成本預測
  async forecastProjectCosts(projectId: ProjectId): Promise<CostForecastAnalysis> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const actualCosts = await this.getActualCosts(projectId);
    const budget = project.getBudget();
    const timeline = project.getTimeline();
    
    // 基於歷史數據預測
    const historicalForecast = this.forecastBasedOnHistory(actualCosts, timeline);
    
    // 基於進度預測
    const progressForecast = this.forecastBasedOnProgress(project, actualCosts);
    
    // 基於趨勢預測
    const trendForecast = this.forecastBasedOnTrend(actualCosts, timeline);
    
    // 綜合預測
    const combinedForecast = this.combineForecasts([
      historicalForecast,
      progressForecast,
      trendForecast
    ]);
    
    // 計算預測準確度
    const accuracy = this.calculateForecastAccuracy(actualCosts, historicalForecast);
    
    // 生成預測報告
    const forecastReport = this.generateForecastReport(combinedForecast, accuracy);
    
    return new CostForecastAnalysis(
      projectId,
      combinedForecast,
      historicalForecast,
      progressForecast,
      trendForecast,
      accuracy,
      forecastReport
    );
  }
  
  // 成本優化建議
  async generateCostOptimizationRecommendations(
    projectId: ProjectId
  ): Promise<CostOptimizationAnalysis> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const budget = project.getBudget();
    const actualCosts = await this.getActualCosts(projectId);
    const forecastedCosts = await this.forecastCosts(projectId);
    
    // 分析成本效率
    const efficiencyAnalysis = this.analyzeCostEfficiency(actualCosts, budget);
    
    // 識別優化機會
    const optimizationOpportunities = this.identifyOptimizationOpportunities(
      efficiencyAnalysis,
      forecastedCosts
    );
    
    // 生成優化建議
    const optimizationRecommendations = this.generateOptimizationRecommendations(
      optimizationOpportunities,
      budget
    );
    
    // 計算優化潛力
    const optimizationPotential = this.calculateOptimizationPotential(
      optimizationRecommendations
    );
    
    // 評估實施可行性
    const feasibilityAssessment = this.assessImplementationFeasibility(
      optimizationRecommendations,
      project
    );
    
    return new CostOptimizationAnalysis(
      projectId,
      efficiencyAnalysis,
      optimizationOpportunities,
      optimizationRecommendations,
      optimizationPotential,
      feasibilityAssessment
    );
  }
  
  // 成本控制策略制定
  async developCostControlStrategy(
    projectId: ProjectId
  ): Promise<CostControlStrategy> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const budget = project.getBudget();
    const actualCosts = await this.getActualCosts(projectId);
    const forecastedCosts = await this.forecastCosts(projectId);
    const projectRisks = await this.assessProjectRisks(projectId);
    
    // 分析當前成本狀況
    const currentCostStatus = this.analyzeCurrentCostStatus(actualCosts, budget);
    
    // 識別成本風險
    const costRisks = this.identifyCostRisks(forecastedCosts, budget, projectRisks);
    
    // 制定控制措施
    const controlMeasures = this.developControlMeasures(costRisks, currentCostStatus);
    
    // 設定控制目標
    const controlTargets = this.setControlTargets(budget, forecastedCosts);
    
    // 制定監控計劃
    const monitoringPlan = this.developMonitoringPlan(controlMeasures, controlTargets);
    
    return new CostControlStrategy(
      projectId,
      currentCostStatus,
      costRisks,
      controlMeasures,
      controlTargets,
      monitoringPlan
    );
  }
  
  // 成本報警系統
  async checkCostAlerts(projectId: ProjectId): Promise<CostAlert[]> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const budget = project.getBudget();
    const actualCosts = await this.getActualCosts(projectId);
    const forecastedCosts = await this.forecastCosts(projectId);
    
    const alerts: CostAlert[] = [];
    
    // 檢查預算超支警報
    const overrunAlerts = this.checkOverrunAlerts(actualCosts, budget);
    alerts.push(...overrunAlerts);
    
    // 檢查成本異常警報
    const anomalyAlerts = this.checkAnomalyAlerts(actualCosts);
    alerts.push(...anomalyAlerts);
    
    // 檢查預測超支警報
    const forecastAlerts = this.checkForecastAlerts(forecastedCosts, budget);
    alerts.push(...forecastAlerts);
    
    // 檢查成本趨勢警報
    const trendAlerts = this.checkTrendAlerts(actualCosts);
    alerts.push(...trendAlerts);
    
    // 按優先級排序
    return alerts.sort((a, b) => b.priority - a.priority);
  }
  
  // 成本分解分析
  async analyzeCostBreakdown(projectId: ProjectId): Promise<CostBreakdownAnalysis> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      throw new DomainException('專案不存在');
    }
    
    const actualCosts = await this.getActualCosts(projectId);
    const budget = project.getBudget();
    
    // 按類別分解
    const categoryBreakdown = this.analyzeCategoryBreakdown(actualCosts, budget);
    
    // 按時間分解
    const timeBreakdown = this.analyzeTimeBreakdown(actualCosts, project.getTimeline());
    
    // 按資源分解
    const resourceBreakdown = this.analyzeResourceBreakdown(actualCosts);
    
    // 按活動分解
    const activityBreakdown = this.analyzeActivityBreakdown(actualCosts);
    
    // 計算分解比例
    const breakdownRatios = this.calculateBreakdownRatios(
      categoryBreakdown,
      timeBreakdown,
      resourceBreakdown,
      activityBreakdown
    );
    
    return new CostBreakdownAnalysis(
      projectId,
      categoryBreakdown,
      timeBreakdown,
      resourceBreakdown,
      activityBreakdown,
      breakdownRatios
    );
  }
  
  // 私有方法
  private getBudgetTemplate(projectType: ProjectType): BudgetTemplate {
    // 實作獲取預算模板的邏輯
    return new BudgetTemplate([]);
  }
  
  private planBudgetCategory(
    requirement: BudgetRequirement,
    template: BudgetTemplate
  ): BudgetCategory {
    // 實作預算類別規劃
    return new BudgetCategory('', 0, '');
  }
  
  private validateBudgetPlan(plan: ProjectBudgetPlan): ValidationResult {
    // 實作預算計劃驗證
    return { isValid: true };
  }
  
  private async getActualCosts(projectId: ProjectId): Promise<Cost[]> {
    // 實作獲取實際成本的邏輯
    return [];
  }
  
  private async forecastCosts(projectId: ProjectId): Promise<Cost[]> {
    // 實作成本預測的邏輯
    return [];
  }
  
  private analyzeCategoryCosts(
    category: BudgetCategory,
    costs: Cost[]
  ): CostCategoryAnalysis {
    // 實作類別成本分析
    return new CostCategoryAnalysis('', 0, 0, 0, 0);
  }
  
  private analyzeCostTrend(costs: Cost[]): CostTrend {
    // 實作成本趨勢分析
    return new CostTrend('stable', 0);
  }
  
  private identifyCostAnomalies(analyses: CostCategoryAnalysis[]): CostAnomaly[] {
    // 實作成本異常識別
    return [];
  }
  
  private analyzeVarianceReasons(variances: CostCategoryVariance[]): VarianceReason[] {
    // 實作差異原因分析
    return [];
  }
  
  private generateVarianceReport(
    variances: CostCategoryVariance[],
    reasons: VarianceReason[]
  ): VarianceReport {
    // 實作差異報告生成
    return new VarianceReport('', []);
  }
  
  private forecastBasedOnHistory(costs: Cost[], timeline: ProjectTimeline): CostForecast {
    // 實作基於歷史的預測
    return new CostForecast(0, new Date());
  }
  
  private forecastBasedOnProgress(project: Project, costs: Cost[]): CostForecast {
    // 實作基於進度的預測
    return new CostForecast(0, new Date());
  }
  
  private forecastBasedOnTrend(costs: Cost[], timeline: ProjectTimeline): CostForecast {
    // 實作基於趨勢的預測
    return new CostForecast(0, new Date());
  }
  
  private combineForecasts(forecasts: CostForecast[]): CostForecast {
    // 實作預測綜合
    return new CostForecast(0, new Date());
  }
  
  private calculateForecastAccuracy(actualCosts: Cost[], forecast: CostForecast): number {
    // 實作預測準確度計算
    return 0;
  }
  
  private generateForecastReport(forecast: CostForecast, accuracy: number): ForecastReport {
    // 實作預測報告生成
    return new ForecastReport('', []);
  }
  
  private analyzeCostEfficiency(costs: Cost[], budget: ProjectBudget): CostEfficiencyAnalysis {
    // 實作成本效率分析
    return new CostEfficiencyAnalysis(0, []);
  }
  
  private identifyOptimizationOpportunities(
    efficiency: CostEfficiencyAnalysis,
    forecast: Cost[]
  ): OptimizationOpportunity[] {
    // 實作優化機會識別
    return [];
  }
  
  private generateOptimizationRecommendations(
    opportunities: OptimizationOpportunity[],
    budget: ProjectBudget
  ): OptimizationRecommendation[] {
    // 實作優化建議生成
    return [];
  }
  
  private calculateOptimizationPotential(
    recommendations: OptimizationRecommendation[]
  ): OptimizationPotential {
    // 實作優化潛力計算
    return new OptimizationPotential(0, 0);
  }
  
  private assessImplementationFeasibility(
    recommendations: OptimizationRecommendation[],
    project: Project
  ): FeasibilityAssessment {
    // 實作實施可行性評估
    return new FeasibilityAssessment(0, []);
  }
  
  private analyzeCurrentCostStatus(costs: Cost[], budget: ProjectBudget): CostStatus {
    // 實作當前成本狀況分析
    return new CostStatus('normal', 0);
  }
  
  private identifyCostRisks(
    forecast: Cost[],
    budget: ProjectBudget,
    risks: ProjectRisk[]
  ): CostRisk[] {
    // 實作成本風險識別
    return [];
  }
  
  private developControlMeasures(risks: CostRisk[], status: CostStatus): ControlMeasure[] {
    // 實作控制措施制定
    return [];
  }
  
  private setControlTargets(budget: ProjectBudget, forecast: Cost[]): ControlTarget[] {
    // 實作控制目標設定
    return [];
  }
  
  private developMonitoringPlan(
    measures: ControlMeasure[],
    targets: ControlTarget[]
  ): MonitoringPlan {
    // 實作監控計劃制定
    return new MonitoringPlan([], []);
  }
  
  private async assessProjectRisks(projectId: ProjectId): Promise<ProjectRisk[]> {
    // 實作專案風險評估
    return [];
  }
  
  private checkOverrunAlerts(costs: Cost[], budget: ProjectBudget): CostAlert[] {
    // 實作超支警報檢查
    return [];
  }
  
  private checkAnomalyAlerts(costs: Cost[]): CostAlert[] {
    // 實作異常警報檢查
    return [];
  }
  
  private checkForecastAlerts(forecast: Cost[], budget: ProjectBudget): CostAlert[] {
    // 實作預測警報檢查
    return [];
  }
  
  private checkTrendAlerts(costs: Cost[]): CostAlert[] {
    // 實作趨勢警報檢查
    return [];
  }
  
  private analyzeCategoryBreakdown(costs: Cost[], budget: ProjectBudget): CategoryBreakdown {
    // 實作類別分解分析
    return new CategoryBreakdown([]);
  }
  
  private analyzeTimeBreakdown(costs: Cost[], timeline: ProjectTimeline): TimeBreakdown {
    // 實作時間分解分析
    return new TimeBreakdown([]);
  }
  
  private analyzeResourceBreakdown(costs: Cost[]): ResourceBreakdown {
    // 實作資源分解分析
    return new ResourceBreakdown([]);
  }
  
  private analyzeActivityBreakdown(costs: Cost[]): ActivityBreakdown {
    // 實作活動分解分析
    return new ActivityBreakdown([]);
  }
  
  private calculateBreakdownRatios(
    category: CategoryBreakdown,
    time: TimeBreakdown,
    resource: ResourceBreakdown,
    activity: ActivityBreakdown
  ): BreakdownRatios {
    // 實作分解比例計算
    return new BreakdownRatios({}, {}, {}, {});
  }
}
```

### 值物件定義
```typescript
// 預算計劃結果
export class BudgetPlanResult {
  private constructor(
    private readonly success: boolean,
    private readonly plan?: ProjectBudgetPlan,
    private readonly totalBudget?: number,
    private readonly error?: string
  ) {}
  
  static success(plan: ProjectBudgetPlan, totalBudget: number): BudgetPlanResult {
    return new BudgetPlanResult(true, plan, totalBudget);
  }
  
  static failure(error: string): BudgetPlanResult {
    return new BudgetPlanResult(false, undefined, undefined, error);
  }
  
  get isSuccess(): boolean {
    return this.success;
  }
  
  get getPlan(): ProjectBudgetPlan | undefined {
    return this.plan;
  }
  
  get getTotalBudget(): number | undefined {
    return this.totalBudget;
  }
  
  get getError(): string | undefined {
    return this.error;
  }
}

// 成本追蹤分析
export class CostTrackingAnalysis {
  constructor(
    public readonly projectId: ProjectId,
    public readonly totalActualCost: number,
    public readonly totalBudgetedCost: number,
    public readonly costVariance: number,
    public readonly costVariancePercentage: number,
    public readonly categoryAnalysis: CostCategoryAnalysis[],
    public readonly costTrend: CostTrend,
    public readonly costAnomalies: CostAnomaly[]
  ) {}
}

// 成本差異分析
export class CostVarianceAnalysis {
  constructor(
    public readonly projectId: ProjectId,
    public readonly totalBudgeted: number,
    public readonly totalActual: number,
    public readonly totalForecasted: number,
    public readonly totalVariance: number,
    public readonly totalVariancePercentage: number,
    public readonly totalForecastVariance: number,
    public readonly categoryVariances: CostCategoryVariance[],
    public readonly varianceReasons: VarianceReason[],
    public readonly varianceReport: VarianceReport
  ) {}
}

// 成本預測分析
export class CostForecastAnalysis {
  constructor(
    public readonly projectId: ProjectId,
    public readonly combinedForecast: CostForecast,
    public readonly historicalForecast: CostForecast,
    public readonly progressForecast: CostForecast,
    public readonly trendForecast: CostForecast,
    public readonly accuracy: number,
    public readonly forecastReport: ForecastReport
  ) {}
}

// 成本優化分析
export class CostOptimizationAnalysis {
  constructor(
    public readonly projectId: ProjectId,
    public readonly efficiencyAnalysis: CostEfficiencyAnalysis,
    public readonly optimizationOpportunities: OptimizationOpportunity[],
    public readonly optimizationRecommendations: OptimizationRecommendation[],
    public readonly optimizationPotential: OptimizationPotential,
    public readonly feasibilityAssessment: FeasibilityAssessment
  ) {}
}

// 成本控制策略
export class CostControlStrategy {
  constructor(
    public readonly projectId: ProjectId,
    public readonly currentCostStatus: CostStatus,
    public readonly costRisks: CostRisk[],
    public readonly controlMeasures: ControlMeasure[],
    public readonly controlTargets: ControlTarget[],
    public readonly monitoringPlan: MonitoringPlan
  ) {}
}

// 成本分解分析
export class CostBreakdownAnalysis {
  constructor(
    public readonly projectId: ProjectId,
    public readonly categoryBreakdown: CategoryBreakdown,
    public readonly timeBreakdown: TimeBreakdown,
    public readonly resourceBreakdown: ResourceBreakdown,
    public readonly activityBreakdown: ActivityBreakdown,
    public readonly breakdownRatios: BreakdownRatios
  ) {}
}

// 其他支援類型
export class BudgetRequirement {
  constructor(
    public readonly category: string,
    public readonly amount: number,
    public readonly description: string
  ) {}
}

export class ProjectBudgetPlan {
  private categories: BudgetCategory[] = [];
  
  constructor(public readonly projectId: ProjectId) {}
  
  addCategory(category: BudgetCategory): void {
    this.categories.push(category);
  }
  
  getCategories(): BudgetCategory[] {
    return [...this.categories];
  }
  
  calculateTotalBudget(): number {
    return this.categories.reduce((sum, category) => sum + category.allocatedAmount, 0);
  }
}

export class BudgetTemplate {
  constructor(
    public readonly categories: BudgetCategoryTemplate[]
  ) {}
}

export class BudgetCategory {
  constructor(
    public readonly name: string,
    public readonly allocatedAmount: number,
    public readonly description: string
  ) {}
}

export class CostCategoryAnalysis {
  constructor(
    public readonly category: string,
    public readonly budgetedAmount: number,
    public readonly actualAmount: number,
    public readonly variance: number,
    public readonly variancePercentage: number
  ) {}
}

export class CostAnomaly {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly severity: number
  ) {}
}

export class CostCategoryVariance {
  constructor(
    public readonly category: string,
    public readonly budgetedAmount: number,
    public readonly actualAmount: number,
    public readonly forecastedAmount: number,
    public readonly variance: number,
    public readonly variancePercentage: number,
    public readonly forecastVariance: number
  ) {}
}

export class VarianceReason {
  constructor(
    public readonly category: string,
    public readonly reason: string,
    public readonly impact: number
  ) {}
}

export class VarianceReport {
  constructor(
    public readonly summary: string,
    public readonly details: string[]
  ) {}
}

export class CostForecast {
  constructor(
    public readonly amount: number,
    public readonly date: Date
  ) {}
}

export class ForecastReport {
  constructor(
    public readonly summary: string,
    public readonly details: string[]
  ) {}
}

export class CostEfficiencyAnalysis {
  constructor(
    public readonly overallEfficiency: number,
    public readonly inefficiencies: CostInefficiency[]
  ) {}
}

export class OptimizationRecommendation {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly expectedSavings: number,
    public readonly priority: number
  ) {}
}

export class FeasibilityAssessment {
  constructor(
    public readonly feasibilityScore: number,
    public readonly constraints: string[]
  ) {}
}

export class CostStatus {
  constructor(
    public readonly status: string,
    public readonly riskLevel: number
  ) {}
}

export class CostRisk {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly probability: number,
    public readonly impact: number
  ) {}
}

export class ControlMeasure {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly effectiveness: number
  ) {}
}

export class ControlTarget {
  constructor(
    public readonly category: string,
    public readonly targetAmount: number,
    public readonly tolerance: number
  ) {}
}

export class MonitoringPlan {
  constructor(
    public readonly checkpoints: MonitoringCheckpoint[],
    public readonly alerts: CostAlert[]
  ) {}
}

export class CostAlert {
  constructor(
    public readonly type: string,
    public readonly message: string,
    public readonly priority: number,
    public readonly timestamp: Date
  ) {}
}

export class CategoryBreakdown {
  constructor(
    public readonly categories: CategoryBreakdownItem[]
  ) {}
}

export class TimeBreakdown {
  constructor(
    public readonly periods: TimeBreakdownItem[]
  ) {}
}

export class ResourceBreakdown {
  constructor(
    public readonly resources: ResourceBreakdownItem[]
  ) {}
}

export class ActivityBreakdown {
  constructor(
    public readonly activities: ActivityBreakdownItem[]
  ) {}
}

export class BreakdownRatios {
  constructor(
    public readonly categoryRatios: Record<string, number>,
    public readonly timeRatios: Record<string, number>,
    public readonly resourceRatios: Record<string, number>,
    public readonly activityRatios: Record<string, number>
  ) {}
}

export class BudgetCategoryTemplate {
  constructor(
    public readonly name: string,
    public readonly percentage: number,
    public readonly description: string
  ) {}
}

export class CostInefficiency {
  constructor(
    public readonly category: string,
    public readonly inefficiencyType: string,
    public readonly impact: number
  ) {}
}

export class MonitoringCheckpoint {
  constructor(
    public readonly date: Date,
    public readonly checkpoints: string[]
  ) {}
}

export class CategoryBreakdownItem {
  constructor(
    public readonly category: string,
    public readonly amount: number,
    public readonly percentage: number
  ) {}
}

export class TimeBreakdownItem {
  constructor(
    public readonly period: string,
    public readonly amount: number,
    public readonly percentage: number
  ) {}
}

export class ResourceBreakdownItem {
  constructor(
    public readonly resource: string,
    public readonly amount: number,
    public readonly percentage: number
  ) {}
}

export class ActivityBreakdownItem {
  constructor(
    public readonly activity: string,
    public readonly amount: number,
    public readonly percentage: number
  ) {}
}
```

## 業務規則

### 1. 預算規劃規則
- 預算必須基於專案類型和規模
- 預算分配必須合理
- 預算計劃必須經過驗證

### 2. 成本追蹤規則
- 成本追蹤必須即時
- 成本分析必須全面
- 異常必須及時識別

### 3. 差異分析規則
- 差異分析必須深入
- 差異原因必須明確
- 差異報告必須準確

### 4. 預測規則
- 預測必須基於多種方法
- 預測準確度必須評估
- 預測必須定期更新

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
