/**
 * GET /api/research/:reportId/stream
 * Server-Sent Events — runs the research pipeline and emits step updates in real time.
 */

import { NextRequest } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { runResearchPipeline } from '@/lib/ai/orchestrator';
import { ResearchReportsRepository, type ReportDepth } from '@/lib/storage/research-reports';

type RouteContext = { params: Promise<{ reportId: string }> };

export const maxDuration = 300;

export async function GET(req: NextRequest, { params }: RouteContext) {
  let uid: string;
  try {
    ({ uid } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return new Response('Unauthorized', { status: 401 });
    return new Response('Internal error', { status: 500 });
  }

  const { reportId } = await params;
  const assetId = req.nextUrl.searchParams.get('assetId');
  const depth = (req.nextUrl.searchParams.get('depth') ?? 'standard') as ReportDepth;

  if (!assetId) return new Response('assetId required', { status: 400 });

  const repo = new ResearchReportsRepository();
  const report = await repo.get(reportId);
  if (!report || report.uid !== uid) return new Response('Not found', { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = async (step: string, status: string, data?: unknown) => {
        const payload = JSON.stringify({ step, status, data: data ?? null });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      try {
        await runResearchPipeline(assetId, { uid, depth, onStepUpdate: send, reportId });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ step: 'stream', status: 'done' })}\n\n`));
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ step: 'stream', status: 'error', error: String(e) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
