/**
 * FRED (Federal Reserve Economic Data) source adapter.
 *
 * Fetches macro indicators from the St. Louis Fed free API.
 * Requires FRED_API_KEY env var (free at https://fred.stlouisfed.org/docs/api/api_key.html).
 * Important series: DGS10, DGS2, DFF, T10Y2Y, CPIAUCSL, UNRATE, DEXISUS.
 *
 * Note: FRED returns `value` as a string; "." means missing data.
 */

import { DataSourceError } from '../types';

const FRED_BASE = 'https://api.stlouisfed.org/fred';

export interface FredObservation {
  date: string;
  value: number | null;
}

function getApiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new DataSourceError('fred', 'auth_failed', 'FRED_API_KEY env var is not set');
  return key;
}

async function fredFetch(path: string): Promise<unknown> {
  const key = getApiKey();
  const url = `${FRED_BASE}${path}&api_key=${key}&file_type=json`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 429) throw new Error('FRED 429 — rate limited');
  if (!res.ok) throw new Error(`FRED ${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

function parseValue(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  if (v === '.') return null; // FRED missing-data marker
  const num = parseFloat(v);
  return Number.isFinite(num) ? num : null;
}

export async function fetchSeries(
  seriesId: string,
  options?: { startDate?: string; endDate?: string },
): Promise<FredObservation[]> {
  try {
    let path = `/series/observations?series_id=${encodeURIComponent(seriesId)}`;
    if (options?.startDate) path += `&observation_start=${options.startDate}`;
    if (options?.endDate) path += `&observation_end=${options.endDate}`;

    const data = await fredFetch(path) as Record<string, unknown>;
    const obs = (data['observations'] ?? []) as Array<Record<string, unknown>>;

    return obs.map((o) => ({
      date: String(o['date'] ?? ''),
      value: parseValue(o['value']),
    }));
  } catch (e) {
    if (e instanceof DataSourceError) throw e;
    throw new DataSourceError('fred', 'fetch_failed', `fetchSeries failed for ${seriesId}: ${String(e)}`, e);
  }
}

export async function fetchLatest(seriesId: string): Promise<FredObservation | null> {
  try {
    const path = `/series/observations?series_id=${encodeURIComponent(seriesId)}&sort_order=desc&limit=10`;
    const data = await fredFetch(path) as Record<string, unknown>;
    const obs = (data['observations'] ?? []) as Array<Record<string, unknown>>;

    // Find the most recent non-null observation
    for (const o of obs) {
      const v = parseValue(o['value']);
      if (v !== null) {
        return { date: String(o['date'] ?? ''), value: v };
      }
    }
    if (obs.length > 0) {
      return { date: String(obs[0]['date'] ?? ''), value: parseValue(obs[0]['value']) };
    }
    return null;
  } catch (e) {
    if (e instanceof DataSourceError) throw e;
    throw new DataSourceError('fred', 'fetch_failed', `fetchLatest failed for ${seriesId}: ${String(e)}`, e);
  }
}
