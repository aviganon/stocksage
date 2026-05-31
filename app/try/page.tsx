'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useI18n } from '@/lib/i18n/context';

export default function TryPage() {
  const [agreeTerms,    setAgreeTerms]    = useState(false);
  const [agreeDisclaim, setAgreeDisclaim] = useState(false);
  const [agreeAge,      setAgreeAge]      = useState(false);
  const [loading, setLoading] = useState(false);
  const { signInAnon, getIdToken } = useAuth();
  const { dir } = useI18n();
  const router = useRouter();

  const canContinue = agreeTerms && agreeDisclaim && agreeAge;

  async function handleTry() {
    if (!canContinue) return;
    setLoading(true);
    try {
      await signInAnon();
      // Save consent to profile (anonymous uid)
      const token = await getIdToken();
      if (token) {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            consentAt: new Date().toISOString(),
            consentTerms: true,
            consentDisclaimer: true,
            consentAge18: true,
          }),
        }).catch(() => {});
      }
      router.push('/dashboard');
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir={dir}>
      <div className="w-full max-w-sm animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" dir="ltr" className="inline-flex items-center gap-2 text-2xl font-bold text-white">
            <span className="w-9 h-9 rounded-xl btn-glow flex items-center justify-center text-lg font-bold">S</span>
            Stock<span className="text-gradient">Sage</span>
          </Link>
          <p className="text-gray-400 mt-3 text-sm">3 סריקות מהירות חינמיות — ללא הרשמה</p>
        </div>

        {/* Consent card */}
        <div className="glass-card rounded-3xl p-8 space-y-5">

          <p className="text-white text-sm font-medium">לפני שמתחילים — אישור קצר:</p>

          <div className="space-y-3.5">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-500 shrink-0" />
              <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                קראתי ומסכים/ה ל
                <Link href="/terms" target="_blank" className="text-indigo-400 hover:underline mx-1">תנאי השימוש</Link>
                ול
                <Link href="/privacy" target="_blank" className="text-indigo-400 hover:underline mx-1">מדיניות הפרטיות</Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={agreeDisclaim} onChange={(e) => setAgreeDisclaim(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-500 shrink-0" />
              <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                <strong className="text-gray-300">מאשר/ת</strong> ש-StockSage אינה ייעוץ השקעות מורשה לפי חוק תשנ"ה-1995. כל החלטה — באחריותי.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={agreeAge} onChange={(e) => setAgreeAge(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-500 shrink-0" />
              <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                גילי <strong className="text-gray-300">18 ומעלה</strong>
              </span>
            </label>
          </div>

          <div className="h-px bg-white/8" />

          <button
            onClick={handleTry}
            disabled={loading || !canContinue}
            className="w-full btn-glow disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl text-sm font-semibold transition-all"
          >
            {loading ? 'מתחיל...' : 'התחל 3 סריקות חינמיות ←'}
          </button>

          <p className="text-center text-xs text-gray-600">
            ללא כרטיס אשראי · ללא הרשמה · הדוחות לא נשמרים
          </p>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-gray-600">או</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        <div className="flex gap-3 mt-4">
          <Link href="/signup" className="flex-1 text-center glass text-gray-300 hover:text-white text-sm py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
            הרשמה חינמית
          </Link>
          <Link href="/login" className="flex-1 text-center glass text-gray-300 hover:text-white text-sm py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
            כניסה
          </Link>
        </div>
      </div>
    </div>
  );
}
