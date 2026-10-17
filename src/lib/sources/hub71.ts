import type { RawEvent } from '@/types'
import { decodeHtml, fetchText } from './http'
import { detectCategory, detectTags } from './classify'
import type { SourceAdapter } from './index'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function parseHub71(html: string): RawEvent[] {
  const out: RawEvent[] = []
  for (const slide of html.split(/class="swiper-slide"/).slice(1)) {
    const link = slide.match(/href="(https?:\/\/[^"]+)"/)?.[1]
    const titleRaw = slide.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]
    const day = slide.match(/data-start_day="(\d+)"/)?.[1]
    const mon = slide.match(/data-start_month="([A-Za-z]+)"/)?.[1]
    const year = slide.match(/data-start_year="(\d+)"/)?.[1]
    if (!link || !titleRaw || !day || !mon || !year) continue
    const m = MONTHS.indexOf(mon.slice(0, 3).toLowerCase())
    if (m < 0) continue
    const title = decodeHtml(titleRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    const pad = (n: string | number) => String(n).padStart(2, '0')
    const startDate = new Date(`${year}-${pad(m + 1)}-${pad(day)}T00:00:00+04:00`)
    const online = /\bOnline\b/.test(slide.replace(/<[^>]+>/g, ' '))
    const kind = slide.match(/fa-calendar"><\/i>\s*([^<]+)</)?.[1]?.trim()
    out.push({
      title,
      url: link,
      source: 'hub71',
      category: detectCategory(`${title} ${kind ?? ''}`),
      tags: detectTags(title),
      startDate,
      startTimeKnown: false,
      city: 'Abu Dhabi',
      location: 'Abu Dhabi, UAE',
      venue: online ? undefined : 'Hub71, ADGM Square',
      isOnline: online,
      organizer: 'Hub71',
      organizerUrl: 'https://www.hub71.com',
      thumbnailUrl: slide.match(/<img[^>]*src="([^"]+)"/)?.[1],
    })
  }
  return out
}

export const hub71: SourceAdapter = {
  id: 'hub71',
  label: 'Hub71',
  async fetch() {
    const html = await fetchText('https://www.hub71.com/events')
    return parseHub71(html) // Hub71 is a startup hub; every listing is in scope
  },
}
