import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { updateUserProfile } from '@/lib/usage/tracker';
import { z } from 'zod';

const Schema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName:  z.string().max(50).optional(),
  phone:     z.string().max(20).optional(),
  city:      z.string().max(50).optional(),
});

export async function PATCH(req: NextRequest) {
  let uid: string;
  try {
    ({ uid } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  await updateUserProfile(uid, parsed.data);
  return NextResponse.json({ ok: true });
}
