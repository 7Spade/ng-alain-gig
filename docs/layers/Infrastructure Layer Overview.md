# Infrastructure Layer - 基礎設施層設計概覽

## 概述
基礎設施層負責外部服務整合、資料持久化、訊息傳遞等技術實作，為應用層和領域層提供技術支援。

## 基礎設施架構

### 1. Firebase 整合服務
```typescript
// Firebase 認證服務
@Injectable()
export class FirebaseAuthService {
  constructor(
    private firebaseAuth: Auth,
    private firestore: Firestore
  ) {}

  // 用戶認證
  async authenticateUser(credentials: LoginCredentials): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(
      this.firebaseAuth,
      credentials.email,
      credentials.password
    );
    
    const idToken = await userCredential.user.getIdToken();
    const userProfile = await this.getUserProfile(userCredential.user.uid);
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      idToken,
      profile: userProfile
    };
  }

  // 用戶資料管理
  async getUserProfile(uid: string): Promise<UserProfile> {
    const userDoc = await getDoc(doc(this.firestore, 'users', uid));
    return userDoc.data() as UserProfile;
  }

  async updateUserProfile(uid: string, profile: UserProfile): Promise<void> {
    await setDoc(doc(this.firestore, 'users', uid), profile);
  }
}

// Firebase Firestore 服務
@Injectable()
export class FirebaseFirestoreService {
  constructor(private firestore: Firestore) {}

  // 通用 CRUD 操作
  async create<T>(collection: string, data: T): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, collection), data);
    return docRef.id;
  }

  async read<T>(collection: string, id: string): Promise<T | null> {
    const docRef = doc(this.firestore, collection, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as T : null;
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.firestore, collection, id);
    await updateDoc(docRef, data);
  }

  async delete(collection: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, collection, id);
    await deleteDoc(docRef);
  }

  // 查詢操作
  async query<T>(
    collection: string, 
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    const q = query(collection(this.firestore, collection), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as T);
  }

  // 即時監聽
  listenToCollection<T>(
    collection: string,
    callback: (data: T[]) => void
  ): Unsubscribe {
    return onSnapshot(collection(this.firestore, collection), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as T);
      callback(data);
    });
  }
}

// Firebase Storage 服務
@Injectable()
export class FirebaseStorageService {
  constructor(private storage: Storage) {}

  // 檔案上傳
  async uploadFile(
    file: File, 
    path: string, 
    metadata?: UploadMetadata
  ): Promise<UploadResult> {
    const storageRef = ref(this.storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // 上傳進度
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve({
              downloadURL,
              metadata: uploadTask.snapshot.metadata
            });
          });
        }
      );
    });
  }

  // 檔案下載
  async downloadFile(path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    return await getDownloadURL(storageRef);
  }

  // 檔案刪除
  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(this.storage, path);
    await deleteObject(storageRef);
  }
}

// Firebase Messaging 服務
@Injectable()
export class FirebaseMessagingService {
  constructor(private messaging: Messaging) {}

  // 請求通知權限
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await requestPermission(this.messaging);
      return permission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // 取得 FCM Token
  async getToken(): Promise<string | null> {
    try {
      return await getToken(this.messaging);
    } catch (error) {
      console.error('Token retrieval failed:', error);
      return null;
    }
  }

  // 監聽訊息
  onMessage(): Observable<MessagePayload> {
    return new Observable(observer => {
      onMessage(this.messaging, (payload) => {
        observer.next(payload);
      });
    });
  }
}
```

### 2. Repository 實作
```typescript
// 用戶 Repository
@Injectable()
export class FirebaseUserRepository implements UserRepository {
  constructor(private firestoreService: FirebaseFirestoreService) {}

  async findById(id: string): Promise<UserAggregate | null> {
    const userData = await this.firestoreService.read<UserData>('users', id);
    return userData ? this.toAggregate(userData) : null;
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    const users = await this.firestoreService.query<UserData>('users', [
      where('email', '==', email)
    ]);
    return users.length > 0 ? this.toAggregate(users[0]) : null;
  }

  async save(userAggregate: UserAggregate): Promise<void> {
    const userData = this.toData(userAggregate);
    await this.firestoreService.update('users', userAggregate.id, userData);
  }

  private toAggregate(userData: UserData): UserAggregate {
    // 將 Firestore 資料轉換為領域聚合
  }

  private toData(userAggregate: UserAggregate): UserData {
    // 將領域聚合轉換為 Firestore 資料
  }
}

// 專案 Repository
@Injectable()
export class FirebaseProjectRepository implements ProjectRepository {
  constructor(private firestoreService: FirebaseFirestoreService) {}

  async findById(id: string): Promise<ProjectAggregate | null> {
    const projectData = await this.firestoreService.read<ProjectData>('projects', id);
    return projectData ? this.toAggregate(projectData) : null;
  }

  async findByOrganization(organizationId: string): Promise<ProjectAggregate[]> {
    const projects = await this.firestoreService.query<ProjectData>('projects', [
      where('organizationId', '==', organizationId)
    ]);
    return projects.map(project => this.toAggregate(project));
  }

  async save(projectAggregate: ProjectAggregate): Promise<void> {
    const projectData = this.toData(projectAggregate);
    await this.firestoreService.update('projects', projectAggregate.id, projectData);
  }
}
```

### 3. 外部服務整合
```typescript
// 地圖服務
@Injectable()
export class MapService {
  constructor(private http: HttpClient) {}

  async geocodeAddress(address: string): Promise<Coordinates> {
    const response = await this.http.get<GeocodeResponse>(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${environment.googleMapsApiKey}`
    ).toPromise();
    
    return {
      lat: response.results[0].geometry.location.lat,
      lng: response.results[0].geometry.location.lng
    };
  }

  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    const response = await this.http.get<ReverseGeocodeResponse>(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${environment.googleMapsApiKey}`
    ).toPromise();
    
    return response.results[0].formatted_address;
  }
}

// 支付服務
@Injectable()
export class PaymentService {
  constructor(private http: HttpClient) {}

  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    const response = await this.http.post<PaymentResponse>(
      '/api/payments/process',
      paymentData
    ).toPromise();
    
    return {
      success: response.success,
      transactionId: response.transactionId,
      message: response.message
    };
  }

  async refundPayment(transactionId: string): Promise<RefundResult> {
    const response = await this.http.post<RefundResponse>(
      `/api/payments/${transactionId}/refund`,
      {}
    ).toPromise();
    
    return {
      success: response.success,
      refundId: response.refundId,
      message: response.message
    };
  }
}

// 郵件服務
@Injectable()
export class EmailService {
  constructor(private http: HttpClient) {}

  async sendEmail(emailData: EmailData): Promise<void> {
    await this.http.post('/api/emails/send', emailData).toPromise();
  }

  async sendTemplateEmail(
    templateId: string, 
    recipient: string, 
    data: any
  ): Promise<void> {
    await this.http.post('/api/emails/send-template', {
      templateId,
      recipient,
      data
    }).toPromise();
  }
}
```

### 4. 訊息佇列服務
```typescript
// 事件發布服務
@Injectable()
export class EventPublisherService {
  constructor(private http: HttpClient) {}

  async publishEvent(event: DomainEvent): Promise<void> {
    await this.http.post('/api/events/publish', {
      eventType: event.constructor.name,
      eventData: event,
      timestamp: new Date().toISOString()
    }).toPromise();
  }

  async publishBatchEvents(events: DomainEvent[]): Promise<void> {
    await this.http.post('/api/events/publish-batch', {
      events: events.map(event => ({
        eventType: event.constructor.name,
        eventData: event,
        timestamp: new Date().toISOString()
      }))
    }).toPromise();
  }
}

// 事件訂閱服務
@Injectable()
export class EventSubscriberService {
  constructor(private http: HttpClient) {}

  // 訂閱事件
  subscribeToEvent(eventType: string, handler: (event: any) => void): void {
    // WebSocket 或 Server-Sent Events 實作
  }

  // 取消訂閱
  unsubscribeFromEvent(eventType: string): void {
    // 取消訂閱邏輯
  }
}
```

### 5. 快取服務
```typescript
// Redis 快取服務
@Injectable()
export class CacheService {
  constructor(private http: HttpClient) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const response = await this.http.get<CacheResponse<T>>(`/api/cache/${key}`).toPromise();
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
    await this.http.post('/api/cache', {
      key,
      data,
      ttl
    }).toPromise();
  }

  async delete(key: string): Promise<void> {
    await this.http.delete(`/api/cache/${key}`).toPromise();
  }

  async clear(): Promise<void> {
    await this.http.delete('/api/cache/clear').toPromise();
  }
}

// 本地快取服務
@Injectable()
export class LocalCacheService {
  private cache = new Map<string, { data: any; expiry: number }>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set<T>(key: string, data: T, ttl: number = 3600000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

## 配置管理

### 1. 環境配置
```typescript
// 環境配置
export const environment = {
  production: false,
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your-app-id'
  },
  api: {
    baseUrl: 'https://api.yourdomain.com',
    timeout: 30000
  },
  features: {
    enableNotifications: true,
    enableAnalytics: true,
    enableCrashReporting: true
  }
};
```

### 2. 服務配置
```typescript
// 服務提供者配置
export const INFRASTRUCTURE_PROVIDERS = [
  // Firebase 服務
  { provide: FirebaseAuthService, useClass: FirebaseAuthService },
  { provide: FirebaseFirestoreService, useClass: FirebaseFirestoreService },
  { provide: FirebaseStorageService, useClass: FirebaseStorageService },
  { provide: FirebaseMessagingService, useClass: FirebaseMessagingService },
  
  // Repository 服務
  { provide: UserRepository, useClass: FirebaseUserRepository },
  { provide: ProjectRepository, useClass: FirebaseProjectRepository },
  { provide: OrganizationRepository, useClass: FirebaseOrganizationRepository },
  
  // 外部服務
  { provide: MapService, useClass: MapService },
  { provide: PaymentService, useClass: PaymentService },
  { provide: EmailService, useClass: EmailService },
  
  // 快取服務
  { provide: CacheService, useClass: CacheService },
  { provide: LocalCacheService, useClass: LocalCacheService }
];
```

## 相關文件
- [Firebase 整合設計](./Firebase/)
- [Repository 設計](./Repositories/)
- [外部服務設計](./ExternalServices/)
- [訊息服務設計](./Messaging/)
