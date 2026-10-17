import { NextRequest, NextResponse } from 'next/server'
import { seedEvents, runAllScrapers } from '@/lib/scrapers'

// POST /api/scrape — trigger a scrape run
// GET /api/scrape — seed initial events (first run)
export async function POST(request: NextRequest) {
  try {
    // Simple auth check
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.SCRAPE_API_KEY
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const mode = body.mode ?? 'scrape' // 'scrape' | 'seed'

    if (mode === 'seed') {
      const result = await seedEvents()
      return NextResponse.json({
        success: true,
        data: { mode: 'seed', ...result },
        message: `Seeded ${result.eventsNew} new events, updated ${result.eventsUpdated}`,
      })
    }

    const results = await runAllScrapers()
    const totalNew = results.reduce((s, r) => s + r.eventsNew, 0)
    const totalUpdated = results.reduce((s, r) => s + r.eventsUpdated, 0)
    const totalFound = results.reduce((s, r) => s + r.eventsFound, 0)

    return NextResponse.json({
      success: true,
      data: {
        mode: 'scrape',
        results,
        summary: {
          totalFound,
          totalNew,
          totalUpdated,
          completedAt: new Date().toISOString(),
        },
      },
    })
  } catch (err) {
    console.error('[API /scrape] Error:', err)
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    )
  }
}

// GET /api/scrape — seed events on first load
export async function GET(request: NextRequest) {
  try {
    const result = await seedEvents()
    return NextResponse.json({
      success: true,
      data: result,
      message: `Seeded ${result.eventsNew} new events, updated ${result.eventsUpdated}`,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
