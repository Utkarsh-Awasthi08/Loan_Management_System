'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Loan } from '../../../types';
import { formatINR } from '../../../lib/bre';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function SanctionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoan, setActionLoan] = useState<Loan | null>(null);
  const [actionType, setActionType] = useState<'sanction' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/loans?status=PENDING');
      setLoans(data.data || []);
    } catch {}
    setLoading(false);
  };

  const handleAction = async () => {
    if (!actionLoan || !actionType) return;
    if (actionType === 'reject' && !reason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      if (actionType === 'sanction') {
        await api.patch(`/loans/${actionLoan._id}/sanction`);
      } else {
        await api.patch(`/loans/${actionLoan._id}/reject`, { reason });
      }
      setActionLoan(null);
      setActionType(null);
      setReason('');
      await fetchLoans();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sanction Module</h1>
        <p className="text-slate-500 text-sm mt-1">Review and approve or reject pending loan applications</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading applications...</div>
        ) : loans.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-slate-500">No pending applications.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Borrower</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Tenure</th>
                  <th className="px-6 py-3 text-left">Total Repayment</th>
                  <th className="px-6 py-3 text-left">Applied</th>
                  <th className="px-6 py-3 text-left">Actions</th>
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
                      <td className="px-6 py-4 font-medium">{formatINR(loan.amount)}</td>
                      <td className="px-6 py-4 text-slate-600">{loan.tenureDays} days</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{formatINR(loan.totalRepayment)}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{new Date(loan.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="btn-success text-xs py-1.5 px-3"
                            onClick={() => { setActionLoan(loan); setActionType('sanction'); setActionError(''); }}>
                            Approve
                          </button>
                          <button className="btn-danger text-xs py-1.5 px-3"
                            onClick={() => { setActionLoan(loan); setActionType('reject'); setActionError(''); }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionLoan && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">
              {actionType === 'sanction' ? '✅ Approve Loan' : '❌ Reject Loan'}
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 mb-4 text-sm space-y-1">
              <p><span className="text-slate-500">Borrower:</span> <strong>{(actionLoan.borrowerId as any)?.name}</strong></p>
              <p><span className="text-slate-500">Amount:</span> <strong>{formatINR(actionLoan.amount)}</strong></p>
              <p><span className="text-slate-500">Tenure:</span> <strong>{actionLoan.tenureDays} days</strong></p>
              <p><span className="text-slate-500">Total Repayment:</span> <strong>{formatINR(actionLoan.totalRepayment)}</strong></p>
            </div>

            {actionType === 'reject' && (
              <div className="mb-4">
                <label className="label">Rejection Reason *</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Explain why this loan is being rejected..."
                  value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}

            {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}

            <div className="flex gap-3">
              <button className="btn-secondary flex-1"
                onClick={() => { setActionLoan(null); setActionType(null); setReason(''); }}
                disabled={actionLoading}>Cancel</button>
              <button className={`flex-1 ${actionType === 'sanction' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleAction} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : actionType === 'sanction' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
