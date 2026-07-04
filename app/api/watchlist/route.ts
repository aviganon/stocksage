/**
 * GET    /api/watchlist — watched assets with live quotes, history, alerts & P&L
 * POST   /api/watchlist — add an asset
 * PATCH  /api/watchlist — set alert / holdings for an asset
 * DELETE /api/watchlist?assetId=... — remove an asset (and its meta)
 *
 * Storage: watchlists/{uid} = { assets: string[], meta: { [assetId]: AssetMeta } }.
 * `assets` is kept as a plain array (the research pipeline auto-appends to it);
 * per-asset alert/holdings live in the parallel `meta` map — backward compatible.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getQuote, getHistorical } from '@/lib/data/orchestrator';
import { z } from 'zod';
import type { AssetId } from '@/lib/data/types';

const COLLECTION = 'watchlists';

const DEFAULT_ASSETS: AssetId[] = [
  'TASE:TEVA', 'TASE:NICE', 'NASDAQ:NVDA', 'NASDAQ:AAPL', 'NASDAQ:MSFT', 'NYSE:TSLA',
];

export interface AssetMeta {
  alertPrice?: number;
  alertDir?: 'above' | 'below';
  costBasis?: number;
  shares?: number;
}

export interface WatchlistCard {
  id: AssetId;
  symbol: string;
  name: string;
  exchange: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  history: { date: string; close: number }[];
  // Alerts & holdings
  alertPrice: number | null;
  alertDir: 'above' | 'below' | null;
  alertTriggered: boolean;
  costBasis: number | null;
  shares: number | null;
  plAbs: number | null;
  plPct: number | null;
}

type WatchlistDoc = { assets?: AssetId[]; meta?: Record<string, AssetMeta> };

async function readDoc(uid: string): Promise<{ assets: AssetId[]; meta: Record<string, AssetMeta> }> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(uid).get();
  const data = (doc.exists ? doc.data() : null) as WatchlistDoc | null;
  const assets = data?.assets?.length ? data.assets : DEFAULT_ASSETS;
  return { assets, meta: data?.meta ?? {} };
}

export async function GET() {
  let uid: string;
  try { ({ uid } = await verifyAuth()); }
  catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const { assets, meta } = await readDoc(uid);

  const cards = await Promise.all(
    assets.map(async (id): Promise<WatchlistCard> => {
      const parts = String(id).split(':');
      const exch = parts[0] ?? '';
      const symbol = parts[1] ?? parts[0] ?? '';
      const m = meta[id] ?? {};

      let price: number | null = null, change: number | null = null;
      let changePercent: number | null = null, currency: string | null = null;
      let history: { date: string; close: number }[] = [];

      try {
        const [q, hist] = await Promise.allSettled([getQuote(id), getHistorical(id, '1mo')]);
        const quote = q.status === 'fulfilled' ? q.value : null;
        history = (hist.status === 'fulfilled' ? hist.value : []).slice(-30).map((h) => ({ date: h.date, close: h.close }));
        price = quote?.price ?? null;
        change = quote?.change ?? null;
        changePercent = quote?.changePercent ?? null;
        currency = quote?.currency ?? null;
      } catch { /* leave nulls */ }

      const alertPrice = m.alertPrice ?? null;
      const alertDir = m.alertDir ?? null;
      const alertTriggered = price != null && alertPrice != null && alertDir != null
        ? (alertDir === 'above' ? price >= alertPrice : price <= alertPrice)
        : false;

      const costBasis = m.costBasis ?? null;
      const shares = m.shares ?? null;
      const plAbs = price != null && costBasis != null && shares != null ? (price - costBasis) * shares : null;
      const plPct = price != null && costBasis != null && costBasis > 0 ? ((price / costBasis) - 1) * 100 : null;

      return {
        id, symbol, name: symbol, exchange: exch,
        price, change, changePercent, currency, history,
        alertPrice, alertDir, alertTriggered, costBasis, shares, plAbs, plPct,
      };
    }),
  );

  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  let uid: string;
  try { ({ uid } = await verifyAuth()); }
  catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const { assetId } = await req.json().catch(() => ({}));
  if (!assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 });

  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(uid);
  const { assets } = await readDoc(uid);

  if (!assets.includes(assetId)) {
    const updated = [assetId, ...assets].slice(0, 20);
    await ref.set({ assets: updated, updatedAt: new Date().toISOString() }, { merge: true });
  }

  return NextResponse.json({ ok: true });
}

const PatchSchema = z.object({
  assetId: z.string().min(3).max(100),
  alertPrice: z.number().positive().nullable().optional(),
  alertDir: z.enum(['above', 'below']).nullable().optional(),
  costBasis: z.number().positive().nullable().optional(),
  shares: z.number().nonnegative().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  let uid: string;
  try { ({ uid } = await verifyAuth()); }
  catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { assetId, alertPrice, alertDir, costBasis, shares } = parsed.data;
  const { meta } = await readDoc(uid);
  const current = meta[assetId] ?? {};

  // Build next meta: undefined = leave as-is, null = clear the field.
  const next: AssetMeta = { ...current };
  if (alertPrice !== undefined) { if (alertPrice === null) delete next.alertPrice; else next.alertPrice = alertPrice; }
  if (alertDir !== undefined)   { if (alertDir === null)   delete next.alertDir;   else next.alertDir = alertDir; }
  if (costBasis !== undefined)  { if (costBasis === null)  delete next.costBasis;  else next.costBasis = costBasis; }
  if (shares !== undefined)     { if (shares === null)     delete next.shares;     else next.shares = shares; }

  await getAdminDb().collection(COLLECTION).doc(uid).set(
    { meta: { ...meta, [assetId]: next }, updatedAt: new Date().toISOString() },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  let uid: string;
  try { ({ uid } = await verifyAuth()); }
  catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const assetId = req.nextUrl.searchParams.get('assetId');
  if (!assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 });

  const { assets, meta } = await readDoc(uid);
  const updated = assets.filter((a) => a !== assetId);
  const nextMeta = { ...meta };
  delete nextMeta[assetId];

  await getAdminDb().collection(COLLECTION).doc(uid).set(
    { assets: updated, meta: nextMeta, updatedAt: new Date().toISOString() },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}
