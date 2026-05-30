'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import ReportView from '@/components/report/report-view';

export default function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#e8e8f0]">
      {/* Minimal nav — just logo */}
      <nav className="glass-nav sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-xl font-bold text-white">
            Stock<span className="text-indigo-400">Sage</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-up">
        <ReportView reportId={reportId} />
      </div>
    </div>
  );
}
