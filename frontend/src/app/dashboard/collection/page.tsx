'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Loan, Payment } from '../../../types';
import { formatINR } from '../../../lib/bre';

export default function CollectionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Payment form
  const [payForm, setPayForm] = useState({ utr: '', amount: '', paidAt: new Date().toISOString().split('T')[0] });
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState('');

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/loans?status=DISBURSED');
      setLoans(data.data || []);
    } catch {}
    setLoading(false);
  };

  const openLoan = async (loan: Loan) => {
    setSelectedLoan(loan);
    setPayError('');
    setPaySuccess('');
    setPayForm({ utr: '', amount: '', paidAt: new Date().toISOString().split('T')[0] });
    setPaymentsLoading(true);
    try {
      const { data } = await api.get(`/payments/${loan._id}`);
      setPayments(data.data || []);
    } catch {}
    setPaymentsLoading(false);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');

    if (!selectedLoan) return;

    const amt = Number(payForm.amount);
    if (amt <= 0) { setPayError('Amount must be greater than zero.'); return; }
    if (amt > selectedLoan.outstandingBalance) {
      setPayError(`Amount cannot exceed outstanding balance of ${formatINR(selectedLoan.outstandingBalance)}.`);
      return;
    }

    setPayLoading(true);
    try {
      const { data } = await api.post('/payments', {
        loanId: selectedLoan._id,
        utr: payForm.utr,
        amount: amt,
        paidAt: payForm.paidAt,
      });

      setPaySuccess(data.message || 'Payment recorded!');
      setPayForm({ utr: '', amount: '', paidAt: new Date().toISOString().split('T')[0] });

      // Refresh loan data
      await fetchLoans();

      // Re-fetch updated loan
      const updated = await api.get(`/loans/${selectedLoan._id}`);
      const updatedLoan = updated.data.data.loan;
      setSelectedLoan(updatedLoan);

      // Refresh payments
      const paymentsRes = await api.get(`/payments/${selectedLoan._id}`);
      setPayments(paymentsRes.data.data || []);

      // If loan closed, close modal after delay
      if (updatedLoan.status === 'CLOSED') {
        setTimeout(() => setSelectedLoan(null), 2000);
      }
    } catch (err: any) {
      setPayError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setPayLoading(false);
    }
  };

  const progressPct = selectedLoan
    ? Math.min(100, (selectedLoan.totalPaid / selectedLoan.totalRepayment) * 100)
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Collection Module</h1>
        <p className="text-slate-500 text-sm mt-1">Record repayments for disbursed loans</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : loans.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-2xl mb-2">💰</p>
            <p className="text-slate-500">No active disbursed loans.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Borrower</th>
                  <th className="px-6 py-3 text-left">Loan Amount</th>
                  <th className="px-6 py-3 text-left">Total Repayment</th>
                  <th className="px-6 py-3 text-left">Paid</th>
                  <th className="px-6 py-3 text-left">Outstanding</th>
                  <th className="px-6 py-3 text-left">Progress</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const borrower = loan.borrowerId as any;
                  const pct = Math.min(100, (loan.totalPaid / loan.totalRepayment) * 100);
                  return (
                    <tr key={loan._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{borrower?.name}</p>
                        <p className="text-xs text-slate-400">{borrower?.email}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatINR(loan.amount)}</td>
                      <td className="px-6 py-4">{formatINR(loan.totalRepayment)}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">{formatINR(loan.totalPaid)}</td>
                      <td className="px-6 py-4 text-red-600 font-medium">{formatINR(loan.outstandingBalance)}</td>
                      <td className="px-6 py-4 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-10">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="btn-primary text-xs py-1.5 px-3" onClick={() => openLoan(loan)}>
                          Record Payment
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

      {/* Payment Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card w-full max-w-lg my-8">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Record Payment</h3>
                <p className="text-sm text-slate-500">{(selectedLoan.borrowerId as any)?.name}</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 text-xl" onClick={() => setSelectedLoan(null)}>✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Loan summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Repayment</span>
                  <span className="font-semibold">{formatINR(selectedLoan.totalRepayment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Paid</span>
                  <span className="font-semibold text-green-600">{formatINR(selectedLoan.totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Outstanding</span>
                  <span className="font-bold text-red-600">{formatINR(selectedLoan.outstandingBalance)}</span>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{progressPct.toFixed(1)}% repaid</p>
                </div>
              </div>

              {/* Success message */}
              {paySuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 font-medium">
                  ✅ {paySuccess}
                </div>
              )}

              {/* Payment form */}
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="label">UTR Number *</label>
                  <input type="text" className="input-field" placeholder="Unique Transaction Reference"
                    value={payForm.utr} onChange={(e) => setPayForm({ ...payForm, utr: e.target.value.toUpperCase() })} required />
                  <p className="text-xs text-slate-400 mt-1">Must be unique across all payments</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Amount (₹) *</label>
                    <input type="number" className="input-field" placeholder="0" min={1}
                      max={selectedLoan.outstandingBalance} step={1}
                      value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Payment Date *</label>
                    <input type="date" className="input-field"
                      value={payForm.paidAt} onChange={(e) => setPayForm({ ...payForm, paidAt: e.target.value })} required />
                  </div>
                </div>

                {payError && <p className="text-sm text-red-600">{payError}</p>}

                <button type="submit" className="btn-primary w-full" disabled={payLoading}>
                  {payLoading ? 'Recording...' : '💰 Record Payment'}
                </button>
              </form>

              {/* Payment history */}
              {paymentsLoading ? (
                <p className="text-sm text-slate-400 text-center">Loading payments...</p>
              ) : payments.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-3">Payment History</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {payments.map((p) => (
                      <div key={p._id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="font-mono font-medium text-xs">{p.utr}</p>
                          <p className="text-xs text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</p>
                        </div>
                        <span className="font-semibold text-green-600">{formatINR(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
