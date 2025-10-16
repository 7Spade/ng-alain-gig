# API 總覽 (API Overview)

## 🌐 API 架構概述

ng-alain-gig 採用 Firebase 作為後端服務，提供完整的 BaaS (Backend as a Service) 解決方案。

## 🔥 Firebase 服務架構

### 核心服務
- **Firestore** - NoSQL 文件資料庫
- **Authentication** - 用戶認證服務
- **Storage** - 檔案儲存服務
- **Functions** - 無伺服器函數
- **Hosting** - 靜態網站託管

### API 端點結構
```
Firebase Project: ng-alain-gig
├── Firestore Database
│   ├── users/                    # 用戶集合
│   ├── organizations/            # 組織集合
│   ├── projects/                 # 專案集合
│   ├── tasks/                    # 任務集合
│   └── notifications/            # 通知集合
├── Authentication
│   ├── Email/Password
│   ├── Google OAuth
│   └── Custom Claims
└── Storage
    ├── user-avatars/
    ├── project-documents/
    └── task-attachments/
```

## 📊 資料模型 API

### 用戶 API (Users)
```typescript
// 用戶資料結構
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'manager' | 'user';
  profile: UserProfile;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: Address;
  skills: string[];
  certifications: Certification[];
}
```

#### 用戶 API 操作
```typescript
// 獲取用戶列表
GET /users
Query Parameters:
  - limit: number (預設 20)
  - orderBy: string (預設 'createdAt')
  - where: object (過濾條件)

// 獲取單一用戶
GET /users/{userId}

// 創建用戶
POST /users
Body: CreateUserData

// 更新用戶
PATCH /users/{userId}
Body: Partial<User>

// 刪除用戶
DELETE /users/{userId}
```

### 專案 API (Projects)
```typescript
// 專案資料結構
interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  teamMembers: TeamMember[];
  budget: Budget;
  timeline: Timeline;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type ProjectStatus = 'draft' | 'planning' | 'active' | 'completed' | 'cancelled';

interface TeamMember {
  userId: string;
  role: 'owner' | 'manager' | 'member';
  joinedAt: Timestamp;
  permissions: string[];
}
```

#### 專案 API 操作
```typescript
// 獲取專案列表
GET /projects
Query Parameters:
  - userId: string (用戶的專案)
  - status: ProjectStatus (狀態過濾)
  - limit: number
  - orderBy: string

// 獲取專案詳情
GET /projects/{projectId}

// 創建專案
POST /projects
Body: CreateProjectData

// 更新專案
PATCH /projects/{projectId}
Body: Partial<Project>

// 專案狀態變更
POST /projects/{projectId}/status
Body: { status: ProjectStatus, reason?: string }

// 團隊成員管理
POST /projects/{projectId}/members
Body: { userId: string, role: string }

DELETE /projects/{projectId}/members/{userId}
```

### 任務 API (Tasks)
```typescript
// 任務資料結構
interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: Timestamp;
  attachments: Attachment[];
  comments: Comment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

## 🔐 認證 API

### Firebase Authentication
```typescript
// 登入
POST /auth/login
Body: {
  email: string;
  password: string;
}
Response: {
  user: User;
  token: string;
  refreshToken: string;
}

// 註冊
POST /auth/register
Body: {
  email: string;
  password: string;
  displayName: string;
}

// 登出
POST /auth/logout
Headers: Authorization: Bearer {token}

// 刷新 Token
POST /auth/refresh
Body: {
  refreshToken: string;
}

// 重設密碼
POST /auth/reset-password
Body: {
  email: string;
}
```

### 權限驗證
```typescript
// 自定義聲明 (Custom Claims)
interface CustomClaims {
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
  organizationId?: string;
}

// 權限檢查
function hasPermission(user: User, permission: string): boolean {
  return user.customClaims?.permissions?.includes(permission) ?? false;
}
```

## 📁 檔案儲存 API

### Firebase Storage
```typescript
// 檔案上傳
POST /storage/upload
Headers: 
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data
Body: FormData with file

Response: {
  url: string;
  downloadURL: string;
  metadata: StorageMetadata;
}

// 檔案下載
GET /storage/files/{fileId}
Headers: Authorization: Bearer {token}

// 檔案刪除
DELETE /storage/files/{fileId}
Headers: Authorization: Bearer {token}
```

### 檔案組織結構
```
gs://ng-alain-gig.appspot.com/
├── users/
│   └── {userId}/
│       ├── avatar.jpg
│       └── documents/
├── projects/
│   └── {projectId}/
│       ├── documents/
│       ├── images/
│       └── attachments/
└── organizations/
    └── {orgId}/
        └── logos/
```

## 🔄 即時資料 API

### Firestore 即時監聽
```typescript
// 監聽專案變更
const unsubscribe = onSnapshot(
  doc(db, 'projects', projectId),
  (doc) => {
    if (doc.exists()) {
      const project = doc.data() as Project;
      // 處理專案更新
    }
  }
);

// 監聽任務列表變更
const unsubscribe = onSnapshot(
  query(
    collection(db, 'tasks'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  ),
  (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
    // 處理任務列表更新
  }
);
```

## 📊 查詢 API

### Firestore 查詢語法
```typescript
// 基本查詢
const users = await getDocs(
  query(
    collection(db, 'users'),
    where('role', '==', 'manager'),
    orderBy('createdAt', 'desc'),
    limit(10)
  )
);

// 複合查詢
const projects = await getDocs(
  query(
    collection(db, 'projects'),
    where('status', 'in', ['active', 'planning']),
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  )
);

// 分頁查詢
const firstPage = await getDocs(
  query(
    collection(db, 'tasks'),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
);

const lastDoc = firstPage.docs[firstPage.docs.length - 1];
const nextPage = await getDocs(
  query(
    collection(db, 'tasks'),
    orderBy('createdAt', 'desc'),
    startAfter(lastDoc),
    limit(20)
  )
);
```

## 🚨 錯誤處理

### Firebase 錯誤碼
```typescript
// 常見錯誤處理
function handleFirebaseError(error: FirebaseError): string {
  switch (error.code) {
    case 'auth/user-not-found':
      return '用戶不存在';
    case 'auth/wrong-password':
      return '密碼錯誤';
    case 'auth/email-already-in-use':
      return '電子郵件已被使用';
    case 'permission-denied':
      return '權限不足';
    case 'not-found':
      return '資源不存在';
    case 'already-exists':
      return '資源已存在';
    default:
      return '操作失敗，請稍後重試';
  }
}
```

### API 錯誤回應格式
```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// 錯誤回應範例
{
  "code": "VALIDATION_ERROR",
  "message": "輸入資料驗證失敗",
  "details": {
    "field": "email",
    "error": "電子郵件格式不正確"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📈 效能優化

### 查詢優化
```typescript
// 使用索引優化查詢
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 快取策略
```typescript
// 使用 Firebase 快取
const settings = {
  cacheSizeBytes: 50 * 1024 * 1024, // 50MB
  experimentalForceLongPolling: false
};

// 離線支援
enableNetwork(db);
disableNetwork(db);
```

## 🔒 安全規則

### Firestore 安全規則範例
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶只能讀寫自己的資料
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 專案權限控制
    match /projects/{projectId} {
      allow read: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid ||
         request.auth.uid in resource.data.teamMembers);
      allow write: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
  }
}
```

## 📋 API 使用檢查清單

### ✅ 認證
- [ ] 正確設置 Firebase 配置
- [ ] 實作 Token 刷新機制
- [ ] 處理認證狀態變更
- [ ] 實作權限檢查

### ✅ 資料操作
- [ ] 使用適當的查詢索引
- [ ] 實作分頁機制
- [ ] 處理即時資料更新
- [ ] 實作離線支援

### ✅ 錯誤處理
- [ ] 統一錯誤處理機制
- [ ] 用戶友善的錯誤訊息
- [ ] 錯誤日誌記錄
- [ ] 重試機制

### ✅ 效能
- [ ] 查詢優化
- [ ] 適當的快取策略
- [ ] 批次操作
- [ ] 資料預載入

## 🔗 相關資源

- [Firebase 官方文件](https://firebase.google.com/docs)
- [Firestore 查詢指南](https://firebase.google.com/docs/firestore/query-data/queries)
- [Firebase 安全規則](https://firebase.google.com/docs/rules)
- [服務合約](./SERVICE_CONTRACTS.md)
