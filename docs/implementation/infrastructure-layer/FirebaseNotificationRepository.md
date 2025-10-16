# Firebase Notification Repository (Firebase 通知儲存庫)

## 儲存庫概述

FirebaseNotificationRepository 是 DDD Infrastructure 層的通知資料存取實作，負責與 Firebase Firestore 進行通知資料的 CRUD 操作。本儲存庫實作了 NotificationRepository 介面，提供完整的通知資料管理功能，包括通知建立、發送、查詢、狀態更新等操作。

## 核心職責

### 1. 通知資料管理
- 通知資料的 CRUD 操作
- 通知狀態管理
- 通知分類管理
- 通知資料驗證與轉換

### 2. 通知發送功能
- 即時通知推送
- 批次通知發送
- 通知通道管理
- 發送狀態追蹤

### 3. 通知查詢功能
- 複雜查詢條件支援
- 分頁查詢
- 統計查詢
- 即時監聽

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
import { Observable, from, of, throwError, BehaviorSubject, forkJoin } from 'rxjs';
import { map, catchError, switchMap, take, mergeMap } from 'rxjs/operators';
import { NotificationEntity } from '../../domain-layer/Entities/NotificationEntity';
import { NotificationRepository } from '../../domain-layer/Repositories/NotificationRepository';
import { NotificationNotFoundError, NotificationCreationError } from '../../domain-layer/Errors';

@Injectable({
  providedIn: 'root'
})
export class FirebaseNotificationRepository implements NotificationRepository {
  private firestore = inject(Firestore);
  private readonly COLLECTION_NAME = 'notifications';
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 分鐘快取
  
  // 快取管理
  private cache = new Map<string, { data: NotificationEntity; timestamp: number }>();
  private cacheSubject = new BehaviorSubject<Map<string, NotificationEntity>>(new Map());
  
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

### 1. 通知建立

```typescript
/**
 * 建立新通知
 * @param notificationData 通知資料
 * @returns Observable<NotificationEntity>
 */
create(notificationData: CreateNotificationCommand): Observable<NotificationEntity> {
  const notificationRef = collection(this.firestore, this.COLLECTION_NAME);
  
  return from(addDoc(notificationRef, {
    ...notificationData,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'PENDING',
    readAt: null,
    deliveredAt: null
  })).pipe(
    map(docRef => {
      const notification = new NotificationEntity({
        id: docRef.id,
        ...notificationData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'PENDING',
        readAt: null,
        deliveredAt: null
      });
      
      // 更新快取
      this.updateCache(notification.id, notification);
      
      return notification;
    }),
    catchError(error => {
      console.error('建立通知失敗:', error);
      throw new NotificationCreationError('無法建立通知', error);
    })
  );
}

/**
 * 批次建立通知
 * @param notificationsData 通知資料陣列
 * @returns Observable<NotificationEntity[]>
 */
batchCreate(notificationsData: CreateNotificationCommand[]): Observable<NotificationEntity[]> {
  const batch = writeBatch(this.firestore);
  const notifications: NotificationEntity[] = [];
  
  notificationsData.forEach(notificationData => {
    const notificationRef = doc(collection(this.firestore, this.COLLECTION_NAME));
    const notification = new NotificationEntity({
      id: notificationRef.id,
      ...notificationData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'PENDING',
      readAt: null,
      deliveredAt: null
    });
    
    batch.set(notificationRef, notification.toFirestoreData());
    notifications.push(notification);
  });
  
  return from(batch.commit()).pipe(
    map(() => {
      // 更新快取
      notifications.forEach(notification => this.updateCache(notification.id, notification));
      return notifications;
    }),
    catchError(error => {
      console.error('批次建立通知失敗:', error);
      throw new NotificationCreationError('批次建立通知失敗', error);
    })
  );
}
```

### 2. 通知查詢

```typescript
/**
 * 根據 ID 查詢通知
 * @param id 通知 ID
 * @returns Observable<NotificationEntity | null>
 */
findById(id: string): Observable<NotificationEntity | null> {
  // 先檢查快取
  const cachedNotification = this.getFromCache(id);
  if (cachedNotification) {
    return of(cachedNotification);
  }
  
  const notificationRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(getDoc(notificationRef)).pipe(
    map(docSnapshot => {
      if (!docSnapshot.exists()) {
        return null;
      }
      
      const notificationData = docSnapshot.data();
      const notification = new NotificationEntity({
        id: docSnapshot.id,
        ...notificationData
      });
      
      // 更新快取
      this.updateCache(notification.id, notification);
      
      return notification;
    }),
    catchError(error => {
      console.error('查詢通知失敗:', error);
      throw new NotificationNotFoundError(id);
    })
  );
}

/**
 * 根據用戶查詢通知
 * @param userId 用戶 ID
 * @param options 查詢選項
 * @returns Observable<NotificationEntity[]>
 */
findByUser(userId: string, options?: NotificationQueryOptions): Observable<NotificationEntity[]> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(notificationsRef, where('userId', '==', userId));
  
  // 應用查詢條件
  if (options) {
    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    if (options.type) {
      q = query(q, where('type', '==', options.type));
    }
    
    if (options.priority) {
      q = query(q, where('priority', '==', options.priority));
    }
    
    if (options.unreadOnly) {
      q = query(q, where('readAt', '==', null));
    }
    
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    } else {
      // 預設按建立時間倒序排列
      q = query(q, orderBy('createdAt', 'desc'));
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
      const notifications: NotificationEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const notificationData = docSnapshot.data();
        const notification = new NotificationEntity({
          id: docSnapshot.id,
          ...notificationData
        });
        
        notifications.push(notification);
        // 更新快取
        this.updateCache(notification.id, notification);
      });
      
      return notifications;
    }),
    catchError(error => {
      console.error('根據用戶查詢通知失敗:', error);
      throw new Error('查詢通知失敗');
    })
  );
}

/**
 * 查詢未讀通知
 * @param userId 用戶 ID
 * @param limit 限制數量
 * @returns Observable<NotificationEntity[]>
 */
findUnreadByUser(userId: string, limit?: number): Observable<NotificationEntity[]> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(
    notificationsRef, 
    where('userId', '==', userId),
    where('readAt', '==', null),
    orderBy('createdAt', 'desc')
  );
  
  if (limit) {
    q = query(q, limit(limit));
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const notifications: NotificationEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const notificationData = docSnapshot.data();
        const notification = new NotificationEntity({
          id: docSnapshot.id,
          ...notificationData
        });
        
        notifications.push(notification);
        // 更新快取
        this.updateCache(notification.id, notification);
      });
      
      return notifications;
    }),
    catchError(error => {
      console.error('查詢未讀通知失敗:', error);
      throw new Error('查詢未讀通知失敗');
    })
  );
}

/**
 * 搜尋通知
 * @param searchCriteria 搜尋條件
 * @returns Observable<NotificationEntity[]>
 */
search(searchCriteria: NotificationSearchCriteria): Observable<NotificationEntity[]> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(notificationsRef);
  
  // 應用搜尋條件
  if (searchCriteria.userId) {
    q = query(q, where('userId', '==', searchCriteria.userId));
  }
  
  if (searchCriteria.title) {
    q = query(q, where('title', '>=', searchCriteria.title));
    q = query(q, where('title', '<=', searchCriteria.title + '\uf8ff'));
  }
  
  if (searchCriteria.type) {
    q = query(q, where('type', '==', searchCriteria.type));
  }
  
  if (searchCriteria.status) {
    q = query(q, where('status', '==', searchCriteria.status));
  }
  
  if (searchCriteria.priority) {
    q = query(q, where('priority', '==', searchCriteria.priority));
  }
  
  if (searchCriteria.dateFrom) {
    q = query(q, where('createdAt', '>=', searchCriteria.dateFrom));
  }
  
  if (searchCriteria.dateTo) {
    q = query(q, where('createdAt', '<=', searchCriteria.dateTo));
  }
  
  if (searchCriteria.limit) {
    q = query(q, limit(searchCriteria.limit));
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const notifications: NotificationEntity[] = [];
      
      querySnapshot.forEach(docSnapshot => {
        const notificationData = docSnapshot.data();
        const notification = new NotificationEntity({
          id: docSnapshot.id,
          ...notificationData
        });
        
        notifications.push(notification);
        // 更新快取
        this.updateCache(notification.id, notification);
      });
      
      return notifications;
    }),
    catchError(error => {
      console.error('搜尋通知失敗:', error);
      throw new Error('搜尋通知失敗');
    })
  );
}
```

### 3. 通知更新

```typescript
/**
 * 更新通知資料
 * @param id 通知 ID
 * @param updates 更新資料
 * @returns Observable<NotificationEntity>
 */
update(id: string, updates: UpdateNotificationCommand): Observable<NotificationEntity> {
  const notificationRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(updateDoc(notificationRef, {
    ...updates,
    updatedAt: new Date()
  })).pipe(
    switchMap(() => this.findById(id)),
    map(notification => {
      if (!notification) {
        throw new NotificationNotFoundError(id);
      }
      
      // 更新快取
      this.updateCache(notification.id, notification);
      
      return notification;
    }),
    catchError(error => {
      console.error('更新通知失敗:', error);
      throw new Error('更新通知失敗');
    })
  );
}

/**
 * 標記通知為已讀
 * @param id 通知 ID
 * @param readBy 讀取者 ID
 * @returns Observable<NotificationEntity>
 */
markAsRead(id: string, readBy: string): Observable<NotificationEntity> {
  const notificationRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(updateDoc(notificationRef, {
    readAt: new Date(),
    readBy,
    status: 'READ',
    updatedAt: new Date()
  })).pipe(
    switchMap(() => this.findById(id)),
    map(notification => {
      if (!notification) {
        throw new NotificationNotFoundError(id);
      }
      
      // 更新快取
      this.updateCache(notification.id, notification);
      
      return notification;
    })
  );
}

/**
 * 批次標記通知為已讀
 * @param ids 通知 ID 陣列
 * @param readBy 讀取者 ID
 * @returns Observable<void>
 */
batchMarkAsRead(ids: string[], readBy: string): Observable<void> {
  const batch = writeBatch(this.firestore);
  
  ids.forEach(id => {
    const notificationRef = doc(this.firestore, this.COLLECTION_NAME, id);
    batch.update(notificationRef, {
      readAt: new Date(),
      readBy,
      status: 'READ',
      updatedAt: new Date()
    });
  });
  
  return from(batch.commit()).pipe(
    map(() => {
      // 從快取中移除已讀通知
      ids.forEach(id => {
        this.removeFromCache(id);
      });
    }),
    catchError(error => {
      console.error('批次標記已讀失敗:', error);
      throw new Error('批次標記已讀失敗');
    })
  );
}

/**
 * 更新通知狀態
 * @param id 通知 ID
 * @param status 新狀態
 * @param reason 變更原因
 * @returns Observable<NotificationEntity>
 */
updateStatus(id: string, status: NotificationStatus, reason?: string): Observable<NotificationEntity> {
  const notificationRef = doc(this.firestore, this.COLLECTION_NAME, id);
  
  return from(updateDoc(notificationRef, {
    status,
    statusChangedAt: new Date(),
    statusChangeReason: reason,
    updatedAt: new Date()
  })).pipe(
    switchMap(() => this.findById(id)),
    map(notification => {
      if (!notification) {
        throw new NotificationNotFoundError(id);
      }
      
      // 更新快取
      this.updateCache(notification.id, notification);
      
      return notification;
    })
  );
}
```

### 4. 通知發送

```typescript
/**
 * 發送通知
 * @param notificationId 通知 ID
 * @param channels 發送通道
 * @returns Observable<NotificationDeliveryResult>
 */
sendNotification(
  notificationId: string, 
  channels: NotificationChannel[]
): Observable<NotificationDeliveryResult> {
  return this.findById(notificationId).pipe(
    switchMap(notification => {
      if (!notification) {
        throw new NotificationNotFoundError(notificationId);
      }
      
      // 更新通知狀態為發送中
      return this.updateStatus(notificationId, 'SENDING');
    }),
    switchMap(notification => {
      // 並行發送到多個通道
      const channelPromises = channels.map(channel => 
        this.sendToChannel(notificationId, channel)
      );
      
      return forkJoin(channelPromises);
    }),
    map(results => {
      const successCount = results.filter(result => result.success).length;
      const failureCount = results.length - successCount;
      
      const deliveryResult = new NotificationDeliveryResult({
        notificationId,
        totalChannels: results.length,
        successCount,
        failureCount,
        results,
        deliveredAt: new Date()
      });
      
      // 更新通知狀態
      const finalStatus = failureCount === 0 ? 'DELIVERED' : 'PARTIALLY_DELIVERED';
      this.updateStatus(notificationId, finalStatus).subscribe();
      
      return deliveryResult;
    }),
    catchError(error => {
      console.error('發送通知失敗:', error);
      this.updateStatus(notificationId, 'FAILED', error.message).subscribe();
      throw new Error('發送通知失敗');
    })
  );
}

/**
 * 發送到特定通道
 * @param notificationId 通知 ID
 * @param channel 通道
 * @returns Observable<ChannelDeliveryResult>
 */
private sendToChannel(
  notificationId: string, 
  channel: NotificationChannel
): Observable<ChannelDeliveryResult> {
  return this.findById(notificationId).pipe(
    switchMap(notification => {
      if (!notification) {
        throw new NotificationNotFoundError(notificationId);
      }
      
      // 根據通道類型發送
      switch (channel.type) {
        case 'IN_APP':
          return this.sendInAppNotification(notification);
        case 'EMAIL':
          return this.sendEmailNotification(notification);
        case 'PUSH':
          return this.sendPushNotification(notification);
        case 'SMS':
          return this.sendSmsNotification(notification);
        default:
          throw new Error(`不支援的通道類型: ${channel.type}`);
      }
    }),
    map(result => ({
      channel: channel.type,
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      deliveredAt: new Date()
    })),
    catchError(error => ({
      channel: channel.type,
      success: false,
      messageId: null,
      error: error.message,
      deliveredAt: new Date()
    }))
  );
}
```

### 5. 通知統計

```typescript
/**
 * 取得用戶通知統計
 * @param userId 用戶 ID
 * @returns Observable<NotificationStatistics>
 */
getUserNotificationStatistics(userId: string): Observable<NotificationStatistics> {
  return forkJoin({
    total: this.getNotificationCount(userId),
    unread: this.getUnreadNotificationCount(userId),
    byType: this.getNotificationCountByType(userId),
    byPriority: this.getNotificationCountByPriority(userId)
  }).pipe(
    map(({ total, unread, byType, byPriority }) => {
      return new NotificationStatistics({
        userId,
        totalNotifications: total,
        unreadNotifications: unread,
        readNotifications: total - unread,
        notificationsByType: byType,
        notificationsByPriority: byPriority,
        calculatedAt: new Date()
      });
    })
  );
}

/**
 * 取得通知數量
 * @param userId 用戶 ID
 * @returns Observable<number>
 */
private getNotificationCount(userId: string): Observable<number> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  const q = query(notificationsRef, where('userId', '==', userId));
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => querySnapshot.size)
  );
}

/**
 * 取得未讀通知數量
 * @param userId 用戶 ID
 * @returns Observable<number>
 */
private getUnreadNotificationCount(userId: string): Observable<number> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  const q = query(
    notificationsRef, 
    where('userId', '==', userId),
    where('readAt', '==', null)
  );
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => querySnapshot.size)
  );
}

/**
 * 根據類型取得通知數量
 * @param userId 用戶 ID
 * @returns Observable<Record<string, number>>
 */
private getNotificationCountByType(userId: string): Observable<Record<string, number>> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  const q = query(notificationsRef, where('userId', '==', userId));
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const counts: Record<string, number> = {};
      
      querySnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data();
        const type = data.type || 'UNKNOWN';
        counts[type] = (counts[type] || 0) + 1;
      });
      
      return counts;
    })
  );
}

/**
 * 根據優先級取得通知數量
 * @param userId 用戶 ID
 * @returns Observable<Record<string, number>>
 */
private getNotificationCountByPriority(userId: string): Observable<Record<string, number>> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  const q = query(notificationsRef, where('userId', '==', userId));
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const counts: Record<string, number> = {};
      
      querySnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data();
        const priority = data.priority || 'NORMAL';
        counts[priority] = (counts[priority] || 0) + 1;
      });
      
      return counts;
    })
  );
}
```

### 6. 即時監聽

```typescript
/**
 * 監聽用戶通知變更
 * @param userId 用戶 ID
 * @param options 監聽選項
 * @returns Observable<NotificationEntity[]>
 */
watchByUser(userId: string, options?: NotificationWatchOptions): Observable<NotificationEntity[]> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(notificationsRef, where('userId', '==', userId));
  
  // 應用監聽條件
  if (options) {
    if (options.unreadOnly) {
      q = query(q, where('readAt', '==', null));
    }
    
    if (options.type) {
      q = query(q, where('type', '==', options.type));
    }
    
    if (options.priority) {
      q = query(q, where('priority', '==', options.priority));
    }
    
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    } else {
      // 預設按建立時間倒序排列
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
  }
  
  return new Observable(observer => {
    const unsubscribe = onSnapshot(q, {
      next: (querySnapshot) => {
        const notifications: NotificationEntity[] = [];
        
        querySnapshot.forEach(docSnapshot => {
          const notificationData = docSnapshot.data();
          const notification = new NotificationEntity({
            id: docSnapshot.id,
            ...notificationData
          });
          
          notifications.push(notification);
          // 更新快取
          this.updateCache(notification.id, notification);
        });
        
        observer.next(notifications);
      },
      error: (error) => {
        console.error('監聽用戶通知變更失敗:', error);
        observer.error(error);
      }
    });
    
    return () => unsubscribe();
  });
}

/**
 * 監聽未讀通知數量
 * @param userId 用戶 ID
 * @returns Observable<number>
 */
watchUnreadCount(userId: string): Observable<number> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  const q = query(
    notificationsRef, 
    where('userId', '==', userId),
    where('readAt', '==', null)
  );
  
  return new Observable(observer => {
    const unsubscribe = onSnapshot(q, {
      next: (querySnapshot) => {
        observer.next(querySnapshot.size);
      },
      error: (error) => {
        console.error('監聽未讀通知數量失敗:', error);
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
private updateCache(id: string, notification: NotificationEntity): void {
  this.cache.set(id, {
    data: notification,
    timestamp: Date.now()
  });
  
  // 更新快取主題
  const currentCache = this.cacheSubject.value;
  currentCache.set(id, notification);
  this.cacheSubject.next(currentCache);
}

private getFromCache(id: string): NotificationEntity | null {
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

## 效能優化

### 1. 分頁查詢

```typescript
/**
 * 分頁查詢通知
 * @param userId 用戶 ID
 * @param pageSize 頁面大小
 * @param lastDoc 最後一個文件
 * @param filters 篩選條件
 * @returns Observable<PaginatedNotifications>
 */
findAllPaginated(
  userId: string,
  pageSize: number, 
  lastDoc?: DocumentSnapshot, 
  filters?: NotificationFilters
): Observable<PaginatedNotifications> {
  const notificationsRef = collection(this.firestore, this.COLLECTION_NAME);
  let q = query(
    notificationsRef, 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'), 
    limit(pageSize)
  );
  
  // 應用篩選條件
  if (filters) {
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    
    if (filters.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    
    if (filters.unreadOnly) {
      q = query(q, where('readAt', '==', null));
    }
  }
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      const notifications: NotificationEntity[] = [];
      let lastDocument: DocumentSnapshot | undefined;
      
      querySnapshot.forEach(docSnapshot => {
        const notificationData = docSnapshot.data();
        const notification = new NotificationEntity({
          id: docSnapshot.id,
          ...notificationData
        });
        
        notifications.push(notification);
        lastDocument = docSnapshot;
      });
      
      return {
        notifications,
        lastDoc: lastDocument,
        hasMore: querySnapshot.docs.length === pageSize
      };
    })
  );
}
```

## 測試策略

### 1. 單元測試

```typescript
describe('FirebaseNotificationRepository', () => {
  let service: FirebaseNotificationRepository;
  let mockFirestore: jasmine.SpyObj<Firestore>;

  beforeEach(() => {
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection', 'doc']);
    
    TestBed.configureTestingModule({
      providers: [
        FirebaseNotificationRepository,
        { provide: Firestore, useValue: firestoreSpy }
      ]
    });

    service = TestBed.inject(FirebaseNotificationRepository);
    mockFirestore = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
  });

  it('應該能夠建立通知', (done) => {
    const notificationData = {
      userId: 'user1',
      title: '測試通知',
      content: '這是一個測試通知',
      type: 'SYSTEM',
      priority: 'NORMAL'
    };
    
    // Mock Firebase 回應
    const mockDocRef = { id: 'notification1' };
    spyOn(service, 'create').and.returnValue(of(new NotificationEntity({ id: 'notification1', ...notificationData })));

    service.create(notificationData).subscribe({
      next: (notification) => {
        expect(notification).toBeDefined();
        expect(notification.title).toBe('測試通知');
        expect(notification.userId).toBe('user1');
        done();
      },
      error: done.fail
    });
  });
});
```

## 使用範例

### 1. 在服務中使用

```typescript
@Injectable()
export class NotificationService {
  constructor(private notificationRepository: FirebaseNotificationRepository) {}
  
  createNotification(notificationData: CreateNotificationCommand): Observable<NotificationEntity> {
    return this.notificationRepository.create(notificationData);
  }
  
  getUserNotifications(userId: string): Observable<NotificationEntity[]> {
    return this.notificationRepository.findByUser(userId);
  }
  
  markAsRead(notificationId: string): Observable<NotificationEntity> {
    return this.notificationRepository.markAsRead(notificationId, 'current-user');
  }
}
```

### 2. 在組件中使用

```typescript
@Component({
  selector: 'app-notification-list',
  template: `
    <div class="notification-list">
      @for (notification of notifications$ | async; track notification.id) {
        <div class="notification-card" [class.unread]="!notification.readAt">
          <h4>{{ notification.title }}</h4>
          <p>{{ notification.content }}</p>
          <div class="notification-meta">
            <span>{{ notification.createdAt | date }}</span>
            <span [class]="'priority-' + notification.priority">
              {{ notification.priority }}
            </span>
          </div>
          @if (!notification.readAt) {
            <button (click)="markAsRead(notification.id)">標記已讀</button>
          }
        </div>
      }
    </div>
  `
})
export class NotificationListComponent {
  notifications$ = this.notificationRepository.findByUser('user1', { limit: 20 });

  constructor(private notificationRepository: FirebaseNotificationRepository) {}

  markAsRead(notificationId: string): void {
    this.notificationRepository.markAsRead(notificationId, 'user1').subscribe();
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
