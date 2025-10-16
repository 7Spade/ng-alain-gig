# DelonFormService (@delon/form 表單服務整合)

## 概述

DelonFormService 提供完整的表單管理功能，整合 @delon/form 與 Firebase 和自定義表單系統。支援動態表單生成、表單驗證、表單狀態管理、表單資料同步等功能，並提供豐富的表單組件和驗證規則。

## 功能特色

### 1. 動態表單
- **表單生成**: 基於 JSON Schema 動態生成表單
- **組件映射**: 自動映射表單欄位到對應組件
- **佈局管理**: 支援響應式表單佈局
- **主題整合**: 整合 @delon/theme 主題系統

### 2. 表單驗證
- **即時驗證**: 支援即時表單驗證
- **自定義驗證**: 支援自定義驗證規則
- **異步驗證**: 支援異步驗證邏輯
- **錯誤處理**: 提供詳細的錯誤訊息

### 3. 表單狀態
- **狀態管理**: 管理表單狀態和資料
- **狀態同步**: 同步表單狀態到後端
- **狀態恢復**: 支援表單狀態恢復
- **狀態歷史**: 保存表單狀態歷史

## API 規格

### 基本用法

```typescript
// 服務定義
@Injectable({
  providedIn: 'root'
})
export class DelonFormService {
  constructor(
    private sfService: SFService,
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  // 建立表單
  createForm(schema: SFSchema, ui: SFUISchema, data?: any): SFComponent {
    // 實作邏輯
  }

  // 驗證表單
  validateForm(form: SFComponent): ValidationResult {
    // 實作邏輯
  }

  // 儲存表單資料
  saveFormData(formId: string, data: any): Promise<void> {
    // 實作邏輯
  }

  // 載入表單資料
  loadFormData(formId: string): Promise<any> {
    // 實作邏輯
  }
}
```

### 參數說明

| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `schema` | `SFSchema` | - | 表單結構定義 |
| `ui` | `SFUISchema` | - | 表單 UI 定義 |
| `data` | `any` | - | 表單初始資料 |
| `formId` | `string` | - | 表單 ID |

### 表單結構定義

```typescript
interface SFSchema {
  properties: { [key: string]: SFProperty };
  required?: string[];
  type?: string;
  title?: string;
  description?: string;
}

interface SFProperty {
  type: string;
  title?: string;
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  properties?: { [key: string]: SFProperty };
  items?: SFProperty;
}
```

## 使用範例

### 基本使用

```typescript
@Component({
  template: `
    <div>
      <sf 
        [schema]="formSchema" 
        [ui]="formUI" 
        [formData]="formData"
        (formSubmit)="onFormSubmit($event)"
        (formChange)="onFormChange($event)">
      </sf>
      
      <div class="form-actions">
        <button nz-button (click)="saveForm()">儲存</button>
        <button nz-button (click)="resetForm()">重置</button>
        <button nz-button (click)="submitForm()">提交</button>
      </div>
    </div>
  `
})
export class DynamicFormComponent {
  formSchema: SFSchema = {
    properties: {
      name: {
        type: 'string',
        title: '專案名稱',
        description: '請輸入專案名稱',
        minLength: 2,
        maxLength: 50
      },
      description: {
        type: 'string',
        title: '專案描述',
        description: '請輸入專案描述',
        ui: {
          widget: 'textarea',
          grid: { span: 24 }
        }
      },
      startDate: {
        type: 'string',
        title: '開始日期',
        format: 'date',
        ui: {
          widget: 'date',
          grid: { span: 12 }
        }
      },
      endDate: {
        type: 'string',
        title: '結束日期',
        format: 'date',
        ui: {
          widget: 'date',
          grid: { span: 12 }
        }
      },
      status: {
        type: 'string',
        title: '專案狀態',
        enum: ['planning', 'active', 'completed', 'cancelled'],
        enumNames: ['規劃中', '進行中', '已完成', '已取消'],
        ui: {
          widget: 'select',
          grid: { span: 12 }
        }
      },
      priority: {
        type: 'number',
        title: '優先級',
        minimum: 1,
        maximum: 5,
        ui: {
          widget: 'rate',
          grid: { span: 12 }
        }
      }
    },
    required: ['name', 'startDate', 'endDate', 'status']
  };

  formUI: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: { span: 24 }
    },
    name: {
      placeholder: '請輸入專案名稱'
    },
    description: {
      placeholder: '請輸入專案描述',
      autosize: { minRows: 3, maxRows: 6 }
    }
  };

  formData: any = {};

  constructor(private delonFormService: DelonFormService) {}

  onFormSubmit(data: any): void {
    console.log('表單提交:', data);
    this.saveFormData(data);
  }

  onFormChange(data: any): void {
    console.log('表單變更:', data);
  }

  async saveForm(): Promise<void> {
    try {
      const formData = this.getFormData();
      await this.delonFormService.saveFormData('project-form', formData);
      console.log('表單儲存成功');
    } catch (error) {
      console.error('表單儲存失敗:', error);
    }
  }

  resetForm(): void {
    this.formData = {};
  }

  submitForm(): void {
    // 觸發表單提交
    this.onFormSubmit(this.formData);
  }

  private getFormData(): any {
    // 獲取表單資料的邏輯
    return this.formData;
  }

  private async saveFormData(data: any): Promise<void> {
    // 儲存表單資料的邏輯
    await this.delonFormService.saveFormData('project-form', data);
  }
}
```

### 進階使用

```typescript
@Component({
  template: `
    <div>
      <!-- 動態表單生成 -->
      <sf 
        [schema]="dynamicSchema" 
        [ui]="dynamicUI" 
        [formData]="dynamicData"
        (formSubmit)="onDynamicFormSubmit($event)">
      </sf>

      <!-- 表單驗證結果 -->
      <div *ngIf="validationErrors.length > 0" class="validation-errors">
        <nz-alert 
          nzType="error" 
          nzMessage="表單驗證失敗" 
          [nzDescription]="validationErrors.join(', ')">
        </nz-alert>
      </div>

      <!-- 表單狀態指示器 -->
      <div class="form-status">
        <nz-tag [nzColor]="formStatus.color">
          {{ formStatus.text }}
        </nz-tag>
        <span>最後儲存: {{ lastSaved | date:'short' }}</span>
      </div>
    </div>
  `
})
export class AdvancedFormComponent {
  dynamicSchema: SFSchema = {};
  dynamicUI: SFUISchema = {};
  dynamicData: any = {};
  validationErrors: string[] = [];
  formStatus: { color: string; text: string } = { color: 'default', text: '未修改' };
  lastSaved: Date | null = null;

  constructor(private delonFormService: DelonFormService) {}

  async loadFormTemplate(templateId: string): Promise<void> {
    try {
      const template = await this.delonFormService.getFormTemplate(templateId);
      
      this.dynamicSchema = template.schema;
      this.dynamicUI = template.ui;
      this.dynamicData = template.defaultData || {};

      // 載入已儲存的資料
      const savedData = await this.delonFormService.loadFormData(templateId);
      if (savedData) {
        this.dynamicData = { ...this.dynamicData, ...savedData };
      }

    } catch (error) {
      console.error('載入表單模板失敗:', error);
    }
  }

  async onDynamicFormSubmit(data: any): Promise<void> {
    try {
      // 驗證表單
      const validationResult = await this.validateForm(data);
      
      if (!validationResult.isValid) {
        this.validationErrors = validationResult.errors;
        this.formStatus = { color: 'error', text: '驗證失敗' };
        return;
      }

      // 儲存表單資料
      await this.delonFormService.saveFormData('dynamic-form', data);
      
      this.validationErrors = [];
      this.formStatus = { color: 'success', text: '已儲存' };
      this.lastSaved = new Date();

    } catch (error) {
      console.error('表單提交失敗:', error);
      this.formStatus = { color: 'error', text: '提交失敗' };
    }
  }

  private async validateForm(data: any): Promise<ValidationResult> {
    // 自定義驗證邏輯
    const errors: string[] = [];

    // 驗證必填欄位
    if (!data.name) {
      errors.push('專案名稱為必填欄位');
    }

    // 驗證日期範圍
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (startDate >= endDate) {
        errors.push('結束日期必須晚於開始日期');
      }
    }

    // 驗證專案名稱唯一性
    if (data.name) {
      const isUnique = await this.checkProjectNameUnique(data.name);
      if (!isUnique) {
        errors.push('專案名稱已存在');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async checkProjectNameUnique(name: string): Promise<boolean> {
    // 檢查專案名稱唯一性的邏輯
    return true; // 簡化實作
  }
}
```

## 實作細節

### 核心邏輯

```typescript
@Injectable({
  providedIn: 'root'
})
export class DelonFormService {
  private formCache: Map<string, FormCache> = new Map();
  private validationCache: Map<string, ValidationResult> = new Map();

  constructor(
    private sfService: SFService,
    private firestore: Firestore,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  createForm(schema: SFSchema, ui: SFUISchema, data?: any): SFComponent {
    try {
      // 建立表單組件
      const form = this.sfService.createForm(schema, ui, data);

      // 設定表單事件監聽器
      this.setupFormEventListeners(form);

      // 快取表單
      const formId = this.generateFormId(schema);
      this.formCache.set(formId, {
        form,
        schema,
        ui,
        data: data || {},
        createdAt: new Date()
      });

      return form;
    } catch (error) {
      console.error('建立表單失敗:', error);
      throw error;
    }
  }

  async validateForm(form: SFComponent): Promise<ValidationResult> {
    try {
      const formData = form.value;
      const schema = form.schema;
      
      // 檢查快取
      const cacheKey = this.generateValidationCacheKey(formData, schema);
      if (this.validationCache.has(cacheKey)) {
        return this.validationCache.get(cacheKey)!;
      }

      const errors: string[] = [];

      // 驗證必填欄位
      const requiredFields = schema.required || [];
      for (const field of requiredFields) {
        if (!formData[field]) {
          errors.push(`${this.getFieldTitle(schema, field)}為必填欄位`);
        }
      }

      // 驗證欄位格式
      for (const [field, property] of Object.entries(schema.properties || {})) {
        const value = formData[field];
        if (value !== undefined && value !== null) {
          const fieldErrors = this.validateField(value, property, field);
          errors.push(...fieldErrors);
        }
      }

      // 自定義驗證
      const customErrors = await this.runCustomValidations(formData, schema);
      errors.push(...customErrors);

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors
      };

      // 快取驗證結果
      this.validationCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('表單驗證失敗:', error);
      return {
        isValid: false,
        errors: ['表單驗證過程中發生錯誤']
      };
    }
  }

  async saveFormData(formId: string, data: any): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        throw new Error('用戶未登入');
      }

      // 準備儲存資料
      const saveData = {
        ...data,
        userId: user.uid,
        formId,
        savedAt: new Date(),
        version: this.generateVersion()
      };

      // 儲存到 Firestore
      await setDoc(doc(this.firestore, 'formData', `${formId}_${user.uid}`), saveData);

      // 更新本地快取
      const cache = this.formCache.get(formId);
      if (cache) {
        cache.data = data;
        cache.lastSaved = new Date();
      }

      // 清除驗證快取
      this.clearValidationCache();

      console.log('表單資料儲存成功');
    } catch (error) {
      console.error('儲存表單資料失敗:', error);
      throw error;
    }
  }

  async loadFormData(formId: string): Promise<any> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        throw new Error('用戶未登入');
      }

      // 檢查本地快取
      const cache = this.formCache.get(formId);
      if (cache && cache.data) {
        return cache.data;
      }

      // 從 Firestore 載入
      const docRef = doc(this.firestore, 'formData', `${formId}_${user.uid}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data;
      }

      return null;
    } catch (error) {
      console.error('載入表單資料失敗:', error);
      return null;
    }
  }

  async getFormTemplate(templateId: string): Promise<FormTemplate> {
    try {
      const docRef = doc(this.firestore, 'formTemplates', templateId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as FormTemplate;
      }

      throw new Error('表單模板不存在');
    } catch (error) {
      console.error('獲取表單模板失敗:', error);
      throw error;
    }
  }

  private setupFormEventListeners(form: SFComponent): void {
    // 監聽表單變更
    form.onChange.subscribe((data) => {
      this.handleFormChange(form, data);
    });

    // 監聽表單提交
    form.onSubmit.subscribe((data) => {
      this.handleFormSubmit(form, data);
    });

    // 監聽表單重置
    form.onReset.subscribe(() => {
      this.handleFormReset(form);
    });
  }

  private handleFormChange(form: SFComponent, data: any): void {
    // 處理表單變更
    console.log('表單變更:', data);
    
    // 觸發自定義變更事件
    this.notificationService.info('表單已修改');
  }

  private handleFormSubmit(form: SFComponent, data: any): void {
    // 處理表單提交
    console.log('表單提交:', data);
  }

  private handleFormReset(form: SFComponent): void {
    // 處理表單重置
    console.log('表單重置');
  }

  private validateField(value: any, property: SFProperty, fieldName: string): string[] {
    const errors: string[] = [];

    // 類型驗證
    if (property.type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`${fieldName}必須是字串類型`);
      } else {
        if (property.minLength && value.length < property.minLength) {
          errors.push(`${fieldName}長度不能少於${property.minLength}個字元`);
        }
        if (property.maxLength && value.length > property.maxLength) {
          errors.push(`${fieldName}長度不能超過${property.maxLength}個字元`);
        }
        if (property.pattern && !new RegExp(property.pattern).test(value)) {
          errors.push(`${fieldName}格式不正確`);
        }
      }
    } else if (property.type === 'number') {
      if (typeof value !== 'number') {
        errors.push(`${fieldName}必須是數字類型`);
      } else {
        if (property.minimum !== undefined && value < property.minimum) {
          errors.push(`${fieldName}不能小於${property.minimum}`);
        }
        if (property.maximum !== undefined && value > property.maximum) {
          errors.push(`${fieldName}不能大於${property.maximum}`);
        }
      }
    }

    // 枚舉驗證
    if (property.enum && !property.enum.includes(value)) {
      errors.push(`${fieldName}值不在允許的範圍內`);
    }

    return errors;
  }

  private async runCustomValidations(data: any, schema: SFSchema): Promise<string[]> {
    const errors: string[] = [];

    // 自定義驗證邏輯
    // 例如：檢查專案名稱唯一性
    if (data.name) {
      const isUnique = await this.checkFieldUnique('name', data.name);
      if (!isUnique) {
        errors.push('專案名稱已存在');
      }
    }

    return errors;
  }

  private async checkFieldUnique(field: string, value: any): Promise<boolean> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(this.firestore, 'formData'),
          where(field, '==', value)
        )
      );
      return querySnapshot.empty;
    } catch (error) {
      console.error('檢查欄位唯一性失敗:', error);
      return true; // 發生錯誤時假設唯一
    }
  }

  private getFieldTitle(schema: SFSchema, field: string): string {
    const property = schema.properties?.[field];
    return property?.title || field;
  }

  private generateFormId(schema: SFSchema): string {
    return btoa(JSON.stringify(schema)).substring(0, 16);
  }

  private generateValidationCacheKey(data: any, schema: SFSchema): string {
    return btoa(JSON.stringify({ data, schema })).substring(0, 16);
  }

  private generateVersion(): string {
    return Date.now().toString();
  }

  private clearValidationCache(): void {
    this.validationCache.clear();
  }
}
```

## 測試範例

### 單元測試

```typescript
describe('DelonFormService', () => {
  let service: DelonFormService;
  let mockSfService: jasmine.SpyObj<SFService>;
  let mockFirestore: jasmine.SpyObj<Firestore>;

  beforeEach(() => {
    mockSfService = jasmine.createSpyObj('SFService', ['createForm']);
    mockFirestore = jasmine.createSpyObj('Firestore', ['collection']);

    service = new DelonFormService(
      mockSfService,
      mockFirestore,
      jasmine.createSpyObj('AuthService', ['getCurrentUser']),
      jasmine.createSpyObj('NotificationService', ['info'])
    );
  });

  it('應該成功建立表單', () => {
    const schema: SFSchema = {
      properties: {
        name: { type: 'string', title: '名稱' }
      }
    };
    const ui: SFUISchema = {};
    const mockForm = jasmine.createSpyObj('SFComponent', ['onChange', 'onSubmit', 'onReset']);

    mockSfService.createForm.and.returnValue(mockForm);

    const result = service.createForm(schema, ui);

    expect(result).toBe(mockForm);
    expect(mockSfService.createForm).toHaveBeenCalledWith(schema, ui, undefined);
  });

  it('應該正確驗證表單', async () => {
    const mockForm = {
      value: { name: 'test' },
      schema: {
        properties: {
          name: { type: 'string', title: '名稱' }
        },
        required: ['name']
      }
    };

    const result = await service.validateForm(mockForm as any);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('應該正確處理驗證錯誤', async () => {
    const mockForm = {
      value: {},
      schema: {
        properties: {
          name: { type: 'string', title: '名稱' }
        },
        required: ['name']
      }
    };

    const result = await service.validateForm(mockForm as any);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('名稱為必填欄位');
  });

  it('應該成功儲存表單資料', async () => {
    const mockUser = { uid: 'test-user' };
    spyOn(service['authService'], 'getCurrentUser').and.returnValue(Promise.resolve(mockUser));
    spyOn(service['firestore'], 'setDoc').and.returnValue(Promise.resolve());

    await service.saveFormData('test-form', { name: 'test' });

    expect(service['firestore'].setDoc).toHaveBeenCalled();
  });
});
```

## 效能考量

### 1. 快取策略
- **表單快取**: 快取表單組件和資料
- **驗證快取**: 快取驗證結果
- **模板快取**: 快取表單模板
- **快取失效**: 實施快取失效機制

### 2. 驗證優化
- **延遲驗證**: 延遲非關鍵驗證
- **批次驗證**: 批次處理多個驗證
- **預計算**: 預計算常用驗證
- **快取驗證**: 快取驗證結果

### 3. 記憶體管理
- **物件重用**: 重用表單物件
- **記憶體監控**: 監控記憶體使用
- **垃圾回收**: 及時清理過期快取
- **資源限制**: 限制快取大小

## 最佳實踐

### 1. 表單設計
- 使用清晰的欄位標籤
- 提供適當的預設值
- 實施合理的驗證規則
- 提供有用的錯誤訊息

### 2. 效能優化
- 使用適當的快取策略
- 優化表單渲染
- 實施延遲載入
- 使用虛擬滾動

### 3. 用戶體驗
- 提供即時驗證回饋
- 實施自動儲存
- 支援表單狀態恢復
- 提供表單進度指示

## 整合說明

### 與 @delon 整合
- 使用 @delon/form 核心功能
- 整合 @delon/theme 主題設定
- 使用 @delon/util 工具函數
- 整合 @delon/acl 權限控制

### 與 ng-zorro-antd 整合
- 使用 nz-form 表單組件
- 整合 nz-input 輸入組件
- 使用 nz-select 選擇組件
- 整合 nz-date-picker 日期選擇器

### 與 Firebase 整合
- 使用 Firestore 儲存表單資料
- 整合 Firebase Auth 認證
- 使用 Firebase Functions 處理
- 整合 Firebase Storage 檔案上傳
