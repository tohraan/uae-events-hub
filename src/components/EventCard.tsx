'use client'

import { Event } from '@/types'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventCardProps {
  event: Event
  onTagClick?: (tag: string) => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Dubai',
  })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-AE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
  })
}

function getDaysUntil(dateStr: string): number {
  const now = new Date()
  const event = new Date(dateStr)
  return Math.ceil((event.getTime() - now.getTime()) / 86400000)
}

function isDeadlineSoon(deadlineStr: string | null): boolean {
  if (!deadlineStr) return false
  const days = getDaysUntil(deadlineStr)
  return days >= 0 && days <= 5
}

export default function EventCard({ event, onTagClick }: EventCardProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const daysUntil = getDaysUntil(event.startDate)
  const category = event.category ?? 'other'

  function handleCopyLink(e: React.MouseEvent) {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/events/${event.id}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function handleOpenExternal(e: React.MouseEvent) {
    e.stopPropagation()
    window.open(event.url, '_blank', 'noopener,noreferrer')
  }

  function handleCardClick() {
    router.push(`/events/${event.id}`)
  }

  return (
    <article
      className={`event-card ${category} ${event.isFeatured ? 'featured' : ''}`}
      onClick={handleCardClick}
      role="article"
      aria-label={event.title}
      itemScope
      itemType="https://schema.org/Event"
    >
      {/* Hidden schema.org meta */}
      <meta itemProp="name" content={event.title} />
      <meta itemProp="startDate" content={event.startDate} />
      {event.endDate && <meta itemProp="endDate" content={event.endDate} />}
      {event.url && <meta itemProp="url" content={event.url} />}

      {/* Header: badges + actions */}
      <div className="event-card-header">
        <div className="event-card-badges">
          {event.isFeatured && (
            <span className="featured-indicator">⭐ Featured</span>
          )}
          <span className={`badge badge-${category}`}>
            {getCategoryEmoji(category)} {formatCategory(category)}
          </span>
          {event.isOnline && (
            <span className="badge badge-online">🌐 Online</span>
          )}
          {event.price && event.price.toLowerCase() === 'free' && (
            <span className="badge badge-free">Free</span>
          )}
        </div>
        <div className="event-card-actions">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleCopyLink}
            title="Copy link"
            aria-label="Copy event link"
          >
            {copied ? '✓' : '🔗'}
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleOpenExternal}
            title="Open official event site"
            aria-label="Open official event site"
          >
            ↗
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="event-title" itemProp="name">
        {event.title}
      </h3>

      {/* Description */}
      {(event.shortDescription || event.description) && (
        <p className="event-description">
          {event.shortDescription ?? event.description}
        </p>
      )}

      {/* Meta */}
      <div className="event-meta">
        <div className="event-meta-row">
          <svg className="event-meta-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="14" height="12" rx="2"/>
            <path d="M1 7h14M5 1v4M11 1v4"/>
          </svg>
          <span itemProp="startDate">
            <strong>{formatDate(event.startDate)}</strong>
            {' · '}
            {formatTime(event.startDate)}
          </span>
          {daysUntil > 0 && daysUntil <= 30 && (
            <span className="text-sm text-muted">({daysUntil}d away)</span>
          )}
          {daysUntil === 0 && (
            <span className="badge badge-hackathon" style={{ fontSize: '10px', padding: '1px 6px' }}>Today!</span>
          )}
        </div>

        {(event.venue || event.location) && (
          <div className="event-meta-row" itemProp="location" itemScope itemType="https://schema.org/Place">
            <svg className="event-meta-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1C5.24 1 3 3.24 3 6c0 4 5 9 5 9s5-5 5-9c0-2.76-2.24-5-5-5z"/>
              <circle cx="8" cy="6" r="1.5"/>
            </svg>
            <span itemProp="name">
              {event.venue ?? event.location}
              {event.venue && event.location && event.location !== event.venue
                ? ` · ${event.location}`
                : ''}
            </span>
          </div>
        )}

        {event.organizer && (
          <div className="event-meta-row">
            <svg className="event-meta-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5" r="3"/>
              <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6"/>
            </svg>
            <span>{event.organizer}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="event-tags">
          {event.tags.slice(0, 5).map(tag => (
            <span
              key={tag}
              className="tag-chip"
              onClick={e => { e.stopPropagation(); onTagClick?.(tag) }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: price + deadline warning */}
      <div className="event-card-footer">
        {event.price && (
          <span className="event-price" itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <span itemProp="price">{event.price}</span>
          </span>
        )}

        {isDeadlineSoon(event.registrationDeadline) && (
          <span className="event-deadline-warning">
            ⚡ Deadline: {formatDate(event.registrationDeadline!)}
          </span>
        )}

        {!isDeadlineSoon(event.registrationDeadline) && event.registrationDeadline && (
          <span className="text-sm text-muted">
            Deadline: {formatDate(event.registrationDeadline)}
          </span>
        )}

        {!event.price && !event.registrationDeadline && event.attendeeCount && (
          <span className="text-sm text-muted">
            👥 {event.attendeeCount.toLocaleString()} attending
          </span>
        )}
      </div>
    </article>
  )
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    hackathon: '⚡',
    meetup: '🤝',
    workshop: '🛠',
    conference: '🎤',
    webinar: '💻',
    networking: '🌐',
    'demo-day': '🚀',
    bootcamp: '🏕',
    summit: '🏔',
    other: '📅',
  }
  return map[category] ?? '📅'
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    'demo-day': 'Demo Day',
  }
  return map[category] ?? category.charAt(0).toUpperCase() + category.slice(1)
}
