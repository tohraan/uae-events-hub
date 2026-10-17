import type { RawEvent } from '@/types'
import { eventbrite } from './eventbrite'
import { luma } from './luma'
import { meetup } from './meetup'
import { hub71 } from './hub71'

/**
 * A source adapter turns one website into RawEvents. To add a source, write an
 * adapter and append it to ADAPTERS; ingest, the API and the docs pick it up.
 * Throw when the source is unreachable or its layout changed, so the failure is
 * logged in /api/health instead of looking like "no events".
 */
export interface SourceAdapter {
  id: string
  label: string
  fetch(): Promise<RawEvent[]>
}

export const ADAPTERS: SourceAdapter[] = [eventbrite, luma, meetup, hub71]
