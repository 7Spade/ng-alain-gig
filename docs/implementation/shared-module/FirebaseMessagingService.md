# FirebaseMessagingService (Firebase 推播服務)

## 概述
`FirebaseMessagingService` 是一個封裝 Firebase Cloud Messaging (FCM) 的 Angular 服務，提供完整的推播通知功能，包括訂閱主題、發送通知、處理通知點擊和背景通知。

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
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  data?: { [key: string]: string };
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface FCMToken {
  token: string;
  refreshTime: Date;
}

export interface TopicSubscription {
  topic: string;
  subscribedAt: Date;
}
```

## Angular 實作

### FirebaseMessagingService 服務
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Messaging, getToken, onMessage, deleteToken } from '@angular/fire/messaging';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseMessagingService {
  private messaging = inject(Messaging);

  private _token = signal<string | null>(null);
  private _permission = signal<NotificationPermission>('default');
  private _notifications = signal<NotificationPayload[]>([]);

  readonly token = this._token.asReadonly();
  readonly permission = this._permission.asReadonly();
  readonly notifications = this._notifications.asReadonly();

  private messageSubject = new BehaviorSubject<NotificationPayload | null>(null);
  public message$ = this.messageSubject.asObservable();

  constructor() {
    this.initializeMessaging();
  }

  private async initializeMessaging(): Promise<void> {
    try {
      // 請求通知權限
      const permission = await this.requestPermission();
      this._permission.set(permission);

      if (permission === 'granted') {
        // 獲取 FCM token
        const token = await this.getFCMToken();
        this._token.set(token);

        // 監聽前台訊息
        this.listenToMessages();
      }
    } catch (error) {
      console.error('Failed to initialize messaging:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this._permission.set(permission);
    return permission;
  }

  async getFCMToken(): Promise<string | null> {
    try {
      const token = await getToken(this.messaging, {
        vapidKey: 'your-vapid-key' // 替換為實際的 VAPID key
      });
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  private listenToMessages(): void {
    onMessage(this.messaging, (payload) => {
      const notification: NotificationPayload = {
        title: payload.notification?.title || '通知',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon,
        image: payload.notification?.image,
        data: payload.data as { [key: string]: string }
      };

      this.messageSubject.next(notification);
      this.showNotification(notification);
    });
  }

  private showNotification(notification: NotificationPayload): void {
    if (this._permission() === 'granted') {
      const notificationOptions: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || '/assets/icons/notification-icon.png',
        image: notification.image,
        badge: notification.badge,
        data: notification.data,
        actions: notification.actions
      };

      const notif = new Notification(notification.title, notificationOptions);
      
      notif.onclick = (event) => {
        event.preventDefault();
        this.handleNotificationClick(notification);
        notif.close();
      };

      // 自動關閉通知
      setTimeout(() => notif.close(), 5000);
    }
  }

  private handleNotificationClick(notification: NotificationPayload): void {
    // 處理通知點擊事件
    console.log('Notification clicked:', notification);
    
    // 可以在這裡添加導航邏輯
    if (notification.data?.url) {
      window.open(notification.data.url, '_blank');
    }
  }

  async subscribeToTopic(topic: string): Promise<void> {
    try {
      const token = this._token();
      if (!token) {
        throw new Error('No FCM token available');
      }

      // 這裡需要後端 API 來訂閱主題
      await fetch('/api/messaging/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, topic })
      });
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
      throw error;
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      const token = this._token();
      if (!token) {
        throw new Error('No FCM token available');
      }

      // 這裡需要後端 API 來取消訂閱主題
      await fetch('/api/messaging/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, topic })
      });
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', error);
      throw error;
    }
  }

  async deleteToken(): Promise<void> {
    try {
      await deleteToken(this.messaging);
      this._token.set(null);
    } catch (error) {
      console.error('Failed to delete token:', error);
      throw error;
    }
  }
}
```

## AI Agent 友好特性

### 1. 完整的型別安全
- 所有方法都有完整的 TypeScript 型別定義
- 提供介面和型別別名
- 編譯時錯誤檢查

### 2. 響應式狀態管理
- 使用 Angular Signals 提供響應式狀態
- 支援 RxJS Observable
- 自動狀態同步

### 3. 權限管理
- 自動請求通知權限
- 權限狀態監控
- 優雅降級處理

### 4. 通知處理
- 前台和背景通知支援
- 通知點擊處理
- 自定義通知選項

## 相關檔案
- `FirebaseAuthService.md` - Firebase 認證服務
- `FirebaseFirestoreService.md` - Firestore 資料庫服務
- `FirebaseStorageService.md` - Firebase 儲存服務
- `Security Strategy.md` - 安全策略