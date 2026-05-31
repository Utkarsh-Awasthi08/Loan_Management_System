import { LoanStatus } from '../../types';

const STATUS_STYLES: Record<LoanStatus, string> = {
  PENDING:     'bg-yellow-100 text-yellow-800',
  SANCTIONED:  'bg-blue-100 text-blue-800',
  DISBURSED:   'bg-purple-100 text-purple-800',
  CLOSED:      'bg-green-100 text-green-800',
  REJECTED:    'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span className={`badge ${STATUS_STYLES[status]}`}>{status}</span>
  );
}
