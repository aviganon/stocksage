import { NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { ensureUserProfile, canRunReport } from '@/lib/usage/tracker';

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
  ]);

  return NextResponse.json({ profile, usage });
}
