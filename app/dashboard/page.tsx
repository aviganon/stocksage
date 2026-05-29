'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';

interface ReportStep {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

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
  steps?: ReportStep[];
}

const STEP_LABELS: Record<string, string> = {
  data_collection: 'איסוף נתונים',
  profile:         'פרופיל חברה',
  financials:      'ניתוח פיננסי',
  events:          'אירועים',
  competitive:     'תחרות',
  risks:           'סיכונים',
  synthesis:       'סינתזה',
};

function useElapsed(startedAt: string) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    function update() {
      const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(m > 0 ? `${m}:${String(s).padStart(2, '0')} דק׳` : `${s} שנ׳`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function ActiveResearchCard({ report }: { report: Report }) {
  const elapsed = useElapsed(report.startedAt);
  const steps = (report.steps ?? []).filter((s) => s.stepId !== 'data_collection');
  const completed = steps.filter((s) => s.status === 'completed' || s.status === 'failed').length;
  const pct = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;
  const depthLabel = report.depth === 'quick' ? 'מהיר' : report.depth === 'standard' ? 'מלא' : 'עמוק';

  const stepIcon = (status: string) => {
    if (status === 'completed') return <span className="text-green-400">✓</span>;
    if (status === 'running')   return <span className="text-blue-400 animate-pulse">⬤</span>;
    if (status === 'failed')    return <span className="text-red-400">✗</span>;
    return <span className="text-white/20">○</span>;
  };

  return (
    <Link
      href={`/report/${report.id}`}
      className="block bg-blue-500/8 border border-blue-500/25 rounded-2xl p-5 hover:bg-blue-500/12 transition-colors group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-300">
              {report.assetId.split(':')[1]?.slice(0, 2) ?? '??'}
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-white font-semibold">{report.assetName}</p>
            <p className="text-gray-500 text-xs">{report.assetId} · {depthLabel} · {elapsed}</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg group-hover:bg-blue-500/20 transition-colors">
          פתח מחקר →
        </span>
      </div>

      {/* Step list */}
      {steps.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mb-4">
          {steps.map((s) => (
            <div key={s.stepId} className="flex items-center gap-2 text-xs">
              {stepIcon(s.status)}
              <span className={
                s.status === 'running'   ? 'text-blue-300 font-medium' :
                s.status === 'completed' ? 'text-gray-400' :
                s.status === 'failed'    ? 'text-red-400' :
                'text-white/30'
              }>
                {STEP_LABELS[s.stepId] ?? s.stepId}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{completed}/{steps.length} שלבים</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function ReportProgress({ steps }: { steps: ReportStep[] }) {
  const analysis = steps.filter((s) => s.stepId !== 'data_collection');
  const completed = analysis.filter((s) => s.status === 'completed' || s.status === 'failed').length;
  const running   = analysis.find((s) => s.status === 'running');
  const pct       = analysis.length > 0 ? Math.round((completed / analysis.length) * 100) : 0;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">
          {running
            ? <span className="text-blue-400">⬤ {STEP_LABELS[running.stepId] ?? running.stepId}</span>
            : <span>{completed}/{analysis.length} שלבים</span>}
        </span>
        <span className="text-xs text-gray-600">{pct}%</span>
      </div>
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
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

type Depth = 'quick' | 'standard' | 'deep';

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

const DEPTH_OPTIONS: { value: Depth; label: string; icon: string; desc: string; time: string; steps: string; recommended?: boolean }[] = [
  { value: 'quick',    label: 'מהיר',    icon: '⚡', desc: 'פרופיל, פיננסים וסינתזה', time: '~20 שנ׳', steps: '3 שלבים' },
  { value: 'standard', label: 'מלא',     icon: '📊', desc: 'ניתוח מקיף של 6 שלבים',  time: '~60 שנ׳', steps: '6 שלבים', recommended: true },
  { value: 'deep',     label: 'עמוק',    icon: '🔬', desc: 'כל 6 שלבים + חיפוש רשת', time: '~2 דקות', steps: '6 + Web' },
];

const POPULAR_TASE: SearchResult[] = [
  { id: 'TASE:TEVA',  symbol: 'TEVA',  name: 'טבע תעשיות',       exchange: 'TASE' },
  { id: 'TASE:ICL',   symbol: 'ICL',   name: 'כימיקלים לישראל',  exchange: 'TASE' },
  { id: 'TASE:ESLT',  symbol: 'ESLT',  name: 'אלביט מערכות',     exchange: 'TASE' },
  { id: 'TASE:POLI',  symbol: 'POLI',  name: 'בנק הפועלים',      exchange: 'TASE' },
  { id: 'TASE:LUMI',  symbol: 'LUMI',  name: 'בנק לאומי',        exchange: 'TASE' },
  { id: 'TASE:NICE',  symbol: 'NICE',  name: 'NICE מערכות',      exchange: 'TASE' },
  { id: 'TASE:AZRG',  symbol: 'AZRG',  name: 'עזריאלי',          exchange: 'TASE' },
  { id: 'TASE:BEZQ',  symbol: 'BEZQ',  name: 'בזק',              exchange: 'TASE' },
];

const EXCHANGE_COLORS: Record<string, string> = {
  TASE:   'bg-indigo-500/15 text-indigo-300',
  NASDAQ: 'bg-blue-500/15 text-blue-300',
  NYSE:   'bg-cyan-500/15 text-cyan-300',
  CRYPTO: 'bg-orange-500/15 text-orange-300',
};

export default function DashboardPage() {
  const { user, loading: authLoading, getIdToken, logout } = useAuth();
  const router = useRouter();

  const [reports, setReports]           = useState<Report[]>([]);
  const [usage, setUsage]               = useState<Usage | null>(null);
  const [query, setQuery]               = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching]       = useState(false);
  const [selected, setSelected]         = useState<SearchResult | null>(null);
  const [depth, setDepth]               = useState<Depth>('standard');
  const [starting, setStarting]         = useState(false);
  const [loadingData, setLoadingData]   = useState(true);
  const [error, setError]               = useState('');

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
    if (reportsRes.ok) setReports((await reportsRes.json()).reports ?? []);
    if (userRes.ok)    setUsage((await userRes.json()).usage);
    setLoadingData(false);
  }, [getIdToken]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  // Refetch when user navigates back to this tab/page (handles Next.js router cache)
  useEffect(() => {
    const onVisible = () => { if (!document.hidden && user) fetchData(); };
    const onFocus   = () => { if (user) fetchData(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, fetchData]);

  useEffect(() => {
    const hasRunning = reports.some((r) => r.status === 'running' || r.status === 'pending');
    if (!hasRunning) return;
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [reports, fetchData]);

  async function handleSearch(q: string) {
    setQuery(q);
    setSelected(null);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.ok) setSearchResults((await res.json()).results ?? []);
    } finally {
      setSearching(false);
    }
  }

  function handleSelect(r: SearchResult) {
    setSelected(r);
    setQuery(`${r.symbol} — ${r.name}`);
    setSearchResults([]);
    setError('');
  }

  function handleClear() {
    setSelected(null);
    setQuery('');
    setSearchResults([]);
    setError('');
  }

  async function startReport() {
    if (!selected) return;
    setStarting(true);
    setError('');
    try {
      const token = await getIdToken();
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ assetId: selected.id, depth, language: 'he' }),
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

  const isAtLimit    = usage?.plan === 'free' && (usage?.used ?? 0) >= (usage?.limit ?? 3);
  const activeReports = reports.filter((r) => r.status === 'running' || r.status === 'pending');
  const doneReports   = reports.filter((r) => r.status !== 'running' && r.status !== 'pending');

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
              <span className="text-sm text-gray-400">
                {usage.plan === 'pro'
                  ? <span className="text-indigo-300 font-medium">Pro ✦</span>
                  : <span>{usage.used}/{usage.limit} דוחות</span>}
              </span>
            )}
            <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
            <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">הגדרות</Link>
            {user.email === 'ganonavi@gmail.com' && (
              <Link href="/admin" className="text-sm text-red-400/70 hover:text-red-300 transition-colors">Admin</Link>
            )}
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">יציאה</button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Usage banner */}
        {usage?.plan === 'free' && (
          <div className={`mb-8 rounded-xl px-5 py-4 flex items-center justify-between ${isAtLimit ? 'bg-red-500/10 border border-red-500/20' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
            <div>
              <p className="text-sm font-medium text-white">
                {isAtLimit ? 'הגעת למגבלת הדוחות החינמיים' : `נותרו ${(usage?.limit ?? 3) - (usage?.used ?? 0)} דוחות חינמיים החודש`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">שדרג ל-Pro לדוחות ללא הגבלה — $19/חודש</p>
            </div>
            <button onClick={handleUpgrade} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shrink-0">
              שדרג ל-Pro
            </button>
          </div>
        )}

        {/* Active research section */}
        {activeReports.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">מחקר פעיל</h2>
            </div>
            <div className="space-y-3">
              {activeReports.map((r) => (
                <ActiveResearchCard key={r.id} report={r} />
              ))}
            </div>
          </div>
        )}

        {/* Search section */}
        <div className="mb-12">
          <h1 className="text-2xl font-bold text-white mb-6">מחקר מניה חדש</h1>

          {/* Search input */}
          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="חפש מניה — TEVA, Check Point, Apple, בנק לאומי..."
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-2xl px-5 py-4 text-base outline-none transition-colors"
              disabled={starting || isAtLimit}
            />
            {searching && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            )}
            {selected && (
              <button
                onClick={handleClear}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xl leading-none transition-colors"
              >
                ×
              </button>
            )}

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-2 bg-[#14141f] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                onMouseDown={(e) => e.preventDefault()}
              >
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onMouseDown={() => handleSelect(r)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      {r.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{r.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{r.symbol}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${EXCHANGE_COLORS[r.exchange] ?? 'bg-white/5 text-gray-400'}`}>
                      {r.exchange}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular TASE stocks (shown when no query and no selection) */}
          {!query && !selected && !isAtLimit && (
            <div className="mb-6">
              <p className="text-xs text-gray-600 mb-2.5">מניות ת״א פופולריות</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TASE.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    className="text-xs bg-white/5 hover:bg-indigo-500/10 border border-white/8 hover:border-indigo-500/30 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span className="font-semibold text-white">{s.symbol}</span>
                    <span className="text-gray-500 mr-1"> · {s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Depth selector (shown after selecting an asset) */}
          {selected && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mt-2">
              {/* Selected asset header */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
                  {selected.symbol.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{selected.name}</p>
                  <p className="text-gray-500 text-xs">{selected.symbol} · {selected.exchange}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EXCHANGE_COLORS[selected.exchange] ?? 'bg-white/5 text-gray-400'}`}>
                  {selected.exchange}
                </span>
              </div>

              {/* Depth cards */}
              <p className="text-sm text-gray-400 mb-4">בחר עומק מחקר</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {DEPTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDepth(opt.value)}
                    className={`relative p-4 rounded-xl border text-right transition-all ${
                      depth === opt.value
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/8 bg-white/3 hover:border-white/20'
                    }`}
                  >
                    {opt.recommended && (
                      <span className="absolute -top-2.5 right-3 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">מומלץ</span>
                    )}
                    <div className="text-2xl mb-2">{opt.icon}</div>
                    <div className={`font-semibold text-sm mb-1 ${depth === opt.value ? 'text-indigo-300' : 'text-white'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{opt.steps}</div>
                    <div className="text-xs text-gray-600">{opt.time}</div>
                  </button>
                ))}
              </div>

              {/* Description of selected depth */}
              <p className="text-xs text-gray-500 mb-5">
                {DEPTH_OPTIONS.find((o) => o.value === depth)?.desc}
              </p>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <button
                onClick={startReport}
                disabled={starting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {starting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    מתחיל מחקר...
                  </>
                ) : (
                  <>התחל מחקר ←</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Completed reports list */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">הדוחות שלי</h2>
          {loadingData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : doneReports.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-4">📊</p>
              <p>{activeReports.length > 0 ? 'המחקר הראשון שלך עדיין רץ — הוא יופיע כאן כשיסיים' : 'אין דוחות עדיין — חפש מניה למעלה כדי להתחיל'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {doneReports.map((r) => (
                <Link
                  key={r.id}
                  href={`/report/${r.id}`}
                  className="flex items-center justify-between bg-white/5 border border-white/8 hover:bg-white/8 rounded-xl px-5 py-4 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
                      {r.assetId.split(':')[1]?.slice(0, 2) ?? '??'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{r.assetName}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {r.assetId} · {r.depth === 'quick' ? 'מהיר' : r.depth === 'standard' ? 'מלא' : 'עמוק'} · {new Date(r.startedAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
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
