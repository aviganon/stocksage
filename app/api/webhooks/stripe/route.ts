import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { updateUserPlan } from '@/lib/usage/tracker';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    return NextResponse.json({ error: `Webhook error: ${String(e)}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;
      if (uid) {
        await updateUserPlan(uid, 'pro');
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : null;
      if (customerId) {
        const stripe = getStripe();
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const uid = customer.metadata?.uid;
        if (uid) await updateUserPlan(uid, 'free');
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
