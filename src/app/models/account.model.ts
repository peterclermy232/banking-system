import { User } from "../shared/interface/saving.interface";

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
  address: string;
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
roles?: string[];           // Array of roles
  role?: string;             // Single role string
  authorities?: Array<{      // Spring Security format
    authority: string;
  }>;
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

interface Role {
  id: number;
  name: string;
}

export interface MemberResponse {
  id: number;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to check if member is admin
export function isMemberAdmin(user: User | null): boolean {
  if (!user) return false;

  if (Array.isArray(user.roles)) {
    return user.roles.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN');
  }
  if (user.role) {
    return user.role === 'ADMIN' || user.role === 'ROLE_ADMIN';
  }
  if ((user as any).authorities) {
    return (user as any).authorities.some(
      (auth: any) => auth.authority === 'ADMIN' || auth.authority === 'ROLE_ADMIN'
    );
  }
  return false;
}



// Helper function to get member's role display name
// export function getMemberRoleDisplay(member: Member | MemberResponse): string {
//   return isMemberAdmin(member) ? 'Administrator' : 'Member';
// }

// Helper function to convert MemberResponse to Member for display
export function memberResponseToMember(memberResponse: MemberResponse): Member {
  return {
    id: memberResponse.id,
    memberNumber: memberResponse.memberNumber,
    firstName: memberResponse.firstName,
    lastName: memberResponse.lastName,
    email: memberResponse.email || '',
    phoneNumber: memberResponse.phoneNumber,
    roles: memberResponse.roles,
    status: memberResponse.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING',
    createdAt: memberResponse.createdAt,
    updatedAt: memberResponse.updatedAt,

    // Default values for required Member properties
    address: '',
    name: `${memberResponse.firstName} ${memberResponse.lastName}`,
    dateJoined: memberResponse.createdAt,
    totalSavings: 0,
    totalLoans: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransactions: 0,
    loanBalance: 0,
    savingsBalance: 0,
    loans: []
  };
}
