import { prisma } from '@/lib/db'
import { ADAPTERS } from '@/lib/sources'
import { fail, json, preflight } from '@/lib/http-json'

export const dynamic = 'force-dynamic'
export const OPTIONS = preflight

const DAY = 86_400_000

export async function GET() {
  try {
    const [upcoming, bySource, byCategory, byCity] = await Promise.all([
      prisma.event.count({ where: { isActive: true, startDate: { gte: new Date() } } }),
      prisma.event.groupBy({ by: ['source'], _count: { _all: true }, where: { isActive: true, startDate: { gte: new Date() } } }),
      prisma.event.groupBy({ by: ['category'], _count: { _all: true }, where: { isActive: true, startDate: { gte: new Date() } } }),
      prisma.event.groupBy({ by: ['city'], _count: { _all: true }, where: { isActive: true, startDate: { gte: new Date() } } }),
    ])
    const sources = await Promise.all(
      ADAPTERS.map(async a => {
        const last = await prisma.scrapeLog.findFirst({ where: { source: a.id }, orderBy: { createdAt: 'desc' } })
        const lastOk = await prisma.scrapeLog.findFirst({ where: { source: a.id, status: 'success' }, orderBy: { createdAt: 'desc' } })
        return {
          id: a.id,
          label: a.label,
          upcoming: bySource.find(s => s.source === a.id)?._count._all ?? 0,
          lastStatus: last?.status ?? 'never-run',
          lastError: last?.error ?? null,
          lastSuccessAt: lastOk?.createdAt ?? null,
        }
      })
    )
    const lastOk = sources.map(s => s.lastSuccessAt).filter(Boolean).sort().pop() ?? null
    const stale = !lastOk || Date.now() - new Date(lastOk).getTime() > DAY
    return json(
      {
        success: true,
        data: {
          status: stale ? 'stale' : 'ok',
          upcomingEvents: upcoming,
          lastSuccessfulScrape: lastOk,
          sources,
          categories: byCategory.map(c => ({ category: c.category, count: c._count._all })),
          cities: byCity.map(c => ({ city: c.city, count: c._count._all })),
        },
      },
      { cache: 'public, s-maxage=60' }
    )
  } catch (err) {
    console.error('[api/health]', err)
    return fail(500, 'Internal server error')
  }
}
