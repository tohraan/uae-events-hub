export interface Event {
  id: string
  title: string
  description: string | null
  shortDescription: string | null
  url: string
  source: string
  category: string | null
  tags: string[]
  startDate: string
  endDate: string | null
  timezone: string | null
  location: string | null
  venue: string | null
  address: string | null
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
  isActive: boolean
  llmSummary: string | null
  scrapedAt: string
  updatedAt: string
  createdAt: string
}

export interface EventFilters {
  category?: string
  tags?: string[]
  source?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  isOnline?: boolean
  page?: number
  limit?: number
  sort?: 'startDate' | 'createdAt' | 'updatedAt'
  order?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    total: number
    page: number
    limit: number
    pages: number
    generatedAt: string
  }
  error?: string
}

export interface ScraperResult {
  source: string
  eventsFound: number
  eventsNew: number
  eventsUpdated: number
  durationMs: number
  error?: string
}

export interface RawEvent {
  title: string
  description?: string
  url: string
  source: string
  category?: string
  tags?: string[]
  startDate: Date
  endDate?: Date
  location?: string
  venue?: string
  address?: string
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
  'summit',
  'bootcamp',
  'networking',
  'demo-day',
  'other',
] as const

export const EVENT_SOURCES = [
  'eventbrite',
  'meetup',
  'luma',
  'linkedin',
  'gitex',
  'hub71',
  'adgm',
  'difc',
  'dubai-future',
  'manual',
  'other',
] as const

export const TECH_TAGS = [
  'AI',
  'Machine Learning',
  'SaaS',
  'Startup',
  'Blockchain',
  'Web3',
  'Fintech',
  'Cloud',
  'DevOps',
  'Cybersecurity',
  'Product',
  'Design',
  'Data Science',
  'IoT',
  'AR/VR',
  'HealthTech',
  'EdTech',
  'CleanTech',
  'No-Code',
  'Developer',
]
