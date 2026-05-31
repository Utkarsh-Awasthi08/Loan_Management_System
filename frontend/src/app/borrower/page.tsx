'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { validateBRE, calculateLoan, formatINR } from '../../lib/bre';
import StatusBadge from '../../components/ui/StatusBadge';
import { Loan } from '../../types';

type Step = 1 | 2 | 3 | 4 | 5;

export default function BorrowerPage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Step 2 — Personal Details
  const [details, setDetails] = useState({
    fullName: '', pan: '', dateOfBirth: '', monthlySalary: '', employmentMode: 'SALARIED',
  });
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Step 3 — File Upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Step 4 — Loan Config
  const [loanAmount, setLoanAmount] = useState(150000);
  const [tenure, setTenure] = useState(180);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (user.role !== 'BORROWER') { router.replace('/dashboard'); return; }
    fetchMyProfile();
  }, [user, isLoading]);

  const fetchMyProfile = async () => {
    try {
      const { data } = await api.get('/borrower/me');
      setMyLoans(data.data.loans || []);
      const profile = data.data.profile;
      if (profile) {
        setDetails({
          fullName: profile.fullName,
          pan: profile.pan,
          dateOfBirth: profile.dateOfBirth?.split('T')[0] || '',
          monthlySalary: profile.monthlySalary.toString(),
          employmentMode: profile.employmentMode,
        });
        if (profile.breStatus === 'PASSED') setStep(profile.salarySlipUrl ? 4 : 3);
        else setStep(2);
      }
    } catch {}
    setPageLoading(false);
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBreErrors([]);

    // Client-side BRE check (UX)
    const clientCheck = validateBRE({
      dateOfBirth: details.dateOfBirth,
      monthlySalary: Number(details.monthlySalary),
      pan: details.pan,
      employmentMode: details.employmentMode as any,
    });
    if (!clientCheck.passed) {
      setBreErrors(clientCheck.failures);
      return;
    }

    setDetailsLoading(true);
    try {
      await api.post('/borrower/details', {
        ...details,
        monthlySalary: Number(details.monthlySalary),
      });
      setStep(3);
    } catch (err: any) {
      const failures = err.response?.data?.breFailures;
      if (failures?.length) setBreErrors(failures);
      else setBreErrors([err.response?.data?.message || 'Submission failed.']);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setUploadError('Please select a file.'); return; }
    setUploadError('');
    setUploadLoading(true);

    const formData = new FormData();
    formData.append('salarySlip', file);

    try {
      await api.post('/borrower/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStep(4);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleApply = async () => {
    setApplyError('');
    setApplyLoading(true);
    try {
      await api.post('/borrower/apply', { amount: loanAmount, tenureDays: tenure });
      await fetchMyProfile();
      setStep(5);
    } catch (err: any) {
      setApplyError(err.response?.data?.message || 'Application failed.');
    } finally {
      setApplyLoading(false);
    }
  };

  const { simpleInterest, totalRepayment } = calculateLoan(loanAmount, tenure);

  if (pageLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const steps = [
    { id: 1, label: 'Account' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Documents' },
    { id: 4, label: 'Loan' },
    { id: 5, label: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">L</div>
            <span className="font-semibold text-slate-800">LMS — Loan Application</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Welcome, {user?.name}</span>
            <button className="btn-secondary text-xs py-1.5" onClick={() => { useAuthStore.getState().clearAuth(); router.push('/auth/login'); }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${i > 0 ? 'flex-1' : ''}`}>
                {i > 0 && (
                  <div className={`flex-1 h-0.5 ${step > s.id - 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0
                  ${step === s.id ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                  : step > s.id ? 'bg-green-500 text-white' 
                  : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                  {step > s.id ? '✓' : s.id}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${step > s.id ? 'bg-blue-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Main Form */}
          <div className="md:col-span-2">
            {/* Step 1 — Already done (authenticated) */}
            {step === 1 && (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">You're logged in!</h2>
                <p className="text-slate-500 mb-6 text-sm">Your account is ready. Let's complete your profile.</p>
                <button className="btn-primary" onClick={() => setStep(2)}>Continue to Personal Details →</button>
              </div>
            )}

            {/* Step 2 — Personal Details */}
            {step === 2 && (
              <div className="card p-8">
                <h2 className="text-xl font-semibold mb-1">Personal Details</h2>
                <p className="text-slate-500 text-sm mb-6">We'll run an eligibility check based on your details.</p>

                {breErrors.length > 0 && (
                  <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="text-sm font-semibold text-red-800 mb-2">❌ Eligibility Check Failed</p>
                    <ul className="list-disc list-inside space-y-1">
                      {breErrors.map((err, i) => (
                        <li key={i} className="text-sm text-red-700">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleDetailsSubmit} className="space-y-5">
                  <div>
                    <label className="label">Full Name</label>
                    <input type="text" className="input-field" placeholder="As per PAN card" value={details.fullName}
                      onChange={(e) => setDetails({ ...details, fullName: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">PAN Number</label>
                      <input type="text" className="input-field" placeholder="ABCDE1234F" maxLength={10}
                        value={details.pan} onChange={(e) => setDetails({ ...details, pan: e.target.value.toUpperCase() })} required />
                    </div>
                    <div>
                      <label className="label">Date of Birth</label>
                      <input type="date" className="input-field" value={details.dateOfBirth}
                        onChange={(e) => setDetails({ ...details, dateOfBirth: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Monthly Salary (₹)</label>
                      <input type="number" className="input-field" placeholder="e.g. 50000" min={0}
                        value={details.monthlySalary} onChange={(e) => setDetails({ ...details, monthlySalary: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label">Employment Mode</label>
                      <select className="input-field" value={details.employmentMode}
                        onChange={(e) => setDetails({ ...details, employmentMode: e.target.value })}>
                        <option value="SALARIED">Salaried</option>
                        <option value="SELF_EMPLOYED">Self-Employed</option>
                        <option value="UNEMPLOYED">Unemployed</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={detailsLoading}>
                    {detailsLoading ? 'Checking eligibility...' : 'Check Eligibility & Continue →'}
                  </button>
                </form>
              </div>
            )}

            {/* Step 3 — Upload */}
            {step === 3 && (
              <div className="card p-8">
                <h2 className="text-xl font-semibold mb-1">Upload Salary Slip</h2>
                <p className="text-slate-500 text-sm mb-6">PDF, JPG or PNG — maximum 5 MB</p>

                {uploadError && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{uploadError}</div>
                )}

                <form onSubmit={handleUpload} className="space-y-5">
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition
                    ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" id="file-upload" className="hidden"
                      onChange={(e) => { setFile(e.target.files?.[0] || null); setUploadError(''); }} />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {file ? (
                        <div>
                          <p className="text-2xl mb-2">📎</p>
                          <p className="font-medium text-green-700">{file.name}</p>
                          <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-3xl mb-3">📄</p>
                          <p className="font-medium text-slate-600">Click to upload salary slip</p>
                          <p className="text-sm text-slate-400 mt-1">PDF, JPG, PNG (max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" className="btn-secondary flex-1" onClick={() => setStep(2)}>← Back</button>
                    <button type="submit" className="btn-primary flex-1" disabled={uploadLoading || !file}>
                      {uploadLoading ? 'Uploading...' : 'Upload & Continue →'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4 — Loan Config */}
            {step === 4 && (
              <div className="card p-8">
                <h2 className="text-xl font-semibold mb-1">Configure Your Loan</h2>
                <p className="text-slate-500 text-sm mb-6">Adjust sliders to see real-time calculations. Interest: 12% p.a.</p>

                {applyError && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{applyError}</div>
                )}

                <div className="space-y-7">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="label mb-0">Loan Amount</label>
                      <span className="text-lg font-bold text-blue-600">{formatINR(loanAmount)}</span>
                    </div>
                    <input type="range" min={50000} max={500000} step={5000} value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>₹50,000</span><span>₹5,00,000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="label mb-0">Tenure</label>
                      <span className="text-lg font-bold text-blue-600">{tenure} days</span>
                    </div>
                    <input type="range" min={30} max={365} step={1} value={tenure}
                      onChange={(e) => setTenure(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>30 days</span><span>365 days</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="btn-secondary flex-1" onClick={() => setStep(3)}>← Back</button>
                  <button className="btn-primary flex-1" onClick={handleApply} disabled={applyLoading}>
                    {applyLoading ? 'Submitting...' : '🚀 Apply Now'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5 — Success */}
            {step === 5 && (
              <div className="card p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-2xl font-bold text-green-700 mb-2">Application Submitted!</h2>
                <p className="text-slate-500 mb-2">Your loan application is now under review.</p>
                <p className="text-sm text-slate-400 mb-6">Our team will review and process it shortly.</p>
                <button className="btn-primary" onClick={() => setStep(4)}>Apply for Another Loan</button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Loan Calculator (visible in step 4) */}
            {step === 4 && (
              <div className="card p-5 bg-blue-600 text-white">
                <h3 className="font-semibold text-sm mb-4 opacity-90">LOAN SUMMARY</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-75">Principal</span>
                    <span className="font-semibold">{formatINR(loanAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-75">Tenure</span>
                    <span className="font-semibold">{tenure} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-75">Interest (12% p.a.)</span>
                    <span className="font-semibold">{formatINR(simpleInterest)}</span>
                  </div>
                  <div className="h-px bg-white/20" />
                  <div className="flex justify-between">
                    <span className="opacity-75 font-medium">Total Repayment</span>
                    <span className="font-bold text-lg">{formatINR(totalRepayment)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* My Applications */}
            {myLoans.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-sm text-slate-600 mb-3">MY APPLICATIONS</h3>
                <div className="space-y-2">
                  {myLoans.map((loan) => (
                    <div key={loan._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{formatINR(loan.amount)}</p>
                        <p className="text-xs text-slate-400">{loan.tenureDays} days</p>
                      </div>
                      <StatusBadge status={loan.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BRE Rules hint */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm text-slate-600 mb-3">ELIGIBILITY CRITERIA</h3>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-start gap-2"><span>✅</span>Age between 23–50 years</li>
                <li className="flex items-start gap-2"><span>✅</span>Monthly salary ≥ ₹25,000</li>
                <li className="flex items-start gap-2"><span>✅</span>Valid PAN (e.g. ABCDE1234F)</li>
                <li className="flex items-start gap-2"><span>✅</span>Salaried or self-employed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
