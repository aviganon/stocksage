/**
 * POST /api/research — start a new research report
 * GET  /api/research — list user's reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { ResearchReportsRepository } from '@/lib/storage/research-reports';
import { runResearchPipeline } from '@/lib/ai/orchestrator';
import { canRunReport, consumeCredit, getCreditsRemaining, checkRateLimit } from '@/lib/usage/tracker';

function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, ...((data && typeof data === 'object') ? data : { data }) }, { status });
}
function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

const StartResearchSchema = z.object({
  assetId: z.string().min(3).max(100),
  depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
  language: z.enum(['he', 'en']).default('he'),
});

const OWNER_EMAIL = process.env.ADMIN_EMAIL ?? 'ganonavi@gmail.com';

export async function POST(req: NextRequest) {
  let uid: string;
  let email: string | null;
  try {
    ({ uid, email } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.message, 401);
    return fail('internal', 'Auth error', 500);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = StartResearchSchema.safeParse(body);
  if (!parsed.success) return fail('validation_error', parsed.error.issues[0]?.message ?? 'Invalid input');

  const { assetId, depth, language } = parsed.data;
  const isOwner = email === OWNER_EMAIL;

  // Rate limit — abuse protection (owner exempt)
  if (!isOwner) {
    const rl = await checkRateLimit(uid);
    if (!rl.allowed) {
      return fail('rate_limited', `הגעת למגבלת ${rl.limit} דוחות בשעה. נסה שוב בעוד זמן מה.`, 429);
    }
  }

  // Check depth permissions
  const usage = await canRunReport(uid, depth);
  if (!usage.allowed) {
    return fail('usage_limit', 'מגבלת שימוש הגיעה.', 402);
  }

  // Standard/Deep: owner gets free access; others need credit or payment
  if (!isOwner && (depth === 'standard' || depth === 'deep')) {
    const credits = await getCreditsRemaining(uid, depth);
    if (credits > 0) {
      await consumeCredit(uid, depth);
    } else {
      const paidHeader = req.headers.get('x-paid-research');
      if (paidHeader !== 'true') {
        return fail('payment_required', 'תשלום נדרש לסריקה זו.', 402);
      }
    }
  }

  const reportId = randomUUID();
  const STEPS_BY_DEPTH: Record<string, string[]> = {
    quick:    ['data_collection', 'profile', 'financials', 'synthesis'],
    standard: ['data_collection', 'profile', 'financials', 'events', 'competitive', 'risks', 'synthesis'],
    deep:     ['data_collection', 'profile', 'financials', 'events', 'competitive', 'risks', 'synthesis'],
  };

  const repo = new ResearchReportsRepository();
  await repo.create({
    id: reportId, uid, assetId, assetName: assetId,
    status: 'pending', depth, language,
    startedAt: new Date().toISOString(),
    costUSD: 0,
    steps: (STEPS_BY_DEPTH[depth] ?? STEPS_BY_DEPTH.standard).map((s) => ({ stepId: s, status: 'pending' as const })),
    data: {}, errors: [],
  });

  // Run pipeline in background
  runResearchPipeline(assetId, { uid, depth, language, reportId }).catch((e) => {
    console.error('[api/research] Background pipeline error', { assetId, reportId, error: String(e) });
  });

  return ok({ assetId, depth, language, status: 'started', reportId });
}

export async function GET(req: NextRequest) {
  let uid: string;
  try {
    ({ uid } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.message, 401);
    return fail('internal', 'Auth error', 500);
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10), 50);
  const repo = new ResearchReportsRepository();
  const reports = await repo.listForUser(uid, { limit });
  const summaries = reports.map(({ data: _data, ...r }) => r);
  return ok({ reports: summaries, total: summaries.length });
}
