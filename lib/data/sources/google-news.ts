/**
 * Google News RSS adapter.
 *
 * Fetches news articles via Google News RSS feed using the `rss-parser` package.
 * Supports English and Hebrew language feeds.
 * Returns snippets only — no full article text.
 */

import Parser from 'rss-parser';
import { NewsItem, DataSourceError } from '../types';

const parser = new Parser({
  customFields: {
    item: [['source', 'source']],
  },
});

const EN_BASE = 'https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en';
const HE_BASE = 'https://news.google.com/rss/search?hl=he-IL&gl=IL&ceid=IL:he';

export async function fetchNewsForAsset(
  query: string,
  options?: { language?: 'en' | 'he'; daysBack?: number; limit?: number },
): Promise<NewsItem[]> {
  const lang = options?.language ?? 'en';
  const limit = options?.limit ?? 20;
  const base = lang === 'he' ? HE_BASE : EN_BASE;
  const url = `${base}&q=${encodeURIComponent(query)}`;

  try {
    const feed = await parser.parseURL(url);
    const cutoffMs = options?.daysBack
      ? Date.now() - options.daysBack * 86_400_000
      : 0;

    return feed.items
      .filter((item) => {
        if (!cutoffMs) return true;
        const pub = item.pubDate ? new Date(item.pubDate).getTime() : 0;
        return pub >= cutoffMs;
      })
      .slice(0, limit)
      .map((item): NewsItem => {
        const sourceObj = item['source'] as Record<string, string> | undefined;
        const url = item.link ?? '';
        return {
          id: `gnews-${Buffer.from(url).toString('base64').slice(0, 16)}`,
          title: item.title ?? '',
          url,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          source: sourceObj?.['_'] ?? sourceObj?.['name'] ?? (item['creator'] as string | undefined) ?? 'Google News',
          snippet: item.contentSnippet ?? item.content ?? '',
          language: lang,
        };
      });
  } catch (e) {
    if (e instanceof DataSourceError) throw e;
    throw new DataSourceError(
      'google-news',
      'fetch_failed',
      `fetchNewsForAsset failed for "${query}": ${String(e)}`,
      e,
    );
  }
}
