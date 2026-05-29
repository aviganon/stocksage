import { NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { ensureUserProfile, canRunReport, touchLastSeen, checkAndResetProCredits } from '@/lib/usage/tracker';
import { getAdminDb } from '@/lib/firebase/admin';

const OWNER_EMAIL = process.env.ADMIN_EMAIL ?? 'ganonavi@gmail.com';

export async function GET() {
  let uid: string;
  let email: string | null;
  try {
    ({ uid, email } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  await checkAndResetProCredits(uid).catch(() => {});

  const db = getAdminDb();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [profile, usage, reportsSnap, reportsMonthSnap] = await Promise.all([
    ensureUserProfile(uid, email),
    canRunReport(uid),
    db.collection('reports').where('uid', '==', uid).get(),
    db.collection('reports').where('uid', '==', uid).where('startedAt', '>=', startOfMonth).get(),
    touchLastSeen(uid),
  ]);

  // Aggregate cost stats
  const allReports   = reportsSnap.docs.map(d => d.data());
  const monthReports = reportsMonthSnap.docs.map(d => d.data());

  const stats = {
    totalReports:      allReports.length,
    totalCost:         allReports.reduce((s, r) => s + (Number(r['costUSD']) || 0), 0),
    thisMonthReports:  monthReports.length,
    thisMonthCost:     monthReports.reduce((s, r) => s + (Number(r['costUSD']) || 0), 0),
    byDepth: {
      quick:    { count: allReports.filter(r => r['depth'] === 'quick').length,    cost: allReports.filter(r => r['depth'] === 'quick').reduce((s,r) => s+(Number(r['costUSD'])||0), 0) },
      standard: { count: allReports.filter(r => r['depth'] === 'standard').length, cost: allReports.filter(r => r['depth'] === 'standard').reduce((s,r) => s+(Number(r['costUSD'])||0), 0) },
      deep:     { count: allReports.filter(r => r['depth'] === 'deep').length,     cost: allReports.filter(r => r['depth'] === 'deep').reduce((s,r) => s+(Number(r['costUSD'])||0), 0) },
    },
  };

  return NextResponse.json({ profile, usage, isOwner: email === OWNER_EMAIL, stats });
}
