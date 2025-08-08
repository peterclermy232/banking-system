// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { forkJoin, Subscription } from 'rxjs';
import { Account, DashboardData, Transaction, TransactionResponse } from 'src/app/models/account.model';
import { User } from 'src/app/shared/interface/saving.interface';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  accounts: Account[] = [];
  recentTransactions: Transaction[] = [];
  notifications: any[] = [];

  // Loading states
  isLoadingAccounts: boolean = true;
  isLoadingTransactions: boolean = true;
  isProcessingDeposit: boolean = false;

  // Modal states
  showNotifications: boolean = false;
  showDepositModal: boolean = false;

  // Financial data
  monthlyIncome: number = 0;
  monthlyExpenses: number = 0;
  savingsGrowth: number = 0;
  totalBalance: number = 0;
  creditScore: number = 0;
  shareCapital: number = 0;
  lastLogin: Date = new Date();

  // Forms
  depositForm: FormGroup;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    this.currentUser = this.apiService.getCurrentUser();

    this.depositForm = this.fb.group({
      accountId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadDashboardData(): void {
    this.isLoadingAccounts = true;
    this.isLoadingTransactions = true;

    // Load dashboard data from the new endpoint
    this.subscriptions.add(
      this.apiService.getDashboardData().subscribe({
        next: (dashboardData: any) => {
          this.processDashboardResponse(dashboardData);
          this.isLoadingAccounts = false;
          this.isLoadingTransactions = false;
        },
        error: (error: any) => {
          console.error('Dashboard loading error:', error);
          this.isLoadingAccounts = false;
          this.isLoadingTransactions = false;

          this.notificationService.error(
            'Error Loading Dashboard',
            'Failed to load dashboard data. Please refresh the page.'
          );
        }
      })
    );
  }

  private processDashboardResponse(data: any): void {
    console.log('Dashboard data received:', data);

    // Process member info
    if (this.currentUser) {
      this.currentUser.first_name = data.memberName?.split(' ')[0] || this.currentUser.first_name;
      this.currentUser.member_number = data.memberNumber || this.currentUser.member_number;
    }

    // Process accounts - map from accountSummaries to accounts
    this.accounts = data.accountSummaries?.map((summary: any) => ({
      id: summary.id,
      account_number: summary.accountNumber,
      account_type: summary.accountType?.toLowerCase(),
      balance: summary.balance || 0,
      minimum_balance: summary.minimumBalance || 0,
      interest_rate: summary.interestRate || 0,
      status: summary.status?.toLowerCase() || 'active'
    })) || [];

    // Process transactions
    this.recentTransactions = data.recentTransactions?.map((transaction: any) => ({
      id: transaction.id,
      transaction_type: transaction.transactionType?.toLowerCase() || transaction.type?.toLowerCase(),
      amount: transaction.amount || 0,
      description: transaction.description || '',
      created_at: transaction.createdAt || transaction.date || new Date(),
      status: transaction.status?.toLowerCase() || 'completed'
    })) || [];

    // Process financial data
    this.totalBalance = data.totalBalance || 0;
    this.monthlyIncome = data.monthlyIncome || 0;
    this.monthlyExpenses = data.monthlyExpenses || 0;
    this.creditScore = data.creditScore || 0;
    this.shareCapital = data.shareCapital || 0;

    // Calculate savings growth if not provided
    if (!data.savingsGrowth && this.monthlyIncome > 0) {
      const savings = this.monthlyIncome - this.monthlyExpenses;
      this.savingsGrowth = this.monthlyIncome > 0 ? (savings / this.monthlyIncome) * 100 : 0;
    } else {
      this.savingsGrowth = data.savingsGrowth || 0;
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getTransactionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      deposit: 'fas fa-arrow-down',
      withdrawal: 'fas fa-arrow-up',
      transfer: 'fas fa-exchange-alt',
      loan: 'fas fa-hand-holding-usd',
      payment: 'fas fa-credit-card'
    };
    return icons[type] || 'fas fa-circle';
  }

  getTransactionDescription(transaction: Transaction): string {
    if (transaction.description && transaction.description.trim()) {
      return transaction.description;
    }

    const descriptions: { [key: string]: string } = {
      deposit: 'Money Deposit',
      withdrawal: 'Money Withdrawal',
      transfer: 'Money Transfer',
      loan: 'Loan Transaction',
      payment: 'Payment Made'
    };

    return descriptions[transaction.transaction_type] || 'Transaction';
  }

  getAmountClass(transaction: Transaction): string {
    if (transaction.transaction_type === 'deposit') return 'positive';
    if (transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'transfer') return 'negative';
    return '';
  }

  getAmountPrefix(transaction: Transaction): string {
    if (transaction.transaction_type === 'deposit') return '+';
    if (transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'transfer') return '-';
    return '';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  loadMoreTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  openDepositModal(): void {
    if (this.accounts.length === 0) {
      this.notificationService.warning(
        'No Accounts Available',
        'You need to have at least one account to make a deposit.'
      );
      return;
    }

    this.showDepositModal = true;
    this.depositForm.reset();

    // Pre-select first account if available
    if (this.accounts.length > 0) {
      this.depositForm.patchValue({
        accountId: this.accounts[0].id.toString()
      });
    }
  }

  closeDepositModal(): void {
    this.showDepositModal = false;
    this.depositForm.reset();
  }

  submitDeposit(): void {
    if (this.depositForm.valid && !this.isProcessingDeposit) {
      this.isProcessingDeposit = true;

      const formValues = this.depositForm.value;
      const depositData = {
        account_id: parseInt(formValues.accountId, 10),
        amount: parseFloat(formValues.amount),
        description: formValues.description || 'Quick deposit',
        transaction_type: 'deposit'
      };

      this.subscriptions.add(
        this.apiService.createDeposit(depositData).subscribe({
          next: (transaction: any) => {
            const amount = transaction.amount || depositData.amount;
            this.notificationService.success(
              'Deposit Successful',
              `${this.formatAmount(amount)} has been deposited successfully.`
            );
            this.closeDepositModal();
            this.loadDashboardData(); // Refresh data
          },
          error: (error: any) => {
            console.error('Deposit error:', error);
            this.notificationService.error(
              'Deposit Failed',
              error.message || 'Failed to process deposit. Please try again.'
            );
          },
          complete: () => {
            this.isProcessingDeposit = false;
          }
        })
      );
    } else {
      // Mark form fields as touched to show validation errors
      Object.keys(this.depositForm.controls).forEach(key => {
        this.depositForm.get(key)?.markAsTouched();
      });
    }
  }

  // Helper methods for template
  hasAccounts(): boolean {
    return this.accounts.length > 0;
  }

  hasTransactions(): boolean {
    return this.recentTransactions.length > 0;
  }

  getAccountBalance(accountId: number): number {
    const account = this.accounts.find(acc => acc.id.toString() === accountId.toString());
    return account ? account.balance : 0;
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
