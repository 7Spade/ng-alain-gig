# Firebase Schema.md - Firebase 資料庫結構設計

> **AI Agent 友好指南**：本文件提供營建專案管理系統的 Firebase Firestore 資料庫結構設計，包含集合設計、文件模式、索引策略和安全規則。

## 🗄️ 資料庫架構概覽

### 集合結構設計
```typescript
// Firestore 集合結構
export interface FirestoreSchema {
  // 用戶相關集合
  users: UserDocument;
  userProfiles: UserProfileDocument;
  userSessions: UserSessionDocument;
  
  // 組織相關集合
  organizations: OrganizationDocument;
  organizationMembers: OrganizationMemberDocument;
  
  // 團隊相關集合
  teams: TeamDocument;
  teamMembers: TeamMemberDocument;
  
  // 專案相關集合
  projects: ProjectDocument;
  projectMembers: ProjectMemberDocument;
  projectMilestones: ProjectMilestoneDocument;
  
  // 任務相關集合
  tasks: TaskDocument;
  taskAssignments: TaskAssignmentDocument;
  taskComments: TaskCommentDocument;
  
  // 文件相關集合
  documents: DocumentDocument;
  documentVersions: DocumentVersionDocument;
  
  // 成本控制集合
  budgets: BudgetDocument;
  expenses: ExpenseDocument;
  costBreakdowns: CostBreakdownDocument;
  
  // 通知集合
  notifications: NotificationDocument;
  
  // 系統集合
  systemConfig: SystemConfigDocument;
  auditLogs: AuditLogDocument;
}
```

### 文件 ID 命名策略
```typescript
// 文件 ID 命名規範
export const DOCUMENT_ID_PATTERNS = {
  // 用戶相關
  users: 'user_{userId}',                    // user_1234567890
  userProfiles: 'profile_{userId}',          // profile_1234567890
  userSessions: 'session_{sessionId}',       // session_abc123def456
  
  // 組織相關
  organizations: 'org_{orgId}',             // org_company_001
  organizationMembers: 'org_member_{orgId}_{userId}', // org_member_company_001_user_123
  
  // 團隊相關
  teams: 'team_{teamId}',                   // team_engineering_001
  teamMembers: 'team_member_{teamId}_{userId}', // team_member_engineering_001_user_123
  
  // 專案相關
  projects: 'project_{projectId}',          // project_building_001
  projectMembers: 'project_member_{projectId}_{userId}', // project_member_building_001_user_123
  projectMilestones: 'milestone_{milestoneId}', // milestone_building_001_phase_1
  
  // 任務相關
  tasks: 'task_{taskId}',                   // task_building_001_task_001
  taskAssignments: 'task_assignment_{taskId}_{userId}', // task_assignment_building_001_task_001_user_123
  taskComments: 'comment_{commentId}',       // comment_comment_001
  
  // 文件相關
  documents: 'doc_{documentId}',            // doc_building_001_doc_001
  documentVersions: 'doc_version_{documentId}_{version}', // doc_version_building_001_doc_001_v1
  
  // 成本控制
  budgets: 'budget_{budgetId}',             // budget_building_001_budget_001
  expenses: 'expense_{expenseId}',           // expense_building_001_expense_001
  costBreakdowns: 'breakdown_{breakdownId}', // breakdown_building_001_breakdown_001
  
  // 通知
  notifications: 'notification_{notificationId}', // notification_notification_001
  
  // 系統
  systemConfig: 'config_{configType}',      // config_app_settings
  auditLogs: 'audit_{auditId}'              // audit_audit_001
} as const;
```

## 👥 用戶相關集合

### 1. Users 集合
```typescript
// 用戶主文件
export interface UserDocument {
  // 基本資訊
  id: string;                    // 用戶唯一 ID
  email: string;                 // 電子郵件
  displayName: string;           // 顯示名稱
  photoURL?: string;             // 頭像 URL
  
  // 認證資訊
  emailVerified: boolean;        // 郵箱驗證狀態
  providerId: string;            // 認證提供商 (google, facebook, etc.)
  customClaims?: {               // 自定義聲明
    role: UserRole;
    organizationId?: string;
    permissions: string[];
  };
  
  // 狀態資訊
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLoginAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // 營建專業資訊
  profession: 'engineer' | 'supervisor' | 'contractor' | 'manager' | 'admin';
  certifications: string[];      // 專業證照
  experience: number;            // 工作經驗年數
  
  // 偏好設定
  preferences: {
    language: 'zh-TW' | 'en-US';
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    theme: 'light' | 'dark';
  };
  
  // 統計資訊
  stats: {
    projectCount: number;
    taskCount: number;
    achievementCount: number;
    rating: number;
  };
}

// 用戶角色定義
export type UserRole = 
  | 'super_admin'     // 超級管理員
  | 'org_admin'        // 組織管理員
  | 'project_manager'  // 專案經理
  | 'engineer'         // 工程師
  | 'supervisor'       // 監工
  | 'contractor'       // 承包商
  | 'viewer';          // 檢視者
```

### 2. User Profiles 集合
```typescript
// 用戶詳細資料
export interface UserProfileDocument {
  userId: string;                // 關聯用戶 ID
  
  // 個人資訊
  personalInfo: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    dateOfBirth?: Timestamp;
    gender?: 'male' | 'female' | 'other';
  };
  
  // 專業資訊
  professionalInfo: {
    company: string;
    position: string;
    department?: string;
    employeeId?: string;
    hireDate?: Timestamp;
    salary?: number;
    workLocation?: string;
  };
  
  // 技能與證照
  skills: {
    technicalSkills: string[];
    softSkills: string[];
    languages: Array<{
      language: string;
      proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native';
    }>;
  };
  
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: Timestamp;
    expiryDate?: Timestamp;
    certificateNumber?: string;
    verificationStatus: 'verified' | 'pending' | 'expired';
  }>;
  
  // 工作經歷
  workExperience: Array<{
    company: string;
    position: string;
    startDate: Timestamp;
    endDate?: Timestamp;
    description?: string;
    achievements?: string[];
  }>;
  
  // 教育背景
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Timestamp;
    endDate?: Timestamp;
    gpa?: number;
  }>;
  
  // 社交資訊
  socialInfo: {
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    bio?: string;
  };
  
  // 隱私設定
  privacySettings: {
    profileVisibility: 'public' | 'organization' | 'private';
    contactInfoVisibility: 'public' | 'organization' | 'private';
    workHistoryVisibility: 'public' | 'organization' | 'private';
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🏢 組織相關集合

### 1. Organizations 集合
```typescript
// 組織主文件
export interface OrganizationDocument {
  id: string;                    // 組織唯一 ID
  name: string;                  // 組織名稱
  type: 'construction' | 'engineering' | 'consulting' | 'government' | 'other';
  
  // 基本資訊
  basicInfo: {
    legalName: string;           // 法定名稱
    businessRegistrationNumber: string; // 統一編號
    taxId?: string;              // 稅務識別碼
    website?: string;
    description?: string;
  };
  
  // 聯絡資訊
  contactInfo: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    phoneNumber: string;
    email: string;
    fax?: string;
  };
  
  // 營建相關資訊
  constructionInfo: {
    licenseNumber?: string;      // 營建執照號碼
    licenseExpiryDate?: Timestamp;
    specialties: string[];       // 專業領域
    projectTypes: string[];      // 專案類型
    maxProjectValue?: number;    // 最大專案金額
  };
  
  // 組織設定
  settings: {
    timezone: string;
    currency: string;
    dateFormat: string;
    workingHours: {
      start: string;             // HH:mm
      end: string;               // HH:mm
      workingDays: number[];     // 0-6 (Sunday-Saturday)
    };
    holidays: Array<{
      name: string;
      date: Timestamp;
      recurring: boolean;
    }>;
  };
  
  // 權限設定
  permissions: {
    allowPublicProjects: boolean;
    allowExternalCollaboration: boolean;
    requireApprovalForProjects: boolean;
    defaultProjectPermissions: string[];
  };
  
  // 狀態資訊
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  verificationStatus: {
    isVerified: boolean;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
    verificationDocuments?: string[];
  };
  
  // 統計資訊
  stats: {
    memberCount: number;
    projectCount: number;
    totalProjectValue: number;
    activeProjects: number;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

### 2. Organization Members 集合
```typescript
// 組織成員關係
export interface OrganizationMemberDocument {
  id: string;                    // org_member_{orgId}_{userId}
  organizationId: string;
  userId: string;
  
  // 成員資訊
  memberInfo: {
    role: OrganizationRole;
    department?: string;
    position?: string;
    employeeId?: string;
    joinDate: Timestamp;
    status: 'active' | 'inactive' | 'pending' | 'suspended';
  };
  
  // 權限設定
  permissions: {
    canCreateProjects: boolean;
    canManageMembers: boolean;
    canViewFinancials: boolean;
    canManageSettings: boolean;
    customPermissions: string[];
  };
  
  // 團隊成員關係
  teamMemberships: Array<{
    teamId: string;
    role: TeamRole;
    joinedAt: Timestamp;
  }>;
  
  // 專案成員關係
  projectMemberships: Array<{
    projectId: string;
    role: ProjectRole;
    joinedAt: Timestamp;
    permissions: string[];
  }>;
  
  // 邀請資訊
  invitation?: {
    invitedBy: string;
    invitedAt: Timestamp;
    invitationToken: string;
    expiresAt: Timestamp;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 組織角色定義
export type OrganizationRole = 
  | 'owner'           // 擁有者
  | 'admin'           // 管理員
  | 'manager'         // 經理
  | 'member'          // 成員
  | 'viewer';         // 檢視者
```

## 👥 團隊相關集合

### 1. Teams 集合
```typescript
// 團隊主文件
export interface TeamDocument {
  id: string;                    // 團隊唯一 ID
  organizationId: string;         // 所屬組織
  name: string;                  // 團隊名稱
  description?: string;          // 團隊描述
  
  // 團隊資訊
  teamInfo: {
    type: 'engineering' | 'safety' | 'quality' | 'management' | 'other';
    purpose: string;             // 團隊目的
    objectives: string[];        // 團隊目標
    specialties: string[];      // 專業領域
  };
  
  // 團隊設定
  settings: {
    maxMembers: number;          // 最大成員數
    allowSelfJoin: boolean;      // 允許自行加入
    requireApproval: boolean;    // 需要審核
    defaultPermissions: string[]; // 預設權限
  };
  
  // 團隊領導
  leadership: {
    teamLead: string;            // 團隊領導 ID
    deputyLead?: string;         // 副領導 ID
    mentors: string[];          // 導師 ID 列表
  };
  
  // 專案分配
  projectAssignments: Array<{
    projectId: string;
    assignedAt: Timestamp;
    assignedBy: string;
    status: 'active' | 'completed' | 'cancelled';
  }>;
  
  // 團隊統計
  stats: {
    memberCount: number;
    activeProjectCount: number;
    completedProjectCount: number;
    averageRating: number;
  };
  
  // 狀態資訊
  status: 'active' | 'inactive' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

### 2. Team Members 集合
```typescript
// 團隊成員關係
export interface TeamMemberDocument {
  id: string;                    // team_member_{teamId}_{userId}
  teamId: string;
  userId: string;
  
  // 成員資訊
  memberInfo: {
    role: TeamRole;
    joinedAt: Timestamp;
    status: 'active' | 'inactive' | 'pending' | 'removed';
    contribution: number;       // 貢獻度 (0-100)
  };
  
  // 權限設定
  permissions: {
    canManageTasks: boolean;
    canAssignTasks: boolean;
    canViewReports: boolean;
    canManageDocuments: boolean;
    customPermissions: string[];
  };
  
  // 績效評估
  performance: {
    rating: number;             // 評分 (1-5)
    lastReviewDate?: Timestamp;
    strengths: string[];
    areasForImprovement: string[];
    goals: Array<{
      goal: string;
      targetDate: Timestamp;
      status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
    }>;
  };
  
  // 工作負載
  workload: {
    currentTasks: number;
    maxTasks: number;
    utilizationRate: number;    // 利用率 (0-100)
    availability: {
      startTime: string;         // HH:mm
      endTime: string;           // HH:mm
      workingDays: number[];     // 0-6
    };
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 團隊角色定義
export type TeamRole = 
  | 'team_lead'      // 團隊領導
  | 'senior_member'  // 資深成員
  | 'member'         // 成員
  | 'junior_member'  // 初級成員
  | 'intern';        // 實習生
```

## 🏗️ 專案相關集合

### 1. Projects 集合
```typescript
// 專案主文件
export interface ProjectDocument {
  id: string;                    // 專案唯一 ID
  name: string;                  // 專案名稱
  description?: string;          // 專案描述
  
  // 基本資訊
  basicInfo: {
    type: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'other';
    category: 'new_construction' | 'renovation' | 'maintenance' | 'repair';
    location: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    size: {
      area: number;              // 面積 (平方公尺)
      floors?: number;          // 樓層數
      units?: number;           // 單位數
    };
  };
  
  // 時間規劃
  timeline: {
    startDate: Timestamp;
    plannedEndDate: Timestamp;
    actualEndDate?: Timestamp;
    phases: Array<{
      name: string;
      startDate: Timestamp;
      endDate: Timestamp;
      status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
    }>;
  };
  
  // 預算資訊
  budget: {
    totalBudget: number;
    currency: string;
    breakdown: {
      materials: number;
      labor: number;
      equipment: number;
      permits: number;
      contingency: number;
    };
    spent: number;
    remaining: number;
  };
  
  // 專案狀態
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // 團隊資訊
  team: {
    projectManager: string;      // 專案經理 ID
    teamLead?: string;           // 團隊領導 ID
    assignedTeam?: string;       // 分配團隊 ID
    stakeholders: Array<{
      userId: string;
      role: 'client' | 'contractor' | 'consultant' | 'inspector';
      contactInfo: {
        email: string;
        phone?: string;
      };
    }>;
  };
  
  // 專案設定
  settings: {
    timezone: string;
    workingHours: {
      start: string;
      end: string;
      workingDays: number[];
    };
    notifications: {
      dailyReports: boolean;
      milestoneAlerts: boolean;
      budgetAlerts: boolean;
    };
  };
  
  // 統計資訊
  stats: {
    taskCount: number;
    completedTasks: number;
    documentCount: number;
    photoCount: number;
    inspectionCount: number;
    safetyIncidentCount: number;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

### 2. Project Members 集合
```typescript
// 專案成員關係
export interface ProjectMemberDocument {
  id: string;                    // project_member_{projectId}_{userId}
  projectId: string;
  userId: string;
  
  // 成員資訊
  memberInfo: {
    role: ProjectRole;
    joinedAt: Timestamp;
    status: 'active' | 'inactive' | 'removed';
    contribution: number;       // 貢獻度 (0-100)
  };
  
  // 權限設定
  permissions: {
    canViewProject: boolean;
    canEditProject: boolean;
    canManageTasks: boolean;
    canAssignTasks: boolean;
    canViewFinancials: boolean;
    canManageDocuments: boolean;
    canUploadPhotos: boolean;
    canCreateReports: boolean;
    customPermissions: string[];
  };
  
  // 工作分配
  assignments: {
    primaryResponsibilities: string[];
    secondaryResponsibilities: string[];
    workLoad: {
      hoursPerWeek: number;
      utilizationRate: number;
    };
  };
  
  // 績效評估
  performance: {
    rating: number;             // 評分 (1-5)
    lastReviewDate?: Timestamp;
    achievements: string[];
    feedback: string[];
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 專案角色定義
export type ProjectRole = 
  | 'project_manager'  // 專案經理
  | 'site_manager'    // 現場經理
  | 'engineer'        // 工程師
  | 'supervisor'      // 監工
  | 'contractor'      // 承包商
  | 'inspector'       // 檢查員
  | 'safety_officer'  // 安全員
  | 'quality_control' // 品管員
  | 'member'          // 成員
  | 'viewer';         // 檢視者
```

## 📋 任務相關集合

### 1. Tasks 集合
```typescript
// 任務主文件
export interface TaskDocument {
  id: string;                    // 任務唯一 ID
  projectId: string;             // 所屬專案
  name: string;                  // 任務名稱
  description?: string;          // 任務描述
  
  // 任務資訊
  taskInfo: {
    type: 'construction' | 'inspection' | 'maintenance' | 'safety' | 'quality' | 'other';
    category: string;            // 任務分類
    priority: 'low' | 'medium' | 'high' | 'urgent';
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    estimatedHours: number;      // 預估工時
    actualHours?: number;        // 實際工時
  };
  
  // 時間規劃
  schedule: {
    startDate: Timestamp;
    dueDate: Timestamp;
    actualStartDate?: Timestamp;
    actualEndDate?: Timestamp;
    dependencies: string[];       // 依賴任務 ID
  };
  
  // 分配資訊
  assignment: {
    assignedTo: string[];        // 分配給用戶 ID 列表
    assignedBy: string;          // 分配者 ID
    assignedAt: Timestamp;
    teamId?: string;             // 分配團隊 ID
  };
  
  // 任務狀態
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;             // 進度百分比 (0-100)
  
  // 檢查清單
  checklist: Array<{
    item: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: Timestamp;
  }>;
  
  // 附件
  attachments: Array<{
    type: 'document' | 'photo' | 'video' | 'audio';
    url: string;
    name: string;
    uploadedBy: string;
    uploadedAt: Timestamp;
  }>;
  
  // 位置資訊
  location?: {
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    address?: string;
  };
  
  // 品質檢查
  qualityCheck: {
    required: boolean;
    checkedBy?: string;
    checkedAt?: Timestamp;
    passed: boolean;
    notes?: string;
  };
  
  // 安全檢查
  safetyCheck: {
    required: boolean;
    checkedBy?: string;
    checkedAt?: Timestamp;
    passed: boolean;
    hazards?: string[];
    precautions?: string[];
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

## 💰 成本控制集合

### 1. Budgets 集合
```typescript
// 預算主文件
export interface BudgetDocument {
  id: string;                    // 預算唯一 ID
  projectId: string;             // 所屬專案
  name: string;                  // 預算名稱
  description?: string;          // 預算描述
  
  // 預算資訊
  budgetInfo: {
    type: 'master' | 'phase' | 'category' | 'custom';
    currency: string;
    fiscalYear?: number;
    version: number;             // 預算版本
  };
  
  // 預算金額
  amounts: {
    totalBudget: number;         // 總預算
    allocated: number;           // 已分配
    spent: number;              // 已支出
    committed: number;          // 已承諾
    available: number;          // 可用金額
  };
  
  // 預算分解
  breakdown: {
    materials: {
      budget: number;
      spent: number;
      categories: Array<{
        name: string;
        budget: number;
        spent: number;
      }>;
    };
    labor: {
      budget: number;
      spent: number;
      categories: Array<{
        role: string;
        budget: number;
        spent: number;
        hours: number;
      }>;
    };
    equipment: {
      budget: number;
      spent: number;
      categories: Array<{
        type: string;
        budget: number;
        spent: number;
      }>;
    };
    overhead: {
      budget: number;
      spent: number;
    };
    contingency: {
      budget: number;
      spent: number;
      percentage: number;
    };
  };
  
  // 預算狀態
  status: 'draft' | 'approved' | 'active' | 'closed' | 'cancelled';
  
  // 審核資訊
  approval: {
    approvedBy?: string;
    approvedAt?: Timestamp;
    approvalNotes?: string;
    requiresApproval: boolean;
  };
  
  // 變更記錄
  changes: Array<{
    changeType: 'create' | 'update' | 'adjust' | 'transfer';
    amount: number;
    reason: string;
    changedBy: string;
    changedAt: Timestamp;
    previousAmount?: number;
  }>;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

### 2. Expenses 集合
```typescript
// 支出記錄
export interface ExpenseDocument {
  id: string;                    // 支出唯一 ID
  projectId: string;             // 所屬專案
  budgetId?: string;             // 關聯預算 ID
  
  // 支出資訊
  expenseInfo: {
    type: 'material' | 'labor' | 'equipment' | 'overhead' | 'other';
    category: string;            // 支出分類
    description: string;         // 支出描述
    amount: number;              // 支出金額
    currency: string;
    quantity?: number;           // 數量
    unitPrice?: number;          // 單價
    unit?: string;               // 單位
  };
  
  // 供應商資訊
  vendor?: {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  
  // 發票資訊
  invoice?: {
    number: string;
    date: Timestamp;
    dueDate?: Timestamp;
    paid: boolean;
    paidDate?: Timestamp;
    paymentMethod?: string;
  };
  
  // 支出狀態
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  
  // 審核資訊
  approval: {
    approvedBy?: string;
    approvedAt?: Timestamp;
    approvalNotes?: string;
    requiresApproval: boolean;
  };
  
  // 附件
  attachments: Array<{
    type: 'invoice' | 'receipt' | 'contract' | 'other';
    url: string;
    name: string;
    uploadedBy: string;
    uploadedAt: Timestamp;
  }>;
  
  // 位置資訊
  location?: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

## 🔒 安全規則設計

### 1. Firestore 安全規則
```javascript
// Firestore 安全規則
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶相關規則
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.customClaims.role in ['super_admin', 'org_admin'];
    }
    
    match /userProfiles/{profileId} {
      allow read, write: if request.auth != null && 
        profileId == request.auth.uid;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.customClaims.role in ['super_admin', 'org_admin'];
    }
    
    // 組織相關規則
    match /organizations/{orgId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.customClaims.role in ['super_admin', 'org_admin'];
    }
    
    match /organizationMembers/{memberId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.customClaims.role in ['super_admin', 'org_admin'];
    }
    
    // 專案相關規則
    match /projects/{projectId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/projectMembers/$(projectId + '_' + request.auth.uid));
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/projectMembers/$(projectId + '_' + request.auth.uid)).data.permissions.canEditProject == true;
    }
    
    match /projectMembers/{memberId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.customClaims.role in ['super_admin', 'org_admin', 'project_manager'];
    }
    
    // 任務相關規則
    match /tasks/{taskId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/projectMembers/$(resource.data.projectId + '_' + request.auth.uid));
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/projectMembers/$(resource.data.projectId + '_' + request.auth.uid)).data.permissions.canManageTasks == true;
    }
    
    // 成本控制規則
    match /budgets/{budgetId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/projectMembers/$(resource.data.projectId + '_' + request.auth.uid));
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/projectMembers/$(resource.data.projectId + '_' + request.auth.uid)).data.permissions.canViewFinancials == true;
    }
    
    match /expenses/{expenseId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/projectMembers/$(resource.data.projectId + '_' + request.auth.uid));
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/projectMembers/$(resource.data.projectId + '_' + request.auth.uid)).data.permissions.canViewFinancials == true;
    }
  }
}
```

## 📊 索引策略

### 1. 複合索引配置
```typescript
// Firestore 索引配置
export const FIRESTORE_INDEXES = {
  // 用戶相關索引
  users: [
    {
      collectionGroup: 'users',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    },
    {
      collectionGroup: 'users',
      fields: [
        { fieldPath: 'customClaims.role', order: 'ASCENDING' },
        { fieldPath: 'lastLoginAt', order: 'DESCENDING' }
      ]
    }
  ],
  
  // 專案相關索引
  projects: [
    {
      collectionGroup: 'projects',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    },
    {
      collectionGroup: 'projects',
      fields: [
        { fieldPath: 'basicInfo.type', order: 'ASCENDING' },
        { fieldPath: 'timeline.startDate', order: 'ASCENDING' }
      ]
    },
    {
      collectionGroup: 'projects',
      fields: [
        { fieldPath: 'team.projectManager', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' }
      ]
    }
  ],
  
  // 任務相關索引
  tasks: [
    {
      collectionGroup: 'tasks',
      fields: [
        { fieldPath: 'projectId', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' }
      ]
    },
    {
      collectionGroup: 'tasks',
      fields: [
        { fieldPath: 'projectId', order: 'ASCENDING' },
        { fieldPath: 'schedule.dueDate', order: 'ASCENDING' }
      ]
    },
    {
      collectionGroup: 'tasks',
      fields: [
        { fieldPath: 'assignment.assignedTo', order: 'ARRAY_CONTAINS' },
        { fieldPath: 'status', order: 'ASCENDING' }
      ]
    }
  ],
  
  // 成本控制索引
  budgets: [
    {
      collectionGroup: 'budgets',
      fields: [
        { fieldPath: 'projectId', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' }
      ]
    }
  ],
  
  expenses: [
    {
      collectionGroup: 'expenses',
      fields: [
        { fieldPath: 'projectId', order: 'ASCENDING' },
        { fieldPath: 'expenseInfo.type', order: 'ASCENDING' }
      ]
    },
    {
      collectionGroup: 'expenses',
      fields: [
        { fieldPath: 'projectId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    }
  ]
} as const;
```

## ✅ AI Agent 實作檢查清單

### 資料庫設計檢查清單
- [ ] **集合結構**：清晰的集合層級和關係設計
- [ ] **文件模式**：一致的文件結構和命名規範
- [ ] **資料類型**：適當的資料類型和驗證規則
- [ ] **關聯設計**：正確的集合間關聯和引用
- [ ] **索引策略**：高效的查詢索引配置

### 安全規則檢查清單
- [ ] **認證檢查**：所有操作都需要認證
- [ ] **授權控制**：基於角色和權限的訪問控制
- [ ] **資料驗證**：輸入資料的驗證和清理
- [ ] **隱私保護**：敏感資料的保護措施
- [ ] **審計追蹤**：操作記錄和變更追蹤

### 性能優化檢查清單
- [ ] **索引優化**：查詢性能的索引配置
- [ ] **資料分頁**：大量資料的分頁處理
- [ ] **快取策略**：適當的資料快取機制
- [ ] **資料壓縮**：減少資料傳輸量
- [ ] **查詢優化**：高效的查詢語句設計

### 資料一致性檢查清單
- [ ] **事務處理**：關鍵操作的原子性保證
- [ ] **資料同步**：多端資料同步策略
- [ ] **衝突解決**：資料衝突的解決機制
- [ ] **備份策略**：資料備份和恢復機制
- [ ] **版本控制**：資料結構的版本管理

## 📚 參考資源

### 官方文件
- [Firebase Firestore 文件](https://firebase.google.com/docs/firestore)
- [Firestore 安全規則](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore 索引](https://firebase.google.com/docs/firestore/query-data/indexing)

### 最佳實踐
- [Firestore 資料建模](https://firebase.google.com/docs/firestore/data-model)
- [Firestore 性能最佳實踐](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore 安全規則最佳實踐](https://firebase.google.com/docs/firestore/security/rules-structure)

### 工具與測試
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firestore 安全規則模擬器](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Firebase CLI](https://firebase.google.com/docs/cli)

---

> **AI Agent 提示**：設計 Firebase 資料庫時，請遵循本指南的結構設計和安全規則，確保資料的一致性、安全性和性能。優先考慮查詢模式和訪問模式來設計索引。
