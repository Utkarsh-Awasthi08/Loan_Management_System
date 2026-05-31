'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Loan } from '../../../types';
import { formatINR } from '../../../lib/bre';

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [disbursingId, setDisbursingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/loans?status=SANCTIONED');
      setLoans(data.data || []);
    } catch {}
    setLoading(false);
  };

  const handleDisburse = async (loan: Loan) => {
    if (!confirm(`Disburse ${formatINR(loan.amount)} to ${(loan.borrowerId as any)?.name}?`)) return;
    setError('');
    setDisbursingId(loan._id);
    try {
      await api.patch(`/loans/${loan._id}/disburse`);
      await fetchLoans();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Disbursement failed.');
    } finally {
      setDisbursingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Disbursement Module</h1>
        <p className="text-slate-500 text-sm mt-1">Release funds for sanctioned loans</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : loans.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-2xl mb-2">💸</p>
            <p className="text-slate-500">No loans awaiting disbursement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Borrower</th>
                  <th className="px-6 py-3 text-left">Loan Amount</th>
                  <th className="px-6 py-3 text-left">Tenure</th>
                  <th className="px-6 py-3 text-left">Interest</th>
                  <th className="px-6 py-3 text-left">Total Repayment</th>
                  <th className="px-6 py-3 text-left">Sanctioned On</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const borrower = loan.borrowerId as any;
                  return (
                    <tr key={loan._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{borrower?.name}</p>
                        <p className="text-xs text-slate-400">{borrower?.email}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-blue-700">{formatINR(loan.amount)}</td>
                      <td className="px-6 py-4">{loan.tenureDays} days</td>
                      <td className="px-6 py-4 text-slate-600">{formatINR(loan.simpleInterest)}</td>
                      <td className="px-6 py-4 font-semibold">{formatINR(loan.totalRepayment)}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {loan.sanctionedAt ? new Date(loan.sanctionedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button className="btn-primary text-xs py-1.5 px-3"
                          disabled={disbursingId === loan._id}
                          onClick={() => handleDisburse(loan)}>
                          {disbursingId === loan._id ? 'Processing...' : '💸 Disburse'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
