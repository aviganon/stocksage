'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
  profile: { plan: 'free' | 'pro'; email: string | null; createdAt: string };
  usage: { used: number; limit: number; plan: 'free' | 'pro'; allowed: boolean };
  isOwner: boolean;
}

interface AdminStats {
  users: { total: number; free: number; pro: number; newThisMonth: number };
  reports: { thisMonth: number; today: number; lastMonth: number };
  costs: { thisMonth: number; lastMonth: number; avgPerReport: number };
  revenue: { mrr: number };
}

interface AdminUser {
  uid: string;
  email: string | null;
  plan: 'free' | 'pro';
  createdAt: string | null;
  reportsThisMonth: number;
  costThisMonth: number;
  lastReport: string | null;
}

type OwnerTab = 'overview' | 'users' | 'account';

// ─── Owner Settings (tabbed admin panel) ──────────────────────────────────────

function OwnerSettings({ user, data, getIdToken, logout }: {
  user: { email: string | null };
  data: UserData;
  getIdToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}) {
  const [tab, setTab]       = useState<OwnerTab>('overview');
  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const token = await getIdToken();
    const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token ?? ''}` } });
    if (res.ok) setStats(await res.json());
  }, [getIdToken]);

  const fetchUsers = useCallback(async () => {
    const token = await getIdToken();
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token ?? ''}` } });
    if (res.ok) setUsers((await res.json()).users ?? []);
  }, [getIdToken]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (tab === 'users') fetchUsers(); }, [tab, fetchUsers]);

  async function changePlan(uid: string, newPlan: 'free' | 'pro') {
    setUpdating(uid);
    const token = await getIdToken();
    const res = await fetch(`/api/admin/users/${uid}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({ plan: newPlan }),
    });
    if (res.ok) setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, plan: newPlan } : u));
    setUpdating(null);
  }

  const filtered = users.filter((u) => {
    if (planFilter !== 'all' && u.plan !== planFilter) return false;
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const TABS: { id: OwnerTab; label: string }[] = [
    { id: 'overview', label: '📊 סקירה' },
    { id: 'users',    label: '👥 משתמשים' },
    { id: 'account',  label: '⚙️ חשבון' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Stock<span className="text-indigo-400">Sage</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">← לוח בקרה</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header + tabs */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white">הגדרות</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">👑 בעלים</span>
        </div>

        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'MRR', value: `$${stats?.revenue.mrr ?? 0}`, sub: `${stats?.users.pro ?? 0} Pro × $19` },
                { label: 'סה״כ משתמשים', value: String(stats?.users.total ?? '—'), sub: `+${stats?.users.newThisMonth ?? 0} החודש` },
                { label: 'דוחות החודש', value: String(stats?.reports.thisMonth ?? '—'), sub: `${stats?.reports.today ?? 0} היום` },
                { label: 'עלות API', value: stats ? `$${stats.costs.thisMonth.toFixed(2)}` : '—', sub: `ממוצע $${stats?.costs.avgPerReport.toFixed(3) ?? 0}/דוח` },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-5">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/8 rounded-xl p-5">
                  <p className="text-xs text-gray-500 mb-1">רווחיות</p>
                  <p className={`text-xl font-bold ${stats.revenue.mrr - stats.costs.thisMonth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(stats.revenue.mrr - stats.costs.thisMonth).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">MRR פחות עלות API</p>
                </div>
                <div className="bg-white/5 border border-white/8 rounded-xl p-5">
                  <p className="text-xs text-gray-500 mb-1">משתמשי Free</p>
                  <p className="text-xl font-bold text-white">{stats.users.free}</p>
                  <p className="text-xs text-gray-600 mt-1">פוטנציאל להמרה</p>
                </div>
                <div className="bg-white/5 border border-white/8 rounded-xl p-5">
                  <p className="text-xs text-gray-500 mb-1">דוחות חודש שעבר</p>
                  <p className="text-xl font-bold text-white">{stats.reports.lastMonth}</p>
                  <p className="text-xs text-gray-600 mt-1">עלות: ${stats.costs.lastMonth.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Users tab ── */}
        {tab === 'users' && (
          <div>
            <div className="flex gap-3 mb-5 flex-wrap">
              <input
                type="text"
                placeholder="חיפוש לפי אימייל..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-lg px-4 py-2 text-sm outline-none w-56 transition-colors"
              />
              {(['all', 'free', 'pro'] as const).map((p) => (
                <button key={p} onClick={() => setPlanFilter(p)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${planFilter === p ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  {p === 'all' ? 'הכל' : p === 'free' ? 'Free' : 'Pro'}
                </button>
              ))}
              <span className="text-xs text-gray-600 self-center mr-auto">{filtered.length} משתמשים</span>
            </div>

            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-right px-5 py-3 font-medium">אימייל</th>
                    <th className="text-right px-5 py-3 font-medium">פלאן</th>
                    <th className="text-right px-5 py-3 font-medium">דוחות</th>
                    <th className="text-right px-5 py-3 font-medium">עלות</th>
                    <th className="text-right px-5 py-3 font-medium">הצטרף</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-gray-500 py-10">אין משתמשים</td></tr>
                  )}
                  {filtered.map((u) => (
                    <tr key={u.uid} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5 text-gray-200 font-mono text-xs">{u.email ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.plan === 'pro' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/8 text-gray-400'}`}>
                          {u.plan === 'pro' ? 'Pro' : 'Free'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-300">{u.reportsThisMonth}</td>
                      <td className="px-5 py-3.5 text-gray-300">{u.costThisMonth > 0 ? `$${u.costThisMonth.toFixed(3)}` : '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('he-IL') : '—'}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => changePlan(u.uid, u.plan === 'pro' ? 'free' : 'pro')}
                          disabled={updating === u.uid}
                          className={`text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-40 ${u.plan === 'pro' ? 'bg-white/8 hover:bg-white/15 text-gray-300' : 'bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200'}`}
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
        )}

        {/* ── Account tab ── */}
        {tab === 'account' && (
          <div className="max-w-lg space-y-5">
            <div className="bg-white/5 border border-white/8 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">פרטי חשבון</h2>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">אימייל</span>
                <span className="text-white text-sm">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">תפקיד</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">👑 בעלים</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">פלאן</span>
                <span className="text-indigo-300 text-sm font-medium">Pro ✦ (ללא חיוב)</span>
              </div>
              {data.profile.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">חשבון נוצר</span>
                  <span className="text-white text-sm">{new Date(data.profile.createdAt).toLocaleDateString('he-IL')}</span>
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
              <button
                onClick={async () => { await logout(); }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                יציאה מהחשבון
              </button>
            </div>

            <div className="flex gap-4 text-xs text-gray-600 pt-2">
              <Link href="/terms" className="hover:text-gray-400 transition-colors">תנאי שימוש</Link>
              <Link href="/privacy" className="hover:text-gray-400 transition-colors">מדיניות פרטיות</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Regular User Settings ────────────────────────────────────────────────────

function UserSettings({ user, data, getIdToken, logout }: {
  user: { email: string | null };
  data: UserData;
  getIdToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const plan  = data.profile.plan ?? 'free';
  const usage = data.usage;

  async function handleUpgrade() {
    const token = await getIdToken();
    const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token ?? ''}` } });
    const d = await res.json();
    if (d.url) window.location.href = d.url;
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'מחק חשבון') return;
    setDeleting(true);
    const token = await getIdToken();
    const res = await fetch('/api/account/delete', { method: 'DELETE', headers: { Authorization: `Bearer ${token ?? ''}` } });
    if (res.ok) { await logout(); router.push('/'); }
    else { setDeleting(false); alert('שגיאה במחיקת החשבון. נסה שוב.'); }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Stock<span className="text-indigo-400">Sage</span></Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">← לוח בקרה</Link>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold text-white">הגדרות חשבון</h1>

        <div className="bg-white/5 border border-white/8 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">פרטי חשבון</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">אימייל</span>
            <span className="text-white text-sm">{user.email}</span>
          </div>
          {data.profile.createdAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">חשבון נוצר</span>
              <span className="text-white text-sm">{new Date(data.profile.createdAt).toLocaleDateString('he-IL')}</span>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/8 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">פלאן ומנוי</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">פלאן נוכחי</span>
            <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${plan === 'pro' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/8 text-gray-300'}`}>
              {plan === 'pro' ? 'Pro ✦' : 'Free'}
            </span>
          </div>
          {plan === 'free' && usage && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">שימוש החודש</span>
              <span className="text-white text-sm">{usage.used} / {usage.limit} דוחות</span>
            </div>
          )}
          <div className="pt-3 border-t border-white/8">
            {plan === 'free' ? (
              <>
                <p className="text-sm text-gray-400 mb-3">שדרג ל-Pro לדוחות ללא הגבלה — $19/חודש</p>
                <button onClick={handleUpgrade} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">שדרג ל-Pro</button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">לביטול: <a href="mailto:support@stocksage.io" className="text-indigo-400 hover:underline">support@stocksage.io</a></p>
                <p className="text-xs text-gray-600 mt-1">ביטול ייכנס לתוקף בסוף תקופת החיוב הנוכחית.</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">אזור מסוכן</h2>
          <p className="text-sm text-gray-400">מחיקת החשבון תמחק לצמיתות את כל הדוחות שלך.</p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="text-sm text-red-400 hover:text-red-300 border border-red-500/30 px-4 py-2 rounded-lg transition-colors">מחק חשבון</button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-300">הקלד: <span className="font-mono font-bold">מחק חשבון</span></p>
              <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="מחק חשבון" className="w-full bg-white/5 border border-red-500/30 text-white rounded-lg px-4 py-2 text-sm outline-none" />
              <div className="flex gap-3">
                <button onClick={handleDeleteAccount} disabled={deleteInput !== 'מחק חשבון' || deleting}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  {deleting ? 'מוחק...' : 'אשר מחיקה'}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">ביטול</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 text-xs text-gray-600">
          <Link href="/terms" className="hover:text-gray-400 transition-colors">תנאי שימוש</Link>
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">מדיניות פרטיות</Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, loading: authLoading, getIdToken, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const token = await getIdToken();
      const res = await fetch('/api/user', { headers: { Authorization: `Bearer ${token ?? ''}` } });
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, [user, getIdToken]);

  if (authLoading || loading || !user || !data) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (data.isOwner) return <OwnerSettings user={user} data={data} getIdToken={getIdToken} logout={logout} />;
  return <UserSettings user={user} data={data} getIdToken={getIdToken} logout={logout} />;
}
