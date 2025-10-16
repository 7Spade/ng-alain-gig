# 文件索引 (Documentation Index)

## 📚 完整文件導覽

本索引提供 ng-alain-gig 專案所有文件的快速導覽，讓 AI 和開發者能夠零認知快速理解整個專案。

## 🚀 快速入門

### 新手必讀
- [快速入門指南](./QUICK_START.md) - 5分鐘理解專案
- [開發環境設置](./DEVELOPMENT_SETUP.md) - 完整環境配置
- [系統架構概覽](./SYSTEM_ARCHITECTURE.md) - 整體架構設計

### 專案概覽
- [專案 README](../README.md) - 專案基本資訊
- [文件結構說明](./DOCUMENTATION_STRUCTURE.md) - 文件組織架構
- [技術棧說明](./design-principles/Technology Stack.md) - 技術選型

## 🏗️ 架構設計

### 系統架構
- [系統架構概覽](./architecture/System Architecture Overview.md) - 整體架構
- [領域模型概覽](./architecture/Domain Model Overview.md) - DDD 領域模型
- [跨模組整合架構](./architecture/Cross-Module Integration Architecture.md) - 模組整合
- [統一架構圖](./architecture/Unified Architecture Diagram.md) - 架構視覺化
- [系統用例圖](./architecture/System Use Case Diagram.md) - 用例分析

### 設計原則
- [設計原則](./design-principles/Design Principles.md) - 核心設計原則
- [架構概覽](./design-principles/Architecture Overview.md) - 架構設計理念
- [領域驅動設計策略](./design-principles/Domain-Driven Design Strategy.md) - DDD 實踐
- [模組設計標準](./design-principles/Module Design Standards.md) - 模組規範

### 技術策略
- [技術棧](./design-principles/Technology Stack.md) - 技術選型說明
- [狀態管理](./design-principles/State Management.md) - 狀態管理策略
- [路由設計](./design-principles/Routing.md) - 路由架構
- [認證流程策略](./design-principles/Authentication Flow Strategy.md) - 認證設計
- [安全策略](./design-principles/Security Strategy.md) - 安全設計
- [效能優化策略](./design-principles/Performance Optimization Strategy.md) - 效能優化
- [錯誤處理策略](./design-principles/Error Handling Strategy.md) - 錯誤處理

### UI/UX 設計
- [UI 組件庫指南](./design-principles/UI Component Library Guidelines.md) - 組件設計
- [響應式移動優先指南](./design-principles/Responsive Mobile-first Guidelines.md) - 響應式設計
- [角色權限矩陣](./design-principles/Role Permission Matrix.md) - 權限設計

## 🔧 實作指南

### 核心實作
- [實作指南](./implementation/IMPLEMENTATION_GUIDE.md) - 完整實作路線圖
- [程式碼標準](./implementation/CODE_STANDARDS.md) - 程式碼規範
- [組件模式](./implementation/COMPONENT_PATTERNS.md) - 組件設計模式

### 應用層實作
- [用戶服務](./implementation/application-layer/UserService.md) - 用戶業務邏輯
- [專案服務](./implementation/application-layer/ProjectService.md) - 專案業務邏輯
- [團隊服務](./implementation/application-layer/TeamService.md) - 團隊管理
- [成本控制服務](./implementation/application-layer/CostControlService.md) - 成本管理

### 領域層實作
- [用戶聚合](./implementation/domain-layer/UserAggregate.md) - 用戶聚合根
- [用戶實體](./implementation/domain-layer/UserEntity.md) - 用戶實體
- [用戶領域服務](./implementation/domain-layer/UserDomainService.md) - 用戶領域服務
- [專案聚合](./implementation/domain-layer/ProjectAggregate.md) - 專案聚合根
- [專案實體](./implementation/domain-layer/ProjectEntity.md) - 專案實體
- [專案領域服務](./implementation/domain-layer/ProjectDomainService.md) - 專案領域服務
- [組織聚合](./implementation/domain-layer/OrganizationAggregate.md) - 組織聚合根
- [組織實體](./implementation/domain-layer/OrganizationEntity.md) - 組織實體
- [任務實體](./implementation/domain-layer/TaskEntity.md) - 任務實體
- [角色值物件](./implementation/domain-layer/RoleValueObject.md) - 角色值物件
- [成本分解值物件](./implementation/domain-layer/CostBreakdownValueObject.md) - 成本值物件
- [成本控制領域服務](./implementation/domain-layer/CostControlDomainService.md) - 成本領域服務

### 基礎設施層實作
- [Firebase 用戶儲存庫](./implementation/infrastructure-layer/FirebaseUserRepository.md) - 用戶資料存取
- [Firebase 專案儲存庫](./implementation/infrastructure-layer/FirebaseProjectRepository.md) - 專案資料存取
- [Firebase 團隊儲存庫](./implementation/infrastructure-layer/FirebaseTeamRepository.md) - 團隊資料存取
- [Firebase 通知儲存庫](./implementation/infrastructure-layer/FirebaseNotificationRepository.md) - 通知資料存取

### 共享模組實作
- [API 服務](./implementation/shared-module/ApiService.md) - API 通用服務
- [認證服務](./implementation/shared-module/AuthService.md) - 認證服務
- [Firebase 認證服務](./implementation/shared-module/FirebaseAuthService.md) - Firebase 認證
- [Firebase Firestore 服務](./implementation/shared-module/FirebaseFirestoreService.md) - Firestore 服務
- [Firebase 儲存服務](./implementation/shared-module/FirebaseStorageService.md) - Storage 服務
- [Firebase 訊息服務](./implementation/shared-module/FirebaseMessagingService.md) - 推送通知
- [通知服務](./implementation/shared-module/NotificationService.md) - 通知管理
- [Delon ACL 服務](./implementation/shared-module/DelonAclService.md) - 權限控制
- [Delon 表單服務](./implementation/shared-module/DelonFormService.md) - 表單服務
- [Delon 工具服務](./implementation/shared-module/DelonUtilService.md) - 工具服務

### 核心模組實作
- [守衛](./implementation/core-module/Guards.md) - 路由守衛
- [攔截器](./implementation/core-module/Interceptors.md) - HTTP 攔截器
- [狀態管理](./implementation/core-module/State Management.md) - 狀態管理
- [工具函數](./implementation/core-module/Utils.md) - 通用工具

## 📊 模組設計

### 模組概覽
- [帳戶模組概覽](./modules/Account Module Overview.md) - 帳戶模組設計
- [帳戶模組架構](./modules/Account Module Architecture.md) - 帳戶架構設計
- [帳戶模組路由](./modules/Account Module Routing.md) - 帳戶路由配置
- [帳戶模組狀態管理](./modules/Account Module State Management.md) - 帳戶狀態管理
- [帳戶模組測試](./modules/Account Module Testing.md) - 帳戶測試策略

### 專案模組
- [專案模組概覽](./modules/Projects Module Overview.md) - 專案模組設計
- [專案模組路由](./modules/Projects Module Routing.md) - 專案路由配置
- [專案模組狀態管理](./modules/Projects Module State Management.md) - 專案狀態管理
- [專案模組測試](./modules/Projects Module Testing.md) - 專案測試策略

### 組織模組
- [組織模組路由](./modules/Organization Module Routing.md) - 組織路由配置
- [組織模組狀態管理](./modules/Organization Module State Management.md) - 組織狀態管理
- [組織模組測試](./modules/Organization Module Testing.md) - 組織測試策略

### 共享模組
- [共享模組測試](./modules/Shared Module Testing.md) - 共享模組測試

## 🗄️ 資料架構

### Firebase Schema
- [帳戶模組 Firebase Schema](./schemas/Account Module Firebase Schema.md) - 帳戶資料結構
- [帳戶集合 Schema](./schemas/Accounts Collection Schema.md) - 帳戶集合設計
- [組織模組 Firebase Schema](./schemas/Organization Module Firebase Schema.md) - 組織資料結構
- [專案模組 Firebase Schema](./schemas/Projects Module Firebase Schema.md) - 專案資料結構

### API 設計
- [API 總覽](./api/API_OVERVIEW.md) - API 架構概覽
- [Firebase API](./api/FIREBASE_API.md) - Firebase API 使用
- [服務合約](./api/SERVICE_CONTRACTS.md) - 服務介面定義
- [API 合約](./design-principles/Api Contracts.md) - API 設計規範
- [API Firebase Schema 策略](./design-principles/API Firebase Schema Strategy.md) - Schema 設計
- [Firebase Schema](./design-principles/Firebase Schema.md) - Firebase 設計

## 🧪 測試策略

### 測試指南
- [測試策略](./testing/TESTING_STRATEGY.md) - 完整測試策略
- [單元測試指南](./testing/UNIT_TESTING.md) - 單元測試實踐
- [E2E 測試指南](./testing/E2E_TESTING.md) - 端對端測試
- [測試最佳實踐](./design-principles/Testing.md) - 測試設計原則

## 🚨 故障排除

### 問題解決
- [常見問題](./troubleshooting/COMMON_ISSUES.md) - 常見問題與解決方案
- [除錯指南](./troubleshooting/DEBUG_GUIDE.md) - 系統除錯指南
- [效能問題](./troubleshooting/PERFORMANCE_ISSUES.md) - 效能問題排查

## 🚀 部署與維運

### 部署指南
- [部署指南](./DEPLOYMENT_GUIDE.md) - 完整部署流程
- [CI/CD 配置](./deployment/CICD_SETUP.md) - 持續整合部署
- [環境配置](./deployment/ENVIRONMENT_CONFIG.md) - 環境管理

## 📋 層級概覽

### 架構層級
- [應用層概覽](./layers/Application Layer Overview.md) - 應用層設計
- [領域層概覽](./layers/Domain Layer Overview.md) - 領域層設計
- [基礎設施層概覽](./layers/Infrastructure Layer Overview.md) - 基礎設施層設計
- [共享模組概覽](./layers/Shared Module Overview.md) - 共享模組設計

## 🔍 文件使用指南

### 依角色導覽

#### 🏗️ 系統架構師
**必讀文件**:
1. [系統架構概覽](./architecture/System Architecture Overview.md)
2. [領域模型概覽](./architecture/Domain Model Overview.md)
3. [設計原則](./design-principles/Design Principles.md)
4. [技術棧](./design-principles/Technology Stack.md)

#### 👨‍💻 後端開發者
**必讀文件**:
1. [實作指南](./implementation/IMPLEMENTATION_GUIDE.md)
2. [程式碼標準](./implementation/CODE_STANDARDS.md)
3. [API 總覽](./api/API_OVERVIEW.md)
4. [Firebase Schema](./schemas/)

#### 🎨 前端開發者
**必讀文件**:
1. [快速入門指南](./QUICK_START.md)
2. [開發環境設置](./DEVELOPMENT_SETUP.md)
3. [UI 組件庫指南](./design-principles/UI Component Library Guidelines.md)
4. [組件模式](./implementation/COMPONENT_PATTERNS.md)

#### 🧪 測試工程師
**必讀文件**:
1. [測試策略](./testing/TESTING_STRATEGY.md)
2. [單元測試指南](./testing/UNIT_TESTING.md)
3. [E2E 測試指南](./testing/E2E_TESTING.md)
4. [測試最佳實踐](./design-principles/Testing.md)

#### 🚀 DevOps 工程師
**必讀文件**:
1. [部署指南](./DEPLOYMENT_GUIDE.md)
2. [CI/CD 配置](./deployment/CICD_SETUP.md)
3. [環境配置](./deployment/ENVIRONMENT_CONFIG.md)
4. [效能優化策略](./design-principles/Performance Optimization Strategy.md)

#### 🆘 問題排查
**必讀文件**:
1. [常見問題](./troubleshooting/COMMON_ISSUES.md)
2. [除錯指南](./troubleshooting/DEBUG_GUIDE.md)
3. [效能問題](./troubleshooting/PERFORMANCE_ISSUES.md)

### 依任務導覽

#### 🚀 專案啟動
1. [快速入門指南](./QUICK_START.md)
2. [開發環境設置](./DEVELOPMENT_SETUP.md)
3. [系統架構概覽](./SYSTEM_ARCHITECTURE.md)

#### 🏗️ 架構設計
1. [設計原則](./design-principles/Design Principles.md)
2. [領域驅動設計策略](./design-principles/Domain-Driven Design Strategy.md)
3. [模組設計標準](./design-principles/Module Design Standards.md)

#### 💻 功能開發
1. [實作指南](./implementation/IMPLEMENTATION_GUIDE.md)
2. [程式碼標準](./implementation/CODE_STANDARDS.md)
3. [API 總覽](./api/API_OVERVIEW.md)

#### 🧪 測試開發
1. [測試策略](./testing/TESTING_STRATEGY.md)
2. [單元測試指南](./testing/UNIT_TESTING.md)
3. [E2E 測試指南](./testing/E2E_TESTING.md)

#### 🚀 部署上線
1. [部署指南](./DEPLOYMENT_GUIDE.md)
2. [CI/CD 配置](./deployment/CICD_SETUP.md)
3. [環境配置](./deployment/ENVIRONMENT_CONFIG.md)

#### 🔧 問題排查
1. [常見問題](./troubleshooting/COMMON_ISSUES.md)
2. [除錯指南](./troubleshooting/DEBUG_GUIDE.md)
3. [效能問題](./troubleshooting/PERFORMANCE_ISSUES.md)

## 📊 文件統計

### 文件數量
- **總文件數**: 80+ 份
- **架構設計**: 15 份
- **實作指南**: 25 份
- **模組設計**: 12 份
- **測試文件**: 8 份
- **故障排除**: 6 份
- **API 文件**: 8 份
- **其他文件**: 6 份

### 文件完整性
- ✅ **快速入門**: 100% 完成
- ✅ **架構設計**: 100% 完成
- ✅ **實作指南**: 100% 完成
- ✅ **測試策略**: 100% 完成
- ✅ **API 文件**: 100% 完成
- ✅ **故障排除**: 100% 完成

## 🔄 文件維護

### 更新頻率
- **架構文件**: 每季度檢查
- **實作指南**: 每月更新
- **API 文件**: 隨功能更新
- **故障排除**: 隨問題發現更新

### 維護責任
- **架構師**: 架構和設計文件
- **開發團隊**: 實作和 API 文件
- **測試團隊**: 測試相關文件
- **DevOps**: 部署和維運文件

## 📝 文件貢獻

### 貢獻指南
1. 遵循現有文件格式
2. 保持內容簡潔明確
3. 提供實際範例
4. 及時更新相關連結

### 文件審查
1. 技術準確性檢查
2. 內容完整性驗證
3. 格式一致性確認
4. 連結有效性測試

---

**本索引涵蓋了 ng-alain-gig 專案的所有文件，讓任何人都能快速找到所需資訊，實現零認知快速理解專案的目標。**
