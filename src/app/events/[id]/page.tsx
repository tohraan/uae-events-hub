import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import EventDetailClient from '@/components/EventDetailClient'
import EventCard from '@/components/EventCard'
import { Event } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })

  if (!event) {
    return {
      title: 'Event Not Found | UAE Tech Events Hub',
    }
  }

  const dateStr = new Date(event.startDate).toLocaleDateString('en-AE', {
    dateStyle: 'medium',
    timeZone: 'Asia/Dubai',
  })

  return {
    title: `${event.title} — UAE Tech Events Hub`,
    description:
      event.shortDescription ||
      event.description?.substring(0, 160) ||
      `${event.title} happening in ${event.location || 'UAE'} on ${dateStr}.`,
    openGraph: {
      title: event.title,
      description:
        event.shortDescription ||
        event.description?.substring(0, 160) ||
        `Live tech & startup event in UAE: ${event.title}`,
      url: `/events/${event.id}`,
      type: 'article',
    },
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })

  if (!event || !event.isActive) {
    notFound()
  }

  const tags: string[] = (() => {
    try {
      return JSON.parse(event.tags)
    } catch {
      return []
    }
  })()

  // Fetch 3 related events
  const relatedRaw = await prisma.event.findMany({
    where: {
      id: { not: event.id },
      isActive: true,
      category: event.category,
    },
    orderBy: { startDate: 'asc' },
    take: 3,
  })

  const relatedEvents: Event[] = relatedRaw.map(e => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    registrationDeadline: e.registrationDeadline ? e.registrationDeadline.toISOString() : null,
    scrapedAt: e.scrapedAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    tags: (() => {
      try {
        return JSON.parse(e.tags)
      } catch {
        return []
      }
    })(),
  }))

  const startDateFormatted = new Date(event.startDate).toLocaleDateString('en-AE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Dubai',
  })

  const startTimeFormatted = new Date(event.startDate).toLocaleTimeString('en-AE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
  })

  const endTimeFormatted = event.endDate
    ? new Date(event.endDate).toLocaleTimeString('en-AE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Dubai',
      })
    : null

  const daysUntil = Math.ceil(
    (new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const deadlineFormatted = event.registrationDeadline
    ? new Date(event.registrationDeadline).toLocaleString('en-AE', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Dubai',
      })
    : null

  // Schema.org JSON-LD
  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate ? event.endDate.toISOString() : undefined,
    eventAttendanceMode: event.isOnline
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: event.isOnline
      ? {
          '@type': 'VirtualLocation',
          url: event.registrationUrl || event.url,
        }
      : {
          '@type': 'Place',
          name: event.venue || event.location || 'Dubai, UAE',
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.address || undefined,
            addressLocality: event.location || 'Dubai',
            addressCountry: 'AE',
          },
        },
    description: event.description || event.shortDescription || event.title,
    offers: {
      '@type': 'Offer',
      price: event.price && event.price.toLowerCase() === 'free' ? '0' : undefined,
      priceCurrency: 'AED',
      url: event.registrationUrl || event.url,
      availability: 'https://schema.org/InStock',
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizer || 'UAE Tech Community',
      url: event.organizerUrl || undefined,
    },
  }

  return (
    <div className="event-detail-page page-fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />

      <div className="detail-container">
        {/* Navigation Breadcrumbs */}
        <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/" className="breadcrumb-link">
            ← Back to Dashboard
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-category">{event.category.toUpperCase()}</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{event.title}</span>
        </nav>

        {/* Hero Section */}
        <header className="detail-header">
          <div className="detail-badges">
            <span className={`badge badge-${event.category}`}>
              {event.category.toUpperCase()}
            </span>
            {event.isOnline && <span className="badge badge-online">🌐 ONLINE</span>}
            {event.price && event.price.toLowerCase() === 'free' && (
              <span className="badge badge-free">FREE</span>
            )}
            <span className="detail-source-badge">
              Source: <strong>{event.source.toUpperCase()}</strong>
            </span>
            <span className="detail-days-badge">
              {daysUntil === 0
                ? '⚡ Happening Today'
                : daysUntil > 0
                ? `⏳ In ${daysUntil} days`
                : '✓ Past event'}
            </span>
          </div>

          <h1 className="detail-title">{event.title}</h1>

          {event.shortDescription && (
            <p className="detail-lead">{event.shortDescription}</p>
          )}

          <div className="detail-tags-row">
            {tags.map(tag => (
              <span key={tag} className="tag-chip active">
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* Main Grid: Left Details, Right Sidebar */}
        <div className="detail-layout-grid">
          {/* Main Info Column */}
          <div className="detail-main-col">
            {/* Quick Facts Card */}
            <div className="detail-card info-grid-card">
              <div className="info-block">
                <div className="info-icon">📅</div>
                <div>
                  <div className="info-label">Date</div>
                  <div className="info-val">{startDateFormatted}</div>
                </div>
              </div>

              <div className="info-block">
                <div className="info-icon">⏰</div>
                <div>
                  <div className="info-label">Time & Timezone</div>
                  <div className="info-val">
                    {startTimeFormatted}
                    {endTimeFormatted ? ` – ${endTimeFormatted}` : ''}
                    <span className="info-sub"> (Asia/Dubai, GST)</span>
                  </div>
                </div>
              </div>

              <div className="info-block">
                <div className="info-icon">📍</div>
                <div>
                  <div className="info-label">Location / Venue</div>
                  <div className="info-val">
                    {event.venue || event.location || 'United Arab Emirates'}
                  </div>
                  {event.address && <div className="info-sub">{event.address}</div>}
                </div>
              </div>

              <div className="info-block">
                <div className="info-icon">💰</div>
                <div>
                  <div className="info-label">Admission / Pricing</div>
                  <div className="info-val">{event.price || 'Free / Open RSVP'}</div>
                </div>
              </div>

              {event.organizer && (
                <div className="info-block">
                  <div className="info-icon">🏢</div>
                  <div>
                    <div className="info-label">Organizer</div>
                    <div className="info-val">
                      {event.organizerUrl ? (
                        <a
                          href={event.organizerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link"
                        >
                          {event.organizer} ↗
                        </a>
                      ) : (
                        event.organizer
                      )}
                    </div>
                  </div>
                </div>
              )}

              {deadlineFormatted && (
                <div className="info-block highlight-deadline">
                  <div className="info-icon">🚨</div>
                  <div>
                    <div className="info-label">Registration Deadline</div>
                    <div className="info-val text-deadline">{deadlineFormatted}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Extended Description Card */}
            <div className="detail-card mt-lg">
              <h2 className="detail-section-heading">About This Event</h2>
              <div className="detail-body-text">
                {event.description ? (
                  event.description.split('\n\n').map((para, i) => (
                    <p key={i} className="detail-paragraph">
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="detail-paragraph text-muted">
                    No extended description was provided by the original host. Please
                    visit the official registration page for full speaker agendas and
                    materials.
                  </p>
                )}
              </div>
            </div>

            {/* Verification & Metadata */}
            <div className="detail-card meta-specs-card mt-lg">
              <h3 className="text-sm font-semibold mb-sm">Data Integrity & Verification</h3>
              <div className="specs-list">
                <div className="spec-item">
                  <span className="spec-key">Verified Origin:</span>
                  <span className="spec-val">
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link"
                    >
                      {event.url} ↗
                    </a>
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-key">Platform ID:</span>
                  <span className="spec-val font-mono">{event.id}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-key">Last Scraped & Synced:</span>
                  <span className="spec-val">
                    {new Date(event.scrapedAt).toLocaleString('en-AE', {
                      timeZone: 'Asia/Dubai',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Sidebar */}
          <aside className="detail-sidebar">
            <EventDetailClient
              id={event.id}
              title={event.title}
              description={event.description}
              url={event.url}
              source={event.source}
              category={event.category}
              tags={tags}
              startDate={event.startDate.toISOString()}
              endDate={event.endDate ? event.endDate.toISOString() : null}
              timezone={event.timezone}
              location={event.location}
              venue={event.venue}
              address={event.address}
              isOnline={event.isOnline}
              registrationUrl={event.registrationUrl}
              registrationDeadline={
                event.registrationDeadline
                  ? event.registrationDeadline.toISOString()
                  : null
              }
              price={event.price}
              organizer={event.organizer}
              organizerUrl={event.organizerUrl}
              llmSummary={event.llmSummary}
            />
          </aside>
        </div>

        {/* Related Events Section */}
        {relatedEvents.length > 0 && (
          <section className="related-events-section mt-2xl">
            <div className="section-header">
              <h2 className="section-title">Similar {event.category.toUpperCase()} Events</h2>
              <span className="section-count">{relatedEvents.length} more upcoming</span>
            </div>
            <div className="events-grid">
              {relatedEvents.map(re => (
                <EventCard key={re.id} event={re} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
