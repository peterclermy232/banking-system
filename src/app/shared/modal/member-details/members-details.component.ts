import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Member } from 'src/app/models/account.model';
import { ApiService } from 'src/app/services/api.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-member-details',
  templateUrl: './members-details.component.html',
  styleUrls: ['./members-details.component.scss']
})
export class MemberDetailsComponent implements OnInit, OnDestroy {
  member: Member | null = null;
  loading = true;
  error: string | null = null;
  memberNumber: string | null = null;
  
  // Modal state
  showEditModal = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.memberNumber = params.get('memberNumber');
        if (this.memberNumber) {
          this.loadMemberDetails();
        } else {
          this.handleError('Invalid member number');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMemberDetails(): void {
    if (!this.memberNumber) return;

    this.loading = true;
    this.error = null;

    this.apiService.getMemberByNumber(this.memberNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (member) => {
          this.member = member;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load member details:', err);
          this.handleError('Failed to load member details. Please try again.');
        }
      });
  }

  private handleError(message: string): void {
    this.error = message;
    this.loading = false;
    this.notificationService.show({
      type: 'error',
      title: 'Error',
      message
    });
  }

  goBack(): void {
    this.router.navigate(['/members']);
  }

  editMember(): void {
    this.showEditModal = true;
  }

  onEditModalClose(): void {
    this.showEditModal = false;
  }

  onMemberUpdated(updatedMember: Member): void {
    this.member = updatedMember;
    this.showEditModal = false;
    // Optionally reload the full member details to ensure data consistency
    this.loadMemberDetails();
  }

  suspendMember(): void {
    if (this.member && confirm('Are you sure you want to suspend this member?')) {
      this.apiService.suspendMember(this.member.memberNumber)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedMember) => {
            this.member = updatedMember;
            this.notificationService.show({
              type: 'success',
              title: 'Success',
              message: 'Member has been suspended successfully.'
            });
          },
          error: (error) => {
            console.error('Failed to suspend member:', error);
            this.notificationService.show({
              type: 'error',
              title: 'Error',
              message: 'Failed to suspend member. Please try again.'
            });
          }
        });
    }
  }

  deleteMember(): void {
    if (this.member && confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      this.apiService.deleteMember(this.member.memberNumber)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              title: 'Success',
              message: 'Member has been deleted successfully.'
            });
            this.router.navigate(['/members']);
          },
          error: (error) => {
            console.error('Failed to delete member:', error);
            this.notificationService.show({
              type: 'error',
              title: 'Error',
              message: 'Failed to delete member. Please try again.'
            });
          }
        });
    }
  }

  refreshData(): void {
    this.loadMemberDetails();
  }

  printMemberDetails(): void {
    window.print();
  }

  exportMemberData(): void {
    if (this.member) {
      const dataStr = JSON.stringify(this.member, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `member-${this.member.memberNumber}-details.json`;
      link.click();
      URL.revokeObjectURL(url);

      this.notificationService.show({
        type: 'success',
        title: 'Export Successful',
        message: 'Member data has been exported successfully.'
      });
    }
  }

  // Updated formatDate method that handles null/undefined values
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'Not available';
    
    try {
      const dateObj = new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      return dateObj.toLocaleDateString('en-US', options).replace(',', ' at');
    } catch (error) {
      return 'Not available';
    }
  }

  // Alternative: Create a safer method that checks member first
  formatMemberDate(member: Member | null, field: keyof Member): string {
    if (!member || !member[field]) return 'Not available';
    return this.formatDate(member[field] as string | Date);
  }
}