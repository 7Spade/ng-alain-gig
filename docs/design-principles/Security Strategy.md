# Security Strategy - 安全策略

## 概述
Security Strategy 定義了系統的全面安全策略，包括身份驗證、授權、資料加密、API 安全、前端安全、後端安全和安全監控。它確保系統能夠抵禦各種安全威脅，保護用戶資料和系統資源。

## 技術規格

### 安全威脅分類
```typescript
export enum SecurityThreatType {
  // 身份驗證威脅
  AUTHENTICATION_BYPASS = 'authentication_bypass',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  SESSION_HIJACKING = 'session_hijacking',
  CREDENTIAL_STUFFING = 'credential_stuffing',
  
  // 授權威脅
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  ROLE_BYPASS = 'role_bypass',
  
  // 資料安全威脅
  DATA_BREACH = 'data_breach',
  DATA_INJECTION = 'data_injection',
  DATA_EXFILTRATION = 'data_exfiltration',
  DATA_CORRUPTION = 'data_corruption',
  
  // 網路安全威脅
  MAN_IN_THE_MIDDLE = 'man_in_the_middle',
  DNS_SPOOFING = 'dns_spoofing',
  PHISHING = 'phishing',
  MALWARE = 'malware',
  
  // 應用程式安全威脅
  XSS = 'cross_site_scripting',
  CSRF = 'cross_site_request_forgery',
  SQL_INJECTION = 'sql_injection',
  CODE_INJECTION = 'code_injection',
  
  // 基礎設施威脅
  DDoS = 'distributed_denial_of_service',
  SERVER_COMPROMISE = 'server_compromise',
  DATABASE_COMPROMISE = 'database_compromise',
  CONFIGURATION_EXPOSURE = 'configuration_exposure'
}

export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityEvent {
  id: string;
  type: SecurityThreatType;
  level: SecurityLevel;
  timestamp: Date;
  source: string;
  target: string;
  description: string;
  context: { [key: string]: any };
  resolved: boolean;
  resolution?: string;
}
```

### 安全策略介面
```typescript
export interface SecurityPolicy {
  name: string;
  description: string;
  rules: SecurityRule[];
  enforcement: SecurityEnforcement;
  exceptions: SecurityException[];
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: SecurityAction;
  priority: number;
  enabled: boolean;
}

export interface SecurityAction {
  type: 'block' | 'allow' | 'log' | 'alert' | 'redirect';
  parameters: { [key: string]: any };
}

export interface SecurityEnforcement {
  mode: 'strict' | 'moderate' | 'permissive';
  fallbackAction: SecurityAction;
  auditMode: boolean;
}

export interface SecurityException {
  id: string;
  ruleId: string;
  condition: string;
  reason: string;
  expiresAt?: Date;
}
```

## Angular 實作

### 安全服務
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private securityEvents = new BehaviorSubject<SecurityEvent[]>([]);
  private securityPolicies = new BehaviorSubject<SecurityPolicy[]>([]);
  private currentUser = new BehaviorSubject<User | null>(null);
  
  public securityEvents$ = this.securityEvents.asObservable();
  public securityPolicies$ = this.securityPolicies.asObservable();
  public currentUser$ = this.currentUser.asObservable();

  constructor() {
    this.loadSecurityPolicies();
    this.initializeSecurityMonitoring();
  }

  // 身份驗證
  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // 檢查登入嘗試限制
      if (await this.isLoginAttemptLimited(credentials.email)) {
        throw new SecurityError('Too many login attempts', SecurityThreatType.BRUTE_FORCE_ATTACK);
      }

      // 執行身份驗證
      const authResult = await this.performAuthentication(credentials);
      
      if (authResult.success) {
        // 儲存認證資訊
        await this.storeAuthentication(authResult);
        
        // 記錄成功登入
        this.logSecurityEvent({
          type: SecurityThreatType.AUTHENTICATION_BYPASS,
          level: SecurityLevel.LOW,
          description: 'Successful authentication',
          source: credentials.email,
          target: 'authentication_service'
        });
        
        return authResult;
      } else {
        // 記錄失敗登入
        await this.recordFailedLoginAttempt(credentials.email);
        
        this.logSecurityEvent({
          type: SecurityThreatType.AUTHENTICATION_BYPASS,
          level: SecurityLevel.MEDIUM,
          description: 'Failed authentication attempt',
          source: credentials.email,
          target: 'authentication_service'
        });
        
        throw new SecurityError('Invalid credentials', SecurityThreatType.AUTHENTICATION_BYPASS);
      }
    } catch (error) {
      this.handleSecurityError(error);
      throw error;
    }
  }

  // 授權檢查
  async authorize(action: string, resource: string): Promise<boolean> {
    try {
      const user = this.currentUser.value;
      if (!user) {
        return false;
      }

      // 檢查用戶權限
      const hasPermission = await this.checkUserPermission(user, action, resource);
      
      if (!hasPermission) {
        this.logSecurityEvent({
          type: SecurityThreatType.UNAUTHORIZED_ACCESS,
          level: SecurityLevel.HIGH,
          description: `Unauthorized access attempt: ${action} on ${resource}`,
          source: user.id,
          target: resource
        });
      }
      
      return hasPermission;
    } catch (error) {
      this.handleSecurityError(error);
      return false;
    }
  }

  // 資料加密
  async encryptData(data: any, key?: string): Promise<string> {
    try {
      const encryptionKey = key || await this.getEncryptionKey();
      const encryptedData = await this.performEncryption(data, encryptionKey);
      
      return encryptedData;
    } catch (error) {
      this.handleSecurityError(error);
      throw error;
    }
  }

  // 資料解密
  async decryptData(encryptedData: string, key?: string): Promise<any> {
    try {
      const encryptionKey = key || await this.getEncryptionKey();
      const decryptedData = await this.performDecryption(encryptedData, encryptionKey);
      
      return decryptedData;
    } catch (error) {
      this.handleSecurityError(error);
      throw error;
    }
  }

  // 輸入驗證
  validateInput(input: any, rules: ValidationRule[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: []
    };

    for (const rule of rules) {
      const validation = this.applyValidationRule(input, rule);
      if (!validation.isValid) {
        result.isValid = false;
        result.errors.push(...validation.errors);
      }
    }

    return result;
  }

  // 輸出編碼
  encodeOutput(data: any, context: 'html' | 'url' | 'javascript'): string {
    switch (context) {
      case 'html':
        return this.encodeForHtml(data);
      case 'url':
        return this.encodeForUrl(data);
      case 'javascript':
        return this.encodeForJavaScript(data);
      default:
        return String(data);
    }
  }

  // 安全標頭設定
  getSecurityHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.getCSPHeader(),
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
  }

  // 記錄安全事件
  logSecurityEvent(event: Partial<SecurityEvent>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false,
      ...event
    } as SecurityEvent;

    const currentEvents = this.securityEvents.value;
    this.securityEvents.next([...currentEvents, securityEvent]);

    // 發送到安全監控服務
    this.sendSecurityEventToMonitoring(securityEvent);

    // 檢查是否需要立即處理
    if (this.shouldTriggerAlert(securityEvent)) {
      this.triggerSecurityAlert(securityEvent);
    }
  }

  // 檢查安全政策
  async checkSecurityPolicy(action: string, context: any): Promise<SecurityPolicyResult> {
    const policies = this.securityPolicies.value;
    const applicablePolicies = policies.filter(policy => 
      this.isPolicyApplicable(policy, action, context)
    );

    for (const policy of applicablePolicies) {
      const result = await this.evaluatePolicy(policy, action, context);
      if (result.action.type === 'block') {
        return result;
      }
    }

    return {
      allowed: true,
      action: { type: 'allow', parameters: {} },
      policy: null
    };
  }

  private async performAuthentication(credentials: LoginCredentials): Promise<AuthResult> {
    const headers = this.getSecurityHeaders();
    
    return this.http.post<AuthResult>('/api/auth/login', credentials, { headers })
      .pipe(
        map(response => response),
        catchError(error => {
          throw new SecurityError('Authentication failed', SecurityThreatType.AUTHENTICATION_BYPASS);
        })
      )
      .toPromise() as Promise<AuthResult>;
  }

  private async checkUserPermission(user: User, action: string, resource: string): Promise<boolean> {
    const headers = this.getSecurityHeaders();
    
    return this.http.post<boolean>('/api/auth/authorize', {
      userId: user.id,
      action,
      resource
    }, { headers }).toPromise() as Promise<boolean>;
  }

  private async performEncryption(data: any, key: string): Promise<string> {
    // 實作加密邏輯
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    // 使用 Web Crypto API 進行加密
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );
    
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);
    
    return btoa(String.fromCharCode(...result));
  }

  private async performDecryption(encryptedData: string, key: string): Promise<any> {
    // 實作解密邏輯
    const decoder = new TextDecoder();
    const encryptedArray = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    const iv = encryptedArray.slice(0, 12);
    const data = encryptedArray.slice(12);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      decoder.encode(key),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
    
    const decryptedData = decoder.decode(decryptedBuffer);
    return JSON.parse(decryptedData);
  }

  private applyValidationRule(input: any, rule: ValidationRule): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: []
    };

    switch (rule.type) {
      case 'required':
        if (!input || input === '') {
          result.isValid = false;
          result.errors.push(`${rule.field} is required`);
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (input && !emailRegex.test(input)) {
          result.isValid = false;
          result.errors.push(`${rule.field} must be a valid email`);
        }
        break;
      
      case 'minLength':
        if (input && input.length < rule.value) {
          result.isValid = false;
          result.errors.push(`${rule.field} must be at least ${rule.value} characters`);
        }
        break;
      
      case 'maxLength':
        if (input && input.length > rule.value) {
          result.isValid = false;
          result.errors.push(`${rule.field} must be no more than ${rule.value} characters`);
        }
        break;
      
      case 'pattern':
        if (input && !rule.value.test(input)) {
          result.isValid = false;
          result.errors.push(`${rule.field} format is invalid`);
        }
        break;
      
      case 'custom':
        if (rule.validator && !rule.validator(input)) {
          result.isValid = false;
          result.errors.push(`${rule.field} validation failed`);
        }
        break;
    }

    return result;
  }

  private encodeForHtml(data: any): string {
    return String(data)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  private encodeForUrl(data: any): string {
    return encodeURIComponent(String(data));
  }

  private encodeForJavaScript(data: any): string {
    return JSON.stringify(String(data));
  }

  private getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  private async loadSecurityPolicies(): Promise<void> {
    try {
      const policies = await this.http.get<SecurityPolicy[]>('/api/security/policies').toPromise();
      this.securityPolicies.next(policies || []);
    } catch (error) {
      console.error('Failed to load security policies:', error);
    }
  }

  private initializeSecurityMonitoring(): void {
    // 監控頁面載入
    window.addEventListener('load', () => {
      this.logSecurityEvent({
        type: SecurityThreatType.AUTHENTICATION_BYPASS,
        level: SecurityLevel.LOW,
        description: 'Page loaded',
        source: 'browser',
        target: window.location.href
      });
    });

    // 監控頁面卸載
    window.addEventListener('beforeunload', () => {
      this.logSecurityEvent({
        type: SecurityThreatType.AUTHENTICATION_BYPASS,
        level: SecurityLevel.LOW,
        description: 'Page unloaded',
        source: 'browser',
        target: window.location.href
      });
    });

    // 監控錯誤
    window.addEventListener('error', (event) => {
      this.logSecurityEvent({
        type: SecurityThreatType.CODE_INJECTION,
        level: SecurityLevel.MEDIUM,
        description: 'JavaScript error',
        source: 'browser',
        target: event.filename || 'unknown',
        context: {
          message: event.message,
          line: event.lineno,
          column: event.colno,
          error: event.error
        }
      });
    });
  }

  private async isLoginAttemptLimited(email: string): Promise<boolean> {
    const response = await this.http.get<boolean>(`/api/security/login-attempts/${email}`).toPromise();
    return response || false;
  }

  private async recordFailedLoginAttempt(email: string): Promise<void> {
    await this.http.post('/api/security/login-attempts', { email }).toPromise();
  }

  private async storeAuthentication(authResult: AuthResult): Promise<void> {
    // 儲存認證 token
    localStorage.setItem('auth_token', authResult.token);
    
    // 設定過期時間
    const expirationTime = new Date(Date.now() + authResult.expiresIn * 1000);
    localStorage.setItem('auth_expires', expirationTime.toISOString());
    
    // 更新當前用戶
    this.currentUser.next(authResult.user);
  }

  private async getEncryptionKey(): Promise<string> {
    // 從安全儲存獲取加密金鑰
    const key = localStorage.getItem('encryption_key');
    if (!key) {
      throw new SecurityError('Encryption key not found', SecurityThreatType.DATA_BREACH);
    }
    return key;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendSecurityEventToMonitoring(event: SecurityEvent): Promise<void> {
    try {
      await this.http.post('/api/security/events', event).toPromise();
    } catch (error) {
      console.error('Failed to send security event to monitoring:', error);
    }
  }

  private shouldTriggerAlert(event: SecurityEvent): boolean {
    return event.level === SecurityLevel.CRITICAL || 
           event.level === SecurityLevel.HIGH;
  }

  private triggerSecurityAlert(event: SecurityEvent): void {
    // 觸發安全警報
    console.warn('Security Alert:', event);
    
    // 發送通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Security Alert', {
        body: `Security event detected: ${event.description}`,
        icon: '/assets/icons/security-alert.png'
      });
    }
  }

  private isPolicyApplicable(policy: SecurityPolicy, action: string, context: any): boolean {
    return policy.rules.some(rule => 
      rule.enabled && this.evaluateRuleCondition(rule.condition, action, context)
    );
  }

  private evaluateRuleCondition(condition: string, action: string, context: any): boolean {
    // 簡化的條件評估邏輯
    try {
      // 在實際實作中，應該使用更安全的條件評估方法
      const func = new Function('action', 'context', `return ${condition}`);
      return func(action, context);
    } catch (error) {
      console.error('Failed to evaluate rule condition:', error);
      return false;
    }
  }

  private async evaluatePolicy(policy: SecurityPolicy, action: string, context: any): Promise<SecurityPolicyResult> {
    const applicableRules = policy.rules.filter(rule => 
      rule.enabled && this.evaluateRuleCondition(rule.condition, action, context)
    );

    if (applicableRules.length === 0) {
      return {
        allowed: true,
        action: { type: 'allow', parameters: {} },
        policy: null
      };
    }

    // 按優先級排序規則
    applicableRules.sort((a, b) => b.priority - a.priority);
    const highestPriorityRule = applicableRules[0];

    return {
      allowed: highestPriorityRule.action.type === 'allow',
      action: highestPriorityRule.action,
      policy: policy
    };
  }

  private handleSecurityError(error: any): void {
    this.logSecurityEvent({
      type: SecurityThreatType.SYSTEM_ERROR,
      level: SecurityLevel.HIGH,
      description: 'Security error occurred',
      source: 'security_service',
      target: 'system',
      context: { error: error.message }
    });
  }
}
```

### 安全守衛
```typescript
import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route } from '@angular/router';
import { SecurityService } from '@core/services/SecurityService';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SecurityGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkSecurity(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkSecurity(childRoute, state);
  }

  canLoad(route: Route): Observable<boolean> {
    return this.checkSecurity(route, null);
  }

  private checkSecurity(
    route: ActivatedRouteSnapshot | Route,
    state: RouterStateSnapshot | null
  ): Observable<boolean> {
    const requiredPermissions = route.data?.['permissions'] || [];
    const requiredRoles = route.data?.['roles'] || [];
    
    if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
      return of(true);
    }

    return this.securityService.currentUser$.pipe(
      map(user => {
        if (!user) {
          this.redirectToLogin(state);
          return false;
        }

        // 檢查角色
        if (requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some(role => 
            user.roles?.includes(role)
          );
          
          if (!hasRequiredRole) {
            this.redirectToUnauthorized();
            return false;
          }
        }

        // 檢查權限
        if (requiredPermissions.length > 0) {
          const hasRequiredPermission = requiredPermissions.some(permission => 
            user.permissions?.includes(permission)
          );
          
          if (!hasRequiredPermission) {
            this.redirectToUnauthorized();
            return false;
          }
        }

        return true;
      }),
      catchError(error => {
        console.error('Security guard error:', error);
        this.redirectToLogin(state);
        return of(false);
      })
    );
  }

  private redirectToLogin(state: RouterStateSnapshot | null): void {
    const returnUrl = state?.url || '/';
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl } 
    });
  }

  private redirectToUnauthorized(): void {
    this.router.navigate(['/unauthorized']);
  }
}
```

### 安全攔截器
```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SecurityService } from '@core/services/SecurityService';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  constructor(private securityService: SecurityService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 添加安全標頭
    const secureRequest = request.clone({
      headers: this.securityService.getSecurityHeaders()
    });

    return next.handle(secureRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // 處理認證錯誤
          return this.handleAuthenticationError(secureRequest, next);
        } else if (error.status === 403) {
          // 處理授權錯誤
          return this.handleAuthorizationError(error);
        } else if (error.status === 429) {
          // 處理速率限制錯誤
          return this.handleRateLimitError(error);
        } else {
          // 處理其他錯誤
          return this.handleGenericError(error);
        }
      })
    );
  }

  private handleAuthenticationError(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // 嘗試刷新 token
    return this.securityService.refreshToken().pipe(
      switchMap(() => {
        // 重新發送請求
        return next.handle(request);
      }),
      catchError(() => {
        // 刷新失敗，重定向到登入頁面
        this.securityService.logout();
        return throwError(() => new Error('Authentication failed'));
      })
    );
  }

  private handleAuthorizationError(error: HttpErrorResponse): Observable<never> {
    this.securityService.logSecurityEvent({
      type: SecurityThreatType.UNAUTHORIZED_ACCESS,
      level: SecurityLevel.HIGH,
      description: 'Unauthorized access attempt',
      source: 'http_interceptor',
      target: error.url || 'unknown'
    });

    return throwError(() => new Error('Unauthorized access'));
  }

  private handleRateLimitError(error: HttpErrorResponse): Observable<never> {
    this.securityService.logSecurityEvent({
      type: SecurityThreatType.DDOS,
      level: SecurityLevel.MEDIUM,
      description: 'Rate limit exceeded',
      source: 'http_interceptor',
      target: error.url || 'unknown'
    });

    return throwError(() => new Error('Rate limit exceeded'));
  }

  private handleGenericError(error: HttpErrorResponse): Observable<never> {
    this.securityService.logSecurityEvent({
      type: SecurityThreatType.SYSTEM_ERROR,
      level: SecurityLevel.MEDIUM,
      description: 'HTTP error occurred',
      source: 'http_interceptor',
      target: error.url || 'unknown',
      context: {
        status: error.status,
        statusText: error.statusText,
        message: error.message
      }
    });

    return throwError(() => error);
  }
}
```

## 安全策略配置

### 安全政策配置
```typescript
// security-policies.config.ts
export const SECURITY_POLICIES: SecurityPolicy[] = [
  {
    name: 'Authentication Policy',
    description: 'Controls authentication requirements',
    rules: [
      {
        id: 'auth_required',
        name: 'Authentication Required',
        condition: 'action === "access_protected_resource"',
        action: { type: 'block', parameters: {} },
        priority: 100,
        enabled: true
      }
    ],
    enforcement: {
      mode: 'strict',
      fallbackAction: { type: 'block', parameters: {} },
      auditMode: false
    },
    exceptions: []
  },
  {
    name: 'Authorization Policy',
    description: 'Controls authorization requirements',
    rules: [
      {
        id: 'admin_only',
        name: 'Admin Only Access',
        condition: 'action === "admin_action" && !context.user.roles.includes("admin")',
        action: { type: 'block', parameters: {} },
        priority: 90,
        enabled: true
      }
    ],
    enforcement: {
      mode: 'strict',
      fallbackAction: { type: 'block', parameters: {} },
      auditMode: false
    },
    exceptions: []
  }
];
```

### 安全監控配置
```typescript
// security-monitoring.config.ts
export const SECURITY_MONITORING_CONFIG = {
  // 監控間隔（毫秒）
  monitoringInterval: 5000,
  
  // 警報閾值
  alertThresholds: {
    failedLoginAttempts: 5,
    unauthorizedAccessAttempts: 3,
    suspiciousActivity: 10
  },
  
  // 日誌保留時間（天）
  logRetentionDays: 30,
  
  // 自動回應設定
  autoResponse: {
    blockSuspiciousIPs: true,
    notifySecurityTeam: true,
    escalateCriticalEvents: true
  }
};
```

## AI Agent 友好特性

### 1. 自動化安全監控
- 自動檢測安全威脅
- 自動執行安全政策
- 自動回應安全事件

### 2. 安全分析報告
- 生成安全分析報告
- 提供安全建議
- 追蹤安全改善進度

### 3. 安全政策管理
- 自動化安全政策部署
- 動態調整安全政策
- 安全政策效果評估

## 相關檔案
- `Error Handling Strategy.md` - 錯誤處理策略
- `Performance Optimization Strategy.md` - 效能優化策略
- `Monitoring Strategy.md` - 監控策略
- `Caching Strategy.md` - 快取策略
