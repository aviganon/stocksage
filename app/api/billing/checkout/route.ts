import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { getStripe, PLANS } from '@/lib/stripe';
import { getUserProfile, ensureUserProfile } from '@/lib/usage/tracker';

export async function POST(req: NextRequest) {
  let uid: string;
  let email: string | null;
  try {
    ({ uid, email } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const stripe = getStripe();
  const profile = await ensureUserProfile(uid, email);

  // Reuse existing customer or create new one
  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: email ?? undefined, metadata: { uid } });
    customerId = customer.id;
  }

  const priceId = PLANS.pro.priceId;
  if (!priceId) return NextResponse.json({ error: 'Pro plan not configured' }, { status: 500 });

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: { uid },
  });

  return NextResponse.json({ url: session.url });
}
