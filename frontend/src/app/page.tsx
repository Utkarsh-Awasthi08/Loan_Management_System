'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (user.role === 'BORROWER') {
      router.replace('/borrower');
    } else {
      router.replace('/dashboard');
    }
  }, [user, isLoading]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
