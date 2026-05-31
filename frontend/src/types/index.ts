export type UserRole = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';
export type LoanStatus = 'PENDING' | 'SANCTIONED' | 'DISBURSED' | 'CLOSED' | 'REJECTED';
export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface BorrowerProfile {
  _id: string;
  userId: string;
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl?: string;
  breStatus: 'PENDING' | 'PASSED' | 'FAILED';
  breFailureReasons: string[];
}

export interface Loan {
  _id: string;
  borrowerId: string | User;
  amount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  loanId: string;
  utr: string;
  amount: number;
  paidAt: string;
  recordedBy: string | User;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: { total: number; page: number; limit: number; pages: number };
}
