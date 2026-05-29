import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { getPaddle, PADDLE_PRICES } from '@/lib/paddle';
import { ensureUserProfile } from '@/lib/usage/tracker';
import { z } from 'zod';

const Schema = z.object({
  depth:   z.enum(['standard', 'deep']),
  assetId: z.string().min(3).max(100),
});

export async function POST(req: NextRequest) {
  let uid: string;
  let email: string | null;
  try {
    ({ uid, email } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { depth, assetId } = parsed.data;
  const priceId = PADDLE_PRICES[depth];

  console.log('[billing/checkout] priceId:', priceId, 'depth:', depth, 'uid:', uid?.slice(0,8));

  if (!priceId) {
    console.error('[billing/checkout] Price not configured for depth:', depth);
    return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';
  await ensureUserProfile(uid, email);

  try {
    const paddle = getPaddle();

    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { uid: String(uid), assetId: String(assetId), depth: String(depth) },
      checkout: {
        url: `${appUrl}/dashboard?paid=1&assetId=${encodeURIComponent(assetId)}&depth=${depth}`,
      },
    });

    console.log('[billing/checkout] Transaction created:', transaction.id, 'checkout:', transaction.checkout);

    // Paddle returns checkout.url as the hosted checkout page URL
    const checkoutUrl = transaction.checkout?.url
      ?? `https://checkout.paddle.com/${transaction.id}`;

    return NextResponse.json({ url: checkoutUrl });
  } catch (e: unknown) {
    const asObj = e as Record<string, unknown>;
    const extra = JSON.stringify(asObj['errors'] ?? asObj['code'] ?? asObj['type'] ?? '');
    const errStr = e instanceof Error ? `${e.message} | ${extra}` : String(e);
    console.error('[billing/checkout] Paddle error:', errStr);
    return NextResponse.json({ error: errStr }, { status: 500 });
  }
}
