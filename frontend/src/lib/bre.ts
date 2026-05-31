export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function validateBRE(data: {
  dateOfBirth: string;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  const age = calculateAge(new Date(data.dateOfBirth));
  if (age < 23 || age > 50) failures.push(`Age must be 23–50. Yours: ${age}`);
  if (data.monthlySalary < 25000) failures.push('Monthly salary must be ≥ ₹25,000');
  if (!PAN_REGEX.test(data.pan.toUpperCase())) failures.push('PAN format invalid (e.g. ABCDE1234F)');
  if (data.employmentMode === 'UNEMPLOYED') failures.push('Unemployed applicants are ineligible');

  return { passed: failures.length === 0, failures };
}

export function calculateLoan(principal: number, tenureDays: number) {
  const rate = 12;
  const si = (principal * rate * tenureDays) / (365 * 100);
  const total = principal + si;
  return {
    simpleInterest: Math.round(si * 100) / 100,
    totalRepayment: Math.round(total * 100) / 100,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
