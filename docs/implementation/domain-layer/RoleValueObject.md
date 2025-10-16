# RoleValueObject (角色值物件)

## 概述
RoleValueObject 是角色領域的值物件，代表系統中的各種角色類型，包括組織角色、團隊角色、專案角色等。使用 DDD (Domain-Driven Design) 模式設計，確保角色的一致性和不可變性。

## 值物件定義

### 1. 基本結構
```typescript
import { ValueObject } from '@domain/base';

export abstract class RoleValueObject extends ValueObject {
  protected readonly _value: string;
  protected readonly _displayName: string;
  protected readonly _permissions: Permission[];

  constructor(value: string, displayName: string, permissions: Permission[] = []) {
    super();
    this.validateRole(value, displayName);
    this._value = value;
    this._displayName = displayName;
    this._permissions = [...permissions];
  }

  /**
   * 驗證角色
   * @param value 角色值
   * @param displayName 顯示名稱
   */
  protected abstract validateRole(value: string, displayName: string): void;

  /**
   * 取得角色值
   */
  get value(): string {
    return this._value;
  }

  /**
   * 取得顯示名稱
   */
  get displayName(): string {
    return this._displayName;
  }

  /**
   * 取得權限清單
   */
  get permissions(): Permission[] {
    return [...this._permissions];
  }

  /**
   * 檢查是否有指定權限
   * @param permission 權限
   */
  hasPermission(permission: Permission): boolean {
    return this._permissions.includes(permission);
  }

  /**
   * 檢查是否有任一指定權限
   * @param permissions 權限陣列
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * 檢查是否有所有指定權限
   * @param permissions 權限陣列
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * 比較角色
   * @param other 其他角色
   */
  equals(other: RoleValueObject): boolean {
    return this._value === other._value;
  }

  /**
   * 轉換為字串
   */
  toString(): string {
    return this._value;
  }
}
```

### 2. 權限定義
```typescript
export enum Permission {
  // 使用者管理
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // 組織管理
  ORGANIZATION_READ = 'organization:read',
  ORGANIZATION_WRITE = 'organization:write',
  ORGANIZATION_DELETE = 'organization:delete',
  
  // 專案管理
  PROJECT_READ = 'project:read',
  PROJECT_WRITE = 'project:write',
  PROJECT_DELETE = 'project:delete',
  
  // 任務管理
  TASK_READ = 'task:read',
  TASK_WRITE = 'task:write',
  TASK_DELETE = 'task:delete',
  
  // 團隊管理
  TEAM_READ = 'team:read',
  TEAM_WRITE = 'team:write',
  TEAM_DELETE = 'team:delete',
  
  // 文件管理
  DOCUMENT_READ = 'document:read',
  DOCUMENT_WRITE = 'document:write',
  DOCUMENT_DELETE = 'document:delete',
  
  // 報告管理
  REPORT_READ = 'report:read',
  REPORT_WRITE = 'report:write',
  REPORT_DELETE = 'report:delete',
  
  // 系統管理
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_CONFIG = 'system:config'
}
```

## 組織角色

### 1. 組織角色值物件
```typescript
export class OrganizationRole extends RoleValueObject {
  static readonly OWNER = new OrganizationRole('owner', '擁有者', [
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_WRITE,
    Permission.ORGANIZATION_DELETE,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.PROJECT_DELETE,
    Permission.TEAM_READ,
    Permission.TEAM_WRITE,
    Permission.TEAM_DELETE
  ]);

  static readonly ADMIN = new OrganizationRole('admin', '管理員', [
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_WRITE,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.PROJECT_DELETE,
    Permission.TEAM_READ,
    Permission.TEAM_WRITE,
    Permission.TEAM_DELETE
  ]);

  static readonly MANAGER = new OrganizationRole('manager', '經理', [
    Permission.ORGANIZATION_READ,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.TEAM_READ,
    Permission.TEAM_WRITE
  ]);

  static readonly ENGINEER = new OrganizationRole('engineer', '工程師', [
    Permission.ORGANIZATION_READ,
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.TEAM_READ
  ]);

  static readonly SUPERVISOR = new OrganizationRole('supervisor', '監工', [
    Permission.ORGANIZATION_READ,
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.TEAM_READ,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE
  ]);

  static readonly CONTRACTOR = new OrganizationRole('contractor', '承包商', [
    Permission.ORGANIZATION_READ,
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.DOCUMENT_READ,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE
  ]);

  static readonly GUEST = new OrganizationRole('guest', '訪客', [
    Permission.ORGANIZATION_READ,
    Permission.PROJECT_READ,
    Permission.TASK_READ
  ]);

  private constructor(value: string, displayName: string, permissions: Permission[]) {
    super(value, displayName, permissions);
  }

  protected validateRole(value: string, displayName: string): void {
    if (!value || value.trim().length === 0) {
      throw new DomainError('組織角色值不能為空');
    }
    
    if (!displayName || displayName.trim().length === 0) {
      throw new DomainError('組織角色顯示名稱不能為空');
    }
    
    const validRoles = ['owner', 'admin', 'manager', 'engineer', 'supervisor', 'contractor', 'guest'];
    if (!validRoles.includes(value)) {
      throw new DomainError(`無效的組織角色: ${value}`);
    }
  }

  /**
   * 建立組織角色
   * @param value 角色值
   */
  static fromString(value: string): OrganizationRole {
    switch (value) {
      case 'owner': return OrganizationRole.OWNER;
      case 'admin': return OrganizationRole.ADMIN;
      case 'manager': return OrganizationRole.MANAGER;
      case 'engineer': return OrganizationRole.ENGINEER;
      case 'supervisor': return OrganizationRole.SUPERVISOR;
      case 'contractor': return OrganizationRole.CONTRACTOR;
      case 'guest': return OrganizationRole.GUEST;
      default: throw new DomainError(`無效的組織角色: ${value}`);
    }
  }

  /**
   * 取得所有組織角色
   */
  static getAll(): OrganizationRole[] {
    return [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
      OrganizationRole.MANAGER,
      OrganizationRole.ENGINEER,
      OrganizationRole.SUPERVISOR,
      OrganizationRole.CONTRACTOR,
      OrganizationRole.GUEST
    ];
  }

  /**
   * 檢查是否為管理角色
   */
  isManagementRole(): boolean {
    return [OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MANAGER]
      .includes(this);
  }

  /**
   * 檢查是否為技術角色
   */
  isTechnicalRole(): boolean {
    return [OrganizationRole.ENGINEER, OrganizationRole.SUPERVISOR]
      .includes(this);
  }

  /**
   * 檢查是否為外部角色
   */
  isExternalRole(): boolean {
    return [OrganizationRole.CONTRACTOR, OrganizationRole.GUEST]
      .includes(this);
  }
}
```

## 團隊角色

### 1. 團隊角色值物件
```typescript
export class TeamRole extends RoleValueObject {
  static readonly LEADER = new TeamRole('leader', '隊長', [
    Permission.TEAM_READ,
    Permission.TEAM_WRITE,
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE
  ]);

  static readonly MEMBER = new TeamRole('member', '成員', [
    Permission.TEAM_READ,
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE
  ]);

  static readonly OBSERVER = new TeamRole('observer', '觀察者', [
    Permission.TEAM_READ,
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.DOCUMENT_READ,
    Permission.REPORT_READ
  ]);

  private constructor(value: string, displayName: string, permissions: Permission[]) {
    super(value, displayName, permissions);
  }

  protected validateRole(value: string, displayName: string): void {
    if (!value || value.trim().length === 0) {
      throw new DomainError('團隊角色值不能為空');
    }
    
    if (!displayName || displayName.trim().length === 0) {
      throw new DomainError('團隊角色顯示名稱不能為空');
    }
    
    const validRoles = ['leader', 'member', 'observer'];
    if (!validRoles.includes(value)) {
      throw new DomainError(`無效的團隊角色: ${value}`);
    }
  }

  /**
   * 建立團隊角色
   * @param value 角色值
   */
  static fromString(value: string): TeamRole {
    switch (value) {
      case 'leader': return TeamRole.LEADER;
      case 'member': return TeamRole.MEMBER;
      case 'observer': return TeamRole.OBSERVER;
      default: throw new DomainError(`無效的團隊角色: ${value}`);
    }
  }

  /**
   * 取得所有團隊角色
   */
  static getAll(): TeamRole[] {
    return [
      TeamRole.LEADER,
      TeamRole.MEMBER,
      TeamRole.OBSERVER
    ];
  }

  /**
   * 檢查是否為領導角色
   */
  isLeadershipRole(): boolean {
    return this === TeamRole.LEADER;
  }

  /**
   * 檢查是否為參與角色
   */
  isParticipantRole(): boolean {
    return [TeamRole.LEADER, TeamRole.MEMBER].includes(this);
  }
}
```

## 專案角色

### 1. 專案角色值物件
```typescript
export class ProjectRole extends RoleValueObject {
  static readonly PROJECT_MANAGER = new ProjectRole('project_manager', '專案經理', [
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.PROJECT_DELETE,
    Permission.USER_READ,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.TASK_DELETE,
    Permission.TEAM_READ,
    Permission.TEAM_WRITE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.DOCUMENT_DELETE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE,
    Permission.REPORT_DELETE
  ]);

  static readonly TECHNICAL_LEAD = new ProjectRole('technical_lead', '技術負責人', [
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.USER_READ,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.TASK_DELETE,
    Permission.TEAM_READ,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE
  ]);

  static readonly DEVELOPER = new ProjectRole('developer', '開發者', [
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.USER_READ,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE
  ]);

  static readonly TESTER = new ProjectRole('tester', '測試者', [
    Permission.PROJECT_READ,
    Permission.USER_READ,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE
  ]);

  static readonly STAKEHOLDER = new ProjectRole('stakeholder', '利害關係人', [
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.DOCUMENT_READ,
    Permission.REPORT_READ
  ]);

  private constructor(value: string, displayName: string, permissions: Permission[]) {
    super(value, displayName, permissions);
  }

  protected validateRole(value: string, displayName: string): void {
    if (!value || value.trim().length === 0) {
      throw new DomainError('專案角色值不能為空');
    }
    
    if (!displayName || displayName.trim().length === 0) {
      throw new DomainError('專案角色顯示名稱不能為空');
    }
    
    const validRoles = ['project_manager', 'technical_lead', 'developer', 'tester', 'stakeholder'];
    if (!validRoles.includes(value)) {
      throw new DomainError(`無效的專案角色: ${value}`);
    }
  }

  /**
   * 建立專案角色
   * @param value 角色值
   */
  static fromString(value: string): ProjectRole {
    switch (value) {
      case 'project_manager': return ProjectRole.PROJECT_MANAGER;
      case 'technical_lead': return ProjectRole.TECHNICAL_LEAD;
      case 'developer': return ProjectRole.DEVELOPER;
      case 'tester': return ProjectRole.TESTER;
      case 'stakeholder': return ProjectRole.STAKEHOLDER;
      default: throw new DomainError(`無效的專案角色: ${value}`);
    }
  }

  /**
   * 取得所有專案角色
   */
  static getAll(): ProjectRole[] {
    return [
      ProjectRole.PROJECT_MANAGER,
      ProjectRole.TECHNICAL_LEAD,
      ProjectRole.DEVELOPER,
      ProjectRole.TESTER,
      ProjectRole.STAKEHOLDER
    ];
  }

  /**
   * 檢查是否為管理角色
   */
  isManagementRole(): boolean {
    return [ProjectRole.PROJECT_MANAGER, ProjectRole.TECHNICAL_LEAD]
      .includes(this);
  }

  /**
   * 檢查是否為執行角色
   */
  isExecutionRole(): boolean {
    return [ProjectRole.DEVELOPER, ProjectRole.TESTER]
      .includes(this);
  }
}
```

## 系統角色

### 1. 系統角色值物件
```typescript
export class SystemRole extends RoleValueObject {
  static readonly SUPER_ADMIN = new SystemRole('super_admin', '超級管理員', [
    Permission.SYSTEM_ADMIN,
    Permission.SYSTEM_CONFIG,
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_WRITE,
    Permission.ORGANIZATION_DELETE,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.PROJECT_DELETE,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.TASK_DELETE,
    Permission.TEAM_READ,
    Permission.TEAM_WRITE,
    Permission.TEAM_DELETE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.DOCUMENT_DELETE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE,
    Permission.REPORT_DELETE
  ]);

  static readonly ADMIN = new SystemRole('admin', '系統管理員', [
    Permission.SYSTEM_CONFIG,
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_WRITE,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.TEAM_READ,
    Permission.TEAM_WRITE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE
  ]);

  static readonly MODERATOR = new SystemRole('moderator', '版主', [
    Permission.ORGANIZATION_READ,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.TASK_READ,
    Permission.TASK_WRITE,
    Permission.TEAM_READ,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE
  ]);

  private constructor(value: string, displayName: string, permissions: Permission[]) {
    super(value, displayName, permissions);
  }

  protected validateRole(value: string, displayName: string): void {
    if (!value || value.trim().length === 0) {
      throw new DomainError('系統角色值不能為空');
    }
    
    if (!displayName || displayName.trim().length === 0) {
      throw new DomainError('系統角色顯示名稱不能為空');
    }
    
    const validRoles = ['super_admin', 'admin', 'moderator'];
    if (!validRoles.includes(value)) {
      throw new DomainError(`無效的系統角色: ${value}`);
    }
  }

  /**
   * 建立系統角色
   * @param value 角色值
   */
  static fromString(value: string): SystemRole {
    switch (value) {
      case 'super_admin': return SystemRole.SUPER_ADMIN;
      case 'admin': return SystemRole.ADMIN;
      case 'moderator': return SystemRole.MODERATOR;
      default: throw new DomainError(`無效的系統角色: ${value}`);
    }
  }

  /**
   * 取得所有系統角色
   */
  static getAll(): SystemRole[] {
    return [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.MODERATOR
    ];
  }

  /**
   * 檢查是否為超級管理員
   */
  isSuperAdmin(): boolean {
    return this === SystemRole.SUPER_ADMIN;
  }

  /**
   * 檢查是否為管理員
   */
  isAdmin(): boolean {
    return [SystemRole.SUPER_ADMIN, SystemRole.ADMIN].includes(this);
  }
}
```

## 角色工廠

### 1. 角色工廠
```typescript
export class RoleFactory {
  /**
   * 根據角色類型建立角色
   * @param roleType 角色類型
   * @param value 角色值
   */
  static createRole(roleType: string, value: string): RoleValueObject {
    switch (roleType.toLowerCase()) {
      case 'organization':
        return OrganizationRole.fromString(value);
      case 'team':
        return TeamRole.fromString(value);
      case 'project':
        return ProjectRole.fromString(value);
      case 'system':
        return SystemRole.fromString(value);
      default:
        throw new DomainError(`無效的角色類型: ${roleType}`);
    }
  }

  /**
   * 取得所有角色類型
   */
  static getAllRoleTypes(): string[] {
    return ['organization', 'team', 'project', 'system'];
  }

  /**
   * 取得指定類型的所有角色
   * @param roleType 角色類型
   */
  static getAllRolesByType(roleType: string): RoleValueObject[] {
    switch (roleType.toLowerCase()) {
      case 'organization':
        return OrganizationRole.getAll();
      case 'team':
        return TeamRole.getAll();
      case 'project':
        return ProjectRole.getAll();
      case 'system':
        return SystemRole.getAll();
      default:
        throw new DomainError(`無效的角色類型: ${roleType}`);
    }
  }
}
```

## 使用範例

### 1. 建立角色
```typescript
// 建立組織角色
const orgRole = OrganizationRole.fromString('admin');
console.log(orgRole.displayName); // '管理員'
console.log(orgRole.hasPermission(Permission.USER_WRITE)); // true

// 建立團隊角色
const teamRole = TeamRole.fromString('leader');
console.log(teamRole.isLeadershipRole()); // true

// 建立專案角色
const projectRole = ProjectRole.fromString('developer');
console.log(projectRole.isExecutionRole()); // true
```

### 2. 權限檢查
```typescript
const adminRole = OrganizationRole.ADMIN;

// 檢查單一權限
if (adminRole.hasPermission(Permission.USER_WRITE)) {
  console.log('可以編輯使用者');
}

// 檢查多個權限
const requiredPermissions = [Permission.USER_READ, Permission.USER_WRITE];
if (adminRole.hasAllPermissions(requiredPermissions)) {
  console.log('擁有所有必要權限');
}

// 檢查任一權限
const optionalPermissions = [Permission.USER_DELETE, Permission.PROJECT_DELETE];
if (adminRole.hasAnyPermission(optionalPermissions)) {
  console.log('擁有至少一個可選權限');
}
```

### 3. 角色比較
```typescript
const role1 = OrganizationRole.ADMIN;
const role2 = OrganizationRole.fromString('admin');

console.log(role1.equals(role2)); // true
console.log(role1.toString()); // 'admin'
```

## 相關資源
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Value Object Pattern](https://martinfowler.com/bliki/ValueObject.html)
- [Role-Based Access Control](https://en.wikipedia.org/wiki/Role-based_access_control)