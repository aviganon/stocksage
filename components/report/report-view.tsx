'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useI18n } from '@/lib/i18n/context';
import type { ResearchReport } from '@/lib/storage/research-reports';

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-400', moderate: 'text-yellow-400', elevated: 'text-orange-400',
  high: 'text-red-400', very_high: 'text-red-500',
};

const VERDICT_COLORS: Record<string, string> = {
  buy: 'text-green-400', watch: 'text-blue-400', hold: 'text-yellow-400', sell: 'text-red-400',
};

function SectionCard({ title, icon, children, defaultOpen = false }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="text-white font-semibold">{title}</span>
        </div>
        <span className="text-gray-500 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-6 pb-6 border-t border-white/5">{children}</div>}
    </div>
  );
}

function Badge({ children, color = 'indigo' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
    green: 'bg-green-500/15 text-green-300 border-green-500/20',
    red: 'bg-red-500/15 text-red-300 border-red-500/20',
    yellow: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
    gray: 'bg-white/5 text-gray-400 border-white/10',
  };
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  );
}

export default function ReportView({ reportId }: { reportId: string }) {
  const { getIdToken } = useAuth();
  const { t } = useI18n();

  const STEP_LABELS: Record<string, string> = {
    data_collection: t('steps.data_collection'),
    profile:         t('steps.profile'),
    financials:      t('steps.financials'),
    events:          t('steps.events'),
    competitive:     t('steps.competitive'),
    risks:           t('steps.risks'),
    synthesis:       t('steps.synthesis'),
  };
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch(`/api/research/${reportId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { setError('דוח לא נמצא'); setLoading(false); return; }
    const data = await res.json();
    setReport(data as ResearchReport);
    setLoading(false);
  }, [reportId, getIdToken]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Poll while running
  useEffect(() => {
    if (!report || report.status === 'completed' || report.status === 'failed' || report.status === 'partial') return;
    const interval = setInterval(fetchReport, 3000);
    return () => clearInterval(interval);
  }, [report, fetchReport]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !report) return (
    <div className="text-center py-32 text-red-400">{error || 'שגיאה בטעינת הדוח'}</div>
  );

  const isRunning = report.status === 'pending' || report.status === 'running';
  const { data } = report;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-white mb-3">{report.assetName}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Back button — big, prominent, inline with status */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-white/10"
          >
            {t('report.backToDashboard')}
          </Link>

          <span className="text-white/20 text-sm">|</span>

          <span className="text-gray-400 text-sm">{report.assetId}</span>
          <Badge color="gray">{report.depth === 'quick' ? 'מהיר' : report.depth === 'standard' ? 'מלא' : 'עמוק'}</Badge>
          <Badge color="gray">{report.language === 'he' ? 'עברית' : 'English'}</Badge>
          {report.status === 'completed' && <Badge color="green">הושלם</Badge>}
          {report.status === 'partial' && <Badge color="yellow">חלקי</Badge>}
          {report.status === 'failed' && <Badge color="red">נכשל</Badge>}
          {isRunning && <Badge color="indigo">בריצה...</Badge>}
        </div>
        {report.completedAt && (
          <p className="text-gray-600 text-xs mt-2">
            {new Date(report.startedAt).toLocaleString('he-IL')} · {report.durationMs ? `${(report.durationMs / 1000).toFixed(0)}ש׳` : ''} · ${report.costUSD.toFixed(3)}
          </p>
        )}
      </div>

      {/* Upgrade banner — shown on completed quick reports */}
      {report.depth === 'quick' && report.status === 'completed' && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">{t('report.upgradePrompt')}</p>
            <p className="text-gray-400 text-xs mt-0.5">{t('report.upgradeDesc')}</p>
          </div>
          <Link
            href={`/dashboard?upgrade=${report.assetId}`}
            className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            {t('report.upgradeBtn')}
          </Link>
        </div>
      )}

      {/* Progress steps */}
      {isRunning && (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">מנתח...</h3>
          <div className="space-y-2">
            {report.steps.map((step) => (
              <div key={step.stepId} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0
                  ${step.status === 'completed' ? 'bg-green-500' : step.status === 'running' ? 'bg-indigo-500 animate-pulse' : step.status === 'failed' ? 'bg-red-500' : 'bg-white/10'}`}>
                  {step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : step.status === 'running' ? '…' : ''}
                </div>
                <span className={`text-sm ${step.status === 'completed' ? 'text-gray-300' : step.status === 'running' ? 'text-white' : 'text-gray-600'}`}>
                  {STEP_LABELS[step.stepId] ?? step.stepId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synthesis summary (always first when available) */}
      {data?.synthesis && (
        <div className="bg-gradient-to-br from-indigo-600/15 to-indigo-900/5 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">✨</span>
            <h2 className="text-white font-bold text-lg">תקציר מנהלים</h2>
          </div>
          {data.synthesis.executiveSummary && (
            <p className="text-gray-200 leading-relaxed mb-4">{data.synthesis.executiveSummary}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-4">
            {data.synthesis.scenarioAnalysis?.map((s) => (
              <div key={s.label} className="bg-white/5 rounded-xl px-4 py-3 min-w-[140px]">
                <div className={`text-xs font-medium mb-1 ${s.label === 'bull' ? 'text-green-400' : s.label === 'bear' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {s.label === 'bull' ? 'תרחיש חיובי' : s.label === 'bear' ? 'תרחיש שלילי' : 'תרחיש בסיס'}
                </div>
                <div className="text-white font-bold text-xl">{(s.probability * 100).toFixed(0)}%</div>
                {s.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{s.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile */}
      {data?.profile && (
        <SectionCard title="פרופיל חברה" icon="🏢" defaultOpen>
          {data.profile.oneLineSummary && (
            <p className="text-gray-300 mt-4 mb-4 text-sm leading-relaxed italic">{data.profile.oneLineSummary}</p>
          )}
          {data.profile.fullDescription && (
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{data.profile.fullDescription}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {data.profile.foundedYear && <div><p className="text-xs text-gray-500">ייסוד</p><p className="text-white font-medium">{String(data.profile.foundedYear)}</p></div>}
            {data.profile.employeeCount && <div><p className="text-xs text-gray-500">עובדים</p><p className="text-white font-medium">{Number(data.profile.employeeCount).toLocaleString()}</p></div>}
            {data.profile.listingInfo?.exchange && <div><p className="text-xs text-gray-500">בורסה</p><p className="text-white font-medium">{data.profile.listingInfo.exchange}</p></div>}
            {data.profile.headquarters && <div><p className="text-xs text-gray-500">מטה</p><p className="text-white font-medium">{data.profile.headquarters}</p></div>}
          </div>
          {data.profile.flags && data.profile.flags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">דגלים</p>
              <div className="flex flex-wrap gap-2">
                {data.profile.flags.map((f, i) => <Badge key={i} color="yellow">{f}</Badge>)}
              </div>
            </div>
          )}
          {data.profile.israeliContext?.localMarketContext && (
            <div className="mt-4 bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
              <p className="text-xs text-blue-300 font-medium mb-1">הקשר ישראלי</p>
              <p className="text-gray-300 text-sm">{data.profile.israeliContext.localMarketContext}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Financials */}
      {data?.financials && (
        <SectionCard title="ניתוח פיננסי" icon="📊">
          <div className="grid grid-cols-2 gap-4 mt-4">
            {data.financials.valuationVerdict && (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">שווי</p>
                <p className={`font-bold text-lg ${data.financials.valuationVerdict === 'cheap' ? 'text-green-400' : data.financials.valuationVerdict === 'expensive' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {data.financials.valuationVerdict === 'cheap' ? 'זול' : data.financials.valuationVerdict === 'fair' ? 'הוגן' : data.financials.valuationVerdict === 'expensive' ? 'יקר' : data.financials.valuationVerdict}
                </p>
                {data.financials.valuationReasoning && <p className="text-gray-500 text-xs mt-1">{data.financials.valuationReasoning}</p>}
              </div>
            )}
            {data.financials.healthVerdict && (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">בריאות פיננסית</p>
                <p className="font-bold text-lg text-white">{data.financials.healthVerdict}</p>
                {data.financials.healthReasoning && <p className="text-gray-500 text-xs mt-1">{data.financials.healthReasoning}</p>}
              </div>
            )}
          </div>
          {data.financials.ratios && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
              {[
                { label: 'P/E', val: data.financials.ratios.peRatio },
                { label: 'P/B', val: data.financials.ratios.pbRatio },
                { label: 'EV/EBITDA', val: data.financials.ratios.evToEbitda },
                { label: 'ROE', val: data.financials.ratios.roe != null ? `${(Number(data.financials.ratios.roe) * 100).toFixed(1)}%` : null },
                { label: 'תשואת דיב׳', val: data.financials.ratios.dividendYield != null ? `${(Number(data.financials.ratios.dividendYield) * 100).toFixed(1)}%` : null },
              ].filter((r) => r.val != null).map((r) => (
                <div key={r.label} className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs mb-1">{r.label}</p>
                  <p className="text-white font-medium text-sm">{typeof r.val === 'number' ? r.val.toFixed(1) : r.val}</p>
                </div>
              ))}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {data.financials.redFlags && data.financials.redFlags.length > 0 && (
              <div>
                <p className="text-xs text-red-400 font-medium mb-2">🚩 דגלים אדומים</p>
                <ul className="space-y-1">
                  {data.financials.redFlags.map((f, i) => <li key={i} className="text-gray-400 text-xs">• {f}</li>)}
                </ul>
              </div>
            )}
            {data.financials.greenFlags && data.financials.greenFlags.length > 0 && (
              <div>
                <p className="text-xs text-green-400 font-medium mb-2">✅ נקודות חוזק</p>
                <ul className="space-y-1">
                  {data.financials.greenFlags.map((f, i) => <li key={i} className="text-gray-400 text-xs">• {f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Events */}
      {data?.events && (
        <SectionCard title="אירועים ורגשות שוק" icon="📰">
          {data.events.overallSentiment && (
            <div className="mt-4 mb-4">
              <span className="text-xs text-gray-500">סנטימנט כללי: </span>
              <span className={`text-sm font-medium ${data.events.overallSentiment === 'positive' ? 'text-green-400' : data.events.overallSentiment === 'negative' ? 'text-red-400' : 'text-yellow-400'}`}>
                {data.events.overallSentiment === 'positive' ? 'חיובי' : data.events.overallSentiment === 'negative' ? 'שלילי' : data.events.overallSentiment === 'mixed' ? 'מעורב' : 'ניטרלי'}
              </span>
            </div>
          )}
          <div className="space-y-3">
            {data.events.timeline?.slice(0, 10).map((e, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="shrink-0 pt-0.5">
                  <span className={`w-2 h-2 rounded-full block mt-1.5 ${e.sentiment === 'positive' ? 'bg-green-400' : e.sentiment === 'negative' ? 'bg-red-400' : 'bg-gray-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-500 text-xs">{e.date}</span>
                    {e.importance === 'high' && <Badge color="red">חשוב</Badge>}
                    <Badge color="gray">{e.category}</Badge>
                  </div>
                  <p className="text-gray-300 mt-0.5">{e.title}</p>
                  {e.summary && <p className="text-gray-500 text-xs mt-0.5">{e.summary}</p>}
                </div>
              </div>
            ))}
          </div>
          {data.events.upcomingEvents && data.events.upcomingEvents.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-gray-500 font-medium mb-3">אירועים קרובים</p>
              <div className="space-y-2">
                {data.events.upcomingEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 text-xs w-24 shrink-0">{e.date}</span>
                    <span className="text-gray-300">{e.event}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Competitive */}
      {data?.competitive && (
        <SectionCard title="ניתוח תחרותי" icon="⚔️">
          {data.competitive.marketPosition && (
            <p className="text-gray-300 mt-4 mb-2">
              <span className="text-xs text-gray-500">מיקום בשוק: </span>
              <span className="font-medium">{data.competitive.marketPosition}</span>
            </p>
          )}
          {data.competitive.marketPositionReasoning && (
            <p className="text-gray-400 text-sm mb-4">{data.competitive.marketPositionReasoning}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {data.competitive.ourMoats && data.competitive.ourMoats.length > 0 && (
              <div>
                <p className="text-xs text-green-400 font-medium mb-2">💪 יתרונות תחרותיים</p>
                <ul className="space-y-1">
                  {data.competitive.ourMoats.map((m, i) => <li key={i} className="text-gray-400 text-xs">• {m}</li>)}
                </ul>
              </div>
            )}
            {data.competitive.ourWeaknesses && data.competitive.ourWeaknesses.length > 0 && (
              <div>
                <p className="text-xs text-red-400 font-medium mb-2">⚠️ חולשות</p>
                <ul className="space-y-1">
                  {data.competitive.ourWeaknesses.map((w, i) => <li key={i} className="text-gray-400 text-xs">• {w}</li>)}
                </ul>
              </div>
            )}
          </div>
          {data.competitive.competitors && data.competitive.competitors.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 font-medium mb-3">מתחרים</p>
              <div className="space-y-2">
                {data.competitive.competitors.slice(0, 6).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-300">{c.name}</span>
                      {c.ticker && <span className="text-gray-600 text-xs ml-2">{c.ticker}</span>}
                    </div>
                    <Badge color={c.threat === 'high' ? 'red' : c.threat === 'low' ? 'green' : 'yellow'}>
                      {c.threat === 'high' ? 'איום גבוה' : c.threat === 'low' ? 'איום נמוך' : 'איום בינוני'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Risks */}
      {data?.risks && (
        <SectionCard title="הערכת סיכונים" icon="⚠️">
          <div className="mt-4 mb-4 flex items-center gap-3">
            <span className="text-gray-400 text-sm">דירוג סיכון כולל:</span>
            <span className={`font-bold ${RISK_COLORS[data.risks.overallRiskRating ?? ''] ?? 'text-gray-400'}`}>
              {data.risks.overallRiskRating === 'low' ? 'נמוך' : data.risks.overallRiskRating === 'moderate' ? 'מתון' : data.risks.overallRiskRating === 'elevated' ? 'מוגבר' : data.risks.overallRiskRating === 'high' ? 'גבוה' : data.risks.overallRiskRating === 'very_high' ? 'גבוה מאוד' : data.risks.overallRiskRating}
            </span>
          </div>
          {data.risks.riskSummary && <p className="text-gray-400 text-sm mb-4">{data.risks.riskSummary}</p>}
          {[
            { label: 'סיכוני חברה', items: data.risks.companySpecific },
            { label: 'סיכוני ענף', items: data.risks.industryRisks },
            { label: 'סיכוני מאקרו', items: data.risks.macroRisks },
          ].filter((g) => g.items && g.items.length > 0).map((group) => (
            <div key={group.label} className="mt-4">
              <p className="text-xs text-gray-500 font-medium mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.items!.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <Badge color={r.severity === 'critical' || r.severity === 'high' ? 'red' : r.severity === 'low' ? 'green' : 'yellow'}>
                      {r.severity}
                    </Badge>
                    <div>
                      <p className="text-gray-300 font-medium text-xs">{r.title}</p>
                      {r.description && <p className="text-gray-500 text-xs mt-0.5">{r.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* Synthesis detail */}
      {data?.synthesis && (
        <SectionCard title="סינתזה מלאה" icon="🧠">
          <div className="mt-4 space-y-5">
            {data.synthesis.whatTheNumbersSay && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">מה המספרים אומרים</p>
                <p className="text-gray-300 text-sm leading-relaxed">{data.synthesis.whatTheNumbersSay}</p>
              </div>
            )}
            {data.synthesis.whatTheNarrativeSays && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">מה הנרטיב אומר</p>
                <p className="text-gray-300 text-sm leading-relaxed">{data.synthesis.whatTheNarrativeSays}</p>
              </div>
            )}
            {(data.synthesis.bullCase || data.synthesis.bearCase) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.synthesis.bullCase && (
                  <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                    <p className="text-xs text-green-400 font-medium mb-2">תרחיש חיובי</p>
                    <ul className="space-y-1">
                      {(data.synthesis.bullCase as { points?: string[] }).points?.map((p, i) => (
                        <li key={i} className="text-gray-400 text-xs">• {p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.synthesis.bearCase && (
                  <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                    <p className="text-xs text-red-400 font-medium mb-2">תרחיש שלילי</p>
                    <ul className="space-y-1">
                      {(data.synthesis.bearCase as { points?: string[] }).points?.map((p, i) => (
                        <li key={i} className="text-gray-400 text-xs">• {p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {data.synthesis.ifIWereAnInvestor && (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-indigo-300 font-medium mb-3">שאלות מפתח למשקיע</p>
                {data.synthesis.ifIWereAnInvestor.questionsToAnswer && (
                  <ul className="space-y-1">
                    {data.synthesis.ifIWereAnInvestor.questionsToAnswer.map((q, i) => (
                      <li key={i} className="text-gray-400 text-xs">• {q}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {data.synthesis.finalNote && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-gray-400 text-sm italic">{data.synthesis.finalNote}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-600 text-center py-4">
        לצרכי מידע בלבד — אינו ייעוץ השקעות. הניתוח מבוסס על נתונים ציבוריים ו-AI.
      </p>
    </div>
  );
}
