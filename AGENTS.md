# AGENTS.md

## Project Summary
- Next.js 16 App Router app that aggregates latest YouTube videos from configured channels.
- Data is stored in MongoDB and refreshed through authenticated API routes.
- Frontpage (`/`) renders latest videos and supports a client-side shorts filter.

## Stack
- Node.js `>=22` (`package.json` engines)
- Next.js `16.1.6` + React `19.2.x`
- TypeScript (strict), Zod for runtime validation
- MongoDB (`mongodb` driver)
- TailwindCSS + daisyUI
- Playwright for end-to-end tests

## Environment Variables
Required in `.env.local`:
- `MONGODB_URI`
- `YOUTUBE_API_KEY`
- `SECRET`

Optional:
- `CRON_SECRET` (accepted for Vercel cron auth)

Validation is centralized in `src/utils/server-env.ts` using Zod. Access env values via `SERVER_ENV` (do not read `process.env.*` directly in feature code).

## Common Commands
- Install deps: `npm install`
- Dev server: `npm run dev`
- Alternative dev: `npm run watch`
- Build: `npm run build`
- Start production server: `npm run start`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- E2E tests: `npm run playwright`

## Codebase Map
- `src/app/`: App Router pages, server actions, route handlers
- `src/app/api/*/route.ts`: authenticated operational APIs
- `src/clients/youtube/`: YouTube Data API calls + response schemas
- `src/clients/mongodb/`: DB client implementation + cache invalidation hooks
- `src/models/`: Zod domain models (`Channel`, `Video`)
- `src/schemas/`: interface schemas (e.g., `DbClient` contract)
- `src/utils/`: auth helper and validated server env
- `tests/`: Playwright tests for page and API behavior

## API and Auth Conventions
- Protected routes call `isApiRequestAuthenticated(request)`.
- Accepted auth patterns:
  - `Authorization: <SECRET>`
  - `Authorization: Bearer <CRON_SECRET>` (if configured)
  - `?token=<SECRET>` query param
- Most API routes export `revalidate = 0` and call `revalidatePath('/')` after writes.
- Keep failure responses explicit (`401`, `400`, `404`, `500`) with JSON bodies.

## Data + Caching Conventions
- Create DB clients through `createMongoDbClient({ connectionString: SERVER_ENV.MONGODB_URI })`.
- Always `close()` DB clients in `finally`.
- Frontpage server action (`src/app/actions.ts`) wraps work in cached function and returns typed result.
- Video list caching currently uses:
  - Next route/page revalidation settings
  - `unstable_cache` + `revalidateTag` in MongoDB client
- Preserve existing invalidation behavior when changing write paths.

## Type Safety and Validation Rules
- Use Zod schemas for external/untrusted inputs:
  - request query/body parsing
  - external API responses (YouTube)
  - env variables
- Keep `z.function(...).implementAsync(...)` pattern where already used.
- Prefer `safeParse` for request validation and return 4xx errors instead of throwing.

## Frontend Conventions
- Default to server components; mark client components with `'use client'` only when needed.
- Existing UI patterns use Tailwind utility classes with lightweight memoization.
- For query string state on client, use `src/hooks/use-search-params.ts`.

## Testing Notes
- `npm run playwright` starts `npm run start` from Playwright config.
- Tests require working env vars and external network access to YouTube API.
- Current tests are integration-style and may be sensitive to external API changes/rate limits.

## Change Checklist for Agents
- Run `npm run lint` and `npm run typecheck` after code edits.
- Run `npm run playwright` when changing route handlers, auth logic, or data flow.
- Do not log or expose secrets.
- Keep API auth checks intact for operational routes.
- Maintain existing response shapes unless intentionally versioning a contract.
