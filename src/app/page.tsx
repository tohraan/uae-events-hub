import { prisma } from '@/lib/db'
import { seedEvents } from '@/lib/scrapers'
import { Event } from '@/types'
import DashboardClient from './DashboardClient'

// Parse DB event to API Event
function parseEventFromDb(e: Record<string, unknown>): Event {
  return {
    ...e,
    tags: (() => { try { return JSON.parse(e.tags as string || '[]') } catch { return [] } })(),
    startDate: (e.startDate as Date).toISOString(),
    endDate: e.endDate ? (e.endDate as Date).toISOString() : null,
    registrationDeadline: e.registrationDeadline ? (e.registrationDeadline as Date).toISOString() : null,
    scrapedAt: (e.scrapedAt as Date).toISOString(),
    updatedAt: (e.updatedAt as Date).toISOString(),
    createdAt: (e.createdAt as Date).toISOString(),
  } as Event
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Auto-seed on first load if DB is empty
  try {
    const count = await prisma.event.count()
    if (count === 0) {
      await seedEvents()
    }
  } catch (err) {
    console.error('[HomePage] Seed error:', err)
  }

  // Fetch all upcoming events
  let events: Event[] = []
  let totalCount = 0
  let sourceStats: { source: string; count: number }[] = []
  let categoryStats: { category: string | null; count: number }[] = []

  try {
    const [dbEvents, dbTotal, sources, categories] = await Promise.all([
      prisma.event.findMany({
        where: {
          isActive: true,
          startDate: { gte: new Date(Date.now() - 86400000) },
        },
        orderBy: { startDate: 'asc' },
        take: 200,
      }),
      prisma.event.count({
        where: { isActive: true, startDate: { gte: new Date(Date.now() - 86400000) } },
      }),
      prisma.event.groupBy({
        by: ['source'],
        _count: { id: true },
        where: { isActive: true },
      }),
      prisma.event.groupBy({
        by: ['category'],
        _count: { id: true },
        where: { isActive: true },
      }),
    ])

    events = (dbEvents as unknown as Record<string, unknown>[]).map(parseEventFromDb)
    totalCount = dbTotal
    sourceStats = sources.map(s => ({ source: s.source, count: s._count.id }))
    categoryStats = categories.map(c => ({ category: c.category, count: c._count.id }))
  } catch (err) {
    console.error('[HomePage] DB error:', err)
  }

  return (
    <DashboardClient
      initialEvents={events}
      totalCount={totalCount}
      sourceStats={sourceStats}
      categoryStats={categoryStats}
    />
  )
}
