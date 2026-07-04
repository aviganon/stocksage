/**
 * POST /api/seo/generate — warm / refresh the SEO analysis cache.
 *
 * Protected by a shared secret. Generates analyses for universe stocks that are
 * missing or stale, in small concurrent batches so a single invocation stays
 * well under the Cloud Run request timeout. Safe to call repeatedly (idempotent
 * — fresh entries are skipped) and to run from Cloud Scheduler.
 *
 * Query: ?limit=N (default 12) — max stocks to (re)generate this call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SEO_UNIVERSE } from '@/lib/seo/universe';
import { generateSeoAnalysis, peekSeoAnalysis, isSeoAnalysisStale } from '@/lib/seo/analysis';

export const maxDuration = 300;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function POST(req: NextRequest) {
  const secret = process.env.MARKETING_CRON_SECRET ?? '';
  const provided = req.headers.get('x-cron-secret') ?? '';
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '12', 10) || 12, 30);

  try {
    // Work items: English for the whole universe + Hebrew for TASE (the niche).
    const items: Array<{ id: typeof SEO_UNIVERSE[number]['id']; lang: 'en' | 'he' }> = [
      ...SEO_UNIVERSE.map((s) => ({ id: s.id, lang: 'en' as const })),
      ...SEO_UNIVERSE.filter((s) => s.exchange === 'TASE').map((s) => ({ id: s.id, lang: 'he' as const })),
    ];

    // Find items that need (re)generation — missing or stale.
    const staleChecks = await Promise.all(
      items.map(async (it) => {
        const cached = await peekSeoAnalysis(it.id, it.lang);
        return { item: it, needs: !cached || isSeoAnalysisStale(cached.generatedAt) };
      }),
    );
    const staleCount = staleChecks.filter((c) => c.needs).length;
    const toGenerate = staleChecks.filter((c) => c.needs).map((c) => c.item).slice(0, limit);

    const generated = await mapWithConcurrency(toGenerate, 3, async (it) => {
      const result = await generateSeoAnalysis(it.id, it.lang);
      return { assetId: it.id, lang: it.lang, ok: !!result };
    });

    const okCount = generated.filter((g) => g.ok).length;
    console.log(`[api/seo/generate] stale=${staleCount} generated=${generated.length} ok=${okCount} remaining=${staleCount - generated.length}`);

    return NextResponse.json({
      ok: true,
      workItems: items.length,
      staleFound: staleCount,
      generatedThisRun: generated.length,
      succeeded: okCount,
      remaining: staleCount - generated.length,
    });
  } catch (e) {
    console.error('[api/seo/generate] error', String(e));
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
