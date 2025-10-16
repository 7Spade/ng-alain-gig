// Shared 共享工具服務 - 佔位檔案
// TODO: 實作完整的共享工具邏輯

import { Injectable } from '@angular/core';

export interface SharedUtility {
  name: string;
  version: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private utilities: Map<string, SharedUtility> = new Map();

  // TODO: 實作共享工具方法
  getUtility(name: string): SharedUtility | null {
    return this.utilities.get(name) || null;
  }

  // TODO: 實作工具註冊方法
  registerUtility(utility: SharedUtility): void {
    this.utilities.set(utility.name, utility);
  }

  // TODO: 實作工具列表方法
  listUtilities(): SharedUtility[] {
    return Array.from(this.utilities.values());
  }

  // TODO: 實作工具移除方法
  removeUtility(name: string): boolean {
    return this.utilities.delete(name);
  }
}
