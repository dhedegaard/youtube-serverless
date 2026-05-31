# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # dev server (Turbopack) at http://localhost:3000
npm run build       # production build (required before `npm run playwright`)
npm run start       # serve the production build
npm run typecheck   # tsc --noemit
npm run lint        # eslint .
npm run playwright  # run the Playwright test suite
```

Single test: `npx playwright test tests/playlist-items.spec.ts` (by file) or
`npx playwright test -g "drops a deleted video"` (by title).

Notes that bite if missed:
- **There is no `npm test` script.** CI runs `npm run test --if-present`, which is a
  no-op — the test suite is effectively local-only. Run `npm run playwright` manually.
- Playwright's `webServer` is `npm run start`, so **a production build must exist first**
  (`npm run build`). It does not use the dev server.
- The `tests/api.spec.ts` and `tests/frontpage.spec.ts` suites hit the **live YouTube Data
  API and the real MongoDB**, and `/api/fetch-data` / `/api/refresh-channels` **mutate the
  database**. They require real env vars present. `tests/playlist-items.spec.ts` is a pure
  unit test (no network/env) and is the model for testing logic in isolation.
- Node >= 24, ESM (`"type": "module"`). TypeScript is `@tsconfig/strictest` and ESLint is
  `strictTypeChecked` — expect `noUncheckedIndexedAccess`, so index/env access uses bracket
  notation (`process.env['X']`, `styles['title']`).

## Environment

`SERVER_ENV` (`src/utils/server-env.ts`) parses env via zod **at module import time**, so the
app and most route modules fail to load if any are missing. Set them in `.envrc` (direnv):
`MONGODB_URI`, `YOUTUBE_API_KEY`, `SECRET` (and optionally `CRON_SECRET`). Never import
`server-env` into code meant to be unit-tested without env.

## Architecture

A YouTube subscription replacement: it tracks a set of channels, periodically pulls their
latest uploads into MongoDB, and renders them as a grid. The frontend never calls YouTube
directly — it only reads pre-computed videos from the DB.

**Data flow:** `POST /api/fetch-data` (intended to run on a schedule — see Vercel Cron and the
`CRON_SECRET` note in `src/utils/api-helpers.ts`) is the heavy refresh job. Per channel it:
lists the uploads playlist (`getVideosForChannelId`), fetches durations/live status
(`getContentDetailsForVideos`), classifies shorts, sorts newest-first, keeps the latest ~120,
and writes them. The homepage server component reads that stored set. The YouTube client lives
in `src/clients/youtube/`; the Mongo client + all DB access in `src/clients/mongodb/`.

**MongoDB shape (`youtube-serverless` db):** two collections. `channels` holds one document per
tracked channel. `videos` holds a **single document** with a `videos` array — written with
`updateOne({}, …, { upsert: true })` and read with `findOne()`. Stored videos may predate the
shorts fields, so `normalizeStoredVideo` backfills `isShort`/`shortDetectionMethod` on read.

**Shorts detection (`src/utils/youtube-shorts.ts`):** `classifyShortVideo` prefers the
authoritative signal — `isVideoServedAsShort` does a `HEAD` on `youtube.com/shorts/<id>` and
inspects the redirect — and falls back to duration (≤ 3 min) when that's inconclusive. The
result is persisted with the method used (`youtube-shorts-url` | `duration` | `unknown`).

**Frontend:** App Router, React 19 with the **React Compiler enabled** (`reactCompiler: true` —
do not hand-add `useMemo`/`useCallback` purely for perf). The page (`src/app/page.tsx`) is a
server component pulling the latest 60 via the `getVideos` server action. Shorts are hidden by
default and the "Show shorts" toggle is **purely client-side** (`?showShorts=1`), driven through
`window.history` and kept in sync with Next's `useSearchParams` (`src/hooks/use-search-params.ts`).
Because filtering happens client-side over the already-fetched set, the visible long-video count
varies with how many of the latest videos are shorts. Styling is Tailwind v4 + daisyUI.

**Caching (layered, invalidated explicitly):** page `revalidate = 3600`; the `getVideos` action
is wrapped in React `cache`; `getLatestVideos` is wrapped in `unstable_cache` (tag
`latest-videos`, 1h revalidate). Writes invalidate via `revalidateTag('latest-videos')`
(`putLatestVideos`) and `revalidatePath('/')` (the routes).

**API routes** (all under `src/app/api/`, all gated by `isApiRequestAuthenticated`, which accepts
`Authorization: Bearer <CRON_SECRET>`, `Authorization: <SECRET>`, or `?token=<SECRET>`):
`fetch-data` (refresh videos), `refresh-channels` (refresh channel metadata), `add-channel`
(add one by `channelId`/`username`; persists only with `?store=true`), `load-channels` (bulk
import via body), `dump-channels` (GET export).

## Conventions

- **zod is the validation layer everywhere**, including runtime-validated function signatures via
  `z.function({...}).implementAsync(...)`. When an `interface X extends z.infer<typeof schema>` is
  used as an array/element type, the codebase casts `schema as z.ZodType<X, X>` — this is
  intentional and repository-wide; keep it for consistency. Parsing uniformly uses `parseAsync`.
- Keep network/`fetch` and `SERVER_ENV` access out of pure logic so it stays unit-testable — see
  `src/clients/youtube/playlist-items.ts` (pure parse + filter) vs `index.ts` (does the fetch).
- When handling YouTube playlist data, remember deleted/private videos stay in the uploads
  playlist with degraded fields (empty thumbnails, no `videoPublishedAt`); they're dropped by
  whitelisting `public`/`unlisted` `privacyStatus` rather than blacklisting bad values.
