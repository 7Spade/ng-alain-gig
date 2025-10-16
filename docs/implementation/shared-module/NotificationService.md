# 通知服務 (Notification Service)

## 概述

通知服務是營建管理系統的核心服務，負責處理所有類型的通知，包括即時推送、郵件通知、推播通知等。採用 Angular 20 的 Signal-based 架構，提供響應式的通知管理。

## 功能特色

### 1. 多通道通知
- **應用內通知**: 即時 WebSocket 推送
- **郵件通知**: SMTP 郵件發送
- **推播通知**: Firebase Cloud Messaging
- **簡訊通知**: SMS 服務整合
- **Webhook 通知**: 第三方系統整合

### 2. 通知管理
- **通知偏好**: 用戶自定義通知設定
- **通知分類**: 按類型組織通知
- **通知歷史**: 完整的通知記錄
- **批量通知**: 支援大量用戶通知

### 3. 智能通知
- **去重機制**: 避免重複通知
- **優先級管理**: 根據重要性排序
- **靜音時段**: 用戶設定的免打擾時間
- **通知聚合**: 相似通知合併處理

## 實作範例

### 通知服務核心
```typescript
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _unreadCount = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);
  
  // 公開的只讀信號
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  
  // 計算屬性
  readonly hasUnreadNotifications = computed(() => this._unreadCount() > 0);
  readonly recentNotifications = computed(() => 
    this._notifications().slice(0, 5)
  );
  
  constructor(
    private http: HttpClient,
    private websocketService: WebSocketService,
    private emailService: EmailService,
    private pushService: PushService
  ) {
    this.initializeWebSocket();
  }
  
  // 發送通知
  async sendNotification(notification: CreateNotificationRequest): Promise<void> {
    this._isLoading.set(true);
    
    try {
      const response = await this.http.post<NotificationResponse>(
        '/api/v1/notifications',
        notification
      ).toPromise();
      
      // 更新本地狀態
      this._notifications.update(notifications => [response, ...notifications]);
      this._unreadCount.update(count => count + 1);
      
      // 根據用戶偏好發送到不同通道
      await this.distributeNotification(response, notification.channels);
      
    } catch (error) {
      console.error('發送通知失敗:', error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  // 標記通知為已讀
  markAsRead(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.map(n => 
        n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
      )
    );
    
    this._unreadCount.update(count => Math.max(0, count - 1));
    
    // 同步到伺服器
    this.http.patch(`/api/v1/notifications/${notificationId}/read`, {}).subscribe();
  }
  
  // 獲取通知列表
  async getNotifications(options: NotificationQueryOptions = {}): Promise<void> {
    this._isLoading.set(true);
    
    try {
      const response = await this.http.get<NotificationListResponse>(
        '/api/v1/notifications',
        { params: this.buildQueryParams(options) }
      ).toPromise();
      
      this._notifications.set(response.notifications);
      this._unreadCount.set(response.unreadCount);
      
    } catch (error) {
      console.error('獲取通知失敗:', error);
    } finally {
      this._isLoading.set(false);
    }
  }
  
  // 更新通知偏好
  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    await this.http.put('/api/v1/notifications/preferences', preferences).toPromise();
  }
  
  // 分發通知到不同通道
  private async distributeNotification(
    notification: NotificationResponse,
    channels: NotificationChannel[]
  ): Promise<void> {
    const promises = channels.map(channel => {
      switch (channel) {
        case 'in-app':
          return this.sendInAppNotification(notification);
        case 'email':
          return this.sendEmailNotification(notification);
        case 'push':
          return this.sendPushNotification(notification);
        case 'sms':
          return this.sendSmsNotification(notification);
        default:
          return Promise.resolve();
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  // WebSocket 即時通知
  private sendInAppNotification(notification: NotificationResponse): Promise<void> {
    return this.websocketService.send('notification', notification);
  }
  
  // 郵件通知
  private async sendEmailNotification(notification: NotificationResponse): Promise<void> {
    const emailTemplate = await this.getEmailTemplate(notification.type);
    const emailContent = this.renderEmailTemplate(emailTemplate, notification);
    
    await this.emailService.send({
      to: notification.recipientEmail,
      subject: notification.title,
      html: emailContent,
      templateId: emailTemplate.id
    });
  }
  
  // 推播通知
  private async sendPushNotification(notification: NotificationResponse): Promise<void> {
    await this.pushService.send({
      title: notification.title,
      body: notification.content,
      data: {
        notificationId: notification.id,
        type: notification.type,
        url: notification.actionUrl
      }
    });
  }
  
  // 初始化 WebSocket 連接
  private initializeWebSocket(): void {
    this.websocketService.on('notification').subscribe(notification => {
      this._notifications.update(notifications => [notification, ...notifications]);
      this._unreadCount.update(count => count + 1);
    });
  }
  
  private buildQueryParams(options: NotificationQueryOptions): HttpParams {
    let params = new HttpParams();
    
    if (options.type) params = params.set('type', options.type);
    if (options.read !== undefined) params = params.set('read', options.read.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.offset) params = params.set('offset', options.offset.toString());
    
    return params;
  }
}
```

### 通知類型定義
```typescript
// 通知介面
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  recipientId: string;
  recipientEmail: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// 通知類型
export enum NotificationType {
  PROJECT = 'project',
  TASK = 'task',
  TEAM = 'team',
  SYSTEM = 'system',
  ACHIEVEMENT = 'achievement',
  SECURITY = 'security'
}

// 通知優先級
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 通知通道
export enum NotificationChannel {
  IN_APP = 'in-app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  WEBHOOK = 'webhook'
}

// 通知偏好設定
export interface NotificationPreferences {
  userId: string;
  channels: {
    [key in NotificationType]: NotificationChannel[];
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  frequency: {
    [key in NotificationType]: 'immediate' | 'daily' | 'weekly' | 'never';
  };
}

// 建立通知請求
export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  content: string;
  recipientId: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  actionUrl?: string;
  metadata?: Record<string, any>;
}
```

### 通知模板系統
```typescript
@Injectable()
export class NotificationTemplateService {
  private templates = new Map<NotificationType, NotificationTemplate>();
  
  constructor() {
    this.initializeTemplates();
  }
  
  getTemplate(type: NotificationType): NotificationTemplate {
    return this.templates.get(type) || this.getDefaultTemplate();
  }
  
  renderTemplate(template: NotificationTemplate, data: any): string {
    let content = template.content;
    
    // 替換模板變數
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), data[key]);
    });
    
    return content;
  }
  
  private initializeTemplates(): void {
    this.templates.set(NotificationType.PROJECT, {
      id: 'project-notification',
      subject: '專案更新通知',
      content: `
        <h2>{{projectName}} 專案更新</h2>
        <p>親愛的 {{userName}}，</p>
        <p>{{message}}</p>
        <p><a href="{{projectUrl}}">查看專案詳情</a></p>
      `,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
    });
    
    this.templates.set(NotificationType.TASK, {
      id: 'task-notification',
      subject: '任務指派通知',
      content: `
        <h2>新任務指派</h2>
        <p>您有一個新任務：{{taskTitle}}</p>
        <p>截止日期：{{dueDate}}</p>
        <p><a href="{{taskUrl}}">查看任務詳情</a></p>
      `,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH]
    });
  }
  
  private getDefaultTemplate(): NotificationTemplate {
    return {
      id: 'default',
      subject: '系統通知',
      content: '{{content}}',
      channels: [NotificationChannel.IN_APP]
    };
  }
}
```

## API 端點

### 通知管理
- `GET /api/v1/notifications` - 獲取通知列表
- `POST /api/v1/notifications` - 發送通知
- `PATCH /api/v1/notifications/:id/read` - 標記已讀
- `DELETE /api/v1/notifications/:id` - 刪除通知

### 偏好設定
- `GET /api/v1/notifications/preferences` - 獲取通知偏好
- `PUT /api/v1/notifications/preferences` - 更新通知偏好

### 批量操作
- `POST /api/v1/notifications/bulk` - 批量發送通知
- `PATCH /api/v1/notifications/bulk/read` - 批量標記已讀

## 效能優化

### 1. 快取策略
- 通知列表快取（5分鐘 TTL）
- 用戶偏好快取（30分鐘 TTL）
- 模板快取（1小時 TTL）

### 2. 批量處理
- 批量發送通知（每批 100 個）
- 批量標記已讀
- 批量更新偏好

### 3. 非同步處理
- 非關鍵通知異步發送
- 郵件通知使用佇列
- 推播通知延遲重試

## 最佳實踐

### 使用建議
1. **優先級設計**: 合理設定通知優先級
2. **用戶體驗**: 提供清晰的偏好設定
3. **效能考量**: 使用快取和批量處理
4. **錯誤處理**: 完善的錯誤處理和重試機制

### 避免事項
1. 不要發送過多通知
2. 不要忽略用戶偏好
3. 不要阻塞主線程
4. 不要忘記處理離線用戶
