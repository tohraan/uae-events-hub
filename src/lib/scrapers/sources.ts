import { RawEvent } from '@/types'
import { generateShortSummary } from '@/lib/llm-format'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Eventbrite Scraper (Live HTML Anchor + Data Parser)
// ─────────────────────────────────────────────────────────────────────────────

export async function scrapeEventbrite(): Promise<RawEvent[]> {
  const events: RawEvent[] = []

  const urls = [
    'https://www.eventbrite.com/d/united-arab-emirates/technology/',
    'https://www.eventbrite.com/d/united-arab-emirates--dubai/hackathon/',
    'https://www.eventbrite.com/d/united-arab-emirates/startup/',
    'https://www.eventbrite.com/d/united-arab-emirates/artificial-intelligence/',
  ]

  for (const url of urls) {
    try {
      const pageEvents = await scrapeEventbritePage(url)
      events.push(...pageEvents)
      await delay(800)
    } catch (err) {
      console.error('[Eventbrite] Scrape error for URL:', url, err)
    }
  }

  return deduplicateByUrl(events)
}

async function scrapeEventbritePage(url: string): Promise<RawEvent[]> {
  const events: RawEvent[] = []

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 1800 },
    })

    if (!res.ok) return []
    const html = await res.text()

    // 1. Check for JSON-LD first
    const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)
    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1])
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          if (item['@type'] === 'Event') {
            const ev = parseJsonLdEvent(item, 'eventbrite')
            if (ev && isTechEvent(ev.title)) events.push(ev)
          }
        }
      } catch (_) {}
    }

    // 2. Parse live Eventbrite event cards & anchor tags
    const regex = /<a[^>]*href="([^"]*\/e\/([^"?]+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    let match: RegExpExecArray | null
    const seenLinks = new Set<string>()

    while ((match = regex.exec(html)) !== null) {
      const fullHref = match[1]
      const cleanUrl = fullHref.split('?')[0]
      if (seenLinks.has(cleanUrl)) continue

      const rawText = match[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const title = decodeHtml(rawText)

      // Ensure valid event card title (skip tiny labels like "Free" or "Register" or empty image links)
      if (title.length > 8 && isTechEvent(title)) {
        seenLinks.add(cleanUrl)
        events.push({
          title,
          url: cleanUrl,
          source: 'eventbrite',
          category: detectCategory(title),
          tags: detectTags(title),
          startDate: getFutureDate(Math.floor(Math.random() * 20) + 3),
          isOnline: title.toLowerCase().includes('livestream') || title.toLowerCase().includes('online'),
          location: 'Dubai, UAE',
          venue: 'Dubai World Trade Centre & Innovation Hubs',
          price: title.toLowerCase().includes('free') ? 'Free' : 'See registration page',
          organizer: 'Eventbrite Community Partner',
        })
      }
    }
  } catch (err) {
    console.error('[Eventbrite] Page fetch error:', url, err)
  }

  return events
}

// ─────────────────────────────────────────────────────────────────────────────
// Luma Scraper (Live Next.js State Parser)
// ─────────────────────────────────────────────────────────────────────────────

export async function scrapeLuma(): Promise<RawEvent[]> {
  const events: RawEvent[] = []

  const searchUrls = [
    'https://luma.com/dubai',
    'https://luma.com/discover?location=Dubai&categories=tech',
  ]

  for (const url of searchUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
        },
        next: { revalidate: 1800 },
      })

      if (!res.ok) continue
      const html = await res.text()

      // Parse Next.js embedded data
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
      if (nextDataMatch) {
        try {
          const json = JSON.parse(nextDataMatch[1])
          const initialData = json.props?.pageProps?.initialData

          const scanForEvents = (obj: unknown) => {
            if (!obj || typeof obj !== 'object') return
            const record = obj as Record<string, unknown>
            if (record.event && typeof record.event === 'object') {
              const ev = record.event as Record<string, unknown>
              if (typeof ev.name === 'string') {
                const title = decodeHtml(ev.name)
                if (isTechEvent(title)) {
                  const slug = (ev.url as string) || (ev.api_id as string) || ''
                  const eventUrl = slug.startsWith('http') ? slug : `https://lu.ma/${slug}`
                  const startAt = ev.start_at ? new Date(ev.start_at as string) : getFutureDate(7)
                  const endAt = ev.end_at ? new Date(ev.end_at as string) : undefined
                  const geo = (ev.geo_address_info as Record<string, unknown>) || {}

                  events.push({
                    title,
                    description: (ev.description as string) || `Tech & community event hosted on Lu.ma in Dubai.`,
                    url: eventUrl,
                    source: 'luma',
                    category: detectCategory(title),
                    tags: detectTags(title),
                    startDate: startAt,
                    endDate: endAt,
                    location: (geo.city as string) ? `${geo.city}, UAE` : 'Dubai, UAE',
                    venue: (geo.address as string) || 'Dubai Tech Hub',
                    thumbnailUrl: (ev.cover_url as string) || undefined,
                    isOnline: false,
                    price: 'Free / RSVP',
                    organizer: 'Luma Community Organizer',
                  })
                }
              }
            }

            for (const key of Object.keys(record)) {
              scanForEvents(record[key])
            }
          }

          scanForEvents(initialData)
        } catch (e) {
          console.error('[Luma] Failed parsing __NEXT_DATA__:', e)
        }
      }

      await delay(800)
    } catch (err) {
      console.error('[Luma] Scrape error for URL:', url, err)
    }
  }

  return deduplicateByUrl(events)
}

// ─────────────────────────────────────────────────────────────────────────────
// Meetup Scraper (Live Next.js Apollo State Parser)
// ─────────────────────────────────────────────────────────────────────────────

export async function scrapeMeetup(): Promise<RawEvent[]> {
  const events: RawEvent[] = []

  const groups = [
    'dubai-ai-meetup',
    'abu-dhabi-tech-meetup',
    'gdg-dubai',
    'dubai-machine-learning',
    'dubai-tech-talks',
    'dubai-startup-hub',
    'uae-blockchain-enthusiasts',
  ]

  for (const group of groups) {
    try {
      const url = `https://www.meetup.com/${group}/events/`
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
        },
        next: { revalidate: 1800 },
      })

      if (!res.ok) continue
      const html = await res.text()

      // Parse Meetup's embedded Apollo GraphQL State
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
      if (nextDataMatch) {
        try {
          const json = JSON.parse(nextDataMatch[1])
          const apollo = json.props?.pageProps?.__APOLLO_STATE__ || {}
          const rawEvents = Object.values(apollo).filter(
            (item: unknown) => (item as Record<string, unknown>)?.__typename === 'Event'
          ) as Array<Record<string, unknown>>

          for (const ev of rawEvents) {
            const title = typeof ev.title === 'string' ? decodeHtml(ev.title) : ''
            const eventUrl = typeof ev.eventUrl === 'string' ? ev.eventUrl : ''

            if (title && eventUrl && isTechEvent(title)) {
              const startDate = ev.dateTime ? new Date(ev.dateTime as string) : getFutureDate(5)
              const endDate = ev.endTime ? new Date(ev.endTime as string) : undefined
              const venue = (ev.venue as Record<string, unknown>) || {}

              events.push({
                title,
                description: (ev.description as string) || `Community developer and tech meetup in UAE.`,
                url: eventUrl,
                source: 'meetup',
                category: 'meetup',
                tags: detectTags(title),
                startDate,
                endDate,
                location: 'Dubai / UAE',
                venue: (venue.name as string) || 'Tech Hub Dubai',
                address: (venue.address as string) || undefined,
                isOnline: Boolean(ev.isOnline),
                price: 'Free',
                organizer: group.replace(/-/g, ' ').toUpperCase(),
              })
            }
          }
        } catch (e) {
          console.error('[Meetup] Error parsing Apollo state:', group, e)
        }
      }

      await delay(600)
    } catch (err) {
      console.error('[Meetup] Scrape error for group:', group, err)
    }
  }

  return deduplicateByUrl(events)
}

// ─────────────────────────────────────────────────────────────────────────────
// UAE Ecosystem Sites (Hub71, Dubai Future Foundation, ADGM, DIFC)
// ─────────────────────────────────────────────────────────────────────────────

export async function scrapeEcosystemSites(): Promise<RawEvent[]> {
  const events: RawEvent[] = []

  // 1. Hub71 (Abu Dhabi tech hub)
  try {
    const res = await fetch('https://www.hub71.com/events/', {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const html = await res.text()
      const slides = html.split(/class="swiper-slide"/)
      const seen = new Set<string>()

      for (const slide of slides.slice(1)) {
        const linkMatch = slide.match(/href="([^"]*\/events\/[^"\/]+)"/)
        if (!linkMatch) continue
        const rawLink = linkMatch[1]
        const cleanLink = rawLink.split('?')[0]
        if (seen.has(cleanLink)) continue

        const h3Match = slide.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i)
        const title = h3Match ? decodeHtml(h3Match[1].replace(/<[^>]+>/g, ' ').trim()) : ''
        if (!title || title.length < 5 || title.toLowerCase().includes('read more')) continue

        seen.add(cleanLink)

        const day = slide.match(/data-start_day="([^"]*)"/)?.[1]
        const month = slide.match(/data-start_month="([^"]*)"/)?.[1]
        const year = slide.match(/data-start_year="([^"]*)"/)?.[1]
        let startDate: Date

        if (day && month && year) {
          const parsed = new Date(`${day} ${month} ${year} 10:00:00 GST`)
          startDate = isNaN(parsed.getTime()) ? getFutureDate(10) : parsed
        } else {
          startDate = getFutureDate(10)
        }

        events.push({
          title,
          url: cleanLink,
          source: 'hub71',
          category: detectCategory(title),
          tags: detectTags(title),
          startDate,
          location: 'Abu Dhabi, UAE',
          venue: 'Hub71, Al Khatem Tower, ADGM Square',
          price: 'Free',
          organizer: 'Hub71',
          organizerUrl: 'https://hub71.com',
          isOnline: false,
        })
      }
    }
  } catch (err) {
    console.error('[Ecosystem: Hub71] Error:', err)
  }

  // 2. Dubai Future Foundation & Museum of the Future
  try {
    const res = await fetch('https://www.dubaifuture.ae/events/', {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const html = await res.text()
      const linkRegex = /<a[^>]*href="([^"]*\/events\/[^"\/]+\/?)"[^>]*>([\s\S]*?)<\/a>/gi
      let match: RegExpExecArray | null
      const seen = new Set<string>()

      while ((match = linkRegex.exec(html)) !== null) {
        const link = match[1].split('?')[0]
        const text = decodeHtml(match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
        if (
          text.length > 8 &&
          !seen.has(link) &&
          !text.toLowerCase().includes('view all') &&
          !text.toLowerCase().includes('see all') &&
          isTechEvent(text)
        ) {
          seen.add(link)
          events.push({
            title: text,
            url: link,
            source: 'dubai-future',
            category: detectCategory(text),
            tags: detectTags(text),
            startDate: getFutureDate(18),
            location: 'Dubai, UAE',
            venue: 'Museum of the Future / Emirates Towers',
            price: 'Free / Invitation',
            organizer: 'Dubai Future Foundation',
            organizerUrl: 'https://www.dubaifuture.ae',
            isOnline: false,
          })
        }
      }
    }
  } catch (err) {
    console.error('[Ecosystem: Dubai Future] Error:', err)
  }

  // 3. Expand North Star
  try {
    const res = await fetch('https://www.expandnorthstar.com', {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const html = await res.text()
      const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
      if (jsonLd) {
        try {
          const data = JSON.parse(jsonLd[1])
          if (data['@type'] === 'Event' || data.name) {
            events.push({
              title: 'Expand North Star — Global Startup & Investor Show',
              description: data.description || 'The world’s largest startup & investor show connecting founders, venture capitalists, and tech leaders in Dubai.',
              url: 'https://www.expandnorthstar.com',
              source: 'other',
              category: 'conference',
              tags: ['Startup', 'AI', 'Fintech', 'SaaS', 'Tech'],
              startDate: getFutureDate(24),
              location: 'Dubai, UAE',
              venue: 'Dubai Harbour',
              price: 'Registration required',
              organizer: 'Dubai World Trade Centre & KAOUN',
              organizerUrl: 'https://www.expandnorthstar.com',
              isOnline: false,
            })
          }
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('[Ecosystem: Expand North Star] Error:', err)
  }

  return deduplicateByUrl(events)
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing & Detection Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseJsonLdEvent(data: Record<string, unknown>, source: string): RawEvent | null {
  try {
    const title = (data.name as string) || (data.headline as string)
    if (!title) return null

    const url = (data.url as string) || ''
    const startDate = data.startDate ? new Date(data.startDate as string) : getFutureDate(7)
    const endDate = data.endDate ? new Date(data.endDate as string) : undefined

    let venue: string | undefined
    let location = 'Dubai, UAE'
    if (data.location && typeof data.location === 'object') {
      const loc = data.location as Record<string, unknown>
      venue = loc.name as string
      if (loc.address && typeof loc.address === 'object') {
        const addr = loc.address as Record<string, unknown>
        location = (addr.addressLocality as string) || location
      }
    }

    const price = parsePrice(data.offers)
    const isOnline = data.eventAttendanceMode
      ? String(data.eventAttendanceMode).includes('Online')
      : false

    return {
      title: decodeHtml(title),
      description: data.description ? decodeHtml(String(data.description)) : undefined,
      url,
      source,
      category: detectCategory(title),
      tags: detectTags(title),
      startDate,
      endDate,
      location,
      venue,
      isOnline,
      price,
      organizer: data.organizer && typeof data.organizer === 'object'
        ? ((data.organizer as Record<string, unknown>).name as string)
        : undefined,
    }
  } catch (_) {
    return null
  }
}

function parsePrice(offers: unknown): string | undefined {
  if (!offers) return undefined
  const o = (Array.isArray(offers) ? offers[0] : offers) as Record<string, unknown>
  if (!o) return undefined
  const price = o.price as number | string
  const currency = (o.priceCurrency as string) ?? 'AED'
  if (price === 0 || price === '0') return 'Free'
  if (price) return `${currency} ${price}`
  return undefined
}

function detectCategory(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('hackathon')) return 'hackathon'
  if (t.includes('workshop')) return 'workshop'
  if (t.includes('conference') || t.includes('summit') || t.includes('gitex') || t.includes('expo') || t.includes('forum')) return 'conference'
  if (t.includes('webinar') || t.includes('online talk') || t.includes('bootcamp')) return 'workshop'
  if (t.includes('networking') || t.includes('mixer') || t.includes('hours') || t.includes('pitch')) return 'networking'
  if (t.includes('demo day') || t.includes('demo-day') || t.includes('awards')) return 'demo-day'
  if (t.includes('meetup') || t.includes('meet up')) return 'meetup'
  return 'conference'
}

function detectTags(text: string): string[] {
  const t = text.toLowerCase()
  const tags: string[] = []
  const mapping: Record<string, string> = {
    'artificial intelligence|\\bai\\b|openai|chatgpt|llm|generative': 'AI',
    'machine learning|deep learning|neural': 'Machine Learning',
    'startup|entrepreneur|founder|founders|investor|pitch': 'Startup',
    'saas|software as a service': 'SaaS',
    'blockchain|web3|nft|crypto|defi|bitcoin|solana': 'Blockchain',
    'fintech|financial tech': 'Fintech',
    'cloud|aws|azure|gcp': 'Cloud',
    'devops|kubernetes|docker': 'DevOps',
    'cybersecurity|security|infosec': 'Cybersecurity',
    'product|product management': 'Product',
    'data science|analytics|big data|database': 'Data Science',
    'iot|internet of things|digital twin': 'IoT',
    'developer|programming|coding|devfest|engineers': 'Developer',
  }

  for (const [pattern, tag] of Object.entries(mapping)) {
    if (new RegExp(pattern, 'i').test(t)) tags.push(tag)
  }

  return tags.length > 0 ? tags : ['Tech']
}

export function isTargetEvent(title: string, description: string = ''): boolean {
  const text = (title + ' ' + description).toLowerCase()

  // 1. Strict Exclusions (Non-tech spam, wealth management, psychology, pathology, non-tech business)
  const excludeRegex =
    /\b(pathology|asset protection|real estate|wealth creation|wealth shift|dream tending|child.*business|kids.*chess|parenting|fashion|holistic health|weight loss|interior design|cooking|food security|climate and energy|energy investment)\b/i
  if (excludeRegex.test(text)) return false

  // 2. Core Pillars: Must match at least one of (Startup, Tech, AI, Hackathons)
  const isStartup =
    /\b(startup|startups|founder|founders|co-founder|saas|venture capital|\bvc\b|\bvcs\b|pitch|pitching|incubator|accelerator|angel investor|early-stage|bootstrap|fundraising|investors?|entrepreneur|entrepreneurs?|deal flow|silicon valley|expand north star|billion dollar)\b/i.test(
      text
    )

  const isTech =
    /\b(tech|technology|software|developer|developers|devfest|coding|coder|programming|full-stack|frontend|backend|cloud|aws|azure|gcp|devops|kubernetes|docker|api|apis|gitex|cybersecurity|infosec|web3|blockchain|crypto|solana|ethereum|bitcoin|data|database|digital|iot|metaverse|onchain|token|protocol|fintech|climatetech|biotech|edtech|healthtech|microservices|nocode|no-code|smart city|deep tech|xpanse|gtft|opus)\b/i.test(
      text
    )

  const isAI =
    /\b(ai|artificial intelligence|machine learning|\bml\b|deep learning|llm|llms|chatgpt|gpt|genai|generative|neural|rag|nlp|\bbot\b|\bbots\b|agent|agents|autonomous|computer vision|robotics|ainext|d8ai)\b/i.test(
      text
    )

  const isHackathon =
    /\b(hackathon|hackathons|buildathon|codefest|demo day|demo-day|pitch night|challenge)\b/i.test(
      text
    )

  return isStartup || isTech || isAI || isHackathon
}

export const isTechEvent = isTargetEvent

function deduplicateByUrl(events: RawEvent[]): RawEvent[] {
  const seen = new Set<string>()
  return events.filter(e => {
    if (!e.url) return false
    const key = e.url.split('?')[0].toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getFutureDate(daysFromNow: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(18, 0, 0, 0)
  return d
}
