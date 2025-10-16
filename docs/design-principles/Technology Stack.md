# 技術棧標準 (Technology Stack)

## 前端技術棧

### 核心框架
- **Angular**: 20.3.0
  - Standalone Components
  - Signals (signal, computed, effect)
  - Modern Control Flow (@if, @for, @switch)
  - Typed Forms
  - Signal Inputs/Outputs
  - Bootstrap Application

### UI 框架
- **ng-alain**: 20.0.2
  - Layout System
  - Theme System
  - ACL Permission Control
  - Form Components
  - Table Components
  - Chart Components

- **ng-zorro-antd**: 20.3.1
  - Ant Design Components
  - Theme Customization
  - Responsive Design
  - Accessibility Support

### 狀態管理
- **Angular Signals**: 本地狀態管理
- **RxJS**: 異步操作和資料流
- **NgRx Store**: 全域狀態管理 (選用)

### 建置工具
- **@angular/build**: Vite + ESBuild
- **TypeScript**: 5.6.3
- **ESLint**: 代碼品質檢查
- **Stylelint**: 樣式檢查
- **Prettier**: 代碼格式化

### 包管理器
- **yarn**: 4.9.2
- **Node.js**: 20.x LTS

## 後端技術棧

### 雲端平台
- **Firebase**: 12.4.0
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Cloud Messaging
  - Cloud Functions (選用)

### 資料庫
- **Firestore**: NoSQL 文件資料庫
  - 即時同步
  - 離線支援
  - 自動擴展
  - 安全規則

## 開發工具

### 代碼品質
- **ESLint**: TypeScript 代碼檢查
- **Stylelint**: CSS/LESS 樣式檢查
- **Prettier**: 代碼格式化
- **Husky**: Git hooks
- **lint-staged**: 預提交檢查

### 測試工具
- **Jasmine**: 單元測試框架
- **Karma**: 測試執行器
- **Protractor**: E2E 測試 (選用)
- **Jest**: 替代測試框架 (選用)

### 開發環境
- **Angular CLI**: 專案生成和建置
- **VS Code**: 推薦 IDE
- **Angular Language Service**: TypeScript 支援
- **Angular DevTools**: 瀏覽器擴展

## 版本相容性

### Angular 20 相容性
```typescript
const COMPATIBILITY_MATRIX = {
  'Angular': '20.3.0',
  'ng-alain': '20.0.2',
  'ng-zorro-antd': '20.3.1',
  'Firebase': '12.4.0',
  'TypeScript': '5.6.3',
  'Node.js': '20.x LTS',
  'yarn': '4.9.2'
};
```

### 瀏覽器支援
- **Chrome**: 120+
- **Firefox**: 121+
- **Safari**: 17+
- **Edge**: 120+

## 專案結構標準

### 目錄結構
```
src/
├── app/
│   ├── core/                 # 核心模組
│   ├── shared/               # 共享模組
│   ├── features/             # 功能模組
│   │   ├── account/          # 帳戶模組
│   │   ├── organization/     # 組織模組
│   │   └── projects/         # 專案模組
│   ├── layouts/              # 佈局組件
│   └── styles/               # 全域樣式
├── assets/                   # 靜態資源
└── environments/             # 環境配置
```

### 檔案命名規範
- **檔案**: kebab-case (user-profile.component.ts)
- **目錄**: kebab-case (user-profile/)
- **組件**: PascalCase (UserProfileComponent)
- **服務**: PascalCase + Service (UserService)
- **介面**: PascalCase + Interface (UserInterface)
- **常數**: UPPER_SNAKE_CASE (API_ENDPOINTS)

## 代碼風格標準

### TypeScript 配置
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Angular 配置
```typescript
const ANGULAR_CONFIG = {
  'Change Detection': 'OnPush',
  'Component Style': 'Standalone',
  'State Management': 'Signals',
  'Forms': 'Typed Reactive Forms',
  'Routing': 'Function Guards',
  'HTTP': 'HttpClient with Interceptors'
};
```

## 效能標準

### Bundle 大小限制
- **初始 Bundle**: < 500KB (gzipped)
- **懶加載模組**: < 200KB (gzipped)
- **總 Bundle**: < 2MB (gzipped)

### 載入時間目標
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s

### 記憶體使用
- **初始載入**: < 50MB
- **運行時**: < 100MB
- **長時間運行**: 無記憶體洩漏

## 安全標準

### 前端安全
- **XSS 防護**: Angular 內建 + DomSanitizer
- **CSRF 防護**: SameSite Cookie + CSRF Token
- **內容安全政策**: CSP Headers
- **輸入驗證**: 前端 + 後端雙重驗證

### 資料安全
- **傳輸加密**: HTTPS 強制
- **資料加密**: 敏感資料加密儲存
- **權限控制**: 基於角色的存取控制
- **審計日誌**: 用戶操作記錄

## 測試標準

### 測試覆蓋率
- **單元測試**: > 80%
- **整合測試**: > 60%
- **E2E 測試**: 關鍵流程 100%

### 測試策略
- **測試金字塔**: 單元測試為主
- **測試驅動**: TDD 開發模式
- **自動化測試**: CI/CD 整合

## 部署標準

### 建置配置
```json
{
  "build": {
    "outputPath": "dist/",
    "optimization": true,
    "sourceMap": false,
    "namedChunks": false,
    "aot": true,
    "extractLicenses": true,
    "vendorChunk": false,
    "buildOptimizer": true
  }
}
```

### 環境配置
- **開發環境**: localhost:4200
- **測試環境**: test.example.com
- **生產環境**: app.example.com

## 相關文件
- [設計原則](./Design Principles.md)
- [架構概覽](./Architecture Overview.md)
- [狀態管理策略](./State Management Strategy.md)
- [安全策略](./Security Strategy.md)
- [效能策略](./Performance Strategy.md)
