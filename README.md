# UAE Events Hub

An open, agent-friendly index of **tech, AI, startup and hackathon events in the UAE**, collected from Eventbrite, Luma, Meetup and Hub71. Use it as a website, a REST API, a calendar feed, plain text for LLM context, or an MCP server.

Nothing is invented: if a source does not publish a price, an end time or an organizer, the field is `null` (or omitted in text output).

## Quickstart

```bash
git clone <this repo> && cd uae-events-hub
cp .env.example .env
npm install
npm run db:push      # create the SQLite database
npm run scrape       # pull live events (about 30 s)
npm run dev          # http://localhost:3000
```

Docker: `docker compose up --build`, then `docker compose exec app npm run scrape`.

## Use it

| Surface | URL | For |
|---|---|---|
| MCP server | `/api/mcp` | AI agents. `claude mcp add --transport http uae-events http://localhost:3000/api/mcp` |
| REST | `/api/events` | Apps. Filters: `q category tag city source isOnline from to updatedSince sort order page limit` |
| OpenAPI 3.1 | `/openapi.json` | Generating clients, agent tool definitions |
| Text for LLMs | `/api/events.txt`, `/api/events/:id/llm` | Pasting into context. Same filters as REST |
| `llms.txt` | `/llms.txt` | Agent discovery |
| Calendar | `/api/feed.ics`, `/api/events/:id/ics` | Google / Apple / Outlook subscribe by URL |
| Freshness | `/api/health` | Per-source last sync and errors |

MCP tools: `search_events`, `get_event`, `list_hackathons`, `data_status`.

```bash
curl "http://localhost:3000/api/events?category=hackathon&city=Dubai"
curl "http://localhost:3000/api/events?updatedSince=2026-10-01T00:00:00Z&sort=updatedAt"   # incremental sync
```

Timestamps are ISO 8601 UTC; display in Asia/Dubai (UTC+4). `startTimeKnown: false` means the source gave only a date (Eventbrite listings, Hub71), so `startDate` is Dubai midnight and the event is treated as all-day.

## Data sources, honestly

| Source | Gives | Limits |
|---|---|---|
| Luma | Dubai city page: exact times, venue, coordinates, price (free flag), host | Dubai only; first page of results |
| Eventbrite | Listing pages for tech / hackathon / startup / AI | Date only (no time), no price |
| Meetup | A fixed list of groups (`src/lib/sources/meetup.ts`) | Only groups you list; many have no upcoming events |
| Hub71 | Abu Dhabi events page | Date only; the page is mostly past sessions, which are dropped |

These are HTML scrapers over public pages, not official APIs. Layouts change; when one does, the adapter throws and `/api/health` shows the error instead of silently returning nothing. Respect each site's terms and be gentle: the default user agent identifies this project, and requests are spaced out.

## Keeping data fresh

`npm run scrape` once, or schedule `POST /api/scrape` (header `Authorization: Bearer $ADMIN_API_KEY`) every few hours. `.github/workflows/scrape.yml` does this against a deployed URL. Events a source stops listing are hidden after 36 h.

## Deploying

Default storage is SQLite, which needs a persistent disk (Docker volume, a VPS, Fly/Railway volume). It does **not** work on serverless hosts such as Vercel. For those, switch `provider` in `prisma/schema.prisma` to `postgresql`, point `DATABASE_URL` at Postgres, and run `prisma db push`. Set `ADMIN_API_KEY` and `NEXT_PUBLIC_BASE_URL` in production; without a key `/api/scrape` refuses to run.

## Development

```bash
npm test            # parsers, classifier, calendar output, search
npm run typecheck
npm run build
```

Adding a source takes one file: see [CONTRIBUTING.md](CONTRIBUTING.md).

MIT licensed.
