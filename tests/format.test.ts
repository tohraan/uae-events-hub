import { describe, expect, it } from 'vitest'
import { generateICalFeed } from '@/lib/ical'
import { eventToText } from '@/lib/llm-format'
import { endOfDubaiDay } from '@/lib/ingest'
import { matchesText, parseQuery } from '@/lib/events'
import type { Event } from '@/types'

const ev: Event = {
  id: 'abc', title: 'Hack, Build; Ship', description: 'Line one\nLine two', shortDescription: null, url: 'https://x.test/e', source: 'luma',
  category: 'hackathon', tags: ['AI'], startDate: '2026-10-22T13:30:00.000Z', endDate: '2026-10-22T16:00:00.000Z', startTimeKnown: true,
  timezone: 'Asia/Dubai', city: 'Dubai', location: null, venue: 'Café ☕ ' + 'x'.repeat(80), address: null, latitude: 25.1, longitude: 55.2, isOnline: false,
  onlineUrl: null, registrationUrl: null, registrationDeadline: null, price: null, organizer: null, organizerUrl: null, thumbnailUrl: null,
  attendeeCount: null, capacity: null, isFeatured: false, llmSummary: null, scrapedAt: '2026-10-01T00:00:00.000Z', lastSeenAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z', createdAt: '2026-10-01T00:00:00.000Z', links: { page: '', json: '', llm: '', ics: '' },
}

describe('ical', () => {
  const out = generateICalFeed([ev])
  it('is CRLF framed with UTC times and escaped text', () => {
    expect(out.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(out).toContain('DTSTART:20261022T133000Z')
    expect(out).toContain('SUMMARY:Hack\\, Build\; Ship')
    expect(out).toContain('GEO:25.1;55.2')
  })
  it('folds lines to 75 octets without splitting characters', () => {
    for (const line of out.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })
  it('emits all-day events when the time is unknown', () => {
    const allDay = generateICalFeed([{ ...ev, startTimeKnown: false, startDate: '2026-10-21T20:00:00.000Z', endDate: '2026-10-22T19:59:59.000Z' }])
    expect(allDay).toContain('DTSTART;VALUE=DATE:20261022')
    expect(allDay).toContain('DTEND;VALUE=DATE:20261023')
  })
})

describe('llm text', () => {
  it('omits unpublished fields instead of guessing', () => {
    const t = eventToText(ev)
    expect(t).not.toContain('PRICE')
    expect(t).not.toContain('ORGANIZER')
    expect(t).toContain('17:30') // 13:30 UTC is 17:30 in Dubai
  })
})

describe('endOfDubaiDay', () => {
  it('returns 23:59:59 Dubai time', () => {
    expect(endOfDubaiDay(new Date('2026-12-08T20:00:00Z')).toISOString()).toBe('2026-12-09T19:59:59.000Z')
  })
})

describe('search', () => {
  it('matches word starts, not substrings', () => {
    expect(matchesText('Dubai Networking Night', 'ai')).toBe(false)
    expect(matchesText('AI Builders', 'ai')).toBe(true)
    expect(matchesText('Agentic AI hackathon', 'ai hack')).toBe(true)
    expect(matchesText('x', 'a.b(')).toBe(false)
  })
  it('parseQuery ignores junk', () => {
    const q = parseQuery(new URLSearchParams('limit=abc&category=nonsense&from=garbage&isOnline=maybe&sort=drop'))
    expect(q.limit).toBeUndefined()
    expect(q.category).toBeUndefined()
    expect(q.from).toBeUndefined()
    expect(q.isOnline).toBeUndefined()
    expect(q.sort).toBe('startDate')
  })
})
