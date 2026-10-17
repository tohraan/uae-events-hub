export const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
}

export const preflight = () => new Response(null, { status: 204, headers: CORS })

export function json(body: unknown, init: { status?: number; cache?: string } = {}) {
  return Response.json(body, {
    status: init.status ?? 200,
    headers: { ...CORS, 'Cache-Control': init.cache ?? 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}

export function text(body: string, type: string, init: { status?: number; cache?: string } = {}) {
  return new Response(body, {
    status: init.status ?? 200,
    headers: { ...CORS, 'Content-Type': type, 'Cache-Control': init.cache ?? 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}

export const fail = (status: number, error: string) => json({ success: false, error }, { status, cache: 'no-store' })
