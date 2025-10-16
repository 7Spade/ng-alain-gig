# TaskEntity (任務聚合根)

## 概述
TaskEntity 是任務領域的聚合根，代表專案中的工項、問題追蹤、里程碑等任務實體。使用 DDD (Domain-Driven Design) 模式設計，包含任務的基本資訊、狀態管理、指派關係、時間追蹤等核心業務邏輯。

## 實體定義

### 1. 基本結構
```typescript
import { Entity, ValueObject } from '@domain/base';
import { TaskId } from '@domain/value-objects/task-id.value-object';
import { TaskTitle } from '@domain/value-objects/task-title.value-object';
import { TaskDescription } from '@domain/value-objects/task-description.value-object';
import { TaskPriority } from '@domain/value-objects/task-priority.value-object';
import { TaskStatus } from '@domain/value-objects/task-status.value-object';
import { UserId } from '@domain/value-objects/user-id.value-object';
import { ProjectId } from '@domain/value-objects/project-id.value-object';

export class TaskEntity extends Entity<TaskId> {
  private _title: TaskTitle;
  private _description: TaskDescription;
  private _priority: TaskPriority;
  private _status: TaskStatus;
  private _assigneeId: UserId | null;
  private _reporterId: UserId;
  private _projectId: ProjectId;
  private _parentTaskId: TaskId | null;
  private _subtasks: TaskId[];
  private _tags: string[];
  private _dueDate: Date | null;
  private _estimatedHours: number | null;
  private _actualHours: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _completedAt: Date | null;

  constructor(
    id: TaskId,
    title: TaskTitle,
    description: TaskDescription,
    priority: TaskPriority,
    reporterId: UserId,
    projectId: ProjectId,
    parentTaskId: TaskId | null = null
  ) {
    super(id);
    this._title = title;
    this._description = description;
    this._priority = priority;
    this._status = TaskStatus.TODO;
    this._assigneeId = null;
    this._reporterId = reporterId;
    this._projectId = projectId;
    this._parentTaskId = parentTaskId;
    this._subtasks = [];
    this._tags = [];
    this._dueDate = null;
    this._estimatedHours = null;
    this._actualHours = 0;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._completedAt = null;
  }
}
```

### 2. 任務狀態列舉
```typescript
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked'
}
```

### 3. 任務優先級列舉
```typescript
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}
```

## 核心業務方法

### 1. 任務資訊管理
```typescript
export class TaskEntity extends Entity<TaskId> {
  /**
   * 更新任務標題
   * @param title 新標題
   */
  updateTitle(title: TaskTitle): void {
    this.validateTitleUpdate(title);
    this._title = title;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskTitleUpdatedEvent(this.id, title));
  }

  /**
   * 更新任務描述
   * @param description 新描述
   */
  updateDescription(description: TaskDescription): void {
    this._description = description;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskDescriptionUpdatedEvent(this.id, description));
  }

  /**
   * 更新任務優先級
   * @param priority 新優先級
   */
  updatePriority(priority: TaskPriority): void {
    this._priority = priority;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskPriorityUpdatedEvent(this.id, priority));
  }

  /**
   * 設定截止日期
   * @param dueDate 截止日期
   */
  setDueDate(dueDate: Date | null): void {
    this.validateDueDate(dueDate);
    this._dueDate = dueDate;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskDueDateUpdatedEvent(this.id, dueDate));
  }

  /**
   * 設定預估工時
   * @param hours 預估工時
   */
  setEstimatedHours(hours: number | null): void {
    this.validateEstimatedHours(hours);
    this._estimatedHours = hours;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskEstimatedHoursUpdatedEvent(this.id, hours));
  }

  /**
   * 驗證標題更新
   * @param title 標題
   */
  private validateTitleUpdate(title: TaskTitle): void {
    if (this._status === TaskStatus.COMPLETED) {
      throw new DomainError('已完成任務無法修改標題');
    }
  }

  /**
   * 驗證截止日期
   * @param dueDate 截止日期
   */
  private validateDueDate(dueDate: Date | null): void {
    if (dueDate && dueDate < new Date()) {
      throw new DomainError('截止日期不能早於今天');
    }
  }

  /**
   * 驗證預估工時
   * @param hours 工時
   */
  private validateEstimatedHours(hours: number | null): void {
    if (hours !== null && hours <= 0) {
      throw new DomainError('預估工時必須大於 0');
    }
  }

  /**
   * 取得任務標題
   */
  get title(): TaskTitle {
    return this._title;
  }

  /**
   * 取得任務描述
   */
  get description(): TaskDescription {
    return this._description;
  }

  /**
   * 取得任務優先級
   */
  get priority(): TaskPriority {
    return this._priority;
  }

  /**
   * 取得截止日期
   */
  get dueDate(): Date | null {
    return this._dueDate;
  }

  /**
   * 取得預估工時
   */
  get estimatedHours(): number | null {
    return this._estimatedHours;
  }
}
```

### 2. 狀態管理
```typescript
export class TaskEntity extends Entity<TaskId> {
  /**
   * 開始任務
   * @param assigneeId 指派者 ID
   */
  start(assigneeId: UserId): void {
    this.validateStatusTransition(TaskStatus.IN_PROGRESS);
    this.validateAssignee(assigneeId);
    
    this._status = TaskStatus.IN_PROGRESS;
    this._assigneeId = assigneeId;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskStartedEvent(this.id, assigneeId));
  }

  /**
   * 完成任務
   * @param completedBy 完成者 ID
   */
  complete(completedBy: UserId): void {
    this.validateStatusTransition(TaskStatus.COMPLETED);
    this.validateCompletion(completedBy);
    
    this._status = TaskStatus.COMPLETED;
    this._completedAt = new Date();
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskCompletedEvent(this.id, completedBy));
  }

  /**
   * 取消任務
   * @param cancelledBy 取消者 ID
   * @param reason 取消原因
   */
  cancel(cancelledBy: UserId, reason: string): void {
    this.validateStatusTransition(TaskStatus.CANCELLED);
    this.validateCancellation(cancelledBy);
    
    this._status = TaskStatus.CANCELLED;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskCancelledEvent(this.id, cancelledBy, reason));
  }

  /**
   * 阻塞任務
   * @param blockedBy 阻塞者 ID
   * @param reason 阻塞原因
   */
  block(blockedBy: UserId, reason: string): void {
    this.validateStatusTransition(TaskStatus.BLOCKED);
    
    this._status = TaskStatus.BLOCKED;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskBlockedEvent(this.id, blockedBy, reason));
  }

  /**
   * 解除阻塞
   * @param unblockedBy 解除阻塞者 ID
   */
  unblock(unblockedBy: UserId): void {
    if (this._status !== TaskStatus.BLOCKED) {
      throw new DomainError('任務未被阻塞');
    }
    
    this._status = TaskStatus.TODO;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskUnblockedEvent(this.id, unblockedBy));
  }

  /**
   * 驗證狀態轉換
   * @param newStatus 新狀態
   */
  private validateStatusTransition(newStatus: TaskStatus): void {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED, TaskStatus.BLOCKED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.IN_REVIEW, TaskStatus.BLOCKED, TaskStatus.CANCELLED],
      [TaskStatus.IN_REVIEW]: [TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELLED]: [],
      [TaskStatus.BLOCKED]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
    };
    
    if (!validTransitions[this._status].includes(newStatus)) {
      throw new DomainError(`無法從 ${this._status} 轉換到 ${newStatus}`);
    }
  }

  /**
   * 驗證指派者
   * @param assigneeId 指派者 ID
   */
  private validateAssignee(assigneeId: UserId): void {
    // 這裡可以加入更多驗證邏輯
    // 例如檢查使用者是否有權限處理此任務
  }

  /**
   * 驗證完成
   * @param completedBy 完成者 ID
   */
  private validateCompletion(completedBy: UserId): void {
    if (this._assigneeId && !this._assigneeId.equals(completedBy)) {
      throw new DomainError('只有指派者可以完成任務');
    }
    
    // 檢查是否有未完成的子任務
    if (this._subtasks.length > 0) {
      // 這裡應該檢查子任務狀態
      // 暫時跳過
    }
  }

  /**
   * 驗證取消
   * @param cancelledBy 取消者 ID
   */
  private validateCancellation(cancelledBy: UserId): void {
    if (this._status === TaskStatus.COMPLETED) {
      throw new DomainError('已完成任務無法取消');
    }
  }

  /**
   * 取得任務狀態
   */
  get status(): TaskStatus {
    return this._status;
  }

  /**
   * 取得指派者 ID
   */
  get assigneeId(): UserId | null {
    return this._assigneeId;
  }

  /**
   * 取得回報者 ID
   */
  get reporterId(): UserId {
    return this._reporterId;
  }

  /**
   * 取得完成時間
   */
  get completedAt(): Date | null {
    return this._completedAt;
  }
}
```

### 3. 指派管理
```typescript
export class TaskEntity extends Entity<TaskId> {
  /**
   * 指派任務
   * @param assigneeId 指派者 ID
   * @param assignedBy 指派操作者 ID
   */
  assign(assigneeId: UserId, assignedBy: UserId): void {
    this.validateAssignment(assigneeId, assignedBy);
    
    const previousAssignee = this._assigneeId;
    this._assigneeId = assigneeId;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new TaskAssignedEvent(
      this.id, 
      assigneeId, 
      assignedBy, 
      previousAssignee
    ));
  }

  /**
   * 取消指派
   * @param unassignedBy 取消指派操作者 ID
   */
  unassign(unassignedBy: UserId): void {
    if (!this._assigneeId) {
      throw new DomainError('任務未被指派');
    }
    
    const previousAssignee = this._assigneeId;
    this._assigneeId = null;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new TaskUnassignedEvent(
      this.id, 
      previousAssignee, 
      unassignedBy
    ));
  }

  /**
   * 重新指派
   * @param newAssigneeId 新指派者 ID
   * @param reassignedBy 重新指派操作者 ID
   */
  reassign(newAssigneeId: UserId, reassignedBy: UserId): void {
    this.validateAssignment(newAssigneeId, reassignedBy);
    
    const previousAssignee = this._assigneeId;
    this._assigneeId = newAssigneeId;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new TaskReassignedEvent(
      this.id, 
      newAssigneeId, 
      reassignedBy, 
      previousAssignee
    ));
  }

  /**
   * 驗證指派
   * @param assigneeId 指派者 ID
   * @param assignedBy 指派操作者 ID
   */
  private validateAssignment(assigneeId: UserId, assignedBy: UserId): void {
    if (this._status === TaskStatus.COMPLETED) {
      throw new DomainError('已完成任務無法指派');
    }
    
    if (this._status === TaskStatus.CANCELLED) {
      throw new DomainError('已取消任務無法指派');
    }
    
    // 檢查指派者是否與回報者相同
    if (assigneeId.equals(this._reporterId)) {
      throw new DomainError('無法指派給回報者');
    }
  }

  /**
   * 檢查是否已指派
   */
  isAssigned(): boolean {
    return this._assigneeId !== null;
  }

  /**
   * 檢查是否指派給指定使用者
   * @param userId 使用者 ID
   */
  isAssignedTo(userId: UserId): boolean {
    return this._assigneeId?.equals(userId) || false;
  }
}
```

### 4. 子任務管理
```typescript
export class TaskEntity extends Entity<TaskId> {
  /**
   * 新增子任務
   * @param subtaskId 子任務 ID
   */
  addSubtask(subtaskId: TaskId): void {
    this.validateSubtaskAddition(subtaskId);
    
    if (this._subtasks.some(id => id.equals(subtaskId))) {
      throw new DomainError('子任務已存在');
    }
    
    this._subtasks.push(subtaskId);
    this._updatedAt = new Date();
    this.addDomainEvent(new SubtaskAddedEvent(this.id, subtaskId));
  }

  /**
   * 移除子任務
   * @param subtaskId 子任務 ID
   */
  removeSubtask(subtaskId: TaskId): void {
    const index = this._subtasks.findIndex(id => id.equals(subtaskId));
    if (index === -1) {
      throw new DomainError('子任務不存在');
    }
    
    this._subtasks.splice(index, 1);
    this._updatedAt = new Date();
    this.addDomainEvent(new SubtaskRemovedEvent(this.id, subtaskId));
  }

  /**
   * 驗證子任務新增
   * @param subtaskId 子任務 ID
   */
  private validateSubtaskAddition(subtaskId: TaskId): void {
    if (this.id.equals(subtaskId)) {
      throw new DomainError('任務不能成為自己的子任務');
    }
    
    if (this._parentTaskId?.equals(subtaskId)) {
      throw new DomainError('任務不能成為父任務的子任務');
    }
    
    // 檢查是否會造成循環依賴
    if (this.wouldCreateCircularDependency(subtaskId)) {
      throw new DomainError('會造成循環依賴');
    }
  }

  /**
   * 檢查是否會造成循環依賴
   * @param subtaskId 子任務 ID
   */
  private wouldCreateCircularDependency(subtaskId: TaskId): boolean {
    // 這裡應該實作循環依賴檢查邏輯
    // 暫時返回 false
    return false;
  }

  /**
   * 取得所有子任務 ID
   */
  get subtasks(): TaskId[] {
    return [...this._subtasks];
  }

  /**
   * 取得子任務數量
   */
  get subtaskCount(): number {
    return this._subtasks.length;
  }

  /**
   * 檢查是否有子任務
   */
  hasSubtasks(): boolean {
    return this._subtasks.length > 0;
  }

  /**
   * 取得父任務 ID
   */
  get parentTaskId(): TaskId | null {
    return this._parentTaskId;
  }

  /**
   * 檢查是否有父任務
   */
  hasParentTask(): boolean {
    return this._parentTaskId !== null;
  }
}
```

### 5. 時間追蹤
```typescript
export class TaskEntity extends Entity<TaskId> {
  /**
   * 記錄實際工時
   * @param hours 工時
   * @param recordedBy 記錄者 ID
   */
  recordActualHours(hours: number, recordedBy: UserId): void {
    this.validateHoursRecording(hours, recordedBy);
    
    this._actualHours += hours;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskHoursRecordedEvent(this.id, hours, recordedBy));
  }

  /**
   * 更新實際工時
   * @param hours 新工時
   * @param updatedBy 更新者 ID
   */
  updateActualHours(hours: number, updatedBy: UserId): void {
    this.validateHoursUpdate(hours, updatedBy);
    
    this._actualHours = hours;
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskHoursUpdatedEvent(this.id, hours, updatedBy));
  }

  /**
   * 驗證工時記錄
   * @param hours 工時
   * @param recordedBy 記錄者 ID
   */
  private validateHoursRecording(hours: number, recordedBy: UserId): void {
    if (hours <= 0) {
      throw new DomainError('工時必須大於 0');
    }
    
    if (hours > 24) {
      throw new DomainError('單次記錄工時不能超過 24 小時');
    }
    
    if (!this.isAssignedTo(recordedBy) && !recordedBy.equals(this._reporterId)) {
      throw new DomainError('只有指派者或回報者可以記錄工時');
    }
  }

  /**
   * 驗證工時更新
   * @param hours 工時
   * @param updatedBy 更新者 ID
   */
  private validateHoursUpdate(hours: number, updatedBy: UserId): void {
    if (hours < 0) {
      throw new DomainError('工時不能為負數');
    }
    
    if (!this.isAssignedTo(updatedBy) && !updatedBy.equals(this._reporterId)) {
      throw new DomainError('只有指派者或回報者可以更新工時');
    }
  }

  /**
   * 取得實際工時
   */
  get actualHours(): number {
    return this._actualHours;
  }

  /**
   * 取得工時差異
   */
  getHoursVariance(): number | null {
    if (this._estimatedHours === null) {
      return null;
    }
    
    return this._actualHours - this._estimatedHours;
  }

  /**
   * 取得工時效率
   */
  getHoursEfficiency(): number | null {
    if (this._estimatedHours === null || this._estimatedHours === 0) {
      return null;
    }
    
    return (this._estimatedHours / this._actualHours) * 100;
  }
}
```

### 6. 標籤管理
```typescript
export class TaskEntity extends Entity<TaskId> {
  /**
   * 新增標籤
   * @param tag 標籤
   */
  addTag(tag: string): void {
    this.validateTag(tag);
    
    if (this._tags.includes(tag)) {
      throw new DomainError('標籤已存在');
    }
    
    this._tags.push(tag);
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskTagAddedEvent(this.id, tag));
  }

  /**
   * 移除標籤
   * @param tag 標籤
   */
  removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index === -1) {
      throw new DomainError('標籤不存在');
    }
    
    this._tags.splice(index, 1);
    this._updatedAt = new Date();
    this.addDomainEvent(new TaskTagRemovedEvent(this.id, tag));
  }

  /**
   * 驗證標籤
   * @param tag 標籤
   */
  private validateTag(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new DomainError('標籤不能為空');
    }
    
    if (tag.length > 50) {
      throw new DomainError('標籤長度不能超過 50 個字元');
    }
    
    if (this._tags.length >= 10) {
      throw new DomainError('標籤數量不能超過 10 個');
    }
  }

  /**
   * 取得所有標籤
   */
  get tags(): string[] {
    return [...this._tags];
  }

  /**
   * 檢查是否有指定標籤
   * @param tag 標籤
   */
  hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  /**
   * 取得標籤數量
   */
  get tagCount(): number {
    return this._tags.length;
  }
}
```

## 領域事件

### 1. 任務事件
```typescript
export class TaskTitleUpdatedEvent extends DomainEvent {
  constructor(
    public readonly taskId: TaskId,
    public readonly title: TaskTitle
  ) {
    super();
  }
}

export class TaskStartedEvent extends DomainEvent {
  constructor(
    public readonly taskId: TaskId,
    public readonly assigneeId: UserId
  ) {
    super();
  }
}

export class TaskCompletedEvent extends DomainEvent {
  constructor(
    public readonly taskId: TaskId,
    public readonly completedBy: UserId
  ) {
    super();
  }
}

export class TaskAssignedEvent extends DomainEvent {
  constructor(
    public readonly taskId: TaskId,
    public readonly assigneeId: UserId,
    public readonly assignedBy: UserId,
    public readonly previousAssignee: UserId | null
  ) {
    super();
  }
}

export class SubtaskAddedEvent extends DomainEvent {
  constructor(
    public readonly taskId: TaskId,
    public readonly subtaskId: TaskId
  ) {
    super();
  }
}

export class TaskHoursRecordedEvent extends DomainEvent {
  constructor(
    public readonly taskId: TaskId,
    public readonly hours: number,
    public readonly recordedBy: UserId
  ) {
    super();
  }
}
```

## 工廠方法

### 1. 建立任務
```typescript
export class TaskFactory {
  /**
   * 建立新任務
   * @param title 任務標題
   * @param description 任務描述
   * @param priority 優先級
   * @param reporterId 回報者 ID
   * @param projectId 專案 ID
   * @param parentTaskId 父任務 ID（可選）
   */
  static create(
    title: TaskTitle,
    description: TaskDescription,
    priority: TaskPriority,
    reporterId: UserId,
    projectId: ProjectId,
    parentTaskId: TaskId | null = null
  ): TaskEntity {
    const taskId = TaskId.generate();
    return new TaskEntity(
      taskId,
      title,
      description,
      priority,
      reporterId,
      projectId,
      parentTaskId
    );
  }

  /**
   * 重建任務（用於持久化）
   * @param data 任務資料
   */
  static reconstitute(data: TaskData): TaskEntity {
    const taskId = TaskId.fromString(data.id);
    const title = TaskTitle.fromString(data.title);
    const description = TaskDescription.fromString(data.description);
    const priority = data.priority as TaskPriority;
    const reporterId = UserId.fromString(data.reporterId);
    const projectId = ProjectId.fromString(data.projectId);
    const parentTaskId = data.parentTaskId ? TaskId.fromString(data.parentTaskId) : null;
    
    const task = new TaskEntity(
      taskId,
      title,
      description,
      priority,
      reporterId,
      projectId,
      parentTaskId
    );
    
    // 重建其他屬性
    task._status = data.status as TaskStatus;
    task._assigneeId = data.assigneeId ? UserId.fromString(data.assigneeId) : null;
    task._subtasks = data.subtasks.map(id => TaskId.fromString(id));
    task._tags = data.tags;
    task._dueDate = data.dueDate ? new Date(data.dueDate) : null;
    task._estimatedHours = data.estimatedHours;
    task._actualHours = data.actualHours;
    task._createdAt = new Date(data.createdAt);
    task._updatedAt = new Date(data.updatedAt);
    task._completedAt = data.completedAt ? new Date(data.completedAt) : null;
    
    return task;
  }
}
```

## 使用範例

### 1. 建立任務
```typescript
const title = new TaskTitle('實作使用者登入功能');
const description = new TaskDescription('實作使用者登入、註冊、忘記密碼等功能');
const priority = TaskPriority.HIGH;
const reporterId = UserId.fromString('user-123');
const projectId = ProjectId.fromString('project-456');

const task = TaskFactory.create(
  title,
  description,
  priority,
  reporterId,
  projectId
);
```

### 2. 管理任務狀態
```typescript
// 指派任務
const assigneeId = UserId.fromString('user-789');
task.assign(assigneeId, reporterId);

// 開始任務
task.start(assigneeId);

// 記錄工時
task.recordActualHours(2.5, assigneeId);

// 完成任務
task.complete(assigneeId);
```

### 3. 管理子任務
```typescript
// 建立子任務
const subtask = TaskFactory.create(
  new TaskTitle('設計登入頁面'),
  new TaskDescription('設計使用者登入頁面的 UI'),
  TaskPriority.MEDIUM,
  reporterId,
  projectId,
  task.id
);

// 將子任務加入父任務
task.addSubtask(subtask.id);
```

### 4. 管理標籤
```typescript
// 新增標籤
task.addTag('frontend');
task.addTag('authentication');
task.addTag('urgent');

// 移除標籤
task.removeTag('urgent');
```

## 相關資源
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Aggregate Pattern](https://martinfowler.com/bliki/DDD_Aggregate.html)
- [State Machine Pattern](https://martinfowler.com/bliki/StateMachine.html)