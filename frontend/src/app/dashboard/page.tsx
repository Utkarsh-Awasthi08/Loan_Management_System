'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import { Loan, LoanStatus } from '../../types';
import { formatINR } from '../../lib/bre';
import Link from 'next/link';

interface Stats {
  pending: number;
  sanctioned: number;
  disbursed: number;
  closed: number;
  rejected: number;
}

export default function DashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, sanctioned: 0, disbursed: 0, closed: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/loans?limit=10');
      const allLoans: Loan[] = data.data || [];
      setLoans(allLoans);

      const s: Stats = { pending: 0, sanctioned: 0, disbursed: 0, closed: 0, rejected: 0 };
      allLoans.forEach((l) => {
        const k = l.status.toLowerCase() as keyof Stats;
        if (k in s) s[k]++;
      });
      setStats(s);
    } catch {}
    setLoading(false);
  };

  const statCards = [
    { label: 'Pending',    value: stats.pending,    color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Sanctioned', value: stats.sanctioned, color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Disbursed',  value: stats.disbursed,  color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Closed',     value: stats.closed,     color: 'text-green-600',  bg: 'bg-green-50' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">All loan activity across the platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`card p-5 ${s.bg}`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-slate-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent loans */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent Applications</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : loans.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No loan applications yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Borrower</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Tenure</th>
                  <th className="px-6 py-3 text-left">Repayment</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const borrower = loan.borrowerId as any;
                  return (
                    <tr key={loan._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{borrower?.name || 'N/A'}</p>
                        <p className="text-xs text-slate-400">{borrower?.email}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatINR(loan.amount)}</td>
                      <td className="px-6 py-4 text-slate-600">{loan.tenureDays}d</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{formatINR(loan.totalRepayment)}</td>
                      <td className="px-6 py-4"><StatusBadge status={loan.status} /></td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{new Date(loan.createdAt).toLocaleDateString()}</td>
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
