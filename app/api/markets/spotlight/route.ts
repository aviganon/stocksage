import { NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { getQuote } from '@/lib/data/orchestrator';
import type { AssetId } from '@/lib/data/types';

// Curated cross-market spotlight — well-known, liquid names the system tracks.
const SPOTLIGHT: { id: AssetId; symbol: string; name: string; exchange: string }[] = [
  { id: 'TASE:TEVA',   symbol: 'TEVA',  name: 'טבע תעשיות',  exchange: 'TASE' },
  { id: 'TASE:NICE',   symbol: 'NICE',  name: 'נייס',         exchange: 'TASE' },
  { id: 'NASDAQ:NVDA', symbol: 'NVDA',  name: 'Nvidia',       exchange: 'NASDAQ' },
  { id: 'NASDAQ:AAPL', symbol: 'AAPL',  name: 'Apple',        exchange: 'NASDAQ' },
  { id: 'NASDAQ:MSFT', symbol: 'MSFT',  name: 'Microsoft',    exchange: 'NASDAQ' },
  { id: 'NYSE:TSLA',   symbol: 'TSLA',  name: 'Tesla',        exchange: 'NYSE' },
];

export interface SpotlightQuote {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  marketState: string | null;
}

export async function GET() {
  try {
    await verifyAuth();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const results = await Promise.all(
    SPOTLIGHT.map(async (s): Promise<SpotlightQuote> => {
      try {
        const q = await getQuote(s.id);
        return {
          id: s.id,
          symbol: s.symbol,
          name: s.name,
          exchange: s.exchange,
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
          currency: q.currency,
          marketState: q.marketState ?? null,
        };
      } catch {
        // Quote unavailable — still return the card without live data.
        return {
          id: s.id,
          symbol: s.symbol,
          name: s.name,
          exchange: s.exchange,
          price: null,
          change: null,
          changePercent: null,
          currency: null,
          marketState: null,
        };
      }
    }),
  );

  return NextResponse.json({ quotes: results });
}
