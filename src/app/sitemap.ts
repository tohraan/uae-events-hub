import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://uaetechevents.com'

  const events = await prisma.event.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
    orderBy: { startDate: 'asc' },
  }).catch(() => [])

  const eventUrls = events.map(e => ({
    url: `${baseUrl}/events/${e.id}`,
    lastModified: e.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/api/events`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/api/feed.ics`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/api/events.txt`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    ...eventUrls,
  ]
}
