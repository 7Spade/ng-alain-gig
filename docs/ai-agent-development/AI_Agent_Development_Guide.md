# AI Agent 開發指南

## 概述

本指南專為 AI Agent 開發 ng-alain 企業級建築工程管理平台而設計，提供完整的開發流程、最佳實踐和技術規範。

## 技術棧

### 前端框架
- **Angular 20.3.0** - 現代化前端框架
- **ng-zorro-antd 20.3.1** - Ant Design 的 Angular 實作
- **@delon 20.0.2** - ng-alain 生態系統核心套件

### 後端服務
- **Firebase 12.4.0** - 後端服務與資料庫
- **Firestore** - NoSQL 資料庫
- **Firebase Auth** - 認證服務
- **Cloud Functions** - 無伺服器函數

### 開發工具
- **TypeScript 5.9.2** - 型別安全的 JavaScript
- **yarn 4.9.2** - 套件管理器
- **ESLint + Stylelint** - 程式碼品質檢查
- **Prettier** - 程式碼格式化

## AI Agent 開發流程

### 1. 專案初始化 (VAN 模式)

#### 1.1 環境檢查
```bash
# 檢查 Node.js 版本
node --version  # 需要 >= 18.0.0

# 檢查 yarn 版本
yarn --version  # 需要 >= 4.0.0

# 檢查 Angular CLI
ng version
```

#### 1.2 專案結構掃描
```typescript
// 使用 angular-cli MCP 工具檢查專案
const projectInfo = await angularCli.listProjects();
const directoryTree = await filesystem.directoryTree('/workspace');
```

#### 1.3 複雜度分析
使用 Sequential Thinking MCP 分析專案複雜度：
- Level 1: 簡單功能 (1-2 週)
- Level 2: 中等複雜度 (2-4 週)
- Level 3: 複雜功能 (1-2 個月)
- Level 4: 企業級功能 (2-3 個月)

### 2. 任務規劃 (PLAN 模式)

#### 2.1 需求分析
- 使用 Context7 MCP 查詢相關技術文件
- 分析業務需求和技術需求
- 制定實作步驟和時間規劃

#### 2.2 技術選型
- 優先使用 ng-zorro-antd 組件
- 遵循 Angular 20 現代化模式
- 採用 DDD 架構設計

### 3. 創意設計 (CREATIVE 模式)

#### 3.1 架構設計
- 使用 Sequential Thinking 進行多步分析
- 設計模組間依賴關係
- 規劃事件驅動架構

#### 3.2 UI/UX 設計
- 基於 ng-zorro-antd 設計系統
- 遵循 Ant Design 設計原則
- 確保響應式設計

### 4. 程式實作 (IMPLEMENT 模式)

#### 4.1 組件開發
```typescript
// 使用 ng-zorro-antd 組件範例
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [NzButtonModule, NzCardModule, NzTableModule],
  template: `
    <nz-card nzTitle="用戶列表">
      <nz-table [nzData]="users" [nzLoading]="loading">
        <thead>
          <tr>
            <th nzColumnKey="name" nzSort>姓名</th>
            <th nzColumnKey="email" nzSort>郵箱</th>
            <th nzColumnKey="role" nzSort>角色</th>
            <th nzColumnKey="action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>
              <button nz-button nzType="primary" nzSize="small">編輯</button>
              <button nz-button nzType="default" nzSize="small" nzDanger>刪除</button>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `
})
export class UserListComponent {
  users: User[] = [];
  loading = false;
}
```

#### 4.2 服務開發
```typescript
// 使用 @delon 服務範例
import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  async createUser(userData: User): Promise<void> {
    try {
      // 實作用戶創建邏輯
      this.message.success('用戶創建成功');
    } catch (error) {
      this.message.error('用戶創建失敗');
      throw error;
    }
  }
}
```

### 5. 品質驗證 (QA 模式)

#### 5.1 程式碼檢查
```bash
# ESLint 檢查
yarn lint

# Stylelint 檢查
yarn lint:style

# 型別檢查
yarn build --dry-run
```

#### 5.2 測試執行
```bash
# 單元測試
yarn test

# 端對端測試
yarn e2e

# 測試覆蓋率
yarn test:coverage
```

#### 5.3 瀏覽器測試
```typescript
// 使用 Playwright MCP 進行瀏覽器測試
await playwright.navigateToUrl('http://localhost:4200');
await playwright.takeScreenshot('homepage.png');
await playwright.snapshot('homepage-snapshot');
```

## ng-zorro-antd 組件使用指南

### 常用組件

#### 1. 表單組件
```typescript
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzUploadModule } from 'ng-zorro-antd/upload';
```

#### 2. 資料展示組件
```typescript
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
```

#### 3. 導航組件
```typescript
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
```

#### 4. 反饋組件
```typescript
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
```

#### 5. 其他組件
```typescript
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzProgressModule } from 'ng-zorro-antd/progress';
```

### 組件使用最佳實踐

#### 1. 響應式設計
```typescript
// 使用 nzXs, nzSm, nzMd, nzLg, nzXl 屬性
<nz-col nzXs="24" nzSm="12" nzMd="8" nzLg="6" nzXl="4">
  <nz-card>響應式卡片</nz-card>
</nz-col>
```

#### 2. 國際化支援
```typescript
// 使用 i18n 屬性
<nz-button nzType="primary" [nzI18n]="'common.save'">保存</nz-button>
```

#### 3. 主題定制
```less
// 在 styles.less 中定制主題
@import '~ng-zorro-antd/ng-zorro-antd.less';

@primary-color: #1890ff;
@border-radius-base: 6px;
```

## 開發最佳實踐

### 1. 程式碼組織
- 使用 Standalone Components
- 採用 Signal-based 狀態管理
- 遵循 DDD 架構原則
- 保持組件小而專一

### 2. 效能優化
- 使用 OnPush 變更檢測策略
- 實作 Lazy Loading
- 優化 Bundle 大小
- 使用 TrackBy 函數

### 3. 可維護性
- 編寫清晰的註釋
- 使用 TypeScript 嚴格模式
- 遵循 ESLint 規則
- 保持程式碼一致性

### 4. 測試策略
- 單元測試覆蓋率 > 80%
- 整合測試覆蓋關鍵流程
- 端對端測試覆蓋主要用戶場景
- 效能測試確保響應時間

## 故障排除

### 常見問題

#### 1. 組件導入問題
```typescript
// 錯誤：缺少模組導入
// 正確：確保導入對應的模組
import { NzButtonModule } from 'ng-zorro-antd/button';
```

#### 2. 樣式問題
```less
// 確保導入 ng-zorro-antd 樣式
@import '~ng-zorro-antd/ng-zorro-antd.less';
```

#### 3. 型別問題
```typescript
// 使用正確的型別定義
import { NzTableColumn } from 'ng-zorro-antd/table';
```

## 參考資源

- [ng-zorro-antd 官方文件](https://ng.ant.design/)
- [Angular 20 官方文件](https://v20.angular.dev/)
- [@delon 套件文件](https://github.com/ng-alain/delon)
- [Firebase 官方文件](https://firebase.google.com/docs)

---

*本文件為 AI Agent 開發指南，旨在提供完整的開發流程和技術規範。*