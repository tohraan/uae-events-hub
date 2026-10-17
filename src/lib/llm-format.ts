import { Event } from '@/types'

/**
 * Generates LLM-optimized plain text for a single event.
 * Structured for easy parsing by AI agents and language models.
 */
export function generateLLMText(event: Event): string {
  const lines: string[] = []

  lines.push(`EVENT: ${event.title}`)
  lines.push(`ID: ${event.id}`)
  lines.push(`URL: ${event.url}`)
  lines.push(`SOURCE: ${event.source}`)
  lines.push(`CATEGORY: ${event.category ?? 'General'}`)
  lines.push(`TAGS: ${event.tags.join(', ')}`)
  lines.push('')

  lines.push(`DATE: ${formatDate(event.startDate)}`)
  if (event.endDate) lines.push(`END DATE: ${formatDate(event.endDate)}`)
  lines.push(`TIMEZONE: ${event.timezone ?? 'Asia/Dubai (Gulf Standard Time, UTC+4)'}`)

  if (event.registrationDeadline) {
    lines.push(`REGISTRATION DEADLINE: ${formatDate(event.registrationDeadline)}`)
  }

  lines.push('')
  lines.push(`LOCATION: ${event.isOnline ? 'Online / Virtual' : (event.venue ?? event.location ?? 'UAE')}`)
  if (!event.isOnline && event.address) lines.push(`ADDRESS: ${event.address}`)
  if (event.isOnline && event.onlineUrl) lines.push(`ONLINE LINK: ${event.onlineUrl}`)

  lines.push('')
  lines.push(`PRICE: ${event.price ?? 'Not specified'}`)
  if (event.organizer) lines.push(`ORGANIZER: ${event.organizer}`)
  if (event.attendeeCount) lines.push(`ATTENDEES: ${event.attendeeCount}`)
  if (event.capacity) lines.push(`CAPACITY: ${event.capacity}`)

  if (event.registrationUrl) {
    lines.push(`REGISTER: ${event.registrationUrl}`)
  }

  lines.push('')
  lines.push('DESCRIPTION:')
  lines.push(event.description ?? event.shortDescription ?? 'No description available.')

  if (event.llmSummary) {
    lines.push('')
    lines.push('SUMMARY:')
    lines.push(event.llmSummary)
  }

  lines.push('')
  lines.push(`LAST UPDATED: ${formatDate(event.updatedAt)}`)
  lines.push(`SCRAPED FROM: ${event.source}`)

  return lines.join('\n')
}

/**
 * Generates a bulk LLM-optimized text dump of all events.
 * Useful for feeding into AI agents as context.
 */
export function generateBulkLLMText(events: Event[]): string {
  const header = [
    `UAE TECH EVENTS — LLM DATA DUMP`,
    `Generated: ${new Date().toISOString()}`,
    `Total Events: ${events.length}`,
    `Region: United Arab Emirates`,
    `Focus: Tech, AI, SaaS, Startups, Hackathons, Meetups, Workshops`,
    `=`.repeat(60),
    '',
  ].join('\n')

  const body = events
    .map((event, i) => {
      return [`--- EVENT ${i + 1} of ${events.length} ---`, generateLLMText(event)].join('\n')
    })
    .join('\n\n')

  const footer = [
    '',
    '='.repeat(60),
    `END OF UAE TECH EVENTS DUMP`,
    `API: https://yourdomain.com/api/events`,
    `iCal Feed: https://yourdomain.com/api/feed.ics`,
    `This data is freely available for AI agents, calendar tools, and developers.`,
  ].join('\n')

  return header + body + footer
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
  })
}

/**
 * Generates a short AI-friendly summary for an event.
 */
export function generateShortSummary(event: {
  title: string
  category?: string | null
  startDate: Date | string
  location?: string | null
  venue?: string | null
  isOnline: boolean
  price?: string | null
  organizer?: string | null
  tags?: string[]
}): string {
  const date = new Date(event.startDate).toLocaleDateString('en-AE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Dubai',
  })
  const where = event.isOnline
    ? 'Online'
    : event.venue ?? event.location ?? 'UAE'
  const price = event.price ?? 'Free'
  const tags = event.tags?.slice(0, 3).join(', ') ?? ''
  const category = event.category ?? 'Event'

  return `${category} on ${date} at ${where}. ${price}. ${tags ? `Tags: ${tags}.` : ''} ${event.organizer ? `By ${event.organizer}.` : ''}`.trim()
}
