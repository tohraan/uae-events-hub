import type { Event } from '@/types'

const fmt = (iso: string, timeKnown = true) =>
  new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(timeKnown ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
    timeZone: 'Asia/Dubai',
  }) + (timeKnown ? ' GST (UTC+4)' : ' (time not published)')

/** Compact key: value text for one event. Fields the source did not publish are omitted. */
export function eventToText(e: Event): string {
  const rows: Array<[string, string | null | undefined]> = [
    ['EVENT', e.title],
    ['ID', e.id],
    ['CATEGORY', e.category],
    ['TAGS', e.tags.join(', ') || null],
    ['STARTS', fmt(e.startDate, e.startTimeKnown)],
    ['ENDS', e.endDate ? fmt(e.endDate, e.startTimeKnown) : null],
    ['WHERE', e.isOnline ? 'Online' : [e.venue, e.address ?? e.location].filter(Boolean).join(', ') || e.city],
    ['CITY', e.city],
    ['PRICE', e.price],
    ['ORGANIZER', e.organizer],
    ['REGISTER', e.registrationUrl ?? e.url],
    ['SOURCE', `${e.source} (${e.url})`],
    ['LAST SEEN', e.lastSeenAt],
  ]
  const head = rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')
  return e.description ? `${head}\n\nDESCRIPTION:\n${e.description}` : head
}

export function eventsToText(events: Event[], total: number, base: string): string {
  const head = [
    '# UAE tech events: hackathons, AI, startups, developer meetups',
    `# ${events.length} of ${total} upcoming events, generated ${new Date().toISOString()}`,
    `# Times are Asia/Dubai (UTC+4). Fields a source did not publish are omitted, never guessed.`,
    `# JSON API: ${base}/api/events  OpenAPI: ${base}/openapi.json  MCP: ${base}/api/mcp`,
  ].join('\n')
  return head + '\n\n' + events.map(eventToText).join('\n\n---\n\n') + '\n'
}
