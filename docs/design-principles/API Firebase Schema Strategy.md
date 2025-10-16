# API / Firebase 結構策略 (API Firebase Schema Strategy)

## 概述

API / Firebase 結構策略定義了營建管理系統的資料結構設計、API 設計原則和 Firebase 整合策略。

## Firebase 結構設計

### 1. 集合結構 (Collections)

#### 用戶集合 (Users)
```typescript
interface UserDocument {
  id: string;
  email: string;
  name: string;
  profile: {
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    timezone: string;
    language: string;
    professionalInfo: {
      licenses: ProfessionalLicense[];
      specialties: string[];
      yearsOfExperience: number;
      education: Education[];
      certifications: Certification[];
    };
  };
  socialConnections: {
    following: string[]; // User IDs
    followers: string[];
    starredProjects: string[]; // Project IDs
  };
  achievements: {
    unlocked: Achievement[];
    progress: AchievementProgress[];
  };
  preferences: {
    notifications: NotificationPreferences;
    theme: 'light' | 'dark';
    language: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

#### 組織集合 (Organizations)
```typescript
interface OrganizationDocument {
  id: string;
  name: string;
  type: 'construction' | 'engineering' | 'consulting';
  profile: {
    description?: string;
    logo?: string;
    website?: string;
    address: Address;
    businessLicense: string;
    taxId: string;
  };
  members: {
    [userId: string]: {
      role: 'admin' | 'manager' | 'engineer' | 'supervisor' | 'contractor';
      department?: string;
      joinedAt: Timestamp;
      isActive: boolean;
    };
  };
  teams: {
    [teamId: string]: {
      name: string;
      description?: string;
      members: string[]; // User IDs
      leader: string; // User ID
      createdAt: Timestamp;
    };
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 專案集合 (Projects)
```typescript
interface ProjectDocument {
  id: string;
  name: string;
  description: string;
  ownerId: string; // User ID or Organization ID
  ownerType: 'user' | 'organization';
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  timeline: {
    startDate?: Timestamp;
    endDate?: Timestamp;
    estimatedDuration: number; // days
  };
  milestones: {
    [milestoneId: string]: {
      name: string;
      description?: string;
      dueDate: Timestamp;
      status: 'pending' | 'in-progress' | 'completed';
      tasks: string[]; // Task IDs
    };
  };
  tasks: {
    [taskId: string]: {
      title: string;
      description?: string;
      assigneeId?: string; // User ID
      status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: Timestamp;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    };
  };
  teamMembers: {
    [userId: string]: {
      role: 'owner' | 'admin' | 'lead' | 'member' | 'observer';
      permissions: string[];
      joinedAt: Timestamp;
    };
  };
  documents: {
    [documentId: string]: {
      name: string;
      type: string;
      url: string;
      uploadedBy: string; // User ID
      uploadedAt: Timestamp;
      size: number;
    };
  };
  costControl: {
    budget: {
      amount: number;
      currency: string;
      breakdown: {
        labor: number;
        materials: number;
        equipment: number;
        other: number;
      };
    };
    expenses: {
      [expenseId: string]: {
        amount: number;
        category: string;
        description: string;
        date: Timestamp;
        recordedBy: string; // User ID
      };
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. 子集合設計

#### 專案任務子集合 (Project Tasks)
```typescript
// /projects/{projectId}/tasks/{taskId}
interface TaskDocument {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string; // User ID
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  comments: {
    [commentId: string]: {
      content: string;
      authorId: string; // User ID
      createdAt: Timestamp;
    };
  };
  attachments: {
    [attachmentId: string]: {
      name: string;
      url: string;
      uploadedBy: string; // User ID
      uploadedAt: Timestamp;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 用戶通知子集合 (User Notifications)
```typescript
// /users/{userId}/notifications/{notificationId}
interface NotificationDocument {
  id: string;
  userId: string;
  type: 'project' | 'task' | 'team' | 'system' | 'achievement';
  title: string;
  content: string;
  data?: any; // Additional data
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Timestamp;
  readAt?: Timestamp;
}
```

## API 設計原則

### 1. RESTful API 設計

#### 資源命名規範
```
GET    /api/v1/users                    # 取得用戶列表
GET    /api/v1/users/{id}               # 取得特定用戶
POST   /api/v1/users                    # 建立新用戶
PUT    /api/v1/users/{id}               # 更新用戶
DELETE /api/v1/users/{id}               # 刪除用戶

GET    /api/v1/projects                 # 取得專案列表
GET    /api/v1/projects/{id}            # 取得特定專案
POST   /api/v1/projects                 # 建立新專案
PUT    /api/v1/projects/{id}            # 更新專案
DELETE /api/v1/projects/{id}            # 刪除專案

GET    /api/v1/projects/{id}/tasks      # 取得專案任務
POST   /api/v1/projects/{id}/tasks     # 建立專案任務
PUT    /api/v1/projects/{id}/tasks/{taskId}  # 更新任務
DELETE /api/v1/projects/{id}/tasks/{taskId}  # 刪除任務
```

#### 回應格式標準
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  requestId: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message: string;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

### 2. GraphQL 整合

#### Schema 定義
```graphql
type User {
  id: ID!
  email: String!
  name: String!
  profile: UserProfile
  projects: [Project!]!
  teams: [Team!]!
  achievements: [Achievement!]!
}

type Project {
  id: ID!
  name: String!
  description: String!
  owner: User!
  status: ProjectStatus!
  tasks: [Task!]!
  teamMembers: [TeamMember!]!
  milestones: [Milestone!]!
}

type Query {
  user(id: ID!): User
  users(filter: UserFilter): [User!]!
  project(id: ID!): Project
  projects(filter: ProjectFilter): [Project!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  createProject(input: CreateProjectInput!): Project!
  assignTask(taskId: ID!, userId: ID!): Task!
}
```

## Firebase 安全規則

### 1. Firestore 安全規則
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶資料規則
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        resource.data.status == 'active';
    }
    
    // 組織資料規則
    match /organizations/{orgId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid in resource.data.members.keys() &&
        resource.data.members[request.auth.uid].role in ['admin', 'manager'];
    }
    
    // 專案資料規則
    match /projects/{projectId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.teamMembers.keys();
      allow write: if request.auth != null && 
        request.auth.uid in resource.data.teamMembers.keys() &&
        resource.data.teamMembers[request.auth.uid].role in ['owner', 'admin'];
    }
    
    // 任務資料規則
    match /projects/{projectId}/tasks/{taskId} {
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.teamMembers.keys();
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.assigneeId ||
         request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.teamMembers.keys() &&
         get(/databases/$(database)/documents/projects/$(projectId)).data.teamMembers[request.auth.uid].role in ['owner', 'admin', 'lead']);
    }
  }
}
```

### 2. Storage 安全規則
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 用戶頭像
    match /users/{userId}/avatar/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 專案文件
    match /projects/{projectId}/documents/{fileName} {
      allow read: if request.auth != null && 
        request.auth.uid in firestore.get(/databases/(default)/documents/projects/$(projectId)).data.teamMembers.keys();
      allow write: if request.auth != null && 
        request.auth.uid in firestore.get(/databases/(default)/documents/projects/$(projectId)).data.teamMembers.keys() &&
        firestore.get(/databases/(default)/documents/projects/$(projectId)).data.teamMembers[request.auth.uid].role in ['owner', 'admin', 'lead'];
    }
  }
}
```

## 資料同步策略

### 1. 即時同步
```typescript
// 使用 Firestore 即時監聽
class ProjectService {
  getProjectRealtime(projectId: string): Observable<Project> {
    return this.firestore
      .collection('projects')
      .doc(projectId)
      .valueChanges()
      .pipe(
        map(doc => this.mapToProject(doc)),
        catchError(error => this.handleError(error))
      );
  }
  
  getProjectTasksRealtime(projectId: string): Observable<Task[]> {
    return this.firestore
      .collection('projects')
      .doc(projectId)
      .collection('tasks')
      .valueChanges()
      .pipe(
        map(docs => docs.map(doc => this.mapToTask(doc))),
        catchError(error => this.handleError(error))
      );
  }
}
```

### 2. 離線支援
```typescript
// 啟用離線持久化
class FirebaseService {
  constructor() {
    // 啟用離線持久化
    this.firestore.enablePersistence({
      synchronizeTabs: true
    }).catch(err => {
      if (err.code == 'failed-precondition') {
        console.log('多個標籤頁開啟，離線持久化被禁用');
      } else if (err.code == 'unimplemented') {
        console.log('瀏覽器不支援離線持久化');
      }
    });
  }
}
```

## 效能優化

### 1. 查詢優化
```typescript
// 使用複合索引
class ProjectService {
  getProjectsByOwner(ownerId: string, status: string): Observable<Project[]> {
    return this.firestore
      .collection('projects', ref => 
        ref
          .where('ownerId', '==', ownerId)
          .where('status', '==', status)
          .orderBy('createdAt', 'desc')
          .limit(20)
      )
      .valueChanges();
  }
}
```

### 2. 快取策略
```typescript
// 使用 Angular Fire 快取
class CachedProjectService {
  private cache = new Map<string, Project>();
  
  getProject(projectId: string): Observable<Project> {
    if (this.cache.has(projectId)) {
      return of(this.cache.get(projectId)!);
    }
    
    return this.firestore
      .collection('projects')
      .doc(projectId)
      .valueChanges()
      .pipe(
        tap(project => this.cache.set(projectId, project)),
        shareReplay(1)
      );
  }
}
```

## 最佳實踐

### 1. 資料設計原則
- **正規化**: 避免資料重複
- **反正規化**: 在必要時進行反正規化以提升查詢效能
- **索引設計**: 為常用查詢建立適當的索引
- **資料驗證**: 在客戶端和伺服器端都進行資料驗證

### 2. 安全原則
- **最小權限**: 只授予必要的存取權限
- **資料驗證**: 驗證所有輸入資料
- **錯誤處理**: 適當處理和記錄錯誤
- **審計日誌**: 記錄重要的操作和存取

### 3. 效能原則
- **查詢優化**: 設計高效的查詢
- **快取策略**: 合理使用快取
- **分頁處理**: 對大量資料進行分頁
- **離線支援**: 提供離線功能支援
