import { NextRequest, NextResponse } from 'next/server';
import { runMarketingAgent } from '@/lib/marketing/agent';

// This endpoint is called by Cloud Scheduler every morning at 08:00 Israel time
// Protected by a shared secret header

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('x-cron-secret') ?? '';
  const expected   = process.env.MARKETING_CRON_SECRET ?? '';

  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runMarketingAgent();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[api/marketing/run] Error', String(e));
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
