# Firestore 資料建模指南

## 概述

本指南詳細說明 ng-alain 企業級建築工程管理平台的 Firestore 資料建模策略，確保資料結構清晰、查詢高效、擴展性良好。

## 資料建模原則

### 1. 核心原則
- **統一帳戶模型**: 用戶和組織使用統一的 Account 基類
- **層次化結構**: 使用子集合組織相關資料
- **正規化與反正規化平衡**: 根據查詢需求調整資料結構
- **索引優化**: 設計支援高效查詢的資料結構

### 2. 設計考量
- **查詢效能**: 最小化讀取次數
- **資料一致性**: 使用事務確保資料一致性
- **擴展性**: 支援未來功能擴展
- **安全性**: 配合安全規則設計資料結構

## 核心資料模型

### 1. 統一帳戶集合 (/accounts)

#### 1.1 基本結構
```typescript
interface Account {
  // 基礎欄位
  accountId: string;           // 帳戶唯一識別碼
  accountType: 'user' | 'organization';  // 帳戶類型
  profile: AccountProfile;     // 通用檔案資訊
  permissions: AccountPermissions;  // 權限集合
  settings: AccountSettings;   // 通用設定
  
  // 時間戳記
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  
  // 狀態欄位
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  isVerified: boolean;
  
  // 統計資料
  stats: AccountStats;
}

interface AccountProfile {
  // 通用資訊
  name: string;
  displayName: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  
  // 聯絡資訊
  email: string;
  phone?: string;
  website?: string;
  
  // 地址資訊
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  
  // 社交媒體
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

interface AccountPermissions {
  // 角色權限
  roles: string[];
  
  // 組織權限
  organizationRoles: Record<string, string[]>;
  
  // 專案權限
  projectRoles: Record<string, string[]>;
  
  // 功能權限
  features: string[];
  
  // 資料權限
  dataAccess: {
    read: string[];
    write: string[];
    delete: string[];
  };
}

interface AccountSettings {
  // 通知設定
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  
  // 隱私設定
  privacy: {
    profileVisibility: 'public' | 'private' | 'organization';
    contactVisibility: 'public' | 'private' | 'organization';
    activityVisibility: 'public' | 'private' | 'organization';
  };
  
  // 語言和地區
  locale: string;
  timezone: string;
  
  // 主題設定
  theme: 'light' | 'dark' | 'auto';
}

interface AccountStats {
  // 活動統計
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  
  // 社交統計
  followersCount: number;
  followingCount: number;
  
  // 成就統計
  achievementsCount: number;
  totalPoints: number;
  
  // 活動統計
  lastActivityAt: Timestamp;
  totalLoginCount: number;
}
```

#### 1.2 用戶特定資料
```typescript
interface UserAccount extends Account {
  accountType: 'user';
  
  // 個人資訊
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    nationality?: string;
  };
  
  // 專業資訊
  professionalInfo: {
    jobTitle: string;
    department?: string;
    skills: string[];
    experience: number; // 年資
    education: Education[];
    certifications: Certification[];
  };
  
  // 社交關係
  socialRelations: {
    following: string[];  // 追蹤的帳戶 ID
    followers: string[];  // 粉絲帳戶 ID
    blocked: string[];    // 封鎖的帳戶 ID
  };
  
  // 偏好設定
  preferences: {
    interests: string[];
    notifications: NotificationPreferences;
    privacy: PrivacySettings;
  };
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
}

interface Certification {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  verificationUrl?: string;
}
```

#### 1.3 組織特定資料
```typescript
interface OrganizationAccount extends Account {
  accountType: 'organization';
  
  // 組織資訊
  organizationInfo: {
    legalName: string;
    businessName: string;
    registrationNumber: string;
    taxId: string;
    industry: string;
    size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    foundedYear: number;
  };
  
  // 營業執照
  businessLicense: {
    licenseNumber: string;
    issueDate: Date;
    expiryDate: Date;
    issuingAuthority: string;
    documentUrl: string;
    verified: boolean;
  };
  
  // 組織設定
  organizationSettings: {
    allowPublicProjects: boolean;
    requireApprovalForProjects: boolean;
    defaultProjectSettings: ProjectDefaults;
    billingSettings: BillingSettings;
  };
  
  // 成員管理
  members: {
    totalCount: number;
    activeCount: number;
    pendingInvitations: number;
  };
  
  // 團隊管理
  teams: {
    totalCount: number;
    activeCount: number;
  };
}

interface ProjectDefaults {
  defaultVisibility: 'private' | 'organization' | 'public';
  defaultPermissions: string[];
  defaultNotificationSettings: NotificationSettings;
}

interface BillingSettings {
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  paymentMethod?: string;
  nextBillingDate?: Date;
}
```

### 2. 專案集合 (/projects)

#### 2.1 專案基本結構
```typescript
interface Project {
  // 基礎資訊
  projectId: string;
  ownerId: string;  // 指向 accounts 集合
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'on_hold';
  
  // 專案詳情
  projectInfo: {
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    estimatedDuration: number; // 天數
    actualDuration?: number;
    budget: number;
    actualCost?: number;
  };
  
  // 時間管理
  timeline: {
    startDate: Date;
    endDate: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
    milestones: Milestone[];
  };
  
  // 團隊管理
  team: {
    members: ProjectMember[];
    roles: ProjectRole[];
    permissions: ProjectPermissions;
  };
  
  // 資源管理
  resources: {
    materials: Material[];
    equipment: Equipment[];
    personnel: Personnel[];
  };
  
  // 文件管理
  documents: {
    totalCount: number;
    categories: string[];
    lastUpdated: Timestamp;
  };
  
  // 統計資料
  stats: ProjectStats;
  
  // 時間戳記
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dependencies: string[]; // 依賴的里程碑 ID
  deliverables: string[];
}

interface ProjectMember {
  accountId: string;
  role: string;
  permissions: string[];
  joinedAt: Timestamp;
  status: 'active' | 'inactive' | 'pending';
}

interface ProjectRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
}

interface ProjectPermissions {
  canView: string[];
  canEdit: string[];
  canDelete: string[];
  canManage: string[];
}

interface ProjectStats {
  // 進度統計
  completionPercentage: number;
  tasksCompleted: number;
  tasksTotal: number;
  
  // 時間統計
  estimatedHours: number;
  actualHours: number;
  remainingHours: number;
  
  // 成本統計
  budgetUsed: number;
  budgetRemaining: number;
  costVariance: number;
  
  // 品質統計
  qualityScore: number;
  issuesCount: number;
  resolvedIssuesCount: number;
}
```

#### 2.2 任務子集合 (/projects/{projectId}/tasks)
```typescript
interface Task {
  // 基礎資訊
  taskId: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // 指派資訊
  assignee: {
    accountId: string;
    name: string;
    role: string;
  };
  
  // 時間管理
  timeTracking: {
    estimatedHours: number;
    actualHours: number;
    startDate?: Date;
    dueDate?: Date;
    completedDate?: Date;
  };
  
  // 依賴關係
  dependencies: {
    dependsOn: string[]; // 依賴的任務 ID
    blocks: string[];    // 被此任務阻塞的任務 ID
  };
  
  // 標籤和分類
  tags: string[];
  category: string;
  
  // 附件和文件
  attachments: Attachment[];
  
  // 評論和討論
  comments: TaskComment[];
  
  // 時間戳記
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isEdited: boolean;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
}
```

#### 2.3 文件子集合 (/projects/{projectId}/documents)
```typescript
interface Document {
  // 基礎資訊
  documentId: string;
  projectId: string;
  name: string;
  description: string;
  type: 'image' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'other';
  
  // 文件詳情
  fileInfo: {
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
  };
  
  // 分類和標籤
  category: string;
  tags: string[];
  
  // 版本控制
  version: {
    current: number;
    total: number;
    history: DocumentVersion[];
  };
  
  // 權限設定
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
  };
  
  // 統計資料
  stats: {
    viewCount: number;
    downloadCount: number;
    lastViewedAt?: Timestamp;
  };
  
  // 時間戳記
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastModifiedAt: Timestamp;
}

interface DocumentVersion {
  version: number;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
  changes: string;
}
```

#### 2.4 成本子集合 (/projects/{projectId}/costs)
```typescript
interface Cost {
  // 基礎資訊
  costId: string;
  projectId: string;
  category: 'labor' | 'materials' | 'equipment' | 'overhead' | 'other';
  description: string;
  
  // 成本詳情
  amount: number;
  currency: string;
  quantity: number;
  unitPrice: number;
  
  // 時間資訊
  date: Date;
  period: {
    start: Date;
    end: Date;
  };
  
  // 供應商資訊
  vendor?: {
    name: string;
    contact: string;
    address: string;
  };
  
  // 審批流程
  approval: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Timestamp;
    notes?: string;
  };
  
  // 發票資訊
  invoice?: {
    number: string;
    date: Date;
    url?: string;
  };
  
  // 時間戳記
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. 社交關係集合 (/social_relations)

```typescript
interface SocialRelation {
  // 基礎資訊
  relationId: string;
  followerId: string;  // 追蹤者帳戶 ID
  followingId: string; // 被追蹤者帳戶 ID
  relationType: 'user' | 'organization' | 'project';
  
  // 關係狀態
  status: 'active' | 'blocked' | 'muted';
  
  // 通知設定
  notifications: {
    enabled: boolean;
    types: string[];
  };
  
  // 時間戳記
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface SocialStats {
  // 追蹤統計
  followingCount: number;
  followersCount: number;
  
  // 互動統計
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  
  // 活躍度統計
  lastActivityAt: Timestamp;
  postsCount: number;
  projectsCount: number;
}
```

### 4. 成就集合 (/achievements)

```typescript
interface Achievement {
  // 基礎資訊
  achievementId: string;
  userId: string;
  achievementType: 'professional' | 'social' | 'project' | 'milestone' | 'special';
  name: string;
  description: string;
  
  // 成就詳情
  details: {
    category: string;
    level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    points: number;
    requirements: AchievementRequirement[];
  };
  
  // 狀態資訊
  status: 'earned' | 'in_progress' | 'locked';
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  
  // 時間資訊
  earnedAt: Timestamp;
  expiresAt?: Timestamp;
  
  // 顯示設定
  display: {
    showInProfile: boolean;
    showInFeed: boolean;
    priority: number;
  };
  
  // 時間戳記
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AchievementRequirement {
  type: 'count' | 'duration' | 'completion' | 'custom';
  target: number;
  current: number;
  description: string;
}
```

### 5. 通知集合 (/notifications)

```typescript
interface Notification {
  // 基礎資訊
  notificationId: string;
  userId: string;
  type: 'system' | 'user' | 'organization' | 'project' | 'achievement' | 'social';
  
  // 通知內容
  content: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  };
  
  // 狀態資訊
  read: boolean;
  readAt?: Timestamp;
  
  // 優先級
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // 來源資訊
  source: {
    type: string;
    id: string;
    name: string;
  };
  
  // 時間戳記
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

interface NotificationPreferences {
  // 通知類型設定
  types: {
    system: boolean;
    user: boolean;
    organization: boolean;
    project: boolean;
    achievement: boolean;
    social: boolean;
  };
  
  // 通知通道設定
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  
  // 時間設定
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
  
  // 頻率設定
  frequency: {
    immediate: boolean;
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
}
```

## 查詢優化策略

### 1. 索引設計
```typescript
// 複合索引範例
interface FirestoreIndex {
  // 用戶查詢索引
  userQueries: {
    fields: ['accountType', 'status', 'createdAt'];
    order: ['accountType', 'status', 'createdAt'];
  };
  
  // 專案查詢索引
  projectQueries: {
    fields: ['ownerId', 'status', 'createdAt'];
    order: ['ownerId', 'status', 'createdAt'];
  };
  
  // 任務查詢索引
  taskQueries: {
    fields: ['projectId', 'status', 'assignee.accountId'];
    order: ['projectId', 'status', 'assignee.accountId'];
  };
  
  // 通知查詢索引
  notificationQueries: {
    fields: ['userId', 'read', 'createdAt'];
    order: ['userId', 'read', 'createdAt'];
  };
}
```

### 2. 查詢模式
```typescript
// 高效查詢範例
class FirestoreQueries {
  // 獲取用戶的專案列表
  async getUserProjects(userId: string, status?: string) {
    let query = this.db.collection('projects')
      .where('ownerId', '==', userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    return query.orderBy('createdAt', 'desc').get();
  }
  
  // 獲取專案的任務列表
  async getProjectTasks(projectId: string, status?: string) {
    let query = this.db.collection('projects')
      .doc(projectId)
      .collection('tasks');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    return query.orderBy('createdAt', 'desc').get();
  }
  
  // 獲取用戶的通知
  async getUserNotifications(userId: string, unreadOnly = false) {
    let query = this.db.collection('notifications')
      .where('userId', '==', userId);
    
    if (unreadOnly) {
      query = query.where('read', '==', false);
    }
    
    return query.orderBy('createdAt', 'desc').limit(50).get();
  }
}
```

### 3. 資料聚合策略
```typescript
// 使用 Cloud Functions 進行資料聚合
interface AggregatedData {
  // 用戶統計
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
  };
  
  // 專案統計
  projectStats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalBudget: number;
  };
  
  // 系統統計
  systemStats: {
    totalStorage: number;
    totalRequests: number;
    averageResponseTime: number;
  };
}
```

## 資料遷移策略

### 1. 版本控制
```typescript
interface DataVersion {
  version: string;
  migrationDate: Timestamp;
  changes: MigrationChange[];
  rollbackScript?: string;
}

interface MigrationChange {
  type: 'add' | 'remove' | 'modify' | 'rename';
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}
```

### 2. 遷移腳本
```typescript
// 資料遷移範例
class DataMigration {
  async migrateToV2() {
    const batch = this.db.batch();
    
    // 遷移用戶資料
    const users = await this.db.collection('users').get();
    users.forEach(doc => {
      const userData = doc.data();
      const accountData = {
        accountId: doc.id,
        accountType: 'user',
        profile: {
          name: userData.name,
          email: userData.email,
          // ... 其他欄位
        },
        permissions: {
          roles: [userData.role],
          // ... 其他權限
        },
        // ... 其他欄位
      };
      
      batch.set(this.db.collection('accounts').doc(doc.id), accountData);
    });
    
    await batch.commit();
  }
}
```

## 最佳實踐

### 1. 資料設計
- 使用有意義的欄位名稱
- 保持資料結構一致性
- 避免深層巢狀結構
- 使用適當的資料型別

### 2. 查詢優化
- 設計支援查詢的資料結構
- 使用複合索引
- 避免不必要的讀取
- 實作分頁查詢

### 3. 安全考量
- 配合安全規則設計資料結構
- 避免敏感資料暴露
- 實作適當的權限控制
- 定期審查資料存取

### 4. 效能監控
- 監控查詢效能
- 追蹤讀取次數
- 優化慢查詢
- 實作快取策略

## 參考資源

- [Firestore 資料建模文件](https://firebase.google.com/docs/firestore/data-model)
- [Firestore 查詢最佳實踐](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore 索引管理](https://firebase.google.com/docs/firestore/query-data/indexing)

---

*本文件為 Firestore 資料建模指南，旨在提供完整的資料結構設計和最佳實踐。*
