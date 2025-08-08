import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { filter } from 'rxjs/operators';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  expandedItems: string[] = [];
  currentUser: any;

  menuItems: MenuItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'fa-tachometer-alt'
    },
    {
      path: '/transfer',
      label: 'Transfers',
      icon: 'fa-exchange-alt'
    },
    {
      path: '/savings',
      label: 'Savings',
      icon: 'fa-piggy-bank'
    },
    {
      path: '/loans',
      label: 'Loans',
      icon: 'fa-money-bill-wave'
    },
    {
      path: '/members',
      label: 'Members',
      icon: 'fa-users'
    }
  ];

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    this.currentUser = this.apiService.getCurrentUser();
  }

  ngOnInit(): void {
    // Listen for route changes to update active states
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveStates();
    });

    // Load user preferences for sidebar state
    this.loadSidebarPreferences();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.saveSidebarPreferences();

    // Clear expanded items when collapsing
    if (this.isCollapsed) {
      this.expandedItems = [];
    }
  }

  handleItemClick(item: MenuItem): void {
    if (item.children) {
      this.toggleExpanded(item.path);
    } else {
      // Close mobile sidebar when navigating
      this.closeMobileSidebar();
    }
  }

  toggleExpanded(path: string): void {
    const index = this.expandedItems.indexOf(path);
    if (index > -1) {
      this.expandedItems.splice(index, 1);
    } else {
      this.expandedItems.push(path);
    }
  }

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '/');
  }

  isExpanded(path: string): boolean {
    return this.expandedItems.includes(path);
  }

  closeMobileSidebar(): void {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
    }
  }

  private updateActiveStates(): void {
    // Auto-expand parent menu items for active routes
    const currentPath = this.router.url;
    this.menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child =>
          currentPath === child.path || currentPath.startsWith(child.path + '/')
        );
        if (hasActiveChild && !this.isExpanded(item.path)) {
          this.expandedItems.push(item.path);
        }
      }
    });
  }

  private loadSidebarPreferences(): void {
    const collapsed = localStorage.getItem('sidebar-collapsed');
    if (collapsed !== null) {
      this.isCollapsed = JSON.parse(collapsed);
    }
  }

  private saveSidebarPreferences(): void {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(this.isCollapsed));
  }
}
