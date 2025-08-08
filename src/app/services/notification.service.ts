// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  show(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      duration: notification.duration || 5000,
      timestamp: new Date()
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, newNotification.duration);
    }
  }

  // Convenience methods for different notification types
  showSuccess(title: string, message: string = '', duration?: number): void {
    this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }

  showError(title: string, message: string = '', duration?: number): void {
    this.show({
      type: 'error',
      title,
      message,
      duration: duration || 8000 // Errors stay longer by default
    });
  }

  showWarning(title: string, message: string = '', duration?: number): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  showInfo(title: string, message: string = '', duration?: number): void {
    this.show({
      type: 'info',
      title,
      message,
      duration
    });
  }

  // Alias methods for backward compatibility
  success(title: string, message: string = '', duration?: number): void {
    this.showSuccess(title, message, duration);
  }

  error(title: string, message: string = '', duration?: number): void {
    this.showError(title, message, duration);
  }

  warning(title: string, message: string = '', duration?: number): void {
    this.showWarning(title, message, duration);
  }

  info(title: string, message: string = '', duration?: number): void {
    this.showInfo(title, message, duration);
  }

  remove(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }

  // Get current notifications count
  getCount(): number {
    return this.notificationsSubject.value.length;
  }

  // Get notifications by type
  getByType(type: Notification['type']): Notification[] {
    return this.notificationsSubject.value.filter(n => n.type === type);
  }
}
