# FirebaseFirestoreService (Firestore 資料庫服務)

## 概述
`FirebaseFirestoreService` 是一個封裝 Firestore 資料庫操作的 Angular 服務，提供完整的 CRUD 操作、即時監聽、查詢、批次操作和交易功能。它整合了 Angular 的依賴注入和響應式程式設計模式，並提供 TypeScript 型別安全。

## 技術規格

### 依賴套件
```json
{
  "@angular/fire": "^18.0.0",
  "firebase": "^10.0.0"
}
```

### 型別定義
```typescript
export interface FirestoreQuery {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
  value: any;
}

export interface FirestoreOrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FirestorePagination {
  limit?: number;
  startAfter?: any;
  endBefore?: any;
}

export interface FirestoreBatchOperation {
  type: 'set' | 'update' | 'delete';
  path: string;
  data?: any;
}

export interface FirestoreTransaction {
  operations: FirestoreBatchOperation[];
}

export interface FirestoreCollectionConfig {
  path: string;
  queries?: FirestoreQuery[];
  orderBy?: FirestoreOrderBy[];
  pagination?: FirestorePagination;
}

export interface FirestoreDocumentSnapshot<T = any> {
  id: string;
  data: T;
  exists: boolean;
  metadata: {
    fromCache: boolean;
    hasPendingWrites: boolean;
  };
}

export interface FirestoreQuerySnapshot<T = any> {
  docs: FirestoreDocumentSnapshot<T>[];
  empty: boolean;
  size: number;
  metadata: {
    fromCache: boolean;
    hasPendingWrites: boolean;
  };
}
```

## Angular 實作

### FirebaseFirestoreService 服務
```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, 
         deleteDoc, addDoc, query, where, orderBy, limit, startAfter, 
         endBefore, onSnapshot, writeBatch, runTransaction, 
         DocumentSnapshot, QuerySnapshot, CollectionReference, 
         DocumentReference, Query, WriteBatch, Transaction } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, throwError, combineLatest } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseFirestoreService {
  private firestore = inject(Firestore);

  // 使用 Angular Signals 管理狀態
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // 公開的只讀 signals
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // RxJS Observable 支援
  private operationSubject = new BehaviorSubject<{
    operation: string;
    success: boolean;
    data?: any;
    error?: string;
  }>({ operation: '', success: false });

  public operation$ = this.operationSubject.asObservable();

  // 獲取單一文檔
  async getDocument<T>(path: string): Promise<FirestoreDocumentSnapshot<T> | null> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const docRef = doc(this.firestore, path);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const result: FirestoreDocumentSnapshot<T> = {
          id: docSnap.id,
          data: docSnap.data() as T,
          exists: true,
          metadata: {
            fromCache: docSnap.metadata.fromCache,
            hasPendingWrites: docSnap.metadata.hasPendingWrites
          }
        };

        this.operationSubject.next({
          operation: 'getDocument',
          success: true,
          data: result
        });

        return result;
      } else {
        this.operationSubject.next({
          operation: 'getDocument',
          success: false,
          error: 'Document not found'
        });

        return null;
      }
    } catch (error: any) {
      const errorMessage = this.getFirestoreErrorMessage(error.code);
      this._error.set(errorMessage);
      this.operationSubject.next({
        operation: 'getDocument',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 獲取文檔集合
  async getCollection<T>(config: FirestoreCollectionConfig): Promise<FirestoreQuerySnapshot<T>> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const collectionRef = collection(this.firestore, config.path);
      let firestoreQuery: Query = collectionRef;

      // 應用查詢條件
      if (config.queries && config.queries.length > 0) {
        config.queries.forEach(q => {
          firestoreQuery = query(firestoreQuery, where(q.field, q.operator, q.value));
        });
      }

      // 應用排序
      if (config.orderBy && config.orderBy.length > 0) {
        config.orderBy.forEach(order => {
          firestoreQuery = query(firestoreQuery, orderBy(order.field, order.direction));
        });
      }

      // 應用分頁
      if (config.pagination) {
        if (config.pagination.limit) {
          firestoreQuery = query(firestoreQuery, limit(config.pagination.limit));
        }
        if (config.pagination.startAfter) {
          firestoreQuery = query(firestoreQuery, startAfter(config.pagination.startAfter));
        }
        if (config.pagination.endBefore) {
          firestoreQuery = query(firestoreQuery, endBefore(config.pagination.endBefore));
        }
      }

      const querySnap = await getDocs(firestoreQuery);
      
      const result: FirestoreQuerySnapshot<T> = {
        docs: querySnap.docs.map(docSnap => ({
          id: docSnap.id,
          data: docSnap.data() as T,
          exists: docSnap.exists(),
          metadata: {
            fromCache: docSnap.metadata.fromCache,
            hasPendingWrites: docSnap.metadata.hasPendingWrites
          }
        })),
        empty: querySnap.empty,
        size: querySnap.size,
        metadata: {
          fromCache: querySnap.metadata.fromCache,
          hasPendingWrites: querySnap.metadata.hasPendingWrites
        }
      };

      this.operationSubject.next({
        operation: 'getCollection',
        success: true,
        data: result
      });

      return result;
    } catch (error: any) {
      const errorMessage = this.getFirestoreErrorMessage(error.code);
      this._error.set(errorMessage);
      this.operationSubject.next({
        operation: 'getCollection',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 創建文檔
  async createDocument<T>(path: string, data: T, documentId?: string): Promise<string> {
    try {
      this._loading.set(true);
      this._error.set(null);

      let docRef: DocumentReference;
      
      if (documentId) {
        // 使用指定的文檔 ID
        docRef = doc(this.firestore, path, documentId);
        await setDoc(docRef, {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // 自動生成文檔 ID
        const collectionRef = collection(this.firestore, path);
        docRef = await addDoc(collectionRef, {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      this.operationSubject.next({
        operation: 'createDocument',
        success: true,
        data: { id: docRef.id }
      });

      return docRef.id;
    } catch (error: any) {
      const errorMessage = this.getFirestoreErrorMessage(error.code);
      this._error.set(errorMessage);
      this.operationSubject.next({
        operation: 'createDocument',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 更新文檔
  async updateDocument<T>(path: string, data: Partial<T>): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const docRef = doc(this.firestore, path);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });

      this.operationSubject.next({
        operation: 'updateDocument',
        success: true
      });
    } catch (error: any) {
      const errorMessage = this.getFirestoreErrorMessage(error.code);
      this._error.set(errorMessage);
      this.operationSubject.next({
        operation: 'updateDocument',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 刪除文檔
  async deleteDocument(path: string): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const docRef = doc(this.firestore, path);
      await deleteDoc(docRef);

      this.operationSubject.next({
        operation: 'deleteDocument',
        success: true
      });
    } catch (error: any) {
      const errorMessage = this.getFirestoreErrorMessage(error.code);
      this._error.set(errorMessage);
      this.operationSubject.next({
        operation: 'deleteDocument',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 即時監聽文檔
  listenToDocument<T>(path: string): Observable<FirestoreDocumentSnapshot<T> | null> {
    const docRef = doc(this.firestore, path);
    
    return new Observable(subscriber => {
      const unsubscribe = onSnapshot(docRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            const result: FirestoreDocumentSnapshot<T> = {
              id: docSnap.id,
              data: docSnap.data() as T,
              exists: true,
              metadata: {
                fromCache: docSnap.metadata.fromCache,
                hasPendingWrites: docSnap.metadata.hasPendingWrites
              }
            };
            subscriber.next(result);
          } else {
            subscriber.next(null);
          }
        },
        (error) => {
          subscriber.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  // 即時監聽集合
  listenToCollection<T>(config: FirestoreCollectionConfig): Observable<FirestoreQuerySnapshot<T>> {
    const collectionRef = collection(this.firestore, config.path);
    let firestoreQuery: Query = collectionRef;

    // 應用查詢條件
    if (config.queries && config.queries.length > 0) {
      config.queries.forEach(q => {
        firestoreQuery = query(firestoreQuery, where(q.field, q.operator, q.value));
      });
    }

    // 應用排序
    if (config.orderBy && config.orderBy.length > 0) {
      config.orderBy.forEach(order => {
        firestoreQuery = query(firestoreQuery, orderBy(order.field, order.direction));
      });
    }

    // 應用分頁
    if (config.pagination) {
      if (config.pagination.limit) {
        firestoreQuery = query(firestoreQuery, limit(config.pagination.limit));
      }
      if (config.pagination.startAfter) {
        firestoreQuery = query(firestoreQuery, startAfter(config.pagination.startAfter));
      }
      if (config.pagination.endBefore) {
        firestoreQuery = query(firestoreQuery, endBefore(config.pagination.endBefore));
      }
    }

    return new Observable(subscriber => {
      const unsubscribe = onSnapshot(firestoreQuery,
        (querySnap) => {
          const result: FirestoreQuerySnapshot<T> = {
            docs: querySnap.docs.map(docSnap => ({
              id: docSnap.id,
              data: docSnap.data() as T,
              exists: docSnap.exists(),
              metadata: {
                fromCache: docSnap.metadata.fromCache,
                hasPendingWrites: docSnap.metadata.hasPendingWrites
              }
            })),
            empty: querySnap.empty,
            size: querySnap.size,
            metadata: {
              fromCache: querySnap.metadata.fromCache,
              hasPendingWrites: querySnap.metadata.hasPendingWrites
            }
          };
          subscriber.next(result);
        },
        (error) => {
          subscriber.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  // 批次操作
  async batchOperation(operations: FirestoreBatchOperation[]): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const batch = writeBatch(this.firestore);

      operations.forEach(operation => {
        const docRef = doc(this.firestore, operation.path);

        switch (operation.type) {
          case 'set':
            batch.set(docRef, {
              ...operation.data,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...operation.data,
              updatedAt: new Date()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();

      this.operationSubject.next({
        operation: 'batchOperation',
        success: true
      });
    } catch (error: any) {
      const errorMessage = this.getFirestoreErrorMessage(error.code);
      this._error.set(errorMessage);
      this.operationSubject.next({
        operation: 'batchOperation',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 交易操作
  async transaction<T>(transactionFunction: (transaction: Transaction) => Promise<T>): Promise<T> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const result = await runTransaction(this.firestore, transactionFunction);

      this.operationSubject.next({
        operation: 'transaction',
        success: true,
        data: result
      });

      return result;
    } catch (error: any) {
      const errorMessage = this.getFirestoreErrorMessage(error.code);
      this._error.set(errorMessage);
      this.operationSubject.next({
        operation: 'transaction',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 搜尋文檔
  async searchDocuments<T>(
    collectionPath: string,
    searchField: string,
    searchValue: string,
    limitCount: number = 10
  ): Promise<FirestoreQuerySnapshot<T>> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const collectionRef = collection(this.firestore, collectionPath);
      const searchQuery = query(
        collectionRef,
        where(searchField, '>=', searchValue),
        where(searchField, '<=', searchValue + '\uf8ff'),
        limit(limitCount)
      );

      const querySnap = await getDocs(searchQuery);
      
      const result: FirestoreQuerySnapshot<T> = {
        docs: querySnap.docs.map(docSnap => ({
          id: docSnap.id,
          data: docSnap.data() as T,
          exists: docSnap.exists(),
          metadata: {
            fromCache: docSnap.metadata.fromCache,
            hasPendingWrites: docSnap.metadata.hasPendingWrites
          }
        })),
        empty: querySnap.empty,
        size: querySnap.size,
        metadata: {
          fromCache: querySnap.metadata.fromCache,
          hasPendingWrites: querySnap.metadata.hasPendingWrites
        }
      };

      this.operationSubject.next({
        operation: 'searchDocuments',
        success: true,
        data: result
      });

      return result;
    } catch (error: any) {
      const errorMessage = this.getFirestoreErrorMessage(error.code);
      this._error.set(errorMessage);
      this.operationSubject.next({
        operation: 'searchDocuments',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 獲取集合統計
  async getCollectionStats(collectionPath: string): Promise<{
    totalDocuments: number;
    lastUpdated: Date | null;
    averageDocumentSize: number;
  }> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const collectionRef = collection(this.firestore, collectionPath);
      const querySnap = await getDocs(collectionRef);

      let totalSize = 0;
      let lastUpdated: Date | null = null;

      querySnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        totalSize += JSON.stringify(data).length;
        
        if (data.updatedAt) {
          const updatedAt = data.updatedAt.toDate();
          if (!lastUpdated || updatedAt > lastUpdated) {
            lastUpdated = updatedAt;
          }
        }
      });

      const stats = {
        totalDocuments: querySnap.size,
        lastUpdated,
        averageDocumentSize: querySnap.size > 0 ? totalSize / querySnap.size : 0
      };

      this.operationSubject.next({
        operation: 'getCollectionStats',
        success: true,
        data: stats
      });

      return stats;
    } catch (error: any) {
      const errorMessage = this.getFirestoreErrorMessage(error.code);
      this._error.set(errorMessage);
      this.operationSubject.next({
        operation: 'getCollectionStats',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  // 獲取 Firestore 錯誤訊息
  private getFirestoreErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'permission-denied': '沒有權限執行此操作',
      'not-found': '找不到指定的文檔或集合',
      'already-exists': '文檔已存在',
      'resource-exhausted': '資源已耗盡，請稍後再試',
      'failed-precondition': '操作條件不滿足',
      'aborted': '操作被中止',
      'out-of-range': '索引超出範圍',
      'unimplemented': '功能尚未實作',
      'internal': '內部錯誤',
      'unavailable': '服務暫時不可用',
      'data-loss': '資料遺失',
      'unauthenticated': '未認證的請求',
      'invalid-argument': '無效的參數',
      'deadline-exceeded': '操作超時',
      'cancelled': '操作被取消'
    };

    return errorMessages[errorCode] || 'Firestore 操作失敗';
  }

  // 清除錯誤訊息
  clearError(): void {
    this._error.set(null);
  }

  // RxJS 相容方法
  getDocument$<T>(path: string): Observable<FirestoreDocumentSnapshot<T> | null> {
    return from(this.getDocument<T>(path));
  }

  getCollection$<T>(config: FirestoreCollectionConfig): Observable<FirestoreQuerySnapshot<T>> {
    return from(this.getCollection<T>(config));
  }

  createDocument$<T>(path: string, data: T, documentId?: string): Observable<string> {
    return from(this.createDocument<T>(path, data, documentId));
  }

  updateDocument$<T>(path: string, data: Partial<T>): Observable<void> {
    return from(this.updateDocument<T>(path, data));
  }

  deleteDocument$(path: string): Observable<void> {
    return from(this.deleteDocument(path));
  }
}
```

### Firestore 查詢建構器
```typescript
import { Injectable } from '@angular/core';
import { FirebaseFirestoreService, FirestoreCollectionConfig, FirestoreQuery, FirestoreOrderBy, FirestorePagination } from './FirebaseFirestoreService';

@Injectable({
  providedIn: 'root'
})
export class FirestoreQueryBuilder {
  constructor(private firestoreService: FirebaseFirestoreService) {}

  // 建立查詢建構器
  static create(): FirestoreQueryBuilder {
    return new FirestoreQueryBuilder(null as any);
  }

  // 設定集合路徑
  collection(path: string): FirestoreQueryBuilder {
    this._path = path;
    return this;
  }

  // 添加查詢條件
  where(field: string, operator: FirestoreQuery['operator'], value: any): FirestoreQueryBuilder {
    if (!this._queries) {
      this._queries = [];
    }
    this._queries.push({ field, operator, value });
    return this;
  }

  // 添加排序
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): FirestoreQueryBuilder {
    if (!this._orderBy) {
      this._orderBy = [];
    }
    this._orderBy.push({ field, direction });
    return this;
  }

  // 設定分頁
  paginate(limit?: number, startAfter?: any, endBefore?: any): FirestoreQueryBuilder {
    this._pagination = { limit, startAfter, endBefore };
    return this;
  }

  // 執行查詢
  async execute<T>(): Promise<any> {
    const config: FirestoreCollectionConfig = {
      path: this._path,
      queries: this._queries,
      orderBy: this._orderBy,
      pagination: this._pagination
    };

    return this.firestoreService.getCollection<T>(config);
  }

  // 執行即時監聽
  listen<T>(): Observable<any> {
    const config: FirestoreCollectionConfig = {
      path: this._path,
      queries: this._queries,
      orderBy: this._orderBy,
      pagination: this._pagination
    };

    return this.firestoreService.listenToCollection<T>(config);
  }

  private _path: string = '';
  private _queries: FirestoreQuery[] = [];
  private _orderBy: FirestoreOrderBy[] = [];
  private _pagination: FirestorePagination = {};
}
```

### Firestore 元件範例
```typescript
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseFirestoreService, FirestoreCollectionConfig } from '@shared/services/FirebaseFirestoreService';
import { Subscription } from 'rxjs';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="project-list">
      <div class="header">
        <h2>專案列表</h2>
        <button class="btn btn-primary" (click)="createProject()">
          新增專案
        </button>
      </div>

      <div class="filters">
        <input
          type="text"
          placeholder="搜尋專案..."
          [(ngModel)]="searchTerm"
          (input)="onSearch()"
          class="form-control"
        />
        
        <select [(ngModel)]="statusFilter" (change)="onFilterChange()" class="form-control">
          <option value="">所有狀態</option>
          <option value="active">進行中</option>
          <option value="completed">已完成</option>
          <option value="archived">已歸檔</option>
        </select>
      </div>

      <div *ngIf="firestoreService.loading()" class="loading">
        <div class="spinner"></div>
        <span>載入中...</span>
      </div>

      <div *ngIf="firestoreService.error()" class="error">
        {{ firestoreService.error() }}
      </div>

      <div class="project-grid">
        <div *ngFor="let project of projects()" class="project-card">
          <h3>{{ project.name }}</h3>
          <p>{{ project.description }}</p>
          <div class="project-meta">
            <span class="status" [class]="'status-' + project.status">
              {{ getStatusText(project.status) }}
            </span>
            <span class="date">
              {{ project.createdAt | date:'yyyy-MM-dd' }}
            </span>
          </div>
          <div class="project-actions">
            <button class="btn btn-sm btn-outline-primary" (click)="editProject(project)">
              編輯
            </button>
            <button class="btn btn-sm btn-outline-danger" (click)="deleteProject(project)">
              刪除
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="projects().length === 0 && !firestoreService.loading()" class="empty">
        沒有找到專案
      </div>
    </div>
  `,
  styles: [`
    .project-list {
      padding: 1rem;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .form-control {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      text-align: center;
    }
    
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error {
      background-color: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    .project-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .project-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1rem;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .project-card h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }
    
    .project-card p {
      margin: 0 0 1rem 0;
      color: #666;
    }
    
    .project-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .status-active {
      background-color: #d4edda;
      color: #155724;
    }
    
    .status-completed {
      background-color: #cce5ff;
      color: #004085;
    }
    
    .status-archived {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .date {
      font-size: 0.875rem;
      color: #666;
    }
    
    .project-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-outline-primary {
      background: none;
      color: #007bff;
      border: 1px solid #007bff;
    }
    
    .btn-outline-danger {
      background: none;
      color: #dc3545;
      border: 1px solid #dc3545;
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
    
    .empty {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
  `]
})
export class ProjectListComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirebaseFirestoreService);
  
  projects = signal<Project[]>([]);
  searchTerm = signal<string>('');
  statusFilter = signal<string>('');
  
  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async loadProjects(): Promise<void> {
    try {
      const config: FirestoreCollectionConfig = {
        path: 'projects',
        queries: this.statusFilter() ? [{ field: 'status', operator: '==', value: this.statusFilter() }] : undefined,
        orderBy: [{ field: 'createdAt', direction: 'desc' }]
      };

      const result = await this.firestoreService.getCollection<Project>(config);
      this.projects.set(result.docs.map(doc => ({ ...doc.data, id: doc.id })));
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  onSearch(): void {
    // 實作搜尋邏輯
    this.loadProjects();
  }

  onFilterChange(): void {
    this.loadProjects();
  }

  async createProject(): Promise<void> {
    const name = prompt('請輸入專案名稱:');
    if (!name) return;

    const description = prompt('請輸入專案描述:');
    
    try {
      await this.firestoreService.createDocument('projects', {
        name,
        description: description || '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      this.loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  }

  async editProject(project: Project): Promise<void> {
    const name = prompt('請輸入新的專案名稱:', project.name);
    if (!name) return;

    const description = prompt('請輸入新的專案描述:', project.description);
    
    try {
      await this.firestoreService.updateDocument(`projects/${project.id}`, {
        name,
        description: description || '',
        updatedAt: new Date()
      });
      
      this.loadProjects();
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  }

  async deleteProject(project: Project): Promise<void> {
    if (!confirm(`確定要刪除專案 "${project.name}" 嗎？`)) return;
    
    try {
      await this.firestoreService.deleteDocument(`projects/${project.id}`);
      this.loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': '進行中',
      'completed': '已完成',
      'archived': '已歸檔'
    };
    return statusMap[status] || status;
  }
}
```

## AI Agent 友好特性

### 1. 完整的型別安全
- 所有方法都有完整的 TypeScript 型別定義
- 提供泛型支援
- 編譯時錯誤檢查

### 2. 響應式資料管理
- 支援即時監聽
- 使用 Angular Signals 提供響應式狀態
- 支援 RxJS Observable

### 3. 查詢建構器
- 提供流暢的 API 建構查詢
- 支援複雜查詢條件
- 支援分頁和排序

### 4. 錯誤處理
- 完整的錯誤訊息本地化
- 統一的錯誤處理機制
- 用戶友好的錯誤提示

## 相關檔案
- `FirebaseAuthService.md` - Firebase 認證服務
- `FirebaseStorageService.md` - Firebase 儲存服務
- `FirebaseMessagingService.md` - Firebase 推播服務
- `Performance Optimization Strategy.md` - 效能優化策略
