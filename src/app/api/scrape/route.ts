import { checkAdmin } from '@/lib/auth'
import { runScrapers } from '@/lib/ingest'
import { ADAPTERS } from '@/lib/sources'
import { fail, json, preflight } from '@/lib/http-json'

export const dynamic = 'force-dynamic'
export const maxDuration = 300
export const OPTIONS = preflight

// POST /api/scrape  {"sources": ["luma"]}  — Authorization: Bearer $ADMIN_API_KEY
// GET works too so Vercel Cron (which sends GET) can call it.
async function run(req: Request, body: { sources?: unknown }) {
  const denied = checkAdmin(req)
  if (denied) return denied
  const only = Array.isArray(body.sources) ? body.sources.map(String).filter(s => ADAPTERS.some(a => a.id === s)) : undefined
  const results = await runScrapers(only)
  const sum = (k: 'eventsFound' | 'eventsNew' | 'eventsUpdated') => results.reduce((n, r) => n + r[k], 0)
  return json(
    {
      success: results.some(r => !r.error),
      data: { results, summary: { found: sum('eventsFound'), new: sum('eventsNew'), updated: sum('eventsUpdated') } },
    },
    { cache: 'no-store' }
  )
}

export async function POST(req: Request) {
  try {
    return await run(req, await req.json().catch(() => ({})))
  } catch (err) {
    console.error('[api/scrape]', err)
    return fail(500, 'Internal server error')
  }
}

export async function GET(req: Request) {
  try {
    return await run(req, {})
  } catch (err) {
    console.error('[api/scrape]', err)
    return fail(500, 'Internal server error')
  }
}
