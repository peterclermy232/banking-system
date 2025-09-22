// src/app/services/api.service.ts (Updated)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, timer } from 'rxjs';
import { catchError, timeout, retryWhen, map, mergeMap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification.service';
import { AuthResponse, BackendRegisterPayload, LoginRequest, NotificationCountResponse, RegisterRequest, SavingsDepositRequest, SavingsGoalRequest, SavingsGoalResponse, User } from '../shared/interface/saving.interface';
import { Member, MemberResponse } from '../models/account.model';


interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData) as User;
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.logout();
      }
    }
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
          break;
        case 400:
          errorMessage = error.error?.detail || error.error?.message || 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Invalid credentials or session expired.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 409:
          errorMessage = error.error?.detail || error.error?.message || 'Member number or email already exists.';
          break;
        case 422:
          errorMessage = this.extractValidationErrors(error.error) || 'Validation failed. Please check your input.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.detail || error.error?.message || `Server Error: ${error.status}`;
      }
    }

    if (environment.enableLogging) {
      console.error('API Error:', error);
    }

    return throwError(() => new Error(errorMessage));
  };

  private extractValidationErrors(errorResponse: any): string {
    if (errorResponse?.detail) {
      if (Array.isArray(errorResponse.detail)) {
        return errorResponse.detail.map((err: any) => err.msg).join(', ');
      }
      return errorResponse.detail;
    }
    return '';
  }

  private makeRequest<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      timeout(environment.apiTimeout),
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error: HttpErrorResponse, index: number) => {
            // Don't retry on certain errors
            if (error.status === 401 || error.status === 403 || error.status === 404 || error.status === 409 || error.status === 422) {
              return throwError(() => error);
            }

            // Retry up to maxRetryAttempts times
            if (index < environment.maxRetryAttempts) {
              return timer(1000 * (index + 1)); // Exponential backoff
            }

            return throwError(() => error);
          })
        )
      ),
      catchError(this.handleError)
    );
  }

  // Authentication methods
  login(credentials: LoginRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials, this.httpOptions).pipe(
    timeout(environment.apiTimeout),
    map((response: AuthResponse) => {
      this.setAuthData(response);
      return response;
    }),
    catchError(this.handleError)
  );
}


  // Updated register method to match your form data
  register(userData: RegisterRequest): Observable<any> {
    // Transform frontend data to backend format
    const backendPayload: BackendRegisterPayload = {
     // memberNumber: userData.memberNumber,
     nationalId: userData.nationalId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: userData.password,
      full_name: `${userData.firstName} ${userData.lastName}`
    };

    console.log('Registration payload:', backendPayload);

    return this.http.post<any>(`${this.API_URL}/auth/register`, backendPayload, this.httpOptions).pipe(
      timeout(environment.apiTimeout),
      map((response: any) => {
        console.log('Registration successful:', response);
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Registration error:', error);

        let errorMessage = 'Registration failed. Please try again.';

        if (error.status === 409) {
          errorMessage = 'Member number or email already exists. Please use different credentials.';
        } else if (error.status === 422) {
          errorMessage = this.extractValidationErrors(error.error) || 'Please check your input and try again.';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        // Show error notification
        this.notificationService.show({
          type: 'error',
          title: 'Registration Failed',
          message: errorMessage
        });

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  logout(): Observable<any> {
    // Optional: Call logout endpoint if available
    return this.http.post(`${this.API_URL}/auth/logout`, {}, this.httpOptions).pipe(
      finalize(() => {
        // Clear local data regardless of API response
        this.clearAuthData();
        this.router.navigate(['/login']);

        this.notificationService.show({
          type: 'info',
          title: 'Logged Out',
          message: 'You have been successfully logged out'
        });
      }),
      catchError((error) => {
        // Even if logout fails, clear local data
        return of(null);
      })
    );
  }

  // Clear authentication data (for force logout)
  clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  setAuthData(authResponse: any): void {
  // Correct keys from backend response
  localStorage.setItem('access_token', authResponse.accessToken);
  localStorage.setItem('user', JSON.stringify(authResponse.member));

  this.currentUserSubject.next(authResponse.member);
}


  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Profile methods
  getProfile(): Observable<User> {
    return this.makeRequest(
      this.http.get<User>(`${this.API_URL}/auth/profile`)
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.makeRequest(
      this.http.put<User>(`${this.API_URL}/auth/profile`, userData, this.httpOptions)
    );
  }

  // Notifications methods
  getUnreadNotificationCount(): Observable<number> {
    return this.http.get<NotificationCountResponse>(`${this.API_URL}/notifications/unread-count`).pipe(
      timeout(environment.apiTimeout),
      map((response: NotificationCountResponse) => response.count),
      catchError((error: HttpErrorResponse) => {
        // Return 0 if endpoint not available
        if (environment.enableLogging) {
          console.warn('Notification count endpoint not available:', error);
        }
        return of(0);
      })
    );
  }

  getNotifications(): Observable<any[]> {
    return this.makeRequest(
      this.http.get<any[]>(`${this.API_URL}/notifications`)
    );
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.makeRequest(
      this.http.put<any>(`${this.API_URL}/notifications/${notificationId}/read`, {}, this.httpOptions)
    );
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.makeRequest(
      this.http.put<any>(`${this.API_URL}/notifications/mark-all-read`, {}, this.httpOptions)
    );
  }

  // Account methods
  getAccounts(): Observable<any[]> {
    return this.makeRequest(
      this.http.get<any[]>(`${this.API_URL}/accounts`)
    );
  }

  getAccount(id: number): Observable<any> {
    return this.makeRequest(
      this.http.get<any>(`${this.API_URL}/accounts/${id}`)
    );
  }

  createAccount(accountData: any): Observable<any> {
    return this.makeRequest(
      this.http.post<any>(`${this.API_URL}/accounts`, accountData, this.httpOptions)
    );
  }

  // Transaction methods
  getTransactions(page: number = 1, limit: number = 10, accountId?: number): Observable<any> {
    let url = `${this.API_URL}/transactions?page=${page}&limit=${limit}`;
    if (accountId) {
      url += `&account_id=${accountId}`;
    }

    return this.makeRequest(
      this.http.get<any>(url)
    );
  }

  createTransaction(transactionData: any): Observable<any> {
    return this.makeRequest(
      this.http.post<any>(`${this.API_URL}/transactions`, transactionData, this.httpOptions)
    );
  }

  createDeposit(depositData: any): Observable<any> {
    return this.makeRequest(
      this.http.post<any>(`${this.API_URL}/transactions/deposit`, depositData, this.httpOptions)
    );
  }

  createWithdrawal(withdrawalData: any): Observable<any> {
    return this.makeRequest(
      this.http.post<any>(`${this.API_URL}/transactions/withdrawal`, withdrawalData, this.httpOptions)
    );
  }

  createTransfer(transferData: any): Observable<any> {
    return this.makeRequest(
      this.http.post<any>(`${this.API_URL}/transactions/transfer`, transferData, this.httpOptions)
    );
  }

  // Loan methods
  getLoans(): Observable<any[]> {
    return this.makeRequest(
      this.http.get<any[]>(`${this.API_URL}/loans`)
    );
  }
  getTypes(): Observable<any[]> {
    return this.makeRequest(
      this.http.get<any[]>(`${this.API_URL}/loans/types`)
    );
  }
  applyForLoan(loanData: any): Observable<any> {
    return this.makeRequest(
      this.http.post<any>(`${this.API_URL}/loans/apply`, loanData, this.httpOptions)
    );
  }

  // Dashboard methods
  getDashboardData(): Observable<any> {
    return this.makeRequest(
      this.http.get<any>(`${this.API_URL}/dashboard`)
    );
  }

  getDashboardStats(): Observable<any> {
    return this.makeRequest(
      this.http.get<any>(`${this.API_URL}/dashboard/stats`)
    );
  }

  // Utility methods
  testConnection(): Observable<any> {
    return this.makeRequest(
      this.http.get<any>(`${this.API_URL}/health`)
    );
  }

  // Generic HTTP methods for flexibility
  get<T>(endpoint: string): Observable<T> {
    return this.makeRequest(
      this.http.get<T>(`${this.API_URL}${endpoint}`)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.makeRequest(
      this.http.post<T>(`${this.API_URL}${endpoint}`, data, this.httpOptions)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.makeRequest(
      this.http.put<T>(`${this.API_URL}${endpoint}`, data, this.httpOptions)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.makeRequest(
      this.http.delete<T>(`${this.API_URL}${endpoint}`)
    );
  }

  // Transfer money between internal accounts
internalTransfer(transferData: any): Observable<any> {
  return this.makeRequest(
    this.http.post<any>(`${this.API_URL}/transfers/internal`, transferData, this.httpOptions)
  );
}

// Transfer money to external bank
externalTransfer(transferData: any): Observable<any> {
  return this.makeRequest(
    this.http.post<any>(`${this.API_URL}/transfers/external`, transferData, this.httpOptions)
  );
}

// Transfer money via M-Pesa
mpesaTransfer(transferData: any): Observable<any> {
  return this.makeRequest(
    this.http.post<any>(`${this.API_URL}/transfers/mpesa`, transferData, this.httpOptions)
  );
}
// Savings Goals Management
createSavingsGoal(goalData: SavingsGoalRequest): Observable<SavingsGoalResponse> {
  return this.makeRequest(
    this.http.post<SavingsGoalResponse>(`${this.API_URL}/savings/goals`, goalData, this.httpOptions)
  );
}

getSavingsGoals(): Observable<SavingsGoalResponse[]> {
  return this.makeRequest(
    this.http.get<SavingsGoalResponse[]>(`${this.API_URL}/savings/goals`)
  );
}

getSavingsGoalById(goalId: number): Observable<SavingsGoalResponse> {
  return this.makeRequest(
    this.http.get<SavingsGoalResponse>(`${this.API_URL}/savings/goals/${goalId}`)
  );
}

updateSavingsGoal(goalId: number, goalData: SavingsGoalRequest): Observable<SavingsGoalResponse> {
  return this.makeRequest(
    this.http.put<SavingsGoalResponse>(`${this.API_URL}/savings/goals/${goalId}`, goalData, this.httpOptions)
  );
}

deleteSavingsGoal(goalId: number): Observable<any> {
  return this.makeRequest(
    this.http.delete<any>(`${this.API_URL}/savings/goals/${goalId}`)
  );
}

// Savings Deposits
makeSavingsDeposit(depositData: SavingsDepositRequest): Observable<any> {
  return this.makeRequest(
    this.http.post<any>(`${this.API_URL}/savings/deposit`, depositData, this.httpOptions)
  );
}

// Get savings summary/dashboard data
getSavingsSummary(): Observable<any> {
  return this.makeRequest(
    this.http.get<any>(`${this.API_URL}/savings/summary`)
  );
}

// Get savings transactions/history
getSavingsTransactions(page: number = 1, limit: number = 10): Observable<any> {
  return this.makeRequest(
    this.http.get<any>(`${this.API_URL}/savings/transactions?page=${page}&limit=${limit}`)
  );
}

// Get member's available accounts for deposits
getMemberAccounts(): Observable<any[]> {
  return this.makeRequest(
    this.http.get<any[]>(`${this.API_URL}/accounts`)
  );
}

getAllMembers(page: number = 0, size: number = 10, search: string = ''): Observable<PaginatedResponse<Member>> {
  return this.makeRequest(
    this.http.get<PaginatedResponse<Member>>(`${this.API_URL}/members?page=${page}&size=${size}&search=${search}`)
  );
}

getMemberStats(): Observable<any> {
  return this.makeRequest(
    this.http.get<any>(`${this.API_URL}/members/stats`)
  );
}
getTotalSavings(): Observable<number> {
  return this.makeRequest(
    this.http.get<number>(`${this.API_URL}/members/total-savings`)
  );
}
getMemberByNumber(memberNumber: string): Observable<Member> {
  return this.makeRequest(
    this.http.get<Member>(`${this.API_URL}/members/${memberNumber}`)
  );
}
updateMember(memberNumber: string, updateData: Partial<Member>): Observable<Member> {
  return this.http.put<Member>(`${this.API_URL}/members/${memberNumber}`, updateData)
    .pipe(
      timeout(environment.apiTimeout),
      catchError(this.handleError)
    );
}
suspendMember(memberNumber: string): Observable<Member> {
  return this.http.patch<Member>(`${this.API_URL}/members/${memberNumber}/suspend`, {})
    .pipe(
      timeout(environment.apiTimeout),
      catchError(this.handleError)
    );
}

activateMember(memberNumber: string): Observable<Member> {
  return this.http.patch<Member>(`${this.API_URL}/members/${memberNumber}/activate`, {})
    .pipe(
      timeout(environment.apiTimeout),
      catchError(this.handleError)
    );
}

deleteMember(memberNumber: string): Observable<void> {
  return this.http.delete<void>(`${this.API_URL}/members/${memberNumber}`)
    .pipe(
      timeout(environment.apiTimeout),
      catchError(this.handleError)
    );
}

createAdmin(adminData: RegisterRequest): Observable<MemberResponse> {
  return this.makeRequest(
    this.http.post<MemberResponse>(`${this.API_URL}/admin/create-admin`, adminData, this.httpOptions)
  );
}

promoteToAdmin(memberNumber: string): Observable<MemberResponse> {
  return this.makeRequest(
    this.http.post<MemberResponse>(`${this.API_URL}/admin/promote-to-admin/${memberNumber}`, {}, this.httpOptions)
  );
}

demoteToMember(memberNumber: string): Observable<MemberResponse> {
  return this.makeRequest(
    this.http.post<MemberResponse>(`${this.API_URL}/admin/demote-to-member/${memberNumber}`, {}, this.httpOptions)
  );
}

// Enhanced member management with role checking
getAllMembersAdmin(page: number = 0, size: number = 10, search: string = ''): Observable<PaginatedResponse<Member>> {
  // This method includes admin-specific data that regular members can't see
  return this.makeRequest(
    this.http.get<PaginatedResponse<Member>>(`${this.API_URL}/admin/members?page=${page}&size=${size}&search=${search}`)
  );
}

// Method to check current user's permissions
checkAdminPermissions(): Observable<{canManageMembers: boolean, canCreateAdmin: boolean}> {
  return this.makeRequest(
    this.http.get<{canManageMembers: boolean, canCreateAdmin: boolean}>(`${this.API_URL}/admin/permissions`)
  );
}

}
