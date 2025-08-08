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

export interface SavingsGoalResponse {
  id: number;
  goalName: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: string;
  progressPercentage: number;
  createdAt: string;
}

export interface LoginRequest {
  memberNumber: string;
  password: string;
}

// Updated RegisterRequest to match your frontend form
export interface RegisterRequest {
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

// Backend registration payload
export interface BackendRegisterPayload {
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  full_name: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  first_name: string;
  last_name?: string;
  member_number: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface NotificationCountResponse {
  count: number;
}
