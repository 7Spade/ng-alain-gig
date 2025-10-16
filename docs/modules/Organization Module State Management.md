# Organization Module - State Management

## 概述

Organization Module 的狀態管理採用 Angular v20 現代化 Signal-based 架構，結合 NgRx 和 RxJS 實現響應式狀態管理，遵循 DDD 架構模式。

## 狀態管理架構

### 1. Signal-based 狀態管理

#### 核心狀態服務

```typescript
import { inject, Injectable } from '@angular/core';
import { signalState, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { exhaustMap, pipe, tap } from 'rxjs';
import { OrganizationService } from '../application-layer/OrganizationService';
import { Organization, OrganizationMember, Team } from '../domain-layer/entities';

// 組織狀態介面
interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  members: OrganizationMember[];
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  selectedOrganizationId: string | null;
}

// 初始狀態
const initialState: OrganizationState = {
  organizations: [],
  currentOrganization: null,
  members: [],
  teams: [],
  isLoading: false,
  error: null,
  selectedOrganizationId: null
};

@Injectable({
  providedIn: 'root'
})
export class OrganizationStateService {
  readonly #organizationService = inject(OrganizationService);
  readonly #state = signalState(initialState);

  // 狀態信號
  readonly organizations = this.#state.organizations;
  readonly currentOrganization = this.#state.currentOrganization;
  readonly members = this.#state.members;
  readonly teams = this.#state.teams;
  readonly isLoading = this.#state.isLoading;
  readonly error = this.#state.error;
  readonly selectedOrganizationId = this.#state.selectedOrganizationId;

  // 計算屬性
  readonly hasOrganizations = computed(() => this.organizations().length > 0);
  readonly currentMembersCount = computed(() => this.members().length);
  readonly currentTeamsCount = computed(() => this.teams().length);

  // 載入組織列表
  readonly loadOrganizations = rxMethod<void>(
    pipe(
      tap(() => patchState(this.#state, { isLoading: true, error: null })),
      exhaustMap(() => {
        return this.#organizationService.getAllOrganizations().pipe(
          tapResponse({
            next: (organizations) => patchState(this.#state, { organizations }),
            error: (error) => patchState(this.#state, { error: error.message }),
            finalize: () => patchState(this.#state, { isLoading: false })
          })
        );
      })
    )
  );

  // 載入特定組織
  readonly loadOrganization = rxMethod<string>(
    pipe(
      tap(() => patchState(this.#state, { isLoading: true, error: null })),
      exhaustMap((id) => {
        return this.#organizationService.getOrganization(id).pipe(
          tapResponse({
            next: (organization) => patchState(this.#state, { 
              currentOrganization: organization,
              selectedOrganizationId: id
            }),
            error: (error) => patchState(this.#state, { error: error.message }),
            finalize: () => patchState(this.#state, { isLoading: false })
          })
        );
      })
    )
  );

  // 載入組織成員
  readonly loadMembers = rxMethod<string>(
    pipe(
      tap(() => patchState(this.#state, { isLoading: true, error: null })),
      exhaustMap((organizationId) => {
        return this.#organizationService.getOrganizationMembers(organizationId).pipe(
          tapResponse({
            next: (members) => patchState(this.#state, { members }),
            error: (error) => patchState(this.#state, { error: error.message }),
            finalize: () => patchState(this.#state, { isLoading: false })
          })
        );
      })
    )
  );

  // 載入組織團隊
  readonly loadTeams = rxMethod<string>(
    pipe(
      tap(() => patchState(this.#state, { isLoading: true, error: null })),
      exhaustMap((organizationId) => {
        return this.#organizationService.getOrganizationTeams(organizationId).pipe(
          tapResponse({
            next: (teams) => patchState(this.#state, { teams }),
            error: (error) => patchState(this.#state, { error: error.message }),
            finalize: () => patchState(this.#state, { isLoading: false })
          })
        );
      })
    )
  );

  // 建立組織
  readonly createOrganization = rxMethod<Partial<Organization>>(
    pipe(
      tap(() => patchState(this.#state, { isLoading: true, error: null })),
      exhaustMap((organizationData) => {
        return this.#organizationService.createOrganization(organizationData).pipe(
          tapResponse({
            next: (newOrganization) => {
              patchState(this.#state, (state) => ({
                organizations: [...state.organizations, newOrganization]
              }));
            },
            error: (error) => patchState(this.#state, { error: error.message }),
            finalize: () => patchState(this.#state, { isLoading: false })
          })
        );
      })
    )
  );

  // 更新組織
  readonly updateOrganization = rxMethod<{ id: string; data: Partial<Organization> }>(
    pipe(
      tap(() => patchState(this.#state, { isLoading: true, error: null })),
      exhaustMap(({ id, data }) => {
        return this.#organizationService.updateOrganization(id, data).pipe(
          tapResponse({
            next: (updatedOrganization) => {
              patchState(this.#state, (state) => ({
                organizations: state.organizations.map(org => 
                  org.id === id ? updatedOrganization : org
                ),
                currentOrganization: state.currentOrganization?.id === id 
                  ? updatedOrganization 
                  : state.currentOrganization
              }));
            },
            error: (error) => patchState(this.#state, { error: error.message }),
            finalize: () => patchState(this.#state, { isLoading: false })
          })
        );
      })
    )
  );

  // 刪除組織
  readonly deleteOrganization = rxMethod<string>(
    pipe(
      tap(() => patchState(this.#state, { isLoading: true, error: null })),
      exhaustMap((id) => {
        return this.#organizationService.deleteOrganization(id).pipe(
          tapResponse({
            next: () => {
              patchState(this.#state, (state) => ({
                organizations: state.organizations.filter(org => org.id !== id),
                currentOrganization: state.currentOrganization?.id === id 
                  ? null 
                  : state.currentOrganization
              }));
            },
            error: (error) => patchState(this.#state, { error: error.message }),
            finalize: () => patchState(this.#state, { isLoading: false })
          })
        );
      })
    )
  );

  // 選擇組織
  selectOrganization(id: string): void {
    patchState(this.#state, { selectedOrganizationId: id });
  }

  // 清除錯誤
  clearError(): void {
    patchState(this.#state, { error: null });
  }

  // 重置狀態
  reset(): void {
    patchState(this.#state, initialState);
  }
}
```

### 2. 組件級狀態管理

#### 組織列表組件狀態

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signalState, patchState } from '@ngrx/signals';
import { OrganizationStateService } from './organization-state.service';

interface OrganizationListState {
  searchTerm: string;
  sortBy: 'name' | 'createdAt' | 'memberCount';
  sortOrder: 'asc' | 'desc';
  filterBy: 'all' | 'active' | 'inactive';
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="organization-list">
      <!-- 搜尋和篩選 -->
      <div class="filters">
        <input 
          [(ngModel)]="state.searchTerm" 
          (ngModelChange)="onSearchChange()"
          placeholder="搜尋組織..."
          class="search-input">
        
        <select 
          [(ngModel)]="state.sortBy" 
          (ngModelChange)="onSortChange()"
          class="sort-select">
          <option value="name">按名稱排序</option>
          <option value="createdAt">按建立時間排序</option>
          <option value="memberCount">按成員數量排序</option>
        </select>

        <select 
          [(ngModel)]="state.filterBy" 
          (ngModelChange)="onFilterChange()"
          class="filter-select">
          <option value="all">全部</option>
          <option value="active">啟用</option>
          <option value="inactive">停用</option>
        </select>
      </div>

      <!-- 組織列表 -->
      @if (organizationState.isLoading()) {
        <div class="loading">載入中...</div>
      } @else if (organizationState.error()) {
        <div class="error">{{ organizationState.error() }}</div>
      } @else {
        <div class="organizations">
          @for (organization of filteredOrganizations(); track organization.id) {
            <div class="organization-card" (click)="selectOrganization(organization.id)">
              <h3>{{ organization.name }}</h3>
              <p>{{ organization.description }}</p>
              <div class="meta">
                <span>成員: {{ organization.memberCount }}</span>
                <span>團隊: {{ organization.teamCount }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class OrganizationListComponent implements OnInit {
  readonly organizationState = inject(OrganizationStateService);
  
  readonly state = signalState<OrganizationListState>({
    searchTerm: '',
    sortBy: 'name',
    sortOrder: 'asc',
    filterBy: 'all',
    page: 1,
    pageSize: 10
  });

  // 計算屬性
  readonly filteredOrganizations = computed(() => {
    let organizations = this.organizationState.organizations();
    
    // 搜尋過濾
    if (this.state.searchTerm()) {
      const term = this.state.searchTerm().toLowerCase();
      organizations = organizations.filter(org => 
        org.name.toLowerCase().includes(term) ||
        org.description.toLowerCase().includes(term)
      );
    }
    
    // 狀態過濾
    if (this.state.filterBy() !== 'all') {
      organizations = organizations.filter(org => 
        org.status === this.state.filterBy()
      );
    }
    
    // 排序
    organizations.sort((a, b) => {
      const order = this.state.sortOrder() === 'asc' ? 1 : -1;
      
      switch (this.state.sortBy()) {
        case 'name':
          return a.name.localeCompare(b.name) * order;
        case 'createdAt':
          return (a.createdAt.getTime() - b.createdAt.getTime()) * order;
        case 'memberCount':
          return (a.memberCount - b.memberCount) * order;
        default:
          return 0;
      }
    });
    
    return organizations;
  });

  ngOnInit(): void {
    this.organizationState.loadOrganizations();
  }

  onSearchChange(): void {
    // 搜尋邏輯已在 computed 中處理
  }

  onSortChange(): void {
    // 排序邏輯已在 computed 中處理
  }

  onFilterChange(): void {
    // 篩選邏輯已在 computed 中處理
  }

  selectOrganization(id: string): void {
    this.organizationState.selectOrganization(id);
    this.organizationState.loadOrganization(id);
  }
}
```

### 3. 全域狀態管理

#### NgRx Store 整合

```typescript
import { createFeature, createReducer, on } from '@ngrx/store';
import { OrganizationActions } from './organization.actions';

// 狀態介面
export interface OrganizationFeatureState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  members: OrganizationMember[];
  teams: Team[];
  loading: boolean;
  error: string | null;
}

// 初始狀態
const initialState: OrganizationFeatureState = {
  organizations: [],
  currentOrganization: null,
  members: [],
  teams: [],
  loading: false,
  error: null
};

// 建立 Feature
export const organizationFeature = createFeature({
  name: 'organization',
  reducer: createReducer(
    initialState,
    on(OrganizationActions.loadOrganizations, (state) => ({
      ...state,
      loading: true,
      error: null
    })),
    on(OrganizationActions.loadOrganizationsSuccess, (state, { organizations }) => ({
      ...state,
      organizations,
      loading: false
    })),
    on(OrganizationActions.loadOrganizationsFailure, (state, { error }) => ({
      ...state,
      error,
      loading: false
    })),
    on(OrganizationActions.selectOrganization, (state, { organization }) => ({
      ...state,
      currentOrganization: organization
    })),
    on(OrganizationActions.createOrganizationSuccess, (state, { organization }) => ({
      ...state,
      organizations: [...state.organizations, organization]
    })),
    on(OrganizationActions.updateOrganizationSuccess, (state, { organization }) => ({
      ...state,
      organizations: state.organizations.map(org => 
        org.id === organization.id ? organization : org
      ),
      currentOrganization: state.currentOrganization?.id === organization.id 
        ? organization 
        : state.currentOrganization
    })),
    on(OrganizationActions.deleteOrganizationSuccess, (state, { id }) => ({
      ...state,
      organizations: state.organizations.filter(org => org.id !== id),
      currentOrganization: state.currentOrganization?.id === id 
        ? null 
        : state.currentOrganization
    }))
  )
});

// 選擇器
export const {
  selectOrganizations,
  selectCurrentOrganization,
  selectMembers,
  selectTeams,
  selectLoading,
  selectError
} = organizationFeature;
```

### 4. 狀態持久化

#### LocalStorage 整合

```typescript
import { Injectable, inject } from '@angular/core';
import { signalState, patchState } from '@ngrx/signals';
import { withLocalStorage } from '@ngrx/signals/persistence';

@Injectable({
  providedIn: 'root'
})
export class OrganizationPersistenceService {
  private readonly storageKey = 'organization-state';

  // 儲存狀態到 LocalStorage
  saveState(state: OrganizationState): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save organization state:', error);
    }
  }

  // 從 LocalStorage 載入狀態
  loadState(): Partial<OrganizationState> | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load organization state:', error);
      return null;
    }
  }

  // 清除儲存的狀態
  clearState(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear organization state:', error);
    }
  }
}
```

### 5. 狀態同步

#### 跨組件狀態同步

```typescript
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrganizationSyncService {
  private readonly stateSubject = new BehaviorSubject<OrganizationState>(initialState);
  
  readonly state$ = this.stateSubject.asObservable();
  readonly organizations$ = this.state$.pipe(
    map(state => state.organizations),
    distinctUntilChanged()
  );
  readonly currentOrganization$ = this.state$.pipe(
    map(state => state.currentOrganization),
    distinctUntilChanged()
  );
  readonly loading$ = this.state$.pipe(
    map(state => state.isLoading),
    distinctUntilChanged()
  );

  updateState(updater: (state: OrganizationState) => OrganizationState): void {
    const currentState = this.stateSubject.value;
    const newState = updater(currentState);
    this.stateSubject.next(newState);
  }

  patchState(partial: Partial<OrganizationState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...partial };
    this.stateSubject.next(newState);
  }
}
```

## 狀態管理最佳實踐

### 1. 狀態設計原則

#### 單一職責原則
```typescript
// 好的設計：每個狀態服務只負責一個領域
@Injectable()
export class OrganizationStateService {
  // 只管理組織相關狀態
}

@Injectable()
export class MemberStateService {
  // 只管理成員相關狀態
}

@Injectable()
export class TeamStateService {
  // 只管理團隊相關狀態
}
```

#### 不可變性原則
```typescript
// 使用 patchState 確保狀態不可變
patchState(this.#state, (state) => ({
  organizations: [...state.organizations, newOrganization]
}));

// 避免直接修改狀態
// ❌ 錯誤做法
this.#state.organizations.push(newOrganization);

// ✅ 正確做法
patchState(this.#state, (state) => ({
  organizations: [...state.organizations, newOrganization]
}));
```

### 2. 效能優化

#### 計算屬性快取
```typescript
// 使用 computed 進行效能優化
readonly filteredOrganizations = computed(() => {
  // 只有依賴的狀態改變時才會重新計算
  return this.organizations().filter(org => 
    org.name.includes(this.searchTerm())
  );
});
```

#### 選擇性更新
```typescript
// 只更新必要的狀態
patchState(this.#state, {
  isLoading: false,
  error: null
});
```

### 3. 錯誤處理

#### 統一錯誤處理
```typescript
readonly loadOrganizations = rxMethod<void>(
  pipe(
    tap(() => patchState(this.#state, { isLoading: true, error: null })),
    exhaustMap(() => {
      return this.#organizationService.getAllOrganizations().pipe(
        tapResponse({
          next: (organizations) => patchState(this.#state, { organizations }),
          error: (error) => {
            console.error('Failed to load organizations:', error);
            patchState(this.#state, { error: error.message });
          },
          finalize: () => patchState(this.#state, { isLoading: false })
        })
      );
    })
  )
);
```

### 4. 測試策略

#### 狀態服務測試
```typescript
describe('OrganizationStateService', () => {
  let service: OrganizationStateService;
  let organizationService: jasmine.SpyObj<OrganizationService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('OrganizationService', [
      'getAllOrganizations',
      'getOrganization',
      'createOrganization'
    ]);

    TestBed.configureTestingModule({
      providers: [
        OrganizationStateService,
        { provide: OrganizationService, useValue: spy }
      ]
    });

    service = TestBed.inject(OrganizationStateService);
    organizationService = TestBed.inject(OrganizationService) as jasmine.SpyObj<OrganizationService>;
  });

  it('should load organizations successfully', () => {
    const mockOrganizations = [
      { id: '1', name: 'Test Org 1' },
      { id: '2', name: 'Test Org 2' }
    ];

    organizationService.getAllOrganizations.and.returnValue(of(mockOrganizations));

    service.loadOrganizations();

    expect(service.organizations()).toEqual(mockOrganizations);
    expect(service.isLoading()).toBeFalse();
    expect(service.error()).toBeNull();
  });
});
```

## 相關文件

- [Angular Signals 官方文件](https://angular.dev/guide/signals)
- [NgRx Signals 官方文件](https://ngrx.io/guide/signals)
- [Organization Module 架構文件](./Architecture/Organization%20Module.md)
- [Organization Module 路由配置](./Routing.md)
