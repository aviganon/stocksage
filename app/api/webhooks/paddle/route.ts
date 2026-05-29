import { NextRequest, NextResponse } from 'next/server';
import { getPaddle } from '@/lib/paddle';
import { getAdminDb } from '@/lib/firebase/admin';
import { activateProCredits } from '@/lib/usage/tracker';
import { FieldValue } from 'firebase-admin/firestore';
import type { EventEntity } from '@paddle/paddle-node-sdk';

export async function POST(req: NextRequest) {
  const rawBody   = await req.text();
  const signature = req.headers.get('paddle-signature') ?? '';
  const secret    = process.env.PADDLE_WEBHOOK_SECRET ?? '';

  let event: EventEntity;
  try {
    const paddle = getPaddle();
    event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
  } catch (e) {
    console.error('[webhook/paddle] Signature verification failed', String(e));
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventType = event.eventType;

  // ── Per-report payment (one-time transaction) ────────────────────────────────
  if (eventType === 'transaction.completed') {
    const tx = event.data as { id?: string; customData?: Record<string, unknown>; subscriptionId?: string };
    const customData = tx.customData;
    const uid     = customData?.['uid']     as string | undefined;
    const assetId = customData?.['assetId'] as string | undefined;
    const depth   = customData?.['depth']   as string | undefined;
    const txId    = tx.id;

    if (uid && txId) {
      // Pro subscription renewal — tx has subscriptionId but no assetId/depth
      if (tx.subscriptionId && !assetId) {
        await activateProCredits(uid, tx.subscriptionId);
        console.log(`[webhook/paddle] Pro renewed uid=${uid} sub=${tx.subscriptionId}`);
      } else if (uid && assetId && depth) {
        // Per-report payment — record it
        const db = getAdminDb();
        await db.collection('payments').add({
          uid, assetId, depth, txId,
          createdAt: FieldValue.serverTimestamp(),
        });
        console.log(`[webhook/paddle] Per-report paid uid=${uid} depth=${depth} asset=${assetId}`);
      }
    }
  }

  // ── Pro subscription activated (first time) ──────────────────────────────────
  if (eventType === 'subscription.activated') {
    const sub = event.data as { id?: string; customData?: Record<string, unknown> };
    const uid = sub.customData?.['uid'] as string | undefined;
    if (uid) {
      await activateProCredits(uid, sub.id);
      console.log(`[webhook/paddle] Pro activated uid=${uid} sub=${sub.id}`);
    }
  }

  // ── Pro subscription cancelled ───────────────────────────────────────────────
  if (eventType === 'subscription.canceled') {
    const sub = event.data as { customData?: Record<string, unknown> };
    const uid = sub.customData?.['uid'] as string | undefined;
    if (uid) {
      const db = getAdminDb();
      await db.collection('users').doc(uid).update({ plan: 'free', updatedAt: new Date().toISOString() });
      console.log(`[webhook/paddle] Pro cancelled uid=${uid}`);
    }
  }

  return NextResponse.json({ received: true });
}
