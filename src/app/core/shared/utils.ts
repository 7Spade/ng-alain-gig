// Shared 工具函式 - 佔位檔案
// TODO: 實作常用工具函式

export class Utils {
  // TODO: 實作日期格式化
  static formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    return date.toISOString().split('T')[0];
  }

  // TODO: 實作字串處理
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // TODO: 實作深拷貝
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  // TODO: 實作防抖動
  static debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // TODO: 實作節流
  static throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}
