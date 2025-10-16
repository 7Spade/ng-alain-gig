# UI Component Library Guidelines - UI 元件庫使用規範

> **AI Agent 友好指南**：本文件提供營建專案管理系統的 UI 元件庫使用規範，包含組件選擇策略、主題定制、無障礙設計和實作最佳實踐。

## 🎯 組件庫架構

### 技術棧組成
```typescript
// 主要 UI 組件庫
const UI_LIBRARIES = {
  // 核心組件庫
  'ng-zorro-antd': {
    version: '^17.0.0',
    purpose: '主要 UI 組件庫',
    components: ['Button', 'Table', 'Form', 'Modal', 'Layout']
  },
  
  // 企業級組件
  '@delon/abc': {
    version: '^17.0.0',
    purpose: '企業級業務組件',
    components: ['ST', 'SF', 'SV', 'SE', 'SG']
  },
  
  // 主題系統
  '@delon/theme': {
    version: '^17.0.0',
    purpose: '主題和樣式管理',
    features: ['主題切換', '響應式', '深色模式']
  },
  
  // 工具庫
  '@delon/util': {
    version: '^17.0.0',
    purpose: '工具函數和指令',
    features: ['日期處理', '字串處理', '表單驗證']
  }
} as const;
```

## 🧩 組件選擇策略

### 1. 組件選擇決策樹
```typescript
// 組件選擇邏輯
export class ComponentSelectionService {
  
  selectComponent(requirements: ComponentRequirements): ComponentChoice {
    // 1. 優先使用 ng-zorro-antd 基礎組件
    if (requirements.type === 'basic') {
      return this.selectBasicComponent(requirements);
    }
    
    // 2. 複雜業務邏輯使用 @delon/abc
    if (requirements.type === 'business') {
      return this.selectBusinessComponent(requirements);
    }
    
    // 3. 自定義組件開發
    if (requirements.type === 'custom') {
      return this.selectCustomComponent(requirements);
    }
  }
  
  private selectBasicComponent(req: ComponentRequirements): ComponentChoice {
    const componentMap = {
      'button': 'nz-button',
      'input': 'nz-input',
      'select': 'nz-select',
      'date-picker': 'nz-date-picker',
      'table': 'nz-table',
      'modal': 'nz-modal',
      'form': 'nz-form',
      'card': 'nz-card',
      'tabs': 'nz-tabs',
      'menu': 'nz-menu'
    };
    
    return {
      component: componentMap[req.elementType],
      library: 'ng-zorro-antd',
      customization: req.customization
    };
  }
  
  private selectBusinessComponent(req: ComponentRequirements): ComponentChoice {
    const businessMap = {
      'smart-table': 'st',
      'schema-form': 'sf',
      'statistic': 'sv',
      'ellipsis': 'se',
      'g2': 'sg'
    };
    
    return {
      component: businessMap[req.elementType],
      library: '@delon/abc',
      customization: req.customization
    };
  }
}
```

### 2. 組件使用優先級
```typescript
// 組件使用優先級定義
export const COMPONENT_PRIORITY = {
  // 第一優先級：ng-zorro-antd 基礎組件
  PRIMARY: [
    'nz-button',      // 按鈕
    'nz-input',        // 輸入框
    'nz-select',       // 選擇器
    'nz-date-picker',  // 日期選擇器
    'nz-table',        // 表格
    'nz-modal',        // 彈窗
    'nz-form',         // 表單
    'nz-card',         // 卡片
    'nz-tabs',         // 標籤頁
    'nz-menu',         // 選單
    'nz-layout',       // 佈局
    'nz-grid'          // 網格
  ],
  
  // 第二優先級：@delon/abc 業務組件
  SECONDARY: [
    'st',              // Smart Table
    'sf',              // Schema Form
    'sv',              // Statistic View
    'se',              // Ellipsis
    'sg'               // G2 Chart
  ],
  
  // 第三優先級：自定義組件
  CUSTOM: [
    'app-project-card',     // 專案卡片
    'app-task-list',        // 任務列表
    'app-cost-breakdown',   // 成本分解
    'app-safety-checklist', // 安全檢查清單
    'app-weather-widget'    // 天氣小工具
  ]
} as const;
```

## 🎨 主題定制指南

### 1. 主題配置服務
```typescript
@Injectable()
export class ThemeService {
  private nzConfigService = inject(NzConfigService);
  private currentTheme = signal<'light' | 'dark'>('light');
  
  // 營建專案主題配置
  private readonly CONSTRUCTION_THEME = {
    // 主色調 - 工程藍
    primaryColor: '#1890ff',
    
    // 功能色彩
    successColor: '#52c41a',    // 成功 - 綠色
    warningColor: '#faad14',   // 警告 - 橙色
    errorColor: '#ff4d4f',     // 錯誤 - 紅色
    infoColor: '#1890ff',      // 資訊 - 藍色
    
    // 中性色彩
    textColor: '#262626',
    textColorSecondary: '#8c8c8c',
    backgroundColor: '#ffffff',
    backgroundColorSecondary: '#fafafa',
    
    // 邊框和分割線
    borderColor: '#d9d9d9',
    borderColorSplit: '#f0f0f0',
    
    // 陰影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    boxShadowSecondary: '0 1px 4px rgba(0, 0, 0, 0.1)',
    
    // 圓角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    
    // 字體
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 18,
    
    // 間距
    padding: 16,
    paddingLG: 24,
    paddingSM: 8,
    paddingXS: 4,
    
    // 高度
    height: 32,
    heightLG: 40,
    heightSM: 24,
    heightXS: 16
  };
  
  // 深色主題配置
  private readonly DARK_THEME = {
    ...this.CONSTRUCTION_THEME,
    textColor: '#ffffff',
    textColorSecondary: '#a6a6a6',
    backgroundColor: '#141414',
    backgroundColorSecondary: '#1f1f1f',
    borderColor: '#434343',
    borderColorSplit: '#303030'
  };
  
  constructor() {
    this.initTheme();
  }
  
  private initTheme() {
    // 從本地儲存讀取主題偏好
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // 檢測系統主題偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }
  
  setTheme(theme: 'light' | 'dark') {
    this.currentTheme.set(theme);
    const themeConfig = theme === 'dark' ? this.DARK_THEME : this.CONSTRUCTION_THEME;
    
    // 應用主題配置
    this.nzConfigService.set('theme', themeConfig);
    
    // 儲存主題偏好
    localStorage.setItem('theme', theme);
    
    // 更新 HTML 類別
    document.documentElement.className = theme;
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
  
  getCurrentTheme() {
    return this.currentTheme.asReadonly();
  }
}
```

### 2. 響應式主題適配
```scss
// 響應式主題變數
:root {
  // 基礎主題變數
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  
  // 響應式字體大小
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-sm: 12px;
  
  // 響應式間距
  --spacing-base: 16px;
  --spacing-lg: 24px;
  --spacing-sm: 8px;
  
  // 響應式圓角
  --border-radius-base: 6px;
  --border-radius-lg: 8px;
  --border-radius-sm: 4px;
}

// 手機端主題適配
@media (max-width: 768px) {
  :root {
    --font-size-base: 16px;  // 防止 iOS 縮放
    --font-size-lg: 18px;
    --font-size-sm: 14px;
    
    --spacing-base: 12px;
    --spacing-lg: 16px;
    --spacing-sm: 6px;
    
    --border-radius-base: 8px;
    --border-radius-lg: 12px;
    --border-radius-sm: 6px;
  }
}

// 深色主題
[data-theme="dark"] {
  --primary-color: #177ddc;
  --success-color: #49aa19;
  --warning-color: #d89614;
  --error-color: #d32029;
  
  --text-color: #ffffff;
  --text-color-secondary: #a6a6a6;
  --background-color: #141414;
  --background-color-secondary: #1f1f1f;
  --border-color: #434343;
  --border-color-split: #303030;
}
```

## 🧩 組件實作範例

### 1. 基礎組件封裝
```typescript
// 專案卡片組件
@Component({
  selector: 'app-project-card',
  template: `
    <nz-card 
      [nzTitle]="project.name"
      [nzExtra]="extraTemplate"
      [nzActions]="actions"
      [nzLoading]="loading"
      class="project-card">
      
      <!-- 專案狀態 -->
      <div class="project-status">
        <nz-tag [nzColor]="getStatusColor(project.status)">
          {{ project.status }}
        </nz-tag>
        <span class="project-progress">
          進度: {{ project.progress }}%
        </span>
      </div>
      
      <!-- 專案資訊 -->
      <div class="project-info">
        <div class="info-item">
          <i nz-icon nzType="user"></i>
          <span>負責人: {{ project.manager }}</span>
        </div>
        <div class="info-item">
          <i nz-icon nzType="calendar"></i>
          <span>開始日期: {{ project.startDate | date:'yyyy-MM-dd' }}</span>
        </div>
        <div class="info-item">
          <i nz-icon nzType="dollar"></i>
          <span>預算: {{ project.budget | currency:'TWD':'symbol':'1.0-0' }}</span>
        </div>
      </div>
      
      <!-- 進度條 -->
      <div class="project-progress-bar">
        <nz-progress 
          [nzPercent]="project.progress"
          [nzStrokeColor]="getProgressColor(project.progress)"
          [nzSize]="'small'">
        </nz-progress>
      </div>
    </nz-card>
    
    <!-- 額外操作按鈕 -->
    <ng-template #extraTemplate>
      <button nz-button nzType="text" nzSize="small" (click)="onEdit()">
        <i nz-icon nzType="edit"></i>
      </button>
      <button nz-button nzType="text" nzSize="small" (click)="onDelete()">
        <i nz-icon nzType="delete"></i>
      </button>
    </ng-template>
  `,
  styles: [`
    .project-card {
      margin-bottom: var(--spacing-base);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--box-shadow-base);
      
      &:hover {
        box-shadow: var(--box-shadow-lg);
        transform: translateY(-2px);
        transition: all 0.3s ease;
      }
    }
    
    .project-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
    }
    
    .project-info {
      margin-bottom: var(--spacing-sm);
      
      .info-item {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
        
        i {
          margin-right: 8px;
          color: var(--text-color-secondary);
        }
      }
    }
    
    .project-progress-bar {
      margin-top: var(--spacing-sm);
    }
  `]
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Input() loading = false;
  @Output() edit = new EventEmitter<Project>();
  @Output() delete = new EventEmitter<Project>();
  
  getStatusColor(status: string): string {
    const statusColors = {
      '規劃中': 'blue',
      '進行中': 'green',
      '暫停': 'orange',
      '已完成': 'purple',
      '已取消': 'red'
    };
    return statusColors[status] || 'default';
  }
  
  getProgressColor(progress: number): string {
    if (progress < 30) return '#ff4d4f';
    if (progress < 70) return '#faad14';
    return '#52c41a';
  }
  
  onEdit() {
    this.edit.emit(this.project);
  }
  
  onDelete() {
    this.delete.emit(this.project);
  }
}
```

### 2. Smart Table 使用範例
```typescript
// 專案列表組件
@Component({
  selector: 'app-project-list',
  template: `
    <st 
      #st
      [data]="projectList$"
      [columns]="columns"
      [req]="req"
      [res]="res"
      [page]="page"
      [ps]="ps"
      [total]="total"
      [loading]="loading"
      (change)="onTableChange($event)"
      class="project-list-table">
      
      <!-- 自定義列模板 -->
      <ng-template #statusTemplate let-status="status">
        <nz-tag [nzColor]="getStatusColor(status)">
          {{ status }}
        </nz-tag>
      </ng-template>
      
      <ng-template #progressTemplate let-progress="progress">
        <nz-progress 
          [nzPercent]="progress"
          [nzSize]="'small'"
          [nzStrokeColor]="getProgressColor(progress)">
        </nz-progress>
      </ng-template>
      
      <ng-template #actionTemplate let-record="record">
        <button nz-button nzType="link" nzSize="small" (click)="onView(record)">
          查看
        </button>
        <button nz-button nzType="link" nzSize="small" (click)="onEdit(record)">
          編輯
        </button>
        <button nz-button nzType="link" nzSize="small" nzDanger (click)="onDelete(record)">
          刪除
        </button>
      </ng-template>
    </st>
  `
})
export class ProjectListComponent {
  @ViewChild('st') st!: STComponent;
  
  projectList$ = this.projectService.getProjectList();
  loading = false;
  total = 0;
  page = 1;
  ps = 10;
  
  // Smart Table 配置
  columns: STColumn[] = [
    {
      title: '專案名稱',
      index: 'name',
      width: '200px',
      sort: true,
      filter: {
        type: 'keyword',
        placeholder: '搜尋專案名稱'
      }
    },
    {
      title: '狀態',
      index: 'status',
      width: '120px',
      type: 'tag',
      tag: {
        '規劃中': { color: 'blue' },
        '進行中': { color: 'green' },
        '暫停': { color: 'orange' },
        '已完成': { color: 'purple' },
        '已取消': { color: 'red' }
      }
    },
    {
      title: '負責人',
      index: 'manager',
      width: '120px',
      sort: true
    },
    {
      title: '進度',
      index: 'progress',
      width: '150px',
      type: 'progress'
    },
    {
      title: '開始日期',
      index: 'startDate',
      type: 'date',
      width: '120px',
      sort: true
    },
    {
      title: '預算',
      index: 'budget',
      type: 'currency',
      width: '120px',
      sort: true
    },
    {
      title: '操作',
      width: '150px',
      type: 'widget',
      widget: {
        type: 'action',
        buttons: [
          {
            text: '查看',
            click: (record) => this.onView(record)
          },
          {
            text: '編輯',
            click: (record) => this.onEdit(record)
          },
          {
            text: '刪除',
            click: (record) => this.onDelete(record),
            popTitle: '確定要刪除這個專案嗎？'
          }
        ]
      }
    }
  ];
  
  req: STReq = {
    method: 'GET',
    allInBody: false,
    reName: {
      pi: 'page',
      ps: 'size',
      total: 'total'
    }
  };
  
  res: STRes = {
    process: (data: any[]) => {
      return data.map(item => ({
        ...item,
        startDate: new Date(item.startDate),
        budget: Number(item.budget)
      }));
    }
  };
  
  constructor(private projectService: ProjectService) {}
  
  onTableChange(e: STChange) {
    switch (e.type) {
      case 'pi':
        this.page = e.pi;
        break;
      case 'ps':
        this.ps = e.ps;
        break;
      case 'sort':
        // 處理排序
        break;
      case 'filter':
        // 處理篩選
        break;
    }
  }
  
  onView(record: any) {
    // 查看專案詳情
  }
  
  onEdit(record: any) {
    // 編輯專案
  }
  
  onDelete(record: any) {
    // 刪除專案
  }
}
```

### 3. Schema Form 使用範例
```typescript
// 專案表單組件
@Component({
  selector: 'app-project-form',
  template: `
    <sf 
      #sf
      [schema]="schema"
      [formData]="formData"
      [ui]="ui"
      [form]="form"
      [loading]="loading"
      (formSubmit)="onSubmit($event)"
      (formReset)="onReset()"
      class="project-form">
    </sf>
  `
})
export class ProjectFormComponent {
  @ViewChild('sf') sf!: SFComponent;
  
  formData: any = {};
  loading = false;
  
  // Schema 定義
  schema: SFSchema = {
    properties: {
      name: {
        type: 'string',
        title: '專案名稱',
        maxLength: 100,
        ui: {
          placeholder: '請輸入專案名稱',
          errors: {
            required: '專案名稱為必填項'
          }
        }
      },
      description: {
        type: 'string',
        title: '專案描述',
        ui: {
          widget: 'textarea',
          placeholder: '請輸入專案描述',
          autosize: { minRows: 3, maxRows: 6 }
        }
      },
      status: {
        type: 'string',
        title: '專案狀態',
        enum: [
          { label: '規劃中', value: 'planning' },
          { label: '進行中', value: 'active' },
          { label: '暫停', value: 'paused' },
          { label: '已完成', value: 'completed' },
          { label: '已取消', value: 'cancelled' }
        ],
        default: 'planning',
        ui: {
          widget: 'select'
        }
      },
      manager: {
        type: 'string',
        title: '專案負責人',
        ui: {
          widget: 'select',
          asyncData: () => this.getManagerOptions()
        }
      },
      startDate: {
        type: 'string',
        format: 'date',
        title: '開始日期',
        ui: {
          widget: 'date',
          placeholder: '請選擇開始日期'
        }
      },
      endDate: {
        type: 'string',
        format: 'date',
        title: '結束日期',
        ui: {
          widget: 'date',
          placeholder: '請選擇結束日期'
        }
      },
      budget: {
        type: 'number',
        title: '專案預算',
        minimum: 0,
        ui: {
          widget: 'number',
          placeholder: '請輸入專案預算',
          addOnAfter: 'TWD'
        }
      },
      team: {
        type: 'array',
        title: '專案團隊',
        items: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              title: '成員',
              ui: {
                widget: 'select',
                asyncData: () => this.getUserOptions()
              }
            },
            role: {
              type: 'string',
              title: '角色',
              enum: [
                { label: '專案經理', value: 'manager' },
                { label: '工程師', value: 'engineer' },
                { label: '監工', value: 'supervisor' },
                { label: '承包商', value: 'contractor' }
              ],
              ui: {
                widget: 'select'
              }
            }
          }
        },
        ui: {
          widget: 'array',
          addTitle: '新增團隊成員',
          removeTitle: '移除'
        }
      }
    },
    required: ['name', 'status', 'manager', 'startDate', 'budget'],
    ui: {
      spanLabelFixed: 100,
      grid: { span: 24 }
    }
  };
  
  // UI 配置
  ui: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: { span: 24 }
    },
    $name: {
      grid: { span: 12 }
    },
    $description: {
      grid: { span: 24 }
    },
    $status: {
      grid: { span: 12 }
    },
    $manager: {
      grid: { span: 12 }
    },
    $startDate: {
      grid: { span: 12 }
    },
    $endDate: {
      grid: { span: 12 }
    },
    $budget: {
      grid: { span: 12 }
    },
    $team: {
      grid: { span: 24 }
    }
  };
  
  form = this.fb.group({});
  
  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private userService: UserService
  ) {}
  
  async getManagerOptions() {
    const users = await this.userService.getManagers().toPromise();
    return users.map(user => ({
      label: user.name,
      value: user.id
    }));
  }
  
  async getUserOptions() {
    const users = await this.userService.getUsers().toPromise();
    return users.map(user => ({
      label: user.name,
      value: user.id
    }));
  }
  
  onSubmit(value: any) {
    this.loading = true;
    this.projectService.createProject(value).subscribe({
      next: (result) => {
        this.loading = false;
        // 成功處理
      },
      error: (error) => {
        this.loading = false;
        // 錯誤處理
      }
    });
  }
  
  onReset() {
    this.formData = {};
    this.form.reset();
  }
}
```

## ♿ 無障礙設計原則

### 1. 無障礙檢查清單
```typescript
// 無障礙檢查服務
@Injectable()
export class AccessibilityService {
  
  // 無障礙檢查清單
  checkAccessibility(element: HTMLElement): AccessibilityReport {
    const report: AccessibilityReport = {
      issues: [],
      score: 100
    };
    
    // 檢查對比度
    this.checkContrast(element, report);
    
    // 檢查鍵盤導航
    this.checkKeyboardNavigation(element, report);
    
    // 檢查 ARIA 標籤
    this.checkAriaLabels(element, report);
    
    // 檢查焦點管理
    this.checkFocusManagement(element, report);
    
    return report;
  }
  
  private checkContrast(element: HTMLElement, report: AccessibilityReport) {
    const textElements = element.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    textElements.forEach(el => {
      const contrast = this.calculateContrast(el);
      if (contrast < 4.5) {
        report.issues.push({
          type: 'contrast',
          message: `對比度不足: ${contrast.toFixed(2)}`,
          element: el
        });
        report.score -= 10;
      }
    });
  }
  
  private checkKeyboardNavigation(element: HTMLElement, report: AccessibilityReport) {
    const interactiveElements = element.querySelectorAll('button, input, select, textarea, a');
    interactiveElements.forEach(el => {
      if (!el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '0') {
        report.issues.push({
          type: 'keyboard',
          message: '缺少鍵盤導航支援',
          element: el
        });
        report.score -= 5;
      }
    });
  }
  
  private checkAriaLabels(element: HTMLElement, report: AccessibilityReport) {
    const formElements = element.querySelectorAll('input, select, textarea');
    formElements.forEach(el => {
      if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
        report.issues.push({
          type: 'aria',
          message: '缺少 ARIA 標籤',
          element: el
        });
        report.score -= 5;
      }
    });
  }
  
  private checkFocusManagement(element: HTMLElement, report: AccessibilityReport) {
    const focusableElements = element.querySelectorAll('[tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      // 檢查焦點陷阱
      if (!this.hasFocusTrap(firstElement, lastElement)) {
        report.issues.push({
          type: 'focus',
          message: '缺少焦點管理',
          element: element
        });
        report.score -= 10;
      }
    }
  }
}
```

### 2. 無障礙組件範例
```typescript
// 無障礙按鈕組件
@Component({
  selector: 'app-accessible-button',
  template: `
    <button 
      nz-button
      [nzType]="type"
      [nzSize]="size"
      [nzLoading]="loading"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
      [attr.aria-describedby]="ariaDescribedBy"
      [attr.aria-pressed]="pressed"
      [attr.tabindex]="tabIndex"
      (click)="onClick($event)"
      (keydown)="onKeyDown($event)"
      class="accessible-button">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .accessible-button {
      &:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      
      &:focus:not(:focus-visible) {
        outline: none;
      }
      
      &:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
    }
  `]
})
export class AccessibleButtonComponent {
  @Input() type: 'primary' | 'default' | 'dashed' | 'link' | 'text' = 'default';
  @Input() size: 'large' | 'default' | 'small' = 'default';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() ariaLabel = '';
  @Input() ariaDescribedBy = '';
  @Input() pressed = false;
  @Input() tabIndex = 0;
  @Output() click = new EventEmitter<MouseEvent>();
  @Output() keyDown = new EventEmitter<KeyboardEvent>();
  
  onClick(event: MouseEvent) {
    if (!this.disabled && !this.loading) {
      this.click.emit(event);
    }
  }
  
  onKeyDown(event: KeyboardEvent) {
    // 支援 Enter 和 Space 鍵
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onClick(event as any);
    }
    this.keyDown.emit(event);
  }
}
```

## 🔧 組件測試策略

### 1. 單元測試範例
```typescript
// 專案卡片組件測試
describe('ProjectCardComponent', () => {
  let component: ProjectCardComponent;
  let fixture: ComponentFixture<ProjectCardComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProjectCardComponent,
        NzCardModule,
        NzTagModule,
        NzProgressModule,
        NzButtonModule,
        NzIconModule
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProjectCardComponent);
    component = fixture.componentInstance;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should display project information correctly', () => {
    const mockProject = {
      id: '1',
      name: '測試專案',
      status: '進行中',
      manager: '張三',
      progress: 50,
      startDate: '2024-01-01',
      budget: 1000000
    };
    
    component.project = mockProject;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.project-card').textContent).toContain('測試專案');
    expect(compiled.querySelector('.project-card').textContent).toContain('張三');
  });
  
  it('should emit edit event when edit button is clicked', () => {
    const mockProject = { id: '1', name: '測試專案' };
    component.project = mockProject;
    fixture.detectChanges();
    
    spyOn(component.edit, 'emit');
    
    const editButton = fixture.nativeElement.querySelector('button[aria-label="編輯"]');
    editButton.click();
    
    expect(component.edit.emit).toHaveBeenCalledWith(mockProject);
  });
  
  it('should have proper accessibility attributes', () => {
    const mockProject = { id: '1', name: '測試專案' };
    component.project = mockProject;
    fixture.detectChanges();
    
    const card = fixture.nativeElement.querySelector('.project-card');
    expect(card.getAttribute('role')).toBe('article');
    expect(card.getAttribute('aria-label')).toContain('測試專案');
  });
});
```

### 2. 整合測試範例
```typescript
// 專案列表整合測試
describe('ProjectListComponent Integration', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  
  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ProjectService', ['getProjectList']);
    
    await TestBed.configureTestingModule({
      imports: [
        ProjectListComponent,
        STModule,
        NzTableModule,
        NzTagModule,
        NzProgressModule,
        NzButtonModule
      ],
      providers: [
        { provide: ProjectService, useValue: spy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
  });
  
  it('should load and display project list', fakeAsync(() => {
    const mockProjects = [
      { id: '1', name: '專案A', status: '進行中', progress: 50 },
      { id: '2', name: '專案B', status: '已完成', progress: 100 }
    ];
    
    projectService.getProjectList.and.returnValue(of(mockProjects));
    
    fixture.detectChanges();
    tick();
    
    const tableRows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(2);
    expect(tableRows[0].textContent).toContain('專案A');
    expect(tableRows[1].textContent).toContain('專案B');
  }));
  
  it('should handle table sorting', () => {
    const mockProjects = [
      { id: '1', name: '專案B', status: '進行中' },
      { id: '2', name: '專案A', status: '已完成' }
    ];
    
    projectService.getProjectList.and.returnValue(of(mockProjects));
    
    fixture.detectChanges();
    
    // 模擬點擊排序
    const sortButton = fixture.nativeElement.querySelector('th[data-sort]');
    sortButton.click();
    
    expect(component.st.req.sort).toBeDefined();
  });
});
```

## ✅ AI Agent 實作檢查清單

### 組件選擇檢查清單
- [ ] **優先級遵循**：優先使用 ng-zorro-antd 基礎組件
- [ ] **業務組件**：複雜業務邏輯使用 @delon/abc 組件
- [ ] **自定義組件**：必要時開發自定義組件
- [ ] **組件一致性**：保持相同功能使用相同組件
- [ ] **性能考量**：選擇性能最佳的組件方案

### 主題定制檢查清單
- [ ] **主題配置**：使用 ThemeService 統一管理主題
- [ ] **色彩系統**：遵循營建專案色彩規範
- [ ] **響應式主題**：支援不同設備的主題適配
- [ ] **深色模式**：提供深色模式支援
- [ ] **主題切換**：提供主題切換功能

### 無障礙設計檢查清單
- [ ] **對比度**：文字對比度至少 4.5:1
- [ ] **鍵盤導航**：所有功能支援鍵盤操作
- [ ] **ARIA 標籤**：提供適當的 ARIA 標籤
- [ ] **焦點管理**：正確的焦點順序和視覺指示
- [ ] **螢幕閱讀器**：支援螢幕閱讀器使用

### 測試覆蓋檢查清單
- [ ] **單元測試**：組件邏輯測試覆蓋率 > 80%
- [ ] **整合測試**：組件間交互測試
- [ ] **無障礙測試**：自動化無障礙檢查
- [ ] **視覺回歸測試**：UI 變更檢測
- [ ] **效能測試**：組件渲染效能測試

## 📚 參考資源

### 官方文件
- [ng-zorro-antd 組件庫](https://ng.ant.design/components/overview/zh)
- [@delon/abc 業務組件](https://ng-alain.com/abc)
- [Angular 組件開發指南](https://angular.dev/guide/component-overview)

### 設計系統
- [Ant Design 設計語言](https://ant.design/docs/spec/colors-cn)
- [Material Design 組件](https://material.io/design/components/)
- [Carbon Design System](https://carbondesignsystem.com/)

### 無障礙設計
- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA 最佳實踐](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM 無障礙檢查](https://webaim.org/)

### 測試工具
- [Angular Testing Utilities](https://angular.dev/guide/testing)
- [Jest 測試框架](https://jestjs.io/)
- [Cypress E2E 測試](https://www.cypress.io/)

---

> **AI Agent 提示**：實作 UI 組件時，請遵循本指南的組件選擇策略和檢查清單，確保組件的一致性、可訪問性和可維護性。優先使用現有組件庫，必要時才開發自定義組件。
