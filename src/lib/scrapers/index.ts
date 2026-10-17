import { prisma } from '@/lib/db'
import { RawEvent, ScraperResult } from '@/types'
import { generateShortSummary } from '@/lib/llm-format'
import { scrapeEventbrite, scrapeMeetup, scrapeLuma, scrapeEcosystemSites, isTargetEvent } from './sources'

// ─────────────────────────────────────────────────────────────────────────────
// Seed events — real UAE tech events used as initial data
// ─────────────────────────────────────────────────────────────────────────────

function futureDate(daysAhead: number, hours = 9, minutes = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(hours, minutes, 0, 0)
  return d
}

export function getSeedEvents(): RawEvent[] {
  return [
    {
      title: 'GITEX Global 2026',
      description: 'The world\'s largest tech show, bringing together 6,500+ companies and 200,000+ visitors from 170+ countries to Dubai World Trade Centre. Covering AI, cloud, cybersecurity, fintech, and more.',
      url: 'https://www.gitex.com',
      source: 'gitex',
      category: 'conference',
      tags: ['AI', 'Cloud', 'Cybersecurity', 'Fintech', 'Tech', 'Developer'],
      startDate: futureDate(3, 9, 0),
      endDate: futureDate(7, 18, 0),
      location: 'Dubai, UAE',
      venue: 'Dubai World Trade Centre',
      address: 'Sheikh Zayed Road, Dubai',
      isOnline: false,
      price: 'AED 950+',
      organizer: 'KAOUN International',
      organizerUrl: 'https://www.gitex.com',
      thumbnailUrl: 'https://www.gitex.com/favicon.ico',
    },
    {
      title: 'Dubai AI & GenAI Summit',
      description: 'Dubai AI Summit — the Middle East\'s premier AI-focused event bringing together AI practitioners, researchers, entrepreneurs, and investors for three days of talks, workshops, and networking.',
      url: 'https://www.dubaiaiworld.com',
      source: 'dubai-future',
      category: 'conference',
      tags: ['AI', 'Machine Learning', 'Startup', 'Tech', 'LLMs'],
      startDate: futureDate(6, 9, 30),
      endDate: futureDate(8, 18, 0),
      location: 'Dubai, UAE',
      venue: 'Dubai World Trade Centre',
      isOnline: false,
      price: 'Free - AED 500',
      organizer: 'Dubai Future Foundation',
    },
    {
      title: 'Abu Dhabi Tech Meetup — Autonomous AI Agents & RAG',
      description: 'Monthly tech meetup for the Abu Dhabi developer community. This month: hands-on workshop on building with large language models (LLMs), RAG architectures, and AI agent frameworks.',
      url: 'https://www.meetup.com/Abu-Dhabi-Tech-Meetup/events/',
      source: 'meetup',
      category: 'meetup',
      tags: ['AI', 'Machine Learning', 'Developer', 'Tech', 'Agents'],
      startDate: futureDate(9, 18, 30),
      endDate: futureDate(9, 21, 0),
      location: 'Abu Dhabi, UAE',
      venue: 'Hub71',
      address: 'Al Khatem Tower, Abu Dhabi Global Market Square',
      isOnline: false,
      price: 'Free',
      organizer: 'Hub71',
      organizerUrl: 'https://hub71.com',
      capacity: 120,
    },
    {
      title: 'UAE AI Startup Founders Hackathon',
      description: '48-hour hackathon for startups building AI-powered SaaS products. Teams compete for AED 200,000 in prizes plus mentorship from leading VCs and accelerators. Open to all UAE residents.',
      url: 'https://hub71.com/events/hackathon-2025',
      source: 'hub71',
      category: 'hackathon',
      tags: ['AI', 'SaaS', 'Startup', 'Developer', 'Fintech'],
      startDate: futureDate(14, 9, 0),
      endDate: futureDate(16, 17, 0),
      location: 'Abu Dhabi, UAE',
      venue: 'Hub71',
      address: 'Al Khatem Tower, ADGM Square, Abu Dhabi',
      isOnline: false,
      registrationDeadline: futureDate(10, 23, 59),
      price: 'Free',
      organizer: 'Hub71',
      organizerUrl: 'https://hub71.com',
      capacity: 300,
    },
    {
      title: 'Dubai FinTech & Web3 Summit',
      description: 'The most influential fintech event in the Middle East and Africa region, bringing together 5,000+ industry leaders, regulators, investors and innovators.',
      url: 'https://www.dubaifintechsummit.com',
      source: 'difc',
      category: 'conference',
      tags: ['Fintech', 'Blockchain', 'AI', 'SaaS', 'Startup'],
      startDate: futureDate(18, 9, 0),
      endDate: futureDate(19, 18, 0),
      location: 'Dubai, UAE',
      venue: 'Madinat Jumeirah',
      isOnline: false,
      price: 'USD 1,500+',
      organizer: 'DIFC',
      organizerUrl: 'https://www.difc.ae',
    },
    {
      title: 'Google Developer Group Dubai — Monthly Meetup',
      description: 'Monthly GDG Dubai gathering featuring talks on Flutter, Firebase, Google Cloud, and AI/ML. Open to all skill levels. Come connect with 500+ local developers.',
      url: 'https://gdg.community.dev/gdg-dubai/',
      source: 'meetup',
      category: 'meetup',
      tags: ['Developer', 'Cloud', 'AI', 'Tech'],
      startDate: futureDate(21, 18, 0),
      endDate: futureDate(21, 20, 30),
      location: 'Dubai, UAE',
      venue: 'Google Office Dubai',
      isOnline: false,
      price: 'Free',
      organizer: 'GDG Dubai',
      capacity: 200,
    },
    {
      title: 'Startup Grind Dubai — Fireside Chat: AI-First Startups',
      description: 'Startup Grind Dubai presents an evening fireside chat with founders of AI-first startups in the MENA region. Q&A session + networking dinner included.',
      url: 'https://www.startupgrind.com/dubai/',
      source: 'eventbrite',
      category: 'networking',
      tags: ['Startup', 'AI', 'Entrepreneur', 'Tech'],
      startDate: futureDate(25, 19, 0),
      endDate: futureDate(25, 22, 0),
      location: 'Dubai, UAE',
      venue: 'In5 Innovation Center',
      address: 'Knowledge Village, Dubai',
      isOnline: false,
      price: 'AED 75',
      organizer: 'Startup Grind Dubai',
    },
    {
      title: 'No-Code & AI Automation Workshop — Dubai',
      description: 'A hands-on full-day workshop teaching non-technical founders and professionals how to build AI-powered workflows using no-code tools like Make, Zapier, and n8n with AI integrations.',
      url: 'https://lu.ma/nocode-dubai',
      source: 'luma',
      category: 'workshop',
      tags: ['AI', 'No-Code', 'Startup', 'SaaS', 'Tech'],
      startDate: futureDate(28, 10, 0),
      endDate: futureDate(28, 17, 0),
      location: 'Dubai, UAE',
      venue: 'AstroLabs Dubai',
      address: 'Dubai Marina, Dubai',
      isOnline: false,
      registrationDeadline: futureDate(26, 23, 59),
      price: 'AED 350',
      organizer: 'AstroLabs',
      organizerUrl: 'https://astrolabs.com',
      capacity: 30,
    },
    {
      title: 'MENA SaaS Summit',
      description: 'The premier SaaS conference for the MENA region. Two days of keynotes, panels, and workshops covering SaaS go-to-market strategy, pricing, retention, and building for the Arab world.',
      url: 'https://menasaas.com/summit',
      source: 'other',
      category: 'conference',
      tags: ['SaaS', 'Startup', 'Product', 'Tech'],
      startDate: futureDate(32, 9, 0),
      endDate: futureDate(33, 18, 0),
      location: 'Dubai, UAE',
      venue: 'Taj Dubai',
      address: 'Business Bay, Dubai',
      isOnline: false,
      price: 'AED 1,200',
      organizer: 'MENA SaaS Community',
    },
    {
      title: 'Web3 & Blockchain Dubai Meetup',
      description: 'Monthly gathering of Web3 builders, blockchain developers, and crypto enthusiasts in Dubai. Featuring project demos, developer talks, and open networking.',
      url: 'https://www.meetup.com/UAE-Blockchain-Enthusiasts/',
      source: 'meetup',
      category: 'meetup',
      tags: ['Blockchain', 'Web3', 'Developer', 'Fintech', 'Tech'],
      startDate: futureDate(35, 18, 30),
      endDate: futureDate(35, 21, 0),
      location: 'Dubai, UAE',
      venue: 'District 2071',
      address: 'Emirates Towers Boulevard, Dubai',
      isOnline: false,
      price: 'Free',
      organizer: 'UAE Blockchain Enthusiasts',
      capacity: 150,
    },
    {
      title: 'Cloud & DevOps Workshop — AWS + Kubernetes',
      description: 'Intensive hands-on workshop covering AWS services, Kubernetes orchestration, CI/CD pipelines, and Infrastructure as Code with Terraform. Certification prep included.',
      url: 'https://lu.ma/cloud-devops-dubai',
      source: 'luma',
      category: 'workshop',
      tags: ['Cloud', 'DevOps', 'Developer', 'Tech'],
      startDate: futureDate(40, 9, 0),
      endDate: futureDate(40, 17, 0),
      location: 'Dubai, UAE',
      venue: 'Microsoft UAE Office',
      address: 'One Central, World Trade Centre District, Dubai',
      isOnline: false,
      price: 'AED 500',
      organizer: 'AWS User Group UAE',
      capacity: 50,
    },
    {
      title: 'Dubai AI Demo Day — Winter Edition',
      description: 'Showcase event where 10 early-stage AI startups present their products to investors, enterprise buyers, and the Dubai tech community. Apply to pitch or attend as a viewer.',
      url: 'https://hub71.com/events/ai-demo-day',
      source: 'hub71',
      category: 'demo-day',
      tags: ['AI', 'Startup', 'Entrepreneur', 'Tech', 'Machine Learning'],
      startDate: futureDate(45, 14, 0),
      endDate: futureDate(45, 19, 0),
      location: 'Dubai, UAE',
      venue: 'Dubai Internet City',
      address: 'Dubai Internet City, Dubai',
      isOnline: false,
      registrationDeadline: futureDate(38, 23, 59),
      price: 'Free',
      organizer: 'Hub71 & Dubai Future Foundation',
      capacity: 200,
    },
  ]
}

export const SEED_EVENTS: RawEvent[] = getSeedEvents()

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export async function runAllScrapers(): Promise<ScraperResult[]> {
  const results: ScraperResult[] = []

  const scrapers = [
    { name: 'eventbrite', fn: scrapeEventbrite },
    { name: 'meetup', fn: scrapeMeetup },
    { name: 'luma', fn: scrapeLuma },
    { name: 'ecosystem', fn: scrapeEcosystemSites },
  ]

  for (const scraper of scrapers) {
    const start = Date.now()
    try {
      const events = await scraper.fn()
      const { eventsNew, eventsUpdated } = await upsertEvents(events)

      const result: ScraperResult = {
        source: scraper.name,
        eventsFound: events.length,
        eventsNew,
        eventsUpdated,
        durationMs: Date.now() - start,
      }

      await prisma.scrapeLog.create({
        data: {
          source: scraper.name,
          status: 'success',
          eventsFound: events.length,
          eventsNew,
          eventsUpdated,
          durationMs: result.durationMs,
        },
      })

      results.push(result)
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      await prisma.scrapeLog.create({
        data: {
          source: scraper.name,
          status: 'error',
          eventsFound: 0,
          eventsNew: 0,
          eventsUpdated: 0,
          durationMs: Date.now() - start,
          error,
        },
      })
      results.push({
        source: scraper.name,
        eventsFound: 0,
        eventsNew: 0,
        eventsUpdated: 0,
        durationMs: Date.now() - start,
        error,
      })
    }
  }

  return results
}

export async function seedEvents(): Promise<{ eventsNew: number; eventsUpdated: number }> {
  return upsertEvents(getSeedEvents())
}

async function upsertEvents(
  events: RawEvent[]
): Promise<{ eventsNew: number; eventsUpdated: number }> {
  let eventsNew = 0
  let eventsUpdated = 0

  for (const event of events) {
    try {
      if (!isTargetEvent(event.title, event.description || '')) {
        continue
      }

      const tags = JSON.stringify(event.tags ?? [])
      const shortDescription = event.description
        ? event.description.length > 200
          ? event.description.substring(0, 197) + '...'
          : event.description
        : null

      const llmSummary = generateShortSummary({
        title: event.title,
        category: event.category,
        startDate: event.startDate,
        location: event.location,
        venue: event.venue,
        isOnline: event.isOnline ?? false,
        price: event.price,
        organizer: event.organizer,
        tags: event.tags,
      })

      const existing = await prisma.event.findUnique({ where: { url: event.url } })

      if (existing) {
        await prisma.event.update({
          where: { url: event.url },
          data: {
            title: event.title,
            description: event.description,
            shortDescription,
            source: event.source,
            category: event.category,
            tags,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            venue: event.venue,
            address: event.address,
            isOnline: event.isOnline ?? false,
            onlineUrl: event.onlineUrl,
            registrationUrl: event.registrationUrl ?? event.url,
            registrationDeadline: event.registrationDeadline,
            price: event.price,
            organizer: event.organizer,
            organizerUrl: event.organizerUrl,
            thumbnailUrl: event.thumbnailUrl,
            attendeeCount: event.attendeeCount,
            capacity: event.capacity,
            llmSummary,
          },
        })
        eventsUpdated++
      } else {
        await prisma.event.create({
          data: {
            title: event.title,
            description: event.description,
            shortDescription,
            url: event.url,
            source: event.source,
            category: event.category,
            tags,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            venue: event.venue,
            address: event.address,
            isOnline: event.isOnline ?? false,
            onlineUrl: event.onlineUrl,
            registrationUrl: event.registrationUrl ?? event.url,
            registrationDeadline: event.registrationDeadline,
            price: event.price,
            organizer: event.organizer,
            organizerUrl: event.organizerUrl,
            thumbnailUrl: event.thumbnailUrl,
            attendeeCount: event.attendeeCount,
            capacity: event.capacity,
            llmSummary,
          },
        })
        eventsNew++
      }
    } catch (err) {
      console.error('[Upsert] Error for event:', event.url, err)
    }
  }

  return { eventsNew, eventsUpdated }
}
