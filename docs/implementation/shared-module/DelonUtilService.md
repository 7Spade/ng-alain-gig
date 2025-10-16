# DelonUtilService (@delon/util 工具服務整合)

## 概述

DelonUtilService 提供完整的工具函數集合，整合 @delon/util 與自定義工具函數。支援資料處理、字串操作、日期處理、陣列操作、物件操作、驗證工具、格式化工具等功能，並提供豐富的工具函數和輔助方法。

## 功能特色

### 1. 資料處理
- **資料轉換**: 支援各種資料類型轉換
- **資料驗證**: 提供資料驗證工具
- **資料格式化**: 支援資料格式化
- **資料清理**: 提供資料清理功能

### 2. 字串操作
- **字串格式化**: 支援字串格式化
- **字串驗證**: 提供字串驗證工具
- **字串轉換**: 支援字串轉換
- **字串搜尋**: 提供字串搜尋功能

### 3. 日期處理
- **日期格式化**: 支援日期格式化
- **日期計算**: 提供日期計算工具
- **日期驗證**: 支援日期驗證
- **時區處理**: 提供時區轉換功能

## API 規格

### 基本用法

```typescript
// 服務定義
@Injectable({
  providedIn: 'root'
})
export class DelonUtilService {
  constructor() {}

  // 資料處理
  deepClone<T>(obj: T): T {
    // 實作邏輯
  }

  // 字串操作
  formatString(template: string, ...args: any[]): string {
    // 實作邏輯
  }

  // 日期處理
  formatDate(date: Date, format: string): string {
    // 實作邏輯
  }

  // 陣列操作
  groupBy<T>(array: T[], key: string): { [key: string]: T[] } {
    // 實作邏輯
  }
}
```

### 參數說明

| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `obj` | `T` | - | 要處理的物件 |
| `template` | `string` | - | 字串模板 |
| `date` | `Date` | - | 日期物件 |
| `format` | `string` | - | 格式化字串 |

### 工具函數類型

```typescript
interface UtilityFunctions {
  // 資料處理
  deepClone: <T>(obj: T) => T;
  deepMerge: <T>(target: T, source: Partial<T>) => T;
  isEmpty: (value: any) => boolean;
  isEqual: (a: any, b: any) => boolean;

  // 字串操作
  formatString: (template: string, ...args: any[]) => string;
  camelCase: (str: string) => string;
  kebabCase: (str: string) => string;
  snakeCase: (str: string) => string;

  // 日期處理
  formatDate: (date: Date, format: string) => string;
  parseDate: (dateStr: string, format: string) => Date;
  addDays: (date: Date, days: number) => Date;
  diffDays: (date1: Date, date2: Date) => number;

  // 陣列操作
  groupBy: <T>(array: T[], key: string) => { [key: string]: T[] };
  unique: <T>(array: T[]) => T[];
  sortBy: <T>(array: T[], key: string) => T[];
  chunk: <T>(array: T[], size: number) => T[][];
}
```

## 使用範例

### 基本使用

```typescript
@Component({
  template: `
    <div>
      <!-- 資料處理範例 -->
      <div class="data-processing">
        <h3>資料處理</h3>
        <p>原始資料: {{ originalData | json }}</p>
        <p>深拷貝資料: {{ clonedData | json }}</p>
        <p>是否為空: {{ isEmpty(originalData) }}</p>
      </div>

      <!-- 字串操作範例 -->
      <div class="string-operations">
        <h3>字串操作</h3>
        <p>格式化字串: {{ formattedString }}</p>
        <p>駝峰命名: {{ camelCaseString }}</p>
        <p>短橫線命名: {{ kebabCaseString }}</p>
      </div>

      <!-- 日期處理範例 -->
      <div class="date-operations">
        <h3>日期處理</h3>
        <p>格式化日期: {{ formattedDate }}</p>
        <p>日期差異: {{ dateDiff }} 天</p>
        <p>未來日期: {{ futureDate | date:'short' }}</p>
      </div>

      <!-- 陣列操作範例 -->
      <div class="array-operations">
        <h3>陣列操作</h3>
        <p>分組結果: {{ groupedData | json }}</p>
        <p>去重結果: {{ uniqueData | json }}</p>
        <p>排序結果: {{ sortedData | json }}</p>
      </div>
    </div>
  `
})
export class UtilityExampleComponent {
  originalData = { name: 'test', value: 123 };
  clonedData: any;
  formattedString: string;
  camelCaseString: string;
  kebabCaseString: string;
  formattedDate: string;
  dateDiff: number;
  futureDate: Date;
  groupedData: any;
  uniqueData: any;
  sortedData: any;

  constructor(private delonUtilService: DelonUtilService) {
    this.initializeExamples();
  }

  private initializeExamples(): void {
    // 資料處理範例
    this.clonedData = this.delonUtilService.deepClone(this.originalData);
    
    // 字串操作範例
    this.formattedString = this.delonUtilService.formatString(
      'Hello {0}, welcome to {1}!', 
      'John', 
      'Angular'
    );
    this.camelCaseString = this.delonUtilService.camelCase('hello-world');
    this.kebabCaseString = this.delonUtilService.kebabCase('helloWorld');

    // 日期處理範例
    const now = new Date();
    this.formattedDate = this.delonUtilService.formatDate(now, 'yyyy-MM-dd HH:mm:ss');
    this.dateDiff = this.delonUtilService.diffDays(now, new Date('2024-01-01'));
    this.futureDate = this.delonUtilService.addDays(now, 30);

    // 陣列操作範例
    const testArray = [
      { id: 1, name: 'Alice', category: 'A' },
      { id: 2, name: 'Bob', category: 'B' },
      { id: 3, name: 'Charlie', category: 'A' }
    ];
    
    this.groupedData = this.delonUtilService.groupBy(testArray, 'category');
    this.uniqueData = this.delonUtilService.unique([1, 2, 2, 3, 3, 3]);
    this.sortedData = this.delonUtilService.sortBy(testArray, 'name');
  }

  isEmpty(value: any): boolean {
    return this.delonUtilService.isEmpty(value);
  }
}
```

### 進階使用

```typescript
@Component({
  template: `
    <div>
      <!-- 資料驗證 -->
      <nz-form [nzLayout]="'vertical'">
        <nz-form-item>
          <nz-form-label>電子郵件</nz-form-label>
          <input 
            nz-input 
            [(ngModel)]="email" 
            (blur)="validateEmail()"
            placeholder="請輸入電子郵件">
          <div *ngIf="emailError" class="error-message">
            {{ emailError }}
          </div>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>電話號碼</nz-form-label>
          <input 
            nz-input 
            [(ngModel)]="phone" 
            (blur)="validatePhone()"
            placeholder="請輸入電話號碼">
          <div *ngIf="phoneError" class="error-message">
            {{ phoneError }}
          </div>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>身份證號碼</nz-form-label>
          <input 
            nz-input 
            [(ngModel)]="idNumber" 
            (blur)="validateIdNumber()"
            placeholder="請輸入身份證號碼">
          <div *ngIf="idNumberError" class="error-message">
            {{ idNumberError }}
          </div>
        </nz-form-item>
      </nz-form>

      <!-- 資料轉換 -->
      <div class="data-transformation">
        <h3>資料轉換</h3>
        <button nz-button (click)="transformData()">轉換資料</button>
        <div *ngIf="transformedData">
          <pre>{{ transformedData | json }}</pre>
        </div>
      </div>

      <!-- 批次處理 -->
      <div class="batch-processing">
        <h3>批次處理</h3>
        <button nz-button (click)="processBatch()">批次處理</button>
        <div *ngIf="batchResult">
          <p>處理結果: {{ batchResult.success }} 成功, {{ batchResult.failed }} 失敗</p>
        </div>
      </div>
    </div>
  `
})
export class AdvancedUtilityComponent {
  email: string = '';
  phone: string = '';
  idNumber: string = '';
  emailError: string = '';
  phoneError: string = '';
  idNumberError: string = '';
  transformedData: any;
  batchResult: { success: number; failed: number };

  constructor(private delonUtilService: DelonUtilService) {}

  validateEmail(): void {
    if (!this.delonUtilService.isValidEmail(this.email)) {
      this.emailError = '請輸入有效的電子郵件地址';
    } else {
      this.emailError = '';
    }
  }

  validatePhone(): void {
    if (!this.delonUtilService.isValidPhone(this.phone)) {
      this.phoneError = '請輸入有效的電話號碼';
    } else {
      this.phoneError = '';
    }
  }

  validateIdNumber(): void {
    if (!this.delonUtilService.isValidIdNumber(this.idNumber)) {
      this.idNumberError = '請輸入有效的身份證號碼';
    } else {
      this.idNumberError = '';
    }
  }

  transformData(): void {
    const rawData = [
      { name: 'john doe', age: '25', salary: '50000' },
      { name: 'jane smith', age: '30', salary: '60000' }
    ];

    this.transformedData = rawData.map(item => ({
      name: this.delonUtilService.capitalize(item.name),
      age: parseInt(item.age),
      salary: parseFloat(item.salary),
      formattedSalary: this.delonUtilService.formatCurrency(parseFloat(item.salary))
    }));
  }

  async processBatch(): Promise<void> {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() }));
    
    const results = await this.delonUtilService.processBatch(data, async (item) => {
      // 模擬異步處理
      await new Promise(resolve => setTimeout(resolve, 10));
      return item.value > 0.5;
    });

    this.batchResult = {
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }
}
```

## 實作細節

### 核心邏輯

```typescript
@Injectable({
  providedIn: 'root'
})
export class DelonUtilService {
  constructor() {}

  // 資料處理
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }

    if (typeof obj === 'object') {
      const clonedObj = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }

    return obj;
  }

  deepMerge<T>(target: T, source: Partial<T>): T {
    const result = this.deepClone(target);
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      }
    }

    return result;
  }

  isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string') {
      return value.trim().length === 0;
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }

    return false;
  }

  isEqual(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }

    if (a === null || b === null || a === undefined || b === undefined) {
      return false;
    }

    if (typeof a !== typeof b) {
      return false;
    }

    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        return false;
      }

      for (const key of keysA) {
        if (!keysB.includes(key)) {
          return false;
        }
        if (!this.isEqual(a[key], b[key])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  // 字串操作
  formatString(template: string, ...args: any[]): string {
    return template.replace(/\{(\d+)\}/g, (match, index) => {
      return args[index] !== undefined ? args[index] : match;
    });
  }

  camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  kebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  snakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // 日期處理
  formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('yyyy', year.toString())
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  parseDate(dateStr: string, format: string): Date {
    // 簡化的日期解析實作
    const parts = dateStr.split(/[-\/]/);
    const formatParts = format.split(/[-\/]/);
    
    let year = 0, month = 0, day = 0;
    
    for (let i = 0; i < formatParts.length; i++) {
      const part = formatParts[i];
      const value = parseInt(parts[i]);
      
      if (part === 'yyyy') {
        year = value;
      } else if (part === 'MM') {
        month = value - 1;
      } else if (part === 'dd') {
        day = value;
      }
    }
    
    return new Date(year, month, day);
  }

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  diffDays(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // 陣列操作
  groupBy<T>(array: T[], key: string): { [key: string]: T[] } {
    return array.reduce((groups, item) => {
      const group = (item as any)[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as { [key: string]: T[] });
  }

  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  sortBy<T>(array: T[], key: string): T[] {
    return [...array].sort((a, b) => {
      const aVal = (a as any)[key];
      const bVal = (b as any)[key];
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  }

  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // 驗證工具
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\-\+\(\)\s]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
  }

  isValidIdNumber(idNumber: string): boolean {
    // 簡化的身份證號碼驗證
    const idRegex = /^[A-Z]\d{9}$/;
    return idRegex.test(idNumber);
  }

  // 格式化工具
  formatCurrency(amount: number, currency: string = 'TWD'): string {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatNumber(number: number, decimals: number = 2): string {
    return new Intl.NumberFormat('zh-TW', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  }

  // 批次處理
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<{ success: boolean; result?: R; error?: Error }[]> {
    const results: { success: boolean; result?: R; error?: Error }[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await processor(item);
          return { success: true, result };
        } catch (error) {
          return { success: false, error: error as Error };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // 輔助方法
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  // 防抖函數
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // 節流函數
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
```

## 測試範例

### 單元測試

```typescript
describe('DelonUtilService', () => {
  let service: DelonUtilService;

  beforeEach(() => {
    service = new DelonUtilService();
  });

  it('應該正確深拷貝物件', () => {
    const original = { name: 'test', nested: { value: 123 } };
    const cloned = service.deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.nested).not.toBe(original.nested);
  });

  it('應該正確格式化字串', () => {
    const result = service.formatString('Hello {0}, welcome to {1}!', 'John', 'Angular');
    expect(result).toBe('Hello John, welcome to Angular!');
  });

  it('應該正確轉換命名格式', () => {
    expect(service.camelCase('hello-world')).toBe('helloWorld');
    expect(service.kebabCase('helloWorld')).toBe('hello-world');
    expect(service.snakeCase('helloWorld')).toBe('hello_world');
  });

  it('應該正確格式化日期', () => {
    const date = new Date('2024-03-15T14:30:00');
    const result = service.formatDate(date, 'yyyy-MM-dd HH:mm:ss');
    expect(result).toBe('2024-03-15 14:30:00');
  });

  it('應該正確計算日期差異', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-10');
    const diff = service.diffDays(date1, date2);
    expect(diff).toBe(9);
  });

  it('應該正確分組陣列', () => {
    const array = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
      { id: 3, category: 'A' }
    ];
    const result = service.groupBy(array, 'category');
    expect(result).toEqual({
      A: [{ id: 1, category: 'A' }, { id: 3, category: 'A' }],
      B: [{ id: 2, category: 'B' }]
    });
  });

  it('應該正確驗證電子郵件', () => {
    expect(service.isValidEmail('test@example.com')).toBe(true);
    expect(service.isValidEmail('invalid-email')).toBe(false);
  });

  it('應該正確處理空值', () => {
    expect(service.isEmpty(null)).toBe(true);
    expect(service.isEmpty(undefined)).toBe(true);
    expect(service.isEmpty('')).toBe(true);
    expect(service.isEmpty([])).toBe(true);
    expect(service.isEmpty({})).toBe(true);
    expect(service.isEmpty('test')).toBe(false);
  });
});
```

## 效能考量

### 1. 記憶體管理
- **物件重用**: 重用常用物件
- **記憶體池**: 使用記憶體池減少分配
- **垃圾回收**: 及時清理暫存物件
- **記憶體監控**: 監控記憶體使用

### 2. 計算優化
- **快取結果**: 快取計算結果
- **預計算**: 預計算常用值
- **延遲計算**: 延遲非必要計算
- **批次處理**: 批次處理多個操作

### 3. 演算法優化
- **時間複雜度**: 優化演算法時間複雜度
- **空間複雜度**: 優化演算法空間複雜度
- **並行處理**: 使用並行處理提升效能
- **非同步處理**: 使用非同步處理避免阻塞

## 最佳實踐

### 1. 函數設計
- 保持函數純粹性
- 避免副作用
- 提供清晰的參數說明
- 實施適當的錯誤處理

### 2. 效能優化
- 使用適當的資料結構
- 避免不必要的計算
- 實施快取策略
- 優化迴圈和遞迴

### 3. 可維護性
- 提供清晰的函數命名
- 實施適當的註解
- 使用 TypeScript 類型檢查
- 提供完整的測試覆蓋

## 整合說明

### 與 @delon 整合
- 使用 @delon/util 核心功能
- 整合 @delon/theme 主題設定
- 使用 @delon/form 表單工具
- 整合 @delon/acl 權限工具

### 與 ng-zorro-antd 整合
- 使用 nz-util 工具函數
- 整合 nz-format 格式化工具
- 使用 nz-validate 驗證工具
- 整合 nz-transform 轉換工具

### 與 Firebase 整合
- 使用 Firestore 資料處理
- 整合 Firebase Auth 驗證
- 使用 Firebase Functions 處理
- 整合 Firebase Storage 檔案處理
