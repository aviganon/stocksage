'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const { signUp, signInWithGoogle, getIdToken } = useAuth();
  const router = useRouter();

  async function saveProfile(token: string, first: string, last: string) {
    if (!first && !last) return;
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName: first || undefined, lastName: last || undefined }),
    }).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) { setError('שם פרטי נדרש'); return; }
    if (password.length < 6) { setError('הסיסמה חייבת להיות לפחות 6 תווים'); return; }
    setError(''); setLoading(true);
    try {
      await signUp(email, password);
      const token = await getIdToken();
      if (token) await saveProfile(token, firstName.trim(), lastName.trim());
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאת הרשמה');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(''); setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-white">
            <span className="w-9 h-9 rounded-xl btn-glow flex items-center justify-center text-lg">S</span>
            Stock<span className="text-gradient">Sage</span>
          </Link>
          <p className="text-gray-400 mt-3 text-sm">יצירת חשבון חדש</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 glass-input hover:border-white/25 text-gray-200 hover:text-white py-3 rounded-2xl transition-all text-sm font-medium mb-6 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            הרשמה עם Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">או</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">שם פרטי *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full glass-input text-white rounded-2xl px-4 py-3 text-sm"
                  placeholder="ישראל"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">שם משפחה</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full glass-input text-white rounded-2xl px-4 py-3 text-sm"
                  placeholder="ישראלי"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">אימייל *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full glass-input text-white rounded-2xl px-4 py-3 text-sm"
                placeholder="you@example.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">סיסמה *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full glass-input text-white rounded-2xl px-4 py-3 text-sm"
                placeholder="מינימום 6 תווים"
                dir="ltr"
              />
            </div>
            {error && (
              <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-glow disabled:opacity-50 text-white font-semibold py-3 rounded-2xl text-sm"
            >
              {loading ? 'נרשם...' : 'צור חשבון'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          בהרשמה אתה מסכים ל<Link href="/terms" className="hover:text-gray-400">תנאי השימוש</Link>.
          לצרכי מידע בלבד — אינו ייעוץ השקעות.
        </p>
        <p className="text-center text-sm text-gray-500 mt-3">
          יש לך חשבון?{' '}
          <Link href="/login" className="text-indigo-300 hover:text-indigo-200 font-medium transition-colors">כניסה</Link>
        </p>
      </div>
    </div>
  );
}
