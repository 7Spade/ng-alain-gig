// Event Bus 事件匯流排模組 - 佔位檔案
// TODO: 實作事件匯流排邏輯

export interface EventBusEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

export class EventBusService {
  // TODO: 實作事件發送方法
  emit(event: EventBusEvent): void {
    // 佔位實作
  }

  // TODO: 實作事件監聽方法
  on(eventType: string, callback: (event: EventBusEvent) => void): void {
    // 佔位實作
  }

  // TODO: 實作事件取消監聽方法
  off(eventType: string, callback: (event: EventBusEvent) => void): void {
    // 佔位實作
  }
}

// 預設匯出
export * from './event-bus.service';
