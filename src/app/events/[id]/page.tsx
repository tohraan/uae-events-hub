import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EventCard from '@/components/EventCard'
import EventDetailClient from '@/components/EventDetailClient'
import { baseUrl, getEvent, queryEvents } from '@/lib/events'
import { daysUntil, formatDay, formatTime, labelCategory } from '@/lib/format'
import { eventToText } from '@/lib/llm-format'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getEvent((await params).id)
  if (!e) return { title: 'Event not found | UAE Events Hub' }
  const description = e.shortDescription ?? `${labelCategory(e.category)} in ${e.city ?? 'the UAE'} on ${formatDay(e.startDate)}.`
  return { title: `${e.title} | UAE Events Hub`, description, openGraph: { title: e.title, description, type: 'article' } }
}

export default async function EventPage({ params }: Props) {
  const base = baseUrl()
  const event = await getEvent((await params).id, base)
  if (!event) notFound()

  const related = (await queryEvents({ category: event.category, limit: 4 }, base)).events.filter(e => e.id !== event.id).slice(0, 3)
  const d = daysUntil(event.startDate)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.startTimeKnown ? event.startDate : event.startDate.slice(0, 10),
    endDate: event.endDate ?? undefined,
    eventAttendanceMode: event.isOnline ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.isOnline
      ? { '@type': 'VirtualLocation', url: event.onlineUrl ?? event.url }
      : { '@type': 'Place', name: event.venue ?? event.city ?? 'UAE', address: { '@type': 'PostalAddress', streetAddress: event.address ?? undefined, addressLocality: event.city ?? undefined, addressCountry: 'AE' } },
    description: event.description ?? undefined,
    image: event.thumbnailUrl ?? undefined,
    url: event.url,
    organizer: event.organizer ? { '@type': 'Organization', name: event.organizer, url: event.organizerUrl ?? undefined } : undefined,
  }

  const facts: Array<[string, string | null]> = [
    ['Date', formatDay(event.startDate) + (event.endDate && formatDay(event.endDate) !== formatDay(event.startDate) ? ` – ${formatDay(event.endDate)}` : '')],
    ['Time', event.startTimeKnown ? `${formatTime(event.startDate)}${event.endDate ? ` – ${formatTime(event.endDate)}` : ''} (Dubai time)` : 'Not published by the organizer'],
    ['Where', event.isOnline ? 'Online' : [event.venue, event.address ?? event.location].filter(Boolean).join(', ') || null],
    ['Price', event.price],
    ['Organizer', event.organizer],
  ]

  return (
    <div className="event-detail-page page-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="detail-container">
        <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/" className="breadcrumb-link">← All events</Link>
        </nav>
        <header className="detail-header">
          <div className="detail-badges">
            <span className={`badge badge-${event.category}`}>{labelCategory(event.category)}</span>
            {event.isOnline && <span className="badge badge-online">Online</span>}
            <span className="detail-source-badge">via {event.source}</span>
            <span className="detail-days-badge">{d > 0 ? `In ${d} days` : d === 0 ? 'Today' : 'Started'}</span>
          </div>
          <h1 className="detail-title">{event.title}</h1>
          <div className="detail-tags-row">{event.tags.map(t => <span key={t} className="tag-chip active">{t}</span>)}</div>
        </header>
        <div className="detail-layout-grid">
          <div className="detail-main-col">
            <div className="detail-card info-grid-card">
              {facts.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="info-block"><div><div className="info-label">{k}</div><div className="info-val">{v}</div></div></div>
              ))}
            </div>
            <div className="detail-card mt-lg">
              <h2 className="detail-section-heading">About</h2>
              {event.description
                ? event.description.split(/\n{2,}/).map((p, i) => <p key={i} className="detail-paragraph">{p}</p>)
                : <p className="detail-paragraph text-muted">The organizer published no description. See the original listing.</p>}
              <p className="text-sm text-muted">
                Source: <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-link">{event.url}</a> · last seen {formatDay(event.lastSeenAt)}
              </p>
            </div>
          </div>
          <aside className="detail-sidebar">
            <EventDetailClient event={event} llmText={eventToText(event)} />
          </aside>
        </div>
        {related.length > 0 && (
          <section className="related-events-section mt-2xl">
            <h2 className="section-title">More {labelCategory(event.category).toLowerCase()} events</h2>
            <div className="events-grid">{related.map(r => <EventCard key={r.id} event={r} />)}</div>
          </section>
        )}
      </div>
    </div>
  )
}
