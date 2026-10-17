import { baseUrl, getEvent } from '@/lib/events'
import { eventToText } from '@/lib/llm-format'
import { fail, preflight, text } from '@/lib/http-json'

export const dynamic = 'force-dynamic'
export const OPTIONS = preflight

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const event = await getEvent(id, baseUrl(req))
    if (!event) return fail(404, 'Event not found')
    return text(eventToText(event), 'text/plain; charset=utf-8')
  } catch (err) {
    console.error('[api/events/:id/llm]', err)
    return fail(500, 'Internal server error')
  }
}
