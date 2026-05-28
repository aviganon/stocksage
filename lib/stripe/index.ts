import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, { apiVersion: '2026-05-27.dahlia' });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: 'Free',
    reportsPerMonth: 3,
    priceId: null,
  },
  pro: {
    name: 'Pro',
    reportsPerMonth: Infinity,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
  },
} as const;

export type Plan = keyof typeof PLANS;
