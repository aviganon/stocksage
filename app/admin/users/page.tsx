'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

interface AdminUser {
  uid: string;
  email: string | null;
  plan: 'free' | 'pro';
  createdAt: string | null;
  reportsThisMonth: number;
  costThisMonth: number;
  lastReport: string | null;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filtered, setFiltered] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const token = await getIdToken();
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token ?? ''}` } });
    if (res.status === 403 || res.status === 401) { router.push('/dashboard'); return; }
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, [getIdToken, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetchUsers();
  }, [user, authLoading, fetchUsers]);

  useEffect(() => {
    let result = users;
    if (planFilter !== 'all') result = result.filter((u) => u.plan === planFilter);
    if (search) result = result.filter((u) => u.email?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [users, search, planFilter]);

  async function changePlan(uid: string, newPlan: 'free' | 'pro') {
    setUpdating(uid);
    const token = await getIdToken();
    const res = await fetch(`/api/admin/users/${uid}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({ plan: newPlan }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, plan: newPlan } : u));
    }
    setUpdating(null);
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const proCount = users.filter((u) => u.plan === 'pro').length;
  const totalCost = users.reduce((s, u) => s + u.costThisMonth, 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">משתמשים</h1>
          <p className="text-gray-500 text-sm mt-1">
            {users.length} סה״כ · {proCount} Pro · עלות החודש: ${totalCost.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="חיפוש לפי אימייל..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-lg px-4 py-2 text-sm outline-none w-60 transition-colors"
        />
        {(['all', 'free', 'pro'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPlanFilter(p)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              planFilter === p ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {p === 'all' ? 'הכל' : p === 'free' ? 'חינמי' : 'Pro'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-right px-5 py-3 font-medium">אימייל</th>
              <th className="text-right px-5 py-3 font-medium">פלאן</th>
              <th className="text-right px-5 py-3 font-medium">דוחות/חודש</th>
              <th className="text-right px-5 py-3 font-medium">עלות/חודש</th>
              <th className="text-right px-5 py-3 font-medium">הצטרף</th>
              <th className="text-right px-5 py-3 font-medium">דוח אחרון</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-500 py-10">אין משתמשים</td></tr>
            )}
            {filtered.map((u) => (
              <tr key={u.uid} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td className="px-5 py-3.5 text-gray-200 font-mono text-xs">
                  {u.email ?? <span className="text-gray-600">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.plan === 'pro'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-white/8 text-gray-400'
                  }`}>
                    {u.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-300">{u.reportsThisMonth}</td>
                <td className="px-5 py-3.5 text-gray-300">
                  {u.costThisMonth > 0 ? `$${u.costThisMonth.toFixed(3)}` : '—'}
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('he-IL') : '—'}
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">
                  {u.lastReport ? new Date(u.lastReport).toLocaleDateString('he-IL') : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => changePlan(u.uid, u.plan === 'pro' ? 'free' : 'pro')}
                    disabled={updating === u.uid}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-40 ${
                      u.plan === 'pro'
                        ? 'bg-white/8 hover:bg-white/15 text-gray-300'
                        : 'bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200'
                    }`}
                  >
                    {updating === u.uid ? '...' : u.plan === 'pro' ? 'הורד ל-Free' : 'שדרג ל-Pro'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
