import { NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';

export async function DELETE() {
  let uid: string;
  try {
    ({ uid } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const db = getAdminDb();
  const auth = getAdminAuth();

  // Soft-delete all user reports
  const reportsSnap = await db.collection('reports').where('uid', '==', uid).get();
  const batch = db.batch();
  const deletedAt = new Date().toISOString();
  for (const doc of reportsSnap.docs) {
    batch.update(doc.ref, { deletedAt });
  }

  // Delete user profile
  batch.delete(db.collection('users').doc(uid));
  await batch.commit();

  // Delete Firebase Auth account
  try {
    await auth.deleteUser(uid);
  } catch {
    // Auth user may already be gone — not a fatal error
  }

  return NextResponse.json({ ok: true });
}
