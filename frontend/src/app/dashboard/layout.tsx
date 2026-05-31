'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',              label: 'Overview',      icon: '📊', roles: ['ADMIN'] },
  { href: '/dashboard/sales',        label: 'Sales',         icon: '📋', roles: ['SALES', 'ADMIN'] },
  { href: '/dashboard/sanction',     label: 'Sanction',      icon: '✅', roles: ['SANCTION', 'ADMIN'] },
  { href: '/dashboard/disbursement', label: 'Disbursement',  icon: '💸', roles: ['DISBURSEMENT', 'ADMIN'] },
  { href: '/dashboard/collection',   label: 'Collection',    icon: '💰', roles: ['COLLECTION', 'ADMIN'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, initAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (user.role === 'BORROWER') { router.replace('/borrower'); return; }
  }, [user, isLoading]);

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const visibleNav = NAV_ITEMS.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">L</div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">LMS Dashboard</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-slate-700 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <button className="btn-secondary w-full text-xs py-1.5"
            onClick={() => { clearAuth(); router.push('/auth/login'); }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
