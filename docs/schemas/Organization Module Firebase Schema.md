# Organization Module - Firebase Schema

## 概述

Organization Module 的 Firebase Firestore 資料庫架構設計，採用 DDD（Domain-Driven Design）原則，確保資料一致性、可擴展性和高效能查詢。

## 資料庫架構

### 1. 集合結構設計

#### 主要集合

```typescript
// 組織集合
interface OrganizationDocument {
  id: string;                    // 組織 ID
  name: string;                  // 組織名稱
  description: string;          // 組織描述
  logo?: string;                // 組織 Logo URL
  website?: string;             // 組織網站
  email: string;                // 聯絡信箱
  phone?: string;               // 聯絡電話
  address: {                    // 組織地址
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  status: 'active' | 'inactive' | 'suspended';  // 組織狀態
  settings: {                   // 組織設定
    timezone: string;
    language: string;
    currency: string;
    dateFormat: string;
  };
  metadata: {                   // 元資料
    memberCount: number;        // 成員數量
    teamCount: number;          // 團隊數量
    projectCount: number;       // 專案數量
    createdAt: Timestamp;      // 建立時間
    updatedAt: Timestamp;      // 更新時間
    createdBy: string;          // 建立者 ID
    updatedBy: string;          // 更新者 ID
  };
}

// 組織成員集合
interface OrganizationMemberDocument {
  id: string;                   // 成員 ID
  organizationId: string;      // 所屬組織 ID
  userId: string;              // 用戶 ID
  role: 'owner' | 'admin' | 'member' | 'viewer';  // 組織角色
  permissions: string[];       // 權限列表
  status: 'active' | 'inactive' | 'pending';      // 成員狀態
  joinedAt: Timestamp;         // 加入時間
  invitedBy: string;           // 邀請者 ID
  metadata: {
    lastActiveAt: Timestamp;   // 最後活躍時間
    profile: {                 // 成員資料
      displayName: string;
      email: string;
      avatar?: string;
      department?: string;
      position?: string;
    };
  };
}

// 組織團隊集合
interface OrganizationTeamDocument {
  id: string;                   // 團隊 ID
  organizationId: string;      // 所屬組織 ID
  name: string;                // 團隊名稱
  description: string;         // 團隊描述
  leaderId: string;            // 團隊領導者 ID
  members: string[];           // 團隊成員 ID 列表
  settings: {                  // 團隊設定
    isPrivate: boolean;        // 是否為私有團隊
    allowMemberInvite: boolean; // 是否允許成員邀請
    notificationSettings: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  metadata: {
    memberCount: number;       // 成員數量
    projectCount: number;      // 專案數量
    createdAt: Timestamp;     // 建立時間
    updatedAt: Timestamp;     // 更新時間
    createdBy: string;         // 建立者 ID
  };
}
```

### 2. 子集合設計

#### 組織成員子集合

```typescript
// 組織文檔下的成員子集合
// 路徑: /organizations/{organizationId}/members/{memberId}
interface OrganizationMemberSubcollection {
  id: string;                   // 成員 ID
  userId: string;              // 用戶 ID
  role: string;                // 角色
  permissions: string[];       // 權限
  status: string;              // 狀態
  joinedAt: Timestamp;         // 加入時間
  invitedBy: string;           // 邀請者
  metadata: {
    lastActiveAt: Timestamp;
    profile: {
      displayName: string;
      email: string;
      avatar?: string;
      department?: string;
      position?: string;
    };
  };
}
```

#### 組織團隊子集合

```typescript
// 組織文檔下的團隊子集合
// 路徑: /organizations/{organizationId}/teams/{teamId}
interface OrganizationTeamSubcollection {
  id: string;                   // 團隊 ID
  name: string;                // 團隊名稱
  description: string;         // 團隊描述
  leaderId: string;            // 領導者 ID
  members: string[];           // 成員列表
  settings: {
    isPrivate: boolean;
    allowMemberInvite: boolean;
    notificationSettings: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  metadata: {
    memberCount: number;
    projectCount: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
  };
}
```

### 3. 索引配置

#### 複合索引

```json
{
  "indexes": [
    {
      "collectionGroup": "organizations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "organizations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "metadata.memberCount", "order": "DESCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "organizationMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "joinedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "organizationMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "organizationTeams",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "organizationTeams",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "leaderId", "order": "ASCENDING" },
        { "fieldPath": "metadata.memberCount", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## 安全規則

### 1. 組織集合安全規則

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 組織集合規則
    match /organizations/{organizationId} {
      // 讀取權限：組織成員可以讀取
      allow read: if isOrganizationMember(organizationId);
      
      // 建立權限：認證用戶可以建立組織
      allow create: if isAuthenticated() && 
                       request.auth.uid == resource.data.metadata.createdBy;
      
      // 更新權限：組織管理員可以更新
      allow update: if isOrganizationAdmin(organizationId);
      
      // 刪除權限：組織擁有者可以刪除
      allow delete: if isOrganizationOwner(organizationId);
      
      // 組織成員子集合
      match /members/{memberId} {
        allow read: if isOrganizationMember(organizationId);
        allow create: if isOrganizationAdmin(organizationId);
        allow update: if isOrganizationAdmin(organizationId) || 
                         (isOrganizationMember(organizationId) && 
                          request.auth.uid == resource.data.userId);
        allow delete: if isOrganizationAdmin(organizationId);
      }
      
      // 組織團隊子集合
      match /teams/{teamId} {
        allow read: if isOrganizationMember(organizationId);
        allow create: if isOrganizationAdmin(organizationId);
        allow update: if isOrganizationAdmin(organizationId) || 
                         isTeamLeader(organizationId, teamId);
        allow delete: if isOrganizationAdmin(organizationId);
        
        // 團隊成員子集合
        match /members/{teamMemberId} {
          allow read: if isOrganizationMember(organizationId);
          allow create: if isTeamLeader(organizationId, teamId);
          allow update: if isTeamLeader(organizationId, teamId);
          allow delete: if isTeamLeader(organizationId, teamId);
        }
      }
    }
  }
  
  // 輔助函數
  function isAuthenticated() {
    return request.auth != null;
  }
  
  function isOrganizationMember(organizationId) {
    return isAuthenticated() && 
           exists(/databases/$(database)/documents/organizations/$(organizationId)/members/$(request.auth.uid));
  }
  
  function isOrganizationAdmin(organizationId) {
    return isAuthenticated() && 
           get(/databases/$(database)/documents/organizations/$(organizationId)/members/$(request.auth.uid)).data.role in ['admin', 'owner'];
  }
  
  function isOrganizationOwner(organizationId) {
    return isAuthenticated() && 
           get(/databases/$(database)/documents/organizations/$(organizationId)/members/$(request.auth.uid)).data.role == 'owner';
  }
  
  function isTeamLeader(organizationId, teamId) {
    return isAuthenticated() && 
           get(/databases/$(database)/documents/organizations/$(organizationId)/teams/$(teamId)).data.leaderId == request.auth.uid;
  }
}
```

### 2. 資料驗證規則

```javascript
// 組織文檔驗證
function validateOrganization(data) {
  return data.keys().hasAll(['name', 'description', 'email', 'address', 'status', 'settings', 'metadata']) &&
         data.name is string && data.name.size() > 0 &&
         data.description is string &&
         data.email is string && data.email.matches('.*@.*\\..*') &&
         data.status in ['active', 'inactive', 'suspended'] &&
         data.address.keys().hasAll(['street', 'city', 'state', 'country', 'postalCode']) &&
         data.settings.keys().hasAll(['timezone', 'language', 'currency', 'dateFormat']) &&
         data.metadata.keys().hasAll(['memberCount', 'teamCount', 'projectCount', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']);
}

// 組織成員文檔驗證
function validateOrganizationMember(data) {
  return data.keys().hasAll(['organizationId', 'userId', 'role', 'permissions', 'status', 'joinedAt', 'invitedBy', 'metadata']) &&
         data.organizationId is string &&
         data.userId is string &&
         data.role in ['owner', 'admin', 'member', 'viewer'] &&
         data.permissions is list &&
         data.status in ['active', 'inactive', 'pending'] &&
         data.joinedAt is timestamp &&
         data.invitedBy is string;
}
```

## 查詢模式

### 1. 基本查詢

```typescript
// 組織服務查詢方法
export class OrganizationFirestoreService {
  constructor(private firestore: Firestore) {}

  // 獲取所有啟用的組織
  async getActiveOrganizations(): Promise<Organization[]> {
    const q = query(
      collection(this.firestore, 'organizations'),
      where('status', '==', 'active'),
      orderBy('metadata.createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Organization));
  }

  // 根據成員數量排序組織
  async getOrganizationsByMemberCount(): Promise<Organization[]> {
    const q = query(
      collection(this.firestore, 'organizations'),
      where('status', '==', 'active'),
      orderBy('metadata.memberCount', 'desc'),
      orderBy('name', 'asc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Organization));
  }

  // 搜尋組織
  async searchOrganizations(searchTerm: string): Promise<Organization[]> {
    // 注意：Firestore 不支援全文搜尋，需要實作客戶端過濾
    const q = query(
      collection(this.firestore, 'organizations'),
      where('status', '==', 'active'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const organizations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Organization));
    
    // 客戶端過濾
    return organizations.filter(org => 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
```

### 2. 子集合查詢

```typescript
// 組織成員查詢
export class OrganizationMemberService {
  constructor(private firestore: Firestore) {}

  // 獲取組織的所有成員
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const q = query(
      collection(this.firestore, `organizations/${organizationId}/members`),
      where('status', '==', 'active'),
      orderBy('joinedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OrganizationMember));
  }

  // 獲取用戶的所有組織
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const q = query(
      collection(this.firestore, 'organizationMembers'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const memberDocs = snapshot.docs.map(doc => doc.data() as OrganizationMember);
    
    // 獲取組織詳情
    const organizationPromises = memberDocs.map(member => 
      getDoc(doc(this.firestore, 'organizations', member.organizationId))
    );
    
    const organizationSnapshots = await Promise.all(organizationPromises);
    return organizationSnapshots
      .filter(snapshot => snapshot.exists())
      .map(snapshot => ({
        id: snapshot.id,
        ...snapshot.data()
      } as Organization));
  }
}
```

### 3. 即時監聽

```typescript
// 即時監聽組織變更
export class OrganizationRealtimeService {
  constructor(private firestore: Firestore) {}

  // 監聽組織列表變更
  listenToOrganizations(): Observable<Organization[]> {
    const q = query(
      collection(this.firestore, 'organizations'),
      where('status', '==', 'active'),
      orderBy('metadata.createdAt', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<Organization[]>;
  }

  // 監聽特定組織變更
  listenToOrganization(organizationId: string): Observable<Organization | null> {
    const docRef = doc(this.firestore, 'organizations', organizationId);
    return docData(docRef, { idField: 'id' }) as Observable<Organization | null>;
  }

  // 監聽組織成員變更
  listenToOrganizationMembers(organizationId: string): Observable<OrganizationMember[]> {
    const q = query(
      collection(this.firestore, `organizations/${organizationId}/members`),
      where('status', '==', 'active'),
      orderBy('joinedAt', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<OrganizationMember[]>;
  }
}
```

## 資料遷移

### 1. 版本控制

```typescript
// 資料庫版本管理
interface DatabaseVersion {
  version: string;
  migrationDate: Timestamp;
  description: string;
  changes: string[];
}

// 版本遷移服務
export class DatabaseMigrationService {
  private readonly currentVersion = '1.2.0';
  
  async migrateToLatest(): Promise<void> {
    const versionDoc = await getDoc(doc(this.firestore, '_system', 'version'));
    const currentDbVersion = versionDoc.exists() ? versionDoc.data()?.version : '1.0.0';
    
    if (currentDbVersion !== this.currentVersion) {
      await this.runMigrations(currentDbVersion, this.currentVersion);
    }
  }
  
  private async runMigrations(fromVersion: string, toVersion: string): Promise<void> {
    const migrations = this.getMigrations(fromVersion, toVersion);
    
    for (const migration of migrations) {
      await migration.execute();
    }
    
    // 更新版本號
    await setDoc(doc(this.firestore, '_system', 'version'), {
      version: toVersion,
      migrationDate: serverTimestamp(),
      description: `Migrated from ${fromVersion} to ${toVersion}`
    });
  }
}
```

### 2. 資料清理

```typescript
// 資料清理服務
export class DataCleanupService {
  constructor(private firestore: Firestore) {}

  // 清理無效的組織成員
  async cleanupInvalidMembers(): Promise<void> {
    const batch = writeBatch(this.firestore);
    
    // 獲取所有組織
    const organizationsSnapshot = await getDocs(collection(this.firestore, 'organizations'));
    
    for (const orgDoc of organizationsSnapshot.docs) {
      const membersSnapshot = await getDocs(
        collection(this.firestore, `organizations/${orgDoc.id}/members`)
      );
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        
        // 檢查用戶是否存在
        const userDoc = await getDoc(doc(this.firestore, 'users', memberData.userId));
        if (!userDoc.exists()) {
          batch.delete(memberDoc.ref);
        }
      }
    }
    
    await batch.commit();
  }
}
```

## 效能優化

### 1. 快取策略

```typescript
// Firestore 快取配置
export const FIRESTORE_CACHE_CONFIG = {
  // 啟用離線持久化
  enablePersistence: true,
  
  // 快取設定
  cacheSettings: {
    // 快取大小限制 (100MB)
    cacheSizeBytes: 100 * 1024 * 1024,
    
    // 快取策略
    cacheStrategy: 'persistent'
  }
};

// 快取服務
export class FirestoreCacheService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分鐘

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 2. 批次操作

```typescript
// 批次操作服務
export class BatchOperationService {
  constructor(private firestore: Firestore) {}

  // 批次建立組織和初始成員
  async createOrganizationWithInitialMember(
    organizationData: Partial<Organization>,
    memberData: Partial<OrganizationMember>
  ): Promise<void> {
    const batch = writeBatch(this.firestore);
    
    // 建立組織文檔
    const orgRef = doc(collection(this.firestore, 'organizations'));
    batch.set(orgRef, {
      ...organizationData,
      metadata: {
        memberCount: 1,
        teamCount: 0,
        projectCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: memberData.userId,
        updatedBy: memberData.userId
      }
    });
    
    // 建立初始成員文檔
    const memberRef = doc(collection(this.firestore, 'organizations', orgRef.id, 'members'));
    batch.set(memberRef, {
      ...memberData,
      organizationId: orgRef.id,
      role: 'owner',
      status: 'active',
      joinedAt: serverTimestamp(),
      invitedBy: memberData.userId,
      metadata: {
        lastActiveAt: serverTimestamp(),
        profile: memberData.metadata?.profile || {}
      }
    });
    
    await batch.commit();
  }
}
```

## 監控和日誌

### 1. 效能監控

```typescript
// Firestore 效能監控
export class FirestorePerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  // 記錄查詢時間
  recordQueryTime(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const times = this.metrics.get(operation)!;
    times.push(duration);
    
    // 保持最近100次記錄
    if (times.length > 100) {
      times.shift();
    }
  }

  // 獲取平均查詢時間
  getAverageQueryTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  // 獲取效能報告
  getPerformanceReport(): Record<string, { average: number; count: number }> {
    const report: Record<string, { average: number; count: number }> = {};
    
    for (const [operation, times] of this.metrics.entries()) {
      report[operation] = {
        average: this.getAverageQueryTime(operation),
        count: times.length
      };
    }
    
    return report;
  }
}
```

## 相關文件

- [Firebase Firestore 官方文件](https://firebase.google.com/docs/firestore)
- [Firestore 安全規則](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore 索引](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Organization Module 架構文件](./Architecture/Organization%20Module.md)
- [Organization Module 狀態管理](./State%20Management.md)
