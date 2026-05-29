import { NextResponse } from 'next/server';
import { verifyAdmin, AuthError } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    await verifyAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.code === 'forbidden' ? 403 : 401 });
    }
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const db = getAdminDb();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [usersSnap, reportsMonthSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('reports').where('startedAt', '>=', startOfMonth).get(),
  ]);

  // Aggregate per-user report stats for this month
  const reportsByUser: Record<string, { count: number; cost: number; lastReport?: string }> = {};
  for (const doc of reportsMonthSnap.docs) {
    const d = doc.data();
    const uid = d['uid'] as string;
    if (!uid) continue;
    if (!reportsByUser[uid]) reportsByUser[uid] = { count: 0, cost: 0 };
    reportsByUser[uid]!.count++;
    reportsByUser[uid]!.cost += Number(d['costUSD']) || 0;
    const started = d['startedAt'] as string | undefined;
    if (started && (!reportsByUser[uid]!.lastReport || started > reportsByUser[uid]!.lastReport!)) {
      reportsByUser[uid]!.lastReport = started;
    }
  }

  const users = usersSnap.docs
    .map((doc) => {
      const d = doc.data();
      const stats = reportsByUser[doc.id] ?? { count: 0, cost: 0 };
      return {
        uid: doc.id,
        email: d['email'] ?? null,
        plan: (d['plan'] as string) ?? 'free',
        createdAt: (d['createdAt'] as string) ?? null,
        reportsThisMonth: stats.count,
        costThisMonth: Number(stats.cost.toFixed(4)),
        lastReport: stats.lastReport ?? null,
      };
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return NextResponse.json({ users, total: users.length });
}
