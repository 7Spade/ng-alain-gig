# HTTP Interceptors - 核心模組

## 概述

HTTP Interceptors 是 Angular 的核心功能，用於在 HTTP 請求和響應之間進行攔截和處理。在 ng-alain 專案中，我們使用 Interceptors 來實現認證、錯誤處理、日誌記錄和請求/響應轉換等功能。

## 設計原則

### 1. 單一職責原則
每個 Interceptor 只負責一個特定的功能，例如：
- `AuthInterceptor` - 處理認證 token
- `ErrorInterceptor` - 處理錯誤響應
- `LoggingInterceptor` - 記錄請求日誌
- `LoadingInterceptor` - 管理載入狀態

### 2. 可組合性
Interceptors 可以組合使用，按照註冊順序執行：
1. 請求攔截器按註冊順序執行
2. 響應攔截器按相反順序執行

### 3. 錯誤處理
所有 Interceptors 都應該有適當的錯誤處理機制，避免影響應用程式的穩定性。

## 實作範例

### AuthInterceptor - 認證攔截器

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 獲取認證 token
    const authToken = this.authService.getToken();
    
    if (authToken) {
      // 克隆請求並添加 Authorization header
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      return next.handle(authReq).pipe(
        catchError((error) => {
          // 處理認證錯誤
          if (error.status === 401) {
            this.authService.logout();
            // 重定向到登入頁面
            window.location.href = '/login';
          }
          return throwError(() => error);
        })
      );
    }
    
    return next.handle(req);
  }
}
```

### ErrorInterceptor - 錯誤處理攔截器

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notificationService: NotificationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '發生未知錯誤';
        
        if (error.error instanceof ErrorEvent) {
          // 客戶端錯誤
          errorMessage = `客戶端錯誤: ${error.error.message}`;
        } else {
          // 伺服器錯誤
          switch (error.status) {
            case 400:
              errorMessage = '請求參數錯誤';
              break;
            case 401:
              errorMessage = '未授權，請重新登入';
              break;
            case 403:
              errorMessage = '權限不足';
              break;
            case 404:
              errorMessage = '請求的資源不存在';
              break;
            case 500:
              errorMessage = '伺服器內部錯誤';
              break;
            default:
              errorMessage = `伺服器錯誤: ${error.status}`;
          }
        }
        
        // 顯示錯誤通知
        this.notificationService.showError(errorMessage);
        
        // 記錄錯誤日誌
        console.error('HTTP Error:', error);
        
        return throwError(() => error);
      })
    );
  }
}
```

### LoggingInterceptor - 日誌記錄攔截器

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();
    
    // 記錄請求資訊
    if (environment.production === false) {
      console.log(`🚀 HTTP Request: ${req.method} ${req.url}`, req.body);
    }
    
    return next.handle(req).pipe(
      tap((event) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (environment.production === false) {
          console.log(`✅ HTTP Response: ${req.method} ${req.url} (${duration}ms)`, event);
        }
      })
    );
  }
}
```

### LoadingInterceptor - 載入狀態攔截器

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 檢查是否需要顯示載入狀態
    if (this.shouldShowLoading(req)) {
      this.activeRequests++;
      this.loadingService.show();
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (this.shouldShowLoading(req)) {
          this.activeRequests--;
          if (this.activeRequests === 0) {
            this.loadingService.hide();
          }
        }
      })
    );
  }

  private shouldShowLoading(req: HttpRequest<any>): boolean {
    // 排除某些請求不顯示載入狀態
    const excludeUrls = ['/api/heartbeat', '/api/status'];
    return !excludeUrls.some(url => req.url.includes(url));
  }
}
```

## 配置和註冊

### 在 app.config.ts 中註冊 Interceptors

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loggingInterceptor,
        loadingInterceptor
      ])
    ),
    // 其他 providers...
  ]
};
```

### 使用 Functional Interceptors (Angular 17+)

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authToken = authService.getToken();
  
  if (authToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
    return next(authReq);
  }
  
  return next(req);
};
```

## 最佳實踐

### 1. 錯誤處理
- 所有 Interceptors 都應該有適當的錯誤處理
- 使用 `catchError` 操作符來處理錯誤
- 避免在 Interceptor 中拋出未處理的錯誤

### 2. 效能考量
- 避免在 Interceptor 中進行重計算
- 使用 `tap` 操作符進行副作用操作
- 考慮使用 `shareReplay` 來避免重複請求

### 3. 測試
- 為每個 Interceptor 編寫單元測試
- 測試各種錯誤情況
- 使用 `HttpTestingController` 進行測試

### 4. 環境配置
- 根據環境變數控制 Interceptor 的行為
- 在開發環境中啟用詳細日誌
- 在生產環境中禁用除錯資訊

## 常見問題

### Q: Interceptor 的執行順序是什麼？
A: 請求攔截器按註冊順序執行，響應攔截器按相反順序執行。

### Q: 如何在 Interceptor 中處理異步操作？
A: 使用 RxJS 操作符如 `switchMap`、`mergeMap` 或 `concatMap` 來處理異步操作。

### Q: 如何跳過某些請求的攔截？
A: 在 Interceptor 中檢查請求 URL 或添加自定義 header，然後直接返回 `next.handle(req)`。

### Q: 如何測試 Interceptor？
A: 使用 `HttpTestingController` 和 `TestBed` 來模擬 HTTP 請求並驗證 Interceptor 的行為。

## 相關服務

- `AuthService` - 認證服務
- `NotificationService` - 通知服務
- `LoadingService` - 載入狀態服務
- `LoggingService` - 日誌服務

## 參考資料

- [Angular HTTP Interceptors 官方文件](https://angular.dev/guide/http/http-interceptors)
- [RxJS 操作符指南](https://rxjs.dev/guide/operators)
- [Angular 測試指南](https://angular.dev/guide/testing)