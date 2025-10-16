# Api Contracts.md - API 合約與介面設計

> **AI Agent 友好指南**：本文件提供營建專案管理系統的 API 合約設計，包含 RESTful API、Firebase API 封裝、錯誤處理和版本管理策略。

## 🌐 API 架構概覽

### API 層級結構
```typescript
// API 架構層級
export interface APILayerArchitecture {
  // 表現層 (Presentation Layer)
  presentation: {
    controllers: ControllerAPI;     // Angular 控制器
    guards: GuardAPI;              // 路由守衛
    interceptors: InterceptorAPI;   // HTTP 攔截器
  };
  
  // 應用層 (Application Layer)
  application: {
    services: ServiceAPI;          // 應用服務
    useCases: UseCaseAPI;          // 用例服務
    dto: DTOAPI;                   // 資料傳輸物件
  };
  
  // 基礎設施層 (Infrastructure Layer)
  infrastructure: {
    repositories: RepositoryAPI;   // 資料存取層
    external: ExternalAPI;         // 外部 API 整合
    firebase: FirebaseAPI;         // Firebase 服務
  };
}
```

### API 設計原則
```typescript
// API 設計原則
export const API_DESIGN_PRINCIPLES = {
  // RESTful 設計
  restful: {
    principles: [
      '使用 HTTP 動詞表示操作',
      '使用名詞表示資源',
      '使用統一的 URL 結構',
      '使用適當的 HTTP 狀態碼',
      '支援內容協商'
    ],
    benefits: ['可預測性', '可擴展性', '易於理解', '標準化']
  },
  
  // 版本管理
  versioning: {
    strategies: ['URL 路徑', '查詢參數', 'HTTP 標頭'],
    currentVersion: 'v1',
    supportedVersions: ['v1'],
    deprecationPolicy: '6個月通知期'
  },
  
  // 錯誤處理
  errorHandling: {
    principles: [
      '統一的錯誤格式',
      '適當的 HTTP 狀態碼',
      '詳細的錯誤訊息',
      '錯誤追蹤 ID'
    ],
    formats: ['JSON', 'XML']
  },
  
  // 安全性
  security: {
    authentication: 'JWT Token',
    authorization: 'RBAC',
    rateLimiting: '1000 requests/hour',
    cors: 'Same-origin policy'
  }
} as const;
```

## 🔧 Firebase API 封裝

### 1. 基礎 API 服務
```typescript
// 基礎 API 服務
@Injectable({ providedIn: 'root' })
export class BaseApiService {
  protected firestore = inject(Firestore);
  protected auth = inject(Auth);
  protected storage = inject(Storage);
  
  // 通用 CRUD 操作
  async create<T>(collection: string, data: T, id?: string): Promise<T> {
    try {
      const docRef = id 
        ? doc(this.firestore, collection, id)
        : doc(collection(this.firestore, collection));
      
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, docData);
      
      return {
        ...data,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      } as T;
    } catch (error) {
      throw this.handleError(error, 'CREATE', collection);
    }
  }
  
  async getById<T>(collection: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(this.firestore, collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      }
      
      return null;
    } catch (error) {
      throw this.handleError(error, 'READ', collection, id);
    }
  }
  
  async getAll<T>(
    collection: string, 
    options: QueryOptions = {}
  ): Promise<T[]> {
    try {
      let query = collection(this.firestore, collection);
      
      // 應用查詢選項
      if (options.where) {
        query = query.where(
          options.where.field, 
          options.where.operator, 
          options.where.value
        );
      }
      
      if (options.orderBy) {
        query = query.orderBy(options.orderBy.field, options.orderBy.direction);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const querySnapshot = await getDocs(query);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      throw this.handleError(error, 'READ_ALL', collection);
    }
  }
  
  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    try {
      const docRef = doc(this.firestore, collection, id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      // 返回更新後的資料
      const updatedDoc = await getDoc(docRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as T;
    } catch (error) {
      throw this.handleError(error, 'UPDATE', collection, id);
    }
  }
  
  async delete(collection: string, id: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, collection, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw this.handleError(error, 'DELETE', collection, id);
    }
  }
  
  // 批次操作
  async batchCreate<T>(collection: string, dataList: T[]): Promise<T[]> {
    const batch = writeBatch(this.firestore);
    const results: T[] = [];
    
    try {
      for (const data of dataList) {
        const docRef = doc(collection(this.firestore, collection));
        batch.set(docRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        results.push({
          ...data,
          id: docRef.id
        } as T);
      }
      
      await batch.commit();
      return results;
    } catch (error) {
      throw this.handleError(error, 'BATCH_CREATE', collection);
    }
  }
  
  // 錯誤處理
  private handleError(error: any, operation: string, collection: string, id?: string): ApiError {
    const errorMessage = this.getErrorMessage(error);
    const errorCode = this.getErrorCode(error);
    
    return new ApiError({
      message: errorMessage,
      code: errorCode,
      operation,
      collection,
      id,
      timestamp: new Date(),
      traceId: this.generateTraceId()
    });
  }
  
  private getErrorMessage(error: any): string {
    if (error.code) {
      const errorMessages: { [key: string]: string } = {
        'permission-denied': '權限不足',
        'not-found': '資源不存在',
        'already-exists': '資源已存在',
        'invalid-argument': '參數無效',
        'unavailable': '服務暫時不可用',
        'unauthenticated': '未認證'
      };
      
      return errorMessages[error.code] || '未知錯誤';
    }
    
    return error.message || '操作失敗';
  }
  
  private getErrorCode(error: any): string {
    return error.code || 'UNKNOWN_ERROR';
  }
  
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 查詢選項介面
export interface QueryOptions {
  where?: {
    field: string;
    operator: WhereFilterOp;
    value: any;
  };
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  startAfter?: DocumentSnapshot;
}
```

### 2. 用戶 API 服務
```typescript
// 用戶 API 服務
@Injectable({ providedIn: 'root' })
export class UserApiService extends BaseApiService {
  private readonly COLLECTION = 'users';
  
  // 創建用戶
  async createUser(userData: CreateUserRequest): Promise<User> {
    const user = await this.create<User>(this.COLLECTION, userData);
    
    // 創建用戶資料
    await this.createUserProfile(user.id, userData.profile);
    
    return user;
  }
  
  // 獲取用戶列表
  async getUsers(filters?: UserFilters): Promise<User[]> {
    const options: QueryOptions = {};
    
    if (filters?.role) {
      options.where = {
        field: 'customClaims.role',
        operator: '==',
        value: filters.role
      };
    }
    
    if (filters?.status) {
      options.where = {
        field: 'status',
        operator: '==',
        value: filters.status
      };
    }
    
    if (filters?.organizationId) {
      options.where = {
        field: 'customClaims.organizationId',
        operator: '==',
        value: filters.organizationId
      };
    }
    
    return this.getAll<User>(this.COLLECTION, options);
  }
  
  // 搜尋用戶
  async searchUsers(query: string, filters?: UserFilters): Promise<User[]> {
    // 使用 Algolia 或 Elasticsearch 進行全文搜尋
    // 這裡使用 Firestore 的簡單搜尋
    const users = await this.getUsers(filters);
    
    return users.filter(user => 
      user.displayName.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // 更新用戶狀態
  async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    return this.update<User>(this.COLLECTION, userId, { status });
  }
  
  // 獲取用戶統計
  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.getById<User>(this.COLLECTION, userId);
    if (!user) {
      throw new ApiError({ message: '用戶不存在', code: 'USER_NOT_FOUND' });
    }
    
    // 計算統計資料
    const projectCount = await this.getUserProjectCount(userId);
    const taskCount = await this.getUserTaskCount(userId);
    
    return {
      userId,
      projectCount,
      taskCount,
      lastActiveAt: user.lastLoginAt,
      rating: user.stats?.rating || 0
    };
  }
  
  // 創建用戶資料
  private async createUserProfile(userId: string, profileData: UserProfile): Promise<void> {
    await this.create<UserProfile>('userProfiles', {
      userId,
      ...profileData
    });
  }
  
  // 獲取用戶專案數量
  private async getUserProjectCount(userId: string): Promise<number> {
    const options: QueryOptions = {
      where: {
        field: 'team.projectManager',
        operator: '==',
        value: userId
      }
    };
    
    const projects = await this.getAll<Project>('projects', options);
    return projects.length;
  }
  
  // 獲取用戶任務數量
  private async getUserTaskCount(userId: string): Promise<number> {
    const options: QueryOptions = {
      where: {
        field: 'assignment.assignedTo',
        operator: 'array-contains',
        value: userId
      }
    };
    
    const tasks = await this.getAll<Task>('tasks', options);
    return tasks.length;
  }
}

// 用戶相關 DTO
export interface CreateUserRequest {
  email: string;
  displayName: string;
  role: UserRole;
  organizationId?: string;
  profile: UserProfile;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  search?: string;
}

export interface UserStats {
  userId: string;
  projectCount: number;
  taskCount: number;
  lastActiveAt: Date;
  rating: number;
}
```

### 3. 專案 API 服務
```typescript
// 專案 API 服務
@Injectable({ providedIn: 'root' })
export class ProjectApiService extends BaseApiService {
  private readonly COLLECTION = 'projects';
  
  // 創建專案
  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const project = await this.create<Project>(this.COLLECTION, projectData);
    
    // 創建專案成員關係
    await this.addProjectMember(project.id, projectData.createdBy, 'project_manager');
    
    // 創建初始預算
    if (projectData.budget) {
      await this.createInitialBudget(project.id, projectData.budget);
    }
    
    return project;
  }
  
  // 獲取專案列表
  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    const options: QueryOptions = {};
    
    if (filters?.status) {
      options.where = {
        field: 'status',
        operator: '==',
        value: filters.status
      };
    }
    
    if (filters?.type) {
      options.where = {
        field: 'basicInfo.type',
        operator: '==',
        value: filters.type
      };
    }
    
    if (filters?.projectManager) {
      options.where = {
        field: 'team.projectManager',
        operator: '==',
        value: filters.projectManager
      };
    }
    
    if (filters?.sortBy) {
      options.orderBy = {
        field: filters.sortBy,
        direction: filters.sortOrder || 'desc'
      };
    }
    
    if (filters?.limit) {
      options.limit = filters.limit;
    }
    
    return this.getAll<Project>(this.COLLECTION, options);
  }
  
  // 獲取專案詳情
  async getProjectDetails(projectId: string): Promise<ProjectDetails> {
    const project = await this.getById<Project>(this.COLLECTION, projectId);
    if (!project) {
      throw new ApiError({ message: '專案不存在', code: 'PROJECT_NOT_FOUND' });
    }
    
    // 獲取相關資料
    const [members, tasks, budgets, documents] = await Promise.all([
      this.getProjectMembers(projectId),
      this.getProjectTasks(projectId),
      this.getProjectBudgets(projectId),
      this.getProjectDocuments(projectId)
    ]);
    
    return {
      project,
      members,
      tasks,
      budgets,
      documents,
      stats: await this.calculateProjectStats(projectId)
    };
  }
  
  // 更新專案進度
  async updateProjectProgress(projectId: string, progress: number): Promise<Project> {
    const project = await this.getById<Project>(this.COLLECTION, projectId);
    if (!project) {
      throw new ApiError({ message: '專案不存在', code: 'PROJECT_NOT_FOUND' });
    }
    
    return this.update<Project>(this.COLLECTION, projectId, { progress });
  }
  
  // 添加專案成員
  async addProjectMember(projectId: string, userId: string, role: ProjectRole): Promise<void> {
    const memberData: ProjectMember = {
      projectId,
      userId,
      memberInfo: {
        role,
        joinedAt: new Date(),
        status: 'active',
        contribution: 0
      },
      permissions: this.getDefaultPermissions(role),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.create<ProjectMember>('projectMembers', memberData);
  }
  
  // 獲取專案成員
  private async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const options: QueryOptions = {
      where: {
        field: 'projectId',
        operator: '==',
        value: projectId
      }
    };
    
    return this.getAll<ProjectMember>('projectMembers', options);
  }
  
  // 獲取專案任務
  private async getProjectTasks(projectId: string): Promise<Task[]> {
    const options: QueryOptions = {
      where: {
        field: 'projectId',
        operator: '==',
        value: projectId
      }
    };
    
    return this.getAll<Task>('tasks', options);
  }
  
  // 獲取專案預算
  private async getProjectBudgets(projectId: string): Promise<Budget[]> {
    const options: QueryOptions = {
      where: {
        field: 'projectId',
        operator: '==',
        value: projectId
      }
    };
    
    return this.getAll<Budget>('budgets', options);
  }
  
  // 獲取專案文件
  private async getProjectDocuments(projectId: string): Promise<Document[]> {
    const options: QueryOptions = {
      where: {
        field: 'projectId',
        operator: '==',
        value: projectId
      }
    };
    
    return this.getAll<Document>('documents', options);
  }
  
  // 計算專案統計
  private async calculateProjectStats(projectId: string): Promise<ProjectStats> {
    const [tasks, budgets, expenses] = await Promise.all([
      this.getProjectTasks(projectId),
      this.getProjectBudgets(projectId),
      this.getProjectExpenses(projectId)
    ]);
    
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amounts.totalBudget, 0);
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.expenseInfo.amount, 0);
    
    return {
      taskCount: tasks.length,
      completedTaskCount: completedTasks,
      progress: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
      totalBudget,
      totalSpent,
      remainingBudget: totalBudget - totalSpent
    };
  }
  
  // 獲取專案支出
  private async getProjectExpenses(projectId: string): Promise<Expense[]> {
    const options: QueryOptions = {
      where: {
        field: 'projectId',
        operator: '==',
        value: projectId
      }
    };
    
    return this.getAll<Expense>('expenses', options);
  }
  
  // 創建初始預算
  private async createInitialBudget(projectId: string, budgetData: BudgetData): Promise<void> {
    const budget: Budget = {
      projectId,
      name: '主預算',
      description: '專案主預算',
      budgetInfo: {
        type: 'master',
        currency: budgetData.currency,
        version: 1
      },
      amounts: {
        totalBudget: budgetData.totalBudget,
        allocated: 0,
        spent: 0,
        committed: 0,
        available: budgetData.totalBudget
      },
      breakdown: budgetData.breakdown,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: budgetData.createdBy
    };
    
    await this.create<Budget>('budgets', budget);
  }
  
  // 獲取預設權限
  private getDefaultPermissions(role: ProjectRole): ProjectMemberPermissions {
    const permissionMap: { [key in ProjectRole]: ProjectMemberPermissions } = {
      'project_manager': {
        canViewProject: true,
        canEditProject: true,
        canManageTasks: true,
        canAssignTasks: true,
        canViewFinancials: true,
        canManageDocuments: true,
        canUploadPhotos: true,
        canCreateReports: true,
        customPermissions: []
      },
      'site_manager': {
        canViewProject: true,
        canEditProject: false,
        canManageTasks: true,
        canAssignTasks: true,
        canViewFinancials: false,
        canManageDocuments: true,
        canUploadPhotos: true,
        canCreateReports: true,
        customPermissions: []
      },
      'engineer': {
        canViewProject: true,
        canEditProject: false,
        canManageTasks: false,
        canAssignTasks: false,
        canViewFinancials: false,
        canManageDocuments: true,
        canUploadPhotos: true,
        canCreateReports: false,
        customPermissions: []
      },
      'supervisor': {
        canViewProject: true,
        canEditProject: false,
        canManageTasks: false,
        canAssignTasks: false,
        canViewFinancials: false,
        canManageDocuments: false,
        canUploadPhotos: true,
        canCreateReports: true,
        customPermissions: []
      },
      'contractor': {
        canViewProject: true,
        canEditProject: false,
        canManageTasks: false,
        canAssignTasks: false,
        canViewFinancials: false,
        canManageDocuments: false,
        canUploadPhotos: true,
        canCreateReports: false,
        customPermissions: []
      },
      'inspector': {
        canViewProject: true,
        canEditProject: false,
        canManageTasks: false,
        canAssignTasks: false,
        canViewFinancials: false,
        canManageDocuments: false,
        canUploadPhotos: true,
        canCreateReports: true,
        customPermissions: []
      },
      'safety_officer': {
        canViewProject: true,
        canEditProject: false,
        canManageTasks: false,
        canAssignTasks: false,
        canViewFinancials: false,
        canManageDocuments: false,
        canUploadPhotos: true,
        canCreateReports: true,
        customPermissions: []
      },
      'quality_control': {
        canViewProject: true,
        canEditProject: false,
        canManageTasks: false,
        canAssignTasks: false,
        canViewFinancials: false,
        canManageDocuments: false,
        canUploadPhotos: true,
        canCreateReports: true,
        customPermissions: []
      },
      'member': {
        canViewProject: true,
        canEditProject: false,
        canManageTasks: false,
        canAssignTasks: false,
        canViewFinancials: false,
        canManageDocuments: false,
        canUploadPhotos: false,
        canCreateReports: false,
        customPermissions: []
      },
      'viewer': {
        canViewProject: true,
        canEditProject: false,
        canManageTasks: false,
        canAssignTasks: false,
        canViewFinancials: false,
        canManageDocuments: false,
        canUploadPhotos: false,
        canCreateReports: false,
        customPermissions: []
      }
    };
    
    return permissionMap[role];
  }
}

// 專案相關 DTO
export interface CreateProjectRequest {
  name: string;
  description?: string;
  basicInfo: ProjectBasicInfo;
  timeline: ProjectTimeline;
  budget: BudgetData;
  team: ProjectTeamInfo;
  createdBy: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  type?: ProjectType;
  projectManager?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface ProjectDetails {
  project: Project;
  members: ProjectMember[];
  tasks: Task[];
  budgets: Budget[];
  documents: Document[];
  stats: ProjectStats;
}

export interface ProjectStats {
  taskCount: number;
  completedTaskCount: number;
  progress: number;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
}
```

## 🚨 錯誤處理策略

### 1. API 錯誤類別
```typescript
// API 錯誤類別
export class ApiError extends Error {
  public readonly code: string;
  public readonly operation: string;
  public readonly collection: string;
  public readonly id?: string;
  public readonly timestamp: Date;
  public readonly traceId: string;
  public readonly httpStatus: number;
  
  constructor(error: ApiErrorData) {
    super(error.message);
    
    this.name = 'ApiError';
    this.code = error.code;
    this.operation = error.operation;
    this.collection = error.collection;
    this.id = error.id;
    this.timestamp = error.timestamp;
    this.traceId = error.traceId;
    this.httpStatus = this.getHttpStatus(error.code);
  }
  
  private getHttpStatus(code: string): number {
    const statusMap: { [key: string]: number } = {
      'PERMISSION_DENIED': 403,
      'NOT_FOUND': 404,
      'ALREADY_EXISTS': 409,
      'INVALID_ARGUMENT': 400,
      'UNAVAILABLE': 503,
      'UNAUTHENTICATED': 401,
      'RATE_LIMIT_EXCEEDED': 429,
      'VALIDATION_ERROR': 422,
      'INTERNAL_ERROR': 500
    };
    
    return statusMap[code] || 500;
  }
  
  // 轉換為 API 響應格式
  toApiResponse(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        operation: this.operation,
        collection: this.collection,
        id: this.id,
        timestamp: this.timestamp.toISOString(),
        traceId: this.traceId
      }
    };
  }
}

// API 錯誤資料介面
export interface ApiErrorData {
  message: string;
  code: string;
  operation: string;
  collection: string;
  id?: string;
  timestamp: Date;
  traceId: string;
}

// API 錯誤響應介面
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    operation: string;
    collection: string;
    id?: string;
    timestamp: string;
    traceId: string;
  };
}
```

### 2. 錯誤處理攔截器
```typescript
// HTTP 錯誤處理攔截器
@Injectable()
export class ErrorHandlingInterceptor implements HttpInterceptor {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = this.handleHttpError(error);
        
        // 記錄錯誤
        this.logError(apiError);
        
        // 顯示用戶友善的錯誤訊息
        this.showUserFriendlyError(apiError);
        
        // 處理特殊錯誤情況
        this.handleSpecialErrors(apiError);
        
        return throwError(() => apiError);
      })
    );
  }
  
  private handleHttpError(error: HttpErrorResponse): ApiError {
    let message = '操作失敗';
    let code = 'UNKNOWN_ERROR';
    
    if (error.error?.error) {
      // Firebase 錯誤格式
      const firebaseError = error.error.error;
      message = firebaseError.message || message;
      code = firebaseError.code || code;
    } else if (error.error?.message) {
      // 標準 API 錯誤格式
      message = error.error.message;
      code = error.error.code || code;
    } else {
      // HTTP 狀態碼錯誤
      switch (error.status) {
        case 400:
          message = '請求參數錯誤';
          code = 'BAD_REQUEST';
          break;
        case 401:
          message = '未授權訪問';
          code = 'UNAUTHORIZED';
          break;
        case 403:
          message = '權限不足';
          code = 'FORBIDDEN';
          break;
        case 404:
          message = '資源不存在';
          code = 'NOT_FOUND';
          break;
        case 409:
          message = '資源衝突';
          code = 'CONFLICT';
          break;
        case 422:
          message = '資料驗證失敗';
          code = 'VALIDATION_ERROR';
          break;
        case 429:
          message = '請求過於頻繁';
          code = 'RATE_LIMIT_EXCEEDED';
          break;
        case 500:
          message = '伺服器內部錯誤';
          code = 'INTERNAL_ERROR';
          break;
        case 503:
          message = '服務暫時不可用';
          code = 'SERVICE_UNAVAILABLE';
          break;
      }
    }
    
    return new ApiError({
      message,
      code,
      operation: 'HTTP_REQUEST',
      collection: 'unknown',
      timestamp: new Date(),
      traceId: this.generateTraceId()
    });
  }
  
  private logError(error: ApiError): void {
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      operation: error.operation,
      collection: error.collection,
      id: error.id,
      traceId: error.traceId,
      timestamp: error.timestamp
    });
    
    // 發送到錯誤追蹤服務
    this.sendToErrorTracking(error);
  }
  
  private showUserFriendlyError(error: ApiError): void {
    const userMessage = this.getUserFriendlyMessage(error);
    
    switch (error.code) {
      case 'PERMISSION_DENIED':
        this.notificationService.error(userMessage);
        break;
      case 'NOT_FOUND':
        this.notificationService.warning(userMessage);
        break;
      case 'VALIDATION_ERROR':
        this.notificationService.error(userMessage);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        this.notificationService.warning(userMessage);
        break;
      default:
        this.notificationService.error(userMessage);
    }
  }
  
  private handleSpecialErrors(error: ApiError): void {
    switch (error.code) {
      case 'UNAUTHENTICATED':
        // 重定向到登入頁面
        this.router.navigate(['/auth/login']);
        break;
      case 'PERMISSION_DENIED':
        // 重定向到無權限頁面
        this.router.navigate(['/error/403']);
        break;
      case 'NOT_FOUND':
        // 重定向到 404 頁面
        this.router.navigate(['/error/404']);
        break;
    }
  }
  
  private getUserFriendlyMessage(error: ApiError): string {
    const messageMap: { [key: string]: string } = {
      'PERMISSION_DENIED': '您沒有權限執行此操作',
      'NOT_FOUND': '找不到請求的資源',
      'ALREADY_EXISTS': '資源已存在',
      'INVALID_ARGUMENT': '請求參數無效',
      'UNAVAILABLE': '服務暫時不可用，請稍後再試',
      'UNAUTHENTICATED': '請先登入系統',
      'RATE_LIMIT_EXCEEDED': '請求過於頻繁，請稍後再試',
      'VALIDATION_ERROR': '資料驗證失敗，請檢查輸入內容',
      'INTERNAL_ERROR': '系統發生錯誤，請聯繫管理員'
    };
    
    return messageMap[error.code] || '操作失敗，請稍後再試';
  }
  
  private sendToErrorTracking(error: ApiError): void {
    // 發送到錯誤追蹤服務 (如 Sentry)
    // Sentry.captureException(error);
  }
  
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 📊 API 版本管理

### 1. API 版本控制
```typescript
// API 版本管理服務
@Injectable({ providedIn: 'root' })
export class ApiVersionService {
  private readonly CURRENT_VERSION = 'v1';
  private readonly SUPPORTED_VERSIONS = ['v1'];
  private readonly DEPRECATION_NOTICE_PERIOD = 6; // 月
  
  // 獲取 API 版本資訊
  getApiInfo(): ApiInfo {
    return {
      currentVersion: this.CURRENT_VERSION,
      supportedVersions: this.SUPPORTED_VERSIONS,
      deprecationPolicy: {
        noticePeriod: this.DEPRECATION_NOTICE_PERIOD,
        description: 'API 版本將在 6 個月前通知廢棄'
      },
      changelog: this.getChangelog()
    };
  }
  
  // 檢查版本支援
  isVersionSupported(version: string): boolean {
    return this.SUPPORTED_VERSIONS.includes(version);
  }
  
  // 獲取版本變更日誌
  private getChangelog(): ApiChangelog[] {
    return [
      {
        version: 'v1.0.0',
        releaseDate: '2024-01-01',
        changes: [
          {
            type: 'feature',
            description: '初始版本發布',
            endpoints: ['users', 'projects', 'tasks', 'budgets']
          }
        ]
      },
      {
        version: 'v1.1.0',
        releaseDate: '2024-02-01',
        changes: [
          {
            type: 'feature',
            description: '新增成本控制功能',
            endpoints: ['expenses', 'cost-breakdowns']
          },
          {
            type: 'improvement',
            description: '優化專案查詢性能',
            endpoints: ['projects']
          }
        ]
      }
    ];
  }
}

// API 資訊介面
export interface ApiInfo {
  currentVersion: string;
  supportedVersions: string[];
  deprecationPolicy: {
    noticePeriod: number;
    description: string;
  };
  changelog: ApiChangelog[];
}

export interface ApiChangelog {
  version: string;
  releaseDate: string;
  changes: ApiChange[];
}

export interface ApiChange {
  type: 'feature' | 'improvement' | 'bugfix' | 'breaking';
  description: string;
  endpoints?: string[];
}
```

### 2. API 文檔生成
```typescript
// API 文檔生成服務
@Injectable({ providedIn: 'root' })
export class ApiDocumentationService {
  // 生成 API 文檔
  generateApiDocumentation(): ApiDocumentation {
    return {
      info: {
        title: '營建專案管理系統 API',
        version: 'v1.0.0',
        description: '營建專案管理系統的 RESTful API 文檔',
        contact: {
          name: 'API 支援',
          email: 'api-support@construction.com'
        }
      },
      servers: [
        {
          url: 'https://api.construction.com/v1',
          description: '生產環境'
        },
        {
          url: 'https://staging-api.construction.com/v1',
          description: '測試環境'
        }
      ],
      paths: this.generatePaths(),
      components: this.generateComponents()
    };
  }
  
  // 生成 API 路徑
  private generatePaths(): { [key: string]: any } {
    return {
      '/users': {
        get: {
          summary: '獲取用戶列表',
          parameters: [
            {
              name: 'role',
              in: 'query',
              schema: { type: 'string' },
              description: '用戶角色篩選'
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' },
              description: '用戶狀態篩選'
            }
          ],
          responses: {
            '200': {
              description: '成功獲取用戶列表',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: '創建新用戶',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateUserRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: '用戶創建成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      },
      '/users/{id}': {
        get: {
          summary: '獲取用戶詳情',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '用戶 ID'
            }
          ],
          responses: {
            '200': {
              description: '成功獲取用戶詳情',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '404': {
              description: '用戶不存在'
            }
          }
        }
      }
    };
  }
  
  // 生成組件定義
  private generateComponents(): any {
    return {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'manager', 'engineer', 'supervisor'] },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'email', 'displayName', 'role', 'status']
        },
        CreateUserRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'manager', 'engineer', 'supervisor'] },
            organizationId: { type: 'string' }
          },
          required: ['email', 'displayName', 'role']
        }
      }
    };
  }
}

// API 文檔介面
export interface ApiDocumentation {
  info: {
    title: string;
    version: string;
    description: string;
    contact: {
      name: string;
      email: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: { [key: string]: any };
  components: any;
}
```

## ✅ AI Agent 實作檢查清單

### API 設計檢查清單
- [ ] **RESTful 設計**：遵循 REST 設計原則
- [ ] **統一介面**：一致的 API 介面設計
- [ ] **錯誤處理**：完整的錯誤處理機制
- [ ] **版本管理**：API 版本控制策略
- [ ] **文檔生成**：自動化 API 文檔生成

### 安全性檢查清單
- [ ] **認證機制**：JWT Token 認證
- [ ] **授權控制**：基於角色的訪問控制
- [ ] **輸入驗證**：API 輸入參數驗證
- [ ] **速率限制**：API 調用頻率限制
- [ ] **CORS 配置**：跨域請求配置

### 性能優化檢查清單
- [ ] **快取策略**：適當的 API 快取機制
- [ ] **分頁處理**：大量資料的分頁處理
- [ ] **批次操作**：支援批次 API 操作
- [ ] **壓縮傳輸**：API 響應壓縮
- [ ] **連接池**：資料庫連接池配置

### 監控與日誌檢查清單
- [ ] **API 監控**：API 調用監控和指標
- [ ] **錯誤追蹤**：API 錯誤追蹤和報告
- [ ] **性能監控**：API 響應時間監控
- [ ] **使用統計**：API 使用情況統計
- [ ] **審計日誌**：API 調用審計日誌

## 📚 參考資源

### 官方文件
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Firestore API 參考](https://firebase.google.com/docs/firestore/reference/rest)
- [Angular HTTP 客戶端](https://angular.dev/guide/http)

### 最佳實踐
- [RESTful API 設計指南](https://restfulapi.net/)
- [API 設計最佳實踐](https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [Firebase 安全規則](https://firebase.google.com/docs/firestore/security/get-started)

### 工具與測試
- [Postman API 測試](https://www.postman.com/)
- [Swagger API 文檔](https://swagger.io/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

---

> **AI Agent 提示**：實作 API 時，請遵循本指南的設計原則和檢查清單，確保 API 的一致性、安全性和可維護性。優先使用 Firebase 的原生 API 並適當封裝以提供更好的開發體驗。
