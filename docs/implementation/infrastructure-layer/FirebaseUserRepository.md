# Firebase User Repository (Firebase 用戶儲存庫)

## 儲存庫概述

FirebaseUserRepository 是 DDD Infrastructure 層的用戶資料存取實作，負責與 Firebase Firestore 進行用戶資料的 CRUD 操作。本儲存庫實作了 UserRepository 介面，提供完整的用戶資料管理功能，包括用戶建立、更新、查詢、刪除等操作。

## 核心職責

### 1. 用戶資料管理
- 用戶資料的 CRUD 操作
- 用戶資料驗證與轉換
- 用戶狀態管理
- 用戶資料快取

### 2. Firebase 整合
- Firestore 集合操作
- 即時資料同步
- 離線資料支援
- 錯誤處理與重試

### 3. 效能優化
- 查詢優化
- 資料快取
- 批次操作
- 分頁處理

## 儲存庫架構

```typescript
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  DocumentSnapshot,
  QuerySnapshot,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from '@angular/fire/firestore';
import { Observable, from, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { UserEntity } from '../../domain-layer/Entities/UserEntity';
import { UserRepository } from '../../domain-layer/Repositories/UserRepository';
import { UserNotFoundError, UserCreationError } from '../../domain-layer/Errors';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUserRepository implements UserRepository {
  private firestore = inject(Firestore);
  private readonly COLLECTION_NAME = 'users';
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 分鐘快取
  
  // 快取管理
  private cache = new Map<string, { data: UserEntity; timestamp: number }>();
  private cacheSubject = new BehaviorSubject<Map<string, UserEntity>>(new Map());
  
  constructor() {
    this.initializeRepository();
  }
  
  private initializeRepository(): void {
    // 初始化快取清理定時器
    setInterval(() => {
      this.cleanExpiredCache();
    }, this.CACHE_TTL);
  }
}
```

## 核心方法

### 1. 用戶建立

```typescript
/**
 * 建立新用戶
 * @param userData 用戶資料
 * @returns Observable<UserEntity>
 */
create(userData: CreateUserCommand): Observable<UserEntity> {
  const userRef = collection(this.firestore, this.COLLECTION_NAME);
  
  return from(addDoc(userRef, {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'ACTIVE'
  })).pipe(
    map(docRef => {
      const user = new UserEntity({
        id: docRef.id,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'ACTIVE'
      });
      
      // 更新快取
      this.updateCache(user.id, user);
      
      return user;
    }),
    catchError(error => {
      console.error('建立用戶失敗:', error);
      throw new UserCreationError('無法建立用戶', error);
    })
  );
}

/**
 * 批次建立用戶
 * @param usersData 用戶資料陣列
 * @returns Observable<UserEntity[]>
 */
batchCreate(usersData: CreateUserCommand[]): Observable<UserEntity[]> {
  const batch = writeBatch(this.firestore);
  const users: UserEntity[] = [];
  
  usersData.forEach(userData => {
    const userRef = doc(collection(this.firestore, this.COLLECTION_NAME));
    const user = new UserEntity({
      id: userRef.id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ACTIVE'
    });
    
    batch.set(userRef, user.toFirestoreData());
    users.push(user);
  });
  
  return from(batch.commit()).pipe(
    map(() => {
      // 更新快取
      users.forEach(user => this.updateCache(user.id, user));
      return users;
    }),
    catchError(error => {
      console.error('批次建立用戶失敗:', error);
      throw new UserCreationError('批次建立用戶失敗', error);
    })
  );
}
```

### 2. 用戶查詢

```typescript
/**
 * 根據 ID 查詢用戶
 * @param id 用戶 ID
 * @returns Observable<UserEntity | null>
 */
findById(id: string): Observable<UserEntity | null> {
  // 先檢查快取
  const cachedUser = this.getFromCache(id);
  if (cachedUser) {
    return of(cachedUser);
  }
  
  const userRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(getDoc(userRef)).pipe(
    map(docSnapshot => {
      if (!docSnapshot.exists()) {
        return null;
      }
      
      const userData = docSnapshot.data();
      const user = new UserEntity({
        id: docSnapshot.id,
        ...userData
      });
      
      // 更新快取
      this.updateCache(user.id, user);
      
      return user;
    }),
    catchError(error => {
      console.error('查詢用戶失敗:', error);
      throw new UserNotFoundError(id);
    })
  );
}

/**
 * 根據電子郵件查詢用戶
 * @param email 電子郵件
 * @returns Observable<UserEntity | null>
 */
findByEmail(email: string): Observable<UserEntity | null> {
  const usersRef = collection(this.firestore, this.COLLECTION_NAME);
  const q = query(usersRef, where('email', '==', email), limit(1));
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      if (querySnapshot.empty) {
        return null;
      }
      
      const docSnapshot = querySnapshot.docs[0];
      const userData = docSnapshot.data();
      const user = new UserEntity({
        id: docSnapshot.id,
        ...userData
      });
      
      // 更新快取
      this.updateCache(user.id, user);
      
      return user;
    }),
    catchError(error => {
      console.error('根據郵箱查詢用戶失敗:', error);
      throw new UserNotFoundError(email);
    })
  );
}

/**
 * 查詢所有用戶
 * @param options 查詢選項
 * @returns Observable<UserEntity[]>
 */
findAll(options?: UserQueryOptions): Observable<UserEntity[]> {
  const usersRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(usersRef);
  
  // 應用查詢條件
  if (options) {
    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    }
    
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const users: UserEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const userData = docSnapshot.data();
        const user = new UserEntity({
          id: docSnapshot.id,
          ...userData
        });
        
        users.push(user);
        // 更新快取
        this.updateCache(user.id, user);
      });
      
      return users;
    }),
    catchError(error => {
      console.error('查詢所有用戶失敗:', error);
      throw new Error('查詢用戶失敗');
    })
  );
}

/**
 * 搜尋用戶
 * @param searchCriteria 搜尋條件
 * @returns Observable<UserEntity[]>
 */
search(searchCriteria: UserSearchCriteria): Observable<UserEntity[]> {
  const usersRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(usersRef);
  
  // 應用搜尋條件
  if (searchCriteria.name) {
    q = query(q, where('name', '>=', searchCriteria.name));
    q = query(q, where('name', '<=', searchCriteria.name + '\uf8ff'));
  }
  
  if (searchCriteria.email) {
    q = query(q, where('email', '>=', searchCriteria.email));
    q = query(q, where('email', '<=', searchCriteria.email + '\uf8ff'));
  }
  
  if (searchCriteria.status) {
    q = query(q, where('status', '==', searchCriteria.status));
  }
  
  if (searchCriteria.limit) {
    q = query(q, limit(searchCriteria.limit));
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const users: UserEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const userData = docSnapshot.data();
        const user = new UserEntity({
          id: docSnapshot.id,
          ...userData
        });
        
        users.push(user);
        // 更新快取
        this.updateCache(user.id, user);
      });
      
      return users;
    }),
    catchError(error => {
      console.error('搜尋用戶失敗:', error);
      throw new Error('搜尋用戶失敗');
    })
  );
}
```

### 3. 用戶更新

```typescript
/**
 * 更新用戶資料
 * @param id 用戶 ID
 * @param updates 更新資料
 * @returns Observable<UserEntity>
 */
update(id: string, updates: UpdateUserCommand): Observable<UserEntity> {
  const userRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(updateDoc(userRef, {
    ...updates,
    updatedAt: new Date()
  })).pipe(
    switchMap(() => this.findById(id)),
    map(user => {
      if (!user) {
        throw new UserNotFoundError(id);
      }
      
      // 更新快取
      this.updateCache(user.id, user);
      
      return user;
    }),
    catchError(error => {
      console.error('更新用戶失敗:', error);
      throw new Error('更新用戶失敗');
    })
  );
}

/**
 * 批次更新用戶
 * @param updates 批次更新資料
 * @returns Observable<UserEntity[]>
 */
batchUpdate(updates: BatchUserUpdate[]): Observable<UserEntity[]> {
  const batch = writeBatch(this.firestore);
  
  updates.forEach(update => {
    const userRef = doc(this.firestore, this.COLLECTION_NAME, update.id);
    batch.update(userRef, {
      ...update.data,
      updatedAt: new Date()
    });
  });
  
  return from(batch.commit()).pipe(
    switchMap(() => {
      const userIds = updates.map(update => update.id);
      return forkJoin(userIds.map(id => this.findById(id)));
    }),
    map(users => {
      // 更新快取
      users.forEach(user => {
        if (user) {
          this.updateCache(user.id, user);
        }
      });
      
      return users.filter(user => user !== null) as UserEntity[];
    }),
    catchError(error => {
      console.error('批次更新用戶失敗:', error);
      throw new Error('批次更新用戶失敗');
    })
  );
}
```

### 4. 用戶刪除

```typescript
/**
 * 刪除用戶
 * @param id 用戶 ID
 * @returns Observable<void>
 */
delete(id: string): Observable<void> {
  const userRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(deleteDoc(userRef)).pipe(
    map(() => {
      // 從快取中移除
      this.removeFromCache(id);
    }),
    catchError(error => {
      console.error('刪除用戶失敗:', error);
      throw new Error('刪除用戶失敗');
    })
  );
}

/**
 * 軟刪除用戶（標記為已刪除）
 * @param id 用戶 ID
 * @returns Observable<UserEntity>
 */
softDelete(id: string): Observable<UserEntity> {
  return this.update(id, {
    status: 'DELETED',
    deletedAt: new Date()
  });
}
```

### 5. 即時監聽

```typescript
/**
 * 監聽用戶變更
 * @param id 用戶 ID
 * @returns Observable<UserEntity>
 */
watchById(id: string): Observable<UserEntity> {
  const userRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return new Observable(observer => {
    const unsubscribe = onSnapshot(userRef, {
      next: (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const user = new UserEntity({
            id: docSnapshot.id,
            ...userData
          });
          
          // 更新快取
          this.updateCache(user.id, user);
          
          observer.next(user);
        } else {
          observer.error(new UserNotFoundError(id));
        }
      },
      error: (error) => {
        console.error('監聽用戶變更失敗:', error);
        observer.error(error);
      }
    });
    
    return () => unsubscribe();
  });
}

/**
 * 監聽用戶集合變更
 * @param options 查詢選項
 * @returns Observable<UserEntity[]>
 */
watchAll(options?: UserQueryOptions): Observable<UserEntity[]> {
  const usersRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(usersRef);
  
  // 應用查詢條件
  if (options) {
    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    }
    
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
  }
  
  return new Observable(observer => {
    const unsubscribe = onSnapshot(q, {
      next: (querySnapshot) => {
        const users: UserEntity[] = [];
        
        querySnapshot.forEach(docSnapshot => {
          const userData = docSnapshot.data();
          const user = new UserEntity({
            id: docSnapshot.id,
            ...userData
          });
          
          users.push(user);
          // 更新快取
          this.updateCache(user.id, user);
        });
        
        observer.next(users);
      },
      error: (error) => {
        console.error('監聽用戶集合變更失敗:', error);
        observer.error(error);
      }
    });
    
    return () => unsubscribe();
  });
}
```

## 快取管理

### 1. 快取操作

```typescript
private updateCache(id: string, user: UserEntity): void {
  this.cache.set(id, {
    data: user,
    timestamp: Date.now()
  });
  
  // 更新快取主題
  const currentCache = this.cacheSubject.value;
  currentCache.set(id, user);
  this.cacheSubject.next(currentCache);
}

private getFromCache(id: string): UserEntity | null {
  const cached = this.cache.get(id);
  
  if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
    return cached.data;
  }
  
  // 快取過期，移除
  if (cached) {
    this.removeFromCache(id);
  }
  
  return null;
}

private removeFromCache(id: string): void {
  this.cache.delete(id);
  
  // 更新快取主題
  const currentCache = this.cacheSubject.value;
  currentCache.delete(id);
  this.cacheSubject.next(currentCache);
}

private cleanExpiredCache(): void {
  const now = Date.now();
  
  for (const [id, cached] of this.cache.entries()) {
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.removeFromCache(id);
    }
  }
}
```

### 2. 快取查詢

```typescript
/**
 * 從快取中查詢用戶
 * @param id 用戶 ID
 * @returns Observable<UserEntity | null>
 */
findByIdFromCache(id: string): Observable<UserEntity | null> {
  return this.cacheSubject.pipe(
    map(cache => cache.get(id) || null),
    take(1)
  );
}

/**
 * 預載入用戶資料到快取
 * @param ids 用戶 ID 陣列
 * @returns Observable<void>
 */
preloadUsers(ids: string[]): Observable<void> {
  const loadPromises = ids.map(id => this.findById(id).toPromise());
  
  return from(Promise.all(loadPromises)).pipe(
    map(() => void 0),
    catchError(error => {
      console.error('預載入用戶失敗:', error);
      return of(void 0);
    })
  );
}
```

## 錯誤處理

### 1. Firebase 錯誤處理

```typescript
private handleFirebaseError(error: any, operation: string): never {
  console.error(`Firebase ${operation} 錯誤:`, error);
  
  switch (error.code) {
    case 'permission-denied':
      throw new Error('沒有權限執行此操作');
    case 'not-found':
      throw new Error('找不到指定的資源');
    case 'already-exists':
      throw new Error('資源已存在');
    case 'failed-precondition':
      throw new Error('操作條件不滿足');
    case 'unavailable':
      throw new Error('服務暫時不可用，請稍後重試');
    default:
      throw new Error(`操作失敗: ${operation}`);
  }
}
```

### 2. 重試機制

```typescript
private retryOperation<T>(
  operation: () => Observable<T>, 
  maxRetries: number = 3
): Observable<T> {
  return operation().pipe(
    catchError(error => {
      if (maxRetries > 0 && this.isRetryableError(error)) {
        console.log(`重試操作，剩餘次數: ${maxRetries - 1}`);
        return timer(1000).pipe(
          switchMap(() => this.retryOperation(operation, maxRetries - 1))
        );
      }
      throw error;
    })
  );
}

private isRetryableError(error: any): boolean {
  const retryableCodes = ['unavailable', 'deadline-exceeded', 'internal'];
  return retryableCodes.includes(error.code);
}
```

## 效能優化

### 1. 查詢優化

```typescript
/**
 * 分頁查詢用戶
 * @param pageSize 頁面大小
 * @param lastDoc 最後一個文件
 * @returns Observable<PaginatedUsers>
 */
findAllPaginated(pageSize: number, lastDoc?: DocumentSnapshot): Observable<PaginatedUsers> {
  const usersRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(usersRef, orderBy('createdAt', 'desc'), limit(pageSize));
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const users: UserEntity[] = [];
      let lastDocument: DocumentSnapshot | undefined;
      
      querySnapshot.forEach(docSnapshot => {
        const userData = docSnapshot.data();
        const user = new UserEntity({
          id: docSnapshot.id,
          ...userData
        });
        
        users.push(user);
        lastDocument = docSnapshot;
      });
      
      return {
        users,
        lastDoc: lastDocument,
        hasMore: querySnapshot.docs.length === pageSize
      };
    })
  );
}
```

### 2. 批次操作優化

```typescript
/**
 * 批次操作用戶
 * @param operations 操作陣列
 * @returns Observable<void>
 */
batchOperations(operations: UserBatchOperation[]): Observable<void> {
  const batch = writeBatch(this.firestore);
  
  operations.forEach(operation => {
    const userRef = doc(this.firestore, this.COLLECTION_NAME, operation.id);
    
    switch (operation.type) {
      case 'create':
        batch.set(userRef, operation.data);
        break;
      case 'update':
        batch.update(userRef, operation.data);
        break;
      case 'delete':
        batch.delete(userRef);
        break;
    }
  });
  
  return from(batch.commit()).pipe(
    map(() => {
      // 清理相關快取
      operations.forEach(operation => {
        if (operation.type === 'delete') {
          this.removeFromCache(operation.id);
        }
      });
    }),
    catchError(error => {
      console.error('批次操作失敗:', error);
      throw new Error('批次操作失敗');
    })
  );
}
```

## 測試策略

### 1. 單元測試

```typescript
describe('FirebaseUserRepository', () => {
  let service: FirebaseUserRepository;
  let mockFirestore: jasmine.SpyObj<Firestore>;

  beforeEach(() => {
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection', 'doc']);
    
    TestBed.configureTestingModule({
      providers: [
        FirebaseUserRepository,
        { provide: Firestore, useValue: firestoreSpy }
      ]
    });

    service = TestBed.inject(FirebaseUserRepository);
    mockFirestore = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
  });

  it('應該能夠建立用戶', (done) => {
    const userData = {
      name: '測試用戶',
      email: 'test@example.com',
      phone: '0912345678'
    };
    
    // Mock Firebase 回應
    const mockDocRef = { id: 'user1' };
    spyOn(service, 'create').and.returnValue(of(new UserEntity({ id: 'user1', ...userData })));

    service.create(userData).subscribe({
      next: (user) => {
        expect(user).toBeDefined();
        expect(user.name).toBe('測試用戶');
        expect(user.email).toBe('test@example.com');
        done();
      },
      error: done.fail
    });
  });
});
```

### 2. 整合測試

```typescript
describe('FirebaseUserRepository Integration', () => {
  let service: FirebaseUserRepository;
  let firestore: Firestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(environment.firebase)],
      providers: [FirebaseUserRepository]
    });

    service = TestBed.inject(FirebaseUserRepository);
    firestore = TestBed.inject(Firestore);
  });

  it('應該能夠與 Firebase 整合', async () => {
    const userData = {
      name: '整合測試用戶',
      email: 'integration@example.com',
      phone: '0912345678'
    };
    
    // 建立用戶
    const user = await service.create(userData).toPromise();
    expect(user).toBeDefined();
    
    // 查詢用戶
    const foundUser = await service.findById(user!.id).toPromise();
    expect(foundUser).toBeDefined();
    expect(foundUser!.name).toBe('整合測試用戶');
    
    // 清理測試資料
    await service.delete(user!.id).toPromise();
  });
});
```

## 使用範例

### 1. 在服務中使用

```typescript
@Injectable()
export class UserService {
  constructor(private userRepository: FirebaseUserRepository) {}
  
  createUser(userData: CreateUserCommand): Observable<UserEntity> {
    return this.userRepository.create(userData);
  }
  
  getUserById(id: string): Observable<UserEntity | null> {
    return this.userRepository.findById(id);
  }
  
  updateUser(id: string, updates: UpdateUserCommand): Observable<UserEntity> {
    return this.userRepository.update(id, updates);
  }
}
```

### 2. 在組件中使用

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <div class="user-list">
      @for (user of users$ | async; track user.id) {
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <button (click)="editUser(user.id)">編輯</button>
        </div>
      }
    </div>
  `
})
export class UserListComponent {
  users$ = this.userRepository.findAll({ limit: 10 });

  constructor(private userRepository: FirebaseUserRepository) {}

  editUser(userId: string): void {
    this.userRepository.findById(userId).subscribe(user => {
      if (user) {
        // 開啟編輯對話框
      }
    });
  }
}
```

## 最佳實踐

### 1. 資料一致性
- 使用批次操作確保資料一致性
- 實作適當的錯誤處理和重試機制
- 使用快取減少不必要的網路請求

### 2. 效能優化
- 使用適當的 Firestore 索引
- 實作分頁查詢避免一次載入過多資料
- 使用快取機制提升查詢效能

### 3. 安全性
- 實作適當的 Firestore 安全規則
- 驗證輸入資料防止注入攻擊
- 使用適當的權限控制

### 4. 可維護性
- 提供完整的型別定義
- 實作詳細的錯誤處理
- 提供完整的測試覆蓋
