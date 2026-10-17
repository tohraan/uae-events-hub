import { prisma } from '@/lib/db'
import type { RawEvent, ScraperResult } from '@/types'
import { ADAPTERS } from './sources'
import { summarize } from './sources/classify'

/** 23:59:59 Asia/Dubai on the Dubai calendar day containing `d`. */
export function endOfDubaiDay(d: Date): Date {
  const day = new Date(d.getTime() + 4 * 3_600_000).toISOString().slice(0, 10)
  return new Date(`${day}T23:59:59+04:00`)
}

const STALE_AFTER_MS = 36 * 3_600_000

export async function upsertEvents(events: RawEvent[]) {
  let eventsNew = 0
  let eventsUpdated = 0
  let eventsSkipped = 0
  const now = new Date()
  const cutoff = now.getTime() - 7 * 86_400_000
  const seen = new Set<string>()
  for (const e of events) {
    // Archives (Hub71 lists years of past sessions) and repeated listings are noise.
    const last = (e.endDate ?? e.startDate).getTime()
    if (last < cutoff || seen.has(e.url)) {
      eventsSkipped++
      continue
    }
    seen.add(e.url)
    e.title = e.title.replace(/\s+/g, ' ').trim()
    if (e.description && e.description.trim() === e.title) e.description = undefined
    // Date-only sources: the event runs until the end of its last Dubai day.
    if (e.startTimeKnown === false) e.endDate = endOfDubaiDay(e.endDate ?? e.startDate)
    if (!e.title || !e.url || isNaN(e.startDate.getTime())) {
      eventsSkipped++
      continue
    }
    const category = e.category ?? 'other'
    const data = {
      title: e.title,
      description: e.description ?? null,
      shortDescription: e.description ? (e.description.length > 200 ? e.description.slice(0, 197) + '...' : e.description) : null,
      source: e.source,
      category,
      tags: JSON.stringify(e.tags ?? []),
      startDate: e.startDate,
      endDate: e.endDate ?? null,
      startTimeKnown: e.startTimeKnown ?? true,
      city: e.city ?? null,
      location: e.location ?? null,
      venue: e.venue ?? null,
      address: e.address ?? null,
      latitude: e.latitude ?? null,
      longitude: e.longitude ?? null,
      isOnline: e.isOnline ?? false,
      onlineUrl: e.onlineUrl ?? null,
      registrationUrl: e.registrationUrl ?? e.url,
      registrationDeadline: e.registrationDeadline ?? null,
      price: e.price ?? null,
      organizer: e.organizer ?? null,
      organizerUrl: e.organizerUrl ?? null,
      thumbnailUrl: e.thumbnailUrl ?? null,
      attendeeCount: e.attendeeCount ?? null,
      capacity: e.capacity ?? null,
      llmSummary: summarize({ ...e, category, city: e.city, isOnline: e.isOnline ?? false }),
      isActive: true,
      lastSeenAt: now,
    }
    const existing = await prisma.event.findUnique({ where: { url: e.url }, select: { id: true } })
    if (existing) {
      await prisma.event.update({ where: { url: e.url }, data })
      eventsUpdated++
    } else {
      await prisma.event.create({ data: { ...data, url: e.url } })
      eventsNew++
    }
  }
  return { eventsNew, eventsUpdated, eventsSkipped }
}

/** Hide events a source has stopped listing, so cancelled events do not linger. */
async function retireMissing(source: string, runStartedAt: Date) {
  await prisma.event.updateMany({
    where: { source, isActive: true, startDate: { gte: new Date() }, lastSeenAt: { lt: new Date(runStartedAt.getTime() - STALE_AFTER_MS) } },
    data: { isActive: false },
  })
}

export async function runScrapers(only?: string[]): Promise<ScraperResult[]> {
  const results: ScraperResult[] = []
  for (const adapter of ADAPTERS) {
    if (only?.length && !only.includes(adapter.id)) continue
    const start = Date.now()
    const startedAt = new Date()
    let result: ScraperResult
    try {
      const events = await adapter.fetch()
      const counts = await upsertEvents(events)
      if (events.length > 0) await retireMissing(adapter.id, startedAt)
      result = { source: adapter.id, eventsFound: events.length, ...counts, durationMs: Date.now() - start }
    } catch (err) {
      result = {
        source: adapter.id,
        eventsFound: 0,
        eventsNew: 0,
        eventsUpdated: 0,
        eventsSkipped: 0,
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      }
    }
    await prisma.scrapeLog.create({
      data: {
        source: result.source,
        status: result.error ? 'error' : 'success',
        eventsFound: result.eventsFound,
        eventsNew: result.eventsNew,
        eventsUpdated: result.eventsUpdated,
        eventsSkipped: result.eventsSkipped,
        durationMs: result.durationMs,
        error: result.error,
      },
    })
    results.push(result)
  }
  return results
}
