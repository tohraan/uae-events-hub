'use client'

import { useState } from 'react'
import Link from 'next/link'

interface EventDetailClientProps {
  id: string
  title: string
  description?: string | null
  url: string
  source: string
  category: string
  tags: string[]
  startDate: string
  endDate?: string | null
  timezone: string
  location?: string | null
  venue?: string | null
  address?: string | null
  isOnline: boolean
  registrationUrl?: string | null
  registrationDeadline?: string | null
  price?: string | null
  organizer?: string | null
  organizerUrl?: string | null
  llmSummary?: string | null
}

export default function EventDetailClient({
  id,
  title,
  description,
  url,
  source,
  category,
  tags,
  startDate,
  endDate,
  timezone,
  location,
  venue,
  address,
  isOnline,
  registrationUrl,
  registrationDeadline,
  price,
  organizer,
  organizerUrl,
  llmSummary,
}: EventDetailClientProps) {
  const [copiedLlm, setCopiedLlm] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // Format dates for Google Calendar
  const startIso = new Date(startDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
  const endIso = endDate
    ? new Date(endDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
    : new Date(new Date(startDate).getTime() + 2 * 3600000).toISOString().replace(/-|:|\.\d\d\d/g, '')

  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(
    (description || title) + `\n\nOfficial Link: ${registrationUrl || url}`
  )}&location=${encodeURIComponent(venue ? `${venue}, ${location || 'Dubai, UAE'}` : location || 'UAE')}&ctz=Asia/Dubai`

  // Format plain text context for LLMs
  const llmContext = `EVENT: ${title}
ID: ${id}
SOURCE: ${source}
CATEGORY: ${category}
TAGS: ${tags.join(', ')}
DATE: ${new Date(startDate).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}
${endDate ? `END: ${new Date(endDate).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}\n` : ''}LOCATION: ${venue ? `${venue}, ` : ''}${location || 'Dubai, UAE'}
${address ? `ADDRESS: ${address}\n` : ''}PRICE: ${price || 'See registration page'}
${organizer ? `ORGANIZER: ${organizer}\n` : ''}REGISTRATION: ${registrationUrl || url}
${registrationDeadline ? `REGISTRATION DEADLINE: ${new Date(registrationDeadline).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}\n` : ''}
SUMMARY:
${llmSummary || description || title}

DESCRIPTION:
${description || 'No extended description provided.'}`

  function handleCopyLlm() {
    navigator.clipboard.writeText(llmContext).then(() => {
      setCopiedLlm(true)
      showToast('✓ LLM Context copied to clipboard!')
      setTimeout(() => setCopiedLlm(false), 2000)
    })
  }

  function handleCopyShareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedLink(true)
      showToast('✓ Event link copied to clipboard!')
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  function handleDownloadIcs() {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UAE Tech Events Hub//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${id}@uae-tech-events
DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, '')}
DTSTART:${startIso}
DTEND:${endIso}
SUMMARY:${title.replace(/,/g, '\\,')}
DESCRIPTION:${(description || title).replace(/\n/g, '\\n').replace(/,/g, '\\,')}
URL:${registrationUrl || url}
LOCATION:${(venue ? `${venue}, ${location || ''}` : location || 'Dubai, UAE').replace(/,/g, '\\,')}
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('✓ .ics Calendar file downloaded!')
  }

  return (
    <div className="event-detail-actions-panel">
      {toast && <div className="toast">{toast}</div>}

      <div className="action-buttons-group">
        <a
          href={registrationUrl || url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-lg"
          id="official-register-btn"
        >
          🚀 Register / Official Event Link
        </a>

        <a
          href={gCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          title="Add this event to Google Calendar"
        >
          📅 Add to Google Calendar
        </a>

        <button
          onClick={handleDownloadIcs}
          className="btn btn-secondary"
          title="Download iCal (.ics) file for Apple Calendar or Outlook"
        >
          📥 Download .ics
        </button>

        <button
          onClick={handleCopyShareLink}
          className="btn btn-secondary"
          title="Copy direct share link"
        >
          {copiedLink ? '✓ Copied' : '🔗 Share Link'}
        </button>
      </div>

      {/* Developer & LLM Context Box */}
      <div className="detail-card llm-box mt-lg">
        <div className="llm-box-header">
          <div className="llm-box-title">
            <span>🤖</span>
            <div>
              <strong>LLM Context & API Endpoints</strong>
              <div className="text-xs text-muted">
                Optimized token-efficient plain text for AI models & agent watchers
              </div>
            </div>
          </div>
          <button onClick={handleCopyLlm} className="btn btn-primary btn-sm">
            {copiedLlm ? '✓ Copied for LLM' : '📋 Copy for LLM'}
          </button>
        </div>

        <pre className="llm-code-preview">{llmContext}</pre>

        <div className="api-quick-links">
          <span className="text-xs text-muted">Direct Endpoints:</span>
          <a
            href={`/api/events/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="api-pill-link"
          >
            GET /api/events/{id.substring(0, 8)}... (JSON)
          </a>
          <a
            href={`/api/events/${id}/llm`}
            target="_blank"
            rel="noopener noreferrer"
            className="api-pill-link"
          >
            GET /api/events/{id.substring(0, 8)}.../llm (Text)
          </a>
        </div>
      </div>
    </div>
  )
}
