import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getEvent, queryEvents, parseQuery } from '@/lib/events'
import { eventToText, eventsToText } from '@/lib/llm-format'
import { EVENT_CATEGORIES } from '@/types'
import { prisma } from '@/lib/db'

const ro = { readOnlyHint: true, openWorldHint: false } as const

/** Build a fresh MCP server. Stateless: one instance per HTTP request. */
export function createMcpServer(base: string): McpServer {
  const server = new McpServer({ name: 'uae-events-hub', version: '0.2.0' })

  server.registerTool(
    'search_events',
    {
      title: 'Search UAE tech events',
      description:
        'Search upcoming tech, AI, startup and hackathon events in the UAE. All filters are optional. Times are Asia/Dubai (UTC+4). Returns compact text; use get_event for one event in full.',
      inputSchema: {
        query: z.string().optional().describe('Free text matched against title, description, organizer, venue, tags'),
        category: z.enum(EVENT_CATEGORIES).optional(),
        city: z.string().optional().describe('Dubai, Abu Dhabi, Sharjah, ...'),
        tag: z.string().optional().describe('e.g. AI, Startup, Web3, Developer'),
        from: z.string().optional().describe('ISO date; only events starting on/after it'),
        to: z.string().optional().describe('ISO date; only events starting on/before it'),
        limit: z.number().int().min(1).max(50).optional().describe('Default 10'),
      },
      annotations: ro,
    },
    async args => {
      const q = parseQuery({ ...args, q: args.query, limit: args.limit ?? 10 })
      const r = await queryEvents(q, base)
      return { content: [{ type: 'text', text: r.total ? eventsToText(r.events, r.total, base) : 'No matching upcoming events.' }] }
    }
  )

  server.registerTool(
    'get_event',
    {
      title: 'Get one event',
      description: 'Full details for one event by id (ids come from search_events).',
      inputSchema: { id: z.string() },
      annotations: ro,
    },
    async ({ id }) => {
      const e = await getEvent(id, base)
      if (!e) return { isError: true, content: [{ type: 'text', text: `No event with id ${id}.` }] }
      return { content: [{ type: 'text', text: eventToText(e) + `\n\nCalendar file: ${e.links.ics}` }] }
    }
  )

  server.registerTool(
    'list_hackathons',
    {
      title: 'List upcoming hackathons',
      description: 'Upcoming hackathons in the UAE, soonest first.',
      inputSchema: { city: z.string().optional(), limit: z.number().int().min(1).max(50).optional() },
      annotations: ro,
    },
    async ({ city, limit }) => {
      const r = await queryEvents({ category: 'hackathon', city, limit: limit ?? 10 }, base)
      return { content: [{ type: 'text', text: r.total ? eventsToText(r.events, r.total, base) : 'No upcoming hackathons are listed right now.' }] }
    }
  )

  server.registerTool(
    'data_status',
    {
      title: 'Data freshness',
      description: 'How many upcoming events are indexed and when each source last synced successfully.',
      inputSchema: {},
      annotations: ro,
    },
    async () => {
      const upcoming = await prisma.event.count({ where: { isActive: true, startDate: { gte: new Date() } } })
      const logs = await prisma.scrapeLog.findMany({ where: { status: 'success' }, orderBy: { createdAt: 'desc' }, take: 20 })
      const seen = new Set<string>()
      const lines = logs.filter(l => !seen.has(l.source) && seen.add(l.source)).map(l => `${l.source}: last success ${l.createdAt.toISOString()}`)
      return { content: [{ type: 'text', text: [`Upcoming events: ${upcoming}`, ...lines].join('\n') }] }
    }
  )

  return server
}
