# API 服務 (API Service)

## 概述

API 服務是系統的核心服務，負責處理所有與後端 API 的通訊，提供統一的 HTTP 請求介面。

## 功能特色

### 1. HTTP 請求處理
- **GET**: 資料查詢請求
- **POST**: 資料建立請求
- **PUT**: 資料更新請求
- **DELETE**: 資料刪除請求
- **PATCH**: 部分更新請求

### 2. 請求/回應處理
- **請求攔截**: 自動添加認證標頭
- **回應攔截**: 統一錯誤處理
- **資料轉換**: 自動序列化/反序列化
- **快取管理**: 智能快取策略

### 3. 錯誤處理
- **網路錯誤**: 處理網路連線問題
- **HTTP 錯誤**: 處理 HTTP 狀態碼錯誤
- **業務錯誤**: 處理業務邏輯錯誤
- **重試機制**: 自動重試失敗請求

## 使用範例

```typescript
// 注入服務
constructor(private apiService: ApiService) {}

// GET 請求
async getUsers(): Promise<User[]> {
  return this.apiService.get<User[]>('/api/users');
}

// POST 請求
async createUser(userData: CreateUserRequest): Promise<User> {
  return this.apiService.post<User>('/api/users', userData);
}

// PUT 請求
async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
  return this.apiService.put<User>(`/api/users/${id}`, userData);
}

// DELETE 請求
async deleteUser(id: string): Promise<void> {
  return this.apiService.delete(`/api/users/${id}`);
}

// 帶查詢參數的請求
async searchUsers(params: SearchParams): Promise<User[]> {
  return this.apiService.get<User[]>('/api/users', { params });
}
```

## API 規格

### ApiService 方法

| 方法 | 參數 | 返回值 | 說明 |
|------|------|--------|------|
| get | url, options? | Promise<T> | GET 請求 |
| post | url, data?, options? | Promise<T> | POST 請求 |
| put | url, data?, options? | Promise<T> | PUT 請求 |
| patch | url, data?, options? | Promise<T> | PATCH 請求 |
| delete | url, options? | Promise<void> | DELETE 請求 |

### 請求選項 (Request Options)

```typescript
interface RequestOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
  timeout?: number;
  retry?: number;
  cache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
}
```

### 回應類型 (Response Types)

```typescript
interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
  timestamp: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

## 配置設定

### 基礎 URL 配置
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  apiTimeout: 30000,
  apiRetryCount: 3
};
```

### HTTP 攔截器配置
```typescript
// auth.interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(req);
  }
}
```

## 錯誤處理

### 錯誤類型定義
```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

class ApiException extends Error {
  constructor(
    public status: number,
    public error: ApiError
  ) {
    super(error.message);
  }
}
```

### 錯誤處理策略
```typescript
// error-handler.service.ts
@Injectable()
export class ErrorHandlerService {
  handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
    } else if (error.status === 403) {
      this.notificationService.error('權限不足');
    } else if (error.status >= 500) {
      this.notificationService.error('伺服器錯誤，請稍後再試');
    }
    
    return throwError(() => new ApiException(error.status, error.error));
  }
}
```

## 快取策略

### 快取配置
```typescript
interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number;
  strategy: 'memory' | 'localStorage' | 'sessionStorage';
}
```

### 快取使用
```typescript
// 啟用快取的請求
async getCachedUsers(): Promise<User[]> {
  return this.apiService.get<User[]>('/api/users', {
    cache: true,
    cacheKey: 'users',
    cacheTTL: 300 // 5 minutes
  });
}
```

## 最佳實踐

### 使用建議
1. **統一介面**: 使用統一的 API 服務介面
2. **錯誤處理**: 實現完整的錯誤處理機制
3. **快取策略**: 合理使用快取提升效能
4. **類型安全**: 使用 TypeScript 確保類型安全

### 避免事項
1. 不要直接使用 HttpClient
2. 不要忽略錯誤處理
3. 不要過度使用快取
4. 不要忘記處理載入狀態
