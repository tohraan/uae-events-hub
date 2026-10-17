import type { Metadata } from 'next'
import Link from 'next/link'
import { baseUrl } from '@/lib/events'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'API & agents | UAE Events Hub',
  description: 'REST API, MCP server, OpenAPI spec, calendar feed and llms.txt for UAE tech events.',
}

function Code({ children }: { children: string }) {
  return <pre className="code-block" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{children}</pre>
}

export default function DocsPage() {
  const b = baseUrl()
  return (
    <div className="docs-page page-fade-in" style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      <Link href="/" className="breadcrumb-link">← All events</Link>
      <h1 className="docs-title">API &amp; agents</h1>
      <p className="docs-subtitle">Read-only, no key, CORS open. Times are ISO 8601 UTC; show them in Asia/Dubai (UTC+4). A null field means the source did not publish it.</p>

      <h2 className="detail-section-heading">MCP (for AI agents)</h2>
      <p>Remote MCP server over Streamable HTTP. Tools: <code>search_events</code>, <code>get_event</code>, <code>list_hackathons</code>, <code>data_status</code>.</p>
      <Code>{`claude mcp add --transport http uae-events ${b}/api/mcp`}</Code>
      <p>Other clients: add a remote server with URL <code>{b}/api/mcp</code>.</p>

      <h2 className="detail-section-heading">REST</h2>
      <Code>{`# upcoming hackathons in Dubai
curl "${b}/api/events?category=hackathon&city=Dubai"

# AI events in the next 14 days
curl "${b}/api/events?tag=AI&to=$(date -u -v+14d +%FT%TZ)"

# only what changed since your last sync
curl "${b}/api/events?updatedSince=2026-10-01T00:00:00Z&sort=updatedAt"`}</Code>
      <p>Filters: <code>q</code>, <code>category</code>, <code>tag</code>, <code>city</code>, <code>source</code>, <code>isOnline</code>, <code>from</code>, <code>to</code>, <code>updatedSince</code>, <code>sort</code>, <code>order</code>, <code>page</code>, <code>limit</code> (max 100). Full spec: <a className="text-link" href="/openapi.json">/openapi.json</a>.</p>

      <h2 className="detail-section-heading">Text for LLM context</h2>
      <Code>{`curl "${b}/api/events.txt?tag=AI&limit=20"
curl "${b}/api/events/<id>/llm"`}</Code>
      <p>Compact key: value text, same filters as the JSON API. Also see <a className="text-link" href="/llms.txt">/llms.txt</a>.</p>

      <h2 className="detail-section-heading">Calendar</h2>
      <Code>{`${b}/api/feed.ics
${b}/api/feed.ics?category=hackathon`}</Code>
      <p>Subscribe by URL in Google Calendar, Apple Calendar or Outlook. Single event: <code>/api/events/&lt;id&gt;/ics</code>.</p>

      <h2 className="detail-section-heading">Freshness</h2>
      <p><a className="text-link" href="/api/health">/api/health</a> reports each source&apos;s last successful sync and any error, so you can tell stale data from no data.</p>
    </div>
  )
}
