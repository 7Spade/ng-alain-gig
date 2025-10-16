// Shared 共享工具模組 - 佔位檔案
// TODO: 實作共享工具邏輯

export interface SharedUtility {
  name: string;
  version: string;
}

export class SharedService {
  // TODO: 實作共享工具方法
  getUtility(name: string): SharedUtility | null {
    return null;
  }

  // TODO: 實作工具註冊方法
  registerUtility(utility: SharedUtility): void {
    // 佔位實作
  }
}

// 預設匯出
export * from './shared.service';
export * from './utils';
