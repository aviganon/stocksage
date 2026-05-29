import { NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { getPaddle, PADDLE_PRO_PRICE_ID } from '@/lib/paddle';
import { ensureUserProfile } from '@/lib/usage/tracker';

export async function POST() {
  let uid: string;
  let email: string | null;
  try {
    ({ uid, email } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  if (!PADDLE_PRO_PRICE_ID) {
    return NextResponse.json({ error: 'Pro plan not configured' }, { status: 500 });
  }

  await ensureUserProfile(uid, email);

  try {
    const paddle = getPaddle();
    const transaction = await paddle.transactions.create({
      items: [{ priceId: PADDLE_PRO_PRICE_ID, quantity: 1 }],
      customData: { uid: String(uid), plan: 'pro' },
    });

    console.log('[billing/subscribe] Transaction created:', transaction.id);

    const checkoutUrl = transaction.checkout?.url
      ?? `https://checkout.paddle.com/checkout/${transaction.id}`;
    return NextResponse.json({ url: checkoutUrl });
  } catch (e: unknown) {
    const asObj = e as Record<string, unknown>;
    const errStr = e instanceof Error
      ? `${e.message} | ${JSON.stringify(asObj['errors'] ?? asObj['code'] ?? '')}`
      : String(e);
    console.error('[billing/subscribe] Paddle error:', errStr);
    return NextResponse.json({ error: errStr }, { status: 500 });
  }
}
