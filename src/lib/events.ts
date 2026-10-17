import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { EVENT_CATEGORIES, type Event } from '@/types'

export function baseUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  if (req) return new URL(req.url).origin
  return 'http://localhost:3000'
}

type Row = Prisma.EventGetPayload<object>

export function serializeEvent(e: Row, base = ''): Event {
  let tags: string[] = []
  try {
    tags = JSON.parse(e.tags)
  } catch {}
  const iso = (d: Date | null) => (d ? d.toISOString() : null)
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    shortDescription: e.shortDescription,
    url: e.url,
    source: e.source,
    category: e.category,
    tags,
    startDate: e.startDate.toISOString(),
    endDate: iso(e.endDate),
    startTimeKnown: e.startTimeKnown,
    timezone: e.timezone,
    city: e.city,
    location: e.location,
    venue: e.venue,
    address: e.address,
    latitude: e.latitude,
    longitude: e.longitude,
    isOnline: e.isOnline,
    onlineUrl: e.onlineUrl,
    registrationUrl: e.registrationUrl,
    registrationDeadline: iso(e.registrationDeadline),
    price: e.price,
    organizer: e.organizer,
    organizerUrl: e.organizerUrl,
    thumbnailUrl: e.thumbnailUrl,
    attendeeCount: e.attendeeCount,
    capacity: e.capacity,
    isFeatured: e.isFeatured,
    llmSummary: e.llmSummary,
    scrapedAt: e.scrapedAt.toISOString(),
    lastSeenAt: e.lastSeenAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    links: {
      page: `${base}/events/${e.id}`,
      json: `${base}/api/events/${e.id}`,
      llm: `${base}/api/events/${e.id}/llm`,
      ics: `${base}/api/events/${e.id}/ics`,
    },
  }
}

export interface EventQuery {
  q?: string
  category?: string
  tag?: string
  source?: string
  city?: string
  isOnline?: boolean
  from?: Date
  to?: Date
  /** Only events that have not ended yet. Default true. */
  upcoming?: boolean
  /** Only events updated after this instant (for incremental sync). */
  updatedSince?: Date
  sort?: 'startDate' | 'updatedAt' | 'title'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

const DAY = 86_400_000

export function buildWhere(q: EventQuery): Prisma.EventWhereInput {
  const and: Prisma.EventWhereInput[] = [{ isActive: true }]
  if (q.category) and.push({ category: q.category })
  if (q.source) and.push({ source: q.source })
  if (q.city) and.push({ city: { equals: q.city } })
  if (q.isOnline !== undefined) and.push({ isOnline: q.isOnline })
  if (q.tag) and.push({ tags: { contains: JSON.stringify(q.tag) } }) // quoted, so "AI" never matches "Dubai"
  if (q.updatedSince) and.push({ updatedAt: { gt: q.updatedSince } })
  if (q.upcoming !== false && !q.from) {
    // Not over yet: ends in the future, or (no end) started within the last day.
    and.push({
      OR: [{ endDate: { gte: new Date() } }, { endDate: null, startDate: { gte: new Date(Date.now() - DAY) } }],
    })
  }
  if (q.from) and.push({ startDate: { gte: q.from } })
  if (q.to) and.push({ startDate: { lte: q.to } })
  return { AND: and }
}

/**
 * Free-text match done in memory: every query word must start a word somewhere
 * in the event's text. SQL LIKE would match "ai" inside "Dubai".
 */
export function matchesText(text: string, q: string): boolean {
  const hay = text.toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every(w => new RegExp(`(^|[^\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u').test(hay))
}

const searchText = (r: Row) => [r.title, r.description, r.organizer, r.venue, r.city, r.tags].filter(Boolean).join(' ')

export async function queryEvents(q: EventQuery, base = '') {
  const limit = Math.min(100, Math.max(1, q.limit ?? 20))
  const page = Math.max(1, q.page ?? 1)
  const where = buildWhere(q)
  const sort = q.sort ?? 'startDate'
  const order = q.order ?? (sort === 'updatedAt' ? 'desc' : 'asc')
  const orderBy = { [sort]: order }
  if (q.q?.trim()) {
    const all = await prisma.event.findMany({ where, orderBy, take: 2000 })
    const hits = all.filter(r => matchesText(searchText(r), q.q!))
    const slice = hits.slice((page - 1) * limit, page * limit)
    return { total: hits.length, page, limit, pages: Math.ceil(hits.length / limit), events: slice.map(r => serializeEvent(r, base)) }
  }
  const [total, rows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
  ])
  return { total, page, limit, pages: Math.ceil(total / limit), events: rows.map(r => serializeEvent(r, base)) }
}

export async function getEvent(id: string, base = ''): Promise<Event | null> {
  const row = await prisma.event.findUnique({ where: { id } })
  return row && row.isActive ? serializeEvent(row, base) : null
}

/** Parse URL search params (or an MCP tool's args) into an EventQuery, ignoring junk values. */
export function parseQuery(p: URLSearchParams | Record<string, unknown>): EventQuery {
  const get = (k: string): string | undefined => {
    const v = p instanceof URLSearchParams ? p.get(k) : p[k]
    return v === null || v === undefined || v === '' ? undefined : String(v)
  }
  const num = (k: string) => {
    const v = get(k)
    const n = v === undefined ? NaN : parseInt(v, 10)
    return Number.isFinite(n) ? n : undefined
  }
  const date = (k: string) => {
    const v = get(k)
    const d = v ? new Date(v) : undefined
    return d && !isNaN(d.getTime()) ? d : undefined
  }
  const bool = (k: string) => {
    const v = get(k)
    return v === 'true' ? true : v === 'false' ? false : undefined
  }
  const category = get('category')
  const sort = get('sort')
  const order = get('order')
  return {
    q: get('q') ?? get('search'),
    category: category && (EVENT_CATEGORIES as readonly string[]).includes(category) ? category : undefined,
    tag: get('tag'),
    source: get('source'),
    city: get('city'),
    isOnline: bool('isOnline'),
    from: date('from'),
    to: date('to'),
    upcoming: bool('upcoming'),
    updatedSince: date('updatedSince'),
    sort: sort === 'updatedAt' || sort === 'title' ? sort : 'startDate',
    order: order === 'desc' ? 'desc' : order === 'asc' ? 'asc' : undefined,
    page: num('page'),
    limit: num('limit'),
  }
}
