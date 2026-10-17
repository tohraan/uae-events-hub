import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Event } from '@/types'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const source = searchParams.get('source')
    const search = searchParams.get('search') || searchParams.get('q')
    const dateFrom = searchParams.get('dateFrom') || searchParams.get('from')
    const dateTo = searchParams.get('dateTo') || searchParams.get('to')
    const isOnline = searchParams.get('isOnline')
    const tag = searchParams.get('tag') || searchParams.get('tags')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const sort = searchParams.get('sort') || 'startDate'
    const order = (searchParams.get('order') || 'asc') as 'asc' | 'desc'
    const upcoming = searchParams.get('upcoming') !== 'false'

    // Build where clause
    const where: Record<string, unknown> = { isActive: true }

    if (category) where.category = category
    if (source) where.source = source
    if (isOnline !== null) where.isOnline = isOnline === 'true'

    // Date filtering
    if (upcoming && !dateFrom) {
      where.startDate = { gte: new Date(Date.now() - 86400000) } // include today
    } else if (dateFrom || dateTo) {
      where.startDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { organizer: { contains: search } },
        { tags: { contains: search } },
        { location: { contains: search } },
        { venue: { contains: search } },
      ]
    }

    // Tag filter
    if (tag) {
      where.tags = { contains: tag }
    }

    const validSortFields = ['startDate', 'createdAt', 'updatedAt', 'title']
    const sortField = validSortFields.includes(sort) ? sort : 'startDate'

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        orderBy: { [sortField]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const parsed = (events as unknown as Record<string, unknown>[]).map(parseEventFromDb)

    return NextResponse.json(
      {
        success: true,
        data: parsed,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          generatedAt: new Date().toISOString(),
          filters: { category, source, search, dateFrom, dateTo, isOnline, tag, upcoming },
        },
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Total-Count': String(total),
          'X-Robots-Tag': 'noindex', // API responses shouldn't be indexed
        },
      }
    )
  } catch (err) {
    console.error('[API /events] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: [] },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
