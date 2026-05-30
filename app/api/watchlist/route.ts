/**
 * GET  /api/watchlist — returns user's watched assets with live quotes + price history
 * POST /api/watchlist — add an asset to watchlist
 * DELETE /api/watchlist?assetId=... — remove from watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getQuote, getHistorical } from '@/lib/data/orchestrator';
import type { AssetId } from '@/lib/data/types';

const COLLECTION = 'watchlists';

// Default watchlist for new users (spotlight stocks)
const DEFAULT_ASSETS: AssetId[] = [
  'TASE:TEVA', 'TASE:NICE', 'NASDAQ:NVDA', 'NASDAQ:AAPL', 'NASDAQ:MSFT', 'NYSE:TSLA',
];

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
}

async function getWatchlist(uid: string): Promise<AssetId[]> {
  const db  = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return DEFAULT_ASSETS;
  const data = doc.data();
  const assets = data?.['assets'] as AssetId[] | undefined;
  return assets?.length ? assets : DEFAULT_ASSETS;
}

export async function GET() {
  let uid: string;
  try { ({ uid } = await verifyAuth()); }
  catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const assets = await getWatchlist(uid);

  // Fetch quotes + history in parallel (30-day history for sparkline)
  const cards = await Promise.all(
    assets.map(async (id): Promise<WatchlistCard> => {
      const parts  = String(id).split(':');
      const exch   = parts[0] ?? '';
      const symbol = parts[1] ?? parts[0] ?? '';
      // Friendly display name from symbol
      const name = symbol;

      try {
        const [q, hist] = await Promise.allSettled([
          getQuote(id),
          getHistorical(id, '1mo'),
        ]);

        const quote   = q.status   === 'fulfilled' ? q.value   : null;
        const history = hist.status === 'fulfilled' ? hist.value : [];

        return {
          id, symbol, name, exchange: exch,
          price:         quote?.price        ?? null,
          change:        quote?.change       ?? null,
          changePercent: quote?.changePercent ?? null,
          currency:      quote?.currency     ?? null,
          history: history.slice(-30).map((h) => ({ date: h.date, close: h.close })),
        };
      } catch {
        return { id, symbol, name, exchange: exch, price: null, change: null, changePercent: null, currency: null, history: [] };
      }
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

  const db  = getAdminDb();
  const ref = db.collection(COLLECTION).doc(uid);
  const doc = await ref.get();

  const current: AssetId[] = doc.exists
    ? ((doc.data()?.['assets'] as AssetId[]) ?? DEFAULT_ASSETS)
    : DEFAULT_ASSETS;

  if (!current.includes(assetId)) {
    // Add to front, keep max 20
    const updated = [assetId, ...current].slice(0, 20);
    await ref.set({ assets: updated, updatedAt: new Date().toISOString() }, { merge: true });
  }

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

  const db  = getAdminDb();
  const ref = db.collection(COLLECTION).doc(uid);
  const doc = await ref.get();

  const current: AssetId[] = doc.exists
    ? ((doc.data()?.['assets'] as AssetId[]) ?? DEFAULT_ASSETS)
    : DEFAULT_ASSETS;

  const updated = current.filter((a) => a !== assetId);
  await ref.set({ assets: updated, updatedAt: new Date().toISOString() }, { merge: true });

  return NextResponse.json({ ok: true });
}
