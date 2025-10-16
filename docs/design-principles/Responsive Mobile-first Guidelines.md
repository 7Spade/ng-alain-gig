# Responsive / Mobile-first Guidelines - 響應式設計與行動裝置優化

> **AI Agent 友好指南**：本文件提供營建專案管理系統的響應式設計最佳實踐，包含具體的實作範例、檢查清單和代碼模板。

## 📱 設計原則

### 1. Mobile-First 策略
- **優先設計移動設備**：從最小螢幕開始設計，逐步擴展到桌面
- **觸控優先**：所有交互元素至少 44px × 44px（iOS HIG 建議）
- **單手操作**：重要功能應在拇指可及範圍內

### 2. 營建現場特殊考慮
- **戶外可見性**：高對比度設計，支援強光環境
- **手套操作**：增大觸控目標，減少精確點擊需求
- **網路環境**：考慮工地網路不穩定，優化載入速度
- **電池續航**：減少動畫和複雜效果，延長設備使用時間

## 🎯 斷點定義

### ng-zorro-antd 標準斷點
```typescript
// 標準響應式斷點配置
const BREAKPOINTS = {
  xs: '575px',   // 手機直向
  sm: '576px',   // 手機橫向
  md: '768px',   // 平板
  lg: '992px',   // 小桌面
  xl: '1200px',  // 大桌面
  xxl: '1600px'  // 超大螢幕
} as const;

// 營建專案特殊斷點
const CONSTRUCTION_BREAKPOINTS = {
  mobile: '480px',    // 工地手機
  tablet: '768px',    // 工地平板
  desktop: '1024px',  // 辦公室桌面
  large: '1440px'     // 大螢幕監控
} as const;
```

### CSS 媒體查詢範例
```scss
// 營建專案響應式樣式
@mixin construction-responsive {
  // 手機優先
  @media (max-width: 575px) {
    .construction-mobile {
      padding: 8px;
      font-size: 14px;
      
      // 增大觸控目標
      .btn, .form-control {
        min-height: 44px;
        padding: 12px 16px;
      }
      
      // 簡化導航
      .nav-mobile {
        position: fixed;
        bottom: 0;
        width: 100%;
        z-index: 1000;
      }
    }
  }
  
  // 平板適配
  @media (min-width: 576px) and (max-width: 991px) {
    .construction-tablet {
      .sidebar {
        width: 200px;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        
        &.open {
          transform: translateX(0);
        }
      }
    }
  }
  
  // 桌面優化
  @media (min-width: 992px) {
    .construction-desktop {
      .main-content {
        margin-left: 250px;
      }
      
      .sidebar {
        width: 250px;
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
      }
    }
  }
}
```

## 🧩 組件響應式實作

### 1. 網格系統 (nz-row / nz-col)
```html
<!-- 響應式網格範例 -->
<nz-row [nzGutter]="16">
  <!-- 手機：全寬，平板：半寬，桌面：1/3寬 -->
  <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="8">
    <div class="project-card">
      <h3>專案資訊</h3>
      <p>專案名稱：{{ project.name }}</p>
    </div>
  </nz-col>
  
  <!-- 手機：全寬，平板：全寬，桌面：2/3寬 -->
  <nz-col [nzXs]="24" [nzSm]="24" [nzMd]="16" [nzLg]="16">
    <div class="project-details">
      <h3>專案詳情</h3>
      <!-- 專案詳細內容 -->
    </div>
  </nz-col>
</nz-row>
```

### 2. 側邊欄響應式 (nz-sider)
```typescript
@Component({
  selector: 'app-responsive-layout',
  template: `
    <nz-layout>
      <nz-sider
        [nzCollapsed]="isCollapsed"
        [nzCollapsible]="true"
        [nzBreakpoint]="'lg'"
        [nzCollapsedWidth]="0"
        (nzCollapsedChange)="onCollapsedChange($event)">
        
        <!-- 側邊欄內容 -->
        <div class="sidebar-content">
          <app-navigation></app-navigation>
        </div>
      </nz-sider>
      
      <nz-layout>
        <nz-header>
          <!-- 手機端顯示漢堡選單 -->
          <button 
            nz-button 
            nzType="text" 
            class="mobile-menu-btn"
            (click)="toggleMobileMenu()"
            *ngIf="isMobile">
            <i nz-icon nzType="menu"></i>
          </button>
          
          <h1>營建專案管理系統</h1>
        </nz-header>
        
        <nz-content>
          <router-outlet></router-outlet>
        </nz-content>
      </nz-layout>
    </nz-layout>
  `
})
export class ResponsiveLayoutComponent {
  isCollapsed = false;
  isMobile = false;
  
  constructor(private breakpointObserver: BreakpointObserver) {
    // 監聽斷點變化
    this.breakpointObserver.observe(['(max-width: 991px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }
  
  onCollapsedChange(collapsed: boolean) {
    this.isCollapsed = collapsed;
  }
  
  toggleMobileMenu() {
    this.isCollapsed = !this.isCollapsed;
  }
}
```

### 3. 表格響應式 (nz-table)
```html
<!-- 響應式表格範例 -->
<nz-table
  #basicTable
  [nzData]="projectList"
  [nzScroll]="getTableScroll()"
  [nzSize]="getTableSize()">
  
  <thead>
    <tr>
      <th nzWidth="120px">專案名稱</th>
      <th nzWidth="100px" *ngIf="!isMobile">狀態</th>
      <th nzWidth="120px" *ngIf="!isMobile">負責人</th>
      <th nzWidth="100px">進度</th>
      <th nzWidth="80px">操作</th>
    </tr>
  </thead>
  
  <tbody>
    <tr *ngFor="let project of basicTable.data">
      <td>{{ project.name }}</td>
      <td *ngIf="!isMobile">
        <nz-tag [nzColor]="getStatusColor(project.status)">
          {{ project.status }}
        </nz-tag>
      </td>
      <td *ngIf="!isMobile">{{ project.manager }}</td>
      <td>
        <nz-progress 
          [nzPercent]="project.progress" 
          [nzSize]="isMobile ? 'small' : 'default'">
        </nz-progress>
      </td>
      <td>
        <button nz-button nzType="link" nzSize="small">
          查看
        </button>
      </td>
    </tr>
  </tbody>
</nz-table>
```

```typescript
// 表格響應式邏輯
export class ProjectListComponent {
  isMobile = false;
  
  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }
  
  getTableScroll() {
    return this.isMobile ? { x: '600px' } : null;
  }
  
  getTableSize() {
    return this.isMobile ? 'small' : 'default';
  }
}
```

## 📋 表單響應式設計

### 1. 表單佈局
```html
<!-- 響應式表單範例 -->
<nz-form [nzLayout]="getFormLayout()">
  <nz-form-item>
    <nz-form-label [nzSpan]="getLabelSpan()">專案名稱</nz-form-label>
    <nz-form-control [nzSpan]="getControlSpan()">
      <input nz-input [(ngModel)]="projectForm.name" />
    </nz-form-control>
  </nz-form-item>
  
  <nz-form-item>
    <nz-form-label [nzSpan]="getLabelSpan()">專案描述</nz-form-label>
    <nz-form-control [nzSpan]="getControlSpan()">
      <textarea nz-input [(ngModel)]="projectForm.description"></textarea>
    </nz-form-control>
  </nz-form-item>
  
  <!-- 手機端：垂直排列，桌面端：水平排列 -->
  <nz-form-item>
    <nz-form-label [nzSpan]="getLabelSpan()">開始日期</nz-form-label>
    <nz-form-control [nzSpan]="getControlSpan()">
      <nz-date-picker [(ngModel)]="projectForm.startDate"></nz-date-picker>
    </nz-form-control>
  </nz-form-item>
</nz-form>
```

```typescript
// 表單響應式邏輯
export class ProjectFormComponent {
  isMobile = false;
  
  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }
  
  getFormLayout() {
    return this.isMobile ? 'vertical' : 'horizontal';
  }
  
  getLabelSpan() {
    return this.isMobile ? 24 : 6;
  }
  
  getControlSpan() {
    return this.isMobile ? 24 : 18;
  }
}
```

## 🎨 主題與樣式

### 1. 響應式主題配置
```typescript
// 響應式主題服務
@Injectable()
export class ResponsiveThemeService {
  private currentTheme = signal<'light' | 'dark'>('light');
  private isMobile = signal(false);
  
  constructor(
    private nzConfigService: NzConfigService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.initResponsiveTheme();
  }
  
  private initResponsiveTheme() {
    // 監聽斷點變化
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .subscribe(result => {
        this.isMobile.set(result.matches);
        this.updateThemeForDevice();
      });
    
    // 監聽系統主題偏好
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          this.currentTheme.set(e.matches ? 'dark' : 'light');
          this.updateThemeForDevice();
        });
    }
  }
  
  private updateThemeForDevice() {
    const themeConfig = {
      primaryColor: this.isMobile() ? '#1890ff' : '#722ed1',
      borderRadius: this.isMobile() ? 4 : 6,
      fontSize: this.isMobile() ? 14 : 16,
      // 營建現場優化
      contrastRatio: 1.2, // 提高對比度
      touchTargetSize: this.isMobile() ? 44 : 32
    };
    
    this.nzConfigService.set('theme', themeConfig);
  }
}
```

### 2. 營建現場樣式優化
```scss
// 營建現場響應式樣式
.construction-responsive {
  // 高對比度設計
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  
  // 觸控友好
  --touch-target-min: 44px;
  --touch-padding: 12px;
  
  // 字體大小
  --font-size-mobile: 16px; // 防止 iOS 縮放
  --font-size-tablet: 14px;
  --font-size-desktop: 14px;
  
  // 間距
  --spacing-mobile: 8px;
  --spacing-tablet: 12px;
  --spacing-desktop: 16px;
}

// 響應式按鈕
.btn-responsive {
  min-height: var(--touch-target-min);
  padding: var(--touch-padding);
  font-size: var(--font-size-mobile);
  
  @media (min-width: 768px) {
    font-size: var(--font-size-tablet);
    padding: calc(var(--touch-padding) * 0.75);
  }
  
  @media (min-width: 1024px) {
    font-size: var(--font-size-desktop);
    padding: calc(var(--touch-padding) * 0.5);
  }
}

// 響應式卡片
.card-responsive {
  margin: var(--spacing-mobile);
  border-radius: 8px;
  
  @media (min-width: 768px) {
    margin: var(--spacing-tablet);
    border-radius: 12px;
  }
  
  @media (min-width: 1024px) {
    margin: var(--spacing-desktop);
    border-radius: 16px;
  }
}
```

## 🔧 實用工具與服務

### 1. 響應式工具服務
```typescript
@Injectable()
export class ResponsiveService {
  private breakpointObserver = inject(BreakpointObserver);
  
  // 斷點狀態
  isMobile$ = this.breakpointObserver.observe(['(max-width: 768px)'])
    .pipe(map(result => result.matches));
    
  isTablet$ = this.breakpointObserver.observe(['(min-width: 769px) and (max-width: 1023px)'])
    .pipe(map(result => result.matches));
    
  isDesktop$ = this.breakpointObserver.observe(['(min-width: 1024px)'])
    .pipe(map(result => result.matches));
  
  // 設備類型判斷
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (window.innerWidth <= 768) return 'mobile';
    if (window.innerWidth <= 1023) return 'tablet';
    return 'desktop';
  }
  
  // 觸控設備檢測
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  
  // 高解析度螢幕檢測
  isHighDPI(): boolean {
    return window.devicePixelRatio > 1;
  }
}
```

### 2. 響應式指令
```typescript
@Directive({
  selector: '[appResponsive]',
  standalone: true
})
export class ResponsiveDirective {
  @Input() appResponsive: 'mobile' | 'tablet' | 'desktop' | 'all' = 'all';
  
  private elementRef = inject(ElementRef);
  private responsiveService = inject(ResponsiveService);
  
  ngOnInit() {
    this.responsiveService.isMobile$.subscribe(isMobile => {
      this.updateVisibility(isMobile ? 'mobile' : 'desktop');
    });
  }
  
  private updateVisibility(deviceType: string) {
    const element = this.elementRef.nativeElement;
    
    if (this.appResponsive === 'all' || this.appResponsive === deviceType) {
      element.style.display = '';
    } else {
      element.style.display = 'none';
    }
  }
}
```

## ✅ AI Agent 實作檢查清單

### 響應式設計檢查清單
- [ ] **斷點配置**：使用 ng-zorro-antd 標準斷點
- [ ] **觸控目標**：所有可點擊元素至少 44px × 44px
- [ ] **字體大小**：手機端至少 16px，防止自動縮放
- [ ] **對比度**：符合 WCAG AA 標準（4.5:1）
- [ ] **載入速度**：首屏載入時間 < 3 秒
- [ ] **圖片優化**：使用響應式圖片和適當壓縮
- [ ] **導航設計**：手機端使用底部導航或漢堡選單
- [ ] **表單優化**：手機端使用垂直佈局
- [ ] **表格適配**：小螢幕使用橫向滾動或卡片佈局
- [ ] **主題適配**：支援深色模式和系統偏好

### 營建現場特殊檢查
- [ ] **戶外可見性**：高對比度色彩搭配
- [ ] **手套操作**：增大觸控目標和間距
- [ ] **網路優化**：離線功能和快取策略
- [ ] **電池優化**：減少動畫和背景活動
- [ ] **錯誤處理**：網路中斷時的友善提示
- [ ] **資料同步**：離線編輯和上線同步
- [ ] **安全性**：敏感資料的保護措施

## 📚 參考資源

### 官方文件
- [Angular 響應式設計指南](https://angular.dev/guide/responsive-design)
- [ng-zorro-antd 響應式組件](https://ng.ant.design/components/layout/zh)
- [Ant Design 響應式設計](https://ant.design/docs/spec/responsive-cn)

### 設計系統
- [Material Design 響應式設計](https://material.io/design/layout/responsive-layout-grid.html)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design/layout/responsive-layout-grid.html)

### 工具與測試
- [Chrome DevTools 響應式測試](https://developers.google.com/web/tools/chrome-devtools/device-mode)
- [Lighthouse 效能測試](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest 響應式測試](https://www.webpagetest.org/)

---

> **AI Agent 提示**：實作響應式設計時，請優先考慮營建現場的實際使用場景，確保在各種環境下都能提供良好的用戶體驗。使用本指南中的檢查清單確保實作品質。
