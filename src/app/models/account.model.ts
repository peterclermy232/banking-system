export interface Account {
  id: string;
  account_type: string; // <-- Add this line if missing
  account_number: string;
  balance: number;
  status: string;
  is_active?: boolean;
  type: string;
  // ...other properties...
}

export interface Transaction {
  id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'loan' | 'payment';
  description: string;
  amount: number;
  date: Date | string;
  status: 'completed' | 'pending' | 'failed';
  account_id?: number;
  created_at?: string;
}


export interface DashboardData {
  monthly_income?: number;
  monthly_expenses?: number;
  savings_growth?: number;
  total_balance?: number;
  account_count?: number;
  recent_transactions?: Transaction[];
}

export interface TransactionResponse {
  items?: Transaction[];
  data?: Transaction[];
  transactions?: Transaction[];
  total?: number;
  page?: number;
  limit?: number;
}
export interface Member {
  id: number;
  name: string;
  memberNumber: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  firstName: string;
  lastName: string;
  dateJoined: string;
  totalSavings: number;
  totalLoans: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransactions: number;
  loanBalance: number;
  savingsBalance: number;
  loans: any[];
  phoneNumber?: string;
  shareCapital?: number;
  lastTransactionDate?: string;
  monthlyIncome?: number;
  employer?: string;
  createdAt: string;
  updatedAt: string;
  physicalAddress?: string;
  idNumber?: string;
  dateOfBirth?: string;
  memberName?: string; // Optional, used in recent recipients

}
export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  newMembers?: number;
}
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}
