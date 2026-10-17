'use client'

import { useState } from 'react'
import type { Event } from '@/types'

export default function EventDetailClient({ event, llmText }: { event: Event; llmText: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      setCopied('error')
    }
  }
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '')
  const end = event.endDate ?? new Date(new Date(event.startDate).getTime() + 2 * 3_600_000).toISOString()
  const gcal =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(event.title)}&dates=${stamp(event.startDate)}/${stamp(end)}` +
    `&details=${encodeURIComponent(event.registrationUrl ?? event.url)}` +
    `&location=${encodeURIComponent([event.venue, event.address ?? event.location].filter(Boolean).join(', '))}`

  return (
    <div className="event-detail-actions-panel">
      <div className="action-buttons-group">
        <a href={event.registrationUrl ?? event.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
          Register on {event.source}
        </a>
        {event.startTimeKnown && (
          <a href={gcal} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Add to Google Calendar</a>
        )}
        <a href={event.links.ics} className="btn btn-secondary">Download .ics</a>
        <button className="btn btn-secondary" onClick={() => copy('link', window.location.href)}>
          {copied === 'link' ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <div className="detail-card llm-box mt-lg">
        <div className="llm-box-header">
          <strong>For AI agents</strong>
          <button className="btn btn-primary btn-sm" onClick={() => copy('llm', llmText)}>{copied === 'llm' ? 'Copied' : 'Copy as text'}</button>
        </div>
        <pre className="llm-code-preview">{llmText}</pre>
        <div className="api-quick-links">
          <a href={event.links.json} target="_blank" rel="noopener noreferrer" className="api-pill-link">JSON</a>
          <a href={event.links.llm} target="_blank" rel="noopener noreferrer" className="api-pill-link">Text</a>
        </div>
      </div>
      {copied === 'error' && <p className="text-sm text-muted">Could not access the clipboard.</p>}
    </div>
  )
}
