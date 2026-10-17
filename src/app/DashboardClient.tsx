'use client'

import { useState, useMemo, useCallback } from 'react'
import { Event } from '@/types'
import EventCard from '@/components/EventCard'
import FilterBar from '@/components/FilterBar'
import Link from 'next/link'

interface Props {
  initialEvents: Event[]
  totalCount: number
  sourceStats: { source: string; count: number }[]
  categoryStats: { category: string | null; count: number }[]
}

export default function DashboardClient({
  initialEvents,
  totalCount,
  sourceStats,
  categoryStats,
}: Props) {
  const [events] = useState<Event[]>(initialEvents)
  const [filters, setFilters] = useState({ search: '', category: '', source: '', tag: '', isOnline: '' })
  const [scraping, setScraping] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [activeNav, setActiveNav] = useState<'events' | 'api' | 'about'>('events')
  const [copiedIcal, setCopiedIcal] = useState(false)

  // Client-side filtering
  const filtered = useMemo(() => {
    return events.filter(event => {
      if (filters.category && event.category !== filters.category) return false
      if (filters.source && event.source !== filters.source) return false
      if (filters.isOnline !== '') {
        const wantOnline = filters.isOnline === 'true'
        if (event.isOnline !== wantOnline) return false
      }
      if (filters.tag && !event.tags.some(t => t.toLowerCase().includes(filters.tag.toLowerCase()))) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const searchable = [
          event.title, event.description, event.shortDescription,
          event.organizer, event.venue, event.location,
          ...(event.tags ?? []),
        ].filter(Boolean).join(' ').toLowerCase()
        if (!searchable.includes(q)) return false
      }
      return true
    })
  }, [events, filters])

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Event[]> = {}
    for (const event of filtered) {
      const d = new Date(event.startDate)
      const key = d.toLocaleDateString('en-AE', { month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' })
      if (!groups[key]) groups[key] = []
      groups[key].push(event)
    }
    return groups
  }, [filtered])

  const handleFiltersChange = useCallback(
    (f: { search: string; category: string; source: string; tag: string; isOnline: string }) => {
      setFilters(f)
    },
    []
  )

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleScrape() {
    setScraping(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({ mode: 'scrape' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      const total = data.data?.summary?.totalFound ?? 0
      const newEv = data.data?.summary?.totalNew ?? 0
      showToast(`✓ Scraped live! ${total} events found (${newEv} new).`)
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      showToast('Failed to refresh events.')
    } finally {
      setScraping(false)
    }
  }

  async function copyIcalUrl() {
    const url = `${window.location.origin}/api/feed.ics`
    await navigator.clipboard.writeText(url)
    setCopiedIcal(true)
    setTimeout(() => setCopiedIcal(false), 2000)
    showToast('📅 iCal URL copied to clipboard!')
  }

  const featuredEvents = filtered.filter(e => e.isFeatured)
  const hasFilters = filters.search || filters.category || filters.source || filters.tag || filters.isOnline

  return (
    <div className="app-wrapper page-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="header" role="banner">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">🇦🇪</div>
            <span>UAE Tech Events</span>
            <span className="logo-badge">OPEN API</span>
          </div>

          <nav className="header-nav" role="navigation" aria-label="Main navigation">
            <button
              className={`nav-link ${activeNav === 'events' ? 'active' : ''}`}
              onClick={() => setActiveNav('events')}
            >
              Events
            </button>
            <button
              className={`nav-link ${activeNav === 'api' ? 'active' : ''}`}
              onClick={() => setActiveNav('api')}
            >
              API & Calendar
            </button>
            <button
              className={`nav-link ${activeNav === 'about' ? 'active' : ''}`}
              onClick={() => setActiveNav('about')}
            >
              About
            </button>
          </nav>

          <div className="header-actions">
            <a
              href="/api/feed.ics"
              className="btn btn-secondary btn-sm"
              title="Subscribe to iCal calendar feed"
            >
              📅 Subscribe
            </a>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleScrape}
              disabled={scraping}
              id="refresh-events-btn"
            >
              {scraping ? '⟳ Refreshing...' : '⟳ Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content" role="main">
        {/* ── Events View ─────────────────────────────────────── */}
        {activeNav === 'events' && (
          <>
            {/* Hero */}
            <section className="hero" aria-labelledby="hero-title">
              <div className="hero-eyebrow">
                🇦🇪 United Arab Emirates · Startups · Tech · AI · Hackathons
              </div>
              <h1 className="hero-title" id="hero-title">
                UAE <span>Startups, Tech & AI</span> Hub
              </h1>
              <p className="hero-subtitle">
                Live aggregator for founders, AI builders, engineers, and creators —
                strictly focused on tech startups, AI & ML, developer tech, and hackathons across the UAE.
              </p>

              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-value">{totalCount}</div>
                  <div className="hero-stat-label">Upcoming Events</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">{sourceStats.length}</div>
                  <div className="hero-stat-label">Data Sources</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">{categoryStats.length}</div>
                  <div className="hero-stat-label">Categories</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">Free</div>
                  <div className="hero-stat-label">Open API</div>
                </div>
              </div>

              <div className="hero-actions">
                <a href="/api/feed.ics" className="btn btn-secondary">
                  📅 Subscribe to Calendar
                </a>
                <button className="btn btn-primary" onClick={() => setActiveNav('api')}>
                  🔌 Explore API
                </button>
                <a href="/api/events.txt" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  🤖 LLM Data
                </a>
              </div>
            </section>

            {/* Filters */}
            <FilterBar
              onFiltersChange={handleFiltersChange}
              totalCount={events.length}
              filteredCount={filtered.length}
            />

            {/* Events */}
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h2 className="empty-state-title">No events found</h2>
                <p className="empty-state-desc">
                  Try adjusting your filters or search terms. New events are added regularly.
                </p>
                <button className="btn btn-primary" onClick={() => handleFiltersChange({ search: '', category: '', source: '', tag: '', isOnline: '' })}>
                  Clear filters
                </button>
              </div>
            ) : (
              Object.entries(groupedByMonth).map(([month, monthEvents]) => (
                <section key={month} className="mb-lg" aria-labelledby={`month-${month}`}>
                  <div className="section-header">
                    <h2 className="section-title" id={`month-${month}`}>{month}</h2>
                    <span className="section-count">{monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="events-grid">
                    {monthEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onTagClick={t => handleFiltersChange({ ...filters, tag: t })}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}

            {/* API Banner */}
            <div className="api-banner" role="complementary" aria-label="API promotion">
              <div>
                <div className="api-banner-title">Open API + Calendar Feed</div>
                <div className="api-banner-desc">
                  Free, open-source REST API with JSON, iCal, and LLM-optimized text endpoints.
                  Build live calendars, agent watchers, and integrations.
                </div>
              <div className="api-banner-actions">
                <button className="btn btn-secondary" onClick={copyIcalUrl}>
                  {copiedIcal ? '✓ Copied!' : '📅 Copy iCal URL'}
                </button>
                <button className="btn btn-primary" onClick={() => setActiveNav('api')}>
                  View API Docs →
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── API View ─────────────────────────────────────────── */}
        {activeNav === 'api' && <ApiDocsView onCopyIcal={copyIcalUrl} copiedIcal={copiedIcal} />}

        {/* ── About View ───────────────────────────────────────── */}
        {activeNav === 'about' && <AboutView sourceStats={sourceStats} categoryStats={categoryStats} />}
      </main>

      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <div className="footer-inner">
          <span className="footer-text">
            UAE Tech Events Hub · Open source · Built for the UAE tech community
          </span>
          <div className="footer-links">
            <a href="/api/events" target="_blank" className="footer-link">JSON API</a>
            <a href="/api/feed.ics" className="footer-link">iCal Feed</a>
            <a href="/api/events.txt" target="_blank" className="footer-link">LLM Data</a>
            <a href="/api/health" target="_blank" className="footer-link">Health</a>
          </div>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div className="toast-container" role="alert" aria-live="polite">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  )
}

// ── API Docs View ────────────────────────────────────────────────────────────

function ApiDocsView({ onCopyIcal, copiedIcal }: { onCopyIcal: () => void; copiedIcal: boolean }) {
  const [copied, setCopied] = useState<string | null>(null)

  function copyCode(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'

  return (
    <div className="docs-page page-fade-in">
      <h1 className="docs-title">API Reference</h1>
      <p className="docs-subtitle">
        Free, open REST API for UAE tech events. All endpoints return JSON by default.
        No authentication required. CORS enabled for all origins.
      </p>

      {/* Calendar Subscribe */}
      <div className="endpoint-group">
        <div className="endpoint-group-title">📅 Calendar Subscription</div>
        <div className="subscribe-cards">
          {[
            { icon: '📅', name: 'Google Calendar', desc: 'Add by URL → Other calendars', url: `${baseUrl}/api/feed.ics` },
            { icon: '🍎', name: 'Apple Calendar', desc: 'File → New Calendar Subscription', url: `${baseUrl}/api/feed.ics` },
            { icon: '📨', name: 'Outlook', desc: 'Add Calendar → From internet', url: `${baseUrl}/api/feed.ics` },
            { icon: '🤖', name: 'AI Agents', desc: 'Watch this URL for live updates', url: `${baseUrl}/api/events` },
          ].map(card => (
            <div key={card.name} className="subscribe-card">
              <div className="subscribe-card-icon">{card.icon}</div>
              <div className="subscribe-card-content">
                <div className="subscribe-card-title">{card.name}</div>
                <div className="subscribe-card-desc">{card.desc}</div>
                <button className="btn btn-secondary btn-sm" onClick={onCopyIcal}>
                  {copiedIcal ? '✓ Copied' : 'Copy URL'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REST Endpoints */}
      <div className="endpoint-group">
        <div className="endpoint-group-title">🔌 REST API Endpoints</div>

        {[
          {
            method: 'GET',
            path: '/api/events',
            desc: 'List upcoming events',
            params: [
              { name: 'search', type: 'string', desc: 'Full-text search' },
              { name: 'category', type: 'string', desc: 'hackathon | meetup | workshop | conference | webinar | networking | demo-day' },
              { name: 'tag', type: 'string', desc: 'AI | SaaS | Startup | Blockchain | ...' },
              { name: 'source', type: 'string', desc: 'eventbrite | meetup | luma | hub71 | ...' },
              { name: 'isOnline', type: 'boolean', desc: 'true | false' },
              { name: 'page', type: 'number', desc: 'Page number (default: 1)' },
              { name: 'limit', type: 'number', desc: 'Results per page (max 100, default: 20)' },
              { name: 'sort', type: 'string', desc: 'startDate | createdAt | title' },
              { name: 'order', type: 'string', desc: 'asc | desc' },
              { name: 'upcoming', type: 'boolean', desc: 'Only show upcoming events (default: true)' },
            ],
            example: `${baseUrl}/api/events?category=hackathon&tag=AI&limit=10`,
            responsePreview: `{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "title": "UAE Startup Founders Hackathon",
      "category": "hackathon",
      "tags": ["AI", "SaaS", "Startup"],
      "startDate": "2025-11-21T09:00:00+04:00",
      "location": "Abu Dhabi, UAE",
      "price": "Free",
      "registrationDeadline": "2025-11-10T23:59:00+04:00"
    }
  ],
  "meta": { "total": 12, "page": 1, "pages": 2 }
}`,
          },
          {
            method: 'GET',
            path: '/api/events/:id',
            desc: 'Get full event details',
            params: [{ name: 'id', type: 'string', desc: 'Event ID from /api/events response' }],
            example: `${baseUrl}/api/events/clxxx`,
            responsePreview: `{
  "success": true,
  "data": { /* full event object */ },
  "meta": {
    "llmUrl": "/api/events/clxxx/llm",
    "icalUrl": "/api/feed.ics"
  }
}`,
          },
          {
            method: 'GET',
            path: '/api/events/:id/llm',
            desc: 'LLM-optimized plain text for an event',
            params: [],
            example: `${baseUrl}/api/events/clxxx/llm`,
            responsePreview: `EVENT: UAE Startup Founders Hackathon
ID: clxxx
URL: https://hub71.com/events/hackathon-2025
CATEGORY: hackathon
TAGS: AI, SaaS, Startup, Developer
DATE: Thursday, November 21, 2025 at 09:00 AM
REGISTRATION DEADLINE: Monday, November 10, 2025
LOCATION: Hub71, Abu Dhabi
PRICE: Free
DESCRIPTION: 48-hour hackathon for startups...`,
          },
          {
            method: 'GET',
            path: '/api/feed.ics',
            desc: 'iCal calendar feed (RFC 5545)',
            params: [
              { name: 'category', type: 'string', desc: 'Filter to one category' },
              { name: 'tag', type: 'string', desc: 'Filter to one tag' },
            ],
            example: `${baseUrl}/api/feed.ics`,
            responsePreview: `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UAE Tech Events Hub//EN
X-WR-CALNAME:UAE Tech Events
...
BEGIN:VEVENT
UID:clxxx@uae-tech-events
SUMMARY:UAE Startup Founders Hackathon
DTSTART;TZID=Asia/Dubai:20251121T090000
...
END:VEVENT
END:VCALENDAR`,
          },
          {
            method: 'GET',
            path: '/api/events.txt',
            desc: 'Bulk LLM-optimized text dump of all events',
            params: [
              { name: 'category', type: 'string', desc: 'Filter to one category' },
              { name: 'tag', type: 'string', desc: 'Filter to one tag' },
              { name: 'limit', type: 'number', desc: 'Max events (default: 100, max: 500)' },
            ],
            example: `${baseUrl}/api/events.txt`,
            responsePreview: `UAE TECH EVENTS — LLM DATA DUMP
Generated: 2025-11-01T12:00:00Z
Total Events: 24
Region: United Arab Emirates
============================================================

--- EVENT 1 of 24 ---
EVENT: GITEX Global 2025
...`,
          },
          {
            method: 'GET',
            path: '/api/health',
            desc: 'API health, stats, and scraper status',
            params: [],
            example: `${baseUrl}/api/health`,
            responsePreview: `{
  "success": true,
  "data": {
    "status": "operational",
    "stats": {
      "totalEvents": 24,
      "upcomingEvents": 18
    },
    "scraper": { "lastRun": "2025-11-01T06:00:00Z" }
  }
}`,
          },
        ].map(endpoint => (
          <div key={endpoint.path} className="endpoint-card">
            <div className="endpoint-header">
              <span className="method-badge">{endpoint.method}</span>
              <code className="endpoint-path">{endpoint.path}</code>
              <span className="endpoint-desc">{endpoint.desc}</span>
            </div>
            <div className="endpoint-body">
              {endpoint.params.length > 0 && (
                <table className="params-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.params.map(p => (
                      <tr key={p.name}>
                        <td><code className="param-name">{p.name}</code></td>
                        <td className="text-sm text-muted text-mono">{p.type}</td>
                        <td className="text-sm">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div>
                <div className="filter-label mb-md" style={{ marginBottom: '6px' }}>Example</div>
                <div className="code-block" style={{ position: 'relative' }}>
                  <span className="comment"># {endpoint.desc}</span>{'\n'}
                  <span className="key">GET</span> {endpoint.example}
                  <button
                    className="copy-btn"
                    onClick={() => copyCode(endpoint.path + '-url', endpoint.example)}
                  >
                    {copied === endpoint.path + '-url' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <div className="filter-label" style={{ marginBottom: '6px' }}>Response</div>
                <div className="code-block" style={{ position: 'relative' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{endpoint.responsePreview}</pre>
                  <button
                    className="copy-btn"
                    onClick={() => copyCode(endpoint.path, endpoint.responsePreview)}
                  >
                    {copied === endpoint.path ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rate Limits */}
      <div className="endpoint-group">
        <div className="endpoint-group-title">ℹ️ Rate Limits & Usage</div>
        <div className="endpoint-card">
          <div className="endpoint-body">
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              The API is <strong>free and open</strong> with no authentication required.
              All endpoints have CORS enabled for cross-origin requests.{' '}
              <br /><br />
              <strong>Caching:</strong> Responses are cached for 5–60 minutes.
              The iCal feed updates every hour. Use <code className="param-name">/api/health</code> to check the last scrape time.{' '}
              <br /><br />
              <strong>For AI Agents:</strong> Use <code className="param-name">/api/events.txt</code> for a single-shot context dump,
              or watch <code className="param-name">/api/events</code> periodically with the <code className="param-name">upcoming=true</code> filter.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── About View ───────────────────────────────────────────────────────────────

function AboutView({
  sourceStats,
  categoryStats,
}: {
  sourceStats: { source: string; count: number }[]
  categoryStats: { category: string | null; count: number }[]
}) {
  return (
    <div className="docs-page page-fade-in">
      <h1 className="docs-title">About UAE Tech Events Hub</h1>
      <p className="docs-subtitle">
        An open-source event aggregator for the UAE tech community — built to keep
        founders, developers, and tech enthusiasts in the loop.
      </p>

      <div className="endpoint-group">
        <div className="endpoint-group-title">📡 Data Sources</div>
        <div className="events-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {sourceStats.map(s => (
            <div key={s.source} className="subscribe-card">
              <div>
                <div className="subscribe-card-title" style={{ textTransform: 'uppercase', fontSize: '13px' }}>{s.source}</div>
                <div className="subscribe-card-desc">{s.count} events indexed</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="endpoint-group">
        <div className="endpoint-group-title">📊 Events by Category</div>
        <div className="events-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {categoryStats.filter(c => c.category).map(c => (
            <div key={c.category} className="subscribe-card">
              <div>
                <div className="subscribe-card-title" style={{ textTransform: 'capitalize' }}>{c.category?.replace('-', ' ')}</div>
                <div className="subscribe-card-desc">{c.count} events</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="endpoint-group">
        <div className="endpoint-group-title">🤖 Built for Agents & Calendars</div>
        <div className="endpoint-card">
          <div className="endpoint-body">
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              This platform is designed to be <strong>bot-friendly</strong> and <strong>AI-native</strong>:
            </p>
            <ul style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.8, paddingLeft: '20px', marginTop: '8px' }}>
              <li><strong>Open robots.txt</strong> — search engines and bots are welcome to crawl</li>
              <li><strong>JSON-LD structured data</strong> — every event card uses schema.org/Event markup</li>
              <li><strong>iCal feed</strong> — subscribe in any calendar app for live auto-updating</li>
              <li><strong>LLM text endpoints</strong> — structured plain text optimised for AI context injection</li>
              <li><strong>REST API</strong> — build agents that poll for new events, send Slack alerts, trigger workflows</li>
              <li><strong>Sitemap ready</strong> — full event index for discoverability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
