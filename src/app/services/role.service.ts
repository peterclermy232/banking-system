import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../shared/interface/saving.interface';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Role {
  id: number;
  name: string; // This will match RoleName enum values from backend
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
    private readonly API_URL = environment.apiUrl;
  private currentUserRoleSubject = new BehaviorSubject<string | null>(null);
  public currentUserRole$ = this.currentUserRoleSubject.asObservable();

    private httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };

  constructor(private http: HttpClient,private apiService: ApiService) {
    // Subscribe to user changes and update role
    this.apiService.currentUser$.subscribe(user => {
      if (user) {
        this.updateUserRole(user);
      } else {
        this.currentUserRoleSubject.next(null);
      }
    });
  }

  private updateUserRole(user: User): void {
    let userRole: string | null = null;

    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      userRole = user.roles.find(role => role === 'ADMIN') || user.roles[0];
    } else if (user.role) {
      userRole = user.role;
    } else if ((user as any).authorities && Array.isArray((user as any).authorities)) {
      const authorities = (user as any).authorities;
      const adminAuth = authorities.find((auth: any) =>
        auth.authority === 'ROLE_ADMIN' || auth.authority === 'ADMIN'
      );
      userRole = adminAuth ? 'ADMIN' : authorities[0]?.authority || 'MEMBER';
    }

    this.currentUserRoleSubject.next(userRole || 'MEMBER');
  }

  /** Check Role Helpers **/
  isAdmin(): boolean {
    const currentRole = this.currentUserRoleSubject.value;
    return currentRole === 'ADMIN' || currentRole === 'ROLE_ADMIN';
  }

  isMember(): boolean {
    const currentRole = this.currentUserRoleSubject.value;
    return currentRole === 'MEMBER' || currentRole === 'ROLE_MEMBER' || !this.isAdmin();
  }

  getCurrentRole(): string | null {
    return this.currentUserRoleSubject.value;
  }

  hasRole(role: string): boolean {
    const currentRole = this.currentUserRoleSubject.value;
    return currentRole === role || currentRole === `ROLE_${role}`;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /** NEW: Fetch all roles from backend **/
  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.API_URL}/roles`);
  }

  /** NEW: Fetch a specific role by name **/
  getRoleByName(roleName: string): Observable<Role> {
    return this.http.get<Role>(`${this.API_URL}/roles/${roleName}`);
  }
}
