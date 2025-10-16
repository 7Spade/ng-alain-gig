# 系統架構概覽 (System Architecture Overview)

## 整體架構圖

```mermaid
graph TB
    subgraph "Presentation Layer (展示層)"
        UI[Angular 20 UI Components]
        Routes[Angular Router]
        Guards[Route Guards & ACL]
    end
    
    subgraph "Application Layer (應用層)"
        AppServices[Application Services]
        UseCases[Use Cases]
        DTOs[Data Transfer Objects]
    end
    
    subgraph "Domain Layer (領域層)"
        Entities[Domain Entities]
        ValueObjects[Value Objects]
        Aggregates[Aggregates]
        DomainServices[Domain Services]
        DomainEvents[Domain Events]
    end
    
    subgraph "Infrastructure Layer (基礎設施層)"
        Repositories[Repositories]
        ExternalServices[External Services]
        Firebase[Firebase Services]
        Cache[Cache Services]
    end
    
    subgraph "Data Layer (資料層)"
        Firestore[Firestore Database]
        Storage[Cloud Storage]
        Auth[Firebase Auth]
        Messaging[Cloud Messaging]
    end
    
    UI --> Routes
    Routes --> Guards
    Guards --> AppServices
    AppServices --> UseCases
    UseCases --> Entities
    UseCases --> ValueObjects
    UseCases --> Aggregates
    UseCases --> DomainServices
    AppServices --> Repositories
    Repositories --> Firebase
    Firebase --> Firestore
    Firebase --> Storage
    Firebase --> Auth
    Firebase --> Messaging
```

## 三個 DDD 領域架構

### 1. Account Domain (帳戶抽象層)
```mermaid
graph TB
    subgraph "Account Domain"
        User[User Entity]
        UserProfile[User Profile]
        Organization[Organization Entity]
        Team[Team Entity]
        UserAggregate[User Aggregate]
        OrgAggregate[Organization Aggregate]
    end
    
    subgraph "Account Features"
        Auth[Authentication]
        Profile[Profile Management]
        Social[Social Features]
        Notifications[Notifications]
        Achievements[Achievements]
    end
    
    User --> UserProfile
    Organization --> Team
    UserAggregate --> User
    UserAggregate --> UserProfile
    OrgAggregate --> Organization
    OrgAggregate --> Team
    
    Auth --> UserAggregate
    Profile --> UserAggregate
    Social --> UserAggregate
    Notifications --> UserAggregate
    Achievements --> UserAggregate
```

### 2. Projects Domain (專案管理)
```mermaid
graph TB
    subgraph "Projects Domain"
        Project[Project Entity]
        Task[Task Entity]
        Document[Document Entity]
        Cost[Cost Entity]
        ProjectAggregate[Project Aggregate]
    end
    
    subgraph "Project Features"
        Lifecycle[Project Lifecycle]
        TaskMgmt[Task Management]
        CostCtrl[Cost Control]
        DocMgmt[Document Management]
        Collaboration[Team Collaboration]
    end
    
    Project --> Task
    Project --> Document
    Project --> Cost
    ProjectAggregate --> Project
    ProjectAggregate --> Task
    ProjectAggregate --> Document
    ProjectAggregate --> Cost
    
    Lifecycle --> ProjectAggregate
    TaskMgmt --> ProjectAggregate
    CostCtrl --> ProjectAggregate
    DocMgmt --> ProjectAggregate
    Collaboration --> ProjectAggregate
```

### 3. Shared Domain (共享基礎設施)
```mermaid
graph TB
    subgraph "Shared Domain"
        UIComponents[UI Components]
        Services[Common Services]
        Directives[Directives]
        Pipes[Pipes]
        Utils[Utility Functions]
    end
    
    subgraph "Infrastructure"
        Firebase[Firebase Integration]
        Cache[Cache Services]
        External[External APIs]
        Security[Security Services]
    end
    
    UIComponents --> Services
    Services --> Firebase
    Services --> Cache
    Services --> External
    Services --> Security
```

## 認證與權限架構

### 認證流程架構
```mermaid
sequenceDiagram
    participant User as 用戶
    participant UI as Angular UI
    participant FA as Firebase Auth
    participant AS as @delon/auth
    participant ACL as @delon/acl
    participant Router as Angular Router
    participant Component as Angular Component

    User->>UI: 登入
    UI->>FA: Firebase Authentication
    FA-->>AS: ID Token + User Profile
    AS->>AS: 儲存 Token
    AS->>ACL: 設定權限
    ACL-->>AS: 權限設定完成
    AS-->>UI: 登入成功
    UI->>Router: 導航
    Router->>ACL: 權限檢查
    ACL-->>Router: 允許/拒絕
    Router-->>Component: 渲染組件
    Component->>ACL: 功能權限檢查
    ACL-->>Component: 權限結果
```

## 資料流架構

### 狀態管理架構
```mermaid
graph TB
    subgraph "Global State (NgRx Store)"
        AuthState[Auth State]
        AppState[App State]
        ThemeState[Theme State]
    end
    
    subgraph "Module State (Angular Signals)"
        UserState[User State]
        ProjectState[Project State]
        OrgState[Organization State]
    end
    
    subgraph "Component State (Local Signals)"
        FormState[Form State]
        UIState[UI State]
        TempState[Temp State]
    end
    
    subgraph "Async State (RxJS)"
        APIState[API State]
        WebSocketState[WebSocket State]
        RealtimeState[Realtime State]
    end
    
    AuthState --> UserState
    UserState --> FormState
    ProjectState --> UIState
    APIState --> ProjectState
    WebSocketState --> RealtimeState
```

## 部署架構

### 前端部署
```mermaid
graph TB
    subgraph "Build Process"
        Source[Source Code]
        Build[Angular Build]
        Bundle[Bundle Files]
    end
    
    subgraph "Deployment"
        CDN[CDN]
        S3[Cloud Storage]
        Server[Web Server]
    end
    
    subgraph "Users"
        Browser[Browser]
        Mobile[Mobile App]
    end
    
    Source --> Build
    Build --> Bundle
    Bundle --> CDN
    Bundle --> S3
    CDN --> Browser
    S3 --> Mobile
    Server --> Browser
```

### 後端服務
```mermaid
graph TB
    subgraph "Firebase Services"
        Auth[Firebase Auth]
        Firestore[Firestore]
        Storage[Cloud Storage]
        Functions[Cloud Functions]
        Messaging[Cloud Messaging]
    end
    
    subgraph "External Services"
        Maps[Google Maps]
        Payment[Payment Gateway]
        Email[Email Service]
    end
    
    subgraph "Monitoring"
        Analytics[Firebase Analytics]
        Crashlytics[Firebase Crashlytics]
        Performance[Performance Monitoring]
    end
    
    Auth --> Firestore
    Firestore --> Storage
    Functions --> Messaging
    Functions --> Maps
    Functions --> Payment
    Functions --> Email
    Analytics --> Crashlytics
    Crashlytics --> Performance
```

## 安全架構

### 多層安全防護
```mermaid
graph TB
    subgraph "Frontend Security"
        HTTPS[HTTPS Only]
        CSP[Content Security Policy]
        XSS[XSS Protection]
        CSRF[CSRF Protection]
    end
    
    subgraph "Authentication"
        FirebaseAuth[Firebase Auth]
        TokenMgmt[Token Management]
        SessionMgmt[Session Management]
    end
    
    subgraph "Authorization"
        ACL[ACL System]
        RBAC[Role-Based Access]
        Permissions[Permission Matrix]
    end
    
    subgraph "Data Security"
        Encryption[Data Encryption]
        Validation[Input Validation]
        Sanitization[Data Sanitization]
    end
    
    HTTPS --> FirebaseAuth
    FirebaseAuth --> ACL
    ACL --> Encryption
    CSP --> XSS
    XSS --> CSRF
    TokenMgmt --> SessionMgmt
    RBAC --> Permissions
    Validation --> Sanitization
```

## 效能架構

### 效能優化策略
```mermaid
graph TB
    subgraph "Bundle Optimization"
        TreeShaking[Tree Shaking]
        CodeSplitting[Code Splitting]
        LazyLoading[Lazy Loading]
        Compression[Gzip Compression]
    end
    
    subgraph "Runtime Optimization"
        OnPush[OnPush Strategy]
        Memoization[Memoization]
        VirtualScrolling[Virtual Scrolling]
        Debouncing[Debouncing]
    end
    
    subgraph "Caching Strategy"
        HTTPCache[HTTP Caching]
        LocalCache[Local Storage]
        MemoryCache[Memory Cache]
        CDNCache[CDN Caching]
    end
    
    subgraph "Network Optimization"
        Preloading[Resource Preloading]
        Prefetching[Route Prefetching]
        Compression[Response Compression]
        Minification[Asset Minification]
    end
    
    TreeShaking --> OnPush
    CodeSplitting --> HTTPCache
    LazyLoading --> Preloading
    Compression --> CDNCache
    Memoization --> MemoryCache
    VirtualScrolling --> Debouncing
    Prefetching --> Minification
```

## 相關文件
- [設計原則](../Global Notes/Design Principles.md)
- [技術棧標準](../Global Notes/Technology Stack.md)
- [認證流程策略](../Global Notes/Authentication Flow Strategy.md)
- [模組設計標準](../Global Notes/Module Design Standards.md)
