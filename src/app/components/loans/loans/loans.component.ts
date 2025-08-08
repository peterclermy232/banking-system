import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

interface Loan {
  id: string;
  type: string;
  amount: number;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  nextPaymentDate: Date;
  status: 'active' | 'completed' | 'overdue';
}
@Component({
  selector: 'app-loans',
  templateUrl: './loans.component.html',
  styleUrls: ['./loans.component.scss']
})
export class LoansComponent implements OnInit {
  showNewLoanForm = false;
  totalLoanBalance = 150000;
  nextPaymentAmount = 25000;
  creditScore = 750;

  calculatorAmount = 100000;
  calculatorPeriod = 12;
  calculatorRate = 8;

  activeLoans: Loan[] = [
    {
      id: '1',
      type: 'Personal Loan',
      amount: 200000,
      balance: 150000,
      interestRate: 8,
      monthlyPayment: 18500,
      nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: '2',
      type: 'Business Loan',
      amount: 500000,
      balance: 450000,
      interestRate: 10,
      monthlyPayment: 35000,
      nextPaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'active'
    }
  ];
  loanApplication: { loanType: string; amount: number; termMonths: number; purpose: string; } = {
  loanType: '',
  amount: 0,
  termMonths: 6,
  purpose: ''
};
loanTypes: string[] = [];

   constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchLoans();
    this.fetchLoanTypes();
  }

  fetchLoans(): void {
    this.apiService.getLoans().subscribe({
      next: (loans) => {
        this.activeLoans = loans.map((loan) => ({
          id: loan.id,
          type: loan.loanType.replace('_', ' '),
          amount: loan.principalAmount,
          balance: loan.currentBalance,
          interestRate: loan.interestRate * 100,
          monthlyPayment: loan.monthlyPayment,
          nextPaymentDate: new Date(loan.nextPaymentDate),
          status: loan.status.toLowerCase()
        }));

        this.totalLoanBalance = this.activeLoans.reduce((sum, loan) => sum + loan.balance, 0);
        this.nextPaymentAmount = this.activeLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
      },
      error: (err) => console.error('Error loading loans', err)
    });
  }

  fetchLoanTypes(): void {
  this.apiService.getTypes().subscribe({
    next: (types) => {
      this.loanTypes = types;
    },
    error: (err) => console.error('Error loading loan types', err)
  });
}

  submitLoanApplication(): void {
    this.apiService.applyForLoan(this.loanApplication).subscribe({
      next: () => {
        this.showNewLoanForm = false;
        this.resetForm();
        this.fetchLoans();
      },
      error: (err) => console.error('Loan application failed:', err)
    });
  }
  resetForm(): void {
    this.loanApplication = {
      loanType: '',
      amount: 0,
      termMonths: 6,
      purpose: ''
    };
  }
  calculateMonthlyPayment(): number {
    const P = this.calculatorAmount;
    const r = this.calculatorRate / 100 / 12;
    const n = this.calculatorPeriod;

    if (r === 0) return P / n;

    return P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  calculateTotalInterest(): number {
    return (this.calculateMonthlyPayment() * this.calculatorPeriod) - this.calculatorAmount;
  }

  calculateTotalAmount(): number {
    return this.calculateMonthlyPayment() * this.calculatorPeriod;
  }
}
