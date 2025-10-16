# Error Handling Strategy - 錯誤處理策略

## 概述
Error Handling Strategy 定義了系統的全局錯誤處理策略，包括錯誤分類、錯誤處理流程、錯誤記錄、錯誤通知和錯誤恢復機制。它確保系統能夠優雅地處理各種錯誤情況，並提供良好的用戶體驗。

## 技術規格

### 錯誤分類
```typescript
export enum ErrorType {
  // 系統錯誤
  SYSTEM_ERROR = 'system_error',
  NETWORK_ERROR = 'network_error',
  DATABASE_ERROR = 'database_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  
  // 業務錯誤
  VALIDATION_ERROR = 'validation_error',
  BUSINESS_LOGIC_ERROR = 'business_logic_error',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RESOURCE_CONFLICT = 'resource_conflict',
  
  // 用戶錯誤
  USER_INPUT_ERROR = 'user_input_error',
  USER_PERMISSION_ERROR = 'user_permission_error',
  
  // 外部服務錯誤
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  API_ERROR = 'api_error',
  
  // 前端錯誤
  COMPONENT_ERROR = 'component_error',
  ROUTING_ERROR = 'routing_error',
  FORM_ERROR = 'form_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  stackTrace?: string;
  additionalData?: { [key: string]: any };
}
```

### 錯誤處理介面
```typescript
export interface ErrorHandler {
  handle(error: AppError): void;
  canHandle(error: AppError): boolean;
  getPriority(): number;
}

export interface ErrorLogger {
  log(error: AppError): void;
  logError(error: Error, context?: ErrorContext): void;
  logWarning(message: string, context?: ErrorContext): void;
  logInfo(message: string, context?: ErrorContext): void;
}

export interface ErrorNotifier {
  notify(error: AppError): void;
  notifyUser(message: string, type: 'error' | 'warning' | 'info'): void;
}

export interface ErrorRecovery {
  canRecover(error: AppError): boolean;
  recover(error: AppError): Promise<void>;
}
```

## Angular 實作

### 錯誤處理服務
```typescript
import { Injectable, inject, ErrorHandler as AngularErrorHandler } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements AngularErrorHandler {
  private router = inject(Router);
  private errorLogger = inject(ErrorLoggerService);
  private errorNotifier = inject(ErrorNotifierService);
  private errorRecovery = inject(ErrorRecoveryService);
  
  private errorSubject = new BehaviorSubject<AppError | null>(null);
  public error$ = this.errorSubject.asObservable();

  handleError(error: any): void {
    const appError = this.convertToAppError(error);
    this.processError(appError);
  }

  private convertToAppError(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      return this.convertHttpError(error);
    }

    if (error instanceof Error) {
      return this.convertGenericError(error);
    }

    return new AppError(
      ErrorType.SYSTEM_ERROR,
      'Unknown error occurred',
      ErrorSeverity.HIGH,
      { originalError: error }
    );
  }

  private convertHttpError(error: HttpErrorResponse): AppError {
    const errorType = this.getHttpErrorType(error.status);
    const message = this.getHttpErrorMessage(error);
    
    return new AppError(
      errorType,
      message,
      this.getErrorSeverity(error.status),
      {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        body: error.error
      }
    );
  }

  private convertGenericError(error: Error): AppError {
    return new AppError(
      ErrorType.SYSTEM_ERROR,
      error.message,
      ErrorSeverity.MEDIUM,
      {
        stack: error.stack,
        name: error.name
      }
    );
  }

  private getHttpErrorType(status: number): ErrorType {
    switch (status) {
      case 401:
        return ErrorType.AUTHENTICATION_ERROR;
      case 403:
        return ErrorType.AUTHORIZATION_ERROR;
      case 404:
        return ErrorType.RESOURCE_NOT_FOUND;
      case 409:
        return ErrorType.RESOURCE_CONFLICT;
      case 422:
        return ErrorType.VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorType.SYSTEM_ERROR;
      default:
        return ErrorType.API_ERROR;
    }
  }

  private getHttpErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }

    switch (error.status) {
      case 401:
        return '認證失敗，請重新登入';
      case 403:
        return '沒有權限執行此操作';
      case 404:
        return '請求的資源不存在';
      case 409:
        return '資源衝突，請檢查資料';
      case 422:
        return '資料驗證失敗';
      case 500:
        return '伺服器內部錯誤';
      case 502:
        return '閘道錯誤';
      case 503:
        return '服務暫時不可用';
      case 504:
        return '請求超時';
      default:
        return `HTTP 錯誤 ${error.status}: ${error.statusText}`;
    }
  }

  private getErrorSeverity(status: number): ErrorSeverity {
    if (status >= 500) {
      return ErrorSeverity.CRITICAL;
    } else if (status >= 400) {
      return ErrorSeverity.HIGH;
    } else {
      return ErrorSeverity.MEDIUM;
    }
  }

  private async processError(error: AppError): Promise<void> {
    // 記錄錯誤
    this.errorLogger.logError(error);

    // 通知用戶
    this.errorNotifier.notify(error);

    // 嘗試恢復
    if (this.errorRecovery.canRecover(error)) {
      try {
        await this.errorRecovery.recover(error);
        return;
      } catch (recoveryError) {
        console.error('Error recovery failed:', recoveryError);
      }
    }

    // 發送錯誤事件
    this.errorSubject.next(error);

    // 根據錯誤類型執行特定處理
    await this.handleSpecificError(error);
  }

  private async handleSpecificError(error: AppError): Promise<void> {
    switch (error.type) {
      case ErrorType.AUTHENTICATION_ERROR:
        await this.handleAuthenticationError(error);
        break;
      case ErrorType.AUTHORIZATION_ERROR:
        await this.handleAuthorizationError(error);
        break;
      case ErrorType.RESOURCE_NOT_FOUND:
        await this.handleResourceNotFoundError(error);
        break;
      case ErrorType.NETWORK_ERROR:
        await this.handleNetworkError(error);
        break;
      case ErrorType.SYSTEM_ERROR:
        await this.handleSystemError(error);
        break;
      default:
        await this.handleGenericError(error);
    }
  }

  private async handleAuthenticationError(error: AppError): Promise<void> {
    // 清除認證資訊
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // 重定向到登入頁面
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  private async handleAuthorizationError(error: AppError): Promise<void> {
    // 顯示權限錯誤訊息
    this.errorNotifier.notifyUser(
      '您沒有權限執行此操作',
      'error'
    );
  }

  private async handleResourceNotFoundError(error: AppError): Promise<void> {
    // 重定向到 404 頁面
    this.router.navigate(['/404']);
  }

  private async handleNetworkError(error: AppError): Promise<void> {
    // 顯示網路錯誤訊息
    this.errorNotifier.notifyUser(
      '網路連線異常，請檢查網路設定',
      'error'
    );
  }

  private async handleSystemError(error: AppError): Promise<void> {
    // 重定向到錯誤頁面
    this.router.navigate(['/error'], {
      queryParams: { 
        type: error.type,
        message: error.message 
      }
    });
  }

  private async handleGenericError(error: AppError): Promise<void> {
    // 顯示一般錯誤訊息
    this.errorNotifier.notifyUser(
      error.message || '發生未知錯誤',
      'error'
    );
  }
}
```

### 錯誤記錄服務
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ErrorLoggerService implements ErrorLogger {
  private http = inject(HttpClient);
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;

  log(error: AppError): void {
    this.addToQueue(error);
    this.logToConsole(error);
    this.logToServer(error);
  }

  logError(error: Error, context?: ErrorContext): void {
    const appError = new AppError(
      ErrorType.SYSTEM_ERROR,
      error.message,
      ErrorSeverity.MEDIUM,
      {
        stack: error.stack,
        name: error.name,
        ...context
      }
    );
    
    this.log(appError);
  }

  logWarning(message: string, context?: ErrorContext): void {
    const appError = new AppError(
      ErrorType.SYSTEM_ERROR,
      message,
      ErrorSeverity.LOW,
      context
    );
    
    this.log(appError);
  }

  logInfo(message: string, context?: ErrorContext): void {
    console.info(`[INFO] ${message}`, context);
  }

  private addToQueue(error: AppError): void {
    this.errorQueue.push(error);
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private logToConsole(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = this.formatLogMessage(error);
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, error);
        break;
      case 'warn':
        console.warn(logMessage, error);
        break;
      case 'info':
        console.info(logMessage, error);
        break;
      default:
        console.log(logMessage, error);
    }
  }

  private async logToServer(error: AppError): Promise<void> {
    try {
      const logData = {
        type: error.type,
        message: error.message,
        severity: error.severity,
        context: error.context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      await this.http.post(`${environment.apiUrl}/logs/errors`, logData).toPromise();
    } catch (logError) {
      console.error('Failed to log error to server:', logError);
    }
  }

  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  private formatLogMessage(error: AppError): string {
    return `[${error.type}] ${error.message}`;
  }

  // 獲取錯誤統計
  getErrorStats(): ErrorStats {
    const stats: ErrorStats = {
      total: this.errorQueue.length,
      byType: {},
      bySeverity: {},
      recent: this.errorQueue.slice(-10)
    };

    this.errorQueue.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}
```

### 錯誤通知服務
```typescript
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorNotifierService implements ErrorNotifier {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  
  private notificationSubject = new BehaviorSubject<NotificationMessage | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  notify(error: AppError): void {
    const message = this.getErrorMessage(error);
    const type = this.getNotificationType(error.severity);
    
    this.showNotification(message, type);
  }

  notifyUser(message: string, type: 'error' | 'warning' | 'info'): void {
    this.showNotification(message, type);
  }

  private showNotification(message: string, type: 'error' | 'warning' | 'info'): void {
    const notification: NotificationMessage = {
      message,
      type,
      timestamp: new Date()
    };

    this.notificationSubject.next(notification);

    // 顯示 SnackBar
    this.snackBar.open(message, '關閉', {
      duration: this.getNotificationDuration(type),
      panelClass: this.getNotificationClass(type),
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private getErrorMessage(error: AppError): string {
    // 根據錯誤類型返回用戶友好的訊息
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return '請檢查輸入資料是否正確';
      case ErrorType.AUTHENTICATION_ERROR:
        return '登入已過期，請重新登入';
      case ErrorType.AUTHORIZATION_ERROR:
        return '您沒有權限執行此操作';
      case ErrorType.RESOURCE_NOT_FOUND:
        return '找不到請求的資源';
      case ErrorType.NETWORK_ERROR:
        return '網路連線異常，請稍後再試';
      case ErrorType.SYSTEM_ERROR:
        return '系統發生錯誤，請聯繫技術支援';
      default:
        return error.message || '發生未知錯誤';
    }
  }

  private getNotificationType(severity: ErrorSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'info';
    }
  }

  private getNotificationDuration(type: 'error' | 'warning' | 'info'): number {
    switch (type) {
      case 'error':
        return 5000;
      case 'warning':
        return 4000;
      case 'info':
        return 3000;
      default:
        return 3000;
    }
  }

  private getNotificationClass(type: 'error' | 'warning' | 'info'): string {
    switch (type) {
      case 'error':
        return 'error-snackbar';
      case 'warning':
        return 'warning-snackbar';
      case 'info':
        return 'info-snackbar';
      default:
        return 'info-snackbar';
    }
  }

  // 顯示錯誤對話框
  showErrorDialog(error: AppError): void {
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '400px',
      data: {
        title: '錯誤',
        message: this.getErrorMessage(error),
        details: error.context,
        type: error.type,
        severity: error.severity
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'retry') {
        // 執行重試邏輯
        this.retryAction(error);
      }
    });
  }

  private retryAction(error: AppError): void {
    // 實作重試邏輯
    console.log('Retrying action for error:', error);
  }
}
```

### 錯誤恢復服務
```typescript
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorRecoveryService implements ErrorRecovery {
  private router = inject(Router);
  private http = inject(HttpClient);
  
  private retryAttempts = new Map<string, number>();
  private maxRetryAttempts = 3;

  canRecover(error: AppError): boolean {
    // 判斷是否可以恢復
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.API_ERROR:
        return this.getRetryAttempts(error) < this.maxRetryAttempts;
      case ErrorType.AUTHENTICATION_ERROR:
        return true; // 可以通過重新登入恢復
      case ErrorType.RESOURCE_NOT_FOUND:
        return false; // 資源不存在無法恢復
      case ErrorType.VALIDATION_ERROR:
        return false; // 驗證錯誤需要用戶修正
      default:
        return false;
    }
  }

  async recover(error: AppError): Promise<void> {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        await this.recoverNetworkError(error);
        break;
      case ErrorType.API_ERROR:
        await this.recoverApiError(error);
        break;
      case ErrorType.AUTHENTICATION_ERROR:
        await this.recoverAuthenticationError(error);
        break;
      default:
        throw new Error(`Cannot recover from error type: ${error.type}`);
    }
  }

  private async recoverNetworkError(error: AppError): Promise<void> {
    const attempts = this.getRetryAttempts(error);
    
    if (attempts >= this.maxRetryAttempts) {
      throw new Error('Max retry attempts reached');
    }

    // 等待一段時間後重試
    await this.delay(1000 * Math.pow(2, attempts)); // 指數退避
    
    // 重試請求
    if (error.context?.originalRequest) {
      try {
        await this.http.request(error.context.originalRequest).toPromise();
        this.clearRetryAttempts(error);
      } catch (retryError) {
        this.incrementRetryAttempts(error);
        throw retryError;
      }
    }
  }

  private async recoverApiError(error: AppError): Promise<void> {
    const attempts = this.getRetryAttempts(error);
    
    if (attempts >= this.maxRetryAttempts) {
      throw new Error('Max retry attempts reached');
    }

    // 檢查是否是可重試的 HTTP 狀態碼
    const status = error.context?.status;
    if (status && (status >= 500 || status === 429)) {
      await this.delay(1000 * Math.pow(2, attempts));
      
      if (error.context?.originalRequest) {
        try {
          await this.http.request(error.context.originalRequest).toPromise();
          this.clearRetryAttempts(error);
        } catch (retryError) {
          this.incrementRetryAttempts(error);
          throw retryError;
        }
      }
    }
  }

  private async recoverAuthenticationError(error: AppError): Promise<void> {
    // 清除認證資訊
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // 重定向到登入頁面
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  private getRetryAttempts(error: AppError): number {
    const key = this.getErrorKey(error);
    return this.retryAttempts.get(key) || 0;
  }

  private incrementRetryAttempts(error: AppError): void {
    const key = this.getErrorKey(error);
    const attempts = this.getRetryAttempts(error);
    this.retryAttempts.set(key, attempts + 1);
  }

  private clearRetryAttempts(error: AppError): void {
    const key = this.getErrorKey(error);
    this.retryAttempts.delete(key);
  }

  private getErrorKey(error: AppError): string {
    return `${error.type}-${error.context?.url || 'unknown'}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 錯誤對話框元件
```typescript
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-error-dialog',
  template: `
    <div class="error-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      
      <mat-dialog-content>
        <div class="error-message">
          <mat-icon [class]="getIconClass()">{{ getIcon() }}</mat-icon>
          <p>{{ data.message }}</p>
        </div>
        
        <div *ngIf="showDetails" class="error-details">
          <h4>詳細資訊</h4>
          <pre>{{ formatDetails() }}</pre>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="showDetails = !showDetails">
          {{ showDetails ? '隱藏' : '顯示' }}詳細資訊
        </button>
        <button mat-button (click)="onRetry()" *ngIf="canRetry">
          重試
        </button>
        <button mat-button mat-dialog-close>
          關閉
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .error-dialog {
      min-width: 400px;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .error-details {
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .error-details pre {
      margin: 0;
      font-size: 12px;
      white-space: pre-wrap;
    }
    
    .mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .icon-error {
      color: #f44336;
    }
    
    .icon-warning {
      color: #ff9800;
    }
    
    .icon-info {
      color: #2196f3;
    }
  `]
})
export class ErrorDialogComponent {
  showDetails = false;
  canRetry = false;

  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData
  ) {
    this.canRetry = this.data.type === 'network_error' || this.data.type === 'api_error';
  }

  getIcon(): string {
    switch (this.data.severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  getIconClass(): string {
    switch (this.data.severity) {
      case 'critical':
      case 'high':
        return 'icon-error';
      case 'medium':
        return 'icon-warning';
      case 'low':
        return 'icon-info';
      default:
        return 'icon-info';
    }
  }

  formatDetails(): string {
    return JSON.stringify(this.data.details, null, 2);
  }

  onRetry(): void {
    this.dialogRef.close('retry');
  }
}
```

## 錯誤處理配置

### 全域錯誤處理配置
```typescript
// app.module.ts
import { ErrorHandler, NgModule } from '@angular/core';
import { GlobalErrorHandlerService } from '@core/services/GlobalErrorHandlerService';

@NgModule({
  providers: [
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandlerService
    }
  ]
})
export class AppModule { }
```

### HTTP 攔截器錯誤處理
```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GlobalErrorHandlerService } from '@core/services/GlobalErrorHandlerService';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private errorHandler: GlobalErrorHandlerService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // 將 HTTP 錯誤轉換為 AppError
        const appError = this.convertHttpError(error, request);
        
        // 處理錯誤
        this.errorHandler.handleError(appError);
        
        // 重新拋出錯誤
        return throwError(() => appError);
      })
    );
  }

  private convertHttpError(error: HttpErrorResponse, request: HttpRequest<any>): AppError {
    // 實作 HTTP 錯誤轉換邏輯
    return new AppError(
      this.getErrorType(error.status),
      this.getErrorMessage(error),
      this.getErrorSeverity(error.status),
      {
        status: error.status,
        statusText: error.statusText,
        url: request.url,
        method: request.method,
        originalRequest: request,
        body: error.error
      }
    );
  }
}
```

## AI Agent 友好特性

### 1. 清晰的錯誤分類
- 每個錯誤類型都有明確的定義
- 錯誤嚴重性分級清晰
- 提供完整的錯誤上下文

### 2. 完整的錯誤處理流程
- 錯誤處理流程清晰且可預測
- 支援錯誤恢復和重試機制
- 提供用戶友好的錯誤訊息

### 3. 可測試性
- 所有錯誤處理邏輯都可以獨立測試
- 提供 mock 錯誤和測試輔助函數
- 支援不同錯誤場景的測試

### 4. 文件完整性
- 每個錯誤處理策略都有詳細說明
- 提供常見錯誤場景的處理範例
- 包含最佳實踐建議

## 相關檔案
- `Interceptors.md` - HTTP 攔截器
- `Guards.md` - 路由守衛
- `State Management.md` - 狀態管理
- `NotificationService.md` - 通知服務
