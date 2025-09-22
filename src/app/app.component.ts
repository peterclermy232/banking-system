import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ApiService } from './services/api.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isOnline = navigator.onLine;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    // Listen for online/offline events
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  ngOnInit(): void {
    // Handle route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Close mobile menu if open
      this.closeMobileMenu();
    });
  }

  get isLoginPage(): boolean {
    return this.router.url === '/login' || this.router.url === '/register';
  }

  get isAuthenticated(): boolean {
    return this.apiService.isAuthenticated();
  }

  private closeMobileMenu(): void {
    // Close mobile sidebar if open
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
    }
  }
}
