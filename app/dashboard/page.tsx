'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';

interface Report {
  id: string;
  assetId: string;
  assetName: string;
  status: string;
  depth: string;
  language: string;
  startedAt: string;
  completedAt?: string;
  costUSD: number;
}

interface Usage {
  allowed: boolean;
  used: number;
  limit: number;
  plan: 'free' | 'pro';
}

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-green-400 bg-green-400/10',
  partial: 'text-yellow-400 bg-yellow-400/10',
  running: 'text-blue-400 bg-blue-400/10 animate-pulse',
  pending: 'text-gray-400 bg-gray-400/10',
  failed: 'text-red-400 bg-red-400/10',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'הושלם', partial: 'חלקי', running: 'בריצה...', pending: 'ממתין', failed: 'נכשל',
};

export default function DashboardPage() {
  const { user, loading: authLoading, getIdToken, logout } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [reportsRes, userRes] = await Promise.all([
      fetch('/api/research', { headers }),
      fetch('/api/user', { headers }),
    ]);

    if (reportsRes.ok) {
      const data = await reportsRes.json();
      setReports(data.reports ?? []);
    }
    if (userRes.ok) {
      const data = await userRes.json();
      setUsage(data.usage);
    }
    setLoadingData(false);
  }, [getIdToken]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Auto-refresh running reports
  useEffect(() => {
    const hasRunning = reports.some((r) => r.status === 'running' || r.status === 'pending');
    if (!hasRunning) return;
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [reports, fetchData]);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results ?? []);
      }
    } finally {
      setSearching(false);
    }
  }

  async function startReport(assetId: string, assetName: string) {
    setStarting(true); setError(''); setSearchResults([]); setQuery('');
    try {
      const token = await getIdToken();
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ assetId, depth: 'standard', language: 'he' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message ?? 'שגיאה'); return; }
      router.push(`/report/${data.reportId}`);
    } finally {
      setStarting(false);
    }
  }

  async function handleUpgrade() {
    const token = await getIdToken();
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  if (authLoading || !user) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Stock<span className="text-indigo-400">Sage</span>
          </Link>
          <div className="flex items-center gap-4">
            {usage && (
              <div className="text-sm text-gray-400">
                {usage.plan === 'pro' ? (
                  <span className="text-indigo-300 font-medium">Pro</span>
                ) : (
                  <span>{usage.used}/{usage.limit} דוחות</span>
                )}
              </div>
            )}
            <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
            <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">הגדרות</Link>
            {user.email === 'galfainbur@gmail.com' && (
              <Link href="/admin" className="text-sm text-red-400/70 hover:text-red-300 transition-colors">Admin</Link>
            )}
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">יציאה</button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Usage banner */}
        {usage && usage.plan === 'free' && (
          <div className={`mb-8 rounded-xl px-5 py-4 flex items-center justify-between ${usage.used >= usage.limit ? 'bg-red-500/10 border border-red-500/20' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
            <div>
              <p className="text-sm font-medium text-white">
                {usage.used >= usage.limit ? 'הגעת למגבלת הדוחות החינמיים' : `נותרו ${usage.limit - usage.used} דוחות חינמיים החודש`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">שדרג ל-Pro לדוחות ללא הגבלה</p>
            </div>
            <button onClick={handleUpgrade} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shrink-0">
              שדרג ל-Pro
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-6">מחקר מניה חדש</h1>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="חפש מניה — TEVA, Check Point, בנק לאומי..."
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-2xl px-5 py-4 text-base outline-none transition-colors pr-12"
              disabled={starting || (usage?.plan === 'free' && (usage?.used ?? 0) >= (usage?.limit ?? 3))}
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            )}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#14141f] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => startReport(r.id, r.name)}
                    disabled={starting}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      {r.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{r.name}</p>
                      <p className="text-gray-500 text-xs">{r.symbol} · {r.exchange}</p>
                    </div>
                    <span className="text-xs text-indigo-400 shrink-0">
                      {starting ? 'מתחיל...' : 'נתח →'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* Reports list */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">הדוחות שלי</h2>
          {loadingData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-4">📊</p>
              <p>אין דוחות עדיין — חפש מניה למעלה כדי להתחיל</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <Link
                  key={r.id}
                  href={`/report/${r.id}`}
                  className="flex items-center justify-between bg-white/5 border border-white/8 hover:bg-white/8 rounded-xl px-5 py-4 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300">
                      {r.assetId.split(':')[1]?.slice(0, 2) ?? '??'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{r.assetName}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {r.assetId} · {r.depth} · {new Date(r.startedAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'text-gray-400 bg-gray-400/10'}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                    <span className="text-gray-600 group-hover:text-gray-400 transition-colors">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
