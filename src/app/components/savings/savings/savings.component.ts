import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';

export interface SavingsGoal {
  id: number;
  goalName: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: string;
  progressPercentage: number;
  createdAt: string;
  monthlyContribution?: number; // Calculated field
}

export interface SavingsGoalRequest {
  goalName: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
}

export interface SavingsDepositRequest {
  fromAccountNumber: string;
  amount: number;
  reference?: string;
  savingsGoalId?: number;
}

export interface Account {
  number: string;
  name: string;
  balance: number;
}

@Component({
  selector: 'app-savings',
  templateUrl: './savings.component.html',
  styleUrls: ['./savings.component.scss']
})
export class SavingsComponent implements OnInit, OnDestroy {

  // UI State
  showNewGoalForm = false;
  showCustomAmount = false;
  loading = false;
  depositing = false;
  depositAttempted = false;

  // Forms with proper typing
  newGoalForm!: FormGroup;
  depositForm!: FormGroup;

  // Data
  savingsGoals: SavingsGoal[] = [];
  totalSavings = 0;
  activeGoals = 0;
  monthlyTarget = 0;
  customDepositAmount = 0;
  selectedDepositGoal = 'general';
  selectedPaymentMethod = 'bank';
  selectedFromAccount = '';
  referenceText = '';

  // Quick deposit amounts
  quickAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

  // Available accounts
  availableAccounts: Account[] = [];

  today: string = new Date().toISOString().split('T')[0];
  private destroy$ = new Subject<void>();
  selectedGoalForDetails: SavingsGoal | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadSavingsData();
    this.loadMemberAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // New Goal Form
    this.newGoalForm = this.fb.group({
      goalName: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      targetAmount: ['', [Validators.required, Validators.min(100)]],
      targetDate: ['', Validators.required]
    });

    // Deposit Form (kept for reference field only)
    this.depositForm = this.fb.group({
      fromAccountNumber: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(10)]],
      reference: [''],
      savingsGoalId: [null]
    });
  }

  loadSavingsData(): void {
    this.loading = true;

    this.apiService.getSavingsGoals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (goals) => {
          this.savingsGoals = goals.map(goal => ({
            ...goal,
            monthlyContribution: this.calculateMonthlyContribution(goal)
          }));
          this.calculateSummaryStats();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading savings goals:', error);
          this.notificationService.show({
            type: 'error',
            title: 'Error',
            message: 'Failed to load savings goals'
          });
          this.loading = false;
        }
      });
  }

  private calculateMonthlyContribution(goal: SavingsGoal): number {
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const monthsRemaining = Math.max(1,
      (targetDate.getFullYear() - now.getFullYear()) * 12 +
      (targetDate.getMonth() - now.getMonth())
    );

    const remainingAmount = goal.targetAmount - goal.currentAmount;
    return Math.ceil(remainingAmount / monthsRemaining);
  }

  private calculateSummaryStats(): void {
    this.totalSavings = this.savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    this.activeGoals = this.savingsGoals.filter(goal => goal.status === 'ACTIVE').length;
    this.monthlyTarget = this.savingsGoals.reduce((sum, goal) => sum + (goal.monthlyContribution || 0), 0);
  }

  // Helper method to safely get form control values
  getFormControlValue(controlName: string): any {
    // Handle special cases for deposit form
    if (controlName === 'fromAccountNumber') {
      return this.selectedFromAccount;
    }

    if (controlName === 'reference') {
      return this.referenceText;
    }

    // Handle form controls from newGoalForm
    if (this.newGoalForm.get(controlName)) {
      return this.newGoalForm.get(controlName)?.value;
    }

    // Handle form controls from depositForm
    if (this.depositForm.get(controlName)) {
      return this.depositForm.get(controlName)?.value;
    }

    return null;
  }

  createSavingsGoal(): void {
    if (this.newGoalForm.valid) {
      this.loading = true;

      const goalData: SavingsGoalRequest = {
        goalName: this.newGoalForm.value.goalName,
        description: this.newGoalForm.value.description,
        targetAmount: parseFloat(this.newGoalForm.value.targetAmount),
        targetDate: this.formatDateForBackend(this.newGoalForm.value.targetDate)
      };

      this.apiService.createSavingsGoal(goalData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.notificationService.show({
              type: 'success',
              title: 'Success',
              message: 'Savings goal created successfully'
            });

            this.showNewGoalForm = false;
            this.newGoalForm.reset();
            this.loadSavingsData();
          },
          error: (error) => {
            console.error('Error creating savings goal:', error);
            this.notificationService.show({
              type: 'error',
              title: 'Error',
              message: error.message || 'Failed to create savings goal'
            });
            this.loading = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.newGoalForm);
    }
  }

  updateSavingsGoal(goalId: number, goalData: SavingsGoalRequest): void {
    this.loading = true;

    this.apiService.updateSavingsGoal(goalId, goalData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Success',
            message: 'Savings goal updated successfully'
          });
          this.loadSavingsData();
        },
        error: (error) => {
          console.error('Error updating savings goal:', error);
          this.notificationService.show({
            type: 'error',
            title: 'Error',
            message: error.message || 'Failed to update savings goal'
          });
          this.loading = false;
        }
      });
  }

  selectAmount(amount: number): void {
  this.customDepositAmount = amount;
  this.showCustomAmount = false;

  // Force change detection
  console.log('Selected amount:', amount);

  // Trigger validation check
  setTimeout(() => {
    console.log('Amount after selection:', this.customDepositAmount);
  }, 0);
}


  showCustomAmountInput(): void {
  this.showCustomAmount = true;
  this.customDepositAmount = 0; // Reset to 0, not undefined

  // Focus on the input after a brief delay
  setTimeout(() => {
    const customInput = document.querySelector('.custom-amount input') as HTMLInputElement;
    if (customInput) {
      customInput.focus();
    }
  }, 100);
}

onAccountSelectionChange(): void {
  console.log('Account selection changed to:', this.selectedFromAccount);

  // Reset custom amount if account doesn't have sufficient balance
  const selectedAccount = this.availableAccounts.find(acc => acc.number === this.selectedFromAccount);
  if (selectedAccount && this.customDepositAmount > selectedAccount.balance) {
    this.customDepositAmount = 0;
    this.showCustomAmount = false;
  }
}
  onCustomAmountChange(): void {
  // Ensure the amount is a valid number
  if (this.customDepositAmount) {
    this.customDepositAmount = Number(this.customDepositAmount);
  }

  console.log('Custom amount changed to:', this.customDepositAmount);

  // Force validation update
  setTimeout(() => {
    console.log('Validation after amount change:', this.isDepositButtonDisabled());
  }, 0);
}

  selectDepositGoal(goalType: string): void {
    this.selectedDepositGoal = goalType;
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
  }

  // isDepositButtonDisabled(): boolean {
  //   return this.depositing ||
  //          this.customDepositAmount <= 0 ||
  //          !this.selectedFromAccount;
  // }

  // makeDeposit(): void {
  //   this.depositAttempted = true;

  //   // Validate required fields
  //   if (!this.selectedFromAccount) {
  //     this.notificationService.show({
  //       type: 'error',
  //       title: 'Validation Error',
  //       message: 'Please select an account to transfer from'
  //     });
  //     return;
  //   }

  //   if (!this.customDepositAmount || this.customDepositAmount <= 0) {
  //     this.notificationService.show({
  //       type: 'error',
  //       title: 'Validation Error',
  //       message: 'Please enter a valid deposit amount'
  //     });
  //     return;
  //   }

  //   this.depositing = true;

  //   const depositData: SavingsDepositRequest = {
  //     fromAccountNumber: this.selectedFromAccount,
  //     amount: this.customDepositAmount,
  //     reference: this.referenceText || `Savings deposit - ${new Date().toISOString()}`,
  //     savingsGoalId: this.selectedDepositGoal !== 'general' ?
  //       this.getSelectedGoalId() : undefined
  //   };

  //   console.log('Making deposit with data:', depositData);

  //   this.apiService.makeSavingsDeposit(depositData)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (response) => {
  //         this.notificationService.show({
  //           type: 'success',
  //           title: 'Success',
  //           message: `Successfully deposited KSH ${this.customDepositAmount.toLocaleString()}`
  //         });

  //         this.resetDepositForm();
  //         this.loadSavingsData();
  //       },
  //       error: (error) => {
  //         console.error('Error making deposit:', error);
  //         this.notificationService.show({
  //           type: 'error',
  //           title: 'Deposit Failed',
  //           message: error.message || 'Failed to process deposit'
  //         });
  //         this.depositing = false;
  //       }
  //     });
  // }

  private getSelectedGoalId(): number | undefined {
    if (this.selectedDepositGoal === 'general') return undefined;

    const selectedGoal = this.savingsGoals.find(goal =>
      goal.goalName === this.selectedDepositGoal && goal.status === 'ACTIVE'
    );
    return selectedGoal?.id;
  }

  private resetDepositForm(): void {
    this.selectedFromAccount = '';
    this.customDepositAmount = 0;
    this.showCustomAmount = false;
    this.selectedDepositGoal = 'general';
    this.selectedPaymentMethod = 'bank';
    this.depositing = false;
    this.depositAttempted = false;
    this.referenceText = '';
  }

  private formatDateForBackend(date: string): string {
    const dateObj = new Date(date);
    return dateObj.toISOString();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['min']) return `${fieldName} must be greater than ${field.errors['min'].min}`;
    }
    return '';
  }

  addMoneyToGoal(goalId: number): void {
    const goal = this.savingsGoals.find(g => g.id === goalId);
    if (goal) {
      this.selectedDepositGoal = goal.goalName;

      document.querySelector('.quick-deposit')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  viewGoalDetails(goalId: number): void {
    const goal = this.savingsGoals.find(g => g.id === goalId);
    if (goal) {
      this.selectedGoalForDetails = goal;
    }
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 50) return '#FF9800';
    return '#2196F3';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  calculateDaysRemaining(targetDate: string): number {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isGoalOverdue(targetDate: string): boolean {
    return new Date(targetDate) < new Date();
  }

  closeNewGoalForm(): void {
    this.showNewGoalForm = false;
    this.newGoalForm.reset();
  }

  calculateSuggestedContribution(): number {
    const targetAmount = this.getFormControlValue('targetAmount');
    const targetDate = this.getFormControlValue('targetDate');

    if (!targetAmount || !targetDate) return 0;

    const target = new Date(targetDate);
    const now = new Date();
    const monthsRemaining = Math.max(1,
      (target.getFullYear() - now.getFullYear()) * 12 +
      (target.getMonth() - now.getMonth())
    );

    return Math.ceil(targetAmount / monthsRemaining);
  }

  loadMemberAccounts(): void {
  console.log('Loading member accounts...');

  this.apiService.getMemberAccounts()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (accounts) => {
        console.log('Raw account data from API:', accounts);

        // Filter accounts suitable for savings deposits
        const eligibleAccounts = accounts.filter(account => {
          const isActive = account.status === 'ACTIVE';
          const isNotSavings = account.accountType !== 'SAVINGS';
          const hasBalance = account.balance > (account.minimumBalance || 0) + 10; // Ensure at least 10 KSH available

          return isActive && isNotSavings && hasBalance;
        });

        // Map to the format expected by your component
        this.availableAccounts = eligibleAccounts.map(account => ({
          number: account.accountNumber,
          name: `${this.formatAccountTypeName(account.accountType)}`,
          balance: account.balance
        }));

        console.log('Processed available accounts:', this.availableAccounts);

        if (this.availableAccounts.length === 0) {
          console.warn('No eligible accounts found for savings deposits');
          this.notificationService.show({
            type: 'warning',
            title: 'No Eligible Accounts',
            message: 'You need an active account with sufficient balance to make savings deposits.'
          });
        } else {
          // Auto-select the first available account if none is selected
          if (!this.selectedFromAccount ||
              !this.availableAccounts.some(acc => acc.number === this.selectedFromAccount)) {
            this.selectedFromAccount = this.availableAccounts[0].number;
            console.log('Auto-selected account:', this.selectedFromAccount);
          }
        }

        // Force change detection after loading accounts
        setTimeout(() => {
          console.log('Button disabled after loading accounts:', this.isDepositButtonDisabled());
        }, 0);
      },
      error: (error) => {
        console.error('Error loading member accounts:', error);
        this.availableAccounts = [];
        this.selectedFromAccount = '';

        this.notificationService.show({
          type: 'error',
          title: 'Error Loading Accounts',
          message: 'Failed to load your accounts. Please try again.'
        });
      }
    });
}
// Helper method to format account type names for better UX
private formatAccountTypeName(accountType: string): string {
  switch (accountType?.toUpperCase()) {
    case 'CURRENT':
      return 'Current Account';
    case 'SAVINGS':
      return 'Savings Account';
    case 'SHARE_CAPITAL':
      return 'Share Capital';
    case 'FIXED_DEPOSIT':
      return 'Fixed Deposit';
    default:
      return accountType?.replace('_', ' ') || 'Account';
  }
}

// Enhanced method to check if deposit is possible
isDepositButtonDisabled(): boolean {
  // Add debugging to see what's happening
  console.log('Deposit button validation:', {
    depositing: this.depositing,
    customDepositAmount: this.customDepositAmount,
    selectedFromAccount: this.selectedFromAccount,
    availableAccountsLength: this.availableAccounts.length,
    showCustomAmount: this.showCustomAmount
  });

  // Check if we're currently processing a deposit
  if (this.depositing) {
    return true;
  }

  // Check if no accounts are available
  if (this.availableAccounts.length === 0) {
    return true;
  }

  // Check if no account is selected
  if (!this.selectedFromAccount) {
    return true;
  }

  // Check if amount is valid
  if (!this.customDepositAmount || this.customDepositAmount <= 0) {
    return true;
  }

  // Check minimum amount
  if (this.customDepositAmount < 10) {
    return true;
  }

  // Check if selected account has sufficient balance
  const selectedAccount = this.availableAccounts.find(acc => acc.number === this.selectedFromAccount);
  if (selectedAccount && this.customDepositAmount > selectedAccount.balance) {
    return true;
  }

  // All validations passed
  return false;
}

// Enhanced method with better validation
makeDeposit(): void {
  this.depositAttempted = true;

  // Run all validations again
  if (this.isDepositButtonDisabled()) {
    console.log('Deposit blocked by validation');
    return;
  }

  // Additional validation
  const selectedAccount = this.availableAccounts.find(acc => acc.number === this.selectedFromAccount);
  if (!selectedAccount) {
    this.notificationService.show({
      type: 'error',
      title: 'Invalid Account',
      message: 'Please select a valid account.'
    });
    return;
  }

  if (this.customDepositAmount > selectedAccount.balance) {
    this.notificationService.show({
      type: 'error',
      title: 'Insufficient Funds',
      message: `Insufficient balance. Available: ${this.formatCurrency(selectedAccount.balance)}`
    });
    return;
  }

  // Proceed with deposit
  this.depositing = true;

  const depositData: SavingsDepositRequest = {
    fromAccountNumber: this.selectedFromAccount,
    amount: this.customDepositAmount,
    reference: this.referenceText || `Savings deposit - ${new Date().toISOString().split('T')[0]}`,
    savingsGoalId: this.selectedDepositGoal !== 'general' ? this.getSelectedGoalId() : undefined
  };

  console.log('Making deposit with data:', depositData);

  this.apiService.makeSavingsDeposit(depositData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.notificationService.show({
          type: 'success',
          title: 'Deposit Successful',
          message: `Successfully deposited ${this.formatCurrency(this.customDepositAmount)}`
        });

        this.resetDepositForm();
        this.loadSavingsData();
        this.loadMemberAccounts();
      },
      error: (error) => {
        console.error('Error making deposit:', error);
        this.notificationService.show({
          type: 'error',
          title: 'Deposit Failed',
          message: error.message || 'Failed to process deposit. Please try again.'
        });
        this.depositing = false;
      }
    });
}

  get averageProgressPercentage(): number {
    if (!this.savingsGoals || this.savingsGoals.length === 0) return 0;
    const total = this.savingsGoals.reduce((sum, goal) => sum + goal.progressPercentage, 0);
    return Math.round(total / this.savingsGoals.length);
  }
}
