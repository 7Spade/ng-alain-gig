# 常見問題 (Common Issues)

## 🚨 常見問題與解決方案

本文件收集 ng-alain-gig 專案開發過程中的常見問題和解決方案。

## 🔧 環境設置問題

### Node.js 版本不相容
**問題**: `node: --openssl-legacy-provider is not allowed in NODE_OPTIONS`

**解決方案**:
```bash
# 檢查 Node.js 版本
node --version

# 如果版本低於 v18，請升級
nvm install 22.20.0
nvm use 22.20.0

# 或使用 n (macOS/Linux)
sudo n 22.20.0
```

### yarn 安裝失敗
**問題**: `yarn install` 失敗或依賴衝突

**解決方案**:
```bash
# 清理快取
yarn cache clean

# 刪除 node_modules 和 lock 檔案
rm -rf node_modules
rm yarn.lock

# 重新安裝
yarn install

# 如果仍有問題，使用 --force
yarn install --force
```

### Angular CLI 版本問題
**問題**: `ng` 指令不存在或版本不匹配

**解決方案**:
```bash
# 全域安裝最新版本
npm uninstall -g @angular/cli
npm install -g @angular/cli@20

# 檢查版本
ng version

# 如果專案內版本不匹配
npx ng version
```

## 🔥 Firebase 相關問題

### Firebase 初始化失敗
**問題**: `Firebase: No Firebase App '[DEFAULT]' has been created`

**解決方案**:
```typescript
// 檢查 app.config.ts 中的 Firebase 配置
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // 確保配置正確
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ...
};

// 確保在 providers 中正確初始化
export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      AngularFireModule.initializeApp(firebaseConfig)
    ),
    // ...
  ]
};
```

### Firestore 權限錯誤
**問題**: `FirebaseError: Missing or insufficient permissions`

**解決方案**:
```javascript
// 檢查 firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 確保規則正確設置
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Emulator 連接問題
**問題**: 無法連接到 Firebase Emulator

**解決方案**:
```bash
# 確保 Emulator 正在運行
firebase emulators:start

# 檢查端口是否被佔用
lsof -i :8080  # Firestore
lsof -i :9099  # Auth

# 在程式碼中確保連接到 Emulator
import { connectFirestoreEmulator } from 'firebase/firestore';

if (!environment.production) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## ⚡ Angular 編譯問題

### TypeScript 編譯錯誤
**問題**: `TS2307: Cannot find module` 或型別錯誤

**解決方案**:
```typescript
// 檢查 tsconfig.json 路徑映射
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@app/*": ["src/app/*"],
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@env/*": ["src/environments/*"]
    }
  }
}

// 確保 import 路徑正確
import { UserService } from '@core/services/user.service';
```

### Standalone 組件錯誤
**問題**: `NG0304: 'component' is not a known element`

**解決方案**:
```typescript
// 確保在 imports 中包含所需的模組
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,        // 必須包含
    ReactiveFormsModule, // 如果使用表單
    NzTableModule,       // ng-zorro 組件
    NzButtonModule
  ],
  template: `...`
})
export class UserListComponent { }
```

### Signal 相關錯誤
**問題**: `Cannot read properties of undefined (reading 'set')`

**解決方案**:
```typescript
// 確保 Signal 正確初始化
export class UserComponent {
  // 錯誤：未初始化
  // user: WritableSignal<User>;
  
  // 正確：初始化 Signal
  user = signal<User | null>(null);
  
  // 或使用 required signal
  userId = input.required<string>();
}
```

## 🎨 樣式問題

### ng-zorro 樣式不顯示
**問題**: Ant Design 組件樣式缺失

**解決方案**:
```less
// 在 styles.less 中確保引入樣式
@import '~ng-zorro-antd/ng-zorro-antd.less';

// 或在 angular.json 中配置
"styles": [
  "node_modules/ng-zorro-antd/ng-zorro-antd.min.css",
  "src/styles.less"
]
```

### Less 編譯錯誤
**問題**: `Error: Cannot resolve variable @primary-color`

**解決方案**:
```less
// 確保在組件樣式中引入必要的變數
@import '~ng-zorro-antd/lib/style/themes/default.less';

// 或在 angular.json 中配置
"stylePreprocessorOptions": {
  "includePaths": [
    "node_modules/"
  ]
}
```

### 響應式設計問題
**問題**: 在移動設備上佈局錯亂

**解決方案**:
```less
// 使用 ng-zorro 的響應式斷點
@import '~ng-zorro-antd/lib/style/mixins/index.less';

.user-card {
  .make-row();
  
  @media (max-width: @screen-md) {
    .make-xs-column(24);
  }
  
  @media (min-width: @screen-md) {
    .make-md-column(12);
  }
}
```

## 🔐 認證問題

### JWT Token 過期
**問題**: `401 Unauthorized` 錯誤

**解決方案**:
```typescript
// 實作 Token 刷新攔截器
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<any>(null);
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(this.addToken(req)).pipe(
      catchError(error => {
        if (error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(error);
      })
    );
  }
  
  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      
      return this.authService.refreshToken().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token.accessToken);
          return next.handle(this.addToken(request));
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          return next.handle(this.addToken(request));
        })
      );
    }
  }
}
```

### 路由守衛問題
**問題**: 守衛無法正確重定向

**解決方案**:
```typescript
// 確保守衛返回正確的值
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // 保存原始 URL 用於登入後重定向
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  
  return false;
};
```

## 📊 效能問題

### 變更檢測效能問題
**問題**: 頁面更新緩慢，CPU 使用率高

**解決方案**:
```typescript
// 使用 OnPush 變更檢測策略
@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (user of users(); track user.id) {
      <app-user-item [user]="user"></app-user-item>
    }
  `
})
export class UserListComponent {
  users = input.required<User[]>();
}

// 使用 trackBy 函數優化 *ngFor
trackByUserId(index: number, user: User): string {
  return user.id;
}
```

### 記憶體洩漏
**問題**: 頁面切換後記憶體持續增長

**解決方案**:
```typescript
// 使用 takeUntilDestroyed 自動清理訂閱
@Component({
  selector: 'app-data-component',
  template: `<div>{{ data() }}</div>`
})
export class DataComponent implements OnInit {
  private dataService = inject(DataService);
  private destroyRef = inject(DestroyRef);
  
  data = signal<any>(null);
  
  ngOnInit() {
    this.dataService.getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.data.set(data));
  }
}
```

### Bundle 大小問題
**問題**: 應用程式載入緩慢，bundle 過大

**解決方案**:
```bash
# 分析 bundle 大小
ng build --stats-json
npx webpack-bundle-analyzer dist/ng-alain/stats.json

# 啟用懶載入
ng generate module feature --route feature --module app.module
```

## 🧪 測試問題

### 測試環境設置失敗
**問題**: `Cannot read property 'getComponentFromError' of null`

**解決方案**:
```typescript
// 確保測試模組正確設置
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
      NoopAnimationsModule,  // 禁用動畫
      ComponentUnderTest
    ],
    providers: [
      { provide: AuthService, useValue: mockAuthService }
    ]
  }).compileComponents();
});
```

### Firebase 測試問題
**問題**: 測試中無法連接 Firebase

**解決方案**:
```typescript
// 使用 Firebase Emulator 進行測試
beforeAll(async () => {
  const app = initializeApp({ projectId: 'test-project' });
  const db = getFirestore(app);
  
  if (!db._delegate._databaseId.projectId.includes('test')) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
});

// 或使用 Mock
const mockFirestore = {
  collection: jasmine.createSpy().and.returnValue({
    add: jasmine.createSpy().and.returnValue(Promise.resolve())
  })
};
```

## 🔄 部署問題

### 建置失敗
**問題**: `ng build` 失敗

**解決方案**:
```bash
# 清理快取
rm -rf .angular
rm -rf dist

# 檢查記憶體限制
node --max-old-space-size=8192 node_modules/@angular/cli/bin/ng build

# 或在 package.json 中設置
"scripts": {
  "build": "node --max-old-space-size=8192 node_modules/@angular/cli/bin/ng build"
}
```

### Firebase 部署問題
**問題**: `firebase deploy` 失敗

**解決方案**:
```bash
# 檢查 Firebase 配置
firebase projects:list
firebase use your-project-id

# 檢查 firebase.json 配置
{
  "hosting": {
    "public": "dist/ng-alain",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 📋 問題排查檢查清單

### ✅ 環境檢查
- [ ] Node.js 版本 >= 18
- [ ] yarn 版本 >= 4.0
- [ ] Angular CLI 版本 >= 20
- [ ] 環境變數設置正確

### ✅ 依賴檢查
- [ ] package.json 版本相容
- [ ] node_modules 完整安裝
- [ ] 沒有版本衝突警告
- [ ] TypeScript 版本匹配

### ✅ 配置檢查
- [ ] tsconfig.json 設置正確
- [ ] angular.json 配置完整
- [ ] Firebase 配置有效
- [ ] 環境檔案存在

### ✅ 程式碼檢查
- [ ] Import 路徑正確
- [ ] 型別定義完整
- [ ] 組件依賴正確匯入
- [ ] 服務正確註冊

## 🆘 獲取幫助

### 官方資源
- [Angular 官方文件](https://angular.io/docs)
- [ng-alain 官方文件](https://ng-alain.com)
- [Firebase 官方文件](https://firebase.google.com/docs)

### 社群支援
- [Angular GitHub Issues](https://github.com/angular/angular/issues)
- [ng-alain GitHub Issues](https://github.com/ng-alain/ng-alain/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/angular)

### 除錯工具
- [Angular DevTools](https://angular.io/guide/devtools)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

## 📝 回報問題

當遇到新問題時，請提供以下資訊：

1. **環境資訊**:
   - Node.js 版本
   - Angular 版本
   - 作業系統

2. **錯誤資訊**:
   - 完整錯誤訊息
   - 錯誤堆疊追蹤
   - 重現步驟

3. **相關程式碼**:
   - 最小重現範例
   - 相關配置檔案
   - 依賴版本

這樣可以幫助快速定位和解決問題。
