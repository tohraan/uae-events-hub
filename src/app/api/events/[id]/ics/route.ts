import { baseUrl, getEvent } from '@/lib/events'
import { generateICalFeed } from '@/lib/ical'
import { fail, preflight, text } from '@/lib/http-json'

export const dynamic = 'force-dynamic'
export const OPTIONS = preflight

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const event = await getEvent(id, baseUrl(req))
    if (!event) return fail(404, 'Event not found')
    return text(generateICalFeed([event], event.title), 'text/calendar; charset=utf-8')
  } catch (err) {
    console.error('[api/events/:id/ics]', err)
    return fail(500, 'Internal server error')
  }
}
