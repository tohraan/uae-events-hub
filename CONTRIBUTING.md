# Contributing

## Add an event source

1. Create `src/lib/sources/<name>.ts` exporting a `SourceAdapter` (see `src/lib/sources/index.ts`):
   - `fetch()` returns `RawEvent[]` (`src/types/index.ts`).
   - Set only fields the source really published. Never default a price, organizer or time.
   - If only a date is known, set `startTimeKnown: false` and use Dubai midnight.
   - Throw when the page is unreachable or its structure changed. Do not return `[]` for a failure.
   - Filter with `isTargetEvent` and restrict to UAE.
2. Export the parsing step as a pure function (`parseX(data)`) and add a test in `tests/sources.test.ts`.
3. Append the adapter to `ADAPTERS` in `src/lib/sources/index.ts`.
4. `npm run scrape <name>` to try it live, then `npm test && npm run typecheck`.

## Conventions

- All API output goes through `serializeEvent` and `queryEvents` in `src/lib/events.ts`, so REST, text, calendar and MCP stay consistent.
- This repo uses Next.js 16 (App Router). Read `node_modules/next/dist/docs/` before relying on older APIs.
