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
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [usersSnap, reportsMonthSnap, reportsTodaySnap, reportsLastMonthSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('reports').where('startedAt', '>=', startOfMonth).get(),
    db.collection('reports').where('startedAt', '>=', startOfToday).get(),
    db.collection('reports')
      .where('startedAt', '>=', startOfLastMonth)
      .where('startedAt', '<', startOfMonth)
      .get(),
  ]);

  const users = usersSnap.docs.map((d) => d.data()) as Array<{ plan?: string; createdAt?: string }>;
  const proCount = users.filter((u) => u.plan === 'pro').length;
  const freeCount = users.length - proCount;
  const newUsersThisMonth = users.filter((u) => (u.createdAt ?? '') >= startOfMonth).length;

  const reportsThisMonth = reportsMonthSnap.docs.map((d) => d.data());
  const costThisMonth = reportsThisMonth.reduce((s, r) => s + (Number(r['costUSD']) || 0), 0);
  const avgCostPerReport = reportsThisMonth.length > 0 ? costThisMonth / reportsThisMonth.length : 0;
  const costLastMonth = reportsLastMonthSnap.docs.reduce((s, d) => s + (Number(d.data()['costUSD']) || 0), 0);

  return NextResponse.json({
    users: { total: users.length, free: freeCount, pro: proCount, newThisMonth: newUsersThisMonth },
    reports: {
      thisMonth: reportsThisMonth.length,
      today: reportsTodaySnap.size,
      lastMonth: reportsLastMonthSnap.size,
    },
    costs: { thisMonth: costThisMonth, lastMonth: costLastMonth, avgPerReport: avgCostPerReport },
    revenue: { mrr: proCount * 19 },
  });
}
