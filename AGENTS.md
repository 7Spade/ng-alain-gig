# AI Agents 開發指南

## 專案概述

本專案是基於 **ng-alain v20.0.2** 的企業級 Angular 應用程式，採用現代化的前端架構設計，專注於營建工程管理領域的業務需求。

### 技術棧
- **Angular 20.3.0** - 現代化前端框架
- **ng-zorro-antd 20.3.1** - Ant Design 的 Angular 實作
- **@delon 20.0.2** - ng-alain 生態系統的核心套件
- **Firebase 12.4.0** - 後端服務與資料庫
- **TypeScript 5.9.2** - 型別安全的 JavaScript
- **yarn 4.9.2** - 套件管理器

## AI Agent 開發環境

### 開發工具配置
- **作業系統**: Windows 11
- **IDE**: Cursor (支援 MCP 工具整合)
- **包管理器**: yarn
- **程式碼品質**: ESLint + Stylelint + Prettier

### MCP 工具整合
本專案已配置以下 MCP 服務，AI Agent 應優先使用：

#### Angular 開發工具
- `angular-cli`: Angular CLI 整合
  - `get_best_practices`: 獲取 Angular 20 最佳實踐
  - `list_projects`: 檢查專案結構
  - `search_documentation`: 查詢官方文件

#### 檔案系統工具
- `filesystem`: 檔案操作
  - `read_text_file`: 讀取文字檔案
  - `list_directory`: 列出目錄內容
  - `directory_tree`: 遞迴目錄結構

#### 瀏覽器測試工具
- `playwright`: 端對端測試
  - `navigate_to_url`: 導航到 URL
  - `snapshot`: 頁面快照
  - `take_screenshot`: 截圖

#### 文件檢索工具
- `context7`: 第三方套件文件
  - `resolve-library-id`: 解析套件 ID
  - `get-library-docs`: 獲取文件內容

#### 思考工具
- `sequential-thinking`: 複雜問題分步推理
  - 支援多步驟分析與決策制定

## 開發規範

### Angular 20 現代化模式
- **Standalone Components**: 優先使用 `standalone: true`
- **Signal-based State**: 使用 `signal()`、`computed()`、`effect()`
- **現代控制流程**: 使用 `@if`、`@for`、`@switch`
- **Typed Forms**: 強型別表單驗證
- **Signal Inputs**: 使用 `input()` 替代 `@Input()`

### 程式碼品質標準
- **ESLint**: TypeScript 程式碼檢查
- **Stylelint**: Less 樣式檢查
- **Prettier**: 程式碼格式化
- **Husky**: Git hooks 整合

### 專案結構
```
src/
├── app/                    # 應用程式主目錄
│   ├── core/              # 核心模組
│   ├── shared/            # 共享模組
│   ├── features/          # 功能模組
│   └── layout/           # 版面配置
├── assets/                # 靜態資源
├── environments/          # 環境配置
└── styles/               # 全域樣式
```

## AI Agent 工作流程

### VAN 模式 - 專案初始化
1. 使用 `angular-cli.list_projects` 檢查專案結構
2. 使用 `filesystem.directory_tree` 掃描檔案結構
3. 使用 `sequential-thinking` 分析專案複雜度

### PLAN 模式 - 任務規劃
1. 使用 `context7` 查詢相關技術文件
2. 使用 `sequential-thinking` 制定實作步驟
3. 建立詳細的開發計劃

### CREATIVE 模式 - 設計決策
1. 使用 `sequential-thinking` 進行架構設計分析
2. 使用 `context7` 查詢設計模式和最佳實踐
3. 使用 `fetch` + `playwright` 研究現有解決方案

### IMPLEMENT 模式 - 程式實作
1. 使用 `angular-cli` 工具進行開發
2. 使用 `filesystem` 讀取和編輯檔案
3. 使用 `sequential-thinking` 解決技術問題

### QA 模式 - 品質驗證
1. 使用 `playwright` 進行端對端測試
2. 執行 ESLint 和 Stylelint 檢查
3. 使用 Codacy 進行程式碼品質分析

## 業務領域知識

### 營建工程管理系統
本專案專注於營建工程管理，包含以下核心功能：

#### 帳戶管理
- **User**: 個人用戶（工程師/監工/承包商）
- **Organization**: 組織（營造公司/建設公司）
- **Account**: 統一帳戶基類

#### 專案管理
- **Projects**: 專案（等同於 Repositories）
- **Milestones**: 里程碑/階段
- **Tasks/Issues**: 工項/問題追蹤
- **Daily Reports**: 每日施工日誌

#### 團隊協作
- **Teams**: 團隊（工務組/安全組/品管組）
- **Members**: 團隊成員管理
- **Roles**: 角色權限系統

## 開發最佳實踐

### 1. 優先使用內建功能
- 先使用 Angular/TypeScript/@delon/ng-zorro-antd 既有能力
- 避免過早抽象化，看見重複再抽象

### 2. 單一責任原則
- 一個檔案/元件只解決一類問題
- 保持小而清晰、易測試的設計

### 3. 現代化語法
- 使用 Standalone Components
- 採用 Signal-based 狀態管理
- 使用現代控制流程語法

### 4. 安全性考量
- 使用 `DomSanitizer` 防止 XSS
- 透過 `@delon/auth` 處理認證
- 使用 `@delon/acl` 進行權限控制

## 除錯與測試

### 本地開發
```bash
# 安裝依賴
yarn install

# 啟動開發伺服器
yarn start

# 執行測試
yarn test

# 程式碼檢查
yarn lint
```

### 瀏覽器測試
- 使用 `playwright.navigate_to_url` 導航到 `http://localhost:4200`
- 使用 `playwright.snapshot` 進行頁面快照
- 使用 `playwright.take_screenshot` 截圖驗證

## 參考資源

- [ng-alain 官方文件](https://ng-alain.com)
- [Angular 20 官方文件](https://v20.angular.dev/)
- [ng-zorro-antd 文件](https://ng.ant.design/)
- [@delon 套件文件](https://github.com/ng-alain/delon)

## 注意事項

1. **版本相容性**: 確保所有套件版本與 Angular 20 相容
2. **型別安全**: 優先使用 TypeScript 強型別
3. **效能優化**: 使用 Angular 內建優化功能（Lazy Loading、OnPush 等）
4. **安全性**: 遵循 Angular 安全最佳實踐
5. **可維護性**: 保持程式碼簡潔、可讀性高

---

*本文件為 AI Agent 開發指南，旨在提供開發過程中的技術參考和最佳實踐建議。*
