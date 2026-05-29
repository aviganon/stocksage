import { NextRequest, NextResponse } from 'next/server';
import { getPaddle } from '@/lib/paddle';
import { getAdminDb } from '@/lib/firebase/admin';
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

  if (event.eventType === 'transaction.completed') {
    const tx = event.data as { id?: string; customData?: Record<string, unknown> };
    const customData = tx.customData;
    const uid     = customData?.['uid']     as string | undefined;
    const assetId = customData?.['assetId'] as string | undefined;
    const depth   = customData?.['depth']   as string | undefined;
    const txId    = tx.id;

    if (uid && assetId && depth && txId) {
      const db = getAdminDb();
      await db.collection('payments').add({
        uid, assetId, depth, txId,
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`[webhook/paddle] Payment confirmed uid=${uid} depth=${depth} asset=${assetId}`);
    }
  }

  return NextResponse.json({ received: true });
}
