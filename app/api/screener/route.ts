/**
 * GET /api/screener?id=<screenId> — public market-discovery endpoint.
 *
 * Returns a normalized, cached list of stocks for one of Yahoo's predefined
 * screens. Public (no auth) so anonymous visitors can discover stocks before
 * signing up; results are cached 10 min in-process to shield Yahoo.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchScreener, SCREEN_IDS, type ScreenId } from '@/lib/data/screener';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? 'most_actives';
  if (!SCREEN_IDS.includes(id as ScreenId)) {
    return NextResponse.json({ error: 'Unknown screen id' }, { status: 400 });
  }

  try {
    const rows = await fetchScreener(id as ScreenId, 25);
    return NextResponse.json({ ok: true, id, rows });
  } catch (e) {
    console.error('[api/screener] error', id, String(e));
    return NextResponse.json({ ok: false, error: 'Screener temporarily unavailable' }, { status: 502 });
  }
}
