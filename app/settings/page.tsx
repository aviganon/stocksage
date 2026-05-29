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

interface UserDetail {
  profile: {
    uid: string; email: string | null; plan: 'free' | 'pro';
    suspended?: boolean; reportLimitOverride?: number | null;
    notes?: string; createdAt?: string;
  };
  stats: {
    reportsTotal: number; reportsThisMonth: number;
    costTotal: number; costThisMonth: number; lastReport: string | null;
  };
}

type OwnerTab = 'overview' | 'users' | 'account';

// ─── Edit User Drawer ─────────────────────────────────────────────────────────

function EditUserDrawer({ uid, getIdToken, onClose, onSaved, onDeleted }: {
  uid: string;
  getIdToken: () => Promise<string | null>;
  onClose: () => void;
  onSaved: (uid: string, updates: Partial<AdminUser>) => void;
  onDeleted: (uid: string) => void;
}) {
  const [detail, setDetail]   = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]     = useState('');

  // Editable fields
  const [plan, setPlan]           = useState<'free' | 'pro'>('free');
  const [suspended, setSuspended] = useState(false);
  const [limitOverride, setLimitOverride] = useState<string>('');
  const [notes, setNotes]         = useState('');

  useEffect(() => {
    (async () => {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, { headers: { Authorization: `Bearer ${token ?? ''}` } });
      if (res.ok) {
        const d: UserDetail = await res.json();
        setDetail(d);
        setPlan(d.profile.plan);
        setSuspended(d.profile.suspended ?? false);
        setLimitOverride(d.profile.reportLimitOverride != null ? String(d.profile.reportLimitOverride) : '');
        setNotes(d.profile.notes ?? '');
      }
      setLoading(false);
    })();
  }, [uid, getIdToken]);

  async function handleSave() {
    setSaving(true); setError('');
    const token = await getIdToken();
    const res = await fetch(`/api/admin/users/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({
        plan,
        suspended,
        reportLimitOverride: limitOverride !== '' ? Number(limitOverride) : null,
        notes,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved(uid, { plan, email: detail?.profile.email ?? null });
      onClose();
    } else {
      setError('שגיאה בשמירה');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const token = await getIdToken();
    const res = await fetch(`/api/admin/users/${uid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token ?? ''}` } });
    if (res.ok) { onDeleted(uid); onClose(); }
    else { setDeleting(false); setError('שגיאה במחיקה'); }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full w-full max-w-md bg-[#0f0f1a] border-r border-white/10 z-50 overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <h2 className="text-lg font-semibold text-white">עריכת משתמש</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none transition-colors">×</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !detail ? (
          <p className="text-red-400 p-6">שגיאה בטעינת פרטי משתמש</p>
        ) : (
          <div className="p-6 space-y-6">

            {/* Read-only info */}
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">אימייל</span>
                <span className="text-white font-medium">{detail.profile.email ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">UID</span>
                <span className="text-gray-400 font-mono text-xs">{uid.slice(0, 16)}…</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">הצטרף</span>
                <span className="text-white">{detail.profile.createdAt ? new Date(detail.profile.createdAt).toLocaleDateString('he-IL') : '—'}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'דוחות סה״כ',  value: detail.stats.reportsTotal },
                { label: 'דוחות החודש', value: detail.stats.reportsThisMonth },
                { label: 'עלות סה״כ',   value: `$${detail.stats.costTotal.toFixed(3)}` },
                { label: 'עלות החודש',  value: `$${detail.stats.costThisMonth.toFixed(3)}` },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {detail.stats.lastReport && (
              <p className="text-xs text-gray-600">דוח אחרון: {new Date(detail.stats.lastReport).toLocaleDateString('he-IL')}</p>
            )}

            {/* Plan */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">פלאן</label>
              <div className="flex gap-2">
                {(['free', 'pro'] as const).map((p) => (
                  <button key={p} onClick={() => setPlan(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${plan === p ? 'bg-indigo-600 text-white' : 'bg-white/8 text-gray-400 hover:bg-white/15'}`}>
                    {p === 'pro' ? 'Pro ✦' : 'Free'}
                  </button>
                ))}
              </div>
            </div>

            {/* Report limit override */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">מגבלת דוחות מותאמת / חודש</label>
              <input
                type="number"
                min="0"
                value={limitOverride}
                onChange={(e) => setLimitOverride(e.target.value)}
                placeholder="ריק = ברירת מחדל (3 / ∞)"
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            {/* Suspended toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">השעיית משתמש</p>
                <p className="text-xs text-gray-600 mt-0.5">משתמש מושעה לא יכול לבצע מחקרים</p>
              </div>
              <button
                onClick={() => setSuspended(!suspended)}
                className={`relative w-12 h-6 rounded-full transition-colors ${suspended ? 'bg-red-600' : 'bg-white/15'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${suspended ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">הערות פנימיות</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="הערות לשימוש אדמין בלבד..."
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors resize-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {/* Actions */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>

            {/* Delete */}
            <div className="border-t border-white/8 pt-4">
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  מחק משתמש לצמיתות
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-300">פעולה זו אינה הפיכה. כל הדוחות יימחקו.</p>
                  <div className="flex gap-2">
                    <button onClick={handleDelete} disabled={deleting}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      {deleting ? 'מוחק...' : 'אשר מחיקה'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({ getIdToken, onClose, onCreated }: {
  getIdToken: () => Promise<string | null>;
  onClose: () => void;
  onCreated: (user: AdminUser) => void;
}) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan]       = useState<'free' | 'pro'>('free');
  const [notes, setNotes]     = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    setPassword(Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
    setShowPass(true);
  }

  async function handleCreate() {
    if (!email || !password) { setError('אימייל וסיסמה נדרשים'); return; }
    setCreating(true); setError('');
    const token = await getIdToken();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({ email, password, plan, notes }),
    });
    const d = await res.json();
    setCreating(false);
    if (!res.ok) { setError(d.error ?? 'שגיאה ביצירת משתמש'); return; }
    onCreated({ uid: d.uid, email, plan, createdAt: new Date().toISOString(), reportsThisMonth: 0, costThisMonth: 0, lastReport: null });
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
            <h2 className="text-lg font-semibold text-white">יצירת משתמש חדש</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none transition-colors">×</button>
          </div>

          <div className="p-6 space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">אימייל *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">סיסמה * (מינימום 8 תווים)</label>
              <div className="flex gap-2">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                />
                <button onClick={generatePassword}
                  className="text-xs bg-white/8 hover:bg-white/15 text-gray-300 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap">
                  🎲 צור
                </button>
              </div>
              {showPass && password && <p className="text-xs text-yellow-400 font-mono">{password}</p>}
            </div>

            {/* Plan */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">פלאן</label>
              <div className="flex gap-2">
                {(['free', 'pro'] as const).map((p) => (
                  <button key={p} onClick={() => setPlan(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${plan === p ? 'bg-indigo-600 text-white' : 'bg-white/8 text-gray-400 hover:bg-white/15'}`}>
                    {p === 'pro' ? 'Pro ✦' : 'Free'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">הערות (אופציונלי)</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="לקוח VIP, הוזמן מאירוע..."
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button onClick={handleCreate} disabled={creating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors mt-2">
              {creating ? 'יוצר משתמש...' : 'צור משתמש'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Owner Settings (tabbed) ──────────────────────────────────────────────────

function OwnerSettings({ user, data, getIdToken, logout }: {
  user: { email: string | null };
  data: UserData;
  getIdToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}) {
  const [tab, setTab]         = useState<OwnerTab>('overview');
  const [stats, setStats]     = useState<AdminStats | null>(null);
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [search, setSearch]   = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

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
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Stock<span className="text-indigo-400">Sage</span></Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">← לוח בקרה</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white">הגדרות</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">👑 בעלים</span>
        </div>

        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'MRR',            value: `$${stats?.revenue.mrr ?? 0}`,            sub: `${stats?.users.pro ?? 0} Pro × $19` },
                { label: 'סה״כ משתמשים', value: String(stats?.users.total ?? '—'),        sub: `+${stats?.users.newThisMonth ?? 0} החודש` },
                { label: 'דוחות החודש',  value: String(stats?.reports.thisMonth ?? '—'),   sub: `${stats?.reports.today ?? 0} היום` },
                { label: 'עלות API',      value: stats ? `$${stats.costs.thisMonth.toFixed(2)}` : '—', sub: `ממוצע $${stats?.costs.avgPerReport.toFixed(3) ?? 0}/דוח` },
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

        {/* ── Users ── */}
        {tab === 'users' && (
          <div>
            {/* Toolbar */}
            <div className="flex gap-3 mb-5 flex-wrap items-center">
              <input type="text" placeholder="חיפוש לפי אימייל..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-lg px-4 py-2 text-sm outline-none w-56 transition-colors" />
              {(['all', 'free', 'pro'] as const).map((p) => (
                <button key={p} onClick={() => setPlanFilter(p)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${planFilter === p ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  {p === 'all' ? 'הכל' : p}
                </button>
              ))}
              <span className="text-xs text-gray-600 mr-auto">{filtered.length} משתמשים</span>
              <button onClick={() => setShowCreate(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
                + משתמש חדש
              </button>
            </div>

            {/* Table */}
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
                        <button onClick={() => setEditingUid(u.uid)}
                          className="text-xs bg-white/8 hover:bg-indigo-500/20 hover:text-indigo-300 text-gray-400 px-3 py-1.5 rounded-lg transition-colors">
                          ✏️ ערוך
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Account ── */}
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
              <button onClick={async () => { await logout(); }} className="text-sm text-red-400 hover:text-red-300 transition-colors">
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

      {/* Edit drawer */}
      {editingUid && (
        <EditUserDrawer
          uid={editingUid}
          getIdToken={getIdToken}
          onClose={() => setEditingUid(null)}
          onSaved={(uid, updates) => setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, ...updates } : u))}
          onDeleted={(uid) => setUsers((prev) => prev.filter((u) => u.uid !== uid))}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateUserModal
          getIdToken={getIdToken}
          onClose={() => setShowCreate(false)}
          onCreated={(u) => setUsers((prev) => [u, ...prev])}
        />
      )}
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
    else { setDeleting(false); alert('שגיאה במחיקת החשבון.'); }
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
          <div className="flex items-center justify-between"><span className="text-gray-400 text-sm">אימייל</span><span className="text-white text-sm">{user.email}</span></div>
          {data.profile.createdAt && <div className="flex items-center justify-between"><span className="text-gray-400 text-sm">חשבון נוצר</span><span className="text-white text-sm">{new Date(data.profile.createdAt).toLocaleDateString('he-IL')}</span></div>}
        </div>

        {/* Pricing model info */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">תמחור</h2>
          <div className="space-y-3">
            {[
              { icon: '⚡', label: 'מהיר', price: 'חינמי תמיד', color: 'text-green-300', sub: '3 שלבי ניתוח' },
              { icon: '📊', label: 'מלא',  price: '$1.99 לדוח',  color: 'text-amber-300', sub: '6 שלבי ניתוח' },
              { icon: '🔬', label: 'עמוק', price: '$3.99 לדוח',  color: 'text-purple-300', sub: '6 שלבים + חיפוש רשת' },
            ].map((t) => (
              <div key={t.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{t.icon}</span>
                  <span className="text-white text-sm">{t.label}</span>
                  <span className="text-gray-600 text-xs">· {t.sub}</span>
                </div>
                <span className={`text-sm font-semibold ${t.color}`}>{t.price}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-white/8">
            <p className="text-xs text-gray-500">
              לשאלות על חיוב: <a href="mailto:support@stocksage.io" className="text-indigo-400 hover:underline">support@stocksage.io</a>
            </p>
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
              <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="מחק חשבון" className="w-full bg-white/5 border border-red-500/30 text-white rounded-lg px-4 py-2 text-sm outline-none" />
              <div className="flex gap-3">
                <button onClick={handleDeleteAccount} disabled={deleteInput !== 'מחק חשבון' || deleting} className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm transition-colors">{deleting ? 'מוחק...' : 'אשר מחיקה'}</button>
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
  const [data, setData]   = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

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
