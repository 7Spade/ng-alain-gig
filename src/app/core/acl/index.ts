// ACL 權限控制模組 - 佔位檔案
// TODO: 實作權限控制邏輯

export interface AclPermission {
  role: string;
  resource: string;
  action: string;
}

export class AclService {
  // TODO: 實作權限檢查方法
  hasPermission(permission: AclPermission): boolean {
    return false;
  }
}

// 預設匯出
export * from './acl.service';
