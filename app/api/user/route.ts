import { NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { ensureUserProfile, canRunReport, touchLastSeen } from '@/lib/usage/tracker';

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

  const [profile, usage] = await Promise.all([
    ensureUserProfile(uid, email),
    canRunReport(uid),
    touchLastSeen(uid),
  ]);

  return NextResponse.json({ profile, usage, isOwner: email === OWNER_EMAIL });
}
