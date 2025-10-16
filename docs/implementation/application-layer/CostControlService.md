# Cost Control Service (成本控制服務)

## 概述

Cost Control Service 是營建管理系統中成本控制模組的應用服務，負責協調成本控制相關的業務流程和用例。採用 Domain-Driven Design 原則，作為應用層和領域層之間的橋樑，處理成本控制的業務邏輯。

## 應用服務設計

### 1. 核心概念
- **用例協調**: 協調成本控制相關的業務用例
- **事務管理**: 管理成本控制相關的事務
- **領域服務調用**: 調用領域服務處理複雜業務邏輯
- **基礎設施整合**: 整合基礎設施層的服務

### 2. 職責範圍
- 成本預算管理
- 實際成本追蹤
- 成本差異分析
- 成本預測和報告
- 成本控制策略執行
- 成本優化建議實施

## 實作範例

### Cost Control Service
```typescript
@Injectable()
export class CostControlService {
  constructor(
    private readonly costControlDomainService: CostControlDomainService,
    private readonly projectRepository: ProjectRepository,
    private readonly costRepository: CostRepository,
    private readonly budgetRepository: BudgetRepository,
    private readonly notificationService: NotificationService,
    private readonly eventBus: EventBus
  ) {}
  
  // 建立專案預算
  async createProjectBudget(
    projectId: string,
    budgetData: CreateBudgetRequest
  ): Promise<CreateBudgetResponse> {
    try {
      const projectIdVO = ProjectId.fromString(projectId);
      
      // 驗證專案存在
      const project = await this.projectRepository.findById(projectIdVO);
      if (!project) {
        throw new BusinessException('專案不存在');
      }
      
      // 檢查是否已有預算
      const existingBudget = await this.budgetRepository.findByProjectId(projectIdVO);
      if (existingBudget) {
        throw new BusinessException('專案已有預算');
      }
      
      // 轉換預算需求
      const budgetRequirements = budgetData.categories.map(category => 
        new BudgetRequirement(category.name, category.amount, category.description)
      );
      
      // 調用領域服務規劃預算
      const budgetPlanResult = await this.costControlDomainService.planProjectBudget(
        projectIdVO,
        budgetRequirements
      );
      
      if (!budgetPlanResult.isSuccess) {
        throw new BusinessException(budgetPlanResult.getError || '預算規劃失敗');
      }
      
      // 建立預算實體
      const budget = ProjectBudget.create(
        projectIdVO,
        budgetPlanResult.getPlan!,
        budgetPlanResult.getTotalBudget!
      );
      
      // 儲存預算
      await this.budgetRepository.save(budget);
      
      // 發布預算建立事件
      await this.eventBus.publish(new BudgetCreatedEvent(
        projectId,
        budget.getId().value,
        budgetPlanResult.getTotalBudget!,
        new Date()
      ));
      
      return new CreateBudgetResponse(
        budget.getId().value,
        budgetPlanResult.getTotalBudget!,
        budgetData.categories.length
      );
      
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new SystemException('建立預算時發生系統錯誤', error);
    }
  }
  
  // 記錄實際成本
  async recordActualCost(
    projectId: string,
    costData: RecordCostRequest
  ): Promise<RecordCostResponse> {
    try {
      const projectIdVO = ProjectId.fromString(projectId);
      
      // 驗證專案存在
      const project = await this.projectRepository.findById(projectIdVO);
      if (!project) {
        throw new BusinessException('專案不存在');
      }
      
      // 驗證專案狀態
      if (project.getStatus() === ProjectStatus.COMPLETED) {
        throw new BusinessException('已完成的專案不能記錄成本');
      }
      
      // 建立成本實體
      const cost = Cost.create(
        projectIdVO,
        costData.category,
        costData.amount,
        costData.description,
        costData.date
      );
      
      // 儲存成本
      await this.costRepository.save(cost);
      
      // 更新專案預算
      const budget = await this.budgetRepository.findByProjectId(projectIdVO);
      if (budget) {
        budget.addActualCost(cost);
        await this.budgetRepository.save(budget);
      }
      
      // 檢查成本警報
      const alerts = await this.costControlDomainService.checkCostAlerts(projectIdVO);
      if (alerts.length > 0) {
        await this.handleCostAlerts(alerts, projectId);
      }
      
      // 發布成本記錄事件
      await this.eventBus.publish(new CostRecordedEvent(
        projectId,
        cost.getId().value,
        costData.amount,
        costData.category,
        new Date()
      ));
      
      return new RecordCostResponse(
        cost.getId().value,
        costData.amount,
        costData.category
      );
      
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new SystemException('記錄成本時發生系統錯誤', error);
    }
  }
  
  // 分析成本差異
  async analyzeCostVariance(
    projectId: string
  ): Promise<CostVarianceAnalysisResponse> {
    try {
      const projectIdVO = ProjectId.fromString(projectId);
      
      // 調用領域服務分析成本差異
      const varianceAnalysis = await this.costControlDomainService.analyzeCostVariance(projectIdVO);
      
      // 轉換為回應格式
      const categoryVariances = varianceAnalysis.categoryVariances.map(variance => 
        new CategoryVarianceResponse(
          variance.category,
          variance.budgetedAmount,
          variance.actualAmount,
          variance.forecastedAmount,
          variance.variance,
          variance.variancePercentage,
          variance.forecastVariance
        )
      );
      
      return new CostVarianceAnalysisResponse(
        varianceAnalysis.totalBudgeted,
        varianceAnalysis.totalActual,
        varianceAnalysis.totalForecasted,
        varianceAnalysis.totalVariance,
        varianceAnalysis.totalVariancePercentage,
        varianceAnalysis.totalForecastVariance,
        categoryVariances,
        varianceAnalysis.varianceReasons.map(reason => reason.reason),
        varianceAnalysis.varianceReport.summary
      );
      
    } catch (error) {
      throw new SystemException('分析成本差異時發生系統錯誤', error);
    }
  }
  
  // 生成成本預測
  async generateCostForecast(
    projectId: string
  ): Promise<CostForecastResponse> {
    try {
      const projectIdVO = ProjectId.fromString(projectId);
      
      // 調用領域服務生成成本預測
      const forecastAnalysis = await this.costControlDomainService.forecastProjectCosts(projectIdVO);
      
      return new CostForecastResponse(
        forecastAnalysis.combinedForecast.amount,
        forecastAnalysis.combinedForecast.date,
        forecastAnalysis.accuracy,
        forecastAnalysis.forecastReport.summary,
        forecastAnalysis.forecastReport.details
      );
      
    } catch (error) {
      throw new SystemException('生成成本預測時發生系統錯誤', error);
    }
  }
  
  // 生成成本優化建議
  async generateOptimizationRecommendations(
    projectId: string
  ): Promise<OptimizationRecommendationsResponse> {
    try {
      const projectIdVO = ProjectId.fromString(projectId);
      
      // 調用領域服務生成優化建議
      const optimizationAnalysis = await this.costControlDomainService.generateCostOptimizationRecommendations(projectIdVO);
      
      const recommendations = optimizationAnalysis.optimizationRecommendations.map(rec => 
        new OptimizationRecommendationResponse(
          rec.type,
          rec.description,
          rec.expectedSavings,
          rec.priority
        )
      );
      
      return new OptimizationRecommendationsResponse(
        optimizationAnalysis.optimizationPotential.costSavings,
        optimizationAnalysis.optimizationPotential.efficiencyGain,
        optimizationAnalysis.feasibilityAssessment.feasibilityScore,
        recommendations
      );
      
    } catch (error) {
      throw new SystemException('生成優化建議時發生系統錯誤', error);
    }
  }
  
  // 制定成本控制策略
  async developCostControlStrategy(
    projectId: string
  ): Promise<CostControlStrategyResponse> {
    try {
      const projectIdVO = ProjectId.fromString(projectId);
      
      // 調用領域服務制定控制策略
      const strategy = await this.costControlDomainService.developCostControlStrategy(projectIdVO);
      
      const controlMeasures = strategy.controlMeasures.map(measure => 
        new ControlMeasureResponse(
          measure.type,
          measure.description,
          measure.effectiveness
        )
      );
      
      const controlTargets = strategy.controlTargets.map(target => 
        new ControlTargetResponse(
          target.category,
          target.targetAmount,
          target.tolerance
        )
      );
      
      return new CostControlStrategyResponse(
        strategy.currentCostStatus.status,
        strategy.currentCostStatus.riskLevel,
        strategy.costRisks.map(risk => risk.description),
        controlMeasures,
        controlTargets,
        strategy.monitoringPlan.checkpoints.length
      );
      
    } catch (error) {
      throw new SystemException('制定成本控制策略時發生系統錯誤', error);
    }
  }
  
  // 生成成本報告
  async generateCostReport(
    projectId: string,
    reportType: CostReportType,
    dateRange?: DateRange
  ): Promise<CostReportResponse> {
    try {
      const projectIdVO = ProjectId.fromString(projectId);
      
      let reportData: any;
      
      switch (reportType) {
        case CostReportType.VARIANCE_ANALYSIS:
          reportData = await this.costControlDomainService.analyzeCostVariance(projectIdVO);
          break;
          
        case CostReportType.FORECAST_ANALYSIS:
          reportData = await this.costControlDomainService.forecastProjectCosts(projectIdVO);
          break;
          
        case CostReportType.BREAKDOWN_ANALYSIS:
          reportData = await this.costControlDomainService.analyzeCostBreakdown(projectIdVO);
          break;
          
        case CostReportType.OPTIMIZATION_ANALYSIS:
          reportData = await this.costControlDomainService.generateCostOptimizationRecommendations(projectIdVO);
          break;
          
        default:
          throw new BusinessException('不支援的報告類型');
      }
      
      // 生成報告內容
      const reportContent = this.generateReportContent(reportType, reportData);
      
      // 儲存報告
      const report = CostReport.create(
        projectIdVO,
        reportType,
        reportContent,
        dateRange
      );
      
      await this.costRepository.saveReport(report);
      
      return new CostReportResponse(
        report.getId().value,
        reportType,
        reportContent,
        report.getGeneratedAt()
      );
      
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new SystemException('生成成本報告時發生系統錯誤', error);
    }
  }
  
  // 更新預算
  async updateBudget(
    projectId: string,
    budgetId: string,
    updateData: UpdateBudgetRequest
  ): Promise<UpdateBudgetResponse> {
    try {
      const projectIdVO = ProjectId.fromString(projectId);
      const budgetIdVO = BudgetId.fromString(budgetId);
      
      // 驗證專案存在
      const project = await this.projectRepository.findById(projectIdVO);
      if (!project) {
        throw new BusinessException('專案不存在');
      }
      
      // 驗證專案狀態
      if (project.getStatus() === ProjectStatus.COMPLETED) {
        throw new BusinessException('已完成的專案不能更新預算');
      }
      
      // 取得預算
      const budget = await this.budgetRepository.findById(budgetIdVO);
      if (!budget) {
        throw new BusinessException('預算不存在');
      }
      
      // 更新預算
      if (updateData.categories) {
        for (const categoryUpdate of updateData.categories) {
          budget.updateCategory(
            categoryUpdate.name,
            categoryUpdate.amount,
            categoryUpdate.description
          );
        }
      }
      
      // 儲存預算
      await this.budgetRepository.save(budget);
      
      // 發布預算更新事件
      await this.eventBus.publish(new BudgetUpdatedEvent(
        projectId,
        budgetId,
        Object.keys(updateData),
        new Date()
      ));
      
      return new UpdateBudgetResponse(
        budgetId,
        budget.getTotalBudget(),
        budget.getCategories().length
      );
      
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new SystemException('更新預算時發生系統錯誤', error);
    }
  }
  
  // 刪除成本記錄
  async deleteCostRecord(
    projectId: string,
    costId: string
  ): Promise<DeleteCostResponse> {
    try {
      const projectIdVO = ProjectId.fromString(projectId);
      const costIdVO = CostId.fromString(costId);
      
      // 驗證專案存在
      const project = await this.projectRepository.findById(projectIdVO);
      if (!project) {
        throw new BusinessException('專案不存在');
      }
      
      // 驗證專案狀態
      if (project.getStatus() === ProjectStatus.COMPLETED) {
        throw new BusinessException('已完成的專案不能刪除成本記錄');
      }
      
      // 取得成本記錄
      const cost = await this.costRepository.findById(costIdVO);
      if (!cost) {
        throw new BusinessException('成本記錄不存在');
      }
      
      // 刪除成本記錄
      await this.costRepository.delete(cost);
      
      // 更新專案預算
      const budget = await this.budgetRepository.findByProjectId(projectIdVO);
      if (budget) {
        budget.removeActualCost(cost);
        await this.budgetRepository.save(budget);
      }
      
      // 發布成本刪除事件
      await this.eventBus.publish(new CostDeletedEvent(
        projectId,
        costId,
        cost.getAmount(),
        cost.getCategory(),
        new Date()
      ));
      
      return new DeleteCostResponse(costId, cost.getAmount());
      
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new SystemException('刪除成本記錄時發生系統錯誤', error);
    }
  }
  
  // 私有方法
  private async handleCostAlerts(alerts: CostAlert[], projectId: string): Promise<void> {
    for (const alert of alerts) {
      // 發送通知
      await this.notificationService.sendNotification(
        projectId,
        'cost_alert',
        alert.message,
        alert.priority
      );
      
      // 發布警報事件
      await this.eventBus.publish(new CostAlertEvent(
        projectId,
        alert.type,
        alert.message,
        alert.priority,
        alert.timestamp
      ));
    }
  }
  
  private generateReportContent(reportType: CostReportType, reportData: any): string {
    // 實作報告內容生成邏輯
    return JSON.stringify(reportData);
  }
}
```

### 請求/回應 DTO
```typescript
// 建立預算請求
export class CreateBudgetRequest {
  constructor(
    public readonly categories: BudgetCategoryRequest[]
  ) {}
}

export class BudgetCategoryRequest {
  constructor(
    public readonly name: string,
    public readonly amount: number,
    public readonly description: string
  ) {}
}

export class CreateBudgetResponse {
  constructor(
    public readonly budgetId: string,
    public readonly totalBudget: number,
    public readonly categoryCount: number
  ) {}
}

// 記錄成本請求
export class RecordCostRequest {
  constructor(
    public readonly category: string,
    public readonly amount: number,
    public readonly description: string,
    public readonly date: Date
  ) {}
}

export class RecordCostResponse {
  constructor(
    public readonly costId: string,
    public readonly amount: number,
    public readonly category: string
  ) {}
}

// 成本差異分析回應
export class CostVarianceAnalysisResponse {
  constructor(
    public readonly totalBudgeted: number,
    public readonly totalActual: number,
    public readonly totalForecasted: number,
    public readonly totalVariance: number,
    public readonly totalVariancePercentage: number,
    public readonly totalForecastVariance: number,
    public readonly categoryVariances: CategoryVarianceResponse[],
    public readonly varianceReasons: string[],
    public readonly summary: string
  ) {}
}

export class CategoryVarianceResponse {
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

// 成本預測回應
export class CostForecastResponse {
  constructor(
    public readonly forecastedAmount: number,
    public readonly forecastedDate: Date,
    public readonly accuracy: number,
    public readonly summary: string,
    public readonly details: string[]
  ) {}
}

// 優化建議回應
export class OptimizationRecommendationsResponse {
  constructor(
    public readonly potentialSavings: number,
    public readonly efficiencyGain: number,
    public readonly feasibilityScore: number,
    public readonly recommendations: OptimizationRecommendationResponse[]
  ) {}
}

export class OptimizationRecommendationResponse {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly expectedSavings: number,
    public readonly priority: number
  ) {}
}

// 成本控制策略回應
export class CostControlStrategyResponse {
  constructor(
    public readonly currentStatus: string,
    public readonly riskLevel: number,
    public readonly costRisks: string[],
    public readonly controlMeasures: ControlMeasureResponse[],
    public readonly controlTargets: ControlTargetResponse[],
    public readonly monitoringCheckpoints: number
  ) {}
}

export class ControlMeasureResponse {
  constructor(
    public readonly type: string,
    public readonly description: string,
    public readonly effectiveness: number
  ) {}
}

export class ControlTargetResponse {
  constructor(
    public readonly category: string,
    public readonly targetAmount: number,
    public readonly tolerance: number
  ) {}
}

// 成本報告回應
export class CostReportResponse {
  constructor(
    public readonly reportId: string,
    public readonly reportType: CostReportType,
    public readonly content: string,
    public readonly generatedAt: Date
  ) {}
}

// 更新預算請求
export class UpdateBudgetRequest {
  constructor(
    public readonly categories?: BudgetCategoryUpdate[]
  ) {}
}

export class BudgetCategoryUpdate {
  constructor(
    public readonly name: string,
    public readonly amount: number,
    public readonly description: string
  ) {}
}

export class UpdateBudgetResponse {
  constructor(
    public readonly budgetId: string,
    public readonly totalBudget: number,
    public readonly categoryCount: number
  ) {}
}

// 刪除成本回應
export class DeleteCostResponse {
  constructor(
    public readonly costId: string,
    public readonly amount: number
  ) {}
}

// 枚舉類型
export enum CostReportType {
  VARIANCE_ANALYSIS = 'variance_analysis',
  FORECAST_ANALYSIS = 'forecast_analysis',
  BREAKDOWN_ANALYSIS = 'breakdown_analysis',
  OPTIMIZATION_ANALYSIS = 'optimization_analysis'
}

export class DateRange {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {}
}
```

### 領域事件
```typescript
// 預算建立事件
export class BudgetCreatedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly budgetId: string,
    public readonly totalBudget: number,
    public readonly createdAt: Date
  ) {
    super('BudgetCreated', new Date());
  }
}

// 成本記錄事件
export class CostRecordedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly costId: string,
    public readonly amount: number,
    public readonly category: string,
    public readonly recordedAt: Date
  ) {
    super('CostRecorded', new Date());
  }
}

// 預算更新事件
export class BudgetUpdatedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly budgetId: string,
    public readonly updatedFields: string[],
    public readonly updatedAt: Date
  ) {
    super('BudgetUpdated', new Date());
  }
}

// 成本刪除事件
export class CostDeletedEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly costId: string,
    public readonly amount: number,
    public readonly category: string,
    public readonly deletedAt: Date
  ) {
    super('CostDeleted', new Date());
  }
}

// 成本警報事件
export class CostAlertEvent extends DomainEvent {
  constructor(
    public readonly projectId: string,
    public readonly alertType: string,
    public readonly message: string,
    public readonly priority: number,
    public readonly timestamp: Date
  ) {
    super('CostAlert', new Date());
  }
}
```

## 業務規則

### 1. 預算管理規則
- 專案必須存在且處於規劃狀態
- 專案不能重複建立預算
- 預算必須經過驗證

### 2. 成本記錄規則
- 專案必須存在且未完成
- 成本記錄必須有效
- 成本警報必須及時處理

### 3. 差異分析規則
- 分析必須基於實際數據
- 差異原因必須明確
- 報告必須準確

### 4. 預測規則
- 預測必須基於多種方法
- 預測準確度必須評估
- 預測必須定期更新

## 最佳實踐

### 使用建議
1. **事務管理**: 確保數據一致性
2. **錯誤處理**: 明確處理各種錯誤情況
3. **事件發布**: 及時發布領域事件
4. **效能考量**: 考慮查詢效能和快取策略

### 避免事項
1. 不要在應用服務中處理領域邏輯
2. 不要忽略事務管理
3. 不要忽略錯誤處理
4. 不要讓應用服務過於複雜