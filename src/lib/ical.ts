import { Event } from '@/types'

/**
 * Generates a valid iCalendar (.ics) feed from a list of events.
 * Compatible with Google Calendar, Apple Calendar, Outlook, and any RFC 5545 client.
 */
export function generateICalFeed(events: Event[], baseUrl: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UAE Tech Events Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:UAE Tech Events',
    'X-WR-CALDESC:Live tech events, hackathons, meetups, and workshops in the UAE — AI, SaaS, Startups & more.',
    'X-WR-TIMEZONE:Asia/Dubai',
    'X-PUBLISHED-TTL:PT1H',
    // Timezone component
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Dubai',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0400',
    'TZOFFSETTO:+0400',
    'TZNAME:GST',
    'DTSTART:19700101T000000Z',
    'END:STANDARD',
    'END:VTIMEZONE',
  ]

  for (const event of events) {
    const uid = `${event.id}@uae-tech-events`
    const dtStamp = formatICalDate(event.updatedAt)
    const dtStart = formatICalDateTime(event.startDate)
    const dtEnd = event.endDate
      ? formatICalDateTime(event.endDate)
      : formatICalDateTime(addHours(event.startDate, 2))

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${dtStamp}`)
    lines.push(`DTSTART;TZID=Asia/Dubai:${dtStart}`)
    lines.push(`DTEND;TZID=Asia/Dubai:${dtEnd}`)
    lines.push(`SUMMARY:${escapeICal(event.title)}`)

    if (event.description || event.shortDescription) {
      const desc = (event.shortDescription ?? event.description ?? '').replace(/\n/g, '\\n')
      lines.push(`DESCRIPTION:${escapeICal(desc)}`)
    }

    if (event.url) lines.push(`URL:${event.url}`)

    const location = event.isOnline
      ? 'Online'
      : [event.venue, event.address, event.location].filter(Boolean).join(', ')
    if (location) lines.push(`LOCATION:${escapeICal(location)}`)

    if (event.organizer) lines.push(`ORGANIZER;CN=${escapeICal(event.organizer)}:MAILTO:noreply@uae-tech-events.com`)

    if (event.category) lines.push(`CATEGORIES:${event.category.toUpperCase()}`)
    if (event.tags?.length) {
      lines.push(`X-TAGS:${event.tags.join(',')}`)
    }

    if (event.registrationUrl) lines.push(`X-REGISTRATION-URL:${event.registrationUrl}`)
    if (event.price) lines.push(`X-PRICE:${escapeICal(event.price)}`)
    if (event.registrationDeadline) {
      lines.push(`X-DEADLINE:${formatICalDateTime(event.registrationDeadline)}`)
    }

    lines.push(`X-SOURCE:${event.source}`)
    lines.push(`X-EVENT-ID:${event.id}`)
    lines.push(`X-API-URL:${baseUrl}/api/events/${event.id}`)
    lines.push(`X-LLM-URL:${baseUrl}/api/events/${event.id}/llm`)

    if (event.thumbnailUrl) lines.push(`ATTACH:${event.thumbnailUrl}`)

    // Add alarm 24 hours before
    lines.push('BEGIN:VALARM')
    lines.push('TRIGGER:-PT24H')
    lines.push('ACTION:DISPLAY')
    lines.push(`DESCRIPTION:Tomorrow: ${escapeICal(event.title)}`)
    lines.push('END:VALARM')

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  // Fold long lines per RFC 5545 (max 75 chars)
  return lines.map(foldLine).join('\r\n')
}

function formatICalDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function formatICalDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  // Format as local time for Asia/Dubai
  const pad = (n: number) => String(n).padStart(2, '0')
  // Convert to Dubai time (UTC+4)
  const dubaiOffset = 4 * 60 * 60 * 1000
  const dubaiTime = new Date(d.getTime() + dubaiOffset)
  return (
    dubaiTime.getUTCFullYear().toString() +
    pad(dubaiTime.getUTCMonth() + 1) +
    pad(dubaiTime.getUTCDate()) +
    'T' +
    pad(dubaiTime.getUTCHours()) +
    pad(dubaiTime.getUTCMinutes()) +
    pad(dubaiTime.getUTCSeconds())
  )
}

function addHours(dateStr: string, hours: number): string {
  const d = new Date(dateStr)
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}

function escapeICal(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  chunks.push(line.substring(0, 75))
  let i = 75
  while (i < line.length) {
    chunks.push(' ' + line.substring(i, i + 74))
    i += 74
  }
  return chunks.join('\r\n')
}
