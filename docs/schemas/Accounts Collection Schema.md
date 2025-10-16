# Firestore Collection: accounts

## Collection Path
```
/accounts/{accountId}
```

## Document Structure

```typescript
interface AccountDocument {
  // 識別
  accountId: string;
  accountType: 'user' | 'organization';
  
  // 通用檔案
  profile: {
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    timezone: string;
    language: string;
  };
  
  // 權限集合
  permissions: {
    roles: string[];
    capabilities: string[];
    organizationRoles?: { [organizationId: string]: string[] };
    projectRoles?: { [projectId: string]: string[] };
  };
  
  // 通用設定
  settings: {
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    preferences: UserPreferences;
  };
  
  // 擁有的專案
  projectsOwned: string[];          // Project IDs
  
  // User 特定欄位 (accountType='user')
  certificates?: {
    licenseId: string;
    name: string;
    issuer: string;
    issueDate: Timestamp;
    expiryDate?: Timestamp;
    certificateUrl?: string;
  }[];
  
  socialRelations?: {
    following: string[];            // Account IDs
    followers: string[];            // Account IDs
    starredProjects: string[];      // Project IDs
    achievements: {
      achievementId: string;
      name: string;
      description: string;
      iconUrl: string;
      earnedAt: Timestamp;
    }[];
  };
  
  // Organization 特定欄位 (accountType='organization')
  businessLicense?: {
    licenseNumber: string;
    companyName: string;
    issueDate: Timestamp;
    expiryDate: Timestamp;
    licenseUrl?: string;
  };
  
  // 時間戳
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

## Sub-collection: notifications

```
/accounts/{accountId}/notifications/{notificationId}
```

```typescript
interface NotificationDocument {
  notificationId: string;
  type: 'follow' | 'achievement' | 'project' | 'team' | 'task';
  title: string;
  message: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: Timestamp;
}
```

## 索引需求

```javascript
// firestore.indexes.json
{
  "indexes": [
    // 1. 按名稱搜尋
    {
      "collectionGroup": "accounts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "profile.name", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // 2. 按帳戶類型篩選
    {
      "collectionGroup": "accounts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "accountType", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // 3. 按證照篩選 (User 特定)
    {
      "collectionGroup": "accounts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "certificates.name", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // 4. 通知查詢
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isRead", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Security Rules

```javascript
// firestore.rules
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

    // 統一 Accounts 集合
    match /accounts/{accountId} {
      allow read: if isSignedIn();
      allow write: if isAccountOwnerOrAdmin(accountId);
      
      // 通知子集合
      match /notifications/{notificationId} {
        allow read, write: if isSignedIn() && request.auth.uid == accountId;
      }
    }
  }
}
```

## 範例 JSON

```json
{
  "accountId": "account_1710921600000_abc123",
  "accountType": "user",
  
  "profile": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "avatar": "https://storage.googleapis.com/project-id.appspot.com/avatars/account_abc123.jpg",
    "bio": "資深土木工程師，擁有10年營造工程經驗",
    "phone": "+886912345678",
    "location": "台北市",
    "timezone": "Asia/Taipei",
    "language": "zh-TW"
  },
  
  "permissions": {
    "roles": ["user"],
    "capabilities": ["read", "write"],
    "organizationRoles": {
      "org_abc123": ["engineer"]
    },
    "projectRoles": {
      "proj_001": ["manager"]
    }
  },
  
  "settings": {
    "notifications": {
      "email": true,
      "push": true,
      "inApp": true
    },
    "privacy": {
      "profileVisible": true,
      "contactVisible": false
    },
    "preferences": {
      "theme": "light",
      "language": "zh-TW"
    }
  },
  
  "projectsOwned": ["proj_001", "proj_002"],
  
  "certificates": [
    {
      "licenseId": "cert_001",
      "name": "土木工程技師證照",
      "issuer": "考選部",
      "issueDate": {
        "_seconds": 1579046400,
        "_nanoseconds": 0
      },
      "expiryDate": {
        "_seconds": 1736899200,
        "_nanoseconds": 0
      },
      "certificateUrl": "https://storage.../certificates/cert_001.pdf"
    }
  ],
  
  "socialRelations": {
    "following": ["account_xyz789", "account_def456"],
    "followers": ["account_ghi789"],
    "starredProjects": ["proj_001", "proj_002"],
    "achievements": [
      {
        "achievementId": "ach_first_project",
        "name": "首次建立專案",
        "description": "成功建立第一個專案",
        "iconUrl": "https://cdn.../icons/first-project.svg",
        "earnedAt": {
          "_seconds": 1710921600,
          "_nanoseconds": 0
        }
      }
    ]
  },
  
  "createdAt": {
    "_seconds": 1704067200,
    "_nanoseconds": 0
  },
  "updatedAt": {
    "_seconds": 1710921600,
    "_nanoseconds": 0
  },
  "lastLoginAt": {
    "_seconds": 1710921600,
    "_nanoseconds": 0
  }
}
```

## Firebase Repository 實作

```typescript
// infrastructure-layer/repositories/account-context/FirebaseAccountRepository.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, orderBy, limit, startAfter } from '@angular/fire/firestore';
import { IAccountRepository, Account, AccountSearchCriteria, PagedResult } from '../../../domain-layer/account-context/repository-interfaces/IAccountRepository';
import { AccountMapper } from '../mappers/AccountMapper';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAccountRepository implements IAccountRepository {
  private firestore = inject(Firestore);
  private mapper = inject(AccountMapper);

  async findById(accountId: string): Promise<Account | null> {
    const docRef = doc(this.firestore, 'accounts', accountId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return this.mapper.toDomain(docSnap.data());
  }

  async findByEmail(email: string): Promise<Account | null> {
    const accountsRef = collection(this.firestore, 'accounts');
    const q = query(accountsRef, where('profile.email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return this.mapper.toDomain(doc.data());
  }

  async findByIds(accountIds: string[]): Promise<Account[]> {
    // Firestore 的 'in' 查詢限制最多 10 個值
    const chunks = this.chunkArray(accountIds, 10);
    const results: Account[] = [];
    
    for (const chunk of chunks) {
      const accountsRef = collection(this.firestore, 'accounts');
      const q = query(accountsRef, where('accountId', 'in', chunk));
      const querySnapshot = await getDocs(q);
      
      const accounts = querySnapshot.docs.map(doc => 
        this.mapper.toDomain(doc.data())
      );
      results.push(...accounts);
    }
    
    return results;
  }

  async save(account: Account): Promise<void> {
    const accountRef = doc(this.firestore, 'accounts', account.accountId);
    const accountData = this.mapper.toFirestore(account);
    await setDoc(accountRef, accountData);
  }

  async delete(accountId: string): Promise<void> {
    const accountRef = doc(this.firestore, 'accounts', accountId);
    await deleteDoc(accountRef);
  }

  async search(criteria: AccountSearchCriteria): Promise<PagedResult<Account>> {
    const accountsRef = collection(this.firestore, 'accounts');
    let q = query(accountsRef);
    
    // 添加搜尋條件
    if (criteria.keyword) {
      // 注意：Firestore 不支援全文搜尋，這裡使用前綴搜尋
      q = query(q, where('profile.name', '>=', criteria.keyword));
    }
    
    if (criteria.accountType) {
      q = query(q, where('accountType', '==', criteria.accountType));
    }
    
    if (criteria.certificates && criteria.certificates.length > 0) {
      q = query(q, where('certificates.name', 'array-contains-any', criteria.certificates));
    }
    
    // 排序和分頁
    q = query(q, orderBy('createdAt', 'desc'), limit(criteria.pageSize));
    
    const querySnapshot = await getDocs(q);
    const accounts = querySnapshot.docs.map(doc => 
      this.mapper.toDomain(doc.data())
    );
    
    return {
      items: accounts,
      total: accounts.length, // 注意：實際應用中需要額外查詢總數
      page: criteria.page,
      pageSize: criteria.pageSize
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

## Mapper 實作

```typescript
// infrastructure-layer/mappers/AccountMapper.ts
import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { Account, User, Organization } from '../../../domain-layer/account-context/entities/AccountEntity';
import { Email } from '../../../domain-layer/account-context/value-objects/Email';
import { PhoneNumber } from '../../../domain-layer/account-context/value-objects/PhoneNumber';

@Injectable({
  providedIn: 'root'
})
export class AccountMapper {
  toDomain(data: any): Account {
    const baseAccount: Account = {
      accountId: data.accountId,
      accountType: data.accountType,
      profile: {
        name: data.profile.name,
        email: new Email(data.profile.email),
        avatar: data.profile.avatar,
        bio: data.profile.bio,
        phone: data.profile.phone ? new PhoneNumber(data.profile.phone) : undefined,
        location: data.profile.location,
        timezone: data.profile.timezone,
        language: data.profile.language
      },
      permissions: data.permissions,
      settings: data.settings,
      projectsOwned: data.projectsOwned || [],
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      lastLoginAt: data.lastLoginAt?.toDate()
    };

    if (data.accountType === 'user') {
      return {
        ...baseAccount,
        certificates: data.certificates || [],
        socialRelations: data.socialRelations || {
          following: [],
          followers: [],
          starredProjects: [],
          achievements: []
        }
      } as User;
    } else if (data.accountType === 'organization') {
      return {
        ...baseAccount,
        businessLicense: data.businessLicense,
        members: data.members || [],
        teams: data.teams || []
      } as Organization;
    }

    return baseAccount;
  }

  toFirestore(account: Account): any {
    const baseData = {
      accountId: account.accountId,
      accountType: account.accountType,
      profile: {
        name: account.profile.name,
        email: account.profile.email.value,
        avatar: account.profile.avatar,
        bio: account.profile.bio,
        phone: account.profile.phone?.value,
        location: account.profile.location,
        timezone: account.profile.timezone,
        language: account.profile.language
      },
      permissions: account.permissions,
      settings: account.settings,
      projectsOwned: account.projectsOwned,
      createdAt: Timestamp.fromDate(account.createdAt),
      updatedAt: Timestamp.fromDate(account.updatedAt),
      lastLoginAt: account.lastLoginAt ? Timestamp.fromDate(account.lastLoginAt) : undefined
    };

    if (account.accountType === 'user') {
      const user = account as User;
      return {
        ...baseData,
        certificates: user.certificates,
        socialRelations: user.socialRelations
      };
    } else if (account.accountType === 'organization') {
      const organization = account as Organization;
      return {
        ...baseData,
        businessLicense: organization.businessLicense,
        members: organization.members,
        teams: organization.teams
      };
    }

    return baseData;
  }
}
```

## 效能優化建議

### 1. 快取策略
- 使用 Angular Signals 快取 Account 資料
- 實作 LRU 快取機制
- 快取熱門查詢結果

### 2. 查詢優化
- 使用複合索引優化複雜查詢
- 實作分頁查詢避免大量資料載入
- 使用 Firestore 的批次操作

### 3. 資料同步
- 使用 Firestore 的即時監聽器
- 實作離線支援
- 處理網路中斷情況

### 4. 安全考量
- 實作適當的 Security Rules
- 驗證 Account 輸入
- 使用 Firebase Auth 整合
