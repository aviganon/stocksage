import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, AuthError } from '@/lib/admin';
import { setCredits, getUserProfile } from '@/lib/usage/tracker';
import { z } from 'zod';

const Schema = z.object({
  standard: z.number().int().min(0).optional(),
  deep: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    await verifyAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.code === 'forbidden' ? 403 : 401 });
    }
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const { uid } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid credits value' }, { status: 400 });

  await setCredits(uid, parsed.data);
  
  const profile = await getUserProfile(uid);
  return NextResponse.json({ 
    ok: true, 
    uid, 
    credits: profile?.credits ?? { standard: 0, deep: 0 } 
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    await verifyAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.code === 'forbidden' ? 403 : 401 });
    }
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const { uid } = await params;
  const profile = await getUserProfile(uid);
  
  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  return NextResponse.json({ 
    ok: true, 
    uid,
    email: profile.email,
    plan: profile.plan,
    credits: profile.credits ?? { standard: 0, deep: 0 },
    creditsUsed: profile.creditsUsed ?? { standard: 0, deep: 0 },
  });
}
