import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, AuthError } from '@/lib/admin';
import { updateUserPlan } from '@/lib/usage/tracker';
import { z } from 'zod';

const Schema = z.object({ plan: z.enum(['free', 'pro']) });

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
  if (!parsed.success) return NextResponse.json({ error: 'Invalid plan value' }, { status: 400 });

  await updateUserPlan(uid, parsed.data.plan);
  return NextResponse.json({ ok: true, uid, plan: parsed.data.plan });
}
