import { EmploymentMode } from '../types';

interface BREInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

interface BREResult {
  passed: boolean;
  failures: string[];
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function runBRE(input: BREInput): BREResult {
  const failures: string[] = [];

  // Rule 1: Age must be between 23 and 50
  const age = calculateAge(new Date(input.dateOfBirth));
  if (age < 23 || age > 50) {
    failures.push(`Age must be between 23 and 50 years. Your age: ${age}`);
  }

  // Rule 2: Monthly salary must be at least ₹25,000
  if (input.monthlySalary < 25000) {
    failures.push(`Monthly salary must be at least ₹25,000. Provided: ₹${input.monthlySalary.toLocaleString('en-IN')}`);
  }

  // Rule 3: PAN must match valid Indian PAN format
  if (!PAN_REGEX.test(input.pan.toUpperCase())) {
    failures.push('PAN number is invalid. Must match format: ABCDE1234F (5 letters, 4 digits, 1 letter)');
  }

  // Rule 4: Applicant must not be unemployed
  if (input.employmentMode === 'UNEMPLOYED') {
    failures.push('Unemployed applicants are not eligible for a loan');
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

export function calculateLoan(principal: number, tenureDays: number, rate: number = 12) {
  // SI = (P × R × T) / (365 × 100)
  const simpleInterest = (principal * rate * tenureDays) / (365 * 100);
  const totalRepayment = principal + simpleInterest;
  return {
    simpleInterest: Math.round(simpleInterest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
}
