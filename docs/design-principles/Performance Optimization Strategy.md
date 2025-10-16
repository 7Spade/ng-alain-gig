# Performance Optimization Strategy - 效能優化策略

## 概述
Performance Optimization Strategy 定義了系統的效能優化策略，包括前端效能優化、後端效能優化、資料庫效能優化、快取策略、CDN 配置和監控機制。它確保系統能夠在高負載下保持優異的效能表現。

## 技術規格

### 效能指標定義
```typescript
export interface PerformanceMetrics {
  // 前端效能指標
  frontend: {
    firstContentfulPaint: number; // FCP
    largestContentfulPaint: number; // LCP
    firstInputDelay: number; // FID
    cumulativeLayoutShift: number; // CLS
    timeToInteractive: number; // TTI
    bundleSize: number; // 打包大小
    loadTime: number; // 載入時間
  };
  
  // 後端效能指標
  backend: {
    responseTime: number; // 回應時間
    throughput: number; // 吞吐量
    errorRate: number; // 錯誤率
    cpuUsage: number; // CPU 使用率
    memoryUsage: number; // 記憶體使用率
    databaseQueryTime: number; // 資料庫查詢時間
  };
  
  // 網路效能指標
  network: {
    latency: number; // 延遲
    bandwidth: number; // 頻寬
    packetLoss: number; // 封包遺失率
    connectionTime: number; // 連線時間
  };
}

export interface PerformanceBudget {
  frontend: {
    maxBundleSize: number; // 最大打包大小 (KB)
    maxLoadTime: number; // 最大載入時間 (ms)
    maxFCP: number; // 最大 FCP (ms)
    maxLCP: number; // 最大 LCP (ms)
    maxFID: number; // 最大 FID (ms)
    maxCLS: number; // 最大 CLS
  };
  
  backend: {
    maxResponseTime: number; // 最大回應時間 (ms)
    minThroughput: number; // 最小吞吐量 (req/s)
    maxErrorRate: number; // 最大錯誤率 (%)
    maxCpuUsage: number; // 最大 CPU 使用率 (%)
    maxMemoryUsage: number; // 最大記憶體使用率 (%)
  };
}
```

### 效能監控介面
```typescript
export interface PerformanceMonitor {
  startTiming(name: string): void;
  endTiming(name: string): number;
  measureCustomMetric(name: string, value: number): void;
  getMetrics(): PerformanceMetrics;
  isWithinBudget(): boolean;
  getBudgetViolations(): string[];
}

export interface PerformanceOptimizer {
  optimizeBundle(): Promise<void>;
  optimizeImages(): Promise<void>;
  optimizeDatabase(): Promise<void>;
  optimizeCache(): Promise<void>;
  generateReport(): Promise<PerformanceReport>;
}
```

## Angular 實作

### 效能監控服務
```typescript
import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService implements PerformanceMonitor {
  private router = inject(Router);
  private http = inject(HttpClient);
  
  private timings = new Map<string, number>();
  private metrics = new BehaviorSubject<PerformanceMetrics>(this.getInitialMetrics());
  private budget: PerformanceBudget = this.getPerformanceBudget();
  
  public metrics$ = this.metrics.asObservable();

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // 監控路由變化
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.measureRouteChange();
      });

    // 監控 Web Vitals
    this.measureWebVitals();

    // 監控資源載入
    this.measureResourceLoading();

    // 定期收集效能指標
    setInterval(() => {
      this.collectMetrics();
    }, 5000);
  }

  startTiming(name: string): void {
    this.timings.set(name, performance.now());
  }

  endTiming(name: string): number {
    const startTime = this.timings.get(name);
    if (!startTime) {
      console.warn(`Timing "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timings.delete(name);
    
    this.measureCustomMetric(name, duration);
    return duration;
  }

  measureCustomMetric(name: string, value: number): void {
    const currentMetrics = this.metrics.value;
    
    // 更新自定義指標
    if (!currentMetrics.custom) {
      currentMetrics.custom = {};
    }
    currentMetrics.custom[name] = value;
    
    this.metrics.next(currentMetrics);
    
    // 發送到分析服務
    this.sendMetricToAnalytics(name, value);
  }

  getMetrics(): PerformanceMetrics {
    return this.metrics.value;
  }

  isWithinBudget(): boolean {
    const currentMetrics = this.metrics.value;
    const violations = this.getBudgetViolations();
    return violations.length === 0;
  }

  getBudgetViolations(): string[] {
    const violations: string[] = [];
    const currentMetrics = this.metrics.value;
    
    // 檢查前端預算
    if (currentMetrics.frontend.bundleSize > this.budget.frontend.maxBundleSize) {
      violations.push(`Bundle size exceeds budget: ${currentMetrics.frontend.bundleSize}KB > ${this.budget.frontend.maxBundleSize}KB`);
    }
    
    if (currentMetrics.frontend.loadTime > this.budget.frontend.maxLoadTime) {
      violations.push(`Load time exceeds budget: ${currentMetrics.frontend.loadTime}ms > ${this.budget.frontend.maxLoadTime}ms`);
    }
    
    if (currentMetrics.frontend.firstContentfulPaint > this.budget.frontend.maxFCP) {
      violations.push(`FCP exceeds budget: ${currentMetrics.frontend.firstContentfulPaint}ms > ${this.budget.frontend.maxFCP}ms`);
    }
    
    // 檢查後端預算
    if (currentMetrics.backend.responseTime > this.budget.backend.maxResponseTime) {
      violations.push(`Response time exceeds budget: ${currentMetrics.backend.responseTime}ms > ${this.budget.backend.maxResponseTime}ms`);
    }
    
    if (currentMetrics.backend.errorRate > this.budget.backend.maxErrorRate) {
      violations.push(`Error rate exceeds budget: ${currentMetrics.backend.errorRate}% > ${this.budget.backend.maxErrorRate}%`);
    }
    
    return violations;
  }

  private measureWebVitals(): void {
    // 測量 First Contentful Paint (FCP)
    this.measureFCP();
    
    // 測量 Largest Contentful Paint (LCP)
    this.measureLCP();
    
    // 測量 First Input Delay (FID)
    this.measureFID();
    
    // 測量 Cumulative Layout Shift (CLS)
    this.measureCLS();
  }

  private measureFCP(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const currentMetrics = this.metrics.value;
          currentMetrics.frontend.firstContentfulPaint = entry.startTime;
          this.metrics.next(currentMetrics);
        }
      }
    });
    
    observer.observe({ entryTypes: ['paint'] });
  }

  private measureLCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      const currentMetrics = this.metrics.value;
      currentMetrics.frontend.largestContentfulPaint = lastEntry.startTime;
      this.metrics.next(currentMetrics);
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private measureFID(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const currentMetrics = this.metrics.value;
        currentMetrics.frontend.firstInputDelay = entry.processingStart - entry.startTime;
        this.metrics.next(currentMetrics);
      }
    });
    
    observer.observe({ entryTypes: ['first-input'] });
  }

  private measureCLS(): void {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      const currentMetrics = this.metrics.value;
      currentMetrics.frontend.cumulativeLayoutShift = clsValue;
      this.metrics.next(currentMetrics);
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private measureResourceLoading(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // 測量資源載入時間
          const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;
          this.measureCustomMetric(`resource_${resourceEntry.name}`, loadTime);
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }

  private measureRouteChange(): void {
    this.startTiming('route_change');
    
    // 等待下一個 tick 後結束計時
    setTimeout(() => {
      const duration = this.endTiming('route_change');
      this.measureCustomMetric('route_change_time', duration);
    }, 0);
  }

  private collectMetrics(): void {
    const currentMetrics = this.metrics.value;
    
    // 收集記憶體使用情況
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      currentMetrics.frontend.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
    
    // 收集網路資訊
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      currentMetrics.network.latency = connection.rtt;
      currentMetrics.network.bandwidth = connection.downlink;
    }
    
    this.metrics.next(currentMetrics);
  }

  private sendMetricToAnalytics(name: string, value: number): void {
    // 發送到分析服務
    this.http.post('/api/analytics/metrics', {
      name,
      value,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }).subscribe({
      error: (error) => console.error('Failed to send metric to analytics:', error)
    });
  }

  private getInitialMetrics(): PerformanceMetrics {
    return {
      frontend: {
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
        timeToInteractive: 0,
        bundleSize: 0,
        loadTime: 0,
        memoryUsage: 0
      },
      backend: {
        responseTime: 0,
        throughput: 0,
        errorRate: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        databaseQueryTime: 0
      },
      network: {
        latency: 0,
        bandwidth: 0,
        packetLoss: 0,
        connectionTime: 0
      },
      custom: {}
    };
  }

  private getPerformanceBudget(): PerformanceBudget {
    return {
      frontend: {
        maxBundleSize: 500, // 500KB
        maxLoadTime: 3000, // 3秒
        maxFCP: 1800, // 1.8秒
        maxLCP: 2500, // 2.5秒
        maxFID: 100, // 100ms
        maxCLS: 0.1 // 0.1
      },
      backend: {
        maxResponseTime: 500, // 500ms
        minThroughput: 100, // 100 req/s
        maxErrorRate: 1, // 1%
        maxCpuUsage: 80, // 80%
        maxMemoryUsage: 85 // 85%
      }
    };
  }
}
```

### 效能優化服務
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PerformanceOptimizerService implements PerformanceOptimizer {
  private http = inject(HttpClient);
  private performanceMonitor = inject(PerformanceMonitorService);
  
  private optimizationStatus = new BehaviorSubject<OptimizationStatus>('idle');
  public optimizationStatus$ = this.optimizationStatus.asObservable();

  async optimizeBundle(): Promise<void> {
    this.optimizationStatus.next('optimizing');
    
    try {
      // 分析打包大小
      const bundleAnalysis = await this.analyzeBundle();
      
      // 識別優化機會
      const optimizations = this.identifyBundleOptimizations(bundleAnalysis);
      
      // 執行優化
      for (const optimization of optimizations) {
        await this.executeBundleOptimization(optimization);
      }
      
      this.optimizationStatus.next('completed');
    } catch (error) {
      this.optimizationStatus.next('failed');
      throw error;
    }
  }

  async optimizeImages(): Promise<void> {
    this.optimizationStatus.next('optimizing');
    
    try {
      // 識別未優化的圖片
      const unoptimizedImages = await this.identifyUnoptimizedImages();
      
      // 執行圖片優化
      for (const image of unoptimizedImages) {
        await this.optimizeImage(image);
      }
      
      this.optimizationStatus.next('completed');
    } catch (error) {
      this.optimizationStatus.next('failed');
      throw error;
    }
  }

  async optimizeDatabase(): Promise<void> {
    this.optimizationStatus.next('optimizing');
    
    try {
      // 分析資料庫效能
      const dbAnalysis = await this.analyzeDatabasePerformance();
      
      // 識別優化機會
      const optimizations = this.identifyDatabaseOptimizations(dbAnalysis);
      
      // 執行優化
      for (const optimization of optimizations) {
        await this.executeDatabaseOptimization(optimization);
      }
      
      this.optimizationStatus.next('completed');
    } catch (error) {
      this.optimizationStatus.next('failed');
      throw error;
    }
  }

  async optimizeCache(): Promise<void> {
    this.optimizationStatus.next('optimizing');
    
    try {
      // 分析快取效率
      const cacheAnalysis = await this.analyzeCacheEfficiency();
      
      // 優化快取策略
      await this.optimizeCacheStrategy(cacheAnalysis);
      
      this.optimizationStatus.next('completed');
    } catch (error) {
      this.optimizationStatus.next('failed');
      throw error;
    }
  }

  async generateReport(): Promise<PerformanceReport> {
    const metrics = this.performanceMonitor.getMetrics();
    const violations = this.performanceMonitor.getBudgetViolations();
    const isWithinBudget = this.performanceMonitor.isWithinBudget();
    
    const report: PerformanceReport = {
      timestamp: new Date(),
      metrics,
      budgetViolations: violations,
      isWithinBudget,
      recommendations: this.generateRecommendations(metrics, violations),
      score: this.calculatePerformanceScore(metrics)
    };
    
    return report;
  }

  private async analyzeBundle(): Promise<BundleAnalysis> {
    // 分析打包大小和組成
    const response = await this.http.get<BundleAnalysis>('/api/performance/bundle-analysis').toPromise();
    return response!;
  }

  private identifyBundleOptimizations(analysis: BundleAnalysis): BundleOptimization[] {
    const optimizations: BundleOptimization[] = [];
    
    // 識別大型依賴
    if (analysis.largestDependencies.length > 0) {
      optimizations.push({
        type: 'split_large_dependencies',
        dependencies: analysis.largestDependencies,
        estimatedSavings: analysis.largestDependencies.reduce((sum, dep) => sum + dep.size, 0)
      });
    }
    
    // 識別未使用的程式碼
    if (analysis.unusedCode.length > 0) {
      optimizations.push({
        type: 'remove_unused_code',
        unusedCode: analysis.unusedCode,
        estimatedSavings: analysis.unusedCode.reduce((sum, code) => sum + code.size, 0)
      });
    }
    
    // 識別重複的程式碼
    if (analysis.duplicateCode.length > 0) {
      optimizations.push({
        type: 'deduplicate_code',
        duplicateCode: analysis.duplicateCode,
        estimatedSavings: analysis.duplicateCode.reduce((sum, code) => sum + code.size, 0)
      });
    }
    
    return optimizations;
  }

  private async executeBundleOptimization(optimization: BundleOptimization): Promise<void> {
    await this.http.post('/api/performance/bundle-optimization', optimization).toPromise();
  }

  private async identifyUnoptimizedImages(): Promise<UnoptimizedImage[]> {
    const response = await this.http.get<UnoptimizedImage[]>('/api/performance/unoptimized-images').toPromise();
    return response!;
  }

  private async optimizeImage(image: UnoptimizedImage): Promise<void> {
    await this.http.post(`/api/performance/optimize-image/${image.id}`, {
      format: 'webp',
      quality: 80,
      resize: image.resizeOptions
    }).toPromise();
  }

  private async analyzeDatabasePerformance(): Promise<DatabaseAnalysis> {
    const response = await this.http.get<DatabaseAnalysis>('/api/performance/database-analysis').toPromise();
    return response!;
  }

  private identifyDatabaseOptimizations(analysis: DatabaseAnalysis): DatabaseOptimization[] {
    const optimizations: DatabaseOptimization[] = [];
    
    // 識別慢查詢
    if (analysis.slowQueries.length > 0) {
      optimizations.push({
        type: 'optimize_slow_queries',
        queries: analysis.slowQueries,
        estimatedImprovement: analysis.slowQueries.reduce((sum, query) => sum + query.timeSaved, 0)
      });
    }
    
    // 識別缺少的索引
    if (analysis.missingIndexes.length > 0) {
      optimizations.push({
        type: 'add_missing_indexes',
        indexes: analysis.missingIndexes,
        estimatedImprovement: analysis.missingIndexes.reduce((sum, index) => sum + index.performanceGain, 0)
      });
    }
    
    return optimizations;
  }

  private async executeDatabaseOptimization(optimization: DatabaseOptimization): Promise<void> {
    await this.http.post('/api/performance/database-optimization', optimization).toPromise();
  }

  private async analyzeCacheEfficiency(): Promise<CacheAnalysis> {
    const response = await this.http.get<CacheAnalysis>('/api/performance/cache-analysis').toPromise();
    return response!;
  }

  private async optimizeCacheStrategy(analysis: CacheAnalysis): Promise<void> {
    await this.http.post('/api/performance/cache-optimization', {
      hitRate: analysis.hitRate,
      missRate: analysis.missRate,
      recommendations: analysis.recommendations
    }).toPromise();
  }

  private generateRecommendations(metrics: PerformanceMetrics, violations: string[]): string[] {
    const recommendations: string[] = [];
    
    // 基於違規生成建議
    violations.forEach(violation => {
      if (violation.includes('Bundle size')) {
        recommendations.push('考慮使用程式碼分割和懶加載來減少初始打包大小');
      }
      
      if (violation.includes('Load time')) {
        recommendations.push('優化圖片格式和大小，使用 CDN 加速資源載入');
      }
      
      if (violation.includes('FCP')) {
        recommendations.push('優化關鍵渲染路徑，減少阻塞資源');
      }
      
      if (violation.includes('Response time')) {
        recommendations.push('優化資料庫查詢，增加快取層');
      }
    });
    
    return recommendations;
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;
    
    // 基於各種指標計算分數
    const fcpScore = Math.max(0, 100 - (metrics.frontend.firstContentfulPaint / 100));
    const lcpScore = Math.max(0, 100 - (metrics.frontend.largestContentfulPaint / 100));
    const fidScore = Math.max(0, 100 - (metrics.frontend.firstInputDelay * 10));
    const clsScore = Math.max(0, 100 - (metrics.frontend.cumulativeLayoutShift * 1000));
    
    score = (fcpScore + lcpScore + fidScore + clsScore) / 4;
    
    return Math.round(score);
  }
}
```

### 效能優化指令
```typescript
import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { PerformanceMonitorService } from '@core/services/PerformanceMonitorService';

@Directive({
  selector: '[appPerformanceMonitor]'
})
export class PerformanceMonitorDirective implements OnInit, OnDestroy {
  @Input() componentName: string = '';
  
  private startTime: number = 0;

  constructor(
    private elementRef: ElementRef,
    private performanceMonitor: PerformanceMonitorService
  ) {}

  ngOnInit(): void {
    this.startTime = performance.now();
    this.performanceMonitor.startTiming(`component_${this.componentName}_render`);
  }

  ngOnDestroy(): void {
    const renderTime = this.performanceMonitor.endTiming(`component_${this.componentName}_render`);
    this.performanceMonitor.measureCustomMetric(`component_${this.componentName}_lifetime`, performance.now() - this.startTime);
  }
}
```

### 效能優化管道
```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'performanceFormat'
})
export class PerformanceFormatPipe implements PipeTransform {
  transform(value: number, type: 'time' | 'size' | 'percentage'): string {
    switch (type) {
      case 'time':
        return this.formatTime(value);
      case 'size':
        return this.formatSize(value);
      case 'percentage':
        return this.formatPercentage(value);
      default:
        return value.toString();
    }
  }

  private formatTime(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)}${units[unitIndex]}`;
  }

  private formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
  }
}
```

## 效能優化策略

### 1. 前端優化
- **程式碼分割**: 使用 Angular 的懶加載和動態導入
- **圖片優化**: 使用 WebP 格式和響應式圖片
- **快取策略**: 實作 Service Worker 和 HTTP 快取
- **CDN 配置**: 使用 CDN 加速靜態資源載入

### 2. 後端優化
- **資料庫優化**: 索引優化和查詢優化
- **API 優化**: 實作分頁和欄位選擇
- **快取層**: 使用 Redis 或 Memcached
- **負載平衡**: 分散請求負載

### 3. 監控和警報
- **即時監控**: 監控關鍵效能指標
- **自動警報**: 當效能指標超出預算時自動警報
- **效能報告**: 定期生成效能分析報告

## AI Agent 友好特性

### 1. 自動化效能優化
- 自動識別效能瓶頸
- 提供優化建議
- 執行自動化優化

### 2. 效能預算管理
- 設定效能預算
- 監控預算違規
- 提供預算建議

### 3. 效能分析報告
- 生成詳細的效能分析報告
- 提供優化建議
- 追蹤效能改善進度

## 相關檔案
- `Error Handling Strategy.md` - 錯誤處理策略
- `Caching Strategy.md` - 快取策略
- `Monitoring Strategy.md` - 監控策略
- `Security Strategy.md` - 安全策略
