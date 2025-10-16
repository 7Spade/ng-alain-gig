# MCP 工具整合指南

## 概述

本指南說明如何在 AI Agent 開發過程中有效使用 MCP (Model Context Protocol) 工具，提升開發效率和程式碼品質。

## 可用的 MCP 工具

### 1. Angular CLI 工具
- **工具名稱**: `angular-cli`
- **用途**: Angular 專案管理和開發
- **主要功能**:
  - `get_best_practices`: 獲取 Angular 20 最佳實踐
  - `list_projects`: 檢查專案結構
  - `search_documentation`: 查詢官方文件

#### 使用範例
```typescript
// 獲取 Angular 最佳實踐
const bestPractices = await angularCli.getBestPractices({
  version: '20.0.0',
  features: ['standalone', 'signals', 'typed-forms']
});

// 檢查專案結構
const projectInfo = await angularCli.listProjects();

// 查詢官方文件
const docs = await angularCli.searchDocumentation({
  query: 'standalone components',
  version: '20.0.0'
});
```

### 2. 檔案系統工具
- **工具名稱**: `filesystem`
- **用途**: 檔案操作和管理
- **主要功能**:
  - `read_text_file`: 讀取文字檔案
  - `list_directory`: 列出目錄內容
  - `directory_tree`: 遞迴目錄結構

#### 使用範例
```typescript
// 讀取檔案內容
const fileContent = await filesystem.readTextFile({
  path: '/workspace/src/app/app.component.ts'
});

// 列出目錄內容
const directoryContents = await filesystem.listDirectory({
  path: '/workspace/src/app'
});

// 獲取目錄樹
const tree = await filesystem.directoryTree({
  path: '/workspace',
  maxDepth: 3
});
```

### 3. 瀏覽器測試工具
- **工具名稱**: `playwright`
- **用途**: 端對端測試和瀏覽器自動化
- **主要功能**:
  - `navigate_to_url`: 導航到 URL
  - `snapshot`: 頁面快照
  - `take_screenshot`: 截圖

#### 使用範例
```typescript
// 導航到應用程式
await playwright.navigateToUrl({
  url: 'http://localhost:4200'
});

// 截取頁面快照
const snapshot = await playwright.snapshot({
  name: 'homepage-snapshot'
});

// 截圖
await playwright.takeScreenshot({
  name: 'homepage-screenshot',
  fullPage: true
});
```

### 4. 文件檢索工具
- **工具名稱**: `context7`
- **用途**: 第三方套件文件檢索
- **主要功能**:
  - `resolve-library-id`: 解析套件 ID
  - `get-library-docs`: 獲取文件內容

#### 使用範例
```typescript
// 解析套件 ID
const libraryId = await context7.resolveLibraryId({
  libraryName: 'ng-zorro-antd'
});

// 獲取文件內容
const docs = await context7.getLibraryDocs({
  context7CompatibleLibraryID: '/ant-design/ng-zorro-antd',
  topic: 'components',
  tokens: 3000
});
```

### 5. 思考工具
- **工具名稱**: `sequential-thinking`
- **用途**: 複雜問題分步推理
- **主要功能**:
  - 多步驟分析
  - 決策制定
  - 問題解決

#### 使用範例
```typescript
// 開始思考過程
const thought = await sequentialThinking.sequentialthinking({
  thought: "分析用戶認證流程的複雜度",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5
});

// 繼續思考
const nextThought = await sequentialThinking.sequentialthinking({
  thought: "設計 Firebase Auth 與 @delon/auth 的整合方案",
  nextThoughtNeeded: true,
  thoughtNumber: 2,
  totalThoughts: 5
});
```

## 工具整合工作流程

### 1. VAN 模式 - 專案初始化
```typescript
async function initializeProject() {
  // 1. 檢查專案結構
  const projectInfo = await angularCli.listProjects();
  
  // 2. 掃描檔案結構
  const directoryTree = await filesystem.directoryTree({
    path: '/workspace',
    maxDepth: 3
  });
  
  // 3. 分析複雜度
  const complexity = await sequentialThinking.sequentialthinking({
    thought: "分析專案複雜度和技術需求",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 3
  });
  
  return { projectInfo, directoryTree, complexity };
}
```

### 2. PLAN 模式 - 任務規劃
```typescript
async function planTask(taskDescription: string) {
  // 1. 查詢相關技術文件
  const ngDocs = await angularCli.searchDocumentation({
    query: taskDescription,
    version: '20.0.0'
  });
  
  // 2. 查詢第三方套件文件
  const libraryId = await context7.resolveLibraryId({
    libraryName: 'ng-zorro-antd'
  });
  
  const componentDocs = await context7.getLibraryDocs({
    context7CompatibleLibraryID: libraryId,
    topic: 'components',
    tokens: 2000
  });
  
  // 3. 制定實作計劃
  const plan = await sequentialThinking.sequentialthinking({
    thought: `基於文件分析制定 ${taskDescription} 的實作計劃`,
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 4
  });
  
  return { ngDocs, componentDocs, plan };
}
```

### 3. CREATIVE 模式 - 設計決策
```typescript
async function designSolution(requirements: any) {
  // 1. 分析需求
  const analysis = await sequentialThinking.sequentialthinking({
    thought: "分析業務需求和技術約束",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 6
  });
  
  // 2. 查詢設計模式
  const designPatterns = await context7.getLibraryDocs({
    context7CompatibleLibraryID: '/angular/angular',
    topic: 'design-patterns',
    tokens: 1500
  });
  
  // 3. 設計解決方案
  const solution = await sequentialThinking.sequentialthinking({
    thought: "設計基於 ng-zorro-antd 的解決方案",
    nextThoughtNeeded: false,
    thoughtNumber: 6,
    totalThoughts: 6
  });
  
  return { analysis, designPatterns, solution };
}
```

### 4. IMPLEMENT 模式 - 程式實作
```typescript
async function implementFeature(featureSpec: any) {
  // 1. 讀取現有程式碼
  const existingCode = await filesystem.readTextFile({
    path: featureSpec.filePath
  });
  
  // 2. 查詢實作細節
  const implementationDocs = await angularCli.searchDocumentation({
    query: featureSpec.technology,
    version: '20.0.0'
  });
  
  // 3. 實作功能
  const implementation = await sequentialThinking.sequentialthinking({
    thought: `實作 ${featureSpec.name} 功能`,
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 3
  });
  
  return { existingCode, implementationDocs, implementation };
}
```

### 5. QA 模式 - 品質驗證
```typescript
async function validateQuality() {
  // 1. 瀏覽器測試
  await playwright.navigateToUrl({
    url: 'http://localhost:4200'
  });
  
  const screenshot = await playwright.takeScreenshot({
    name: 'quality-validation',
    fullPage: true
  });
  
  // 2. 程式碼檢查
  const lintResults = await runCommand('yarn lint');
  const testResults = await runCommand('yarn test');
  
  // 3. 品質分析
  const qualityAnalysis = await sequentialThinking.sequentialthinking({
    thought: "分析程式碼品質和測試結果",
    nextThoughtNeeded: false,
    thoughtNumber: 1,
    totalThoughts: 2
  });
  
  return { screenshot, lintResults, testResults, qualityAnalysis };
}
```

## 最佳實踐

### 1. 工具選擇策略
- **檔案操作**: 優先使用 `filesystem` 工具
- **Angular 相關**: 使用 `angular-cli` 工具
- **第三方套件**: 使用 `context7` 工具
- **複雜分析**: 使用 `sequential-thinking` 工具
- **瀏覽器測試**: 使用 `playwright` 工具

### 2. 錯誤處理
```typescript
async function safeToolCall(toolName: string, params: any) {
  try {
    const result = await toolName(params);
    return { success: true, data: result };
  } catch (error) {
    console.error(`工具 ${toolName} 調用失敗:`, error);
    return { success: false, error: error.message };
  }
}
```

### 3. 效能優化
- 並行調用多個工具
- 快取重複查詢結果
- 限制文件檢索的 tokens 數量
- 使用適當的思考步驟數量

### 4. 日誌記錄
```typescript
function logToolUsage(toolName: string, params: any, result: any) {
  console.log(`[MCP Tool] ${toolName}:`, {
    params,
    result: result?.success ? 'success' : 'failed',
    timestamp: new Date().toISOString()
  });
}
```

## 故障排除

### 常見問題

#### 1. 工具調用失敗
- 檢查工具名稱是否正確
- 確認參數格式是否正確
- 檢查網路連接狀態

#### 2. 權限問題
- 確認檔案路徑權限
- 檢查 Firebase 認證狀態
- 驗證 API 金鑰配置

#### 3. 效能問題
- 減少並行工具調用數量
- 優化查詢參數
- 使用快取機制

## 參考資源

- [MCP 官方文件](https://modelcontextprotocol.io/)
- [Angular CLI 文件](https://angular.io/cli)
- [Playwright 文件](https://playwright.dev/)
- [Context7 文件](https://context7.io/)

---

*本文件為 MCP 工具整合指南，旨在提供完整的工具使用方法和最佳實踐。*