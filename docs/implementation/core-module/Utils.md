# 工具函式 (Utils)

## 概述
核心工具函式模組提供全系統通用的工具函式，包括日期格式化、權限判斷、資料驗證、字串處理等功能。使用 Angular v20 的 standalone 函式進行現代化實作。

## 日期工具

### 1. 日期格式化
```typescript
import { DatePipe } from '@angular/common';

export class DateUtils {
  /**
   * 格式化日期為指定格式
   * @param date 日期物件或字串
   * @param format 格式字串
   * @returns 格式化後的日期字串
   */
  static formatDate(date: Date | string, format: string = 'yyyy-MM-dd'): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const pipe = new DatePipe('zh-TW');
    
    return pipe.transform(dateObj, format) || '';
  }

  /**
   * 取得相對時間描述
   * @param date 日期物件或字串
   * @returns 相對時間描述
   */
  static getRelativeTime(date: Date | string): string {
    if (!date) return '';
    
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '剛剛';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分鐘前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小時前`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} 天前`;
    
    return this.formatDate(targetDate, 'yyyy-MM-dd');
  }

  /**
   * 檢查日期是否在指定範圍內
   * @param date 要檢查的日期
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @returns 是否在範圍內
   */
  static isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    return targetDate >= start && targetDate <= end;
  }
}
```

### 2. 日期計算
```typescript
export class DateCalculationUtils {
  /**
   * 計算兩個日期之間的天數
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @returns 天數差異
   */
  static getDaysDifference(startDate: Date | string, endDate: Date | string): number {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 取得月份的第一天和最後一天
   * @param date 日期
   * @returns 月份範圍
   */
  static getMonthRange(date: Date | string): { start: Date; end: Date } {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    
    return { start, end };
  }
}
```

## 權限工具

### 1. 權限檢查
```typescript
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/value-objects/role.value-object';

export class PermissionUtils {
  /**
   * 檢查使用者是否有指定角色
   * @param user 使用者物件
   * @param requiredRole 需要的角色
   * @returns 是否有權限
   */
  static hasRole(user: User | null, requiredRole: Role): boolean {
    if (!user || !user.roles) return false;
    
    return user.roles.some(role => role === requiredRole);
  }

  /**
   * 檢查使用者是否有任一指定角色
   * @param user 使用者物件
   * @param requiredRoles 需要的角色陣列
   * @returns 是否有權限
   */
  static hasAnyRole(user: User | null, requiredRoles: Role[]): boolean {
    if (!user || !user.roles) return false;
    
    return requiredRoles.some(role => user.roles!.includes(role));
  }

  /**
   * 檢查使用者是否有所有指定角色
   * @param user 使用者物件
   * @param requiredRoles 需要的角色陣列
   * @returns 是否有權限
   */
  static hasAllRoles(user: User | null, requiredRoles: Role[]): boolean {
    if (!user || !user.roles) return false;
    
    return requiredRoles.every(role => user.roles!.includes(role));
  }

  /**
   * 檢查使用者是否可以存取指定資源
   * @param user 使用者物件
   * @param resource 資源類型
   * @param action 操作類型
   * @returns 是否有權限
   */
  static canAccessResource(user: User | null, resource: string, action: string): boolean {
    if (!user) return false;
    
    // 管理員擁有所有權限
    if (this.hasRole(user, Role.ADMIN)) return true;
    
    // 根據資源和操作檢查權限
    const permissions = this.getResourcePermissions(resource, action);
    return this.hasAnyRole(user, permissions);
  }

  private static getResourcePermissions(resource: string, action: string): Role[] {
    const permissionMap: Record<string, Record<string, Role[]>> = {
      'users': {
        'read': [Role.ADMIN, Role.MANAGER],
        'write': [Role.ADMIN],
        'delete': [Role.ADMIN]
      },
      'projects': {
        'read': [Role.ADMIN, Role.MANAGER, Role.ENGINEER],
        'write': [Role.ADMIN, Role.MANAGER, Role.ENGINEER],
        'delete': [Role.ADMIN, Role.MANAGER]
      },
      'organizations': {
        'read': [Role.ADMIN, Role.MANAGER],
        'write': [Role.ADMIN],
        'delete': [Role.ADMIN]
      }
    };
    
    return permissionMap[resource]?.[action] || [];
  }
}
```

## 資料驗證工具

### 1. 表單驗證
```typescript
export class ValidationUtils {
  /**
   * 驗證電子郵件格式
   * @param email 電子郵件
   * @returns 是否有效
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 驗證密碼強度
   * @param password 密碼
   * @returns 驗證結果
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('密碼長度至少 8 個字元');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密碼必須包含大寫字母');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('密碼必須包含小寫字母');
    }
    
    if (!/\d/.test(password)) {
      errors.push('密碼必須包含數字');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密碼必須包含特殊字元');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證台灣手機號碼
   * @param phone 手機號碼
   * @returns 是否有效
   */
  static isValidTaiwanPhone(phone: string): boolean {
    const phoneRegex = /^09\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * 驗證統一編號
   * @param taxId 統一編號
   * @returns 是否有效
   */
  static isValidTaxId(taxId: string): boolean {
    if (!/^\d{8}$/.test(taxId)) return false;
    
    const weights = [1, 2, 1, 2, 1, 2, 4, 1];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      const digit = parseInt(taxId[i]);
      const weighted = digit * weights[i];
      sum += Math.floor(weighted / 10) + (weighted % 10);
    }
    
    return sum % 10 === 0;
  }
}
```

## 字串工具

### 1. 字串處理
```typescript
export class StringUtils {
  /**
   * 截斷字串並添加省略號
   * @param str 原始字串
   * @param maxLength 最大長度
   * @returns 截斷後的字串
   */
  static truncate(str: string, maxLength: number): string {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }

  /**
   * 移除字串中的 HTML 標籤
   * @param html HTML 字串
   * @returns 純文字字串
   */
  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * 將字串轉換為 URL 友善的 slug
   * @param str 原始字串
   * @returns slug 字串
   */
  static toSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * 首字母大寫
   * @param str 原始字串
   * @returns 首字母大寫的字串
   */
  static capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * 將駝峰命名轉換為空格分隔
   * @param str 駝峰命名字串
   * @returns 空格分隔的字串
   */
  static camelToSpaces(str: string): string {
    return str.replace(/([A-Z])/g, ' $1').trim();
  }
}
```

## 陣列工具

### 1. 陣列操作
```typescript
export class ArrayUtils {
  /**
   * 根據指定欄位分組
   * @param array 原始陣列
   * @param key 分組鍵
   * @returns 分組後的物件
   */
  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * 移除陣列中的重複項目
   * @param array 原始陣列
   * @param key 去重鍵（可選）
   * @returns 去重後的陣列
   */
  static unique<T>(array: T[], key?: keyof T): T[] {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * 陣列分頁
   * @param array 原始陣列
   * @param page 頁碼（從 1 開始）
   * @param pageSize 每頁大小
   * @returns 分頁結果
   */
  static paginate<T>(array: T[], page: number, pageSize: number): {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = array.slice(startIndex, endIndex);
    
    return {
      data,
      total: array.length,
      page,
      pageSize,
      totalPages: Math.ceil(array.length / pageSize)
    };
  }
}
```

## 物件工具

### 1. 物件操作
```typescript
export class ObjectUtils {
  /**
   * 深層複製物件
   * @param obj 原始物件
   * @returns 複製的物件
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * 檢查物件是否為空
   * @param obj 要檢查的物件
   * @returns 是否為空
   */
  static isEmpty(obj: any): boolean {
    if (obj == null) return true;
    if (typeof obj === 'string') return obj.trim().length === 0;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }

  /**
   * 合併多個物件
   * @param objects 要合併的物件陣列
   * @returns 合併後的物件
   */
  static merge<T extends Record<string, any>>(...objects: Partial<T>[]): T {
    return Object.assign({}, ...objects) as T;
  }

  /**
   * 取得物件的巢狀屬性值
   * @param obj 物件
   * @param path 屬性路徑（如 'user.profile.name'）
   * @param defaultValue 預設值
   * @returns 屬性值
   */
  static getNestedValue<T>(obj: any, path: string, defaultValue?: T): T | undefined {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  }
}
```

## 檔案工具

### 1. 檔案處理
```typescript
export class FileUtils {
  /**
   * 格式化檔案大小
   * @param bytes 位元組數
   * @returns 格式化後的大小字串
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 取得檔案副檔名
   * @param filename 檔案名稱
   * @returns 副檔名
   */
  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  /**
   * 檢查檔案類型是否為圖片
   * @param filename 檔案名稱
   * @returns 是否為圖片
   */
  static isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const extension = this.getFileExtension(filename).toLowerCase();
    return imageExtensions.includes(extension);
  }

  /**
   * 檢查檔案類型是否為文件
   * @param filename 檔案名稱
   * @returns 是否為文件
   */
  static isDocumentFile(filename: string): boolean {
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    const extension = this.getFileExtension(filename).toLowerCase();
    return documentExtensions.includes(extension);
  }
}
```

## 使用範例

### 1. 在元件中使用
```typescript
import { Component } from '@angular/core';
import { DateUtils, PermissionUtils, ValidationUtils } from '@core/utils';

@Component({
  selector: 'app-example',
  template: `
    <div>
      <p>格式化日期: {{ formattedDate }}</p>
      <p>相對時間: {{ relativeTime }}</p>
      <p>權限檢查: {{ hasPermission }}</p>
      <p>郵件驗證: {{ isValidEmail }}</p>
    </div>
  `,
  standalone: true
})
export class ExampleComponent {
  formattedDate = DateUtils.formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss');
  relativeTime = DateUtils.getRelativeTime(new Date(Date.now() - 3600000));
  hasPermission = PermissionUtils.hasRole(this.currentUser, Role.ADMIN);
  isValidEmail = ValidationUtils.isValidEmail('test@example.com');
  
  constructor(private currentUser: User) {}
}
```

### 2. 在服務中使用
```typescript
import { Injectable } from '@angular/core';
import { StringUtils, ArrayUtils, ObjectUtils } from '@core/utils';

@Injectable({
  providedIn: 'root'
})
export class DataProcessingService {
  processUserData(users: User[]): ProcessedUser[] {
    return users
      .filter(user => !ObjectUtils.isEmpty(user.name))
      .map(user => ({
        ...user,
        displayName: StringUtils.capitalize(user.name),
        slug: StringUtils.toSlug(user.name)
      }))
      .filter((user, index, array) => 
        ArrayUtils.unique(array, 'slug').includes(user)
      );
  }
}
```

## 測試

### 單元測試範例
```typescript
import { DateUtils, ValidationUtils, StringUtils } from '@core/utils';

describe('Utils', () => {
  describe('DateUtils', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = DateUtils.formatDate(date, 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });
  });

  describe('ValidationUtils', () => {
    it('should validate email correctly', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
    });
  });

  describe('StringUtils', () => {
    it('should truncate string correctly', () => {
      const result = StringUtils.truncate('This is a long string', 10);
      expect(result).toBe('This is a ...');
    });
  });
});
```

## 相關資源
- [Angular Common Module](https://angular.dev/api/common)
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [JavaScript Array Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)