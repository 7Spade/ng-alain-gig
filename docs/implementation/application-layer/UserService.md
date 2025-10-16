# UserService (使用者應用服務)

## 概述
UserService 是使用者領域的應用服務，負責協調使用者相關的業務流程，包括使用者註冊、登入、個人資料管理、權限控制等功能。使用 DDD (Domain-Driven Design) 的 Application Layer 模式設計。

## 服務定義

### 1. 基本結構
```typescript
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserDomainService } from '@domain/services/user-domain.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { CreateUserCommand } from '@application/commands/create-user.command';
import { UpdateUserCommand } from '@application/commands/update-user.command';
import { UserQuery } from '@application/queries/user.query';
import { UserDto } from '@application/dtos/user.dto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly _currentUser$ = new BehaviorSubject<UserEntity | null>(null);
  private readonly _users$ = new BehaviorSubject<UserEntity[]>([]);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService
  ) {
    this.initializeCurrentUser();
  }

  /**
   * 初始化當前使用者
   */
  private async initializeCurrentUser(): Promise<void> {
    try {
      const currentUser = await this.authService.getCurrentUser();
      if (currentUser) {
        const userEntity = await this.userRepository.findById(currentUser.uid);
        this._currentUser$.next(userEntity);
      }
    } catch (error) {
      console.error('初始化當前使用者失敗:', error);
    }
  }
}
```

### 2. 使用者管理
```typescript
export class UserService {
  /**
   * 建立使用者
   * @param command 建立使用者指令
   */
  async createUser(command: CreateUserCommand): Promise<UserDto> {
    try {
      // 驗證指令
      this.validateCreateUserCommand(command);
      
      // 檢查使用者是否已存在
      const existingUser = await this.userRepository.findByEmail(command.email);
      if (existingUser) {
        throw new Error('使用者已存在');
      }
      
      // 使用領域服務建立使用者
      const userEntity = await this.userDomainService.createUser(
        command.name,
        command.email,
        command.password,
        command.role,
        command.profile
      );
      
      // 儲存使用者
      await this.userRepository.save(userEntity);
      
      // 發送通知
      this.notificationService.success('使用者建立成功');
      
      // 更新本地狀態
      this.updateUsersList();
      
      return this.mapToDto(userEntity);
    } catch (error) {
      this.notificationService.error('建立使用者失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 更新使用者
   * @param command 更新使用者指令
   */
  async updateUser(command: UpdateUserCommand): Promise<UserDto> {
    try {
      // 驗證指令
      this.validateUpdateUserCommand(command);
      
      // 取得使用者
      const userEntity = await this.userRepository.findById(command.userId);
      if (!userEntity) {
        throw new Error('使用者不存在');
      }
      
      // 檢查權限
      await this.checkUpdatePermission(userEntity);
      
      // 使用領域服務更新使用者
      await this.userDomainService.updateUser(
        userEntity,
        command.name,
        command.email,
        command.profile,
        command.role
      );
      
      // 儲存使用者
      await this.userRepository.save(userEntity);
      
      // 發送通知
      this.notificationService.success('使用者更新成功');
      
      // 更新本地狀態
      this.updateUsersList();
      this.updateCurrentUserIfNeeded(userEntity);
      
      return this.mapToDto(userEntity);
    } catch (error) {
      this.notificationService.error('更新使用者失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 刪除使用者
   * @param userId 使用者 ID
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // 取得使用者
      const userEntity = await this.userRepository.findById(userId);
      if (!userEntity) {
        throw new Error('使用者不存在');
      }
      
      // 檢查權限
      await this.checkDeletePermission(userEntity);
      
      // 使用領域服務刪除使用者
      await this.userDomainService.deleteUser(userEntity);
      
      // 從儲存庫刪除
      await this.userRepository.delete(userId);
      
      // 發送通知
      this.notificationService.success('使用者刪除成功');
      
      // 更新本地狀態
      this.updateUsersList();
      this.handleCurrentUserDeletion(userId);
    } catch (error) {
      this.notificationService.error('刪除使用者失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 驗證建立使用者指令
   * @param command 指令
   */
  private validateCreateUserCommand(command: CreateUserCommand): void {
    if (!command.name || command.name.trim().length === 0) {
      throw new Error('使用者名稱不能為空');
    }
    
    if (!command.email || !this.isValidEmail(command.email)) {
      throw new Error('電子郵件格式不正確');
    }
    
    if (!command.password || command.password.length < 8) {
      throw new Error('密碼長度至少 8 個字元');
    }
  }

  /**
   * 驗證更新使用者指令
   * @param command 指令
   */
  private validateUpdateUserCommand(command: UpdateUserCommand): void {
    if (!command.userId) {
      throw new Error('使用者 ID 不能為空');
    }
    
    if (command.name && command.name.trim().length === 0) {
      throw new Error('使用者名稱不能為空');
    }
    
    if (command.email && !this.isValidEmail(command.email)) {
      throw new Error('電子郵件格式不正確');
    }
  }

  /**
   * 檢查更新權限
   * @param userEntity 使用者實體
   */
  private async checkUpdatePermission(userEntity: UserEntity): Promise<void> {
    const currentUser = this._currentUser$.value;
    if (!currentUser) {
      throw new Error('未登入');
    }
    
    // 使用者只能更新自己的資料，管理員可以更新任何使用者
    if (!currentUser.isAdmin() && !currentUser.id.equals(userEntity.id)) {
      throw new Error('沒有權限更新此使用者');
    }
  }

  /**
   * 檢查刪除權限
   * @param userEntity 使用者實體
   */
  private async checkDeletePermission(userEntity: UserEntity): Promise<void> {
    const currentUser = this._currentUser$.value;
    if (!currentUser) {
      throw new Error('未登入');
    }
    
    // 只有管理員可以刪除使用者
    if (!currentUser.isAdmin()) {
      throw new Error('沒有權限刪除使用者');
    }
    
    // 不能刪除自己
    if (currentUser.id.equals(userEntity.id)) {
      throw new Error('不能刪除自己');
    }
  }

  /**
   * 驗證電子郵件格式
   * @param email 電子郵件
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

### 3. 使用者查詢
```typescript
export class UserService {
  /**
   * 取得使用者清單
   * @param query 查詢條件
   */
  async getUsers(query: UserQuery): Promise<UserDto[]> {
    try {
      const userEntities = await this.userRepository.findAll(query);
      return userEntities.map(entity => this.mapToDto(entity));
    } catch (error) {
      this.notificationService.error('取得使用者清單失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 根據 ID 取得使用者
   * @param userId 使用者 ID
   */
  async getUserById(userId: string): Promise<UserDto | null> {
    try {
      const userEntity = await this.userRepository.findById(userId);
      return userEntity ? this.mapToDto(userEntity) : null;
    } catch (error) {
      this.notificationService.error('取得使用者失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 根據電子郵件取得使用者
   * @param email 電子郵件
   */
  async getUserByEmail(email: string): Promise<UserDto | null> {
    try {
      const userEntity = await this.userRepository.findByEmail(email);
      return userEntity ? this.mapToDto(userEntity) : null;
    } catch (error) {
      this.notificationService.error('取得使用者失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 搜尋使用者
   * @param searchTerm 搜尋關鍵字
   */
  async searchUsers(searchTerm: string): Promise<UserDto[]> {
    try {
      const userEntities = await this.userRepository.search(searchTerm);
      return userEntities.map(entity => this.mapToDto(entity));
    } catch (error) {
      this.notificationService.error('搜尋使用者失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 取得當前使用者
   */
  getCurrentUser(): Observable<UserEntity | null> {
    return this._currentUser$.asObservable();
  }

  /**
   * 取得使用者清單
   */
  getUsers(): Observable<UserEntity[]> {
    return this._users$.asObservable();
  }
}
```

### 4. 使用者認證
```typescript
export class UserService {
  /**
   * 使用者登入
   * @param email 電子郵件
   * @param password 密碼
   */
  async login(email: string, password: string): Promise<UserDto> {
    try {
      // 使用認證服務登入
      const authResult = await this.authService.signInWithEmailAndPassword(email, password);
      
      // 取得使用者實體
      const userEntity = await this.userRepository.findById(authResult.user.uid);
      if (!userEntity) {
        throw new Error('使用者不存在');
      }
      
      // 更新當前使用者
      this._currentUser$.next(userEntity);
      
      // 發送通知
      this.notificationService.success('登入成功');
      
      return this.mapToDto(userEntity);
    } catch (error) {
      this.notificationService.error('登入失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 使用者登出
   */
  async logout(): Promise<void> {
    try {
      // 使用認證服務登出
      await this.authService.signOut();
      
      // 清除當前使用者
      this._currentUser$.next(null);
      
      // 發送通知
      this.notificationService.success('登出成功');
    } catch (error) {
      this.notificationService.error('登出失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 註冊使用者
   * @param name 姓名
   * @param email 電子郵件
   * @param password 密碼
   */
  async register(name: string, email: string, password: string): Promise<UserDto> {
    try {
      // 驗證輸入
      this.validateRegistrationInput(name, email, password);
      
      // 檢查使用者是否已存在
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new Error('使用者已存在');
      }
      
      // 使用認證服務註冊
      const authResult = await this.authService.createUserWithEmailAndPassword(email, password);
      
      // 建立使用者實體
      const userEntity = await this.userDomainService.createUser(
        name,
        email,
        password,
        'user', // 預設角色
        {}
      );
      
      // 儲存使用者
      await this.userRepository.save(userEntity);
      
      // 更新當前使用者
      this._currentUser$.next(userEntity);
      
      // 發送通知
      this.notificationService.success('註冊成功');
      
      return this.mapToDto(userEntity);
    } catch (error) {
      this.notificationService.error('註冊失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 重設密碼
   * @param email 電子郵件
   */
  async resetPassword(email: string): Promise<void> {
    try {
      // 驗證電子郵件
      if (!this.isValidEmail(email)) {
        throw new Error('電子郵件格式不正確');
      }
      
      // 使用認證服務重設密碼
      await this.authService.sendPasswordResetEmail(email);
      
      // 發送通知
      this.notificationService.success('密碼重設信件已發送');
    } catch (error) {
      this.notificationService.error('重設密碼失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 驗證註冊輸入
   * @param name 姓名
   * @param email 電子郵件
   * @param password 密碼
   */
  private validateRegistrationInput(name: string, email: string, password: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('姓名不能為空');
    }
    
    if (!email || !this.isValidEmail(email)) {
      throw new Error('電子郵件格式不正確');
    }
    
    if (!password || password.length < 8) {
      throw new Error('密碼長度至少 8 個字元');
    }
  }
}
```

### 5. 權限管理
```typescript
export class UserService {
  /**
   * 更新使用者角色
   * @param userId 使用者 ID
   * @param role 新角色
   */
  async updateUserRole(userId: string, role: string): Promise<UserDto> {
    try {
      // 檢查權限
      await this.checkRoleUpdatePermission();
      
      // 取得使用者
      const userEntity = await this.userRepository.findById(userId);
      if (!userEntity) {
        throw new Error('使用者不存在');
      }
      
      // 使用領域服務更新角色
      await this.userDomainService.updateUserRole(userEntity, role);
      
      // 儲存使用者
      await this.userRepository.save(userEntity);
      
      // 發送通知
      this.notificationService.success('使用者角色更新成功');
      
      // 更新本地狀態
      this.updateUsersList();
      this.updateCurrentUserIfNeeded(userEntity);
      
      return this.mapToDto(userEntity);
    } catch (error) {
      this.notificationService.error('更新使用者角色失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 檢查使用者權限
   * @param userId 使用者 ID
   * @param permission 權限
   */
  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userEntity = await this.userRepository.findById(userId);
      if (!userEntity) {
        return false;
      }
      
      return userEntity.hasPermission(permission);
    } catch (error) {
      console.error('檢查使用者權限失敗:', error);
      return false;
    }
  }

  /**
   * 取得使用者權限清單
   * @param userId 使用者 ID
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const userEntity = await this.userRepository.findById(userId);
      if (!userEntity) {
        return [];
      }
      
      return userEntity.getAllPermissions();
    } catch (error) {
      this.notificationService.error('取得使用者權限失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 檢查角色更新權限
   */
  private async checkRoleUpdatePermission(): Promise<void> {
    const currentUser = this._currentUser$.value;
    if (!currentUser) {
      throw new Error('未登入');
    }
    
    if (!currentUser.isAdmin()) {
      throw new Error('只有管理員可以更新使用者角色');
    }
  }
}
```

### 6. 狀態管理
```typescript
export class UserService {
  /**
   * 更新使用者清單
   */
  private async updateUsersList(): Promise<void> {
    try {
      const users = await this.userRepository.findAll();
      this._users$.next(users);
    } catch (error) {
      console.error('更新使用者清單失敗:', error);
    }
  }

  /**
   * 更新當前使用者（如果需要）
   * @param userEntity 使用者實體
   */
  private updateCurrentUserIfNeeded(userEntity: UserEntity): void {
    const currentUser = this._currentUser$.value;
    if (currentUser && currentUser.id.equals(userEntity.id)) {
      this._currentUser$.next(userEntity);
    }
  }

  /**
   * 處理當前使用者刪除
   * @param userId 使用者 ID
   */
  private handleCurrentUserDeletion(userId: string): void {
    const currentUser = this._currentUser$.value;
    if (currentUser && currentUser.id.value === userId) {
      this._currentUser$.next(null);
    }
  }

  /**
   * 將實體轉換為 DTO
   * @param userEntity 使用者實體
   */
  private mapToDto(userEntity: UserEntity): UserDto {
    return {
      id: userEntity.id.value,
      name: userEntity.name,
      email: userEntity.email,
      role: userEntity.role,
      profile: userEntity.profile,
      isActive: userEntity.isActive,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt
    };
  }

  /**
   * 重新整理使用者資料
   */
  async refreshUserData(): Promise<void> {
    try {
      await this.updateUsersList();
      
      const currentUser = this._currentUser$.value;
      if (currentUser) {
        const refreshedUser = await this.userRepository.findById(currentUser.id.value);
        if (refreshedUser) {
          this._currentUser$.next(refreshedUser);
        }
      }
    } catch (error) {
      console.error('重新整理使用者資料失敗:', error);
    }
  }
}
```

## 指令和查詢

### 1. 建立使用者指令
```typescript
export interface CreateUserCommand {
  name: string;
  email: string;
  password: string;
  role: string;
  profile: UserProfile;
}
```

### 2. 更新使用者指令
```typescript
export interface UpdateUserCommand {
  userId: string;
  name?: string;
  email?: string;
  profile?: UserProfile;
  role?: string;
}
```

### 3. 使用者查詢
```typescript
export interface UserQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### 4. 使用者 DTO
```typescript
export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  profile: UserProfile;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 使用範例

### 1. 在元件中使用
```typescript
import { Component, OnInit } from '@angular/core';
import { UserService } from '@application/services/user.service';
import { UserDto } from '@application/dtos/user.dto';

@Component({
  selector: 'app-user-list',
  template: `
    <div>
      <h2>使用者清單</h2>
      <div *ngFor="let user of users">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
        <p>角色: {{ user.role }}</p>
        <button (click)="editUser(user)">編輯</button>
        <button (click)="deleteUser(user.id)">刪除</button>
      </div>
    </div>
  `,
  standalone: true
})
export class UserListComponent implements OnInit {
  users: UserDto[] = [];

  constructor(private userService: UserService) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.users = await this.userService.getUsers({});
    } catch (error) {
      console.error('載入使用者失敗:', error);
    }
  }

  async editUser(user: UserDto) {
    // 實作編輯邏輯
  }

  async deleteUser(userId: string) {
    try {
      await this.userService.deleteUser(userId);
      await this.loadUsers();
    } catch (error) {
      console.error('刪除使用者失敗:', error);
    }
  }
}
```

### 2. 在認證元件中使用
```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '@application/services/user.service';

@Component({
  selector: 'app-login',
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <div>
        <label>電子郵件:</label>
        <input type="email" formControlName="email" required>
      </div>
      <div>
        <label>密碼:</label>
        <input type="password" formControlName="password" required>
      </div>
      <button type="submit" [disabled]="loginForm.invalid">登入</button>
    </form>
  `,
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      try {
        const { email, password } = this.loginForm.value;
        await this.userService.login(email, password);
        // 導航到主頁
      } catch (error) {
        console.error('登入失敗:', error);
      }
    }
  }
}
```

## 相關資源
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Application Service Pattern](https://martinfowler.com/eaaCatalog/applicationService.html)
- [Command Query Responsibility Segregation](https://martinfowler.com/bliki/CQRS.html)