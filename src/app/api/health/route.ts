import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [totalEvents, recentLogs, upcomingCount] = await Promise.all([
      prisma.event.count({ where: { isActive: true } }),
      prisma.scrapeLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.event.count({
        where: {
          isActive: true,
          startDate: { gte: new Date() },
        },
      }),
    ])

    const sourceStats = await prisma.event.groupBy({
      by: ['source'],
      _count: { id: true },
      where: { isActive: true },
    })

    const categoryStats = await prisma.event.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { isActive: true },
    })

    const lastSuccessfulScrape = recentLogs.find(l => l.status === 'success')

    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'operational',
          stats: {
            totalEvents,
            upcomingEvents: upcomingCount,
            sources: sourceStats.map(s => ({ source: s.source, count: s._count.id })),
            categories: categoryStats.map(c => ({ category: c.category, count: c._count.id })),
          },
          scraper: {
            lastRun: lastSuccessfulScrape?.createdAt ?? null,
            recentLogs: recentLogs.map(l => ({
              source: l.source,
              status: l.status,
              eventsFound: l.eventsFound,
              eventsNew: l.eventsNew,
              durationMs: l.durationMs,
              createdAt: l.createdAt,
              error: l.error,
            })),
          },
          api: {
            version: '1.0.0',
            endpoints: [
              { method: 'GET', path: '/api/events', description: 'List events with filters' },
              { method: 'GET', path: '/api/events/:id', description: 'Get event by ID' },
              { method: 'GET', path: '/api/events/:id/llm', description: 'LLM-optimized event text' },
              { method: 'GET', path: '/api/feed.ics', description: 'iCal calendar feed' },
              { method: 'GET', path: '/api/events.txt', description: 'Bulk LLM text dump' },
              { method: 'GET', path: '/api/health', description: 'This endpoint' },
              { method: 'POST', path: '/api/scrape', description: 'Trigger manual scrape' },
            ],
          },
          generatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=60',
        },
      }
    )
  } catch (err) {
    console.error('[API /health] Error:', err)
    return NextResponse.json(
      { success: false, status: 'error', error: String(err) },
      { status: 500 }
    )
  }
}
