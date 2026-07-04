import type { MetadataRoute } from 'next';
import { SEO_UNIVERSE } from '@/lib/seo/universe';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,            lastModified: now, changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE_URL}/analysis`,    lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/screener`,    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/try`,         lastModified: now, changeFrequency: 'monthly',  priority: 0.8 },
    { url: `${BASE_URL}/about`,       lastModified: now, changeFrequency: 'monthly',  priority: 0.5 },
    { url: `${BASE_URL}/help`,        lastModified: now, changeFrequency: 'monthly',  priority: 0.4 },
    { url: `${BASE_URL}/terms`,       lastModified: now, changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${BASE_URL}/privacy`,     lastModified: now, changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${BASE_URL}/accessibility`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // English analysis pages only. Hebrew analysis pages exist in code but are
  // intentionally NOT marketed for now (Israeli regulation) — kept out of the
  // sitemap and set noindex. Re-enable by restoring he alternates + entries.
  const analysisPages: MetadataRoute.Sitemap = SEO_UNIVERSE.map((s) => ({
    url: `${BASE_URL}/analysis/${s.exchange.toLowerCase()}/${s.symbol.toLowerCase()}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...analysisPages];
}
