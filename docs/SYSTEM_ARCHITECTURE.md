# 0. 系統資料模型結構圖

## Core Modules (核心模組)

### Account Module (帳戶模組 - 統一基類) ✨
├── Account (抽象基類 - 所有帳戶的共同父類)
│   ├── accountId (帳戶唯一識別碼)
│   ├── accountType ('user' | 'organization') (帳戶類型區分)
│   ├── Profile (通用檔案資訊)
│   ├── Permissions (權限集合)
│   ├── Settings (通用設定)
│   └── Projects Owned (擁有的專案)

### User Module (用戶模組 - 繼承 Account)
├── User extends Account (個人用戶 - 工程師/監工/承包商)
│   ├── accountType = 'user'
│   ├── Profile (個人資料 + 專業證照)
│   ├── Certificates (專業證照)
│   ├── Teams (所屬團隊)
│   │   └── Team Role (在團隊中的角色)
│   ├── Organization Memberships (加入的組織)
│   │   └── Role (在組織中的角色)
│   └── Social Relations (社交關係)

### Organization Module (組織模組 - 繼承 Account)
├── Organization extends Account (組織 - 營造公司/建設公司)
│   ├── accountType = 'organization'
│   ├── Profile (組織資料 + 營業執照)
│   ├── Business License (營業執照)
│   ├── Members (組織成員)
│   │   ├── Member Info (成員個人資料)
│   │   ├── Role (組織角色：經理/工程師/監工)
│   │   └── Teams (所屬團隊)
│   └── Teams (團隊 - 工務組/安全組/品管組)
│       ├── Team Info (團隊資料)
│       ├── Members (團隊成員)
│       │   ├── Member Info (成員個人資料)
│       │   └── Role (隊長/成員)
│       └── Projects Assigned (分配給團隊的專案)

### Project Module (專案模組)
├── Projects (專案 = Repositories)
│   ├── Owner (擁有者 - Account 統一類型) ✨
│   ├── Project Info (專案基本資料)
│   ├── Milestones (里程碑/階段)
│   ├── Tasks/Issues (工項/問題追蹤)
│   ├── Documents (文件管理)
│   ├── Photos/Media (現場照片/影片)
│   ├── Daily Reports (每日施工日誌)
│   ├── Inspections (查驗記錄)
│   ├── Materials (材料管理)
│   ├── Equipment (設備/機具管理)
│   ├── Safety Records (安全記錄)
│   ├── Weather Logs (天氣記錄)
│   ├── Comments/Discussion (討論區)
│   ├── Gantt Chart Data (甘特圖資料)
│   └── Cost Control (成本控制)
│       ├── Budget (預算)
│       ├── Actual Cost (實際支出)
│       ├── Forecast (成本預測)
│       ├── Variance (預算差異)
│       └── Cost Breakdown (人力/材料/設備分解)

## Cross-Cutting Modules (橫切模組)

### Social Module (社交模組)
├── Relationships (關係管理)
│   ├── Following (追蹤關係)
│   │   ├── User Following User
│   │   ├── User Following Organization  
│   │   └── User Following Project
│   └── Followers (粉絲關係)
├── Social Network (社交網絡)
│   ├── Connection Analysis (連結分析)
│   ├── Mutual Connections (共同連結)
│   └── Network Graph (網絡圖譜)
└── Recommendations (推薦系統)
    ├── User Recommendations (用戶推薦)
    ├── Content Recommendations (內容推薦)
    └── Professional Recommendations (專業推薦)

### Achievement Module (成就模組)  
├── Achievements (成就系統)
│   ├── User Achievements (用戶成就)
│   ├── Organization Achievements (組織成就)
│   └── Project Achievements (專案成就)
├── Rules Engine (規則引擎)
│   ├── Achievement Rules (成就規則)
│   ├── Trigger Conditions (觸發條件)
│   └── Scoring System (計分系統)
├── Categories (成就分類)
│   ├── Professional Categories (專業分類)
│   ├── Social Categories (社交分類)
│   └── Project Categories (專案分類)
└── Leaderboards (排行榜)
    ├── Global Leaderboard (全域排行榜)
    ├── Organization Leaderboard (組織排行榜)
    └── Category Leaderboard (分類排行榜)

### Notification Module (通知模組)
├── Notifications (通知系統)
│   ├── System Notifications (系統通知)
│   ├── User Notifications (用戶通知)
│   ├── Organization Notifications (組織通知)
│   └── Project Notifications (專案通知)
├── Channels (通知通道)  
│   ├── In-App Notifications (應用內通知)
│   ├── Email Notifications (郵件通知)
│   ├── SMS Notifications (簡訊通知)
│   └── Push Notifications (推送通知)
├── Templates (通知模板)
│   ├── Template Management (模板管理)
│   ├── Multi-language Support (多語言支援)
│   └── Dynamic Content (動態內容)
└── Preferences (通知偏好)
    ├── User Preferences (用戶偏好)
    ├── Channel Preferences (通道偏好)
    ├── Frequency Control (頻率控制)
    └── Do Not Disturb (免打擾設定)

## Integration Points (整合點)

### Event-Driven Integration (事件驅動整合)
├── Domain Events (領域事件)
│   ├── User Events (用戶事件)
│   ├── Organization Events (組織事件)
│   ├── Project Events (專案事件)
│   ├── Social Events (社交事件)
│   ├── Achievement Events (成就事件)
│   └── Notification Events (通知事件)
└── Event Bus (事件匯流排)
    ├── Event Publishing (事件發布)
    ├── Event Subscription (事件訂閱)
    └── Event Processing (事件處理)

### Shared Services (共享服務)
├── Authentication (認證服務)
│   ├── Firebase Auth Integration
│   ├── @delon/auth Integration  
│   └── Token Management
├── Authorization (授權服務)
│   ├── @delon/acl Integration
│   ├── Role-Based Access Control
│   └── Permission Management
├── File Storage (檔案儲存)
│   ├── Document Storage
│   ├── Image Storage
│   └── Media Storage
└── Audit & Logging (審計與日誌)
    ├── Operation Logs
    ├── Security Logs
    └── Performance Logs

## Technical Integration Layer (技術整合層)

### Authentication & Authorization Stack (認證授權技術棧)
├── Firebase Authentication (Firebase 認證)
│   ├── Email/Password Authentication (郵箱密碼認證)
│   ├── Social Login Integration (社交登入整合)
│   ├── Email Verification (郵箱驗證)
│   ├── Password Reset (密碼重置)
│   └── ID Token Management (ID令牌管理)
├── @delon/auth Integration (@delon/auth 整合)
│   ├── Token Storage & Management (令牌儲存管理)
│   ├── Authentication State Management (認證狀態管理)
│   ├── Auto Token Refresh (自動令牌刷新)
│   ├── Login/Logout Interceptors (登入登出攔截器)
│   └── Route Guards (路由守衛)
└── @delon/acl Authorization (@delon/acl 授權)
    ├── Role-Based Access Control (角色權限控制)
    ├── Permission Management (權限管理)
    ├── Route-Level Protection (路由層級保護)
    ├── Component-Level Protection (元件層級保護)
    ├── Organization Context Switching (組織上下文切換)
    └── Dynamic Permission Updates (動態權限更新)

#### Canonical Login Flow（登入鏈與 Token 橋接）
1. 使用者於 UI 輸入憑證。
2. 透過 `@angular/fire` 呼叫 Firebase Auth 完成登入並取得 Firebase ID Token。
3. `Auth Integration Service` 將 Firebase ID Token 正規化，透過 `@delon/auth` 的 `TokenService` 儲存（預設 localStorage）。
4. `token.interceptor.ts` 為對外 API 請求自動附加 `Authorization: Bearer <Firebase ID Token>`。
5. `@delon/auth` 維護登入狀態；UI 依狀態切換（登入/登出/過期）。
6. 以 Account 檔案 + 當前 `organizationId` 組裝 ACL 能力集合，初始化 `@delon/acl` 權限樹。
7. `ACLGuard` 保護受控路由；`*appAcl` 指令/管道於元件層控管顯示。
8. 監聽 Firebase `onIdTokenChanged` 或等效事件，於 Token 更新時同步 `TokenService` 並重算 ACL（避免權限漂移）。

#### ACL 映射規則（摘要）
- **來源**：Account 檔案中的角色/權限 + Context（`organizationId`、必要時 `projectId`）。
- **轉換**：映射為 `@delon/acl` 的 `roles` 與 `abilities`（能力集合），保存在 ACL 服務內存。
- **切換**：Account 切換組織時，重新計算映射並更新 ACL；確保路由守衛與模板條件立刻生效。

#### 攔截器與守衛責任邊界
- **token.interceptor.ts**：注入 `Authorization` 標頭，來源為 `@delon/auth TokenService`。
- **auth.interceptor.ts**：集中處理未授權/過期等錯誤與導流邏輯（避免與 Token 注入重疊責任）。
- **ACLGuard**：路由守衛，以 `@delon/acl` 權限樹判斷可達性。
- 參考：本檔「# 9. 用戶認證與權限管理流程圖」與「MVP 落地實作指南/認證與授權」。

### Data Persistence Architecture (資料持久化架構)
├── Firestore Collections (Firestore 集合設計)
│   ├── Accounts Collection (/accounts) ✨ 統一帳戶集合
│   │   ├── Account Base Data (帳戶基礎資料)
│   │   │   ├── accountId (帳戶ID)
│   │   │   ├── accountType ('user' | 'organization')
│   │   │   ├── profile (通用檔案)
│   │   │   └── permissions (權限集合)
│   │   ├── User-Specific Data (用戶特定資料，accountType='user')
│   │   │   ├── certificates (證照)
│   │   │   └── socialRelations (社交關係)
│   │   └── Organization-Specific Data (組織特定資料，accountType='organization')
│   │       ├── businessLicense (營業執照)
│   │       ├── Members Subcollection (/members)
│   │       └── Teams Subcollection (/teams)
│   ├── Projects Collection (/projects)
│   │   ├── Project Data (專案資料)
│   │   ├── Tasks Subcollection (/tasks)
│   │   ├── Documents Subcollection (/documents)
│   │   └── Cost Control Subcollection (/costs)
│   ├── Social Relations Collection (/social_relations)
│   │   ├── Following Relationships (追蹤關係)
│   │   ├── Social Statistics (社交統計)
│   │   └── Recommendation Data (推薦資料)
│   ├── Achievements Collection (/achievements)
│   │   ├── Achievement Definitions (成就定義)
│   │   ├── User Achievements (/user_achievements)
│   │   ├── Achievement Rules (成就規則)
│   │   └── Leaderboards (排行榜)
│   └── Notifications Collection (/notifications)
│       ├── Notification Queue (通知佇列)
│       ├── User Preferences (/user_preferences)
│       ├── Notification Templates (通知模板)
│       └── Delivery Logs (投遞日誌)
├── Real-time Subscriptions (即時訂閱)
│   ├── User Activity Streams (用戶活動流)
│   ├── Organization Updates (組織更新)
│   ├── Project Progress (專案進度)
│   ├── Social Interactions (社交互動)
│   └── Notification Delivery (通知投遞)
├── Offline Synchronization (離線同步)
│   ├── Local Cache Management (本地快取管理)
│   ├── Conflict Resolution (衝突解決)
│   ├── Background Sync (背景同步)
│   └── Data Validation (資料驗證)
└── Security Rules (安全規則)
    ├── User Data Access Control (用戶資料存取控制)
    ├── Organization-Level Security (組織層級安全)
    ├── Project Access Control (專案存取控制)
    └── Cross-Module Security (跨模組安全)

### Event-Driven Infrastructure (事件驅動基礎設施)
├── Event Bus Architecture (事件匯流排架構)
│   ├── Domain Event Publishing (領域事件發布)
│   ├── Event Subscription Management (事件訂閱管理)
│   ├── Event Routing (事件路由)
│   └── Event Filtering (事件過濾)
├── Event Store (事件儲存)
│   ├── Event Persistence (事件持久化)
│   ├── Event History (事件歷史)
│   ├── Event Snapshots (事件快照)
│   └── Event Replay (事件重播)
├── Event Processing (事件處理)
│   ├── Synchronous Processing (同步處理)
│   ├── Asynchronous Processing (非同步處理)
│   ├── Batch Processing (批次處理)
│   └── Error Handling (錯誤處理)
└── Integration Events (整合事件)
    ├── User Events → Social/Achievement/Notification
    ├── Organization Events → User/Project/Achievement
    ├── Project Events → User/Organization/Achievement
    ├── Social Events → Achievement/Notification
    ├── Achievement Events → Social/Notification
    └── Notification Events → All Modules (Delivery Status)

## Cross-Module Dependencies Matrix (跨模組依賴矩陣)

### Module Interaction Patterns (模組互動模式)
User Org Proj Social Achv Notif
User Module - ✓ ✓ ○ ○ ○
Organization ✓ - ✓ ○ ○ ○
Project ✓ ✓ - ○ ○ ○
Social ✓ ✓ ✓ - ✓ ✓
Achievement ✓ ✓ ✓ ✓ - ✓
Notification ✓ ✓ ✓ ✓ ✓ -
Legend: ✓ = Strong Dependency ○ = Event-based Integration


### Data Flow Patterns (資料流向模式)
├── **Core Data Flow** (核心資料流)
│   ├── User → Organization (用戶加入組織)
│   ├── Organization → Project (組織建立專案)  
│   ├── User ↔ Project (用戶參與專案)
│   └── User ↔ Organization ↔ Project (三角關係)
├── **Social Data Flow** (社交資料流)
│   ├── User → Social Relations (建立追蹤關係)
│   ├── Social Relations → Recommendations (生成推薦)
│   ├── Activity Events → Social Feed (活動饋送)
│   └── Social Metrics → Analytics (社交分析)
├── **Achievement Data Flow** (成就資料流)
│   ├── All Modules → Achievement Triggers (成就觸發)
│   ├── Achievement Rules → Rule Evaluation (規則評估)
│   ├── Achievement Awards → User Profile (成就頒發)
│   └── Achievement Stats → Leaderboards (排行榜更新)
└── **Notification Data Flow** (通知資料流)
    ├── All Events → Notification Queue (通知佇列)
    ├── User Preferences → Notification Filtering (通知過濾)
    ├── Templates + Data → Rendered Notifications (渲染通知)
    └── Delivery Status → Analytics (投遞分析)

## Implementation Considerations (實作考量)

### Scalability Architecture (可擴展性架構)
├── **Horizontal Scaling** (水平擴展)
│   ├── Microservice-Ready Design (微服務就緒設計)
│   ├── Database Sharding Strategy (資料庫分片策略)
│   ├── Load Balancing (負載平衡)
│   └── CDN Integration (CDN 整合)
├── **Performance Optimization** (效能優化)
│   ├── Lazy Loading (延遲載入)
│   ├── Caching Strategy (快取策略)
│   ├── Query Optimization (查詢優化)
│   └── Bundle Splitting (包分割)
└── **Monitoring & Observability** (監控與可觀測性)
    ├── Application Metrics (應用指標)
    ├── Performance Monitoring (效能監控)
    ├── Error Tracking (錯誤追蹤)
    └── User Analytics (用戶分析)

### Security Architecture (安全架構)
├── **Authentication Security** (認證安全)
│   ├── Multi-Factor Authentication (多因子認證)
│   ├── Token Security (令牌安全)
│   ├── Session Management (會話管理)
│   └── Brute Force Protection (暴力破解防護)
├── **Authorization Security** (授權安全)
│   ├── Principle of Least Privilege (最小權限原則)
│   ├── Resource-Level Access Control (資源層級存取控制)
│   ├── Context-Aware Permissions (上下文感知權限)
│   └── Permission Audit Trail (權限審計軌跡)
├── **Data Security** (資料安全)
│   ├── Data Encryption (資料加密)
│   ├── PII Protection (個人資訊保護)
│   ├── Data Masking (資料遮罩)
│   └── Backup Security (備份安全)
└── **Communication Security** (通訊安全)
    ├── HTTPS Enforcement (HTTPS 強制)
    ├── API Security (API 安全)
    ├── Input Validation (輸入驗證)
    └── XSS/CSRF Protection (XSS/CSRF 防護)

### Development Workflow (開發工作流程)
├── **Phase 1: Foundation** (第一階段：基礎建設) - 3-4 months
│   ├── User Module (Core Auth + Profile)
│   ├── Organization Module (Basic Management)
│   ├── Authentication Stack Integration
│   └── Basic Event Infrastructure
├── **Phase 2: Core Business** (第二階段：核心業務) - 2-3 months  
│   ├── Project Module (Full Implementation)
│   ├── Advanced Organization Features
│   ├── User-Organization-Project Integration
│   └── Core Business Logic Testing
├── **Phase 3: Social Features** (第三階段：社交功能) - 2-3 months
│   ├── Social Module (Following/Recommendations)
│   ├── Notification Module (Multi-channel)
│   ├── Achievement Module (Rules Engine)
│   └── Cross-Module Event Integration
└── **Phase 4: Advanced Features** (第四階段：進階功能) - 1-2 months
    ├── Advanced Analytics
    ├── Performance Optimization
    ├── Security Hardening
    └── Production Deployment

# 1. 用戶模組架構圖 ✅

graph TB
    subgraph "User Presentation Layer (用戶展示層)"
        subgraph "認證相關元件"
            UCLA[Login Component<br/>登入元件]
            UCRA[Registration Component<br/>註冊元件]
            UCFA[Forgot Password Component<br/>忘記密碼元件]
            UCVA[Email Verification Component<br/>郵箱驗證元件]
        end
        
        subgraph "個人檔案元件"
            UCPC[Profile Card Component<br/>個人檔案卡片元件]
            UCPE[Profile Edit Component<br/>個人檔案編輯元件]
            UCAV[Avatar Component<br/>頭像元件]
            UCBI[Basic Info Component<br/>基本資訊元件]
        end
        
        subgraph "專業證照元件"
            UCCM[Certificate Management Component<br/>證照管理元件]
            UCCL[Certificate List Component<br/>證照列表元件]
            UCCU[Certificate Upload Component<br/>證照上傳元件]
            UCCV[Certificate Verification Component<br/>證照驗證元件]
        end
        
        subgraph "社交功能元件"
            UCFL[Following List Component<br/>追蹤列表元件]
            UCFR[Followers List Component<br/>粉絲列表元件]
            UCSB[Social Button Component<br/>社交按鈕元件]
            UCSC[Social Card Component<br/>社交卡片元件]
        end
        
        subgraph "成就與通知元件"
            UCAC[Achievement Component<br/>成就元件]
            UCAB[Achievement Badge Component<br/>成就徽章元件]
            UCNC[Notification Center Component<br/>通知中心元件]
            UCNL[Notification List Component<br/>通知列表元件]
            UCNS[Notification Settings Component<br/>通知設定元件]
        end
        
        subgraph "用戶狀態服務"
            UCUS[User State Service<br/>用戶狀態服務]
            UCAS[Auth State Service<br/>認證狀態服務]
            UCPS[Profile State Service<br/>檔案狀態服務]
        end
    end
    
    subgraph "User Application Layer (用戶應用層)"
        subgraph "認證服務"
            UCAAS[Authentication Application Service<br/>認證應用服務]
            UCLC[LoginUser Command<br/>用戶登入命令]
            UCRC[RegisterUser Command<br/>用戶註冊命令]
            UCFC[ForgotPassword Command<br/>忘記密碼命令]
            UCVC[VerifyEmail Command<br/>郵箱驗證命令]
            UCLH[Login Command Handler<br/>登入命令處理器]
        end
        
        subgraph "個人檔案服務"
            UCPAS[Profile Application Service<br/>檔案應用服務]
            UCPC[CreateProfile Command<br/>建立檔案命令]
            UCPU[UpdateProfile Command<br/>更新檔案命令]
            UCPQ[GetProfile Query<br/>查詢檔案查詢]
            UCPH[Profile Command Handler<br/>檔案命令處理器]
        end
        
        subgraph "證照管理服務"
            UCCAS[Certificate Application Service<br/>證照應用服務]
            UCCAC[AddCertificate Command<br/>新增證照命令]
            UCCVC[VerifyCertificate Command<br/>驗證證照命令]
            UCCQ[GetCertificates Query<br/>查詢證照查詢]
        end
        
        subgraph "社交功能服務"
            UCSAS[Social Application Service<br/>社交應用服務]
            UCFUC[FollowUser Command<br/>追蹤用戶命令]
            UCUFC[UnfollowUser Command<br/>取消追蹤命令]
            UCFQ[GetFollowing Query<br/>查詢追蹤查詢]
        end
        
        subgraph "成就與通知服務"
            UCAAS[Achievement Application Service<br/>成就應用服務]
            UCNAS[Notification Application Service<br/>通知應用服務]
            UCAC[AwardAchievement Command<br/>頒發成就命令]
            UCNC[CreateNotification Command<br/>建立通知命令]
            UCMC[MarkAsRead Command<br/>標記已讀命令]
        end
    end
    
    subgraph "User Domain Layer (用戶領域層)"
        subgraph "用戶聚合根"
            UCDA[User Aggregate<br/>用戶聚合根]
            UCUE[UserCreated Event<br/>用戶建立事件]
            UCPE[ProfileUpdated Event<br/>檔案更新事件]
            UCCE[CertificateAdded Event<br/>證照新增事件]
            UCAE[AchievementAwarded Event<br/>成就頒發事件]
        end
        
        subgraph "用戶實體"
            UCUE[User Entity<br/>用戶實體]
            UCPR[Profile Entity<br/>個人檔案實體]
            UCCERT[Certificate Entity<br/>證照實體]
            UCACH[Achievement Entity<br/>成就實體]
            UCNOT[Notification Entity<br/>通知實體]
            UCSOC[Social Entity<br/>社交關係實體]
        end
        
        subgraph "用戶值物件"
            UCUV[UserInfo Value Object<br/>用戶資訊值物件]
            UCPV[ProfileInfo Value Object<br/>檔案資訊值物件]
            UCCV[CertificateInfo Value Object<br/>證照資訊值物件]
            UCAV[AchievementInfo Value Object<br/>成就資訊值物件]
            UCNV[NotificationInfo Value Object<br/>通知資訊值物件]
            UCSV[SocialInfo Value Object<br/>社交資訊值物件]
        end
        
        subgraph "用戶領域服務"
            UCDS[User Domain Service<br/>用戶領域服務]
            UCPDS[Profile Domain Service<br/>檔案領域服務]
            UCCDS[Certificate Domain Service<br/>證照領域服務]
            UCADS[Achievement Domain Service<br/>成就領域服務]
            UCSDS[Social Domain Service<br/>社交領域服務]
        end
        
        subgraph "ACL權限實體"
            UCACL[User ACL Entity<br/>用戶權限實體]
            UCROLE[User Role Entity<br/>用戶角色實體]
            UCPERM[User Permission Entity<br/>用戶權限實體]
        end
    end
    
    subgraph "User Infrastructure Layer (用戶基礎設施層)"
        subgraph "Firebase認證整合"
            UCFAS[Firebase Auth Service<br/>Firebase認證服務]
            UCFAU[Firebase Auth Utils<br/>Firebase認證工具]
            UCFAI[Firebase Auth Interceptor<br/>Firebase認證攔截器]
        end
        
        subgraph "@delon/auth整合"
            UCDAS[Delon Auth Service<br/>Delon認證服務]
            UCDAI[Delon Auth Interceptor<br/>Delon認證攔截器]
            UCDAU[Delon Auth Utils<br/>Delon認證工具]
            UCDTS[Delon Token Service<br/>Delon令牌服務]
        end
        
        subgraph "@delon/acl整合"
            UCDACL[Delon ACL Service<br/>Delon權限服務]
            UCDAG[Delon ACL Guard<br/>Delon權限守衛]
            UCDAD[Delon ACL Directive<br/>Delon權限指令]
            UCDAP[Delon ACL Pipe<br/>Delon權限管道]
        end
        
        subgraph "資料持久化"
            UCIR[Firestore User Repository<br/>Firestore用戶儲存庫]
            UCIPR[Firestore Profile Repository<br/>Firestore檔案儲存庫]
            UCICR[Firestore Certificate Repository<br/>Firestore證照儲存庫]
            UCIAR[Firestore Achievement Repository<br/>Firestore成就儲存庫]
            UCINR[Firestore Notification Repository<br/>Firestore通知儲存庫]
        end
        
        subgraph "事件處理"
            UCIEH[User Event Handler<br/>用戶事件處理器]
            UCIPEH[Profile Event Handler<br/>檔案事件處理器]
            UCICEH[Certificate Event Handler<br/>證照事件處理器]
            UCIAEH[Achievement Event Handler<br/>成就事件處理器]
        end
        
        subgraph "外部服務"
            UCIWS[External User Service<br/>外部用戶服務]
            UCIIS[User Infrastructure Service<br/>用戶基礎設施服務]
            UCIFS[File Storage Service<br/>檔案儲存服務]
            UCINS[User Notification Service<br/>用戶通知服務]
            UCIAS[User Audit Service<br/>用戶審計服務]
            UCIVS[Certificate Verification Service<br/>證照驗證服務]
            UCIES[Email Service<br/>郵件服務]
        end
        
        subgraph "整合服務"
            UCIOS[Organization Integration Service<br/>組織整合服務]
            UCIPS[Project Integration Service<br/>專案整合服務]
            UCITS[Team Integration Service<br/>團隊整合服務]
        end
    end
    
    %% 技術棧整合連接 (特殊顏色標記)
    %% Firebase Auth 連接
    UCLA --> UCFAS
    UCRA --> UCFAS
    UCFA --> UCFAS
    UCVA --> UCFAS
    
    %% @delon/auth 連接
    UCFAS --> UCDAS
    UCDAS --> UCAS
    UCDTS --> UCAS
    
    %% @delon/acl 連接
    UCDAS --> UCDACL
    UCDACL --> UCDAG
    UCDACL --> UCDAD
    UCDACL --> UCDAP
    
    %% 層級間連接 (實線)
    UCLA --> UCAAS
    UCRA --> UCAAS
    UCPC --> UCPAS
    UCCM --> UCCAS
    UCFL --> UCSAS
    UCAC --> UCAAS
    UCNC --> UCNAS
    
    UCAAS --> UCDA
    UCPAS --> UCPR
    UCCAS --> UCCERT
    UCSAS --> UCSOC
    UCAAS --> UCACH
    UCNAS --> UCNOT
    
    UCDA --> UCIR
    UCPR --> UCIPR
    UCCERT --> UCICR
    UCACH --> UCIAR
    UCNOT --> UCINR
    UCSOC --> UCIR

# 2. 用戶模組用例圖 ✅

graph TB
    subgraph "外部參與者"
        NewUser[新用戶]
        RegisteredUser[已註冊用戶]
        AuthUser[已認證用戶]
        Admin[管理員]
        VerificationAuth[驗證機構]
        ExternalSystem[外部系統]
    end
    
    subgraph "用戶模組功能"
        subgraph "認證管理"
            UC1[用戶註冊]
            UC2[用戶登入]
            UC3[忘記密碼]
            UC4[郵箱驗證]
            UC5[雙因子認證]
            UC6[登出]
            UC7[Token刷新]
        end
        
        subgraph "個人檔案管理"
            UC8[建立個人檔案]
            UC9[更新個人資訊]
            UC10[上傳頭像]
            UC11[查看個人檔案]
            UC12[隱私設定]
            UC13[帳戶設定]
        end
        
        subgraph "專業證照管理"
            UC14[上傳證照]
            UC15[證照驗證]
            UC16[證照更新]
            UC17[證照到期提醒]
            UC18[證照展示設定]
            UC19[證照搜尋]
        end
        
        subgraph "社交功能"
            UC20[追蹤用戶]
            UC21[取消追蹤]
            UC22[查看追蹤列表]
            UC23[查看粉絲列表]
            UC24[用戶搜尋]
            UC25[推薦用戶]
        end
        
        subgraph "成就系統"
            UC26[獲得成就]
            UC27[查看成就]
            UC28[成就分享]
            UC29[成就排行榜]
            UC30[成就統計]
        end
        
        subgraph "通知系統"
            UC31[接收通知]
            UC32[標記已讀]
            UC33[通知設定]
            UC34[通知歷史]
            UC35[推送偏好]
        end
        
        subgraph "權限管理"
            UC36[權限檢查]
            UC37[角色分配]
            UC38[權限繼承]
            UC39[權限審計]
            UC40[組織權限]
        end
    end

# 3. 用戶認證完整流程圖 ✅

sequenceDiagram
    participant User as 新用戶
    participant UI as Angular UI
    participant FA as FirebaseAuthService
    participant DA as DelonAuthService
    participant ACL as DelonAclService
    participant US as UserService
    participant UR as UserRepository
    participant ES as EmailService
    participant NS as NotificationService

    User->>UI: 填寫註冊資料
    UI->>FA: createUserWithEmailAndPassword()
    FA->>FA: Firebase 建立用戶帳戶
    FA-->>UI: 返回 Firebase User
    
    UI->>US: createUserProfile(userInfo)
    US->>UR: saveUser(userEntity)
    UR-->>US: 返回用戶ID
    
    US->>ES: sendVerificationEmail(email)
    ES-->>US: 發送驗證郵件
    
    US->>NS: createWelcomeNotification(userId)
    NS-->>US: 建立歡迎通知
    
    alt 郵箱驗證完成
        User->>UI: 點擊驗證連結
        UI->>FA: verifyEmail()
        FA-->>UI: 驗證成功
        UI->>DA: login(credentials)
        DA->>FA: signInWithEmailAndPassword()
        FA-->>DA: 返回 ID Token
        DA->>DA: 儲存 token 到 localStorage
        DA->>ACL: setUser(userProfile)
        ACL->>ACL: 設定基本用戶權限
        ACL-->>DA: 權限設定完成
        DA-->>UI: 登入成功
        UI->>User: 跳轉到個人檔案設定頁面
    else 郵箱未驗證
        UI->>User: 顯示郵箱驗證提醒
    end

# 4. 用戶模組功能特性 ✅

包含：
認證管理
註冊、登入、登出、忘記密碼
郵箱驗證、雙因子認證
Token管理、自動刷新
社交登入整合
個人檔案管理
基本資訊、聯絡資訊、專業背景
頭像上傳、隱私設定
個人設定、偏好配置
檔案完整度追蹤
專業證照管理
證照上傳、分類管理
自動驗證、手動審核
到期提醒、更新追蹤
證照展示、搜尋功能
社交功能
追蹤關係、用戶發現
推薦系統、搜尋功能
社交統計、互動記錄
隱私控制、封鎖功能
成就系統
自動成就偵測、手動頒發
成就分類、等級系統
排行榜、統計分析
分享功能、展示設定
通知系統
即時推送、郵件通知
分類管理、優先級設定
歷史記錄、已讀狀態
偏好設定、頻率控制
權限與安全
角色型權限控制 (RBAC)
組織層級權限
操作審計、安全日誌
隱私保護、資料加密

# 5. 組織模組架構圖 ✅

graph TB
    subgraph "Organization Presentation Layer"
        OCPC[Organization Card Component]
        OCLP[Organization List Page]
        OCPS[Organization State Service]
        OCPF[Organization Form Component]
        OCLS[Organization List Component]
        OCTM[Team Management Component]
        OCMB[Member Management Component]
        OCPR[Project Assignment Component]
    end
    
    subgraph "Organization Application Layer"
        OCAS[Organization Application Service]
        OCAC[CreateOrganization Command]
        OCAQ[GetOrganization Query]
        OCAH[Organization Command Handler]
        OCMS[Member Management Service]
        OCTS[Team Management Service]
        OCPAS[Project Assignment Service]
        OCNOT[Notification Service]
    end
    
    subgraph "Organization Domain Layer"
        OCDA[Organization Aggregate]
        OCDE[OrganizationCreated Event]
        OCDV[OrganizationProfile Value Object]
        OCDS[Organization Domain Service]
        OCME[Member Entity]
        OCTE[Team Entity]
        OCPAE[Project Assignment Entity]
        OCMV[MemberInfo Value Object]
        OCTV[TeamInfo Value Object]
        OCPAV[ProjectAssignment Value Object]
    end
    
    subgraph "Organization Infrastructure Layer"
        OCIR[Firestore Organization Repository]
        OCIE[Organization Event Handler]
        OCIW[External Organization Service]
        OCIS[Organization Infrastructure Service]
        OCIF[File Storage Service]
        OCIN[Notification Service]
        OCIA[Audit Service]
    end


# 6. 組織模組用例圖 ✅

graph TB
    subgraph "外部參與者"
        Admin[組織管理員]
        Manager[專案經理]
        Member[組織成員]
        ExternalUser[外部用戶]
        System[外部系統]
    end
    
    subgraph "組織模組功能"
        subgraph "組織管理"
            UC1[建立組織]
            UC2[更新組織資料]
            UC3[查看組織資料]
            UC4[刪除組織]
            UC5[組織設定]
            UC6[組織狀態管理]
        end
        
        subgraph "成員管理"
            UC7[邀請成員]
            UC8[接受邀請]
            UC9[拒絕邀請]
            UC10[查看成員列表]
            UC11[更新成員資料]
            UC12[移除成員]
            UC13[成員狀態管理]
        end
        
        subgraph "角色管理"
            UC14[定義角色]
            UC15[分配權限]
            UC16[角色繼承]
            UC17[權限審計]
        end
        
        subgraph "團隊管理"
            UC18[建立團隊]
            UC19[團隊設定]
            UC20[成員分配]
            UC21[團隊協作]
            UC22[團隊報告]
        end
    end

# 7. 組織模組事件流圖 ✅

sequenceDiagram
    participant User as 組織創建者
    participant UI as 用戶介面
    participant App as 應用服務
    participant Domain as 領域服務
    participant Repo as 資料庫
    participant Event as 事件處理器
    participant License as 執照驗證服務
    participant Notification as 通知服務
    participant Audit as 審計服務

    User->>UI: 填寫組織資料
    UI->>App: CreateOrganizationCommand
    App->>Domain: 驗證組織資料
    Domain->>License: 驗證營業執照
    License-->>Domain: 返回驗證結果
    
    alt 執照驗證通過
        Domain->>Repo: 儲存組織資料
        Repo-->>Domain: 返回組織ID
        Domain->>Event: 發布 OrganizationCreated 事件
        Event->>Notification: 發送建立成功通知
        Event->>Audit: 記錄組織建立日誌
        Event->>App: 初始化組織設定
        App->>Domain: 設定預設角色和權限
        Domain->>Repo: 儲存角色設定
        App->>UI: 返回建立結果
        UI->>User: 顯示建立成功，跳轉組織頁面
    else 執照驗證失敗
        License-->>Domain: 返回驗證失敗
        Domain-->>App: 返回驗證錯誤
        App-->>UI: 返回錯誤訊息
        UI-->>User: 顯示執照驗證失敗
    end

# 8. 建立組織詳細流程圖 ✅

sequenceDiagram
    participant U as User (前端)
    participant C as CreateOrgController
    participant S as CreateOrgService
    participant VR as ValidationService
    participant OR as OrgRepository
    participant MS as MembershipService
    participant FS as FileService
    participant SS as SetupService
    participant VS as VerificationService
    participant EB as EventBus

    U->>C: POST /organizations
    C->>C: 驗證用戶郵箱已確認
    C->>C: 轉換 DTO 為 Command
    C->>S: createOrganization(command, files)
    
    S->>OR: findByRegistrationNumber(regNumber)
    OR-->>S: 返回查詢結果
    
    alt 統編已存在
        S-->>C: 拋出 ApplicationError
        C-->>U: 409 Conflict
    end
    
    S->>MS: getUserOwnedOrganizations(userId)
    MS-->>S: 返回用戶擁有的組織
    
    alt 超過組織數量限制
        S-->>C: 拋出 ApplicationError
        C-->>U: 400 Bad Request
    end
    
    S->>S: processLicenseFiles(licenses, files)
    S->>FS: uploadFile(file, options)
    FS-->>S: 返回文件 URL
    
    S->>S: Organization.create(command)
    S->>OR: save(organization)
    OR-->>S: 返回保存的組織
    
    S->>MS: createOwnerMembership(orgId, userId)
    MS-->>S: 完成
    
    S->>SS: setupOrganization(organization)
    S->>VS: initiateVerification(orgId)
    S->>EB: publish(OrganizationCreatedEvent)
    
    S-->>C: 返回組織資訊
    C-->>U: 201 Created

# 9. 用戶認證與權限管理流程圖 ✅

sequenceDiagram
    participant User as 用戶
    participant UI as Angular UI
    participant FA as FirebaseAuthService
    participant AS as AuthService (@delon/auth)
    participant ACL as DelonAclService (@delon/acl)
    participant Router as Angular Router
    participant Component as Angular Component

    User->>UI: 輸入登入資料
    UI->>FA: loginWithEmail(credentials)
    FA->>FA: Firebase Authentication
    FA-->>FA: 取得 Firebase ID Token
    FA-->>AS: 返回 UserProfile + ID Token
    
    AS->>AS: 儲存 token 到 localStorage
    AS->>AS: 管理認證狀態
    AS-->>AS: 提供用戶資訊
    
    AS->>ACL: setUser(userProfile)
    ACL->>ACL: 根據用戶角色設定權限
    ACL->>ACL: 提供權限檢查方法
    ACL-->>AS: 權限設定完成
    
    AS-->>UI: 登入成功
    UI->>Router: 導航到受保護路由
    
    Router->>ACL: ACLGuard.canActivate()
    ACL-->>Router: 路由守衛自動保護
    Router-->>Component: 路由自動受保護
    
    Component->>Component: 模板條件渲染 (*appAcl)
    Component->>ACL: 元件權限檢查
    ACL-->>Component: 權限檢查結果

# 10. 組織切換與權限管理流程圖 ✅

sequenceDiagram
    participant User as 已認證用戶
    participant UI as Angular UI
    participant OM as Organization Module
    participant OS as Organization Service
    participant ACL as DelonAclService
    participant Router as Angular Router
    participant Component as Organization Component

    User->>UI: 選擇/切換組織
    UI->>OM: getOrganizations()
    OM->>OS: fetchUserOrganizations()
    OS-->>OM: 返回組織列表
    
    User->>UI: 選擇特定組織
    UI->>OM: setCurrentOrganization(orgId)
    OM->>ACL: updateOrganizationContext(orgId)
    ACL->>ACL: 更新組織層級權限
    ACL-->>OM: 權限更新完成
    
    OM-->>UI: 組織切換成功
    UI->>Router: 導航到組織相關路由
    
    Router->>ACL: ACLGuard.canActivate()
    ACL->>ACL: 檢查組織層級權限
    ACL-->>Router: 組織權限驗證
    Router-->>Component: 路由受組織權限保護
    
    Component->>Component: 組織相關模板渲染
    Component->>ACL: 檢查組織操作權限
    ACL-->>Component: 組織權限檢查結果

# 11. 組織模組功能特性 ✅

包含：
組織管理: 建立、更新、查看、刪除、設定、狀態管理
成員管理: 邀請、接受、拒絕、查看、更新、移除、狀態管理
角色管理: 定義、分配、繼承、審計
團隊管理: 建立、設定、分配、協作、報告
專案分配: 指派、權限、資源、時程、協作、報告
通知溝通: 即時通知、偏好、歷史、模板、內部訊息、討論區
審計合規: 操作記錄、變更追蹤、權限審計、合規管理
資料管理: 備份、恢復、同步、清理、安全、加密

# 12. 專案架構圖 ✅
graph TB
    subgraph "Project Presentation Layer (專案展示層)"
        subgraph "專案管理元件"
            PCPC[Project Card Component<br/>專案卡片元件]
            PCLP[Project List Page<br/>專案列表頁面]
            PCPS[Project State Service<br/>專案狀態服務]
            PCPF[Project Form Component<br/>專案表單元件]
            PCLS[Project List Component<br/>專案列表元件]
            PCDP[Project Detail Page<br/>專案詳情頁面]
        end
        
        subgraph "任務管理元件"
            PCTM[Task Management Component<br/>任務管理元件]
            PCTL[Task List Component<br/>任務列表元件]
            PCTF[Task Form Component<br/>任務表單元件]
            PCTD[Task Detail Component<br/>任務詳情元件]
        end
        
        subgraph "文件管理元件"
            PCDM[Document Management Component<br/>文件管理元件]
            PCDL[Document List Component<br/>文件列表元件]
            PCDU[Document Upload Component<br/>文件上傳元件]
            PCDV[Document Viewer Component<br/>文件檢視元件]
        end
        
        subgraph "成本控制元件"
            PCCB[Cost Budget Component<br/>預算元件]
            PCCAC[Cost Actual Component<br/>實際成本元件]
            PCCF[Cost Forecast Component<br/>成本預測元件]
            PCCV[Cost Variance Component<br/>成本差異元件]
            PCCBD[Cost Breakdown Component<br/>成本分解元件]
        end
        
        subgraph "報告與分析元件"
            PCDR[Daily Report Component<br/>日報元件]
            PCIR[Inspection Report Component<br/>查驗報告元件]
            PCAR[Analytics Report Component<br/>分析報告元件]
            PCGR[Gantt Chart Component<br/>甘特圖元件]
        end
    end
    
    subgraph "Project Application Layer (專案應用層)"
        subgraph "專案核心服務"
            PCAS[Project Application Service<br/>專案應用服務]
            PCAC[CreateProject Command<br/>建立專案命令]
            PCAQ[GetProject Query<br/>查詢專案查詢]
            PCAH[Project Command Handler<br/>專案命令處理器]
        end
        
        subgraph "任務管理服務"
            PCTS[Task Management Service<br/>任務管理服務]
            PCTC[CreateTask Command<br/>建立任務命令]
            PCTU[UpdateTask Command<br/>更新任務命令]
        end
        
        subgraph "文件管理服務"
            PCDS[Document Management Service<br/>文件管理服務]
            PCDC[CreateDocument Command<br/>建立文件命令]
        end
        
        subgraph "成本控制服務"
            PCCS[Cost Control Service<br/>成本控制服務]
            PCCBC[CreateBudget Command<br/>建立預算命令]
            PCCUC[UpdateCost Command<br/>更新成本命令]
        end
        
        subgraph "報告服務"
            PCRS[Report Service<br/>報告服務]
            PCRDC[CreateDailyReport Command<br/>建立日報命令]
            PCRIC[CreateInspectionReport Command<br/>建立查驗報告命令]
            PCRAC[CreateAnalyticsReport Command<br/>建立分析報告命令]
        end
        
        subgraph "甘特圖服務"
            PCGS[Gantt Chart Service<br/>甘特圖服務]
            PCGDC[GenerateGanttData Command<br/>生成甘特圖資料命令]
            PCGQC[QueryGanttData Command<br/>查詢甘特圖資料命令]
        end
    end
    
    subgraph "Project Domain Layer (專案領域層)"
        subgraph "專案聚合根"
            PCDA[Project Aggregate<br/>專案聚合根]
            PCDE[ProjectCreated Event<br/>專案建立事件]
        end
        
        subgraph "專案實體"
            PCPE[Project Entity<br/>專案實體]
            PCME[Milestone Entity<br/>里程碑實體]
            PCTE[Task Entity<br/>任務實體]
            PCDE[Document Entity<br/>文件實體]
            PCCE[Cost Entity<br/>成本實體]
            PCRE[Report Entity<br/>報告實體]
        end
        
        subgraph "專案值物件"
            PCPV[ProjectInfo Value Object<br/>專案資訊值物件]
            PCMV[MilestoneInfo Value Object<br/>里程碑資訊值物件]
            PCTV[TaskInfo Value Object<br/>任務資訊值物件]
            PCDV[DocumentInfo Value Object<br/>文件資訊值物件]
            PCCV[CostInfo Value Object<br/>成本資訊值物件]
            PCRV[ReportInfo Value Object<br/>報告資訊值物件]
        end
        
        subgraph "專案領域服務"
            PCDS[Project Domain Service<br/>專案領域服務]
            PCMDS[Milestone Domain Service<br/>里程碑領域服務]
            PCTDS[Task Domain Service<br/>任務領域服務]
            PCCDS[Cost Domain Service<br/>成本領域服務]
        end
    end
    
    subgraph "Project Infrastructure Layer (專案基礎設施層)"
        subgraph "資料持久化"
            PCIR[Firestore Project Repository<br/>Firestore 專案儲存庫]
            PCITR[Firestore Task Repository<br/>Firestore 任務儲存庫]
            PCIDR[Firestore Document Repository<br/>Firestore 文件儲存庫]
            PCICR[Firestore Cost Repository<br/>Firestore 成本儲存庫]
        end
        
        subgraph "事件處理"
            PCIEH[Project Event Handler<br/>專案事件處理器]
            PCITEH[Task Event Handler<br/>任務事件處理器]
            PCIDEH[Document Event Handler<br/>文件事件處理器]
            PCICEH[Cost Event Handler<br/>成本事件處理器]
        end
        
        subgraph "外部服務"
            PCIWS[External Project Service<br/>外部專案服務]
            PCIIS[Project Infrastructure Service<br/>專案基礎設施服務]
            PCIFS[File Storage Service<br/>檔案儲存服務]
            PCINS[Project Notification Service<br/>專案通知服務]
            PCIA[Project Audit Service<br/>專案審計服務]
        end
        
        subgraph "整合服務"
            PCIOS[Organization Integration Service<br/>組織整合服務]
            PCIUS[User Integration Service<br/>用戶整合服務]
            PCITS[Team Integration Service<br/>團隊整合服務]
        end
    end
    
    %% 層級間連接 (實線 - Presentation → Application)
    PCPC --> PCAS
    PCLP --> PCAS
    PCPF --> PCAS
    PCLS --> PCAS
    PCDP --> PCAS
    
    PCTM --> PCTS
    PCTL --> PCTS
    PCTF --> PCTS
    PCTD --> PCTS
    
    PCDM --> PCDS
    PCDL --> PCDS
    PCDU --> PCDS
    PCDV --> PCDS
    
    PCCB --> PCCS
    PCCAC --> PCCS
    PCCF --> PCCS
    PCCV --> PCCS
    PCCBD --> PCCS
    
    PCDR --> PCRS
    PCIR --> PCRS
    PCAR --> PCRS
    PCGR --> PCGS
    
    %% 層級間連接 (實線 - Application → Domain)
    PCAS --> PCDA
    PCAS --> PCPE
    
    PCTS --> PCTE
    PCTS --> PCME
    
    PCDS --> PCDE
    PCDS --> PCDV
    
    PCCS --> PCCE
    PCCS --> PCCV
    
    PCRS --> PCRE
    PCRS --> PCRV
    
    PCGS --> PCTE
    PCGS --> PCME
    PCGS --> PCMV
    
    %% 層級間連接 (實線 - Domain → Infrastructure)
    PCDA --> PCIR
    PCPE --> PCIR
    
    PCTE --> PCITR
    PCME --> PCITR
    
    PCDE --> PCIDR
    
    PCCE --> PCICR
    
    PCRE --> PCIR
    
    %% 領域服務連接
    PCDS --> PCPE
    PCMDS --> PCME
    PCTDS --> PCTE
    PCCDS --> PCCE
    
    %% 事件處理連接
    PCIR --> PCIEH
    PCITR --> PCITEH
    PCIDR --> PCIDEH
    PCICR --> PCICEH
    
    %% 數據流向連接 (虛線 - 跨層數據聚合)
    %% 分析報告的數據來源
    PCAR -.-> PCTS
    PCAR -.-> PCCS
    PCAR -.-> PCDS
    PCAR -.-> PCIOS
    PCAR -.-> PCIUS
    PCAR -.-> PCITS
    
    %% 甘特圖的數據來源
    PCGR -.-> PCTS
    PCGR -.-> PCME
    PCGR -.-> PCIOS
    PCGR -.-> PCIUS
    PCGR -.-> PCITS
    
    %% 日報的數據來源
    PCDR -.-> PCTS
    PCDR -.-> PCCS
    PCDR -.-> PCIOS
    PCDR -.-> PCIUS
    
    %% 查驗報告的數據來源
    PCIR -.-> PCTS
    PCIR -.-> PCDS
    PCIR -.-> PCIOS
    PCIR -.-> PCIUS
    
    %% 整合服務連接 (虛線 - 跨模組整合)
    PCIOS -.-> PCAS
    PCIUS -.-> PCAS
    PCITS -.-> PCTS
    
    PCIOS -.-> PCIEH
    PCIUS -.-> PCIEH
    PCITS -.-> PCITEH

# 13. 社交模組架構圖 ✅

graph TB
    subgraph "Social Presentation Layer (社交展示層)"
        subgraph "追蹤功能元件"
            SCFL[Following List Component<br/>追蹤列表元件]
            SCFR[Followers List Component<br/>粉絲列表元件]
            SCFB[Follow Button Component<br/>追蹤按鈕元件]
            SCFS[Follow Status Component<br/>追蹤狀態元件]
        end
        
        subgraph "用戶發現元件"
            SCUD[User Discovery Component<br/>用戶發現元件]
            SCUR[User Recommendation Component<br/>用戶推薦元件]
            SCUS[User Search Component<br/>用戶搜尋元件]
            SCUP[User Profile Card Component<br/>用戶檔案卡片元件]
        end
        
        subgraph "社交統計元件"
            SCST[Social Stats Component<br/>社交統計元件]
            SCSC[Social Chart Component<br/>社交圖表元件]
            SCSL[Social Leaderboard Component<br/>社交排行榜元件]
        end
        
        subgraph "互動功能元件"
            SCIC[Interaction Component<br/>互動元件]
            SCMC[Mutual Connection Component<br/>共同連結元件]
            SCNC[Network Component<br/>網絡元件]
        end
        
        subgraph "社交狀態服務"
            SCSS[Social State Service<br/>社交狀態服務]
            SCRS[Relationship State Service<br/>關係狀態服務]
        end
    end
    
    subgraph "Social Application Layer (社交應用層)"
        subgraph "追蹤管理服務"
            SCFAS[Follow Application Service<br/>追蹤應用服務]
            SCFC[FollowUser Command<br/>追蹤用戶命令]
            SCUFC[UnfollowUser Command<br/>取消追蹤命令]
            SCFQ[GetFollowing Query<br/>查詢追蹤查詢]
            SCRQ[GetFollowers Query<br/>查詢粉絲查詢]
        end
        
        subgraph "推薦系統服務"
            SCRAS[Recommendation Application Service<br/>推薦應用服務]
            SCRUC[RecommendUsers Command<br/>推薦用戶命令]
            SCRQ[GetRecommendations Query<br/>查詢推薦查詢]
            SCRH[Recommendation Handler<br/>推薦處理器]
        end
        
        subgraph "搜尋服務"
            SCSAS[Search Application Service<br/>搜尋應用服務]
            SCSC[SearchUsers Command<br/>搜尋用戶命令]
            SCSQ[SearchUsers Query<br/>搜尋用戶查詢]
        end
        
        subgraph "統計分析服務"
            SCAAS[Analytics Application Service<br/>分析應用服務]
            SCGSC[GenerateSocialStats Command<br/>生成社交統計命令]
            SCSSC[SocialStats Query<br/>社交統計查詢]
        end
    end
    
    subgraph "Social Domain Layer (社交領域層)"
        subgraph "社交聚合根"
            SCSA[SocialRelation Aggregate<br/>社交關係聚合根]
            SCFE[UserFollowed Event<br/>用戶被追蹤事件]
            SCUE[UserUnfollowed Event<br/>用戶取消追蹤事件]
        end
        
        subgraph "社交實體"
            SCRE[Relationship Entity<br/>關係實體]
            SCNE[Network Entity<br/>網絡實體]
            SCME[Mutual Entity<br/>共同關係實體]
        end
        
        subgraph "社交值物件"
            SCRV[RelationshipInfo Value Object<br/>關係資訊值物件]
            SCNV[NetworkInfo Value Object<br/>網絡資訊值物件]
            SCSV[SocialStats Value Object<br/>社交統計值物件]
        end
        
        subgraph "社交領域服務"
            SCRDS[Relationship Domain Service<br/>關係領域服務]
            SCNDS[Network Domain Service<br/>網絡領域服務]
            SCRECS[Recommendation Domain Service<br/>推薦領域服務]
            SCPDS[Privacy Domain Service<br/>隱私領域服務]
        end
    end
    
    subgraph "Social Infrastructure Layer (社交基礎設施層)"
        subgraph "資料持久化"
            SCIR[Firestore Social Repository<br/>Firestore社交儲存庫]
            SCIRR[Firestore Relationship Repository<br/>Firestore關係儲存庫]
            SCINR[Firestore Network Repository<br/>Firestore網絡儲存庫]
        end
        
        subgraph "推薦引擎"
            SCRE[Recommendation Engine<br/>推薦引擎]
            SCMLS[ML Service Integration<br/>機器學習服務整合]
            SCGA[Graph Analytics Service<br/>圖形分析服務]
        end
        
        subgraph "事件處理"
            SCFEH[Follow Event Handler<br/>追蹤事件處理器]
            SCREH[Recommendation Event Handler<br/>推薦事件處理器]
            SCSEH[Social Stats Event Handler<br/>社交統計事件處理器]
        end
        
        subgraph "外部服務"
            SCIS[Social Infrastructure Service<br/>社交基礎設施服務]
            SCCS[Cache Service<br/>快取服務]
            SCQS[Queue Service<br/>佇列服務]
        end
        
        subgraph "整合服務"
            SCIUS[User Integration Service<br/>用戶整合服務]
            SCIOS[Organization Integration Service<br/>組織整合服務]
            SCIPS[Project Integration Service<br/>專案整合服務]
        end
    end

# 14. 社交模組用例圖 ✅

graph TB
    subgraph "外部參與者"
        User[用戶]
        Admin[管理員]
        MLSystem[機器學習系統]
        AnalyticsSystem[分析系統]
    end
    
    subgraph "社交模組功能"
        subgraph "追蹤管理"
            UC1[追蹤用戶]
            UC2[取消追蹤]
            UC3[查看追蹤列表]
            UC4[查看粉絲列表]
            UC5[批量追蹤]
            UC6[追蹤狀態管理]
        end
        
        subgraph "用戶發現"
            UC7[搜尋用戶]
            UC8[推薦用戶]
            UC9[瀏覽用戶檔案]
            UC10[附近用戶]
            UC11[熱門用戶]
            UC12[專業用戶推薦]
        end
        
        subgraph "社交網絡"
            UC13[查看社交網絡]
            UC14[共同好友]
            UC15[連結度分析]
            UC16[影響力分析]
            UC17[社群偵測]
        end
        
        subgraph "隱私控制"
            UC18[隱私設定]
            UC19[封鎖用戶]
            UC20[舉報用戶]
            UC21[隱藏動態]
            UC22[限制追蹤]
        end
        
        subgraph "統計分析"
            UC23[社交統計]
            UC24[互動分析]
            UC25[成長趨勢]
            UC26[參與度分析]
        end
    end

# 15. 成就模組架構圖 ✅

graph TB
    subgraph "Achievement Presentation Layer (成就展示層)"
        subgraph "成就展示元件"
            ACAC[Achievement Card Component<br/>成就卡片元件]
            ACAL[Achievement List Component<br/>成就列表元件]
            ACAB[Achievement Badge Component<br/>成就徽章元件]
            ACAP[Achievement Progress Component<br/>成就進度元件]
        end
        
        subgraph "排行榜元件"
            ACLB[Leaderboard Component<br/>排行榜元件]
            ACRC[Ranking Card Component<br/>排名卡片元件]
            ACTS[Top Stats Component<br/>頂級統計元件]
        end
        
        subgraph "成就管理元件"
            ACAM[Achievement Management Component<br/>成就管理元件]
            ACRM[Rule Management Component<br/>規則管理元件]
            ACCM[Category Management Component<br/>分類管理元件]
        end
        
        subgraph "統計圖表元件"
            ACSC[Stats Chart Component<br/>統計圖表元件]
            ACPC[Progress Chart Component<br/>進度圖表元件]
            ACAT[Achievement Timeline Component<br/>成就時間軸元件]
        end
        
        subgraph "成就狀態服務"
            ACSS[Achievement State Service<br/>成就狀態服務]
            ACPS[Progress State Service<br/>進度狀態服務]
        end
    end
    
    subgraph "Achievement Application Layer (成就應用層)"
        subgraph "成就核心服務"
            ACAAS[Achievement Application Service<br/>成就應用服務]
            ACAWC[AwardAchievement Command<br/>頒發成就命令]
            ACUPC[UpdateProgress Command<br/>更新進度命令]
            ACGAQ[GetAchievements Query<br/>查詢成就查詢]
        end
        
        subgraph "規則引擎服務"
            ACRES[Rule Engine Service<br/>規則引擎服務]
            ACERC[EvaluateRule Command<br/>評估規則命令]
            ACCRC[CreateRule Command<br/>建立規則命令]
            ACREH[Rule Event Handler<br/>規則事件處理器]
        end
        
        subgraph "統計分析服務"
            ACSAS[Statistics Application Service<br/>統計應用服務]
            ACGSC[GenerateStats Command<br/>生成統計命令]
            ACLBQ[GetLeaderboard Query<br/>查詢排行榜查詢]
        end
        
        subgraph "通知整合服務"
            ACNAS[Notification Application Service<br/>通知應用服務]
            ACNAC[NotifyAchievement Command<br/>成就通知命令]
        end
    end
    
    subgraph "Achievement Domain Layer (成就領域層)"
        subgraph "成就聚合根"
            ACAA[Achievement Aggregate<br/>成就聚合根]
            ACAWE[AchievementAwarded Event<br/>成就頒發事件]
            ACPE[ProgressUpdated Event<br/>進度更新事件]
        end
        
        subgraph "成就實體"
            ACAE[Achievement Entity<br/>成就實體]
            ACRULE[Rule Entity<br/>規則實體]
            ACCAT[Category Entity<br/>分類實體]
            ACPROG[Progress Entity<br/>進度實體]
            ACLEAD[Leaderboard Entity<br/>排行榜實體]
        end
        
        subgraph "成就值物件"
            ACAV[AchievementInfo Value Object<br/>成就資訊值物件]
            ACRV[RuleInfo Value Object<br/>規則資訊值物件]
            ACCV[Criteria Value Object<br/>條件值物件]
            ACPV[Progress Value Object<br/>進度值物件]
        end
        
        subgraph "成就領域服務"
            ACADS[Achievement Domain Service<br/>成就領域服務]
            ACRDS[Rule Domain Service<br/>規則領域服務]
            ACPDS[Progress Domain Service<br/>進度領域服務]
            ACSDS[Statistics Domain Service<br/>統計領域服務]
        end
    end
    
    subgraph "Achievement Infrastructure Layer (成就基礎設施層)"
        subgraph "資料持久化"
            ACIR[Firestore Achievement Repository<br/>Firestore成就儲存庫]
            ACRR[Firestore Rule Repository<br/>Firestore規則儲存庫]
            ACPR[Firestore Progress Repository<br/>Firestore進度儲存庫]
            ACLR[Firestore Leaderboard Repository<br/>Firestore排行榜儲存庫]
        end
        
        subgraph "規則引擎"
            ACRE[Rule Engine<br/>規則引擎]
            ACCEP[Complex Event Processor<br/>複雜事件處理器]
            ACSP[Scoring Processor<br/>計分處理器]
        end
        
        subgraph "事件處理"
            ACAEH[Achievement Event Handler<br/>成就事件處理器]
            ACREH[Rule Event Handler<br/>規則事件處理器]
            ACPEH[Progress Event Handler<br/>進度事件處理器]
        end
        
        subgraph "外部服務"
            ACIS[Achievement Infrastructure Service<br/>成就基礎設施服務]
            ACCS[Cache Service<br/>快取服務]
            ACBS[Batch Service<br/>批次服務]
        end
        
        subgraph "整合服務"
            ACIUS[User Integration Service<br/>用戶整合服務]
            ACIOS[Organization Integration Service<br/>組織整合服務]
            ACIPS[Project Integration Service<br/>專案整合服務]
            ACINS[Notification Integration Service<br/>通知整合服務]
        end
    end

# 16. 成就模組用例圖 ✅

graph TB
    subgraph "外部參與者"
        User[用戶]
        Admin[管理員]
        System[系統]
        RuleEngine[規則引擎]
    end
    
    subgraph "成就模組功能"
        subgraph "成就管理"
            UC1[獲得成就]
            UC2[查看成就]
            UC3[成就進度追蹤]
            UC4[成就分享]
            UC5[成就驗證]
            UC6[成就撤銷]
        end
        
        subgraph "規則系統"
            UC7[定義成就規則]
            UC8[規則條件設定]
            UC9[自動觸發檢測]
            UC10[手動觸發成就]
            UC11[規則優先級管理]
            UC12[規則測試]
        end
        
        subgraph "分類系統"
            UC13[成就分類管理]
            UC14[等級系統設定]
            UC15[難度分級]
            UC16[季節性成就]
            UC17[限時成就]
        end
        
        subgraph "統計排行"
            UC18[排行榜查看]
            UC19[統計分析]
            UC20[成就統計]
            UC21[用戶排名]
            UC22[成就趨勢]
            UC23[競賽管理]
        end
        
        subgraph "社交功能"
            UC24[成就展示]
            UC25[成就比較]
            UC26[成就挑戰]
            UC27[成就贈送]
            UC28[成就點讚]
        end
    end

# 17. 通知模組架構圖 ✅

graph TB
    subgraph "Notification Presentation Layer (通知展示層)"
        subgraph "通知展示元件"
            NONC[Notification Center Component<br/>通知中心元件]
            NONL[Notification List Component<br/>通知列表元件]
            NONI[Notification Item Component<br/>通知項目元件]
            NONB[Notification Badge Component<br/>通知徽章元件]
        end
        
        subgraph "通知設定元件"
            NONS[Notification Settings Component<br/>通知設定元件]
            NONP[Notification Preferences Component<br/>通知偏好元件]
            NONT[Notification Templates Component<br/>通知模板元件]
        end
        
        subgraph "推送元件"
            NOPC[Push Component<br/>推送元件]
            NOEN[Email Notification Component<br/>郵件通知元件]
            NOSN[SMS Notification Component<br/>簡訊通知元件]
            NOIN[In-App Notification Component<br/>應用內通知元件]
        end
        
        subgraph "通知狀態服務"
            NOSS[Notification State Service<br/>通知狀態服務]
            NOPS[Preference State Service<br/>偏好狀態服務]
        end
    end
    
    subgraph "Notification Application Layer (通知應用層)"
        subgraph "通知核心服務"
            NONAS[Notification Application Service<br/>通知應用服務]
            NONCC[CreateNotification Command<br/>建立通知命令]
            NOMRC[MarkAsRead Command<br/>標記已讀命令]
            NOGNQ[GetNotifications Query<br/>查詢通知查詢]
        end
        
        subgraph "推送服務"
            NOPAS[Push Application Service<br/>推送應用服務]
            NOSPC[SendPush Command<br/>發送推送命令]
            NOSEC[SendEmail Command<br/>發送郵件命令]
            NOSSC[SendSMS Command<br/>發送簡訊命令]
        end
        
        subgraph "模板服務"
            NOTAS[Template Application Service<br/>模板應用服務]
            NOCTC[CreateTemplate Command<br/>建立模板命令]
            NORTC[RenderTemplate Command<br/>渲染模板命令]
        end
        
        subgraph "偏好管理服務"
            NOPRAS[Preference Application Service<br/>偏好應用服務]
            NOUPC[UpdatePreferences Command<br/>更新偏好命令]
            NOGPQ[GetPreferences Query<br/>查詢偏好查詢]
        end
        
        subgraph "批次處理服務"
            NOBAS[Batch Application Service<br/>批次應用服務]
            NOBPC[BatchProcess Command<br/>批次處理命令]
            NOSC[Schedule Command<br/>排程命令]
        end
    end
    
    subgraph "Notification Domain Layer (通知領域層)"
        subgraph "通知聚合根"
            NONA[Notification Aggregate<br/>通知聚合根]
            NONCE[NotificationCreated Event<br/>通知建立事件]
            NORE[NotificationRead Event<br/>通知已讀事件]
            NOSE[NotificationSent Event<br/>通知發送事件]
        end
        
        subgraph "通知實體"
            NONE[Notification Entity<br/>通知實體]
            NOTE[Template Entity<br/>模板實體]
            NOPE[Preference Entity<br/>偏好實體]
            NOCHE[Channel Entity<br/>通道實體]
            NOQUE[Queue Entity<br/>佇列實體]
        end
        
        subgraph "通知值物件"
            NONV[NotificationInfo Value Object<br/>通知資訊值物件]
            NOTV[TemplateInfo Value Object<br/>模板資訊值物件]
            NOPV[PreferenceInfo Value Object<br/>偏好資訊值物件]
            NOCHV[ChannelInfo Value Object<br/>通道資訊值物件]
        end
        
        subgraph "通知領域服務"
            NODS[Notification Domain Service<br/>通知領域服務]
            NOTDS[Template Domain Service<br/>模板領域服務]
            NOPDS[Preference Domain Service<br/>偏好領域服務]
            NORDS[Routing Domain Service<br/>路由領域服務]
        end
    end
    
    subgraph "Notification Infrastructure Layer (通知基礎設施層)"
        subgraph "資料持久化"
            NOIR[Firestore Notification Repository<br/>Firestore通知儲存庫]
            NOTR[Firestore Template Repository<br/>Firestore模板儲存庫]
            NOPR[Firestore Preference Repository<br/>Firestore偏好儲存庫]
        end
        
        subgraph "推送服務整合"
            NOFCM[Firebase Cloud Messaging<br/>Firebase雲端訊息]
            NOSES[SendGrid Email Service<br/>SendGrid郵件服務]
            NOTWS[Twilio SMS Service<br/>Twilio簡訊服務]
            NOAPN[Apple Push Notification<br/>Apple推送通知]
        end
        
        subgraph "事件處理"
            NONEH[Notification Event Handler<br/>通知事件處理器]
            NOTEH[Template Event Handler<br/>模板事件處理器]
            NOPEH[Preference Event Handler<br/>偏好事件處理器]
        end
        
        subgraph "佇列與排程"
            NOQS[Queue Service<br/>佇列服務]
            NOSS[Scheduler Service<br/>排程服務]
            NOWS[Worker Service<br/>工作服務]
            NORS[Retry Service<br/>重試服務]
        end
        
        subgraph "監控與分析"
            NOMS[Monitoring Service<br/>監控服務]
            NOAS[Analytics Service<br/>分析服務]
            NOLS[Logging Service<br/>日誌服務]
        end
        
        subgraph "整合服務"
            NOIUS[User Integration Service<br/>用戶整合服務]
            NOIOS[Organization Integration Service<br/>組織整合服務]
            NOIPS[Project Integration Service<br/>專案整合服務]
            NOIAS[Achievement Integration Service<br/>成就整合服務]
        end
    end

# 18. 通知模組用例圖 ✅

graph TB
    subgraph "外部參與者"
        User[用戶]
        Admin[管理員]
        System[系統]
        ExternalService[外部服務]
    end
    
    subgraph "通知模組功能"
        subgraph "通知管理"
            UC1[接收通知]
            UC2[查看通知]
            UC3[標記已讀]
            UC4[刪除通知]
            UC5[通知搜尋]
            UC6[通知分類]
        end
        
        subgraph "推送服務"
            UC7[應用內推送]
            UC8[郵件推送]
            UC9[簡訊推送]
            UC10[瀏覽器推送]
            UC11[批次推送]
            UC12[定時推送]
        end
        
        subgraph "偏好設定"
            UC13[通知偏好設定]
            UC14[通道偏好]
            UC15[頻率控制]
            UC16[免打擾時間]
            UC17[分類訂閱]
            UC18[緊急通知設定]
        end
        
        subgraph "模板管理"
            UC19[建立通知模板]
            UC20[編輯模板]
            UC21[模板預覽]
            UC22[多語言模板]
            UC23[動態內容]
            UC24[模板版本控制]
        end
        
        subgraph "統計分析"
            UC25[發送統計]
            UC26[開啟率分析]
            UC27[點擊率分析]
            UC28[用戶參與度]
            UC29[通知效果分析]
            UC30[A/B測試]
        end
    end

# 19. 模組間整合事件流圖 ✅

sequenceDiagram
    participant User as 用戶
    participant Social as Social Module
    participant Achievement as Achievement Module
    participant Notification as Notification Module
    participant UserModule as User Module
    participant ProjectModule as Project Module

    User->>Social: 追蹤新用戶
    Social->>Social: 建立追蹤關係
    Social->>Achievement: 發送 UserFollowed 事件
    Social->>Notification: 發送 UserFollowed 事件
    
    Achievement->>Achievement: 檢查成就規則
    Achievement->>Achievement: 觸發「社交達人」成就
    Achievement->>Notification: 發送 AchievementAwarded 事件
    Achievement->>Social: 發送 AchievementAwarded 事件
    
    Notification->>Notification: 建立成就通知
    Notification->>Notification: 建立追蹤通知
    Notification->>User: 推送通知
    
    Social->>Social: 更新社交統計
    
    ProjectModule->>Achievement: 專案完成事件
    Achievement->>Achievement: 檢查專案成就
    Achievement->>Notification: 發送專案成就通知

# 20. 模組功能特性總結 ✅

## 社交模組功能特性
包含：
- 追蹤管理: 追蹤、取消追蹤、追蹤列表、粉絲列表
- 用戶發現: 搜尋、推薦、瀏覽、附近用戶、熱門用戶
- 社交網絡: 社交圖譜、共同好友、連結度分析、影響力分析
- 隱私控制: 隱私設定、封鎖、舉報、限制追蹤
- 統計分析: 社交統計、互動分析、成長趨勢、參與度分析

## 成就模組功能特性
包含：
- 成就管理: 獲得、查看、進度追蹤、分享、驗證、撤銷
- 規則系統: 規則定義、條件設定、自動觸發、手動觸發、優先級管理
- 分類系統: 分類管理、等級系統、難度分級、季節性成就、限時成就
- 統計排行: 排行榜、統計分析、用戶排名、成就趨勢、競賽管理
- 社交功能: 成就展示、比較、挑戰、贈送、點讚

## 通知模組功能特性
包含：
- 通知管理: 接收、查看、標記已讀、刪除、搜尋、分類
- 推送服務: 應用內、郵件、簡訊、瀏覽器、批次、定時推送
- 偏好設定: 通知偏好、通道偏好、頻率控制、免打擾、分類訂閱
- 模板管理: 建立模板、編輯、預覽、多語言、動態內容、版本控制
- 統計分析: 發送統計、開啟率、點擊率、參與度、效果分析、A/B測試

## Architecture Overview (架構總覽)

### System Architecture Summary (系統架構摘要)
┌─────────────────────────────────────────────────────────────────┐
│ SYSTEM OVERVIEW │
├─────────────────────────────────────────────────────────────────┤
│ Core Modules (強依賴) │
│ ┌─────────┐ ┌──────────────┐ ┌─────────┐ │
│ │ USER │◄──►│ ORGANIZATION │◄──►│ PROJECT │ │
│ │ Module │ │ Module │ │ Module │ │
│ └─────────┘ └──────────────┘ └─────────┘ │
│ │
│ Cross-Cutting Modules (事件驅動) │
│ ┌─────────┐ ┌─────────────┐ ┌──────────────┐ │
│ │ SOCIAL │ │ ACHIEVEMENT │ │ NOTIFICATION │ │
│ │ Module │ │ Module │ │ Module │ │
│ └─────────┘ └─────────────┘ └──────────────┘ │
│ │
│ Integration Stack (技術整合) │
│ Firebase Auth → @delon/auth → @delon/acl │
│ Firestore → Event Bus → External Services │
└─────────────────────────────────────────────────────────────────┘

### Module Interaction Matrix (模組互動矩陣)
User Org Proj Social Achv Notif
User Module ● ✓ ✓ ○ ○ ○
Organization ✓ ● ✓ ○ ○ ○
Project ✓ ✓ ● ○ ○ ○
Social ✓ ✓ ✓ ● ✓ ✓
Achievement ✓ ✓ ✓ ✓ ● ✓
Notification ✓ ✓ ✓ ✓ ✓ ●
Legend: ● = Self ✓ = Strong Dependency ○ = Event Integration

### Technology Stack Integration (技術棧整合)
┌─────────────────────────────────────────────────────────────────┐
│ TECHNOLOGY STACK │
├─────────────────────────────────────────────────────────────────┤
│ Frontend Framework │
│ Angular 20 + Standalone Components + Signals │
│ │
│ UI Framework │
│ ng-alain + ng-zorro-antd + @delon/* │
│ │
│ Authentication & Authorization │
│ Firebase Auth → @delon/auth → @delon/acl │
│ │
│ Database & Storage │
│ Firestore + Firebase Storage + Cloud Functions │
│ │
│ Architecture Pattern │
│ DDD + CQRS + Event-Driven + Clean Architecture │
└─────────────────────────────────────────────────────────────────┘

### Development Roadmap (開發路線圖)
┌─────────────────────────────────────────────────────────────────┐
│ DEVELOPMENT PHASES │
├─────────────────────────────────────────────────────────────────┤
│ Phase 1: Foundation (3-4 months) │
│ ├── User Module (Core Auth + Profile) │
│ ├── Organization Module (Basic Management) │
│ ├── Authentication Stack Integration │
│ └── Basic Event Infrastructure │
│ │
│ Phase 2: Core Business (2-3 months) │
│ ├── Project Module (Full Implementation) │
│ ├── Advanced Organization Features │
│ ├── User-Organization-Project Integration │
│ └── Core Business Logic Testing │
│ │
│ Phase 3: Social Features (2-3 months) │
│ ├── Social Module (Following/Recommendations) │
│ ├── Notification Module (Multi-channel) │
│ ├── Achievement Module (Rules Engine) │
│ └── Cross-Module Event Integration │
│ │
│ Phase 4: Advanced Features (1-2 months) │
│ ├── Advanced Analytics │
│ ├── Performance Optimization │
│ ├── Security Hardening │
│ └── Production Deployment │
└─────────────────────────────────────────────────────────────────┘

### Key Success Metrics (關鍵成功指標)
- **Technical Debt**: < 10% (維持低技術債務)
- **Test Coverage**: > 80% (高測試覆蓋率)
- **Performance**: < 2s 首次載入時間
- **Scalability**: 支援 10,000+ 並發用戶
- **Security**: OWASP Top 10 合規
- **Maintainability**: 模組化設計，易於擴展

### Risk Mitigation (風險緩解)
1. **複雜度管理**: 分階段開發，漸進式交付
2. **技術風險**: 使用成熟技術棧，避免實驗性技術
3. **團隊協作**: 清晰的模組邊界，減少開發衝突
4. **效能風險**: 早期效能測試，持續優化
5. **安全風險**: 多層防護，定期安全審計

## MVP 落地實作指南（Phase 1 可交付）

### 1) 環境與基礎建置
- **Angular 20**：Standalone + Signals，ESBuild/Vite 預設建置
- **套件**：`@angular/fire`、`firebase`、`@delon/auth`、`@delon/acl`、`ng-alain`/`@delon/abc`
- **設定**：
  - 在 `environment.ts` 放置 Firebase 專案參數
  - 初始化 `provideFirebaseApp`、`provideAuth`、`provideFirestore`、`provideStorage`、`provideMessaging`
  - 啟用 `HttpInterceptor`（token 注入與錯誤處理）

#### Phase 1 依賴套件（最小必要）

- 運行時依賴
  - `@angular/core`
  - `@angular/common`
  - `@angular/router`
  - `@angular/forms`
  - `@angular/platform-browser`
  - `@angular/animations`
  - `@angular/cdk`
  - `@angular/fire`
  - `firebase`
  - `ng-zorro-antd`
  - `ng-alain`
  - `@delon/abc`
  - `@delon/theme`
  - `@delon/util`
  - `@delon/auth`
  - `@delon/acl`
  - `rxjs`
  - `zone.js`
  - `tslib`

- 開發依賴（建置必需）
  - `@angular/cli`
  - `@angular/build`
  - `@angular/compiler-cli`
  - `typescript`

### 2) 認證與授權（對應 #9）
- **登入流程**：AngularFire Auth 登入 → 取得 ID Token → `@delon/auth` 儲存 Token（localStorage）
- **ACL 初始化**：登入後根據「Account 檔案 + 當前 `organizationId`」建立 `@delon/acl` 角色與權限樹
- **路由守衛**：受保護路由使用 `ACLGuard`；元件層以 `*appAcl` 控制按鈕/區塊顯示
- **Account 切換**（對應 #10）：切換時重建 ACL 映射（角色/權限依當前組織）

### 3) Firestore 結構與規則基線（對應 技術整合層/資料持久化架構）✨ 統一 Account 設計
- 先落地集合：`/accounts`（統一用戶與組織）、`/projects`（含 `/tasks`、`/documents`、`/costs`）
- 重要欄位：
  - `/accounts` 文件必含 `accountId`、`accountType`、`profile`、`permissions`
  - `/projects` 文件必含 `ownerId`（指向 accountId）、`projectId`
- 規則（摘錄示意）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    
    // 統一 Account 權限檢查函式
    function hasAccountAccess(accountId, requiredRoles) {
      return isSignedIn() && 
             accountId in request.auth.token.accountRoles &&
             count([r in requiredRoles where r in request.auth.token.accountRoles[accountId]]) > 0;
    }
    
    // 檢查是否為帳戶擁有者或管理員
    function isAccountOwnerOrAdmin(accountId) {
      return isSignedIn() && (
        request.auth.uid == accountId || // 用戶本人
        hasAccountAccess(accountId, ['owner', 'admin']) // 組織管理員
      );
    }

    // 統一 Accounts 集合（包含 users 和 organizations）
    match /accounts/{accountId} {
      allow read: if isSignedIn();
      allow write: if isAccountOwnerOrAdmin(accountId);
      
      // 組織成員子集合
      match /members/{memberId} {
        allow read: if isSignedIn();
        allow write: if hasAccountAccess(accountId, ['owner', 'admin']);
      }
      
      // 組織團隊子集合
      match /teams/{teamId} {
        allow read: if isSignedIn();
        allow write: if hasAccountAccess(accountId, ['owner', 'admin']);
      }
    }

    // 專案集合（ownerId 指向 accountId）
    match /projects/{projectId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && (
        hasAccountAccess(resource.data.ownerId, ['owner', 'admin']) ||
        (projectId in request.auth.token.projectRoles &&
         'manager' in request.auth.token.projectRoles[projectId])
      );
    }
  }
}
```

### 4) 事件匯流排與規則引擎 MVP（對應 #19 與各模組事件）✨ 統一 Account 事件
- **最小落地**：Cloud Functions 事件觸發
  - Firestore Triggers：`accounts.onCreate`（accountType 區分處理）、`projects.onCreate` 等
  - 事件處理：根據 accountType 建立歡迎通知、預設設定、審計紀錄
- **規則引擎（成就/通知）**：以 Functions 觸發器 + 規則表（Firestore 集合）先行；後續再擴充 CEP/批次

### 5) 通知 MVP（對應 通知模組）
- **In-App**：`/notifications` 集合（狀態：unread/read，類型：achievement/follow/...）
- **Email**：SendGrid（Functions HTTP/觸發）
- **Web Push**：FCM（Service Worker + 使用者授權 + Token 維護）

### 6) 報表/甘特圖資料策略（對應 #12 的虛線聚合）
- **預先彙總**：以 Functions 產彙總文件（例：每日/每專案統計），前端直接查詢
- **即時視圖**：小型列表直接以 Firestore 查詢 + 客端過濾；大型報表改用彙總文件
- **甘特圖資料**：將任務/里程碑轉換為適配前端的扁平結構（含依賴/時間窗）

### 7) Phase 1 DoD（Definition of Done）
- Account 登入/登出/重設密碼，可見 Account 檔案
- 組織建立/查看/切換，路由/按鈕受 ACL 控制
- 專案建立/任務建立（最小字段），文件可上傳與列表
- 基本事件：Account/專案建立 → 產生 In-App 通知
- 規則：基線 Firestore Security Rules 覆蓋核心集合的 CRUD 權限
- 最少 1 份分析或日報以「彙總文件」方式呈現

### 8) 技術棧對照（落地映射）
- **@angular/fire**：Auth（Email/Password）、Firestore（集合/即時/離線）、Storage、Messaging（FCM）
- **@delon/auth**：Token 儲存/刷新、HTTP 攔截、認證狀態
- **@delon/acl**：路由守衛、指令/管道、動態權限更新、組織上下文切換
- **ng-alain / @delon/abc**：清單/表單/卡片/圖表等 UI 組件與樣板

---

**總結**: 這是一個基於 Angular 20 + Firebase + ng-alain 的企業級建築工程管理平台，採用 DDD 架構設計，支援用戶管理、組織管理、專案管理、社交功能、成就系統和通知系統。預估開發週期 8-12 個月，適合中大型開發團隊實施。

