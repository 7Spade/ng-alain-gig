# CostBreakdownValueObject (成本分解值物件)

## 概述
CostBreakdownValueObject 是成本控制領域的值物件，代表專案成本的詳細分解，包括人力成本、材料成本、設備成本等。使用 DDD (Domain-Driven Design) 模式設計，確保成本資料的一致性和不可變性。

## 值物件定義

### 1. 基本結構
```typescript
import { ValueObject } from '@domain/base';

export class CostBreakdownValueObject extends ValueObject {
  private readonly _laborCost: LaborCost;
  private readonly _materialCost: MaterialCost;
  private readonly _equipmentCost: EquipmentCost;
  private readonly _overheadCost: OverheadCost;
  private readonly _totalCost: number;
  private readonly _currency: string;
  private readonly _breakdownDate: Date;

  constructor(
    laborCost: LaborCost,
    materialCost: MaterialCost,
    equipmentCost: EquipmentCost,
    overheadCost: OverheadCost,
    currency: string = 'TWD',
    breakdownDate: Date = new Date()
  ) {
    super();
    this.validateCostBreakdown(laborCost, materialCost, equipmentCost, overheadCost, currency);
    this._laborCost = laborCost;
    this._materialCost = materialCost;
    this._equipmentCost = equipmentCost;
    this._overheadCost = overheadCost;
    this._currency = currency;
    this._breakdownDate = breakdownDate;
    this._totalCost = this.calculateTotalCost();
  }

  /**
   * 驗證成本分解
   */
  private validateCostBreakdown(
    laborCost: LaborCost,
    materialCost: MaterialCost,
    equipmentCost: EquipmentCost,
    overheadCost: OverheadCost,
    currency: string
  ): void {
    if (!laborCost || !materialCost || !equipmentCost || !overheadCost) {
      throw new DomainError('所有成本項目都必須提供');
    }
    
    if (!currency || currency.trim().length === 0) {
      throw new DomainError('貨幣代碼不能為空');
    }
    
    const validCurrencies = ['TWD', 'USD', 'EUR', 'JPY', 'CNY'];
    if (!validCurrencies.includes(currency.toUpperCase())) {
      throw new DomainError(`不支援的貨幣: ${currency}`);
    }
  }

  /**
   * 計算總成本
   */
  private calculateTotalCost(): number {
    return this._laborCost.totalAmount +
           this._materialCost.totalAmount +
           this._equipmentCost.totalAmount +
           this._overheadCost.totalAmount;
  }

  /**
   * 取得人力成本
   */
  get laborCost(): LaborCost {
    return this._laborCost;
  }

  /**
   * 取得材料成本
   */
  get materialCost(): MaterialCost {
    return this._materialCost;
  }

  /**
   * 取得設備成本
   */
  get equipmentCost(): EquipmentCost {
    return this._equipmentCost;
  }

  /**
   * 取得間接成本
   */
  get overheadCost(): OverheadCost {
    return this._overheadCost;
  }

  /**
   * 取得總成本
   */
  get totalCost(): number {
    return this._totalCost;
  }

  /**
   * 取得貨幣
   */
  get currency(): string {
    return this._currency;
  }

  /**
   * 取得分解日期
   */
  get breakdownDate(): Date {
    return this._breakdownDate;
  }
}
```

### 2. 人力成本值物件
```typescript
export class LaborCost extends ValueObject {
  private readonly _items: LaborCostItem[];
  private readonly _totalAmount: number;

  constructor(items: LaborCostItem[]) {
    super();
    this.validateLaborCostItems(items);
    this._items = [...items];
    this._totalAmount = this.calculateTotalAmount();
  }

  /**
   * 驗證人力成本項目
   */
  private validateLaborCostItems(items: LaborCostItem[]): void {
    if (!items || items.length === 0) {
      throw new DomainError('人力成本項目不能為空');
    }
    
    items.forEach(item => {
      if (item.hours < 0) {
        throw new DomainError('工時不能為負數');
      }
      
      if (item.hourlyRate < 0) {
        throw new DomainError('時薪不能為負數');
      }
    });
  }

  /**
   * 計算總金額
   */
  private calculateTotalAmount(): number {
    return this._items.reduce((total, item) => total + item.totalAmount, 0);
  }

  /**
   * 取得人力成本項目
   */
  get items(): LaborCostItem[] {
    return [...this._items];
  }

  /**
   * 取得總金額
   */
  get totalAmount(): number {
    return this._totalAmount;
  }

  /**
   * 取得總工時
   */
  get totalHours(): number {
    return this._items.reduce((total, item) => total + item.hours, 0);
  }

  /**
   * 取得平均時薪
   */
  get averageHourlyRate(): number {
    if (this.totalHours === 0) return 0;
    return this.totalAmount / this.totalHours;
  }

  /**
   * 根據角色取得成本
   * @param role 角色
   */
  getCostByRole(role: string): number {
    return this._items
      .filter(item => item.role === role)
      .reduce((total, item) => total + item.totalAmount, 0);
  }

  /**
   * 比較人力成本
   */
  equals(other: LaborCost): boolean {
    if (this._items.length !== other._items.length) return false;
    
    return this._items.every((item, index) => 
      item.equals(other._items[index])
    );
  }
}

export class LaborCostItem extends ValueObject {
  private readonly _role: string;
  private readonly _description: string;
  private readonly _hours: number;
  private readonly _hourlyRate: number;
  private readonly _totalAmount: number;

  constructor(
    role: string,
    description: string,
    hours: number,
    hourlyRate: number
  ) {
    super();
    this.validateLaborCostItem(role, description, hours, hourlyRate);
    this._role = role;
    this._description = description;
    this._hours = hours;
    this._hourlyRate = hourlyRate;
    this._totalAmount = hours * hourlyRate;
  }

  /**
   * 驗證人力成本項目
   */
  private validateLaborCostItem(
    role: string,
    description: string,
    hours: number,
    hourlyRate: number
  ): void {
    if (!role || role.trim().length === 0) {
      throw new DomainError('角色不能為空');
    }
    
    if (!description || description.trim().length === 0) {
      throw new DomainError('描述不能為空');
    }
    
    if (hours < 0) {
      throw new DomainError('工時不能為負數');
    }
    
    if (hourlyRate < 0) {
      throw new DomainError('時薪不能為負數');
    }
  }

  /**
   * 取得角色
   */
  get role(): string {
    return this._role;
  }

  /**
   * 取得描述
   */
  get description(): string {
    return this._description;
  }

  /**
   * 取得工時
   */
  get hours(): number {
    return this._hours;
  }

  /**
   * 取得時薪
   */
  get hourlyRate(): number {
    return this._hourlyRate;
  }

  /**
   * 取得總金額
   */
  get totalAmount(): number {
    return this._totalAmount;
  }

  /**
   * 比較人力成本項目
   */
  equals(other: LaborCostItem): boolean {
    return this._role === other._role &&
           this._description === other._description &&
           this._hours === other._hours &&
           this._hourlyRate === other._hourlyRate;
  }
}
```

### 3. 材料成本值物件
```typescript
export class MaterialCost extends ValueObject {
  private readonly _items: MaterialCostItem[];
  private readonly _totalAmount: number;

  constructor(items: MaterialCostItem[]) {
    super();
    this.validateMaterialCostItems(items);
    this._items = [...items];
    this._totalAmount = this.calculateTotalAmount();
  }

  /**
   * 驗證材料成本項目
   */
  private validateMaterialCostItems(items: MaterialCostItem[]): void {
    if (!items || items.length === 0) {
      throw new DomainError('材料成本項目不能為空');
    }
    
    items.forEach(item => {
      if (item.quantity < 0) {
        throw new DomainError('數量不能為負數');
      }
      
      if (item.unitPrice < 0) {
        throw new DomainError('單價不能為負數');
      }
    });
  }

  /**
   * 計算總金額
   */
  private calculateTotalAmount(): number {
    return this._items.reduce((total, item) => total + item.totalAmount, 0);
  }

  /**
   * 取得材料成本項目
   */
  get items(): MaterialCostItem[] {
    return [...this._items];
  }

  /**
   * 取得總金額
   */
  get totalAmount(): number {
    return this._totalAmount;
  }

  /**
   * 取得總數量
   */
  get totalQuantity(): number {
    return this._items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * 根據類別取得成本
   * @param category 材料類別
   */
  getCostByCategory(category: string): number {
    return this._items
      .filter(item => item.category === category)
      .reduce((total, item) => total + item.totalAmount, 0);
  }

  /**
   * 比較材料成本
   */
  equals(other: MaterialCost): boolean {
    if (this._items.length !== other._items.length) return false;
    
    return this._items.every((item, index) => 
      item.equals(other._items[index])
    );
  }
}

export class MaterialCostItem extends ValueObject {
  private readonly _name: string;
  private readonly _category: string;
  private readonly _specification: string;
  private readonly _quantity: number;
  private readonly _unit: string;
  private readonly _unitPrice: number;
  private readonly _totalAmount: number;

  constructor(
    name: string,
    category: string,
    specification: string,
    quantity: number,
    unit: string,
    unitPrice: number
  ) {
    super();
    this.validateMaterialCostItem(name, category, specification, quantity, unit, unitPrice);
    this._name = name;
    this._category = category;
    this._specification = specification;
    this._quantity = quantity;
    this._unit = unit;
    this._unitPrice = unitPrice;
    this._totalAmount = quantity * unitPrice;
  }

  /**
   * 驗證材料成本項目
   */
  private validateMaterialCostItem(
    name: string,
    category: string,
    specification: string,
    quantity: number,
    unit: string,
    unitPrice: number
  ): void {
    if (!name || name.trim().length === 0) {
      throw new DomainError('材料名稱不能為空');
    }
    
    if (!category || category.trim().length === 0) {
      throw new DomainError('材料類別不能為空');
    }
    
    if (!specification || specification.trim().length === 0) {
      throw new DomainError('材料規格不能為空');
    }
    
    if (quantity < 0) {
      throw new DomainError('數量不能為負數');
    }
    
    if (!unit || unit.trim().length === 0) {
      throw new DomainError('單位不能為空');
    }
    
    if (unitPrice < 0) {
      throw new DomainError('單價不能為負數');
    }
  }

  /**
   * 取得材料名稱
   */
  get name(): string {
    return this._name;
  }

  /**
   * 取得材料類別
   */
  get category(): string {
    return this._category;
  }

  /**
   * 取得材料規格
   */
  get specification(): string {
    return this._specification;
  }

  /**
   * 取得數量
   */
  get quantity(): number {
    return this._quantity;
  }

  /**
   * 取得單位
   */
  get unit(): string {
    return this._unit;
  }

  /**
   * 取得單價
   */
  get unitPrice(): number {
    return this._unitPrice;
  }

  /**
   * 取得總金額
   */
  get totalAmount(): number {
    return this._totalAmount;
  }

  /**
   * 比較材料成本項目
   */
  equals(other: MaterialCostItem): boolean {
    return this._name === other._name &&
           this._category === other._category &&
           this._specification === other._specification &&
           this._quantity === other._quantity &&
           this._unit === other._unit &&
           this._unitPrice === other._unitPrice;
  }
}
```

### 4. 設備成本值物件
```typescript
export class EquipmentCost extends ValueObject {
  private readonly _items: EquipmentCostItem[];
  private readonly _totalAmount: number;

  constructor(items: EquipmentCostItem[]) {
    super();
    this.validateEquipmentCostItems(items);
    this._items = [...items];
    this._totalAmount = this.calculateTotalAmount();
  }

  /**
   * 驗證設備成本項目
   */
  private validateEquipmentCostItems(items: EquipmentCostItem[]): void {
    if (!items || items.length === 0) {
      throw new DomainError('設備成本項目不能為空');
    }
    
    items.forEach(item => {
      if (item.hours < 0) {
        throw new DomainError('使用時數不能為負數');
      }
      
      if (item.hourlyRate < 0) {
        throw new DomainError('時租費率不能為負數');
      }
    });
  }

  /**
   * 計算總金額
   */
  private calculateTotalAmount(): number {
    return this._items.reduce((total, item) => total + item.totalAmount, 0);
  }

  /**
   * 取得設備成本項目
   */
  get items(): EquipmentCostItem[] {
    return [...this._items];
  }

  /**
   * 取得總金額
   */
  get totalAmount(): number {
    return this._totalAmount;
  }

  /**
   * 取得總使用時數
   */
  get totalHours(): number {
    return this._items.reduce((total, item) => total + item.hours, 0);
  }

  /**
   * 根據類型取得成本
   * @param type 設備類型
   */
  getCostByType(type: string): number {
    return this._items
      .filter(item => item.type === type)
      .reduce((total, item) => total + item.totalAmount, 0);
  }

  /**
   * 比較設備成本
   */
  equals(other: EquipmentCost): boolean {
    if (this._items.length !== other._items.length) return false;
    
    return this._items.every((item, index) => 
      item.equals(other._items[index])
    );
  }
}

export class EquipmentCostItem extends ValueObject {
  private readonly _name: string;
  private readonly _type: string;
  private readonly _model: string;
  private readonly _hours: number;
  private readonly _hourlyRate: number;
  private readonly _totalAmount: number;

  constructor(
    name: string,
    type: string,
    model: string,
    hours: number,
    hourlyRate: number
  ) {
    super();
    this.validateEquipmentCostItem(name, type, model, hours, hourlyRate);
    this._name = name;
    this._type = type;
    this._model = model;
    this._hours = hours;
    this._hourlyRate = hourlyRate;
    this._totalAmount = hours * hourlyRate;
  }

  /**
   * 驗證設備成本項目
   */
  private validateEquipmentCostItem(
    name: string,
    type: string,
    model: string,
    hours: number,
    hourlyRate: number
  ): void {
    if (!name || name.trim().length === 0) {
      throw new DomainError('設備名稱不能為空');
    }
    
    if (!type || type.trim().length === 0) {
      throw new DomainError('設備類型不能為空');
    }
    
    if (!model || model.trim().length === 0) {
      throw new DomainError('設備型號不能為空');
    }
    
    if (hours < 0) {
      throw new DomainError('使用時數不能為負數');
    }
    
    if (hourlyRate < 0) {
      throw new DomainError('時租費率不能為負數');
    }
  }

  /**
   * 取得設備名稱
   */
  get name(): string {
    return this._name;
  }

  /**
   * 取得設備類型
   */
  get type(): string {
    return this._type;
  }

  /**
   * 取得設備型號
   */
  get model(): string {
    return this._model;
  }

  /**
   * 取得使用時數
   */
  get hours(): number {
    return this._hours;
  }

  /**
   * 取得時租費率
   */
  get hourlyRate(): number {
    return this._hourlyRate;
  }

  /**
   * 取得總金額
   */
  get totalAmount(): number {
    return this._totalAmount;
  }

  /**
   * 比較設備成本項目
   */
  equals(other: EquipmentCostItem): boolean {
    return this._name === other._name &&
           this._type === other._type &&
           this._model === other._model &&
           this._hours === other._hours &&
           this._hourlyRate === other._hourlyRate;
  }
}
```

### 5. 間接成本值物件
```typescript
export class OverheadCost extends ValueObject {
  private readonly _items: OverheadCostItem[];
  private readonly _totalAmount: number;

  constructor(items: OverheadCostItem[]) {
    super();
    this.validateOverheadCostItems(items);
    this._items = [...items];
    this._totalAmount = this.calculateTotalAmount();
  }

  /**
   * 驗證間接成本項目
   */
  private validateOverheadCostItems(items: OverheadCostItem[]): void {
    if (!items || items.length === 0) {
      throw new DomainError('間接成本項目不能為空');
    }
    
    items.forEach(item => {
      if (item.amount < 0) {
        throw new DomainError('金額不能為負數');
      }
    });
  }

  /**
   * 計算總金額
   */
  private calculateTotalAmount(): number {
    return this._items.reduce((total, item) => total + item.amount, 0);
  }

  /**
   * 取得間接成本項目
   */
  get items(): OverheadCostItem[] {
    return [...this._items];
  }

  /**
   * 取得總金額
   */
  get totalAmount(): number {
    return this._totalAmount;
  }

  /**
   * 根據類別取得成本
   * @param category 間接成本類別
   */
  getCostByCategory(category: string): number {
    return this._items
      .filter(item => item.category === category)
      .reduce((total, item) => total + item.amount, 0);
  }

  /**
   * 比較間接成本
   */
  equals(other: OverheadCost): boolean {
    if (this._items.length !== other._items.length) return false;
    
    return this._items.every((item, index) => 
      item.equals(other._items[index])
    );
  }
}

export class OverheadCostItem extends ValueObject {
  private readonly _name: string;
  private readonly _category: string;
  private readonly _description: string;
  private readonly _amount: number;

  constructor(
    name: string,
    category: string,
    description: string,
    amount: number
  ) {
    super();
    this.validateOverheadCostItem(name, category, description, amount);
    this._name = name;
    this._category = category;
    this._description = description;
    this._amount = amount;
  }

  /**
   * 驗證間接成本項目
   */
  private validateOverheadCostItem(
    name: string,
    category: string,
    description: string,
    amount: number
  ): void {
    if (!name || name.trim().length === 0) {
      throw new DomainError('間接成本名稱不能為空');
    }
    
    if (!category || category.trim().length === 0) {
      throw new DomainError('間接成本類別不能為空');
    }
    
    if (!description || description.trim().length === 0) {
      throw new DomainError('間接成本描述不能為空');
    }
    
    if (amount < 0) {
      throw new DomainError('金額不能為負數');
    }
  }

  /**
   * 取得間接成本名稱
   */
  get name(): string {
    return this._name;
  }

  /**
   * 取得間接成本類別
   */
  get category(): string {
    return this._category;
  }

  /**
   * 取得間接成本描述
   */
  get description(): string {
    return this._description;
  }

  /**
   * 取得金額
   */
  get amount(): number {
    return this._amount;
  }

  /**
   * 比較間接成本項目
   */
  equals(other: OverheadCostItem): boolean {
    return this._name === other._name &&
           this._category === other._category &&
           this._description === other._description &&
           this._amount === other._amount;
  }
}
```

## 成本分解工廠

### 1. 成本分解工廠
```typescript
export class CostBreakdownFactory {
  /**
   * 建立成本分解
   * @param laborItems 人力成本項目
   * @param materialItems 材料成本項目
   * @param equipmentItems 設備成本項目
   * @param overheadItems 間接成本項目
   * @param currency 貨幣
   */
  static create(
    laborItems: LaborCostItem[],
    materialItems: MaterialCostItem[],
    equipmentItems: EquipmentCostItem[],
    overheadItems: OverheadCostItem[],
    currency: string = 'TWD'
  ): CostBreakdownValueObject {
    const laborCost = new LaborCost(laborItems);
    const materialCost = new MaterialCost(materialItems);
    const equipmentCost = new EquipmentCost(equipmentItems);
    const overheadCost = new OverheadCost(overheadItems);
    
    return new CostBreakdownValueObject(
      laborCost,
      materialCost,
      equipmentCost,
      overheadCost,
      currency
    );
  }

  /**
   * 重建成本分解（用於持久化）
   * @param data 成本分解資料
   */
  static reconstitute(data: CostBreakdownData): CostBreakdownValueObject {
    const laborItems = data.laborItems.map(item => 
      new LaborCostItem(item.role, item.description, item.hours, item.hourlyRate)
    );
    const materialItems = data.materialItems.map(item => 
      new MaterialCostItem(item.name, item.category, item.specification, 
        item.quantity, item.unit, item.unitPrice)
    );
    const equipmentItems = data.equipmentItems.map(item => 
      new EquipmentCostItem(item.name, item.type, item.model, item.hours, item.hourlyRate)
    );
    const overheadItems = data.overheadItems.map(item => 
      new OverheadCostItem(item.name, item.category, item.description, item.amount)
    );
    
    return new CostBreakdownValueObject(
      new LaborCost(laborItems),
      new MaterialCost(materialItems),
      new EquipmentCost(equipmentItems),
      new OverheadCost(overheadItems),
      data.currency,
      new Date(data.breakdownDate)
    );
  }

  /**
   * 建立空的成本分解
   * @param currency 貨幣
   */
  static createEmpty(currency: string = 'TWD'): CostBreakdownValueObject {
    return new CostBreakdownValueObject(
      new LaborCost([]),
      new MaterialCost([]),
      new EquipmentCost([]),
      new OverheadCost([]),
      currency
    );
  }
}
```

## 使用範例

### 1. 建立成本分解
```typescript
// 建立人力成本項目
const laborItems = [
  new LaborCostItem('工程師', '軟體開發', 40, 1000),
  new LaborCostItem('設計師', 'UI/UX 設計', 20, 800)
];

// 建立材料成本項目
const materialItems = [
  new MaterialCostItem('水泥', '建材', 'C30 混凝土', 100, '立方米', 3000),
  new MaterialCostItem('鋼筋', '建材', 'HRB400', 50, '噸', 20000)
];

// 建立設備成本項目
const equipmentItems = [
  new EquipmentCostItem('挖土機', '重型機械', 'CAT 320D', 8, 5000),
  new EquipmentCostItem('起重機', '重型機械', 'Liebherr LTM 1100', 4, 8000)
];

// 建立間接成本項目
const overheadItems = [
  new OverheadCostItem('管理費', '管理', '專案管理費用', 50000),
  new OverheadCostItem('保險費', '保險', '工程保險費用', 30000)
];

// 建立成本分解
const costBreakdown = CostBreakdownFactory.create(
  laborItems,
  materialItems,
  equipmentItems,
  overheadItems,
  'TWD'
);

console.log('總成本:', costBreakdown.totalCost);
console.log('人力成本:', costBreakdown.laborCost.totalAmount);
console.log('材料成本:', costBreakdown.materialCost.totalAmount);
```

### 2. 成本分析
```typescript
// 取得各類別成本比例
const laborRatio = (costBreakdown.laborCost.totalAmount / costBreakdown.totalCost) * 100;
const materialRatio = (costBreakdown.materialCost.totalAmount / costBreakdown.totalCost) * 100;
const equipmentRatio = (costBreakdown.equipmentCost.totalAmount / costBreakdown.totalCost) * 100;
const overheadRatio = (costBreakdown.overheadCost.totalAmount / costBreakdown.totalCost) * 100;

console.log(`人力成本比例: ${laborRatio.toFixed(2)}%`);
console.log(`材料成本比例: ${materialRatio.toFixed(2)}%`);
console.log(`設備成本比例: ${equipmentRatio.toFixed(2)}%`);
console.log(`間接成本比例: ${overheadRatio.toFixed(2)}%`);

// 根據角色分析人力成本
const engineerCost = costBreakdown.laborCost.getCostByRole('工程師');
const designerCost = costBreakdown.laborCost.getCostByRole('設計師');

console.log('工程師成本:', engineerCost);
console.log('設計師成本:', designerCost);
```

### 3. 成本比較
```typescript
// 建立另一個成本分解進行比較
const anotherCostBreakdown = CostBreakdownFactory.create(
  [new LaborCostItem('工程師', '軟體開發', 50, 1200)],
  [new MaterialCostItem('水泥', '建材', 'C30 混凝土', 120, '立方米', 3200)],
  [],
  [],
  'TWD'
);

// 比較總成本
const costDifference = costBreakdown.totalCost - anotherCostBreakdown.totalCost;
console.log('成本差異:', costDifference);

// 比較人力成本
const laborDifference = costBreakdown.laborCost.totalAmount - anotherCostBreakdown.laborCost.totalAmount;
console.log('人力成本差異:', laborDifference);
```

## 相關資源
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Value Object Pattern](https://martinfowler.com/bliki/ValueObject.html)
- [Cost Breakdown Structure](https://en.wikipedia.org/wiki/Cost_breakdown_structure)