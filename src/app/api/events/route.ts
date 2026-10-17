import { baseUrl, parseQuery, queryEvents } from '@/lib/events'
import { fail, json, preflight } from '@/lib/http-json'

export const dynamic = 'force-dynamic'
export const OPTIONS = preflight

// GET /api/events — filter, search, paginate. See /openapi.json.
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const query = parseQuery(params)
    const r = await queryEvents(query, baseUrl(req))
    return json({
      success: true,
      data: r.events,
      meta: { total: r.total, page: r.page, limit: r.limit, pages: r.pages, generatedAt: new Date().toISOString() },
    })
  } catch (err) {
    console.error('[api/events]', err)
    return fail(500, 'Internal server error')
  }
}
