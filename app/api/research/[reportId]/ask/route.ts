/**
 * POST /api/research/[reportId]/ask — conversational follow-up on a report.
 *
 * The report owner can ask a free-text question; it's answered by Claude,
 * grounded in the already-generated report data (no new data fetch, so cost is
 * low). Neutral framing only — no buy/sell advice, consistent with the product.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { ResearchReportsRepository } from '@/lib/storage/research-reports';

type RouteContext = { params: Promise<{ reportId: string }> };

const Schema = z.object({
  question: z.string().min(2).max(500),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000),
  })).max(10).optional(),
});

function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

const SYSTEM = `You are StockSage's research assistant. You answer follow-up questions about a stock research report that has already been generated. Ground every answer in the REPORT DATA provided plus well-known public facts. Be concise (2-4 sentences unless more detail is clearly needed). NEVER give buy/sell/hold recommendations or tell the user what to do — frame things as considerations, tradeoffs, and factors to weigh. If the report doesn't contain the answer, say so plainly and share general context. Answer in the SAME LANGUAGE as the report (Hebrew if the report language is 'he', otherwise English).`;

export async function POST(req: NextRequest, { params }: RouteContext) {
  let uid: string;
  try {
    ({ uid } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.message, 401);
    return fail('internal', 'Auth error', 500);
  }

  const { reportId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail('validation_error', parsed.error.issues[0]?.message ?? 'Invalid input');

  const repo = new ResearchReportsRepository();
  const report = await repo.get(reportId);
  if (!report || report.deletedAt) return fail('not_found', 'Report not found', 404);
  if (report.uid !== uid) return fail('forbidden', 'Access denied', 403);

  // Compact the report into a grounding context (cap length to control tokens).
  const context = JSON.stringify({
    asset: report.assetName,
    assetId: report.assetId,
    data: report.data,
  }).slice(0, 14000);

  const history = parsed.data.history ?? [];
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `REPORT DATA for ${report.assetName} (${report.assetId}), language=${report.language}:\n${context}`,
    },
    { role: 'assistant', content: 'Understood. I have the report. What would you like to know?' },
    ...history.map((h): Anthropic.MessageParam => ({ role: h.role, content: h.content })),
    { role: 'user', content: parsed.data.question },
  ];

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const resp = await client.messages.create(
      { model: 'claude-haiku-4-5', max_tokens: 700, system: SYSTEM, messages },
      { timeout: 30_000 },
    );
    const text = resp.content.find((b) => b.type === 'text');
    const answer = text && text.type === 'text' ? text.text.trim() : '';
    if (!answer) return fail('empty', 'No answer generated', 502);
    return NextResponse.json({ ok: true, answer });
  } catch (e) {
    console.error('[api/research/ask] error', reportId, String(e));
    return fail('ai_error', 'Could not generate an answer right now', 502);
  }
}
