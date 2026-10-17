/** An event as returned by every API surface (REST, MCP, feeds). */
export interface Event {
  id: string
  title: string
  description: string | null
  shortDescription: string | null
  url: string
  source: string
  category: string
  tags: string[]
  startDate: string
  endDate: string | null
  startTimeKnown: boolean
  timezone: string
  city: string | null
  location: string | null
  venue: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  isOnline: boolean
  onlineUrl: string | null
  registrationUrl: string | null
  registrationDeadline: string | null
  price: string | null
  organizer: string | null
  organizerUrl: string | null
  thumbnailUrl: string | null
  attendeeCount: number | null
  capacity: number | null
  isFeatured: boolean
  llmSummary: string | null
  scrapedAt: string
  lastSeenAt: string
  updatedAt: string
  createdAt: string
  links: {
    page: string
    json: string
    llm: string
    ics: string
  }
}

export interface ScraperResult {
  source: string
  eventsFound: number
  eventsNew: number
  eventsUpdated: number
  eventsSkipped: number
  durationMs: number
  error?: string
}

/**
 * What a source adapter hands to ingest. Only set a field when the source
 * actually published it: ingest never invents values, and an absent field is
 * stored as null so clients can tell "unknown" from a real value.
 */
export interface RawEvent {
  title: string
  description?: string
  url: string
  source: string
  category?: string
  tags?: string[]
  startDate: Date
  endDate?: Date
  /** Defaults to true. Set false when only a calendar date was published. */
  startTimeKnown?: boolean
  city?: string
  location?: string
  venue?: string
  address?: string
  latitude?: number
  longitude?: number
  isOnline?: boolean
  onlineUrl?: string
  registrationUrl?: string
  registrationDeadline?: Date
  price?: string
  organizer?: string
  organizerUrl?: string
  thumbnailUrl?: string
  attendeeCount?: number
  capacity?: number
}

export const EVENT_CATEGORIES = [
  'hackathon',
  'meetup',
  'workshop',
  'conference',
  'webinar',
  'networking',
  'demo-day',
  'other',
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

export const UAE_CITIES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
] as const
