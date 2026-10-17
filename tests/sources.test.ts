import { describe, expect, it } from 'vitest'
import { parseEventbriteItem } from '@/lib/sources/eventbrite'
import { parseLumaEntry } from '@/lib/sources/luma'
import { parseMeetupPage } from '@/lib/sources/meetup'
import { parseHub71 } from '@/lib/sources/hub71'
import { decodeHtml } from '@/lib/sources/http'

describe('eventbrite', () => {
  const item = {
    '@type': 'Event',
    name: 'AI Summit &amp; Expo',
    url: 'https://www.eventbrite.com/e/ai-summit-tickets-1?aff=x',
    startDate: '2026-12-09',
    endDate: '2026-12-10',
    location: { name: 'DWTC', geo: { latitude: '25.2', longitude: '55.3' }, address: { addressLocality: 'Dubai', addressCountry: 'AE', streetAddress: 'SZR' } },
  }
  it('parses a date-only listing as unknown time at Dubai midnight', () => {
    const e = parseEventbriteItem(item)!
    expect(e.title).toBe('AI Summit & Expo')
    expect(e.url).toBe('https://www.eventbrite.com/e/ai-summit-tickets-1')
    expect(e.startTimeKnown).toBe(false)
    expect(e.startDate.toISOString()).toBe('2026-12-08T20:00:00.000Z')
    expect(e.city).toBe('Dubai')
    expect(e.latitude).toBe(25.2)
    expect(e.price).toBeUndefined()
  })
  it('rejects events outside the UAE and non-events', () => {
    expect(parseEventbriteItem({ ...item, location: { address: { addressCountry: 'GB' } } })).toBeNull()
    expect(parseEventbriteItem({ '@type': 'Organization' })).toBeNull()
  })
})

describe('luma', () => {
  it('parses an entry', () => {
    const e = parseLumaEntry({
      event: { name: 'Grok Bot Meetup Dubai', url: 'abc123', start_at: '2026-10-22T13:30:00.000Z', end_at: '2026-10-22T16:00:00.000Z', location_type: 'offline', geo_address_info: { city_state: 'Dubai, United Arab Emirates', address: 'Some Cafe', full_address: 'Some Cafe, Dubai' } },
      calendar: { name: 'Grok Dubai' },
      ticket_info: { is_free: true },
      guest_count: 40,
    })!
    expect(e.url).toBe('https://luma.com/abc123')
    expect(e.price).toBe('Free')
    expect(e.city).toBe('Dubai')
    expect(e.organizer).toBe('Grok Dubai')
    expect(e.startTimeKnown).toBeUndefined()
  })
  it('skips malformed entries', () => {
    expect(parseLumaEntry({ event: { name: 'x' } })).toBeNull()
  })
})

describe('meetup', () => {
  it('resolves venue and group refs', () => {
    const data = {
      props: { pageProps: { __APOLLO_STATE__: {
        'Event:1': { __typename: 'Event', title: 'DevFest', eventUrl: 'https://www.meetup.com/g/events/1/', dateTime: '2026-11-01T08:00:00+04:00', venue: { __ref: 'Venue:9' }, group: { __ref: 'Group:2' }, feeSettings: null },
        'Venue:9': { __typename: 'Venue', name: 'in5 Tech', city: 'Dubai', address: 'DIC' },
        'Group:2': { __typename: 'Group', name: 'GDG Dubai' },
      } } },
    }
    const [e] = parseMeetupPage(data, 'gdg-dubai')
    expect(e.venue).toBe('in5 Tech')
    expect(e.organizer).toBe('GDG Dubai')
    expect(e.city).toBe('Dubai')
  })
})

describe('hub71', () => {
  it('parses a slide', () => {
    const html = `<div class="swiper-slide" data-start_day="30" data-start_month="Jul" data-start_year="2026"><h3 class="events">Founder&#039;s Fireside</h3><a class="readmore" href="https://www.hub71.com/events/x">Go</a></div>`
    const [e] = parseHub71(html)
    expect(e.title).toBe("Founder's Fireside")
    expect(e.startDate.toISOString()).toBe('2026-07-29T20:00:00.000Z')
    expect(e.startTimeKnown).toBe(false)
  })
})

describe('decodeHtml', () => {
  it('decodes named and numeric entities once', () => {
    expect(decodeHtml('A &amp; B &#039;c&#039; &#x41; &amp;lt;')).toBe("A & B 'c' A &lt;")
  })
})
