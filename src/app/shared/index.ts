// 共享模組匯出 - 漸進式重構方案

// ===== LEGACY 模組 (現有，保留相容性) =====
export * from './cell-widget/index';
export * from './st-widget/index';
export * from './json-schema/index';
export * from './utils/yuan';
export * from './shared-imports';
export * from './shared-delon.module';
export * from './shared-zorro.module';

// ===== 新架構模組 (DDD) =====
// 注意：以下模組尚未建立，將在未來開發中逐步實現

// Components - 共享元件 (新架構)
// export * from './components';

// Services - 共享服務 (新架構)
// export * from './services';

// Models - 共享模型 (新架構)
// export * from './models';

// Pipes - 共享管道 (新架構)
// export * from './pipes';

// Directives - 共享指令 (新架構)
// export * from './directives';

// Validators - 共享驗證器 (新架構)
// export * from './validators';

// Guards - 共享守衛 (新架構)
// export * from './guards';

// Interceptors - 共享攔截器 (新架構)
// export * from './interceptors';

// Utils - 工具函數 (新架構)
// export * from './utils';

// Constants - 常數定義 (新架構)
// export * from './constants';
