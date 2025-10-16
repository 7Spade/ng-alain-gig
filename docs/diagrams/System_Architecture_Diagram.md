# 系統架構圖

## 概述

本文件提供 ng-alain 企業級建築工程管理平台的完整系統架構圖，包括前端、後端、資料庫和外部服務的整合架構。

## 系統架構總覽

### 1. 整體架構圖

```mermaid
graph TB
    subgraph "前端層 (Frontend Layer)"
        subgraph "Angular 20 應用"
            A[Angular 20 App]
            B[Standalone Components]
            C[Signals State Management]
            D[Modern Control Flow]
            E[Typed Forms]
        end
        
        subgraph "UI 框架"
            F[ng-zorro-antd]
            G[@delon/abc]
            H[@delon/theme]
            I[@delon/util]
        end
        
        subgraph "認證與權限"
            J[@delon/auth]
            K[@delon/acl]
            L[Firebase Auth]
        end
        
        subgraph "狀態管理"
            M[RxJS Observables]
            N[Signal-based State]
            O[Local Storage]
        end
    end
    
    subgraph "API 層 (API Layer)"
        P[REST API]
        Q[GraphQL API]
        R[WebSocket API]
        S[File Upload API]
    end
    
    subgraph "後端層 (Backend Layer)"
        subgraph "Firebase 服務"
            T[Firebase Auth]
            U[Cloud Firestore]
            V[Cloud Storage]
            W[Cloud Functions]
            X[Cloud Messaging]
        end
        
        subgraph "業務邏輯"
            Y[User Service]
            Z[Project Service]
            AA[Organization Service]
            BB[Notification Service]
        end
    end
    
    subgraph "資料層 (Data Layer)"
        CC[Firestore Database]
        DD[Cloud Storage]
        EE[Cache Layer]
        FF[Search Index]
    end
    
    subgraph "外部服務 (External Services)"
        GG[SendGrid Email]
        HH[Twilio SMS]
        II[Google Maps]
        JJ[Payment Gateway]
    end
    
    subgraph "監控與日誌 (Monitoring & Logging)"
        KK[Firebase Analytics]
        LL[Error Tracking]
        MM[Performance Monitoring]
        NN[Audit Logs]
    end
    
    %% 連接關係
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
    A --> K
    A --> L
    
    B --> C
    B --> D
    B --> E
    
    J --> L
    K --> J
    
    M --> N
    N --> O
    
    A --> P
    A --> Q
    A --> R
    A --> S
    
    P --> T
    Q --> U
    R --> W
    S --> V
    
    T --> Y
    U --> Z
    V --> AA
    W --> BB
    X --> BB
    
    Y --> CC
    Z --> CC
    AA --> CC
    BB --> CC
    
    CC --> DD
    CC --> EE
    CC --> FF
    
    BB --> GG
    BB --> HH
    A --> II
    A --> JJ
    
    A --> KK
    W --> LL
    A --> MM
    W --> NN
```

### 2. 模組架構圖

```mermaid
graph TB
    subgraph "核心模組 (Core Modules)"
        A[Account Module]
        B[User Module]
        C[Organization Module]
        D[Project Module]
    end
    
    subgraph "橫切模組 (Cross-Cutting Modules)"
        E[Social Module]
        F[Achievement Module]
        G[Notification Module]
        H[Audit Module]
    end
    
    subgraph "共享模組 (Shared Modules)"
        I[Auth Service]
        J[ACL Service]
        K[API Service]
        L[Cache Service]
        M[Util Service]
    end
    
    subgraph "基礎設施模組 (Infrastructure Modules)"
        N[Firebase Service]
        O[Storage Service]
        P[Messaging Service]
        Q[Analytics Service]
    end
    
    %% 模組依賴關係
    B --> A
    C --> A
    D --> A
    D --> B
    D --> C
    
    E --> B
    E --> C
    E --> D
    
    F --> B
    F --> C
    F --> D
    F --> E
    
    G --> B
    G --> C
    G --> D
    G --> E
    G --> F
    
    H --> A
    H --> B
    H --> C
    H --> D
    
    I --> N
    J --> I
    K --> N
    L --> N
    M --> N
    
    N --> O
    N --> P
    N --> Q
```

### 3. 資料流架構圖

```mermaid
graph LR
    subgraph "用戶介面 (User Interface)"
        A[Angular Components]
        B[ng-zorro-antd UI]
        C[Forms & Validation]
    end
    
    subgraph "狀態管理 (State Management)"
        D[Signals]
        E[RxJS Observables]
        F[Local State]
    end
    
    subgraph "服務層 (Service Layer)"
        G[User Service]
        H[Project Service]
        I[Organization Service]
        J[Notification Service]
    end
    
    subgraph "API 層 (API Layer)"
        K[HTTP Client]
        L[WebSocket Client]
        M[File Upload]
    end
    
    subgraph "Firebase 後端 (Firebase Backend)"
        N[Firebase Auth]
        O[Cloud Firestore]
        P[Cloud Storage]
        Q[Cloud Functions]
        R[Cloud Messaging]
    end
    
    subgraph "外部服務 (External Services)"
        S[Email Service]
        T[SMS Service]
        U[Maps Service]
        V[Payment Service]
    end
    
    %% 資料流向
    A --> D
    B --> D
    C --> D
    
    D --> E
    E --> F
    
    F --> G
    F --> H
    F --> I
    F --> J
    
    G --> K
    H --> K
    I --> K
    J --> L
    
    K --> N
    K --> O
    L --> Q
    M --> P
    
    N --> O
    O --> P
    Q --> R
    
    Q --> S
    Q --> T
    A --> U
    A --> V
```

### 4. 認證與授權架構圖

```mermaid
sequenceDiagram
    participant U as 用戶
    participant UI as Angular UI
    participant FA as Firebase Auth
    participant DA as @delon/auth
    participant ACL as @delon/acl
    participant FS as Firestore
    participant API as API Service
    
    U->>UI: 登入請求
    UI->>FA: signInWithEmailAndPassword()
    FA-->>UI: Firebase User + ID Token
    
    UI->>DA: login(credentials)
    DA->>DA: 儲存 token 到 localStorage
    DA->>ACL: setUser(userProfile)
    
    ACL->>FS: 查詢用戶權限
    FS-->>ACL: 返回權限資料
    ACL->>ACL: 建立權限樹
    
    DA-->>UI: 登入成功
    UI->>API: 發送 API 請求
    API->>DA: 獲取 token
    DA-->>API: 返回 token
    API->>API: 添加 Authorization 標頭
    API->>FS: 發送請求
    FS-->>API: 返回資料
    API-->>UI: 返回結果
    UI-->>U: 顯示資料
```

### 5. 專案管理模組架構圖

```mermaid
graph TB
    subgraph "專案管理模組 (Project Management Module)"
        subgraph "展示層 (Presentation Layer)"
            A[Project List Component]
            B[Project Detail Component]
            C[Project Form Component]
            D[Task Management Component]
            E[Document Management Component]
            F[Cost Control Component]
        end
        
        subgraph "應用層 (Application Layer)"
            G[Project Application Service]
            H[Task Application Service]
            I[Document Application Service]
            J[Cost Application Service]
        end
        
        subgraph "領域層 (Domain Layer)"
            K[Project Aggregate]
            L[Task Entity]
            M[Document Entity]
            N[Cost Entity]
            O[Project Domain Service]
        end
        
        subgraph "基礎設施層 (Infrastructure Layer)"
            P[Firestore Project Repository]
            Q[Firestore Task Repository]
            R[Firestore Document Repository]
            S[Firestore Cost Repository]
            T[File Storage Service]
        end
    end
    
    subgraph "外部依賴 (External Dependencies)"
        U[User Module]
        V[Organization Module]
        W[Notification Module]
        X[Audit Module]
    end
    
    %% 層級連接
    A --> G
    B --> G
    C --> G
    D --> H
    E --> I
    F --> J
    
    G --> K
    H --> L
    I --> M
    J --> N
    
    K --> P
    L --> Q
    M --> R
    N --> S
    
    %% 外部依賴
    G --> U
    G --> V
    G --> W
    G --> X
```

### 6. 資料庫架構圖

```mermaid
erDiagram
    ACCOUNTS {
        string accountId PK
        string accountType
        object profile
        object permissions
        object settings
        timestamp createdAt
        timestamp updatedAt
        string status
    }
    
    USERS {
        string userId PK
        string accountId FK
        object personalInfo
        object professionalInfo
        object socialRelations
        object preferences
    }
    
    ORGANIZATIONS {
        string organizationId PK
        string accountId FK
        object organizationInfo
        object businessLicense
        object organizationSettings
        object members
        object teams
    }
    
    PROJECTS {
        string projectId PK
        string ownerId FK
        string name
        string description
        string status
        object projectInfo
        object timeline
        object team
        object resources
        object stats
        timestamp createdAt
        timestamp updatedAt
    }
    
    TASKS {
        string taskId PK
        string projectId FK
        string title
        string description
        string status
        string priority
        object assignee
        object timeTracking
        object dependencies
        array tags
        array attachments
        array comments
        timestamp createdAt
        timestamp updatedAt
    }
    
    DOCUMENTS {
        string documentId PK
        string projectId FK
        string name
        string description
        string type
        object fileInfo
        string category
        array tags
        object version
        object permissions
        object stats
        timestamp createdAt
        timestamp updatedAt
    }
    
    COSTS {
        string costId PK
        string projectId FK
        string category
        string description
        number amount
        string currency
        number quantity
        number unitPrice
        date date
        object vendor
        object approval
        object invoice
        timestamp createdAt
        timestamp updatedAt
    }
    
    SOCIAL_RELATIONS {
        string relationId PK
        string followerId FK
        string followingId FK
        string relationType
        string status
        object notifications
        timestamp createdAt
        timestamp updatedAt
    }
    
    ACHIEVEMENTS {
        string achievementId PK
        string userId FK
        string achievementType
        string name
        string description
        object details
        string status
        object progress
        timestamp earnedAt
        timestamp expiresAt
        object display
        timestamp createdAt
        timestamp updatedAt
    }
    
    NOTIFICATIONS {
        string notificationId PK
        string userId FK
        string type
        object content
        boolean read
        timestamp readAt
        string priority
        object source
        timestamp createdAt
        timestamp expiresAt
    }
    
    %% 關係定義
    ACCOUNTS ||--o{ USERS : "extends"
    ACCOUNTS ||--o{ ORGANIZATIONS : "extends"
    ACCOUNTS ||--o{ PROJECTS : "owns"
    PROJECTS ||--o{ TASKS : "contains"
    PROJECTS ||--o{ DOCUMENTS : "contains"
    PROJECTS ||--o{ COSTS : "contains"
    ACCOUNTS ||--o{ SOCIAL_RELATIONS : "follows"
    ACCOUNTS ||--o{ ACHIEVEMENTS : "earns"
    ACCOUNTS ||--o{ NOTIFICATIONS : "receives"
```

### 7. 部署架構圖

```mermaid
graph TB
    subgraph "CDN 層 (CDN Layer)"
        A[CloudFlare CDN]
        B[Static Assets]
        C[Image Optimization]
    end
    
    subgraph "前端部署 (Frontend Deployment)"
        D[Angular Build]
        E[Static Hosting]
        F[Firebase Hosting]
    end
    
    subgraph "後端部署 (Backend Deployment)"
        G[Cloud Functions]
        H[Firebase Auth]
        I[Cloud Firestore]
        J[Cloud Storage]
        K[Cloud Messaging]
    end
    
    subgraph "外部服務 (External Services)"
        L[SendGrid]
        M[Twilio]
        N[Google Maps]
        O[Payment Gateway]
    end
    
    subgraph "監控與日誌 (Monitoring & Logging)"
        P[Firebase Analytics]
        Q[Error Tracking]
        R[Performance Monitoring]
        S[Audit Logs]
    end
    
    subgraph "開發環境 (Development Environment)"
        T[Local Development]
        U[Testing Environment]
        V[Staging Environment]
    end
    
    %% 部署流程
    T --> D
    U --> D
    V --> D
    
    D --> E
    E --> F
    F --> A
    
    G --> H
    G --> I
    G --> J
    G --> K
    
    G --> L
    G --> M
    A --> N
    A --> O
    
    F --> P
    G --> Q
    F --> R
    G --> S
```

## 技術規格

### 1. 前端技術棧
- **框架**: Angular 20.3.0
- **UI 庫**: ng-zorro-antd 20.3.1
- **狀態管理**: Signals + RxJS
- **建置工具**: Angular CLI + Vite
- **型別檢查**: TypeScript 5.9.2

### 2. 後端技術棧
- **平台**: Firebase
- **資料庫**: Cloud Firestore
- **認證**: Firebase Auth
- **儲存**: Cloud Storage
- **函數**: Cloud Functions
- **訊息**: Cloud Messaging

### 3. 外部服務
- **郵件**: SendGrid
- **簡訊**: Twilio
- **地圖**: Google Maps API
- **支付**: Stripe/PayPal
- **監控**: Firebase Analytics

### 4. 開發工具
- **版本控制**: Git
- **包管理**: Yarn 4.9.2
- **程式碼品質**: ESLint + Prettier
- **測試**: Jest + Playwright
- **部署**: Firebase CLI

## 效能指標

### 1. 前端效能
- **首次載入時間**: < 2 秒
- **互動時間**: < 100 毫秒
- **Bundle 大小**: < 1MB (gzipped)
- **Lighthouse 分數**: > 90

### 2. 後端效能
- **API 響應時間**: < 200 毫秒
- **資料庫查詢時間**: < 100 毫秒
- **檔案上傳時間**: < 5 秒 (10MB)
- **並發用戶數**: > 10,000

### 3. 可用性指標
- **系統可用性**: 99.9%
- **錯誤率**: < 0.1%
- **恢復時間**: < 5 分鐘
- **資料備份**: 每日自動備份

## 安全架構

### 1. 認證安全
- **多因子認證**: 支援 MFA
- **Token 管理**: JWT + Refresh Token
- **會話管理**: 自動過期機制
- **密碼策略**: 強密碼要求

### 2. 授權安全
- **角色權限**: RBAC 模型
- **資源權限**: 細粒度控制
- **API 安全**: 請求驗證
- **資料加密**: 傳輸和儲存加密

### 3. 資料安全
- **資料備份**: 自動備份策略
- **資料恢復**: 快速恢復機制
- **隱私保護**: GDPR 合規
- **審計日誌**: 完整操作記錄

## 擴展性設計

### 1. 水平擴展
- **微服務架構**: 模組化設計
- **負載平衡**: 自動負載分配
- **資料分片**: 資料庫分片策略
- **快取策略**: 多層快取設計

### 2. 垂直擴展
- **資源監控**: 實時資源監控
- **自動擴展**: 根據負載自動擴展
- **效能優化**: 持續效能優化
- **容量規劃**: 預測性容量規劃

## 參考資源

- [Angular 20 官方文件](https://v20.angular.dev/)
- [ng-zorro-antd 文件](https://ng.ant.design/)
- [Firebase 官方文件](https://firebase.google.com/docs)
- [系統架構設計最佳實踐](https://docs.microsoft.com/en-us/azure/architecture/)

---

*本文件為系統架構圖，旨在提供完整的技術架構和設計規範。*
