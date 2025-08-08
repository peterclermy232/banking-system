// src/app/components/shared/navbar/navbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService} from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { User } from '../../interface/saving.interface';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  searchTerm: string = '';
  showUserMenu: boolean = false;
  showNotifications: boolean = false;
  unreadCount: number = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    this.subscriptions.add(
      this.apiService.currentUser$.subscribe((user: User | null) => {
        this.currentUser = user;
      })
    );

    // Listen for clicks outside to close dropdowns
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    // Get unread notification count if user is logged in
    if (this.currentUser) {
      this.getUnreadNotificationCount();
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();

    // Remove event listener
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.user-menu')) {
      this.showUserMenu = false;
    }

    if (!target.closest('.notification-icon')) {
      this.showNotifications = false;
    }
  }

  toggleMobileMenu(): void {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchTerm.trim() }
      });
    }
  }

  viewProfile(): void {
    this.showUserMenu = false;
    this.router.navigate(['/profile']);
  }

  viewSettings(): void {
    this.showUserMenu = false;
    this.router.navigate(['/settings']);
  }

  viewNotifications(): void {
    this.showNotifications = false;
    this.router.navigate(['/notifications']);
  }

  logout(): void {
    this.showUserMenu = false;

    try {
      this.apiService.logout();
      // The logout method in ApiService already handles navigation and notifications
    } catch (error: any) {
      console.error('Logout error:', error);

      // Force logout even if API call fails
      this.apiService.clearAuthData();
      this.notificationService.show({
        type: 'info',
        title: 'Logged Out',
        message: 'You have been logged out'
      });
      this.router.navigate(['/login']);
    }
  }

  private getUnreadNotificationCount(): void {
    this.subscriptions.add(
      this.apiService.getUnreadNotificationCount().subscribe({
        next: (count: number) => {
          this.unreadCount = count;
        },
        error: (error: any) => {
          console.error('Error getting notification count:', error);
          // Set to 0 if there's an error
          this.unreadCount = 0;
        }
      })
    );
  }

  // Helper method to get user initials for avatar
  getUserInitials(): string {
    if (!this.currentUser?.full_name) {
      return 'U';
    }

    const names = this.currentUser.full_name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }

    return names[0][0].toUpperCase();
  }

  // Helper method to check if user is admin (if you have role-based access)
  isAdmin(): boolean {
    // Implement based on your user role structure
    return this.currentUser?.email === 'admin@example.com'; // Replace with actual logic
  }
}
