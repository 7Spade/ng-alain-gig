# Account Module Testing (帳戶模組測試)

## 測試概述

Account Module Testing 定義了帳戶模組的完整測試策略，包括單元測試、整合測試、端對端測試、效能測試等。本測試策略採用 Angular 測試最佳實踐，確保帳戶模組的品質、可靠性和可維護性。

## 測試架構

### 1. 測試金字塔

```typescript
// 測試金字塔結構
const TEST_PYRAMID = {
  UNIT_TESTS: {
    percentage: 70,
    description: '單元測試 - 測試個別組件和服務',
    tools: ['Jest', 'Angular Testing Utilities']
  },
  INTEGRATION_TESTS: {
    percentage: 20,
    description: '整合測試 - 測試組件間互動',
    tools: ['Angular Testing Utilities', 'Firebase Emulator']
  },
  E2E_TESTS: {
    percentage: 10,
    description: '端對端測試 - 測試完整用戶流程',
    tools: ['Playwright', 'Cypress']
  }
} as const;
```

### 2. 測試環境配置

```typescript
// Jest 配置
const JEST_CONFIG = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.enum.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// Angular 測試配置
const ANGULAR_TEST_CONFIG = {
  imports: [
    HttpClientTestingModule,
    RouterTestingModule,
    NoopAnimationsModule
  ],
  providers: [
    { provide: AuthService, useClass: MockAuthService },
    { provide: UserService, useClass: MockUserService },
    { provide: NotificationService, useClass: MockNotificationService }
  ]
};
```

## 單元測試

### 1. 認證服務測試

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let authStateService: jasmine.SpyObj<AuthStateService>;

  beforeEach(() => {
    const authStateServiceSpy = jasmine.createSpyObj('AuthStateService', [
      'setAuthState',
      'clearAuthState',
      'getAuthState'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: AuthStateService, useValue: authStateServiceSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    authStateService = TestBed.inject(AuthStateService) as jasmine.SpyObj<AuthStateService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('login', () => {
    it('應該能夠成功登入', (done) => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResponse: LoginResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          displayName: 'Test User'
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        sessionId: 'mock-session-id'
      };

      service.login(credentials).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(authStateService.setAuthState).toHaveBeenCalledWith({
            isAuthenticated: true,
            currentUser: mockResponse.user,
            token: mockResponse.token,
            refreshToken: mockResponse.refreshToken,
            loginTime: jasmine.any(Date),
            lastActivity: jasmine.any(Date)
          });
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne('/api/v1/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });

    it('應該處理登入失敗', (done) => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      service.login(credentials).subscribe({
        next: () => done.fail('應該拋出錯誤'),
        error: (error) => {
          expect(error).toBeInstanceOf(ApiError);
          expect(error.code).toBe('AUTH_INVALID_CREDENTIALS');
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/auth/login');
      req.flush(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials' } },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('logout', () => {
    it('應該能夠成功登出', (done) => {
      service.logout().subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(authStateService.clearAuthState).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne('/api/v1/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Logged out successfully' });
    });
  });

  describe('refreshToken', () => {
    it('應該能夠刷新令牌', (done) => {
      const refreshToken = 'mock-refresh-token';
      const mockResponse: RefreshTokenResponse = {
        token: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      };

      service.refreshToken(refreshToken).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne('/api/v1/auth/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken });
      req.flush(mockResponse);
    });
  });
});
```

### 2. 用戶服務測試

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let userStateService: jasmine.SpyObj<UserStateService>;

  beforeEach(() => {
    const userStateServiceSpy = jasmine.createSpyObj('UserStateService', [
      'setUserState',
      'updateUserState',
      'getUserState'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: UserStateService, useValue: userStateServiceSpy }
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    userStateService = TestBed.inject(UserStateService) as jasmine.SpyObj<UserStateService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUserProfile', () => {
    it('應該能夠獲取用戶檔案', (done) => {
      const userId = '1';
      const mockProfile: UserProfile = {
        userId: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        bio: 'Software Developer',
        skills: ['Angular', 'TypeScript', 'Firebase'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      service.getUserProfile(userId).subscribe({
        next: (profile) => {
          expect(profile).toEqual(mockProfile);
          expect(userStateService.updateUserState).toHaveBeenCalledWith({ profile: mockProfile });
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`/api/v1/profiles/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProfile });
    });
  });

  describe('updateUserProfile', () => {
    it('應該能夠更新用戶檔案', (done) => {
      const updates: Partial<UserProfile> = {
        firstName: 'Jane',
        lastName: 'Smith',
        bio: 'Updated bio'
      };

      const mockUpdatedProfile: UserProfile = {
        userId: '1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john.doe@example.com',
        bio: 'Updated bio',
        skills: ['Angular', 'TypeScript', 'Firebase'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      service.updateUserProfile(updates).subscribe({
        next: (profile) => {
          expect(profile).toEqual(mockUpdatedProfile);
          expect(userStateService.updateUserState).toHaveBeenCalledWith({ profile: mockUpdatedProfile });
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne('/api/v1/profiles/me');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ data: mockUpdatedProfile });
    });
  });
});
```

### 3. 通知服務測試

```typescript
describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let notificationStateService: jasmine.SpyObj<NotificationStateService>;

  beforeEach(() => {
    const notificationStateServiceSpy = jasmine.createSpyObj('NotificationStateService', [
      'setNotifications',
      'updateNotifications',
      'updateUnreadCount'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NotificationService,
        { provide: NotificationStateService, useValue: notificationStateServiceSpy }
      ]
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    notificationStateService = TestBed.inject(NotificationStateService) as jasmine.SpyObj<NotificationStateService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUserNotifications', () => {
    it('應該能夠獲取用戶通知', (done) => {
      const mockNotifications: NotificationEntity[] = [
        {
          id: '1',
          userId: '1',
          title: 'New Project Update',
          message: 'Your project has been updated',
          type: 'PROJECT_UPDATE',
          status: 'UNREAD',
          priority: 'MEDIUM',
          data: { projectId: '1', projectName: 'Test Project' },
          actions: [],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000)
        }
      ];

      service.getUserNotifications().subscribe({
        next: (notifications) => {
          expect(notifications).toEqual(mockNotifications);
          expect(notificationStateService.setNotifications).toHaveBeenCalledWith(mockNotifications);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne('/api/v1/notifications');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockNotifications });
    });
  });

  describe('markAsRead', () => {
    it('應該能夠標記通知為已讀', (done) => {
      const notificationId = '1';
      const mockUpdatedNotification: NotificationEntity = {
        id: '1',
        userId: '1',
        title: 'New Project Update',
        message: 'Your project has been updated',
        type: 'PROJECT_UPDATE',
        status: 'READ',
        priority: 'MEDIUM',
        data: { projectId: '1', projectName: 'Test Project' },
        actions: [],
        createdAt: new Date(),
        readAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000)
      };

      service.markAsRead(notificationId).subscribe({
        next: (notification) => {
          expect(notification).toEqual(mockUpdatedNotification);
          expect(notificationStateService.updateNotifications).toHaveBeenCalled();
          expect(notificationStateService.updateUnreadCount).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`/api/v1/notifications/${notificationId}/read`);
      expect(req.request.method).toBe('PUT');
      req.flush({ data: mockUpdatedNotification });
    });
  });
});
```

### 4. 成就服務測試

```typescript
describe('AchievementService', () => {
  let service: AchievementService;
  let httpMock: HttpTestingController;
  let achievementStateService: jasmine.SpyObj<AchievementStateService>;

  beforeEach(() => {
    const achievementStateServiceSpy = jasmine.createSpyObj('AchievementStateService', [
      'setAchievements',
      'updateAchievements',
      'updateTotalPoints'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AchievementService,
        { provide: AchievementStateService, useValue: achievementStateServiceSpy }
      ]
    });

    service = TestBed.inject(AchievementService);
    httpMock = TestBed.inject(HttpTestingController);
    achievementStateService = TestBed.inject(AchievementStateService) as jasmine.SpyObj<AchievementStateService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUserAchievements', () => {
    it('應該能夠獲取用戶成就', (done) => {
      const mockAchievements: UserAchievement[] = [
        {
          id: '1',
          userId: '1',
          achievementId: '1',
          status: 'UNLOCKED',
          progress: 100,
          achievementData: {
            progressTracking: {
              currentValue: 100,
              targetValue: 100,
              milestones: []
            },
            statistics: {
              timesUnlocked: 1,
              totalPointsEarned: 100
            },
            personalization: {
              tags: [],
              isFavorite: false
            }
          },
          unlockedAt: new Date(),
          lastProgressUpdate: new Date()
        }
      ];

      service.getUserAchievements().subscribe({
        next: (achievements) => {
          expect(achievements).toEqual(mockAchievements);
          expect(achievementStateService.setAchievements).toHaveBeenCalledWith(mockAchievements);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne('/api/v1/achievements/me');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockAchievements });
    });
  });

  describe('unlockAchievement', () => {
    it('應該能夠解鎖成就', (done) => {
      const achievementId = '1';
      const mockResponse: UnlockAchievementResponse = {
        achievement: {
          id: '1',
          userId: '1',
          achievementId: '1',
          status: 'UNLOCKED',
          progress: 100,
          achievementData: {
            progressTracking: {
              currentValue: 100,
              targetValue: 100,
              milestones: []
            },
            statistics: {
              timesUnlocked: 1,
              totalPointsEarned: 100
            },
            personalization: {
              tags: [],
              isFavorite: false
            }
          },
          unlockedAt: new Date(),
          lastProgressUpdate: new Date()
        },
        pointsEarned: 100,
        levelUp: true,
        newLevel: 2
      };

      service.unlockAchievement(achievementId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(achievementStateService.updateAchievements).toHaveBeenCalled();
          expect(achievementStateService.updateTotalPoints).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`/api/v1/achievements/${achievementId}/unlock`);
      expect(req.request.method).toBe('POST');
      req.flush({ data: mockResponse });
    });
  });
});
```

## 組件測試

### 1. 登入組件測試

```typescript
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, NoopAnimationsModule],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('應該建立組件', () => {
    expect(component).toBeTruthy();
  });

  it('應該初始化表單', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')).toBeDefined();
    expect(component.loginForm.get('password')).toBeDefined();
    expect(component.loginForm.get('rememberMe')).toBeDefined();
  });

  it('應該驗證必填欄位', () => {
    const emailControl = component.loginForm.get('email');
    const passwordControl = component.loginForm.get('password');

    emailControl?.setValue('');
    passwordControl?.setValue('');

    expect(emailControl?.hasError('required')).toBe(true);
    expect(passwordControl?.hasError('required')).toBe(true);
  });

  it('應該驗證電子郵件格式', () => {
    const emailControl = component.loginForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);

    emailControl?.setValue('valid@example.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('應該處理登入成功', (done) => {
    const mockResponse: LoginResponse = {
      user: { id: '1', email: 'test@example.com', displayName: 'Test User' },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      sessionId: 'mock-session-id'
    };

    authService.login.and.returnValue(of(mockResponse));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    });

    setTimeout(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    }, 100);
  });

  it('應該處理登入失敗', (done) => {
    const error = new ApiError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
    authService.login.and.returnValue(throwError(() => error));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword'
    });

    component.onSubmit();

    setTimeout(() => {
      expect(component.errorMessage).toBe('Invalid credentials');
      done();
    }, 100);
  });

  it('應該顯示載入狀態', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(submitButton.nativeElement.disabled).toBe(true);
  });
});
```

### 2. 用戶檔案組件測試

```typescript
describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let userStateService: jasmine.SpyObj<UserStateService>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUserProfile', 'updateUserProfile']);
    const userStateServiceSpy = jasmine.createSpyObj('UserStateService', ['profile', 'updateUserProfile']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, NoopAnimationsModule],
      declarations: [UserProfileComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: UserStateService, useValue: userStateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    userStateService = TestBed.inject(UserStateService) as jasmine.SpyObj<UserStateService>;
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('應該建立組件', () => {
    expect(component).toBeTruthy();
  });

  it('應該載入用戶檔案', (done) => {
    const mockProfile: UserProfile = {
      userId: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      bio: 'Software Developer',
      skills: ['Angular', 'TypeScript'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    userService.getUserProfile.and.returnValue(of(mockProfile));

    component.ngOnInit();

    expect(userService.getUserProfile).toHaveBeenCalledWith('1');
    
    setTimeout(() => {
      expect(component.profile).toEqual(mockProfile);
      done();
    }, 100);
  });

  it('應該更新用戶檔案', (done) => {
    const updates = {
      firstName: 'Jane',
      lastName: 'Smith',
      bio: 'Updated bio'
    };

    const mockUpdatedProfile: UserProfile = {
      userId: '1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'john.doe@example.com',
      bio: 'Updated bio',
      skills: ['Angular', 'TypeScript'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    userService.updateUserProfile.and.returnValue(of(mockUpdatedProfile));

    component.updateProfile(updates);

    expect(userService.updateUserProfile).toHaveBeenCalledWith(updates);
    
    setTimeout(() => {
      expect(component.profile).toEqual(mockUpdatedProfile);
      done();
    }, 100);
  });

  it('應該驗證表單欄位', () => {
    const firstNameControl = component.profileForm.get('firstName');
    const lastNameControl = component.profileForm.get('lastName');

    firstNameControl?.setValue('');
    lastNameControl?.setValue('');

    expect(firstNameControl?.hasError('required')).toBe(true);
    expect(lastNameControl?.hasError('required')).toBe(true);
  });
});
```

### 3. 通知組件測試

```typescript
describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let notificationStateService: jasmine.SpyObj<NotificationStateService>;

  beforeEach(async () => {
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'getUserNotifications',
      'markAsRead',
      'markAllAsRead',
      'deleteNotification'
    ]);
    const notificationStateServiceSpy = jasmine.createSpyObj('NotificationStateService', [
      'notifications',
      'unreadCount',
      'markAsRead',
      'markAllAsRead',
      'deleteNotification'
    ]);

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      declarations: [NotificationComponent],
      providers: [
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: NotificationStateService, useValue: notificationStateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    notificationStateService = TestBed.inject(NotificationStateService) as jasmine.SpyObj<NotificationStateService>;
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('應該建立組件', () => {
    expect(component).toBeTruthy();
  });

  it('應該載入通知', (done) => {
    const mockNotifications: NotificationEntity[] = [
      {
        id: '1',
        userId: '1',
        title: 'New Project Update',
        message: 'Your project has been updated',
        type: 'PROJECT_UPDATE',
        status: 'UNREAD',
        priority: 'MEDIUM',
        data: { projectId: '1', projectName: 'Test Project' },
        actions: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000)
      }
    ];

    notificationService.getUserNotifications.and.returnValue(of(mockNotifications));

    component.ngOnInit();

    expect(notificationService.getUserNotifications).toHaveBeenCalled();
    
    setTimeout(() => {
      expect(component.notifications).toEqual(mockNotifications);
      done();
    }, 100);
  });

  it('應該標記通知為已讀', (done) => {
    const notificationId = '1';
    const mockUpdatedNotification: NotificationEntity = {
      id: '1',
      userId: '1',
      title: 'New Project Update',
      message: 'Your project has been updated',
      type: 'PROJECT_UPDATE',
      status: 'READ',
      priority: 'MEDIUM',
      data: { projectId: '1', projectName: 'Test Project' },
      actions: [],
      createdAt: new Date(),
      readAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000)
    };

    notificationService.markAsRead.and.returnValue(of(mockUpdatedNotification));

    component.markAsRead(notificationId);

    expect(notificationService.markAsRead).toHaveBeenCalledWith(notificationId);
    
    setTimeout(() => {
      expect(component.notifications[0].status).toBe('READ');
      done();
    }, 100);
  });

  it('應該標記所有通知為已讀', (done) => {
    notificationService.markAllAsRead.and.returnValue(of(undefined));

    component.markAllAsRead();

    expect(notificationService.markAllAsRead).toHaveBeenCalled();
    
    setTimeout(() => {
      expect(component.notifications.every(n => n.status === 'READ')).toBe(true);
      done();
    }, 100);
  });

  it('應該刪除通知', (done) => {
    const notificationId = '1';
    notificationService.deleteNotification.and.returnValue(of({ success: true, message: 'Deleted' }));

    component.deleteNotification(notificationId);

    expect(notificationService.deleteNotification).toHaveBeenCalledWith(notificationId);
    
    setTimeout(() => {
      expect(component.notifications.find(n => n.id === notificationId)).toBeUndefined();
      done();
    }, 100);
  });
});
```

## 整合測試

### 1. 認證流程整合測試

```typescript
describe('Authentication Flow Integration', () => {
  let authService: AuthService;
  let userService: UserService;
  let authStateService: AuthStateService;
  let userStateService: UserStateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        UserService,
        AuthStateService,
        UserStateService
      ]
    });

    authService = TestBed.inject(AuthService);
    userService = TestBed.inject(UserService);
    authStateService = TestBed.inject(AuthStateService);
    userStateService = TestBed.inject(UserStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('應該完成完整的登入流程', (done) => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockLoginResponse: LoginResponse = {
      user: { id: '1', email: 'test@example.com', displayName: 'Test User' },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      sessionId: 'mock-session-id'
    };

    const mockProfile: UserProfile = {
      userId: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      bio: 'Software Developer',
      skills: ['Angular', 'TypeScript'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 執行登入
    authService.login(credentials).subscribe({
      next: (loginResponse) => {
        expect(loginResponse).toEqual(mockLoginResponse);
        
        // 驗證認證狀態已更新
        expect(authStateService.isAuthenticated()).toBe(true);
        expect(authStateService.currentUser()).toEqual(mockLoginResponse.user);
        
        // 載入用戶檔案
        userService.getUserProfile('1').subscribe({
          next: (profile) => {
            expect(profile).toEqual(mockProfile);
            
            // 驗證用戶狀態已更新
            expect(userStateService.profile()).toEqual(mockProfile);
            done();
          },
          error: done.fail
        });
      },
      error: done.fail
    });

    // 模擬登入請求
    const loginReq = httpMock.expectOne('/api/v1/auth/login');
    loginReq.flush(mockLoginResponse);

    // 模擬獲取用戶檔案請求
    const profileReq = httpMock.expectOne('/api/v1/profiles/1');
    profileReq.flush({ data: mockProfile });
  });
});
```

### 2. 通知系統整合測試

```typescript
describe('Notification System Integration', () => {
  let notificationService: NotificationService;
  let notificationStateService: NotificationStateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NotificationService,
        NotificationStateService
      ]
    });

    notificationService = TestBed.inject(NotificationService);
    notificationStateService = TestBed.inject(NotificationStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('應該完成通知的完整生命週期', (done) => {
    const mockNotifications: NotificationEntity[] = [
      {
        id: '1',
        userId: '1',
        title: 'New Project Update',
        message: 'Your project has been updated',
        type: 'PROJECT_UPDATE',
        status: 'UNREAD',
        priority: 'MEDIUM',
        data: { projectId: '1', projectName: 'Test Project' },
        actions: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000)
      }
    ];

    // 載入通知
    notificationService.getUserNotifications().subscribe({
      next: (notifications) => {
        expect(notifications).toEqual(mockNotifications);
        expect(notificationStateService.notifications()).toEqual(mockNotifications);
        expect(notificationStateService.unreadCount()).toBe(1);
        
        // 標記為已讀
        notificationService.markAsRead('1').subscribe({
          next: (updatedNotification) => {
            expect(updatedNotification.status).toBe('READ');
            expect(notificationStateService.unreadCount()).toBe(0);
            done();
          },
          error: done.fail
        });
      },
      error: done.fail
    });

    // 模擬獲取通知請求
    const getReq = httpMock.expectOne('/api/v1/notifications');
    getReq.flush({ data: mockNotifications });

    // 模擬標記為已讀請求
    const markReq = httpMock.expectOne('/api/v1/notifications/1/read');
    markReq.flush({ data: { ...mockNotifications[0], status: 'READ', readAt: new Date() } });
  });
});
```

## 端對端測試

### 1. 登入流程 E2E 測試

```typescript
describe('Login Flow E2E', () => {
  let page: LoginPage;

  beforeEach(() => {
    page = new LoginPage();
  });

  it('應該能夠成功登入', async () => {
    await page.navigateTo();
    
    await page.enterEmail('test@example.com');
    await page.enterPassword('password123');
    await page.clickLoginButton();
    
    await page.waitForDashboard();
    
    expect(await page.getCurrentUrl()).toContain('/dashboard');
    expect(await page.getUserDisplayName()).toBe('Test User');
  });

  it('應該處理登入失敗', async () => {
    await page.navigateTo();
    
    await page.enterEmail('invalid@example.com');
    await page.enterPassword('wrongpassword');
    await page.clickLoginButton();
    
    await page.waitForErrorMessage();
    
    expect(await page.getErrorMessage()).toBe('Invalid credentials');
  });

  it('應該驗證表單欄位', async () => {
    await page.navigateTo();
    
    await page.clickLoginButton();
    
    expect(await page.getEmailError()).toBe('Email is required');
    expect(await page.getPasswordError()).toBe('Password is required');
  });
});

class LoginPage {
  async navigateTo(): Promise<void> {
    await browser.get('/login');
  }

  async enterEmail(email: string): Promise<void> {
    await element(by.css('input[formControlName="email"]')).sendKeys(email);
  }

  async enterPassword(password: string): Promise<void> {
    await element(by.css('input[formControlName="password"]')).sendKeys(password);
  }

  async clickLoginButton(): Promise<void> {
    await element(by.css('button[type="submit"]')).click();
  }

  async waitForDashboard(): Promise<void> {
    await browser.wait(ExpectedConditions.urlContains('/dashboard'), 5000);
  }

  async waitForErrorMessage(): Promise<void> {
    await browser.wait(ExpectedConditions.presenceOf(element(by.css('.error-message'))), 5000);
  }

  async getCurrentUrl(): Promise<string> {
    return await browser.getCurrentUrl();
  }

  async getUserDisplayName(): Promise<string> {
    return await element(by.css('.user-display-name')).getText();
  }

  async getErrorMessage(): Promise<string> {
    return await element(by.css('.error-message')).getText();
  }

  async getEmailError(): Promise<string> {
    return await element(by.css('.email-error')).getText();
  }

  async getPasswordError(): Promise<string> {
    return await element(by.css('.password-error')).getText();
  }
}
```

### 2. 用戶檔案管理 E2E 測試

```typescript
describe('User Profile Management E2E', () => {
  let page: ProfilePage;

  beforeEach(async () => {
    page = new ProfilePage();
    await page.loginAsTestUser();
  });

  it('應該能夠更新用戶檔案', async () => {
    await page.navigateToProfile();
    
    await page.updateFirstName('Jane');
    await page.updateLastName('Smith');
    await page.updateBio('Updated bio');
    await page.clickSaveButton();
    
    await page.waitForSuccessMessage();
    
    expect(await page.getSuccessMessage()).toBe('Profile updated successfully');
    expect(await page.getFirstName()).toBe('Jane');
    expect(await page.getLastName()).toBe('Smith');
    expect(await page.getBio()).toBe('Updated bio');
  });

  it('應該能夠上傳頭像', async () => {
    await page.navigateToProfile();
    
    await page.uploadAvatar('test-avatar.jpg');
    await page.waitForAvatarUpdate();
    
    expect(await page.getAvatarUrl()).toContain('avatar');
  });
});

class ProfilePage {
  async loginAsTestUser(): Promise<void> {
    await browser.get('/login');
    await element(by.css('input[formControlName="email"]')).sendKeys('test@example.com');
    await element(by.css('input[formControlName="password"]')).sendKeys('password123');
    await element(by.css('button[type="submit"]')).click();
    await browser.wait(ExpectedConditions.urlContains('/dashboard'), 5000);
  }

  async navigateToProfile(): Promise<void> {
    await browser.get('/profile');
  }

  async updateFirstName(firstName: string): Promise<void> {
    await element(by.css('input[formControlName="firstName"]')).clear();
    await element(by.css('input[formControlName="firstName"]')).sendKeys(firstName);
  }

  async updateLastName(lastName: string): Promise<void> {
    await element(by.css('input[formControlName="lastName"]')).clear();
    await element(by.css('input[formControlName="lastName"]')).sendKeys(lastName);
  }

  async updateBio(bio: string): Promise<void> {
    await element(by.css('textarea[formControlName="bio"]')).clear();
    await element(by.css('textarea[formControlName="bio"]')).sendKeys(bio);
  }

  async clickSaveButton(): Promise<void> {
    await element(by.css('button[type="submit"]')).click();
  }

  async waitForSuccessMessage(): Promise<void> {
    await browser.wait(ExpectedConditions.presenceOf(element(by.css('.success-message'))), 5000);
  }

  async getSuccessMessage(): Promise<string> {
    return await element(by.css('.success-message')).getText();
  }

  async getFirstName(): Promise<string> {
    return await element(by.css('input[formControlName="firstName"]')).getAttribute('value');
  }

  async getLastName(): Promise<string> {
    return await element(by.css('input[formControlName="lastName"]')).getAttribute('value');
  }

  async getBio(): Promise<string> {
    return await element(by.css('textarea[formControlName="bio"]')).getAttribute('value');
  }

  async uploadAvatar(fileName: string): Promise<void> {
    await element(by.css('input[type="file"]')).sendKeys(fileName);
  }

  async waitForAvatarUpdate(): Promise<void> {
    await browser.wait(ExpectedConditions.presenceOf(element(by.css('.avatar-updated'))), 5000);
  }

  async getAvatarUrl(): Promise<string> {
    return await element(by.css('.avatar-image')).getAttribute('src');
  }
}
```

## 效能測試

### 1. 載入效能測試

```typescript
describe('Performance Tests', () => {
  let authService: AuthService;
  let userService: UserService;
  let notificationService: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, UserService, NotificationService]
    });

    authService = TestBed.inject(AuthService);
    userService = TestBed.inject(UserService);
    notificationService = TestBed.inject(NotificationService);
  });

  it('登入請求應該在 2 秒內完成', (done) => {
    const startTime = performance.now();
    
    authService.login({
      email: 'test@example.com',
      password: 'password123'
    }).subscribe({
      next: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(2000);
        done();
      },
      error: done.fail
    });
  });

  it('載入用戶檔案應該在 1 秒內完成', (done) => {
    const startTime = performance.now();
    
    userService.getUserProfile('1').subscribe({
      next: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(1000);
        done();
      },
      error: done.fail
    });
  });

  it('載入通知應該在 1.5 秒內完成', (done) => {
    const startTime = performance.now();
    
    notificationService.getUserNotifications().subscribe({
      next: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(1500);
        done();
      },
      error: done.fail
    });
  });
});
```

### 2. 記憶體使用測試

```typescript
describe('Memory Usage Tests', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      declarations: [NotificationComponent],
      providers: [
        { provide: NotificationService, useClass: MockNotificationService },
        { provide: NotificationStateService, useClass: MockNotificationStateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
  });

  it('組件應該正確清理記憶體', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    fixture.detectChanges();
    component.ngOnDestroy();
    
    // 強制垃圾回收
    if (window.gc) {
      window.gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // 記憶體增加應該小於 1MB
    expect(memoryIncrease).toBeLessThan(1024 * 1024);
  });
});
```

## 測試工具和配置

### 1. Jest 配置

```typescript
// jest.config.js
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.enum.ts',
    '!src/**/*.module.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/account-module/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|html)$': 'ts-jest'
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### 2. 測試設定檔

```typescript
// src/test-setup.ts
import 'jest-preset-angular/setup-jest';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// 全域測試設定
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [NoopAnimationsModule]
  });
});

// 模擬 Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn()
}));
```

### 3. 測試腳本

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "jest --testNamePattern='Performance'",
    "test:integration": "jest --testNamePattern='Integration'"
  }
}
```

## 測試最佳實踐

### 1. 測試命名規範
- **描述性**: 使用描述性的測試名稱
- **一致性**: 使用一致的命名模式
- **分組**: 使用 `describe` 和 `it` 進行適當分組

### 2. 測試結構
- **AAA 模式**: Arrange, Act, Assert
- **單一職責**: 每個測試只測試一個功能
- **獨立性**: 測試之間應該相互獨立

### 3. 模擬和存根
- **適當使用**: 適當使用模擬和存根
- **真實性**: 模擬應該盡可能真實
- **維護性**: 模擬應該易於維護

### 4. 測試覆蓋率
- **目標**: 設定適當的覆蓋率目標
- **品質**: 關注測試品質而非數量
- **持續監控**: 持續監控覆蓋率變化

### 5. 效能測試
- **基準**: 建立效能基準
- **監控**: 持續監控效能變化
- **優化**: 根據測試結果進行優化
