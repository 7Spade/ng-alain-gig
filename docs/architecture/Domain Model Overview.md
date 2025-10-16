# 領域模型總覽 (Domain Model Overview)

## 業務架構

### Account Context (帳戶上下文)
```
Account (帳戶抽象層)
├── User (個人用戶 - 工程師/監工/承包商)
│   ├── Profile (個人資料 + 專業證照)
│   ├── Starred Projects (星標專案)
│   ├── Following (追蹤的用戶/組織)
│   ├── Achievements (成就徽章)
│   ├── Notifications (通知中心)
│   ├── Teams (所屬團隊)
│   │   └── Team Role (在團隊中的角色)
│   └── Organization Memberships (加入的組織)
│       └── Role (在組織中的角色)
│
└── Organization (組織 - 營造公司/建設公司)
    ├── Profile (組織資料 + 營業執照)
    ├── Members (組織成員)
    │   ├── Member Info (成員個人資料)
    │   ├── Role (組織角色：經理/工程師/監工)
    │   └── Teams (所屬團隊)
    ├── Teams (團隊 - 工務組/安全組/品管組)
    │   ├── Team Info (團隊資料)
    │   ├── Members (團隊成員)
    │   │   ├── Member Info (成員個人資料)
    │   │   └── Role (隊長/成員)
    │   └── Projects Assigned (分配給團隊的專案)
```

### Project Context (專案上下文)
```
Projects (專案 = Repositories)
├── Owner (擁有者 - 個人用戶或組織)
├── Project Info (專案基本資料)
├── Milestones (里程碑/階段)
├── Tasks/Issues (工項/問題追蹤)
├── Documents (文件管理)
├── Photos/Media (現場照片/影片)
├── Daily Reports (每日施工日誌)
├── Inspections (查驗記錄)
├── Materials (材料管理)
├── Equipment (設備/機具管理)
├── Safety Records (安全記錄)
├── Weather Logs (天氣記錄)
├── Comments/Discussion (討論區)
├── Gantt Chart Data (甘特圖資料)
└── Cost Control (成本控制)
    ├── Budget (預算)
    ├── Actual Cost (實際支出)
    ├── Forecast (成本預測)
    ├── Variance (預算差異)
    └── Cost Breakdown (人力/材料/設備分解)
```

## 核心聚合識別

| 聚合根 | 上下文 | 職責 |
|--------|--------|------|
| **User** | Account | 個人用戶管理 |
| **Organization** | Account | 組織與團隊管理 |
| **Project** | Project | 專案完整生命週期管理 |
| **CostControl** | Project | 成本控制 (Project 子聚合) |

## 關鍵關係

### 用戶 ↔ 組織
- User 可以加入多個 Organization (多對多)
- Organization 包含多個 Member (User)
- 關係屬性: Role, JoinedAt

### 組織 ↔ 團隊
- Organization 包含多個 Team (一對多)
- Team 屬於一個 Organization (聚合內)
- User 可以加入多個 Team (透過 Organization)

### 專案 ↔ 團隊
- Project 可以分配給多個 Team (多對多 - 透過引用)
- Team 可以負責多個 Project

### 專案 ↔ 擁有者
- Project 屬於一個 Owner (User 或 Organization)
- Owner 可以擁有多個 Project (一對多)

## 領域模型詳細設計

### 1. User Aggregate (用戶聚合根)

```typescript
interface User {
  // === 識別 ===
  userId: string;
  email: Email;
  
  // === 基本資料 ===
  displayName: string;
  phoneNumber?: PhoneNumber;
  
  // === 個人檔案 ===
  profile: UserProfile;
  
  // === 成就系統 ===
  achievements: Achievement[];
  
  // === 社交功能 ===
  following: string[];              // User IDs (Reference)
  starredProjects: string[];        // Project IDs (Reference)
  
  // === 組織與團隊 ===
  organizationMemberships: OrganizationMembership[];
  teams: TeamMembership[];
  
  // === 通知 ===
  notifications: Notification[];
  
  // === 時間戳 ===
  createdAt: Date;
  updatedAt: Date;
}
```

**聚合邊界規則**:
- ✅ **可以包含**: Profile, Achievements, Notifications (完整實體)
- ⚠️ **只能引用**: Organization, Team, Project (只存 ID)
- ❌ **不可包含**: 其他用戶的完整資料、組織的完整資料

### 2. Organization Aggregate (組織聚合根)

```typescript
interface Organization {
  // === 識別 ===
  organizationId: string;
  name: string;
  email: Email;
  
  // === 基本資料 ===
  profile: OrganizationProfile;
  
  // === 成員管理 ===
  members: Member[];
  
  // === 團隊管理 ===
  teams: Team[];
  
  // === 執照與帳務 ===
  licenses: License[];
  billingInfo: BillingInfo;
  
  // === 時間戳 ===
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Project Aggregate (專案聚合根)

```typescript
interface Project {
  // === 識別 ===
  projectId: string;
  name: string;
  
  // === 擁有者 ===
  ownerId: string;           // Account ID
  ownerType: 'user' | 'organization';
  
  // === 基本資料 ===
  description: string;
  status: ProjectStatus;
  visibility: Visibility;
  
  // === 專案內容 ===
  milestones: Milestone[];
  tasks: Task[];
  documents: Document[];
  
  // === 現場管理 ===
  dailyReports: DailyReport[];
  inspections: Inspection[];
  materials: Material[];
  equipment: Equipment[];
  
  // === 成本控制 ===
  costControl: CostControl;
  
  // === 時間戳 ===
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. CostControl Sub-Aggregate (成本控制子聚合)

```typescript
interface CostControl {
  // === 預算 ===
  budget: Budget;
  
  // === 實際成本 ===
  actualCosts: ActualCost[];
  
  // === 預測 ===
  forecasts: Forecast[];
  
  // === 差異分析 ===
  variances: Variance[];
  
  // === 成本分解 ===
  breakdown: CostBreakdown;
}
```

## Value Objects (值物件)

### 1. Email Value Object
```typescript
class Email {
  private readonly value: string;
  
  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format');
    }
    this.value = email;
  }
  
  static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### 2. Money Value Object
```typescript
class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'TWD'
  ) {}
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

### 3. Role Value Object
```typescript
class Role {
  private static readonly VALID_ROLES = [
    'owner', 'manager', 'engineer', 'supervisor', 'worker', 'viewer'
  ];
  
  constructor(public readonly value: string) {
    if (!Role.VALID_ROLES.includes(value)) {
      throw new Error(`Invalid role: ${value}`);
    }
  }
}
```

## Domain Events (領域事件)

### Account Context Events
- `UserCreatedEvent` - 用戶建立
- `UserFollowedEvent` - 用戶追蹤
- `UserJoinedOrganizationEvent` - 用戶加入組織
- `AchievementEarnedEvent` - 成就獲得
- `ProjectStarredEvent` - 專案星標

### Project Context Events
- `ProjectCreatedEvent` - 專案建立
- `TaskAssignedEvent` - 任務分配
- `MilestoneCompletedEvent` - 里程碑完成
- `BudgetExceededEvent` - 預算超支

## 業務規則與不變條件

### User Aggregate 不變條件
1. Email 必須存在且格式正確
2. 顯示名稱必填且長度 2-50 字符
3. 不能追蹤自己
4. 組織成員不可重複
5. 團隊成員不可重複

### Organization Aggregate 不變條件
1. 組織名稱必填且唯一
2. 至少需要一個管理員
3. 團隊名稱在組織內唯一
4. 成員角色必須有效

### Project Aggregate 不變條件
1. 專案必須有擁有者
2. 里程碑日期必須合理
3. 任務必須有負責人
4. 成本不能超過預算上限

## 上下文邊界與整合

### Account Context
- **職責**: 用戶身份、組織管理、團隊協作
- **對外介面**: UserCreated, OrganizationCreated, TeamAssigned
- **依賴**: 無外部依賴

### Project Context
- **職責**: 專案管理、任務追蹤、成本控制
- **對外介面**: ProjectCreated, TaskAssigned, MilestoneCompleted
- **依賴**: Account Context (用戶驗證、團隊資訊)

### 整合策略
- **Customer-Supplier**: Account Context → Project Context
- **Domain Events**: 跨上下文事件通訊
- **Shared Kernel**: 共用 Value Objects

## 實作指導原則

### 1. 聚合設計
- 保持聚合邊界清晰
- 確保業務不變條件
- 使用領域事件解耦

### 2. 值物件使用
- 封裝業務概念
- 提供驗證邏輯
- 確保不可變性

### 3. 領域事件
- 表達業務意義
- 支援最終一致性
- 實現系統解耦

### 4. Repository 模式
- 抽象資料存取
- 支援領域模型
- 提供查詢介面

## 技術實作考量

### 1. Angular 整合
- 使用 Signals 進行狀態管理
- 實作響應式查詢
- 支援離線功能

### 2. Firebase 整合
- Firestore 文件結構設計
- Security Rules 實作
- 即時同步機制

### 3. 效能優化
- 聚合快取策略
- 查詢優化
- 批次操作支援

### 4. 測試策略
- 領域邏輯單元測試
- 聚合整合測試
- 事件處理測試
