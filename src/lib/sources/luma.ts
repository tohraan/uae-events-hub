import type { RawEvent } from '@/types'
import { delay, extractNextData, fetchText } from './http'
import { detectCategory, detectCity, detectTags, isTargetEvent } from './classify'
import type { SourceAdapter } from './index'

// Luma only publishes a city page for Dubai in the UAE.
const PAGES = ['https://luma.com/dubai']

export function parseLumaEntry(entry: any): RawEvent | null {
  const ev = entry?.event
  if (!ev?.name || !ev.start_at || !ev.url) return null
  const geo = ev.geo_address_info ?? {}
  const online = ev.location_type === 'online'
  const hosts: string[] = (entry.hosts ?? []).map((h: any) => h.name).filter(Boolean)
  const ticket = entry.ticket_info
  let price: string | undefined
  if (ticket?.is_free) price = 'Free'
  else if (ticket?.price?.cents != null) price = `${ticket.price.currency?.toUpperCase() ?? ''} ${ticket.price.cents / 100}`.trim()
  const title = String(ev.name)
  const coord = geo.place_coordinate ?? ev.coordinate
  return {
    title,
    url: `https://luma.com/${ev.url}`,
    source: 'luma',
    category: detectCategory(title),
    tags: detectTags(title),
    startDate: new Date(ev.start_at),
    endDate: ev.end_at ? new Date(ev.end_at) : undefined,
    city: detectCity(geo.city_state, geo.full_address, entry.featured_city?.name),
    location: geo.city_state || undefined,
    venue: geo.address || undefined,
    address: geo.full_address || undefined,
    latitude: coord?.latitude,
    longitude: coord?.longitude,
    isOnline: online,
    price,
    organizer: entry.calendar?.name || hosts[0],
    thumbnailUrl: ev.cover_url || undefined,
    attendeeCount: typeof entry.guest_count === 'number' ? entry.guest_count : undefined,
  }
}

export const luma: SourceAdapter = {
  id: 'luma',
  label: 'Luma',
  async fetch() {
    const out: RawEvent[] = []
    let failures = 0
    for (const url of PAGES) {
      try {
        const data: any = extractNextData(await fetchText(url))
        const entries = data?.props?.pageProps?.initialData?.data?.events
        if (!Array.isArray(entries)) throw new Error('Luma page layout changed: no events array')
        for (const entry of entries) {
          const ev = parseLumaEntry(entry)
          if (ev && isTargetEvent(ev.title, ev.description)) out.push(ev)
        }
      } catch (err) {
        failures++
        console.error('[luma]', url, err instanceof Error ? err.message : err)
      }
      await delay(700)
    }
    if (failures === PAGES.length) throw new Error('all Luma pages failed')
    return out
  },
}
