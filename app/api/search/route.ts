import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { searchAssets } from '@/lib/data/orchestrator';

export async function GET(req: NextRequest) {
  try {
    await verifyAuth();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 1) return NextResponse.json({ results: [] });

  const results = await searchAssets(q);
  return NextResponse.json({ results });
}
