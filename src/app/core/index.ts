// 核心模組匯出 - 對齊 README.md 架構設計

// Auth - 認證核心
export * from './auth';

// ACL - 權限控制
export * from './acl';

// Event Bus - 事件匯流排
export * from './event-bus';

// Infrastructure - 基礎設施
export * from './infrastructure';

// Startup - 應用啟動服務 ✨ (現有)
export * from './startup/startup.service';

// Net - 網路服務 ✨ (現有)
export * from './auth/interceptors';

// I18n - 國際化服務 ✨ (現有)
export * from './i18n/i18n.service';

// Shared - 共享工具
export * from './shared';

// Start Page Guard - 啟動頁面守衛 ✨ (現有)
export * from './startup/guards/start-page.guard';
