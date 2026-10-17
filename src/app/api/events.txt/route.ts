import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Event } from '@/types'
import { generateBulkLLMText } from '@/lib/llm-format'

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

// GET /api/events.txt
// Returns all upcoming events as a single LLM-optimized text file.
// Perfect for feeding into AI agent contexts, RAG pipelines, etc.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const limit = Math.min(500, parseInt(searchParams.get('limit') || '100'))

    const where: Record<string, unknown> = {
      isActive: true,
      startDate: { gte: new Date(Date.now() - 86400000) },
    }
    if (category) where.category = category
    if (tag) where.tags = { contains: tag }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: limit,
    })

    const parsed = (events as unknown as Record<string, unknown>[]).map(parseEventFromDb)
    const text = generateBulkLLMText(parsed)

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'inline; filename="uae-tech-events.txt"',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        'X-Content-Type': 'llm-bulk-event-dump',
        'X-Total-Events': String(parsed.length),
      },
    })
  } catch (err) {
    console.error('[API /events.txt] Error:', err)
    return new NextResponse('Error generating LLM dump', { status: 500 })
  }
}
