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

// GET /api/events/:id/llm
// Returns LLM-optimized plain text for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      return new NextResponse('Event not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const parsed = parseEventFromDb(event as unknown as Record<string, unknown>)
    const text = generateLLMText(parsed)

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Content-Type': 'llm-optimized-event-text',
        'X-Event-ID': id,
      },
    })
  } catch (err) {
    console.error('[API /events/:id/llm] Error:', err)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}
