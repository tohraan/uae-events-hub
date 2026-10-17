'use client'

import Link from 'next/link'
import type { Event } from '@/types'
import { daysUntil, formatWhen, labelCategory } from '@/lib/format'

export default function EventCard({ event, onTagClick }: { event: Event; onTagClick?: (tag: string) => void }) {
  const d = daysUntil(event.startDate)
  const where = event.isOnline ? 'Online' : [event.venue, event.city].filter(Boolean).join(' · ')
  return (
    <article className={`event-card ${event.category}`} aria-label={event.title}>
      <div className="event-card-header">
        <div className="event-card-badges">
          <span className={`badge badge-${event.category}`}>{labelCategory(event.category)}</span>
          {event.isOnline && <span className="badge badge-online">Online</span>}
          {event.price?.toLowerCase() === 'free' && <span className="badge badge-free">Free</span>}
        </div>
        <a className="btn btn-ghost btn-icon btn-sm" href={event.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${event.title} on ${event.source}`} title={`Open on ${event.source}`}>
          ↗
        </a>
      </div>
      <h3 className="event-title">
        <Link href={`/events/${event.id}`} className="card-link">{event.title}</Link>
      </h3>
      {(event.shortDescription ?? event.description) && <p className="event-description">{event.shortDescription ?? event.description}</p>}
      <div className="event-meta">
        <div className="event-meta-row">
          <strong>{formatWhen(event.startDate, event.startTimeKnown)}</strong>
          {d > 0 && d <= 30 && <span className="text-sm text-muted">({d}d away)</span>}
          {d <= 0 && <span className="text-sm text-muted">(now)</span>}
        </div>
        {where && <div className="event-meta-row">{where}</div>}
        {event.organizer && <div className="event-meta-row">{event.organizer}</div>}
      </div>
      {event.tags.length > 0 && (
        <div className="event-tags">
          {event.tags.slice(0, 5).map(t => (
            <button key={t} className="tag-chip" onClick={() => onTagClick?.(t)}>{t}</button>
          ))}
        </div>
      )}
      <div className="event-card-footer">
        {event.price && <span className="event-price">{event.price}</span>}
        <span className="text-sm text-muted">via {event.source}</span>
      </div>
    </article>
  )
}
