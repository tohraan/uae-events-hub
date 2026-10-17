import type { RawEvent } from '@/types'
import { decodeHtml, delay, extractJsonLd, fetchText } from './http'
import { detectCategory, detectCity, detectTags, isTargetEvent } from './classify'
import type { SourceAdapter } from './index'

const PAGES = [
  'https://www.eventbrite.com/d/united-arab-emirates/technology/',
  'https://www.eventbrite.com/d/united-arab-emirates/hackathon/',
  'https://www.eventbrite.com/d/united-arab-emirates/startup/',
  'https://www.eventbrite.com/d/united-arab-emirates/artificial-intelligence/',
]

type LdEvent = Record<string, any>

/** Eventbrite listings publish a calendar date only; treat it as Dubai midnight. */
function dubaiDate(d: string): { date: Date; hasTime: boolean } {
  const hasTime = d.includes('T')
  return { date: new Date(hasTime ? d : `${d}T00:00:00+04:00`), hasTime }
}

export function parseEventbriteItem(item: LdEvent): RawEvent | null {
  if (item?.['@type'] !== 'Event' || !item.name || !item.url || !item.startDate) return null
  const title = decodeHtml(String(item.name))
  const description = item.description ? decodeHtml(String(item.description)) : undefined
  const start = dubaiDate(String(item.startDate))
  if (isNaN(start.date.getTime())) return null
  const end = item.endDate ? dubaiDate(String(item.endDate)).date : undefined
  const place = item.location ?? {}
  const addr = place.address ?? {}
  const country = addr.addressCountry
  const isOnline = String(item.eventAttendanceMode ?? '').includes('Online')
  if (!isOnline && country && country !== 'AE') return null
  const geo = place.geo
  return {
    title,
    description,
    url: String(item.url).split('?')[0],
    source: 'eventbrite',
    category: detectCategory(title),
    tags: detectTags(`${title} ${description ?? ''}`),
    startDate: start.date,
    startTimeKnown: start.hasTime,
    endDate: end && !isNaN(end.getTime()) ? end : undefined,
    city: detectCity(addr.addressLocality, addr.addressRegion, place.name),
    location: addr.addressLocality ? `${addr.addressLocality}, UAE` : undefined,
    venue: place.name || undefined,
    address: addr.streetAddress || undefined,
    latitude: geo?.latitude ? Number(geo.latitude) : undefined,
    longitude: geo?.longitude ? Number(geo.longitude) : undefined,
    isOnline,
    thumbnailUrl: item.image || undefined,
  }
}

export const eventbrite: SourceAdapter = {
  id: 'eventbrite',
  label: 'Eventbrite',
  async fetch() {
    const out: RawEvent[] = []
    let failures = 0
    for (const url of PAGES) {
      try {
        const html = await fetchText(url)
        for (const block of extractJsonLd(html)) {
          const list = (block as any)?.itemListElement
          if (!Array.isArray(list)) continue
          for (const entry of list) {
            const ev = parseEventbriteItem(entry.item ?? entry)
            if (ev && isTargetEvent(ev.title, ev.description)) out.push(ev)
          }
        }
      } catch (err) {
        failures++
        console.error('[eventbrite]', url, err instanceof Error ? err.message : err)
      }
      await delay(700)
    }
    if (failures === PAGES.length) throw new Error('all Eventbrite listing pages failed')
    return out
  },
}
