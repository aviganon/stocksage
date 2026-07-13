/**
 * POST /api/blog/generate — warm / refresh the blog article cache.
 *
 * Secret-protected. Generates articles for topics that are missing or stale,
 * in small concurrent batches. Idempotent and safe to run from Cloud Scheduler.
 * Query: ?limit=N (default 10).
 */

import { NextRequest, NextResponse } from 'next/server';
import { BLOG_TOPICS } from '@/lib/blog/topics';
import { generateBlogArticle, peekBlogArticle, isBlogArticleStale } from '@/lib/blog/article';

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

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '10', 10) || 10, 20);

  try {
    const checks = await Promise.all(
      BLOG_TOPICS.map(async (t) => {
        const cached = await peekBlogArticle(t.slug);
        return { topic: t, needs: !cached || isBlogArticleStale(cached.generatedAt) };
      }),
    );
    const staleCount = checks.filter((c) => c.needs).length;
    const toGenerate = checks.filter((c) => c.needs).map((c) => c.topic).slice(0, limit);

    const generated = await mapWithConcurrency(toGenerate, 3, async (t) => {
      const r = await generateBlogArticle(t);
      return { slug: t.slug, ok: !!r };
    });
    const okCount = generated.filter((g) => g.ok).length;
    console.log(`[api/blog/generate] stale=${staleCount} generated=${generated.length} ok=${okCount}`);

    return NextResponse.json({
      ok: true,
      totalTopics: BLOG_TOPICS.length,
      staleFound: staleCount,
      generatedThisRun: generated.length,
      succeeded: okCount,
      remaining: staleCount - generated.length,
    });
  } catch (e) {
    console.error('[api/blog/generate] error', String(e));
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
