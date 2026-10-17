# Notes for AI coding agents

- Read `CONTRIBUTING.md` first. Commands: `npm test`, `npm run typecheck`, `npm run build`, `npm run scrape [source]`.
- Next.js 16: check `node_modules/next/dist/docs/` before using framework APIs from memory.
- Query logic lives in `src/lib/events.ts`; every API surface (REST, `.txt`, `.ics`, MCP in `src/lib/mcp/server.ts`) must use it.
- Data honesty rule: never invent event fields. Unknown means `null`.
- Free-text search is done in memory (`matchesText`) on purpose: SQL `LIKE` matches "ai" inside "Dubai".
- `/api/scrape` is guarded by `ADMIN_API_KEY` and fails closed in production.
- Do not push or deploy without being asked.
