// Israeli financial news from Google News (Hebrew feed).
// Returns empty array if fetch fails — research pipeline handles gracefully.

import Parser from 'rss-parser';
import type { NewsItem } from '../types';

const parser = new Parser();
const HE_BASE = 'https://news.google.com/rss/search?hl=he-IL&gl=IL&ceid=IL:he';

export async function fetchIsraeliNews(queries: string[]): Promise<NewsItem[]> {
  const query = queries.slice(0, 3).join(' OR ');
  const url = `${HE_BASE}&q=${encodeURIComponent(query)}`;
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, 15).map((item): NewsItem => ({
      id: `isr-${Buffer.from(item.link ?? item.title ?? '').toString('base64').slice(0, 16)}`,
      title: item.title ?? '',
      url: item.link ?? '',
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      source: (item['source'] as Record<string, string> | undefined)?.['_'] ?? 'Israeli News',
      snippet: item.contentSnippet ?? '',
      language: 'he',
    }));
  } catch {
    return [];
  }
}
