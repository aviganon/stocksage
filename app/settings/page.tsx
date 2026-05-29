'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';

interface UserData {
  profile: { plan: 'free' | 'pro'; email: string | null; createdAt: string };
  usage: { used: number; limit: number; plan: 'free' | 'pro'; allowed: boolean };
  isOwner: boolean;
}

export default function SettingsPage() {
  const { user, loading: authLoading, getIdToken, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

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

  async function handleUpgrade() {
    const token = await getIdToken();
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    const d = await res.json();
    if (d.url) window.location.href = d.url;
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'מחק חשבון') return;
    setDeleting(true);
    const token = await getIdToken();
    const res = await fetch('/api/account/delete', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    if (res.ok) {
      await logout();
      router.push('/');
    } else {
      setDeleting(false);
      alert('שגיאה במחיקת החשבון. נסה שוב.');
    }
  }

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const plan      = data?.profile.plan ?? 'free';
  const usage     = data?.usage;
  const isOwner   = data?.isOwner ?? false;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Stock<span className="text-indigo-400">Sage</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← לוח בקרה
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold text-white">הגדרות חשבון</h1>

        {/* Account Info */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">פרטי חשבון</h2>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">אימייל</span>
            <span className="text-white text-sm">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">תפקיד</span>
            {isOwner ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                👑 בעלים
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-gray-300">
                משתמש
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">חשבון נוצר</span>
            <span className="text-white text-sm">
              {data?.profile.createdAt
                ? new Date(data.profile.createdAt).toLocaleDateString('he-IL')
                : '—'}
            </span>
          </div>
        </div>

        {/* Owner section */}
        {isOwner && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider">ניהול מערכת</h2>
            <p className="text-sm text-gray-400">גישה מלאה לדאשבורד הניהולי</p>
            <div className="flex gap-3">
              <Link
                href="/admin"
                className="text-sm bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
              >
                Admin Dashboard →
              </Link>
              <Link
                href="/admin/users"
                className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                ניהול משתמשים
              </Link>
            </div>
          </div>
        )}

        {/* Plan & Billing */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">פלאן ומנוי</h2>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">פלאן נוכחי</span>
            <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
              plan === 'pro'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/8 text-gray-300'
            }`}>
              {plan === 'pro' ? 'Pro ✦' : 'Free'}
            </span>
          </div>

          {plan === 'free' && usage && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">שימוש החודש</span>
              <span className="text-white text-sm">{usage.used} / {usage.limit} דוחות</span>
            </div>
          )}

          {plan === 'pro' && !isOwner && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">דוחות</span>
              <span className="text-white text-sm">ללא הגבלה</span>
            </div>
          )}

          {/* Billing actions */}
          <div className="pt-3 border-t border-white/8 space-y-3">
            {plan === 'free' && !isOwner && (
              <>
                <p className="text-sm text-gray-400">שדרג ל-Pro לדוחות ללא הגבלה — $19/חודש</p>
                <button
                  onClick={handleUpgrade}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  שדרג ל-Pro
                </button>
              </>
            )}

            {plan === 'pro' && !isOwner && (
              <>
                <p className="text-sm text-gray-400">
                  לביטול או שינוי מנוי, שלח מייל ל:
                  <a href="mailto:support@stocksage.io" className="text-indigo-400 hover:underline mr-1">
                    support@stocksage.io
                  </a>
                </p>
                <p className="text-xs text-gray-600">נגיב תוך 24 שעות. ביטול ייכנס לתוקף בסוף תקופת החיוב הנוכחית.</p>
              </>
            )}

            {isOwner && (
              <p className="text-sm text-gray-500">חשבון בעלים — ללא חיוב</p>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        {!isOwner && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">אזור מסוכן</h2>
            <p className="text-sm text-gray-400">
              מחיקת החשבון תמחק לצמיתות את כל הדוחות שלך. פעולה זו אינה ניתנת לביטול.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-4 py-2 rounded-lg transition-colors"
              >
                מחק חשבון
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-300">
                  כדי לאשר, הקלד: <span className="font-mono font-bold">מחק חשבון</span>
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="מחק חשבון"
                  className="w-full bg-white/5 border border-red-500/30 focus:border-red-400 text-white rounded-lg px-4 py-2 text-sm outline-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== 'מחק חשבון' || deleting}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    {deleting ? 'מוחק...' : 'אשר מחיקה'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                    className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legal */}
        <div className="flex gap-4 text-xs text-gray-600">
          <Link href="/terms" className="hover:text-gray-400 transition-colors">תנאי שימוש</Link>
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">מדיניות פרטיות</Link>
        </div>
      </div>
    </div>
  );
}
