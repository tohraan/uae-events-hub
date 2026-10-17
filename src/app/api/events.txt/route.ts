import { baseUrl, parseQuery, queryEvents } from '@/lib/events'
import { eventsToText } from '@/lib/llm-format'
import { fail, preflight, text } from '@/lib/http-json'

export const dynamic = 'force-dynamic'
export const OPTIONS = preflight

// GET /api/events.txt — the same filters as /api/events, as compact text for LLM context.
export async function GET(req: Request) {
  try {
    const q = parseQuery(new URL(req.url).searchParams)
    q.limit = Math.min(200, q.limit ?? 100)
    const base = baseUrl(req)
    const r = await queryEvents(q, base)
    return text(eventsToText(r.events, r.total, base), 'text/plain; charset=utf-8')
  } catch (err) {
    console.error('[api/events.txt]', err)
    return fail(500, 'Internal server error')
  }
}
