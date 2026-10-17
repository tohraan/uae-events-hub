import { baseUrl } from '@/lib/events'

export const dynamic = 'force-dynamic'

export function GET(req: Request) {
  const b = baseUrl(req)
  const body = `# UAE Events Hub

> Open index of upcoming tech, AI, startup and hackathon events in the UAE, aggregated from Eventbrite, Luma, Meetup and Hub71. Read-only, no API key. Times are Asia/Dubai (UTC+4).

## For agents
- [MCP server](${b}/api/mcp): Streamable HTTP. Tools: search_events, get_event, list_hackathons, data_status.
- [OpenAPI spec](${b}/openapi.json): full REST description.
- [Events as text](${b}/api/events.txt): compact, token-efficient listing. Same filters as the JSON API.
- [Events as JSON](${b}/api/events): filters q, category, tag, city, source, from, to, updatedSince, page, limit.
- [Calendar feed](${b}/api/feed.ics): subscribable iCalendar.
- [Data freshness](${b}/api/health): per-source last sync, so you can tell stale data from no data.

## Notes
- A null field means the source did not publish it. Nothing is guessed.
- startTimeKnown=false means only the date is known (all-day).
- Always link back to the event's own url when recommending it.
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600', 'Access-Control-Allow-Origin': '*' } })
}
