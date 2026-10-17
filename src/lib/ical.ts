import type { Event } from '@/types'

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const dubaiDay = (iso: string, plusDays = 0) => {
  const d = new Date(new Date(iso).getTime() + 4 * 3_600_000 + plusDays * 86_400_000)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

/** RFC 5545 line folding at 75 octets (not UTF-16 units), CRLF separated. */
function fold(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const out: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const n = enc.encode(ch).length
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur)
      cur = ''
      bytes = 0
    }
    cur += ch
    bytes += n
  }
  out.push(cur)
  return out.map((l, i) => (i ? ' ' + l : l)).join('\r\n')
}

export function vevent(e: Event, host = 'uae-events-hub'): string[] {
  const l = ['BEGIN:VEVENT', `UID:${e.id}@${host}`, `DTSTAMP:${utc(e.updatedAt)}`]
  if (e.startTimeKnown) {
    const end = e.endDate ?? new Date(new Date(e.startDate).getTime() + 2 * 3_600_000).toISOString()
    l.push(`DTSTART:${utc(e.startDate)}`, `DTEND:${utc(end)}`)
  } else {
    // Date-only source: an all-day event, DTEND is exclusive.
    const lastDay = e.endDate ?? e.startDate
    l.push(`DTSTART;VALUE=DATE:${dubaiDay(e.startDate)}`, `DTEND;VALUE=DATE:${dubaiDay(lastDay, 1)}`)
  }
  l.push(`SUMMARY:${esc(e.title)}`)
  const desc = [e.shortDescription ?? e.description, `Details: ${e.registrationUrl ?? e.url}`].filter(Boolean).join('\n\n')
  l.push(`DESCRIPTION:${esc(desc)}`)
  l.push(`URL:${e.registrationUrl ?? e.url}`)
  const where = e.isOnline ? 'Online' : [e.venue, e.address ?? e.location].filter(Boolean).join(', ')
  if (where) l.push(`LOCATION:${esc(where)}`)
  if (e.latitude != null && e.longitude != null) l.push(`GEO:${e.latitude};${e.longitude}`)
  l.push(`CATEGORIES:${[e.category, ...e.tags].map(esc).join(',')}`)
  l.push('END:VEVENT')
  return l
}

export function generateICalFeed(events: Event[], name = 'UAE Tech Events'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//uae-events-hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    'X-WR-TIMEZONE:Asia/Dubai',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...events.flatMap(e => vevent(e)),
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}
