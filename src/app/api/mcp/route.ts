import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from '@/lib/mcp/server'
import { baseUrl } from '@/lib/events'
import { CORS } from '@/lib/http-json'

export const dynamic = 'force-dynamic'

// Remote MCP endpoint (Streamable HTTP, stateless, JSON responses).
// Claude Code: claude mcp add --transport http uae-events https://<host>/api/mcp
async function handle(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  const server = createMcpServer(baseUrl(req))
  await server.connect(transport)
  const res = await transport.handleRequest(req)
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v)
  return new Response(res.body, { status: res.status, headers })
}

export const POST = handle
export const GET = handle
export const DELETE = handle
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })
