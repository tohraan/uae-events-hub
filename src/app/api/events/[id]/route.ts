import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Event } from '@/types'
import { generateLLMText } from '@/lib/llm-format'

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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// GET /api/events/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found', data: null },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    const parsed = parseEventFromDb(event as unknown as Record<string, unknown>)

    // Add structured data helpers
    const response = {
      success: true,
      data: parsed,
      meta: {
        generatedAt: new Date().toISOString(),
        llmUrl: `/api/events/${id}/llm`,
        icalUrl: `/api/feed.ics`,
      },
    }

    return NextResponse.json(response, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    console.error('[API /events/:id] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: null },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
