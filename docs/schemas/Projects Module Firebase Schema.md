# Project Module - Firebase Schema

## 概述
Project Module Firebase Firestore 資料庫架構設計，採用 DDD 原則確保資料一致性和高效能查詢。

## 集合結構

### 1. 專案集合
```typescript
interface ProjectDocument {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  startDate: Timestamp;
  endDate: Timestamp;
  budget: number;
  progress: number;
  teamMembers: string[];
  settings: {
    timezone: string;
    currency: string;
    notifications: boolean;
  };
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    updatedBy: string;
  };
}
```

### 2. 任務集合
```typescript
interface TaskDocument {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId: string;
  dueDate: Timestamp;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    updatedBy: string;
  };
}
```

### 3. 團隊成員集合
```typescript
interface TeamMemberDocument {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'manager' | 'member' | 'viewer';
  permissions: string[];
  joinedAt: Timestamp;
  status: 'active' | 'inactive';
  metadata: {
    lastActiveAt: Timestamp;
    profile: {
      displayName: string;
      email: string;
      avatar?: string;
    };
  };
}
```

## 安全規則

### Firestore 安全規則
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 專案集合規則
    match /projects/{projectId} {
      allow read: if isProjectMember(projectId);
      allow create: if isAuthenticated();
      allow update: if isProjectManager(projectId);
      allow delete: if isProjectOwner(projectId);
      
      // 任務子集合
      match /tasks/{taskId} {
        allow read: if isProjectMember(projectId);
        allow create: if isProjectMember(projectId);
        allow update: if isProjectMember(projectId);
        allow delete: if isProjectManager(projectId);
      }
      
      // 團隊成員子集合
      match /members/{memberId} {
        allow read: if isProjectMember(projectId);
        allow create: if isProjectManager(projectId);
        allow update: if isProjectManager(projectId);
        allow delete: if isProjectManager(projectId);
      }
    }
  }
  
  function isAuthenticated() {
    return request.auth != null;
  }
  
  function isProjectMember(projectId) {
    return isAuthenticated() && 
           exists(/databases/$(database)/documents/projects/$(projectId)/members/$(request.auth.uid));
  }
  
  function isProjectManager(projectId) {
    return isAuthenticated() && 
           get(/databases/$(database)/documents/projects/$(projectId)/members/$(request.auth.uid)).data.role in ['manager', 'owner'];
  }
  
  function isProjectOwner(projectId) {
    return isAuthenticated() && 
           get(/databases/$(database)/documents/projects/$(projectId)/members/$(request.auth.uid)).data.role == 'owner';
  }
}
```

## 查詢模式

### 1. 專案查詢
```typescript
// 獲取用戶的專案
async getUserProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(this.firestore, 'projects'),
    where('teamMembers', 'array-contains', userId),
    where('status', '!=', 'cancelled'),
    orderBy('metadata.createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Project));
}

// 搜尋專案
async searchProjects(searchTerm: string): Promise<Project[]> {
  const q = query(
    collection(this.firestore, 'projects'),
    where('status', '==', 'active'),
    orderBy('name', 'asc')
  );
  
  const snapshot = await getDocs(q);
  const projects = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Project));
  
  // 客戶端過濾
  return projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
```

### 2. 任務查詢
```typescript
// 獲取專案任務
async getProjectTasks(projectId: string): Promise<Task[]> {
  const q = query(
    collection(this.firestore, 'projects', projectId, 'tasks'),
    orderBy('metadata.createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Task));
}

// 獲取用戶任務
async getUserTasks(userId: string): Promise<Task[]> {
  const q = query(
    collectionGroup(this.firestore, 'tasks'),
    where('assigneeId', '==', userId),
    where('status', '!=', 'completed'),
    orderBy('dueDate', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Task));
}
```

## 相關文件
- [Project Module 架構](./Architecture/Project%20Module.md)
- [Project Module API 合約](./Api%20Contracts.md)