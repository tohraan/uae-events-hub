import { baseUrl, parseQuery, queryEvents } from '@/lib/events'
import { generateICalFeed } from '@/lib/ical'
import { fail, preflight, text } from '@/lib/http-json'

export const dynamic = 'force-dynamic'
export const OPTIONS = preflight

// GET /api/feed.ics — subscribe in Google/Apple/Outlook. Accepts the /api/events filters.
export async function GET(req: Request) {
  try {
    const q = parseQuery(new URL(req.url).searchParams)
    q.limit = 100
    const r = await queryEvents(q, baseUrl(req))
    return text(generateICalFeed(r.events), 'text/calendar; charset=utf-8', { cache: 'public, s-maxage=900' })
  } catch (err) {
    console.error('[api/feed.ics]', err)
    return fail(500, 'Internal server error')
  }
}
