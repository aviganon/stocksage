import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, AuthError } from '@/lib/admin';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';
import { z } from 'zod';

type RouteContext = { params: Promise<{ uid: string }> };

// ─── GET /api/admin/users/[uid] — full user details ──────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try { await verifyAdmin(); }
  catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.code === 'forbidden' ? 403 : 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const { uid } = await params;
  const db = getAdminDb();

  const [userSnap, reportsSnap] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('reports').where('uid', '==', uid).get(),
  ]);

  if (!userSnap.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const profile = { uid, ...userSnap.data() };
  const reports = reportsSnap.docs.map((d) => d.data());

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const reportsThisMonth = reports.filter((r) => (r['startedAt'] as string) >= startOfMonth);

  return NextResponse.json({
    profile,
    stats: {
      reportsTotal:     reports.length,
      reportsThisMonth: reportsThisMonth.length,
      costTotal:        reports.reduce((s, r) => s + (Number(r['costUSD']) || 0), 0),
      costThisMonth:    reportsThisMonth.reduce((s, r) => s + (Number(r['costUSD']) || 0), 0),
      lastReport:       reports.sort((a, b) => String(b['startedAt']).localeCompare(String(a['startedAt'])))[0]?.['startedAt'] ?? null,
    },
  });
}

// ─── PATCH /api/admin/users/[uid] — update user fields ──────────────────────

const UpdateSchema = z.object({
  plan:                z.enum(['free', 'pro']).optional(),
  suspended:           z.boolean().optional(),
  reportLimitOverride: z.number().int().min(0).nullable().optional(),
  notes:               z.string().max(1000).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try { await verifyAdmin(); }
  catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.code === 'forbidden' ? 403 : 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const { uid } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  const d = parsed.data;
  if (d.plan                !== undefined) updates['plan']                = d.plan;
  if (d.suspended           !== undefined) updates['suspended']           = d.suspended;
  if (d.reportLimitOverride !== undefined) updates['reportLimitOverride'] = d.reportLimitOverride;
  if (d.notes               !== undefined) updates['notes']               = d.notes;

  await getAdminDb().collection('users').doc(uid).update(updates);
  return NextResponse.json({ ok: true });
}

// ─── DELETE /api/admin/users/[uid] — permanently delete user ─────────────────

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try { await verifyAdmin(); }
  catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.code === 'forbidden' ? 403 : 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const { uid } = await params;
  const db   = getAdminDb();
  const auth = getAdminAuth();

  // Soft-delete all reports
  const snap = await db.collection('reports').where('uid', '==', uid).get();
  const batch = db.batch();
  const deletedAt = new Date().toISOString();
  for (const doc of snap.docs) batch.update(doc.ref, { deletedAt });
  batch.delete(db.collection('users').doc(uid));
  await batch.commit();

  try { await auth.deleteUser(uid); } catch { /* already gone */ }

  return NextResponse.json({ ok: true });
}
