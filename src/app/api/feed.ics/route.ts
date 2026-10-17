import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Event } from '@/types'
import { generateICalFeed } from '@/lib/ical'

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

// GET /api/feed.ics
// Subscribe this URL directly in Google Calendar, Outlook, Apple Calendar, etc.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')

    const where: Record<string, unknown> = {
      isActive: true,
      startDate: { gte: new Date(Date.now() - 86400000) },
    }
    if (category) where.category = category
    if (tag) where.tags = { contains: tag }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: 500,
    })

    const parsed = (events as unknown as Record<string, unknown>[]).map(parseEventFromDb)

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const ical = generateICalFeed(parsed, baseUrl)

    return new NextResponse(ical, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="uae-tech-events.ics"',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[API /feed.ics] Error:', err)
    return new NextResponse('Error generating calendar feed', { status: 500 })
  }
}
