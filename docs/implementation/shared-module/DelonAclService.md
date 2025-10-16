# DelonAclService (@delon/acl 權限服務整合)

## 概述
`DelonAclService` 是一個封裝 @delon/acl 權限控制系統的 Angular 服務，提供完整的角色權限管理功能，包括角色定義、權限檢查、動態權限更新和路由守衛整合。

## 技術規格

### 依賴套件
```json
{
  "@delon/acl": "^18.0.0",
  "@angular/core": "^18.0.0"
}
```

### 型別定義
```typescript
export interface AclRole {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
}

export interface AclPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface AclUser {
  id: string;
  roles: string[];
  permissions: string[];
}

export interface AclConfig {
  roles: AclRole[];
  permissions: AclPermission[];
  defaultRole?: string;
  strictMode?: boolean;
}
```

## Angular 實作

### DelonAclService 服務
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { ACLService, ACLType } from '@delon/acl';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DelonAclService {
  private aclService = inject(ACLService);

  private _currentUser = signal<AclUser | null>(null);
  private _roles = signal<AclRole[]>([]);
  private _permissions = signal<AclPermission[]>([]);

  readonly currentUser = this._currentUser.asReadonly();
  readonly roles = this._roles.asReadonly();
  readonly permissions = this._permissions.asReadonly();

  private aclSubject = new BehaviorSubject<{
    user: AclUser | null;
    roles: AclRole[];
    permissions: AclPermission[];
  }>({
    user: null,
    roles: [],
    permissions: []
  });

  public acl$ = this.aclSubject.asObservable();

  constructor() {
    this.initializeAcl();
  }

  private initializeAcl(): void {
    // 初始化預設角色和權限
    this.setDefaultRoles();
    this.setDefaultPermissions();
  }

  // 設定用戶角色和權限
  setUser(user: AclUser): void {
    this._currentUser.set(user);
    
    // 設定 ACL 角色
    this.aclService.setRole(user.roles);
    
    // 設定 ACL 權限
    this.aclService.setAbility(user.permissions);

    this.aclSubject.next({
      user,
      roles: this._roles(),
      permissions: this._permissions()
    });
  }

  // 檢查用戶是否有特定角色
  hasRole(role: string): boolean {
    const user = this._currentUser();
    if (!user) return false;
    
    return user.roles.includes(role);
  }

  // 檢查用戶是否有特定權限
  hasPermission(permission: string): boolean {
    const user = this._currentUser();
    if (!user) return false;
    
    return user.permissions.includes(permission);
  }

  // 檢查用戶是否有資源的特定操作權限
  canAccess(resource: string, action: string): boolean {
    const permission = `${resource}:${action}`;
    return this.hasPermission(permission);
  }

  // 檢查用戶是否可以訪問路由
  canActivateRoute(route: any): boolean {
    const requiredRoles = route.data?.roles;
    const requiredPermissions = route.data?.permissions;

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role: string) => this.hasRole(role));
      if (!hasRequiredRole) return false;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some((permission: string) => 
        this.hasPermission(permission)
      );
      if (!hasRequiredPermission) return false;
    }

    return true;
  }

  // 添加角色
  addRole(role: AclRole): void {
    const currentRoles = this._roles();
    const existingIndex = currentRoles.findIndex(r => r.id === role.id);
    
    if (existingIndex >= 0) {
      currentRoles[existingIndex] = role;
    } else {
      currentRoles.push(role);
    }
    
    this._roles.set([...currentRoles]);
    this.updateAclSubject();
  }

  // 移除角色
  removeRole(roleId: string): void {
    const currentRoles = this._roles();
    const filteredRoles = currentRoles.filter(r => r.id !== roleId);
    this._roles.set(filteredRoles);
    this.updateAclSubject();
  }

  // 添加權限
  addPermission(permission: AclPermission): void {
    const currentPermissions = this._permissions();
    const existingIndex = currentPermissions.findIndex(p => p.id === permission.id);
    
    if (existingIndex >= 0) {
      currentPermissions[existingIndex] = permission;
    } else {
      currentPermissions.push(permission);
    }
    
    this._permissions.set([...currentPermissions]);
    this.updateAclSubject();
  }

  // 移除權限
  removePermission(permissionId: string): void {
    const currentPermissions = this._permissions();
    const filteredPermissions = currentPermissions.filter(p => p.id !== permissionId);
    this._permissions.set(filteredPermissions);
    this.updateAclSubject();
  }

  // 更新用戶權限
  updateUserPermissions(userId: string, permissions: string[]): void {
    const user = this._currentUser();
    if (user && user.id === userId) {
      const updatedUser = { ...user, permissions };
      this.setUser(updatedUser);
    }
  }

  // 更新用戶角色
  updateUserRoles(userId: string, roles: string[]): void {
    const user = this._currentUser();
    if (user && user.id === userId) {
      const updatedUser = { ...user, roles };
      this.setUser(updatedUser);
    }
  }

  // 清除用戶資料
  clearUser(): void {
    this._currentUser.set(null);
    this.aclService.setRole([]);
    this.aclService.setAbility([]);
    this.updateAclSubject();
  }

  // 獲取用戶所有權限（包括角色權限）
  getUserAllPermissions(): string[] {
    const user = this._currentUser();
    if (!user) return [];

    const rolePermissions = user.roles.flatMap(roleId => {
      const role = this._roles().find(r => r.id === roleId);
      return role ? role.permissions : [];
    });

    return [...new Set([...user.permissions, ...rolePermissions])];
  }

  // 檢查權限（支援複雜表達式）
  checkPermission(permission: string | string[]): boolean {
    if (Array.isArray(permission)) {
      return permission.some(p => this.checkSinglePermission(p));
    }
    return this.checkSinglePermission(permission);
  }

  private checkSinglePermission(permission: string): boolean {
    // 支援 AND 邏輯 (用 & 分隔)
    if (permission.includes('&')) {
      const permissions = permission.split('&').map(p => p.trim());
      return permissions.every(p => this.hasPermission(p));
    }

    // 支援 OR 邏輯 (用 | 分隔)
    if (permission.includes('|')) {
      const permissions = permission.split('|').map(p => p.trim());
      return permissions.some(p => this.hasPermission(p));
    }

    // 支援否定邏輯 (用 ! 前綴)
    if (permission.startsWith('!')) {
      return !this.hasPermission(permission.substring(1));
    }

    return this.hasPermission(permission);
  }

  // 設定預設角色
  private setDefaultRoles(): void {
    const defaultRoles: AclRole[] = [
      {
        id: 'admin',
        name: '管理員',
        permissions: ['*'], // 所有權限
        description: '系統管理員，擁有所有權限'
      },
      {
        id: 'manager',
        name: '經理',
        permissions: [
          'project:create',
          'project:read',
          'project:update',
          'project:delete',
          'user:read',
          'user:update',
          'team:create',
          'team:read',
          'team:update',
          'team:delete'
        ],
        description: '專案經理，可以管理專案和團隊'
      },
      {
        id: 'engineer',
        name: '工程師',
        permissions: [
          'project:read',
          'task:create',
          'task:read',
          'task:update',
          'document:create',
          'document:read',
          'document:update'
        ],
        description: '工程師，可以查看專案和處理任務'
      },
      {
        id: 'viewer',
        name: '檢視者',
        permissions: [
          'project:read',
          'task:read',
          'document:read'
        ],
        description: '只能檢視，無法修改'
      }
    ];

    this._roles.set(defaultRoles);
  }

  // 設定預設權限
  private setDefaultPermissions(): void {
    const defaultPermissions: AclPermission[] = [
      // 專案權限
      { id: 'project:create', name: '創建專案', resource: 'project', action: 'create' },
      { id: 'project:read', name: '查看專案', resource: 'project', action: 'read' },
      { id: 'project:update', name: '更新專案', resource: 'project', action: 'update' },
      { id: 'project:delete', name: '刪除專案', resource: 'project', action: 'delete' },
      
      // 任務權限
      { id: 'task:create', name: '創建任務', resource: 'task', action: 'create' },
      { id: 'task:read', name: '查看任務', resource: 'task', action: 'read' },
      { id: 'task:update', name: '更新任務', resource: 'task', action: 'update' },
      { id: 'task:delete', name: '刪除任務', resource: 'task', action: 'delete' },
      
      // 用戶權限
      { id: 'user:create', name: '創建用戶', resource: 'user', action: 'create' },
      { id: 'user:read', name: '查看用戶', resource: 'user', action: 'read' },
      { id: 'user:update', name: '更新用戶', resource: 'user', action: 'update' },
      { id: 'user:delete', name: '刪除用戶', resource: 'user', action: 'delete' },
      
      // 團隊權限
      { id: 'team:create', name: '創建團隊', resource: 'team', action: 'create' },
      { id: 'team:read', name: '查看團隊', resource: 'team', action: 'read' },
      { id: 'team:update', name: '更新團隊', resource: 'team', action: 'update' },
      { id: 'team:delete', name: '刪除團隊', resource: 'team', action: 'delete' },
      
      // 文件權限
      { id: 'document:create', name: '創建文件', resource: 'document', action: 'create' },
      { id: 'document:read', name: '查看文件', resource: 'document', action: 'read' },
      { id: 'document:update', name: '更新文件', resource: 'document', action: 'update' },
      { id: 'document:delete', name: '刪除文件', resource: 'document', action: 'delete' }
    ];

    this._permissions.set(defaultPermissions);
  }

  private updateAclSubject(): void {
    this.aclSubject.next({
      user: this._currentUser(),
      roles: this._roles(),
      permissions: this._permissions()
    });
  }
}
```

### ACL 守衛
```typescript
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { DelonAclService } from '@shared/services/DelonAclService';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AclGuard implements CanActivate {
  private aclService = inject(DelonAclService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredRoles = route.data?.['roles'];
    const requiredPermissions = route.data?.['permissions'];

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role: string) => 
        this.aclService.hasRole(role)
      );
      
      if (!hasRequiredRole) {
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some((permission: string) => 
        this.aclService.hasPermission(permission)
      );
      
      if (!hasRequiredPermission) {
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    return true;
  }
}
```

### ACL 指令
```typescript
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { DelonAclService } from '@shared/services/DelonAclService';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appAcl]'
})
export class AclDirective implements OnInit, OnDestroy {
  @Input() appAcl: string | string[] = '';
  @Input() appAclMode: 'allOf' | 'oneOf' = 'allOf';

  private destroy$ = new Subject<void>();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private aclService: DelonAclService
  ) {}

  ngOnInit(): void {
    this.aclService.acl$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const hasPermission = this.checkPermission();
    
    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

  private checkPermission(): boolean {
    if (!this.appAcl) return true;

    const permissions = Array.isArray(this.appAcl) ? this.appAcl : [this.appAcl];

    if (this.appAclMode === 'allOf') {
      return permissions.every(permission => this.aclService.checkPermission(permission));
    } else {
      return permissions.some(permission => this.aclService.checkPermission(permission));
    }
  }
}
```

### ACL 元件範例
```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DelonAclService, AclUser } from '@shared/services/DelonAclService';

@Component({
  selector: 'app-acl-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="acl-demo">
      <h2>權限控制示範</h2>
      
      <div class="user-section">
        <h3>當前用戶</h3>
        <div *ngIf="aclService.currentUser(); let user" class="user-info">
          <p>用戶 ID: {{ user.id }}</p>
          <p>角色: {{ user.roles.join(', ') }}</p>
          <p>權限: {{ user.permissions.join(', ') }}</p>
        </div>
        <div *ngIf="!aclService.currentUser()" class="no-user">
          未登入
        </div>
      </div>

      <div class="permission-tests">
        <h3>權限測試</h3>
        
        <div class="test-item">
          <h4>專案權限</h4>
          <button *appAcl="'project:create'" class="btn btn-primary">
            創建專案
          </button>
          <button *appAcl="'project:read'" class="btn btn-secondary">
            查看專案
          </button>
          <button *appAcl="'project:update'" class="btn btn-warning">
            更新專案
          </button>
          <button *appAcl="'project:delete'" class="btn btn-danger">
            刪除專案
          </button>
        </div>

        <div class="test-item">
          <h4>任務權限</h4>
          <button *appAcl="'task:create'" class="btn btn-primary">
            創建任務
          </button>
          <button *appAcl="'task:read'" class="btn btn-secondary">
            查看任務
          </button>
          <button *appAcl="'task:update'" class="btn btn-warning">
            更新任務
          </button>
          <button *appAcl="'task:delete'" class="btn btn-danger">
            刪除任務
          </button>
        </div>

        <div class="test-item">
          <h4>管理員功能</h4>
          <button *appAcl="'admin'" class="btn btn-danger">
            管理員專用
          </button>
        </div>
      </div>

      <div class="role-switcher">
        <h3>切換角色</h3>
        <div class="role-buttons">
          <button 
            *ngFor="let role of aclService.roles()" 
            class="btn btn-outline-primary"
            (click)="switchToRole(role.id)"
            [class.active]="aclService.hasRole(role.id)">
            {{ role.name }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .acl-demo {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .user-section, .permission-tests, .role-switcher {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    .user-info {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
    }
    
    .no-user {
      color: #666;
      font-style: italic;
    }
    
    .test-item {
      margin-bottom: 1rem;
    }
    
    .test-item h4 {
      margin-bottom: 0.5rem;
      color: #333;
    }
    
    .role-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-primary { background-color: #007bff; color: white; }
    .btn-secondary { background-color: #6c757d; color: white; }
    .btn-warning { background-color: #ffc107; color: black; }
    .btn-danger { background-color: #dc3545; color: white; }
    .btn-outline-primary { background: none; color: #007bff; border: 1px solid #007bff; }
    
    .btn.active {
      background-color: #007bff;
      color: white;
    }
  `]
})
export class AclDemoComponent {
  private aclService = inject(DelonAclService);

  switchToRole(roleId: string): void {
    const role = this.aclService.roles().find(r => r.id === roleId);
    if (role) {
      const user: AclUser = {
        id: 'demo-user',
        roles: [roleId],
        permissions: role.permissions
      };
      this.aclService.setUser(user);
    }
  }
}
```

## AI Agent 友好特性

### 1. 完整的型別安全
- 所有方法都有完整的 TypeScript 型別定義
- 提供介面和型別別名
- 編譯時錯誤檢查

### 2. 靈活的權限控制
- 支援角色和權限兩種模式
- 支援複雜的權限表達式
- 支援動態權限更新

### 3. 整合性
- 與 @delon/acl 完全整合
- 支援路由守衛
- 支援模板指令

### 4. 可擴展性
- 易於添加新角色和權限
- 支援自定義權限邏輯
- 支援權限繼承

## 相關檔案
- `DelonFormService.md` - @delon/form 表單服務整合
- `DelonUtilService.md` - @delon/util 工具服務整合
- `Security Strategy.md` - 安全策略