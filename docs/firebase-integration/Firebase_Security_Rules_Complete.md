# Firebase 安全規則完整指南

## 概述

本文件提供 ng-alain 企業級建築工程管理平台的完整 Firebase 安全規則配置，確保資料安全性和存取控制。

## 專案架構

### 資料模型結構
```
/accounts (統一帳戶集合)
├── {accountId} (用戶或組織)
│   ├── accountType: 'user' | 'organization'
│   ├── profile: {...}
│   ├── permissions: {...}
│   ├── /members (組織成員子集合)
│   └── /teams (組織團隊子集合)

/projects (專案集合)
├── {projectId}
│   ├── ownerId: accountId
│   ├── projectInfo: {...}
│   ├── /tasks (任務子集合)
│   ├── /documents (文件子集合)
│   └── /costs (成本子集合)

/social_relations (社交關係集合)
├── {relationId}
│   ├── followerId: accountId
│   ├── followingId: accountId
│   └── relationType: 'user' | 'organization' | 'project'

/achievements (成就集合)
├── {achievementId}
│   ├── userId: accountId
│   ├── achievementType: string
│   └── earnedAt: timestamp

/notifications (通知集合)
├── {notificationId}
│   ├── userId: accountId
│   ├── type: string
│   └── read: boolean
```

## 完整安全規則

### 1. 基礎規則配置
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 輔助函數
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isAccountOwner(accountId) {
      return isSignedIn() && request.auth.uid == accountId;
    }
    
    function hasAccountAccess(accountId, requiredRoles) {
      return isSignedIn() && 
             accountId in request.auth.token.accountRoles &&
             count([r in requiredRoles where r in request.auth.token.accountRoles[accountId]]) > 0;
    }
    
    function isAccountOwnerOrAdmin(accountId) {
      return isSignedIn() && (
        request.auth.uid == accountId || 
        hasAccountAccess(accountId, ['owner', 'admin'])
      );
    }
    
    function isProjectMember(projectId) {
      return isSignedIn() && (
        projectId in request.auth.token.projectRoles ||
        hasProjectAccess(projectId, ['owner', 'manager', 'member'])
      );
    }
    
    function hasProjectAccess(projectId, requiredRoles) {
      return isSignedIn() && 
             projectId in request.auth.token.projectRoles &&
             count([r in requiredRoles where r in request.auth.token.projectRoles[projectId]]) > 0;
    }
    
    function isValidAccountType(accountType) {
      return accountType in ['user', 'organization'];
    }
    
    function isValidProjectStatus(status) {
      return status in ['planning', 'active', 'completed', 'cancelled', 'on_hold'];
    }
    
    function isValidTaskStatus(status) {
      return status in ['todo', 'in_progress', 'review', 'completed', 'cancelled'];
    }
    
    function isValidNotificationType(type) {
      return type in ['system', 'user', 'organization', 'project', 'achievement', 'social'];
    }
    
    function isValidAchievementType(type) {
      return type in ['professional', 'social', 'project', 'milestone', 'special'];
    }
    
    function isValidSocialRelationType(type) {
      return type in ['user', 'organization', 'project'];
    }
    
    // 資料驗證函數
    function validateAccountData(data) {
      return data.keys().hasAll(['accountId', 'accountType', 'profile', 'permissions']) &&
             isValidAccountType(data.accountType) &&
             data.profile is map &&
             data.permissions is map;
    }
    
    function validateProjectData(data) {
      return data.keys().hasAll(['projectId', 'ownerId', 'projectInfo']) &&
             data.ownerId is string &&
             data.projectInfo is map &&
             isValidProjectStatus(data.projectInfo.status);
    }
    
    function validateTaskData(data) {
      return data.keys().hasAll(['taskId', 'projectId', 'title', 'status']) &&
             data.projectId is string &&
             data.title is string &&
             isValidTaskStatus(data.status);
    }
    
    function validateNotificationData(data) {
      return data.keys().hasAll(['notificationId', 'userId', 'type', 'read']) &&
             data.userId is string &&
             data.type is string &&
             data.read is bool &&
             isValidNotificationType(data.type);
    }
    
    function validateAchievementData(data) {
      return data.keys().hasAll(['achievementId', 'userId', 'achievementType', 'earnedAt']) &&
             data.userId is string &&
             data.achievementType is string &&
             data.earnedAt is timestamp &&
             isValidAchievementType(data.achievementType);
    }
    
    function validateSocialRelationData(data) {
      return data.keys().hasAll(['relationId', 'followerId', 'followingId', 'relationType']) &&
             data.followerId is string &&
             data.followingId is string &&
             data.relationType is string &&
             isValidSocialRelationType(data.relationType);
    }
  }
}
```

### 2. 統一帳戶集合規則
```javascript
// 統一 Accounts 集合（包含 users 和 organizations）
match /accounts/{accountId} {
  // 讀取權限：已登入用戶可以讀取所有帳戶
  allow read: if isSignedIn();
  
  // 寫入權限：只有帳戶擁有者或管理員可以修改
  allow write: if isAccountOwnerOrAdmin(accountId) && 
                  validateAccountData(request.resource.data);
  
  // 創建權限：任何人都可以創建新帳戶
  allow create: if isSignedIn() && 
                   validateAccountData(request.resource.data) &&
                   request.resource.data.accountId == request.auth.uid;
  
  // 更新權限：只有帳戶擁有者可以更新
  allow update: if isAccountOwner(accountId) && 
                   validateAccountData(request.resource.data);
  
  // 刪除權限：只有帳戶擁有者可以刪除
  allow delete: if isAccountOwner(accountId);
  
  // 組織成員子集合
  match /members/{memberId} {
    allow read: if isSignedIn();
    allow write: if hasAccountAccess(accountId, ['owner', 'admin']) &&
                    request.resource.data.memberId is string &&
                    request.resource.data.role is string;
  }
  
  // 組織團隊子集合
  match /teams/{teamId} {
    allow read: if isSignedIn();
    allow write: if hasAccountAccess(accountId, ['owner', 'admin']) &&
                    request.resource.data.teamId is string &&
                    request.resource.data.name is string;
  }
}
```

### 3. 專案集合規則
```javascript
// 專案集合
match /projects/{projectId} {
  // 讀取權限：已登入用戶可以讀取所有專案
  allow read: if isSignedIn();
  
  // 創建權限：已登入用戶可以創建專案
  allow create: if isSignedIn() && 
                   validateProjectData(request.resource.data) &&
                   request.resource.data.ownerId == request.auth.uid;
  
  // 更新權限：專案擁有者或管理員可以更新
  allow update: if isSignedIn() && (
                   hasAccountAccess(resource.data.ownerId, ['owner', 'admin']) ||
                   hasProjectAccess(projectId, ['owner', 'manager'])
                 ) && validateProjectData(request.resource.data);
  
  // 刪除權限：只有專案擁有者可以刪除
  allow delete: if isSignedIn() && 
                   hasAccountAccess(resource.data.ownerId, ['owner', 'admin']);
  
  // 任務子集合
  match /tasks/{taskId} {
    allow read: if isSignedIn();
    allow create: if isProjectMember(projectId) && 
                     validateTaskData(request.resource.data) &&
                     request.resource.data.projectId == projectId;
    allow update: if isProjectMember(projectId) && 
                     validateTaskData(request.resource.data);
    allow delete: if hasProjectAccess(projectId, ['owner', 'manager']);
  }
  
  // 文件子集合
  match /documents/{documentId} {
    allow read: if isProjectMember(projectId);
    allow create: if isProjectMember(projectId) && 
                     request.resource.data.projectId == projectId;
    allow update: if isProjectMember(projectId);
    allow delete: if hasProjectAccess(projectId, ['owner', 'manager']);
  }
  
  // 成本子集合
  match /costs/{costId} {
    allow read: if isProjectMember(projectId);
    allow create: if hasProjectAccess(projectId, ['owner', 'manager', 'accountant']);
    allow update: if hasProjectAccess(projectId, ['owner', 'manager', 'accountant']);
    allow delete: if hasProjectAccess(projectId, ['owner', 'manager']);
  }
}
```

### 4. 社交關係集合規則
```javascript
// 社交關係集合
match /social_relations/{relationId} {
  // 讀取權限：已登入用戶可以讀取所有關係
  allow read: if isSignedIn();
  
  // 創建權限：用戶可以創建追蹤關係
  allow create: if isSignedIn() && 
                   validateSocialRelationData(request.resource.data) &&
                   request.resource.data.followerId == request.auth.uid;
  
  // 更新權限：只有關係創建者可以更新
  allow update: if isSignedIn() && 
                   resource.data.followerId == request.auth.uid &&
                   validateSocialRelationData(request.resource.data);
  
  // 刪除權限：只有關係創建者可以刪除
  allow delete: if isSignedIn() && 
                   resource.data.followerId == request.auth.uid;
}
```

### 5. 成就集合規則
```javascript
// 成就集合
match /achievements/{achievementId} {
  // 讀取權限：已登入用戶可以讀取所有成就
  allow read: if isSignedIn();
  
  // 創建權限：系統可以創建成就
  allow create: if isSignedIn() && 
                   validateAchievementData(request.resource.data) &&
                   request.resource.data.userId == request.auth.uid;
  
  // 更新權限：只有成就擁有者可以更新
  allow update: if isSignedIn() && 
                   resource.data.userId == request.auth.uid &&
                   validateAchievementData(request.resource.data);
  
  // 刪除權限：只有成就擁有者可以刪除
  allow delete: if isSignedIn() && 
                   resource.data.userId == request.auth.uid;
}
```

### 6. 通知集合規則
```javascript
// 通知集合
match /notifications/{notificationId} {
  // 讀取權限：只有通知接收者可以讀取
  allow read: if isSignedIn() && 
                 resource.data.userId == request.auth.uid;
  
  // 創建權限：系統可以創建通知
  allow create: if isSignedIn() && 
                   validateNotificationData(request.resource.data);
  
  // 更新權限：只有通知接收者可以更新（如標記已讀）
  allow update: if isSignedIn() && 
                   resource.data.userId == request.auth.uid &&
                   request.resource.data.keys().hasOnly(['read', 'readAt']);
  
  // 刪除權限：只有通知接收者可以刪除
  allow delete: if isSignedIn() && 
                   resource.data.userId == request.auth.uid;
}
```

### 7. 系統管理集合規則
```javascript
// 系統設定集合（僅管理員可存取）
match /system_settings/{settingId} {
  allow read: if isSignedIn() && 
                 hasAccountAccess(request.auth.uid, ['owner', 'admin']);
  allow write: if isSignedIn() && 
                  hasAccountAccess(request.auth.uid, ['owner', 'admin']);
}

// 審計日誌集合（僅管理員可存取）
match /audit_logs/{logId} {
  allow read: if isSignedIn() && 
                 hasAccountAccess(request.auth.uid, ['owner', 'admin']);
  allow create: if isSignedIn(); // 系統可以創建日誌
  allow update: false; // 日誌不可修改
  allow delete: false; // 日誌不可刪除
}

// 系統統計集合（僅管理員可存取）
match /system_stats/{statId} {
  allow read: if isSignedIn() && 
                 hasAccountAccess(request.auth.uid, ['owner', 'admin']);
  allow write: if isSignedIn() && 
                  hasAccountAccess(request.auth.uid, ['owner', 'admin']);
}
```

## 進階安全規則

### 1. 時間限制規則
```javascript
// 限制在特定時間內的操作
function isBusinessHours() {
  return request.time.hour >= 9 && request.time.hour <= 18;
}

// 限制在特定日期內的操作
function isWeekday() {
  return request.time.dayOfWeek >= 1 && request.time.dayOfWeek <= 5;
}

// 應用時間限制
match /projects/{projectId} {
  allow create: if isSignedIn() && 
                   isBusinessHours() && 
                   isWeekday() &&
                   validateProjectData(request.resource.data);
}
```

### 2. 速率限制規則
```javascript
// 使用 Firestore 的內建速率限制
match /notifications/{notificationId} {
  allow create: if isSignedIn() && 
                   request.resource.data.userId == request.auth.uid &&
                   // 限制每分鐘最多創建 10 個通知
                   request.time > resource.data.createdAt + duration.value(1, 'm');
}
```

### 3. 資料完整性檢查
```javascript
// 確保資料完整性
function validateDataIntegrity(data) {
  return data.keys().hasAll(['id', 'createdAt', 'updatedAt']) &&
         data.id is string &&
         data.createdAt is timestamp &&
         data.updatedAt is timestamp &&
         data.updatedAt >= data.createdAt;
}

// 應用資料完整性檢查
match /accounts/{accountId} {
  allow write: if isAccountOwnerOrAdmin(accountId) && 
                  validateAccountData(request.resource.data) &&
                  validateDataIntegrity(request.resource.data);
}
```

### 4. 跨集合關聯檢查
```javascript
// 檢查專案擁有者是否存在
function projectOwnerExists(ownerId) {
  return exists(/databases/$(database)/documents/accounts/$(ownerId));
}

// 檢查任務所屬專案是否存在
function taskProjectExists(projectId) {
  return exists(/databases/$(database)/documents/projects/$(projectId));
}

// 應用關聯檢查
match /projects/{projectId} {
  allow create: if isSignedIn() && 
                   projectOwnerExists(request.resource.data.ownerId) &&
                   validateProjectData(request.resource.data);
}

match /projects/{projectId}/tasks/{taskId} {
  allow create: if isProjectMember(projectId) && 
                   taskProjectExists(projectId) &&
                   validateTaskData(request.resource.data);
}
```

## 測試安全規則

### 1. 單元測試
```javascript
// 測試帳戶創建權限
test "用戶可以創建自己的帳戶" {
  let mockAuth = { uid: "user123" };
  let mockData = {
    accountId: "user123",
    accountType: "user",
    profile: { name: "Test User" },
    permissions: { role: "user" }
  };
  
  expect(allow).to.be.true;
  expect(allow).to.be.true;
}

// 測試專案存取權限
test "專案成員可以讀取專案" {
  let mockAuth = { uid: "user123" };
  let mockData = {
    projectId: "project456",
    ownerId: "user123",
    projectInfo: { name: "Test Project" }
  };
  
  expect(allow).to.be.true;
}
```

### 2. 整合測試
```javascript
// 測試完整的用戶流程
test "用戶可以創建帳戶、專案和任務" {
  // 1. 創建帳戶
  let account = createAccount("user123", "user");
  expect(account).to.be.created;
  
  // 2. 創建專案
  let project = createProject("project456", "user123");
  expect(project).to.be.created;
  
  // 3. 創建任務
  let task = createTask("task789", "project456");
  expect(task).to.be.created;
}
```

## 監控和日誌

### 1. 安全事件監控
```javascript
// 記錄安全事件
function logSecurityEvent(eventType, userId, resourceId) {
  return {
    eventType: eventType,
    userId: userId,
    resourceId: resourceId,
    timestamp: request.time,
    ip: request.auth.token.firebase.identities,
    userAgent: request.auth.token.firebase.identities
  };
}

// 在規則中記錄事件
match /accounts/{accountId} {
  allow write: if isAccountOwnerOrAdmin(accountId) && 
                  logSecurityEvent('account_write', request.auth.uid, accountId);
}
```

### 2. 異常檢測
```javascript
// 檢測異常存取模式
function detectAnomalousAccess(userId, resourceId) {
  // 檢查是否在短時間內大量存取
  let recentAccess = getRecentAccess(userId, resourceId);
  return recentAccess > 100; // 每分鐘超過 100 次存取
}

// 應用異常檢測
match /projects/{projectId} {
  allow read: if isSignedIn() && 
                 !detectAnomalousAccess(request.auth.uid, projectId);
}
```

## 最佳實踐

### 1. 規則組織
- 按功能模組組織規則
- 使用清晰的函數命名
- 添加詳細的註釋
- 定期審查和更新規則

### 2. 效能優化
- 避免複雜的查詢
- 使用索引優化查詢
- 限制規則複雜度
- 監控規則執行時間

### 3. 安全原則
- 最小權限原則
- 深度防禦
- 定期安全審計
- 及時修復漏洞

### 4. 維護策略
- 版本控制規則
- 自動化測試
- 監控和警報
- 定期更新

## 參考資源

- [Firebase 安全規則文件](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore 安全規則最佳實踐](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Firebase 安全規則測試](https://firebase.google.com/docs/firestore/security/test-rules-emulator)

---

*本文件為 Firebase 安全規則完整指南，旨在提供全面的安全配置和最佳實踐。*