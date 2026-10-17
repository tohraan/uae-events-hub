import { baseUrl, getEvent } from '@/lib/events'
import { fail, json, preflight } from '@/lib/http-json'

export const dynamic = 'force-dynamic'
export const OPTIONS = preflight

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const event = await getEvent(id, baseUrl(req))
    if (!event) return fail(404, 'Event not found')
    return json({ success: true, data: event })
  } catch (err) {
    console.error('[api/events/:id]', err)
    return fail(500, 'Internal server error')
  }
}
