export type UserRole = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';

export type LoanStatus = 'PENDING' | 'SANCTIONED' | 'DISBURSED' | 'CLOSED' | 'REJECTED';

export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: JwtPayload;
}
