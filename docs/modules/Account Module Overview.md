<<<<<<< Current (Your changes)
# Account Module - 模組概覽

## 模組定義
**對應領域**: Account Domain (帳戶抽象層)  
**模組職責**: 用戶身份管理、組織結構管理、權限控制

## 領域模型

### User 子領域 (個人用戶)
- **目標用戶**: 工程師、監工、承包商
- **核心實體**:
  - `UserProfile`: 個人資料 + 專業證照
  - `StarredProjects`: 星標專案
  - `Following`: 追蹤的用戶/組織
  - `Achievements`: 成就徽章
  - `Notifications`: 通知中心
  - `TeamMemberships`: 所屬團隊
  - `OrganizationMemberships`: 加入的組織

### Organization 子領域 (組織)
- **目標用戶**: 營造公司、建設公司
- **核心實體**:
  - `OrganizationProfile`: 組織資料 + 營業執照
  - `OrganizationMembers`: 組織成員
  - `Teams`: 團隊 (工務組/安全組/品管組)

## 模組結構

```
account-module/
=======
# User Module - 模組概覽

## 模組定義
**對應領域**: User Domain (個人用戶管理)  
**模組職責**: 個人用戶身份管理、個人資料管理、個人成就追蹤

## 領域模型

### User 領域 (個人用戶)
- **目標用戶**: 工程師、監工、承包商
- **核心實體**:
  - `UserProfile`: 個人資料 + 專業證照
  - `UserPreferences`: 個人偏好設定
  - `UserAuthentication`: 身份認證資訊
  - `UserAchievements`: 個人成就徽章
  - `UserSkills`: 專業技能和證照

## 模組結構

```
user-module/
>>>>>>> Incoming (Background Agent changes)
├── user/                    # 個人用戶功能
│   ├── profile/            # 個人資料管理
│   ├── preferences/        # 偏好設定
│   ├── achievements/       # 成就系統
│   ├── notifications/      # 通知中心
│   ├── following/          # 追蹤功能
│   └── starred-projects/   # 星標專案
├── organization/           # 組織管理功能
│   ├── management/         # 組織管理
│   ├── members/           # 成員管理
│   └── teams/             # 團隊管理
└── shared/                # 帳戶模組共享功能
    ├── guards/            # 認證守衛
    ├── services/          # 帳戶服務
    └── models/            # 資料模型
```

## 核心功能

### 1. 用戶管理
- **用戶註冊/登入**: Firebase Authentication
- **個人資料管理**: 基本資料 + 專業證照
- **偏好設定**: 個人化配置
- **成就系統**: 徽章管理，進度追蹤

### 2. 組織管理
- **組織建立**: 營造公司/建設公司註冊
- **成員管理**: 邀請/移除成員，角色分配
- **團隊管理**: 建立/管理團隊，成員分配

### 3. 社交功能
- **追蹤功能**: 追蹤用戶和組織
- **星標專案**: 收藏感興趣的專案
- **通知中心**: 即時通知，通知歷史

### 4. 權限控制
- **角色管理**: 用戶角色，組織角色，團隊角色
- **權限驗證**: 基於角色的存取控制
- **安全守衛**: 路由守衛，功能守衛

## 技術實作

### 狀態管理
- **全域狀態**: NgRx Store (用戶認證，應用設定)
- **模組狀態**: Angular Signals (用戶資料，組織資料)
- **組件狀態**: Local Signals (表單狀態，UI 狀態)

### 路由配置
- **認證路由**: `/auth/login`, `/auth/register`
- **用戶路由**: `/account/profile`, `/account/preferences`
- **組織路由**: `/account/organization`, `/account/teams`
- **社交路由**: `/account/following`, `/account/starred`

### 資料模型
- **Firebase Collections**: `users`, `organizations`, `teams`, `notifications`
- **TypeScript Interfaces**: 強型別資料模型
- **Validation**: 表單驗證，資料驗證

## 相關文件
- [狀態管理](./State Management.md)
- [路由配置](./Routing.md)
- [Firebase 架構](./Firebase Schema.md)
- [測試策略](./Testing.md)
