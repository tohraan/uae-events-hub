import type { RawEvent } from '@/types'
import { delay, extractNextData, fetchText } from './http'
import { detectCategory, detectCity, detectTags, isTargetEvent } from './classify'
import type { SourceAdapter } from './index'

/** Meetup groups to follow. Add a group's URL slug to track it. */
export const MEETUP_GROUPS = ['gdg-dubai', 'abu-dhabi-tech-meetup', 'dubai-ai-meetup', 'dubai-machine-learning', 'dubai-startup-hub']

export function parseMeetupPage(data: any, groupSlug: string): RawEvent[] {
  const apollo = data?.props?.pageProps?.__APOLLO_STATE__ ?? {}
  const deref = (ref: any) => (ref?.__ref ? apollo[ref.__ref] : ref)
  const out: RawEvent[] = []
  for (const ev of Object.values<any>(apollo)) {
    if (ev?.__typename !== 'Event' || !ev.title || !ev.eventUrl || !ev.dateTime) continue
    const venue = deref(ev.venue)
    const group = deref(ev.group)
    const isOnline = ev.eventType === 'ONLINE'
    const fee = ev.feeSettings
    out.push({
      title: ev.title,
      description: ev.description || undefined,
      url: String(ev.eventUrl).split('?')[0],
      source: 'meetup',
      category: detectCategory(ev.title) === 'other' ? 'meetup' : detectCategory(ev.title),
      tags: detectTags(`${ev.title} ${ev.description ?? ''}`),
      startDate: new Date(ev.dateTime),
      endDate: ev.endTime ? new Date(ev.endTime) : undefined,
      city: detectCity(venue?.city, venue?.address, group?.name, groupSlug),
      location: venue?.city ? `${venue.city}, UAE` : undefined,
      venue: venue?.name || undefined,
      address: venue?.address || undefined,
      isOnline,
      onlineUrl: isOnline ? ev.eventUrl : undefined,
      price: fee ? `${fee.currency ?? ''} ${fee.amount ?? ''}`.trim() : 'Free',
      organizer: group?.name || undefined,
      thumbnailUrl: deref(ev.featuredEventPhoto)?.highResUrl || undefined,
      attendeeCount: ev.rsvps?.totalCount ?? undefined,
      capacity: ev.rsvpSettings?.rsvpLimit || undefined,
    })
  }
  return out
}

export const meetup: SourceAdapter = {
  id: 'meetup',
  label: 'Meetup',
  async fetch() {
    const out: RawEvent[] = []
    let failures = 0
    for (const group of MEETUP_GROUPS) {
      try {
        const html = await fetchText(`https://www.meetup.com/${group}/events/`)
        const data = extractNextData(html)
        if (!data) throw new Error('no __NEXT_DATA__')
        for (const ev of parseMeetupPage(data, group)) if (isTargetEvent(ev.title, ev.description)) out.push(ev)
      } catch (err) {
        failures++
        console.error('[meetup]', group, err instanceof Error ? err.message : err)
      }
      await delay(600)
    }
    if (failures === MEETUP_GROUPS.length) throw new Error('all Meetup groups failed')
    return out
  },
}
