# Notes for AI coding agents

- Read `CONTRIBUTING.md` first. Commands: `npm test`, `npm run typecheck`, `npm run build`, `npm run scrape [source]`.
- Next.js 16: check `node_modules/next/dist/docs/` before using framework APIs from memory.
- Query logic lives in `src/lib/events.ts`; every API surface (REST, `.txt`, `.ics`, MCP in `src/lib/mcp/server.ts`) must use it.
- Data honesty rule: never invent event fields. Unknown means `null`.
- Free-text search is done in memory (`matchesText`) on purpose: SQL `LIKE` matches "ai" inside "Dubai".
- `/api/scrape` is guarded by `ADMIN_API_KEY` and fails closed in production.
- Do not push or deploy without being asked.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
