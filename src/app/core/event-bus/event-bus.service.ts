// Event Bus 事件匯流排服務 - 佔位檔案
// TODO: 實作完整的事件匯流排邏輯

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface EventBusEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private eventSubject = new Subject<EventBusEvent>();

  // TODO: 實作事件發送方法
  emit(event: EventBusEvent): void {
    this.eventSubject.next(event);
  }

  // TODO: 實作事件監聽方法
  on(eventType: string): Observable<EventBusEvent> {
    return this.eventSubject.asObservable();
  }

  // TODO: 實作事件過濾監聽
  onType(eventType: string): Observable<EventBusEvent> {
    return this.eventSubject.asObservable();
  }

  // TODO: 實作全域事件監聽
  getEvents(): Observable<EventBusEvent> {
    return this.eventSubject.asObservable();
  }
}
