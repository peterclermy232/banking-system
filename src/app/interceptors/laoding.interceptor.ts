// src/app/interceptors/loading.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Don't show loading for certain requests (optional)
    const skipLoading = request.headers.has('X-Skip-Loading');

    if (!skipLoading) {
      this.activeRequests++;

      // Only show loading if this is the first request
      if (this.activeRequests === 1) {
        this.loadingService.show();
      }
    }

    return next.handle(request).pipe(
      tap({
        next: (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            console.log('HTTP Response received:', event.status);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('HTTP Error in interceptor:', error);

          // Log specific error details
          if (error.status === 0) {
            console.error('Network error or CORS issue detected');
          }
        }
      }),
      finalize(() => {
        if (!skipLoading) {
          this.activeRequests--;

          // Hide loading when all requests are complete
          if (this.activeRequests === 0) {
            this.loadingService.hide();
          }
        }
      })
    );
  }
}
