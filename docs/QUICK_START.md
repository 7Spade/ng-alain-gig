# 快速入門指南 (Quick Start Guide)

## 🚀 5分鐘快速理解專案

### 專案概述
**ng-alain-gig** 是一個基於 Angular 20 的建築工程管理平台，採用 DDD 四層架構設計。

### 核心技術棧
- **前端**: Angular 20.3.0 + ng-alain 20.0.2 + ng-zorro-antd 20.3.1
- **後端**: Firebase 12.4.0 (Firestore + Authentication + Storage)
- **狀態管理**: Angular Signals + NgRx Store
- **UI 框架**: Ant Design + @delon 生態系統

### 專案結構
```
src/app/
├── core/           # 核心模組 (認證、攔截器、啟動服務)
├── layout/         # 版面配置 (基本、空白、護照頁面)
├── routes/         # 路由模組 (功能頁面)
├── shared/         # 共享模組 (可重用組件、服務)
└── app.config.ts   # 應用配置 (Standalone 架構)
```

### 核心業務模組
1. **Account Module** - 用戶和組織管理
2. **Project Module** - 專案生命週期管理
3. **Shared Module** - 共享基礎設施

### DDD 四層架構
```
Presentation Layer (展示層)
    ↓
Application Layer (應用層)
    ↓
Domain Layer (領域層)
    ↓
Infrastructure Layer (基礎設施層)
```

### 快速啟動
```bash
# 安裝依賴
yarn install

# 啟動開發伺服器
yarn start

# 開啟瀏覽器
http://localhost:4200
```

### 關鍵特性
- ✅ **Standalone Components** - 現代化 Angular 架構
- ✅ **Signal-based State** - 響應式狀態管理
- ✅ **Firebase 整合** - 完整後端服務
- ✅ **DDD 設計** - 領域驅動設計
- ✅ **企業級 UI** - ng-alain + Ant Design

### 下一步
- 📖 閱讀 [開發環境設置](./DEVELOPMENT_SETUP.md)
- 🏗️ 查看 [系統架構](./SYSTEM_ARCHITECTURE.md)
- 📋 了解 [實作指南](./implementation/IMPLEMENTATION_GUIDE.md)

### 常用指令
```bash
# 開發
yarn start              # 啟動開發伺服器
yarn build              # 建置專案
yarn test               # 執行測試
yarn lint               # 程式碼檢查

# 生成
ng g component my-comp  # 生成組件
ng g service my-service # 生成服務
ng g module my-module   # 生成模組
```

### 專案目標
建立一個現代化、可擴展的建築工程管理平台，支援：
- 👥 用戶和組織管理
- 📊 專案生命週期追蹤
- 💰 成本控制和預算管理
- 📁 文件管理和版本控制
- 🤝 團隊協作和溝通

### 支援資源
- [Angular 20 官方文件](https://v20.angular.dev/)
- [ng-alain 官方文件](https://ng-alain.com)
- [Firebase 官方文件](https://firebase.google.com/docs)
- [專案架構文件](./architecture/)
