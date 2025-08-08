// src/app/services/loading.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingMessageSubject = new BehaviorSubject<string>('');
  private loadingCount = 0;

  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public loadingMessage$: Observable<string> = this.loadingMessageSubject.asObservable();

  constructor() {}

  show(message: string = 'Loading...'): void {
    this.loadingCount++;
    this.loadingMessageSubject.next(message);
    this.loadingSubject.next(true);
  }

  hide(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.loadingSubject.next(false);
      this.loadingMessageSubject.next('');
    }
  }

  setMessage(message: string): void {
    this.loadingMessageSubject.next(message);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // Force hide loading (useful for error scenarios)
  forceHide(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
    this.loadingMessageSubject.next('');
  }
}
