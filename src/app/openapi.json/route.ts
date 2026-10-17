import { baseUrl } from '@/lib/events'
import { EVENT_CATEGORIES } from '@/types'
import { CORS } from '@/lib/http-json'

export const dynamic = 'force-dynamic'

export function openapiSpec(base: string) {
  const filters = [
    { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Free-text search (alias: search)' },
    { name: 'category', in: 'query', schema: { type: 'string', enum: [...EVENT_CATEGORIES] } },
    { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'e.g. AI, Startup, Web3' },
    { name: 'source', in: 'query', schema: { type: 'string' }, description: 'eventbrite | luma | meetup | hub71' },
    { name: 'city', in: 'query', schema: { type: 'string' }, description: 'Dubai, Abu Dhabi, ...' },
    { name: 'isOnline', in: 'query', schema: { type: 'boolean' } },
    { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Start on/after. Disables the upcoming filter.' },
    { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
    { name: 'upcoming', in: 'query', schema: { type: 'boolean', default: true } },
    { name: 'updatedSince', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Incremental sync: only events changed after this instant' },
  ]
  const page = [
    { name: 'sort', in: 'query', schema: { type: 'string', enum: ['startDate', 'updatedAt', 'title'] } },
    { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
    { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
    { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
  ]
  const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
  const text = (d: string) => ({ description: d, content: { 'text/plain': { schema: { type: 'string' } } } })
  return {
    openapi: '3.1.0',
    info: {
      title: 'UAE Events Hub API',
      version: '0.2.0',
      description: 'Open, read-only API for tech, AI, startup and hackathon events in the UAE. No key needed. Times are ISO 8601 UTC; display in Asia/Dubai (UTC+4). Fields a source did not publish are null.',
    },
    servers: [{ url: base }],
    paths: {
      '/api/events': { get: { operationId: 'listEvents', summary: 'List and search events', parameters: [...filters, ...page], responses: { '200': { description: 'Page of events', content: { 'application/json': { schema: { $ref: '#/components/schemas/EventList' } } } } } } },
      '/api/events/{id}': { get: { operationId: 'getEvent', parameters: [idParam], responses: { '200': { description: 'One event', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Event' } } } } } }, '404': { description: 'Not found' } } } },
      '/api/events/{id}/llm': { get: { operationId: 'getEventText', parameters: [idParam], responses: { '200': text('Compact text for one event') } } },
      '/api/events/{id}/ics': { get: { operationId: 'getEventIcs', parameters: [idParam], responses: { '200': { description: 'iCalendar file', content: { 'text/calendar': { schema: { type: 'string' } } } } } } },
      '/api/events.txt': { get: { operationId: 'listEventsText', summary: 'Same filters as /api/events, as compact text for LLM context', parameters: [...filters, ...page], responses: { '200': text('Compact text') } } },
      '/api/feed.ics': { get: { operationId: 'calendarFeed', summary: 'Subscribable calendar feed; accepts the event filters', parameters: filters, responses: { '200': { description: 'iCalendar feed', content: { 'text/calendar': { schema: { type: 'string' } } } } } } },
      '/api/health': { get: { operationId: 'health', summary: 'Per-source freshness and counts', responses: { '200': { description: 'Status' } } } },
      '/api/mcp': { post: { operationId: 'mcp', summary: 'Model Context Protocol endpoint (Streamable HTTP). Tools: search_events, get_event, list_hackathons, data_status.', responses: { '200': { description: 'JSON-RPC response' } } } },
    },
    components: {
      schemas: {
        Event: {
          type: 'object',
          required: ['id', 'title', 'url', 'source', 'category', 'startDate'],
          properties: {
            id: { type: 'string' }, title: { type: 'string' }, description: { type: ['string', 'null'] }, url: { type: 'string', format: 'uri' },
            source: { type: 'string' }, category: { type: 'string', enum: [...EVENT_CATEGORIES] }, tags: { type: 'array', items: { type: 'string' } },
            startDate: { type: 'string', format: 'date-time' }, endDate: { type: ['string', 'null'], format: 'date-time' },
            startTimeKnown: { type: 'boolean', description: 'false when the source published only a date; startDate is then Dubai midnight' },
            city: { type: ['string', 'null'] }, venue: { type: ['string', 'null'] }, address: { type: ['string', 'null'] },
            latitude: { type: ['number', 'null'] }, longitude: { type: ['number', 'null'] }, isOnline: { type: 'boolean' },
            price: { type: ['string', 'null'] }, organizer: { type: ['string', 'null'] }, registrationUrl: { type: ['string', 'null'] },
            lastSeenAt: { type: 'string', format: 'date-time' },
            links: { type: 'object', properties: { page: { type: 'string' }, json: { type: 'string' }, llm: { type: 'string' }, ics: { type: 'string' } } },
          },
        },
        EventList: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { $ref: '#/components/schemas/Event' } },
            meta: { type: 'object', properties: { total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' }, pages: { type: 'integer' }, generatedAt: { type: 'string' } } },
          },
        },
      },
    },
  }
}

export function GET(req: Request) {
  return Response.json(openapiSpec(baseUrl(req)), { headers: { ...CORS, 'Cache-Control': 'public, s-maxage=3600' } })
}
