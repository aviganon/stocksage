import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/auth/server';
import { ResearchReportsRepository } from '@/lib/storage/research-reports';

type RouteContext = { params: Promise<{ reportId: string }> };

function ok(data: unknown) { return NextResponse.json({ ok: true, ...((data && typeof data === 'object') ? data : { data }) }); }
function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  let uid: string;
  try {
    ({ uid } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.message, 401);
    return fail('internal', 'Auth error', 500);
  }

  const { reportId } = await params;
  const repo = new ResearchReportsRepository();
  const report = await repo.get(reportId);
  if (!report || report.deletedAt) return fail('not_found', 'Report not found', 404);
  if (report.uid !== uid) return fail('forbidden', 'Access denied', 403);

  return ok(report);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  let uid: string;
  try {
    ({ uid } = await verifyAuth());
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.message, 401);
    return fail('internal', 'Auth error', 500);
  }

  const { reportId } = await params;
  const repo = new ResearchReportsRepository();
  const deleted = await repo.softDelete(reportId, uid);
  if (!deleted) return fail('not_found', 'Report not found or access denied', 404);

  return ok({ deleted: true });
}
