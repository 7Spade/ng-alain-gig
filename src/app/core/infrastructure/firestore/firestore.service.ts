/**
 * Firestore 服務
 * 提供 Firestore 資料庫操作功能
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FirestoreDocument {
  id: string;
  data: DocumentData;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);

  /**
   * 獲取單一文檔
   */
  getDocument<T = DocumentData>(collectionName: string, documentId: string): Observable<T | null> {
    const docRef = doc(this.firestore, collectionName, documentId);
    return from(getDoc(docRef)).pipe(
      map((docSnap: DocumentSnapshot<DocumentData>) => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as T;
        }
        return null;
      })
    );
  }

  /**
   * 獲取集合中的所有文檔
   */
  getCollection<T = DocumentData>(collectionName: string): Observable<T[]> {
    const collectionRef = collection(this.firestore, collectionName);
    return from(getDocs(collectionRef)).pipe(
      map(querySnapshot => {
        return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
      })
    );
  }

  /**
   * 查詢文檔
   */
  queryCollection<T = DocumentData>(
    collectionName: string,
    conditions: Array<{ field: string; operator: any; value: any }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ): Observable<T[]> {
    const collectionRef = collection(this.firestore, collectionName);
    let q = query(collectionRef);

    // 添加條件
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });

    // 添加排序
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    // 添加限制
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
      })
    );
  }

  /**
   * 新增文檔
   */
  addDocument<T = DocumentData>(collectionName: string, data: T): Observable<string> {
    const collectionRef = collection(this.firestore, collectionName);
    return from(addDoc(collectionRef, data as DocumentData)).pipe(map(docRef => docRef.id));
  }

  /**
   * 更新文檔
   */
  updateDocument<T = DocumentData>(collectionName: string, documentId: string, data: Partial<T>): Observable<void> {
    const docRef = doc(this.firestore, collectionName, documentId);
    return from(updateDoc(docRef, data as DocumentData));
  }

  /**
   * 刪除文檔
   */
  deleteDocument(collectionName: string, documentId: string): Observable<void> {
    const docRef = doc(this.firestore, collectionName, documentId);
    return from(deleteDoc(docRef));
  }

  /**
   * 檢查文檔是否存在
   */
  documentExists(collectionName: string, documentId: string): Observable<boolean> {
    const docRef = doc(this.firestore, collectionName, documentId);
    return from(getDoc(docRef)).pipe(map((docSnap: DocumentSnapshot<DocumentData>) => docSnap.exists()));
  }
}
