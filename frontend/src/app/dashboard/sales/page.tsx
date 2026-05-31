'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';

interface Lead {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  profile?: {
    fullName?: string;
    employmentMode?: string;
    monthlySalary?: number;
    breStatus?: string;
  };
}

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => fetchLeads(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/sales/leads?search=${search}`);
      setLeads(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sales — Lead Tracking</h1>
        <p className="text-slate-500 text-sm mt-1">Registered users who haven't applied for a loan yet</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <input type="text" className="input-field max-w-xs" placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="text-sm text-slate-500">{total} lead{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Employment</th>
                  <th className="px-6 py-3 text-left">Salary</th>
                  <th className="px-6 py-3 text-left">BRE Status</th>
                  <th className="px-6 py-3 text-left">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">{lead.name}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.email}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.profile?.employmentMode || '—'}</td>
                    <td className="px-6 py-4">
                      {lead.profile?.monthlySalary
                        ? `₹${lead.profile.monthlySalary.toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {lead.profile?.breStatus ? (
                        <span className={`badge ${
                          lead.profile.breStatus === 'PASSED' ? 'bg-green-100 text-green-800'
                          : lead.profile.breStatus === 'FAILED' ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                          {lead.profile.breStatus}
                        </span>
                      ) : <span className="text-slate-400 text-xs">No profile</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
