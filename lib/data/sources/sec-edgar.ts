// SEC EDGAR stub — minimal implementation for MVP.
// Returns empty arrays; the research pipeline handles this gracefully.

export async function fetchRecentFilings(_ticker: string): Promise<unknown[]> {
  return [];
}

export async function fetchInsiderTrades(_ticker: string): Promise<unknown[]> {
  return [];
}
