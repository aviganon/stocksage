'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';

interface Stats {
  users: { total: number; free: number; pro: number; newThisMonth: number };
  reports: { thisMonth: number; today: number; lastMonth: number };
  costs: { thisMonth: number; lastMonth: number; avgPerReport: number };
  revenue: { mrr: number };
}

function StatCard({ label, value, sub, color = 'indigo' }: {
  label: string; value: string; sub?: string; color?: 'indigo' | 'green' | 'yellow' | 'red';
}) {
  const colors = {
    indigo: 'border-indigo-500/20 bg-indigo-500/5',
    green: 'border-green-500/20 bg-green-500/5',
    yellow: 'border-yellow-500/20 bg-yellow-500/5',
    red: 'border-red-500/20 bg-red-500/5',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    (async () => {
      const token = await getIdToken();
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token ?? ''}` } });
      if (res.status === 403 || res.status === 401) { router.push('/dashboard'); return; }
      if (!res.ok) { setError('שגיאה בטעינת נתונים'); setLoading(false); return; }
      setStats(await res.json());
      setLoading(false);
    })();
  }, [user, authLoading, getIdToken, router]);

  if (authLoading || loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <p className="text-red-400 py-10">{error}</p>;
  if (!stats) return null;

  const costDiff = stats.costs.lastMonth > 0
    ? ((stats.costs.thisMonth - stats.costs.lastMonth) / stats.costs.lastMonth * 100).toFixed(0)
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">סקירה כללית</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Revenue & Users */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">הכנסות ומשתמשים</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="MRR" value={`$${stats.revenue.mrr}`} sub={`${stats.users.pro} Pro × $19`} color="green" />
          <StatCard label="סה״כ משתמשים" value={String(stats.users.total)} sub={`+${stats.users.newThisMonth} החודש`} />
          <StatCard label="Pro" value={String(stats.users.pro)} sub={`${stats.users.free} חינמיים`} color="indigo" />
          <StatCard label="חדשים החודש" value={String(stats.users.newThisMonth)} />
        </div>
      </section>

      {/* Reports */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">דוחות</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="דוחות החודש" value={String(stats.reports.thisMonth)} sub={`${stats.reports.lastMonth} חודש שעבר`} />
          <StatCard label="דוחות היום" value={String(stats.reports.today)} color="indigo" />
          <StatCard label="ממוצע לדוח" value={`$${stats.costs.avgPerReport.toFixed(3)}`} color="yellow" />
        </div>
      </section>

      {/* Costs */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">עלויות API (Anthropic)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            label="עלות החודש"
            value={`$${stats.costs.thisMonth.toFixed(2)}`}
            sub={costDiff ? `${Number(costDiff) > 0 ? '+' : ''}${costDiff}% מחודש שעבר` : undefined}
            color={Number(costDiff) > 20 ? 'red' : 'yellow'}
          />
          <StatCard label="עלות חודש שעבר" value={`$${stats.costs.lastMonth.toFixed(2)}`} />
          <StatCard
            label="רווחיות (MRR - עלות)"
            value={`$${(stats.revenue.mrr - stats.costs.thisMonth).toFixed(2)}`}
            color="green"
          />
        </div>
      </section>

      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        ניהול משתמשים →
      </Link>
    </div>
  );
}
