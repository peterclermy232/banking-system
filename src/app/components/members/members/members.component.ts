import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Member, MemberStats } from 'src/app/models/account.model';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent implements OnInit {
  // Member data
  paginatedMembers: Member[] = [];

  // Filters & sorting
  searchTerm: string = '';
  statusFilter: string = '';
  dateFilter: string = '';
  sortBy: string = 'memberNumber';

  // Stats
  totalMembers: number = 0;
  activeMembers: number = 0;
  newMembers: number = 0;
  totalMemberSavings: number = 0;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // UI
  loading: boolean = false;
  showAddMemberForm: boolean = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadTotalSavings();
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    const searchParam = this.searchTerm?.trim() ?? '';

    this.apiService.getAllMembers(this.currentPage - 1, this.pageSize, searchParam).subscribe({
      next: (response) => {
        this.paginatedMembers = response.content.map(m => ({
          ...m,
          totalSavings: m.totalSavings || 0,
          loanBalance: m.loanBalance || 0,
        }));
        this.totalPages = response.totalPages;
        this.loading = false;
        this.applyLocalFilters();
      },
      error: (err) => {
        console.error('Failed to load members:', err);
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.apiService.getMemberStats().subscribe({
      next: (stats: MemberStats) => {
        this.totalMembers = stats.totalMembers || 0;
        this.activeMembers = stats.activeMembers || 0;
        this.newMembers = stats.newMembers || 0;
      },
      error: (err) => console.error('Failed to load stats:', err)
    });
  }

  loadTotalSavings(): void {
    this.apiService.getTotalSavings().subscribe({
      next: (total: number) => this.totalMemberSavings = total,
      error: (err) => console.error('Failed to load total savings:', err)
    });
  }

  filterMembers(): void {
    this.currentPage = 1;
    this.loadMembers();
  }

  applyLocalFilters(): void {
    let filtered = [...this.paginatedMembers];

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(m =>
        m.status?.toLowerCase() === this.statusFilter.toLowerCase()
      );
    }

    // Date filter
    if (this.dateFilter) {
      const now = new Date();
      filtered = filtered.filter(member => {
        const joined = new Date(member.dateJoined);
        switch (this.dateFilter) {
          case 'thisMonth':
            return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
          case 'last3Months':
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            return joined >= threeMonthsAgo;
          case 'thisYear':
            return joined.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    this.paginatedMembers = this.sortMemberList(filtered);
  }

  sortMembers(): void {
    this.paginatedMembers = this.sortMemberList([...this.paginatedMembers]);
  }

  sortMemberList(list: Member[]): Member[] {
    return list.sort((a, b) => {
      const aVal = this.getSortValue(a);
      const bVal = this.getSortValue(b);

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal);
      }

      return (aVal as number) - (bVal as number);
    });
  }

  getSortValue(member: Member): string | number {
    switch (this.sortBy) {
      case 'firstName': return member.firstName;
      case 'joinDate': return new Date(member.dateJoined).getTime();
      case 'totalSavings': return member.totalSavings;
      default: return member.memberNumber;
    }
  }

  // Navigation Methods
  viewMemberDetails(member: Member): void {
    this.router.navigate(['/members', member.memberNumber]);
  }

  editMember(member: Member): void {
    this.router.navigate(['/members', member.memberNumber, 'edit']);
  }

  addNewMember(): void {
    this.router.navigate(['/members', 'new']);
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadMembers();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMembers();
    }
  }

  // Utility methods
  refreshData(): void {
    this.loadStats();
    this.loadTotalSavings();
    this.loadMembers();
  }

  exportMembers(): void {
    // Implementation for exporting member data
    console.log('Export members functionality');
  }

  // Generate array of page numbers
getPageNumbers(): number[] {
  return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}

// Determine which pages to show in pagination
shouldShowPage(page: number): boolean {
  // Always show first page, last page, and pages within 2 of current page
  return Math.abs(this.currentPage - page) <= 2 || 
         page === 1 || 
         page === this.totalPages;
}

// Navigate to specific page
goToPage(page: number): void {
  if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
    this.currentPage = page;
    this.loadMembers();
  }
}
}