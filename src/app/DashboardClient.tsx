'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import EventCard from '@/components/EventCard'
import FilterBar, { EMPTY_FILTERS, type Filters } from '@/components/FilterBar'
import type { Event } from '@/types'
import { formatMonth } from '@/lib/format'

interface Props {
  events: Event[]
  total: number
  sources: string[]
  cities: string[]
  lastSync: string | null
}

export default function DashboardClient({ events, total, sources, cities, lastSync }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return events.filter(e => {
      if (filters.category && e.category !== filters.category) return false
      if (filters.source && e.source !== filters.source) return false
      if (filters.city && e.city !== filters.city) return false
      if (filters.tag && !e.tags.includes(filters.tag)) return false
      if (!q) return true
      return [e.title, e.description, e.organizer, e.venue, e.city, ...e.tags].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [events, filters])

  const byMonth = useMemo(() => {
    const groups = new Map<string, Event[]>()
    for (const e of filtered) {
      const k = formatMonth(e.startDate)
      groups.set(k, [...(groups.get(k) ?? []), e])
    }
    return [...groups.entries()]
  }, [filtered])

  return (
    <div className="app-wrapper page-fade-in">
      <header className="header" role="banner">
        <div className="header-inner">
          <div className="logo"><span>UAE Events Hub</span><span className="logo-badge">OPEN API</span></div>
          <nav className="header-nav" aria-label="Main">
            <Link href="/" className="nav-link active">Events</Link>
            <Link href="/docs" className="nav-link">API &amp; agents</Link>
          </nav>
          <div className="header-actions">
            <a href="/api/feed.ics" className="btn btn-secondary btn-sm">Subscribe (.ics)</a>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <h1 className="hero-title" id="hero-title">Tech, AI &amp; startup events in the <span>UAE</span></h1>
          <p className="hero-subtitle">
            Hackathons, meetups and conferences from Eventbrite, Luma, Meetup and Hub71, in one place. Free to use from code, calendars and AI agents.
          </p>
          <div className="hero-stats">
            <div className="hero-stat"><div className="hero-stat-value">{total}</div><div className="hero-stat-label">Upcoming events</div></div>
            <div className="hero-stat"><div className="hero-stat-value">{sources.length}</div><div className="hero-stat-label">Sources</div></div>
            <div className="hero-stat">
              <div className="hero-stat-value">{lastSync ? new Date(lastSync).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Dubai' }) : 'never'}</div>
              <div className="hero-stat-label">Last sync</div>
            </div>
          </div>
          <div className="hero-actions">
            <Link href="/docs" className="btn btn-primary">Use the API / MCP</Link>
            <a href="/api/events.txt" className="btn btn-ghost">Events as text</a>
          </div>
        </section>

        <FilterBar filters={filters} onChange={setFilters} sources={sources} cities={cities} shown={filtered.length} total={events.length} />

        {events.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">No events indexed yet</h2>
            <p className="empty-state-desc">Run <code>npm run scrape</code> to pull events from the sources.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">Nothing matches</h2>
            <button className="btn btn-primary" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>
          </div>
        ) : (
          byMonth.map(([month, list]) => (
            <section key={month} className="mb-lg">
              <div className="section-header">
                <h2 className="section-title">{month}</h2>
                <span className="section-count">{list.length}</span>
              </div>
              <div className="events-grid">
                {list.map(e => <EventCard key={e.id} event={e} onTagClick={tag => setFilters(f => ({ ...f, tag }))} />)}
              </div>
            </section>
          ))
        )}
        {total > events.length && (
          <p className="text-sm text-muted">Showing the next {events.length} of {total} events. The API returns all of them.</p>
        )}
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-inner">
          <span className="footer-text">UAE Events Hub · open source (MIT)</span>
          <div className="footer-links">
            <Link href="/docs" className="footer-link">Docs</Link>
            <a href="/api/events" className="footer-link">JSON</a>
            <a href="/openapi.json" className="footer-link">OpenAPI</a>
            <a href="/llms.txt" className="footer-link">llms.txt</a>
            <a href="/api/health" className="footer-link">Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
