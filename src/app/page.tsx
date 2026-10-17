import { prisma } from '@/lib/db'
import { queryEvents, baseUrl } from '@/lib/events'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const base = baseUrl()
  const [{ events, total }, lastOk] = await Promise.all([
    queryEvents({ limit: 100 }, base),
    prisma.scrapeLog.findFirst({ where: { status: 'success' }, orderBy: { createdAt: 'desc' } }),
  ])
  const sources = [...new Set(events.map(e => e.source))]
  const cities = [...new Set(events.map(e => e.city).filter(Boolean))] as string[]
  return <DashboardClient events={events} total={total} sources={sources} cities={cities} lastSync={lastOk?.createdAt.toISOString() ?? null} />
}
