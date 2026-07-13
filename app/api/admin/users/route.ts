import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, AuthError } from '@/lib/admin';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';
import { z } from 'zod';

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

  const onlineThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes

  const users = usersSnap.docs
    .map((doc) => {
      const d = doc.data();
      const stats = reportsByUser[doc.id] ?? { count: 0, cost: 0 };
      const lastSeenAt = (d['lastSeenAt'] as string) ?? null;
      return {
        uid: doc.id,
        email: d['email'] ?? null,
        // Real accounts (Google/password) always have an email; anonymous
        // "guest" sessions from /try never do. Use that to flag guests.
        isGuest: !d['email'],
        firstName: (d['firstName'] as string) ?? null,
        lastName:  (d['lastName']  as string) ?? null,
        plan: (d['plan'] as string) ?? 'free',
        createdAt: (d['createdAt'] as string) ?? null,
        lastSeenAt,
        online: lastSeenAt ? lastSeenAt >= onlineThreshold : false,
        reportsThisMonth: stats.count,
        costThisMonth: Number(stats.cost.toFixed(4)),
        lastReport: stats.lastReport ?? null,
      };
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return NextResponse.json({ users, total: users.length });
}

// ─── POST /api/admin/users — create new user ─────────────────────────────────

const CreateSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName:  z.string().max(50).optional(),
  plan:      z.enum(['free', 'pro']).default('free'),
  notes:     z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try { await verifyAdmin(); }
  catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.code === 'forbidden' ? 403 : 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });

  const { email, password, firstName, lastName, plan, notes } = parsed.data;

  // Create Firebase Auth user
  let uid: string;
  try {
    const auth = getAdminAuth();
    const userRecord = await auth.createUser({ email, password, emailVerified: false });
    uid = userRecord.uid;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('EMAIL_EXISTS') || msg.includes('email-already-exists')) {
      return NextResponse.json({ error: 'כתובת האימייל כבר קיימת במערכת' }, { status: 409 });
    }
    return NextResponse.json({ error: `שגיאה ביצירת משתמש: ${msg}` }, { status: 500 });
  }

  // Create Firestore profile
  const profile = {
    uid, email, firstName, lastName: lastName ?? '',
    plan,
    notes: notes ?? '',
    suspended: false,
    reportLimitOverride: null,
    createdAt: new Date().toISOString(),
    createdByAdmin: true,
  };
  await getAdminDb().collection('users').doc(uid).set(profile);

  return NextResponse.json({ ok: true, uid, email, plan }, { status: 201 });
}
