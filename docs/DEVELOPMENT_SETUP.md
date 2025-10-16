# 開發環境設置 (Development Setup)

## 📋 系統需求

### 必要軟體
- **Node.js**: v22.20.0 或更高版本
- **yarn**: 4.9.2 (專案包管理器)
- **Git**: 最新版本
- **VS Code**: 推薦 IDE (含 Angular 擴充套件)

### 推薦工具
- **Angular CLI**: `npm install -g @angular/cli`
- **Firebase CLI**: `npm install -g firebase-tools`
- **Chrome DevTools**: 用於除錯

## 🚀 環境設置步驟

### 1. 克隆專案
```bash
git clone <repository-url>
cd ng-alain-gig
```

### 2. 安裝依賴
```bash
# 使用 yarn (推薦)
yarn install

# 或使用 npm
npm install
```

### 3. 環境配置
```bash
# 複製環境配置檔案
cp src/environments/environment.ts src/environments/environment.local.ts

# 編輯本地環境配置
# 設置 Firebase 配置、API 端點等
```

### 4. Firebase 設置
```bash
# 登入 Firebase
firebase login

# 初始化 Firebase (如果需要)
firebase init

# 設置 Firebase 專案
firebase use <your-project-id>
```

### 5. 啟動開發伺服器
```bash
# 啟動 Angular 開發伺服器
yarn start

# 或使用 Angular CLI
ng serve

# 開啟瀏覽器訪問
http://localhost:4200
```

## 🔧 IDE 配置

### VS Code 推薦擴充套件
```json
{
  "recommendations": [
    "angular.ng-template",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### VS Code 設定
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "angular.enable-strict-mode-prompt": false
}
```

## 📁 專案結構說明

### 核心目錄
```
ng-alain-gig/
├── src/
│   ├── app/                 # 應用程式主目錄
│   │   ├── core/           # 核心模組 (單例服務)
│   │   ├── layout/         # 版面配置組件
│   │   ├── routes/         # 功能路由模組
│   │   ├── shared/         # 共享模組
│   │   └── app.config.ts   # 應用配置
│   ├── assets/             # 靜態資源
│   ├── environments/       # 環境配置
│   └── styles/            # 全域樣式
├── docs/                   # 專案文件
├── e2e/                    # E2E 測試
└── scripts/               # 建置腳本
```

### 模組架構
```
每個功能模組結構:
feature-module/
├── components/             # 功能組件
├── services/              # 業務服務
├── models/                # 資料模型
├── guards/                # 路由守衛
└── feature.routes.ts      # 路由配置
```

## 🛠️ 開發工具

### 常用指令
```bash
# 開發相關
yarn start                 # 啟動開發伺服器
yarn build                 # 建置專案
yarn build:prod           # 生產環境建置
yarn test                  # 執行單元測試
yarn test:coverage        # 測試覆蓋率報告
yarn e2e                   # 執行 E2E 測試

# 程式碼品質
yarn lint                  # ESLint 檢查
yarn lint:fix             # 自動修復 ESLint 問題
yarn lint:style           # Stylelint 檢查
yarn format               # Prettier 格式化

# Angular CLI
ng generate component my-component    # 生成組件
ng generate service my-service        # 生成服務
ng generate module my-module          # 生成模組
ng generate guard my-guard            # 生成守衛
```

### 除錯設置
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true
    }
  ]
}
```

## 🔥 Firebase 本地開發

### Firebase Emulator 設置
```bash
# 安裝 Firebase CLI
npm install -g firebase-tools

# 初始化 Emulator
firebase init emulators

# 啟動 Emulator
firebase emulators:start
```

### Emulator 配置
```json
// firebase.json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

## 📊 效能監控

### 建置分析
```bash
# 分析 bundle 大小
yarn analyze

# 或手動分析
ng build --stats-json
npx webpack-bundle-analyzer dist/ng-alain/stats.json
```

### 效能檢查
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

## 🧪 測試環境

### 單元測試設置
```bash
# 執行測試
yarn test

# 監視模式
yarn test --watch

# 覆蓋率報告
yarn test:coverage
```

### E2E 測試設置
```bash
# 安裝 Playwright
npx playwright install

# 執行 E2E 測試
yarn e2e
```

## 🚨 常見問題

### Node.js 版本問題
```bash
# 使用 nvm 管理 Node.js 版本
nvm install 22.20.0
nvm use 22.20.0
```

### 依賴安裝問題
```bash
# 清理快取
yarn cache clean
rm -rf node_modules
yarn install
```

### 建置問題
```bash
# 清理建置快取
rm -rf dist
rm -rf .angular
ng build
```

## 📚 相關資源

### 官方文件
- [Angular 20 文件](https://v20.angular.dev/)
- [ng-alain 文件](https://ng-alain.com)
- [ng-zorro-antd 文件](https://ng.ant.design/)
- [Firebase 文件](https://firebase.google.com/docs)

### 開發指南
- [程式碼標準](./implementation/CODE_STANDARDS.md)
- [組件模式](./implementation/COMPONENT_PATTERNS.md)
- [測試策略](./testing/TESTING_STRATEGY.md)

### 故障排除
- [常見問題](./troubleshooting/COMMON_ISSUES.md)
- [除錯指南](./troubleshooting/DEBUG_GUIDE.md)
