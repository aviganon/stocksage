import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AssetId } from '@/lib/data/types';
import type { ResearchReportData } from '@/lib/ai/schemas/research';

export type ReportStatus = 'pending' | 'running' | 'completed' | 'partial' | 'failed';
export type ReportDepth = 'quick' | 'standard' | 'deep';

export interface ReportStep {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  costUSD?: number;
}

export interface ResearchReport {
  id: string;
  uid: string;
  assetId: AssetId;
  assetName: string;
  status: ReportStatus;
  depth: ReportDepth;
  language: 'en' | 'he';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  costUSD: number;
  inputTokens?: number;
  outputTokens?: number;
  steps: ReportStep[];
  data: ResearchReportData;
  errors: string[];
  deletedAt?: string;
  priceHistory?: Array<{ time: string; close: number }>;
  analystData?: {
    targetMeanPrice: number | null;
    targetHighPrice: number | null;
    targetLowPrice: number | null;
    recommendationKey: string | null;
    numberOfAnalystOpinions: number | null;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
    nextEarningsDate: string | null;
  };
}

const COLLECTION = 'reports';

function getDb() { return getAdminDb(); }

function toFirestore(report: ResearchReport): Record<string, unknown> {
  return { ...report } as Record<string, unknown>;
}

function fromFirestore(id: string, data: Record<string, unknown>): ResearchReport {
  return { ...(data as Omit<ResearchReport, 'id'>), id } as ResearchReport;
}

export class ResearchReportsRepository {
  async create(report: Omit<ResearchReport, never> & { id: string }): Promise<ResearchReport> {
    const db = getDb();
    await db.collection(COLLECTION).doc(report.id).set(toFirestore(report));
    return report;
  }

  async get(reportId: string): Promise<ResearchReport | null> {
    const db = getDb();
    const snap = await db.collection(COLLECTION).doc(reportId).get();
    if (!snap.exists) return null;
    return fromFirestore(snap.id, snap.data()!);
  }

  async update(reportId: string, updates: Partial<Omit<ResearchReport, 'id' | 'uid'>>): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTION).doc(reportId).update({
      ...(updates as Record<string, unknown>),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  async updateStep(reportId: string, stepId: string, updates: Partial<ReportStep>): Promise<void> {
    const db = getDb();
    const snap = await db.collection(COLLECTION).doc(reportId).get();
    if (!snap.exists) return;
    const steps = ((snap.data()!['steps'] ?? []) as ReportStep[]).map((s) =>
      s.stepId === stepId ? { ...s, ...updates } : s,
    );
    await db.collection(COLLECTION).doc(reportId).update({ steps });
  }

  async addCost(reportId: string, additionalCostUSD: number): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTION).doc(reportId).update({ costUSD: FieldValue.increment(additionalCostUSD) });
  }

  async listForUser(uid: string, options?: { limit?: number; assetId?: AssetId }): Promise<ResearchReport[]> {
    const db = getDb();
    let q = db.collection(COLLECTION).where('uid', '==', uid).where('deletedAt', '==', null);
    if (options?.assetId) q = q.where('assetId', '==', options.assetId);
    const snap = await q.limit(options?.limit ?? 20).get();
    return snap.docs
      .map((d) => fromFirestore(d.id, d.data()))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async countThisMonth(uid: string): Promise<number> {
    const db = getDb();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const snap = await db.collection(COLLECTION)
      .where('uid', '==', uid)
      .where('startedAt', '>=', startOfMonth.toISOString())
      .get();
    return snap.size;
  }

  async softDelete(reportId: string, uid: string): Promise<boolean> {
    const db = getDb();
    const report = await this.get(reportId);
    if (!report || report.uid !== uid) return false;
    await db.collection(COLLECTION).doc(reportId).update({ deletedAt: new Date().toISOString() });
    return true;
  }
}
