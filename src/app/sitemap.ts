import type { MetadataRoute } from 'next'
import { baseUrl, queryEvents } from '@/lib/events'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl()
  const { events } = await queryEvents({ limit: 100 }, base).catch(() => ({ events: [] }))
  return [
    { url: base, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/docs`, changeFrequency: 'weekly', priority: 0.7 },
    ...events.map(e => ({ url: e.links.page, lastModified: e.updatedAt, changeFrequency: 'daily' as const, priority: 0.8 })),
  ]
}
