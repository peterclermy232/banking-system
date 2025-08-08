// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from the service
    const authToken = this.apiService.getToken();

    // Skip auth header for registration and login endpoints
    const isAuthEndpoint = request.url.includes('/auth/login') || request.url.includes('/auth/register');

    // Clone the request and add the authorization header if token exists and not auth endpoint
    if (authToken && !isAuthEndpoint) {
  request = request.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`
    }
  });
}


    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('Interceptor caught error:', error);

        // Handle 401 Unauthorized errors
        if (error.status === 401 && !isAuthEndpoint) {
          // Clear auth data and redirect to login
          this.apiService.clearAuthData();
          this.router.navigate(['/login']);
        }

        // Handle network errors
        if (error.status === 0) {
          console.error('Network error - possibly CORS or server unavailable');
        }

        return throwError(() => error);
      })
    );
  }
}
